import {useEffect,useRef,useState} from 'react';

// Tones a trader photo to the page palette and lets it break up into halftone
// dots along its left and bottom edges. Falls back to the plain photo when the
// image cannot be read (for example a host without CORS headers).
const N=560,PITCH=7;
const LO=[22,21,22],MID=[122,114,138],HI=[240,232,214];
const clamp=v=>v<0?0:v>1?1:v;
const fade=(x,y)=>Math.pow(clamp((x-.05)/.46)*clamp((.97-y)/.36)*clamp(y/.2),1.15);

export default function HalftonePortrait({src,className='',alt=''}){
 const ref=useRef(null),[plain,setPlain]=useState(false);
 useEffect(()=>{
  setPlain(false);
  if(!src)return;
  let cancelled=false;
  const image=new Image();
  image.crossOrigin='anonymous';
  image.decoding='async';
  image.onerror=()=>{if(!cancelled)setPlain(true)};
  image.onload=()=>{
   if(cancelled||!ref.current)return;
   try{
    const canvas=ref.current,ctx=canvas.getContext('2d',{willReadFrequently:true});
    canvas.width=N;canvas.height=N;
    const side=Math.min(image.naturalWidth,image.naturalHeight);
    ctx.drawImage(image,(image.naturalWidth-side)/2,(image.naturalHeight-side)/2,side,side,0,0,N,N);
    const frame=ctx.getImageData(0,0,N,N),px=frame.data;
    // stretch contrast between the 2nd and 98th percentile
    const hist=new Uint32Array(256);
    for(let i=0;i<px.length;i+=4)hist[Math.round(px[i]*.299+px[i+1]*.587+px[i+2]*.114)]++;
    let lo=0,hi=255,acc=0;const total=N*N;
    for(let v=0;v<256;v++){acc+=hist[v];if(acc>=total*.02){lo=v;break;}}
    acc=0;for(let v=255;v>=0;v--){acc+=hist[v];if(acc>=total*.02){hi=v;break;}}
    const span=Math.max(1,hi-lo);
    for(let y=0;y<N;y++){
     const row=Math.round(y/PITCH),shift=row%2?PITCH/2:0,cy=row*PITCH;
     for(let x=0;x<N;x++){
      const i=(y*N+x)*4;
      let t=clamp((px[i]*.299+px[i+1]*.587+px[i+2]*.114-lo)/span);
      t=clamp((t-.5)*1.12+.5);
      const a=t<.5?LO:MID,b=t<.5?MID:HI,k=t<.5?t/.5:(t-.5)/.5;
      px[i]=a[0]+(b[0]-a[0])*k;px[i+1]=a[1]+(b[1]-a[1])*k;px[i+2]=a[2]+(b[2]-a[2])*k;
      const cx=Math.round((x-shift)/PITCH)*PITCH+shift;
      const m=fade(cx/N,cy/N);
      const radius=PITCH*.8*Math.sqrt(m),dist=Math.hypot(x-cx,y-cy);
      px[i+3]=m>.8?255:Math.round(255*clamp(radius-dist+.5));
     }
    }
    ctx.putImageData(frame,0,0);
   }catch{setPlain(true)}
  };
  image.src=src;
  return()=>{cancelled=true};
 },[src]);
 if(!src)return null;
 return plain?<img className={className+' wk-portrait-plain'} src={src} alt={alt}/>:<canvas ref={ref} className={className} role={alt?'img':undefined} aria-label={alt||undefined} aria-hidden={alt?undefined:'true'}/>;
}

// Wallets without a photo get a small halftone moon of their own, shaped by the address.
export function Moonlet({seed='',className=''}){
 const ref=useRef(null);
 useEffect(()=>{
  const canvas=ref.current;if(!canvas)return;
  const css=canvas.clientWidth||48,n=Math.max(64,Math.round(css*Math.min(window.devicePixelRatio||1,2)));
  canvas.width=n;canvas.height=n;
  const ctx=canvas.getContext('2d');
  let h=2166136261;for(let i=0;i<seed.length;i++){h^=seed.charCodeAt(i);h=Math.imul(h,16777619);}
  const rnd=()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return(h>>>0)/4294967296;};
  const angle=rnd()*Math.PI*2,L=[Math.cos(angle)*.66,Math.sin(angle)*.66,.36];
  const craters=Array.from({length:3+Math.floor(rnd()*4)},()=>{const a=rnd()*Math.PI*2,d=Math.sqrt(rnd())*.72;return{x:Math.cos(a)*d,y:Math.sin(a)*d,r:.09+rnd()*.16};});
  const cells=css>=120?34:13,pitch=n/cells,R=n/2-pitch*.6;
  for(let row=0;row<=cells;row++){
   const shift=row%2?pitch/2:0,y=row*pitch;
   for(let x=shift;x<=n;x+=pitch){
    const qx=(x-n/2)/R,qy=(y-n/2)/R,d2=qx*qx+qy*qy;
    if(d2>=1)continue;
    const z=Math.sqrt(1-d2);
    let b=Math.max(0,qx*L[0]+qy*L[1]+z*L[2]);
    for(const c of craters){const dd=Math.hypot(qx-c.x,qy-c.y)/c.r;if(dd<1)b*=.3+.5*dd;else if(dd<1.3)b*=1.22;}
    b=Math.min(1,Math.pow(b,.85)*1.05+.04);
    const k=Math.min(1,Math.max(0,b*1.6-.15));
    ctx.fillStyle=`rgb(${Math.round(150+88*k)},${Math.round(138+86*k)},${Math.round(186+4*k)})`;
    ctx.beginPath();ctx.arc(x,y,pitch*.52*Math.sqrt(b),0,Math.PI*2);ctx.fill();
   }
  }
 },[seed]);
 return <canvas ref={ref} className={className} aria-hidden="true"/>;
}
