export const firms = [
  {
    id:"hypernova", name:"Hypernova", mark:"HN", domain:"hypernova.xyz", logo:"/brands/hypernova.ico", url:"https://hn.xyz/r/4sjg1b", referral:true,
    status:"ON-CHAIN", venue:"Hyperliquid", price:280, plan:"Low Risk", target:10, daily:"3%", drawdown:"6% static", split:"80%",
    payout:"Instant · on-chain", leverage:"10x NQ · 5x BTC · 10x CL", indexLev:10, edge:"sub-second on-chain payouts",
    note:"On-chain risk engine, public payout reserve and Hyperliquid-sourced market data.",
    orbit:{x:"49%",y:"8%",delay:"-1.5s"},
    defaultProgram:"low",
    programs:[
      {
        id:"tight", label:"Tight", badge:"LIVE", target:"9%", daily:"3%", drawdown:"3% static", split:"80%", leverage:"Per-symbol", payout:"Instant · 24/7 USDC", minDays:"0", timeLimit:"None",
        tags:["1-step","No consistency","No bot restrictions"],
        sizes:[{balance:5000,fee:25},{balance:10000,fee:50},{balance:25000,fee:120},{balance:50000,fee:200},{balance:100000,fee:400},{balance:200000,fee:800}]
      },
      {
        id:"low", label:"Low", badge:"LIVE", target:"10%", daily:"3%", drawdown:"6% static", split:"80%", leverage:"Per-symbol", payout:"Instant · 24/7 USDC", minDays:"0", timeLimit:"None",
        tags:["1-step","No consistency","No profit cap"],
        sizes:[{balance:5000,fee:60},{balance:10000,fee:115},{balance:25000,fee:280},{balance:50000,fee:495},{balance:100000,fee:999},{balance:200000,fee:1850}]
      },
      {
        id:"medium", label:"Medium", badge:"LIVE", target:"10%", daily:"4%", drawdown:"7% static", split:"80%", leverage:"Per-symbol", payout:"Instant · 24/7 USDC", minDays:"0", timeLimit:"None",
        tags:["1-step","No consistency","Widest public tier"],
        sizes:[{balance:5000,fee:80},{balance:10000,fee:150},{balance:25000,fee:365},{balance:50000,fee:675},{balance:100000,fee:1350},{balance:200000,fee:null,feeLabel:"TBD",disabled:true}]
      },
      {
        id:"high", label:"High", badge:"RESTRICTED", target:"10%", daily:"5%", drawdown:"8% static", split:"80%", leverage:"Per-symbol", payout:"Instant · 24/7 USDC", minDays:"0", timeLimit:"None",
        tags:["Restricted access","1-step"],
        sizes:[5000,10000,25000,50000,100000,200000].map(balance=>({balance,fee:null,feeLabel:"Restricted",disabled:true}))
      }
    ]
  },
  {
    id:"propr", name:"Propr", mark:"PR", domain:"propr.xyz", logo:"/brands/propr-icon.svg", url:"https://app.propr.xyz/r/7gJmpEjv", referral:true,
    status:"ON-CHAIN", venue:"Hyperliquid", price:275, plan:"Classic", target:10, daily:"3%", drawdown:"6% static", split:"80%",
    payout:"On-demand · USDC", leverage:"Up to 10x", indexLev:10, edge:"API-first prop stack",
    note:"REST API, Python and JS SDKs with on-chain USDC payouts.",
    orbit:{x:"78%",y:"20%",delay:"-4.2s"},
    defaultProgram:"classic",
    programs:[
      {
        id:"classic",label:"Classic",badge:"1-STEP",target:"10%",daily:"3%",drawdown:"6% static",split:"80%",leverage:"Up to 10x",payout:"On-demand · min $20",minDays:"0",timeLimit:"None",
        tags:["Static DD","No consistency","Bots allowed"],
        sizes:[{balance:5000,fee:60},{balance:10000,fee:110},{balance:25000,fee:275},{balance:50000,fee:495},{balance:100000,fee:999},{balance:200000,fee:1998}]
      },
      {
        id:"turbo",label:"Turbo",badge:"1-STEP",target:"9%",daily:"3%",drawdown:"3% static",split:"80%",leverage:"Up to 10x",payout:"On-demand · min $20",minDays:"0",timeLimit:"None",
        tags:["Lowest fee","Tightest DD","Bots allowed"],
        sizes:[{balance:5000,fee:25},{balance:10000,fee:50},{balance:25000,fee:125},{balance:50000,fee:245},{balance:100000,fee:450},{balance:200000,fee:899}]
      },
      {
        id:"pro",label:"Pro",badge:"1-STEP",target:"12%",daily:"3%",drawdown:"5% static",split:"80%",leverage:"Up to 10x",payout:"On-demand · min $20",minDays:"0",timeLimit:"None",
        tags:["Balanced buffer","Static DD","Bots allowed"],
        sizes:[{balance:5000,fee:45},{balance:10000,fee:85},{balance:25000,fee:185},{balance:50000,fee:355},{balance:100000,fee:699},{balance:200000,fee:1399}]
      },
      {
        id:"2step",label:"Classic 2-Step",badge:"2-STEP",target:"5% → 10%",daily:"5%",drawdown:"8% trailing",split:"80%",leverage:"Up to 10x",payout:"On-demand · min $20",minDays:"0",timeLimit:"None",
        tags:["Equity HWM","Trails to starting balance","Full-profit sweep"],
        sizes:[{balance:5000,fee:50},{balance:10000,fee:100},{balance:25000,fee:250},{balance:50000,fee:450},{balance:100000,fee:749},{balance:200000,fee:1499}]
      }
    ]
  },
  {
    id:"doji", name:"DojiFunded", mark:"DJ", domain:"dojifunded.com", logo:"/brands/dojifunded.png", url:"https://www.dojifunded.com/",
    status:"ARBITRUM", venue:"GMX + Ostium", price:231, plan:"1-Step", target:10, daily:"3%", drawdown:"6%", split:"80%",
    payout:"On-demand · USDC", leverage:"Up to 25x FX", indexLev:10, edge:"Multi-venue on-chain",
    note:"On-chain account records, multi-asset execution and API automation.",
    orbit:{x:"91%",y:"50%",delay:"-2.8s"},
    defaultProgram:"1step",
    programs:[
      {
        id:"1step",label:"1-Step",badge:"LIVE",target:"10%",daily:"3%",drawdown:"6%",split:"80% · 90% add-on",leverage:"5x crypto · 10x index · 25x FX",payout:"On-demand · USDC",minDays:"0",timeLimit:"None",
        tags:["60s min hold","No consistency","90% split +20%"],
        sizes:[{balance:1000,fee:12},{balance:5000,fee:51},{balance:10000,fee:93},{balance:25000,fee:231},{balance:50000,fee:416},{balance:100000,fee:840}]
      },
      {
        id:"elite",label:"2-Step Elite",badge:"LIVE",target:"10% → 5%",daily:"5%",drawdown:"8% static",split:"80% · 90% add-on",leverage:"5x crypto · 10x index · 25x FX",payout:"On-demand · USDC",minDays:"0",timeLimit:"None",
        tags:["Wider room","60s min hold","90% split +20%"],
        sizes:[{balance:1000,fee:12},{balance:5000,fee:50},{balance:10000,fee:100},{balance:25000,fee:250},{balance:50000,fee:450},{balance:100000,fee:900}]
      },
      {
        id:"classic2",label:"2-Step Classic",badge:"LIVE",target:"10% → 5%",daily:"3%",drawdown:"6% static",split:"80% · 90% add-on",leverage:"5x crypto · 10x index · 25x FX",payout:"On-demand · USDC",minDays:"0",timeLimit:"None",
        tags:["Lower entry","60s min hold","90% split +20%"],
        sizes:[{balance:1000,fee:10},{balance:5000,fee:42},{balance:10000,fee:84},{balance:25000,fee:210},{balance:50000,fee:380},{balance:100000,fee:752}]
      },
      {
        id:"instant",label:"Instant",badge:"COMING SOON",target:"—",daily:"—",drawdown:"—",split:"—",leverage:"Market-specific",payout:"—",minDays:"—",timeLimit:"—",
        tags:["Listed by Doji","Not yet in live price grid"],
        sizes:[{balance:null,fee:null,feeLabel:"Coming soon",disabled:true}]
      }
    ]
  },
  {
    id:"vanta", name:"Vanta", mark:"VA", domain:"vantatrading.io", logo:"/brands/vanta.png", url:"https://www.vantatrading.io/",
    status:"DECENTRALIZED", venue:"Multi-asset", price:199, plan:"Classic", target:10, daily:"5%", drawdown:"5% static", split:"100% default",
    payout:"Weekly · on-chain", leverage:"2.5x base indices", indexLev:2.5, edge:"100% split by default",
    note:"One-step Classic with selectable split and buying power; Pro is earned, not purchased.",
    orbit:{x:"75%",y:"80%",delay:"-5.4s"},
    defaultProgram:"classic",
    programs:[
      {
        id:"classic",label:"Classic",badge:"LIVE",target:"10%",daily:"5%",drawdown:"5% static",split:"60–100% · 100% default",leverage:"Base: 1.5x crypto · 2.5x index · 10x FX",payout:"Weekly · USD / USDC",minDays:"0",timeLimit:"None",
        tags:["No consistency","Boost I +$100","Boost II +$200"],
        extras:["Boost I: 2x crypto · 4x index · 15x FX","Boost II: 2.5x crypto · 5x index · 20x FX","Payout does not reduce equity"],
        sizes:[
          {balance:5000,fee:39,listFee:44},{balance:10000,fee:79,listFee:89},{balance:25000,fee:199,listFee:224},{balance:50000,fee:299,listFee:449},{balance:100000,fee:599,listFee:899}
        ]
      },
      {
        id:"pro",label:"Pro",badge:"PROMOTION",target:"6%",daily:"5%",drawdown:"8% trailing EOD",split:"Chosen split carries over",leverage:"6x crypto · 10x index · 35x FX",payout:"Weekly · rewards continue",minDays:"90-day challenge",timeLimit:"90+ days",
        tags:["Not sold directly","50K / 100K Classic → Pro","Up to $1M"],
        extras:["No day >20% of total return","Daily return contribution capped at 1.5%","Promotion at Vanta discretion"],
        sizes:[{balance:50000,fee:null,feeLabel:"Earned",disabled:false},{balance:100000,fee:null,feeLabel:"Earned",disabled:false},{balance:1000000,fee:null,feeLabel:"Up to",disabled:false}]
      }
    ]
  },
  {
    id:"vest", name:"Vest", mark:"VE", domain:"vestmarkets.com", logo:"/brands/vest.ico", url:"https://next.vestmarkets.com/r/isgigaprop", referral:true, referralCode:"GIGA",
    status:"PERPS", venue:"Vest Markets", price:199.50, plan:"1-Step 10%", target:10, daily:"3%", drawdown:"6%", split:"80%",
    payout:"Instant · USDC", leverage:"50x NQ · up to 100x", indexLev:50, edge:"Extreme market leverage",
    note:"24/7 multi-asset perps with multiple evaluation styles and instant funded accounts.",
    orbit:{x:"43%",y:"91%",delay:"-3.6s"},
    // Vest /v3/capital/plans verified 2026-10-04; evaluation fees include advertised GIGA 5% discount.
    defaultProgram:"eval10",
    programs:[
      {
        id:"eval10",label:"1-Step · 10%",badge:"LIVE",target:"10%",daily:"3%",drawdown:"6%",split:"80%",leverage:"50x NQ · up to 100x platform",payout:"Instant · USDC",minDays:"0",timeLimit:"None shown",
        tags:["Evaluation","Cross margin","Prices with 5% off · GIGA"],
        sizes:[{balance:5000,fee:38,listFee:40},{balance:10000,fee:76,listFee:80},{balance:25000,fee:199.50,listFee:210}]
      },
      {
        id:"eval20",label:"1-Step · 20%",badge:"LIVE",target:"20%",daily:"3%",drawdown:"6%",split:"80%",leverage:"50x NQ · up to 100x platform",payout:"Instant · USDC",minDays:"0",timeLimit:"None shown",
        tags:["Higher target","Cross margin","Prices with 5% off · GIGA"],
        sizes:[{balance:5000,fee:23.75,listFee:25},{balance:10000,fee:47.50,listFee:50},{balance:25000,fee:123.50,listFee:130}]
      },
      {
        id:"nodaily",label:"No Daily Loss",badge:"LIVE",target:"10%",daily:"None",drawdown:"6%",split:"80%",leverage:"50x NQ · up to 100x platform",payout:"Instant · USDC",minDays:"0",timeLimit:"None shown",
        tags:["No daily loss limit","Cross margin","Prices with 5% off · GIGA"],
        sizes:[{balance:5000,fee:71.25,listFee:75},{balance:10000,fee:142.50,listFee:150},{balance:25000,fee:356.25,listFee:375}]
      },
      {
        id:"instant",label:"Instant",badge:"LIVE",target:"None",daily:"None",drawdown:"Market/account limit",split:"80%",leverage:"Up to 100x platform",payout:"Instant · USDC",minDays:"0",timeLimit:"None",
        tags:["No evaluation target","Wallet-native"],
        sizes:[{balance:500,fee:10},{balance:5000,fee:200},{balance:10000,fee:400},{balance:25000,fee:1000}]
      }
    ]
  },
  {
    id:"hyperpnl", name:"HyperPNL", mark:"HP", domain:"hyperpnl.com", logo:"/brands/hyperpnl.svg", url:"https://hyperpnl.com/",
    status:"ON-CHAIN", venue:"Hyperliquid + Ostium", price:215, plan:"1-Step Flex", target:10, daily:"3%", drawdown:"5% static", split:"80%",
    payout:"Daily · smart-contract", leverage:"Market-specific", indexLev:null, edge:"Code-enforced payouts",
    note:"Hyperliquid and Ostium access with smart-contract payout enforcement.",
    orbit:{x:"13%",y:"70%",delay:"-6.1s"},
    defaultProgram:"1step",
    programs:[
      {
        id:"1step",label:"1-Step Flex",badge:"LIVE",target:"10%",daily:"3%",drawdown:"5% static",split:"80%",leverage:"Market-specific",payout:"Daily · smart-contract",minDays:"0",timeLimit:"None",
        tags:["No consistency","No max risk/trade","Min payout 1%"],
        sizes:[{balance:5000,fee:42},{balance:10000,fee:86},{balance:25000,fee:215},{balance:50000,fee:null,feeLabel:"Soon",disabled:true},{balance:100000,fee:null,feeLabel:"Soon",disabled:true}]
      },
      {
        id:"2step",label:"2-Step Flex",badge:"LIVE",target:"10% → 5%",daily:"5%",drawdown:"9% static",split:"80%",leverage:"Market-specific",payout:"Daily · smart-contract",minDays:"2 → 3 profitable days",timeLimit:"None",
        tags:["0.5% profitable-day trigger","Min payout 1%"],
        sizes:[{balance:5000,fee:50},{balance:10000,fee:90},{balance:25000,fee:213},{balance:50000,fee:null,feeLabel:"Soon",disabled:true},{balance:100000,fee:null,feeLabel:"Soon",disabled:true}]
      }
    ]
  },
  {
    id:"breakout", name:"Breakout", mark:"BR", domain:"breakoutprop.com", logo:"/brands/breakout.ico", url:"https://portal.breakoutprop.com/buy-evaluation?ref=C406739", referral:true,
    status:"KRAKEN", venue:"Breakout Terminal", price:215, plan:"Classic", target:10, daily:"3%", drawdown:"6% static", split:"80–90%",
    payout:"24/7 on-demand", leverage:"Up to 10x", indexLev:10, edge:"Mature payout rails",
    note:"Three current 1-step programs with static drawdown and optional 90% split.",
    orbit:{x:"10%",y:"30%",delay:"-.7s"},
    defaultProgram:"classic",
    programs:[
      {
        id:"turbo",label:"Turbo",badge:"1-STEP",target:"9%",daily:"3%",drawdown:"3% static",split:"80% · 90% upgrade",leverage:"Up to 10x",payout:"24/7 on-demand",minDays:"0",timeLimit:"None",
        tags:["Lowest fee","90% split +20% fee","Static DD"],
        sizes:[{balance:5000,fee:20},{balance:10000,fee:40},{balance:25000,fee:95},{balance:50000,fee:180},{balance:100000,fee:330},{balance:200000,fee:660}]
      },
      {
        id:"pro",label:"Pro",badge:"1-STEP",target:"12%",daily:"3%",drawdown:"5% static",split:"80% · 90% upgrade",leverage:"Up to 10x",payout:"24/7 on-demand",minDays:"0",timeLimit:"None",
        tags:["Balanced buffer","90% split +20% fee","Static DD"],
        sizes:[{balance:5000,fee:33},{balance:10000,fee:65},{balance:25000,fee:150},{balance:50000,fee:280},{balance:100000,fee:545},{balance:200000,fee:1090}]
      },
      {
        id:"classic",label:"Classic",badge:"1-STEP",target:"10%",daily:"3%",drawdown:"6% static",split:"80% · 90% upgrade",leverage:"Up to 10x",payout:"24/7 on-demand",minDays:"0",timeLimit:"None",
        tags:["Widest 1-step DD","90% split +20% fee","Static DD"],
        sizes:[{balance:5000,fee:45},{balance:10000,fee:85},{balance:25000,fee:215},{balance:50000,fee:400},{balance:100000,fee:800}]
      }
    ]
  }
];

export function shortBalance(value){
  if(value==null) return "—";
  if(value>=1000000) return (value/1000000)+"M";
  return (value/1000)+"K";
}
