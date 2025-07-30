// api/stream.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pollId = req.query.id as string
  if (!pollId) return res.status(400).end('Missing id')

  // Set proper CORS headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  })

  // Send initial connection event
  res.write(`event: init\ndata: {"status":"connected"}\n\n`)

  const channel = `poll:${pollId}`
  let alive = true
  let sub: any

  // Keep-alive ping every 25s
  const ping = setInterval(() => {
    if (alive) {
      res.write(`: heartbeat ${Date.now()}\n\n`)
    }
  }, 25_000)

  const start = async () => {
    try {
      console.log(`Subscribing to channel: ${channel}`)
      sub = redis.subscribe(channel)

      sub.on('message', ({ channel: ch, message }: any) => {
        console.log(`Received message on ${ch}:`, message)
        if (!alive) return

        if (ch === channel) {
          // Properly format SSE event
          res.write(`event: message\ndata: ${message}\n\n`)
        }
      })

      sub.on('error', async (err: unknown) => {
        console.error('Redis subscription error:', err)
        try {
          await sub?.unsubscribe([channel])
        } catch (unsubErr) {
          console.error('Error unsubscribing:', unsubErr)
        }
        sub?.removeAllListeners()

        // Retry connection if still alive
        if (alive) {
          setTimeout(start, 1000)
        }
      })
    } catch (err) {
      console.error('Error starting subscription:', err)
      if (alive) {
        setTimeout(start, 1000)
      }
    }
  }

  start()

  // Handle client disconnect
  req.on('close', async () => {
    console.log(`Client disconnected from poll: ${pollId}`)
    alive = false
    clearInterval(ping)

    try {
      await sub?.unsubscribe([channel])
    } catch (err) {
      console.error('Error during cleanup:', err)
    }
    sub?.removeAllListeners?.()
    res.end()
  })

  req.on('error', (err) => {
    console.error('Request error:', err)
    alive = false
  })
}
