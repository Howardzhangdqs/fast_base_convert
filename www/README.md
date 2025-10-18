# Fast Base Convert Web Frontend

A modern web interface for benchmarking base conversion algorithms powered by WebAssembly.

## Features

- **Interactive Benchmarking**: Run performance tests directly in your browser
- **Multiple Optimization Strategies**: Test different algorithms (u128 fast-path, bit manipulation, grouped conversion)
- **Real-time Visualization**: See performance comparisons with charts
- **Presets**: Quick access to common test scenarios
- **Custom Tests**: Configure your own benchmarks

## Test Presets

### Small Numbers (u128 Optimization)
- Tests the u128 fast-path for small numbers
- Input: 12345 (base 10 → 16)
- Iterations: 100,000

### Power of Two
- Tests bit manipulation for power-of-two bases
- Input: 65535 (base 16 → 8)
- Iterations: 1,000,000

### Aligned Bases
- Tests grouped conversion for mathematically aligned bases
- Input: 123 (base 4 → 16)
- Iterations: 200,000

### Large Numbers
- Tests general case optimization
- Input: 10^100 (base 10 → 16)
- Iterations: 10,000

## Local Development

### Prerequisites
- Node.js 20+
- Rust with wasm-pack

### Setup

1. Install dependencies:
```bash
cd www
npm install
```

2. Build the WASM module (from project root):
```bash
wasm-pack build --target web --out-dir www/pkg --dev
```

3. Start development server:
```bash
cd www
npm run dev
```

4. Open http://localhost:3000

## Build for Production

```bash
cd www
npm run build
```

The built files will be in `www/dist`.

## Architecture

- **Rust Core**: High-performance base conversion algorithms compiled to WebAssembly
- **TypeScript Frontend**: Modern web interface using Vite
- **No Build Framework**: Pure HTML/CSS/TypeScript for maximum performance

## Performance Results

Typical performance improvements:
- **Bit Manipulation**: 6.31× speedup
- **U128 Fast-Path**: 3.70× speedup
- **Grouped Conversion**: 2.91× speedup

## Deployment

The application is automatically deployed to GitHub Pages when pushed to the main branch.