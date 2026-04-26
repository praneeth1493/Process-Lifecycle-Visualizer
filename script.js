/**
 * Process Lifecycle Visualization Tool
 * CPU Scheduling & Context Switching Simulator
 * Algorithms: FCFS, Round Robin
 */

// =============================================
// STATE & DATA
// =============================================

const STATES = { NEW: 'new', READY: 'ready', RUNNING: 'running', WAITING: 'waiting', TERMINATED: 'terminated' };
const COLORS = ['proc-color-0','proc-color-1','proc-color-2','proc-color-3','proc-color-4','proc-color-5','proc-color-6','proc-color-7'];
const GANTT_COLORS = [
  ['#7C3AED','#4F8EF7'], ['#0891b2','#06b6d4'], ['#16a34a','#22c55e'],
  ['#b45309','#f59e0b'], ['#be185d','#ec4899'], ['#7e22ce','#a855f7'],
  ['#0f766e','#14b8a6'], ['#b91c1c','#ef4444']
];

let processes = [];
let processIdCounter = 1;
let simulationTimer = null;
let isRunning = false;
let isPaused = false;
let clockTick = 0;
let contextSwitches = 0;
let cpuBusyTicks = 0;
let currentAlgo = 'fcfs';
let timeQuantum = 3;
let ctxDelay = 1;
let simSpeed = 2;
let currentProcess = null;
let rrQuantumCounter = 0;
let ctxSwitchRemaining = 0;
let isContextSwitching = false;
let ganttBlocks = [];
let lastGanttPID = null;

// =============================================
// DOM REFERENCES
// =============================================
const $ = id => document.getElementById(id);

const dom = {
  systemClock: $('systemClock'),
  cpuBadge: $('cpuBadge'),
  cpuBadgeText: $('cpuBadgeText'),
  pcbTableBody: $('pcbTableBody'),
  countNew: $('countNew'),
  countReady: $('countReady'),
  countRunning: $('countRunning'),
  countWaiting: $('countWaiting'),
  countTerminated: $('countTerminated'),
  stateNew: $('stateNew'),
  stateReady: $('stateReady'),
  stateRunning: $('stateRunning'),
  stateWaiting: $('stateWaiting'),
  stateTerminated: $('stateTerminated'),
  cpuProcessName: $('cpuProcessName'),
  cpuRingFill: $('cpuRingFill'),
  cpuRemaining: $('cpuRemaining'),
  cpuChip: $('cpuChip'),
  ctxIndicator: $('ctxIndicator'),
  ctxBarFill: $('ctxBarFill'),
  cpuUtil: $('cpuUtil'),
  cpuUtilBar: $('cpuUtilBar'),
  ctxSwitchCount: $('ctxSwitchCount'),
  throughput: $('throughput'),
  readyQueue: $('readyQueue'),
  waitQueue: $('waitQueue'),
  readyQueueCount: $('readyQueueCount'),
  waitQueueCount: $('waitQueueCount'),
  ganttChart: $('ganttChart'),
  ganttTimeline: $('ganttTimeline'),
  eventLog: $('eventLog'),
  statAvgWait: $('statAvgWait'),
  statAvgTurnaround: $('statAvgTurnaround'),
  statCompleted: $('statCompleted'),
  statCPUUtil: $('statCPUUtil'),
  statCtxSwitches: $('statCtxSwitches'),
  statTotalTime: $('statTotalTime'),
  algoLabel: $('algoLabel'),
  preemptArrow: $('preemptArrow'),
  ctxOverlay: $('ctxOverlay'),
  ctxProcOut: $('ctxProcOut'),
  ctxProcIn: $('ctxProcIn'),
  ctxSavingProc: $('ctxSavingProc'),
  ctxLoadingProc: $('ctxLoadingProc'),
  startBtn: $('startBtn'),
  pauseBtn: $('pauseBtn'),
  stepBtn: $('stepBtn'),
  resetBtn: $('resetBtn'),
  addProcessBtn: $('addProcessBtn'),
  clearLogBtn: $('clearLogBtn'),
  clearGanttBtn: $('clearGanttBtn'),
  timeQuantum: $('timeQuantum'),
  quantumVal: $('quantumVal'),
  ctxDelay: $('ctxDelay'),
  ctxDelayVal: $('ctxDelayVal'),
  simSpeed: $('simSpeed'),
  simSpeedVal: $('simSpeedVal'),
  quantumSection: $('quantumSection'),
  autoScrollLog: $('autoScrollLog'),
  inPID: $('inPID'),
  inArrival: $('inArrival'),
  inBurst: $('inBurst'),
  inIO: $('inIO'),
  btnFCFS: $('btnFCFS'),
  btnRR: $('btnRR'),
};

