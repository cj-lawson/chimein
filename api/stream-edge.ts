import { Redis } from '@upstash/redis'

// Explicitly use Edge runtime
export const config = {
  runtime: 'edge',
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export default async function handler(request: Request) {
  const url = new URL(request.url)
  const pollId = url.searchParams.get('id')

  if (!pollId) {
    return new Response('Missing id', { status: 400 })
  }

  console.log(`Starting Edge SSE stream for poll: ${pollId}`)

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      console.log('Stream started, sending init event')

      // Send initial connection event
      const initEvent = `event: init\ndata: {"status":"connected"}\n\n`
      controller.enqueue(new TextEncoder().encode(initEvent))

      const channel = `poll:${pollId}`
      let alive = true
      let sub: any

      // Keep-alive ping every 25s
      const ping = setInterval(() => {
        if (alive) {
          const heartbeat = `: heartbeat ${Date.now()}\n\n`
          try {
            controller.enqueue(new TextEncoder().encode(heartbeat))
          } catch (err) {
            console.log('Controller closed, stopping heartbeat')
            clearInterval(ping)
            alive = false
          }
        }
      }, 25_000)

      const startRedis = async () => {
        try {
          console.log(`Subscribing to Redis channel: ${channel}`)
          sub = redis.subscribe(channel)

          sub.on('message', ({ channel: ch, message }: any) => {
            console.log(`Received Redis message on ${ch}:`, message)
            if (!alive) return

            if (ch === channel) {
              try {
                const messageStr =
                  typeof message === 'string'
                    ? message
                    : JSON.stringify(message)
                const sseEvent = `event: message\ndata: ${messageStr}\n\n`
                console.log(`Sending SSE event: ${messageStr}`)
                controller.enqueue(new TextEncoder().encode(sseEvent))
              } catch (err) {
                console.error('Error sending message:', err)
              }
            }
          })

          sub.on('error', async (err: unknown) => {
            console.error('Redis subscription error:', err)
            try {
              await sub?.unsubscribe([channel])
              sub?.removeAllListeners()
            } catch (cleanupErr) {
              console.error('Cleanup error:', cleanupErr)
            }

            if (alive) {
              console.log('Retrying Redis connection...')
              setTimeout(startRedis, 1000)
            }
          })

          console.log('Redis subscription established')
        } catch (err) {
          console.error('Error setting up Redis:', err)
          if (alive) {
            setTimeout(startRedis, 1000)
          }
        }
      }

      startRedis()

      // Handle stream cancellation
      return () => {
        console.log(`Cleaning up stream for poll: ${pollId}`)
        alive = false
        clearInterval(ping)
        if (sub) {
          sub.unsubscribe([channel]).catch(console.error)
          sub.removeAllListeners()
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}
