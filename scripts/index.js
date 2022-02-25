import {regl} from "./canvas.js";
import * as config from "./constants.js";
import {fullscreen, update, display, createSplat} from "./shaders.js";
regl.frame(() => {
  fullscreen(() => {
    createSplat(pointer.x, pointer.y, Math.min(Math.max(pointer.dx / 100, -1), 1), Math.min(Math.max(pointer.dy / 100, -1), 1), pointer.color, config.SPLAT_RADIUS);
    update(config);
    display();
  });
});
let pointer = {
  x: 0,
  y: 0,
  dx: 0,
  dy: 0,
  moved: false,
  color: [0.5, 0.66, 1]
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
