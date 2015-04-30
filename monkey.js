var gl;

var startWebGL = (function() {
	res = {};

	function initGL(canvas) {
		try {
			gl = canvas.getContext('webgl');

			gl.vbo = {};
			gl.ibo = {};
			gl.tex = {};
			gl.attrib = {};
			gl.uniform = {};

			gl.viewportWidth = canvas.width;
			gl.viewportHeight = canvas.height;
		} catch (ignore) {}

		if (!gl) {
			console.error('Could not initialise WebGL');
		}
	}

	function loadResources(res, listSrc, callback) {
		var list = [];

		function loadList() {
			jx.load(listSrc, function(data) {
				list = data;
				loadItems();
			}, 'json');
		}

		function loadItems() {
			var itemsLeft = 0;

			function get(desc) {
				itemsLeft++;
				jx.load(desc.src, function(data) {
					res[desc.name] = data;
					itemsLeft--;
					if (itemsLeft === 0) callback();
				}, desc.type);
			}

			numItems = list.length;
			for (var i=0; i<numItems; i++) {
				get(list[i]);
			}
		}

		loadList();
	}

	var initShaders = (function() {
		function getShader(source, type) {
			var shader;
			var str = source;

			if (type === 'frag') {
				shader = gl.createShader(gl.FRAGMENT_SHADER);
			}
			else if (type === 'vert') {
				shader = gl.createShader(gl.VERTEX_SHADER);
				str = res.vertSource;
			}
			else {
				console.error('unrecognised shader script type');
				return null;
			}

			gl.shaderSource(shader, str);
			gl.compileShader(shader);

			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				console.error(gl.getShaderInfoLog(shader));
				return null;
			}

			return shader;
		}

		return function (vshaderSrc, fshaderSrc) {
			var vshader = getShader(vshaderSrc, 'vert');
			var fshader = getShader(fshaderSrc, 'frag');

			var shaderProg = gl.createProgram();
			gl.attachShader(shaderProg, vshader);
			gl.attachShader(shaderProg, fshader);
			gl.linkProgram(shaderProg);

			if (!gl.getProgramParameter(shaderProg, gl.LINK_STATUS)) {
				console.error('Could not initalise shaders');
			}

			gl.useProgram(shaderProg);

			gl.attrib.vertPos = gl.getAttribLocation(shaderProg, 'aVertPos');
			gl.attrib.norm = gl.getAttribLocation(shaderProg, 'aNorm');
			gl.enableVertexAttribArray(gl.attrib.vertPos);
			gl.enableVertexAttribArray(gl.attrib.norm);

			gl.uniform.PVMatrix = gl.getUniformLocation(shaderProg, 'uPVMatrix');
			gl.uniform.MMatrix = gl.getUniformLocation(shaderProg, 'uMMatrix');
			gl.uniform.NMatrix = gl.getUniformLocation(shaderProg, 'uNMatrix');

			gl.uniform.lightPos = gl.getUniformLocation(shaderProg, 'uLightPos');
			gl.uniform.lightColor = gl.getUniformLocation(shaderProg, 'uLightColor');

			var model = mat4.create();
			var proj = mat4.create();
			mat4.perspective(proj, 45, gl.viewportWidth/gl.viewportHeight, 0.1, 100);
			mat4.translate(model, model, [0, 0, -4]);

			var norm = mat3.create();
			mat3.normalFromMat4(norm, model);

			gl.uniformMatrix4fv(gl.uniform.PVMatrix, false, proj);
			gl.uniformMatrix4fv(gl.uniform.MMatrix, false, model);
			gl.uniformMatrix3fv(gl.uniform.NMatrix, false, norm);

			gl.uniform3f(gl.uniform.lightPos, -5, -10, -5);
			gl.uniform3f(gl.uniform.lightColor, 0.9, 0.9, 0.55);
		};
	}());

	function genNorms(model) {
		var numVerts = model.vertIndex.length;
		var norms = [];
		for (var i=0; i<numVerts; i++){
			for (var j=0; j<3; j++) {;
				norms[model.vertIndex[i]*3 + j] = model.norms[model.normIndex[i]*3 + j];
			}
		}
		model.normIndex = null;
		model.norms = norms;
	}

	function initBuffers() {
		genNorms(res.objMonkey);

		gl.vbo.monkeyVerticies = gl.createBuffer();
		gl.vbo.monkeyVerticies.itemSize = 3;
		gl.vbo.monkeyVerticies.numItems = res.objMonkey.verts.length/3;
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.vbo.monkeyVerticies);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(res.objMonkey.verts), gl.STATIC_DRAW);

		gl.vbo.monkeyNorms = gl.createBuffer();
		gl.vbo.monkeyNorms.itemSize = 3;
		gl.vbo.monkeyNorms.numItems = gl.vbo.monkeyVerticies.numItems;
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.vbo.monkeyNorms);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(res.objMonkey.norms), gl.STATIC_DRAW);

		gl.ibo.monkeyTris = gl.createBuffer();
		gl.ibo.monkeyTris.itemSize = 1;
		gl.ibo.monkeyTris.numItems = res.objMonkey.vertIndex.length;
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.ibo.monkeyTris);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(res.objMonkey.vertIndex), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}

	function drawScene() {
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.bindBuffer(gl.ARRAY_BUFFER, gl.vbo.monkeyVerticies);
		gl.vertexAttribPointer(gl.attrib.vertPos, gl.vbo.monkeyVerticies.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, gl.vbo.monkeyNorms);
		gl.vertexAttribPointer(gl.attrib.norm, gl.vbo.monkeyNorms.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.ibo.monkeyTris);
		gl.drawElements(gl.TRIANGLES, gl.ibo.monkeyTris.numItems, gl.UNSIGNED_SHORT, 0);
	}

	var tick = (function() {
		timeThen = 0;
		angle = 0;

		return function() {
			requestAnimFrame(tick);

			timeNow = new Date().getTime();
			if (timeThen !== 0) {
				deltaT = timeNow - timeThen;

				var SPEED = Math.PI / 2 / 1000;
				angle += SPEED * deltaT;
				angle %= Math.PI*2;
			}
			timeThen = timeNow;

			var model = mat4.create();
			var norm = mat3.create();
			mat4.translate(model, model, [0, 0, -4]);
			mat4.rotateY(model, model, angle);
			mat3.normalFromMat4(norm, model);
			gl.uniformMatrix4fv(gl.uniform.MMatrix, false, model);
			gl.uniformMatrix3fv(gl.uniform.NMatrix, false, norm);;

			drawScene();
		};
	}());

	return function(canvasID) {
		var canvas = document.getElementById(canvasID);

		initGL(canvas);
		loadResources(res, 'res.json', function() {
			initShaders(res.vertSource, res.fragSource);
			initBuffers();

			gl.clearColor(0.0, 0.0, 0.0, 1.0);
			gl.enable(gl.DEPTH_TEST);

			tick();
		});
	};
}());
