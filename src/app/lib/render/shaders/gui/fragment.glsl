precision highp float;
varying vec2 v_uv;
uniform sampler2D tex0;
uniform vec4 u_color;

void main(void) {
    gl_FragColor = texture2D(tex0,vec2(v_uv.s,v_uv.t)) * u_color;
}
