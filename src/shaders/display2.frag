
varying vec2 coords;

uniform sampler2D iChannel1;
#define ch1 iChannel1

vec3 hsv2rgb( in vec3 c )
{
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );

	rgb = rgb*rgb*(3.0-2.0*rgb); // cubic smoothing	

	return c.z * mix( vec3(1.0), rgb, c.y);
}

vec3 mixN(vec3 a, vec3 b, float k)
{
    return sqrt(mix(a*a, b*b, clamp(k,0.,1.)));
}

vec4 V(vec2 p)
{
    return pixel(ch1, p);
}
vec3 tanh3(vec3 g){
    return 1.0/(1.0+exp(-2.0*g))*2.0-1.0;
}
void main()
{
    vec4 col=vec4(0.0);
	 //R = iResolution.xy;
    time = iTime; 
    vec2 pos=coords*iResolution.xy;
   // pos = R*0.5 + (pos-R/2.0)*2.0;
    ivec2 p = ivec2(pos);
    
    // vec8 data = texelish(XT,VT,MT, pos);
    particle P = getParticle(pos);

    //border render
    vec3 Nb = bN(P.X);
    float bord = smoothstepp(2.*border_h,border_h*0.5,border(pos));
    
    vec3 dx = vec3(-1., 0., 1.);

    vec4 rho = (V(pos)+V(pos + dx.zy)+V(pos + dx.xy)+V(pos + dx.yz)+V(pos + dx.yx))/5.0;
    float g=2.0;
    vec4 grad = -1.0/g*vec4(V(pos + dx.zy*g).zw - V(pos + dx.xy*g).zw,
                         V(pos + dx.yz*g).zw - V(pos + dx.yx*g).zw);
    vec2 N = pow(length(grad.xz),0.2)*normalize(grad.xz+1e-5);
    float specular = pow(max(dot(N, Dir(1.4)), 0.), 3.5);
    float specularb = G(0.4*(Nb.zz - border_h))*pow(max(dot(Nb.xy, Dir(1.4)), 0.), 3.);
    
    float a = pow(smoothstepp(fluid_rho*0., fluid_rho*2., rho.z),0.1);
    float b = exp(-1.7*smoothstepp(fluid_rho*1., fluid_rho*7.5, rho.z));
    vec3 col0 = P.C;//vec3(1., 0.5, 0.);
    vec3 col1 = P.C;//vec3(0.1, 0.4, 1.);
	vec3 fcol =P.C;// mixN(col0, col1, tanh3(vec3(3.*(rho.w - 0.7))).x*0.5 + 0.5);
    // Output to screen
    col = vec4(3.);
    col.xyz = mixN(col.xyz, fcol.xyz*(1.5*b + specular*5.), a);
    col.xyz = mixN(col.xyz, 0.*vec3(0.5,0.5,1.), bord);
    col.xyz = tanh3(col.xyz);
    col.w=1.0;
    // col.xyz=vec3(P.V+0.5,0.0);
    // col.xy=P.X-pos;
    // col.x=P.M/M_M;
    gl_FragColor=col;
   // particle Pg = getParticle(vec4(1.0,0.5,0.0,1.0), pos);
    //gl_FragColor= vec4(saveParticle(Pg, pos).xy,0.0,1.0);
//  gl_FragColor=vec4(vec3(P.M.x),1.0);
}