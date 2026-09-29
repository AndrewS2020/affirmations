varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vSlope;
varying float vElevation;

void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vElevation = worldPos.y;

    vNormal = normalize(normalMatrix * normal);
    vSlope = 1.0 - abs(dot(vNormal, vec3(0.0, 1.0, 0.0)));

    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
