precision lowp float;
precision lowp sampler2D;

uniform vec2 texelSize;
uniform int iFrame;
uniform int tar;
uniform float iTime;
uniform float dt;
uniform vec4 iMouse;


uniform sampler2D X_XT;
uniform sampler2D X_YT;
uniform sampler2D V_XT;
uniform sampler2D V_YT;
uniform sampler2D MT;
uniform sampler2D CT;

#define iResolution (vec2((1./texelSize)))

#define V_S 1.
#define X_S 0.5
#define M_M 64.0
#define R (vec2(vec2((1./texelSize))))
#define Bf(p) p
#define Bi(p) ivec2(p)
#define texel(a,p) texture2D(a,((p-.5)+.5)/R)
//texelFetch(a, Bi(p), 0)
#define pixel(a,p) texture2D(a,(p)/R)


#define LE true
#define PI 3.14159265

#define loop(i,x)for(int i=0;i<x;i++)
#define range(i,a,b)for(int i=a;i<=b;i++)

#define border_h 10.
vec4 Mouse;
float time;

#define mass 1.

#define fluid_rho .5


float shiftRight (float v, float amt) {
  v = floor(v) + 0.5;
  return floor(v / exp2(amt));
}
float shiftLeft (float v, float amt) {
    return floor(v * exp2(amt) + 0.5);
}
float maskLast (float v, float bits) {
    return mod(v, shiftLeft(1.0, bits));
}
float extractBits (float num, float from, float to) {
    from = floor(from + 0.5); to = floor(to + 0.5);
    return maskLast(shiftRight(num, from), to - from);
}
vec4 floatToRgba(float texelFloat, bool littleEndian) {
    if (texelFloat == 0.0) return vec4(0, 0, 0, 0);
    float sign = texelFloat > 0.0 ? 0.0 : 1.0;
    texelFloat = abs(texelFloat);
    float exponent = floor(log2(texelFloat));
    float biased_exponent = exponent + 127.0;
    float fraction = ((texelFloat / exp2(exponent)) - 1.0) * 8388608.0;
    float t = biased_exponent / 2.0;
    float last_bit_of_biased_exponent = fract(t) * 2.0;
    float remaining_bits_of_biased_exponent = floor(t);
    float byte4 = extractBits(fraction, 0.0, 8.0) / 255.0;
    float byte3 = extractBits(fraction, 8.0, 16.0) / 255.0;
    float byte2 = (last_bit_of_biased_exponent * 128.0 + extractBits(fraction, 16.0, 23.0)) / 255.0;
    float byte1 = (sign * 128.0 + remaining_bits_of_biased_exponent) / 255.0;
    return (
      littleEndian
      ? vec4(byte4, byte3, byte2, byte1)
      : vec4(byte1, byte2, byte3, byte4)
    );
}



// Denormalize 8-bit color channels to integers in the range 0 to 255.
ivec4 floatsToBytes(vec4 inputFloats, bool littleEndian) {
  ivec4 bytes = ivec4(inputFloats * 255.0);
  return (
    littleEndian
    ? bytes.abgr
    : bytes
  );
}

// Break the four bytes down into an array of 32 bits.
void bytesToBits(const in ivec4 bytes, out bool bits[32]) {
  for (int channelIndex = 0; channelIndex < 4; ++channelIndex) {
    float acc = float(bytes[channelIndex]);
    for (int indexInByte = 7; indexInByte >= 0; --indexInByte) {
      float powerOfTwo = exp2(float(indexInByte));
      bool bit = acc >= powerOfTwo;
      bits[channelIndex * 8 + (7 - indexInByte)] = bit;
      acc = mod(acc, powerOfTwo);
    }
  }
}

// Compute the exponent of the 32-bit float.
float getExponent(bool bits[32]) {
  const int startIndex = 1;
  const int bitStringLength = 8;
  const int endBeforeIndex = startIndex + bitStringLength;
  float acc = 0.0;
  int pow2 = bitStringLength - 1;
  for (int bitIndex = startIndex; bitIndex < endBeforeIndex; ++bitIndex) {
    acc += float(bits[bitIndex]) * exp2(float(pow2--));
  }
  return acc;
}

// Compute the mantissa of the 32-bit float.
float getMantissa(bool bits[32], bool subnormal) {
  const int startIndex = 9;
  const int bitStringLength = 23;
  const int endBeforeIndex = startIndex + bitStringLength;
  // Leading/implicit/hidden bit convention:
  // If the number is not subnormal (with exponent 0), we add a leading 1 digit.
  float acc = float(!subnormal) * exp2(float(bitStringLength));
  int pow2 = bitStringLength - 1;
  for (int bitIndex = startIndex; bitIndex < endBeforeIndex; ++bitIndex) {
    acc += float(bits[bitIndex]) * exp2(float(pow2--));
  }
  return acc;
}

