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
      <div className="text-center font-nunito">
        <header className="min-h-screen flex flex-col items-center justify-center space-y-10 bg-white text-[#2D2C2B]">
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
    <div className="text-center font-nunito">
      <header className="min-h-screen flex flex-col items-center mt-20 space-y-10 bg-white text-[#2D2C2B]">
        <div className="w-3/4 sm:w-1/2 md:max-w-[400px] space-y-16">
          <h1 className="text-2xl font-bold">{question}</h1>
          <div className="w-full">
            <ul className="space-y-4 w-full">
              {options?.map((option) => (
                <li className="w-full block w-full rounded-sm bg-[#F9F4F2] px-8 py-4 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-[#248aff] sm:text-sm/6 cursor-pointer transition-opacity duration-200 hover:opacity-50">
                  <p className="text-[#2D2C2B] font-bold text-lg">
                    {option.text.value}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>
    </div>
  )
}
