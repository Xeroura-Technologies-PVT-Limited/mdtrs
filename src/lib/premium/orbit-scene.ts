import { CLAY_FS, CLAY_VS, createCanvasGL, fitCanvas, hexToRgb, m4, program, roundedBox, sphere, torus, upload, type Mat4, type Vec3 } from "./gl";

/** The "Care Orbit" emblem in 3D: a soft white cross, an orbit ring and a
 *  navy satellite (the incoming flight) travelling around it. */

const SHADOW_VS = `
attribute vec3 aPos; uniform mat4 uModel, uView, uProj; varying vec2 vUv;
void main(){ vUv = aPos.xz; gl_Position = uProj * uView * uModel * vec4(aPos,1.0); }`;
const SHADOW_FS = `
precision mediump float; varying vec2 vUv; uniform vec3 uColor; uniform float uStrength;
void main(){ float d = length(vUv); float a = pow(1.0 - smoothstep(0.0, 1.0, d), 2.2) * uStrength; gl_FragColor = vec4(uColor, a); }`;

export type OrbitScene = { setProgress(p: number): void; destroy(): void };

export function createOrbitScene(canvas: HTMLCanvasElement, reduced: boolean): OrbitScene | null {
  const gl = createCanvasGL(canvas);
  if (!gl) return null;
  const clay = program(gl, CLAY_VS, CLAY_FS);
  const shade = program(gl, SHADOW_VS, SHADOW_FS);

  const barV = upload(gl, roundedBox(0.66, 2.0, 0.66, 0.27));
  const barH = upload(gl, roundedBox(2.0, 0.66, 0.66, 0.27));
  const R = 1.62;
  const ring = upload(gl, torus(R, 0.042, 140, 16));
  const ball = upload(gl, sphere(1, 24));
  const quad = upload(gl, { position: [-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1], normal: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], index: [0, 1, 2, 0, 2, 3] });

  const C = {
    cross: hexToRgb("#FBFCFF"),
    ring: hexToRgb("#2C57A8"),
    sat: hexToRgb("#143A66"),
    sky: hexToRgb("#FFFFFF"),
    ground: hexToRgb("#C9D4EA"),
    rim: hexToRgb("#9DB2DE"),
    shadow: hexToRgb("#143A66"),
  };

  const state = {
    progress: 0, smoothP: 0,
    yaw: -0.35, pitch: 0.08, spin: 0,
    targetYaw: 0, targetPitch: 0,
    dragging: false, lastX: 0, lastY: 0,
    visible: true, raf: 0, t0: performance.now(), last: performance.now(),
    angle: 0.6,
  };

  function onMove(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width * 2 - 1;
    const ny = (e.clientY - r.top) / r.height * 2 - 1;
    if (state.dragging) {
      state.spin += (e.clientX - state.lastX) * 0.0045;
      state.targetPitch = Math.max(-0.6, Math.min(0.6, state.targetPitch + (e.clientY - state.lastY) * 0.004));
      state.lastX = e.clientX; state.lastY = e.clientY;
    } else {
      state.targetYaw = nx * 0.38;
      state.targetPitch = ny * 0.22;
    }
    if (!state.raf && state.visible) state.raf = requestAnimationFrame(frame);
  }
  function onDown(e: PointerEvent) {
    state.dragging = true; state.lastX = e.clientX; state.lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    canvas.dataset.dragging = "";
  }
  function onUp(e: PointerEvent) {
    state.dragging = false;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    delete canvas.dataset.dragging;
  }
  window.addEventListener("pointermove", onMove, { passive: true });
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);

  const io = new IntersectionObserver(([entry]) => {
    state.visible = entry.isIntersecting;
    if (state.visible && !state.raf) state.raf = requestAnimationFrame(frame);
  });
  io.observe(canvas);

  function drawClay(mesh: { draw: (p: typeof clay) => void }, model: Mat4, color: Vec3, gloss = 0.22) {
    gl!.uniformMatrix4fv(clay.u("uModel"), false, model);
    gl!.uniform3fv(clay.u("uColor"), color);
    gl!.uniform1f(clay.u("uGloss"), gloss);
    mesh.draw(clay);
  }

  function render(now: number) {
    const dt = Math.min(0.05, (now - state.last) / 1000);
    state.last = now;
    const t = (now - state.t0) / 1000;
    const { aspect } = fitCanvas(canvas, gl!);
    const k = 1 - Math.pow(0.0015, dt);
    state.smoothP += (state.progress - state.smoothP) * k;
    const p = state.smoothP;

    if (!reduced) {
      state.spin *= Math.pow(0.12, dt);
      state.angle += dt * (0.55 + p * 0.6);
    }
    state.yaw += ((state.targetYaw + state.spin * 1.0) - state.yaw) * k * 0.9;
    state.pitch += (state.targetPitch - state.pitch) * k;

    const narrow = aspect < 0.9;
    const proj = m4.perspective(narrow ? 0.62 : 0.5, aspect, 0.1, 50);
    const eye: Vec3 = [0, 0.15, (narrow ? 10.6 : 9.0) + p * 1.4];
    const view = m4.lookAt(eye, [0, 0.05, 0]);

    const float = reduced ? 0 : Math.sin(t * 0.9) * 0.07;
    const yaw = state.yaw + (reduced ? 0 : Math.sin(t * 0.25) * 0.18) + p * Math.PI * 0.9 - 0.42;
    const scale = 1 - p * 0.18;
    const group = m4.chain(m4.translation(0, float + p * 0.35, 0), m4.rotY(yaw), m4.rotX(state.pitch + 0.06 - p * 0.25), m4.scaling(scale));

    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);
    gl!.enable(gl!.BLEND);
    gl!.blendFunc(gl!.SRC_ALPHA, gl!.ONE_MINUS_SRC_ALPHA);

    // Soft contact shadow.
    gl!.disable(gl!.DEPTH_TEST);
    shade.use();
    gl!.uniformMatrix4fv(shade.u("uView"), false, view);
    gl!.uniformMatrix4fv(shade.u("uProj"), false, proj);
    gl!.uniformMatrix4fv(shade.u("uModel"), false, m4.chain(m4.translation(0, -2.05, 0), m4.scaling(1.9 * scale - float * 1.2, 1, 0.55)));
    gl!.uniform3fv(shade.u("uColor"), C.shadow);
    gl!.uniform1f(shade.u("uStrength"), 0.22 - float * 0.6);
    quad.draw(shade);

    gl!.enable(gl!.DEPTH_TEST);
    clay.use();
    gl!.uniformMatrix4fv(clay.u("uView"), false, view);
    gl!.uniformMatrix4fv(clay.u("uProj"), false, proj);
    gl!.uniform3fv(clay.u("uSky"), C.sky);
    gl!.uniform3fv(clay.u("uGround"), C.ground);
    gl!.uniform3fv(clay.u("uRim"), C.rim);
    gl!.uniform3fv(clay.u("uEye"), eye);
    gl!.uniform1f(clay.u("uAlpha"), 1);

    drawClay(barV, group, C.cross, 0.28);
    drawClay(barH, group, C.cross, 0.28);

    // The orbit tilts open as the visitor scrolls, like a flight path settling into approach.
    const ringFrame = m4.chain(group, m4.rotY(0.55 + p * 0.5), m4.rotX(0.32 + p * 0.9), m4.rotZ(reduced ? 0.4 : t * 0.08));
    drawClay(ring, ringFrame, C.ring, 0.4);

    const a = state.angle;
    for (let i = 9; i >= 0; i--) {
      const ai = a - i * 0.075;
      const size = i === 0 ? 0.13 : 0.075 * (1 - i / 11);
      const mix = i / 10;
      const col: Vec3 = [C.sat[0] + (C.ring[0] - C.sat[0]) * mix + mix * 0.35, C.sat[1] + (C.ring[1] - C.sat[1]) * mix + mix * 0.35, C.sat[2] + (C.ring[2] - C.sat[2]) * mix + mix * 0.3];
      const model = m4.chain(ringFrame, m4.translation(Math.cos(ai) * R, Math.sin(ai) * R, 0), m4.scaling(size));
      drawClay(ball, model, col, 0.5);
    }
  }

  function frame(now: number) {
    state.raf = 0;
    if (!state.visible || document.hidden) return;
    render(now);
    if (!reduced || state.dragging || Math.abs(state.progress - state.smoothP) > 0.001) {
      state.raf = requestAnimationFrame(frame);
    }
  }
  const onVisibility = () => { if (!document.hidden && !state.raf) state.raf = requestAnimationFrame(frame); };
  document.addEventListener("visibilitychange", onVisibility);
  const onResize = () => { if (!state.raf) state.raf = requestAnimationFrame(frame); };
  window.addEventListener("resize", onResize);
  state.raf = requestAnimationFrame(frame);

  return {
    setProgress(p) {
      state.progress = p;
      if (!state.raf && state.visible) state.raf = requestAnimationFrame(frame);
    },
    destroy() {
      cancelAnimationFrame(state.raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
