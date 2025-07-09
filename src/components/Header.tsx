import { Link } from '@tanstack/react-router'
import logo from '/tally-logo.svg'

export default function Header() {
  return (
    <header className="p-2 flex gap-2  text-white justify-between">
      <nav className="flex flex-row">
        <div className="px-2 font-bold">
          <Link to="/">
            <img src={logo} alt="" className="w-20" />
          </Link>
        </div>
      </nav>
    </header>
  )
}
