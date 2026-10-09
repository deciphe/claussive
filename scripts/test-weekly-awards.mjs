import assert from 'node:assert/strict';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {emailHtml,emailText} from '../src/lib/leaderboard-email.js';
const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true},appType:'custom'});
try{
 const {default:Card}=await server.ssrLoadModule('/src/components/weekly/WeeklyAwards.jsx');
 const {PodiumCard}=await server.ssrLoadModule('/src/components/weekly/Weekly.jsx');
 const board={week:'2026-09-21',closed:true,start:Date.parse('2026-09-21T00:00:00Z')};
 const rows=[1,2,3].map(rank=>({address:'0x'+String(rank).repeat(40),rank,total:10000/rank,count:12,firms:{vest:10000/rank},transfers:[]}));
 const profiles=Object.fromEntries(rows.map(r=>[r.address,{username:'long_handle_123',avatar:'/traders/emi.jpg',tag:'Names worth knowing.'}]));
 for(const person of [null,...rows]){
  const html=renderToStaticMarkup(React.createElement(Card,{board,rows,profiles,firm:'vest',person,renderCard:r=>React.createElement(PodiumCard,{row:r,profiles,view:'weekly',board,selectedWeekKey:board.week,start:board.start})}));
  assert(html.includes('Sep 21 — Sep 27, 2026'));
  assert(html.includes(person?['Week leader','Second place','Third place'][person.rank-1]:'WEEKLY PODIUM'));
  assert(!html.includes('wk-daily'));
  assert(!html.includes('24h'));
  assert(html.includes('wk-podium-card'));
  assert.equal((html.match(/class="wk-trader-portrait"/g)||[]).length,person?1:3);
  assert(!html.includes('undefined'));
 }
 const {default:EmailCard}=await server.ssrLoadModule('/src/components/email/EmailRankCard.jsx');
 const trader={twitter:'massiveprop',name:'<script>bad</script>',tag:'Test',avatar:'https://example.com/avatar.jpg',avatarSource:'https://example.com/avatar.jpg'};
 const row={rank:20,total:12480,count:12};
 const card=renderToStaticMarkup(React.createElement(EmailCard,{trader,row,season:'2026-09-01',asOf:'2026-10-04T18:00:00Z'}));
 assert(card.includes('MASSIVE season payout rank card'));
 assert(card.includes('A place on the record.'));
 assert(card.includes('season rank'));
 assert(card.includes('long_handle_123')===false);
 const html=emailHtml({trader,row,season:'2026-09-01',seasonNumber:1,test:true});
 assert(html.includes('cid:massiveprop-rank-card'));
 assert(!html.includes('border-radius:18px'));
 const preview=emailHtml({trader,row,season:'2026-09-01',seasonNumber:1,test:true,rankCardHtml:card});
 assert(preview.includes('MASSIVE season payout rank card'));
 assert(!html.includes('<script>bad</script>'));
 assert(html.includes('&lt;script&gt;bad&lt;/script&gt;'));
 assert(html.includes('#massiveprop?profile='));
 assert(emailText({trader,row,season:'2026-09-01',test:true}).includes('#massiveprop?profile='));
 assert(!emailText({trader:{...trader,wallet:'0x123'},row,season:'2026-09-01'}).includes('#massiveprop?profile='));
 console.log('All four weekly cards render with correct dates, podium labels and portraits; email escaping and test links passed.');
}finally{await server.close()}
