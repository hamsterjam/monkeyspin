precision mediump float;

uniform vec3 uLightPos;
uniform vec3 uLightColor;

varying vec3 vNorm;
varying vec3 vFragPos;

const vec3 fragColor = vec3(1.0, 0.3, 0.3);
const vec3 ambientColor = vec3(0.06, 0.06, 0.055);

void main(void) {
	vec3 norm = normalize(vNorm);
	//Ambient
	vec3 amb = ambientColor * fragColor;
	//Diffuse
	float dist = length(vFragPos - uLightPos);
	vec3 a = normalize(vFragPos - uLightPos);
	vec3 diff = max(dot(a, norm)/dist/dist * 50.0 * uLightColor, 0.0);
	//Specular
	vec3 b = normalize(2.0*vFragPos - uLightPos);
	vec3 spec = pow(max(dot(b, norm), 0.0), 10.0) * uLightColor * 5.0;

	gl_FragColor = vec4((spec + amb + diff)*fragColor, 1.0);
}
