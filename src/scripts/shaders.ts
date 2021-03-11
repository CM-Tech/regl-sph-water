import { regl } from "./canvas";
import { TEXTURE_DOWNSAMPLE } from "./constants";
import { velocity, density, pressure, divergenceTex,ATex,BTex,CTex } from "./fbos";

import projectShader from "../shaders/project.vert";
import splatShader from "../shaders/splat.frag";
import logoShader from "../shaders/logo.frag";
import advectShader from "../shaders/advect.frag";
import divergenceShader from "../shaders/divergence.frag";
import clearShader from "../shaders/clear.frag";
import gradientSubtractShader from "../shaders/gradientSubtract.frag";
import jacobiShader from "../shaders/jacobi.frag";
import displayShader from "../shaders/display.frag";
import commonShader from "../shaders/common.frag";
import AShader from "../shaders/A.frag";
import BShader from "../shaders/B.frag";
import CShader from "../shaders/C.frag";
import display2Shader from "../shaders/display2.frag";

// import imgURL from "../public/images/logo.png";
const texelSize = ({ viewportWidth, viewportHeight }) => [1 / viewportWidth, 1 / viewportHeight];
const viewport = ({ viewportWidth, viewportHeight }) => ({
    x: 0,
    y: 0,
    width: viewportWidth >> TEXTURE_DOWNSAMPLE,
    height: viewportHeight >> TEXTURE_DOWNSAMPLE,
});

export const fullscreen = regl({
    vert: (projectShader),
    attributes: {
        points: [1, 1, 1, -1, -1, -1, 1, 1, -1, -1, -1, 1],
    },
    count: 6,
});

const splat = regl({
    frag: (splatShader),
    framebuffer: regl.prop("framebuffer"),
    uniforms: {
        uTarget: regl.prop("uTarget"),
        aspectRatio: ({ viewportWidth, viewportHeight }) => viewportWidth / viewportHeight,
        point: regl.prop("point"),
        color: regl.prop("color"),
        radius: regl.prop("radius"),
    },
    viewport,
});

// const img = new Image();
// img.src = imgURL;

// let logo;
// img.onload = () =>
//     (logo = regl({
//         frag: logoShader,
//         framebuffer: () => density.write,
//         uniforms: {
//             density: () => density.read,
//             image: regl.texture(img),
//             ratio: ({ viewportWidth, viewportHeight }) => {
//                 return viewportWidth > viewportHeight ? [viewportWidth / viewportHeight, 1.0] : [1.0, viewportHeight / viewportWidth];
//             },
//             dissipation: regl.prop("dissipation"),
//         },
//         viewport,
//     }));
const ACalc = regl({
    frag: (commonShader+"\n"+AShader),
    framebuffer: regl.prop("framebuffer"),
    uniforms: {
        iFrame:regl.prop("iFrame"),
        iTime:regl.prop("iTime"),
        iMouse:regl.prop("iMouse"),dt:regl.prop("dt"),
        iChannel0: () => BTex.read,
        iChannel1: () => BTex.read,
        iChannel2: () => BTex.read,
        texelSize,
    },
    viewport,
});
const BCalc = regl({
    frag: (commonShader+"\n"+BShader),
    framebuffer: regl.prop("framebuffer"),
    uniforms: {
        iFrame:regl.prop("iFrame"),
        iTime:regl.prop("iTime"),
        iMouse:regl.prop("iMouse"),dt:regl.prop("dt"),
        iChannel0: () => ATex.read,
        iChannel1: () => ATex.read,
        iChannel2: () => ATex.read,
        texelSize,
    },
    viewport,
});
const CCalc = regl({
    frag: (commonShader+"\n"+CShader),
    framebuffer: regl.prop("framebuffer"),
    uniforms: {
        iFrame:regl.prop("iFrame"),
        iTime:regl.prop("iTime"),
        iMouse:regl.prop("iMouse"),dt:regl.prop("dt"),
        iChannel0: () => ATex.read,
        iChannel1: () => ATex.read,
        iChannel2: () => ATex.read,
        texelSize,
    },
    viewport,
});
const advect = regl({
    frag: (advectShader),
    framebuffer: regl.prop("framebuffer"),
    uniforms: {
        timestep: 0.017,
        dissipation: regl.prop("dissipation"),
        color: regl.prop("color"),
        x: regl.prop("x"),
        velocity: () => velocity.read,
        texelSize,
    },
    viewport,
});
const divergence = regl({
    frag: (divergenceShader),
    framebuffer: divergenceTex,
    uniforms: {
        velocity: () => velocity.read,
        texelSize,
    },
    viewport,
});
const clear = regl({
    frag:( clearShader),
    framebuffer: () => pressure.write,
    uniforms: {
        pressure: () => pressure.read,
        dissipation: regl.prop("dissipation"),
    },
    viewport,
});
const gradientSubtract = regl({
    frag: (gradientSubtractShader),
    framebuffer: () => velocity.write,
    uniforms: {
        pressure: () => pressure.read,
        velocity: () => velocity.read,
        texelSize,
    },
    viewport,
});
const jacobi = regl({
    frag:( jacobiShader),
    framebuffer: () => pressure.write,
    uniforms: {
        pressure: () => pressure.read,
        divergence: () => divergenceTex,
        texelSize,
    },
    viewport,
});
// export const display = regl({
//     frag:( displayShader),
//     uniforms: {
//         density: () => density.read,
//     },
// });




