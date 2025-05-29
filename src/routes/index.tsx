import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { PlusIcon, XMarkIcon } from '@heroicons/react/24/solid'
import toast, { Toaster } from 'react-hot-toast'
import PollDetail from '@/pages/PollDetail'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const [question, setQuestion] = useState('')
  const [pollId, setPollId] = useState<string | null>(null)

  const [options, setOptions] = useState([
    { id: 1, value: '', type: 'text' },
    { id: 2, value: '', type: 'text' },
  ])

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = options.map((option, i) =>
      i === index ? { ...option, value } : option,
    )
    setOptions(newOptions)
  }

  const handleAddOption = () => {
    if (options.length >= 5) {
      toast('Max number of options reached')
      return
    }

    const newId = options.length > 0 ? options[options.length - 1].id + 1 : 1
    setOptions([...options, { id: newId, value: '', type: 'text' }])
  }

  const handleRemoveOption = (id: number) => {
    setOptions(options.filter((option) => option.id !== id))
  }

  const handleCreate = async () => {
    const res = await fetch('/api/createPoll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, options }),
    })

    const { pollId } = await res.json()
    setPollId(pollId)
  }

  return (
    <>
      <div>
        <Toaster position="bottom-center" />
      </div>

      <div className="text-center">
        <header className="min-h-screen flex flex-col items-center justify-center space-y-10 bg-[#121316] text-white text-[calc(10px+2vmin)]">
          <div className="w-3/4 sm:w-1/2 md:max-w-[400px] space-y-16">
            <h1>Create a poll</h1>
            <div>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your question"
                className="border-1 border-[#292A2D] block w-full rounded-full bg-[#1E1F22] px-8 py-4 text-base text-gray-200 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-[#248aff] sm:text-sm/6"
              />
            </div>
            <div className="options space-y-4">
              {options.map((option, index) => (
                <div className="flex gap-2">
                  <input
                    key={index}
                    type={option.type}
                    value={option.value}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`option ${index + 1}`}
                    className="border-1 border-[#292A2D] block w-full rounded-full bg-[#1E1F22] px-8 py-4 text-base text-gray-200 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-[#248aff] sm:text-sm/6"
                  />
                  <button
                    onClick={() => handleRemoveOption(option.id)}
                    className="flex items-center gap-4 ml-auto cursor-pointer"
                  >
                    <XMarkIcon className="size-6" />
                  </button>
                </div>
              ))}
              <div>
                <button
                  onClick={() => handleAddOption()}
                  className="flex items-center gap-2 ml-auto cursor-pointer"
                >
                  <PlusIcon className="size-5" />
                  <p className="text-sm">Add Option</p>
                </button>
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={!question.trim()}
              className="cursor-pointer bg-[#248aff] rounded-full py-4 w-full align-items:center text-sm font-bold"
            >
              {' '}
              Create Poll
            </button>

            {pollId && (
              <p style={{ marginTop: 16 }}>
                <a href={`/poll/${pollId}`}>👀 View your poll</a>
              </p>
            )}
          </div>
        </header>
      </div>
    </>
  )
}
