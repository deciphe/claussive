const marks={vest:'/brands/vest-emblem.svg',breakout:'/brands/breakout.ico',nova:'/brands/hypernova.ico',hypernova:'/brands/hypernova.ico',propr:'/brands/propr-icon.svg',vanta:'/brands/vanta.png'};
export const firmMark=id=>marks[id];
export default function FirmAtmosphere({firm,className=''}){
 const src=firmMark(firm);
 return src?<img className={'firm-atmosphere '+className} src={src} alt="" aria-hidden="true" draggable="false"/>:null;
}
