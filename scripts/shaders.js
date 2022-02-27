import {regl} from "./canvas.js";
import {TEXTURE_DOWNSAMPLE} from "./constants.js";
import {AXT_X, AVT_X, AMT, ACT, AXT_Y, AVT_Y, CTex} from "./fbos.js";
import projectShader from "../shaders/project.js";
import commonShader from "../shaders/common.js";
import AShader from "../shaders/A.js";
import BShader from "../shaders/B.js";
import CShader from "../shaders/C.js";
import SShader from "../shaders/S.js";
import display2Shader from "../shaders/display2.js";
const texelSize = ({viewportWidth, viewportHeight}) => [1 / viewportWidth, 1 / viewportHeight];
const viewport = ({viewportWidth, viewportHeight}) => ({
  x: 0,
  y: 0,
  width: viewportWidth >> TEXTURE_DOWNSAMPLE,
  height: viewportHeight >> TEXTURE_DOWNSAMPLE
});
export const fullscreen = regl({
  vert: projectShader,
  attributes: {
    points: [1, 1, 1, -1, -1, -1, 1, 1, -1, -1, -1, 1]
  },
  count: 6
});
const ACalc = regl({
  frag: commonShader + "\n" + AShader,
  framebuffer: regl.prop("framebuffer"),
  uniforms: {
    iFrame: regl.prop("iFrame"),
    iTime: regl.prop("iTime"),
    iMouse: regl.prop("iMouse"),
    dt: regl.prop("dt"),
    X_XT: () => AXT_X.read,
    X_YT: () => AXT_Y.read,
    V_XT: () => AVT_X.read,
    V_YT: () => AVT_Y.read,
    MT: () => AMT.read,
    CT: () => ACT.read,
    tar: regl.prop("tar"),
    texelSize
  },
  viewport
});
const BCalc = regl({
  frag: commonShader + "\n" + BShader,
  framebuffer: regl.prop("framebuffer"),
  uniforms: {
    iFrame: regl.prop("iFrame"),
    iTime: regl.prop("iTime"),
    iMouse: regl.prop("iMouse"),
    dt: regl.prop("dt"),
    X_XT: () => AXT_X.read,
    X_YT: () => AXT_Y.read,
    V_XT: () => AVT_X.read,
    V_YT: () => AVT_Y.read,
    MT: () => AMT.read,
    CT: () => ACT.read,
    tar: regl.prop("tar"),
    texelSize
  },
  viewport
});
const CCalc = regl({
  frag: commonShader + "\n" + CShader,
  framebuffer: regl.prop("framebuffer"),
  uniforms: {
    iFrame: regl.prop("iFrame"),
    iTime: regl.prop("iTime"),
    iMouse: regl.prop("iMouse"),
    dt: regl.prop("dt"),
    X_XT: () => AXT_X.read,
    X_YT: () => AXT_Y.read,
    V_XT: () => AVT_X.read,
    V_YT: () => AVT_Y.read,
    MT: () => AMT.read,
    CT: () => ACT.read,
    tar: regl.prop("tar"),
    texelSize
  },
  viewport
});
const SCalc = regl({
  frag: commonShader + "\n" + SShader,
  framebuffer: regl.prop("framebuffer"),
  uniforms: {
    iFrame: regl.prop("iFrame"),
    iTime: regl.prop("iTime"),
    iMouse: regl.prop("iMouse"),
    dt: regl.prop("dt"),
    X_XT: () => AXT_X.read,
    X_YT: () => AXT_Y.read,
    V_XT: () => AVT_X.read,
    V_YT: () => AVT_Y.read,
    MT: () => AMT.read,
    CT: () => ACT.read,
    tar: regl.prop("tar"),
    splatCenter: regl.prop("point"),
    splatM: regl.prop("color"),
    splatV: regl.prop("vel"),
    radius: regl.prop("radius"),
    texelSize
  },
  viewport
});
export function createSplat(x, y, dx, dy, color, radius) {
  let q = {
    point: [x / window.innerWidth, 1 - y / window.innerHeight],
    radius,
    color,
    vel: [dx, -dy]
  };
  SCalc({framebuffer: AXT_X.write, iFrame, iTime, iMouse, dt: 1, tar: 0, ...q});
  SCalc({framebuffer: AVT_X.write, iFrame, iTime, iMouse, dt: 1, tar: 2, ...q});
  SCalc({framebuffer: AMT.write, iFrame, iTime, iMouse, dt: 1, tar: 4, ...q});
  SCalc({framebuffer: ACT.write, iFrame, iTime, iMouse, dt: 1, tar: 5, ...q});
  AXT_X.swap();
  AVT_X.swap();
  AMT.swap();
  ACT.swap();
}
export function drawLogo(dissipation) {
}
let iFrame = 0;
let iTime = 0;
let timeStarted = false;
let timeStart = -1;
let lastUpdate = -1;
let lastFrames = 1;
let iMouse = [0, 0, 0, 0];
const displayU = regl({
  frag: commonShader + "\n" + display2Shader,
  uniforms: {
    iFrame: regl.prop("iFrame"),
    iTime: regl.prop("iTime"),
    iMouse: regl.prop("iMouse"),
    dt: regl.prop("dt"),
    iChannel1: () => CTex.read,
    X_XT: () => AXT_X.read,
    X_YT: () => AXT_Y.read,
    V_XT: () => AVT_X.read,
    V_YT: () => AVT_Y.read,
    MT: () => AMT.read,
    CT: () => ACT.read,
    tar: regl.prop("tar"),
    texelSize
  }
});
export const display = () => {
  return displayU({iFrame, iTime, iMouse});
};
let fT = 1;
let fTC = 30;
let inRun = false;
export const update = (config) => {
  if (inRun) {
    return;
  }
  inRun = true;
  if (!timeStarted) {
    timeStart = window.performance.now();
  }
  let iTimeS = (window.performance.now() - timeStart) / 1e3;
  if (timeStarted && iTimeS - lastUpdate < 1) {
    fT *= 0.9;
    fTC *= 0.9;
    fT += (iTimeS - lastUpdate) / lastFrames;
    fTC += 1;
  }
  timeStarted = true;
  let r = 0;
  let FPS_T = 30;
  let framesTodo = Math.floor(1 / FPS_T * (fTC / fT));
  lastUpdate = iTimeS;
  let mxDT = 1;
  let mmm = 16;
  if (!(framesTodo < mmm)) {
    framesTodo = mmm;
  }
  if (!(framesTodo > 1)) {
    framesTodo = 1;
  }
  let dF = 0;
  let dt = Math.min(8 / Math.max(framesTodo, 1), mxDT);
  while ((iTime = (window.performance.now() - timeStart) / 1e3) - iTimeS < 1 / FPS_T && r < framesTodo || r < 1) {
    dF += 1;
    r += 1;
    ACalc({framebuffer: AXT_X.write, iFrame, iTime, iMouse, dt, tar: 0});
    ACalc({framebuffer: AVT_X.write, iFrame, iTime, iMouse, dt, tar: 2});
    ACalc({framebuffer: AMT.write, iFrame, iTime, iMouse, dt, tar: 4});
    ACalc({framebuffer: ACT.write, iFrame, iTime, iMouse, dt, tar: 5});
    AXT_X.swap();
    AVT_X.swap();
    AMT.swap();
    ACT.swap();
    BCalc({framebuffer: AXT_X.write, iFrame, iTime, iMouse, dt, tar: 0});
    BCalc({framebuffer: AVT_X.write, iFrame, iTime, iMouse, dt, tar: 2});
    BCalc({framebuffer: AMT.write, iFrame, iTime, iMouse, dt, tar: 4});
    BCalc({framebuffer: ACT.write, iFrame, iTime, iMouse, dt, tar: 5});
    AXT_X.swap();
    AVT_X.swap();
    AMT.swap();
    ACT.swap();
    iFrame += 1;
  }
  CCalc({framebuffer: CTex.write, iFrame, iTime, iMouse, dt: 1, tar: 2});
  CTex.swap();
  lastFrames = dF;
  inRun = false;
};
window.addEventListener("mousemove", (e) => {
  iMouse[0] = e.clientX / window.innerWidth;
  iMouse[1] = 1 - e.clientY / window.innerHeight;
});
