import init, { run_quick_benchmark } from '../pkg/fast_base_convert.js';

interface BenchmarkResult {
  baseline_time: number;
  optimized_time: number;
  speedup: number;
  baseline_result: number[];
  optimized_result: number[];
  is_correct: boolean;
}

interface TestCase {
  name: string;
  type: string;
  description: string;
  iterations: number;
  inputDigits: number[];
  fromBase: number;
  toBase: number;
}

class BenchmarkApp {
  private benchmarkTests: TestCase[] = [
    {
      name: "Small Number",
      type: "small-number",
      description: "12345 (10→16)",
      iterations: 100000,
      inputDigits: [5, 4, 3, 2, 1],
      fromBase: 10,
      toBase: 16
    },
    {
      name: "Power of Two",
      type: "power-of-two",
      description: "65535 (16→8)",
      iterations: 1000000,
      inputDigits: [15, 15, 15, 15],
      fromBase: 16,
      toBase: 8
    },
    {
      name: "Aligned Bases",
      type: "aligned-bases",
      description: "123 (4→16)",
      iterations: 200000,
      inputDigits: [3, 2, 1, 0],
      fromBase: 4,
      toBase: 16
    },
    {
      name: "Large Number",
      type: "large-number",
      description: "10^100 (10→16)",
      iterations: 10000,
      inputDigits: Array(101).fill(0).map((_, i) => i === 0 ? 1 : 0),
      fromBase: 10,
      toBase: 16
    },
    {
      name: "Binary to Hex",
      type: "power-of-two",
      description: "10101010 (2→16)",
      iterations: 500000,
      inputDigits: [0, 1, 0, 1, 0, 1, 0, 1],
      fromBase: 2,
      toBase: 16
    },
    {
      name: "Hex to Decimal",
      type: "general",
      description: "FF2541 (16→10)",
      iterations: 80000,
      inputDigits: [1, 4, 5, 2, 5, 2, 15, 15],
      fromBase: 16,
      toBase: 10
    },
    {
      name: "Base 32 to 64",
      type: "power-of-two",
      description: "AZBYCX (32→64)",
      iterations: 300000,
      inputDigits: [24, 2, 27, 1, 24, 2],
      fromBase: 32,
      toBase: 64
    },
    {
      name: "Octal to Binary",
      type: "power-of-two",
      description: "755 (8→2)",
      iterations: 400000,
      inputDigits: [5, 5, 7],
      fromBase: 8,
      toBase: 2
    }
  ];

  constructor() {
    this.initializeEventListeners();
  }

  private initializeEventListeners() {
    const runAllButton = document.getElementById('runAllBenchmarks') as HTMLButtonElement;
    runAllButton.addEventListener('click', () => this.runAllBenchmarks());
  }

  private async runAllBenchmarks() {
    const loading = document.getElementById('loading');
    const resultsTable = document.getElementById('resultsTable');
    const error = document.getElementById('error');
    const runButton = document.getElementById('runAllBenchmarks') as HTMLButtonElement;
    const loadingText = document.getElementById('loadingText');

    // Hide previous results and errors
    if (resultsTable) resultsTable.classList.add('hidden');
    if (error) error.classList.add('hidden');
    if (loading) loading.classList.remove('hidden');
    if (runButton) runButton.disabled = true;

    try {
      // Initialize WASM
      await init();

      const results: Array<TestCase & BenchmarkResult> = [];

      // Run all benchmarks sequentially
      for (let i = 0; i < this.benchmarkTests.length; i++) {
        const testCase = this.benchmarkTests[i];

        // Update loading text
        if (loadingText) {
          loadingText.textContent = `Running ${testCase.name}... (${i + 1}/${this.benchmarkTests.length})`;
        }

        try {
          const result = await run_quick_benchmark(
            testCase.type,
            testCase.iterations,
            new Uint32Array(testCase.inputDigits),
            testCase.fromBase,
            testCase.toBase
          );

          results.push({
            ...testCase,
            ...result
          });
        } catch (err) {
          console.error(`Error in ${testCase.name}:`, err);
          results.push({
            ...testCase,
            baseline_time: 0,
            optimized_time: 0,
            speedup: 0,
            baseline_result: [],
            optimized_result: [],
            is_correct: false
          });
        }

        // Small delay for UI update
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Display results
      this.displayResultsTable(results);
      this.displaySummary(results);

    } catch (err) {
      console.error('Benchmark error:', err);
      if (error) {
        error.textContent = `Error: ${err}`;
        error.classList.remove('hidden');
      }
    } finally {
      if (loading) loading.classList.add('hidden');
      if (runButton) runButton.disabled = false;
    }
  }

  private displayResultsTable(results: Array<TestCase & BenchmarkResult>) {
    const tableBody = document.getElementById('tableBody');
    const resultsTable = document.getElementById('resultsTable');

    if (!tableBody || !resultsTable) return;

    resultsTable.classList.remove('hidden');

    tableBody.innerHTML = results.map(result => `
      <tr>
        <td class="test-name">${result.name}</td>
        <td>
          <span class="test-type type-${result.type}">${result.type}</span>
        </td>
        <td>${result.baseline_time.toFixed(2)}</td>
        <td>${result.optimized_time.toFixed(2)}</td>
        <td>
          <span class="speedup-value ${result.speedup > 1 ? 'speedup-positive' : 'speedup-negative'}">
            ${result.speedup.toFixed(2)}×
          </span>
        </td>
        <td class="${result.is_correct ? 'status-correct' : 'status-incorrect'}">
          ${result.is_correct ? '✓ Correct' : '✗ Incorrect'}
        </td>
      </tr>
    `).join('');
  }

  private displaySummary(results: Array<TestCase & BenchmarkResult>) {
    const summaryStats = document.getElementById('summaryStats');
    if (!summaryStats) return;

    const avgSpeedup = results.reduce((sum, r) => sum + r.speedup, 0) / results.length;
    const maxSpeedup = Math.max(...results.map(r => r.speedup));
    const correctTests = results.filter(r => r.is_correct).length;
    const totalBaselineTime = results.reduce((sum, r) => sum + r.baseline_time, 0);
    const totalOptimizedTime = results.reduce((sum, r) => sum + r.optimized_time, 0);

    summaryStats.innerHTML = `
      <div class="summary-card">
        <div class="summary-value">${avgSpeedup.toFixed(2)}×</div>
        <div class="summary-label">Avg Speedup</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${maxSpeedup.toFixed(2)}×</div>
        <div class="summary-label">Best Speedup</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${correctTests}/${results.length}</div>
        <div class="summary-label">Tests Passed</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${((totalOptimizedTime / totalBaselineTime) * 100).toFixed(1)}%</div>
        <div class="summary-label">Time Saved</div>
      </div>
    `;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new BenchmarkApp();
});