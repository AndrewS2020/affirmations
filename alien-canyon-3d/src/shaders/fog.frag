uniform vec3 uFogColor;
uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform float uTime;
uniform float uFogBaseHeight;
uniform float uFogFalloff;
uniform float uFogDensity;

varying vec3 vWorldPosition;
varying vec3 vViewPosition;

// 3D Noise for volumetric valley fog
float hash3(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
}

float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    return mix(
        mix(mix(hash3(i + vec3(0,0,0)), hash3(i + vec3(1,0,0)), f.x),
            mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x),
            mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z
    );
}

float fbm3D(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
        v += a * noise3D(p);
        p = p * 2.05 + vec3(1.3, 0.7, 1.8);
        a *= 0.5;
    }
    return v;
}

void main() {
    // Height-based density falloff: heavy in valley, dissipates upwards
    float heightAboveValley = max(0.0, vWorldPosition.y - uFogBaseHeight);
    float heightFactor = exp(-heightAboveValley * uFogFalloff);

    // Wind animation
    vec3 windOffset = vec3(uTime * 15.0, 0.0, uTime * 6.0);
    vec3 samplePos = (vWorldPosition + windOffset) * 0.003;

    // Temporal 3D FBM density modulation
    float noiseDensity = fbm3D(samplePos);
    noiseDensity = smoothstep(0.15, 0.85, noiseDensity);

    float alpha = heightFactor * noiseDensity * uFogDensity;

    // Sun forward-scattering glow inside the mist
    vec3 viewDir = normalize(vViewPosition);
    vec3 sunDir = normalize(uSunDirection);
    float cosTheta = max(0.0, dot(-viewDir, sunDir));
    float sunScattering = pow(cosTheta, 6.0) * 0.45;

    vec3 finalColor = mix(uFogColor, uSunColor, sunScattering);

    // Soft camera distance fade
    float dist = length(vWorldPosition - cameraPosition);
    float cameraNearFade = smoothstep(5.0, 40.0, dist);

    gl_FragColor = vec4(finalColor, alpha * cameraNearFade);
}
