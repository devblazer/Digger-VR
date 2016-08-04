attribute vec4 a_position;
attribute float a_size;
uniform mat4 u_mvMatrix;
uniform mat4 u_pMatrix;
uniform float u_normuv[180];

uniform vec3 u_sky_light;
uniform vec3 u_sun_light_color;
uniform vec3 u_fog_sky_color;
uniform vec3 u_fog_underground_color;
uniform vec3 u_sun_light_face;
uniform vec3 u_self_light;
uniform float u_height;
uniform vec3 u_camera_face;
uniform vec3 u_camera;

varying vec3 v_normal;
varying vec2 v_uv;
varying vec3 v_computed_light;
varying vec3 v_fog_color;
varying float v_fog_ratio;

const float reflectivity = 1.5;
const float max_self_light_distance = 16.0;
const float sky_fog_dist = 16.0;
const float underground_fog_dist = 16.0;

void main(void) {
    v_normal = vec3(u_normuv[int(a_position.w)],u_normuv[int(a_position.w)+1],u_normuv[int(a_position.w)+2]);
    v_uv = vec2(u_normuv[int(a_position.w)+3]*a_size,u_normuv[int(a_position.w)+4]*a_size);

    float sky_intensity = (1.0-u_height)*0.3;
    float sun_intensity = 1.0-u_height;
    float self_intensity = u_height;
    float fog_distance = (underground_fog_dist*u_height)+(sky_fog_dist*(1.0-u_height));
    v_fog_ratio = pow(min(1.0,distance(u_camera,a_position.xyz)/fog_distance),2.0);
    v_fog_ratio *= v_fog_ratio;
    v_fog_color = (u_fog_sky_color*(1.0-u_height))+(u_fog_underground_color*u_height);

    float sun_light_offset = max(0.0,dot(v_normal,-normalize(u_sun_light_face)));
    float self_light_offset = max(0.0,dot(v_normal,-normalize(u_camera_face)));

    v_computed_light =
        (sun_light_offset*sun_intensity*u_sun_light_color)
        +(sky_intensity*u_sky_light)
        +(self_intensity*self_light_offset*(u_self_light*reflectivity)*(1.0-min(1.0,distance(u_camera,a_position.xyz)/max_self_light_distance)));

    gl_Position = u_pMatrix * u_mvMatrix * vec4(a_position.xyz, 1.0 );
}
