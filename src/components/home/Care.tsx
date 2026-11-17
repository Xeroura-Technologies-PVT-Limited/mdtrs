import Link from "next/link";
import type { CSSProperties } from "react";

export function Care() {
  return (
    <>
<section className="band b-peri pad" id="care">
  <div className="wrap">
    <div className="care-head">
      <div><p className="eyebrow gap">Medical &amp; wellness</p><h2 data-split-scroll="">The care <em>we</em> arrange</h2></div>
      <p className="lead" style={{maxWidth:'36ch'}}>Four clinical services and two wellness programmes, each with its own specialists.</p>
    </div>
    <div className="stack" id="stack">
      <article className="card" style={{'--i':'0'} as CSSProperties}><div className="txt"><div><span className="tag"><b>Clinical</b>01 of 06</span><h3>Medical</h3></div><p>Diagnosis and treatment without surgery, and second opinions from senior physicians before you decide.</p><ul><li>Cardiology</li><li>Oncology</li><li>Neurology</li><li>Second opinion</li></ul><Link className="card-more" href="/treatments/medical">Medical in detail<span aria-hidden="true">→</span></Link></div><div className="plate render"><img className="art" src="/renders/medical.jpg" alt="A two-tone capsule and tablets" /></div></article>
      <article className="card" style={{'--i':'1'} as CSSProperties}><div className="txt"><div><span className="tag"><b>Clinical</b>02 of 06</span><h3>Surgical</h3></div><p>Planned operations by experienced surgical teams, from joint replacement to cardiac and transplant surgery.</p><ul><li>Cardiac surgery</li><li>Joint replacement</li><li>Spine</li><li>Transplant</li></ul><Link className="card-more" href="/treatments/surgical">Surgical in detail<span aria-hidden="true">→</span></Link></div><div className="plate render"><img className="art" src="/renders/care-orbit.jpg" alt="A soft white medical cross circled by an orbit" /></div></article>
      <article className="card" style={{'--i':'2'} as CSSProperties}><div className="txt"><div><span className="tag"><b>Clinical</b>03 of 06</span><h3>Dental</h3></div><p>Implants, smile restoration and full-mouth rehabilitation, often completed within a single trip.</p><ul><li>Implants</li><li>Crowns &amp; veneers</li><li>Full-mouth rehab</li></ul><Link className="card-more" href="/treatments/dental">Dental in detail<span aria-hidden="true">→</span></Link></div><div className="plate render"><img className="art" src="/renders/dental.jpg" alt="A sculpted white tooth on a pedestal" /></div></article>
      <article className="card" style={{'--i':'3'} as CSSProperties}><div className="txt"><div><span className="tag"><b>Clinical</b>04 of 06</span><h3>Rehabilitation</h3></div><p>Physiotherapy and recovery programmes after surgery, stroke or injury, built into your stay.</p><ul><li>Post-op physio</li><li>Neuro rehab</li><li>Sports injury</li></ul><Link className="card-more" href="/treatments/rehabilitation">Rehabilitation in detail<span aria-hidden="true">→</span></Link></div><div className="plate render"><img className="art" src="/renders/rehab.jpg" alt="Balanced stones" /></div></article>
      <article className="card" style={{'--i':'4'} as CSSProperties}><div className="txt"><div><span className="tag"><b>Wellness</b>05 of 06</span><h3>Longevity</h3></div><p>Advanced screening and a personal plan to stay healthy for longer, reviewed by physicians.</p><ul><li>Executive health check</li><li>Cardiac risk screening</li><li>Personal health plan</li></ul><Link className="card-more" href="/treatments/longevity">Longevity in detail<span aria-hidden="true">→</span></Link></div><div className="plate render"><img className="art" src="/renders/longevity.jpg" alt="A DNA helix" /></div></article>
      <article className="card" style={{'--i':'5'} as CSSProperties}><div className="txt"><div><span className="tag"><b>Wellness</b>06 of 06</span><h3>Holistic <em>health</em></h3></div><p>Ayurveda, yoga and nutrition programmes for recovery and balance, in calm retreat settings.</p><ul><li>Ayurveda</li><li>Yoga &amp; meditation</li><li>Recovery retreats</li></ul><Link className="card-more" href="/treatments/holistic-health">Holistic health in detail<span aria-hidden="true">→</span></Link></div><div className="plate render"><img className="art" src="/renders/holistic.jpg" alt="A lotus flower" /></div></article>
    </div>
  </div>
</section>
    </>
  );
}
