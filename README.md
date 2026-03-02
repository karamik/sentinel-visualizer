# 🔮 Sentinel Visualizer

<p align="center">
  <img src="https://via.placeholder.com/800x400?text=Sentinel+Visualizer+Demo" alt="Sentinel Visualizer Demo" width="80%">
</p>

<p align="center">
  <b>See the Unseen in Zero-Knowledge Circuits</b><br>
  Hardware-accelerated visual debugger for ZK circuit development
</p>

<p align="center">
  <a href="https://github.com/karamik/sentinel-visualizer/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/karamik/sentinel-visualizer/deploy-pages.yml?branch=main" alt="Build Status">
  </a>
  <a href="https://github.com/karamik/sentinel-visualizer/issues">
    <img src="https://img.shields.io/github/issues/karamik/sentinel-visualizer" alt="Issues">
  </a>
  <a href="https://github.com/karamik/sentinel-visualizer/stargazers">
    <img src="https://img.shields.io/github/stars/karamik/sentinel-visualizer" alt="Stars">
  </a>
  <img src="https://img.shields.io/badge/TypeScript-98.6%25-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License">
</p>

<p align="center">
  <a href="#✨-features">Features</a> •
  <a href="#🚀-quick-start">Quick Start</a> •
  <a href="#🖥️-live-demo">Live Demo</a> •
  <a href="#🤝-contributing">Contributing</a>
</p>

## ✨ Features

| | |
|---|---|
| **🕸️ 3D Circuit Graph** | Interactive visualization of constraint dependencies. See your circuit's structure in full 3D. |
| **🔥 Constraint Heatmap** | Identify expensive operations instantly. Spot bottlenecks before they become problems. |
| **⏱️ Hardware Preview** | Simulate FPGA execution before deployment. Optimize for hardware from day one. |
| **🐛 Step Debugger** | Trace witness generation step-by-step. Find bugs in your circuit logic. |

## 🖥️ Live Demo

Try Sentinel Visualizer right now:  
👉 **[karamik.github.io/sentinel-visualizer](https://karamik.github.io/sentinel-visualizer)** 👈

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/karamik/sentinel-visualizer.git
cd sentinel-visualizer

# Install dependencies (using pnpm)
pnpm install

# Run the development server
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000) to see the app.

## 🔧 Usage

### Loading a Circuit

1. Launch Sentinel Visualizer
2. Drag & drop your `.r1cs` file (Circom) or use the file picker
3. Watch your circuit transform into an interactive 3D graph

### Debugging Workflow

- **Zoom & Pan** — Navigate through the constraint graph
- **Search** — Find specific signals by name
- **Heatmap** — Toggle heatmap view to see computational hotspots
- **Step Through** — Use the debugger to trace witness generation

## 🏗️ Architecture

Sentinel Visualizer is built as a monorepo with:

- **`apps/web`** — Next.js web application
- **`packages/core`** — Core visualization engine (WIP)
- **`packages/parser-circom`** — R1CS parser (coming soon)
- **`examples`** — Example circuits and usage demos

## 🤝 Contributing

We welcome contributions! Whether it's:

- 🐛 Reporting bugs
- ✨ Suggesting new features
- 📝 Improving documentation
- 🔧 Submitting PRs

Check out our [Contributing Guide](CONTRIBUTING.md) to get started.

### Development Setup

```bash
# Fork the repository and clone
git clone https://github.com/your-username/sentinel-visualizer.git
cd sentinel-visualizer

# Install dependencies
pnpm install

# Create a branch for your changes
git checkout -b feature/your-feature-name

# Make your changes and commit
git commit -m "Add your feature"

# Push and open a Pull Request
```

## 🗺️ Roadmap

- [ ] **Circom support** — Native R1CS parsing
- [ ] **Noir support** — ACIR integration
- [ ] **VSCode extension** — Debug directly from your editor
- [ ] **CI/CD integration** — Automate circuit analysis in GitHub Actions
- [ ] **Story mode** — Share debugging sessions with your team

## 📄 License

[MIT](LICENSE) © [karamik](https://github.com/karamik)

## ⭐ Show Your Support

If you find Sentinel Visualizer useful, give it a star on GitHub — it helps others discover the project!

---

<p align="center">
  Made with 🔮 for the ZK community
</p>
