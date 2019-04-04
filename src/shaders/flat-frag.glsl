#version 300 es
precision highp float;

// The fragment shader used to render the background of the scene
// Modify this to make your background more interesting

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

// Multi-octave FBM
float fbm(vec3 q) {
  float acc = 0.0;
  float freqScale = 2.0;
  float invScale = 1.0 / freqScale;
  float freq = 1.0;
  float amp = 1.0;

  for (int i = 0; i < 4; ++i) {
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
  vec3 a = vec3(1.008, 0.798, 1.918);
  vec3 b = vec3(0.5);
  vec3 c = vec3(0.748, 1.068, 0.318);
  vec3 d = vec3(-0.802, 1.438, 0.848);

  vec3 storm = palette(pattern(fs_Pos.xyz + vec3(0.0007 * u_Time + cos(0.0005 * u_Time), 0.00002 * u_Time, 0.0002 * u_Time)) - fbm(vec3(pattern(vec3(0.001 * u_Time)))), a, b, c, d);
  float lum = 0.2126 * storm.x + 0.7152 * storm.y + 0.0722 * storm.z; // Grayscale luminance
  lum = 1.0 - lum;
  lum += 0.15;

  if (lum > 0.8) {
    lum -= 0.05;
  }

  out_Col = vec4(vec3(lum), 1.0);
}
