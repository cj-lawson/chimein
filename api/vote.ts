import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
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

    // const newCount = await redis.hincrby(`poll:${pollId}:votes`, optionId, 1)
    const [c, t] = (await redis
      .pipeline()
      .hincrby(`poll:${pollId}:votes`, optionId, 1)
      .hincrby(`poll:${pollId}:meta`, 'totalVotes', 1) // store a running total
      .exec()) as [number, number]

    const newCount = Number(c)
    const newTotal = Number(t)

    // Publish the updated count for real-time listeners
    // Clients subscribed to "poll:{pollId}" via SSE or WebSockets will receive this.
    await redis.publish(
      `poll:${pollId}`,
      JSON.stringify({ optionId, count: newCount, totalVotes: newTotal }),
    )

    return res
      .status(200)
      .json({ optionId, count: newCount, totalVotes: newTotal })
  } catch (err: any) {
    console.error('vote error:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
