precision highp float;
precision highp sampler2D;

uniform vec2 texelSize;
uniform int iFrame;
uniform int tar;
uniform float iTime;
uniform float dt;
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D XT;
uniform sampler2D VT;
uniform sampler2D MT;

#define iResolution (vec2((1.0/texelSize)))

#define R (vec2(vec2((1.0/texelSize))))
#define Bf(p) p
#define Bi(p) ivec2(p)
#define texel(a, p) texture2D(a, ((p-0.5)+0.5)/R)
//texelFetch(a, Bi(p), 0)
#define pixel(a, p) texture2D(a, (p)/R)
#define ch0 iChannel0
#define ch1 iChannel1
#define ch2 iChannel2
#define ch3 iChannel3

#define PI 3.14159265

#define loop(i,x) for(int i = 0; i < x; i++)
#define range(i,a,b) for(int i = a; i <= b; i++)


#define border_h 5.
vec4 Mouse;
float time;

#define mass 1.

#define fluid_rho 0.5

float Pf(vec2 rho)
{
    //return 0.2*rho.x; //gas
    float GF = 1.;//smoothstep(0.49, 0.5, 1. - rho.y);
    return mix(0.5*rho.x,0.04*rho.x*(rho.x/fluid_rho - 1.), GF); //water pressure
}

mat2 Rot(float ang)
{
    return mat2(cos(ang), -sin(ang), sin(ang), cos(ang)); 
}

vec2 Dir(float ang)
{
    return vec2(cos(ang), sin(ang));
}


float sdBox( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

float border(vec2 p)
{
    float bound = -sdBox(p - R*0.5, R*vec2(0.5, 0.5)); 
    float box = sdBox(Rot(0.*time)*(p - R*vec2(0.5, 0.6)) , R*vec2(0.05, 0.01));
    float drain = -sdBox(p - R*vec2(0.5, 0.7), R*vec2(1.5, 0.5));
    return max(drain,min(bound, box));
}

#define h 1.
vec3 bN(vec2 p)
{
    vec3 dx = vec3(-h,0,h);
    vec4 idx = vec4(-1./h, 0., 1./h, 0.25);
    vec3 r = idx.zyw*border(p + dx.zy)
           + idx.xyw*border(p + dx.xy)
           + idx.yzw*border(p + dx.yz)
           + idx.yxw*border(p + dx.yx);
    return vec3(normalize(r.xy), r.z + 1e-4);
}



vec2 decode(float x)
{
    vec2 enc = vec2(1.0, 256.0*256.0) * x;
  enc = mod(enc,1.0);
  vec2 gr=enc;
    gr=gr-mod(gr,1.0/256.0/256.0);
    gr=clamp(gr,0.0,(256.0*256.0-1.0)/256.0/256.0);
  return (gr-0.5)*2.0;
}

float encode(vec2 x)
{
    vec2 gr= x/2.0+0.5;
    gr=clamp(gr,0.0,(256.0*256.0-1.0)/256.0/256.0);
    gr=gr-mod(gr,1.0/256.0/256.0);
    return dot(gr, vec2(1.0, 1.0/256.0/256.0) );
}

struct particle
{
    vec2 X;
    vec2 V;
    vec2 M;
};
struct vec8
{
    float x;
    float y;
    float z;
    float w;
    float r;
    float g;
    float b;
    float a;
};
    

vec8 texelish(sampler2D a,sampler2D b, sampler2D c, vec2 p){
    vec8 voodo;
    voodo.x=texture2D(a,p/R).x;
    voodo.y=texture2D(a,p/R).y;
    voodo.z=texture2D(b,p/R).x;
    voodo.w=texture2D(b,p/R).y;
    voodo.r=texture2D(c,p/R).x;
    voodo.g=texture2D(c,p/R).y;
    return voodo;
}
particle getParticle(vec8 data, vec2 pos)
{
    particle P; 
    P.X = vec2(data.x,data.y) + pos;
    P.V = vec2(data.z,data.w);
    P.M = vec2(data.r,data.g);
    return P;
}

vec4 saveParticle(particle P, vec2 pos)
{
    vec8 voodo;
    P.X = clamp(P.X - pos, vec2(-0.5), vec2(0.5));
    voodo.x=P.X.x;
    voodo.y=P.X.y;
    voodo.z=P.V.x;
    voodo.w=P.V.y;
    voodo.r=P.M.x;
    voodo.g=P.M.x;
    if(tar==0){
return vec4(P.X,0.,1.);
    }else if(tar==1){
return vec4(P.V,0.,1.);
    }else{
return vec4(P.M,0.,1.);
    }
}

vec3 hash32(vec2 p)
{
	vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yxz+33.33);
    return fract((p3.xxy+p3.yzz)*p3.zyx);
}

