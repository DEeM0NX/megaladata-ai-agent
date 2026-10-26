import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'

const landingUrl = 'https://megaladata-dock.duckdns.org/#install'

export const Route = createFileRoute('/connect')({ component: ConnectRoute })

function ConnectRoute() {
  useEffect(() => {
    window.location.replace(landingUrl)
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-8">
      <h1 className="text-3xl font-semibold">Connect Megaladata Dock</h1>
      <p>Installation and plugin instructions open on a separate site.</p>
      <a className="text-primary underline" href={landingUrl}>
        Go to the Megaladata Dock installation →
      </a>
    </div>
  )
}
