import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

const channel = 'test'
const payload = { hello: 'world', ts: Date.now() }

async function main() {
  const delivered = await redis.publish(channel, JSON.stringify(payload))
  console.log(`Published to "${channel}" -> ${delivered} subsribers`)
}

main()
