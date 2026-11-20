import { scenes } from "@/lib/motion/scenes";
import { paintStage, scenePlate } from "@/lib/motion/plate";
import { LogoMark } from "./Logo";

/** The first scene is painted independently of React hydration. */
export function MotionStage() {
  return (
    <div className="motion-stage" id="travel-stage" suppressHydrationWarning>
      <span className="intro-status sr-only" role="status">Opening Medtours</span>
      <div className="motion-sheet" aria-hidden="true">
        <svg className="stage-chart" viewBox="0 0 720 720" fill="none" focusable="false">
          <g stroke="currentColor">
            <circle cx="360" cy="360" r="318" />
            <circle cx="360" cy="360" r="326" strokeDasharray="1 10" />
            <ellipse cx="360" cy="360" rx="163" ry="318" />
            <ellipse cx="360" cy="360" rx="267" ry="318" />
            <path d="M42 360h636M360 42v636M85 200q275 93 550 0M85 520q275-93 550 0M172 105q188 48 376 0M172 615q188-48 376 0" />
          </g>
          <path className="chart-course" d="M48 467C171 497 251 279 335 256s110 81 47 65c-63-16 30-138 213-174" pathLength="1" />
          <g className="chart-stop"><circle cx="595" cy="147" r="5" /><circle cx="595" cy="147" r="14" fill="none" /></g>
        </svg>
        <div className="stage-art" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: "" }} />
        <div className="stage-frame">
          <div className="stage-mast"><LogoMark /><span>Medical travel to India</span></div>
          <div className="stage-center">
            <div className="stage-introduction">
              <div className="stage-mask"><span className="stage-word">Medtours</span></div>
              <div className="stage-mask"><em className="stage-tag">Heal With Experience.</em></div>
            </div>
            <div className="stage-destination">
              <span className="stage-caption" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: "" }} />
              <div className="stage-mask"><span className="stage-place" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: "" }} /></div>
            </div>
          </div>
          <div className="stage-foot">
            <div className="stage-legend"><span className="stage-loading">Preparing your visit</span><span className="stage-transit">In transit</span>
              <svg viewBox="0 0 24 24"><use href="#plane" transform="rotate(90 12 12)" /></svg>
            </div>
            <div className="stage-track"><i /></div>
          </div>
        </div>
      </div>
      <button type="button" className="intro-skip" id="intro-skip">Skip intro <span aria-hidden="true">↗</span></button>
      <script dangerouslySetInnerHTML={{ __html: `if(document.documentElement.dataset.intro){const k=document.documentElement.dataset.scene;(${paintStage.toString()})(k,(${JSON.stringify(scenes)})[k],(${scenePlate.toString()}));document.dispatchEvent(new Event("mt:intro-ready"));}` }} />
    </div>
  );
}
