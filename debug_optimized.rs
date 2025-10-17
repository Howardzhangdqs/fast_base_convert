// 调试优化版本
use fast_base_convert::{convert_base, convert_base_baseline};

fn main() {
    println!("=== Test 1: Power of two conversion ===");
    let input = vec![0xA, 0xB, 0xC]; // 0xABC = 2748
    println!("Input: {:?} (base 16)", input);
    let baseline = convert_base_baseline(&input, 16, 8);
    let optimized = convert_base(&input, 16, 8);
    println!("Baseline: {:?}", baseline);
    println!("Optimized: {:?}", optimized);
    println!("Expected: [4, 2, 5, 3]");

    println!("\n=== Test 2: Small number optimization ===");
    let input2 = vec![5, 4, 3, 2, 1]; // 12345
    println!("Input: {:?} (base 10)", input2);
    let baseline2 = convert_base_baseline(&input2, 10, 16);
    let optimized2 = convert_base(&input2, 10, 16);
    println!("Baseline: {:?}", baseline2);
    println!("Optimized: {:?}", optimized2);
    println!("Expected: [57, 48]");

    println!("\n=== Test 3: Aligned bases ===");
    let input3 = vec![1, 2, 3, 0]; // 124 in base 4
    println!("Input: {:?} (base 4)", input3);
    let baseline3 = convert_base_baseline(&input3, 4, 16);
    let optimized3 = convert_base(&input3, 4, 16);
    println!("Baseline: {:?}", baseline3);
    println!("Optimized: {:?}", optimized3);
    println!("Expected: [12, 7]");
}