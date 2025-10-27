# Fast Base Convert

A high-performance base conversion library focused on algorithm-level optimization. Supports both Rust local usage and WebAssembly browser execution.

## Features

- Support arbitrary base conversion (2-65536)
- Four optimization strategies:
  - **Bit Operation Optimization**: Power-of-2 base conversion using direct bit shift operations
  - **u128 Fast Path**: Small numbers using 128-bit integer arithmetic
  - **Aligned Base Optimization**: Prime factorization-based grouped conversion
  - **Baseline Algorithm**: Large numbers using standard division algorithm
- **WebAssembly Support**: Run high-performance benchmarks in browsers
- **Interactive Frontend**: Modern web interface showing performance comparisons

## Performance Benchmark Results

### Algorithm Optimization Effects
- **Bit Operation Optimization** (power-of-2 base): **6.23x** speedup
- **u128 Fast Path** (small numbers): **3.53x** speedup
- **Aligned Base Optimization** (aligned base): **2.98x** speedup
- **Basic Division** (general case): Baseline implementation

### Test Conditions
- Each test execution time ≥ 1 second
- Comparison with actual baseline version
- 25 unit tests + 6 integration tests all passed

## Installation and Usage

### Rust Library Usage

```rust
use fast_base_convert::{convert_base, convert_base_baseline};

// Automatic optimized conversion
let input = vec![5, 4, 3, 2, 1]; // 12345 in base 10
let result = convert_base(&input, 10, 16);

// Baseline conversion
let baseline_result = convert_base_baseline(&input, 10, 16);

// Result: [9, 3, 0, 3] (0x3039 in hex)
```

### Web Frontend Usage

Visit [GitHub Pages](https://howardzhangdqs.github.io/fast_base_convert/) to run benchmarks directly in your browser.

### Run Web Frontend Locally

```bash
# 1. Build WebAssembly module
wasm-pack build --target web --out-dir www/pkg --release

# 2. Install frontend dependencies
cd www
npm install

# 3. Start development server
npm run dev
```

Visit http://localhost:3000

## Running Tests

```bash
cargo test                               # Unit tests + integration tests
cargo run --example benchmark            # Standard performance test
cargo run --example algorithm_benchmark  # Algorithm-specific benchmarks
```

## Project Structure

```
├── src/                    # Rust source code
│   ├── lib.rs             # Library entry point
│   ├── baseline.rs        # Baseline algorithm implementation
│   ├── optimized.rs       # Optimized algorithm implementation
│   ├── utils.rs           # Utility functions
│   └── wasm.rs            # WebAssembly interface
├── www/                   # Web frontend
│   ├── src/               # TypeScript source
│   ├── dist/              # Build output
│   ├── pkg/               # WebAssembly package
│   └── index.html         # Main page
├── examples/              # Examples
│   ├── benchmark.rs       # Standard performance test
│   └── algorithm_benchmark.rs # Algorithm benchmarks
├── tests/                 # Integration tests
├── report/               # Academic papers
└── .github/workflows/    # CI/CD configuration
```

## Optimization Strategies Explained

### 1. Bit Operation Optimization (6.23x speedup)
- **Use case**: Power-of-2 base conversion (e.g., 16→8, 32→2)
- **Algorithm**: Use bit shift operations instead of division
- **Complexity**: O(n·cost_division) → O(n·cost_bit_ops)

### 2. u128 Fast Path (3.53x speedup)
- **Use case**: Small numbers that fit in 128-bit
- **Algorithm**: Direct hardware integer arithmetic
- **Advantage**: Avoids bignum computation overhead

### 3. Aligned Base Optimization (2.98x speedup)
- **Use case**: Bases satisfying n^a = m^b relationship (e.g., 4²=16)
- **Algorithm**: Prime factorization-based grouped conversion
- **Advantage**: Reduces iteration count

### 4. Basic Division Algorithm
- **Use case**: General cases and large numbers
- **Algorithm**: Standard division with remainder algorithm

## Technical Highlights

- **Algorithm Complexity Optimization**: Prioritize time complexity improvement over constant factors
- **Fast Path Detection**: Handle common cases first
- **WebAssembly Integration**: Rust performance + Web accessibility
- **Comprehensive Testing**: Unit tests + integration tests + performance benchmarks
- **Educational Value**: Demonstrate which optimizations truly work

## Report

The project includes complete reports in the `report/` directory:
- **main.tex**: LaTeX source file
- **ppt.tex**: Presentation source file
- **references.bib**: References

## Deployment

The project uses GitHub Actions for automatic deployment to GitHub Pages:
- Automatic build and deployment on each push to main branch
- Rust compiled to WebAssembly
- TypeScript/Vite frontend build
- Zero-configuration deployment

## License

MIT