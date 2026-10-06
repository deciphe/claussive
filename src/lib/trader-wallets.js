// Editorial wallet groups supplied by MASSIVE. Grouping is not signature verification.
// Keep the first address stable: it is the profile/link key. Transfers retain their actual recipient.
export const TRADER_WALLET_GROUPS=[
 ['0x2f2c91a08aa283359b41850adb9ea3d65b36f3d3','0x35ef3c419ec40173f42a64ac65c26d9dbd405bea'],
 ['0x7f37831a31f7b751e4965eccb314b1b0c63a4b5e','0xfed7398ca8f8ec71c06c35351ffb25a9a373d763'],
 ['0x6d10390770e821c4529d32e7903e941c96f01e5a','0x69fc2f54c08babb705a5a6da3b5de8930a86505b']
];
const owners=new Map();
for(const group of TRADER_WALLET_GROUPS){
 for(const address of group){
  if(!/^0x[a-f0-9]{40}$/.test(address)||owners.has(address))throw Error('Invalid or overlapping trader wallet group');
  owners.set(address,group[0]);
 }
}
export const canonicalTraderWallet=address=>owners.get(address?.toLowerCase())||address?.toLowerCase();
export const traderWallets=address=>{
 const primary=canonicalTraderWallet(address);
 return TRADER_WALLET_GROUPS.find(group=>group[0]===primary)||[primary];
};
