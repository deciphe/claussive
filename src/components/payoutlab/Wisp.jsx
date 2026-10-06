import React from "react";
import "./wisp.css";
export default function Wisp({note, className = ""}) {
  return <div className={`wisp-companion ${className}`}><div className="wisp-peek"><img src={`${import.meta.env.BASE_URL}mascot/wisp.png`} alt="Wisp, the Lab companion" width="100" height="100" /></div>{note && <span className="wisp-caption">{note}</span>}</div>;
}
