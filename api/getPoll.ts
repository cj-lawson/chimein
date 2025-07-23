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
  if (!id) return res.status(400).json({ error: 'Missing poll id' })

  const meta = await redis.hgetall(`poll:${id}`)
  if (!meta?.question) return res.status(404).json({ error: 'Poll not found' })

  // ---------- votes hash ----------
  const rawVotes = await redis.hgetall<Record<string, string>>(
    `poll:${id}:votes`,
  )
  const votes: Record<string, string> = rawVotes ?? {}

  // ---------- parse options safely ----------
  let parsed: {
    optionId: string
    option: {
      id: string
      type: 'text'
      value: string
      count: number
      totalVotes: number
    }
  }[]

  if (typeof meta.options === 'string') {
    try {
      parsed = JSON.parse(meta.options)
    } catch {
      console.warn(`poll:${id} has corrupt JSON, returning empty list`)
      parsed = []
    }
  } else if (Array.isArray(meta.options)) {
    // Already an array – just use it
    parsed = meta.options
  } else {
    parsed = []
  }

  // ---------- merge counts ----------
  const options = parsed.map((o) => ({
    ...o,
    option: {
      ...o.option,
      count: parseInt(votes[o.optionId] ?? '0', 10),
    },
  }))

  const rawTotal = await redis.hget(`poll:${id}:meta`, 'totalVotes')
  const totalVotes = rawTotal
    ? parseInt(rawTotal.toString(), 10)
    : options.reduce((s, o) => s + o.option.count, 0)

  return res.status(200).json({ question: meta.question, options, totalVotes })
}
