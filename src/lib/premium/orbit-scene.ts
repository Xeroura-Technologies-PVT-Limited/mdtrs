import { createCanvasGL, hexToRgb, m4, program, type Mat4, type Vec3 } from "./gl";

/** The "Care Orbit" emblem, raymarched in a fragment shader.
 *  Signed distance fields give a seamless glazed-porcelain cross (the two bars
 *  are blended, not overlapped), a lacquered orbit ring and a satellite with a
 *  trail. Lighting is physically based: GGX specular with a clear coat,
 *  soft shadows, ambient occlusion, a studio environment for reflections,
 *  a contact shadow on an invisible floor, and ACES tone mapping. */

const VS = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FS = `
precision highp float;
uniform vec2 uRes;
uniform vec3 uEye, uCamF, uCamR, uCamU;
uniform float uFocal;
uniform mat3 uCrossInv, uRingInv;
uniform vec3 uCenter;
uniform float uScale, uGroundY, uTime;
uniform vec4 uSat[10];
uniform vec3 uCross, uRing, uSatCol, uTrail, uShadow, uEnvTop, uEnvHor, uEnvBot;

#define PI 3.14159265

float sdRoundBox(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r; }
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0); return mix(b, a, h) - k*h*(1.0-h); }
float sdTorus(vec3 p, vec2 t){ vec2 q = vec2(length(p.xy) - t.x, p.z); return length(q) - t.y; }

// x: distance, y: material (1 cross, 2 ring, 3+ satellite index/10)
vec2 map(vec3 p){
  vec3 c = uCrossInv * (p - uCenter) / uScale;
  float d = smin(sdRoundBox(c, vec3(0.34, 1.02, 0.34), 0.22), sdRoundBox(c, vec3(1.02, 0.34, 0.34), 0.22), 0.07) * uScale;
  vec2 res = vec2(d, 1.0);
  vec3 r = uRingInv * (p - uCenter) / uScale;
  float dr = sdTorus(r, vec2(1.62, 0.05)) * uScale;
  if (dr < res.x) res = vec2(dr, 2.0);
  // Satellite and its tapering trail, blended into one smooth comet.
  float dsat = 1e5; float id = 0.0;
  for (int i = 0; i < 10; i++) {
    float ds = length(p - uSat[i].xyz) - uSat[i].w;
    if (ds < dsat) id = float(i);
    dsat = smin(dsat, ds, 0.05);
  }
  if (dsat < res.x) res = vec2(dsat, 3.0 + id * 0.1);
  return res;
}

vec3 calcNormal(vec3 p){
  const vec2 e = vec2(1.0, -1.0) * 0.0007;
  return normalize(e.xyy*map(p+e.xyy).x + e.yyx*map(p+e.yyx).x + e.yxy*map(p+e.yxy).x + e.xxx*map(p+e.xxx).x);
}

float softShadow(vec3 ro, vec3 rd, float k){
  float res = 1.0, t = 0.03;
  for (int i = 0; i < 40; i++) {
    float h = map(ro + rd*t).x;
    res = min(res, k*h/t);
    t += clamp(h, 0.02, 0.3);
    if (res < 0.002 || t > 9.0) break;
  }
  res = clamp(res, 0.0, 1.0);
  return res*res*(3.0 - 2.0*res);
}

float calcAO(vec3 p, vec3 n){
  float o = 0.0, s = 1.0;
  for (int i = 0; i < 6; i++) {
    float h = 0.015 + 0.11*float(i);
    o += (h - map(p + n*h).x) * s;
    s *= 0.78;
  }
  return clamp(1.0 - 1.6*o, 0.0, 1.0);
}

// Studio environment: warm cyclorama with a large key softbox, a strip light and a rim panel.
vec3 env(vec3 d, float rough){
  vec3 c = d.y > 0.0 ? mix(uEnvHor, uEnvTop, pow(d.y, 0.55)) : mix(uEnvHor, uEnvBot, pow(-d.y, 0.45));
  float w = 1.0 + rough * 6.0;
  c += 4.2 * smoothstep(0.93 - 0.08*w*0.25, 0.985, dot(d, normalize(vec3(-0.55, 0.75, 0.5)))) / w;
  c += 1.6 * smoothstep(0.95 - 0.05*w*0.25, 0.995, dot(d, normalize(vec3(0.85, 0.25, 0.35)))) / w;
  c += 1.1 * smoothstep(0.86, 0.98, dot(d, normalize(vec3(0.3, 0.35, -1.0)))) / w;
  return c;
}

vec3 aces(vec3 x){ return clamp((x*(2.51*x + 0.03)) / (x*(2.43*x + 0.59) + 0.14), 0.0, 1.0); }

vec3 shade(vec3 p, vec3 n, vec3 v, float mat){
  vec3 albedo; float rough; float metal = 0.0; float coat; float sss = 0.0;
  if (mat < 1.5) { albedo = uCross; rough = 0.3; coat = 0.75; sss = 1.0; }
  else if (mat < 2.5) { albedo = uRing; rough = 0.22; coat = 1.0; }
  else { float k = (mat - 3.0) * 10.0 / 9.0; albedo = mix(uSatCol, uTrail, k); rough = 0.18; coat = 1.0 - k*0.6; }

  vec3 L = normalize(vec3(-0.55, 0.75, 0.5));
  vec3 H = normalize(L + v);
  float NoL = max(dot(n, L), 0.0), NoV = max(dot(n, v), 1e-3), NoH = max(dot(n, H), 0.0), VoH = max(dot(v, H), 0.0);
  float sh = softShadow(p + n*0.004, L, 12.0);
  float occ = calcAO(p, n);

  // Base layer: GGX specular + Lambert, with wrapped light to fake light scattering in porcelain.
  float a = rough*rough, a2 = a*a;
  float dd = NoH*NoH*(a2 - 1.0) + 1.0;
  float D = a2 / (PI*dd*dd);
  float kk = (rough + 1.0)*(rough + 1.0) / 8.0;
  float G = (NoV/(NoV*(1.0-kk)+kk)) * (NoL/(NoL*(1.0-kk)+kk));
  vec3 F0 = mix(vec3(0.04), albedo, metal);
  vec3 F = F0 + (1.0 - F0) * pow(1.0 - VoH, 5.0);
  vec3 lightCol = vec3(1.0, 0.96, 0.9) * 3.8;
  vec3 spec = D*G*F / max(4.0*NoV*NoL, 1e-3) * NoL * sh;

  float wrap = max((dot(n, L) + 0.45) / 1.45, 0.0);
  vec3 scatter = sss * albedo * vec3(1.0, 0.82, 0.78) * (wrap - NoL) * 0.35 * mix(1.0, sh, 0.5);
  vec3 irr = mix(uEnvBot * 0.8, uEnvTop, n.y*0.5 + 0.5) * 0.42 + uEnvHor * 0.08;
  vec3 diffuse = albedo * (1.0 - metal) * (NoL*sh*lightCol/PI + irr*occ) + scatter*lightCol/PI;

  // Image-based reflection of the studio.
  vec3 R = reflect(-v, n);
  vec3 Fr = F0 + (max(vec3(1.0 - rough), F0) - F0) * pow(1.0 - NoV, 5.0);
  vec3 refl = env(R, rough) * Fr * occ * mix(0.35, 1.0, sh*0.5 + 0.5) * (mat < 1.5 ? 0.55 : 1.0);

  // Clear coat: a sharp lacquer highlight on top.
  float Fc = 0.04 + 0.96*pow(1.0 - NoV, 5.0);
  float ca = 0.06*0.06, cdd = NoH*NoH*(ca*ca - 1.0) + 1.0;
  float Dc = ca*ca / (PI*cdd*cdd);
  vec3 clear = coat * (Fc*0.9*env(R, 0.0)*occ + vec3(Dc*0.25*NoL*sh*(0.04 + 0.96*pow(1.0-VoH,5.0))) * lightCol);

  return diffuse + spec*lightCol + refl + clear;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*uRes) / uRes.y;
  vec3 ro = uEye;
  vec3 rd = normalize(uCamF*uFocal + uCamR*uv.x + uCamU*uv.y);

  vec3 col = vec3(0.0);
  float alpha = 0.0;

  // Only march rays that pass near the emblem.
  vec3 oc = ro - uCenter;
  float bR = 2.1 * uScale;
  float b = dot(oc, rd), c = dot(oc, oc) - bR*bR, h = b*b - c;
  bool hit = false;
  if (h > 0.0) {
    float t = max(-b - sqrt(h), 0.0), tmax = -b + sqrt(h);
    for (int i = 0; i < 110; i++) {
      vec2 r = map(ro + rd*t);
      if (r.x < 0.0006*t) {
        vec3 p = ro + rd*t;
        vec3 n = calcNormal(p);
        col = shade(p, n, -rd, r.y);
        alpha = 1.0;
        hit = true;
        break;
      }
      t += r.x;
      if (t > tmax) break;
    }
  }

  if (!hit && rd.y < 0.0) {
    // Contact shadow on an invisible studio floor.
    float t = (uGroundY - ro.y) / rd.y;
    vec3 p = ro + rd*t;
    float dist = length(p.xz - uCenter.xz);
    if (dist < 2.6*uScale) {
      vec3 L = normalize(vec3(-0.55, 0.75, 0.5));
      float above = softShadow(p + vec3(0.0, 0.01, 0.0), normalize(vec3(-0.2, 1.0, 0.15)), 1.6);
      float dark = (1.0 - above) * 0.3;
      dark *= smoothstep(2.6*uScale, 0.5*uScale, dist);
      gl_FragColor = vec4(uShadow, clamp(dark, 0.0, 0.3));
      return;
    }
  }

  col = aces(col * 0.86);
  col = pow(col, vec3(1.0/2.2));
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
  gl_FragColor = vec4(col, alpha);
}`;

