import {BRAND_ASSETS} from '../../lib/brand-assets.js';
const marks={vest:BRAND_ASSETS.vest,breakout:BRAND_ASSETS.breakout,nova:BRAND_ASSETS.hypernova,hypernova:BRAND_ASSETS.hypernova,propr:BRAND_ASSETS.propr,vanta:BRAND_ASSETS.vanta};
export const firmMark=id=>marks[id];
export default function FirmAtmosphere({firm,className=''}){
 const src=firmMark(firm);
 return src?<img className={'firm-atmosphere '+className} src={src} alt="" aria-hidden="true" draggable="false"/>:null;
}
