# powerpricing

An app for estimating electricity bills under different rate plans and usage patterns.

The initial version is based on my local utility, ConEd in New York city, which offers a traditional volumetric rate plan (you pay for the total kwh used in a month) and also a newer Select Pricing Plan that takes into account the peak power usage during the month and has different usage rates for different times of day. Select Pricing is quite complicated but designed to better reflect the actual costs of running the system and incentivize more efficient behaviors and choices. For heat pump users, it can significantly reduce bills! But its tricky to estimate ahead of time, so I vibe coded this app to help. 

## Select Pricing Notes

From trying to decipher the ConEd material, I belive Select Pricing
Plan is also known as "EL1 - Residential and Religious - Rate IV -
Rider Z". While the standard rate plan would be "EL1 - Residential and
Religious - Rate I". I think Rate III is a voluntary Time of Use plan
(this one has a Super Peak in the summer between 2-6pm). They also use
"SC1" to refer to the Residential and Religious customer category, so
sometimes Select Pricing may be called "SC1 Rate IV".

## Background Links

https://www.ny-geo.org/assets/pdf/2024.03.22+-+Con+Edison+SPP+on+Lets+Talk/
https://www.coned.com/en/accounts-billing/select-pricing-plan

## Development

### Running Unit Tests

This project uses `vitest` for unit testing. The tests run against the logic embedded in `index.html` by extracting it to a temporary file.

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run tests:
   ```bash
   npm test
   ```

3. Code Structure for Testing:
   - `index.html`: Contains the source of truth for logic.
   - `test/prepare.js`: Extracts the `<script>` content from `index.html`.
   - `test/unit/calculations.test.js`: Unit tests for the billing logic.
