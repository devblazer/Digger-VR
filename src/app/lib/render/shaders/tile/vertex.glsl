attribute vec4 a_position;
attribute float a_size;
uniform mat4 u_mvMatrix;
uniform mat4 u_pMatrix;
uniform float u_normuv[180];
varying vec3 v_normal;
varying vec2 v_uv;

void main(void) {
    v_normal = vec3(u_normuv[int(a_position.w)],u_normuv[int(a_position.w)+1],u_normuv[int(a_position.w)+2]);
    v_uv = vec2(u_normuv[int(a_position.w)+3]*a_size,u_normuv[int(a_position.w)+4]*a_size);
    gl_Position = u_pMatrix * u_mvMatrix * vec4(a_position.xyz, 1.0 );
}
