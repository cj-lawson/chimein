import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { id } = req.query as { id?: string }
  if (!id) {
    return res.status(400).json({ error: 'Missing poll id' })
  }

  const meta = await redis.hgetall(`poll:${id}`)

  if (!meta?.question) {
    return res.status(404).json({ error: 'Poll not found' })
  }

  console.log(meta.options)

  return res
    .status(200)
    .json({ question: meta.question, options: meta.options })
}
