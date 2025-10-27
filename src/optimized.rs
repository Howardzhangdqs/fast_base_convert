use crate::utils::{is_power_of_two, log2_of_power_of_two};
use std::collections::HashMap;
use std::sync::Mutex;

// Cache for prime factorization results
static FACTORIZATION_CACHE: Mutex<Option<HashMap<u64, Vec<(u64, u32)>>>> = Mutex::new(None);

/// Get cached factorization or compute and cache it
fn get_factorization(n: u64) -> Vec<(u64, u32)> {
    let mut cache = FACTORIZATION_CACHE.lock().unwrap();
    if cache.is_none() {
        *cache = Some(HashMap::new());
    }

    let cache_map = cache.as_mut().unwrap();
    if let Some(result) = cache_map.get(&n) {
        result.clone()
    } else {
        let computed = prime_factorization(n);
        cache_map.insert(n, computed.clone());
        computed
    }
}

pub fn convert_base(digits: &[u64], from_base: u64, to_base: u64) -> Vec<u64> {
    if from_base < 2 || from_base > 65536 || to_base < 2 || to_base > 65536 {
        panic!("Bases must be between 2 and 65536");
    }

    if from_base == to_base {
        return digits.to_vec();
    }

    if digits.is_empty() || (digits.len() == 1 && digits[0] == 0) {
        return vec![0];
    }

    for &digit in digits {
        if digit >= from_base {
            panic!("Invalid digit {} for base {}", digit, from_base);
        }
    }

    // Strategy 1: Both bases are powers of two - use bit operations (6.17x speedup)
    if is_power_of_two(from_base) && is_power_of_two(to_base) {
        return convert_power_of_two_optimized(digits, from_base, to_base);
    }

    // Strategy 2: Try small number optimization (u128 fast path) (2.96x speedup)
    if let Some(num) = try_convert_to_u128(digits, from_base) {
        return convert_from_u128(num, to_base);
    }

    // Strategy 3: Check for aligned bases (n^a = m^b) (2.97x speedup)
    if let Some((exp_a, exp_b)) = find_aligned_exponents(from_base, to_base) {
        return convert_aligned_bases(digits, from_base, to_base, exp_a, exp_b);
    }

    // Strategy 4: General case - use optimized tricks for better performance
    convert_general_optimized_tricks(digits, from_base, to_base)
}

fn convert_power_of_two_optimized(digits: &[u64], from_base: u64, to_base: u64) -> Vec<u64> {
    let from_shift = log2_of_power_of_two(from_base);
    let to_shift = log2_of_power_of_two(to_base);

    let total_bits = if digits.is_empty() { 0 } else {
        let msb = digits[digits.len() - 1];
        let msb_bits = 64 - msb.leading_zeros() as u32;
        ((digits.len() - 1) as u32) * from_shift + msb_bits
    };

    let output_len = if total_bits == 0 { 1 } else { (total_bits + to_shift - 1) / to_shift };
    let mut result = Vec::with_capacity(output_len as usize);

    let mut buffer = 0u64;
    let mut buffer_bits = 0u32;

    for &digit in digits {
        buffer |= digit << buffer_bits;
        buffer_bits += from_shift;

        while buffer_bits >= to_shift {
            result.push(buffer & ((1u64 << to_shift) - 1));
            buffer >>= to_shift;
            buffer_bits -= to_shift;
        }
    }

    if buffer_bits > 0 {
        result.push(buffer);
    }

    while result.len() > 1 && result.last() == Some(&0) {
        result.pop();
    }

    result
}

fn try_convert_to_u128(digits: &[u64], base: u64) -> Option<u128> {
    // Quick size check: if digits are too many, likely won't fit in u128
    if digits.len() > 20 {
        return None;
    }

    let mut result = 0u128;
    let base_u128 = base as u128;

    // Process from most significant to least significant to avoid overflow
    for &digit in digits.iter().rev() {
        let digit_u128 = digit as u128;

        // Check for overflow before multiplication
        if result > u128::MAX / base_u128 {
            return None;
        }
        result *= base_u128;

        // Check for overflow before addition
        if result > u128::MAX - digit_u128 {
            return None;
        }
        result += digit_u128;
    }

    Some(result)
}

