export function Journey() {
  return (
    <>
<section className="band b-white journey pad" id="journey">
  <svg className="edge" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 100C320 10 1120 10 1440 100Z"/></svg>
  <div className="wrap top">
    <div><p className="eyebrow gap">Your medical journey</p><h2 data-split-scroll="">From first <em>message</em> to home</h2></div>
    <p className="lead" style={{maxWidth:'36ch'}}>One coordinator follows every step, for the patient and the attender.</p>
  </div>
  <div className="track-wrap">
    <ol className="track" id="track">
      <li className="step"><span className="n" aria-hidden="true">1</span><span className="when">Day 0</span><h3>Share reports</h3><p>Send scans and reports by WhatsApp or secure upload, in your own words.</p></li>
      <li className="step"><span className="n" aria-hidden="true">2</span><span className="when">Within 48 hours</span><h3>Doctor review</h3><p>A physician shortlists specialists and sends an itemised estimate.</p></li>
      <li className="step"><span className="n" aria-hidden="true">3</span><span className="when">Days 3 to 5</span><h3>Video consult</h3><p>Meet your specialist online and agree the plan before you commit.</p></li>
      <li className="step"><span className="n" aria-hidden="true">4</span><span className="when">Weeks 1 to 2</span><h3>Visa &amp; travel</h3><p>Visa letters for patient and attenders, flights, and a stay near the hospital.</p></li>
      <li className="step"><span className="n" aria-hidden="true">5</span><span className="when">Arrival</span><h3>Welcome to India</h3><p>Airport pickup, an interpreter, and your coordinator waiting for you.</p></li>
      <li className="step"><span className="n" aria-hidden="true">6</span><span className="when">Treatment</span><h3>Care &amp; updates</h3><p>Admission, treatment and daily updates for family at home.</p></li>
      <li className="step"><span className="n" aria-hidden="true">7</span><span className="when">Back home</span><h3>Recovery</h3><p>Your full records, fit-to-fly clearance and teleconsults for follow-up.</p></li>
      <li className="fp" id="fp" aria-hidden="true" role="presentation"><svg id="fpSvg"><path className="fp-track" id="fpTrack"/><path className="fp-trail" id="fpTrail"/></svg></li>
      <li className="fp fp-front" aria-hidden="true" role="presentation"><svg id="fpSvgF"><defs><clipPath id="fpClip"></clipPath></defs><g clipPath="url(#fpClip)"><path className="fp-track" id="fpTrackF"/><path className="fp-trail" id="fpTrailF"/></g></svg></li>
      <li className="fp-jet" id="fpJet" aria-hidden="true" role="presentation"><svg viewBox="0 0 24 24"><use href="#plane" fill="#5671D4"/></svg></li>
    </ol>
  </div>
</section>
    </>
  );
}
