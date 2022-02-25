// import "zenscroll";
import { regl } from "./canvas";
import * as config from "./constants";
import { fullscreen, update, display, drawLogo, createSplat } from "./shaders";

regl.frame(() => {
    // const rrrr=()=>{
    fullscreen(() => {
        // if (window.scrollY < window.innerHeight / 2) drawLogo(1.0 - config.DENSITY_DISSIPATION);
        // if (pointer.moved) {
            createSplat(pointer.x, pointer.y, Math.min(Math.max(pointer.dx/100,-1),1), Math.min(Math.max(pointer.dy/100,-1),1), pointer.color, config.SPLAT_RADIUS);
            // pointer.moved = false;
        // }
        update(config);
        display();
    });
//    setTimeout(rrrr,0)
// }
});

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
document.addEventListener("mousedown", () => {
    pointer.color = [Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2];
});

// rrrr();