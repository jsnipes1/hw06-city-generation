#version 300 es
precision highp float;

// BUILDING VERTEX SHADER

in vec4 vs_Pos;
out vec4 fs_Pos;

void main() {
  fs_Pos = vs_Pos;
  gl_Position = vs_Pos;
}