#version 300 es
precision highp float;

// The fragment shader used to render the background of the scene
// Modify this to make your background more interesting

uniform float u_Daytime;
in vec4 fs_Pos;
out vec4 out_Col;

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
    return a + b*cos( 6.28318*(c*t+d) );
}

void main() {
  out_Col = vec4(164.0 / 255.0, 233.0 / 255.0, 1.0, 1.0);
  vec3 a = vec3(0.368, 0.748, 0.158);
  vec3 b = vec3(0.358, 1.09, 0.428);
  vec3 c = vec3(1.077, 0.36, 0.048);
  vec3 d = vec3(0.965, 2.265, 0.848);
  out_Col = mix(vec4(palette(u_Daytime / 23.0, a, b, c, d), 1.0), vec4(palette((u_Daytime + 2.0) / 25.0, a, b, c, d), 1.0), fs_Pos.y);
}
