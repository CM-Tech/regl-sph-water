import {regl} from "./canvas.js";
import {TEXTURE_DOWNSAMPLE} from "./constants.js";
import {velocity, density, pressure, divergenceTex, ATex, BTex, CTex} from "./fbos.js";
import projectShader from "../shaders/project.js";
import splatShader from "../shaders/splat.js";
import advectShader from "../shaders/advect.js";
import divergenceShader from "../shaders/divergence.js";
import clearShader from "../shaders/clear.js";
import gradientSubtractShader from "../shaders/gradientSubtract.js";
import jacobiShader from "../shaders/jacobi.js";
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
    texelSize
  },
  viewport
});
const advect = regl({
  frag: advectShader,
  framebuffer: regl.prop("framebuffer"),
  uniforms: {
    timestep: 0.017,
    dissipation: regl.prop("dissipation"),
    color: regl.prop("color"),
    x: regl.prop("x"),
    velocity: () => velocity.read,
    texelSize
  },
  viewport
});
const divergence = regl({
  frag: divergenceShader,
  framebuffer: divergenceTex,
  uniforms: {
    velocity: () => velocity.read,
    texelSize
  },
  viewport
});
const clear = regl({
  frag: clearShader,
  framebuffer: () => pressure.write,
  uniforms: {
    pressure: () => pressure.read,
    dissipation: regl.prop("dissipation")
  },
  viewport
});
const gradientSubtract = regl({
  frag: gradientSubtractShader,
  framebuffer: () => velocity.write,
  uniforms: {
    pressure: () => pressure.read,
    velocity: () => velocity.read,
    texelSize
  },
  viewport
});
const jacobi = regl({
  frag: jacobiShader,
  framebuffer: () => pressure.write,
  uniforms: {
    pressure: () => pressure.read,
    divergence: () => divergenceTex,
    texelSize
  },
  viewport
});
export function createSplat(x, y, dx, dy, color, radius) {
  splat({
    framebuffer: velocity.write,
    uTarget: velocity.read,
    point: [x / window.innerWidth, 1 - y / window.innerHeight],
    radius,
    color: [dx, -dy, 1]
  });
  velocity.swap();
  splat({
    framebuffer: density.write,
    uTarget: density.read,
    point: [x / window.innerWidth, 1 - y / window.innerHeight],
    radius,
    color
  });
  density.swap();
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
  framesTodo = 1;
  while ((iTime = (window.performance.now() - timeStart) / 1e3) - iTimeS < 1 / 180 && r < framesTodo || r < 1) {
    r += 1;
    let dt = Math.min(1 / Math.max(framesTodo, 1), 1);
    ACalc({framebuffer: ATex.write, iFrame, iTime, iMouse, dt});
    BCalc({framebuffer: BTex.write, iFrame, iTime, iMouse, dt});
    CCalc({framebuffer: CTex.write, iFrame, iTime, iMouse, dt});
    ATex.swap();
    BTex.swap();
    CTex.swap();
    iFrame += 1;
  }
  lastFrames = framesTodo;
};
