#version 300 es
precision highp float;

uniform vec2 u_PlanePos; // Our location in the virtual world displayed by the plane
uniform float u_Daytime;

in vec3 fs_Pos;
in vec4 fs_Nor;
in vec4 fs_Col;

in float fs_Sine;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
    return a + b*cos( 6.28318*(c*t+d) );
}

void main()
{
    vec3 a = vec3(0.368, 0.748, 0.158);
    vec3 b = vec3(0.358, 1.09, 0.428);
    vec3 c = vec3(1.077, 0.36, 0.048);
    vec3 d = vec3(0.965, 2.265, 0.848);
    vec4 fogCol = fs_Col;

    float t = clamp(smoothstep(40.0, 50.0, length(fs_Pos)), -1.0, 1.0); // Distance fog
    out_Col = vec4(mix(vec3(0.8 * (fs_Col + 0.2)), vec3(fogCol.xyz), t), 1.0);
}
