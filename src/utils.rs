use std::cmp::Ordering;

/// Check if a number is a power of two
pub fn is_power_of_two(n: u64) -> bool {
    n > 0 && (n & (n - 1)) == 0
}

/// Calculate the logarithm base 2 of a power of two
pub fn log2_of_power_of_two(n: u64) -> u32 {
    debug_assert!(is_power_of_two(n));
    n.trailing_zeros()
}

/// Convert a digit slice to a string representation
pub fn digits_to_string(digits: &[u64], _base: u64) -> String {
    if digits.is_empty() {
        return "0".to_string();
    }

    let mut chars = Vec::new();
    for &digit in digits.iter().rev() {
        if digit < 10 {
            chars.push((b'0' + digit as u8) as char);
        } else if digit < 36 {
            chars.push((b'a' + (digit - 10) as u8) as char);
        } else {
            chars.push('?');
        }
    }
    chars.into_iter().collect()
}

/// Parse a string into digits in the given base
pub fn string_to_digits(s: &str, base: u64) -> Result<Vec<u64>, String> {
    if s.is_empty() {
        return Ok(vec![0]);
    }

    let mut digits = Vec::new();
    for c in s.chars().rev() {
        let digit = if c.is_ascii_digit() {
            c as u64 - '0' as u64
        } else if c.is_ascii_lowercase() {
            c as u64 - 'a' as u64 + 10
        } else if c.is_ascii_uppercase() {
            c as u64 - 'A' as u64 + 10
        } else {
            return Err(format!("Invalid character: {}", c));
        };

        if digit >= base {
            return Err(format!("Digit '{}' out of range for base {}", c, base));
        }

        digits.push(digit);
    }

    while digits.len() > 1 && digits.last() == Some(&0) {
        digits.pop();
    }

    Ok(digits)
}

/// Compare two numbers represented as digit arrays
pub fn compare_digits(a: &[u64], b: &[u64]) -> Ordering {
    let a_trimmed = trim_leading_zeros(a);
    let b_trimmed = trim_leading_zeros(b);

    if a_trimmed.len() != b_trimmed.len() {
        return a_trimmed.len().cmp(&b_trimmed.len());
    }

    for (digit_a, digit_b) in a_trimmed.iter().rev().zip(b_trimmed.iter().rev()) {
        match digit_a.cmp(digit_b) {
            Ordering::Equal => continue,
            other => return other,
        }
    }

    Ordering::Equal
}

/// Remove leading zeros from digit array
pub fn trim_leading_zeros(digits: &[u64]) -> &[u64] {
    if digits.is_empty() {
        return digits;
    }

    let mut end = digits.len();
    while end > 1 && digits[end - 1] == 0 {
        end -= 1;
    }

    &digits[..end]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_power_of_two() {
        assert!(is_power_of_two(2));
        assert!(is_power_of_two(4));
        assert!(is_power_of_two(8));
        assert!(is_power_of_two(16));
        assert!(!is_power_of_two(3));
        assert!(!is_power_of_two(10));
        assert!(!is_power_of_two(12));
    }

    #[test]
    fn test_log2_of_power_of_two() {
        assert_eq!(log2_of_power_of_two(2), 1);
        assert_eq!(log2_of_power_of_two(4), 2);
        assert_eq!(log2_of_power_of_two(8), 3);
        assert_eq!(log2_of_power_of_two(16), 4);
    }

    #[test]
    fn test_digits_to_string() {
        let digits = vec![1, 0, 1, 1]; // 1101 in binary
        assert_eq!(digits_to_string(&digits, 2), "1101");

        let digits = vec![15, 15]; // 0xFF
        assert_eq!(digits_to_string(&digits, 16), "ff");
    }

    #[test]
    fn test_string_to_digits() {
        let digits = string_to_digits("1101", 2).unwrap();
        assert_eq!(digits, vec![1, 0, 1, 1]);

        let digits = string_to_digits("ff", 16).unwrap();
        assert_eq!(digits, vec![15, 15]);
    }

    #[test]
    fn test_compare_digits() {
        let a = vec![1, 2, 3]; // 321
        let b = vec![1, 2, 3]; // 321
        assert_eq!(compare_digits(&a, &b), Ordering::Equal);

        let a = vec![1, 2, 3]; // 321
        let b = vec![1, 2]; // 21
        assert_eq!(compare_digits(&a, &b), Ordering::Greater);

        let a = vec![1]; // 1
        let b = vec![9, 9]; // 99
        assert_eq!(compare_digits(&a, &b), Ordering::Less);
    }

    #[test]
    fn test_trim_leading_zeros() {
        let digits = vec![0, 0, 1, 2, 3, 0, 0];
        let trimmed = trim_leading_zeros(&digits);
        assert_eq!(trimmed, &[0, 0, 1, 2, 3]);
    }
}