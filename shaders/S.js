export default "\n\nvarying vec2 coords;\n\nuniform vec2 splatV;\nuniform vec3 splatM;\nuniform vec2 splatCenter;\nuniform float radius;\n\n\nvoid main()\n{\n    vec4 U=vec4(0.0);\n    vec2 pos=coords*iResolution.xy;\n     //R = iResolution.xy;\n    time = iTime;\n     Mouse = iMouse;\n    //ivec2 p = ivec2(pos);\n        \n    // vec8 data = texelish(XT,VT,MT, pos); \n    \n    particle P = getParticle( pos);\n    \n    if(length(P.X - R*(splatCenter)) < 10.0) \n    {\n        float m=P.M;\n    P.X*=m;\n    P.V*=m;\n    // P.M.yzw*=m;\n    P.C*=m;\n    float am=min(max(fluid_rho*2.0-m,fluid_rho*0.5),fluid_rho*0.5);\n    float tm=m+am;\n    P.C*=1./tm;\n        P.X = (P.X+am*pos)/tm;\n        P.V = (P.V+am*splatV)/tm;\n        P.M += am;\n        P.C += splatM*am/tm;\n    }\n\n    // if(length(P.X - R*vec2(0.2, 0.1)) < 8.) \n    // {\n    //     P.X = pos;\n    //     P.V = Dir(PI*0.5 + 0.3*sin(0.3*time));\n    //     P.M = mix(P.M, vec4(fluid_rho, 1.,0.0,1.0), 0.4);\n    // }\n    //  if(length(P.X - R*vec2(0.5, 0.9)) < 8.) \n    // {\n    //     P.X = pos;\n    //     P.V = Dir(-PI*0.5 + 0.3*sin(0.3*time));\n    //     P.M = mix(P.M, vec4(fluid_rho, 1.,0.9,0.0), 0.4);\n    // }\n    \n    U = saveParticle(P, pos);\n    gl_FragColor=U;\n}"