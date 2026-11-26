"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { itinerary } from "@/lib/itinerary";

const views = [
  ["hospital-consultation", "A physician reviewing a guest's reports"],
  ["hospital-consultation", "A doctor and guest meeting in a consultation room"],
  ["consultation", "A quiet consultation room"],
  ["hospitality", "A room arranged for a stay in India"],
  ["arrival", "A covered arrival entrance at dusk"],
  ["hospital-exterior", "The illuminated entrance of a hospital"],
  ["hospitality", "A quiet room with a window overlooking trees"],
];

export function JourneyTimeline() {
  const [active, setActive] = useState(0);
  const list = useRef<HTMLOListElement>(null);
  function move(event: KeyboardEvent<HTMLElement>, index: number) {
    const next = event.key === "ArrowDown" ? Math.min(index + 1, itinerary.length - 1) :
      event.key === "ArrowUp" ? Math.max(index - 1, 0) :
      event.key === "Home" ? 0 : event.key === "End" ? itinerary.length - 1 : undefined;
    if (next === undefined) return;
    event.preventDefault();
    setActive(next);
    const item = list.current?.querySelectorAll("details")[next];
    if (item) { item.open = true; item.querySelector("summary")?.focus(); }
  }
  return <section className="band pad guide-timeline" aria-labelledby="itinerary-heading">
    <div className="wrap timetable">
      <div className="itinerary-view">
        <p className="eyebrow gap">Your itinerary</p><h2 id="itinerary-heading">From first <em>message</em> to home</h2>
        <figure><img key={views[active][0]} src={`/editorial/${views[active][0]}.webp`} width={720} height={480} alt={views[active][1]} loading="lazy" />
          <figcaption>{itinerary[active][0]} <span aria-hidden="true">/</span> {itinerary[active][1]}</figcaption>
        </figure>
      </div>
      <ol className="itinerary-controls" ref={list}>
        {itinerary.map(([time,title,copy], index) => <li key={title}>
          <details name="patient-itinerary" open={active === index} onToggle={event => { if (event.currentTarget.open) setActive(index); }}>
          <summary onKeyDown={event => move(event, index)}>
            <span className="stop-index">{String(index + 1).padStart(2, "0")}</span>
            <span><small>{time}</small>{title}</span><i aria-hidden="true" />
          </summary>
          <p>{copy}</p></details>
        </li>)}
      </ol>
    </div>
  </section>;
}
