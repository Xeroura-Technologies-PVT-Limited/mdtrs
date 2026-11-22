const commitments = [
  { title: "Clinical excellence", copy: "Senior specialists at NABH and JCI accredited hospitals, chosen for your condition and their outcomes.", icon: "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z M9 12l2 2 4-4" },
  { title: "Cost transparency", copy: "One itemised estimate before you travel, covering treatment, stay and follow-up. No surprises later.", icon: "M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z M8 8h8m-8 4h8m-8 4h4" },
  { title: "Zero wait times", copy: "Consultations and surgery dates arranged in days, not months on a waiting list.", icon: "M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0 M12 7.5V12l3 2" },
  { title: "End-to-end hospitality", copy: "Airport pickup, a comfortable stay, interpreters and a coordinator who stays with you throughout.", icon: "M3 20h18M5 20V10l7-5 7 5v10M10 20v-5h4v5" },
];

export function Promise() {
  return (
    <section id="promise" className="atlas-promise" aria-labelledby="promise-title">
      <div className="wrap">
        <div className="atlas-head">
          <div><p className="eyebrow">Our promise</p><h2 id="promise-title">Why <em>India,</em> why us</h2></div>
          <p className="lead">India has some of the world's most experienced specialists. We make reaching them simple, transparent and calm.</p>
        </div>
        <div className="promise-list">
          {commitments.map((item) => <article key={item.title} className="promise-item" data-reveal="">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={item.icon} /></svg>
            <h3>{item.title}</h3><p>{item.copy}</p>
          </article>)}
        </div>
      </div>
    </section>
  );
}
