# JMeter Load Tests

Load test for the login endpoint, `POST /api/auth/login`.

## Pass criterion

**95th percentile response time under 500 ms at 30 concurrent users.**

## Load profile

| Stage | Window | Virtual users |
|---|---|---|
| 1 | 0 – 5s | ramp 0 → 10 |
| 2 | 5 – 25s | 30 (measurement window) |
| 3 | 25 – 30s | step down to 0 |

The profile is built from two vanilla JMeter thread groups:

| Thread group | Threads | Ramp-up | Delay | Duration |
|---|---|---|---|---|
| Stage 1 and 3 — baseline | 10 | 5s | 0s | 30s |
| Stage 2 — lift to 30 | 20 | 1s | 5s | 20s |

They overlap to produce the shape above: the baseline group carries 10 users for the whole run, and the second group adds 20 more for the middle 20 seconds.

**One deviation worth knowing.** A stock JMeter thread group has no ramp-*down* — threads simply stop when their duration elapses. The tail is therefore a step (30 → 10 users at t=25s, → 0 at t=30s) rather than a smooth 5-second glide to zero. A true linear ramp-down needs the `jpgc-casutg` Ultimate Thread Group plugin, which is not installed in `C:\dev\tools\apache-jmeter-5.6.3`. The step affects only the final 5 seconds, which sit outside the 30-user measurement window, so it does not affect the threshold result.

## Test data

Taken from the README's [Existent Data](../../README.md#existent-data) section — the seeded user `alice@example.com` / `Password123`. Every request asserts HTTP 200 and that a `token` came back, so a run cannot pass on fast error responses.

## Running it

Start the API first:

```bash
npm start                 # listens on port 3000
```

Then, from the repository root:

```bash
"C:\dev\tools\apache-jmeter-5.6.3\bin\jmeter" -n \
  -t test/jmeterTesting/login-load-test.jmx \
  -l test/jmeterTesting/results/results.jtl \
  -e -o test/jmeterTesting/results/html \
  -j test/jmeterTesting/results/jmeter.log
```

Open `test/jmeterTesting/results/html/index.html` for the dashboard. The `results/` directory is generated output and is not committed.

### Overriding targets

Every setting is a JMeter property, so nothing needs editing to point the script elsewhere:

```bash
-Jhost=staging.example.com -Jport=443 -Jprotocol=https
-Jemail=bob@example.com -Jpassword=Password123
```

Defaults are `http://localhost:3000` with the seeded user.
