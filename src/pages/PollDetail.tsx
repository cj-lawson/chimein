import { useState, useEffect } from 'react'
import { Route as PollRoute } from '@/routes/poll/$pollId'
import { useMemo } from 'react'
import { motion, LayoutGroup } from 'framer-motion'

import Header from '@/components/Header'
import {
  markVoted,
  getVotedOption,
  clearVote,
} from '../../utils/localVoteStore'

type Option = {
  optionId: string
  option: OptionValues
}

type OptionValues = {
  id: string
  type: 'text'
  value: string
  count: number
}

export default function PollDetail() {
  const { pollId } = PollRoute.useParams()
  const [question, setQuestion] = useState<string | null>(null)
  const [options, setOptions] = useState<Array<Option>>([])
  const [picked, setPicked] = useState<string | null>(() =>
    getVotedOption(pollId),
  )

  const [error, setError] = useState<string | null>(null)

  const totalVotes = useMemo(
    () => options.reduce((sum, o) => sum + o.option.count, 0),
    [options],
  )

  const revealResults = picked !== null
  const percById = useMemo(() => {
    if (!revealResults) return {} // nothing to reveal yet
    const t = totalVotes || 1
    return Object.fromEntries(
      options.map((o) => [o.optionId, (o.option.count / t) * 100]),
    )
  }, [options, totalVotes, revealResults])

  useEffect(() => {
    if (!pollId) return

    // reset states on pollId change
    setQuestion(null)
    setOptions([])
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

  function handleVote(optionId: string) {
    if (picked) return

    // Optimisit UI
    setOptions((prev) =>
      prev.map((o) =>
        o.optionId === optionId
          ? {
              ...o,

              option: {
                ...o.option,
                count: o.option.count + 1,
              },
            }
          : o,
      ),
    )

    setPicked(optionId)
    markVoted(pollId, optionId)

    // 2) Send the POST to /api/vote
    fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollId, optionId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Vote failed')
        return res.json()
      })
      .then(({ count: serverCount }) => {
        // 3) Reconcile with server’s count (in case of mismatch)
        setOptions((prev) =>
          prev.map((o) =>
            o.optionId === optionId
              ? {
                  ...o,
                  option: {
                    ...o.option,
                    count: serverCount,
                  },
                }
              : o,
          ),
        )
      })
      .catch((err) => {
        console.error(err)
        setPicked(null)
        clearVote(pollId)
        setError('Vote failed, please try again.')
      })
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

  console.log(question)
  console.log(options)
  return (
    <>
      <Header />
      <div className="text-center font-nunito">
        <header className="min-h-screen flex flex-col items-center mt-20 space-y-10 bg-white text-[#2D2C2B]">
          <div className="w-3/4 sm:w-1/2 md:max-w-[400px] space-y-16">
            <h1 className="text-2xl font-bold">{question}</h1>
            <div className="w-full">
              <LayoutGroup>
                <ul className="space-y-4 w-full">
                  {options.map(({ optionId, option }) => {
                    const perc = percById[optionId] ?? 0 // 0 until reveal
                    return (
                      <li
                        key={optionId}
                        onClick={() => handleVote(optionId)}
                        className={`relative rounded-sm px-8 py-4
            ${picked ? 'cursor-not-allowed opacity-50 ' : 'cursor-pointer hover:opacity-60'}
            ${picked === optionId ? 'opacity-99 text-white bg-[#7590E6]' : 'text-[#020202] bg-[#F2F2F2]'}`}
                      >
                        {/* animated bar—zero width until revealResults is true */}
                        <motion.div
                          layout
                          className={`absolute inset-0 rounded-sm -z-10 ${picked && optionId === picked ? 'bg-[#2C55D9]' : 'bg-[#C2C2C2]'}`}
                          initial={{ width: 0 }}
                          animate={{ width: revealResults ? `${perc}%` : 0 }}
                          transition={{
                            type: 'spring',
                            stiffness: 260,
                            damping: 30,
                          }}
                        />

                        {/* label & count */}
                        <div className="flex justify-between items-center relative">
                          <p className="font-bold">{option.value}</p>
                          {revealResults && (
                            <span
                              className={`text-sm font-extrabold text-gray-600 ${picked && optionId === picked ? 'text-white' : ''}`}
                            >
                              ({perc.toFixed(0)}%)
                            </span>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </LayoutGroup>

              <div className="mt-12 w-full">
                <div className="flex items-center gap-2 font-bold justify-center">
                  <span className="relative flex size-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex size-3 rounded-full bg-green-500"></span>
                  </span>

                  <p>Live</p>
                  <span>|</span>
                  <p>{totalVotes} Votes</p>
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>
    </>
  )
}
