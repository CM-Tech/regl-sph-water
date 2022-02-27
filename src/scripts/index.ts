// import "zenscroll";
import { regl } from "./canvas";
import * as config from "./constants";
import { fullscreen, update, display, drawLogo, createSplat } from "./shaders";

window.addEventListener('load',()=>
regl.frame(() => {
    // const rrrr=()=>{
    fullscreen(() => {
        // if (window.scrollY < window.innerHeight / 2) drawLogo(1.0 - config.DENSITY_DISSIPATION);
        // if (pointer.moved) {
            createSplat(pointer.x, pointer.y, Math.min(Math.max(pointer.dx/10,-1),1), Math.min(Math.max(pointer.dy/10,-1),1), pointer.color, config.SPLAT_RADIUS);
            // pointer.moved = false;
        // }
        update(config);
        display();
    });
//    setTimeout(rrrr,0)
// }
}));

let pointer = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    moved: false,
    color: [0.5, 0.66, 1],
};
document.addEventListener("mousemove", (e) => {
    pointer.moved = true;
    pointer.dx = (e.clientX - pointer.x) * 10;
    pointer.dy = (e.clientY - pointer.y) * 10;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
});
document.addEventListener("touchmove", (e) => {
    pointer.moved = true;
    pointer.dx = (e.changedTouches[0].clientX - pointer.x) * 10;
    pointer.dy = (e.changedTouches[0].clientY - pointer.y) * 10;
    pointer.x = e.changedTouches[0].clientX;
    pointer.y = e.changedTouches[0].clientY;
});
document.addEventListener("touchstart", (e) => {
    pointer.moved = true;
    pointer.dx = (e.changedTouches[0].clientX - pointer.x) * 10;
    pointer.dy = (e.changedTouches[0].clientY - pointer.y) * 10;
    pointer.x = e.changedTouches[0].clientX;
    pointer.y = e.changedTouches[0].clientY;
});
document.addEventListener("touchend", (e) => {
    pointer.moved = true;
    pointer.dx = (e.changedTouches[0].clientX - pointer.x) * 10;
    pointer.dy = (e.changedTouches[0].clientY - pointer.y) * 10;
    pointer.x = e.changedTouches[0].clientX;
    pointer.y = e.changedTouches[0].clientY;
});
/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
 function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r,g,b];
}
document.addEventListener("mousedown", () => {
    pointer.color = hslToRgb(Math.random(),1,0.5);
});

// rrrr();