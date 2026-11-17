"use client";

import { useState } from "react";

export function FaqList({ items, startAt = 0 }: { items: [string, string][]; startAt?: number }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div>
      {items.map(([q, a], i) => {
        const isOpen = open === i;
        return (
          <div className="qa" data-open={isOpen} key={q}>
            <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
              <span className="qn">{String(i + 1 + startAt).padStart(2, "0")}</span>
              <span className="qt">{q}</span>
              <span className="pl" aria-hidden="true" />
            </button>
            <div className="ans">
              <div>
                <p>{a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
