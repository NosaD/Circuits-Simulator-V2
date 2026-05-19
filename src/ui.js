import { MNASolver } from './solver.js';
import { Resistor, Capacitor, Inductor, VoltageSource, Diode } from './components.js';
import { draw, resize, canvas, ctx } from './draw.js';

window.components = [];
window.nodePositions = {};
window.nextId = 1;
window.addMode = null;
window.pendingNode = null;
window.selectedComp = null;
window.simResults = [];
window.editPanel = document.getElementById('edit-panel');
window.msgBar = document.getElementById('msg-bar');

window.startAdd = function(type) {
  addMode = type;
  pendingNode = null;
  msg(`Tap 2 spots for ${type}`, 'info');
}

window.runSim = function() {
  try {
    const solver = buildAndSolve('dc');
    displayResults(solver.V);
    msg('✓ Done', 'ok');
  } catch(e) {
    msg('Error: ' + e.message, 'err');
    console.error(e);
  }
}

window.clearCircuit = function() {
  components = [];
  nodePositions = {};
  nextId = 1;
  selectedComp = null;
  draw();
  msg('Cleared', 'info');
}

window.loadDemo = function() {
  nodePositions = { '0': {x: 100, y: 200}, '1': {x: 300, y: 200}, '2': {x: 500, y: 200} };
  components = [
    new VoltageSource(1, 1, 0, 5),
    new Resistor(1, 1, 2, 1000),
    new Capacitor(1, 2, 0, 1e-6)
  ];
  draw();
}

function buildAndSolve(mode, dt = 1e-6) {
  let nodeMap = {};
  let nIdx = 1;
  for (const c of components) {
    if (c.n1!== 0 && nodeMap[c.n1] === undefined) nodeMap[c.n1] = nIdx++;
    if (c.n2!== 0 && nodeMap[c.n2] === undefined) nodeMap[c.n2] = nIdx++;
  }
  let vsIdx = 0;
  for (const c of components) {
    if (c.type === 'VS') c.vsIdx = vsIdx++;
  }
  const solver = new MNASolver(nIdx - 1, vsIdx);
  for (const c of components) c.setInitialV([]);
  const V = solver.solve(components, mode, dt);
  solver.V = V;
  return solver;
}

function displayResults(V) {
  for (let i = 0; i < V.length; i++) {
    console.log(`Node ${i+1}: ${V[i].toFixed(3)}V`);
  }
}

window.msg = function(text, type='info') {
  msgBar.textContent = text;
  msgBar.className = type;
}

window.applyEdit = function() {}
window.deleteSelected = function() {}
window.closeEdit = function() { editPanel.style.display = 'none'; selectedComp = null; draw(); }

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (addMode) {
    // Simplified node placement
    const id = 'N' + Object.keys(nodePositions).length;
    nodePositions[id] = {x, y};
    if (!pendingNode) {
      pendingNode = id;
    } else {
      const c = new Resistor(nextId++, pendingNode, id, 1000);
      components.push(c);
      pendingNode = null;
      addMode = null;
      draw();
    }
  }
});

window.addEventListener('resize', resize);