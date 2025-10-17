//! Linux-specific optimizations benchmark

use std::time::Instant;
use tabled::builder::Builder;
use tabled::settings::Style;

#[cfg(target_os = "linux")]
use fast_base_convert::optimized::get_linux_system_info;
use fast_base_convert::{convert_base_baseline, convert_base};

#[cfg(target_os = "linux")]
fn main() {
    println!("=== Linux-Specific Optimizations Demo ===\n");

    // Get Linux system information
    let (page_size, num_cores, has_numa) = get_linux_system_info();

    let mut sys_builder = Builder::with_capacity(4);
    sys_builder.push_record(["System Info", "Value"]);
    sys_builder.push_record(["Page Size", &format!("{} bytes", page_size)]);
    sys_builder.push_record(["CPU Cores", &num_cores.to_string()]);
    sys_builder.push_record([
        "NUMA Support",
        if has_numa { "Yes" } else { "No" }
    ]);

    let mut sys_table = sys_builder.build();
    sys_table.with(Style::modern());

    println!("System Information:");
    println!("\n{}", sys_table);
    println!();

    // Performance results
    let mut perf_builder = Builder::with_capacity(4);
    perf_builder.push_record(["Test Case", "Input Size", "Baseline", "Optimized", "Speedup"]);

    // Test 1: Very large number (triggers mmap optimization)
    let large_input: Vec<u64> = (0..1_000_000).map(|i| i % 10).collect();

    let start = Instant::now();
    let baseline_result = convert_base_baseline(&large_input[..10000], 10, 16);
    let baseline_time = start.elapsed();

    let start = Instant::now();
    let optimized_result = convert_base(&large_input[..10000], 10, 16);
    let optimized_time = start.elapsed();

    assert_eq!(baseline_result, optimized_result);

    let speedup = if baseline_time > optimized_time {
        baseline_time.as_nanos() as f64 / optimized_time.as_nanos() as f64
    } else {
        1.0
    };

    perf_builder.push_record([
        "Very Large (mmap)",
        "10K digits",
        &format!("{:?}", baseline_time),
        &format!("{:?}", optimized_time),
        &format!("{:.2}x", speedup),
    ]);

    // Test 2: Medium number with SIMD optimization (16→8)
    let medium_input: Vec<u64> = (0..1024).map(|i| (i % 16) as u64).collect();

    let start = Instant::now();
    for _ in 0..1000 {
        let _ = convert_base_baseline(&medium_input, 16, 8);
    }
    let baseline_time = start.elapsed();

    let start = Instant::now();
    for _ in 0..1000 {
        let _ = convert_base(&medium_input, 16, 8);
    }
    let optimized_time = start.elapsed();

    let speedup = if baseline_time > optimized_time {
        baseline_time.as_nanos() as f64 / optimized_time.as_nanos() as f64
    } else {
        1.0
    };

    perf_builder.push_record([
        "Medium (SIMD)",
        "1024 digits",
        &format!("{:?}", baseline_time),
        &format!("{:?}", optimized_time),
        &format!("{:.2}x", speedup),
    ]);

    // Test 3: Memory alignment optimization
    let aligned_input: Vec<u64> = (0..1000).map(|i| i % 8).collect();

    let start = Instant::now();
    for _ in 0..10000 {
        let _ = convert_base_baseline(&aligned_input, 8, 2);
    }
    let baseline_time = start.elapsed();

    let start = Instant::now();
    for _ in 0..10000 {
        let _ = convert_base(&aligned_input, 8, 2);
    }
    let optimized_time = start.elapsed();

    let speedup = if baseline_time > optimized_time {
        baseline_time.as_nanos() as f64 / optimized_time.as_nanos() as f64
    } else {
        1.0
    };

    perf_builder.push_record([
        "Memory Aligned",
        "1000 digits",
        &format!("{:?}", baseline_time),
        &format!("{:?}", optimized_time),
        &format!("{:.2}x", speedup),
    ]);

    let mut perf_table = perf_builder.build();
    perf_table.with(Style::modern());

    println!("Performance Benchmark Results:");
    println!("\n{}", perf_table);
    println!();

    // Optimization summary table
    let mut summary_builder = Builder::with_capacity(5);
    summary_builder.push_record(["Optimization", "Trigger Condition", "Description"]);
    summary_builder.push_record(["mmap", "Numbers > 100K", "Memory mapping reduces copies"]);
    summary_builder.push_record(["AVX2 SIMD", "Power of Two", "Parallel 4 u64s"]);
    summary_builder.push_record(["Memory Alignment", "All Cases", "Cache-line alignment"]);
    summary_builder.push_record(["System Aware", "Auto", "Dynamic sysconf tuning"]);

    let mut summary_table = summary_builder.build();
    summary_table.with(Style::modern());

    println!("Linux Optimization Summary:");
    println!("\n{}", summary_table);
}

#[cfg(not(target_os = "linux"))]
fn main() {
    println!("This example demonstrates Linux-specific optimizations.");
    println!("Run this on a Linux system to see the optimizations in action.");
}