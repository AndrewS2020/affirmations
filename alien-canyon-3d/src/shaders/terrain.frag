uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uAmbientColor;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uTime;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vSlope;
varying float vElevation;

// Fast procedural noise for rock striations and erosion
float hash(vec2 p) {
    p = 50.0 * fract(p * 0.3183099 + vec2(0.71, 0.113));
    return -1.0 + 2.0 * fract(16.0 * fract(p.x * p.y * (p.x + p.y)));
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), 
                   hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), 
                   hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = m * p;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uSunDirection);

    // Geological layers: rock strata along Y
    float strata = sin(vWorldPosition.y * 0.04 + fbm(vWorldPosition.xz * 0.005) * 4.0) * 0.5 + 0.5;

    // Palette matching reference image:
    // Sandstone valley: #8C7355
    vec3 valleySand = vec3(0.55, 0.45, 0.33);
    // Dark cliff rock: #3E352F
    vec3 cliffRock = mix(vec3(0.24, 0.21, 0.18), vec3(0.38, 0.32, 0.26), strata);
    // Road / sediment: #C7B093
    vec3 trailDust = vec3(0.72, 0.63, 0.52);
    // High mountain peaks: #4D5C6C (slate-blue)
    vec3 highPeak = vec3(0.32, 0.38, 0.45);

    // Slope blending: steep slopes are cliff rock, flat areas are valley sand
    float slopeFactor = smoothstep(0.25, 0.65, vSlope);
    vec3 albedo = mix(valleySand, cliffRock, slopeFactor);

    // High elevation transition
    float elevationFactor = smoothstep(400.0, 1800.0, vElevation);
    albedo = mix(albedo, highPeak, elevationFactor * 0.7);

    // Micro surface detail
    float detailNoise = fbm(vWorldPosition.xz * 0.04) * 0.15;
    albedo += detailNoise * (1.0 - slopeFactor);

    // Lighting calculation
    float NdotL = max(dot(N, L), 0.0);
    vec3 diffuse = NdotL * uSunColor;
    vec3 ambient = uAmbientColor;

    // Backscatter / warm rim light on cliff edges
    float rim = pow(1.0 - max(dot(N, vec3(0.0, 1.0, 0.0)), 0.0), 3.0) * NdotL * 0.3;
    vec3 color = albedo * (diffuse + ambient) + rim * uSunColor;

    // Distance exponential fog
    float dist = length(vWorldPosition - cameraPosition);
    float fogFactor = 1.0 - exp(-dist * uFogDensity);
    color = mix(color, uFogColor, fogFactor);

    gl_FragColor = vec4(color, 1.0);
}
