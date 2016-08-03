attribute vec3 a_position;
attribute vec4 a_color;
attribute vec2 a_uv;
uniform mat4 u_mvMatrix;
uniform mat4 u_pMatrix;
varying vec4 v_color;

void main(void) {
    vec2 t_uv = a_uv;
    gl_Position = u_pMatrix * u_mvMatrix * vec4(a_position, 1.0 );
    v_color = a_color;
}
