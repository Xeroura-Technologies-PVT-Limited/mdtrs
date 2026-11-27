/** Tiny WebGL toolkit for the premium homepage: matrices, shaders and mesh builders.
 *  No dependencies, so the 3D scenes add only a few kilobytes to the bundle. */

export type Mat4 = Float32Array;
export type Vec3 = [number, number, number];

export const m4 = {
  identity(): Mat4 {
    const m = new Float32Array(16);
    m[0] = m[5] = m[10] = m[15] = 1;
    return m;
  },
  perspective(fovy: number, aspect: number, near: number, far: number): Mat4 {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    const m = new Float32Array(16);
    m[0] = f / aspect; m[5] = f; m[10] = (far + near) * nf; m[11] = -1; m[14] = 2 * far * near * nf;
    return m;
  },
  lookAt(eye: Vec3, target: Vec3, up: Vec3 = [0, 1, 0]): Mat4 {
    let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
    let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
    let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
    l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    const m = new Float32Array(16);
    m[0] = xx; m[1] = yx; m[2] = zx;
    m[4] = xy; m[5] = yy; m[6] = zy;
    m[8] = xz; m[9] = yz; m[10] = zz;
    m[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
    m[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
    m[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
    m[15] = 1;
    return m;
  },
  multiply(a: Mat4, b: Mat4): Mat4 {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  },
  translation(x: number, y: number, z: number): Mat4 {
    const m = m4.identity(); m[12] = x; m[13] = y; m[14] = z; return m;
  },
  scaling(x: number, y = x, z = x): Mat4 {
    const m = m4.identity(); m[0] = x; m[5] = y; m[10] = z; return m;
  },
  rotX(a: number): Mat4 {
    const m = m4.identity(), c = Math.cos(a), s = Math.sin(a);
    m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m;
  },
  rotY(a: number): Mat4 {
    const m = m4.identity(), c = Math.cos(a), s = Math.sin(a);
    m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m;
  },
  rotZ(a: number): Mat4 {
    const m = m4.identity(), c = Math.cos(a), s = Math.sin(a);
    m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m;
  },
  /** Multiply left to right: chain(A, B, C) = A·B·C */
  chain(...ms: Mat4[]): Mat4 {
    return ms.reduce((acc, m) => m4.multiply(acc, m));
  },
  apply(m: Mat4, v: Vec3): Vec3 {
    const [x, y, z] = v;
    const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1;
    return [
      (m[0] * x + m[4] * y + m[8] * z + m[12]) / w,
      (m[1] * x + m[5] * y + m[9] * z + m[13]) / w,
      (m[2] * x + m[6] * y + m[10] * z + m[14]) / w,
    ];
  },
};

export function hexToRgb(hex: string): Vec3 {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function program(gl: WebGLRenderingContext, vs: string, fs: string) {
  const p = gl.createProgram();
  if (!p) throw new Error("Could not create WebGL program");
  const attach = (type: number, src: string) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Could not create WebGL shader");
    try {
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "shader");
      gl.attachShader(p, shader);
    } finally {
      // Attached shaders stay available for linking until the program is deleted.
      gl.deleteShader(shader);
    }
  };
  try {
    attach(gl.VERTEX_SHADER, vs);
    attach(gl.FRAGMENT_SHADER, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
  } catch (error) {
    gl.deleteProgram(p);
    throw error;
  }
  const uniforms = new Map<string, WebGLUniformLocation | null>();
  return {
    p,
    use() { gl.useProgram(p); },
    u(name: string) {
      if (!uniforms.has(name)) uniforms.set(name, gl.getUniformLocation(p, name));
      return uniforms.get(name)!;
    },
    a(name: string) { return gl.getAttribLocation(p, name); },
  };
}
export type Program = ReturnType<typeof program>;

export type MeshData = { position: number[]; normal: number[]; index: number[] };
export type Mesh = { draw(prog: Program): void; count: number; destroy(): void };

export function upload(gl: WebGLRenderingContext, data: MeshData): Mesh {
  const buf = (arr: number[]) => {
    const b = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
    return b;
  };
  const pos = buf(data.position), nor = buf(data.normal);
  const idx = gl.createBuffer()!;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.index), gl.STATIC_DRAW);
  const count = data.index.length;
  return {
    count,
    destroy() {
      gl.deleteBuffer(pos);
      gl.deleteBuffer(nor);
      gl.deleteBuffer(idx);
    },
    draw(prog) {
      const bind = (b: WebGLBuffer, name: string) => {
        const loc = prog.a(name);
        if (loc < 0) return;
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
      };
      bind(pos, "aPos");
      bind(nor, "aNormal");
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx);
      gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
    },
  };
}

/** A box with rounded edges and smooth normals: a subdivided cube whose
 *  vertices are pulled onto the surface around an inner box. */
