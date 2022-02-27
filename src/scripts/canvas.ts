import createRegl from 'regl';

const c = document.getElementById("c") as HTMLCanvasElement;
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
        antialias: false,
    },
    pixelRatio:1,
    canvas: c,
    // extensions: ["OES_texture_float","OES_texture_float_linear","OES_texture_half_float", "OES_texture_half_float_linear"],
});
