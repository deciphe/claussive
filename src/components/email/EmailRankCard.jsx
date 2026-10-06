import WeeklyPoster from '../weekly/WeeklyPoster';
export default function EmailRankCard({trader,row,season,asOf}){
 const address=trader.wallet||'',person={...row,address,firms:{vest:row.total}};
 const image=trader.avatarSource||trader.avatar||(trader.image?(/^https?:/.test(trader.image)?trader.image:'https://raw.githubusercontent.com/deciphe/massiveprop/main/public/traders/'+trader.image):'');
 const profiles={[address]:{username:trader.twitter.replace(/^@/,''),displayName:trader.name,tag:trader.tag,avatar:image,editorial:true}};
 const board={start:Date.parse(season+'T00:00:00Z'),asOf:asOf||new Date().toISOString(),closed:false};
 return <WeeklyPoster board={board} rows={[person]} profiles={profiles} firm="vest" person={person}/>;
}
