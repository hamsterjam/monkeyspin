precision mediump float;

varying vec3 vNorm;

void main(void) {
	vec3 color = (vNorm + vec3(1.0))*0.5;
	gl_FragColor = vec4(color, 1.0);
}
