precision highp float;
varying vec2 v_uv;
uniform sampler2D tex0;

void main(void) {
    gl_FragColor = texture2D(tex0,vec2(v_uv.s,v_uv.t));
}
