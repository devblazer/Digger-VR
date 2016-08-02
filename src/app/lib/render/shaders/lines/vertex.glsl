attribute vec3 a_position;
attribute vec4 a_color;
uniform mat4 u_mvMatrix;
uniform mat4 u_pMatrix;
varying vec4 v_color;

void main(void) {
    gl_Position = u_pMatrix * u_mvMatrix * vec4(a_position, 1.0 );
    v_color = a_color;
}
