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
function hslToRgb(h, s, l) {
  var r, g, b;
  if (s == 0) {
    r = g = b = l;
  } else {
    var hue2rgb = function hue2rgb2(p2, q2, t) {
      if (t < 0)
        t += 1;
      if (t > 1)
        t -= 1;
      if (t < 1 / 6)
        return p2 + (q2 - p2) * 6 * t;
      if (t < 1 / 2)
        return q2;
      if (t < 2 / 3)
        return p2 + (q2 - p2) * (2 / 3 - t) * 6;
      return p2;
    };
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [r, g, b];
}
document.addEventListener("mousedown", () => {
  pointer.color = hslToRgb(Math.random(), 1, 0.5);
});
