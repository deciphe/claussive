import FirmAtmosphere,{firmMark} from '../design/FirmAtmosphere';
import {ArrowUpRight} from 'lucide-react';
import {BRAND_ASSETS} from '../../lib/brand-assets.js';
import './vest-hero-offer.css';
export default function SpeedManifesto({about,firms,onOpen}){
  return <section className="review-hero gp-hero-console" id="speed">
    <div className="review-hero-copy"><span className="gp-ghost-type" aria-hidden="true">MASSIVE</span><span className="gp-eyebrow">MASSIVE / WEB3 PROP FIRM REVIEWS</span>
      <h1>Choose the firm.<br/><em>Know the trade-off.</em></h1>
      <p>My shortlist for buying power, trading costs and getting paid. The upside, the catch, and the rules that matter.</p>
      <div className="review-hero-actions"><a className="gp-primary-link" href="#field">Compare the firms <ArrowUpRight size={16}/></a><a className="gp-hero-vest-offer" href="https://next.vestmarkets.com/r/isgigaprop" target="_blank" rel="sponsored noopener noreferrer" aria-label="Open Vest with MASSIVE’s referral link for 5% off"><img src={BRAND_ASSETS.vestSymbol} alt=""/><span><strong>Vest</strong><small>MASSIVE referral</small></span><b>5% OFF</b><ArrowUpRight size={15}/></a>{about}</div>
    </div>
    <aside className="gp-firm-editions gp-vault-directory" aria-label="Payout vaults"><div className="gp-vault-shell"><span className="gp-vault-ghost" aria-hidden="true">ENTER THE VAULT</span><div className="gp-vault-head"><div><span>PAYOUT VAULT</span><strong>Follow the money.</strong></div><a href="#flow">OPEN DIRECTORY <ArrowUpRight size={11}/></a></div><div className="gp-editions-grid">{firms.filter(firm=>firm.id!=='vanta').map((firm,i)=>{const href=firm.id==='hypernova'?'#novaflow':'#'+firm.id+'flow';return <a key={firm.id} className={'gp-edition gp-edition-'+firm.id} href={href} aria-label={'Enter '+firm.name+' payout vault'}><FirmAtmosphere firm={firm.id}/><span className="gp-edition-index">{String(i+1).padStart(2,'0')}</span><span className="gp-edition-identity"><img src={firmMark(firm.id)||firm.logo} alt=""/><b>{firm.name}</b></span><span className="gp-edition-label"><span>ONCHAIN PAYOUT FLOW</span><ArrowUpRight size={12}/></span></a>})}</div><div className="gp-vault-foot"><span>4 tracked payout vaults</span><span>Live public evidence</span></div></div></aside>
  </section>;
}
