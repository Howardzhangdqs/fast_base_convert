//! Simple benchmark comparison
use std::time::Instant;
use fast_base_convert::{convert_base_baseline, convert_base};

fn main() {
    println!("=== Performance Comparison ===\n");

    // Test case 1: Small numbers
    let input1 = vec![5, 4, 3, 2, 1]; // 12345
    println!("Test 1: Small number (12345) from base 10 to 16");

    let start = Instant::now();
    for _ in 0..10000 {
        let _ = convert_base_baseline(&input1, 10, 16);
    }
    let baseline_time = start.elapsed();
    println!("Baseline:  {:?} for 10,000 iterations", baseline_time);

    let start = Instant::now();
    for _ in 0..10000 {
        let _ = convert_base(&input1, 10, 16);
    }
    let optimized_time = start.elapsed();
    println!("Optimized: {:?} for 10,000 iterations", optimized_time);

    if baseline_time > optimized_time {
        let speedup = baseline_time.as_nanos() as f64 / optimized_time.as_nanos() as f64;
        println!("Speedup: {:.2}x\n", speedup);
    } else {
        println!("No speedup\n");
    }

    // Test case 2: Power of two bases
    let input2 = vec![0xFF, 0xFF, 0xFF, 0xFF];
    println!("Test 2: Power of two bases (16 to 8)");

    let start = Instant::now();
    for _ in 0..100000 {
        let _ = convert_base_baseline(&input2, 16, 8);
    }
    let baseline_time = start.elapsed();
    println!("Baseline:  {:?} for 100,000 iterations", baseline_time);

    let start = Instant::now();
    for _ in 0..100000 {
        let _ = convert_base(&input2, 16, 8);
    }
    let optimized_time = start.elapsed();
    println!("Optimized: {:?} for 100,000 iterations", optimized_time);

    if baseline_time > optimized_time {
        let speedup = baseline_time.as_nanos() as f64 / optimized_time.as_nanos() as f64;
        println!("Speedup: {:.2}x\n", speedup);
    } else {
        println!("No speedup\n");
    }

    // Test case 3: Large number
    let mut input3 = vec![0; 50];
    input3[0] = 1; // 10^50
    println!("Test 3: Large number (10^50) from base 10 to 16");

    let start = Instant::now();
    for _ in 0..1000 {
        let _ = convert_base_baseline(&input3, 10, 16);
    }
    let baseline_time = start.elapsed();
    println!("Baseline:  {:?} for 1,000 iterations", baseline_time);

    let start = Instant::now();
    for _ in 0..1000 {
        let _ = convert_base(&input3, 10, 16);
    }
    let optimized_time = start.elapsed();
    println!("Optimized: {:?} for 1,000 iterations", optimized_time);

    if baseline_time > optimized_time {
        let speedup = baseline_time.as_nanos() as f64 / optimized_time.as_nanos() as f64;
        println!("Speedup: {:.2}x\n", speedup);
    } else {
        println!("No speedup\n");
    }

    // Verify correctness
    let baseline_result = convert_base_baseline(&input1, 10, 16);
    let optimized_result = convert_base(&input1, 10, 16);
    assert_eq!(baseline_result, optimized_result, "Results should be identical!");
    println!("✓ All results are correct!");
}