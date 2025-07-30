import { useEffect, useRef, useState } from 'react'

export type VoteEvent = {
  optionId: string
  count: number
  totalVotes?: number
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

export function usePollStream(
  pollId: string | undefined,
  onMessage: (evt: VoteEvent) => void,
  base = '',
) {
  const cbRef = useRef(onMessage)
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected')
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  cbRef.current = onMessage

  useEffect(() => {
    if (!pollId) {
      setConnectionState('disconnected')
      return
    }

    const connect = () => {
      console.log(`Connecting to SSE for poll: ${pollId}`)
      setConnectionState('connecting')

      const url = `${base}/api/stream?id=${pollId}`
      const es = new EventSource(url)
      eventSourceRef.current = es

      es.onopen = () => {
        console.log('SSE connection opened')
        setConnectionState('connected')
        // Clear any pending reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }

      es.onmessage = (e) => {
        console.log('SSE message received:', e.data)
        try {
          const data = JSON.parse(e.data) as VoteEvent
          cbRef.current(data)
        } catch (err) {
          console.warn('Failed to parse SSE data:', e.data, err)
        }
      }

      // Handle custom events
      es.addEventListener('init', (e) => {
        console.log('SSE init event:', e.data)
      })

      es.onerror = (err) => {
        console.error('SSE error:', err)
        setConnectionState('error')

        // Attempt to reconnect after a delay
        if (es.readyState === EventSource.CLOSED) {
          setConnectionState('disconnected')
          reconnectTimeoutRef.current = setTimeout(() => {
            if (pollId) {
              // Only reconnect if pollId still exists
              connect()
            }
          }, 3000)
        }
      }
    }

    connect()

    return () => {
      console.log(`Cleaning up SSE connection for poll: ${pollId}`)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setConnectionState('disconnected')
    }
  }, [pollId, base])

  return connectionState
}
