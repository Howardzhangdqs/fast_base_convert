pub mod baseline;
pub mod optimized;
pub mod utils;

pub use baseline::convert_base as convert_base_baseline;
pub use optimized::convert_base;
pub use utils::*;

/// Convenience function that automatically chooses the best algorithm
pub fn convert_base_auto(digits: &[u64], from_base: u64, to_base: u64) -> Vec<u64> {
    convert_base(digits, from_base, to_base)
}

// WASM module
#[cfg(target_arch = "wasm32")]
pub mod wasm;

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        let result = 2 + 2;
        assert_eq!(result, 4);
    }
}