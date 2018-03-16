// wyutils.js

class wyCircle {
	constructor(gl, _pos, _radius, _fill = true, _slice = 60) {
		this.pos = _pos;
		this.radius = _radius;
		this.vertices = [];
		this.fill = _fill;
		this.slice = _slice || 60;
		if (this.fill) wyCircle.createCircle(this.vertices, this.pos, this.radius);
		else wyCircle.createCirclePeriphery(this.vertices, this.pos, this.radius);
		// Select the positionBuffer as the one to apply buffer
		// operations to from here out.
		this.verticesBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
		
		this.selected = false;
		this.selectable = true;
		this.renderSelectedBoxTime = 0;
		this.showSelectedBox = false;
		this.flickerMode = false;
		this.border = null;
		this.labelText = "[" + this.pos[0] + ", " + this.pos[1] + "," + this.radius + "]";
	}
	render(gl, ctx, programInfo, projectionMatrix, modelViewMatrix, deltaTime) {
		// Tell WebGL how to pull out the positions from the position
		// buffer into the vertexPosition attribute
		gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
		gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
		if (this.fill) {
			gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vertices.length / 3);
		} else {
			gl.drawArrays(gl.LINE_LOOP, 0, this.vertices.length / 3);
		}
		if (this.selected) {
			if(this.flickerMode) {
				this.renderSelectedBoxTime += deltaTime;
				if (this.renderSelectedBoxTime >= 0.7) {
					this.showSelectedBox = !this.showSelectedBox;
					this.renderSelectedBoxTime = 0;
				}
				if (this.showSelectedBox) {
					this.checkSelectedBox(gl);
					this.border.render(gl, ctx, programInfo, projectionMatrix, modelViewMatrix, deltaTime);
				}
			} else {
				this.checkSelectedBox(gl);
				this.border.render(gl, ctx, programInfo, projectionMatrix, modelViewMatrix, deltaTime);
			}
		}
		if (this.fill) {
			var screenPos = calcScreenPos([this.pos[0], this.pos[1], g_zOffset]);
			ctx.fillText(this.labelText, screenPos[0], screenPos[1]);
		}
	}
	checkSelectedBox(gl) {
		if(this.border) return;
		//this.border = new Border1(gl, this.pos[0] - this.radius, this.pos[1] - this.radius, this.radius*2, this.radius*2);
		this.border = new RectBorder(gl, this.pos[0] - this.radius, this.pos[1] - this.radius, this.radius*2, this.radius*2, 0.0);
	}
	onClick(x, y) {
		if(!this.selectable) return false;
		var dx = this.pos[0] - x;
		var dy = this.pos[1] - y;
		var dist = Math.sqrt(dx * dx + dy * dy);
		if (dist <= this.radius) {
			this.selected = true;
			return true;
		}
		return false;
	}
	static createCircle(vertices, pos, radius) {
		if(!vertices) vertices = [];
		const slice = 60;
		vertices.push(pos[0], pos[1], 0.0);
		for (var i = 0; i <= slice; i++) {
			var x = pos[0] + radius * Math.cos(i * 2 * Math.PI / slice);
			var y = pos[1] + radius * Math.sin(i * 2 * Math.PI / slice);
			vertices.push(x, y, 0.0);
		}
		return vertices;
	}
	static createCirclePeriphery(vertices, pos, radius) {
		if(!vertices) vertices = [];
		const slice = 60;
		for (var i = 0; i < slice; i++) {
			var x = pos[0] + radius * Math.cos(i * 2 * Math.PI / slice);
			var y = pos[1] + radius * Math.sin(i * 2 * Math.PI / slice);
			vertices.push(x, y, 0.0);
		}
		return vertices;
	}
	static createSelectedBox(arr, pos, radius, size) {
		if (!arr) arr = [];
		wyCircle.createRightTriangle(arr, [pos[0] - radius, pos[1] - radius], 0, size);
		wyCircle.createRightTriangle(arr, [pos[0] + radius, pos[1] - radius], 1, size);
		wyCircle.createRightTriangle(arr, [pos[0] + radius, pos[1] + radius], 2, size);
		wyCircle.createRightTriangle(arr, [pos[0] - radius, pos[1] + radius], 3, size);
		return arr;
	}

	static createRightTriangle(arr, pos, quad, scale) {
		const OFFSET = [ [[1, 0], [0, 1]], [[0, 1], [-1, 0]], [[-1, 0], [0, -1]], [[0, -1], [1, 0]] ];
		arr.push(pos[0], pos[1], 0);
		arr.push(pos[0] + OFFSET[quad][0][0] * scale, pos[1] + OFFSET[quad][0][1] * scale, 0);
		arr.push(pos[0] + OFFSET[quad][1][0] * scale, pos[1] + OFFSET[quad][1][1] * scale, 0);
	}
}

