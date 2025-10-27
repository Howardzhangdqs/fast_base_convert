use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use crate::{convert_base, convert_base_baseline};

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// A macro to provide `println!(..)`-style syntax for `console.log` logging.
macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, fast-base-convert!");
}

#[derive(Serialize, Deserialize)]
pub struct BenchmarkConfig {
    pub test_type: String,
    pub iterations: u32,
    pub input_digits: Vec<u64>,
    pub from_base: u64,
    pub to_base: u64,
}

#[derive(Serialize, Deserialize)]
pub struct BenchmarkResult {
    pub baseline_time: f64,
    pub optimized_time: f64,
    pub speedup: f64,
    pub baseline_result: Vec<u64>,
    pub optimized_result: Vec<u64>,
    pub is_correct: bool,
}

#[wasm_bindgen]
pub struct BenchmarkRunner {
    config: BenchmarkConfig,
}

#[wasm_bindgen]
impl BenchmarkRunner {
    #[wasm_bindgen(constructor)]
    pub fn new(
        test_type: String,
        iterations: u32,
        input_digits: Vec<u32>,
        from_base: u32,
        to_base: u32,
    ) -> BenchmarkRunner {
        // Convert Vec<u32> to Vec<u64> for WASM compatibility
        let input_digits_64: Vec<u64> = input_digits.into_iter().map(|x| x as u64).collect();

        BenchmarkRunner {
            config: BenchmarkConfig {
                test_type,
                iterations,
                input_digits: input_digits_64,
                from_base: from_base as u64,
                to_base: to_base as u64,
            },
        }
    }

    #[wasm_bindgen]
    pub fn run_benchmark(&self) -> JsValue {
        let window = web_sys::window().unwrap();
        let performance = window.performance().unwrap();

        // Run baseline
        let start_baseline = performance.now();
        for _ in 0..self.config.iterations {
            let _ = convert_base_baseline(
                &self.config.input_digits,
                self.config.from_base,
                self.config.to_base,
            );
        }
        let baseline_time = performance.now() - start_baseline;

        // Run optimized
        let start_optimized = performance.now();
        for _ in 0..self.config.iterations {
            let _ = convert_base(
                &self.config.input_digits,
                self.config.from_base,
                self.config.to_base,
            );
        }
        let optimized_time = performance.now() - start_optimized;

        // Get results for verification
        let baseline_result = convert_base_baseline(
            &self.config.input_digits,
            self.config.from_base,
            self.config.to_base,
        );
        let optimized_result = convert_base(
            &self.config.input_digits,
            self.config.from_base,
            self.config.to_base,
        );

        // Check correctness
        let is_correct = baseline_result == optimized_result;

        // Calculate speedup
        let speedup = if optimized_time > 0.0 {
            baseline_time / optimized_time
        } else {
            1.0
        };

        let result = BenchmarkResult {
            baseline_time,
            optimized_time,
            speedup,
            baseline_result,
            optimized_result,
            is_correct,
        };

        serde_wasm_bindgen::to_value(&result).unwrap()
    }
}

#[wasm_bindgen]
pub fn run_quick_benchmark(
    test_type: String,
    iterations: u32,
    input_digits: Vec<u32>,
    from_base: u32,
    to_base: u32,
) -> JsValue {
    let runner = BenchmarkRunner::new(test_type, iterations, input_digits, from_base, to_base);
    runner.run_benchmark()
}

// Set panic hook for better error messages in browser
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}