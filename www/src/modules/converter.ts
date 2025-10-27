import { ConversionUtils } from './utils';

/**
 * Converter Module - Handles base number conversions
 */
export class Converter {
    private inputNumberEl: HTMLInputElement;
    private inputBaseEl: HTMLInputElement;
    private outputBaseEl: HTMLInputElement;
    private resultDisplayEl: HTMLElement;
    private conversionTimeDisplayEl: HTMLElement | null;
    private errorEl: HTMLElement;
    private algorithmInfoEl: HTMLElement;

    constructor() {
        this.inputNumberEl = document.getElementById('inputNumber') as HTMLInputElement;
        this.inputBaseEl = document.getElementById('inputBase') as HTMLInputElement;
        this.outputBaseEl = document.getElementById('outputBase') as HTMLInputElement;
        this.resultDisplayEl = document.getElementById('conversionResult') as HTMLElement;
        this.conversionTimeDisplayEl = document.getElementById('conversionTimeDisplay');
        this.errorEl = document.getElementById('converterError') as HTMLElement;
        this.algorithmInfoEl = document.getElementById('algorithmInfo') as HTMLElement;

        this.initializeEventListeners();
    }

    private initializeEventListeners() {
        const convertBtn = document.getElementById('convertBtn') as HTMLButtonElement;
        const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;

        if (convertBtn) convertBtn.addEventListener('click', () => this.performConversion());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clear());

        if (this.inputNumberEl) {
            this.inputNumberEl.addEventListener('input', () => this.performConversion());
            this.inputNumberEl.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performConversion();
            });
        }

        if (this.inputBaseEl) {
            this.inputBaseEl.addEventListener('input', () => {
                this.updateBaseHint('fromBase');
                this.performConversion();
            });
            this.inputBaseEl.addEventListener('change', () => {
                this.updateBaseHint('fromBase');
                this.performConversion();
            });
        }

        if (this.outputBaseEl) {
            this.outputBaseEl.addEventListener('input', () => {
                this.updateBaseHint('toBase');
                this.performConversion();
            });
            this.outputBaseEl.addEventListener('change', () => {
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

    performConversion() {
        const inputValue = this.inputNumberEl.value.trim();
        const fromBase = parseInt(this.inputBaseEl.value);
        const toBase = parseInt(this.outputBaseEl.value);

        this.errorEl.classList.add('hidden');

        if (!inputValue) {
            this.resultDisplayEl.textContent = '-';
            if (this.conversionTimeDisplayEl) this.conversionTimeDisplayEl.textContent = '-';
            this.algorithmInfoEl.classList.add('hidden');
            return;
        }

        if (fromBase < 2 || fromBase > 65536 || toBase < 2 || toBase > 65536) {
            this.showError('Base must be between 2 and 65536');
            return;
        }

        try {
            const startTime = performance.now();

            const inputDigits = ConversionUtils.stringToDigits(inputValue, fromBase);
            const result = ConversionUtils.performBaseConversion(inputDigits, fromBase, toBase);
            const endTime = performance.now();

            const resultString = ConversionUtils.digitsToString(result);
            this.resultDisplayEl.textContent = resultString;

            if (this.conversionTimeDisplayEl) {
                const timeElapsed = (endTime - startTime).toFixed(3);
                this.conversionTimeDisplayEl.textContent = `⏱️ ${timeElapsed} ms`;
                this.conversionTimeDisplayEl.style.color = timeElapsed === '0.000' ? '#9ca3af' : '#4f46e5';
            }

            this.displayAlgorithmInfo(inputDigits, fromBase, toBase, endTime - startTime);

        } catch (err) {
            this.showError(`Conversion error: ${err}`);
            this.resultDisplayEl.textContent = 'Error';
            if (this.conversionTimeDisplayEl) this.conversionTimeDisplayEl.textContent = '-';
        }
    }

    private displayAlgorithmInfo(inputDigits: number[], fromBase: number, toBase: number, time: number) {
        const strategyTypeEl = document.getElementById('strategyType');
        const conversionTimeEl = document.getElementById('conversionTime');
        const digitsProcessedEl = document.getElementById('digitsProcessed');

        if (!strategyTypeEl || !conversionTimeEl || !digitsProcessedEl) return;

        const strategy = ConversionUtils.determineStrategy(fromBase, toBase, inputDigits.length);
        strategyTypeEl.textContent = strategy;
        conversionTimeEl.textContent = `${time.toFixed(3)} ms`;
        digitsProcessedEl.textContent = inputDigits.length.toString();

        this.algorithmInfoEl.classList.remove('hidden');
    }

    updateBaseHint(baseType: 'fromBase' | 'toBase') {
        const inputId = baseType === 'fromBase' ? 'inputBase' : 'outputBase';
        const hintId = baseType === 'fromBase' ? 'fromBaseHint' : 'toBaseHint';

        const input = document.getElementById(inputId) as HTMLInputElement;
        const hint = document.getElementById(hintId);

        if (!input || !hint) return;

        const base = parseInt(input.value) || 10;
        let hintText = '';

        if (base <= 10) {
            hintText = `Base ${base}: Use digits 0-${base - 1}`;
        } else if (base <= 36) {
            const maxDigit = ConversionUtils.getDigitRepresentation(base - 1);
            const examples = ConversionUtils.getBaseExamples(base, 'upper');
            hintText = `Base ${base}: Use 0-9, A-${maxDigit} ${examples}`;
        } else if (base <= 62) {
            const maxDigit = ConversionUtils.getDigitRepresentation(base - 1);
            const examples = ConversionUtils.getBaseExamples(base, 'upper');
            hintText = `Base ${base}: Use 0-9, A-Z, a-z (61=${maxDigit}) ${examples}`;
        } else {
            const examples = ConversionUtils.getBaseExamples(base, 'mixed');
            hintText = `Base ${base}: Use digits [0-${base - 1}] ${examples}`;
        }

        hint.textContent = hintText;
    }

    private applyPreset(fromBase: string, toBase: string, value: string) {
        this.inputNumberEl.value = value;
        this.inputBaseEl.value = fromBase;
        this.outputBaseEl.value = toBase;

        this.updateBaseHint('fromBase');
        this.updateBaseHint('toBase');

        this.performConversion();
    }

    private showError(message: string) {
        this.errorEl.textContent = message;
        this.errorEl.classList.remove('hidden');
    }

    private clear() {
        this.inputNumberEl.value = '';
        this.resultDisplayEl.textContent = '-';
        if (this.conversionTimeDisplayEl) this.conversionTimeDisplayEl.textContent = '-';
        this.errorEl.classList.add('hidden');
        this.algorithmInfoEl.classList.add('hidden');
    }
}
