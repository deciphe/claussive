import {VEST_CHAINS,NOVA_WALLETS} from './flow-config.js';
// Chain-specific, verified infrastructure; never infer ownership from transfer size.
// https://eth.blockscout.com/address/0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5
const infrastructure={Ethereum:{'0x5c7bcd6e7de5423a257d81b442095a1a6ced35c5':{label:'Across bridge',kind:'bridge'}}};
export function transferInfrastructure(t,config){
 const chain=t.chain||config.chain;
 return infrastructure[chain]?.[t.to?.toLowerCase()]||infrastructure[chain]?.[t.from?.toLowerCase()]||null;
}
export function firmWallets(sources){
 const id=sources[0]?.id;
 return id==='vest'?VEST_CHAINS:id==='nova'?NOVA_WALLETS:sources;
}
// Decoded processSending bridgeParams: destination, output amount, destination chain.
// This is the requested route, not independent evidence of destination settlement or ownership.
export const bridgeRoutes={
 '0x01706c9f2d8076f0de39e1df7295e2709d403619d69f417b2be76338b816f9ba':{
  address:'0x80c526d1c2fddadb3cd39810cd7a79e07b0eda00',chain:'Arbitrum',amount:600,explorer:'https://arbiscan.io',role:'Bridge contract; ownership unconfirmed'
 }
};

export function isPayoutRecipientTransfer(t,sources){
 if(t.direction!=='out')return false;
 const source=sources.find(s=>s.chain===t.chain)||sources[0];
 return BigInt(t.raw)>=10000n&&!transferInfrastructure(t,source)&&!firmWallets(sources).some(s=>s.wallet.toLowerCase()===t.to.toLowerCase());
}
