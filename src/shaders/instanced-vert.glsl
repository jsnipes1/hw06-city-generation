#version 300 es

uniform mat4 u_ViewProj;
uniform float u_Time;

uniform mat3 u_CameraAxes; // Used for rendering particles as billboards (quads that are always looking at the camera)
// gl_Position = center + vs_Pos.x * camRight + vs_Pos.y * camUp;

in vec4 vs_Pos; // Non-instanced; each particle is the same quad drawn in a different place
in vec4 vs_Nor; // Non-instanced, and presently unused
in vec4 vs_Col; // An instanced rendering attribute; each particle instance has a different color
in vec3 vs_Translate; // Another instance rendering attribute used to position each quad instance in the scene
in vec2 vs_UV; // Non-instanced, and presently unused in main(). Feel free to use it for your meshes.
in float vs_Rotate;
in vec3 vs_Scale;

out vec4 fs_Col;
out vec4 fs_Pos;

vec4 rotateZ(vec4 p, float a) {
    return vec4(cos(a) * p.x - sin(a) * p.y, sin(a) * p.x + cos(a) * p.y, p.z, p.w);
}

vec4 rotateY(vec4 p, float a) {
    return vec4(cos(a) * p.x - sin(a) * p.z, p.y, sin(a) * p.x + cos(a) * p.z, p.w);
}

vec4 rotateX(vec4 p, float a) {
    return vec4(p.x, cos(a) * p.y - sin(a) * p.z, sin(a) * p.y + cos(a) * p.z, p.w);
}

void main()
{
    fs_Col = vs_Col;
    fs_Pos = vs_Pos;

    vec3 offset = vs_Translate;
    
    mat4 sc = mat4(1.0);
    sc[0][0] = vs_Scale[0];
    sc[1][1] = vs_Scale[1];
    sc[2][2] = vs_Scale[2];

    vec4 finalPos = sc * vs_Pos;
    finalPos = rotateY(finalPos, vs_Rotate);
    finalPos.xyz = finalPos.xyz + vs_Translate;

    //offset = sc * (vs_Rotate * vs_Pos.xyz) + offset;

    gl_Position = u_ViewProj * finalPos;//(vs_Pos + vec4(offset, 1.0));
}
