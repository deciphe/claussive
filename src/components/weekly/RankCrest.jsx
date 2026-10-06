import {useId} from 'react';
export default function RankCrest({rank=1,hero=false}){
 const id=useId().replace(/:/g,'');
 const colors=rank===1?['#fff0ba','#d3a65b','#90682f']:rank===2?['#e4ffff','#6fcefa','#477ba6']:['#f5deff','#b89aff','#6a4ba3'];
 return <svg className={'wk-crest'+(hero?' wk-crest-hero':'')} width="240" height="190" viewBox="0 0 240 190" aria-hidden="true">
 <defs><linearGradient id={id+'m'} x2=".8" y2="1"><stop stopColor={colors[0]}/><stop offset=".48" stopColor={colors[1]}/><stop offset="1" stopColor={colors[2]}/></linearGradient><linearGradient id={id+'c'} x2="1" y2="1"><stop stopColor="#8bf5ff"/><stop offset=".5" stopColor="#3189df"/><stop offset="1" stopColor="#6350be"/></linearGradient></defs>
 <circle cx="120" cy="94" r="65" fill="none" stroke={colors[1]} opacity=".18"/><circle cx="120" cy="94" r="76" fill="none" stroke={colors[1]} strokeDasharray="2 10" opacity=".25"/>
 <g fill={'url(#'+id+'m)'} stroke={colors[0]} strokeWidth=".5"><path d="M92 82 27 39 39 80 79 112 46 93 59 119 93 136 73 133 89 153 107 148Z"/><path d="m148 82 65-43-12 41-40 32 33-19-13 26-34 17 20-3-16 20-18-5Z"/><path d="m91 54-8-27 25 16 12-29 12 29 25-16-8 27-29 17Z"/><path d="m120 48 42 28-9 66-33 31-33-31-9-66Z"/></g>
 <path d="m120 59 31 23-7 54-24 24-24-24-7-54Z" fill="#07162d" stroke={colors[0]} strokeWidth="1.5"/>
 <path d="m120 69 20 29-20 43-20-43Z" fill={'url(#'+id+'c)'} stroke="#aff7ff" strokeWidth="1"/><path d="m120 69 0 72-20-43Z" fill="#c1ffff" opacity=".2"/><path d="m100 98 40 0-20 8Z" fill="#e0ffff" opacity=".45"/>
 {!hero&&<><path d="m97 129 46 0-4 24-19 12-19-12Z" fill="#091225" stroke={colors[1]}/><text x="120" y="149" textAnchor="middle" fill={colors[0]} fontSize="17" fontWeight="800" fontFamily="Manrope,sans-serif">{rank===1?'I':rank===2?'II':'III'}</text></>}
 </svg>;
}
