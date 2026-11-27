/** First-visit loader for the premium homepage.
 *  The orbit ring is the progress bar: a plane flies around it as the page
 *  loads, the cross draws itself in, and the labels walk through the patient
 *  journey. It is rendered by the server so it covers the page from the first
 *  paint; `initPremium` drives it and lifts it away. */

const steps = ["Reading your reports", "Matching accredited hospitals", "Arranging visa & flights", "Preparing your stay"];

// Runs as soon as the markup is parsed. If the bundle never arrives, the page is revealed anyway.
const bootstrap = `(function () {
  var loader = document.getElementById('pm-loader');
  if (!loader || document.readyState !== 'loading') return;
  var root = document.documentElement;
  loader.__pmLoadStart = performance.now();
  root.classList.add('pm-loading');
  loader.hidden = false;
  setTimeout(function () {
    if (!loader.isConnected || !root.classList.contains('pm-loading')) return;
    loader.hidden = true;
    root.classList.remove('pm-loading');
    root.classList.add('pm-loaded', 'pm-ready');
  }, 9000);
})();`;

const CROSS = "M84 44h32a6 6 0 0 1 6 6v28h28a6 6 0 0 1 6 6v32a6 6 0 0 1-6 6h-28v28a6 6 0 0 1-6 6H84a6 6 0 0 1-6-6v-28H50a6 6 0 0 1-6-6V84a6 6 0 0 1 6-6h28V50a6 6 0 0 1 6-6z";

export function PremiumLoader() {
  return (
    <>
      <div className="pm-loader" id="pm-loader" data-state="loading" hidden suppressHydrationWarning>
        <span className="sr-only" role="status">Loading Medtours</span>
        <div className="pm-loader-panel pm-loader-panel-top" aria-hidden="true" />
        <div className="pm-loader-panel pm-loader-panel-bottom" aria-hidden="true" />
        <div className="pm-loader-stage" aria-hidden="true">
          <div className="pm-loader-mast">
            <span>Medtours</span>
            <span>Medical travel to India</span>
          </div>
          <div className="pm-loader-center">
            <svg className="pm-loader-mark" viewBox="0 0 200 200">
              <circle className="pm-l-track" cx="100" cy="100" r="88" />
              <circle className="pm-l-ring" cx="100" cy="100" r="88" pathLength="1" />
              <path className="pm-l-fill" d={CROSS} />
              <path className="pm-l-cross" d={CROSS} pathLength="1" />
              <g className="pm-l-orbit">
                <g transform="translate(100 12) rotate(90) translate(-11 -11) scale(.92)"><use href="#plane" /></g>
              </g>
            </svg>
            <p className="pm-loader-word"><span>Heal With</span> <em>Experience.</em></p>
          </div>
          <div className="pm-loader-foot">
            <p className="pm-loader-count"><b data-loader-count>0</b><small>%</small></p>
            <ol className="pm-loader-steps">
              {steps.map((s, i) => <li key={s} data-loader-step={i}><span>{String(i + 1).padStart(2, "0")}</span>{s}</li>)}
              <li data-loader-step={steps.length}><span>✦</span>Welcome to India</li>
            </ol>
          </div>
        </div>
        <button type="button" className="pm-loader-skip" data-loader-skip>Skip <span aria-hidden="true">→</span></button>
      </div>
      <noscript><style>{".pm-loader{display:none!important}"}</style></noscript>
      <script dangerouslySetInnerHTML={{ __html: bootstrap }} />
    </>
  );
}
