/// Perform base conversion using simple division algorithm
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

    let mut current = digits.to_vec();
    let mut result = Vec::new();

    while !current.is_empty() && !(current.len() == 1 && current[0] == 0) {
        let mut carry = 0u64;
        let mut next_current = Vec::new();

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_same_base() {
        let input = vec![1, 2, 3];
        let output = convert_base(&input, 10, 10);
        assert_eq!(output, input);
    }

    #[test]
    fn test_zero() {
        let input = vec![0];
        let output = convert_base(&input, 10, 2);
        assert_eq!(output, vec![0]);
    }

    #[test]
    fn test_simple_case() {
        let input = vec![5, 5, 2]; // 255 in base 10
        let output = convert_base(&input, 10, 16);
        assert_eq!(output, vec![15, 15]); // 0xFF in base 16
    }

    #[test]
    fn test_binary_conversion() {
        let input = vec![3, 1]; // 13 in base 10
        let output = convert_base(&input, 10, 2);
        assert_eq!(output, vec![1, 0, 1, 1]); // 1101 in binary
    }

    #[test]
    fn test_reverse_conversion() {
        let input = vec![1, 0, 1, 1]; // 1101 in binary = 13
        let output = convert_base(&input, 2, 10);
        assert_eq!(output, vec![3, 1]); // 13 in base 10
    }

    #[test]
    fn test_large_number() {
        let input = vec![9, 9, 9, 9, 9]; // 99999 in base 10
        let output = convert_base(&input, 10, 16);
        assert_eq!(output, vec![15, 9, 6, 8, 1]); // 0x1869F
    }

    #[test]
    fn test_invalid_digit() {
        let input = vec![10]; // Invalid digit for base 10
        assert!(std::panic::catch_unwind(|| convert_base(&input, 10, 2)).is_err());
    }

    #[test]
    fn test_empty_input() {
        let input = vec![];
        let output = convert_base(&input, 10, 2);
        assert_eq!(output, vec![0]);
    }
}