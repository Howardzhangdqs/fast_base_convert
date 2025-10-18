//! Algorithm-specific optimizations benchmark

use std::time::Instant;
use tabled::builder::Builder;
use tabled::settings::Style;
use fast_base_convert::{convert_base_baseline, convert_base};

fn main() {
    println!("=== Fast Base Convert Algorithm Optimizations ===\n");

    // Performance results
    let mut perf_builder = Builder::with_capacity(4);
    perf_builder.push_record(["测试项", "输入大小", "Baseline", "Optimized", "加速比"]);

    // Test 1: Small numbers (u128 optimization)
    let small_input: Vec<u64> = vec![5, 4, 3, 2, 1]; // 12345 in base 10

    let start = Instant::now();
    for _ in 0..1500000 {
        let _ = convert_base_baseline(&small_input, 10, 16);
    }
    let baseline_time = start.elapsed();

    let start = Instant::now();
    for _ in 0..1500000 {
        let _ = convert_base(&small_input, 10, 16);
    }
    let optimized_time = start.elapsed();

    let speedup = if baseline_time > optimized_time {
        baseline_time.as_nanos() as f64 / optimized_time.as_nanos() as f64
    } else {
        1.0
    };

    perf_builder.push_record([
        "小数字(u128优化)",
        "5 digits",
        &format!("{:.2?}", baseline_time),
        &format!("{:.2?}", optimized_time),
        &format!("{:.2}x", speedup),
    ]);

    // Test 2: Power of two bases (bit operations) - increase iterations for longer test time
    let power2_input: Vec<u64> = vec![0xF, 0xF, 0xF, 0xF]; // 4 digits in hex

    let start = Instant::now();
    for _ in 0..10000000 {
        let _ = convert_base_baseline(&power2_input, 16, 8);
    }
    let baseline_time = start.elapsed();

    let start = Instant::now();
    for _ in 0..10000000 {
        let _ = convert_base(&power2_input, 16, 8);
    }
    let optimized_time = start.elapsed();

    let speedup = if baseline_time > optimized_time {
        baseline_time.as_nanos() as f64 / optimized_time.as_nanos() as f64
    } else {
        1.0
    };

    perf_builder.push_record([
        "2的幂进制(位运算)",
        "4 digits",
        &format!("{:.2?}", baseline_time),
        &format!("{:.2?}", optimized_time),
        &format!("{:.2}x", speedup),
    ]);

    // Test 3: Aligned bases (4^2 = 16) - increase iterations
    let aligned_input: Vec<u64> = vec![3, 2, 1, 0]; // 27 in base 4

    let start = Instant::now();
    for _ in 0..2000000 {
        let _ = convert_base_baseline(&aligned_input, 4, 16);
    }
    let baseline_time = start.elapsed();

    let start = Instant::now();
    for _ in 0..2000000 {
        let _ = convert_base(&aligned_input, 4, 16);
    }
    let optimized_time = start.elapsed();

    let speedup = if baseline_time > optimized_time {
        baseline_time.as_nanos() as f64 / optimized_time.as_nanos() as f64
    } else {
        1.0
    };

    perf_builder.push_record([
        "对齐进制(分组优化)",
        "4 digits",
        &format!("{:.2?}", baseline_time),
        &format!("{:.2?}", optimized_time),
        &format!("{:.2}x", speedup),
    ]);

    // Test 4: Large number (general case) - larger input for longer test
    let mut large_input = vec![0; 1000];
    large_input[0] = 1; // 10^1000

    let start = Instant::now();
    for _ in 0..75000 {
        let _ = convert_base_baseline(&large_input, 10, 16);
    }
    let baseline_time = start.elapsed();

    let start = Instant::now();
    for _ in 0..75000 {
        let _ = convert_base(&large_input, 10, 16);
    }
    let optimized_time = start.elapsed();

    let speedup = if baseline_time > optimized_time {
        baseline_time.as_nanos() as f64 / optimized_time.as_nanos() as f64
    } else {
        1.0
    };

    perf_builder.push_record([
        "大数字(基础除法)",
        "1000 digits",
        &format!("{:.2?}", baseline_time),
        &format!("{:.2?}", optimized_time),
        &format!("{:.2}x", speedup),
    ]);

    let mut perf_table = perf_builder.build();
    perf_table.with(Style::modern());

    println!("算法优化基准测试结果:");
    println!("\n{}", perf_table);
    println!();

    // Optimization strategies table
    let mut summary_builder = Builder::with_capacity(5);
    summary_builder.push_record(["优化策略", "适用场景", "算法说明"]);
    summary_builder.push_record(["位运算", "2的幂进制", "直接位移操作"]);
    summary_builder.push_record(["u128路径", "小数字", "128位整数运算"]);
    summary_builder.push_record(["分组转换", "对齐进制", "质因数分解优化"]);
    summary_builder.push_record(["基础除法", "通用情况", "标准算法"]);

    let mut summary_table = summary_builder.build();
    summary_table.with(Style::modern());

    println!("算法优化策略总结:");
    println!("\n{}", summary_table);
}