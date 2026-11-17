export function Journeys() {
  return (
    <>
<section className="band b-white journeys" id="journeys">
  <svg className="edge" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 100C320 10 1120 10 1440 100Z"/></svg>
  <div className="wrap j-inner">
    <div>
      <p className="eyebrow">Two journeys, one team</p>
      <div className="switch" id="switch" data-p="patient" role="group" aria-label="Choose a journey">
        <span className="knob" aria-hidden="true"></span>
        <button type="button" aria-pressed="true" data-p="patient">The patient</button>
        <button type="button" aria-pressed="false" data-p="attender">The attender</button>
      </div>
      <h2 className="j-title" aria-live="polite"><span data-t="patient">For the <em>patient</em></span><span data-t="attender" className="off">For the <em>attender</em></span></h2>
      <p className="lead j-note" id="jNote">Your treatment, planned with a doctor, from the first report to your last follow-up.</p>
      <div style={{marginTop:'30px'}}><button className="btn btn-solid mag" data-open="enquire" id="jCta" type="button"><span className="dot"></span>Plan Your Medical Journey</button></div>
    </div>
    <div className="j-list">
      <div className="j-panel" data-panel="patient">
        <div className="j-item"><span className="k">Plan</span><div><h3>Treatment planning</h3><p>A doctor reviews your reports and recommends the hospital, specialist and dates that suit you.</p></div></div>
        <div className="j-item"><span className="k">Decide</span><div><h3>Second opinions</h3><p>Hear from a senior specialist before you commit, by video, at no pressure.</p></div></div>
        <div className="j-item"><span className="k">Travel</span><div><h3>Medical visa assistance</h3><p>The hospital invitation letter and step-by-step help with India's e-Medical visa.</p></div></div>
        <div className="j-item"><span className="k">Heal</span><div><h3>Post-op recovery</h3><p>Physiotherapy, follow-up visits, and teleconsults with your surgeon after you return home.</p></div></div>
      </div>
      <div className="j-panel off" data-panel="attender">
        <div className="j-item"><span className="k">Arrive</span><div><h3>Travel logistics</h3><p>Flights, airport pickup and the attender visa, arranged together with the patient's.</p></div></div>
        <div className="j-item"><span className="k">Stay</span><div><h3>Accommodation</h3><p>Comfortable rooms close to the hospital, sized to the length of treatment.</p></div></div>
        <div className="j-item"><span className="k">Settle</span><div><h3>Local concierge</h3><p>A local SIM, currency, meals, transport and an interpreter whenever you need one.</p></div></div>
        <div className="j-item"><span className="k">Rest</span><div><h3>Hospitality care</h3><p>Daily updates from the care team, a quiet place to rest, and someone to call any time.</p></div></div>
      </div>
    </div>
  </div>
</section>
    </>
  );
}
