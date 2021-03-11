import createRegl from "../snowpack_meta/pkg/regl.js";
const c = document.getElementById("c");
function resizeHandler() {
  c.width = window.innerWidth;
  c.height = window.innerHeight;
}
window.addEventListener("resize", resizeHandler);
resizeHandler();
export const regl = createRegl({
  attributes: {
    alpha: false,
    depth: false,
    stencil: false,
    antialias: false
  },
  canvas: c,
  extensions: ["OES_texture_float", "OES_texture_float_linear", "OES_texture_half_float", "OES_texture_half_float_linear"]
});
