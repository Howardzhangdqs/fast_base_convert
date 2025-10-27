import { Benchmarker } from './benchmark';
import { Converter } from './converter';
import { Visualizer } from './visualizer';

/**
 * Main Application - Manages tabs and app lifecycle
 */
export class BenchmarkApp {
    private converter: Converter;

    constructor() {
        // Initialize all modules
        new Benchmarker();
        this.converter = new Converter();
        new Visualizer();

        this.initializeEventListeners();

        // Initialize base hints
        setTimeout(() => {
            this.converter.updateBaseHint('fromBase');
            this.converter.updateBaseHint('toBase');
        }, 100);
    }

    private initializeEventListeners() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetTab = (e.target as HTMLElement).getAttribute('data-tab') || 'benchmarks';
                this.switchTab(targetTab);
            });
        });
    }

    private switchTab(tabName: string) {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            const contentId = content.id;
            if (contentId === `${tabName}-tab`) {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });

        if (tabName === 'converter') {
            setTimeout(() => {
                this.converter.updateBaseHint('fromBase');
                this.converter.updateBaseHint('toBase');
            }, 50);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new BenchmarkApp();
});
