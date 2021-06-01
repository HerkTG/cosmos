precision highp float;

uniform float widthMultiplier;
uniform mat3 transform;
uniform float time;
uniform bool useArrow;

varying vec4 rgbaColor;
varying vec2 pos;
varying float dist;
varying float targetPointSize;
uniform float ratio;
uniform float spaceSize;
uniform vec2 screenSize;

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

float pointSize(float size) {
  return size * ratio * min(5.0, max(1.0, transform[0][0] * 0.01));
}

void main() {
  float opacity = rgbaColor.a;

  // vec3 linkColor = rgbaColor.rgb; //link color
  // vec3 middleColor = vec3(1.0); // white
  // float h = time;
  // float delta = 0.4;
  // float d = h - delta;
  // float t = (1.0 - delta) - h;
  // float c1 = (d - pos.x) / (d - h);
  // float c2 = (1.0 - (pos.x + t)) / (1.0 - (h + t));
  // vec3 color = mix(mix(linkColor, middleColor, c1), mix(linkColor, middleColor, c2), step(h, pos.x));
  // if (pos.x < d || pos.x > 1.0 - t) col = linkColor;
  vec3 color = rgbaColor.rgb;

  if (useArrow) {
    float dist_arrow = min(0.1, pointSize(60.0) / (dist * transform[0][0]));
    float end_arrow = 1.0 - (targetPointSize / (2.0 * ratio)) / (dist * transform[0][0]);
    float start_arrow = end_arrow - dist_arrow;
    if (pos.x > start_arrow) {
      float xmapped = map(pos.x, start_arrow, end_arrow, 0.0, 1.0);
      if (pos.y < 0.0) {
        opacity = step(xmapped, map(pos.y, -0.5, 0.0, 0.0, 1.0));
      } else {
        opacity = step(xmapped, map(pos.y, 0.5, 0.0, 0.0, 1.0));
      }
    } else {
      if (pos.y < 0.0) {
        opacity = step(-0.25, pos.y);
      } else if (pos.y > 0.0) {
        opacity = step(pos.y, 0.25);
      } else {
        opacity = 1.0;
      }
    }
  }

  gl_FragColor = vec4(color, opacity * rgbaColor.a);
}