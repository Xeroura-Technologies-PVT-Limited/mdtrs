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
uniform float uScale, uGroundY, uTime, uRingK, uShadowK;
uniform mat3 uCapsuleInv;
uniform vec3 uCapsulePos;
uniform float uCapsuleScale, uAngle;
uniform vec3 uCross, uRing, uSatCol, uTrail, uShadow, uEnvTop, uEnvHor, uEnvBot, uCapsuleBody;

#define PI 3.14159265

float sdRoundBox(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r; }
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0); return mix(b, a, h) - k*h*(1.0-h); }
float sdTorus(vec3 p, vec2 t){ vec2 q = vec2(length(p.xy) - t.x, p.z); return length(q) - t.y; }
float sdEllipsoid(vec3 p, vec3 r){ float k0 = length(p/r); float k1 = length(p/(r*r)); return k0*(k0 - 1.0)/k1; }
float sdBox(vec3 p, vec3 b){ vec3 q = abs(p) - b; return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0); }

// The capsule that circles the cross: magenta at the front, ivory behind. Local x is the direction of travel.
vec2 sdCapsule(vec3 q){
  vec3 c = q;
  c.x -= clamp(c.x, -0.3, 0.3);
  return vec2(length(c) - 0.15, q.x > 0.0 ? 1.0 : 0.0);
}