class wyRect {
	constructor(gl, _x, _y, _w, _h, _fill = true) {
		this.x = _x;
		this.y = _y;
		this.w = _w;
		this.h = _h;
		this.fill = _fill;

		this.vertices = wyRect.createRectVertices(null, this.x, this.y, this.w, this.h);
		this.verticesBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

		this.selected = false;
		this.selectable = true;
		this.renderSelectedBoxTime = 0;
		this.showSelectedBox = false;
		this.border = null;
		this.labelText = "[" + [this.x, this.y, this.w, this.h].join(",") + "]";
	}
	render(gl, ctx, programInfo, projectionMatrix, modelViewMatrix, deltaTime) {
		// Tell WebGL how to pull out the positions from the position
		// buffer into the vertexPosition attribute
		gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
		gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
		if (this.fill) {
			gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vertices.length / 3);
		} else {
			gl.drawArrays(gl.LINE_LOOP, 0, this.vertices.length / 3);
		}
		if (this.selected) {
			if(this.flickerMode) {
				this.renderSelectedBoxTime += deltaTime;
				if (this.renderSelectedBoxTime >= 0.7) {
					this.showSelectedBox = !this.showSelectedBox;
					this.renderSelectedBoxTime = 0;
				}
				if (this.showSelectedBox) {
					this.checkSelectedBox(gl);
					this.border.render(gl, ctx, programInfo, projectionMatrix, modelViewMatrix, deltaTime);
				}
			} else {
				this.checkSelectedBox(gl);
				this.border.render(gl, ctx, programInfo, projectionMatrix, modelViewMatrix, deltaTime);
			}
		}
		var screenPos = calcScreenPos([this.x + this.w/2, this.y+this.h/2, g_zOffset]);
		ctx.fillText(this.labelText, screenPos[0], screenPos[1]);
	}
	checkSelectedBox(gl) {
		if(this.border) return;
		this.border = new RectBorder(gl, this.x, this.y, this.w, this.h, 0.2);
	}
	onClick(x, y) {
		if(!this.selectable) return false;
		if (x >= this.x && x <= this.x+this.w && y >= this.y && y <= this.y+this.h) {
			this.selected = true;
			return true;
		}
		return false;
	}
	static createRectBorder(vertices, x, y, w, h, extend, size=0.1, length=0.3) {
		wyRect.createRectBorderSingle(vertices, x-extend, y-extend, 0, size, length);
		wyRect.createRectBorderSingle(vertices, x+w+extend, y-extend, 1, size, length);
		wyRect.createRectBorderSingle(vertices, x+w+extend, y+h+extend, 2, size, length);
		wyRect.createRectBorderSingle(vertices, x-extend, y+h+extend, 3, size, length);
		return vertices;
	}
	static createRectBorderSingle(vertices, x, y, quad, size=0.1, length=0.3) {
		if(!vertices) vertices = [];
		var offset = [
			[ [size+length, 0], [size+length, size], [size, size], [size, size+length], [0, size+length] ], 
			[ [0, size+length], [-size, size+length], [-size, size], [-size-length, size], [-size-length, 0] ], 
			[ [-size-length, 0], [-size-length, -size], [-size, -size], [-size, -size-length], [0, -size-length] ], 
			[ [0, -size-length], [size, -size-length], [size, -size], [size+length, -size], [size+length, 0] ]
		];
		vertices.push(x, y, 0.0);
		for(var i = 0; i < 5; i++) {
			vertices.push(x + offset[quad][i][0], y + offset[quad][i][1], 0.0);
		}
		return vertices;
	}
	static createRectVertices(vertices, x, y, w, h) {
		if(!vertices) vertices = [];
		vertices.push(x, y, 0.0);
		vertices.push(x + w, y, 0.0);
		vertices.push(x + w, y + h, 0.0);
		vertices.push(x, y + h, 0.0);
		return vertices;
	}
}

class Border1 {
	constructor(gl, x, y, w, h, size=0.1) {
		this.vertices = [];
		this.verticesBuffer = null;
		this.verticesBuffer = gl.createBuffer();
		
		//wyCircle.createSelectedBox(this.vertices, this.pos, this.radius, size);
		wyCircle.createRightTriangle(this.vertices, [x, y], 0, size);
		wyCircle.createRightTriangle(this.vertices, [x + w, y], 1, size);
		wyCircle.createRightTriangle(this.vertices, [x + w, y + h], 2, size);
		wyCircle.createRightTriangle(this.vertices, [x, y + h], 3, size);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
	}
	render(gl, ctx, programInfo, projectionMatrix, modelViewMatrix, deltaTime) {
		gl.uniform4f(programInfo.attribLocations.vertexColor, 1, 0, 0, 1);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
		gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
		gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
		gl.uniform4f(programInfo.attribLocations.vertexColor, 0.75, 0.75, 0.75, 1);
	}
}

class RectBorder {
	constructor(gl, x, y, w, h, extend=0.1, size=0.1, length=0.3) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.extend = extend;
		this.size = size;
		this.length = length;

		this.vertices = [];
		this.verticesBuffer = null;
		this.verticesBuffer = gl.createBuffer();
		var max = this.w > this.h ? this.w : this.h;
		//const SELECTED_BOX_SIZE = 0.1;
		//wyCircle.createSelectedBox(this.selectedBoxVertices, [this.x + this.w/2, this.y+this.h/2], max/2+0.1, SELECTED_BOX_SIZE);
		wyRect.createRectBorder(this.vertices, this.x, this.y, this.w, this.h, this.extend, this.size, this.length);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
	}
	render(gl, ctx, programInfo, projectionMatrix, modelViewMatrix, deltaTime) {
		gl.uniform4f(programInfo.attribLocations.vertexColor, 1, 0, 0, 1);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
		gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 6);
		gl.drawArrays(gl.TRIANGLE_FAN, 6, 6);
		gl.drawArrays(gl.TRIANGLE_FAN, 12, 6);
		gl.drawArrays(gl.TRIANGLE_FAN, 18, 6);
		gl.uniform4f(programInfo.attribLocations.vertexColor, 0.75, 0.75, 0.75, 1);
	}
}
