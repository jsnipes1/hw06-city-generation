#version 300 es


uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;
uniform vec2 u_PlanePos; // Our location in the virtual world displayed by the plane
uniform float u_Fire;

in vec4 vs_Pos;
in vec4 vs_Nor;
in vec4 vs_Col;

out vec3 fs_Pos;
out vec4 fs_Nor;
out vec4 fs_Col;

out float fs_Sine;

// Noise functions from hw05 for terrain map generation
float hash2D(vec2 x) {
    float i = dot(x, vec2(123.4031, 46.5244876));
    return fract(sin(i * 7.13) * 268573.103291);
}

// 2D noise
float noise(vec2 p) {
    vec2 corner = floor(p);
    vec2 inCell = fract(p);

    float bL = hash2D(corner);
    float bR = hash2D(corner + vec2(1.0, 0.0));
    float bottom = mix(bL, bR, inCell.x);

    vec2 tCorner = corner + vec2(0.0, 1.0);
    float tL = hash2D(tCorner);
    float tR = hash2D(tCorner + vec2(1.0, 0.0));
    float top = mix(tL, tR, inCell.x);

    return mix(bottom, top, inCell.y);
}

float fbm(vec2 q) {
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

// From IQ
//  float pattern( in vec3 p ) {
//     vec3 q = vec3( fbm( p + vec3(0.0) ),
//                    fbm( p + vec3(5.2,1.3, 2.8) ),
//                    fbm( p + vec3(1.2, 3.4, 1.2)) );

//     return fbm( p + 4.0*q );
//  }

// From IQ
// vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
//     return a + b*cos( 6.28318*(c*t+d) );
// }

void main()
{
  fs_Pos = vs_Pos.xyz + vs_Nor.xyz * fbm(vs_Pos.xy);

  vec2 q = vec2(fbm(fs_Pos.xz * 0.02 - vec2(0.2)), fbm(fs_Pos.xz * 0.02 + vec2(25.2, -22.8)));
  vec3 n = vec3(clamp(2.0 * fbm(q) - 0.3, 0.0, 1.0));

  fs_Col.x = 0.0;
  fs_Col.y = mix(0.0, 1.0, n.y);
  fs_Col.z = mix(1.0, 0.0, n.z);
  fs_Col.w = 1.0;
  fs_Col = (fs_Col.y < 0.57) ? (vec4(0.0, 0.0, 1.0, 1.0)) : (vec4(0.0, 1.0, 0.0, 1.0));

  vec3 newPos = (vs_Pos.xyz + vec3(u_PlanePos.x, 0.0, u_PlanePos.y));
  vec4 modelposition = vec4(vs_Pos.xyz, 1.0);

  if (fs_Col.y < 0.57) {
    fs_Col = vec4(195.0 / 255.0, 223.0 / 255.0, 224.0 / 255.0, 1.0);
    // adjust height
    modelposition.y -= 0.5;
  }
  else {
    fs_Col = vec4(204.0 / 255.0, 163.0 / 255.0, 192.0 / 255.0, 1.0);
  }

  modelposition = u_Model * modelposition;
  gl_Position = u_ViewProj * modelposition;
}
