# Fast Base Convert

A high-performance base conversion library focused on algorithmic optimization.

## Features

- Supports arbitrary base conversion (2-65536)
- Multiple optimization strategies:
  - **Bitwise Optimization**: Direct shift operations for power-of-two bases
  - **u128 Fast Path**: 128-bit integer operations for small numbers
  - **Aligned Base Optimization**: Grouped conversion using prime factorization
  - **Baseline Algorithm**: Standard division algorithm for large numbers

## Performance Benchmark Results

### Algorithm Optimization Effects
- **Bitwise Optimization** (power-of-two bases): **6.23x** speedup
- **u128 Fast Path** (small numbers): **3.53x** speedup
- **Aligned Base Optimization** (aligned bases): **2.98x** speedup
- **Baseline Division** (general case): baseline implementation

### Test Conditions
- Each test runs for ≥1 second
- Compared against real baseline version
- All 25 unit tests + 6 integration tests passed

## Usage

```rust
use fast_base_convert::{convert_base, convert_base_baseline};

// Automatic optimized conversion
let input = vec![5, 4, 3, 2, 1]; // 12345 in base 10
let result = convert_base(&input, 10, 16);

// Baseline conversion
let baseline_result = convert_base_baseline(&input, 10, 16);

// Result: [9, 3, 0, 3] (0x3039 in hex)
```

## Run Tests

```bash
cargo test                          # Unit tests + integration tests
cargo run --example benchmark        # Standard performance benchmark
cargo run --example algorithm_benchmark  # Algorithm-specific benchmark
```

## Optimization Strategies Explained

### 1. Bitwise Optimization (6.23x speedup)
- **Applicable Scenario**: Power-of-two base conversion (e.g. 16→8, 32→2)
- **Algorithm**: Use shift operations instead of division
- **Complexity**: Reduced from O(n) to O(1)

### 2. u128 Fast Path (3.53x speedup)
- **Applicable Scenario**: Numbers that fit in 128 bits
- **Algorithm**: Direct hardware integer operations
- **Advantage**: Avoids big integer overhead

### 3. Aligned Base Optimization (2.98x speedup)
- **Applicable Scenario**: Bases satisfying n^a = m^b (e.g. 4²=16)
- **Algorithm**: Grouped conversion via prime factorization
- **Advantage**: Reduces iteration count

### 4. Baseline Division Algorithm
- **Applicable Scenario**: General case and large numbers
- **Algorithm**: Standard division and remainder algorithm

## Project Structure

```
src/
├── lib.rs          # Library entry
├── baseline.rs     # Baseline algorithm implementation
├── optimized.rs    # Optimized algorithm implementation
└── utils.rs        # Utility functions

examples/
├── benchmark.rs           # Standard performance benchmark
└── algorithm_benchmark.rs # Algorithm-specific benchmark

tests/
└── integration_tests.rs   # Integration tests
```

## Technical Highlights

- **Algorithmic Complexity Optimization**: Prioritizes improving time complexity over constant factors
- **Fast Path Detection**: Handles common cases first
- **Comprehensive Testing**: Unit tests + integration tests + performance benchmarks
- **Educational Value**: Demonstrates which optimizations are truly effective

## License

MIT