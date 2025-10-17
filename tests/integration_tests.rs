//! Integration tests for the fast_base_convert library

use fast_base_convert::{convert_base_baseline, convert_base_auto};
use num_bigint::BigUint;
use num_traits::identities::Zero;

/// Convert digits to BigUint for verification
fn digits_to_biguint(digits: &[u64], base: u64) -> BigUint {
    let mut result = BigUint::from(0u32);
    let mut power = BigUint::from(1u32);
    let base_big = BigUint::from(base);

    for &digit in digits {
        let digit_big = BigUint::from(digit);
        result += &digit_big * &power;
        power *= &base_big;
    }

    result
}

/// Convert BigUint to digits in given base
fn biguint_to_digits(mut num: BigUint, base: u64) -> Vec<u64> {
    if num.is_zero() {
        return vec![0];
    }

    let base_big = BigUint::from(base);
    let mut digits = Vec::new();

    while !num.is_zero() {
        let remainder = &num % &base_big;
        digits.push(remainder.to_string().parse::<u64>().unwrap());
        num /= &base_big;
    }

    digits
}

/// Verify that conversion preserves the value
fn verify_conversion(digits: &[u64], from_base: u64, to_base: u64) {
    // Convert using our implementation
    let converted = convert_base_baseline(digits, from_base, to_base);

    // Convert using BigUint as ground truth
    let original_value = digits_to_biguint(digits, from_base);
    let expected = biguint_to_digits(original_value, to_base);

    assert_eq!(converted, expected,
        "Conversion failed: {:?} (base {}) -> {:?} (base {}), expected {:?}",
        digits, from_base, converted, to_base, expected);
}

#[test]
fn test_all_small_conversions() {
    let test_cases = vec![
        (vec![0], 10),
        (vec![1], 10),
        (vec![5], 10),
        (vec![9], 10),
        (vec![0, 1], 10), // 10
        (vec![5, 1], 10), // 15
        (vec![9, 9], 10), // 99
        (vec![9, 9, 9], 10), // 999
    ];

    for (digits, base) in test_cases {
        for to_base in 2..=36 {
            verify_conversion(&digits, base, to_base);
        }
    }
}

#[test]
fn test_random_conversions() {
    use rand::Rng;

    let mut rng = rand::thread_rng();

    for _ in 0..100 {
        let from_base = rng.gen_range(2..=36);
        let to_base = rng.gen_range(2..=36);

        // Generate random number with 1-10 digits
        let num_digits = rng.gen_range(1..=10);
        let mut digits = Vec::new();
        for _ in 0..num_digits {
            digits.push(rng.gen_range(0..from_base));
        }

        // Remove leading zeros
        while digits.len() > 1 && digits.last() == Some(&0) {
            digits.pop();
        }

        verify_conversion(&digits, from_base, to_base);
    }
}

#[test]
fn test_large_numbers() {
    let test_cases = vec![
        // Powers of 10
        vec![0; 10], // 10^10
        vec![0; 20], // 10^20
        vec![0; 50], // 10^50

        // Factorials
        vec![0, 2, 4, 6, 8], // 86420 in base 10
        vec![0, 0, 0, 1], // 1000 in base 10

        // Large random numbers
        vec![9, 8, 7, 6, 5, 4, 3, 2, 1], // All digits valid for base 10
        vec![1, 2, 3, 4, 5, 6, 7, 8, 9], // Valid digits for base 10
    ];

    for digits in test_cases.iter() {
        for &from_base in &[10, 16, 2] {
            for &to_base in &[16, 2, 10, 8] {
                if from_base != to_base {
                    // Skip invalid digit combinations
                    if from_base == 2 && digits.iter().any(|&d| d >= 2) {
                        continue;
                    }
                    if from_base == 16 && digits.iter().any(|&d| d >= 16) {
                        continue;
                    }

                    verify_conversion(digits, from_base, to_base);
                }
            }
        }
    }
}

#[test]
fn test_edge_cases() {
    // Test minimum and maximum bases
    let digits = vec![1, 1, 1]; // 111 in some base

    verify_conversion(&digits, 2, 65536);
    verify_conversion(&digits, 65536, 2);

    // Test single digit conversions
    for base in 2..=100 { // Limit for test time
        for digit in 1..base.min(50) {
            verify_conversion(&[digit], base, 10);
            if digit < 10 { // Only test valid digits for base 10
                verify_conversion(&[digit], 10, base);
            }
        }
    }
}

#[test]
fn test_consistency_between_implementations() {
    let test_cases = vec![
        (vec![9, 8, 7], 10, 16), // Valid digits for base 10
        (vec![1, 0, 1, 1, 0, 1], 2, 10), // Valid digits for base 2
        (vec![15, 15, 15], 16, 2), // Valid digits for base 16
        (vec![1, 2, 3, 4, 5], 6, 7), // Valid digits for base 6
    ];

    for (digits, from_base, to_base) in test_cases {
        let baseline_result = convert_base_baseline(&digits, from_base, to_base);
        let auto_result = convert_base_auto(&digits, from_base, to_base);

        assert_eq!(baseline_result, auto_result,
            "Results differ between baseline and auto: {:?} vs {:?}",
            baseline_result, auto_result);
    }
}

#[test]
fn test_round_trip_conversions() {
    let original_digits = vec![9, 8, 7, 6, 5]; // Valid digits for base 10
    let original_base = 10;

    // Convert to various bases and back
    for &intermediate_base in &[2, 8, 16, 32, 36] {
        let intermediate = convert_base_baseline(&original_digits, original_base, intermediate_base);
        let recovered = convert_base_baseline(&intermediate, intermediate_base, original_base);

        assert_eq!(original_digits, recovered,
            "Round trip failed for base {}: {:?} -> {:?} -> {:?}",
            intermediate_base, original_digits, intermediate, recovered);
    }
}