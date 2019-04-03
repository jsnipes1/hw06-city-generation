#version 300 es
precision highp float;

// The fragment shader used to render the background of the scene
// Modify this to make your background more interesting

uniform float u_Daytime;
uniform float u_Time;
in vec4 fs_Pos;
out vec4 out_Col;

float hash3D(vec3 x) {
	float i = dot(x, vec3(123.4031, 46.5244876, 91.106168));
	return fract(sin(i * 7.13) * 268573.103291);
}

// 3D noise
float noise(vec3 p) {
  vec3 bCorner = floor(p);
  vec3 inCell = fract(p);

  float bLL = hash3D(bCorner);
  float bUL = hash3D(bCorner + vec3(0.0, 0.0, 1.0));
  float bLR = hash3D(bCorner + vec3(0.0, 1.0, 0.0));
  float bUR = hash3D(bCorner + vec3(0.0, 1.0, 1.0));
  float b0 = mix(bLL, bUL, inCell.z);
  float b1 = mix(bLR, bUR, inCell.z);
  float b = mix(b0, b1, inCell.y);

  vec3 fCorner = bCorner + vec3(1.0, 0.0, 0.0);
  float fLL = hash3D(fCorner);
  float fUL = hash3D(fCorner + vec3(0.0, 0.0, 1.0));
  float fLR = hash3D(fCorner + vec3(0.0, 1.0, 0.0));
  float fUR = hash3D(fCorner + vec3(0.0, 1.0, 1.0));
  float f0 = mix(fLL, fUL, inCell.z);
  float f1 = mix(fLR, fUR, inCell.z);
  float f = mix(f0, f1, inCell.y);

  return mix(b, f, inCell.x);
}

// 5-octave FBM
float fbm(vec3 q) {
  float acc = 0.0;
  float freqScale = 2.0;
  float invScale = 1.0 / freqScale;
  float freq = 1.0;
  float amp = 1.0;

  for (int i = 0; i < 5; ++i) {
    freq *= freqScale;
    amp *= invScale;
    acc += noise(q * freq) * amp;
  }
  return acc;
}

vec3 palette(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

float pattern(in vec3 p) {
  vec3 q = vec3(fbm(p + vec3(0.0)),
                fbm(p + vec3(5.2, 1.3, 2.8)),
                fbm(p + vec3(1.2, 3.4, 1.2)));

  return fbm(p + 4.0 * q);
}

void main() {
  out_Col = vec4(164.0 / 255.0, 233.0 / 255.0, 1.0, 1.0);
  vec3 a = vec3(0.368, 0.748, 0.158);
  vec3 b = vec3(0.358, 1.09, 0.428);
  vec3 c = vec3(1.077, 0.36, 0.048);
  vec3 d = vec3(0.965, 2.265, 0.848);
  out_Col = mix(vec4(palette(u_Daytime / 23.0, a, b, c, d), 1.0), vec4(palette((u_Daytime + 2.0) / 25.0, a, b, c, d), 1.0), fs_Pos.y);
  out_Col = vec4(palette(pattern(fs_Pos.zyx), a, b, a, c), 1.0);
}