// Parse the float from its 32 bits.
float bitsToFloat(bool bits[32]) {
  float signBit = float(bits[0]) * -2.0 + 1.0;
  float exponent = getExponent(bits);
  bool subnormal = abs(exponent - 0.0) < 0.01;
  float mantissa = getMantissa(bits, subnormal);
  float exponentBias = 127.0;
  return signBit * mantissa * exp2(exponent - exponentBias - 23.0);
}

// Decode a 32-bit float from the RGBA color channels of a texel.
float rgbaToFloat(vec4 texelRGBA, bool littleEndian) {
  ivec4 rgbaBytes = floatsToBytes(texelRGBA, littleEndian);
  bool bits[32];
  bytesToBits(rgbaBytes, bits);
  return bitsToFloat(bits);
}


vec2 encode01FloatIntoColorVec2(float p){
    vec2 v;
    float pr=floor((256.0*256.0-1.0)*clamp(p,0.0,1.0));
    v.x=mod(pr,256.0)/255.0;
    v.y=floor(pr/256.0)/255.0;
    return v;
}

float decode01FloatFromColorVec2(vec2 v){
    vec2 v2=floor(clamp(v,0.0,1.0)*255.0);
    return (256.0*v2.y+v.x)/(256.0*256.0-1.0);
}

vec2 encode01FloatIntoColorVec4(float p){
    vec2 v;
    float pr=floor((256.0*256.0-1.0)*clamp(p,0.0,1.0));
    v.x=mod(pr,256.0)/255.0;
    v.y=floor(pr/256.0)/255.0;
    return v;
}

float decode01FloatFromColorVec4(vec2 v){
    vec2 v2=floor(clamp(v,0.0,1.0)*255.0);
    return (256.0*v2.y+v.x)/(256.0*256.0-1.0);
}

float Pf(float rho)
{
    //return 0.2*rho.x; //gas
    float GF=1.;//smoothstep(0.49, 0.5, 1. - rho.y);
    return mix(.5*rho,.04*rho*(rho/fluid_rho-1.),GF);//water pressure
}

mat2 Rot(float ang)
{
    return mat2(cos(ang),-sin(ang),sin(ang),cos(ang));
}

vec2 Dir(float ang)
{
    return vec2(cos(ang),sin(ang));
}

float sdBox(in vec2 p,in vec2 b)
{
    vec2 d=abs(p)-b;
    return length(max(d,0.))+min(max(d.x,d.y),0.);
}

float border(vec2 p)
{
    float bound=max(-sdBox(p-R*vec2(.5,.2),R*vec2(.5,.2)),-sdBox(p-R*vec2(.5,.8),R*vec2(1.0,.6)));
    return bound;
    // float box=sdBox(Rot(0.*time)*(p-R*vec2(.5,.6)),R*vec2(.05,.01));
    // float drain=-sdBox(p-R*vec2(.5,.7),R*vec2(1.5,.5));
    // vec2 pg=p-R*vec2(.5,.5);
    // return min(max(drain,min(bound,box)),(length(p-R*vec2(iMouse.x,iMouse.y))-10.));
}

#define h 1.
vec3 bN(vec2 p)
{
    vec3 dx=vec3(-h,0,h);
    vec4 idx=vec4(-1./h,0.,1./h,.25);
    vec3 r=idx.zyw*border(p+dx.zy)
    +idx.xyw*border(p+dx.xy)
    +idx.yzw*border(p+dx.yz)
    +idx.yxw*border(p+dx.yx);
    return vec3(normalize(r.xy),r.z+1e-4);
}

