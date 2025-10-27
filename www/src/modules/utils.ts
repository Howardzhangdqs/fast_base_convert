/**
 * Utility functions for base conversion and visualizer
 */

export class ConversionUtils {
    private static readonly CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    /**
     * Convert string to digits array
     */
    static stringToDigits(str: string, base: number): number[] {
        const digits: number[] = [];
        let num: bigint;

        try {
            if (str.startsWith('0x') || str.startsWith('0X')) {
                num = BigInt(str);
            } else if (str.startsWith('0b') || str.startsWith('0B')) {
                num = BigInt(str);
            } else if (str.startsWith('0o') || str.startsWith('0O')) {
                num = BigInt(str);
            } else {
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

    /**
     * Parse number in specific base
     */
    static parseNumberInBase(str: string, base: number): bigint {
        let result = 0n;
        let i = 0;

        while (i < str.length) {
            const char = str[i];
            let value: number;

            if (char === '[' && i + 1 < str.length) {
                let numStr = '';
                let j = i + 1;

                while (j < str.length && str[j] !== ']') {
                    if (str[j] >= '0' && str[j] <= '9') {
                        numStr += str[j];
                        j++;
                    } else {
                        throw new Error(`Invalid digit format "${char}" for base ${base}`);
                    }
                }

                if (j >= str.length || str[j] !== ']') {
                    throw new Error(`Unclosed bracket in digit "${str.substring(i)}" for base ${base}`);
                }

                if (numStr === '') {
                    throw new Error(`Empty bracket in digit "${str.substring(i)}" for base ${base}`);
                }

                value = parseInt(numStr, 10);
                i = j + 1;
            } else {
                value = this.CHARSET.indexOf(char);

                if (value === -1) {
                    value = this.CHARSET.indexOf(char.toUpperCase());
                }
                if (value === -1) {
                    value = this.CHARSET.indexOf(char.toLowerCase());
                }

                if (value === -1) {
                    throw new Error(`Invalid digit "${char}" for base ${base}`);
                }

                i++;
            }

            if (value >= base) {
                throw new Error(`Digit value ${value} is too large for base ${base}`);
            }

            result = result * BigInt(base) + BigInt(value);
        }

        return result;
    }

    /**
     * Perform base conversion
     */
    static performBaseConversion(digits: number[], fromBase: number, toBase: number): Uint32Array {
        if (fromBase === toBase) {
            return new Uint32Array(digits);
        }

        let value = 0n;
        for (let i = digits.length - 1; i >= 0; i--) {
            value = value * BigInt(fromBase) + BigInt(digits[i]);
        }

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

    /**
     * Convert digits array to string representation
     */
    static digitsToString(digits: Uint32Array): string {
        if (digits.length === 0) return '0';
        if (digits.length === 1 && digits[0] === 0) return '0';

        let result = '';

        for (let i = digits.length - 1; i >= 0; i--) {
            const digit = digits[i];
            if (digit < 10) {
                result += digit.toString();
            } else if (digit < 36) {
                result += String.fromCharCode(65 + digit - 10);
            } else if (digit < 62) {
                result += String.fromCharCode(97 + digit - 36);
            } else {
                result += `[${digit}]`;
            }
        }

        return result;
    }

    /**
     * Get digit representation for a value
     */
    static getDigitRepresentation(value: number): string {
        if (value < 10) return value.toString();
        if (value < 36) return String.fromCharCode(65 + value - 10);
        if (value < 62) return String.fromCharCode(97 + value - 36);
        return `[${value}]`;
    }

    /**
     * Check if number is power of two
     */
    static isPowerOfTwo(n: number): boolean {
        return n > 0 && (n & (n - 1)) === 0;
    }

    /**
     * Check if two bases are aligned (e.g., 4 and 16, or 8 and 64)
     */
    static areAlignedBases(base1: number, base2: number): boolean {
        const commonAlignments = [
            [4, 16], [8, 64], [16, 256], [3, 27], [9, 81],
            [16, 4], [64, 8], [256, 16], [27, 3], [81, 9]
        ];

        return commonAlignments.some(([a, b]) =>
            (a === base1 && b === base2) || (a === base2 && b === base1)
        );
    }

    /**
     * Get base examples for hint text
     */
    static getBaseExamples(base: number, _caseType: 'lower' | 'upper' | 'mixed'): string {
        const examples = [];

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
                examples.push('(e.g., Z9, A1z)');
                break;
            default:
                if (base <= 36) {
                    const maxVal = Math.min(base - 1, 35);
                    const digit1 = this.getDigitRepresentation(10);
                    const digit2 = this.getDigitRepresentation(maxVal);
                    examples.push(`(e.g., ${digit1}${digit2})`);
                } else if (base <= 64) {
                    examples.push('(e.g., A[, 1@, Z[)');
                } else {
                    examples.push('(e.g., [10][63])');
                }
        }

        return examples.join(' ');
    }

    /**
     * Determine conversion strategy
     */
    static determineStrategy(fromBase: number, toBase: number, inputLength: number): string {
        if (this.isPowerOfTwo(fromBase) && this.isPowerOfTwo(toBase)) {
            return 'Bit Operations';
        } else if (inputLength <= 5 && fromBase === 10) {
            return 'u128 Fast Path';
        } else if (this.areAlignedBases(fromBase, toBase)) {
            return 'Aligned Bases';
        }
        return 'General Division';
    }
}
