import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { PlusIcon, XMarkIcon } from '@heroicons/react/24/solid'
import toast, { Toaster } from 'react-hot-toast'
import logo from '/tally-logo.svg'

export default function CreatePoll() {
  const [question, setQuestion] = useState('')
  const [pollId, setPollId] = useState<string | null>(null)

  const navigate = useNavigate()

  const [options, setOptions] = useState([
    { id: 1, value: '', type: 'text', count: 0 },
    { id: 2, value: '', type: 'text', count: 0 },
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
    setOptions([...options, { id: newId, value: '', type: 'text', count: 0 }])
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
    navigate({ to: '/poll/$pollId/preview', params: { pollId } })
  }

  return (
    <>
      <div>
        <Toaster position="bottom-center" />
      </div>

      <div className="text-center bg-white text-[#131B24] font-nunito max-h-dvh">
        <div className="min-h-screen flex flex-col items-center space-y-2 max-h-dvh">
          <div className="w-4/5 sm:w-1/2 md:max-w-[400px] space-y-12 mt-10 max-h-dvh">
            <img src={logo} alt="" className="ml-auto mr-auto" />
            <h1 className="font-bold text-3xl">
              Create your poll. <br></br>Share it with anyone.
            </h1>
            <div>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your question"
                className="block w-full rounded-xl bg-[#F1F3F5] px-8 py-4 text-lg text-[#2D2C2B] font-semibold placeholder:text-[#657481] focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-[#2C55D9]"
              />
            </div>
            <div className="options space-y-4">
              {options.map((option, index) => (
                <div className="relative">
                  <input
                    key={index}
                    type={option.type}
                    value={option.value}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`option ${index + 1}`}
                    className=" block w-full rounded-xl bg-[#F1F3F5] px-8 py-4 text-base font-semibold text-[#2D2C2B] placeholder:text-[#657481] focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-[#2C55D9]"
                  />
                  <button
                    onClick={() => handleRemoveOption(option.id)}
                    className="flex items-center gap-4 ml-auto cursor-pointer"
                  >
                    <XMarkIcon className="text-[#2D2C2B] size-6 absolute top-1/2 transform -translate-y-1/2 ml-1" />
                  </button>
                </div>
              ))}
              <div>
                <button
                  onClick={() => handleAddOption()}
                  className="flex items-center gap-2 mr-auto cursor-pointer"
                >
                  <PlusIcon className="size-5 text-[#2D2C2B]" />
                  <p className="text-sm font-semibold text-[#2D2C2B]">
                    Add Option
                  </p>
                </button>
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={!question.trim()}
              className="cursor-pointer bg-[#2C55D9] rounded-lg py-4 w-full align-items:center text-base font-extrabold text-white uppercase"
            >
              {' '}
              Create Poll
            </button>

            {pollId && (
              <p style={{ marginTop: 16 }}>
                <a href={`/poll/${pollId}/preview`}>👀 View your poll</a>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
