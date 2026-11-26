import { createCanvasGL, hexToRgb, m4, program, roundedBox, torus, upload, type Mat4, type Vec3 } from "./gl";
import type { OrbitOptions, OrbitScene } from "./orbit-scene";

/** The Care Orbit emblem for phones and tablets.
 *  Same pose, colours and materials as the raymarched desktop scene, but drawn
 *  as triangle meshes so the GPU's multisampling smooths every edge, and only
 *  the emblem's own pixels are shaded. Much lighter than raymarching. */

const VS = `
attribute vec3 aPos; attribute vec3 aNormal;
uniform mat4 uModel, uView, uProj;
varying vec3 vN; varying vec3 vW; varying vec3 vL;
void main(){
  vec4 w = uModel * vec4(aPos, 1.0);
  vW = w.xyz; vL = aPos;
  vN = normalize(mat3(uModel) * aNormal);
  gl_Position = uProj * uView * w;
}`;

const FS = `
precision mediump float;
varying vec3 vN; varying vec3 vW; varying vec3 vL;
uniform vec3 uEye, uAlbedo, uAccent, uTrail, uEnvTop, uEnvHor, uEnvBot;
uniform float uMat, uAngle;
#define PI 3.14159265

vec3 env(vec3 d, float rough){
  vec3 c = d.y > 0.0 ? mix(uEnvHor, uEnvTop, pow(d.y, 0.55)) : mix(uEnvHor, uEnvBot, pow(-d.y, 0.45));
  float w = 1.0 + rough * 6.0;
  c += 4.2 * smoothstep(0.93 - 0.02*w, 0.985, dot(d, normalize(vec3(-0.55, 0.75, 0.5)))) / w;
  c += 1.6 * smoothstep(0.95 - 0.0125*w, 0.995, dot(d, normalize(vec3(0.85, 0.25, 0.35)))) / w;
  c += 1.1 * smoothstep(0.86, 0.98, dot(d, normalize(vec3(0.3, 0.35, -1.0)))) / w;
  return c;
}
vec3 aces(vec3 x){ return clamp((x*(2.51*x + 0.03)) / (x*(2.43*x + 0.59) + 0.14), 0.0, 1.0); }

void main(){
  vec3 n = normalize(vN);
  vec3 v = normalize(uEye - vW);
  if (dot(n, v) < 0.0) n = -n;
  vec3 albedo = uAlbedo; float rough = 0.3; float metal = 0.0; float coat = 0.75; float sss = 1.0;
  if (uMat > 0.5 && uMat < 1.5) { rough = 0.24; metal = 1.0; coat = 0.5; sss = 0.0; }
  if (uMat > 1.5) { albedo = vL.x > 0.0 ? uAccent : uAlbedo; rough = 0.17; coat = 1.0; sss = 0.4; }

  vec3 L = normalize(vec3(-0.55, 0.75, 0.5));
  vec3 H = normalize(L + v);
  float NoL = max(dot(n, L), 0.0), NoV = max(dot(n, v), 1e-3), NoH = max(dot(n, H), 0.0), VoH = max(dot(v, H), 0.0);
  float occ = 0.82 + 0.18 * (n.y * 0.5 + 0.5);

  float a = rough*rough, a2 = a*a, dd = NoH*NoH*(a2 - 1.0) + 1.0;
  float D = a2 / (PI*dd*dd);
  float kk = (rough + 1.0)*(rough + 1.0) / 8.0;
  float G = (NoV/(NoV*(1.0-kk)+kk)) * (NoL/(NoL*(1.0-kk)+kk));
  vec3 F0 = mix(vec3(0.04), albedo, metal);
  vec3 F = F0 + (1.0 - F0) * pow(1.0 - VoH, 5.0);
  vec3 lightCol = vec3(1.0, 0.96, 0.9) * 3.8;
  vec3 spec = D*G*F / max(4.0*NoV*NoL, 1e-3) * NoL;

  float wrap = max((dot(n, L) + 0.45) / 1.45, 0.0);
  vec3 scatter = sss * albedo * vec3(1.0, 0.82, 0.78) * (wrap - NoL) * 0.35;
  vec3 irr = mix(uEnvBot * 0.8, uEnvTop, n.y*0.5 + 0.5) * 0.42 + uEnvHor * 0.08;
  vec3 diffuse = albedo * (1.0 - metal) * (NoL*lightCol/PI + irr*occ) + scatter*lightCol/PI;

  vec3 R = reflect(-v, n);
  float edge = smoothstep(0.0, 0.32, NoV);
  vec3 grazing = mix(max(vec3(1.0 - rough), F0), albedo * 1.15, metal);
  vec3 Fr = F0 + (grazing - F0) * pow(1.0 - NoV, 5.0) * edge;
  vec3 refl = env(R, rough) * Fr * occ * (uMat < 0.5 ? 0.55 : 1.0);

  float Fc = 0.04 + 0.96*pow(1.0 - NoV, 5.0) * edge;
  float ca = 0.0036, cdd = NoH*NoH*(ca*ca - 1.0) + 1.0;
  float Dc = ca*ca / (PI*cdd*cdd);
  vec3 clear = coat * (Fc*0.9*env(R, 0.0)*occ + vec3(Dc*0.25*NoL*(0.04 + 0.96*pow(1.0-VoH,5.0))) * lightCol);

  vec3 col = diffuse + spec*lightCol + refl + clear;
  if (uMat > 0.5 && uMat < 1.5) {
    // The ring glows along the path the capsule has just travelled.
    float behind = mod(uAngle - atan(vL.y, vL.x), 6.2831853);
    col = mix(col, col * 0.4 + uTrail * 1.4, exp(-behind * 1.6) * 0.85);
  }
  col = pow(aces(col * 0.86), vec3(1.0/2.2));
  gl_FragColor = vec4(col, 1.0);
}`;

