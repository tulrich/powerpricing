Project: Power Pricing Estimator

​Goal: A single-file, mobile-friendly tool to compare ConEd Volumetric vs. Select Pricing for NYC heat pump users.

​Phase 1: Foundation

​- [x] Single HTML file boilerplate with Tailwind CSS.
​- [x] Define 2026 ConEd Rate Constants (Standard vs. Select).
- ​[x] Create manual input form (Monthly kWh, Peak kW).
- [x] Provide a whole-year estimate based on basic manual input.
  - The user specifies what month their input is for; the UI estimates
    the other months and gives a whole-year estimate of bills.  The
    whole-year estimate is clearly marked as approximate (perhaps with
    ranges instead of exact numbers).
- [x] Persist state to URL for easy sharing
- [x] Share with local mailing lists
- [ ] Refine UI. When the Select Plan is more expensive than standard, the UI should color the results differently (yellow for similar, red for expense instead of savings). And rephrase the "savings" terminology so users dont get confused.
- [ ] Link to ConEd SPP pages.
- [ ] Refine UI. Offer a click for a detailed bill breakdown (to helo educate users about how the pricing plans work).
- [ ] Refine the UI: with the estimated annual results, show a graph with the estimated monthly results.

​Phase 2: Data Intelligence

​- [ ] Implement "Green Button" XML/CSV parser.
​- [ ] Logic to extract peak demand (kW) and total usage (kWh) from intervals.
- ​[ ] Comparison visualization (Standard vs. Select).

​Phase 3: Extended Features

- ​[ ] "Share" functionality (generate a link with params).
- [ ] Support Emporia Vue data upload
- [ ] Options for estimating based on
  - [ ] Solar PV
  - [ ] AC usage
  - [ ] electric vs gas dryers. stoves
  - [ ] Car charging
- [ ] Analyze possible cost/benefit of changes.
  - [ ] Switching any of the above options.
  - [ ] Using green button data, figure out which hours contributed to the peak
        calcs and try to break out the contributors. If we have Vue data, we may
        have per-circuit hourly usage and we could identify car charging, heat pump,
        water heater, stove/oven, dryer, what-have-you...
- ​[ ] Offline support via Service Worker.
- [ ] Crowd sourcing of bill experiences, validation of estimates.
- [ ] Support other utilities/regions
- [ ] Button for "my bill is different". Link to a Google Form where users can volunteer their actual data (prepopulated with their exisiting input) including a release for using the data to improve estimation.
