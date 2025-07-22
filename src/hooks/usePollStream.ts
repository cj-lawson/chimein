import { useEffect } from 'react'

export function usePollStream(pollId: string, onMessage: (evt: any) => void) {
  useEffect(() => {
    if (!pollId) return

    const es = new EventSource(`/api/stream?id=${pollId}`)

    es.onmessage = (e) => {
      try {
        onMessage(JSON.parse(e.data))
      } catch {
        console.warn('Bad JSON from strea', e.data)
      }
    }

    es.onerror = (err) => {
      console.error('SSE error', err)
    }

    return () => es.close()
  }, [pollId, onMessage])
}
