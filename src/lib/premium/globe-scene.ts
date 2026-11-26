import { CLAY_FS, CLAY_VS, createCanvasGL, fitCanvas, hexToRgb, m4, program, sphere, upload, type Vec3 } from "./gl";

/** A dotted globe that turns to face India while flight arcs from around the
 *  world draw in with scroll. Land is approximated by coarse outlines, which
 *  reads correctly at dot resolution. */

type LatLon = [number, number];

const LAND: LatLon[][] = [
  // North America
  [[71,-156],[70,-141],[69,-120],[73,-95],[66,-82],[62,-75],[58,-62],[52,-56],[47,-53],[45,-61],[43,-70],[41,-70],[35,-75],[30,-81],[25,-80],[30,-84],[29,-89],[29,-95],[26,-97],[21,-97],[18,-95],[19,-91],[21,-87],[16,-88],[15,-84],[11,-84],[9,-79],[8,-77],[7,-80],[9,-84],[13,-88],[16,-95],[20,-105],[23,-106],[31,-113],[32,-117],[38,-123],[43,-124],[48,-125],[55,-131],[59,-139],[60,-146],[58,-153],[55,-162],[60,-165],[65,-168],[68,-165]],
  // Greenland
  [[60,-44],[65,-40],[70,-22],[77,-18],[82,-30],[83,-45],[80,-65],[76,-70],[70,-54],[65,-52]],
  // South America
  [[12,-72],[11,-64],[8,-60],[5,-52],[0,-50],[-3,-41],[-8,-35],[-13,-38],[-23,-41],[-25,-48],[-33,-52],[-38,-57],[-41,-63],[-46,-67],[-52,-69],[-55,-67],[-54,-72],[-47,-75],[-38,-73],[-30,-71],[-18,-70],[-14,-76],[-6,-81],[-1,-80],[2,-79],[7,-77],[9,-76]],
  // Eurasia
  [[36,-9],[43,-9],[46,-1],[48,-5],[51,2],[54,8],[57,8],[59,5],[62,5],[67,13],[70,20],[71,28],[69,35],[67,41],[68,44],[66,53],[68,60],[73,70],[72,80],[76,95],[77,105],[74,113],[73,128],[72,140],[70,160],[69,170],[66,179],[62,179],[60,170],[60,163],[56,162],[51,157],[57,156],[59,152],[59,143],[54,137],[50,140],[45,136],[42,131],[39,128],[35,126],[37,122],[40,121],[38,118],[35,120],[31,122],[27,120],[23,117],[21,110],[21,106],[17,107],[11,109],[9,105],[11,103],[13,100],[8,100],[1,104],[3,101],[7,99],[11,99],[16,97],[17,94],[22,92],[22,89],[21,87],[19,85],[16,82],[13,80],[10,80],[8,77],[10,76],[15,74],[20,73],[22,70],[24,67],[25,62],[25,57],[27,56],[26,54],[24,52],[22,59],[19,57],[17,55],[15,52],[13,45],[15,43],[20,40],[26,36],[28,34],[30,33],[32,35],[36,36],[36,30],[37,27],[38,23],[40,23],[40,18],[38,16],[41,13],[44,9],[43,5],[41,2],[37,-2],[36,-6]],
  // Africa
  [[37,10],[33,11],[32,20],[31,29],[31,32],[29,33],[22,37],[15,39],[12,43],[11,51],[2,46],[-4,40],[-10,40],[-16,40],[-20,35],[-25,33],[-30,31],[-34,26],[-35,20],[-30,17],[-23,14],[-17,12],[-12,14],[-6,12],[-1,9],[4,9],[4,6],[6,1],[5,-4],[5,-8],[8,-13],[11,-16],[15,-17],[21,-17],[26,-15],[29,-10],[33,-8],[36,-6],[35,0],[37,6]],
  [[-12,49],[-16,50],[-25,47],[-25,44],[-17,44]],
  // Australia and neighbours
  [[-11,132],[-12,137],[-17,141],[-11,143],[-19,147],[-25,153],[-33,152],[-38,148],[-39,144],[-38,140],[-35,137],[-32,134],[-32,127],[-34,120],[-35,117],[-31,115],[-26,113],[-22,114],[-19,121],[-15,125],[-14,129]],
  [[-35,173],[-41,176],[-46,170],[-44,168],[-39,174]],
  [[5,95],[2,99],[-3,104],[-6,106],[-4,102],[0,99]],
  [[7,117],[1,119],[-4,116],[-3,111],[1,109],[4,113]],
  [[-1,131],[-3,141],[-8,147],[-10,150],[-8,143],[-5,138]],
  // Islands
  [[50,-5],[51,1],[53,0],[55,-2],[58,-3],[58,-6],[55,-6],[53,-4],[51,-4]],
  [[31,130],[34,131],[35,135],[35,140],[38,141],[41,141],[43,145],[45,142],[42,140],[39,140],[36,136],[34,132]],
  [[9.8,80],[7,81.8],[6,80],[8,79.8]],
  [[64,-22],[66,-16],[65,-13],[63,-19]],
];

