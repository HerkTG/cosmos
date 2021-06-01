#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D position;
uniform float pointsTextureSize;
uniform float spaceSize;

attribute vec2 indexes;

varying vec4 color;

void main() {
  // Color
  vec4 pointPosition = texture2D(position, indexes / pointsTextureSize);
  color = vec4(pointPosition.rg, 1.0, 1.0);
  
  vec2 pos = 2.0 * pointPosition.rg / spaceSize - 1.0;
  gl_Position = vec4(pos, 0.0, 1.0);

  gl_PointSize = 1.0;
}
