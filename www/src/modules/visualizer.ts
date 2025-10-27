/**
 * Visualizer Module - Visualizes number representations in different formats
 */
export class Visualizer {
    private vizInputValueEl: HTMLInputElement;
    private vizInputTypeEl: HTMLSelectElement;
    private vizErrorEl: HTMLElement;
    private vizResultsEl: HTMLElement;

    constructor() {
        this.vizInputValueEl = document.getElementById('vizInputValue') as HTMLInputElement;
        this.vizInputTypeEl = document.getElementById('vizInputType') as HTMLSelectElement;
        this.vizErrorEl = document.getElementById('vizError') as HTMLElement;
        this.vizResultsEl = document.getElementById('vizResults') as HTMLElement;

        this.initializeEventListeners();
    }

    private initializeEventListeners() {
        const visualizeBtn = document.getElementById('visualizeBtn') as HTMLButtonElement;
        const vizClearBtn = document.getElementById('vizClearBtn') as HTMLButtonElement;

        if (visualizeBtn) visualizeBtn.addEventListener('click', () => this.performVisualization());
        if (vizClearBtn) vizClearBtn.addEventListener('click', () => this.clear());

        if (this.vizInputValueEl) {
            this.vizInputValueEl.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performVisualization();
            });
        }
    }

    private performVisualization() {
        const inputValue = this.vizInputValueEl.value.trim();
        const inputType = this.vizInputTypeEl.value;

        this.vizErrorEl.classList.add('hidden');

        if (!inputValue) {
            this.showError('Please enter a value');
            return;
        }

        try {
            let numValue: number;

            switch (inputType) {
                case 'hex':
                    numValue = parseInt(inputValue, 16);
                    break;
                case 'binary':
                    numValue = parseInt(inputValue, 2);
                    break;
                case 'octal':
                    numValue = parseInt(inputValue, 8);
                    break;
                default:
                    numValue = parseFloat(inputValue);
                    break;
            }

            if (isNaN(numValue)) {
                this.showError('Invalid number format');
                return;
            }

            this.visualizeInteger(numValue);
            this.visualizeFloatingPoint(numValue);
            this.visualizeQFormat(numValue);
            this.visualizeHex(numValue);

            this.vizResultsEl.classList.remove('hidden');

        } catch (err) {
            this.showError(`Error: ${err}`);
        }
    }

    private visualizeInteger(value: number) {
        const int4 = this.toSignedInt(value, 4);
        this.setElementText('int4Value', int4.toString());
        const int4Bits = (int4 & 0xF).toString(2).padStart(4, '0');
        const int4Labels = ['S', 'V', 'V', 'V'];
        this.renderBitTable('int4Bits', int4Bits, int4Labels);

        const int8 = this.toSignedInt(value, 8);
        this.setElementText('int8Value', int8.toString());
        const int8Bits = (int8 & 0xFF).toString(2).padStart(8, '0');
        const int8Labels = ['S', 'V', 'V', 'V', 'V', 'V', 'V', 'V'];
        this.renderBitTable('int8Bits', int8Bits, int8Labels);

        const int16 = this.toSignedInt(value, 16);
        this.setElementText('int16Value', int16.toString());
        const int16Bits = (int16 & 0xFFFF).toString(2).padStart(16, '0');
        const int16Labels = ['S', ...Array(15).fill('V')];
        this.renderBitTable('int16Bits', int16Bits, int16Labels);

        const int32 = this.toSignedInt(value, 32);
        this.setElementText('int32Value', int32.toString());
        const int32Bits = (int32 >>> 0).toString(2).padStart(32, '0');
        const int32Labels = ['S', ...Array(31).fill('V')];
        this.renderBitTable('int32Bits', int32Bits, int32Labels);

        const int64 = BigInt(Math.floor(value));
        this.setElementText('int64Value', int64.toString());
        const int64Bits = this.toBigIntBinaryString(int64, 64).replace(/\s/g, '');
        const int64Labels = ['S', ...Array(63).fill('V')];
        this.renderBitTable('int64Bits', int64Bits, int64Labels);

        const uint8 = value & 0xFF;
        this.setElementText('uint8Value', uint8.toString());
        const uint8Bits = (uint8).toString(2).padStart(8, '0');
        const uint8Labels = Array(8).fill('V');
        this.renderBitTable('uint8Bits', uint8Bits, uint8Labels);
    }

    private visualizeFloatingPoint(value: number) {
        const fp16Data = this.toFloat16(value);
        this.setElementText('fp16Value', fp16Data.value.toFixed(6));
        this.renderBitTable('fp16Bits', fp16Data.bits, [
            'S', ...Array(5).fill('E'), ...Array(10).fill('M')
        ]);
        this.setElementText('fp16Breakdown',
            `Sign: ${fp16Data.sign}<br>` +
            `Exponent: ${fp16Data.exponent} (bias: 15)<br>` +
            `Mantissa: ${fp16Data.mantissa}`
        );

        const fp32Data = this.toFloat32(value);
        this.setElementText('fp32Value', fp32Data.value.toFixed(9));
        this.renderBitTable('fp32Bits', fp32Data.bits, [
            'S', ...Array(8).fill('E'), ...Array(23).fill('M')
        ]);
        this.setElementText('fp32Breakdown',
            `Sign: ${fp32Data.sign}<br>` +
            `Exponent: ${fp32Data.exponent} (bias: 127)<br>` +
            `Mantissa: ${fp32Data.mantissa}`
        );

        const fp64Data = this.toFloat64(value);
        this.setElementText('fp64Value', fp64Data.value.toFixed(15));
        this.renderBitTable('fp64Bits', fp64Data.bits, [
            'S', ...Array(11).fill('E'), ...Array(52).fill('M')
        ]);
        this.setElementText('fp64Breakdown',
            `Sign: ${fp64Data.sign}<br>` +
            `Exponent: ${fp64Data.exponent} (bias: 1023)<br>` +
            `Mantissa: ${fp64Data.mantissa}`
        );

        // BFloat16
        const bf16Data = this.toBFloat16(value);
        this.setElementText('bf16Value', bf16Data.value.toFixed(6));
        this.renderBitTable('bf16Bits', bf16Data.bits, [
            'S', ...Array(8).fill('E'), ...Array(7).fill('M')
        ]);
        this.setElementText('bf16Breakdown',
            `Sign: ${bf16Data.sign}<br>` +
            `Exponent: ${bf16Data.exponent} (bias: 127)<br>` +
            `Mantissa: ${bf16Data.mantissa}`
        );

        // FP4 (E2M1)
        const fp4Data = this.toCustomFloat(value, 2, 1);
        this.setElementText('fp4Value', fp4Data.value.toFixed(4));
        this.renderBitTable('fp4Bits', fp4Data.bits, [
            'S', 'E', 'E', 'M'
        ]);
        this.setElementText('fp4Breakdown',
            `Sign: ${fp4Data.sign}<br>` +
            `Exponent: ${fp4Data.exponent} (bias: ${fp4Data.bias})<br>` +
            `Mantissa: ${fp4Data.mantissa}`
        );

        // E8M0
        const e8m0Data = this.toE8M0(value);
        this.setElementText('e8m0Value', e8m0Data.value.toFixed(4));
        this.renderBitTable('e8m0Bits', e8m0Data.bits, [
            'S', ...Array(8).fill('E')
        ]);
        this.setElementText('e8m0Breakdown',
            `Sign: ${e8m0Data.sign}<br>` +
            `Exponent: ${e8m0Data.exponent} (bias: ${e8m0Data.bias})<br>` +
            `Note: Dynamic mantissa (implicit normalization)`
        );

        // E4M3
        const e4m3Data = this.toCustomFloat(value, 4, 3);
        this.setElementText('e4m3Value', e4m3Data.value.toFixed(4));
        this.renderBitTable('e4m3Bits', e4m3Data.bits, [
            'S', 'E', 'E', 'E', 'E', 'M', 'M', 'M'
        ]);
        this.setElementText('e4m3Breakdown',
            `Sign: ${e4m3Data.sign}<br>` +
            `Exponent: ${e4m3Data.exponent} (bias: ${e4m3Data.bias})<br>` +
            `Mantissa: ${e4m3Data.mantissa}`
        );

        // E5M2
        const e5m2Data = this.toCustomFloat(value, 5, 2);
        this.setElementText('e5m2Value', e5m2Data.value.toFixed(4));
        this.renderBitTable('e5m2Bits', e5m2Data.bits, [
            'S', 'E', 'E', 'E', 'E', 'E', 'M', 'M'
        ]);
        this.setElementText('e5m2Breakdown',
            `Sign: ${e5m2Data.sign}<br>` +
            `Exponent: ${e5m2Data.exponent} (bias: ${e5m2Data.bias})<br>` +
            `Mantissa: ${e5m2Data.mantissa}`
        );

        // E2M3
        const e2m3Data = this.toCustomFloat(value, 2, 3);
        this.setElementText('e2m3Value', e2m3Data.value.toFixed(4));
        this.renderBitTable('e2m3Bits', e2m3Data.bits, [
            'S', 'E', 'E', 'M', 'M', 'M'
        ]);
        this.setElementText('e2m3Breakdown',
            `Sign: ${e2m3Data.sign}<br>` +
            `Exponent: ${e2m3Data.exponent} (bias: ${e2m3Data.bias})<br>` +
            `Mantissa: ${e2m3Data.mantissa}`
        );

        // E3M2
        const e3m2Data = this.toCustomFloat(value, 3, 2);
        this.setElementText('e3m2Value', e3m2Data.value.toFixed(4));
        this.renderBitTable('e3m2Bits', e3m2Data.bits, [
            'S', 'E', 'E', 'E', 'M', 'M'
        ]);
        this.setElementText('e3m2Breakdown',
            `Sign: ${e3m2Data.sign}<br>` +
            `Exponent: ${e3m2Data.exponent} (bias: ${e3m2Data.bias})<br>` +
            `Mantissa: ${e3m2Data.mantissa}`
        );
    }

    private visualizeQFormat(value: number) {
        // Display all Q formats
        const formats = ['Q7', 'Q15', 'Q31', 'Q8.8', 'Q16.16', 'Q4.12'];

        formats.forEach(format => {
            const qData = this.toQFormat(value, format);
            const elementId = format.toLowerCase().replace('.', '_');

            this.setElementText(`${elementId}Value`, qData.value.toFixed(6));

            let qLabels: string[] = [];
            if (format === 'Q7') {
                qLabels = ['S', ...Array(7).fill('F')];
            } else if (format === 'Q15') {
                qLabels = ['S', ...Array(15).fill('F')];
            } else if (format === 'Q31') {
                qLabels = ['S', ...Array(31).fill('F')];
            } else if (format === 'Q8.8') {
                qLabels = ['S', ...Array(7).fill('I'), ...Array(8).fill('F')];
            } else if (format === 'Q16.16') {
                qLabels = ['S', ...Array(15).fill('I'), ...Array(16).fill('F')];
            } else if (format === 'Q4.12') {
                qLabels = ['S', ...Array(3).fill('I'), ...Array(12).fill('F')];
            } else {
                qLabels = ['S', ...Array(qData.totalBits - 1).fill('F')];
            }

            this.renderBitTable(`${elementId}Bits`, qData.bits, qLabels);
            this.setElementText(`${elementId}Breakdown`,
                `Raw Value: ${qData.rawValue}<br>` +
                `Scale Factor: 2^${qData.fractionalBits}<br>` +
                `Range: ${qData.range}`
            );
        });
    }

    private visualizeHex(value: number) {
        const int8 = this.toSignedInt(value, 8);
        const int16 = this.toSignedInt(value, 16);
        const int32 = this.toSignedInt(value, 32);
        const int64 = BigInt(Math.floor(value));

        this.setElementText('hex8Value', '0x' + (int8 & 0xFF).toString(16).toUpperCase().padStart(2, '0'));
        this.setElementText('hex16Value', '0x' + (int16 & 0xFFFF).toString(16).toUpperCase().padStart(4, '0'));
        this.setElementText('hex32Value', '0x' + (int32 >>> 0).toString(16).toUpperCase().padStart(8, '0'));

        const hex64 = int64 >= 0n ? int64.toString(16) : (int64 & 0xFFFFFFFFFFFFFFFFn).toString(16);
        this.setElementText('hex64Value', '0x' + hex64.toUpperCase().padStart(16, '0'));
    }

    private clear() {
        this.vizInputValueEl.value = '';
        this.vizErrorEl.classList.add('hidden');
        this.vizResultsEl.classList.add('hidden');
    }

    private showError(message: string) {
        this.vizErrorEl.textContent = message;
        this.vizErrorEl.classList.remove('hidden');
    }

    private setElementText(id: string, text: string) {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = text;
        }
    }

    private renderBitTable(containerId: string, bits: string, labels: string[]) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // For all bit strings, group every 8 bits visually
        const groupSize = 8;

        let html = '<table style="border-collapse:collapse;width:100%;text-align:center;font-family:Courier New,monospace;font-size:' + (bits.length > 32 ? '11px' : '13px') + ';">';

        // Bit position row
        html += '<tr>';
        for (let i = 0; i < bits.length; i++) {
            const position = bits.length - 1 - i;
            const isGroupStart = i > 0 && i % groupSize === 0;
            const style = `border:1px solid #e5e5e5;padding:2px 4px;background:#f3f4f6;min-width:24px;${isGroupStart ? 'border-left:3px solid #4b5563;' : ''}`;
            html += `<th style='${style}'>${position}</th>`;
        }
        html += '</tr>';

        // Bit value row
        html += '<tr>';
        for (let i = 0; i < bits.length; i++) {
            const label = labels[i];
            const isGroupStart = i > 0 && i % groupSize === 0;
            const bgColor = label === 'S' ? '#fee2e2' : label === 'E' ? '#dbeafe' : label.includes('M') ? '#dcfce7' : label.includes('I') ? '#fef3c7' : label.includes('F') ? '#dcfce7' : label === 'V' ? '#dbeafe' : '#fff';
            const textColor = label === 'S' ? '#dc2626' : label === 'E' ? '#2563eb' : label.includes('M') ? '#059669' : label.includes('I') ? '#f59e0b' : label.includes('F') ? '#059669' : label === 'V' ? '#1e40af' : '#333';
            const style = `border:1px solid #e5e5e5;padding:4px;color:${textColor};background:${bgColor};font-weight:600;min-width:24px;${isGroupStart ? 'border-left:3px solid #4b5563;' : ''}`;
            html += `<td style='${style}'>${bits[i]}</td>`;
        }
        html += '</tr>';

        // Label row
        html += '<tr>';
        for (let i = 0; i < bits.length; i++) {
            const isGroupStart = i > 0 && i % groupSize === 0;
            const style = `border:1px solid #e5e5e5;padding:2px 4px;font-size:11px;color:#6b7280;min-width:24px;${isGroupStart ? 'border-left:3px solid #4b5563;' : ''}`;
            html += `<td style='${style}'>${labels[i]}</td>`;
        }
        html += '</tr></table>';

        container.innerHTML = html;
    }

    private toSignedInt(value: number, bits: number): number {
        const max = Math.pow(2, bits - 1);
        const mask = Math.pow(2, bits) - 1;
        let result = Math.floor(value) & mask;

        if (result >= max) {
            result -= Math.pow(2, bits);
        }

        return result;
    }

    private toBigIntBinaryString(value: bigint, bits: number): string {
        const mask = (1n << BigInt(bits)) - 1n;
        const masked = value & mask;
        let binary = masked.toString(2).padStart(bits, '0');
        return binary;
    }

    private toFloat16(value: number): { value: number; bits: string; sign: number; exponent: number; mantissa: string } {
        const buffer = new ArrayBuffer(4);
        const floatView = new Float32Array(buffer);
        const intView = new Uint32Array(buffer);

        floatView[0] = value;
        const bits32 = intView[0];

        const sign = (bits32 >>> 31) & 1;
        const exp32 = (bits32 >>> 23) & 0xFF;
        const mantissa32 = bits32 & 0x7FFFFF;

        let exp16 = 0;
        let mantissa16 = 0;

        if (exp32 === 0) {
            exp16 = 0;
            mantissa16 = 0;
        } else if (exp32 === 0xFF) {
            exp16 = 0x1F;
            mantissa16 = mantissa32 !== 0 ? 1 : 0;
        } else {
            const exp = exp32 - 127 + 15;
            if (exp <= 0) {
                exp16 = 0;
                mantissa16 = 0;
            } else if (exp >= 31) {
                exp16 = 0x1F;
                mantissa16 = 0;
            } else {
                exp16 = exp;
                mantissa16 = mantissa32 >>> 13;
            }
        }

        const bits16 = (sign << 15) | (exp16 << 10) | mantissa16;
        const binaryString = bits16.toString(2).padStart(16, '0');

        const reconstructed = sign ? -1 : 1;
        let resultValue: number;
        if (exp16 === 0) {
            resultValue = 0;
        } else if (exp16 === 0x1F) {
            resultValue = mantissa16 !== 0 ? NaN : (sign ? -Infinity : Infinity);
        } else {
            const actualExp = exp16 - 15;
            const mantissaValue = 1.0 + mantissa16 / 1024;
            resultValue = reconstructed * mantissaValue * Math.pow(2, actualExp);
        }

        return {
            value: resultValue,
            bits: binaryString,
            sign,
            exponent: exp16,
            mantissa: mantissa16.toString(2).padStart(10, '0')
        };
    }

    private toFloat32(value: number): { value: number; bits: string; sign: number; exponent: number; mantissa: string } {
        const buffer = new ArrayBuffer(4);
        const floatView = new Float32Array(buffer);
        const intView = new Uint32Array(buffer);

        floatView[0] = value;
        const bits32 = intView[0];

        const sign = (bits32 >>> 31) & 1;
        const exponent = (bits32 >>> 23) & 0xFF;
        const mantissa = bits32 & 0x7FFFFF;

        return {
            value: floatView[0],
            bits: bits32.toString(2).padStart(32, '0'),
            sign,
            exponent,
            mantissa: mantissa.toString(2).padStart(23, '0')
        };
    }

    private toFloat64(value: number): { value: number; bits: string; sign: number; exponent: number; mantissa: string } {
        const buffer = new ArrayBuffer(8);
        const floatView = new Float64Array(buffer);
        const intView = new BigUint64Array(buffer);

        floatView[0] = value;
        const bits64 = intView[0];

        const sign = Number((bits64 >> 63n) & 1n);
        const exponent = Number((bits64 >> 52n) & 0x7FFn);
        const mantissa = bits64 & 0xFFFFFFFFFFFFFn;

        return {
            value: floatView[0],
            bits: bits64.toString(2).padStart(64, '0'),
            sign,
            exponent,
            mantissa: mantissa.toString(2).padStart(52, '0')
        };
    }

    private toBFloat16(value: number): { value: number; bits: string; sign: number; exponent: number; mantissa: string; bias: number } {
        const buffer = new ArrayBuffer(4);
        const floatView = new Float32Array(buffer);
        const intView = new Uint32Array(buffer);

        floatView[0] = value;
        const bits32 = intView[0];

        // Extract FP32 components
        const sign = (bits32 >>> 31) & 1;
        const exp32 = (bits32 >>> 23) & 0xFF;
        const mantissa32 = bits32 & 0x7FFFFF;

        // Truncate to BF16 (keep top 7 bits of mantissa)
        const mantissa16 = mantissa32 >>> 16;
        const bits16 = (sign << 15) | (exp32 << 7) | mantissa16;
        const binaryString = bits16.toString(2).padStart(16, '0');

        // Reconstruct value
        let resultValue: number;
        if (exp32 === 0) {
            resultValue = 0;
        } else if (exp32 === 0xFF) {
            resultValue = mantissa32 !== 0 ? NaN : (sign ? -Infinity : Infinity);
        } else {
            const actualExp = exp32 - 127;
            const mantissaValue = 1.0 + mantissa16 / 128;
            resultValue = (sign ? -1 : 1) * mantissaValue * Math.pow(2, actualExp);
        }

        return {
            value: resultValue,
            bits: binaryString,
            sign,
            exponent: exp32,
            mantissa: mantissa16.toString(2).padStart(7, '0'),
            bias: 127
        };
    }

    private toCustomFloat(value: number, expBits: number, mantBits: number): {
        value: number;
        bits: string;
        sign: number;
        exponent: number;
        mantissa: string;
        bias: number;
    } {
        const totalBits = 1 + expBits + mantBits;
        const bias = Math.pow(2, expBits - 1) - 1;
        const maxExp = Math.pow(2, expBits) - 1;

        const sign = value < 0 ? 1 : 0;
        const absValue = Math.abs(value);

        let exponent = 0;
        let mantissa = 0;
        let resultValue = 0;

        if (absValue === 0) {
            exponent = 0;
            mantissa = 0;
            resultValue = 0;
        } else if (!isFinite(absValue)) {
            exponent = maxExp;
            mantissa = 0;
            resultValue = sign ? -Infinity : Infinity;
        } else {
            // Calculate exponent and mantissa
            const log2 = Math.floor(Math.log2(absValue));
            exponent = log2 + bias;

            if (exponent <= 0) {
                // Subnormal number
                exponent = 0;
                mantissa = Math.round(absValue * Math.pow(2, bias - 1 + mantBits));
            } else if (exponent >= maxExp) {
                // Overflow to infinity
                exponent = maxExp;
                mantissa = 0;
            } else {
                // Normal number
                const normalized = absValue / Math.pow(2, log2);
                mantissa = Math.round((normalized - 1.0) * Math.pow(2, mantBits));
            }

            // Reconstruct value
            if (exponent === 0) {
                resultValue = (sign ? -1 : 1) * mantissa * Math.pow(2, 1 - bias - mantBits);
            } else if (exponent === maxExp) {
                resultValue = sign ? -Infinity : Infinity;
            } else {
                const mantissaValue = 1.0 + mantissa / Math.pow(2, mantBits);
                resultValue = (sign ? -1 : 1) * mantissaValue * Math.pow(2, exponent - bias);
            }
        }

        // Clamp values to bit width
        exponent = Math.min(maxExp, Math.max(0, exponent));
        mantissa = Math.min(Math.pow(2, mantBits) - 1, Math.max(0, mantissa));

        // Build bit string
        const bits = (sign << (expBits + mantBits)) | (exponent << mantBits) | mantissa;
        const binaryString = bits.toString(2).padStart(totalBits, '0');

        return {
            value: resultValue,
            bits: binaryString,
            sign,
            exponent,
            mantissa: mantissa.toString(2).padStart(mantBits, '0'),
            bias
        };
    }

    private toE8M0(value: number): {
        value: number;
        bits: string;
        sign: number;
        exponent: number;
        bias: number;
    } {
        const expBits = 8;
        const bias = 127; // Using FP32-like bias
        const maxExp = 255;

        const sign = value < 0 ? 1 : 0;
        const absValue = Math.abs(value);

        let exponent = 0;
        let resultValue = 0;

        if (absValue === 0) {
            exponent = 0;
            resultValue = 0;
        } else if (!isFinite(absValue)) {
            exponent = maxExp;
            resultValue = sign ? -Infinity : Infinity;
        } else {
            const log2 = Math.floor(Math.log2(absValue));
            exponent = log2 + bias;

            if (exponent <= 0) {
                exponent = 0;
                resultValue = 0;
            } else if (exponent >= maxExp) {
                exponent = maxExp;
                resultValue = sign ? -Infinity : Infinity;
            } else {
                // For E8M0, use power of 2 representation (implicit mantissa of 1.0)
                resultValue = (sign ? -1 : 1) * Math.pow(2, exponent - bias);
            }
        }

        exponent = Math.min(maxExp, Math.max(0, exponent));

        const bits = (sign << expBits) | exponent;
        const binaryString = bits.toString(2).padStart(9, '0');

        return {
            value: resultValue,
            bits: binaryString,
            sign,
            exponent,
            bias
        };
    }

    private toQFormat(value: number, format: string): {
        value: number;
        bits: string;
        totalBits: number;
        fractionalBits: number;
        rawValue: number;
        description: string;
        range: string;
    } {
        let totalBits: number;
        let fractionalBits: number;
        let integerBits: number;

        if (format === 'Q7') {
            totalBits = 8;
            integerBits = 0;
            fractionalBits = 7;
        } else if (format === 'Q15') {
            totalBits = 16;
            integerBits = 0;
            fractionalBits = 15;
        } else if (format === 'Q31') {
            totalBits = 32;
            integerBits = 0;
            fractionalBits = 31;
        } else if (format === 'Q8.8') {
            totalBits = 16;
            integerBits = 7;
            fractionalBits = 8;
        } else if (format === 'Q16.16') {
            totalBits = 32;
            integerBits = 15;
            fractionalBits = 16;
        } else if (format === 'Q4.12') {
            totalBits = 16;
            integerBits = 3;
            fractionalBits = 12;
        } else {
            totalBits = 16;
            integerBits = 0;
            fractionalBits = 15;
        }

        const scale = Math.pow(2, fractionalBits);
        const rawValue = Math.round(value * scale);
        const max = Math.pow(2, totalBits - 1);
        const clampedRaw = Math.max(-max, Math.min(max - 1, rawValue));

        const mask = Math.pow(2, totalBits) - 1;
        const unsigned = clampedRaw < 0 ? clampedRaw + Math.pow(2, totalBits) : clampedRaw;
        const bits = (unsigned & mask).toString(2).padStart(totalBits, '0');

        const reconstructed = clampedRaw / scale;

        const maxValue = (Math.pow(2, totalBits - 1) - 1) / scale;
        const minValue = -Math.pow(2, totalBits - 1) / scale;

        return {
            value: reconstructed,
            bits,
            totalBits,
            fractionalBits,
            rawValue: clampedRaw,
            description: `1s + ${integerBits}i + ${fractionalBits}f`,
            range: `${minValue.toFixed(3)} to ${maxValue.toFixed(3)}`
        };
    }
}
