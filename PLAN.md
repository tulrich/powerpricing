Project: Power Pricing Estimator

Goal: A single-file, mobile-friendly tool to compare ConEd Volumetric vs. Select Pricing for NYC heat pump users.

Phase 1: Foundation

- [x] Single HTML file boilerplate with Tailwind CSS.
- [x] Define 2026 ConEd Rate Constants (Standard vs. Select).
- [x] Create manual input form (Monthly kWh, Peak kW).
- [x] Provide a whole-year estimate based on basic manual input.
      - The user specifies what month their input is for; the UI estimates
        the other months and gives a whole-year estimate of bills.  The
        whole-year estimate is clearly marked as approximate (perhaps with
        ranges instead of exact numbers).
- [x] Persist state to URL for easy sharing
- [x] Share with local mailing lists
- [x] Refine UI. When the Select Plan is more expensive than standard, the UI should color the results differently (yellow for similar, red for expense instead of savings). And rephrase the "savings" terminology so users dont get confused.
- [x] Link to ConEd SPP pages.
- [x] Refine UI. Offer a click for a detailed bill breakdown (to help educate users about how the pricing plans work).
- [x] Refine the UI: with the estimated annual results, show a graph with the estimated monthly results.

Phase 2: Data Intelligence

- [x] Implement "Green Button" XML/CSV .zip parser.
- [x] Logic to extract peak demand (kW) and total usage (kWh) from intervals.
- [x] Comparison visualization (Standard vs. Select).
- [x] Handle net metering logic. Certainly the charges won't go
      negative if usage is negative, so we need to clamp negative
      values in the bill calcuation.  It seems from my Select Pricing
      bill there are KWH "bank balances" for On Peak and Off Peak
      buckets. So probably in months where my PV production exceeds
      consumption I would start having a "Cumulative Credit kWh" that
      would deduct from billed kWh in subsequent months in each bucket.
- [ ] Fix the Bill Summary data upload.

Phase 3: Improve Software

- [x] Implement a lightweight test framework that can be run against
      the single-file index.html. Put it in a test/ subdirectory.
      This can be a real framework that does not manifest inside our
      index.html but is able to test it as-is, so we can do heavier weight
      tests during development. Test things like the green button uploads
      with real files to make sure our math remains correct.
- [ ] Refactor the code to be a bit more compact and clear. Use small helpers
      to improve the layout code, use CSS more judiciously to cut out on
      repetitive html templates, break out some helper functions, use more
      comments in the code to explain intent.

Phase 4: Let User Configure Their Usage

Many users won't know their peak demand and may not be able to figure
out the Green Button download, but they hopefully know how much their
bill is. This info may help us guess demand for those users. Also the
info will be helpful for analysis even when usage is known.

- [ ] User gives typical bill for a particular month; use this to
      back-out kwh (or let them specify it if they have it from their
      bill)
- [ ] Specify location/climate zone
- [ ] Specify heating type (combustion fuel, air source HP, ground source HP, hybrid)
- [ ] Car charging (miles/year)
- [ ] Electric or gas stove, oven
- [ ] Electric or gas dryer
- [ ] Hot water: gas/oil, electric, electric heat pump
- [ ] Electric hot tub?
- [ ] PV (size in KW)

Phase 5: Advanced Analysis

- [ ] Support Emporia Vue data upload.
- [ ] Nice visualization of usage data - show the peaks that impacted demand charges.
- [ ] Estimate likely impact of changing any of the configuration options.
- [ ] Based on green button or Vue data, figure out which hours contributed to the peak
      calcs and try to break out the contributors. If we have Vue data, we may
      have per-circuit hourly usage and we could identify which circuit contributed to
      peaks.
- [ ] Estimate likely impact of behavior changes (e.g. shift timing of dryer usage,
      pre-heating or pre-cooling, etc).
- [ ] Offline support via Service Worker.
- [ ] Support other utilities/regions
- [ ] Crowd sourcing: button for "my bill is different". Link to a Google Form where users
      can volunteer their actual bill data (prepopulated with their exisiting input)
      including a release for using the data to improve estimation.