// =============================================
// PROCESS CLASS
// =============================================
class Process {
  constructor(pid, arrival, burst, ioBurst = 0) {
    this.pid = pid;
    this.arrival = parseInt(arrival) || 0;
    this.burst = parseInt(burst) || 1;
    this.remaining = parseInt(burst) || 1;
    this.ioBurst = parseInt(ioBurst) || 0;
    this.ioRemaining = 0;
    this.state = STATES.NEW;
    this.waitTime = 0;
    this.completionTime = null;
    this.turnaround = null;
    this.startTime = null;
    this.colorIdx = (processIdCounter - 1) % COLORS.length;
    this.rrUsed = 0;
    this.hasHadIO = false;
    this.ioCount = 0;
  }
}

// =============================================
// PARTICLE SYSTEM
// =============================================
function initParticles() {
  const field = $('particleField');
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 3 + 1;
    p.style.cssText = `
      width:${size}px;height:${size}px;
      left:${Math.random()*100}%;
      animation-duration:${Math.random()*20+15}s;
      animation-delay:${Math.random()*-20}s;
      background:rgba(${Math.random()>0.5?'124,58,237':'79,142,247'},${Math.random()*0.4+0.2});
    `;
    field.appendChild(p);
  }
}

// =============================================
// SVG GRADIENT INJECTION
// =============================================
function injectSVGGradients() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.style.position = 'absolute';
  svg.style.width = '0';
  svg.style.height = '0';
  svg.innerHTML = `
    <defs>
      <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#7C3AED"/>
        <stop offset="100%" stop-color="#4F8EF7"/>
      </linearGradient>
    </defs>
  `;
  document.body.prepend(svg);
}

// =============================================
// LOGGING
// =============================================
function log(msg, type = 'info') {
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.innerHTML = `
    <span class="log-time">T=${clockTick}</span>
    <span class="log-msg">${msg}</span>
  `;
  dom.eventLog.appendChild(entry);
  if (dom.autoScrollLog.checked) {
    dom.eventLog.scrollTop = dom.eventLog.scrollHeight;
  }
  // Keep max 200 entries
  const entries = dom.eventLog.querySelectorAll('.log-entry');
  if (entries.length > 200) entries[0].remove();
}

// =============================================
// PROCESS MANAGEMENT
// =============================================
function addProcess(pid, arrival, burst, ioBurst) {
  if (!pid) pid = `P${processIdCounter}`;
  
  // Check for duplicate PID
  if (processes.find(p => p.pid === pid)) {
    pid = `P${processIdCounter}`;
  }

  const proc = new Process(pid, arrival, burst, ioBurst);
  proc.colorIdx = (processes.length) % COLORS.length;
  processes.push(proc);
  processIdCounter++;
  
  log(`Process <strong>${proc.pid}</strong> created → NEW (Burst: ${proc.burst}, Arrival: ${proc.arrival}${proc.ioBurst > 0 ? ', I/O: ' + proc.ioBurst : ''})`, 'info');
  updatePCBTable();
  updateStateDiagram();
  updateQueues();
}

function removeProcess(pid) {
  if (isRunning) return;
  processes = processes.filter(p => p.pid !== pid);
  log(`Process ${pid} removed.`, 'warn');
  updatePCBTable();
  updateStateDiagram();
}

