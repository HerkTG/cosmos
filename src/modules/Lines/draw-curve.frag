precision lowp float;

uniform float widthMultiplier;
uniform mat3 transform;
uniform float time;
uniform bool useArrow;

varying vec4 rgbaColor;
varying vec2 pos;
varying float radius, linkWidth;
varying vec2 sourceVec, targetVec;

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main() {
  vec3 color = rgbaColor.rgb;

  float r = 0.0;
  vec2 zeroVector = vec2(pos.x, pos.y + 0.5);
  vec2 cxy = 2.0 * zeroVector - 1.0;

  r = dot(cxy, cxy);
  float delta = 2.0 / (radius * transform[0][0]);
  float width = linkWidth * delta;
  float o = 1.0 - smoothstep(1.0 - delta, 1.0, r);
  o *= smoothstep(1.0 - (width + 2.0 * delta), 1.0 - (width + delta), r);

  vec2 centerVector = vec2(0.5, 0.5);
  vec2 s = sourceVec - centerVector;
  vec2 t = targetVec - centerVector;
  vec2 xy = zeroVector - centerVector;
  // Pseudo-scalar product
  if ((s.x * xy.y - xy.x * s.y) < 0.0) o *= 0.0;
  if ((t.x * xy.y - xy.x * t.y) > 0.0) o *= 0.0;

  gl_FragColor = vec4(color, rgbaColor.a * o);
}