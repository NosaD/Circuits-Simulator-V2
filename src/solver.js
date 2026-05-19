export function gaussElim(A, b) {
  const n = b.length;
  for (let col = 0; col < n; col++) {
    let pivRow = col, pivVal = Math.abs(A[col][col]);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(A[r][col]);
      if (v > pivVal) { pivVal = v; pivRow = r; }
    }
    if (pivRow!== col) {
      [A[col], A[pivRow]] = [A[pivRow], A[col]];
      [b[col], b[pivRow]] = [b[pivRow], b[col]];
    }
    if (Math.abs(A[col][col]) < 1e-14) throw new Error('Singular matrix. Floating node?');
    for (let r = col + 1; r < n; r++) {
      const f = A[r][col] / A[col][col];
      for (let k = col; k < n; k++) A[r][k] -= f * A[col][k];
      b[r] -= f * b[col];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j];
    x[i] = s / A[i][i];
  }
  return x;
}

export class MNASolver {
  constructor(nNodes, nVS) {
    this.nNodes = nNodes;
    this.nVS = nVS;
    this.size = nNodes + nVS;
  }
  solve(components, mode, dt) {
    const hasNonlinear = components.some(c => c.isNonlinear);
    if (!hasNonlinear) {
      const {A, b} = this._buildSystem(components, mode, dt);
      return gaussElim(A, b);
    }
    let V = new Array(this.size).fill(0);
    for (const c of components) if (c.updateOp) c.updateOp(V);
    for (let iter = 0; iter < 100; iter++) {
      const Vprev = [...V];
      const {A, b} = this._buildSystem(components, mode, dt);
      V = gaussElim(A, b);
      for (const c of components) if (c.updateOp) c.updateOp(V);
      let maxD = 0;
      for (let i = 0; i < this.nNodes; i++) maxD = Math.max(maxD, Math.abs(V[i] - Vprev[i]));
      if (maxD < 1e-9) return V;
    }
    throw new Error('Newton-Raphson did not converge');
  }
  _buildSystem(components, mode, dt) {
    const n = this.size;
    const A = Array.from({length: n}, () => new Array(n).fill(0));
    const b = new Array(n).fill(0);
    for (const c of components) {
      mode === 'dc'? c.stampDC(A, b, this.nNodes) : c.stampTran(A, b, this.nNodes, dt);
    }
    return {A, b};
  }
}

export function stampG(A, G, n1, n2) {
  if (n1 > 0) A[n1 - 1][n1 - 1] += G;
  if (n2 > 0) A[n2 - 1][n2 - 1] += G;
  if (n1 > 0 && n2 > 0) { A[n1 - 1][n2 - 1] -= G; A[n2 - 1][n1 - 1] -= G; }
}

export function stampI(b, I, nPlus, nMinus) {
  if (nPlus > 0) b[nPlus - 1] += I;
  if (nMinus > 0) b[nMinus - 1] -= I;
}