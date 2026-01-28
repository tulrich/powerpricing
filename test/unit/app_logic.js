
    // --- Constants & Config ---
        export const SEASON_WEIGHTS = [0.144, 0.124, 0.076, 0.048, 0.030, 0.041, 0.054, 0.038, 0.033, 0.050, 0.094, 0.171];
    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
        export const CONST = {
        SC1_STD_FIXED: 20.00, SC1_SEL_FIXED: 30.28, 
        SBC_RATE: 0.00472, TAX_DELIVERY: 1.0951, TAX_SUPPLY: 1.0702,   
        STD_DELIVERY_KWH: 0.165, SEL_DELIVERY_KWH: 0.00981, 
        WINTER_DEMAND: 19.50, SUMMER_DEMAND: 26.50, DEMAND_OFF_PEAK: 7.48,
        MFC_RATE: 0.003733, 
        SUPPLY_STD_WINTER: 0.136, SUPPLY_STD_SUMMER: 0.170, 
        SUPPLY_SEL_ON: 0.22118, SUPPLY_SEL_OFF: 0.09952
    };

        export const DEFAULT_STATE = {
            totalKwh: 3250, onPeakKwh: 666, offPeakKwh: 2584,
        peakKw: 7.6, peakKwOff: 7.9, billMonth: '11'
    };

    // --- Globals ---
    let chartInstance = null;
    let historyChartInstance = null;
    let parsedMonthlyData = {};
    let globalIntervals = new Map();

    // --- Core Functions (Defined BEFORE use) ---
    function updateDOM(keys) {
        keys.forEach(k => { 
            const el = document.getElementById(k); 
            if(el) el.value = k.includes('Kwh') ? Math.round(state[k]) : parseFloat(state[k]).toFixed(2); 
        });
    }

    function initDropdown() {
        const monthSelect = document.getElementById('billMonth');
        if (!monthSelect) return;
        monthSelect.innerHTML = '';
        MONTH_NAMES.forEach((m, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = m;
            monthSelect.appendChild(opt);
        });
        
        if(Object.keys(parsedMonthlyData).length > 0) {
            Object.keys(parsedMonthlyData).sort((a,b)=>parseInt(a)-parseInt(b)).forEach(k => {
                if(k === 'rolling') {
                    const opt = document.createElement('option');
                    opt.value = 'rolling';
                    opt.textContent = parsedMonthlyData[k].label;
                    monthSelect.prepend(opt);
                } else {
                    const opt = monthSelect.querySelector(`option[value="${k}"]`);
                    if(opt) {
                        const days = parsedMonthlyData[k].days;
                        const suffix = days < 28 ? ` (${days}d Partial)` : ` (${days}d)`;
                        opt.textContent = `✅ ${MONTH_NAMES[k]}${suffix}`;
                    }
                }
            });
        }
        monthSelect.value = state.billMonth;
    }

    function loadMonthFromHistory(key) {
        const data = parsedMonthlyData[key];
        if (!data) return;
        Object.assign(state, {
            totalKwh: data.totalKwh,
            onPeakKwh: data.onPeakKwh,
            offPeakKwh: data.offPeakKwh,
            peakKw: data.peakKw,
            peakKwOff: data.peakKwOff
        });
        updateDOM(['totalKwh', 'onPeakKwh', 'offPeakKwh', 'peakKw', 'peakKwOff']);
    }

    // --- State Proxy ---
        export const state = new Proxy({ ...DEFAULT_STATE }, {
        set(target, prop, value) {
            if (prop === 'billMonth') target[prop] = value.toString();
            else target[prop] = parseFloat(value) || 0;

            if (prop === 'totalKwh' && Object.keys(parsedMonthlyData).length === 0) {
                target.onPeakKwh = Math.round(target.totalKwh * 0.205);
                target.offPeakKwh = target.totalKwh - target.onPeakKwh;
                updateDOM(['onPeakKwh', 'offPeakKwh']);
            }
            if (prop === 'billMonth' && parsedMonthlyData && parsedMonthlyData[target.billMonth]) {
                loadMonthFromHistory(target.billMonth);
            }
            syncToUrl();
            render();
            return true;
        }
    });

    // --- Calculations & Rendering ---
        export function calculate(usage, monthKey) {
        let monthIdx = (monthKey === 'rolling') ? 0 : parseInt(monthKey);
        const isSummer = monthIdx >= 5 && monthIdx <= 8; 
        const demandRate = isSummer ? CONST.SUMMER_DEMAND : CONST.WINTER_DEMAND;
        const stdSupplyRate = isSummer ? CONST.SUPPLY_STD_SUMMER : CONST.SUPPLY_STD_WINTER;
        
        // Standard Plan Calculations
        const stdFixed = CONST.SC1_STD_FIXED;
        const stdDelVol = usage.totalKwh * (CONST.STD_DELIVERY_KWH + CONST.SBC_RATE);
        const stdDelTotal = (stdFixed + stdDelVol) * CONST.TAX_DELIVERY;
        
        const stdSupVol = usage.totalKwh * stdSupplyRate;
        const stdMFC = usage.totalKwh * CONST.MFC_RATE;
        const stdSupTotal = (stdSupVol + stdMFC) * CONST.TAX_SUPPLY;
        
        // Select Plan Calculations
        const selFixed = CONST.SC1_SEL_FIXED;
        const demandPeakCost = usage.peakKw * demandRate;
        const demandOffCost = usage.peakKwOff * CONST.DEMAND_OFF_PEAK;
        const selDelVol = usage.totalKwh * (CONST.SEL_DELIVERY_KWH + CONST.SBC_RATE);
        const selDelTotal = (selFixed + demandPeakCost + demandOffCost + selDelVol) * CONST.TAX_DELIVERY;

        const selSupOn = usage.onPeakKwh * CONST.SUPPLY_SEL_ON;
        const selSupOff = usage.offPeakKwh * CONST.SUPPLY_SEL_OFF;
        const selMFC = usage.totalKwh * CONST.MFC_RATE;
        const selSupTotal = (selSupOn + selSupOff + selMFC) * CONST.TAX_SUPPLY;

        return { 
            stdTotal: stdDelTotal + stdSupTotal, selTotal: selDelTotal + selSupTotal,
            stdDel: stdDelTotal, stdSup: stdSupTotal, selDel: selDelTotal, selSup: selSupTotal,
            details: {
                selFixed, demandPeakCost, demandOffCost, selDelVol, 
                selDelTotal, selSupOn, selSupOff, selMFC, selSupTotal,
                stdFixed, stdDelVol, stdSupVol, stdMFC, stdDelTotal, stdSupTotal
            }
        };
    }

    function renderDetails() {
        const cur = calculate(state, state.billMonth);
        const fmt = (v) => `$${v.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        const det = cur.details;
        let monthIdx = state.billMonth === 'rolling' ? 0 : parseInt(state.billMonth);
        const isSum = (monthIdx >= 5 && monthIdx <= 8);

        // Standard Rates for display
        const stdSupplyRate = isSum ? CONST.SUPPLY_STD_SUMMER : CONST.SUPPLY_STD_WINTER;
        const stdDeliveryRate = CONST.STD_DELIVERY_KWH + CONST.SBC_RATE;
        const selDeliveryRate = CONST.SEL_DELIVERY_KWH + CONST.SBC_RATE;

        // Calculate Standard Plan Tax/Fees (Difference between Total and the raw components)
        const stdTax = (cur.stdDel - det.stdFixed - det.stdDelVol) + (cur.stdSup - det.stdSupVol - det.stdMFC);

        // Calculate Select Plan Tax/Fees
        const selTax = (cur.selDel - det.selFixed - det.demandPeakCost - det.demandOffCost - det.selDelVol) +
            (cur.selSup - det.selSupOn - det.selSupOff - det.selMFC);
        

        const html = `
            <div>
                <h4 class="text-xs font-bold uppercase text-blue-600 mb-2 border-b border-blue-100 pb-1">Select Pricing Plan</h4>
                <div class="space-y-2 text-sm text-gray-600">
                    <div class="bg-blue-50/50 p-2 rounded-lg space-y-1 mb-2">
                        <div class="flex justify-between text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-1">Demand Charges</div>
                        <div class="flex justify-between">
                            <span>Peak Demand</span>
                            <span class="text-[10px] text-gray-400 mt-0.5">${parseFloat(state.peakKw).toFixed(2)} kW @ $${isSum ? CONST.SUMMER_DEMAND.toFixed(2) : CONST.WINTER_DEMAND.toFixed(2)}</span>
                            <span class="font-mono font-bold text-blue-700">${fmt(det.demandPeakCost)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Off-Peak Demand</span>
                            <span class="text-[10px] text-gray-400 mt-0.5">${parseFloat(state.peakKwOff).toFixed(2)} kW @ $7.48</span>
                            <span class="font-mono font-bold text-blue-700">${fmt(det.demandOffCost)}</span>
                        </div>
                    </div>
                    <div class="space-y-1">
                        <div class="flex justify-between"><span>Basic Service Charge</span><span class="font-mono">${fmt(det.selFixed)}</span></div>
                        
                        <div class="flex justify-between">
                            <span>Delivery</span>
                            <span class="text-[10px] text-gray-400 mt-0.5">${Math.round(state.totalKwh)} kWh @ $${selDeliveryRate.toFixed(5)}</span>
                            <span class="font-mono">${fmt(det.selDelVol)}</span>
                        </div>
                        
                        <div class="flex justify-between">
                            <span>Supply (On-Peak)</span>
                            <span class="text-[10px] text-gray-400 mt-0.5">${Math.round(state.onPeakKwh)} kWh @ $${CONST.SUPPLY_SEL_ON.toFixed(5)}</span>
                            <span class="font-mono">${fmt(det.selSupOn)}</span>
                        </div>
                        
                        <div class="flex justify-between">
                            <span>Supply (Off-Peak)</span>
                            <span class="text-[10px] text-gray-400 mt-0.5">${Math.round(state.offPeakKwh)} kWh @ $${CONST.SUPPLY_SEL_OFF.toFixed(5)}</span>
                            <span class="font-mono">${fmt(det.selSupOff)}</span>
                        </div>

                        <div class="flex justify-between"><span>Merchant Function Charge</span><span class="font-mono">${fmt(det.selMFC)}</span></div>
                        <div class="flex justify-between text-gray-400 italic"><span>Taxes & Surcharges</span><span class="font-mono">${fmt(selTax)}</span></div>
                    </div>
                    <div class="flex justify-between font-black text-lg text-blue-700 pt-1 border-t mt-2"><span>Total Bill</span><span>${fmt(cur.selTotal)}</span></div>
                </div>
            </div>
            <div class="mt-4">
                <h4 class="text-xs font-bold uppercase text-gray-400 mb-2 border-b border-gray-100 pb-1">Standard Plan</h4>
                <div class="space-y-2 text-sm text-gray-600">
                    <div class="bg-gray-50/50 p-2 rounded-lg space-y-1 mb-2">
                        <div class="flex justify-between"><span>Basic Service Charge</span><span class="font-mono">${fmt(det.stdFixed)}</span></div>
                        <div class="flex justify-between">
                            <span>Delivery</span>
                            <span class="text-[10px] text-gray-400 mt-0.5">${Math.round(state.totalKwh)} kWh @ $${stdDeliveryRate.toFixed(3)}</span>
                            <span class="font-mono">${fmt(det.stdDelVol)}</span>
                        </div>
                    </div>
                    <div class="space-y-1">
                        <div class="flex justify-between">
                            <span>Supply Charge</span>
                            <span class="text-[10px] text-gray-400 mt-0.5">${Math.round(state.totalKwh)} kWh @ $${stdSupplyRate.toFixed(3)}</span>
                            <span class="font-mono">${fmt(det.stdSupVol)}</span>
                        </div>
                        <div class="flex justify-between"><span>Merchant Function Charge</span><span class="font-mono">${fmt(det.stdMFC)}</span></div>
                        <div class="flex justify-between text-gray-400 italic"><span>Taxes & Surcharges</span><span class="font-mono">${fmt(stdTax)}</span></div>
                    </div>
                    <div class="flex justify-between font-black text-lg text-gray-800 pt-1 border-t mt-2"><span>Total Bill</span><span>${fmt(cur.stdTotal)}</span></div>
                </div>
            </div>`;
        const content = document.getElementById('detailsContent');
        if (content) content.innerHTML = html;
    }

        function renderAnnualChart() {
            if (typeof Chart === 'undefined') return;
            const ctx = document.getElementById('annualChart').getContext('2d');
            if (chartInstance) chartInstance.destroy();

        let refWeight = SEASON_WEIGHTS[11];
        if (state.billMonth !== 'rolling' && !isNaN(parseInt(state.billMonth))) {
            refWeight = SEASON_WEIGHTS[parseInt(state.billMonth)];
        }
        
        let yStd = 0, ySel = 0;
        let chartLabels = [], chartStd = [], chartSel = [], chartColors = [];

        MONTH_NAMES.forEach((m, i) => {
            let dataForMonth;
            let isReal = false;

            if (parsedMonthlyData[i] && parsedMonthlyData[i].days >= 20) {
                dataForMonth = parsedMonthlyData[i];
                isReal = true;
            } else {
                const r = SEASON_WEIGHTS[i] / refWeight;
                dataForMonth = {
                    totalKwh: state.totalKwh * r,
                    onPeakKwh: state.onPeakKwh * r,
                    offPeakKwh: state.offPeakKwh * r,
                    peakKw: state.peakKw * Math.pow(r, 0.6),
                    peakKwOff: state.peakKwOff * Math.pow(r, 0.6)
                };
            }

            const est = calculate(dataForMonth, i.toString());
            yStd += est.stdTotal;
            ySel += est.selTotal;

            chartLabels.push(m);
            chartStd.push(est.stdTotal);
            chartSel.push(est.selTotal);
            chartColors.push(isReal ? '#4285f4' : '#d1d5db');
        });

        const setTxt = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
        setTxt('yearlyStd', `$${yStd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
        setTxt('yearlySel', `$${ySel.toLocaleString(undefined, { maximumFractionDigits: 0 })} / YEAR`);
        const ySav = yStd - ySel;
        const annualPct = (Math.abs(ySav) / yStd) * 100;
        setTxt('yearlySavings', `${ySav >= 0 ? '-' : '+'}$${Math.abs(ySav).toLocaleString(undefined, { maximumFractionDigits: 0 })} (${annualPct.toFixed(1)}%) ${ySav >= 0 ? 'SAVINGS' : 'EXTRA'}`);

        const realCount = Object.keys(parsedMonthlyData).filter(k => parsedMonthlyData[k].days >= 20).length;
        setTxt('baseMonthLabel', realCount > 0 ? `${realCount} Verified Months + Estimates` : (MONTH_NAMES[state.billMonth] || "Estimated"));

        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [
                    { label: 'Standard', data: chartStd, backgroundColor: '#9ca3af', order: 2 },
                    { label: 'Select (Verified)', data: chartSel, backgroundColor: chartColors.map(c => c === '#4285f4' ? '#4285f4' : 'transparent'), borderColor: '#4285f4', borderWidth: { top: 0, right: 0, bottom: 0, left: 0 }, order: 1 },
                    { label: 'Select (Estimated)', data: chartSel, backgroundColor: chartColors.map(c => c === '#d1d5db' ? '#d1d5db' : 'transparent'), order: 3 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: true, labels: { boxWidth: 10, font: { size: 10 }, filter: (l) => l.text !== 'Select (Verified)' } }, tooltip: { mode: 'index', intersect: false } },
                scales: { x: { stacked: false, grid: { display: false } }, y: { beginAtZero: true, display: false } }
            }
        });
    }

    function renderHistoryChart(monthlyData) {
        if (typeof Chart === 'undefined') return;
        const ctx = document.getElementById('historyChart').getContext('2d');
        if (historyChartInstance) historyChartInstance.destroy();

        const keys = Object.keys(monthlyData).filter(k => k !== 'rolling').sort((a,b)=>parseInt(a)-parseInt(b));
        const labels = keys.map(k => `${MONTH_NAMES[k]} (${monthlyData[k].days}d)`);
        
        historyChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'On-Peak', data: keys.map(k => monthlyData[k].onPeakKwh), backgroundColor: '#fcd34d', stack: '0' },
                    { label: 'Off-Peak', data: keys.map(k => monthlyData[k].offPeakKwh), backgroundColor: '#93c5fd', stack: '0' }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true } },
                plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 8, font: { size: 9 } } } }
            }
        });
    }

    function render() {
        if (!state.billMonth) state.billMonth = '11';
        const cur = calculate(state, state.billMonth);
        const savings = cur.stdTotal - cur.selTotal;
        const fmt = (v) => `$${v.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        const fmt0 = (v) => `$${v.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        
        const setTxt = (id, txt) => { const el = document.getElementById(id); if(el) el.textContent = txt; };
        
        setTxt('stdDel', fmt(cur.stdDel));
        setTxt('stdSup', fmt(cur.stdSup));
        setTxt('stdTotal', fmt(cur.stdTotal));
        setTxt('stdEff', `$${(cur.stdTotal/(state.totalKwh||1)).toFixed(3)}`);
        setTxt('selDel', fmt(cur.selDel));
        setTxt('selSup', fmt(cur.selSup));
        setTxt('selTotal', fmt(cur.selTotal));
        setTxt('selEff', `$${(cur.selTotal/(state.totalKwh||1)).toFixed(3)}`);

        let monthIdx = state.billMonth === 'rolling' ? 0 : parseInt(state.billMonth);

        const card = document.getElementById('savingsCard');
        const sl = document.getElementById('savingsLabel');
        const sa = document.getElementById('savingsAmount');
        const sp = document.getElementById('savingsPercent');

        if (savings >= 0) {
            card.className = 'card bg-green-50 border-green-100 text-center';
            sl.className = 'text-[10px] font-bold uppercase text-green-600 mb-1';
            sl.textContent = 'Estimated Savings';
            sa.className = 'text-4xl font-black text-green-700';
            sa.textContent = fmt0(savings);
            sp.className = 'text-xs font-bold text-green-600 mt-1 uppercase tracking-tight';
            sp.textContent = `${((savings/cur.stdTotal)*100).toFixed(1)}% SAVINGS`;
        } else {
            card.className = 'card bg-orange-50 border-orange-100 text-center';
            sl.className = 'text-[10px] font-bold uppercase text-orange-600 mb-1';
            sl.textContent = 'Extra Cost';
            sa.className = 'text-4xl font-black text-orange-700';
            sa.textContent = fmt0(Math.abs(savings));
            sp.className = 'text-xs font-bold text-orange-600 mt-1 uppercase tracking-tight';
            sp.textContent = `${((Math.abs(savings)/cur.stdTotal)*100).toFixed(1)}% MORE EXPENSIVE`;
        }

        renderAnnualChart();
        if (!document.getElementById('detailsModal').classList.contains('hidden')) renderDetails();
    }

    function syncToUrl() {
        if(Object.keys(parsedMonthlyData).length > 0) {
            const parts = [];
            Object.keys(parsedMonthlyData).filter(k=>k!=='rolling').forEach(k => {
                const d = parsedMonthlyData[k];
                // New Format: Month, Total, OnPeak, OffPeak, PeakKW, OffPeakKW, Days
                if (d.days > 5) parts.push(`${k},${d.totalKwh},${d.onPeakKwh},${d.offPeakKwh},${d.peakKw},${d.peakKwOff},${d.days}`);
            });
            window.location.hash = 'data=' + parts.join('|');
        } else {
            const p = new URLSearchParams(state);
            window.history.replaceState(null, '', '#' + p.toString());
        }
    }

    function loadFromUrl() {
        const hash = window.location.hash.slice(1);
        if(hash.startsWith('data=')) {
            try {
                const raw = hash.split('data=')[1];
                raw.split('|').forEach(chunk => {
                    const p = chunk.split(',').map(Number);
                    // Updated to handle 7 params (removed superpeak at idx 4)
                    // Old: k, tot, on, off, super, peak, offpeak, days (8 items)
                    // New: k, tot, on, off, peak, offpeak, days (7 items)

                    if (p.length >= 7) {
                        parsedMonthlyData[p[0]] = {
                            totalKwh: p[1], onPeakKwh: p[2], offPeakKwh: p[3],
                            peakKw: p[4], peakKwOff: p[5], days: p[6], label: MONTH_NAMES[p[0]]
                        };
                    } else if (p.length >= 8) {
                        // Backward compat: Ignore index 4 (super peak)
                        parsedMonthlyData[p[0]] = {
                            totalKwh: p[1], onPeakKwh: p[2], offPeakKwh: p[3], 
                            peakKw: p[5], peakKwOff: p[6], days: p[7], label: MONTH_NAMES[p[0]]
                        };
                    }
                });
                initDropdown();
                const keys = Object.keys(parsedMonthlyData).map(Number).sort((a,b)=>b-a);
                const fullMonth = keys.find(k => parsedMonthlyData[k].days >= 28);
                state.billMonth = (fullMonth !== undefined ? fullMonth : keys[0]).toString();
                
                document.getElementById('dropStatus').textContent = `✅ Loaded shared data (${Object.keys(parsedMonthlyData).length} months)`;
                document.getElementById('dropStatus').className = "text-[10px] text-green-600 font-bold";
                document.getElementById('historyCard').classList.remove('hidden');
                renderHistoryChart(parsedMonthlyData);
            } catch(e) { console.error(e); }
        } else if (hash) {
            const p = new URLSearchParams(hash);
            for (const [k, v] of p) {
                if (k !== 'superPeakKwh') state[k] = v;
            }
        }
    }

    function processGlobalIntervals() {
        if(globalIntervals.size === 0) return;

        const intervals = Array.from(globalIntervals.entries())
            .map(([ts, kwh]) => ({ ts, kwh }))
            .sort((a,b) => a.ts - b.ts);

        const months = {};
        
        intervals.forEach(i => {
            const date = new Date(i.ts);
            const mKey = date.getMonth(); 
            if (!months[mKey]) months[mKey] = { raw: [], total: 0, onPeak: 0, offPeak: 0, days: new Set() };
            
            months[mKey].raw.push(i);
            months[mKey].days.add(date.toDateString());
            months[mKey].total += i.kwh; 
            
            const hour = date.getHours();
            const day = date.getDay();
            const isWeekday = (day >= 1 && day <= 5);
            // No Super Peak check anymore. Just 12pm-8pm M-F is On-Peak.
            let bucket = 'off';
            if (isWeekday && hour >= 12 && hour < 20) {
                bucket = 'on';
            }

            if (bucket === 'on') months[mKey].onPeak += i.kwh;
            else months[mKey].offPeak += i.kwh;
        });

        const getTop3Avg = (dict) => {
            const peaks = Object.values(dict).sort((a,b) => b - a).slice(0, 3);
            if (peaks.length === 0) return 0;
            return peaks.reduce((a,b) => a+b, 0) / peaks.length;
        };

        Object.keys(months).forEach(mIdx => {
            if(months[mIdx].days.size < 2) return;

            const m = months[mIdx];
            const readings = m.raw.sort((a,b) => a.ts - b.ts);
            const dayPeaks = { on: {}, off: {} };
	    const msPerHour = 3600000;

	    let nextI = 0;
            for (let i = 0; i < readings.length; i = nextI) {
		nextI = i + 1;

		// Compute the index of the hour that this sample corresponds to.
		const hourStartIndex = Math.floor(readings[i].ts / msPerHour);
		// Slide forward to select samples in the same hour.
		while (nextI < readings.length) {
		    const hourIndex = Math.floor(readings[nextI].ts / msPerHour);
		    if (hourIndex != hourStartIndex) {
			break;
		    }
		    nextI++;
		}
                const window = readings.slice(i, nextI);

                const avgKw = window.reduce((a, b) => a + b.kwh, 0); 
                const midTime = new Date(window[Math.floor((window.length - 1) / 2)].ts);
                const hour = midTime.getHours();
                const day = midTime.getDay();
                // 12pm-8pm is peak for Demand charges as well
                const isPeak = (day >= 1 && day <= 5) && (hour >= 12 && hour < 20);
                const target = isPeak ? dayPeaks.on : dayPeaks.off;
                const dayStr = midTime.toDateString();
                if (!target[dayStr] || avgKw > target[dayStr]) target[dayStr] = avgKw;
            }

            parsedMonthlyData[mIdx] = {
                totalKwh: Math.round(m.total),
                onPeakKwh: Math.round(m.onPeak),
                offPeakKwh: Math.round(m.offPeak),
                peakKw: parseFloat(getTop3Avg(dayPeaks.on).toFixed(2)),
                peakKwOff: parseFloat(getTop3Avg(dayPeaks.off).toFixed(2)),
                label: MONTH_NAMES[mIdx],
                days: m.days.size
            };
        });

        initDropdown();
        
        const keys = Object.keys(parsedMonthlyData).filter(k=>k!=='rolling').map(Number).sort((a,b)=>b-a);
        const fullMonth = keys.find(k => parsedMonthlyData[k].days >= 20);
        
        if (fullMonth !== undefined) state.billMonth = fullMonth.toString();
        else if (parsedMonthlyData['rolling']) state.billMonth = 'rolling';
        else if (keys.length) state.billMonth = keys[0].toString();

        renderHistoryChart(parsedMonthlyData);
        
        const count = Object.keys(parsedMonthlyData).filter(k=>k!=='rolling').length;
        const ds = document.getElementById('dropStatus');
        ds.textContent = `✅ Merged ${count} months. Total intervals: ${globalIntervals.size}`;
        ds.className = "text-[10px] text-green-600 font-bold";
        document.getElementById('historyCard').classList.remove('hidden');
        render(); 
    }

    async function handleFile(file) {
        const status = document.getElementById('dropStatus');
        status.textContent = "Processing " + file.name + "...";
        status.className = "text-[10px] text-blue-500 font-bold";

        try {
            let text = "";
            let isXml = file.name.endsWith('.xml');

            if (file.name.endsWith('.zip')) {
                const zip = await JSZip.loadAsync(file);
                // Get ALL CSV and XML files
                const validFiles = Object.values(zip.files).filter(f => !f.dir && (f.name.endsWith('.csv') || f.name.endsWith('.xml')));
                
                if (validFiles.length === 0) throw new Error("No CSV/XML found in ZIP");

                const promises = validFiles.map(async f => {
                    const text = await f.async("string");
                    if (f.name.endsWith('.xml')) parseIntervalXML(text);
                    else parseIntervalCSV(text);
                });
                
                await Promise.all(promises);
            } else {
                text = await file.text();
                if (!isXml && text.trim().startsWith("<?xml")) isXml = true;
                if (isXml) parseIntervalXML(text);
                else parseIntervalCSV(text);
            }
            
            processGlobalIntervals();

        } catch (e) {
            console.error(e);
            status.textContent = "❌ " + e.message;
            status.className = "text-[10px] text-red-500 font-bold";
        }
    }

    function parseIntervalCSV(csv) {
        const lines = csv.split('\n');
        let headerIdx = -1;
        let hParts = [];
        
        for (let i = 0; i < Math.min(lines.length, 20); i++) {
            const line = lines[i];
            // Header Hunt
            if (line.includes("START TIME") || (line.includes("TYPE") && line.includes("DATE"))) {
                headerIdx = i;
                hParts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.trim().replace(/"/g, ''));
                break;
            }
        }
        
        if (headerIdx === -1) return;

        const dateIdx = hParts.findIndex(h => h.includes("DATE") && !h.includes("END"));
        const timeIdx = hParts.findIndex(h => h.includes("START TIME"));
        let usageIdx = hParts.findIndex(h => h === "USAGE" || h.includes("USAGE (kWh)"));
        const importIdx = hParts.findIndex(h => h.includes("IMPORT"));
        const exportIdx = hParts.findIndex(h => h.includes("EXPORT"));
        
        for (let i = headerIdx + 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;
            const p = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
            if (p.length < 4) continue;
            
            const clean = (s) => parseFloat(s ? s.replace(/[",]/g, '') : 0);
            let kwh = 0;

            if (usageIdx !== -1) kwh = clean(p[usageIdx]);
            else if (importIdx !== -1 && exportIdx !== -1) kwh = clean(p[importIdx]) - clean(p[exportIdx]);
            else if (p.length >= 5) kwh = clean(p[4]); 

            if (!isNaN(kwh) && p[dateIdx] && p[timeIdx]) {
                const ts = new Date(`${p[dateIdx]}T${p[timeIdx]}`).getTime();
                if(!isNaN(ts)) globalIntervals.set(ts, kwh);
            }
        }
    }

    function parseIntervalXML(xml) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "text/xml");
        const readings = Array.from(doc.getElementsByTagName("IntervalReading"));
        if (!readings.length) return;
        
        const temp = [];
        readings.forEach(r => {
            const valNode = r.getElementsByTagName("value")[0];
            const timeNode = r.getElementsByTagName("timePeriod")[0];
            const startNode = timeNode ? timeNode.getElementsByTagName("start")[0] : null;
            if (valNode && startNode) {
                temp.push({ ts: parseInt(startNode.textContent) * 1000, val: parseInt(valNode.textContent) });
            }
        });
        
        const nonZeros = temp.filter(i => i.val > 0);
        const avg = nonZeros.length ? nonZeros.reduce((a,b) => a+b.val, 0) / nonZeros.length : 0;
        const multiplier = avg > 10 ? 0.001 : 1; 

        temp.forEach(i => globalIntervals.set(i.ts, i.val * multiplier));
    }

    // --- Global Helpers ---
    window.toggleHelp = function(e) {
        if(e) e.stopPropagation();
        document.getElementById('helpModal').classList.toggle('hidden');
    };

    window.toggleDetails = function() {
        const modal = document.getElementById('detailsModal');
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
            renderDetails();
        } else {
            modal.classList.add('hidden');
        }
    };

    window.clearData = function() {
        parsedMonthlyData = {};
        globalIntervals.clear();
        initDropdown();
        
        Object.keys(DEFAULT_STATE).forEach(key => {
            if (key !== 'billMonth') state[key] = DEFAULT_STATE[key];
        });
        state.billMonth = '11';
        updateDOM(Object.keys(DEFAULT_STATE));

        document.getElementById('historyCard').classList.add('hidden');
        const ds = document.getElementById('dropStatus');
        ds.textContent = "Drop \"Export usage\" files here to accumulate history";
        ds.className = "text-[10px] text-gray-400";
        history.replaceState(null, '', window.location.pathname);
    };
    
    // --- Window Assignments ---
    window.reset = function() { window.clearData(); };
    window.toggleDetails = toggleDetails;
    window.toggleHelp = toggleHelp;

    window.onload = () => {
        initDropdown();
        loadFromUrl();
        render();
    };

        ['totalKwh', 'onPeakKwh', 'offPeakKwh', 'peakKw', 'peakKwOff', 'billMonth'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', (e) => state[id] = e.target.value);
    });
    
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    
        if (dropZone) {
        dropZone.addEventListener('click', (e) => {
            if (e.target !== fileInput && !e.target.closest('button')) {
                fileInput.click();
            }
        });

        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-active'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-active'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-active');
            if (e.dataTransfer.files.length) {
                Array.from(e.dataTransfer.files).forEach(f => handleFile(f));
            }
        });
        }
        if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            Array.from(e.target.files).forEach(f => handleFile(f));
        });
        }

        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) resetBtn.onclick = window.clearData;

        const testBtn = document.getElementById('testBtn');
        if (testBtn) testBtn.onclick = () => alert("Validation tests disabled.");
