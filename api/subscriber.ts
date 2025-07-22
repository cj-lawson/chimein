import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

const channel = 'test'

const sub = redis.subscribe(channel)
sub.on(`message:${channel}`, (e) => {
  console.log('Received', e.message)
})
