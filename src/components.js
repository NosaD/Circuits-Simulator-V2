import { stampG, stampI } from './solver.js';

export class Resistor {
  constructor(id, n1, n2, R) {
    this.id = id; this.n1 = n1; this.n2 = n2; this.R = R;
    this.type = 'R'; this.isNonlinear = false;
    this.displayOffX = 0; this.displayOffY = 0;
  }
  get G() { return 1 / this.R; }
  stampDC(A, b, nN) { stampG(A, this.G, this.n1, this.n2); }
  stampTran(A, b, nN, dt) { stampG(A, this.G, this.n1, this.n2); }
  updateState(V) {}
  setInitialV(V) {}
}

export class Capacitor {
  constructor(id, n1, n2, C) {
    this.id = id; this.n1 = n1; this.n2 = n2; this.C = C;
    this.type = 'C'; this.isNonlinear = false;
    this.Vold = 0; this.Iold = 0; this._dt = 1e-6;
    this.displayOffX = 0; this.displayOffY = 0;
  }
  setInitialV(V) {
    const v1 = this.n1 > 0? (V[this.n1 - 1]?? 0) : 0;
    const v2 = this.n2 > 0? (V[this.n2 - 1]?? 0) : 0;
    this.Vold = v1 - v2; this.Iold = 0;
  }
  stampDC(A, b, nN) {}
  stampTran(A, b, nN, dt) {
    this._dt = dt;
    const Geq = 2 * this.C / dt;
    const Ieq = Geq * this.Vold + this.Iold;
    stampG(A, Geq, this.n1, this.n2);
    stampI(b, Ieq, this.n1, this.n2);
  }
  updateState(V) {
    const v1 = this.n1 > 0? V[this.n1 - 1] : 0;
    const v2 = this.n2 > 0? V[this.n2 - 1] : 0;
    const Vnew = v1 - v2;
    const Geq = 2 * this.C / this._dt;
    this.Iold = Geq * Vnew - (Geq * this.Vold + this.Iold);
    this.Vold = Vnew;
  }
}

export class Inductor {
  constructor(id, n1, n2, L) {
    this.id = id; this.n1 = n1; this.n2 = n2; this.L = L;
    this.type = 'L'; this.isNonlinear = false;
    this.Iold = 0; this._dt = 1e-6;
    this.displayOffX = 0; this.displayOffY = 0;
  }
  setInitialV(V) { this.Iold = 0; }
  stampDC(A, b, nN) { stampG(A, 1e-9, this.n1, this.n2); }
  stampTran(A, b, nN, dt) {
    this._dt = dt;
    const Geq = dt / (2 * this.L);
    const Ieq = Geq * (2 * this.L / dt * this.Iold - this.Iold);
    stampG(A, Geq, this.n1, this.n2);
    stampI(b, Ieq, this.n1, this.n2);
  }
  updateState(V) {
    const v1 = this.n1 > 0? V[this.n1 - 1] : 0;
    const v2 = this.n2 > 0? V[this.n2 - 1] : 0;
    const Vnew = v1 - v2;
    this.Iold += (Vnew * this._dt) / this.L;
  }
}

export class VoltageSource {
  constructor(id, n1, n2, V) {
    this.id = id; this.n1 = n1; this.n2 = n2; this.V = V;
    this.type = 'VS'; this.isNonlinear = false;
    this.vsIdx = -1;
    this.displayOffX = 0; this.displayOffY = 0;
  }
  stampDC(A, b, nN) {
    const idx = nN + this.vsIdx;
    if (this.n1 > 0) { A[this.n1 - 1][idx] += 1; A[idx][this.n1 - 1] += 1; }
    if (this.n2 > 0) { A[this.n2 - 1][idx] -= 1; A[idx][this.n2 - 1] -= 1; }
    b[idx] += this.V;
  }
  stampTran(A, b, nN, dt) { this.stampDC(A, b, nN); }
}

export class Diode {
  constructor(id, n1, n2, Is = 1e-12, Vt = 0.0258) {
    this.id = id; this.n1 = n1; this.n2 = n2;
    this.Is = Is; this.Vt = Vt; this.type = 'D';
    this.isNonlinear = true; this.Vd = 0.7;
    this.displayOffX = 0; this.displayOffY = 0;
  }
  stampDC(A, b, nN) { this._stamp(A, b); }
  stampTran(A, b, nN, dt) { this._stamp(A, b); }
  _stamp(A, b) {
    const Gd = this.Is * Math.exp(this.Vd / this.Vt) / this.Vt;
    const Id = Gd * this.Vd - this.Is * (Math.exp(this.Vd / this.Vt) - 1);
    stampG(A, Gd, this.n1, this.n2);
    stampI(b, Id, this.n1, this.n2);
  }
  updateOp(V) {
    const v1 = this.n1 > 0? V[this.n1 - 1] : 0;
    const v2 = this.n2 > 0? V[this.n2 - 1] : 0;
    this.Vd = Math.max(0.001, v1 - v2);
  }
}