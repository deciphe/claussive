import {weeklyBoard,weekKey,validSnapshot,weeklySources} from './weekly-leaderboard.js';
import {FLOW_SOURCES} from './flow-config.js';
export const SEASON_ONE=Date.parse('2026-09-01T00:00:00Z');
const REGULAR_START=Date.parse('2027-01-01T00:00:00Z');
export function seasonStart(time=Date.now()){
 if(time<REGULAR_START)return SEASON_ONE;
 const d=new Date(time);return Date.UTC(d.getUTCFullYear(),Math.floor(d.getUTCMonth()/3)*3,1);
}
export function seasonEnd(start){if(start===SEASON_ONE)return REGULAR_START;const d=new Date(start);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+3,1);}
export const seasonDuration=start=>seasonEnd(start)-start;
export const SEASON=REGULAR_START-SEASON_ONE;
export const seasonKey=weekKey;
export const seasonNumber=start=>start===SEASON_ONE?1:2+(new Date(start).getUTCFullYear()-2027)*4+Math.floor(new Date(start).getUTCMonth()/3);
export const validSeasonKey=key=>/^\d{4}-\d{2}-\d{2}$/.test(key)&&Date.parse(key+'T00:00:00Z')>=SEASON_ONE&&weekKey(seasonStart(Date.parse(key+'T00:00:00Z')))===key;
// Rebuild the launch season only from contiguous, complete archived coverage.
export function seedSeason(archives,start){
 let cursor=start,latest=null;const transfers=[];
 for(const a of [...archives].filter(a=>a?.available).sort((a,b)=>a.start-b.start)){
  if(a.end<=cursor)continue;if(a.start>cursor)break;
  transfers.push(...a.transfers.filter(t=>Date.parse(t.timestamp)>=start&&Date.parse(t.timestamp)<seasonEnd(start)));
  cursor=Math.min(a.end,seasonEnd(start));latest=a;if(cursor===seasonEnd(start))break;
 }
 return latest?{...latest,version:3,start,end:cursor,week:weekKey(start),season:seasonNumber(start),duration:seasonDuration(start),closed:cursor===seasonEnd(start),transfers:[...new Map(transfers.map(t=>[t.id,t])).values()]}:null;
}
export function seasonBoard(snapshots,start,now=Date.now(),prior=null,firmId='all',options={}){
 if(!validSeasonKey(weekKey(start)))return {available:false,missing:['Valid season boundary']};
 const sources=firmId==='all'?FLOW_SOURCES:weeklySources(firmId);
 if(sources.some(s=>!validSnapshot(snapshots[s.slug],s)))return {available:false,missing:['Complete source snapshots']};
 const coverageStart=Math.max(start,...sources.map(s=>Date.parse(snapshots[s.slug].periodStart)));
 const end=seasonEnd(start),duration=end-start;
 if(prior?.closed&&prior.start===start&&prior.duration===duration)return prior;
 if(coverageStart>start&&(!prior?.available||prior.start!==start||prior.duration!==duration||prior.end<Math.min(coverageStart,end)))return {available:false,missing:['Complete season history; archive coverage has a gap']};
 if(coverageStart>=end){if(prior?.end>=end)return {...prior,closed:true};return {available:false,missing:['Season closing snapshot']};}
 const fresh=weeklyBoard(snapshots,coverageStart,now,end-coverageStart,firmId,options);
 if(!fresh.available)return fresh;
 const transfers=[...(coverageStart>start?prior.transfers.filter(t=>(firmId==='all'||t.firm===firmId)&&Date.parse(t.timestamp)<coverageStart):[]),...fresh.transfers];
 const unique=[...new Map(transfers.map(t=>[t.id,t])).values()];
 return {...fresh,version:3,start,end:fresh.end,week:weekKey(start),season:seasonNumber(start),duration,closed:fresh.closed,transfers:unique};
}
