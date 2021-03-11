import {regl} from "./canvas.js";
import * as config from "./constants.js";
import {fullscreen, update, display} from "./shaders.js";
regl.frame(() => {
  fullscreen(() => {
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
document.addEventListener("mousedown", () => {
  pointer.color = [Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2];
});