export function createSplat(x, y, dx, dy, color, radius) {
    splat({
        framebuffer: velocity.write,
        uTarget: velocity.read,
        point: [x / window.innerWidth, 1 - y / window.innerHeight],
        radius,
        color: [dx, -dy, 1],
    });
    velocity.swap();

    splat({
        framebuffer: density.write,
        uTarget: density.read,
        point: [x / window.innerWidth, 1 - y / window.innerHeight],
        radius,
        color,
    });
    density.swap();
}
export function drawLogo(dissipation) {
    // if (logo) {
    //     logo({ dissipation });
    //     density.swap();
    // }
}
let iFrame=0;
let iTime=0;
let timeStart=window.performance.now();
let lastUpdate=-1;
let lastFrames=1;
let iMouse=[0,0,0,0];
const displayU=regl({
    frag: (commonShader+"\n"+display2Shader),
    // framebuffer: regl.prop("framebuffer"),
    uniforms: {
        iFrame:regl.prop("iFrame"),
        iTime:regl.prop("iTime"),
        iMouse:regl.prop("iMouse"),
        dt:regl.prop("dt"),
        iChannel0: () => ATex.read,
        iChannel1: () => CTex.read,
        iChannel2: () => BTex.read,
        texelSize,
    },
    // viewport,
});
export const display = ()=>{

    // iTime=(new Date().getTime()-timeStart)/1000;
    
    return iFrame%2==0?1:displayU({iFrame,iTime,iMouse});//FIXME:!
};
export const update = (config) => {
    let iTimeS=(window.performance.now()-timeStart)/1000;
    let r=0;
    let framesTodo=lastFrames/(iTimeS-lastUpdate)*(1/60);
    
    lastUpdate=iTimeS;
    framesTodo=framesTodo*0.5+lastFrames*0.5;
    if(!(framesTodo<100)){
        framesTodo=100;
    }
    if(!(framesTodo>1)){
        framesTodo=1;
    }
    framesTodo=1;
    while((((iTime=(window.performance.now()-timeStart)/1000)-iTimeS<1/180) && r<framesTodo) || r<1 ){
        // if(iFrame===0)console.log(r,"I",iTime)
        r+=1;
        let dt=Math.min(1/Math.max(framesTodo,1),1);
        // lastUpdate=iTime;
    ACalc({framebuffer:ATex.write,iFrame,iTime,iMouse,dt});
    BCalc({framebuffer:BTex.write,iFrame,iTime,iMouse,dt});
    CCalc({framebuffer:CTex.write,iFrame,iTime,iMouse,dt});
    ATex.swap();
    BTex.swap();
    CTex.swap();
    iFrame+=1;
    }
    lastFrames=framesTodo;
    // console.log(iFrame,framesTodo,r)
    // advect({
    //     framebuffer: velocity.write,
    //     x: velocity.read,
    //     dissipation: config.VELOCITY_DISSIPATION,
    //     color: [0, 0, 0, 0],
    // });
    // velocity.swap();

    // advect({
    //     framebuffer: density.write,
    //     x: density.read,
    //     dissipation: config.DENSITY_DISSIPATION,
    //     color: [0.12, 0.2, 0.22, 1],
    // });
    // density.swap();

    // divergence();

    // clear({
    //     dissipation: config.PRESSURE_DISSIPATION,
    // });
    // pressure.swap();

    // for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
    //     jacobi();
    //     pressure.swap();
    // }

    // gradientSubtract();
    // velocity.swap();
};
