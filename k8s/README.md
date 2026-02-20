# Kubernetes Resources

This directory contains Kubernetes manifests for HockeyGoTime infrastructure.

## Supabase Keepalive CronJob

Prevents Supabase free tier from auto-pausing due to inactivity by refreshing the venue cache every 6 hours.

### What it does

- POSTs to `https://hockeygotime.net/api/venue/refresh-cache`
- Runs at: 00:00, 06:00, 12:00, 18:00 UTC daily
- Keeps Supabase database active
- Refreshes venue cache (bonus: always fresh data)
- Minimal resources: ~16MB RAM, completes in seconds

### Deployment

**1. Create namespace (if it doesn't exist):**

```bash
kubectl create namespace hockeygotime
```

**2. Apply the CronJob:**

```bash
kubectl apply -f k8s/supabase-keepalive-cronjob.yaml
```

**3. Verify deployment:**

```bash
kubectl get cronjob -n hockeygotime
```

Expected output:
```
NAME                  SCHEDULE      SUSPEND   ACTIVE   LAST SCHEDULE   AGE
supabase-keepalive    0 */6 * * *   False     0        <none>          5s
```

### Testing

**Trigger an immediate test run:**

```bash
kubectl create job --from=cronjob/supabase-keepalive supabase-keepalive-test -n hockeygotime
```

**Check if it succeeded:**

```bash
kubectl get jobs -n hockeygotime
```

Expected output:
```
NAME                       COMPLETIONS   DURATION   AGE
supabase-keepalive-test    1/1           3s         10s
```

**View logs:**

```bash
kubectl logs -n hockeygotime job/supabase-keepalive-test
```

Expected output:
```
Hitting Supabase keepalive endpoint...
{"success":true,"refreshed_at":"2025-11-01T16:35:26.290Z","message":"Cache refreshed successfully. Check console logs for venue/alias counts."}
Success! Database keepalive completed at Fri Nov  1 16:35:26 UTC 2025
```

**Clean up test job:**

```bash
kubectl delete job supabase-keepalive-test -n hockeygotime
```

### Monitoring

**View all jobs (including completed):**

```bash
kubectl get jobs -n hockeygotime
```

**View CronJob status:**

```bash
kubectl describe cronjob supabase-keepalive -n hockeygotime
```

**Check recent job history:**

```bash
kubectl get jobs -n hockeygotime --sort-by=.status.startTime
```

The CronJob keeps the last 8 successful and 8 failed job records (2 days of history).

### Troubleshooting

**If the job fails:**

1. Check logs:
   ```bash
   kubectl logs -n hockeygotime job/<job-name>
   ```

2. Verify the API endpoint is reachable:
   ```bash
   curl -X POST https://hockeygotime.net/api/venue/refresh-cache
   ```

3. Check CronJob configuration:
   ```bash
   kubectl describe cronjob supabase-keepalive -n hockeygotime
   ```

**Common issues:**

- **Network timeout**: Increase timeout in YAML if needed (currently 60s)
- **DNS resolution**: Ensure cluster has external DNS configured
- **API endpoint down**: Check Next.js app deployment status

### Uninstall

```bash
kubectl delete cronjob supabase-keepalive -n hockeygotime
```

This will also stop all future scheduled jobs.

### Resource Usage

- **CPU**: 10m request, 50m limit
- **Memory**: 16Mi request, 32Mi limit
- **Duration**: ~2-5 seconds per run
- **Network**: Single HTTP POST request

Very minimal impact on your cluster resources.

---

## Upstash Keepalive CronJob

Prevents Upstash free-tier Redis from inactivity suspension by sending a lightweight `PING` every 6 hours.

### What it does

- Calls `${UPSTASH_REDIS_REST_URL}/ping` with bearer auth token
- Runs at: 00:00, 06:00, 12:00, 18:00 UTC daily
- Keeps Upstash Redis active
- Minimal resources: ~16MB RAM, completes in seconds

### Deployment

1. Create/update secret from local env values:

```bash
set -a
source ~/.openclaw/.env
set +a

kubectl create secret generic upstash-credentials \
  -n hockeygotime \
  --from-literal=UPSTASH_REDIS_REST_URL="$UPSTASH_REDIS_REST_URL" \
  --from-literal=UPSTASH_REDIS_REST_TOKEN="$UPSTASH_REDIS_REST_TOKEN" \
  --dry-run=client -o yaml | kubectl apply -f -
```

2. Apply CronJob:

```bash
kubectl apply -f k8s/upstash-keepalive-cronjob.yaml
```

3. Verify:

```bash
kubectl get cronjob -n hockeygotime | grep upstash
```

### Testing

```bash
kubectl create job --from=cronjob/upstash-keepalive upstash-keepalive-test -n hockeygotime
kubectl logs -n hockeygotime job/upstash-keepalive-test
kubectl delete job upstash-keepalive-test -n hockeygotime
```
