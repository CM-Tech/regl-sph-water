

varying vec2 coords;


void main()
{
    vec4 U=vec4(0.0);
    vec2 pos=coords*iResolution.xy;
     //R = iResolution.xy;
    time = iTime;
     Mouse = iMouse;
    ivec2 p = ivec2(pos);

    vec8 data = texelish(XT,VT,MT, pos); 
    
    particle P;// = getParticle(data, pos);
       
    Reintegration(XT,VT,MT, P, pos);
   
    //initial condition
    if(iFrame < 1)
    {
        //random
        vec3 rand = hash32(pos);
        if(rand.z < 0.0) 
        {
            P.X = pos;
            P.V = 0.5*(rand.xy-0.5) + vec2(0., 0.);
            P.M = vec4(mass, 0.,0.,0.);
        }
        else
        {
            P.X = pos;
            P.V = vec2(0.);
            P.M = vec4(1e-6);
        }
    }
    
    U = saveParticle(P, pos);
    gl_FragColor=U;
}