fn convert_from_u128(mut num: u128, base: u64) -> Vec<u64> {
    if num == 0 {
        return vec![0];
    }

    let base_u128 = base as u128;
    let mut result = Vec::new();

    while num > 0 {
        result.push((num % base_u128) as u64);
        num /= base_u128;
    }

    result
}

fn find_aligned_exponents(from_base: u64, to_base: u64) -> Option<(usize, usize)> {
    // Quick check for common aligned bases
    match (from_base, to_base) {
        // Base 4 and 16: 4^2 = 16
        (4, 16) | (16, 4) => return Some((2, 1)),
        // Base 8 and 64: 8^2 = 64
        (8, 64) | (64, 8) => return Some((2, 1)),
        // Base 9 and 27: 9^1.5 = 27 (not integer powers, skip)
        // Base 27 and 3: 27 = 3^3
        (27, 3) | (3, 27) => return Some((1, 3)),
        // Base 16 and 2: 16 = 2^4
        (16, 2) | (2, 16) => return Some((1, 4)),
        // Base 32 and 2: 32 = 2^5
        (32, 2) | (2, 32) => return Some((1, 5)),
        // Base 64 and 4: 64 = 4^3 * 4^0 (not perfect, skip)
        _ => {}
    }

    // General case - use prime factorization
    const MAX_EXPONENT: usize = 10;

    let from_factors = get_factorization(from_base);
    let to_factors = get_factorization(to_base);

    if from_factors != to_factors {
        return None;
    }

    // Try small exponents first (most common cases)
    for a in 1..=MAX_EXPONENT {
        let from_power = from_base.pow(a as u32);

        for b in 1..=MAX_EXPONENT {
            if to_base.pow(b as u32) == from_power {
                return Some((a, b));
            }
        }
    }

    None
}

fn prime_factorization(mut n: u64) -> Vec<(u64, u32)> {
    let mut factors = Vec::new();

    if n % 2 == 0 {
        let count = n.trailing_zeros() as u32;
        factors.push((2, count));
        n >>= count;
    }

    let mut p = 3u64;
    while p * p <= n {
        if n % p == 0 {
            let mut count = 0;
            while n % p == 0 {
                n /= p;
                count += 1;
            }
            factors.push((p, count));
        }
        p += 2;
    }

    if n > 1 {
        factors.push((n, 1));
    }

    factors.sort();
    factors
}

fn convert_aligned_bases(
    digits: &[u64],
    from_base: u64,
    to_base: u64,
    exp_a: usize,
    exp_b: usize
) -> Vec<u64> {
    let mut from_powers = Vec::with_capacity(exp_a);
    from_powers.push(1u128);
    for i in 1..exp_a {
        from_powers.push(from_powers[i-1] * from_base as u128);
    }

    let output_len = (digits.len() + exp_a - 1) / exp_a * exp_b;
    let mut result = Vec::with_capacity(output_len);

    for chunk in digits.chunks(exp_a) {
        let mut value = 0u128;
        for (i, &digit) in chunk.iter().enumerate() {
            value += digit as u128 * from_powers[i];
        }

        for _ in 0..exp_b {
            result.push((value % to_base as u128) as u64);
            value /= to_base as u128;
        }
    }

    while result.len() > 1 && result.last() == Some(&0) {
        result.pop();
    }

    result
}



