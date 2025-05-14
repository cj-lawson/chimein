import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const [question, setQuestion] = useState('')
  const [pollId, setPollId] = useState<string | null>(null)

  const handleCreate = async () => {
    const res = await fetch('/api/createPoll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    })

    const { pollId } = await res.json()
    setPollId(pollId)
  }

  return (
    <div className="text-center">
      <header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
        <h1>Create a poll</h1>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your question"
        />
        <button onClick={handleCreate} disabled={!question.trim()}>
          {' '}
          Create Poll
        </button>

        {pollId && (
          <p style={{ marginTop: 16 }}>
            ✅ Poll created! ID: <code>{pollId}</code>
          </p>
        )}
      </header>
    </div>
  )
}
