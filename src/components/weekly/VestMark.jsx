import {useEffect,useRef} from 'react';

// The Vest emblem, drawn as a halftone: lit from the upper left like the moon behind it.
const W=549,H=339,SCALE=2,PITCH=7.2;
const PATHS=[
 'M546.559 104.307L418.198 1.6418C415.785 -0.290179 412.222 1.43159 412.222 4.52475V217.483L546.559 110.043C548.401 108.561 548.401 105.768 546.559 104.307Z',
 'M130.463 1.64132L2.10114 104.296C0.259255 105.778 0.259255 108.571 2.10114 110.032L136.429 217.472V4.52427C136.429 1.43111 132.865 -0.260628 130.453 1.64132H130.463Z',
 'M272.038 325.934L136.429 217.482V335.143C136.429 337.165 138.06 338.827 140.112 338.827H408.597C410.62 338.827 412.281 337.195 412.281 335.143V217.482L276.672 325.934C275.331 327.005 273.439 327.005 272.068 325.934H272.038Z'
];
const GOLD=[240,226,190],VIOLET=[150,138,186];

export default function VestMark({className=''}){
 const ref=useRef(null);
 useEffect(()=>{
  const canvas=ref.current;
  if(!canvas||typeof Path2D==='undefined')return;
  const ctx=canvas.getContext('2d');
  canvas.width=W*SCALE;canvas.height=H*SCALE;
  const shapes=PATHS.map(d=>new Path2D(d));
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let row=0;row*PITCH<=H;row++){
   const shift=row%2?PITCH/2:0,y=row*PITCH;
   for(let x=shift;x<=W;x+=PITCH){
    if(!shapes.some(shape=>ctx.isPointInPath(shape,x,y)))continue;
    const t=Math.min(1,Math.max(0,x/W*.55+y/H*.55));
    const light=1-.62*t*t;
    const radius=PITCH*.44*Math.sqrt(light);
    const k=Math.min(1,Math.max(0,t*1.1-.3));
    ctx.fillStyle=`rgb(${Math.round(GOLD[0]+(VIOLET[0]-GOLD[0])*k)},${Math.round(GOLD[1]+(VIOLET[1]-GOLD[1])*k)},${Math.round(GOLD[2]+(VIOLET[2]-GOLD[2])*k)})`;
    ctx.beginPath();ctx.arc(x*SCALE,y*SCALE,radius*SCALE,0,Math.PI*2);ctx.fill();
   }
  }
 },[]);
 return <canvas ref={ref} className={className} width={W*SCALE} height={H*SCALE} role="img" aria-label="Vest"/>;
}
