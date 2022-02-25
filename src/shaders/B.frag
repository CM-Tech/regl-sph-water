

varying vec2 coords;


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
    
    
    if(P.M.x != 0.) //not vacuum
    {
        Simulation(XT,VT,MT, P, pos);
    }
    
    if(length(P.X - R*vec2(0.8, 0.9)) < 10.) 
    {
        P.X = pos;
        P.V = 0.5*Dir(-PI*0.25 - PI*0.5 + 0.3*sin(0.4*time));
        P.M = mix(P.M, vec2(fluid_rho, 1.), 0.4);
    }

    if(length(P.X - R*vec2(0.2, 0.9)) < 10.) 
    {
        P.X = pos;
        P.V = 0.5*Dir(-PI*0.25 + 0.3*sin(0.3*time));
        P.M = mix(P.M, vec2(fluid_rho, 0.), 0.4);
    }
    
    U = saveParticle(P, pos);
    gl_FragColor=U;
}