export type OrbitScene = { setProgress(p: number): void; destroy(): void };

const lin = (hex: string): Vec3 => hexToRgb(hex).map(c => Math.pow(c, 2.2)) as Vec3;

/** Inverse (transpose) of the rotation part of a 4x4, as a column-major 3x3. */
function inv3(m: Mat4) {
  const o = new Float32Array(9);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[c * 3 + r] = m[r * 4 + c];
  return o;
}

export type OrbitOptions = {
  /** "hero": shrinks and lifts away as the hero scrolls. "side": turns and opens its orbit as a section is read. */
  mode?: "hero" | "side";
  onFirstFrame?: () => void;
};

export function createOrbitScene(canvas: HTMLCanvasElement, reduced: boolean, opts: OrbitOptions = {}): OrbitScene | null {
  const side = opts.mode === "side";
  let firstFrame = false;
  const gl = createCanvasGL(canvas);
  if (!gl) return null;
  const prog = program(gl, VS, FS);
  const quad = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  const C = {
    cross: lin("#FBF3EA"),
    ring: lin("#4A1D41"),
    sat: lin("#9B3D7E"),
    trail: lin("#E7B9CF"),
    shadow: hexToRgb("#361A31"),
    top: lin("#FFFBF6"),
    hor: lin("#FBEFE2"),
    bot: lin("#E9D3C6"),
  };

  const R = 1.62;
  const state = {
    progress: 0, smoothP: 0,
    yaw: -0.35, pitch: 0.08, spin: 0,
    targetYaw: 0, targetPitch: 0,
    dragging: false, lastX: 0, lastY: 0,
    visible: true, raf: 0, t0: performance.now(), last: performance.now(),
    angle: 0.6,
    // Adaptive resolution: start sharp, step down if frames run long.
    res: Math.min(window.devicePixelRatio || 1, innerWidth < 900 ? 1.25 : 1.6),
    frameAvg: 16, frames: 0,
  };

  function request() { if (!state.raf && state.visible) state.raf = requestAnimationFrame(frame); }

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
    request();
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
    request();
  });
  io.observe(canvas);

  function render(now: number) {
    const dt = Math.min(0.05, (now - state.last) / 1000);
    state.last = now;
    const t = (now - state.t0) / 1000;

    // Resolution management.
    if (!reduced && dt > 0) {
      state.frameAvg += (dt * 1000 - state.frameAvg) * 0.08;
      if (++state.frames > 40 && state.frameAvg > 26 && state.res > 0.7) { state.res *= 0.85; state.frames = 0; }
    }
    const w = Math.max(1, Math.round(canvas.clientWidth * state.res));
    const h = Math.max(1, Math.round(canvas.clientHeight * state.res));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl!.viewport(0, 0, w, h);
    const aspect = w / h;

    const k = 1 - Math.pow(0.0015, dt);
    state.smoothP += (state.progress - state.smoothP) * k;
    const p = state.smoothP;
    if (!reduced) {
      state.spin *= Math.pow(0.12, dt);
      state.angle += dt * (0.55 + p * 0.6);
    }
    state.yaw += ((state.targetYaw + state.spin) - state.yaw) * k * 0.9;
    state.pitch += (state.targetPitch - state.pitch) * k;

    const narrow = aspect < 0.9;
    const fov = narrow ? 0.62 : 0.5;
    const eye: Vec3 = side ? [0, 0.15, narrow ? 10.2 : 9.4] : [0, 0.15, (narrow ? 10.6 : 9.0) + p * 1.4];
    const target: Vec3 = [0, 0.05, 0];

    const float = reduced ? 0 : Math.sin(t * 0.9) * 0.07;
    const idle = reduced ? 0 : Math.sin(t * 0.25) * 0.18;
    const yaw = side ? state.yaw + idle + p * Math.PI * 1.4 - 0.9 : state.yaw + idle + p * Math.PI * 0.9 - 0.42;
    const scale = side ? 0.88 : 1 - p * 0.18;
    const center: Vec3 = side ? [0, float, 0] : [0, float + p * 0.35, 0];
    const rot = m4.chain(m4.rotY(yaw), m4.rotX(state.pitch + (side ? 0.18 - p * 0.3 : 0.06 - p * 0.25)));
    const ringRot = side
      ? m4.chain(rot, m4.rotY(0.95 - p * 0.7), m4.rotX(1.15 - p * 0.95), m4.rotZ(reduced ? 0.4 : t * 0.08))
      : m4.chain(rot, m4.rotY(0.55 + p * 0.5), m4.rotX(0.32 + p * 0.9), m4.rotZ(reduced ? 0.4 : t * 0.08));
    const ringFrame = m4.chain(m4.translation(...center), ringRot, m4.scaling(scale));

    const sats = new Float32Array(40);
    for (let i = 0; i < 10; i++) {
      const ai = state.angle - i * 0.05;
      const pos = m4.apply(ringFrame, [Math.cos(ai) * R, Math.sin(ai) * R, 0]);
      sats.set([pos[0], pos[1], pos[2], (i === 0 ? 0.13 : 0.075 * Math.pow(1 - i / 10.5, 1.3)) * scale], i * 4);
    }

    // Camera basis.
    let f: Vec3 = [target[0] - eye[0], target[1] - eye[1], target[2] - eye[2]];
    let l = Math.hypot(...f); f = [f[0] / l, f[1] / l, f[2] / l];
    let r: Vec3 = [-f[2], 0, f[0]]; // cross(f, up)
    l = Math.hypot(...r); r = [r[0] / l, r[1] / l, r[2] / l];
    const u: Vec3 = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];

    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    prog.use();
    const loc = prog.a("aPos");
    gl!.bindBuffer(gl!.ARRAY_BUFFER, quad);
    gl!.enableVertexAttribArray(loc);
    gl!.vertexAttribPointer(loc, 2, gl!.FLOAT, false, 0, 0);
    gl!.uniform2f(prog.u("uRes"), w, h);
    gl!.uniform3fv(prog.u("uEye"), eye);
    gl!.uniform3fv(prog.u("uCamF"), f);
    gl!.uniform3fv(prog.u("uCamR"), r);
    gl!.uniform3fv(prog.u("uCamU"), u);
    gl!.uniform1f(prog.u("uFocal"), 1 / Math.tan(fov / 2) / 2);
    gl!.uniformMatrix3fv(prog.u("uCrossInv"), false, inv3(rot));
    gl!.uniformMatrix3fv(prog.u("uRingInv"), false, inv3(ringRot));
    gl!.uniform3fv(prog.u("uCenter"), center);
    gl!.uniform1f(prog.u("uScale"), scale);
    gl!.uniform1f(prog.u("uGroundY"), -2.05);
    gl!.uniform1f(prog.u("uTime"), t);
    gl!.uniform4fv(prog.u("uSat"), sats);
    gl!.uniform3fv(prog.u("uCross"), C.cross);
    gl!.uniform3fv(prog.u("uRing"), C.ring);
    gl!.uniform3fv(prog.u("uSatCol"), C.sat);
    gl!.uniform3fv(prog.u("uTrail"), C.trail);
    gl!.uniform3fv(prog.u("uShadow"), C.shadow);
    gl!.uniform3fv(prog.u("uEnvTop"), C.top);
    gl!.uniform3fv(prog.u("uEnvHor"), C.hor);
    gl!.uniform3fv(prog.u("uEnvBot"), C.bot);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    if (!firstFrame) { firstFrame = true; opts.onFirstFrame?.(); }
  }

  function frame(now: number) {
    state.raf = 0;
    if (!state.visible || document.hidden) return;
    // While the first-visit loader covers the page, draw one frame (so shaders are compiled) and then wait.
    if (firstFrame && document.documentElement.classList.contains("pm-loading")) {
      window.setTimeout(() => { state.last = performance.now(); request(); }, 150);
      return;
    }
    render(now);
    if (!reduced || state.dragging || Math.abs(state.progress - state.smoothP) > 0.001) {
      state.raf = requestAnimationFrame(frame);
    }
  }
  const onVisibility = () => request();
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("resize", request);
  request();

  return {
    setProgress(p) { state.progress = p; request(); },
    destroy() {
      cancelAnimationFrame(state.raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", request);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
