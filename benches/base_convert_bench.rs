//! Benchmark tests for base conversion performance
//!
//! This module compares the performance of different implementations:
//! - Baseline implementation (simple division)
//! - Optimized implementation (multiple strategies)
//!
//! Run with: cargo bench

use criterion::{black_box, criterion_group, criterion_main, Criterion};
use fast_base_convert::{convert_base_baseline, convert_base};
use rand::{Rng, SeedableRng};
use rand::rngs::StdRng;

/// Generate random digits for a given base
fn generate_random_digits(rng: &mut StdRng, size: usize, base: u64) -> Vec<u64> {
    let mut digits = Vec::with_capacity(size);
    for _ in 0..size {
        digits.push(rng.gen_range(0..base));
    }
    // Ensure no leading zeros
    while digits.len() > 1 && digits.last() == Some(&0) {
        digits.pop();
    }
    digits
}

/// Generate a specific number (e.g., 10^n)
fn generate_power_of_10(exponent: usize) -> Vec<u64> {
    let mut digits = vec![0; exponent];
    digits[0] = 1; // 10^exponent = 1 followed by exponent zeros
    digits
}

/// Benchmark baseline implementation
fn bench_baseline(c: &mut Criterion) {
    let mut group = c.benchmark_group("baseline_conversion");

    // Small numbers
    group.bench_function("small_10_to_16", |b| {
        let input = vec![5, 4, 3, 2, 1]; // 12345
        b.iter(|| {
            convert_base_baseline(black_box(&input), black_box(10), black_box(16))
        })
    });

    // Medium numbers
    group.bench_function("medium_10_to_16", |b| {
        let input = generate_power_of_10(20); // 10^20
        b.iter(|| {
            convert_base_baseline(black_box(&input), black_box(10), black_box(16))
        })
    });

    // Large numbers
    group.bench_function("large_10_to_16", |b| {
        let input = generate_power_of_10(100); // 10^100
        b.iter(|| {
            convert_base_baseline(black_box(&input), black_box(10), black_box(16))
        })
    });

    // Power of two conversion
    group.bench_function("power_of_two_16_to_8", |b| {
        let input = vec![0xFF, 0xFF, 0xFF, 0xFF];
        b.iter(|| {
            convert_base_baseline(black_box(&input), black_box(16), black_box(8))
        })
    });

    group.finish();
}

/// Benchmark optimized implementation
fn bench_optimized(c: &mut Criterion) {
    let mut group = c.benchmark_group("optimized_conversion");

    // Small numbers (should use u128 optimization)
    group.bench_function("small_10_to_16", |b| {
        let input = vec![5, 4, 3, 2, 1]; // 12345
        b.iter(|| {
            convert_base(black_box(&input), black_box(10), black_box(16))
        })
    });

    // Medium numbers
    group.bench_function("medium_10_to_16", |b| {
        let input = generate_power_of_10(20); // 10^20
        b.iter(|| {
            convert_base(black_box(&input), black_box(10), black_box(16))
        })
    });

    // Large numbers
    group.bench_function("large_10_to_16", |b| {
        let input = generate_power_of_10(100); // 10^100
        b.iter(|| {
            convert_base(black_box(&input), black_box(10), black_box(16))
        })
    });

    // Power of two conversion (should use bit operations)
    group.bench_function("power_of_two_16_to_8", |b| {
        let input = vec![0xFF, 0xFF, 0xFF, 0xFF];
        b.iter(|| {
            convert_base(black_box(&input), black_box(16), black_box(8))
        })
    });

    // Aligned bases (4^2 = 16)
    group.bench_function("aligned_4_to_16", |b| {
        let mut rng = StdRng::seed_from_u64(42);
        let input = generate_random_digits(&mut rng, 20, 4);
        b.iter(|| {
            convert_base(black_box(&input), black_box(4), black_box(16))
        })
    });

    group.finish();
}

/// Compare baseline vs optimized for different scenarios
fn bench_comparison(c: &mut Criterion) {
    let mut group = c.benchmark_group("comparison");

    // Scenario 1: Small numbers
    let input_small = vec![9, 8, 7, 6, 5, 4, 3, 2, 1];

    group.bench_function("baseline_small", |b| {
        b.iter(|| {
            convert_base_baseline(black_box(&input_small), black_box(10), black_box(16))
        })
    });

    group.bench_function("optimized_small", |b| {
        b.iter(|| {
            convert_base(black_box(&input_small), black_box(10), black_box(16))
        })
    });

    // Scenario 2: Power of two bases
    let input_p2 = vec![0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0];

    group.bench_function("baseline_power_of_two", |b| {
        b.iter(|| {
            convert_base_baseline(black_box(&input_p2), black_box(16), black_box(2))
        })
    });

    group.bench_function("optimized_power_of_two", |b| {
        b.iter(|| {
            convert_base(black_box(&input_p2), black_box(16), black_box(2))
        })
    });

    // Scenario 3: Large numbers
    let input_large = generate_power_of_10(50);

    group.bench_function("baseline_large", |b| {
        b.iter(|| {
            convert_base_baseline(black_box(&input_large), black_box(10), black_box(2))
        })
    });

    group.bench_function("optimized_large", |b| {
        b.iter(|| {
            convert_base(black_box(&input_large), black_box(10), black_box(2))
        })
    });

    group.finish();
}

/// Benchmark different base combinations
fn bench_different_bases(c: &mut Criterion) {
    let mut group = c.benchmark_group("different_bases");

    let test_number = vec![9, 8, 7, 6, 5]; // 56789 in base 10

    let base_pairs = [
        (10, 2),   // Decimal to binary
        (10, 8),   // Decimal to octal
        (10, 16),  // Decimal to hexadecimal
        (16, 10),  // Hexadecimal to decimal
        (2, 10),   // Binary to decimal
        (8, 16),   // Octal to hexadecimal
        (16, 8),   // Hexadecimal to octal
        (32, 64),  // Both power of two
    ];

    for &(from, to) in &base_pairs {
        let mut input = test_number.clone();
        // Ensure digits are valid for the source base
        input.iter_mut().for_each(|d| *d %= from);

        group.bench_with_input(
            &format!("{}_to_{}", from, to),
            &(input, from, to),
            |b, (input, from, to)| {
                b.iter(|| {
                    convert_base(black_box(input), black_box(*from), black_box(*to))
                })
            },
        );
    }

    group.finish();
}

/// Benchmark memory allocation patterns
fn bench_memory_allocation(c: &mut Criterion) {
    let mut group = c.benchmark_group("memory_allocation");

    // Test with different input sizes
    for size in [10, 100, 1000, 5000].iter() {
        let mut rng = StdRng::seed_from_u64(42);
        let input = generate_random_digits(&mut rng, *size, 10);

        group.bench_with_input(
            &format!("size_{}", size),
            &input,
            |b, input| {
                b.iter(|| {
                    convert_base(black_box(input), black_box(10), black_box(16))
                })
            },
        );
    }

    group.finish();
}

criterion_group!(
    benches,
    bench_baseline,
    bench_optimized,
    bench_comparison,
    bench_different_bases,
    bench_memory_allocation
);

criterion_main!(benches);