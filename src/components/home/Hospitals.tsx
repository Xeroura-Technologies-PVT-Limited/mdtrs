export function Hospitals() {
  return (
    <>
<section className="band b-paper pad acc" id="hospitals">
  <svg className="edge" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 100C320 10 1120 10 1440 100Z"/></svg>
  <div className="wrap">
    <div className="grid">
      <div>
        <p className="eyebrow gap">Hospital accreditations</p>
        <h2 data-split-scroll="">Accredited <em>care,</em> only</h2>
        <p className="lead" style={{marginTop:'26px'}}>Every partner hospital meets recognised standards for patient safety, infection control and quality of care before we recommend it.</p>
      </div>
      <div className="seals">
        <div className="seal">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <defs><path id="ringA" d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0"/></defs>
            <circle cx="100" cy="100" r="92" fill="#FFFFFF" stroke="#143A66" strokeWidth="1.5"/>
            <circle cx="100" cy="100" r="64" fill="none" stroke="#143A66" strokeWidth=".8"/>
            <g className="spin"><text className="ringtext"><textPath href="#ringA">NATIONAL ACCREDITATION BOARD FOR HOSPITALS · INDIA · </textPath></text></g>
            <text x="100" y="108" textAnchor="middle" fontFamily="Cormorant, serif" fontSize="30" fontWeight="600" fill="#143A66">NABH</text>
            <circle cx="100" cy="132" r="3" fill="#5671D4"/>
          </svg>
          <h3>National standard</h3><p>India's national hospital accreditation for patient safety and quality.</p>
        </div>
        <div className="seal">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <defs><path id="ringB" d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0"/></defs>
            <circle cx="100" cy="100" r="92" fill="#FFFFFF" stroke="#143A66" strokeWidth="1.5"/>
            <circle cx="100" cy="100" r="64" fill="none" stroke="#143A66" strokeWidth=".8"/>
            <g className="spin"><text className="ringtext"><textPath href="#ringB">JOINT COMMISSION INTERNATIONAL · GLOBAL STANDARD · </textPath></text></g>
            <text x="100" y="108" textAnchor="middle" fontFamily="Cormorant, serif" fontSize="30" fontWeight="600" fill="#143A66">JCI</text>
            <circle cx="100" cy="132" r="3" fill="#5671D4"/>
          </svg>
          <h3>International standard</h3><p>Joint Commission International, recognised by patients and insurers worldwide.</p>
        </div>
      </div>
    </div>
    <div className="hosp">
      <a className="hcard" href="#contact"><div className="plate render" style={{aspectRatio:'4/3'}}><img className="art" src="/renders/gateway.jpg" alt="" /><span className="cap">Sample profile</span></div><div className="meta"><span>NABH · JCI</span><span>[City]</span></div><h3>[Partner hospital]</h3></a>
      <a className="hcard" href="#contact"><div className="plate render" style={{aspectRatio:'4/3'}}><img className="art" src="/renders/care-orbit.jpg" alt="" /><span className="cap">Sample profile</span></div><div className="meta"><span>NABH</span><span>[City]</span></div><h3>[Partner hospital]</h3></a>
      <a className="hcard" href="#contact"><div className="plate render" style={{aspectRatio:'4/3'}}><img className="art" src="/renders/holistic.jpg" alt="" /><span className="cap">Sample profile</span></div><div className="meta"><span>Wellness</span><span>[City]</span></div><h3>[Wellness partner]</h3></a>
    </div>
  </div>
</section>
    </>
  );
}
