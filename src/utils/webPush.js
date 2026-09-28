// Web Push Client Utilities

const BASE_URL = import.meta.env.BASE_URL || '/';
const API_BASE = BASE_URL.endsWith('/') ? `${BASE_URL}api` : `${BASE_URL}/api`;
const SW_PATH = `${BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`}sw.js`;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker is not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: BASE_URL
    });
    console.log('✅ Service Worker registered with scope:', registration.scope);
    return registration;
  } catch (err) {
    console.error('Service Worker registration failed:', err);
    return null;
  }
}

export async function getPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.error('Error getting push subscription:', err);
    return null;
  }
}

export async function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push-уведомления не поддерживаются вашим устройством/браузером');
  }

  // Request Notification permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Разрешение на уведомления отклонено пользователем');
  }

  const registration = await navigator.serviceWorker.ready;

  // Fetch VAPID public key from backend
  const response = await fetch(`${API_BASE}/vapid-public-key`);
  if (!response.ok) {
    throw new Error('Не удалось получить ключ сервера');
  }
  const { publicKey } = await response.json();

  const convertedKey = urlBase64ToUint8Array(publicKey);

  // Subscribe with PushManager
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey
    });
  }

  // Detect device info
  const userAgent = navigator.userAgent;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
  const deviceName = isMobile 
    ? (/iPhone|iPad|iPod/i.test(userAgent) ? 'Apple iOS PWA' : 'Android Mobile PWA')
    : 'Desktop Browser';

  // Send subscription to server
  const subResponse = await fetch(`${API_BASE}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription,
      device: `${deviceName} (${navigator.language})`
    })
  });

  if (!subResponse.ok) {
    throw new Error('Не удалось зарегистрировать подписку на сервере');
  }

  return subscription;
}

export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await fetch(`${API_BASE}/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
      await subscription.unsubscribe();
    }
    return true;
  } catch (err) {
    console.error('Error unsubscribing:', err);
    return false;
  }
}

export async function sendTestPush(affirmation = null) {
  try {
    const payload = affirmation
      ? {
          title: `✨ ${affirmation.category || 'Аффирмация'}`,
          text: affirmation.text,
          affirmationId: affirmation.id
        }
      : {
          title: '✨ Тестовая аффирмация',
          text: 'Ты полон гармонии и уверенности в каждом своём шаге.'
        };

    const res = await fetch(`${API_BASE}/test-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      // Local fallback
      if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification(payload.title, {
          body: payload.text,
          icon: `${BASE_URL}icons/icon.svg`,
          badge: `${BASE_URL}icons/icon.svg`,
          vibrate: [200, 100, 200]
        });
        return { success: true, message: 'Локальное уведомление показано' };
      }
      throw new Error('Ошибка сервера');
    }

    return await res.json();
  } catch (err) {
    // Local fallback
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification('✨ Аффирмация дня', {
        body: affirmation ? affirmation.text : 'Ты справишься со всем задуманным!',
        icon: `${BASE_URL}icons/icon.svg`,
        vibrate: [200, 100, 200]
      });
      return { success: true, message: 'Локальное push-уведомление вызвано' };
    }
    throw err;
  }
}
