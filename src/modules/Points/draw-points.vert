#ifdef GL_ES
precision highp float;
#endif

attribute vec2 indexes;

uniform sampler2D positions;
uniform sampler2D particleColor;
uniform sampler2D particleSize;
uniform sampler2D selectedPoints;
uniform sampler2D highlightedPoints;
uniform float clickedPointId;
uniform float ratio;
uniform mat3 transform;
uniform float pointsTextureSize;
uniform float sizeMultiplier;
uniform float particleStatus; // 0 - default, 1 - dimmed, 2 - highlighted
uniform vec4 backgroundColor;
uniform float spaceSize;
uniform vec2 screenSize;

varying vec2 index;
varying vec3 rgbColor;
varying float alpha;

float pointSize(float size) {
  return size * ratio * min(5.0, max(1.0, transform[0][0] * 0.01));
}

void main() {  
  index = indexes;
  // Position
  vec4 pointPosition = texture2D(positions, (index + 0.5) / pointsTextureSize);
  vec2 point = pointPosition.rg;
  vec2 p = 2.0 * point / spaceSize - 1.0;
  p *= spaceSize / screenSize;
  vec3 final = transform * vec3(p, 1);
  gl_Position = vec4(final.rg, 0, 1);

  // Size
  vec4 pSize = texture2D(particleSize, (index + 0.5) / pointsTextureSize);
  float size = pSize.r * sizeMultiplier;

  // Color
  vec4 pColor = texture2D(particleColor, (index + 0.5) / pointsTextureSize);
  rgbColor = pColor.rgb;
  gl_PointSize = pointSize(size);
  alpha = 0.0;

  // Highlighted points
  vec4 highlighted = texture2D(highlightedPoints, (index + 0.5) / pointsTextureSize);
  if (particleStatus == 0.0) { // - default
    alpha = 1.0;
  } else if (particleStatus == 1.0 && highlighted.r == 0.0) { // - dimmed, not highlighted
    alpha = 0.8;
    rgbColor = mix(rgbColor, backgroundColor.rgb, 0.7);
  } else if (particleStatus == 2.0 && highlighted.r == 1.0) { // - highlighted
    alpha = 1.0;
  }

  // Selected points
  vec4 selected = texture2D(selectedPoints, (index + 0.5) / pointsTextureSize);
  if (selected.x > 0.0 && clickedPointId == -1.0) {
    alpha = 1.0;
    rgbColor = pColor.rgb;
  }

  // Clicked
  if (clickedPointId > -1.0 && clickedPointId == (pointsTextureSize * index.g + index.r)) {
    alpha = 1.0;
    gl_PointSize *= 1.4;
    gl_PointSize += 4.0;
  }

}
