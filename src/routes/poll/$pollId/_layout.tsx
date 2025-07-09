import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/poll/$pollId/_layout')({
  component: PollLayout,
})

function PollLayout() {
  return <Outlet />
}
