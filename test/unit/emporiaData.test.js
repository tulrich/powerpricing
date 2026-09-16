import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';

import { detectUploadFormat, parseEmporiaCSVEntries, parseIntervalCSVEntries } from './app_logic.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EMPORIA_WITH_GRID_PATH = path.join(__dirname, '../fixtures/emporia_hourly_with_import_export.csv');
const EMPORIA_DATE_TIME_PATH = path.join(__dirname, '../fixtures/emporia_hourly_date_time.csv');
const GREEN_BUTTON_PATH = path.join(__dirname, '../fixtures/interval_data_2026-01-01_to_2026-07-20.csv');

describe('Emporia Upload Support', () => {
    const emporiaGridCsv = fs.readFileSync(EMPORIA_WITH_GRID_PATH, 'utf8');
    const emporiaDateTimeCsv = fs.readFileSync(EMPORIA_DATE_TIME_PATH, 'utf8');
    const greenButtonCsv = fs.readFileSync(GREEN_BUTTON_PATH, 'utf8');

    it('should detect Green Button and Emporia CSV formats correctly', () => {
        expect(detectUploadFormat(greenButtonCsv, 'green_button.csv')).toBe('green_button_csv');
        expect(detectUploadFormat(emporiaGridCsv, 'emporia.csv')).toBe('emporia_csv');
        expect(detectUploadFormat('<?xml version="1.0"?><root/>', 'interval.xml')).toBe('green_button_xml');
    });

    it('should parse Emporia import/export data into deterministic aggregate net intervals', () => {
        const parsed = parseEmporiaCSVEntries(emporiaGridCsv);
        expect(parsed).toBeTruthy();
        expect(parsed.aggregateEntries.length).toBe(3);

        const asMap = new Map(parsed.aggregateEntries);
        const ts0 = new Date('2026-01-01T00:00:00-05:00').getTime();
        const ts1 = new Date('2026-01-01T01:00:00-05:00').getTime();
        const ts2 = new Date('2026-01-01T02:00:00-05:00').getTime();

        expect(asMap.get(ts0)).toBeCloseTo(1.0, 8);
        expect(asMap.get(ts1)).toBeCloseTo(0.9, 8);
        expect(asMap.get(ts2)).toBeCloseTo(0.1, 8);
    });

    it('should retain per-circuit traces and classify common circuit types', () => {
        const parsed = parseEmporiaCSVEntries(emporiaGridCsv);
        expect(parsed).toBeTruthy();

        const solarSeries = parsed.circuitSeries['Solar (kWh)'];
        const hpSeries = parsed.circuitSeries['Heat Pump (kWh)'];
        const ts2 = new Date('2026-01-01T02:00:00-05:00').getTime();
        const ts1 = new Date('2026-01-01T01:00:00-05:00').getTime();

        expect(solarSeries).toBeTruthy();
        expect(hpSeries).toBeTruthy();
        expect(solarSeries.get(ts2)).toBeCloseTo(0.5, 8);
        expect(hpSeries.get(ts1)).toBeCloseTo(0.35, 8);
        expect(parsed.circuitMeta['Solar (kWh)'].kind).toBe('generation');
        expect(parsed.circuitMeta['Heat Pump (kWh)'].kind).toBe('load');
    });

    it('should support Date+Time Emporia variants and derive aggregate from signed circuits', () => {
        const parsed = parseEmporiaCSVEntries(emporiaDateTimeCsv);
        expect(parsed).toBeTruthy();
        expect(parsed.aggregateEntries.length).toBe(2);

        const asMap = new Map(parsed.aggregateEntries);
        const ts0 = new Date('2026-01-02T08:00').getTime();
        const ts1 = new Date('2026-01-02T09:00').getTime();

        expect(asMap.get(ts0)).toBeCloseTo(1.7, 8);
        expect(asMap.get(ts1)).toBeCloseTo(1.1, 8);
    });

    it('should keep existing Green Button CSV parsing behavior intact', () => {
        const entries = parseIntervalCSVEntries(greenButtonCsv);
        expect(entries.length).toBeGreaterThan(19000);
        entries.slice(0, 50).forEach(([ts, kwh]) => {
            expect(Number.isFinite(ts)).toBe(true);
            expect(Number.isFinite(kwh)).toBe(true);
        });
    });
});
