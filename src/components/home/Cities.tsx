export function Cities() {
  return (
    <>
<section className="band b-peri pad cities" id="cities">
  <svg className="edge" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 100C320 10 1120 10 1440 100Z"/></svg>
  <div className="wrap grid">
    <div>
      <p className="eyebrow gap">Where you'll be treated</p>
      <h2 data-split-scroll="">Closer <em>than</em> you think</h2>
      <p className="lead" style={{marginTop:'24px'}}>India's leading medical cities are a short direct flight from the Gulf, East Africa and South Asia. Choose a city.</p>
      <ul className="city-list" id="cityList"></ul>
    </div>
    <div className="map" data-reveal="">
      <svg id="mapSvg" viewBox="0 0 1000 620" role="img" aria-label="Flight routes from the Gulf, East Africa and Bangladesh to Indian medical cities"></svg>
      <div className="note mono"><span>Approx. direct flight time from Dubai</span><span id="mapActive">Hyderabad</span></div>
    </div>
  </div>
</section>
    </>
  );
}