export function roundedBox(w: number, h: number, d: number, r: number, seg = 14): MeshData {
  const hx = w / 2, hy = h / 2, hz = d / 2;
  const ix = hx - r, iy = hy - r, iz = hz - r;
  const position: number[] = [], normal: number[] = [], index: number[] = [];
  const faces: [Vec3, Vec3, Vec3][] = [
    [[1, 0, 0], [0, 0, -1], [0, 1, 0]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 0, 0], [0, 0, -1]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
    [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
  ];
  const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
  for (const [n, u, v] of faces) {
    const base = position.length / 3;
    for (let j = 0; j <= seg; j++) for (let i = 0; i <= seg; i++) {
      // Distribute samples densely near the edges so the curve stays smooth.
      const ease = (t: number) => Math.sign(t) * Math.pow(Math.abs(t), 0.7);
      const a = ease(i / seg * 2 - 1), b = ease(j / seg * 2 - 1);
      const p: Vec3 = [
        (n[0] + u[0] * a + v[0] * b) * hx,
        (n[1] + u[1] * a + v[1] * b) * hy,
        (n[2] + u[2] * a + v[2] * b) * hz,
      ];
      const inner: Vec3 = [clamp(p[0], ix), clamp(p[1], iy), clamp(p[2], iz)];
      let nx = p[0] - inner[0], ny = p[1] - inner[1], nz = p[2] - inner[2];
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      position.push(inner[0] + nx * r, inner[1] + ny * r, inner[2] + nz * r);
      normal.push(nx, ny, nz);
    }
    for (let j = 0; j < seg; j++) for (let i = 0; i < seg; i++) {
      const a = base + j * (seg + 1) + i, b = a + 1, c = a + seg + 1, e = c + 1;
      index.push(a, b, e, a, e, c);
    }
  }
  return { position, normal, index };
}

export function torus(R: number, r: number, segR = 96, segr = 18): MeshData {
  const position: number[] = [], normal: number[] = [], index: number[] = [];
  for (let j = 0; j <= segR; j++) {
    const u = j / segR * Math.PI * 2, cu = Math.cos(u), su = Math.sin(u);
    for (let i = 0; i <= segr; i++) {
      const v = i / segr * Math.PI * 2, cv = Math.cos(v), sv = Math.sin(v);
      position.push((R + r * cv) * cu, (R + r * cv) * su, r * sv);
      normal.push(cv * cu, cv * su, sv);
    }
  }
  for (let j = 0; j < segR; j++) for (let i = 0; i < segr; i++) {
    const a = j * (segr + 1) + i, b = a + segr + 1;
    index.push(a, b, a + 1, b, b + 1, a + 1);
  }
  return { position, normal, index };
}

export function sphere(r: number, seg = 28): MeshData {
  const position: number[] = [], normal: number[] = [], index: number[] = [];
  for (let j = 0; j <= seg; j++) {
    const t = j / seg * Math.PI;
    for (let i = 0; i <= seg * 2; i++) {
      const p = i / (seg * 2) * Math.PI * 2;
      const x = Math.sin(t) * Math.cos(p), y = Math.cos(t), z = Math.sin(t) * Math.sin(p);
      position.push(x * r, y * r, z * r);
      normal.push(x, y, z);
    }
  }
  const row = seg * 2 + 1;
  for (let j = 0; j < seg; j++) for (let i = 0; i < seg * 2; i++) {
    const a = j * row + i, b = a + row;
    index.push(a, a + 1, b, b, a + 1, b + 1);
  }
  return { position, normal, index };
}

/** Shared matte "clay" shading: wrapped diffuse, sky/ground fill, soft specular and a rim. */
export const CLAY_VS = `
attribute vec3 aPos; attribute vec3 aNormal;
uniform mat4 uModel, uView, uProj;
varying vec3 vN; varying vec3 vW;
void main(){
  vec4 w = uModel * vec4(aPos,1.0);
  vW = w.xyz;
  vN = normalize(mat3(uModel) * aNormal);
  gl_Position = uProj * uView * w;
}`;

export const CLAY_FS = `
precision mediump float;
varying vec3 vN; varying vec3 vW;
uniform vec3 uColor, uSky, uGround, uRim, uEye;
uniform float uGloss, uAlpha;
void main(){
  vec3 n = normalize(vN);
  vec3 v = normalize(uEye - vW);
  vec3 l = normalize(vec3(-0.45, 0.85, 0.55));
  float wrap = clamp((dot(n,l) + 0.35) / 1.35, 0.0, 1.0);
  vec3 fill = mix(uGround, uSky, n.y * 0.5 + 0.5);
  vec3 col = uColor * (0.42 * fill + 0.72 * wrap);
  float spec = pow(max(dot(reflect(-l,n), v), 0.0), 28.0) * uGloss;
  float rim = pow(1.0 - max(dot(n,v),0.0), 3.0);
  col += spec + uRim * rim * 0.35;
  gl_FragColor = vec4(col, uAlpha);
}`;

export function createCanvasGL(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: false, powerPreference: "high-performance" });
  return gl;
}

export function disposeSceneGL(
  canvas: HTMLCanvasElement, gl: WebGLRenderingContext,
  programs: Program[], buffers: WebGLBuffer[], meshes: Mesh[] = [],
) {
  if (gl.isContextLost()) return;
  gl.useProgram(null);
  for (const program of programs) gl.deleteProgram(program.p);
  for (const buffer of buffers) gl.deleteBuffer(buffer);
  for (const mesh of meshes) mesh.destroy();

  if (!canvas.isConnected) {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return;
  }
  // Effect replay can reuse this canvas, including with a different renderer after a resize.
  const attributeCount = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
  for (let i = 0; i < attributeCount; i++) gl.disableVertexAttribArray(i);
  gl.disable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.SCISSOR_TEST);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

export function fitCanvas(canvas: HTMLCanvasElement, gl: WebGLRenderingContext, maxDpr = 2) {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w; canvas.height = h;
  }
  gl.viewport(0, 0, w, h);
  return { w, h, aspect: w / h };
}
