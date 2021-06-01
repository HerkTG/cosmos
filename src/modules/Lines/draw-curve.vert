precision lowp float;
attribute vec2 position, pointA, pointB;
attribute vec4 color;
attribute float width;
uniform sampler2D positions;
uniform sampler2D particleSize;
uniform mat3 transform;
uniform float pointsTextureSize;
uniform float widthMultiplier;
uniform float clickedId;
uniform vec4 backgroundColor;
uniform float spaceSize;
uniform vec2 screenSize;
uniform float nodeSizeMultiplier;

varying vec4 rgbaColor;
varying vec2 pos;
varying float radius, linkWidth;
varying vec2 sourceVec, targetVec;

const float thinnestLinkMinDist = 20.0;
const float thickestLinkMaxDist = 20000.0;

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

float pointSize(float size) {
  return size * min(5.0, max(1.0, transform[0][0] * 0.01));
}

void main() {
  pos = position;
  // Position
  vec4 pointASample = texture2D(positions, (pointA + 0.5) / pointsTextureSize);
  vec4 pointBSample = texture2D(positions, (pointB + 0.5) / pointsTextureSize);

  vec2 source = screenSize * pointASample.xy / spaceSize;
  vec2 target = screenSize * pointBSample.xy / spaceSize;

  float dist = distance(source.xy, target.xy);
  float r = dist;
  vec2 centerPoint = vec2(0.5) * mat2(source.x, target.x, source.y, target.y);

  // Move
  vec2 targetMoved = target.xy - centerPoint.xy;

  // Rotate
  float sinTheta = targetMoved.y / (dist / 2.0);
  float cosTheta = targetMoved.x / (dist / 2.0);
  vec2 h;
  h.x = 0.0;
  h.y = sqrt(r * r - dist * dist / 4.0);

  vec2 rotated = mat2(cosTheta, sinTheta, -1.0 * sinTheta, cosTheta) * h.xy;

  // Move back
  vec2 moved = rotated + centerPoint;

  vec2 pc = moved.xy;
  sourceVec = (source.xy - vec2(pc.x - r, pc.y - r)) / (2.0 * r); 
  targetVec = (target.xy - vec2(pc.x - r, pc.y - r)) / (2.0 * r);

  // float sourcePointSize = texture2D(particleSize, (pointA + 0.5) / nMatrix).r * nodeSizeMultiplier;
  // float targetPointSize = texture2D(particleSize, (pointB + 0.5) / nMatrix).r * nodeSizeMultiplier;
  radius = r;
  vec2 a = vec2(pc.x - radius, pc.y);
  vec2 b = vec2(pc.x + radius, pc.y);
  vec2 xBasis = b - a;
  vec2 yBasis = normalize(vec2(-xBasis.y, xBasis.x));

  linkWidth = widthMultiplier;

  // Color
  vec3 rgbColor = color.rgb;
  float opacity = color.a * max(0.05, map(dist * transform[0][0], thickestLinkMaxDist, thinnestLinkMinDist, 0.0, 1.0));

  if (clickedId > -1.0) {
    opacity = color.a * 0.1;    
    if (clickedId == (pointsTextureSize * pointA.g + pointA.r) || clickedId == (pointsTextureSize * pointB.g + pointB.r)) {
      opacity = color.a * 0.8;
    } else {
      rgbColor = mix(rgbColor, backgroundColor.rgb, 0.7);
    }
  }
  rgbaColor = vec4(rgbColor, opacity);

  vec2 point = a + xBasis * position.x + yBasis * radius * 2.0 * position.y;
  point = point * spaceSize / screenSize;
  vec2 p = 2.0 * point / spaceSize - 1.0;
  p *= spaceSize / screenSize;
  vec3 final = transform * vec3(p, 1);
  gl_Position = vec4(final.rg, 0, 1);
}