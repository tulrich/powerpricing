/**
 * Real ConEd Select Pricing Plan (SC1 Rate IV) bills, transcribed from the bill
 * breakdown screenshots in test/example_spp_bill*.png. Used to validate that
 * calculate()'s Select Plan estimate stays in the right ballpark over time.
 *
 * Fields:
 *  - label: human-readable billing period
 *  - monthIdx: 0-based month index (Jan=0) of the majority of days in the
 *    billing period; matches the granularity calculate() itself uses.
 *  - onPeakKwh/offPeakKwh: "Actual Metered kWh" from the bill (can be negative
 *    for net-export months; calculate()'s own clamping reproduces ConEd's
 *    "Billed kWh" behavior of zeroing out negative buckets).
 *  - peakKw/peakKwOff: billed "Peak Demand" / "Off Peak Demand" kW.
 *  - actualSelectTotal: "Your electricity total" on the bill.
 *  - tolerancePct: how far calculate()'s estimate is allowed to drift, as a
 *    fraction of actualSelectTotal. ConEd's actual per-kWh supply/delivery
 *    rates vary month to month (they're partially true-up/variable charges),
 *    so a fixed-constant model can't track every bill exactly — tolerances
 *    reflect that, with wider bands called out via `note` where a specific
 *    bill had an unusually volatile rate.
 */
export const VALIDATION_BILLS = [
    {
        label: 'Dec 10, 2025 - Jan 9, 2026',
        source: 'example_spp_bill.png',
        monthIdx: 11, // December
        onPeakKwh: 1344,
        offPeakKwh: 5203,
        peakKw: 15.24,
        peakKwOff: 15.77,
        actualSelectTotal: 1490.34,
        actualStandardTotal: 2213.66, // from ConEd site, per original bill
        tolerancePct: 0.06,
        note: 'Predates the per-kW demand System Benefit Charge that appears starting Feb 2026 bills.',
    },
    {
        label: 'Jan 9, 2026 - Feb 10, 2026',
        source: 'example_spp_bill2.png',
        monthIdx: 0, // January (majority of the 32-day period)
        onPeakKwh: 1617,
        offPeakKwh: 6297,
        peakKw: 15.74,
        peakKwOff: 17.05,
        actualSelectTotal: 1677.52,
        tolerancePct: 0.08,
        note: 'Predates the per-kW demand System Benefit Charge that appears starting Feb 2026 bills.',
    },
    {
        label: 'Feb 10, 2026 - Mar 12, 2026',
        source: 'example_spp_bill_2026-0203.png',
        monthIdx: 1, // February
        onPeakKwh: 902,
        offPeakKwh: 3382,
        peakKw: 10.17,
        peakKwOff: 11.54,
        actualSelectTotal: 1016.50,
        tolerancePct: 0.05,
    },
    {
        label: 'Mar 12, 2026 - Apr 10, 2026',
        source: 'example_spp_bill_2026-0304.png',
        monthIdx: 2, // March
        onPeakKwh: 239,
        offPeakKwh: 1816,
        peakKw: 6.58,
        peakKwOff: 8.91,
        actualSelectTotal: 589.57,
        tolerancePct: 0.08,
    },
    {
        label: 'Apr 10, 2026 - May 11, 2026',
        source: 'example_spp_bill_2026-0405.png',
        monthIdx: 3, // April
        onPeakKwh: -85, // net export (PV); ConEd bills this bucket as 0
        offPeakKwh: 834,
        peakKw: 3.59,
        peakKwOff: 6.57,
        actualSelectTotal: 338.90,
        tolerancePct: 0.22,
        note: 'This bill\'s off-peak supply rate spiked to 13.869c/kWh vs. a typical ~9.4c/kWh — a '
            + 'one-month variable-rate outlier that a fixed constant cannot track.',
    },
    {
        label: 'May 11, 2026 - Jun 10, 2026',
        source: 'example_spp_bill_2026-0506.png',
        monthIdx: 4, // May
        onPeakKwh: -171, // net export (PV); ConEd bills this bucket as 0
        offPeakKwh: 376,
        peakKw: 3.44,
        peakKwOff: 5.09,
        actualSelectTotal: 217.46,
        tolerancePct: 0.09,
        note: 'Billing period straddles the winter/summer demand-rate boundary; ConEd blends the '
            + 'demand rate by days in each season, which this month-granularity model does not.',
    },
    {
        label: 'Jun 10, 2026 - Jul 10, 2026',
        source: 'example_spp_bill_2026-0607.png',
        monthIdx: 5, // June (summer)
        onPeakKwh: 45,
        offPeakKwh: 638,
        peakKw: 4.91,
        peakKwOff: 4.90,
        actualSelectTotal: 324.45,
        tolerancePct: 0.05,
    },
];

/** Overall mean-absolute-percentage-error budget across the whole validation set. */
export const VALIDATION_SET_MAPE_BUDGET = 0.08;
