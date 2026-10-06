import {WEEK,weekStart,weekKey} from './weekly-leaderboard.js';

export function validWeeklyKey(key){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(key||''))return false;
 const start=Date.parse(key+'T00:00:00Z');
 return Number.isFinite(start)&&weekKey(start)===key&&weekStart(start)===start;
}
export function validWeeklyEdition(board,key){
 return validWeeklyKey(key)&&board?.available===true&&board.week===key&&board.start===Date.parse(key+'T00:00:00Z')&&Array.isArray(board.transfers)&&Number.isFinite(Date.parse(board.asOf))&&Number.isFinite(board.end);
}
export function weeklyAwardsUnlocked(board,now=Date.now()){
 return validWeeklyEdition(board,board?.week)&&board.closed===true&&now>=board.start+WEEK&&board.end>=board.start+WEEK&&Date.parse(board.asOf)>=board.start+WEEK;
}
export const weeklyAwardRange=start=>new Date(start).toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'})+' — '+new Date(start+WEEK-1).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
