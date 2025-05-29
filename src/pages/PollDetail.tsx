// src/pages/PollDetail.tsx
import { useState, useEffect } from 'react'
import { Route as PollRoute } from '@/routes/poll/$pollId'
import { useParams } from '@tanstack/react-router'

export default function PollDetail() {
  const { pollId } = PollRoute.useParams()
  // null = not loaded yet; string = loaded (even if empty)
  const [question, setQuestion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pollId) return

    // reset states on pollId change
    setQuestion(null)
    setError(null)

    fetch(`/api/getPoll?id=${pollId}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
      })
      .then((data: { question: string }) => {
        setQuestion(data.question)
      })
      .catch((err: Error) => {
        console.error(err)
        setError('Failed to load poll.')
      })
  }, [pollId])

  // 1) Handle missing pollId (should never happen if your router is correct)
  if (!pollId) {
    return <div>Invalid poll ID.</div>
  }

  // 2) Loading state
  if (question === null && error === null) {
    return <div>Loading question…</div>
  }

  // 3) Error state
  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  // 4) Success state
  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1 className="text-2xl font-bold mb-4">{question}</h1>
      {/* Later you’ll render options + vote buttons here */}
    </div>
  )
}
