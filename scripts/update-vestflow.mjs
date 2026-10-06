import { mkdir, writeFile } from 'node:fs/promises';
import {fetchVestflow} from '../src/lib/vestflow-data.js';
const snapshot=await fetchVestflow();
const dest=process.argv[2]||'public/data/vestflow.json';
await mkdir(dest.slice(0,dest.lastIndexOf('/'))||'.',{recursive:true});
await writeFile(dest,JSON.stringify(snapshot));
console.log(`Saved ${snapshot.transfers.length} transfers; balance ${snapshot.balance} USDC`);
