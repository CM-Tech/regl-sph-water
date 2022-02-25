export default "\n\nvarying vec2 coords;\n\nvoid main()\n{\n    vec4 U=vec4(0.0);\n    vec2 pos=coords*iResolution.xy;\n    //R = iResolution.xy;\n    time = iTime;\n    ivec2 p = ivec2(pos);\n\n    vec8 data = texelish(XT,VT,MT, pos);\n    particle P = getParticle(data, pos);\n    \n    //particle render\n    vec4 rho = vec4(0.);\n    range(i, -1, 1) range(j, -1, 1)\n    {\n        vec2 ij = vec2(i,j);\n        vec8 data = texelish(XT,VT,MT, pos + ij);\n        particle P0 = getParticle(data, pos + ij);\n\n        vec2 x0 = P0.X; //update position\n        //how much mass falls into this pixel\n        rho += 1.*vec4(P.V, 0.0,0.0)*G((pos - x0)/0.75); \n    }\n    U=rho;\n    gl_FragColor=U;\n}"