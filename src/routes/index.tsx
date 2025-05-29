import { createFileRoute } from '@tanstack/react-router'
import CreatePoll from '@/pages/CreatePoll'

export const Route = createFileRoute('/')({
  component: CreatePoll,
})

export default Route