function updatePCBTable() {
  if (processes.length === 0) {
    dom.pcbTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="10">
          <div class="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p>No processes added yet. Add processes using the panel on the left.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  dom.pcbTableBody.innerHTML = processes.map(p => `
    <tr class="${p.state === STATES.RUNNING ? 'row-running' : ''} ${p.state === STATES.TERMINATED ? 'row-terminated' : ''}">
      <td class="pid-cell">${p.pid}</td>
      <td><span class="state-badge badge-${p.state}">${p.state.toUpperCase()}</span></td>
      <td class="mono-cell">${p.arrival}</td>
      <td class="mono-cell">${p.burst}</td>
      <td class="mono-cell">${p.state === STATES.TERMINATED ? '0' : p.remaining}</td>
      <td class="mono-cell">${p.ioBurst > 0 ? p.ioBurst : '--'}</td>
      <td class="mono-cell">${p.waitTime}</td>
      <td class="mono-cell">${p.turnaround !== null ? p.turnaround : '--'}</td>
      <td class="mono-cell">${p.completionTime !== null ? p.completionTime : '--'}</td>
      <td>${!isRunning ? `<button class="delete-btn" onclick="removeProcess('${p.pid}')">✕</button>` : ''}</td>
    </tr>
  `).join('');
}

// =============================================
// STATE DIAGRAM
// =============================================
function updateStateDiagram() {
  const counts = { new: 0, ready: 0, running: 0, waiting: 0, terminated: 0 };
  processes.forEach(p => counts[p.state]++);

  dom.countNew.textContent = counts.new;
  dom.countReady.textContent = counts.ready;
  dom.countRunning.textContent = counts.running;
  dom.countWaiting.textContent = counts.waiting;
  dom.countTerminated.textContent = counts.terminated;

  // Pulse active nodes
  [dom.stateNew, dom.stateReady, dom.stateRunning, dom.stateWaiting, dom.stateTerminated].forEach(n => {
    n.classList.remove('active-node');
  });

  if (counts.running > 0) dom.stateRunning.classList.add('active-node');
  if (counts.waiting > 0) dom.stateWaiting.classList.add('active-node');
  if (counts.ready > 0) dom.stateReady.classList.add('active-node');
}

// =============================================
// QUEUES DISPLAY
// =============================================
function updateQueues() {
  const ready = processes.filter(p => p.state === STATES.READY);
  const waiting = processes.filter(p => p.state === STATES.WAITING);

  dom.readyQueueCount.textContent = ready.length;
  dom.waitQueueCount.textContent = waiting.length;

  if (ready.length === 0) {
    dom.readyQueue.innerHTML = '<div class="queue-empty">Empty</div>';
  } else {
    dom.readyQueue.innerHTML = ready.map((p, i) => `
      <div class="queue-item ready-item">
        <span class="queue-order">#${i+1}</span>
        ${p.pid}
        <span style="font-size:9px;opacity:0.6">[${p.remaining}t]</span>
      </div>
    `).join('');
  }

  if (waiting.length === 0) {
    dom.waitQueue.innerHTML = '<div class="queue-empty">Empty</div>';
  } else {
    dom.waitQueue.innerHTML = waiting.map((p, i) => `
      <div class="queue-item wait-item">
        <span class="queue-order">#${i+1}</span>
        ${p.pid}
        <span style="font-size:9px;opacity:0.6">[I/O:${p.ioRemaining}t]</span>
      </div>
    `).join('');
  }
}

// =============================================
// CPU DISPLAY
// =============================================
function updateCPUDisplay(proc) {
  if (!proc) {
    dom.cpuProcessName.textContent = 'IDLE';
    dom.cpuRemaining.textContent = '--';
    dom.cpuRingFill.style.strokeDashoffset = 238.76;
    dom.cpuChip.style.boxShadow = 'none';
    dom.cpuBadge.className = 'cpu-badge';
    dom.cpuBadgeText.textContent = 'CPU IDLE';
    return;
  }

  dom.cpuProcessName.textContent = proc.pid;
  dom.cpuRemaining.textContent = `${proc.remaining}t left`;

  const progress = 1 - (proc.remaining / proc.burst);
  const circumference = 238.76;
  dom.cpuRingFill.style.strokeDashoffset = circumference * (1 - progress);

  const colors = GANTT_COLORS[proc.colorIdx];
  dom.cpuChip.style.boxShadow = `0 0 30px ${colors[0]}60, 0 0 60px ${colors[0]}20`;
  dom.cpuProcessName.style.color = colors[0];

  dom.cpuBadge.className = 'cpu-badge running';
  dom.cpuBadgeText.textContent = `RUNNING ${proc.pid}`;
}

function updateCPUStats() {
  const util = clockTick > 0 ? Math.round((cpuBusyTicks / clockTick) * 100) : 0;
  const completed = processes.filter(p => p.state === STATES.TERMINATED).length;
  const throughput = clockTick > 0 ? (completed / clockTick).toFixed(3) : '0.000';

  dom.cpuUtil.textContent = `${util}%`;
  dom.cpuUtilBar.style.width = `${util}%`;
  dom.ctxSwitchCount.textContent = contextSwitches;
  dom.throughput.textContent = `${throughput}/t`;

  // Stats panel
  dom.statCPUUtil.textContent = `${util}%`;
  dom.statCtxSwitches.textContent = contextSwitches;
  dom.statCompleted.textContent = completed;
  dom.statTotalTime.textContent = `${clockTick}t`;

  const terminatedProcs = processes.filter(p => p.state === STATES.TERMINATED && p.turnaround !== null);
  if (terminatedProcs.length > 0) {
    const avgWait = (terminatedProcs.reduce((s, p) => s + p.waitTime, 0) / terminatedProcs.length).toFixed(2);
    const avgTurnaround = (terminatedProcs.reduce((s, p) => s + p.turnaround, 0) / terminatedProcs.length).toFixed(2);
    dom.statAvgWait.textContent = `${avgWait}t`;
    dom.statAvgTurnaround.textContent = `${avgTurnaround}t`;
  }
}

// =============================================
// GANTT CHART
// =============================================
function addGanttBlock(pid, type = 'cpu', ticks = 1, colorIdx = 0) {
  const ganttEmpty = dom.ganttChart.querySelector('.gantt-empty');
  if (ganttEmpty) ganttEmpty.remove();

  const colors = GANTT_COLORS[colorIdx % GANTT_COLORS.length];
  const block = document.createElement('div');
  block.className = `gantt-block ${type}-block`;

  if (type === 'ctx') {
    block.innerHTML = `
      <div class="gantt-block-label">⚡</div>
      <div class="gantt-block-sub">CTX</div>
    `;
    block.style.width = `${Math.max(28, ticks * 36)}px`;
  } else if (type === 'idle') {
    block.innerHTML = `
      <div class="gantt-block-label">——</div>
      <div class="gantt-block-sub">IDLE</div>
    `;
    block.style.width = `${Math.max(28, ticks * 36)}px`;
  } else if (type === 'io') {
    block.innerHTML = `
      <div class="gantt-block-label">I/O</div>
      <div class="gantt-block-sub">${pid}</div>
    `;
    block.style.width = `${Math.max(28, ticks * 36)}px`;
  } else {
    const bg = document.createElement('div');
    bg.className = 'gantt-block-bg';
    bg.style.background = `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
    block.appendChild(bg);
    block.innerHTML += `
      <div class="gantt-block-label">${pid}</div>
      <div class="gantt-block-sub">${ticks}t</div>
    `;
    block.style.width = `${Math.max(36, ticks * 36)}px`;
  }

  block.title = `${pid} | T=${clockTick - ticks} to T=${clockTick}`;
  dom.ganttChart.appendChild(block);
  dom.ganttChart.scrollLeft = dom.ganttChart.scrollWidth;

  // Timeline tick
  const tick = document.createElement('div');
  tick.className = 'gantt-tick';
  tick.textContent = String(clockTick - ticks);
  tick.style.minWidth = `${Math.max(36, ticks * 36)}px`;
  dom.ganttTimeline.appendChild(tick);
  dom.ganttTimeline.scrollLeft = dom.ganttTimeline.scrollWidth;

  ganttBlocks.push({ pid, type, start: clockTick - ticks, end: clockTick });
}

