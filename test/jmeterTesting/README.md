# JMeter Load Tests

Load test for the login endpoint, `POST /api/auth/login`.

## Pass criterion

**95th percentile response time under 500 ms at 30 concurrent users.**

This is enforced by [`check-threshold.js`](check-threshold.js), which reads the JMeter dashboard's `statistics.json` and exits non-zero if the budget is missed. JMeter itself always exits 0 on a slow-but-successful run, so without this gate a performance regression would pass CI silently.

## Load profile

| Stage | Window | Virtual users |
|---|---|---|
| 1 | 0 – 5s | ramp 0 → 10 |
| 2 | 5 – 25s | 30 (measurement window) |
| 3 | 25 – 30s | linear ramp down to 0 |

Built with a single **Ultimate Thread Group** (`jpgc-casutg`), whose rows are:

| Row | Start threads | Initial delay | Startup | Hold | Shutdown |
|---|---|---|---|---|---|
| 1 | 10 | 0s | 5s | 20s | 5s |
| 2 | 20 | 5s | 0s | 20s | 5s |

Ultimate Thread Group is used rather than Concurrency Thread Group because only Ultimate has an explicit **Shutdown Time**, which is what produces the real ramp-down in stage 3.

## Prerequisites

JMeter with the `jpgc-casutg` plugin. On a stock install:

```bash
JM=/c/dev/tools/apache-jmeter-5.6.3
curl -sSLo "$JM/lib/ext/jmeter-plugins-manager.jar" \
  https://repo1.maven.org/maven2/kg/apc/jmeter-plugins-manager/2.0/jmeter-plugins-manager-2.0.jar
curl -sSLo "$JM/lib/cmdrunner.jar" \
  https://repo1.maven.org/maven2/kg/apc/cmdrunner/2.3/cmdrunner-2.3.jar
java -cp "$JM/lib/ext/jmeter-plugins-manager.jar" org.jmeterplugins.repository.PluginManagerCMDInstaller
"$JM/bin/PluginsManagerCMD.sh" install jpgc-casutg
```

## Test data

The seeded user `alice@example.com` / `Password123` from the README's [Existent Data](../../README.md#existent-data) section. Every request asserts **HTTP 200** and that `$.token` is present in the response, so a run cannot pass on fast error responses.

## Running it

Start the API, then run JMeter and the gate:

```bash
npm start                                    # listens on port 3000

"C:\dev\tools\apache-jmeter-5.6.3\bin\jmeter" -n \
  -t test/jmeterTesting/login-load-test.jmx \
  -l test/jmeterTesting/results/results.jtl \
  -e -o test/jmeterTesting/results/html \
  -Jhttpclient.reset_state_on_thread_group_iteration=false

npm run loadtest:check
```

Open `test/jmeterTesting/results/html/index.html` for the dashboard. `results/` is generated output and is not committed.

### That `-J` flag is not optional

`httpclient.reset_state_on_thread_group_iteration` defaults to **true**, which makes JMeter discard its HTTP connection pool at the end of every thread-group iteration. Since each iteration here is a single login request, that means **a brand new TCP connection per request** — keep-alive is never reused even though both JMeter and the API advertise it.

The difference is not subtle:

| | Default (`true`) | With the flag (`false`) |
|---|---|---|
| Samples in 30s | 18,257 | **28,553** |
| Throughput | 608 req/s | **950 req/s** |
| p95 | 78 ms | **43 ms** |
| Errors | 19.3% | **0%** |
| New sockets | ~1 per request | ~1 per thread |

Those 19.3% errors were `java.net.BindException` — on Windows the dynamic port range is only 16,384 ports (49152–65535), and roughly 18,000 connections in 30 seconds exhausts it. The API was never at fault; it returns `Connection: keep-alive` correctly. Without the flag the test mostly measures TCP handshake cost rather than the endpoint.

If you do hit `BindException`, check `netstat -an | grep -c TIME_WAIT` and wait for the pool to drain (about 30s here) before re-running.

### Overriding targets

Everything is a JMeter property, so nothing needs editing to point elsewhere:

```bash
-Jhost=staging.example.com -Jport=443 -Jprotocol=https
-Jemail=bob@example.com -Jpassword=Password123
```

Defaults are `http://localhost:3000` with the seeded user. The gate takes its own arguments:

```bash
node test/jmeterTesting/check-threshold.js <statistics.json> <thresholdMs>
```

## Continuous integration

[`.github/workflows/load-test.yml`](../../.github/workflows/load-test.yml) runs this on every pull request to `main`. It installs JMeter and the plugin (cached between runs), starts the API, waits for the healthcheck, runs the test with the keep-alive flag set, and then enforces the p95 budget. The dashboard is uploaded as the `jmeter-load-report` artifact.

Shared CI runners are noisier than a developer machine, so absolute numbers there will be worse than local ones. The budget still works as a regression gate — treat a CI failure as "investigate", not "the endpoint is 500 ms slow".
