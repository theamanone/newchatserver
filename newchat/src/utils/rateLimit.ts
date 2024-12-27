import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number;
    lastReset: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Max requests per window

export function rateLimiter(ip: string): boolean {
  const now = Date.now();
  const record = store[ip];

  if (!record) {
    store[ip] = {
      count: 1,
      lastReset: now,
    };
    return true;
  }

  if (now - record.lastReset > WINDOW_MS) {
    store[ip] = {
      count: 1,
      lastReset: now,
    };
    return true;
  }

  if (record.count >= MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((ip) => {
    if (now - store[ip].lastReset > WINDOW_MS) {
      delete store[ip];
    }
  });
}, WINDOW_MS);

export const applyRateLimit = async (req: NextRequest, res: NextResponse) => {
  const ip:any = req.ip;
  if (!rateLimiter(ip)) {
    return NextResponse.json(
      { error: 'Too many requests from this IP, please try again later.' },
      { status: 429 }
    )
  }
  return;
}
