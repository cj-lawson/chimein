//vote.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Debug logging for production
    console.log('Environment check:', {
      hasRedisUrl: !!process.env.UPSTASH_REDIS_URL,
      hasRedisToken: !!process.env.UPSTASH_REDIS_TOKEN,
      nodeEnv: process.env.NODE_ENV,
    })

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: 'Method Not Allowed' })
    }

    const { pollId, optionId } = req.body as {
      pollId?: string
      optionId?: string
    }

    if (!pollId || !optionId) {
      return res.status(400).json({ error: 'Missing pollId or optionId' })
    }

    console.log(`Processing vote for poll: ${pollId}, option: ${optionId}`)

    // Update vote counts atomically
    const [c, t] = (await redis
      .pipeline()
      .hincrby(`poll:${pollId}:votes`, optionId, 1)
      .hincrby(`poll:${pollId}:meta`, 'totalVotes', 1)
      .exec()) as [number, number]

    const newCount = Number(c)
    const newTotal = Number(t)

    console.log(`New counts - option: ${newCount}, total: ${newTotal}`)

    // Prepare the message to publish
    const message = JSON.stringify({
      optionId,
      count: newCount,
      totalVotes: newTotal,
    })

    const channel = `poll:${pollId}`
    console.log(`Publishing to channel: ${channel}`, message)

    // Publish the updated count for real-time listeners
    const delivered = await redis.publish(channel, message)

    console.log(
      `Message published to ${delivered} subscribers on channel: ${channel}`,
    )

    return res.status(200).json({
      optionId,
      count: newCount,
      totalVotes: newTotal,
      delivered, // Include this for debugging
    })
  } catch (err: any) {
    console.error('Vote error:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
