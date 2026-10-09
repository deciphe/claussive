import {useEffect,useRef,useState} from 'react';

// A close-up corner of an overwhelmingly large moon, drawn live as a halftone
// dot screen. One full-screen fragment shader; no image assets.
const VERT=`attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
const FRAG=`
precision highp float;
uniform vec2 u_res;uniform float u_time;uniform float u_scroll;uniform float u_dpr;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
vec2 hash2(vec2 p){float n=hash(p);return vec2(n,hash(p+n+17.13));}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float layer(vec2 g,float seed){
 vec2 id=floor(g),f=fract(g);float h=0.;
 for(int y=-1;y<=1;y++){for(int x=-1;x<=1;x++){
  vec2 o=vec2(float(x),float(y));vec2 r=hash2(id+o+seed);
  float keep=step(.42,hash(id+o+seed*1.7+3.1));
  float rad=.16+.30*r.x*r.x;
  float d=length(f-(o+.22+.56*r))/rad;
  float bowl=d<1.?(d*d-1.):0.;
  float rim=.42*exp(-((d-1.)*(d-1.))/.03);
  h+=keep*(bowl+rim)*rad;
 }}
 return h;
}
float relief(vec2 s){
 return layer(s*5.,11.)*1.0+layer(s*11.5,23.)*.42+layer(s*26.,37.)*.16+(vnoise(s*3.)-.5)*.10+(vnoise(s*9.)-.5)*.04;
}
// brightness of the lit surface at a pixel; returns -1 in open sky
float moon(vec2 p,out float outside){
 float W=u_res.x,H=u_res.y;
 float R=max(W*1.45,H*1.05);
 float tall=clamp(H/W-.9,0.,1.);
 vec2 c=vec2(W*1.10,H*(.70-.14*tall)-R+min(u_scroll*.06,H*.09));
 vec2 q=(p-c)/R;float d2=dot(q,q);
 outside=(sqrt(d2)-1.)*R;
 if(d2>=1.)return -1.;
 float z=sqrt(1.-d2);
 vec2 s=vec2(atan(q.x,z)+u_time*.0045,asin(clamp(q.y,-1.,1.)));
 float e=.0035;
 float h0=relief(s),hx=relief(s+vec2(e,0.)),hy=relief(s+vec2(0.,e));
 vec3 n=normalize(vec3(q-vec2(hx-h0,hy-h0)/e*.20,z));
 vec3 L=normalize(vec3(-.42,.80,.43));
 float b=pow(max(dot(n,L),0.),.9);
 float depth=-outside;
 b*=.035+.965*exp(-depth/(W*.075+60.*u_dpr));
 b*=smoothstep(0.,5.*u_dpr,depth);
 return clamp(b*.9+.008,0.,1.);
}
void main(){
 vec2 p=gl_FragCoord.xy;
 vec3 bg=vec3(.1216,.1176,.1137);
 // haze: gold along the lit limb, violet in the far sky
 float o0;float m0=moon(p,o0);
 vec2 uv=p/u_res;
 float limbGlow=exp(-max(o0,0.)/(u_res.x*.07))*smoothstep(1.2,.2,uv.x)*.16;
 float inner=m0>=0.?exp(o0/(u_res.x*.05))*.07:0.;
 vec3 col=bg+vec3(.886,.796,.592)*(limbGlow+inner);
 col+=vec3(.66,.61,.82)*.11*exp(-distance(uv,vec2(.95,.98))*2.6);
 col*=1.-.28*smoothstep(.35,1.25,distance(uv,vec2(.5,.55)));
 // halftone screen
 float pitch=6.5*u_dpr;
 vec2 g=p/pitch;float row=floor(g.y);float shift=mod(row,2.)*.5;
 vec2 cell=vec2(floor(g.x-shift)+.5+shift,row+.5);
 float o1;float b=moon(cell*pitch,o1);
 float d=length(g-cell);
 float aa=.75/pitch;
 if(b>=0.){
  float r=.64*sqrt(b);
  float a=smoothstep(r+aa,r-aa,d)*step(.012,b)*mix(.5,1.,smoothstep(.15,.85,uv.x))*(1.-.3*clamp(u_res.y/u_res.x-.9,0.,1.));
  vec3 ink=mix(vec3(.50,.46,.64),vec3(.93,.88,.745),clamp(b*2.6-.10,0.,1.));
  col=mix(col,ink,a*.66);
 }else{
  // a few faint stars, as dots
  float st=hash(cell+91.7);
  float tw=.6+.4*sin(u_time*.7+st*40.);
  float r=st>.9935?.20+.22*hash(cell+3.3):0.;
  col=mix(col,vec3(.93,.90,.82),smoothstep(r+aa,r-aa,d)*step(.001,r)*.55*tw);
 }
 col+=(hash(p+fract(u_time)*61.)-.5)*.012;
 gl_FragColor=vec4(col,1.);
}`;

export default function MoonField(){
 const ref=useRef(null),[fallback,setFallback]=useState(false);
 useEffect(()=>{
  const canvas=ref.current;if(!canvas)return;
  let gl=null;
  try{gl=canvas.getContext('webgl',{antialias:false,alpha:false,powerPreference:'low-power'})}catch{}
  if(!gl){setFallback(true);return;}
  const compile=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s)||'shader');return s;};
  let program;
  try{
   program=gl.createProgram();
   gl.attachShader(program,compile(gl.VERTEX_SHADER,VERT));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,FRAG));
   gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('link');
  }catch(error){console.warn('Moon field unavailable',error);setFallback(true);return;}
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const uRes=gl.getUniformLocation(program,'u_res'),uTime=gl.getUniformLocation(program,'u_time'),uScroll=gl.getUniformLocation(program,'u_scroll'),uDpr=gl.getUniformLocation(program,'u_dpr');
  const still=window.matchMedia('(prefers-reduced-motion: reduce)');
  let dpr=1,frame=0,last=0,alive=true;
  const size=()=>{
   dpr=Math.min(window.devicePixelRatio||1,1.5);
   const w=Math.max(1,Math.round(canvas.clientWidth*dpr)),h=Math.max(1,Math.round(canvas.clientHeight*dpr));
   if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
   gl.viewport(0,0,w,h);
  };
  const draw=time=>{
   gl.uniform2f(uRes,canvas.width,canvas.height);gl.uniform1f(uDpr,dpr);
   gl.uniform1f(uTime,still.matches?0:time/1000);gl.uniform1f(uScroll,window.scrollY*dpr);
   gl.drawArrays(gl.TRIANGLES,0,3);
  };
  const loop=time=>{
   if(!alive)return;
   if(time-last>=33){last=time;draw(time);}
   frame=still.matches||document.hidden?0:requestAnimationFrame(loop);
  };
  const kick=()=>{if(!frame&&alive){size();frame=requestAnimationFrame(loop);}};
  const onResize=()=>{size();if(!frame)draw(performance.now());kick();};
  const onScroll=()=>{if(still.matches)draw(0);};
  size();kick();
  window.addEventListener('resize',onResize);window.addEventListener('scroll',onScroll,{passive:true});
  document.addEventListener('visibilitychange',kick);still.addEventListener?.('change',kick);
  const lost=e=>{e.preventDefault();alive=false;setFallback(true);};
  canvas.addEventListener('webglcontextlost',lost);
  return()=>{alive=false;cancelAnimationFrame(frame);window.removeEventListener('resize',onResize);window.removeEventListener('scroll',onScroll);document.removeEventListener('visibilitychange',kick);still.removeEventListener?.('change',kick);canvas.removeEventListener('webglcontextlost',lost);};
 },[]);
 return <div className={'wk-moon'+(fallback?' wk-moon-fallback':'')} aria-hidden="true">{!fallback&&<canvas ref={ref}/>}</div>;
}
