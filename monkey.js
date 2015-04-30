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
			gl.enableVertexAttribArray(gl.attrib.vertPos);

			gl.uniform.PVMatrix = gl.getUniformLocation(shaderProg, 'uPVMatrix');
			gl.uniform.MMatrix = gl.getUniformLocation(shaderProg, 'uMMatrix');

			var model = mat4.create();
			var proj = mat4.create();
			mat4.perspective(proj, 45, gl.viewportWidth/gl.viewportHeight, 0.1, 100);
			mat4.translate(model, model, [0, 0, -4]);

			gl.uniformMatrix4fv(gl.uniform.PVMatrix, false, proj);
			gl.uniformMatrix4fv(gl.uniform.MMatrix, false, model);
		};
	}());

	function genNorms(model) {
		timesProcessed = [];
		norms = [];

		numFaces = model.faces.length/3;
		for (var i=0; i<numFaces*3; i += 3) {
			// An array of vec3's with the corner positions of the i'th tri
			curVerts = [];
			curTimesProc = [];
			for (var j=0; j<3; j++) {
				// The j'th corner
				curVerts[j] = [];
				for (var k=0; k<3; k++) {
					// The k'th component
					curVerts[j][k] = model.verticies[3*model.faces[i + 3*j + k] + k];
				}
				curTimesProc[j] = timesProcessed[i + 3*j];
				// If its undefined, make it 0
				if (!curTimesProc[j]) curTimesProc[j] = 0;
			}

			// Assuming the corners are specified clockwise we calculate the norm as
			// (v3 - v1)x(v2 - v1). Then you normlaize that
			s1 = [];
			s2 = [];
			facenorm = [];
			for (var k=0; k<3; k++) {
				s1[k] = curVerts[2][k] - curVerts[0][k];
				s2[k] = curVerts[1][k] - curVerts[0][k];
			}
			// This is a cross product...

			// Now on each corner do a weighted average and renormalize (for smooth shading)
		}
	}

	function initBuffers() {
		gl.vbo.monkeyVerticies = gl.createBuffer();
		gl.vbo.monkeyVerticies.itemSize = 3;
		gl.vbo.monkeyVerticies.numItems = res.objMonkey.verticies.length/3;
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.vbo.monkeyVerticies);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(res.objMonkey.verticies), gl.STATIC_DRAW);

		gl.ibo.monkeyTris = gl.createBuffer();
		gl.ibo.monkeyTris.itemSize = 1;
		gl.ibo.monkeyTris.numItems = res.objMonkey.faces.length;
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.ibo.monkeyTris);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(res.objMonkey.faces), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}

	function drawScene() {
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.bindBuffer(gl.ARRAY_BUFFER, gl.vbo.monkeyVerticies);
		gl.vertexAttribPointer(gl.attrib.vertPos, gl.vbo.monkeyVerticies.itemSize, gl.FLOAT, false, 0, 0);

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
			mat4.translate(model, model, [0, 0, -4]);
			mat4.rotateY(model, model, angle);
			gl.uniformMatrix4fv(gl.uniform.MMatrix, false, model);

			drawScene();
		};
	}());

	return function(canvasID) {
		var canvas = document.getElementById(canvasID);

		initGL(canvas);
		loadResources(res, 'res.json', function() {
			genNorms(res.objMonkey);
			initShaders(res.vertSource, res.fragSource);
			initBuffers();

			gl.clearColor(0.0, 0.0, 0.0, 1.0);
			gl.enable(gl.DEPTH_TEST);

			tick();
		});
	};
}());
