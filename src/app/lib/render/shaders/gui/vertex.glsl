attribute vec3 a_position;
attribute vec2 a_uv;
uniform mat4 u_mvMatrix;
uniform mat4 u_pMatrix;
uniform float u_eyeOffset;
varying vec2 v_uv;

void main(void) {
    mat4 holder1 = u_mvMatrix;
    v_uv = a_uv;
    vec3 position = a_position;
    position.x = position.x - (u_eyeOffset/3.0);
    gl_Position = u_pMatrix * vec4(position, 1.0 );
}
