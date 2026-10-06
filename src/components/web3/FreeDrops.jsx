import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import './free-drops.css';

export default function FreeDrops(){
  const [status,setStatus]=useState('idle');
  async function submit(event){
    event.preventDefault();
    if(status==='sending')return;
    const form=event.currentTarget, fields=new FormData(form);
    if(fields.get('website'))return;
    setStatus('sending');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch('https://formsubmit.co/ajax/gp@gigaprop.xyz',{
        method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},signal:controller.signal,
        body:JSON.stringify({email:fields.get('email').trim(),telegram:fields.get('telegram').trim(),
          consent:'Send me GIGAPROP free drops and occasional updates by email, or Telegram if provided. I can opt out anytime.',
          source:'gigaprop.xyz / free drops',_subject:'GIGAPROP — free drops signup',_honey:''})
      });
      const data=await response.json();
      if(!response.ok||!(data.success===true||data.success==='true'))throw new Error('Not accepted');
      setStatus('success');form.reset();
    }catch{setStatus('error');}finally{clearTimeout(timer);}
  }
  return <section className="gp-drops" id="drops" aria-labelledby="drops-title">
    <div className="gp-drops-copy"><span className="gp-eyebrow">FREE DROPS / BY COULDBELUCK</span>
      <h2 id="drops-title">See props<br/><em>differently.</em></h2>
      <p>Free lessons and proprietary gigaprop knowledge built to open your eyes and make you see prop trading differently.</p>
      <span className="gp-drops-signoff">Only what actually matters.</span>
    </div>
    <div className="gp-drops-entry">
      <h3>Get the next drop.</h3><p>Leave your email. Add Telegram if you prefer a direct line.</p>
      {status==='success'?<div className="gp-drops-success" role="status"><span>✓</span><h3>You’re on the list.</h3><p>Keep an eye out for the next drop.</p></div>:<form onSubmit={submit}>
        <label htmlFor="drop-email">Email</label><input id="drop-email" name="email" type="email" autoComplete="email" placeholder="you@email.com" required maxLength={254} disabled={status==='sending'}/>
        <label htmlFor="drop-telegram">Telegram <span>optional</span></label><input id="drop-telegram" name="telegram" placeholder="@username" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={33} pattern="@?[A-Za-z][A-Za-z0-9_]{4,31}" title="Your Telegram username, with or without @" disabled={status==='sending'}/>
        <div className="gp-drops-trap" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
        <button disabled={status==='sending'}>{status==='sending'?'Joining…':'Get free drops'}<ArrowUpRight size={18}/></button>
        <p className="gp-drops-consent">By joining, you agree to receive free drops and occasional updates by email, or Telegram if provided. Opt out anytime.</p>
        {status==='error'&&<p className="gp-drops-error" role="alert">Couldn’t send that. Please retry, or email <a href="mailto:gp@gigaprop.xyz">gp@gigaprop.xyz</a>.</p>}
      </form>}
      <details className="gp-drops-privacy"><summary>Your details stay off the site.</summary><p>Your signup is sent through FormSubmit to gp@gigaprop.xyz. We use your details for GIGAPROP updates. To stop messages or request deletion, email <a href="mailto:gp@gigaprop.xyz?subject=Unsubscribe">gp@gigaprop.xyz</a>.</p></details>
    </div>
  </section>;
}
