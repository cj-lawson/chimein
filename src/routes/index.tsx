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
      <header className="min-h-screen flex flex-col items-center justify-center space-y-10 bg-[#111315] text-white text-[calc(10px+2vmin)]">
        <div className="w-3/4 sm:w-1/2 md:max-w-[400px] space-y-10">
          <h1>Create a poll</h1>
          <div>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question"
              className="block w-full rounded-full bg-[#181A1C] px-8 py-4 text-base text-gray-200 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={!question.trim()}
            className="bg-[#5380F7] rounded-full py-4 w-full align-items:center text-sm font-bold"
          >
            {' '}
            Create Poll
          </button>

          {pollId && (
            <p style={{ marginTop: 16 }}>
              ✅ Poll created! ID: <code>{pollId}</code>
            </p>
          )}
        </div>

        {/* <div className="bg-[#181A1C] rounded-full h-[44px] w-[300px] placeholder-[#717374] focus-within:outline-2 focus-within:outline-[#5380F7]">
          {' '}
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your question"
            className="placeholder:text-sm w-full h-full rounded-full px-4 outline-none"
          />
        </div> */}
      </header>
    </div>
  )
}
