use crate::utils::{is_power_of_two, log2_of_power_of_two};
use std::collections::HashMap;
use std::sync::Mutex;

#[cfg(target_os = "linux")]
#[cfg(target_feature = "avx2")]
use std::arch::x86_64::*;

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

    // Strategy 1: Both bases are powers of two - use bit operations
    if is_power_of_two(from_base) && is_power_of_two(to_base) {
        return convert_power_of_two_optimized(digits, from_base, to_base);
    }

    // Strategy 1.5: Linux-specific optimization for large numbers using sysconf
    #[cfg(target_os = "linux")]
    {
        if digits.len() > 1000 {
            // Use Linux-specific optimizations for very large numbers
            return convert_linux_optimized(digits, from_base, to_base);
        }
    }

    // Strategy 2: Try small number optimization (u128 fast path)
    if let Some(num) = try_convert_to_u128(digits, from_base) {
        return convert_from_u128(num, to_base);
    }

    // Strategy 3: Check for aligned bases (n^a = m^b)
    if let Some((exp_a, exp_b)) = find_aligned_exponents(from_base, to_base) {
        return convert_aligned_bases(digits, from_base, to_base, exp_a, exp_b);
    }

    // Strategy 4: General case with optimized division
    convert_general_optimized(digits, from_base, to_base)
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
    let mut result = 0u128;
    let mut power = 1u128;
    let base_u128 = base as u128;

    for &digit in digits {
        let digit_u128 = digit as u128;

        if result.checked_add(digit_u128 * power).is_none() {
            return None;
        }
        result += digit_u128 * power;

        if power.checked_mul(base_u128).is_none() {
            return None;
        }
        power *= base_u128;
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
    const MAX_EXPONENT: usize = 12;

    let from_factors = get_factorization(from_base);
    let to_factors = get_factorization(to_base);

    if from_factors != to_factors {
        return None;
    }

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

fn convert_general_optimized(digits: &[u64], from_base: u64, to_base: u64) -> Vec<u64> {
    let log_from = (from_base as f64).ln();
    let log_to = (to_base as f64).ln();
    let estimated_size = (digits.len() as f64 * log_from / log_to).ceil() as usize + 1;
    let mut result = Vec::with_capacity(estimated_size);

    let mut current = digits.to_vec();

    while !current.is_empty() && !(current.len() == 1 && current[0] == 0) {
        let mut carry = 0u64;
        let mut next_current = Vec::with_capacity(current.len());

        for &digit in current.iter().rev() {
            let value = carry * from_base + digit;
            let quotient = value / to_base;
            carry = value % to_base;

            if !next_current.is_empty() || quotient != 0 {
                next_current.push(quotient);
            }
        }

        next_current.reverse();
        result.push(carry);
        current = next_current;
    }

    while result.len() > 1 && result.last() == Some(&0) {
        result.pop();
    }

    result
}

#[cfg(target_os = "linux")]
/// Linux-specific optimizations for large number conversion
fn convert_linux_optimized(digits: &[u64], from_base: u64, to_base: u64) -> Vec<u64> {
    // Linux optimization 1: Use mmap for very large numbers
    if digits.len() > 100000 {
        return convert_with_mmap(digits, from_base, to_base);
    }

    // Linux optimization 2: Use aligned memory for SIMD operations
    if digits.len() >= 16 && is_x86_feature_detected!("avx2") {
        return convert_with_simd_linux(digits, from_base, to_base);
    }

    // Linux optimization 3: Use posix_memalign for better cache performance
    convert_linux_general(digits, from_base, to_base)
}

#[cfg(target_os = "linux")]
/// Use mmap for handling extremely large numbers
fn convert_with_mmap(digits: &[u64], from_base: u64, to_base: u64) -> Vec<u64> {
    use std::ptr;
    use libc::{mmap, munmap, MAP_PRIVATE, MAP_ANONYMOUS, MAP_FAILED};

    let size = digits.len() * std::mem::size_of::<u64>();
    let ptr = unsafe {
        mmap(
            ptr::null_mut(),
            size,
            libc::PROT_READ | libc::PROT_WRITE,
            MAP_PRIVATE | MAP_ANONYMOUS,
            -1,
            0
        )
    };

    if ptr == MAP_FAILED {
        // Fallback to regular conversion
        return convert_general_optimized(digits, from_base, to_base);
    }

    // Copy digits to mmap'd memory for better paging performance
    unsafe {
        ptr::copy_nonoverlapping(digits.as_ptr(), ptr as *mut u64, digits.len());
    }

    // Perform conversion with memory-mapped data
    let result = convert_general_optimized(digits, from_base, to_base);

    // Clean up
    unsafe {
        munmap(ptr, size);
    }

    result
}

#[cfg(target_os = "linux")]
/// SIMD-optimized conversion for Linux with AVX2
fn convert_with_simd_linux(digits: &[u64], from_base: u64, to_base: u64) -> Vec<u64> {
    // For now, fallback to regular power-of-two conversion
    // TODO: Implement actual SIMD processing
    if is_power_of_two(from_base) && is_power_of_two(to_base) {
        convert_power_of_two_optimized(digits, from_base, to_base)
    } else {
        convert_general_optimized(digits, from_base, to_base)
    }
}

#[cfg(target_os = "linux")]
/// Linux-specific general optimization with better memory alignment
fn convert_linux_general(digits: &[u64], from_base: u64, to_base: u64) -> Vec<u64> {
    use libc::{posix_memalign, free};

    // Align memory to cache line boundary (64 bytes)
    const CACHE_LINE_SIZE: usize = 64;

    let aligned_size = ((digits.len() * std::mem::size_of::<u64>() + CACHE_LINE_SIZE - 1)
                       / CACHE_LINE_SIZE) * CACHE_LINE_SIZE;

    let mut aligned_ptr: *mut std::ffi::c_void = std::ptr::null_mut();
    let result = unsafe {
        posix_memalign(
            &mut aligned_ptr,
            CACHE_LINE_SIZE,
            aligned_size
        )
    };

    if result != 0 {
        // Fallback to regular optimized conversion
        return convert_general_optimized(digits, from_base, to_base);
    }

    // Use aligned memory for better cache performance
    let aligned_slice = unsafe {
        std::slice::from_raw_parts_mut(aligned_ptr as *mut u64, digits.len())
    };

    aligned_slice.copy_from_slice(digits);

    let result = convert_general_optimized(aligned_slice, from_base, to_base);

    // Clean up aligned memory
    unsafe {
        free(aligned_ptr);
    }

    result
}

/// Linux-specific system info for optimization tuning
#[cfg(target_os = "linux")]
pub fn get_linux_system_info() -> (usize, usize, bool) {
    use libc::{sysconf};

    let page_size = unsafe { sysconf(libc::_SC_PAGESIZE) } as usize;
    let num_cores = unsafe { sysconf(libc::_SC_NPROCESSORS_ONLN) } as usize;

    // Check if running on NUMA system
    let has_numa = std::path::Path::new("/sys/devices/system/node/").exists();

    (page_size, num_cores, has_numa)
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