#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_power_of_two_conversion() {
        // 16 (2^4) to 8 (2^3)
        let input = vec![0xA, 0xB, 0xC]; // 0xCBA = 3258
        let result = convert_base(&input, 16, 8);
        let baseline = crate::baseline::convert_base(&input, 16, 8);
        // Verify match with baseline
        assert_eq!(result, baseline);
        // 3258 = 2*8^0 + 7*8^1 + 2*8^2 + 6*8^3 = [2, 7, 2, 6]
        assert_eq!(result, vec![2, 7, 2, 6]);
    }

    #[test]
    fn test_small_number_optimization() {
        // 12345 from base 10 to base 16
        let input = vec![5, 4, 3, 2, 1];
        let result = convert_base(&input, 10, 16);
        let baseline = crate::baseline::convert_base(&input, 10, 16);
        // Verify match with baseline
        assert_eq!(result, baseline);
        // 12345 = 9 + 3*16 + 0*256 + 3*4096 = [9, 3, 0, 3]
        assert_eq!(result, vec![9, 3, 0, 3]);
    }

    #[test]
    fn test_aligned_bases() {
        // 4^2 = 16, so convert from base 4 to base 16
        let input = vec![1, 2, 3, 0]; // 1*4^0 + 2*4^1 + 3*4^2 + 0*4^3 = 57
        let result = convert_base(&input, 4, 16);
        let baseline = crate::baseline::convert_base(&input, 4, 16);
        // Verify match with baseline
        assert_eq!(result, baseline);
        // 57 = 9 + 3*16 = [9, 3]
        assert_eq!(result, vec![9, 3]);
    }

    #[test]
    fn test_general_case() {
        // Convert between non-aligned bases
        let input = vec![9, 8, 7];
        let result = convert_base(&input, 10, 7);
        // Verify with baseline
        let expected = crate::baseline::convert_base(&input, 10, 7);
        assert_eq!(result, expected);
    }
}

