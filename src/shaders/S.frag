

varying vec2 coords;

uniform vec2 splatV;
uniform vec3 splatM;
uniform vec2 splatCenter;
uniform float radius;


void main()
{
    vec4 U=vec4(0.0);
    vec2 pos=coords*iResolution.xy;
     //R = iResolution.xy;
    time = iTime;
     Mouse = iMouse;
    //ivec2 p = ivec2(pos);
        
    vec8 data = texelish(XT,VT,MT, pos); 
    
    particle P = getParticle(data, pos);
    
    if(length(P.X - R*(splatCenter)) < 10.0) 
    {
        float m=P.M.x;
    P.X*=m;
    P.V*=m;
    P.M.yzw*=m;
    float am=fluid_rho;
    float tm=m+am;
    P.M.yzw*=1./tm;
        P.X = (P.X+am*pos)/tm;
        P.V = (P.V+am*splatV)/tm;
        P.M += vec4(am, splatM*am/tm);
    }

    // if(length(P.X - R*vec2(0.2, 0.1)) < 8.) 
    // {
    //     P.X = pos;
    //     P.V = Dir(PI*0.5 + 0.3*sin(0.3*time));
    //     P.M = mix(P.M, vec4(fluid_rho, 1.,0.0,1.0), 0.4);
    // }
    //  if(length(P.X - R*vec2(0.5, 0.9)) < 8.) 
    // {
    //     P.X = pos;
    //     P.V = Dir(-PI*0.5 + 0.3*sin(0.3*time));
    //     P.M = mix(P.M, vec4(fluid_rho, 1.,0.9,0.0), 0.4);
    // }
    
    U = saveParticle(P, pos);
    gl_FragColor=U;
}