const SHADOW_VS = `
attribute vec3 aPos; uniform mat4 uModel, uView, uProj; varying vec2 vUv;
void main(){ vUv = aPos.xz; gl_Position = uProj * uView * uModel * vec4(aPos, 1.0); }`;
const SHADOW_FS = `
precision mediump float; varying vec2 vUv; uniform vec3 uColor; uniform float uStrength;
void main(){ float fall = 1.0 - smoothstep(0.0, 1.0, length(vUv)); gl_FragColor = vec4(uColor, 0.3 * pow(fall, 1.6) * uStrength); }`;

const lin = (hex: string): Vec3 => hexToRgb(hex).map(c => Math.pow(c, 2.2)) as Vec3;
const EYE_Z = 9, FOV = 0.5, RING_R = 1.62;

export function createOrbitMesh(canvas: HTMLCanvasElement, reduced: boolean, opts: OrbitOptions): OrbitScene | null {
  const gl = createCanvasGL(canvas);
  if (!gl) return null;
  const prog = program(gl, VS, FS);
  const shade = program(gl, SHADOW_VS, SHADOW_FS);

  // Same proportions as the raymarched emblem.
  const barV = upload(gl, roundedBox(0.68, 2.04, 0.68, 0.22, 10));
  const barH = upload(gl, roundedBox(2.04, 0.68, 0.68, 0.22, 10));
  const ring = upload(gl, torus(RING_R, 0.05, 160, 18));
  const capsule = upload(gl, roundedBox(0.9, 0.3, 0.3, 0.149, 10));
  const floor = upload(gl, { position: [-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1], normal: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], index: [0, 1, 2, 0, 2, 3] });

  const C = {
    cross: lin("#F8F4EA"), ring: lin("#D9B26A"), sat: lin("#2E7D68"), trail: lin("#F6D78F"), capsuleBody: lin("#FFFBF2"),
    shadow: hexToRgb("#020C0A"), top: lin("#FFF8EC"), hor: lin("#E6EDE4"), bot: lin("#4E6B62"),
  };

  const state = {
    tYaw: 0, tPitch: 0, yaw: 0, pitch: 0, spin: 0,
    dragging: false, lastX: 0, lastY: 0,
    raf: 0, t0: performance.now(), last: performance.now(), angle: 0.6,
    firstFrame: false, cleared: false,
  };

  function onMove(e: PointerEvent) {
    if (!state.dragging) return;
    state.spin += (e.clientX - state.lastX) * 0.0045;
    state.tPitch = Math.max(-0.6, Math.min(0.6, state.tPitch + (e.clientY - state.lastY) * 0.004));
    state.lastX = e.clientX; state.lastY = e.clientY;
  }
  function onDown(e: PointerEvent) {
    const anchor = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-orbit-anchor]") : null;
    if (!anchor || (e.target instanceof Element && e.target.closest("a, button"))) return;
    state.dragging = true; state.lastX = e.clientX; state.lastY = e.clientY;
  }
  function onUp() { state.dragging = false; }
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);

  const draw = (mesh: { draw: (p: typeof prog) => void }, model: Mat4, mat: number, albedo: Vec3) => {
    gl!.uniformMatrix4fv(prog.u("uModel"), false, model);
    gl!.uniform1f(prog.u("uMat"), mat);
    gl!.uniform3fv(prog.u("uAlbedo"), albedo);
    mesh.draw(prog);
  };

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

    // Rasterising is cheap, so the canvas keeps the screen's sharpness (capped at 2x).
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(cw * dpr)), h = Math.max(1, Math.round(ch * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl!.viewport(0, 0, w, h);

    const k = 1 - Math.pow(0.002, dt);
    if (!reduced) { state.spin *= Math.pow(0.12, dt); state.angle += dt * 0.6; }
    const live = pose.interactive ? 1 : 0;
    state.yaw += ((state.tYaw + state.spin) * live - state.yaw) * k;
    state.pitch += (state.tPitch * live - state.pitch) * k;

    const wpp = 2 * EYE_Z * Math.tan(FOV / 2) / ch;
    const scale = Math.max(0.001, pose.ringPx * wpp / (RING_R * 2));
    const center: Vec3 = [(pose.x - cw / 2) * wpp, -(pose.y - ch / 2) * wpp, 0];
    const rot = m4.chain(m4.rotY(pose.yaw + state.yaw), m4.rotX(pose.pitch + state.pitch));
    const ringRot = m4.chain(rot, m4.rotY(pose.ringRy), m4.rotX(pose.ringRx), m4.rotZ(reduced ? 0.4 : t * 0.08));
    const rk = Math.max(0, Math.min(1, pose.ringK));
    const ringFrame = m4.chain(m4.translation(...center), ringRot, m4.scaling(scale));

    const a = state.angle;
    const ca = Math.cos(a), sa = Math.sin(a), bank = 0.35;
    const fwd: Vec3 = [-sa, ca, 0];
    const cb = Math.cos(bank), sb = Math.sin(bank);
    const up: Vec3 = [-ca * sb, -sa * sb, cb];
    const side: Vec3 = [fwd[1] * up[2] - fwd[2] * up[1], fwd[2] * up[0] - fwd[0] * up[2], fwd[0] * up[1] - fwd[1] * up[0]];
    const local = m4.identity();
    local.set([...fwd, 0, ...up, 0, ...side, 0, 0, 0, 0, 1]);
    const capsulePos = m4.apply(ringFrame, [ca * RING_R * rk, sa * RING_R * rk, 0]);
    const capsuleScale = Math.max(0.001, scale * 0.6 * Math.min(1, rk * 1.4));

    const eye: Vec3 = [0, 0, EYE_Z];
    const view = m4.lookAt(eye, [0, 0, 0]);
    const proj = m4.perspective(FOV, w / h, 0.1, 60);

    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);
    gl!.enable(gl!.BLEND);
    gl!.blendFunc(gl!.SRC_ALPHA, gl!.ONE_MINUS_SRC_ALPHA);

    // Soft pool of shade on an invisible floor.
    if (pose.shadow > 0.01) {
      gl!.disable(gl!.DEPTH_TEST);
      shade.use();
      gl!.uniformMatrix4fv(shade.u("uView"), false, view);
      gl!.uniformMatrix4fv(shade.u("uProj"), false, proj);
      gl!.uniformMatrix4fv(shade.u("uModel"), false, m4.chain(m4.translation(center[0], center[1] - 2.05 * scale, center[2]), m4.scaling(2.6 * scale, 1, 1.9 * scale)));
      gl!.uniform3fv(shade.u("uColor"), C.shadow);
      gl!.uniform1f(shade.u("uStrength"), Math.min(1, pose.shadow));
      floor.draw(shade);
    }

    gl!.enable(gl!.DEPTH_TEST);
    prog.use();
    gl!.uniformMatrix4fv(prog.u("uView"), false, view);
    gl!.uniformMatrix4fv(prog.u("uProj"), false, proj);
    gl!.uniform3fv(prog.u("uEye"), eye);
    gl!.uniform3fv(prog.u("uAccent"), C.sat);
    gl!.uniform3fv(prog.u("uTrail"), C.trail);
    gl!.uniform3fv(prog.u("uEnvTop"), C.top);
    gl!.uniform3fv(prog.u("uEnvHor"), C.hor);
    gl!.uniform3fv(prog.u("uEnvBot"), C.bot);
    gl!.uniform1f(prog.u("uAngle"), a);

    const crossModel = m4.chain(m4.translation(...center), rot, m4.scaling(scale));
    draw(barV, crossModel, 0, C.cross);
    draw(barH, crossModel, 0, C.cross);
    if (rk > 0.02) {
      draw(ring, m4.chain(ringFrame, m4.scaling(rk, rk, Math.min(1, rk * 3))), 1, C.ring);
      draw(capsule, m4.chain(m4.translation(...capsulePos), ringRot, local, m4.scaling(capsuleScale)), 2, C.capsuleBody);
    }
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