struct particle
{
    vec2 X;
    vec2 V;
    float M;
    vec3 C;
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

vec8 texelish(sampler2D a,sampler2D b,sampler2D c,vec2 p){
    vec8 voodo;
    vec2 X=vec2(decode01FloatFromColorVec2(texture2D(a,p/R).xy),decode01FloatFromColorVec2(texture2D(a,p/R).zw))*(2.0*X_S)+vec2(-X_S);
    voodo.x=X.x;
    voodo.y=X.y;
    vec2 V=vec2(decode01FloatFromColorVec2(texture2D(b,p/R).xy),decode01FloatFromColorVec2(texture2D(b,p/R).zw))*(2.0*V_S)+vec2(-V_S);
    voodo.z=V.x;
    voodo.w=V.y;
    voodo.r=texture2D(c,p/R).x*M_M;
    voodo.g=texture2D(c,p/R).y;
    voodo.b=texture2D(c,p/R).z;
    voodo.a=texture2D(c,p/R).w;
    return voodo;
}
particle getParticle(vec2 p)
{
    particle P;
    P.X=vec2(rgbaToFloat(texture2D(X_XT,p/R),LE),rgbaToFloat(texture2D(X_YT,p/R),LE))+p;
    P.V=vec2(rgbaToFloat(texture2D(V_XT,p/R),LE),rgbaToFloat(texture2D(V_YT,p/R),LE));
    P.M=rgbaToFloat(texture2D(MT,p/R),LE)*M_M;
    P.C=texture2D(CT,p/R).xyz;
    return P;
}

vec4 saveParticle(particle P,vec2 pos)
{
    if(pos.x<1.0 || pos.y<1.0 || pos.x>R.x-1.0 || pos.y>R.y-1.0){
        P.M=0.;
    }
    P.X=clamp(P.X-pos,vec2(-X_S),vec2(X_S));
    P.V=clamp(P.V,vec2(-V_S),vec2(V_S));
    // vec2 XSQ=(P.X-vec2(-X_S))/(2.0*X_S);
    // vec2 VSQ=(P.V-vec2(-V_S))/(2.0*V_S);
    if(tar==0){
        return floatToRgba(P.X.x,LE);//vec4(encode01FloatIntoColorVec2(XSQ.x),encode01FloatIntoColorVec2(XSQ.y));
    }else if(tar==1){
        return floatToRgba(P.X.y,LE);
        // return vec4(encode01FloatIntoColorVec2(VSQ.x),encode01FloatIntoColorVec2(VSQ.y));
    }else if(tar==2){
        return floatToRgba(P.V.x,LE);
        // return vec4(encode01FloatIntoColorVec2(VSQ.x),encode01FloatIntoColorVec2(VSQ.y));
    }else if(tar==3){
        return floatToRgba(P.V.y,LE);
        // return vec4(encode01FloatIntoColorVec2(VSQ.x),encode01FloatIntoColorVec2(VSQ.y));
    }else if(tar==4){
        return floatToRgba(min(max(P.M,0.),M_M)/M_M,LE);// prevent's screen whipe
        // return vec4(encode01FloatIntoColorVec2(VSQ.x),encode01FloatIntoColorVec2(VSQ.y));
    }else{
        return vec4(P.C,1.0);// prevent's screen whipe
    }
}

vec3 hash32(vec2 p)
{
    vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));
    p3+=dot(p3,p3.yxz+33.33);
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

vec3 distribution(vec2 x,vec2 p,float K)
{
    vec2 omin=clamp(x-K*.5,p-.5,p+.5);
    vec2 omax=clamp(x+K*.5,p-.5,p+.5);
    return vec3(.5*(omin+omax),(omax.x-omin.x)*(omax.y-omin.y)/(K*K));
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
void Reintegration(inout particle P,vec2 pos)
{
    //basically integral over all updated neighbor distributions
    //that fall inside of this pixel
    //this makes the tracking conservative
    range(i,-2,2)range(j,-2,2)
    {
        vec2 tpos=pos+vec2(i,j);
        // vec8 data=texelish(ch,ch1,ch2,tpos);
        
        particle P0=getParticle(tpos);
        
        P0.X+=P0.V*dt;//integrate position
        
        float difR=.9+.21*smoothstep(fluid_rho*0.,fluid_rho*.333,P0.M);
        vec3 D=distribution(P0.X,pos,max(difR,0.001));
        //the deposited mass into this cell
        float m=P0.M*D.z;
        
        //add weighted by mass
        P.X+=D.xy*m;
        P.V+=P0.V*m;
        P.C+=P0.C*m;
        
        //add mass
        P.M+=m;
    }
    
    //normalization
    if(P.M>0.001)
    {
        P.X/=P.M;
        P.V/=P.M;
        P.C/=P.M;
    }else{
        P.M=0.;
    }
}

//force calculation and integration
void Simulation(inout particle P,vec2 pos)
{
    //Compute the SPH force
    vec2 F=vec2(0.);
    vec3 avgV=vec3(0.);
    range(i,-2,2)range(j,-2,2)
    {
        vec2 tpos=pos+vec2(i,j);
        particle P0=getParticle(tpos);
        vec2 dx=P0.X-P.X;
        float avgP=.5*P0.M*(Pf(P.M)+Pf(P0.M));
        F-=.5*G(1.*dx)*avgP*dx;
        avgV+=P0.M*G(1.*dx)*vec3(P0.V,1.);
    }
    avgV.xy/=avgV.z;
    
    //viscosity
    F+=0.*P.M*(avgV.xy-P.V);
    
    //gravity
    F+=P.M*vec2(0.,-.004);
    
    // if(Mouse.z>0.)
    // {
    //     vec2 dm=(Mouse.xy-Mouse.zw)/10.;
    //     float d=distance(Mouse.xy,P.X)/20.;
    //     F+=.001*dm*exp(-d*d);
    //     // P.M.y += 0.1*exp(-40.*d*d);
    // }
    
    //integrate
    P.V+=F*dt/max(P.M,0.001);
    
    //border
    vec3 N=bN(P.X);
    float vdotN=step(N.z,border_h)*dot(-N.xy,P.V);
    P.V+=.5*(N.xy*vdotN+N.xy*abs(vdotN));
    P.V+=0.*P.M*N.xy*step(abs(N.z),border_h)*exp(-N.z);
    
    if(N.z<0.)P.V=vec2(0.);
    
    //velocity limit
    float v=length(P.V);
    P.V/=(v>1.)?v:1.;
}

