

varying vec2 coords;


void main()
{
    vec4 U=vec4(0.0);
    vec2 pos=coords*iResolution.xy;
     //R = iResolution.xy;
    time = iTime;
     Mouse = iMouse;

    // vec8 data = texelish(XT,VT,MT, pos); 
    
    // particle P;// = getParticle(pos);
    // P.X=vec2(0.0);
    // P.V=vec2(0.0);
    // P.M=0.0;
    // P.C=vec3(0.0);
       
    particle P=Reintegration( pos);
    // P = getParticle(pos);
   
    //initial condition
    if(iFrame < 1)
    {
        //random
        vec3 rand = hash32(pos);
        if(rand.z < 0.0) 
        {
            P.X = pos;
            P.V = 0.5*(rand.xy-0.5) + vec2(0., 0.);
            P.M = mass;
            P.C = vec3(0.,0.,0.);
        }
        else
        {
            P.X = pos;
            P.V = vec2(0.);
            P.M = (1e-6);
            P.C = vec3(1e-6);
        }
    }
    
    U = saveParticle(P, pos);
    gl_FragColor=U;
}