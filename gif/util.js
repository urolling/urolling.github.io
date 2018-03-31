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

// 3光标选择控件，通常用于进度条并需要选择一个范围的场景
class wySlider3 {
	constructor(cav, min, max, cur, sep) {
		this.canvas = cav;
		this.ctx = this.canvas.getContext("2d");
		this.width = parseInt(this.canvas.width);
		this.height = parseInt(this.canvas.height);
		//console.log(min + "," + max + "," + cur);
		this.min = (min === undefined ? 0 : min);
		this.max = (max === undefined ? (this.min + 100) : max);
		if(this.min > this.max) {
			var tmp = this.min;
			this.min = this.max;
			this.max = tmp;
		}
		this.cur = cur === undefined ? (this.max-this.min)/2+this.min : cur;
		//console.log(this.min + "," + this.max + "," + this.cur);
		this.left = this.min;
		this.right = this.max;
		this.curHover = false;
		this.leftHover = false;
		this.rightHover = false;

		this.selectable = true;
		this.selectedIndex = -1;

		this.sep = sep || 1;

		this.padding = [8, 8, 8, 8];
		this.progressBarHeight = 8;
		this.progressBar = [this.padding[0], this.height-this.padding[3]-this.progressBarHeight, this.width-this.padding[0]-this.padding[2], this.progressBarHeight];


		this.COLOR1 = "#00AAAAFF";
		this.COLOR2 = "#FF6666FF";
		this.fillColor = "#00AAAAFF";
		this.strokeColor = "#909090FF";
		this.lineColor = "#000000FF";

		this.RADIUS = 5;
		this.OFFSET = -10;

		this.preMouseX = 0;
		this.canvas.wyslider = this;
		this.canvas.onmousedown = function(event) {
			event = event || window.event;
			var x = event.offsetX;
			var y = event.offsetY;
			this.wyslider.onMouseDown(x, y);
		}
		this.canvas.onmouseup = function(event) {
			event = event || window.event;
			var x = event.offsetX;
			var y = event.offsetY;
			this.wyslider.onMouseUp(x, y);
		}
		this.canvas.onmousemove = function(event) {
			event = event || window.event;
			var x = event.offsetX;
			var y = event.offsetY;
			this.wyslider.onMouseMove(x, y);
		}
		this.canvas.onmouseleave = function(event) {
			event = event || window.event;
			var x = event.offsetX;
			var y = event.offsetY;
			this.wyslider.onMouseUp(x, y);
		}
		this.valueChangedListener = [];
	}
	onMouseDown(x, y) {
		var y_pos = this.progressBar[1]+this.OFFSET;

		this.selectedIndex = -1;
		if(!this.selectable) return;

		if(this._dist(x, y, this._calcX(this.cur), y_pos) < this.RADIUS+1) {
			this.selectedIndex = 0;
		} else if(this._dist(x, y, this._calcX(this.left), y_pos) < this.RADIUS+1) {
			this.selectedIndex = 1;
		} else if(this._dist(x, y, this._calcX(this.right), y_pos) < this.RADIUS+1) {
			this.selectedIndex = 2;
		}
		if(this.selectedIndex >= 0) {
			this.preMouseX = x;
			this.curHover = false;
			this.leftHover = false;
			this.rightHover = false;
		}
		this.paint();
	}
	onMouseUp(x, y) {
		this.selectedIndex = -1;
		this.onMouseMove(x, y);
		if(!this.curHover && !this.leftHover && !this.rightHover) this.paint();
	}
	onMouseMove(x, y) {
		if(!this.selectable) {
			this.selectedIndex = -1;
			return;
		}
		if(this.selectedIndex >= 0) {
			this.preMouseX = x;
			var valueChange = false;
			if(this.selectedIndex == 0) {
				valueChange = this.setCurrent(this._calcXX(x));
			} else if(this.selectedIndex == 1) {
				valueChange = this.setLeft(this._calcXX(x));
				if(this.left > this.right) {
					var tmp = this.right;
					this.right = this.left;
					this.left = tmp;
					this.selectedIndex = 2;
				}
			} else if(this.selectedIndex == 2) {
				valueChange = this.setRight(this._calcXX(x));
				if(this.right < this.left) {
					var tmp = this.right;
					this.right = this.left;
					this.left = tmp;
					this.selectedIndex = 1;
				}
			}
			if(valueChange) {
				this._onValueChanged();
			}
			return;
		}
		var y_pos = this.progressBar[1]+this.OFFSET;
		var flag = [false, false, false];
		if(this._dist(x, y, this._calcX(this.cur), y_pos) < this.RADIUS+1) {
			flag[0] = true;
		} else if(this._dist(x, y, this._calcX(this.left), y_pos) < this.RADIUS+1) {
			flag[1] = true;
		} else if(this._dist(x, y, this._calcX(this.right), y_pos) < this.RADIUS+1) {
			flag[2] = true;
		}
		var ref = (this.curHover != flag[0]) || (this.leftHover != flag[1]) || (this.rightHover != flag[2]);
		this.curHover = flag[0];
		this.leftHover = flag[1];
		this.rightHover = flag[2];

		if(ref) this.paint();
	}
	_onValueChanged() {
		for(var func of this.valueChangedListener) {
			try {
				func(this.cur, this.left, this.right);
			} catch(err) {
				console.log(err);
			}
		}
	}
	setPadding(left, top, right, bottom) {
		if(!left) return;
		this.padding = [left, top || left, right || left, bottom || top || left];
		this.progressBar = [this.padding[0], this.height-this.padding[3]-this.progressBarHeight, this.width-this.padding[0]-this.padding[2], this.progressBarHeight];
	}
	getCurrent() {
		return this.cur;
	}
	getLeft() {
		return this.left;
	}
	getRight() {
		return this.right;
	}
	getMin() {
		return this.min;
	}
	getMax() {
		return this.max;
	}
	setCurrent(v) {
		if(v < this.min) v = this.min;
		if(v > this.max) v = this.max;
		v = this._fixValueWithSep(v);
		var res = false;
		if(v != this.cur) {
			res = true;
		}
		this.cur = v;
		this.paint();
		return res;
	}
	setLeft(v) {
		if(v < this.min) v = this.min;
		if(v > this.max) v = this.max;
		v = this._fixValueWithSep(v);
		var res = false;
		if(v != this.left) {
			res = true;
		}
		this.left = v;
		this.paint();
		return res;
	}
	setRight(v) {
		if(v < this.min) v = this.min;
		if(v > this.max) v = this.max;
		v = this._fixValueWithSep(v);
		var res = false;
		if(v != this.right) {
			res = true;
		}
		this.right = v;
		this.paint();
		return res;
	}
	setSelectable(flag) {
		this.selectable = Boolean(flag);
	}
	addValueChangedListener(func) {
		this.valueChangedListener.push(func);
	}
	setProgressBar(x, y, w, h) {
		this.progressBar = [x, y, w, h];
	}
	load() {
		this.paint();
	}
	paint() {
		this.ctx.clearRect(0, 0, this.width, this.height);
		// this.ctx.fillStyle = "skyblue";
		// this.ctx.fillRect(0, 0, this.width, this.height);

		this._drawRect.apply(this, this.progressBar);

		var y_pos = this.progressBar[1]+this.OFFSET;
		this._drawSide(this._calcX(this.left), y_pos);
		this._drawSide(this._calcX(this.right), y_pos, true);
		this._drawCircle(this._calcX(this.cur), y_pos, this.RADIUS);
		
		this.ctx.fillStyle = "#000000FF";
		const TEXT_OFFSET = 5;
		this.ctx.fillText("" + this.left, this._calcX(this.left) - TEXT_OFFSET, y_pos - 10);
		this.ctx.fillText("" + this.right, this._calcX(this.right) - TEXT_OFFSET, y_pos - 10);
		this.ctx.fillText("" + this.cur, this._calcX(this.cur) - TEXT_OFFSET, y_pos - 10);
	}
	_dist(x1, y1, x2, y2) {
		var dx = x1 - x2;
		var dy = y1 - y2;
		return Math.sqrt(dx * dx + dy * dy);
	}
	_fixValueWithSep(x) {
		if(this.sep && this.sep > 1) {
			var xx = parseInt((x - this.min) / this.sep) * this.sep + this.min;
			if(xx != x) {
				if(x - xx > (xx+this.sep-x)) {
					xx += this.sep;
				}
			}
			return xx;
		}
		return x;
	}
	_calcX(x) { // real
		return parseInt(this.progressBar[0] + this.progressBar[2]*(x-this.min)/(this.max-this.min));
	}
	_calcXX(x) { // value between [min, max]
		x = parseInt(this.min + (this.max-this.min)*(x-this.progressBar[0])/this.progressBar[2]);
		if(x < this.min) x = this.min;
		if(x > this.max) x = this.max;
		return x;
	}
	_drawRect(x, y, w, h) {
		this.ctx.fillStyle = this.COLOR1;
		this.ctx.fillRect(x+1, y+1, w-2, h-2);
		this.ctx.strokeStyle = this.strokeColor;
		this.ctx.strokeRect(x, y, w, h);
	}
	_drawCircle(x, y, r) {
		this.ctx.beginPath();
		this.ctx.fillStyle = (this.selectedIndex == 0 || this.curHover) ? this.COLOR2 : this.COLOR1;
		this.ctx.arc(x, y, r, 0, 2*Math.PI);
		this.ctx.fill();
		this.ctx.strokeStyle = this.strokeColor;
		this.ctx.stroke();

		this.ctx.beginPath();
		this.ctx.strokeStyle = this.lineColor;
		this.ctx.moveTo(x, y+r);
		this.ctx.lineTo(x, this.progressBar[1]+this.progressBarHeight);
		this.ctx.stroke();
	}
	_drawSide(x, y, right) {
		var DX = this.RADIUS+1;
		this.ctx.beginPath();
		if(right) this.ctx.fillStyle = (this.selectedIndex == 2 || this.rightHover) ? this.COLOR2 : this.COLOR1;
		else this.ctx.fillStyle = (this.selectedIndex == 1 || this.leftHover) ? this.COLOR2 : this.COLOR1;
		
		this.ctx.moveTo(x, y-DX);
		this.ctx.lineTo(x, y+DX);
		if(right) this.ctx.lineTo(x+DX, y);
		else this.ctx.lineTo(x-DX, y);
		
		this.ctx.fill();
		this.ctx.strokeStyle = this.strokeColor;
		this.ctx.stroke();

		this.ctx.beginPath();
		this.ctx.strokeStyle = this.lineColor;
		this.ctx.moveTo(x, y+DX);
		this.ctx.lineTo(x, this.progressBar[1]+this.progressBarHeight);
		this.ctx.stroke();
	}
}