// x: distance, y: material (1 cross, 2 ring, 3+ satellite index/10)
vec2 map(vec3 p){
  vec3 c = uCrossInv * (p - uCenter) / uScale;
  float d = smin(sdRoundBox(c, vec3(0.34, 1.02, 0.34), 0.22), sdRoundBox(c, vec3(1.02, 0.34, 0.34), 0.22), 0.07) * uScale;
  vec2 res = vec2(d, 1.0);
  if (uRingK < 0.01) return res;
  vec3 r = uRingInv * (p - uCenter) / uScale;
  float dr = sdTorus(r, vec2(1.62 * uRingK, 0.05 * min(1.0, uRingK * 3.0))) * uScale;
  if (dr < res.x) res = vec2(dr, 2.0);
  // The capsule circling the cross.
  vec3 q = uCapsuleInv * (p - uCapsulePos) / uCapsuleScale;
  vec2 ap = sdCapsule(q);
  ap.x *= uCapsuleScale;
  if (ap.x < res.x) res = vec2(ap.x, 3.0 + ap.y);
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
  else if (mat < 2.5) { albedo = uRing; rough = 0.24; coat = 0.5; metal = 1.0; }
  else if (mat < 3.5) { albedo = uCapsuleBody; rough = 0.16; coat = 1.0; sss = 0.5; }
  else { albedo = uSatCol; rough = 0.18; coat = 1.0; }

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

  vec3 col = diffuse + spec*lightCol + refl + clear;
  if (mat > 1.5 && mat < 2.5) {
    // The ring glows along the path the capsule has just travelled.
    vec3 r = uRingInv * (p - uCenter) / uScale;
    float behind = mod(uAngle - atan(r.y, r.x), 6.2831853);
    float glow = exp(-behind * 1.6);
    col = mix(col, col * 0.4 + uTrail * 1.4, glow * 0.85);
  }
  return col;
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

  if (!hit && rd.y < 0.0 && uShadowK > 0.01) {
    // Contact shadow on an invisible studio floor.
    float t = (uGroundY - ro.y) / rd.y;
    vec3 p = ro + rd*t;
    float dist = length(p.xz - uCenter.xz);
    if (dist < 2.6*uScale) {
      vec3 L = normalize(vec3(-0.55, 0.75, 0.5));
      float above = softShadow(p + vec3(0.0, 0.01, 0.0), normalize(vec3(-0.2, 1.0, 0.15)), 1.6);
      float dark = (1.0 - above) * 0.3;
      dark *= smoothstep(2.6*uScale, 0.5*uScale, dist);
      gl_FragColor = vec4(uShadow, clamp(dark, 0.0, 0.3) * uShadowK);
      return;
    }
  }

  col = aces(col * 0.86);
  col = pow(col, vec3(1.0/2.2));
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
  gl_FragColor = vec4(col, alpha);
}`;

/** Where and how the emblem should be drawn this frame. Positions and sizes
 *  are in CSS pixels of the viewport; the page's motion controller owns them so
 *  one emblem can travel from the loader to the hero and on down the page. */
export type OrbitPose = {
  x: number; y: number;
  /** Diameter of the orbit ring, in pixels. */
  ringPx: number;
  yaw: number; pitch: number;
  ringRy: number; ringRx: number;
  /** 0 hides the ring and satellite, 1 shows them fully. */
  ringK: number;
  shadow: number;
  /** Whether pointer tilt and drag spin apply. */
  interactive: boolean;
  visible: boolean;
};

export type OrbitScene = { destroy(): void };
export type OrbitOptions = { getPose: (t: number) => OrbitPose; onFirstFrame?: () => void };

const lin = (hex: string): Vec3 => hexToRgb(hex).map(c => Math.pow(c, 2.2)) as Vec3;

/** Inverse (transpose) of the rotation part of a 4x4, as a column-major 3x3. */
function inv3(m: Mat4) {
  const o = new Float32Array(9);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[c * 3 + r] = m[r * 4 + c];
  return o;
}

const EYE_Z = 9, FOV = 0.5, RING_R = 1.62;

export function createOrbitScene(canvas: HTMLCanvasElement, reduced: boolean, opts: OrbitOptions): OrbitScene | null {
  const gl = createCanvasGL(canvas);
  if (!gl) return null;
  const prog = program(gl, VS, FS);
  const quad = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  // Green & gold: ivory porcelain, a polished gold orbit, an emerald-and-ivory capsule.
  const C = {
    cross: lin("#F8F4EA"), ring: lin("#D9B26A"), sat: lin("#2E7D68"), trail: lin("#F6D78F"), capsuleBody: lin("#FFFBF2"),
    shadow: hexToRgb("#020C0A"), top: lin("#FFF8EC"), hor: lin("#E6EDE4"), bot: lin("#4E6B62"),
  };

  const state = {
    tYaw: 0, tPitch: 0, yaw: 0, pitch: 0, spin: 0,
    dragging: false, lastX: 0, lastY: 0,
    raf: 0, t0: performance.now(), last: performance.now(), angle: 0.6,
    res: Math.min(window.devicePixelRatio || 1, innerWidth < 900 ? 1.25 : 1.5),
    frameAvg: 16, frames: 0, firstFrame: false, cleared: false,
  };

  function onMove(e: PointerEvent) {
    if (state.dragging) {
      state.spin += (e.clientX - state.lastX) * 0.0045;
      state.tPitch = Math.max(-0.6, Math.min(0.6, state.tPitch + (e.clientY - state.lastY) * 0.004));
      state.lastX = e.clientX; state.lastY = e.clientY;
    } else if (e.pointerType === "mouse") {
      state.tYaw = (e.clientX / innerWidth * 2 - 1) * 0.3;
      state.tPitch = (e.clientY / innerHeight * 2 - 1) * 0.18;
    }
  }
  // The canvas never takes pointer events; elements marked as anchors start a drag.
  function onDown(e: PointerEvent) {
    const anchor = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-orbit-anchor]") : null;
    if (!anchor || (e.target instanceof Element && e.target.closest("a, button"))) return;
    state.dragging = true; state.lastX = e.clientX; state.lastY = e.clientY;
    anchor.dataset.dragging = "";
  }
  function onUp() {
    state.dragging = false;
    document.querySelectorAll<HTMLElement>("[data-orbit-anchor][data-dragging]").forEach(a => delete a.dataset.dragging);
  }
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);

  function frame(now: number) {
    state.raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    const dt = Math.min(0.05, (now - state.last) / 1000);
    state.last = now;
    const t = (now - state.t0) / 1000;
    const pose = opts.getPose(t);

    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (!pose.visible || cw === 0) {
      if (!state.cleared) { gl!.clearColor(0, 0, 0, 0); gl!.clear(gl!.COLOR_BUFFER_BIT); state.cleared = true; }
      return;
    }
    state.cleared = false;

    if (!reduced) {
      state.frameAvg += (dt * 1000 - state.frameAvg) * 0.08;
      if (++state.frames > 40 && state.frameAvg > 26 && state.res > 0.7) { state.res *= 0.85; state.frames = 0; }
    }
    const w = Math.max(1, Math.round(cw * state.res)), h = Math.max(1, Math.round(ch * state.res));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl!.viewport(0, 0, w, h);

    const k = 1 - Math.pow(0.002, dt);
    if (!reduced) { state.spin *= Math.pow(0.12, dt); state.angle += dt * 0.6; }
    const live = pose.interactive ? 1 : 0;
    state.yaw += ((state.tYaw + state.spin) * live - state.yaw) * k;
    state.pitch += (state.tPitch * live - state.pitch) * k;

    // Pixels to world units on the z = 0 plane.
    const wpp = 2 * EYE_Z * Math.tan(FOV / 2) / ch;
    const scale = Math.max(0.001, pose.ringPx * wpp / (RING_R * 2));
    const center: Vec3 = [(pose.x - cw / 2) * wpp, -(pose.y - ch / 2) * wpp, 0];
    const rot = m4.chain(m4.rotY(pose.yaw + state.yaw), m4.rotX(pose.pitch + state.pitch));
    const ringRot = m4.chain(rot, m4.rotY(pose.ringRy), m4.rotX(pose.ringRx), m4.rotZ(reduced ? 0.4 : t * 0.08));
    const ringFrame = m4.chain(m4.translation(...center), ringRot, m4.scaling(scale));
    const rk = Math.max(0, Math.min(1, pose.ringK));

    // The capsule travels along the ring, lying along its direction of travel.
    const a = state.angle;
    const ca = Math.cos(a), sa = Math.sin(a), bank = 0.35;
    const fwd: Vec3 = [-sa, ca, 0];
    const cb = Math.cos(bank), sb = Math.sin(bank);
    const up: Vec3 = [-ca * sb, -sa * sb, cb];
    const side: Vec3 = [fwd[1] * up[2] - fwd[2] * up[1], fwd[2] * up[0] - fwd[0] * up[2], fwd[0] * up[1] - fwd[1] * up[0]];
    const local = m4.identity();
    local.set([...fwd, 0, ...up, 0, ...side, 0, 0, 0, 0, 1]);
    const capsuleRot = m4.chain(ringRot, local);
    const lift = 0.0;
    const capsulePos: Vec3 = rk < 0.05 ? [0, 0, 1e4] : m4.apply(ringFrame, [ca * RING_R * rk + up[0] * lift, sa * RING_R * rk + up[1] * lift, up[2] * lift]);
    const capsuleScale = Math.max(0.001, scale * 0.6 * Math.min(1, rk * 1.4));

    const eye: Vec3 = [0, 0, EYE_Z];
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    prog.use();
    const loc = prog.a("aPos");
    gl!.bindBuffer(gl!.ARRAY_BUFFER, quad);
    gl!.enableVertexAttribArray(loc);
    gl!.vertexAttribPointer(loc, 2, gl!.FLOAT, false, 0, 0);
    gl!.uniform2f(prog.u("uRes"), w, h);
    gl!.uniform3fv(prog.u("uEye"), eye);
    gl!.uniform3fv(prog.u("uCamF"), [0, 0, -1]);
    gl!.uniform3fv(prog.u("uCamR"), [1, 0, 0]);
    gl!.uniform3fv(prog.u("uCamU"), [0, 1, 0]);
    gl!.uniform1f(prog.u("uFocal"), 1 / Math.tan(FOV / 2) / 2);
    gl!.uniformMatrix3fv(prog.u("uCrossInv"), false, inv3(rot));
    gl!.uniformMatrix3fv(prog.u("uRingInv"), false, inv3(ringRot));
    gl!.uniform3fv(prog.u("uCenter"), center);
    gl!.uniform1f(prog.u("uScale"), scale);
    gl!.uniform1f(prog.u("uGroundY"), center[1] - 2.05 * scale);
    gl!.uniform1f(prog.u("uTime"), t);
    gl!.uniform1f(prog.u("uRingK"), rk);
    gl!.uniform1f(prog.u("uShadowK"), Math.max(0, Math.min(1, pose.shadow)));
    gl!.uniformMatrix3fv(prog.u("uCapsuleInv"), false, inv3(capsuleRot));
    gl!.uniform3fv(prog.u("uCapsulePos"), capsulePos);
    gl!.uniform1f(prog.u("uCapsuleScale"), capsuleScale);
    gl!.uniform1f(prog.u("uAngle"), a);
    gl!.uniform3fv(prog.u("uCapsuleBody"), C.capsuleBody);
    gl!.uniform3fv(prog.u("uCross"), C.cross);
    gl!.uniform3fv(prog.u("uRing"), C.ring);
    gl!.uniform3fv(prog.u("uSatCol"), C.sat);
    gl!.uniform3fv(prog.u("uTrail"), C.trail);
    gl!.uniform3fv(prog.u("uShadow"), C.shadow);
    gl!.uniform3fv(prog.u("uEnvTop"), C.top);
    gl!.uniform3fv(prog.u("uEnvHor"), C.hor);
    gl!.uniform3fv(prog.u("uEnvBot"), C.bot);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    if (!state.firstFrame) { state.firstFrame = true; opts.onFirstFrame?.(); }
  }
  state.raf = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(state.raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
