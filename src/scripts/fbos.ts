import { regl } from "./canvas";
import * as CONSTANTS from "./constants";

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
        },
    };
}

function createFbo(filter) {
    let tex = regl.texture({
        width: window.innerWidth >> CONSTANTS.TEXTURE_DOWNSAMPLE,
        height: window.innerHeight >> CONSTANTS.TEXTURE_DOWNSAMPLE,
        min: filter,
        mag: filter,
        type: "float",
        wrap:"clamp"
    });
    window.addEventListener("resize", () => {
        tex.resize(window.innerWidth >> CONSTANTS.TEXTURE_DOWNSAMPLE, window.innerHeight >> CONSTANTS.TEXTURE_DOWNSAMPLE);
    });
    return regl.framebuffer({
        color: tex,
        depthStencil: false,
    });
}

export const velocity = doubleFbo("linear");
export const density = doubleFbo("linear");
export const pressure = doubleFbo("nearest");
export const divergenceTex = createFbo("nearest");

export const ATex = doubleFbo("linear");
export const BTex = doubleFbo("linear");
export const CTex = doubleFbo("linear");
