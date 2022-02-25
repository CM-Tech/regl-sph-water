import {regl} from "./canvas.js";
import * as CONSTANTS from "./constants.js";
function doubleFbo(filter) {
  let fbos = [createFbo(filter), createFbo(filter)];
  return {
    get read() {
      return fbos[0];
    },
    get write() {
      return fbos[1];
    },
    swap() {
      fbos.reverse();
    }
  };
}
function createFbo(filter) {
  let tex = regl.texture({
    width: window.innerWidth >> CONSTANTS.TEXTURE_DOWNSAMPLE,
    height: window.innerHeight >> CONSTANTS.TEXTURE_DOWNSAMPLE,
    min: filter,
    mag: filter,
    type: "float",
    wrap: "clamp"
  });
  window.addEventListener("resize", () => {
    tex.resize(window.innerWidth >> CONSTANTS.TEXTURE_DOWNSAMPLE, window.innerHeight >> CONSTANTS.TEXTURE_DOWNSAMPLE);
  });
  return regl.framebuffer({
    color: tex,
    depthStencil: false
  });
}
export const AXT = doubleFbo("linear");
export const AMT = doubleFbo("linear");
export const AVT = doubleFbo("linear");
export const BXT = doubleFbo("linear");
export const BMT = doubleFbo("linear");
export const BVT = doubleFbo("linear");
export const ATex = doubleFbo("linear");
export const BTex = doubleFbo("linear");
export const CTex = doubleFbo("linear");
