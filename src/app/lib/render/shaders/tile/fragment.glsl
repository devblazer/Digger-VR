precision highp float;
varying vec3 v_normal;
varying vec2 v_uv;

uniform sampler2D tex0;
uniform float u_test[2];

void main(void) {
    gl_FragColor = texture2D(tex0,vec2(v_uv.s,v_uv.t)) * u_test[1];
}