// =============================================
// SCHEDULING ALGORITHMS
// =============================================

/** FCFS: Select process with earliest arrival time that's ready */
function scheduleFCFS() {
  const ready = processes.filter(p => p.state === STATES.READY);
  if (ready.length === 0) return null;
  ready.sort((a, b) => a.arrival - b.arrival || a.pid.localeCompare(b.pid));
  return ready[0];
}

/** Round Robin: Time quantum based */
function scheduleRR() {
  const ready = processes.filter(p => p.state === STATES.READY);
  if (ready.length === 0) return null;
  // FIFO order within ready queue (by arrival, then PID order)
  ready.sort((a, b) => a.arrival - b.arrival || a.pid.localeCompare(b.pid));
  return ready[0];
}

function selectNextProcess() {
  if (currentAlgo === 'fcfs') return scheduleFCFS();
  if (currentAlgo === 'rr') return scheduleRR();
  return scheduleFCFS();
}

// =============================================
// SIMULATION TICK
// =============================================
function simulationTick() {

  // 1. Admit NEW processes that have arrived
  let admitted = [];
  processes.forEach(p => {
    if (p.state === STATES.NEW && p.arrival <= clockTick) {
      p.state = STATES.READY;
      admitted.push(p.pid);
    }
  });
  if (admitted.length > 0) {
    log(`Process(es) <strong>${admitted.join(', ')}</strong> admitted to Ready Queue`, 'info');
  }

  // 2. Advance I/O processes
  let ioCompleted = [];
  processes.forEach(p => {
    if (p.state === STATES.WAITING) {
      p.ioRemaining--;
      if (p.ioRemaining <= 0) {
        p.state = STATES.READY;
        ioCompleted.push(p.pid);
      }
    }
  });
  if (ioCompleted.length > 0) {
    log(`I/O complete for <strong>${ioCompleted.join(', ')}</strong> → Back to Ready Queue`, 'success');
  }

  // 3. Context Switching
  if (isContextSwitching) {
    ctxSwitchRemaining--;
    const progress = 1 - (ctxSwitchRemaining / ctxDelay);
    dom.ctxBarFill.style.width = `${progress * 100}%`;

    if (ctxSwitchRemaining <= 0) {
      isContextSwitching = false;
      dom.ctxIndicator.classList.remove('active');
      dom.ctxOverlay.classList.remove('visible');
      dom.cpuBadge.className = 'cpu-badge';
      dom.cpuBadgeText.textContent = 'CPU IDLE';
    }

    clockTick++;
    dom.systemClock.textContent = `T = ${clockTick}`;
    updatePCBTable();
    updateStateDiagram();
    updateQueues();
    updateCPUStats();
    
    // Add ready procs wait time
    processes.forEach(p => { if (p.state === STATES.READY) p.waitTime++; });
    return;
  }

  // 4. Run current process
  if (currentProcess && currentProcess.state === STATES.RUNNING) {
    currentProcess.remaining--;
    cpuBusyTicks++;
    rrQuantumCounter++;

    // Check for I/O burst (halfway through burst, if ioBurst configured)
    const midPoint = Math.ceil(currentProcess.burst / 2);
    if (currentProcess.ioBurst > 0 && !currentProcess.hasHadIO &&
        (currentProcess.burst - currentProcess.remaining) >= midPoint) {
      currentProcess.hasHadIO = true;

      // Save context: move to waiting
      const outProc = currentProcess;
      currentProcess = null;
      outProc.state = STATES.WAITING;
      outProc.ioRemaining = outProc.ioBurst;
      log(`<strong>${outProc.pid}</strong> issued I/O request → WAITING (I/O: ${outProc.ioRemaining} ticks)`, 'warn');

      addGanttBlock(outProc.pid, 'io', 1, outProc.colorIdx);
      triggerContextSwitch(outProc.pid, '...');

    } else if (currentProcess && currentProcess.remaining <= 0) {
      // Process completed
      const finishedProc = currentProcess;
      finishedProc.state = STATES.TERMINATED;
      finishedProc.completionTime = clockTick + 1;
      finishedProc.turnaround = finishedProc.completionTime - finishedProc.arrival;
      currentProcess = null;
      log(`<strong>${finishedProc.pid}</strong> → TERMINATED ✓ (TAT: ${finishedProc.turnaround}, Wait: ${finishedProc.waitTime})`, 'success');
      addGanttBlock(finishedProc.pid, 'cpu', 1, finishedProc.colorIdx);
      lastGanttPID = finishedProc.pid;

    } else if (currentProcess) {
      addGanttBlock(currentProcess.pid, 'cpu', 1, currentProcess.colorIdx);
      // Round Robin preemption
      if (currentAlgo === 'rr' && rrQuantumCounter >= timeQuantum) {
        const hadProc = currentProcess;
        currentProcess = null;
        hadProc.state = STATES.READY;
        rrQuantumCounter = 0;
        log(`<strong>${hadProc.pid}</strong> preempted (RR quantum exhausted) → Ready Queue`, 'warn');

        // Trigger context switch if there are other ready processes
        const nextCandidate = selectNextProcess();
        if (nextCandidate) {
          triggerContextSwitch(hadProc.pid, nextCandidate.pid);
        }
      }
    }
  }

  // 5. Dispatch a new process if CPU is free
  if (!currentProcess && !isContextSwitching) {
    const next = selectNextProcess();
    if (next) {
      const prev = lastGanttPID;

      if (prev && prev !== next.pid && ctxDelay > 0) {
        triggerContextSwitch(prev, next.pid);
        // Process will be dispatched automatically once context switch completes (isContextSwitching = false)
      } else {
        dispatchProcess(next);
      }
    } else {
      // CPU idle
      const hasUnterminated = processes.some(p => p.state !== STATES.TERMINATED);
      if (hasUnterminated) {
        addGanttBlock('IDLE', 'idle', 1, 0);
        if (dom.cpuBadge.className !== 'cpu-badge') {
          dom.cpuBadge.className = 'cpu-badge';
          dom.cpuBadgeText.textContent = 'CPU IDLE';
        }
        updateCPUDisplay(null);
      }
    }
  }

  // 6. Add wait time to ready procs
  processes.forEach(p => { if (p.state === STATES.READY) p.waitTime++; });

  // 7. Advance clock
  clockTick++;
  dom.systemClock.textContent = `T = ${clockTick}`;
  updatePCBTable();
  updateStateDiagram();
  updateQueues();
  updateCPUStats();

  // 8. Check completion
  const allDone = processes.every(p => p.state === STATES.TERMINATED);
  if (allDone && processes.length > 0) {
    stopSimulation(true);
    return;
  }
}

