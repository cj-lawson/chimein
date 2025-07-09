// api/createPoll.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'
import { nanoid } from 'nanoid'

type ClientOption = { id: string; value: string; count: number }

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const { question, options } = req.body as {
    question?: string
    options?: ClientOption[]
  }

  // single guard covers both
  if (!question || !options?.length) {
    return res.status(400).json({ error: 'Missing question or options' })
  }

  const pollId = nanoid()

  // no optional-chaining here because we already know options exists
  const optionList = options.map(({ value }) => {
    const optionId = nanoid()
    return {
      optionId,
      option: { id: optionId, type: 'text', value, count: 0 },
    }
  })

  // votes hash  { optionId: 0, … }
  const votesInit = Object.fromEntries(optionList.map((o) => [o.optionId, 0]))

  await redis
    .pipeline()
    .hset(`poll:${pollId}`, {
      question,
      options: JSON.stringify(optionList), // <-- valid JSON string
    })
    .hset(`poll:${pollId}:votes`, votesInit)
    .exec()

  return res.status(201).json({ pollId })
}
