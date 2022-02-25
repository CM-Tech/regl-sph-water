import {regl} from "./canvas.js";
import {TEXTURE_DOWNSAMPLE} from "./constants.js";
import {AXT, AVT, AMT, BXT, BVT, BMT, ATex, BTex, CTex} from "./fbos.js";
import projectShader from "../shaders/project.js";
import splatShader from "../shaders/splat.js";
import commonShader from "../shaders/common.js";
import AShader from "../shaders/A.js";
import BShader from "../shaders/B.js";
import CShader from "../shaders/C.js";
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
const splat = regl({
  frag: splatShader,
  framebuffer: regl.prop("framebuffer"),
  uniforms: {
    uTarget: regl.prop("uTarget"),
    aspectRatio: ({viewportWidth, viewportHeight}) => viewportWidth / viewportHeight,
    point: regl.prop("point"),
    color: regl.prop("color"),
    radius: regl.prop("radius")
  },
  viewport
});
const ACalc = regl({
  frag: commonShader + "\n" + AShader,
  framebuffer: regl.prop("framebuffer"),
  uniforms: {
    iFrame: regl.prop("iFrame"),
    iTime: regl.prop("iTime"),
    iMouse: regl.prop("iMouse"),
    dt: regl.prop("dt"),
    iChannel0: () => BTex.read,
    iChannel1: () => BTex.read,
    iChannel2: () => BTex.read,
    XT: () => BXT.read,
    VT: () => BVT.read,
    MT: () => BMT.read,
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
    iChannel0: () => ATex.read,
    iChannel1: () => ATex.read,
    iChannel2: () => ATex.read,
    XT: () => AXT.read,
    VT: () => AVT.read,
    MT: () => AMT.read,
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
    iChannel0: () => ATex.read,
    iChannel1: () => ATex.read,
    iChannel2: () => ATex.read,
    XT: () => AXT.read,
    VT: () => AVT.read,
    MT: () => AMT.read,
    tar: regl.prop("tar"),
    texelSize
  },
  viewport
});
export function createSplat(x, y, dx, dy, color, radius) {
}
export function drawLogo(dissipation) {
}
let iFrame = 0;
let iTime = 0;
let timeStart = window.performance.now();
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
    iChannel0: () => ATex.read,
    iChannel1: () => CTex.read,
    iChannel2: () => BTex.read,
    XT: () => AXT.read,
    VT: () => AVT.read,
    MT: () => AMT.read,
    tar: regl.prop("tar"),
    texelSize
  }
});
export const display = () => {
  return iFrame % 2 == 0 ? 1 : displayU({iFrame, iTime, iMouse});
};
export const update = (config) => {
  let iTimeS = (window.performance.now() - timeStart) / 1e3;
  let r = 0;
  let framesTodo = lastFrames / (iTimeS - lastUpdate) * (1 / 60);
  lastUpdate = iTimeS;
  framesTodo = framesTodo * 0.5 + lastFrames * 0.5;
  if (!(framesTodo < 100)) {
    framesTodo = 100;
  }
  if (!(framesTodo > 1)) {
    framesTodo = 1;
  }
  framesTodo = 16;
  while ((iTime = (window.performance.now() - timeStart) / 1e3) - iTimeS < 1 / 60 && r < framesTodo || r < 1) {
    r += 1;
    let dt = Math.min(1 / Math.max(framesTodo, 1) * 16, 1) * 0.5;
    ACalc({framebuffer: AXT.write, iFrame, iTime, iMouse, dt, tar: 0});
    BCalc({framebuffer: BXT.write, iFrame, iTime, iMouse, dt, tar: 0});
    ACalc({framebuffer: AVT.write, iFrame, iTime, iMouse, dt, tar: 1});
    BCalc({framebuffer: BVT.write, iFrame, iTime, iMouse, dt, tar: 1});
    ACalc({framebuffer: AMT.write, iFrame, iTime, iMouse, dt, tar: 2});
    BCalc({framebuffer: BMT.write, iFrame, iTime, iMouse, dt, tar: 2});
    CCalc({framebuffer: CTex.write, iFrame, iTime, iMouse, dt, tar: 2});
    ATex.swap();
    BTex.swap();
    CTex.swap();
    AXT.swap();
    AVT.swap();
    AMT.swap();
    BXT.swap();
    BVT.swap();
    BMT.swap();
    iFrame += 1;
  }
  lastFrames = framesTodo;
};
