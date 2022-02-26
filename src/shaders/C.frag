

varying vec2 coords;

void main()
{
    vec4 U=vec4(0.0);
    vec2 pos=coords*iResolution.xy;
    //R = iResolution.xy;
    time = iTime;
    ivec2 p = ivec2(pos);

    // vec8 data = texelish(XT,VT,MT, pos);
    particle P = getParticle(pos);
    
    //particle render
    vec4 rho = vec4(0.);
    range(i, -1, 1) range(j, -1, 1)
    {
        vec2 ij = vec2(i,j);
        // vec8 data = texelish(XT,VT,MT, pos + ij);
        particle P0 = getParticle( pos + ij);

        vec2 x0 = P0.X; //update position
        //how much mass falls into this pixel
        rho += 1.*vec4(P.V, P.M,1.0)*G((pos - x0)/0.75); 
    }
    U=rho;
    gl_FragColor=U;
}