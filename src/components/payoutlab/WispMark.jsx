import React from "react";
export default function WispMark({className = "", size = 24}) {
  return <img src={`${import.meta.env.BASE_URL}mascot/wisp.png`} alt="" aria-hidden="true" className={className} width={size} height={size} style={{objectFit:"contain",mixBlendMode:"screen",flexShrink:0}} />;
}
