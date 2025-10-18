import init, { run_quick_benchmark } from '../pkg/fast_base_convert.js';

interface BenchmarkResult {
  baseline_time: number;
  optimized_time: number;
  speedup: number;
  baseline_result: number[];
  optimized_result: number[];
  is_correct: boolean;
}

class BenchmarkApp {
  private currentPreset: string = 'small';

  constructor() {
    this.initializeEventListeners();
  }

  private initializeEventListeners() {
    const runButton = document.getElementById('runBenchmark') as HTMLButtonElement;
    const presetButtons = document.querySelectorAll('.preset-btn');

    runButton.addEventListener('click', () => this.runBenchmark());

    presetButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        presetButtons.forEach(btn => btn.classList.remove('active'));
        (e.target as HTMLElement).classList.add('active');
        this.currentPreset = (e.target as HTMLElement).dataset.preset || 'custom';
        this.loadPreset(this.currentPreset);
      });
    });
  }

  private loadPreset(preset: string) {
    const iterations = document.getElementById('iterations') as HTMLInputElement;
    const fromBase = document.getElementById('fromBase') as HTMLInputElement;
    const toBase = document.getElementById('toBase') as HTMLInputElement;
    const inputNumber = document.getElementById('inputNumber') as HTMLInputElement;

    switch (preset) {
      case 'small':
        iterations.value = '100000';
        fromBase.value = '10';
        toBase.value = '16';
        inputNumber.value = '12345';
        break;
      case 'power2':
        iterations.value = '1000000';
        fromBase.value = '16';
        toBase.value = '8';
        inputNumber.value = '65535'; // 0xFFFF in hex, which is 1111111111111111 in binary
        break;
      case 'aligned':
        iterations.value = '200000';
        fromBase.value = '4';
        toBase.value = '16';
        inputNumber.value = '123';
        break;
      case 'large':
        iterations.value = '10000';
        fromBase.value = '10';
        toBase.value = '16';
        inputNumber.value = '1' + '0'.repeat(100); // 10^100
        break;
    }
  }

  private async runBenchmark() {
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const error = document.getElementById('error');
    const runButton = document.getElementById('runBenchmark') as HTMLButtonElement;

    // Hide previous results and errors
    loading!.style.display = 'block';
    results!.style.display = 'none';
    error!.style.display = 'none';
    runButton.disabled = true;

    try {
      // Get input values
      const iterations = parseInt((document.getElementById('iterations') as HTMLInputElement).value);
      const fromBase = parseInt((document.getElementById('fromBase') as HTMLInputElement).value);
      const toBase = parseInt((document.getElementById('toBase') as HTMLInputElement).value);
      const inputStr = (document.getElementById('inputNumber') as HTMLInputElement).value;

      // Convert string to digits
      const inputDigits = this.stringToDigits(inputStr, fromBase);

      // Determine test type
      let testType = 'custom';
      if (this.currentPreset !== 'custom') {
        testType = this.currentPreset;
      } else {
        if (this.isPowerOfTwo(fromBase) && this.isPowerOfTwo(toBase)) {
          testType = 'power-of-two';
        } else if (inputDigits.length <= 5 && fromBase === 10) {
          testType = 'small-number';
        } else if (this.areAlignedBases(fromBase, toBase)) {
          testType = 'aligned-bases';
        } else {
          testType = 'general-case';
        }
      }

      // Run benchmark
      const result = await this.performBenchmark(testType, iterations, new Uint32Array(inputDigits), fromBase, toBase);

      // Display results
      this.displayResults(result, testType);
      this.updateChart(result);

    } catch (err) {
      console.error('Benchmark error:', err);
      error!.textContent = `Error: ${err}`;
      error!.style.display = 'block';
    } finally {
      loading!.style.display = 'none';
      runButton.disabled = false;
    }
  }

  private async performBenchmark(
    testType: string,
    iterations: number,
    inputDigits: Uint32Array,
    fromBase: number,
    toBase: number
  ): Promise<BenchmarkResult> {
    // Warm up
    await init();

    // Create and run benchmark
    const result = await run_quick_benchmark(
      testType,
      iterations,
      inputDigits,
      fromBase,
      toBase
    );

    return result as BenchmarkResult;
  }

  private stringToDigits(str: string, base: number): number[] {
    const digits: number[] = [];
    let num: bigint;

    // Handle different number formats
    if (str.startsWith('0x') || str.startsWith('0X')) {
      // Hexadecimal
      num = BigInt(str);
    } else if (str.startsWith('0b') || str.startsWith('0B')) {
      // Binary
      num = BigInt(str);
    } else if (str.startsWith('0o') || str.startsWith('0O')) {
      // Octal
      num = BigInt(str);
    } else {
      // Decimal
      num = BigInt(str);
    }

    if (num === 0n) {
      return [0];
    }

    while (num > 0n) {
      digits.push(Number(num % BigInt(base)));
      num = num / BigInt(base);
    }

    return digits;
  }

  private isPowerOfTwo(n: number): boolean {
    return n > 0 && (n & (n - 1)) === 0;
  }

  private areAlignedBases(base1: number, base2: number): boolean {
    // Simple check for common aligned bases
    const commonAlignments = [
      [4, 16], [8, 64], [16, 256], [3, 27], [9, 81],
      [16, 4], [64, 8], [256, 16], [27, 3], [81, 9]
    ];

    return commonAlignments.some(([a, b]) =>
      (a === base1 && b === base2) || (a === base2 && b === base1)
    );
  }

  private displayResults(result: BenchmarkResult, testType: string) {
    const results = document.getElementById('results')!;
    results.style.display = 'grid';

    document.getElementById('baselineTime')!.textContent = `${result.baseline_time.toFixed(2)} ms`;
    document.getElementById('optimizedTime')!.textContent = `${result.optimized_time.toFixed(2)} ms`;
    document.getElementById('testType')!.textContent = testType;
    document.getElementById('inputDigits')!.textContent = result.baseline_result.length + ' digits';

    const correctnessEl = document.getElementById('correctness')!;
    correctnessEl.textContent = result.is_correct ? '✓ Correct' : '✗ Incorrect';
    correctnessEl.style.color = result.is_correct ? '#4caf50' : '#f44336';

    const speedupEl = document.getElementById('speedup')!;
    speedupEl.textContent = `${result.speedup.toFixed(2)}× speedup`;
    speedupEl.className = `speedup ${result.speedup > 1 ? 'positive' : 'negative'}`;
  }

  private updateChart(result: BenchmarkResult) {
    const chartCard = document.getElementById('chartCard')!;
    chartCard.style.display = 'block';

    // Find the chart container safely
    const chartContainer = document.getElementById('chartContainer');
    if (!chartContainer) return;

    // Simple bar chart using CSS
    const baselineHeight = (result.baseline_time / Math.max(result.baseline_time, result.optimized_time)) * 250;
    const optimizedHeight = (result.optimized_time / Math.max(result.baseline_time, result.optimized_time)) * 250;

    chartContainer.innerHTML = `
      <div style="display: flex; justify-content: space-around; align-items: flex-end; height: 300px; padding: 20px;">
        <div style="text-align: center;">
          <div style="background: #667eea; width: 100px; height: ${baselineHeight}px; margin-bottom: 10px; border-radius: 4px 4px 0 0; transition: height 0.3s ease;"></div>
          <div style="font-weight: 600; color: #333;">Baseline</div>
          <div style="font-weight: bold; color: #667eea;">${result.baseline_time.toFixed(2)} ms</div>
        </div>
        <div style="text-align: center;">
          <div style="background: #4caf50; width: 100px; height: ${optimizedHeight}px; margin-bottom: 10px; border-radius: 4px 4px 0 0; transition: height 0.3s ease;"></div>
          <div style="font-weight: 600; color: #333;">Optimized</div>
          <div style="font-weight: bold; color: #4caf50;">${result.optimized_time.toFixed(2)} ms</div>
        </div>
      </div>
    `;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new BenchmarkApp();
});