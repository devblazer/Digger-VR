attribute vec3 a_position;
attribute vec3 a_color;
uniform mat4 u_mvMatrix;
uniform mat4 u_pMatrix;
varying vec4 v_color;

void main(void) {
    gl_PointSize = 2.5;
    gl_Position = u_pMatrix * u_mvMatrix * vec4(a_position, 1.0 );
    v_color = vec4(a_color,1.0-(gl_Position.z/30.0));
}
