#version 300 es
precision highp float;

// BUILDING FRAGMENT SHADER

in vec4 fs_Col;
in vec4 fs_Pos;

out vec4 out_Col;

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
//   return vec4(sumColor, 1.0);
// }
////////////////////

void main()
{
    // Three-point lighting
    vec4 lights[3];
    vec3 lightColors[3];

    lights[0] = vec4(6.0, 3.0, 5.0, 3.0); // key light
    lights[1] = vec4(-6.0, 3.0, 5.0, 2.5); // fill light
	lights[2] = vec4(6.0, 5.0, -1.75, 4.0); // back light
    
    lightColors[0] = vec3(1.0);
    lightColors[1] = vec3(1.0);
    lightColors[2] = vec3(1.0);

    out_Col = vec4(1.0, 1.0, 1.0, 1.0);
}