uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uSkyTopColor;
uniform vec3 uSkyHorizonColor;
uniform float uTime;

varying vec3 vWorldPosition;
varying vec3 vNormal;

// 2D & 3D cellular / Worley noise
float hash2(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float worley2D(vec2 p) {
    vec2 n = floor(p);
    vec2 f = fract(p);
    float minDist = 1.0;
    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = vec2(hash2(n + g), hash2(n + g + vec2(11.0, 7.0)));
            vec2 delta = g + o - f;
            minDist = min(minDist, length(delta));
        }
    }
    return minDist;
}

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbmClouds(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p = rot * p;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec3 dir = normalize(vWorldPosition - cameraPosition);

    // Sky gradient background
    float elevation = max(0.0, dir.y);
    vec3 skyBase = mix(uSkyHorizonColor, uSkyTopColor, pow(elevation, 0.55));

    // Multiple moving cloud layers
    vec2 uv1 = (vWorldPosition.xz + vec2(uTime * 4.0, uTime * 2.0)) * 0.00015;
    vec2 uv2 = (vWorldPosition.xz + vec2(-uTime * 2.5, uTime * 3.5)) * 0.00035;

    float fbm1 = fbmClouds(uv1);
    float fbm2 = fbmClouds(uv2);
    float worley = 1.0 - worley2D(uv1 * 3.0);

    // Storm cloud shape combination
    float cloudDensity = smoothstep(0.35, 0.85, (fbm1 * 0.6 + fbm2 * 0.4) * (0.7 + worley * 0.3));

    // Sun illumination through storm clouds
    vec3 L = normalize(uSunDirection);
    float sunDiff = max(0.0, dot(dir, L));
    vec3 cloudShadow = mix(vec3(0.18, 0.22, 0.27), vec3(0.28, 0.33, 0.40), elevation);
    vec3 cloudLit = mix(cloudShadow, uSunColor, pow(sunDiff, 4.0) * 0.7);

    vec3 cloudColor = mix(cloudShadow, cloudLit, fbm1 * 0.5 + 0.5);

    // Silver lining around cloud edges
    float edge = smoothstep(0.35, 0.48, cloudDensity) * (1.0 - smoothstep(0.48, 0.75, cloudDensity));
    cloudColor += edge * uSunColor * pow(sunDiff, 2.0) * 0.5;

    // Blend clouds with sky
    vec3 finalColor = mix(skyBase, cloudColor, cloudDensity * smoothstep(0.05, 0.25, elevation));

    gl_FragColor = vec4(finalColor, 1.0);
}
