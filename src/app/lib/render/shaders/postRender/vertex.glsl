attribute vec2 a_position;
attribute vec2 a_uv;
uniform mat4 u_mvMatrix;
uniform mat4 u_pMatrix;
varying vec2 v_uv;

void main(void) {
    mat4 holder1 = u_mvMatrix;
    v_uv = a_uv;
    vec2 position = vec2(a_position.x,a_position.y);
    gl_Position = vec4(position, -1.0, 1.0 );
}