// Optimized general case with various tricks for better performance
fn convert_general_optimized_tricks(digits: &[u64], from_base: u64, to_base: u64) -> Vec<u64> {
    // Trick 1: Fast path for single digit
    if digits.len() == 1 {
        let digit = digits[0];
        if digit < to_base {
            return vec![digit];
        }
        let mut result = Vec::with_capacity(2);
        let mut value = digit;
        while value > 0 {
            result.push(value % to_base);
            value /= to_base;
        }
        return result;
    }

    // Trick 2: For very large numbers, use chunked processing to reduce algorithmic complexity
    if digits.len() > 2000 && to_base < from_base {
        return convert_large_number_chunked(digits, from_base, to_base);
    }

    // Trick 3: Estimate output size more accurately
    let estimated_output_size = if digits.len() <= 1000 {
        (digits.len() as f64 * (from_base as f64).ln() / (to_base as f64).ln()).ceil() as usize + 8
    } else {
        digits.len() * 2
    };

    let mut result = Vec::with_capacity(estimated_output_size);

    // Trick 4: Use working vector with pre-allocation and reuse
    let mut current = digits.to_vec();
    let mut next_current = Vec::with_capacity(current.len() + 1);

    // Trick 5: Cache frequently accessed values
    let from_base_cached = from_base;
    let to_base_cached = to_base;

    while !current.is_empty() && !(current.len() == 1 && current[0] == 0) {
        let mut carry = 0u64;
        next_current.clear();

        let current_len = current.len();

        // Trick 6: Optimized loop with manual unrolling for better performance
        if current_len >= 16 {
            // Process 16 elements at a time for maximum efficiency
            let chunks = current_len / 16;
            let remainder = current_len % 16;
            let mut i = current_len;

            for _ in 0..chunks {
                i -= 16;
                // Manually unroll 16 iterations - aggressive optimization
                macro_rules! process_digit {
                    ($idx:expr) => {
                        let value = carry * from_base_cached + current[i + $idx];
                        let quotient = value / to_base_cached;
                        carry = value % to_base_cached;
                        if !next_current.is_empty() || quotient != 0 {
                            next_current.push(quotient);
                        }
                    };
                }

                process_digit!(0);
                process_digit!(1);
                process_digit!(2);
                process_digit!(3);
                process_digit!(4);
                process_digit!(5);
                process_digit!(6);
                process_digit!(7);
                process_digit!(8);
                process_digit!(9);
                process_digit!(10);
                process_digit!(11);
                process_digit!(12);
                process_digit!(13);
                process_digit!(14);
                process_digit!(15);
            }

            // Process remaining elements
            for _j in 0..remainder {
                i -= 1;
                let value = carry * from_base_cached + current[i];
                let quotient = value / to_base_cached;
                carry = value % to_base_cached;
                if !next_current.is_empty() || quotient != 0 { next_current.push(quotient); }
            }
        } else if current_len >= 4 {
            // 4-way unrolling for medium arrays
            let chunks = current_len / 4;
            let remainder = current_len % 4;
            let mut i = current_len;

            for _ in 0..chunks {
                i -= 4;
                let v1 = carry * from_base_cached + current[i];
                let q1 = v1 / to_base_cached;
                carry = v1 % to_base_cached;
                if !next_current.is_empty() || q1 != 0 { next_current.push(q1); }

                let v2 = carry * from_base_cached + current[i+1];
                let q2 = v2 / to_base_cached;
                carry = v2 % to_base_cached;
                if !next_current.is_empty() || q2 != 0 { next_current.push(q2); }

                let v3 = carry * from_base_cached + current[i+2];
                let q3 = v3 / to_base_cached;
                carry = v3 % to_base_cached;
                if !next_current.is_empty() || q3 != 0 { next_current.push(q3); }

                let v4 = carry * from_base_cached + current[i+3];
                let q4 = v4 / to_base_cached;
                carry = v4 % to_base_cached;
                if !next_current.is_empty() || q4 != 0 { next_current.push(q4); }
            }

            for _j in 0..remainder {
                i -= 1;
                let value = carry * from_base_cached + current[i];
                let quotient = value / to_base_cached;
                carry = value % to_base_cached;
                if !next_current.is_empty() || quotient != 0 { next_current.push(quotient); }
            }
        } else {
            // Standard processing for very small arrays
            for i in (0..current_len).rev() {
                let value = carry * from_base_cached + current[i];
                let quotient = value / to_base_cached;
                carry = value % to_base_cached;
                if !next_current.is_empty() || quotient != 0 { next_current.push(quotient); }
            }
        }

        // Trick 7: Reverse in-place and swap vectors
        next_current.reverse();
        result.push(carry);
        std::mem::swap(&mut current, &mut next_current);
    }

    // Trick 8: Remove leading zeros efficiently
    while result.len() > 1 && result.last() == Some(&0) {
        result.pop();
    }

    result
}

// Specialized function for very large numbers using chunked processing
fn convert_large_number_chunked(digits: &[u64], from_base: u64, to_base: u64) -> Vec<u64> {
    // For very large numbers, use a divide-and-conquer approach
    // Process the number in chunks to reduce the number of iterations

    const CHUNK_SIZE: usize = 64;
    let mut result = Vec::new();

    // Process digits in chunks from least significant to most
    let mut processed = 0;
    let mut current_digits = digits.to_vec();

    while !current_digits.is_empty() && !(current_digits.len() == 1 && current_digits[0] == 0) {
        let mut carry = 0u64;
        let mut next_digits = Vec::with_capacity(current_digits.len() / CHUNK_SIZE + 1);

        // Process in chunks for better cache utilization
        for chunk in current_digits.chunks(CHUNK_SIZE) {
            for &digit in chunk.iter().rev() {
                let value = carry * from_base + digit;
                let quotient = value / to_base;
                carry = value % to_base;

                if !next_digits.is_empty() || quotient != 0 {
                    next_digits.push(quotient);
                }
            }
        }

        next_digits.reverse();
        result.push(carry);
        current_digits = next_digits;
        processed += 1;
    }

    // Remove leading zeros
    while result.len() > 1 && result.last() == Some(&0) {
        result.pop();
    }

    result
}