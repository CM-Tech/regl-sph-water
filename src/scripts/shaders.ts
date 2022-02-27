import { regl } from "./canvas";
import { TEXTURE_DOWNSAMPLE } from "./constants";
import { AXT_X,AVT_X,AMT,ACT,AXT_Y,AVT_Y,ATex,BTex,CTex } from "./fbos";

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
import SShader from "../shaders/S.frag";
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
        X_XT: () => AXT_X.read,
        X_YT: () => AXT_Y.read,
        V_XT: () => AVT_X.read,
        V_YT: () => AVT_Y.read,
        MT: () => AMT.read,
        CT:()=>ACT.read,
        tar:regl.prop("tar"),
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
        X_XT: () => AXT_X.read,
        X_YT: () => AXT_Y.read,
        V_XT: () => AVT_X.read,
        V_YT: () => AVT_Y.read,
        MT: () => AMT.read,
        CT:()=>ACT.read,
        tar:regl.prop("tar"),
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
        X_XT: () => AXT_X.read,
        X_YT: () => AXT_Y.read,
        V_XT: () => AVT_X.read,
        V_YT: () => AVT_Y.read,
        MT: () => AMT.read,
        CT:()=>ACT.read,
        tar:regl.prop("tar"),
        texelSize,
    },
    viewport,
});

