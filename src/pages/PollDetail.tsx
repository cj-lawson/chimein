import { useState, useEffect, useMemo, useCallback } from 'react'
import { Route as PollRoute } from '@/routes/poll/$pollId'
import { motion, LayoutGroup } from 'framer-motion'
import Header from '@/components/Header'
import {
  markVoted,
  getVotedOption,
  clearVote,
} from '../../utils/localVoteStore'
import { usePollStream, VoteEvent } from '@/hooks/usePollStream'

type OptionValues = {
  id: string
  type: 'text'
  value: string
  count: number
}
type Option = { optionId: string; option: OptionValues }

export default function PollDetail() {
  const { pollId } = PollRoute.useParams()
  const [question, setQuestion] = useState<string | null>(null)
  const [options, setOptions] = useState<Option[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [picked, setPicked] = useState<string | null>(() =>
    getVotedOption(pollId),
  )
  const [error, setError] = useState<string | null>(null)

  const revealResults = picked !== null
  const percById = useMemo(() => {
    if (!revealResults) return {}
    const t = totalVotes || 1
    return Object.fromEntries(
      options.map((o) => [o.optionId, (o.option.count / t) * 100]),
    )
  }, [options, totalVotes, revealResults])

  // --- initial fetch ---
  useEffect(() => {
    if (!pollId) return
    setQuestion(null)
    setOptions([])
    setError(null)

    fetch(`/api/getPoll?id=${pollId}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
      })
      .then(
        (data: { question: string; options: Option[]; totalVotes: number }) => {
          setQuestion(data.question)
          setOptions(data.options)
          setTotalVotes(data.totalVotes) // <-- NEW
          console.log(data)
        },
      )

      .catch((err) => {
        console.error(err)
        setError('Failed to load poll.')
      })
  }, [pollId])

  // --- real-time updates (SSE) ---
  const handleServerVote = useCallback(
    ({ optionId, count, totalVotes: serverTotal }: VoteEvent) => {
      setOptions((prev) =>
        prev.map((o) =>
          o.optionId === optionId
            ? { ...o, option: { ...o.option, count } }
            : o,
        ),
      )
      if (typeof serverTotal === 'number') setTotalVotes(serverTotal)
    },
    [],
  )

  // usePollStream(pollId, handleServerVote)
  usePollStream(pollId, (msg) => {
    console.log('SSE msg', msg)
    handleServerVote(msg)
  })

  // --- vote handler (optimistic) ---
  function handleVote(optionId: string) {
    if (picked) return

    // optimistic local increments
    setOptions((prev) =>
      prev.map((o) =>
        o.optionId === optionId
          ? { ...o, option: { ...o.option, count: o.option.count + 1 } }
          : o,
      ),
    )
    setTotalVotes((t) => t + 1) // <-- NEW

    setPicked(optionId)
    markVoted(pollId, optionId)

    fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollId, optionId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Vote failed')
        return res.json()
      })
      .then(({ count: serverCount, totalVotes: serverTotal }) => {
        setOptions((prev) =>
          prev.map((o) =>
            o.optionId === optionId
              ? { ...o, option: { ...o.option, count: serverCount } }
              : o,
          ),
        )
        if (typeof serverTotal === 'number') setTotalVotes(serverTotal)
      })
      .catch((err) => {
        console.error(err)
        setPicked(null)
        clearVote(pollId)
        setError('Vote failed, please try again.')
      })
  }

  if (!pollId) return <div>Invalid poll ID.</div>

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

  if (error) return <div className="text-red-500">{error}</div>

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
                    const perc = percById[optionId] ?? 0
                    const isPicked = picked === optionId
                    return (
                      <li
                        key={optionId}
                        onClick={() => handleVote(optionId)}
                        className={`relative rounded-sm px-8 py-4
                          ${picked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:opacity-60'}
                          ${isPicked ? 'opacity-99 text-white bg-[#7590E6]' : 'text-[#020202] bg-[#F2F2F2]'}`}
                      >
                        <motion.div
                          layout
                          className={`absolute inset-0 rounded-sm -z-10 ${isPicked ? 'bg-[#2C55D9]' : 'bg-[#C2C2C2]'}`}
                          initial={{ width: 0 }}
                          animate={{ width: revealResults ? `${perc}%` : 0 }}
                          transition={{
                            type: 'spring',
                            stiffness: 260,
                            damping: 30,
                          }}
                        />
                        <div className="flex justify-between items-center relative">
                          <p className="font-bold">{option.value}</p>

                          {revealResults && (
                            <span
                              className={`text-sm font-extrabold ${isPicked ? 'text-white' : 'text-gray-600'}`}
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
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex size-3 rounded-full bg-green-500" />
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