function dispatchProcess(proc) {
  if (!proc || proc.state !== STATES.READY) return;
  
  currentProcess = proc;
  proc.state = STATES.RUNNING;
  rrQuantumCounter = 0;
  lastGanttPID = proc.pid;

  if (proc.startTime === null) proc.startTime = clockTick;

  log(`<strong>${proc.pid}</strong> dispatched → RUNNING (Remaining: ${proc.remaining}t)`, 'success');
  updateCPUDisplay(proc);

  dom.cpuBadge.className = 'cpu-badge running';
  dom.cpuBadgeText.textContent = `RUNNING ${proc.pid}`;
}

function triggerContextSwitch(outPID, inPID) {
  if (ctxDelay === 0) return;

  isContextSwitching = true;
  ctxSwitchRemaining = ctxDelay;
  contextSwitches++;

  dom.ctxIndicator.classList.add('active');
  dom.ctxBarFill.style.width = '0%';

  dom.cpuBadge.className = 'cpu-badge switching';
  dom.cpuBadgeText.textContent = 'CONTEXT SWITCH';

  dom.ctxProcOut.textContent = outPID;
  dom.ctxProcIn.textContent = inPID;
  dom.ctxSavingProc.textContent = outPID;
  dom.ctxLoadingProc.textContent = inPID;

  if (inPID !== '...') {
    dom.ctxOverlay.classList.add('visible');
    setTimeout(() => dom.ctxOverlay.classList.remove('visible'), Math.max(400, ctxDelay * 200));
  }

  addGanttBlock('CTX', 'ctx', ctxDelay, 0);
  log(`⚡ Context Switch: Saving <strong>${outPID}</strong> → Loading <strong>${inPID}</strong> (${ctxDelay} tick delay)`, 'ctx');
}

