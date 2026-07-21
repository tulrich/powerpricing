import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';

import { calculate, parseIntervalCSVEntries, computeMonthlyUsage, MONTH_NAMES, getUsageForYear, parsedMonthlyData } from './app_logic.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Real "Export usage" Green Button data from test/usage_data_example_2026-0107_DailyUsageData_csv.zip,
// covering Jan 1 - Jul 20, 2026 at 15-minute resolution. Extracted once into a plain CSV fixture so
// tests don't need a zip-reading dependency.
const CSV_PATH = path.join(__dirname, '../fixtures/interval_data_2026-01-01_to_2026-07-20.csv');

describe('Real Interval Data (test/fixtures/interval_data_2026-01-01_to_2026-07-20.csv)', () => {
    const csv = fs.readFileSync(CSV_PATH, 'utf8');
    const entries = parseIntervalCSVEntries(csv);

    it('should parse every 15-minute reading in the file', () => {
        // The file covers ~201 days at 96 readings/day; a couple of DST/boundary
        // readings can legitimately be dropped, so allow a small margin.
        expect(entries.length).toBeGreaterThan(19000);
        entries.forEach(([ts, kwh]) => {
            expect(Number.isFinite(ts)).toBe(true);
            expect(Number.isFinite(kwh)).toBe(true);
        });
    });

    const monthly = computeMonthlyUsage(new Map(entries));

    it('should produce a monthly bucket for every calendar month present (Jan-Jul)', () => {
        for (let m = 0; m <= 6; m++) {
            expect(monthly[m]).toBeDefined();
            expect(monthly[m].label).toBe(MONTH_NAMES[m]);
        }
    });

    it('should keep on-peak + off-peak kWh consistent with the monthly total', () => {
        // totalKwh, onPeakKwh, and offPeakKwh are each rounded independently, so allow
        // for +/-1 kWh of rounding drift between the sum of the parts and the total.
        Object.values(monthly).forEach(month => {
            expect(Math.abs((month.onPeakKwh + month.offPeakKwh) - month.totalKwh)).toBeLessThanOrEqual(1);
        });
    });

    it('should report plausible (non-negative, non-absurd) demand figures', () => {
        Object.values(monthly).forEach(month => {
            expect(month.peakKw).toBeGreaterThanOrEqual(0);
            expect(month.peakKwOff).toBeGreaterThanOrEqual(0);
            expect(month.peakKw).toBeLessThan(50);
            expect(month.peakKwOff).toBeLessThan(50);
        });
    });

    it('should show heating-driven winter usage far exceeding spring/summer usage', () => {
        // This is a heat-pump household (see README); January usage should dwarf May's.
        expect(monthly[0].totalKwh).toBeGreaterThan(monthly[4].totalKwh * 2);
    });

    it('should show net solar export (negative on-peak kWh) in the sunniest months', () => {
        // Matches the negative "Actual Metered" on-peak kWh seen on the real
        // Apr/May/Jun 2026 bills (test/fixtures/validationBills.js).
        expect(monthly[4].onPeakKwh).toBeLessThan(0); // May
        expect(monthly[5].onPeakKwh).toBeLessThan(0); // June
    });

    it('should feed cleanly into calculate() for every parsed month, including net-export months', () => {
        Object.keys(monthly).forEach(mIdx => {
            const month = monthly[mIdx];
            const result = calculate(month, mIdx);
            expect(Number.isFinite(result.selTotal)).toBe(true);
            expect(Number.isFinite(result.stdTotal)).toBe(true);
            expect(result.selTotal).toBeGreaterThanOrEqual(0);
            expect(result.stdTotal).toBeGreaterThanOrEqual(0);
        });
    });

    it('should extrapolate sane (not blown-up) peak demand for unobserved winter months', () => {
        // Regression test: uploading just this Jan-Jul file (no Aug-Dec data) used to make
        // getUsageForYear() estimate wild Nov/Dec peak demand. The bug was averaging each
        // real month's raw peakKw/totalKwh ratio equally: summer months here have tiny (or
        // solar-negative) totalKwh alongside ordinary baseline peak demand, so their ratio
        // is huge, and multiplying that inflated average ratio by a big winter totalKwh
        // estimate blew up the result (~50+ kW, vs. a real max of ~16 kW in this dataset).
        Object.keys(monthly).forEach(mIdx => { parsedMonthlyData[mIdx] = monthly[mIdx]; });

        const year = getUsageForYear();
        const maxRealPeakKw = Math.max(...Object.values(monthly).map(m => m.peakKw));
        const maxRealPeakKwOff = Math.max(...Object.values(monthly).map(m => m.peakKwOff));

        [10, 11].forEach(mIdx => { // Nov, Dec: unobserved, highest seasonal weight
            expect(year[mIdx].source).toBe('estimated');
            // Generous headroom above the real observed max, but nowhere near the ~50+ kW
            // the ratio-averaging bug used to produce.
            expect(year[mIdx].peakKw).toBeLessThan(maxRealPeakKw * 2);
            expect(year[mIdx].peakKwOff).toBeLessThan(maxRealPeakKwOff * 2);
        });
    });
});
