import { useState, useEffect } from 'react'
import { Route as PollRoute } from '@/routes/poll/$pollId'

type Option = {
  text: any
  id: number
}

export default function PollDetail() {
  const { pollId } = PollRoute.useParams()
  const [question, setQuestion] = useState<string | null>(null)
  const [options, setOptions] = useState<Array<Option> | null>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pollId) return

    // reset states on pollId change
    setQuestion(null)
    setOptions(null)
    setError(null)

    fetch(`/api/getPoll?id=${pollId}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
      })
      .then((data: { question: string; options: Array<Option> }) => {
        setQuestion(data.question)
        setOptions(data.options)
      })
      .catch((err: Error) => {
        console.error(err)
        setError('Failed to load poll.')
      })
  }, [pollId])

  // Handle missing pollId (should never happen if router is correct)
  if (!pollId) {
    return <div>Invalid poll ID.</div>
  }

  if (question === null && error === null) {
    return (
      <div className="text-center">
        <header className="min-h-screen flex flex-col items-center justify-center space-y-10 bg-[#121316] text-white text-[calc(10px+2vmin)]">
          <div className="w-3/4 sm:w-1/2 md:max-w-[400px] space-y-16">
            <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          </div>
        </header>
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="text-center">
      <header className="min-h-screen flex flex-col items-center justify-center space-y-10 bg-[#121316] text-white text-[calc(10px+2vmin)]">
        <div className="w-3/4 sm:w-1/2 md:max-w-[400px] space-y-16">
          <h1 className="text-2xl font-bold mb-4">{question}</h1>
        </div>
        <div className="space-y-4">
          {options?.map((option) => (
            <div>
              <p className="text-white">{option.text.value}</p>
            </div>
          ))}
        </div>
      </header>
    </div>
  )
}
