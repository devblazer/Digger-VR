precision highp float;
varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_computed_light;
varying vec3 v_fog_color;
varying float v_fog_ratio;

uniform sampler2D tex0;

void main(void) {
    vec4 baseColor = texture2D(tex0,vec2(v_uv.s,v_uv.t));
    vec3 new_color = baseColor.rgb*v_computed_light;
    new_color = (new_color*(1.0-v_fog_ratio))+(v_fog_color*v_fog_ratio);

    gl_FragColor = vec4(new_color,1.0);
}
