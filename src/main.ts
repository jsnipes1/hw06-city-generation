import {vec2, vec3, mat4, quat} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import Plane from './geometry/Plane';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Mesh from './geometry/Mesh';
import {readTextFile} from './globals';
import {City, Building} from './City';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  'Load Scene': loadScene, // A function pointer, essentially
  timeOfDay: 0,
  fireNationAttack: 0,
};

let time : number = 0;
let square: Square;
let plane : Plane;
let city : City;
let buildings : Building[];
let road : Mesh;

let wPressed: boolean;
let aPressed: boolean;
let sPressed: boolean;
let dPressed: boolean;
let planePos: vec2;

function loadScene() {
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  plane = new Plane(vec3.fromValues(0,0,0), vec2.fromValues(100,100), 20);
  plane.create();

  // Create the city
  city = new City(20, 0.2);
  buildings = city.buildings;
  for (let i = 0; i < buildings.length; ++i) {
    buildings[i].create();
  }

  // Render the roads using instanced rendering
  let obj : string = readTextFile('../resources/road.obj');
  road = new Mesh(obj, vec3.fromValues(0, 0, 0));
  road.create();

  let roadTransfs : mat4[] = city.roadTransfs;
  let bOffsetArr = [];
  let bRotArr = [];
  let bScaleArr = [];
  let bColorArr = [];
  for (var i = 0; i < roadTransfs.length; ++i) {
    let curr : mat4 = roadTransfs[i];

    let t : vec3 = vec3.create(); 
    let r : quat = quat.create();
    mat4.getRotation(r, curr);
    let thetaZ = quat.getAxisAngle(vec3.fromValues(0, 1, 0), r);
    mat4.getTranslation(t, curr);
  
    bOffsetArr.push(t[0]);
    bOffsetArr.push(t[1]);
    bOffsetArr.push(t[2]);

    bRotArr.push(thetaZ);

    let s : vec3 = vec3.create();
    mat4.getScaling(s, curr);
    bScaleArr.push(s[0]);
    bScaleArr.push(s[1]);
    bScaleArr.push(s[2]);

    bColorArr.push(0.1);
    bColorArr.push(0.1);
    bColorArr.push(0.1);
    bColorArr.push(1.0); // Alpha
  }

  // Set up instanced rendering data arrays here.
  let bOffsets : Float32Array = new Float32Array(bOffsetArr);
  let bRots : Float32Array = new Float32Array(bRotArr);
  let bScales : Float32Array = new Float32Array(bScaleArr);
  let bColors : Float32Array = new Float32Array(bColorArr);
  road.setInstanceVBOs(bOffsets, bRots, bScales, bColors);
  road.setNumInstances(roadTransfs.length);

  wPressed = false;
  aPressed = false;
  sPressed = false;
  dPressed = false;
  planePos = vec2.fromValues(0,0);
}

function main() {
  window.addEventListener('keypress', function (e) {
    // console.log(e.key);
    switch(e.key) {
      case 'w':
      wPressed = true;
      break;
      case 'a':
      aPressed = true;
      break;
      case 's':
      sPressed = true;
      break;
      case 'd':
      dPressed = true;
      break;
    }
  }, false);

  window.addEventListener('keyup', function (e) {
    switch(e.key) {
      case 'w':
      wPressed = false;
      break;
      case 'a':
      aPressed = false;
      break;
      case 's':
      sPressed = false;
      break;
      case 'd':
      dPressed = false;
      break;
    }
  }, false);

  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'timeOfDay', 0, 23).step(1);
  gui.add(controls, 'fireNationAttack', 0, 100).step(1);

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 10, -20), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(164.0 / 255.0, 233.0 / 255.0, 1.0, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/terrain-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/terrain-frag.glsl')),
  ], 0);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ], 1);

  const instanced = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ], 2);

  function processKeyPresses() {
    let velocity: vec2 = vec2.fromValues(0,0);
    if(wPressed) {
      velocity[1] += 1.0;
    }
    if(aPressed) {
      velocity[0] += 1.0;
    }
    if(sPressed) {
      velocity[1] -= 1.0;
    }
    if(dPressed) {
      velocity[0] -= 1.0;
    }
    let newPos: vec2 = vec2.fromValues(0,0);
    vec2.add(newPos, velocity, planePos);
    lambert.setPlanePos(newPos);
    planePos = newPos;
  }

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    processKeyPresses();

    renderer.render(camera, lambert, [plane,], time);
    renderer.render(camera, lambert, buildings, time);
    renderer.render(camera, instanced, [road,], time);
    renderer.render(camera, flat, [square,], time);

    time++;

    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