// =============================================
// CONTROL
// =============================================
function startSimulation() {
  if (processes.length === 0) {
    log('⚠ No processes to simulate. Add at least one process.', 'error');
    return;
  }

  isRunning = true;
  isPaused = false;

  dom.startBtn.disabled = true;
  dom.pauseBtn.disabled = false;
  dom.addProcessBtn.disabled = true;

  // Reset runtimes
  currentProcess = null;
  clockTick = 0;
  cpuBusyTicks = 0;
  contextSwitches = 0;
  rrQuantumCounter = 0;
  isContextSwitching = false;
  lastGanttPID = null;

  // Reset process runtime state (keep config)
  processes.forEach(p => {
    p.state = STATES.NEW;
    p.remaining = p.burst;
    p.ioRemaining = 0;
    p.waitTime = 0;
    p.completionTime = null;
    p.turnaround = null;
    p.startTime = null;
    p.hasHadIO = false;
    p.rrUsed = 0;
  });

  // Clear Gantt
  clearGantt();

  dom.algoLabel.textContent = currentAlgo === 'fcfs' ? 'FCFS' : `Round Robin (Q=${timeQuantum})`;
  dom.systemClock.textContent = `T = 0`;

  log(`▶ Simulation started with <strong>${currentAlgo.toUpperCase()}</strong> algorithm | ${processes.length} processes`, 'success');

  const intervalMs = Math.max(100, 1500 / simSpeed);
  simulationTimer = setInterval(simulationTick, intervalMs);
}

function pauseSimulation() {
  if (!isRunning) return;
  if (!isPaused) {
    clearInterval(simulationTimer);
    isPaused = true;
    dom.pauseBtn.textContent = '▶ Resume';
    log('⏸ Simulation paused.', 'warn');
  } else {
    isPaused = false;
    const intervalMs = Math.max(100, 1500 / simSpeed);
    simulationTimer = setInterval(simulationTick, intervalMs);
    dom.pauseBtn.textContent = '⏸ Pause';
    dom.pauseBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
    log('▶ Simulation resumed.', 'success');
  }
}

function stepSimulation() {
  if (isRunning && !isPaused) return;

  if (processes.length === 0) {
    log('⚠ No processes to step. Add at least one process.', 'error');
    return;
  }

  if (!isRunning) {
    // Initialize without auto-running
    isRunning = true;
    isPaused = true;
    dom.startBtn.disabled = true;
    dom.pauseBtn.disabled = true;
    dom.addProcessBtn.disabled = true;

    currentProcess = null;
    clockTick = 0;
    cpuBusyTicks = 0;
    contextSwitches = 0;
    rrQuantumCounter = 0;
    isContextSwitching = false;
    lastGanttPID = null;

    processes.forEach(p => {
      p.state = STATES.NEW;
      p.remaining = p.burst;
      p.ioRemaining = 0;
      p.waitTime = 0;
      p.completionTime = null;
      p.turnaround = null;
      p.startTime = null;
      p.hasHadIO = false;
      p.rrUsed = 0;
    });

    clearGantt();
    dom.algoLabel.textContent = currentAlgo === 'fcfs' ? 'FCFS' : `Round Robin (Q=${timeQuantum})`;
    log('👣 Step mode activated. Click Step to advance tick-by-tick.', 'info');
  }

  simulationTick();
}

