import {vec2, vec4, mat4} from 'gl-matrix';
import Drawable from './Drawable';
import {gl} from '../../globals';

var activeProgram: WebGLProgram = null;

export class Shader {
  shader: WebGLShader;

  constructor(type: number, source: string) {
    this.shader = gl.createShader(type);
    gl.shaderSource(this.shader, source);
    gl.compileShader(this.shader);

    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(this.shader);
    }
  }
};

class ShaderProgram {
  prog: WebGLProgram;

  attrPos: number;
  attrNor: number;
  attrCol: number;
  attrTranslate: number; // Used in the vertex shader during instanced rendering to offset the vertex positions to the particle's drawn position.
  attrRotate: number;
  attrScale: number;
  attrUV: number;

  id: number;

  unifModel: WebGLUniformLocation;
  unifModelInvTr: WebGLUniformLocation;
  unifViewProj: WebGLUniformLocation;
  unifColor: WebGLUniformLocation;
  unifPlanePos: WebGLUniformLocation;
  unifFire: WebGLUniformLocation;
  unifDaytime: WebGLUniformLocation;

  constructor(shaders: Array<Shader>, id: number) {
    this.prog = gl.createProgram();

    this.id = id;

    for (let shader of shaders) {
      gl.attachShader(this.prog, shader.shader);
    }
    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(this.prog);
    }

    this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");
    this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
    this.attrCol = gl.getAttribLocation(this.prog, "vs_Col");
    this.attrTranslate = gl.getAttribLocation(this.prog, "vs_Translate");
    this.attrRotate = gl.getAttribLocation(this.prog, "vs_Rotate");
    this.attrScale = gl.getAttribLocation(this.prog, "vs_Scale");
    this.attrUV = gl.getAttribLocation(this.prog, "vs_UV");
    this.unifModel      = gl.getUniformLocation(this.prog, "u_Model");
    this.unifModelInvTr = gl.getUniformLocation(this.prog, "u_ModelInvTr");
    this.unifViewProj   = gl.getUniformLocation(this.prog, "u_ViewProj");
    this.unifPlanePos   = gl.getUniformLocation(this.prog, "u_PlanePos");
    this.unifFire = gl.getUniformLocation(this.prog, "u_Fire");
    this.unifDaytime = gl.getUniformLocation(this.prog, "u_Daytime");
  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  setModelMatrix(model: mat4) {
    this.use();
    if (this.unifModel !== -1) {
      gl.uniformMatrix4fv(this.unifModel, false, model);
    }

    if (this.unifModelInvTr !== -1) {
      let modelinvtr: mat4 = mat4.create();
      mat4.transpose(modelinvtr, model);
      mat4.invert(modelinvtr, modelinvtr);
      gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
    }
  }

  setViewProjMatrix(vp: mat4) {
    this.use();
    if (this.unifViewProj !== -1) {
      gl.uniformMatrix4fv(this.unifViewProj, false, vp);
    }
  }

  setPlanePos(pos: vec2) {
    this.use();
    if (this.unifPlanePos !== -1) {
      gl.uniform2fv(this.unifPlanePos, pos);
    }
  }

  setFireInfluence(fn: number) {
    this.use();
    if (this.unifFire !== -1) {
      gl.uniform1f(this.unifFire, fn);
    }
  }

  setTimeOfDay(t: number) {
    this.use();
    if (this.unifDaytime !== -1) {
      gl.uniform1f(this.unifDaytime, t);
    }
  }

  draw(d: Drawable) {
    this.use();

    if (this.id == 2) {
      if (this.attrPos != -1 && d.bindPos()) {
        gl.enableVertexAttribArray(this.attrPos);
        gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.attrPos, 0); // Advance 1 index in pos VBO for each vertex
      }

      if (this.attrNor != -1 && d.bindNor()) {
        gl.enableVertexAttribArray(this.attrNor);
        gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.attrNor, 0); // Advance 1 index in nor VBO for each vertex
      }

      if (this.attrCol != -1 && d.bindCol()) {
        gl.enableVertexAttribArray(this.attrCol);
        gl.vertexAttribPointer(this.attrCol, 4, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.attrCol, 1); // Advance 1 index in col VBO for each drawn instance
      }

      if (this.attrTranslate != -1 && d.bindTranslate()) {
        gl.enableVertexAttribArray(this.attrTranslate);
        gl.vertexAttribPointer(this.attrTranslate, 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.attrTranslate, 1); // Advance 1 index in translate VBO for each drawn instance
      }

      if (this.attrUV != -1 && d.bindUV()) {
        gl.enableVertexAttribArray(this.attrUV);
        gl.vertexAttribPointer(this.attrUV, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.attrUV, 0); // Advance 1 index in pos VBO for each vertex
      }

      // TODO: Set up attribute data for additional instanced rendering data as needed
      if (this.attrRotate != -1 && d.bindRot()) {
        gl.enableVertexAttribArray(this.attrRotate);
        gl.vertexAttribPointer(this.attrRotate, 1, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.attrRotate, 1);
      }

      if (this.attrScale != -1 && d.bindScale()) {
        gl.enableVertexAttribArray(this.attrScale);
        gl.vertexAttribPointer(this.attrScale, 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.attrScale, 1);
      }

      d.bindIdx();
      // drawElementsInstanced uses the vertexAttribDivisor for each "in" variable to
      // determine how to link it to each drawn instance of the bound VBO.
      // For example, the index used to look in the VBO associated with
      // vs_Pos (attrPos) is advanced by 1 for each thread of the GPU running the
      // vertex shader since its divisor is 0.
      // On the other hand, the index used to look in the VBO associated with
      // vs_Translate (attrTranslate) is advanced by 1 only when the next instance
      // of our drawn object (in the base code example, the square) is processed
      // by the GPU, thus being the same value for the first set of four vertices,
      // then advancing to a new value for the next four, then the next four, and
      // so on.
      gl.drawElementsInstanced(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0, d.numInstances);

      if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
      if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
      if (this.attrCol != -1) gl.disableVertexAttribArray(this.attrCol);
      if (this.attrTranslate != -1) gl.disableVertexAttribArray(this.attrTranslate);
      if (this.attrUV != -1) gl.disableVertexAttribArray(this.attrUV);
      if (this.attrRotate != -1) gl.disableVertexAttribArray(this.attrRotate);
      if (this.attrScale != -1) gl.disableVertexAttribArray(this.attrScale);
    }
    else {
      if (this.attrPos != -1 && d.bindPos()) {
        gl.enableVertexAttribArray(this.attrPos);
        gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
      }
  
      if (this.attrNor != -1 && d.bindNor()) {
        gl.enableVertexAttribArray(this.attrNor);
        gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
      }
  
      d.bindIdx();
      gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);
  
      if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
      if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
    }
  }
};

export default ShaderProgram;
