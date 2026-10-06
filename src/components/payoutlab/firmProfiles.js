export const firmProfiles = {
  "Maven": {
    market: "CFDs",
    url: "https://maventrading.com/",
    icon: "https://maventrading.com/favicon.ico",
    pick: {
      name: "100K OMO 2-Step",
      why: "Room to work, no consistency score, and the deepest proof trail in my archive.",
      stats: [["Target", "6% / 8%"], ["Max loss", "8%"], ["Daily", "4%"], ["Split", "80%"]],
    },
  },
  "Lucid Trading": {
    market: "Futures",
    url: "https://www.lucidtrading.com/",
    icon: "https://www.lucidtrading.com/favicon.ico",
    pick: {
      name: "Flex 50K",
      why: "No funded consistency, no payout buffer, and a clean EOD drawdown structure.",
      stats: [["Target", "$3K"], ["Max loss", "$2K"], ["Funded cons.", "None"], ["Split", "90%"]],
    },
  },
  "FundedNext": {
    market: "CFDs",
    url: "https://fundednext.com/",
    icon: "https://fundednext.com/favicon.ico",
    pick: {
      name: "Stellar Lite 100K",
      why: "The strongest all-around CFD value: static drawdown, a clean two-step path, and on-demand payouts with the add-ons.",
      stats: [["Target", "8% / 4%"], ["Max loss", "8%"], ["Min days", "None*"], ["Split", "95%*"]],
    },
    bonusPick: {
      name: "Legacy 25K",
      label: "FUTURES BONUS PICK",
      url: "https://fundednext.com/futures/legacy",
      why: "Low target, no daily loss limit, and no consistency rule once funded.",
      stats: [["Target", "$1,250"], ["Max loss", "$1,000"], ["Reward days", "5"], ["Share", "80%"]],
    },
  },
  "Tradeify": {
    market: "Futures",
    url: "https://tradeify.co/",
    icon: "https://tradeify.co/favicon.ico",
    pick: {
      name: "Select 50K · Flex",
      why: "No DLL, no funded consistency, no payout buffer, and useful five-day payout cadence.",
      stats: [["Max DD", "$2K"], ["DLL", "None"], ["Payout", "5 wins"], ["Split", "90%"]],
    },
  },
  "Breakout": {
    market: "Perps",
    url: "https://www.breakoutprop.com/pricing/",
    icon: "https://www.breakoutprop.com/favicon.ico",
    pick: {
      name: "100K Turbo",
      why: "Cheap fixed-risk shot with static drawdown and on-demand funded payouts.",
      stats: [["Fee", "$330"], ["Target", "9%"], ["Max DD", "3%"], ["Phases", "1"]],
    },
  },
  "Topstep": {
    market: "Futures",
    url: "https://www.topstep.com/",
    icon: "https://www.topstep.com/favicon.ico",
  },
  "MyFundedPerps": {
    market: "Perps",
    url: "https://myfundedperpetuals.com/",
    icon: "https://myfundedperpetuals.com/favicon.ico",
  },
  "Propr": {
    market: "Perps",
    url: "https://app.propr.xyz/r/7gJmpEjv",
    icon: "https://www.propr.xyz/favicon.ico",
    referral: true,
    pick: {
      name: "Classic 1-Step · 10/6/3",
      why: "The clean static structure is the easy part. The real True R question is what execution fees do to a large notional position.",
      stats: [["Target", "10%"], ["Max DD", "6%"], ["Daily", "3%"], ["Split", "80%"]],
    },
  },
  "Hypernova": {
    market: "Perps",
    url: "https://hn.xyz/r/4sjg1b",
    referral: true,
    pick: {
      name: "Low Risk 25K",
      why: "My Hypernova pick: the 10/6/3 structure with instant on-chain payout access and a lower-fee lane than most perps alternatives.",
      stats: [["Target", "10%"], ["Max DD", "6%"], ["Daily", "3%"], ["Leverage", "5×"]],
    },
  },
};
