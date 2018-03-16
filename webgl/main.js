var cubeRotation = 0.0;
var g_zOffset = -10.0;
const g_zOffsetMax = -0.0;
const g_zOffsetMin = -30.0;
var g_cCurrentSelected = null;
var g_zObjCircles = null;

//
// Start here
//
function main() {
	const canvas = document.querySelector('#glcanvas');
	const gl = canvas.getContext('webgl');
	// look up the text canvas.
	const textCanvas = document.getElementById("text");
	// make a 2D context for it
	const ctx = textCanvas.getContext("2d");
	// If we don't have a GL context, give up now
	if (!gl) {
		alert('Unable to initialize WebGL. Your browser or machine may not support it.');
		return;
	}
	// Vertex shader program
	const vsSource = `
	attribute vec4 aVertexPosition;
	uniform mat4 uModelViewMatrix;
	uniform mat4 uProjectionMatrix;
	void main(void) {
	  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
	}
	`;
	// Fragment shader program
	const fsSource = `
	precision mediump float;
	uniform vec4 u_Color;
	void main(void) {
	  //gl_FragColor = vec4(0.75, 0.75, 0.75, 1.0);
	  gl_FragColor = u_Color;
	}
	`;
	// Initialize a shader program; this is where all the lighting
	// for the vertices and so forth is established.
	const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
	// Collect all the info needed to use the shader program.
	// Look up which attributes our shader program is using
	// for aVertexPosition, aTextureCoord and also
	// look up uniform locations.
	const programInfo = {
		program: shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
			vertexColor: gl.getUniformLocation(shaderProgram, "u_Color"),
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
			modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
			uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
		},
	};
	// Here's where we call the routine that builds all the
	// objects we'll be drawing.
	g_zObjCircles = initBuffers(gl);
	var then = 0;
	// Draw the scene repeatedly
	function render(now) {
		now *= 0.001; // convert to seconds
		const deltaTime = now - then;
		then = now;
		drawScene(gl, ctx, programInfo, g_zObjCircles, deltaTime);
		requestAnimationFrame(render);
	}
	requestAnimationFrame(render);
}

function initBuffers(gl) {
	buffers = []
	buffers.push(new wyCircle(gl, [0.0, 0.0], 1.0));
	//buffers.push(new wyCircle(gl, [0.0, 0.0], 3.0, false));
	buffers.push(new wyCircle(gl, [-3.0, 0.0], 1.0));
	buffers.push(new wyRect(gl, 0.0, 3.0, 1.0, 1.0));
	// buffers[0].selected = true;
	// g_cCurrentSelected = buffers[0];
	console.log("rect");
	return buffers;
}

function drawScene(gl, ctx, programInfo, buffers, deltaTime) {
	gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
	gl.clearDepth(1.0); // Clear everything
	gl.enable(gl.DEPTH_TEST); // Enable depth testing
	gl.depthFunc(gl.LEQUAL); // Near things obscure far things
	// Clear the canvas before we start drawing on it.
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	// Create a perspective matrix, a special matrix that is
	// used to simulate the distortion of perspective in a camera.
	// Our field of view is 45 degrees, with a width/height
	// ratio that matches the display size of the canvas
	// and we only want to see objects between 0.1 units
	// and 100 units away from the camera.
	const fieldOfView = 45 * Math.PI / 180; // in radians
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	const zNear = 0.1;
	const zFar = 100.0;
	const projectionMatrix = mat4.create();
	// note: glmatrix.js always has the first argument
	// as the destination to receive the result.
	mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
	// Set the drawing position to the "identity" point, which is
	// the center of the scene.
	const modelViewMatrix = mat4.create();
	// Now move the drawing position a bit to where we want to
	// start drawing the square.
	mat4.translate(modelViewMatrix, // destination matrix
		modelViewMatrix, // matrix to translate
		[-0.0, 0.0, g_zOffset]); // amount to translate
	// mat4.rotate(modelViewMatrix,  // destination matrix
	//			 modelViewMatrix,  // matrix to rotate
	//			 cubeRotation,	 // amount to rotate in radians
	//			 [0, 0, 1]);	   // axis to rotate around (Z)
	// mat4.rotate(modelViewMatrix,  // destination matrix
	//			 modelViewMatrix,  // matrix to rotate
	//			 cubeRotation * .7,// amount to rotate in radians
	//			 [0, 1, 0]);	   // axis to rotate around (X)
	// Tell WebGL which indices to use to index the vertices
	//gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
	// Tell WebGL to use our program when drawing
	gl.useProgram(programInfo.program);
	// Set the shader uniforms
	gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
	gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
	gl.uniform4f(programInfo.attribLocations.vertexColor, 0.75, 0.75, 0.75, 1);
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.fillStyle = "#FF0000";
	for (var i in buffers) {
		buffers[i].render(gl, ctx, programInfo, projectionMatrix, modelViewMatrix, deltaTime);
	}
	// Update the rotation for the next draw
	cubeRotation += deltaTime;
}

