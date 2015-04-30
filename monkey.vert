attribute vec3 aVertPos;
attribute vec3 aNorm;

uniform mat4 uPVMatrix;
uniform mat4 uMMatrix;
uniform mat3 uNMatrix;

varying vec3 vNorm;
varying vec3 vFragPos;

void main(void) {
	vNorm = uNMatrix * aNorm;
	vec4 fragpos = uMMatrix * vec4(aVertPos, 1.0);
	vFragPos = fragpos.xyz;
	gl_Position = uPVMatrix * fragpos;
}
