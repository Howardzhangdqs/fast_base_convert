// 快速调试测试
use fast_base_convert::convert_base_baseline;

fn main() {
    // Test simple case: 255 from base 10 to base 16
    let input = vec![5, 5, 2]; // 255 = 5 + 5*10 + 2*100
    println!("Input: {:?}", input);
    let output = convert_base_baseline(&input, 10, 16);
    println!("Output: {:?}", output);

    // Test binary conversion
    let input2 = vec![3, 1]; // 13 = 3 + 1*10
    println!("\nInput2: {:?}", input2);
    let output2 = convert_base_baseline(&input2, 10, 2);
    println!("Output2: {:?}", output2);

    // Reverse conversion
    let input3 = vec![1, 0, 1, 1]; // 1101 in binary
    println!("\nInput3: {:?}", input3);
    let output3 = convert_base_baseline(&input3, 2, 10);
    println!("Output3: {:?}", output3);
}