function initShaderProgram(gl, vsSource, fsSource) {
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
	// Create the shader program
	const shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);
	// If creating the shader program failed, alert
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
		return null;
	}
	return shaderProgram;
}

function loadShader(gl, type, source) {
	const shader = gl.createShader(type);
	// Send the source to the shader object
	gl.shaderSource(shader, source);
	// Compile the shader program
	gl.compileShader(shader);
	// See if it compiled successfully
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}

function onScroll(event) {
	event = event || window.event;
	//console.log(event);
	acc = 0.1;
	if (event.shiftKey) acc = 1.0;
	if (event.altKey) acc = 5.0;
	g_zOffset -= event.deltaY * acc / 1000.0;
	if (g_zOffset < g_zOffsetMin) g_zOffset = g_zOffsetMin;
	if (g_zOffset > g_zOffsetMax) g_zOffset = g_zOffsetMax;
	//console.log("g_zOffset:" + g_zOffset);
}

function onMouseDown(event) {
	event = event || window.event;
	var x = event.offsetX;
	var y = event.offsetY;
	var wpos = calcWorldPos([x, y]);
	//console.log("x,y=" + x + "," + y + " -- " + wpos);
	for (var i in g_zObjCircles) {
		if(g_zObjCircles[i].onClick(wpos[0], wpos[1])) {
			if (g_cCurrentSelected && g_cCurrentSelected != g_zObjCircles[i]) {
				g_cCurrentSelected.selected = false;
			}
			g_cCurrentSelected = g_zObjCircles[i];
			break;
		}
	}
}

function calcScreenPos(worldPos) {
	const ScreenW = 1200;
	const ScreenH = 800;
	const CameraZ = 0.0011;
	const Arg = [-0.12, 0.05]; // 在-0.12位置处，0.05即上下边界的最大值，-0.05~0.05
	const ScreenMH = Arg[1] * CameraZ / (CameraZ - Arg[0]);
	var x = worldPos[0];
	var y = worldPos[1];
	var z = worldPos[2];
	var sx = CameraZ * x / (CameraZ - z) / ScreenMH * ScreenH / 2 + ScreenW / 2;
	var sy = ScreenH / 2 - CameraZ * y / (CameraZ - z) / ScreenMH * ScreenH / 2;
	return [sx, sy];
}

function calcWorldPos(screenPos) {
	const ScreenW = 1200;
	const ScreenH = 800;
	const CameraZ = 0.0011;
	const Arg = [-0.12, 0.05]; // 在-0.12位置处，0.05即上下边界的最大值，-0.05~0.05
	const ScreenMH = Arg[1] * CameraZ / (CameraZ - Arg[0]);
	var x = screenPos[0];
	var y = screenPos[1];
	x -= ScreenW / 2;
	x /= ScreenH / 2;
	x *= ScreenMH;
	y = ScreenH / 2 - y;
	y /= ScreenH / 2;
	y *= ScreenMH;
	var wx = x * (CameraZ - g_zOffset) / CameraZ;
	var wy = y * (CameraZ - g_zOffset) / CameraZ;
	return [wx, wy];
}
