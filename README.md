# 🔮 Sentinel Visualizer

<div align="center">

[![Build Status](https://img.shields.io/github/actions/workflow/status/karamik/sentinel-visualizer/deploy-pages.yml?branch=main)](https://github.com/karamik/sentinel-visualizer/actions)
[![Issues](https://img.shields.io/github/issues/karamik/sentinel-visualizer)](https://github.com/karamik/sentinel-visualizer/issues)
[![Stars](https://img.shields.io/github/stars/karamik/sentinel-visualizer)](https://github.com/karamik/sentinel-visualizer/stargazers)
[![License](https://img.shields.io/github/license/karamik/sentinel-visualizer)](https://github.com/karamik/sentinel-visualizer/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/karamik/sentinel-visualizer/blob/main/CONTRIBUTING.md)

**See the Unseen in Zero-Knowledge Circuits**  
*Hardware-accelerated visual debugger for ZK circuit development*

[✨ Features](#-features) • 
[🚀 Quick Start](#-quick-start) • 
[🎮 Live Demo](#-live-demo) • 
[📖 Documentation](#-documentation) • 
[💎 Pricing](#-pricing) • 
[🤝 Contributing](#-contributing)

</div>

## ✨ Features

| | |
|---|---|
| **🕸️ 3D Circuit Graph** | Interactive 3D visualization of constraint dependencies. Explore your circuit's structure in full 3D with intuitive controls. |
| **🔥 Constraint Heatmap** | Identify computational bottlenecks instantly. Color-coded nodes show complexity from green (low) to red (high). |
| **⏱️ Hardware Preview** | Simulate FPGA execution before deployment. Optimize for hardware from day one. |
| **🐛 Step Debugger** | Trace witness generation step-by-step. Find and fix bugs in your circuit logic. |
| **📊 Performance Metrics** | Real-time statistics on constraint count, witness size, and estimated hardware utilization. |
| **🔍 Signal Search** | Quickly locate specific signals across complex circuits. |
| **📤 Export** | Save your visualizations as PNG or SVG for reports and presentations. |
| **💰 Crypto Payments** | Pay for Pro/Team plans directly with USDT (BEP20) via MetaMask. |

## 🎮 Live Demo

Try Sentinel Visualizer right now in your browser:

👉 **[karamik.github.io/sentinel-visualizer](https://karamik.github.io/sentinel-visualizer)** 👈

No installation required! Upload your own `.r1cs` file or try it with our sample circuits.

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (v8 or higher)
- [Git](https://git-scm.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/karamik/sentinel-visualizer.git
cd sentinel-visualizer

# Install dependencies
pnpm install

# Run the development server
pnpm dev
