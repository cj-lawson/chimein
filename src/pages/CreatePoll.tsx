import { useState } from 'react'

import { PlusIcon, XMarkIcon } from '@heroicons/react/24/solid'
import toast, { Toaster } from 'react-hot-toast'
import logo from '/logo.svg'

export default function CreatePoll() {
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

      <div className="text-center bg-white text-[#2D2C2B] font-nunito">
        <header className="min-h-screen flex flex-col items-center space-y-10">
          <div className="w-3/4 sm:w-1/2 md:max-w-[400px] space-y-16 mt-20">
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
                className="border-2 border-[#E2DED9] block w-full rounded-md bg-white px-8 py-4 text-lg text-[#2D2C2B] font-semibold placeholder:text-[#A8A5A0] focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-[#FE7119]"
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
                    className="border-2 border-[#E2DED9] block w-full rounded-md bg-white px-8 py-4 text-base font-semibold text-[#2D2C2B] placeholder:text-[#A8A5A0] focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-[#FE7119]"
                  />
                  <button
                    onClick={() => handleRemoveOption(option.id)}
                    className="flex items-center gap-4 ml-auto cursor-pointer"
                  >
                    <XMarkIcon className="text-[#2D2C2B] size-6 absolute top-1/2 transform -translate-y-1/2 ml-2" />
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
              className="cursor-pointer bg-[#FF6719] rounded-full py-4 w-full align-items:center text-base font-extrabold text-white uppercase"
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
