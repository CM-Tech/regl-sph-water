export default "\n\nvarying vec2 coords;\n\n\nvoid main()\n{\n    vec4 U=vec4(0.0);\n    vec2 pos=coords*iResolution.xy;\n     //R = iResolution.xy;\n    time = iTime;\n     Mouse = iMouse;\n    ivec2 p = ivec2(pos);\n\n    vec8 data = texelish(XT,VT,MT, pos); \n    \n    particle P;// = getParticle(data, pos);\n       \n    Reintegration(XT,VT,MT, P, pos);\n   \n    //initial condition\n    if(iFrame < 1)\n    {\n        //random\n        vec3 rand = hash32(pos);\n        if(rand.z < 0.0) \n        {\n            P.X = pos;\n            P.V = 0.5*(rand.xy-0.5) + vec2(0., 0.);\n            P.M = vec2(mass, 0.);\n        }\n        else\n        {\n            P.X = pos;\n            P.V = vec2(0.);\n            P.M = vec2(1e-6);\n        }\n    }\n    \n    U = saveParticle(P, pos);\n    gl_FragColor=U;\n}"