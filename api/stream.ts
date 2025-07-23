import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pollId = req.query.id as string
  if (!pollId) return res.status(400).end('Missing id')

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  const channel = `poll:${pollId}`
  let alive = true
  let sub: any

  const ping = setInterval(() => alive && res.write(':\n\n'), 25_000)

  const start = () => {
    sub = redis.subscribe(channel)

    sub.on(`message:${channel}`, (evt: any) => {
      if (!alive) return
      res.write(`data: ${evt.message}\n\n`)
    })

    sub.on('error', async (err: unknown) => {
      console.error('Stream reading error:', err)
      try {
        await sub.unsubscribe([channel])
      } catch {}
      sub.removeAllListeners()
      if (alive) setTimeout(start, 1000) // retry
    })
  }

  start()

  req.on('close', async () => {
    alive = false
    clearInterval(ping)
    try {
      await sub?.unsubscribe([channel])
    } catch {}
    sub?.removeAllListeners?.()
    res.end()
  })
}
