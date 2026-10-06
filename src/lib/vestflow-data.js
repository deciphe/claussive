import {FLOW_CONFIGS} from './flow-config.js';
import {fetchFlow} from './flow-data.js';
export const {wallet:WALLET,token:TOKEN}=FLOW_CONFIGS.vest;
export const fetchVestflow=options=>fetchFlow(FLOW_CONFIGS.vest,options);
