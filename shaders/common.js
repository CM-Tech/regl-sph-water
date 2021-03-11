export default "precision highp float;\nprecision highp sampler2D;\n\nuniform vec2 texelSize;\nuniform int iFrame;\nuniform float iTime;\nuniform float dt;\nuniform vec4 iMouse;\nuniform sampler2D iChannel0;\nuniform sampler2D iChannel1;\nuniform sampler2D iChannel2;\n\n#define iResolution (vec2(ivec2((1.0/texelSize)+0.5)))\n\n#define R (vec2(ivec2((1.0/texelSize)+0.5)))\n#define Bf(p) p\n#define Bi(p) ivec2(p)\n#define texel(a, p) texture2D(a, (p)/(R))\n//texelFetch(a, Bi(p), 0)\n#define pixel(a, p) texture2D(a, (p)/R)\n#define ch0 iChannel0\n#define ch1 iChannel1\n#define ch2 iChannel2\n#define ch3 iChannel3\n\n#define PI 3.14159265\n\n#define loop(i,x) for(int i = 0; i < x; i++)\n#define range(i,a,b) for(int i = a; i <= b; i++)\n\n\n#define border_h 5.\nvec4 Mouse;\nfloat time;\n\n#define mass 1.\n\n#define fluid_rho 0.5\n\nfloat Pf(vec2 rho)\n{\n    //return 0.2*rho.x; //gas\n    float GF = 1.;//smoothstep(0.49, 0.5, 1. - rho.y);\n    return mix(0.5*rho.x,0.04*rho.x*(rho.x/fluid_rho - 1.), GF); //water pressure\n}\n\nmat2 Rot(float ang)\n{\n    return mat2(cos(ang), -sin(ang), sin(ang), cos(ang)); \n}\n\nvec2 Dir(float ang)\n{\n    return vec2(cos(ang), sin(ang));\n}\n\n\nfloat sdBox( in vec2 p, in vec2 b )\n{\n    vec2 d = abs(p)-b;\n    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);\n}\n\nfloat border(vec2 p)\n{\n    float bound = -sdBox(p - R*0.5, R*vec2(0.5, 0.5)); \n    float box = sdBox(Rot(0.*time)*(p - R*vec2(0.5, 0.6)) , R*vec2(0.05, 0.01));\n    float drain = -sdBox(p - R*vec2(0.5, 0.7), R*vec2(1.5, 0.5));\n    return max(drain,min(bound, box));\n}\n\n#define h 1.\nvec3 bN(vec2 p)\n{\n    vec3 dx = vec3(-h,0,h);\n    vec4 idx = vec4(-1./h, 0., 1./h, 0.25);\n    vec3 r = idx.zyw*border(p + dx.zy)\n           + idx.xyw*border(p + dx.xy)\n           + idx.yzw*border(p + dx.yz)\n           + idx.yxw*border(p + dx.yx);\n    return vec3(normalize(r.xy), r.z + 1e-4);\n}\n\n\n\nvec2 decode(float x)\n{\n    vec2 enc = vec2(1.0, 256.0*256.0) * x;\n  enc = mod(enc,1.0);\n  vec2 gr=enc;\n    gr=gr-mod(gr,1.0/256.0/256.0);\n    gr=clamp(gr,0.0,(256.0*256.0-1.0)/256.0/256.0);\n  return (gr-0.5)*2.0;\n}\n\nfloat encode(vec2 x)\n{\n    vec2 gr= x/2.0+0.5;\n    gr=clamp(gr,0.0,(256.0*256.0-1.0)/256.0/256.0);\n    gr=gr-mod(gr,1.0/256.0/256.0);\n    return dot(gr, vec2(1.0, 1.0/256.0/256.0) );\n}\n\nstruct particle\n{\n    vec2 X;\n    vec2 V;\n    vec2 M;\n};\n    \nparticle getParticle(vec4 data, vec2 pos)\n{\n    particle P; \n    P.X = decode(data.x) + pos;\n    P.V = decode(data.y);\n    P.M = data.zw;\n    return P;\n}\n\nvec4 saveParticle(particle P, vec2 pos)\n{\n    P.X = clamp(P.X - pos, vec2(-0.5), vec2(0.5));\n    return vec4(encode(P.X), encode(P.V), P.M);\n}\n\nvec3 hash32(vec2 p)\n{\n\tvec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));\n    p3 += dot(p3, p3.yxz+33.33);\n    return fract((p3.xxy+p3.yzz)*p3.zyx);\n}\n\nfloat G(vec2 x)\n{\n    return exp(-dot(x,x));\n}\n\nfloat G0(vec2 x)\n{\n    return exp(-length(x));\n}\n\n//diffusion amount\n#define dif 1.12\n\nvec3 distribution(vec2 x, vec2 p, float K)\n{\n    vec2 omin = clamp(x - K*0.5, p - 0.5, p + 0.5);\n    vec2 omax = clamp(x + K*0.5, p - 0.5, p + 0.5); \n    return vec3(0.5*(omin + omax), (omax.x - omin.x)*(omax.y - omin.y)/(K*K));\n}\n\n/*\nvec3 distribution(vec2 x, vec2 p, float K)\n{\n    vec4 aabb0 = vec4(p - 0.5, p + 0.5);\n    vec4 aabb1 = vec4(x - K*0.5, x + K*0.5);\n    vec4 aabbX = vec4(max(aabb0.xy, aabb1.xy), min(aabb0.zw, aabb1.zw));\n    vec2 center = 0.5*(aabbX.xy + aabbX.zw); //center of mass\n    vec2 size = max(aabbX.zw - aabbX.xy, 0.); //only positive\n    float m = size.x*size.y/(K*K); //relative amount\n    //if any of the dimensions are 0 then the mass is 0\n    return vec3(center, m);\n}*/\n\n//diffusion and advection basically\nvoid Reintegration(sampler2D ch, inout particle P, vec2 pos)\n{\n    //basically integral over all updated neighbor distributions\n    //that fall inside of this pixel\n    //this makes the tracking conservative\n    range(i, -2, 2) range(j, -2, 2)\n    {\n        vec2 tpos = pos + vec2(i,j);\n        vec4 data = texel(ch, tpos);\n       \n        particle P0 = getParticle(data, tpos);\n       \n        P0.X += P0.V*dt; //integrate position\n\n        float difR = 0.9 + 0.21*smoothstep(fluid_rho*0., fluid_rho*0.333, P0.M.x);\n        vec3 D = distribution(P0.X, pos, difR);\n        //the deposited mass into this cell\n        float m = P0.M.x*D.z;\n        \n        //add weighted by mass\n        P.X += D.xy*m;\n        P.V += P0.V*m;\n        P.M.y += P0.M.y*m;\n        \n        //add mass\n        P.M.x += m;\n    }\n    \n    //normalization\n    if(P.M.x != 0.)\n    {\n        P.X /= P.M.x;\n        P.V /= P.M.x;\n        P.M.y /= P.M.x;\n    }\n}\n\n//force calculation and integration\nvoid Simulation(sampler2D ch, inout particle P, vec2 pos)\n{\n    //Compute the SPH force\n    vec2 F = vec2(0.);\n    vec3 avgV = vec3(0.);\n    range(i, -2, 2) range(j, -2, 2)\n    {\n        vec2 tpos = pos + vec2(i,j);\n        vec4 data = texel(ch, tpos);\n        particle P0 = getParticle(data, tpos);\n        vec2 dx = P0.X - P.X;\n        float avgP = 0.5*P0.M.x*(Pf(P.M) + Pf(P0.M)); \n        F -= 0.5*G(1.*dx)*avgP*dx;\n        avgV += P0.M.x*G(1.*dx)*vec3(P0.V,1.);\n    }\n    avgV.xy /= avgV.z;\n\n    //viscosity\n    F += 0.*P.M.x*(avgV.xy - P.V);\n    \n    //gravity\n    F += P.M.x*vec2(0., -0.0004);\n\n    if(Mouse.z > 0.)\n    {\n        vec2 dm =(Mouse.xy - Mouse.zw)/10.; \n        float d = distance(Mouse.xy, P.X)/20.;\n        F += 0.001*dm*exp(-d*d);\n       // P.M.y += 0.1*exp(-40.*d*d);\n    }\n    \n    //integrate\n    P.V += F*dt/P.M.x;\n\n    //border \n    vec3 N = bN(P.X);\n    float vdotN = step(N.z, border_h)*dot(-N.xy, P.V);\n    P.V += 0.5*(N.xy*vdotN + N.xy*abs(vdotN));\n    P.V += 0.*P.M.x*N.xy*step(abs(N.z), border_h)*exp(-N.z);\n    \n    if(N.z < 0.) P.V = vec2(0.);\n    \n    \n    //velocity limit\n    float v = length(P.V);\n    P.V /= (v > 1.)?v:1.;\n}\n\n\n"