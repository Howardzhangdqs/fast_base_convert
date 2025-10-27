import init, { run_quick_benchmark } from '../../pkg/fast_base_convert.js';

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

/**
 * Benchmark Module - Runs performance benchmarks
 */
export class Benchmarker {
    private wasmInitialized: boolean = false;

    private benchmarkTests: TestCase[] = [
        {
            name: "Small Number",
            type: "small-number",
            description: "12345 (10→16)",
            iterations: 9000000,
            inputDigits: [5, 4, 3, 2, 1],
            fromBase: 10,
            toBase: 16
        },
        {
            name: "Power of Two",
            type: "power-of-two",
            description: "65535 (16→8)",
            iterations: 6000000,
            inputDigits: [15, 15, 15, 15],
            fromBase: 16,
            toBase: 8
        },
        {
            name: "Aligned Bases",
            type: "aligned-bases",
            description: "123 (4→16)",
            iterations: 15000000,
            inputDigits: [3, 2, 1, 0],
            fromBase: 4,
            toBase: 16
        },
        {
            name: "Large Number",
            type: "large-number",
            description: "10^100 (10→16)",
            iterations: 2000000,
            inputDigits: Array(101).fill(0).map((_, i) => i === 0 ? 1 : 0),
            fromBase: 10,
            toBase: 16
        },
        {
            name: "Binary to Hex",
            type: "power-of-two",
            description: "10101010 (2→16)",
            iterations: 12000000,
            inputDigits: [0, 1, 0, 1, 0, 1, 0, 1],
            fromBase: 2,
            toBase: 16
        },
        {
            name: "Hex to Decimal",
            type: "general",
            description: "FF2541 (16→10)",
            iterations: 2500000,
            inputDigits: [1, 4, 5, 2, 5, 2, 15, 15],
            fromBase: 16,
            toBase: 10
        },
        {
            name: "Base 32 to 64",
            type: "power-of-two",
            description: "AZBYCX (32→64)",
            iterations: 5000000,
            inputDigits: [24, 2, 27, 1, 24, 2],
            fromBase: 32,
            toBase: 64
        },
        {
            name: "Octal to Binary",
            type: "power-of-two",
            description: "755 (8→2)",
            iterations: 4000000,
            inputDigits: [5, 5, 7],
            fromBase: 8,
            toBase: 2
        }
    ];

    private loadingEl: HTMLElement;
    private resultsTableEl: HTMLElement;
    private errorEl: HTMLElement;
    private tableBodyEl: HTMLElement;
    private summaryStatsEl: HTMLElement;
    private loadingTextEl: HTMLElement;

    constructor() {
        this.loadingEl = document.getElementById('loading') as HTMLElement;
        this.resultsTableEl = document.getElementById('resultsTable') as HTMLElement;
        this.errorEl = document.getElementById('error') as HTMLElement;
        this.tableBodyEl = document.getElementById('tableBody') as HTMLElement;
        this.summaryStatsEl = document.getElementById('summaryStats') as HTMLElement;
        this.loadingTextEl = document.getElementById('loadingText') as HTMLElement;

        this.initializeEventListeners();
    }

    private initializeEventListeners() {
        const runButton = document.getElementById('runAllBenchmarks') as HTMLButtonElement;
        if (runButton) {
            runButton.addEventListener('click', () => this.runAll());
        }
    }

    private async ensureWasmInitialized() {
        if (!this.wasmInitialized) {
            await init();
            this.wasmInitialized = true;
        }
    }

    async runAll() {
        this.resultsTableEl.classList.add('hidden');
        this.errorEl.classList.add('hidden');
        this.loadingEl.classList.remove('hidden');

        const runButton = document.getElementById('runAllBenchmarks') as HTMLButtonElement;
        if (runButton) runButton.disabled = true;

        try {
            await this.ensureWasmInitialized();

            const results: Array<TestCase & BenchmarkResult> = [];

            this.resultsTableEl.classList.remove('hidden');
            this.tableBodyEl.innerHTML = '';

            const summarySection = this.resultsTableEl.querySelector('.summary-section') as HTMLElement;
            if (summarySection) {
                summarySection.style.display = 'none';
            }

            for (let i = 0; i < this.benchmarkTests.length; i++) {
                const testCase = this.benchmarkTests[i];

                if (this.loadingTextEl) {
                    this.loadingTextEl.textContent = `Running ${testCase.name}... (${i + 1}/${this.benchmarkTests.length})`;
                }

                let result: BenchmarkResult;

                try {
                    result = await run_quick_benchmark(
                        testCase.type,
                        testCase.iterations,
                        new Uint32Array(testCase.inputDigits),
                        testCase.fromBase,
                        testCase.toBase
                    );
                } catch (err) {
                    console.error(`Error in ${testCase.name}:`, err);
                    result = {
                        baseline_time: 0,
                        optimized_time: 0,
                        speedup: 0,
                        baseline_result: [],
                        optimized_result: [],
                        is_correct: false
                    };
                }

                const testResult = {
                    ...testCase,
                    ...result
                };

                results.push(testResult);
                this.addResultToTable(testResult);

                await new Promise(resolve => setTimeout(resolve, 100));
            }

            this.displaySummary(results);

        } catch (err) {
            console.error('Benchmark error:', err);
            this.errorEl.textContent = `Error: ${err}`;
            this.errorEl.classList.remove('hidden');
        } finally {
            this.loadingEl.classList.add('hidden');
            if (runButton) runButton.disabled = false;
        }
    }

    private addResultToTable(result: TestCase & BenchmarkResult) {
        const row = document.createElement('tr');
        row.innerHTML = `
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
    `;

        row.style.opacity = '0';
        row.style.transform = 'translateY(-10px)';
        this.tableBodyEl.appendChild(row);

        requestAnimationFrame(() => {
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        });
    }

    private displaySummary(results: Array<TestCase & BenchmarkResult>) {
        const avgSpeedup = results.reduce((sum, r) => sum + r.speedup, 0) / results.length;
        const maxSpeedup = Math.max(...results.map(r => r.speedup));
        const correctTests = results.filter(r => r.is_correct).length;
        const totalBaselineTime = results.reduce((sum, r) => sum + r.baseline_time, 0);
        const totalOptimizedTime = results.reduce((sum, r) => sum + r.optimized_time, 0);

        this.summaryStatsEl.innerHTML = `
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

        const summarySection = this.summaryStatsEl.closest('.summary-section') as HTMLElement;
        if (summarySection) {
            summarySection.style.display = 'block';
            summarySection.style.opacity = '0';
            summarySection.style.transform = 'translateY(20px)';

            requestAnimationFrame(() => {
                summarySection.style.transition = 'all 0.5s ease';
                summarySection.style.opacity = '1';
                summarySection.style.transform = 'translateY(0)';
            });
        }
    }
}