function stopSimulation(completed = false) {
  clearInterval(simulationTimer);
  isRunning = false;
  isPaused = false;

  dom.startBtn.disabled = false;
  dom.pauseBtn.disabled = true;
  dom.pauseBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
  dom.addProcessBtn.disabled = false;

  dom.cpuBadge.className = 'cpu-badge';
  dom.cpuBadgeText.textContent = 'CPU IDLE';
  updateCPUDisplay(null);

  if (completed) {
    log(`✅ All processes completed at T=${clockTick}. Simulation finished!`, 'success');
    updateCPUStats();
    
    // Add final gantt tick
    const tick = document.createElement('div');
    tick.className = 'gantt-tick';
    tick.textContent = String(clockTick);
    tick.style.minWidth = '36px';
    dom.ganttTimeline.appendChild(tick);
  } else {
    log('🛑 Simulation stopped by user.', 'warn');
  }
}

function resetSimulation() {
  stopSimulation(false);
  processes = [];
  processIdCounter = 1;
  clockTick = 0;
  cpuBusyTicks = 0;
  contextSwitches = 0;
  currentProcess = null;
  rrQuantumCounter = 0;
  isContextSwitching = false;
  lastGanttPID = null;

  dom.systemClock.textContent = 'T = 0';
  dom.cpuProcessName.textContent = 'IDLE';
  dom.cpuRemaining.textContent = '--';
  dom.cpuRingFill.style.strokeDashoffset = 238.76;
  dom.cpuChip.style.boxShadow = 'none';
  dom.cpuUtil.textContent = '0%';
  dom.cpuUtilBar.style.width = '0%';
  dom.ctxSwitchCount.textContent = '0';
  dom.throughput.textContent = '0/t';
  dom.statAvgWait.textContent = '--';
  dom.statAvgTurnaround.textContent = '--';
  dom.statCompleted.textContent = '0';
  dom.statCPUUtil.textContent = '0%';
  dom.statCtxSwitches.textContent = '0';
  dom.statTotalTime.textContent = '0t';

  clearGantt();
  updatePCBTable();
  updateStateDiagram();
  updateQueues();

  dom.eventLog.innerHTML = `
    <div class="log-entry log-info">
      <span class="log-time">T=0</span>
      <span class="log-msg">System reset. Ready for new simulation.</span>
    </div>
  `;
}

function clearGantt() {
  dom.ganttChart.innerHTML = '<div class="gantt-empty">Simulation not started. Add processes and click Start.</div>';
  dom.ganttTimeline.innerHTML = '';
  ganttBlocks = [];
}

// =============================================
// QUICK SCENARIOS
// =============================================
function loadScenario(type) {
  if (isRunning) return;
  resetSimulation();

  if (type === 'basic') {
    [
      { pid: 'P1', arrival: 0, burst: 8, io: 0 },
      { pid: 'P2', arrival: 1, burst: 4, io: 0 },
      { pid: 'P3', arrival: 2, burst: 9, io: 0 },
      { pid: 'P4', arrival: 3, burst: 5, io: 0 },
      { pid: 'P5', arrival: 4, burst: 6, io: 0 },
    ].forEach(p => addProcess(p.pid, p.arrival, p.burst, p.io));
    log('📋 Loaded: Basic 5-process scenario', 'info');

  } else if (type === 'io') {
    [
      { pid: 'P1', arrival: 0, burst: 6, io: 3 },
      { pid: 'P2', arrival: 1, burst: 8, io: 2 },
      { pid: 'P3', arrival: 2, burst: 4, io: 4 },
    ].forEach(p => addProcess(p.pid, p.arrival, p.burst, p.io));
    log('📋 Loaded: I/O Intensive scenario', 'info');

  } else if (type === 'burst') {
    [
      { pid: 'P1', arrival: 0, burst: 15, io: 0 },
      { pid: 'P2', arrival: 0, burst: 3, io: 0 },
      { pid: 'P3', arrival: 2, burst: 12, io: 0 },
      { pid: 'P4', arrival: 3, burst: 7, io: 0 },
    ].forEach(p => addProcess(p.pid, p.arrival, p.burst, p.io));
    log('📋 Loaded: CPU Burst scenario', 'info');
  }
}

