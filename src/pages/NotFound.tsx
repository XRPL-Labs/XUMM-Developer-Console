import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { startInvaders } from './invaders'
import { Button, buttonClass } from '../components/ui'
import { XamanLogo } from '../components/XamanLogo'
import { faRotate } from '../components/icons'

function Key({ children }: { children: string }) {
  return <kbd className="rounded-md border border-line-strong bg-surface px-1.5 py-0.5 font-mono text-[12px] font-medium text-fg shadow-sm">{children}</kbd>
}

export function NotFound() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const game = useRef<ReturnType<typeof startInvaders> | null>(null)

  useEffect(() => {
    if (!canvas.current) return
    game.current = startInvaders(canvas.current, getComputedStyle(document.body).fontFamily)
    return () => game.current?.stop()
  }, [])

  return (
    <div className="min-h-dvh px-4 py-10 text-center">
      <Link to="/" className="inline-block outline-none" aria-label="Xaman Developer Console">
        <XamanLogo className="h-7 text-fg" />
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-fg">
        <strong>404</strong> Space Invaders destroyed this page!
      </h1>
      <p className="mt-4 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 text-fg-2">
        Use <Key>Space</Key> to shoot and <Key>←</Key> <Key>→</Key> to move, or
        <Button size="sm" variant="danger-outline" icon={faRotate} onClick={() => game.current?.restart()}>
          Restart the game
        </Button>
        <Link to="/" className={buttonClass('secondary', 'sm')}>
          Back to the console
        </Link>
      </p>
      <canvas ref={canvas} className="mx-auto mt-6 block max-w-full dark:invert" />
    </div>
  )
}
