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
  private wasmInitialized: boolean = false;

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
    // Initialize base hints
    setTimeout(() => {
      this.updateBaseHint('fromBase');
      this.updateBaseHint('toBase');
    }, 100);
  }

  private initializeEventListeners() {
    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const targetTab = (e.target as HTMLElement).getAttribute('data-tab') || 'benchmarks';
        this.switchTab(targetTab);
      });
    });

    // Benchmark tab
    const runAllButton = document.getElementById('runAllBenchmarks') as HTMLButtonElement;
    if (runAllButton) {
      runAllButton.addEventListener('click', () => this.runAllBenchmarks());
    }

    // Converter tab
    const convertBtn = document.getElementById('convertBtn') as HTMLButtonElement;
    const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
    const inputNumber = document.getElementById('inputNumber') as HTMLInputElement;
    const inputBase = document.getElementById('inputBase') as HTMLInputElement;
    const outputBase = document.getElementById('outputBase') as HTMLInputElement;

    if (convertBtn) convertBtn.addEventListener('click', () => this.performConversion());
    if (clearBtn) clearBtn.addEventListener('click', () => this.clearConversion());
    if (inputNumber) {
      inputNumber.addEventListener('input', () => this.performConversion());
      inputNumber.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.performConversion();
      });
    }
    if (inputBase) {
      inputBase.addEventListener('input', () => {
        this.updateBaseHint('fromBase');
        this.performConversion();
      });
      inputBase.addEventListener('change', () => {
        this.updateBaseHint('fromBase');
        this.performConversion();
      });
    }
    if (outputBase) {
      outputBase.addEventListener('input', () => {
        this.updateBaseHint('toBase');
        this.performConversion();
      });
      outputBase.addEventListener('change', () => {
        this.updateBaseHint('toBase');
        this.performConversion();
      });
    }

    // Quick preset buttons
    const presetButtons = document.querySelectorAll('.preset-quick-btn');
    presetButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const from = (e.target as HTMLElement).getAttribute('data-from') || '10';
        const to = (e.target as HTMLElement).getAttribute('data-to') || '16';
        const value = (e.target as HTMLElement).getAttribute('data-value') || '';
        this.applyPreset(from, to, value);
      });
    });
  }

  private switchTab(tabName: string) {
    // Update tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      const contentId = content.id;
      if (contentId === `${tabName}-tab`) {
        content.classList.remove('hidden');
      } else {
        content.classList.add('hidden');
      }
    });
  }

  private async ensureWasmInitialized() {
    if (!this.wasmInitialized) {
      await init();
      this.wasmInitialized = true;
    }
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
      await this.ensureWasmInitialized();

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

  private async performConversion() {
    const inputNumber = document.getElementById('inputNumber') as HTMLInputElement;
    const inputBase = document.getElementById('inputBase') as HTMLInputElement;
    const outputBase = document.getElementById('outputBase') as HTMLInputElement;
    const resultDisplay = document.getElementById('conversionResult');
    const conversionTimeDisplay = document.getElementById('conversionTimeDisplay');
    const error = document.getElementById('converterError');
    const algorithmInfo = document.getElementById('algorithmInfo');
    const strategyType = document.getElementById('strategyType');
    const conversionTime = document.getElementById('conversionTime');
    const digitsProcessed = document.getElementById('digitsProcessed');

    if (!inputNumber || !inputBase || !outputBase || !resultDisplay) return;

    const inputValue = inputNumber.value.trim();
    const fromBase = parseInt(inputBase.value);
    const toBase = parseInt(outputBase.value);

    // Clear previous errors
    if (error) error.classList.add('hidden');

    // Validation
    if (!inputValue) {
      resultDisplay.textContent = '-';
      if (conversionTimeDisplay) conversionTimeDisplay.textContent = '-';
      if (algorithmInfo) algorithmInfo.classList.add('hidden');
      return;
    }

    if (fromBase < 2 || fromBase > 65536 || toBase < 2 || toBase > 65536) {
      this.showConverterError('Base must be between 2 and 65536');
      return;
    }

    try {
      await this.ensureWasmInitialized();

      const startTime = performance.now();

      // Parse input to digits
      const inputDigits = this.stringToDigits(inputValue, fromBase);

      // Perform conversion
      const result = this.performBaseConversion(inputDigits, fromBase, toBase);
      const endTime = performance.now();

      // Format result
      const resultString = this.digitsToString(result);
      resultDisplay.textContent = resultString;

      // Show conversion time
      if (conversionTimeDisplay) {
        const timeElapsed = (endTime - startTime).toFixed(3);
        conversionTimeDisplay.textContent = `⏱️ ${timeElapsed} ms`;
        conversionTimeDisplay.style.color = timeElapsed === '0.000' ? '#9ca3af' : '#4f46e5';
      }

      // Show algorithm info
      if (algorithmInfo && strategyType && conversionTime && digitsProcessed) {
        algorithmInfo.classList.remove('hidden');

        // Determine strategy
        let strategy = 'General Division';
        if (this.isPowerOfTwo(fromBase) && this.isPowerOfTwo(toBase)) {
          strategy = 'Bit Operations';
        } else if (inputDigits.length <= 5 && fromBase === 10) {
          strategy = 'u128 Fast Path';
        } else if (this.areAlignedBases(fromBase, toBase)) {
          strategy = 'Aligned Bases';
        }

        strategyType.textContent = strategy;
        conversionTime.textContent = `${(endTime - startTime).toFixed(3)} ms`;
        digitsProcessed.textContent = inputDigits.length.toString();
      }

    } catch (err) {
      this.showConverterError(`Conversion error: ${err}`);
      resultDisplay.textContent = 'Error';
      if (conversionTimeDisplay) conversionTimeDisplay.textContent = '-';
    }
  }

  private clearConversion() {
    const inputNumber = document.getElementById('inputNumber') as HTMLInputElement;
    const resultDisplay = document.getElementById('conversionResult');
    const conversionTimeDisplay = document.getElementById('conversionTimeDisplay');
    const error = document.getElementById('converterError');
    const algorithmInfo = document.getElementById('algorithmInfo');

    if (inputNumber) inputNumber.value = '';
    if (resultDisplay) resultDisplay.textContent = '-';
    if (conversionTimeDisplay) conversionTimeDisplay.textContent = '-';
    if (error) error.classList.add('hidden');
    if (algorithmInfo) algorithmInfo.classList.add('hidden');
  }

  private applyPreset(fromBase: string, toBase: string, value: string) {
    const inputNumber = document.getElementById('inputNumber') as HTMLInputElement;
    const inputBase = document.getElementById('inputBase') as HTMLInputElement;
    const outputBase = document.getElementById('outputBase') as HTMLInputElement;

    if (inputNumber) inputNumber.value = value;
    if (inputBase) inputBase.value = fromBase;
    if (outputBase) outputBase.value = toBase;

    // Update base hints
    this.updateBaseHint('fromBase');
    this.updateBaseHint('toBase');

    // Auto convert
    this.performConversion();
  }

  private showConverterError(message: string) {
    const error = document.getElementById('converterError');
    if (error) {
      error.textContent = message;
      error.classList.remove('hidden');
    }
  }

  private updateBaseHint(baseType: 'fromBase' | 'toBase') {
    const input = document.getElementById(baseType) as HTMLInputElement;
    const hint = document.getElementById(baseType === 'fromBase' ? 'fromBaseHint' : 'toBaseHint');

    if (!input || !hint) {
      console.log(`Missing elements for ${baseType}`);
      return;
    }

    const base = parseInt(input.value) || 10;
    let hintText = '';

    if (base <= 10) {
      hintText = `Base ${base}: Use digits 0-${base - 1}`;
    } else if (base <= 36) {
      const maxDigit = this.getDigitRepresentation(base - 1);
      const examples = this.getBaseExamples(base, 'lower');
      hintText = `Base ${base}: Use 0-9, A-${maxDigit.toUpperCase()} ${examples}`;
    } else if (base <= 62) {
      const maxDigit = this.getDigitRepresentation(base - 1);
      const examples = this.getBaseExamples(base, 'mixed');
      hintText = `Base ${base}: Use 0-9, a-z, A-Z (35=${maxDigit}) ${examples}`;
    } else {
      const examples = this.getBaseExamples(base, 'mixed');
      hintText = `Base ${base}: Use digits [0-${base-1}] ${examples}`;
    }

    hint.textContent = hintText;
    console.log(`Updated ${baseType} hint for base ${base}: ${hintText}`);
  }

  private getDigitRepresentation(value: number): string {
    if (value < 10) return value.toString();
    if (value < 36) return String.fromCharCode(65 + value - 10); // A-Z
    return String.fromCharCode(97 + value - 36); // a-z
  }

  private getBaseExamples(base: number, _caseType: 'lower' | 'upper' | 'mixed'): string {
    const examples = [];

    // Common examples for different bases
    switch (base) {
      case 16:
        examples.push('(e.g., FF, 1A2B)');
        break;
      case 32:
        examples.push('(e.g., 1V, Z0)');
        break;
      case 36:
        examples.push('(e.g., Z, 1K2)');
        break;
      case 62:
        examples.push('(e.g., z, 1a, A0)');
        break;
      default:
        if (base <= 36) {
          const maxVal = Math.min(base - 1, 35);
          const digit1 = this.getDigitRepresentation(10);
          const digit2 = this.getDigitRepresentation(maxVal);
          examples.push(`(e.g., ${digit1}${digit2})`);
        } else {
          examples.push('(e.g., [10][35])');
        }
    }

    return examples.join(' ');
  }

  private stringToDigits(str: string, base: number): number[] {
    const digits: number[] = [];
    let num: bigint;

    try {
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
        // Convert based on the specified base
        num = this.parseNumberInBase(str, base);
      }
    } catch (err) {
      throw new Error(`Invalid number "${str}" for base ${base}`);
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

  private parseNumberInBase(str: string, base: number): bigint {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = 0n;

    for (let i = 0; i < str.length; i++) {
      const char = str[i].toLowerCase();
      const value = chars.indexOf(char);

      if (value === -1 || value >= base) {
        throw new Error(`Invalid digit "${char}" for base ${base}`);
      }

      result = result * BigInt(base) + BigInt(value);
    }

    return result;
  }

  private performBaseConversion(digits: number[], fromBase: number, toBase: number): Uint32Array {
    if (fromBase === toBase) {
      return new Uint32Array(digits);
    }

    // Convert digits to bigint value
    let value = 0n;
    for (let i = digits.length - 1; i >= 0; i--) {
      value = value * BigInt(fromBase) + BigInt(digits[i]);
    }

    // Convert bigint to target base digits
    if (value === 0n) {
      return new Uint32Array([0]);
    }

    const result: number[] = [];
    while (value > 0n) {
      result.push(Number(value % BigInt(toBase)));
      value = value / BigInt(toBase);
    }

    return new Uint32Array(result);
  }

  private digitsToString(digits: Uint32Array): string {
    if (digits.length === 0) return '0';
    if (digits.length === 1 && digits[0] === 0) return '0';

    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';

    for (let i = digits.length - 1; i >= 0; i--) {
      const digit = digits[i];
      if (digit < 10) {
        result += digit.toString();
      } else if (digit < 36) {
        result += chars[digit];
      } else {
        result += `[${digit}]`;
      }
    }

    return result;
  }

  private isPowerOfTwo(n: number): boolean {
    return n > 0 && (n & (n - 1)) === 0;
  }

  private areAlignedBases(base1: number, base2: number): boolean {
    const commonAlignments = [
      [4, 16], [8, 64], [16, 256], [3, 27], [9, 81],
      [16, 4], [64, 8], [256, 16], [27, 3], [81, 9]
    ];

    return commonAlignments.some(([a, b]) =>
      (a === base1 && b === base2) || (a === base2 && b === base1)
    );
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new BenchmarkApp();
});