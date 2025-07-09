import { createFileRoute } from '@tanstack/react-router'
import PollDetail from '@/pages/PollDetail'

export const Route = createFileRoute('/poll/$pollId/')({
  component: PollDetail,
})

export default Route
