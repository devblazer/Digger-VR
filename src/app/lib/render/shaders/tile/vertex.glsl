precision highp float;

attribute float a_index;

uniform mat4 u_mvMatrix;
uniform mat4 u_pMatrix;
uniform float u_normuv[180];

/*uniform vec3 u_sky_light;
uniform vec3 u_sun_light_color;
uniform vec3 u_fog_sky_color;
uniform vec3 u_fog_underground_color;
uniform vec3 u_sun_light_face;
uniform vec3 u_self_light;
uniform float u_height;
uniform vec3 u_camera_face;
uniform float u_view_distance;
*/
uniform vec3 u_camera;
uniform sampler2D tex31;

//varying vec3 v_normal;
varying vec2 v_uv;
//varying vec3 v_computed_light;
//varying vec3 v_fog_color;
//varying float v_fog_ratio;
//varying float v_test;

//const float reflectivity = 0.5;

//const float dataWidth = 4.0;
//const float dataPos = 148.0;

float getDataPoint(float ind, float width, sampler2D tex) {
    float x = (mod(ind,width)+0.5)/width;
    float y = (width-floor(ind/width)-0.5)/width;
    vec4 basePoint = texture2D(tex,vec2(x,y));
    float ret = basePoint.r;
    return floor((ret*256.0)+0.5);
}

float testValue(float val,float match) {
    return max(0.0,val-(match-1.0)) * max(0.0,(match+1.0)-val);
}

//float bitMask(float val, float b0,float b1,float b2,float b3,float b4,float b5,float b6,float b7) {

//}

void main(void) {
    float c_index = a_index*100.0;
/*    float m3 = mod(c_index,3.0);
    vec4 a_position = vec4(
        u_camera.x+(((min(0.0,m3-1.0)*2.0)+1.0)*0.5)+getDataPoint((floor(c_index/3.0)*5.0)+4.0,1024.0,tex1),//+floor(c_index/30.0),
        u_camera.y-20.0+(((max(0.0,m3-1.0)*2.0)-1.0)*0.5)+getDataPoint((floor(c_index/3.0)*5.0)+1.0,1024.0,tex1),
        u_camera.z-20.0+getDataPoint((floor(c_index/3.0)*5.0)+2.0,1024.0,tex1),
        1.0
    );*/
//    v_test.x = 0.0;//a_position.x;
//    v_test.y = 0.0;//a_position.y;
    vec4 a_position = vec4(
        getDataPoint((c_index*5.0),1024.0,tex31),
        getDataPoint((c_index*5.0)+1.0,1024.0,tex31),
        getDataPoint((c_index*5.0)+2.0,1024.0,tex31),
        getDataPoint((c_index*5.0)+3.0,1024.0,tex31)*5.0
    );
    float a_size = getDataPoint((c_index*5.0)+4.0,1024.0,tex31);

//v_test = getDataPoint((c_index*5.0),1024.0,tex1) * testValue(c_index,1.0);
/*float fuck = c_index*5.0;
    if (c_index==1.0) {
        v_test = max(0.0,a_position.x-16.0) * max(0.0,18.0-a_position.x);
    }
    else {
        v_test = 0.0;
    }*/
/*
    float max_self_light_distance = u_view_distance - 1.0;
    float sky_fog_dist = u_view_distance - 1.0;
    float underground_fog_dist = u_view_distance - 1.0;

    v_normal = vec3(u_normuv[int(a_position.w)],u_normuv[int(a_position.w)+1],u_normuv[int(a_position.w)+2]);*/
    v_uv = vec2(u_normuv[int(a_position.w)+3]*a_size,u_normuv[int(a_position.w)+4]*a_size);
    //v_uv.s = a_position.x-16.0;
    //v_uv.t = a_position.y-27.0;
/*
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
            +(self_intensity*(self_light_offset+reflectivity)*(1.0-min(1.0,distance(u_camera,a_position.xyz)/max_self_light_distance)));
*/
    gl_Position = u_pMatrix * u_mvMatrix * vec4(a_position.xyz, 1.0 );
}
