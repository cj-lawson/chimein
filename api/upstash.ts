import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.VITE_VERCEL_UPSTASH_REDIS_URL!,
  token: process.env.VITE_VERCEL_UPSTASH_REDIS_TOKEN!,
})
