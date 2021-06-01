precision highp float;
attribute vec2 position, pointA, pointB;
attribute vec4 color;
attribute float width;
uniform sampler2D positions;
uniform sampler2D particleSize;
uniform mat3 transform;
uniform float pointsTextureSize;
uniform float minWidth;
uniform float maxWidth;
uniform float widthMultiplier;
uniform float nodeSizeMultiplier;
uniform float clickedId;
uniform vec4 backgroundColor;
uniform bool useArrow;
uniform float spaceSize;
uniform vec2 screenSize;
uniform float ratio;

varying float opacity;
varying vec4 rgbaColor;
varying vec2 pos;
varying float dist;
varying float targetPointSize;

const float thinnestLinkMinDist = 20.0;
const float thickestLinkMaxDist = 20000.0;

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

float pointSize(float size) {
  return size * ratio * min(5.0, max(1.0, transform[0][0] * 0.01));
}

void main() {
  pos = position;
  // Target particle size
  targetPointSize = pointSize(texture2D(particleSize, (pointB + 0.5) / pointsTextureSize).r * nodeSizeMultiplier);
  // Position
  vec4 pointPositionA = texture2D(positions, (pointA + 0.5) / pointsTextureSize);
  vec4 pointPositionB = texture2D(positions, (pointB + 0.5) / pointsTextureSize);
  vec2 a = pointPositionA.xy;
  vec2 b = pointPositionB.xy;
  vec2 xBasis = b - a;
  vec2 yBasis = normalize(vec2(-xBasis.y, xBasis.x));

  // Calculate link distance
  vec2 distVector = a - b;
  dist = sqrt(dot(distVector, distVector)); //* max(1.0, sqrt(transform[0][0] * 0.1));
  // float dist = sqrt(dot(distVector, distVector));
  // float transformDist = dist * max(1.0, sqrt(transform[0][0] * 0.1));
  // float linkWidth = 1.6 * size / transform[0][0];
  float linkWidth = width / transform[0][0];
  if (useArrow) linkWidth += linkWidth * 0.5;
  linkWidth *= widthMultiplier;
  // linkWidth = map(dist, thickestLinkMaxDist, thinnestLinkMinDist, minWidth, maxWidth);
  // linkWidth = min(maxWidth, linkWidth);
  // linkWidth = max(minWidth, linkWidth);
  // linkWidth = linkWidth / transform[0][0];


  // Color
  vec3 rgbColor = color.rgb;
  opacity = color.a * max(0.05, map(dist * transform[0][0], thickestLinkMaxDist, thinnestLinkMinDist, 0.0, 1.0));
  // if (color.r == 80.0 / 255.0) opacity = 0.05;
  // opacity = min(0.4, map(transformDist, thickestLinkMaxDist, thinnestLinkMinDist, 0.1, 0.3) * sqrt(transform[0][0] * 0.05));
  if (clickedId > -1.0) {
    opacity = color.a * 0.1;
    
    // opacity = 0.05;
    if (clickedId == (pointsTextureSize * pointA.g + pointA.r) || clickedId == (pointsTextureSize * pointB.g + pointB.r)) {
      opacity = color.a * 0.8;
      // opacity = 0.6;
    } else {
      rgbColor = mix(rgbColor, backgroundColor.rgb, 0.7);
    }
  }
  rgbaColor = vec4(rgbColor, opacity);
  // vec4 fillAndSizeA = texture2D(fillAndSize, (pointA + 0.5) / nMatrix);
  // rgbaColor = vec4(fillAndSizeA.rgb, opacity);
  

  vec2 point = a + xBasis * position.x + yBasis * linkWidth * position.y;
  vec2 p = 2.0 * point / spaceSize - 1.0;
  p *= spaceSize / screenSize;
  vec3 final =  transform * vec3(p, 1);
  gl_Position = vec4(final.rg, 0, 1);
}