// =============================================
// EVENT LISTENERS
// =============================================
function setupEventListeners() {

  // Algorithm selection
  dom.btnFCFS.addEventListener('click', () => {
    currentAlgo = 'fcfs';
    dom.btnFCFS.classList.add('active');
    dom.btnRR.classList.remove('active');
    dom.quantumSection.style.opacity = '0.4';
    dom.quantumSection.style.pointerEvents = 'none';
    dom.preemptArrow.classList.remove('visible');
    dom.algoLabel.textContent = 'FCFS';
    log('Algorithm set to <strong>FCFS</strong>', 'info');
  });

  dom.btnRR.addEventListener('click', () => {
    currentAlgo = 'rr';
    dom.btnRR.classList.add('active');
    dom.btnFCFS.classList.remove('active');
    dom.quantumSection.style.opacity = '1';
    dom.quantumSection.style.pointerEvents = 'all';
    dom.preemptArrow.classList.add('visible');
    dom.algoLabel.textContent = `RR (Q=${timeQuantum})`;
    log(`Algorithm set to <strong>Round Robin</strong> (Q=${timeQuantum})`, 'info');
  });

  // Sliders
  dom.timeQuantum.addEventListener('input', () => {
    timeQuantum = parseInt(dom.timeQuantum.value);
    dom.quantumVal.textContent = timeQuantum;
    if (currentAlgo === 'rr') dom.algoLabel.textContent = `RR (Q=${timeQuantum})`;
  });

  dom.ctxDelay.addEventListener('input', () => {
    ctxDelay = parseInt(dom.ctxDelay.value);
    dom.ctxDelayVal.textContent = ctxDelay;
  });

  dom.simSpeed.addEventListener('input', () => {
    simSpeed = parseInt(dom.simSpeed.value);
    dom.simSpeedVal.textContent = `${simSpeed}x`;
    if (isRunning && !isPaused) {
      clearInterval(simulationTimer);
      const intervalMs = Math.max(100, 1500 / simSpeed);
      simulationTimer = setInterval(simulationTick, intervalMs);
    }
  });

  // Add process
  dom.addProcessBtn.addEventListener('click', () => {
    const pid = dom.inPID.value.trim() || `P${processIdCounter}`;
    const arrival = parseInt(dom.inArrival.value) || 0;
    const burst = parseInt(dom.inBurst.value) || 1;
    const io = parseInt(dom.inIO.value) || 0;

    if (burst < 1 || burst > 30) {
      log('⚠ Burst time must be between 1 and 30.', 'error');
      return;
    }

    addProcess(pid, arrival, burst, io);

    // Auto-increment PID
    dom.inPID.value = `P${processIdCounter}`;
    dom.inArrival.value = arrival;
    dom.inBurst.value = burst <= 20 ? burst + 1 : burst;
    dom.inIO.value = io;
  });

  // Enter key for add process
  [dom.inPID, dom.inArrival, dom.inBurst, dom.inIO].forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') dom.addProcessBtn.click();
    });
  });

  // Simulation controls
  dom.startBtn.addEventListener('click', startSimulation);
  dom.pauseBtn.addEventListener('click', pauseSimulation);
  dom.stepBtn.addEventListener('click', stepSimulation);
  dom.resetBtn.addEventListener('click', resetSimulation);

  // Scenarios
  document.getElementById('scenarioBasic').addEventListener('click', () => loadScenario('basic'));
  document.getElementById('scenarioIO').addEventListener('click', () => loadScenario('io'));
  document.getElementById('scenarioBurst').addEventListener('click', () => loadScenario('burst'));

  // Clear log
  dom.clearLogBtn.addEventListener('click', () => {
    dom.eventLog.innerHTML = `
      <div class="log-entry log-info">
        <span class="log-time">T=${clockTick}</span>
        <span class="log-msg">Log cleared.</span>
      </div>
    `;
  });

  // Clear gantt
  dom.clearGanttBtn.addEventListener('click', clearGantt);

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); isPaused ? pauseSimulation() : (isRunning ? pauseSimulation() : startSimulation()); }
    if (e.code === 'KeyS' && !isRunning) startSimulation();
    if (e.code === 'KeyR') resetSimulation();
    if (e.code === 'Period') stepSimulation();
  });
}

// =============================================
// INIT
// =============================================
function init() {
  injectSVGGradients();
  initParticles();
  setupEventListeners();

  // Set initial quantum section state
  dom.quantumSection.style.opacity = '0.4';
  dom.quantumSection.style.pointerEvents = 'none';

  // Load a default scenario to guide users
  updatePCBTable();
  updateStateDiagram();
  updateQueues();

  log('🚀 Process Lifecycle Visualizer initialized.', 'info');
  log('📌 Add processes using the left panel, then click Start.', 'info');
  log('💡 Tip: Press <strong>Space</strong> to start/pause, <strong>.</strong> to step.', 'info');
}

document.addEventListener('DOMContentLoaded', init);