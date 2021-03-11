precision highp float;
precision mediump sampler2D;

varying vec2 coords;
uniform vec2 texelSize;
uniform sampler2D pressure;
uniform sampler2D velocity;

void main() {
  float pL = texture2D(pressure, coords - vec2(texelSize.x, 0.0)).x;
  float pR = texture2D(pressure, coords + vec2(texelSize.x, 0.0)).x;
  float pB = texture2D(pressure, coords - vec2(0.0, texelSize.y)).x;
  float pT = texture2D(pressure, coords + vec2(0.0, texelSize.y)).x;
  vec2 v = texture2D(velocity, coords).xy;
  float grav=10.0;
  float thre=0.1;
  if(coords.y<thre){
    grav=-100.0*(thre-coords.y)/thre;
  }
  gl_FragColor = vec4(v - vec2(pR - pL, pT - pB)+vec2(0.0,-grav), 0.0, 1.0);
}
