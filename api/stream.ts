import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pollId = req.query.id as string
  if (!pollId) return res.status(400).end('Missing id')

  // SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  const channel = `poll:${pollId}`
  const sub = redis.subscribe(channel)

  //   Send keep-alive pin every ~25s so proxies don't kill stream
  const ping = setInterval(() => res.write(':\n\n'), 25_000)

  sub.on(`message:${channel}`, (evt) => {
    res.write(`data: ${evt.message}\n\n`)
  })

  //   Cleanup on client disconnect
  req.on('close', async () => {
    clearInterval(ping)
    await sub.unsubscribe([channel])
    sub.removeAllListeners()
    res.end()
  })
}
