// src/hooks/usePollStream.ts
import { useEffect, useRef } from 'react'

export type VoteEvent = {
  optionId: string
  count: number
  totalVotes?: number
}

type OnMsg = (evt: VoteEvent) => void
export function usePollStream(
  pollId: string | undefined,
  onMessage: (evt: VoteEvent) => void,
  base = '',
) {
  const cbRef = useRef(onMessage)
  cbRef.current = onMessage

  useEffect(() => {
    if (!pollId) return
    const url = `${base}/api/stream?id=${pollId}`
    const es = new EventSource(url)

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as VoteEvent
        cbRef.current(data)
      } catch {
        console.warn('Bad SSE data:', e.data)
      }
    }

    es.onerror = (err) => {
      console.error('SSE error', err)
    }

    return () => es.close()
  }, [pollId, base])
}
