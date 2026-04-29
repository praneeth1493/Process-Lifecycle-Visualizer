# Process Lifecycle Visualization Tool

An interactive CPU scheduling and context switching simulator that visualizes process lifecycle, scheduling algorithms (FCFS, Round Robin), and provides real-time Gantt charts for operating systems education.

![Process Lifecycle Visualizer](https://img.shields.io/badge/Status-Working-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🚀 Features

- **Scheduling Algorithms**
  - First Come First Serve (FCFS)
  - Round Robin (RR) with configurable time quantum
  
- **Process Management**
  - Add custom processes with arrival time, burst time, and I/O burst
  - Visual process state diagram (NEW → READY → RUNNING → WAITING → TERMINATED)
  - Real-time Process Control Block (PCB) table
  
- **Visualization**
  - Interactive Gantt chart showing CPU execution timeline
  - Context switching animation with configurable delay
  - Ready and Waiting queue displays
  - CPU core visualization with progress ring
  
- **Metrics & Analytics**
  - Average wait time and turnaround time
  - CPU utilization percentage
  - Context switch count
  - Throughput calculation
  
- **Simulation Controls**
  - Play/Pause/Step/Reset controls
  - Adjustable simulation speed (1x - 5x)
  - Step-by-step execution mode
  - Keyboard shortcuts for quick control

## 🎯 Quick Start

### Option 1: Direct Browser Open
1. Simply open `index.html` in any modern web browser
2. No server or installation required!

### Option 2: Local Server (Recommended)
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server

# Then open http://localhost:8000 in your browser
```

## 📖 How to Use

### Adding Processes

1. **Manual Entry**
   - Enter Process ID (e.g., P1, P2)
   - Set Arrival Time (when process enters the system)
   - Set Burst Time (CPU execution time needed)
   - Set I/O Burst (optional, for I/O operations)
   - Click "Add Process"

2. **Quick Scenarios**
   - **Basic (5 procs)**: Standard 5-process scenario
   - **I/O Intensive**: Processes with I/O operations
   - **CPU Burst**: Mix of short and long CPU bursts

### Configuring Simulation

- **Scheduling Algorithm**: Choose between FCFS or Round Robin
- **Time Quantum**: Set quantum for Round Robin (1-10 ticks)
- **Context Switch Delay**: Simulate context switch overhead (0-5 ticks)
- **Simulation Speed**: Adjust animation speed (1x-5x)

### Running Simulation

1. Add processes using the left panel
2. Configure scheduling parameters
3. Click **Start** to begin simulation
4. Use **Pause** to pause/resume
5. Use **Step** for tick-by-tick execution
6. Click **Reset** to clear and start over

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Start/Pause simulation |
| `S` | Start simulation (when stopped) |
| `R` | Reset simulation |
| `.` | Step forward one tick |

## 🎨 Understanding the Visualization

### Process States (Color Coded)

- 🟡 **NEW**: Process created, waiting to be admitted
- 🔵 **READY**: In ready queue, waiting for CPU
- 🟢 **RUNNING**: Currently executing on CPU
- 🟠 **WAITING**: Blocked on I/O operation
- ⚫ **TERMINATED**: Execution completed

### Gantt Chart Blocks

- **Colored blocks**: Process execution (each process has unique color)
- **⚡ CTX**: Context switch overhead
- **I/O**: I/O operation in progress
- **—— IDLE**: CPU idle time

### CPU Visualization

- **Process Name**: Currently running process
- **Progress Ring**: Visual progress of burst completion
- **Remaining Time**: Ticks left for current process

## 📊 Metrics Explained

- **Avg Wait Time**: Average time processes spend in ready queue
- **Avg Turnaround**: Average time from arrival to completion
- **CPU Utilization**: Percentage of time CPU is busy (not idle)
- **Context Switches**: Number of process switches
- **Throughput**: Processes completed per time unit

## 🔧 Technical Details

### Technologies Used
- Pure HTML5, CSS3, JavaScript (ES6+)
- No external dependencies
- Responsive glassmorphism UI design
- SVG animations for visual effects

### Browser Compatibility
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

### File Structure
```
├── index.html          # Main HTML structure
├── script.js           # Simulation logic and algorithms
├── style.css           # Glassmorphism UI styles
├── README.md           # This file
└── FIXES.md           # Bug fixes documentation
```

## 🐛 Recent Bug Fixes

All major issues have been resolved:
- ✅ Context switch now properly dispatches next process
- ✅ Fixed infinite context switch loop when delay = 0
- ✅ Round Robin preemption logic improved
- ✅ Gantt chart process tracking corrected

See [FIXES.md](FIXES.md) for detailed information.

## 🎓 Educational Use

This tool is perfect for:
- Operating Systems courses
- Understanding CPU scheduling algorithms
- Visualizing process lifecycle
- Learning context switching concepts
- Comparing FCFS vs Round Robin performance

## 📝 Example Scenarios

### Scenario 1: FCFS Convoy Effect
```
P1: Arrival=0, Burst=20
P2: Arrival=1, Burst=3
P3: Arrival=2, Burst=3
```
Observe how short processes wait for long process to complete.

### Scenario 2: Round Robin Fairness
```
Same processes as above, but with RR (Q=4)
```
Notice how all processes get fair CPU time.

### Scenario 3: I/O Bound Processes
```
P1: Arrival=0, Burst=10, I/O=3
P2: Arrival=1, Burst=8, I/O=2
```
Watch processes move between RUNNING and WAITING states.

## 🤝 Contributing

Feel free to fork, modify, and use this project for educational purposes!

## 📄 License

MIT License - Free to use for educational and personal projects.

## 🙏 Acknowledgments

Built with modern web technologies and designed for operating systems education.

---

**Enjoy exploring CPU scheduling algorithms! 🚀**

For issues or questions, please check the code comments or FIXES.md documentation.
