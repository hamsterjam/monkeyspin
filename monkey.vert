attribute vec3 aVertPos;
attribute vec3 aNorm;

uniform mat4 uPVMatrix;
uniform mat4 uMMatrix;
uniform mat3 uNMatrix;

varying vec3 vNorm;

void main(void) {
	vNorm = normalize(uNMatrix * aNorm);
	gl_Position = uPVMatrix * uMMatrix * vec4(aVertPos, 1.0);
}
