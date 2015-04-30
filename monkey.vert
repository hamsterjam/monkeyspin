attribute vec3 aVertPos;

uniform mat4 uPVMatrix;
uniform mat4 uMMatrix;

void main(void) {
	gl_Position = uPVMatrix * uMMatrix * vec4(aVertPos, 1.0);
}
