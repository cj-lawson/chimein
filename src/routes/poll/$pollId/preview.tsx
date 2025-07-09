import { createFileRoute } from '@tanstack/react-router'
import { useParams } from '@tanstack/react-router'
import toast, { Toaster } from 'react-hot-toast'
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import QRCode from 'react-qr-code'

import Header from '../../../components/Header'

export const Route = createFileRoute('/poll/$pollId/preview')({
  component: PreviewPage,
})

function PreviewPage() {
  const { pollId } = useParams({ from: '/poll/$pollId' })

  const shareUrl = `${window.location.origin}/poll/${pollId}`

  const copy = () => {
    navigator.clipboard.writeText(shareUrl)
    toast.success('Poll link copied')
  }

  return (
    <>
      <div>
        <Toaster position="bottom-right" />
      </div>
      {/* <Header /> */}
      <Header />
      <div className="flex flex-col items-center mt-20 space-y-10 text-[#2D2C2B] font-nunito ">
        <h1 className="text-2xl font-bold">Your poll is live!</h1>

        <div className="flex flex-col gap-8">
          {/* QR code */}
          <div>
            <h3 className="font-bold mb-2">QR Code</h3>
            <div className="bg-[#F1F3F5] p-4 rounded">
              <QRCode value={shareUrl} size={180} className="ml-auto mr-auto" />
            </div>
          </div>

          {/* Share link + copy button */}
          <div>
            <h3 className="font-bold mb-2">Link</h3>
            <div className="flex items-center rounded px-2 py-2 bg-[#F1F3F5]">
              <input
                readOnly
                value={shareUrl}
                className="w-72 truncate px-3 py-2 focus:outline-none text-sm"
              />

              <ClipboardDocumentIcon
                onClick={copy}
                className="text-gray rounded cursor-pointer w-6"
              ></ClipboardDocumentIcon>
            </div>
          </div>

          {/* Optional: direct “Open poll” button */}
          <a
            href={`/poll/${pollId}`}
            className="text-blue-600 text-lg font-bold ml-auto mr-auto"
          >
            <span className="mr-2">👉</span>
            View poll page
          </a>
        </div>
      </div>
    </>
  )
}