const SCalc = regl({
    frag: (commonShader+"\n"+SShader),
    framebuffer: regl.prop("framebuffer"),
    uniforms: {
        iFrame:regl.prop("iFrame"),
        iTime:regl.prop("iTime"),
        iMouse:regl.prop("iMouse"),dt:regl.prop("dt"),
        X_XT: () => AXT_X.read,
        X_YT: () => AXT_Y.read,
        V_XT: () => AVT_X.read,
        V_YT: () => AVT_Y.read,
        MT: () => AMT.read,
        CT:()=>ACT.read,
        tar: regl.prop("tar"),
        
        splatCenter: regl.prop("point"),
        splatM: regl.prop("color"),
        splatV: regl.prop("vel"),
        radius: regl.prop("radius"),
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
    let q = {
        point: [x / window.innerWidth, 1 - y / window.innerHeight],
        radius,
        color,
        vel: [dx, -dy],
    };
    SCalc({framebuffer:AXT_X.write,iFrame,iTime,iMouse,dt:1,tar:0,...q});
    // SCalc({framebuffer:AXT_Y.write,iFrame,iTime,iMouse,dt:1,tar:1,...q});
    SCalc({framebuffer:AVT_X.write,iFrame,iTime,iMouse,dt:1,tar:2,...q});
    // SCalc({framebuffer:AVT_Y.write,iFrame,iTime,iMouse,dt:1,tar:3,...q});
    SCalc({framebuffer:AMT.write,iFrame,iTime,iMouse,dt:1,tar:4,...q});
    SCalc({framebuffer:ACT.write,iFrame,iTime,iMouse,dt:1,tar:5,...q});
    AXT_X.swap();
    // AXT_Y.swap();
    AVT_X.swap();
    // AVT_Y.swap();
    AMT.swap();
    ACT.swap();
    // velocity.swap();

    // splat({
    //     framebuffer: density.write,
    //     uTarget: density.read,
    //     point: [x / window.innerWidth, 1 - y / window.innerHeight],
    //     radius,
    //     color,
    // });
    // density.swap();
}
export function drawLogo(dissipation) {
    // if (logo) {
    //     logo({ dissipation });
    //     density.swap();
    // }
}
let iFrame=0;
let iTime=0;
let timeStarted=false;
let timeStart=-1;
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
        iChannel1: () => CTex.read,
        X_XT: () => AXT_X.read,
        X_YT: () => AXT_Y.read,
        V_XT: () => AVT_X.read,
        V_YT: () => AVT_Y.read,
        MT: () => AMT.read,
        CT:()=>ACT.read,
        tar:regl.prop("tar"),
        texelSize,
    },
    // viewport,
});
export const display = ()=>{

    // iTime=(new Date().getTime()-timeStart)/1000;
    
    return displayU({iFrame,iTime,iMouse});//FIXME:!
};
let fT = 1;
let fTC = 30;
let inRun = false;
export const update = (config) => {
    if (inRun) {
        return;
    }
    inRun = true;
    if (!timeStarted) {
        
        timeStart = window.performance.now();
    }
    let iTimeS = (window.performance.now() - timeStart) / 1000;
    if (timeStarted && (iTimeS - lastUpdate)<1) {
        fT *= 0.9;
        fTC *= 0.9;
        fT += (iTimeS - lastUpdate)/lastFrames;
        fTC += 1;
    }
    timeStarted = true;
    let r = 0;
    let FPS_T = 30;
    let framesTodo =Math.floor((1/FPS_T)*(fTC/fT));//lastFrames/(iTimeS-lastUpdate)*(1/30);
    
    lastUpdate=iTimeS;
    // framesTodo=framesTodo*0.5+lastFrames*0.5;
    let mxDT = 1.0;
    let mmm = 16;//Math.ceil(mxDT);
    if(!(framesTodo<mmm)){
        framesTodo=mmm;
    }
    if(!(framesTodo>1)){
        framesTodo=1;
    }
    // framesTodo=2;
    let dF = 0;
    let dt=Math.min(8/Math.max(framesTodo,1),mxDT);
    while ((((iTime = (window.performance.now() - timeStart) / 1000) - iTimeS < 1 /FPS_T) && r < framesTodo) || r < 1) {
        dF += 1;
        // if(iFrame===0)console.log(r,"I",iTime)
        r+=1;
        
        // lastUpdate=iTime;

    ACalc({framebuffer:AXT_X.write,iFrame,iTime,iMouse,dt,tar:0});
    // ACalc({framebuffer:AXT_Y.write,iFrame,iTime,iMouse,dt,tar:1});
    ACalc({framebuffer:AVT_X.write,iFrame,iTime,iMouse,dt,tar:2});
    // ACalc({framebuffer:AVT_Y.write,iFrame,iTime,iMouse,dt,tar:3});
    ACalc({framebuffer:AMT.write,iFrame,iTime,iMouse,dt,tar:4});
    ACalc({framebuffer:ACT.write,iFrame,iTime,iMouse,dt,tar:5});
    AXT_X.swap();
    // AXT_Y.swap();
    AVT_X.swap();
    // AVT_Y.swap();
    AMT.swap();
    ACT.swap();
    BCalc({framebuffer:AXT_X.write,iFrame,iTime,iMouse,dt,tar:0});
    // BCalc({framebuffer:AXT_Y.write,iFrame,iTime,iMouse,dt,tar:1});
    BCalc({framebuffer:AVT_X.write,iFrame,iTime,iMouse,dt,tar:2});
    // BCalc({framebuffer:AVT_Y.write,iFrame,iTime,iMouse,dt,tar:3});
    BCalc({framebuffer:AMT.write,iFrame,iTime,iMouse,dt,tar:4});
    BCalc({ framebuffer: ACT.write, iFrame, iTime, iMouse, dt, tar: 5 });
        
    
    // ATex.swap();
    // BTex.swap();
    // CTex.swap();
    AXT_X.swap();
    // AXT_Y.swap();
    AVT_X.swap();
    // AVT_Y.swap();
    AMT.swap();
    ACT.swap();
    iFrame+=1;
    }
    CCalc({ framebuffer: CTex.write, iFrame, iTime, iMouse, dt: 1, tar: 2 });
    CTex.swap();
    lastFrames=dF;
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
    inRun = false;
};
window.addEventListener("mousemove", (e) => {
    iMouse[0] = e.clientX / window.innerWidth;
    iMouse[1] = 1-e.clientY / window.innerHeight;
})
