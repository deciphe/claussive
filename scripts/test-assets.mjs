import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const exists=p=>fs.existsSync(path.join(root,p));
const fail=[];
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  const p=path.join(dir,e.name);
  return e.isDirectory()?walk(p):[p];
});

const sourceFiles=walk('src').filter(p=>/\.(js|jsx|css)$/.test(p));
const forbidden=[
  {re:/["']\/brands\//g,label:'root-relative /brands asset'},
  {re:/["']\/traders\//g,label:'root-relative /traders asset'},
  {re:/["']\/wisp\.webp["']/g,label:'root-relative Wisp asset'},
  {re:/url\(["']\/brands\//g,label:'root-relative CSS brand asset'},
];
for(const file of sourceFiles){
  const text=fs.readFileSync(file,'utf8');
  for(const rule of forbidden){
    if(rule.re.test(text)) fail.push(`${file}: ${rule.label}`);
    rule.re.lastIndex=0;
  }
}

const brandSource=fs.readFileSync('src/lib/brand-assets.js','utf8');
for(const m of brandSource.matchAll(/public\/brands\/([^'"]+)/g)){
  const p='public/brands/'+m[1];
  if(!exists(p)) fail.push(`Missing brand asset: ${p}`);
}

const traders=JSON.parse(fs.readFileSync('src/data/traders.json','utf8'));
for(const t of traders){
  if(!/^https?:\/\//i.test(t.image||'')){
    const p='public/traders/'+t.image;
    if(!exists(p)) fail.push(`Missing trader image for @${t.twitter}: ${p}`);
  }
}

const payoutSource=fs.readFileSync('src/components/payoutlab/data.js','utf8');
for(const m of payoutSource.matchAll(/"image":\s*"([^"]+)"/g)){
  const original=m[1];
  const idMatch=payoutSource.slice(0,m.index).match(/"id":\s*"([^"]+)"[^]*$/);
  const id=idMatch?.[1]||'';
  let rel=original;
  if(original.startsWith('payouts/maven/')&&!['maven-001','maven-002','maven-003','maven-004','maven-005'].includes(id)){
    rel=`payouts/maven-dark/${id}-dark.png`;
  } else if(original.startsWith('payouts/topstep-studio/')){
    rel=`payouts/topstep-obsidian/${id}.svg`;
  }
  if(!exists('public/'+rel)) fail.push(`Missing payout asset for ${id||original}: public/${rel}`);
}

if(fail.length){
  console.error('\nAsset audit failed:\n- '+fail.join('\n- '));
  process.exit(1);
}
console.log('Asset audit passed: brand marks, trader portraits, payout proofs, and source paths are intact.');
