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

/////// RAYS ///////
// Properties of each ray cast into the scene
struct Ray {
  vec3 origin;
  vec3 direction;
};

// March t units along ray r
vec3 pointOnRay(Ray r, float t) {
  return r.origin + t * r.direction;
}
////////////////////

/////// LIGHTING ///////
// Lambertian shading (from hw03)
// vec4 lambert(vec4 lights[3], vec3 lightColors[3], vec3 p, vec3 baseColor, Ray r) {
//   vec3 sumColor = vec3(0.0);
//   vec3 nHat = surfaceNormal(p);

//   for (int i = 0; i < 3; ++i) {
//     vec3 lHat = normalize(lights[i].xyz - p);
//     Ray lightRay = Ray(p, lHat);
//     vec3 lamb = baseColor * clamp(dot(nHat, lHat), 0.0, 1.0) * lights[i].w * lightColors[i];
//     sumColor += lamb * vec3(softShadow(lightRay, 0.1, 10.0, 8.0));
//   }

//   // Return average color
//   sumColor /= 3.0;
//   return vec4(sumColor, 0.0);
// }
////////////////////

void main()
{
    vec3 a = vec3(0.368, 0.748, 0.158);
    vec3 b = vec3(0.358, 1.09, 0.428);
    vec3 c = vec3(1.077, 0.36, 0.048);
    vec3 d = vec3(0.965, 2.265, 0.848);
    vec4 fogCol = fs_Col;

    float t = clamp(smoothstep(40.0, 50.0, length(fs_Pos)), -1.0, 1.0); // Distance fog

    // Three-point lighting
    vec4 lights[3];
    vec3 lightColors[3];

    lights[0] = vec4(6.0, 3.0, 5.0, 3.0); // key light
    lights[1] = vec4(-6.0, 3.0, 5.0, 2.5); // fill light
	lights[2] = vec4(6.0, 5.0, -1.75, 4.0); // back light
    
    lightColors[0] = vec3(1.0);
    lightColors[1] = vec3(1.0);
    lightColors[2] = vec3(1.0);

    out_Col = vec4(mix(vec3(0.8 * (fs_Col + 0.2)), vec3(fogCol.xyz), t), 1.0);
}