const INDIA_OUTLINE: LatLon[] = [[35,74],[32,79],[30,81],[28,88],[27,97],[22,92],[21,88],[16,82],[13,80],[8,77],[10,76],[15,74],[20,73],[23,68],[25,71],[30,74]];

export const HUB: LatLon = [17.4, 78.5];
export const ORIGINS: { name: string; at: LatLon }[] = [
  { name: "Dubai", at: [25.2, 55.3] },
  { name: "Muscat", at: [23.6, 58.4] },
  { name: "Nairobi", at: [-1.3, 36.8] },
  { name: "Lagos", at: [6.5, 3.4] },
  { name: "London", at: [51.5, -0.1] },
  { name: "Dhaka", at: [23.8, 90.4] },
  { name: "Toronto", at: [43.7, -79.4] },
  { name: "Sydney", at: [-33.9, 151.2] },
];

function inside(pt: LatLon, poly: LatLon[]) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i], [yj, xj] = poly[j];
    if ((yi > pt[0]) !== (yj > pt[0]) && pt[1] < (xj - xi) * (pt[0] - yi) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function toVec([lat, lon]: LatLon, r = 1): Vec3 {
  const p = lat * Math.PI / 180, l = lon * Math.PI / 180;
  return [Math.cos(p) * Math.sin(l) * r, Math.sin(p) * r, Math.cos(p) * Math.cos(l) * r];
}

const DOT_VS = `
attribute vec3 aPos; attribute float aKind; attribute float aT; attribute float aDelay;
uniform mat4 uModel, uView, uProj; uniform vec3 uEye; uniform float uDpr, uDraw, uSize, uPulse;
varying float vAlpha; varying float vKind;
void main(){
  vec4 w = uModel * vec4(aPos, 1.0);
  vec3 n = normalize(w.xyz);
  float facing = dot(n, normalize(uEye - w.xyz));
  vKind = aKind;
  float a = smoothstep(-0.15, 0.35, facing);
  float size = uSize;
  if (aKind > 2.5) {
    // Arc samples reveal from origin to India; the leading edge glows.
    float local = clamp((uDraw - aDelay) / 0.42, 0.0, 1.0);
    float on = step(aT, local) * step(0.001, local);
    float head = (1.0 - smoothstep(0.0, 0.12, abs(local - aT))) * (1.0 - step(0.999, local));
    a = on * (0.55 + head * 0.45) * max(a, 0.35);
    size = uSize * (1.0 + head * 1.6);
  } else if (aKind > 1.5) {
    size = uSize * 3.2; a *= 1.0;
  } else if (aKind > 0.5) {
    size = uSize * 1.25; a *= 0.95;
  } else {
    a *= 0.62;
  }
  vAlpha = a;
  gl_Position = uProj * uView * w;
  gl_PointSize = size * uDpr * (3.6 / gl_Position.w);
}`;

const DOT_FS = `
precision mediump float;
varying float vAlpha; varying float vKind;
uniform vec3 uInk, uIndia, uArc; uniform float uPulse;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (vKind > 1.5 && vKind < 2.5) {
    // Hub: solid centre with a breathing ring.
    float core = (1.0 - smoothstep(0.12, 0.17, d));
    float ring = (1.0 - smoothstep(0.0, 0.03, abs(d - (0.22 + uPulse * 0.24)))) * (1.0 - uPulse);
    float a = max(core, ring) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(uIndia, a);
    return;
  }
  if (d > 0.5) discard;
  float edge = (1.0 - smoothstep(0.36, 0.5, d));
  vec3 col = vKind > 2.5 ? uArc : (vKind > 0.5 ? uIndia : uInk);
  gl_FragColor = vec4(col, edge * vAlpha);
}`;

export type GlobeScene = { setProgress(p: number): void; destroy(): void };

export function createGlobeScene(canvas: HTMLCanvasElement, reduced: boolean, onActive?: (index: number) => void): GlobeScene | null {
  const gl = createCanvasGL(canvas);
  if (!gl) return null;
  const clay = program(gl, CLAY_VS, CLAY_FS);
  const dots = program(gl, DOT_VS, DOT_FS);
  const body = upload(gl, sphere(1, 40));

  // Points: kind 0 land, 1 India, 2 hub, 3 arc samples.
  const pos: number[] = [], kind: number[] = [], tt: number[] = [], delay: number[] = [];
  const N = 16000, golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
    const x = Math.cos(th) * r, z = Math.sin(th) * r;
    const lat = Math.asin(y) * 180 / Math.PI;
    const lon = Math.atan2(x, z) * 180 / Math.PI;
    const ll: LatLon = [lat, lon];
    const india = inside(ll, INDIA_OUTLINE);
    if (!india && !LAND.some(poly => inside(ll, poly))) continue;
    pos.push(x * 1.006, y * 1.006, z * 1.006);
    kind.push(india ? 1 : 0); tt.push(0); delay.push(0);
  }
  const hub = toVec(HUB, 1.012);
  pos.push(...hub); kind.push(2); tt.push(0); delay.push(0);
  for (const o of ORIGINS) { pos.push(...toVec(o.at, 1.01)); kind.push(1); tt.push(0); delay.push(0); }

  const arcs: Vec3[][] = [];
  ORIGINS.forEach((o, k) => {
    const a = toVec(o.at), b = toVec(HUB);
    const omega = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
    const samples = Math.max(28, Math.round(omega * 70));
    const pts: Vec3[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const s0 = Math.sin((1 - t) * omega) / Math.sin(omega), s1 = Math.sin(t * omega) / Math.sin(omega);
      const lift = 1.01 + Math.sin(Math.PI * t) * (0.04 + omega * 0.17);
      const v: Vec3 = [(a[0] * s0 + b[0] * s1) * lift, (a[1] * s0 + b[1] * s1) * lift, (a[2] * s0 + b[2] * s1) * lift];
      pts.push(v);
      pos.push(...v); kind.push(3); tt.push(t); delay.push(k / ORIGINS.length * 0.58);
    }
    arcs.push(pts);
  });

  const attr = (data: number[]) => {
    const b = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    return b;
  };
  const bPos = attr(pos), bKind = attr(kind), bT = attr(tt), bDelay = attr(delay);
  const count = kind.length;

  const C = {
    ink: hexToRgb("#12302C"), india: hexToRgb("#B8913F"), arc: hexToRgb("#C9A04F"),
    body: hexToRgb("#FBF9F3"), sky: hexToRgb("#FFFFFF"), ground: hexToRgb("#E3EBE3"), rim: hexToRgb("#D9CDA6"),
  };

  const state = { progress: 0, smooth: 0, drag: 0, dragV: 0, dragging: false, lastX: 0, raf: 0, visible: false, t0: performance.now(), last: performance.now(), active: -1 };

  const io = new IntersectionObserver(([e]) => {
    state.visible = e.isIntersecting;
    if (state.visible && !state.raf) state.raf = requestAnimationFrame(frame);
  });
  io.observe(canvas);

  const down = (e: PointerEvent) => { state.dragging = true; state.lastX = e.clientX; canvas.setPointerCapture(e.pointerId); canvas.dataset.dragging = ""; };
  const move = (e: PointerEvent) => {
    if (!state.dragging) return;
    state.dragV = (e.clientX - state.lastX) * 0.006; state.drag += state.dragV; state.lastX = e.clientX;
    if (!state.raf) state.raf = requestAnimationFrame(frame);
  };
  const up = (e: PointerEvent) => { state.dragging = false; delete canvas.dataset.dragging; if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId); };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);

  const ease = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);

  function render(now: number) {
    const dt = Math.min(0.05, (now - state.last) / 1000);
    state.last = now;
    const t = (now - state.t0) / 1000;
    state.smooth += (state.progress - state.smooth) * (1 - Math.pow(0.002, dt));
    if (!state.dragging) { state.drag *= Math.pow(0.08, dt); }
    const p = state.smooth;
    const { aspect } = fitCanvas(canvas, gl!);

    const turn = ease(p / 0.38);
    const lon = HUB[1] - 150 * (1 - turn) + (reduced ? 0 : (1 - turn) * Math.sin(t * 0.2) * 8);
    const lat = HUB[0] * turn * 0.85 + 12 * (1 - turn);
    const model = m4.chain(m4.rotX(lat * Math.PI / 180), m4.rotY(-lon * Math.PI / 180 + state.drag));
    const zoom = ease((p - 0.55) / 0.45);
    const eye: [number, number, number] = [0, 0, 4.6 - zoom * 0.35];
    const view = m4.lookAt(eye, [0, 0, 0]);
    const proj = m4.perspective(aspect < 0.9 ? 0.72 : 0.56, aspect, 0.1, 30);

    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);
    gl!.enable(gl!.DEPTH_TEST);
    gl!.enable(gl!.BLEND);
    gl!.blendFunc(gl!.SRC_ALPHA, gl!.ONE_MINUS_SRC_ALPHA);

    clay.use();
    gl!.uniformMatrix4fv(clay.u("uModel"), false, model);
    gl!.uniformMatrix4fv(clay.u("uView"), false, view);
    gl!.uniformMatrix4fv(clay.u("uProj"), false, proj);
    gl!.uniform3fv(clay.u("uColor"), C.body);
    gl!.uniform3fv(clay.u("uSky"), C.sky);
    gl!.uniform3fv(clay.u("uGround"), C.ground);
    gl!.uniform3fv(clay.u("uRim"), C.rim);
    gl!.uniform3fv(clay.u("uEye"), eye);
    gl!.uniform1f(clay.u("uGloss"), 0.12);
    gl!.uniform1f(clay.u("uAlpha"), 1);
    body.draw(clay);

    dots.use();
    gl!.depthMask(false);
    gl!.uniformMatrix4fv(dots.u("uModel"), false, model);
    gl!.uniformMatrix4fv(dots.u("uView"), false, view);
    gl!.uniformMatrix4fv(dots.u("uProj"), false, proj);
    gl!.uniform3fv(dots.u("uEye"), eye);
    gl!.uniform1f(dots.u("uDpr"), Math.min(window.devicePixelRatio || 1, 2) * canvas.clientHeight / 640);
    const draw = reduced ? 1 : Math.max(0, Math.min(1, (p - 0.28) / 0.62));
    gl!.uniform1f(dots.u("uDraw"), draw);
    gl!.uniform1f(dots.u("uSize"), 3.4);
    gl!.uniform1f(dots.u("uPulse"), reduced ? 0.4 : (t * 0.6) % 1);
    gl!.uniform3fv(dots.u("uInk"), C.ink);
    gl!.uniform3fv(dots.u("uIndia"), C.india);
    gl!.uniform3fv(dots.u("uArc"), C.arc);
    const bind = (b: WebGLBuffer, name: string, size: number) => {
      const loc = dots.a(name); if (loc < 0) return;
      gl!.bindBuffer(gl!.ARRAY_BUFFER, b); gl!.enableVertexAttribArray(loc); gl!.vertexAttribPointer(loc, size, gl!.FLOAT, false, 0, 0);
    };
    bind(bPos, "aPos", 3); bind(bKind, "aKind", 1); bind(bT, "aT", 1); bind(bDelay, "aDelay", 1);
    gl!.drawArrays(gl!.POINTS, 0, count);
    gl!.depthMask(true);

    // Report which route is arriving so the city list can follow along.
    let active = -1;
    ORIGINS.forEach((_, k) => { if (draw - (k / ORIGINS.length) * 0.58 > 0.02) active = k; });
    if (active !== state.active) { state.active = active; onActive?.(active); }
    return arcs;
  }

  function frame(now: number) {
    state.raf = 0;
    if (!state.visible || document.hidden) return;
    render(now);
    if (!reduced || state.dragging || Math.abs(state.progress - state.smooth) > 0.0005) state.raf = requestAnimationFrame(frame);
  }
  const wake = () => { if (!state.raf && state.visible) state.raf = requestAnimationFrame(frame); };
  window.addEventListener("resize", wake);
  document.addEventListener("visibilitychange", wake);

  return {
    setProgress(p) { state.progress = p; wake(); },
    destroy() {
      cancelAnimationFrame(state.raf);
      io.disconnect();
      window.removeEventListener("resize", wake);
      document.removeEventListener("visibilitychange", wake);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
