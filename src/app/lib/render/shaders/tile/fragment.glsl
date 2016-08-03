precision highp float;
varying vec2 v_uv;
varying vec3 v_normal;

uniform sampler2D tex0;
uniform float u_ambient;
uniform vec3 u_directional;

void main(void) {
    float dLighting = max(0.0,dot(v_normal,-normalize(u_directional)));
    vec4 baseColor = texture2D(tex0,vec2(v_uv.s,v_uv.t));
    gl_FragColor = baseColor*dLighting*(1.0-u_ambient)+(baseColor*u_ambient);
}