float G(vec2 x)
{
    return exp(-dot(x,x));
}

float G0(vec2 x)
{
    return exp(-length(x));
}

//diffusion amount
#define dif 1.12

vec3 distribution(vec2 x, vec2 p, float K)
{
    vec2 omin = clamp(x - K*0.5, p - 0.5, p + 0.5);
    vec2 omax = clamp(x + K*0.5, p - 0.5, p + 0.5); 
    return vec3(0.5*(omin + omax), (omax.x - omin.x)*(omax.y - omin.y)/(K*K));
}

/*
vec3 distribution(vec2 x, vec2 p, float K)
{
    vec4 aabb0 = vec4(p - 0.5, p + 0.5);
    vec4 aabb1 = vec4(x - K*0.5, x + K*0.5);
    vec4 aabbX = vec4(max(aabb0.xy, aabb1.xy), min(aabb0.zw, aabb1.zw));
    vec2 center = 0.5*(aabbX.xy + aabbX.zw); //center of mass
    vec2 size = max(aabbX.zw - aabbX.xy, 0.); //only positive
    float m = size.x*size.y/(K*K); //relative amount
    //if any of the dimensions are 0 then the mass is 0
    return vec3(center, m);
}*/

//diffusion and advection basically
void Reintegration(sampler2D ch,sampler2D ch1,sampler2D ch2, inout particle P, vec2 pos)
{
    //basically integral over all updated neighbor distributions
    //that fall inside of this pixel
    //this makes the tracking conservative
    range(i, -2, 2) range(j, -2, 2)
    {
        vec2 tpos = pos + vec2(i,j);
        vec8 data = texelish(ch,ch1,ch2, tpos);
       
        particle P0 = getParticle(data, tpos);
       
        P0.X += P0.V*dt; //integrate position

        float difR = 0.9 + 0.21*smoothstep(fluid_rho*0., fluid_rho*0.333, P0.M.x);
        vec3 D = distribution(P0.X, pos, difR);
        //the deposited mass into this cell
        float m = P0.M.x*D.z;
        
        //add weighted by mass
        P.X += D.xy*m;
        P.V += P0.V*m;
        P.M.y += P0.M.y*m;
        
        //add mass
        P.M.x += m;
    }
    
    //normalization
    if(P.M.x != 0.)
    {
        P.X /= P.M.x;
        P.V /= P.M.x;
        P.M.y /= P.M.x;
    }
}

//force calculation and integration
void Simulation(sampler2D ch,sampler2D ch1,sampler2D ch2, inout particle P, vec2 pos)
{
    //Compute the SPH force
    vec2 F = vec2(0.);
    vec3 avgV = vec3(0.);
    range(i, -2, 2) range(j, -2, 2)
    {
        vec2 tpos = pos + vec2(i,j);
        vec8 data = texelish(ch,ch1,ch2, tpos);
        particle P0 = getParticle(data, tpos);
        vec2 dx = P0.X - P.X;
        float avgP = 0.5*P0.M.x*(Pf(P.M) + Pf(P0.M)); 
        F -= 0.5*G(1.*dx)*avgP*dx;
        avgV += P0.M.x*G(1.*dx)*vec3(P0.V,1.);
    }
    avgV.xy /= avgV.z;

    //viscosity
    F += 0.*P.M.x*(avgV.xy - P.V);
    
    //gravity
    F += P.M.x*vec2(0.0, -0.004);

    if(Mouse.z > 0.)
    {
        vec2 dm =(Mouse.xy - Mouse.zw)/10.; 
        float d = distance(Mouse.xy, P.X)/20.;
        F += 0.001*dm*exp(-d*d);
       // P.M.y += 0.1*exp(-40.*d*d);
    }
    
    //integrate
    P.V += F*dt/P.M.x;

    //border 
    vec3 N = bN(P.X);
    float vdotN = step(N.z, border_h)*dot(-N.xy, P.V);
    P.V += 0.5*(N.xy*vdotN + N.xy*abs(vdotN));
    P.V += 0.*P.M.x*N.xy*step(abs(N.z), border_h)*exp(-N.z);
    
    if(N.z < 0.) P.V = vec2(0.);
    
    
    //velocity limit
    float v = length(P.V);
    P.V /= (v > 1.)?v:1.;
}


