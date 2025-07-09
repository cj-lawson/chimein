export const getVotedOption = (pollId: string): string | null =>
  localStorage.getItem(`voted:${pollId}`)

export const markVoted = (pollId: string, optionId: string): void =>
  localStorage.setItem(`voted:${pollId}`, optionId)

export const clearVote = (pollId: string): void =>
  localStorage.removeItem(`voted:${pollId}`)
