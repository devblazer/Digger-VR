precision highp float;

attribute float a_index;

uniform mat4 u_mvMatrix;
uniform mat4 u_pMatrix;
uniform float u_cubePositions[108];
uniform float u_cubeUV[12];
uniform float u_cubeNormals[18];

uniform vec3 u_sky_light;
uniform vec3 u_sun_light_color;
uniform vec3 u_fog_sky_color;
uniform vec3 u_fog_underground_color;
uniform vec3 u_sun_light_face;
uniform vec3 u_self_light;
uniform float u_height;
uniform vec3 u_camera_face;
uniform vec3 u_camera;
uniform float u_view_distance;

uniform sampler2D tex31;

varying vec3 v_normal;
varying vec2 v_uv;
varying vec3 v_computed_light;
varying vec3 v_fog_color;
varying float v_fog_ratio;
varying float v_texInd;

const float reflectivity = 0.5;
uniform float u_texDataWidth;

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
    float c_index = a_index*1024.0;

    vec4 a_position = vec4(
        getDataPoint(floor(c_index/6.0)*5.0,u_texDataWidth,tex31),
        getDataPoint((floor(c_index/6.0)*5.0)+1.0,u_texDataWidth,tex31),
        getDataPoint((floor(c_index/6.0)*5.0)+2.0,u_texDataWidth,tex31),
        getDataPoint((floor(c_index/6.0)*5.0)+3.0,u_texDataWidth,tex31)
    );
    float a_size = 1.0;
    float v_texInd = getDataPoint((floor(c_index/6.0)*5.0)+4.0,u_texDataWidth,tex31);

    int basePoint = int(a_position.w*18.0)+int(mod(c_index,6.0)*3.0);
    a_position.x += u_cubePositions[basePoint+0] * a_size;
    a_position.y += u_cubePositions[basePoint+1] * a_size;
    a_position.z += u_cubePositions[basePoint+2] * a_size;

    float max_self_light_distance = u_view_distance - 1.0;
    float sky_fog_dist = u_view_distance - 1.0;
    float underground_fog_dist = u_view_distance - 1.0;

    v_normal = vec3(u_cubeNormals[int(a_position.w*3.0)],u_cubeNormals[int(a_position.w*3.0)+1],u_cubeNormals[int(a_position.w*3.0)+2]);

    v_uv = vec2(u_cubeUV[int(mod(c_index,6.0)*2.0)]*a_size,u_cubeUV[int(mod(c_index,6.0)*2.0)+1]*a_size);
    v_uv.s = ((mod(v_texInd,12.0)*20.0)+1.0+(16.0*v_uv.s))/256.0;
    v_uv.t = (((floor(v_texInd/12.0)*20.0)+1.0+(16.0*v_uv.t)))/256.0;

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

    gl_Position = u_pMatrix * u_mvMatrix * vec4(a_position.xyz, 1.0 );
}
