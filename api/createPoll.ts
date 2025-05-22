import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'
import { nanoid } from 'nanoid'

type Option = {
  id: number
  value: string
  type: 'text'
}

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
    options?: Array<[Option]>
  }
  console.log(options)
  if (!question) {
    return res.status(400).json({ error: "Missing 'question' field" })
  }
  const pollId = nanoid()

  const optionList = options?.map((o) => ({ optionId: nanoid(), text: o }))
  await redis.hset(`poll:${pollId}`, {
    question,
    options: JSON.stringify(optionList),
  })
  res.status(201).json({ pollId })
}
