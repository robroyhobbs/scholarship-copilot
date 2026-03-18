interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const requestBuckets = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  userId: string,
  action: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const key = `${userId}:${action}`;
  const existing = requestBuckets.get(key);

  if (!existing || now >= existing.resetAt) {
    requestBuckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  requestBuckets.set(key, existing);

  return {
    allowed: true,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

export function resetRateLimits() {
  requestBuckets.clear();
}
