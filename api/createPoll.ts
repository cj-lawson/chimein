import type { VercelRequest, VercelResponse } from '@vercel/node'
import { redis } from './upstash'
import { nanoid } from 'nanoid'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }
  const { question } = req.body as { question?: string }
  if (!question) {
    return res.status(400).json({ error: "Missing 'question' field" })
  }
  const pollId = nanoid()
  await redis.hset(`poll:${pollId}`, {
    question,
    options: JSON.stringify([]),
  })
  res.status(201).json({ pollId })
}
