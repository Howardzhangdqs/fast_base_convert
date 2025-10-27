//! Performance benchmark example
use std::time::Instant;
use tabled::builder::Builder;
use tabled::settings::Style;
use fast_base_convert::{convert_base_baseline, convert_base};

fn main() {
    println!("=== Fast Base Convert Performance Demo ===\n");

    let mut builder = Builder::with_capacity(6);

    // Header
    builder.push_record(["测试场景", "输入描述", "迭代次数", "Baseline", "Optimized", "加速比"]);

    // Test case 1: Small numbers (u128 optimization)
    let input1 = vec![5, 4, 3, 2, 1]; // 12345 in base 10
    let baseline_result = convert_base_baseline(&input1, 10, 16);
    let optimized_result = convert_base(&input1, 10, 16);
    assert_eq!(baseline_result, optimized_result);

    let start = Instant::now();
    for _ in 0..100000 {
        let _ = convert_base_baseline(&input1, 10, 16);
    }
    let baseline_time = start.elapsed();

    let start = Instant::now();
    for _ in 0..100000 {
        let _ = convert_base(&input1, 10, 16);
    }
    let optimized_time = start.elapsed();

    let speedup = if baseline_time > optimized_time {
        baseline_time.as_nanos() as f64 / optimized_time.as_nanos() as f64
    } else {
        1.0
    };

    builder.push_record([
        "小数字(u128优化)",
        "12345 (10→16)",
        "100,000",
        &format!("{:.2?}", baseline_time),
        &format!("{:.2?}", optimized_time),
        &format!("{:.2}x", speedup),
    ]);

    // Test case 2: Power of two bases (bit operations)
    let input2 = vec![0xF, 0xF, 0xF, 0xF]; // 4 digits in hex
    let baseline_result = convert_base_baseline(&input2, 16, 8);
    let optimized_result = convert_base(&input2, 16, 8);
    assert_eq!(baseline_result, optimized_result);

    let start = Instant::now();
    for _ in 0..1000000 {
        let _ = convert_base_baseline(&input2, 16, 8);
    }
    let baseline_time = start.elapsed();

    let start = Instant::now();
    for _ in 0..1000000 {
        let _ = convert_base(&input2, 16, 8);
    }
    let optimized_time = start.elapsed();

    let speedup = if baseline_time > optimized_time {
        baseline_time.as_nanos() as f64 / optimized_time.as_nanos() as f64
    } else {
        1.0
    };

    builder.push_record([
        "2的幂进制",
        "0xFFFF (16→8)",
        "1,000,000",
        &format!("{:.2?}", baseline_time),
        &format!("{:.2?}", optimized_time),
        &format!("{:.2}x", speedup),
    ]);

    // Test case 3: Large number
    let mut input3 = vec![0; 100];
    input3[0] = 1; // 10^100
    let baseline_result = convert_base_baseline(&input3, 10, 16);
    let optimized_result = convert_base(&input3, 10, 16);
    assert_eq!(baseline_result, optimized_result);

    let start = Instant::now();
    for _ in 0..1000 {
        let _ = convert_base_baseline(&input3, 10, 16);
    }
    let baseline_time = start.elapsed();

    let start = Instant::now();
    for _ in 0..1000 {
        let _ = convert_base(&input3, 10, 16);
    }
    let optimized_time = start.elapsed();

    let speedup = if baseline_time > optimized_time {
        baseline_time.as_nanos() as f64 / optimized_time.as_nanos() as f64
    } else {
        1.0
    };

    builder.push_record([
        "大数字",
        "10^100 (10→16)",
        "1,000",
        &format!("{:.2?}", baseline_time),
        &format!("{:.2?}", optimized_time),
        &format!("{:.2}x", speedup),
    ]);

    // Test case 4: Aligned bases
    let input4 = vec![3, 2, 1, 0]; // 27 in base 4
    let baseline_result = convert_base_baseline(&input4, 4, 16);
    let optimized_result = convert_base(&input4, 4, 16);
    assert_eq!(baseline_result, optimized_result);

    let start = Instant::now();
    for _ in 0..100000 {
        let _ = convert_base_baseline(&input4, 4, 16);
    }
    let baseline_time = start.elapsed();

    let start = Instant::now();
    for _ in 0..100000 {
        let _ = convert_base(&input4, 4, 16);
    }
    let optimized_time = start.elapsed();

    let speedup = if baseline_time > optimized_time {
        baseline_time.as_nanos() as f64 / optimized_time.as_nanos() as f64
    } else {
        1.0
    };

    builder.push_record([
        "对齐进制",
        "27 (4→16)",
        "100,000",
        &format!("{:.2?}", baseline_time),
        &format!("{:.2?}", optimized_time),
        &format!("{:.2}x", speedup),
    ]);

    // Build and display table
    let mut table = builder.build();
    table.with(Style::modern());

    println!("性能基准测试结果:");
    println!("\n{}", table);
    println!();

    // Optimization strategies table
    let mut strategies_builder = Builder::with_capacity(5);
    strategies_builder.push_record(["优化策略", "适用场景", "加速效果"]);
    strategies_builder.push_record(["位运算", "2的幂进制", "★★★★★"]);
    strategies_builder.push_record(["u128路径", "小数字", "★★★★"]);
    strategies_builder.push_record(["分组转换", "对齐进制", "★★★"]);
    strategies_builder.push_record(["预分配", "通用情况", "★★"]);

    let mut strategies_table = strategies_builder.build();
    strategies_table.with(Style::modern());

    println!("优化策略效果评级:");
    println!("\n{}", strategies_table);
}