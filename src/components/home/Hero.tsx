export function Hero() {
  return (
    <>
<section className="hero" id="hero" aria-label="Introduction">
  <canvas id="globe" role="img" aria-label="A globe showing flight routes from the Gulf, Africa, Central Asia, South Asia and Europe arriving at six medical cities in India"></canvas>
  <div className="wrap">
    <div className="stages">
      <div className="stage" data-stage="0">
        <p className="eyebrow">Medical travel to India</p>
        <h1 aria-label="Heal With Experience">
          <span className="row" data-split="" aria-hidden="true">Heal</span>
          <span className="row" data-split="" aria-hidden="true">With</span>
          <span className="row" data-split="" aria-hidden="true">Experience</span>
        </h1>
        <p className="lead">World-class Indian hospitals, joined to thoughtful hospitality, for patients and the people who travel with them.</p>
        <div className="hero-cta">
          <button className="btn btn-solid mag" data-open="enquire" type="button"><span className="dot"></span>Get a Treatment Quote</button>
          <a className="btn btn-ghost mag" href="#journeys">Plan Your Medical Journey</a>
        </div>
      </div>
      <div className="stage off" data-stage="1">
        <p className="k">01 · Wherever you are</p>
        <h2>Patients come to us from <em>across the world</em></h2>
        <p className="lead">From the Gulf, Africa, Central and South Asia and Europe, families choose India for care they can't wait for at home.</p>
      </div>
      <div className="stage off" data-stage="2">
        <p className="k">02 · One flight away</p>
        <h2>A few hours to <em>world-class</em> care</h2>
        <p className="lead">We plan every step: the hospital invitation letter, the e-Medical visa, flights for patient and attenders, and pickup at arrivals.</p>
      </div>
      <div className="stage off" data-stage="3">
        <p className="k">03 · Into trusted hands</p>
        <h2>Six medical cities. <em>One</em> team.</h2>
        <p className="lead">NABH and JCI accredited hospitals in New Delhi, Mumbai, Hyderabad, Chennai, Bengaluru and Kochi, with a coordinator beside you throughout.</p>
      </div>
      <div className="stage off" data-stage="4">
        <p className="k">Medtours</p>
        <h2 style={{fontSize:'clamp(56px,7.4vw,120px)'}}>Heal With <em>Experience</em></h2>
        <p className="lead">Share your reports today. A doctor reviews them and sends a plan and an itemised estimate within 48 hours.</p>
        <div className="hero-cta">
          <button className="btn btn-solid mag" data-open="enquire" type="button"><span className="dot"></span>Get a Treatment Quote</button>
          <a className="btn btn-ghost mag" href="#journeys">Plan Your Medical Journey</a>
        </div>
      </div>
    </div>
  </div>
  <div className="hero-steps" aria-hidden="true"><div className="wrap"><span data-step="1">Wherever you are</span><span data-step="2">One flight away</span><span data-step="3">Into trusted hands</span></div></div>
  <div className="scroll-cue mono" aria-hidden="true"><span>Scroll the journey</span><i></i></div>
</section>
    </>
  );
}
