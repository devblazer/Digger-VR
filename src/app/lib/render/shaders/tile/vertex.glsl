attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_uv;
uniform mat4 u_mvMatrix;
uniform mat4 u_pMatrix;
varying vec3 v_normal;
varying vec2 v_uv;

void main(void) {
    gl_Position = u_pMatrix * u_mvMatrix * vec4(a_position, 1.0 );
    v_normal = a_normal;
    v_uv = a_uv;
}
