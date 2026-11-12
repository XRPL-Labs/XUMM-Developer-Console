/**
 * Space Invaders, for the page that is not there (404): the invaders spell "XUMM".
 * Drawn in black: the canvas is inverted (CSS) on a dark theme.
 */

type Coordinates = { x: number; y: number }
type Size = { width: number; height: number }

const KEYS = { LEFT: 37, RIGHT: 39, SPACE: 32 }

// The columns (per row) of the blocks that spell the text
const blocks = [
  [1, 5, 7, 11, 13, 17, 19, 23],
  [2, 4, 7, 11, 13, 14, 16, 17, 19, 20, 22, 23],
  [2, 4, 7, 11, 13, 15, 17, 19, 21, 23],
  [3, 7, 11, 13, 15, 17, 19, 21, 23],
  [2, 4, 7, 11, 13, 17, 19, 23],
  [2, 4, 7, 11, 13, 17, 19, 23],
  [1, 5, 8, 9, 10, 13, 17, 19, 23],
]

const invaderSize = 20
const invaderSpawnDelay = 25

const collides = (a: { coordinates: Coordinates; size: Size }, b: { coordinates: Coordinates; size: Size }) =>
  a.coordinates.x < b.coordinates.x + b.size.width &&
  a.coordinates.x + a.size.width > b.coordinates.x &&
  a.coordinates.y < b.coordinates.y + b.size.height &&
  a.coordinates.y + a.size.height > b.coordinates.y

/**
 * Starts the game on the canvas. Returns the game: restart, and stop (when the page goes).
 */
export function startInvaders(canvas: HTMLCanvasElement, font: string): { restart: () => void; stop: () => void } {
  const screen = canvas.getContext('2d')!
  const keyState: Record<number, boolean> = {}

  let gameSize: Size = { width: 0, height: 0 }
  let invaderMultiplier = 1
  let invaderAttackRate = 0.999
  let invaderSpeed = 20
  let spawnDelayCounter = invaderSpawnDelay
  let kills = 0
  let level = -1
  let lost = false
  let frame = 0
  let stopped = false
  let invaderCanvas: HTMLCanvasElement | null = null

  class Projectile {
    active = true
    size = { width: 3, height: 3 }
    constructor(
      public coordinates: Coordinates,
      public velocity: Coordinates,
    ) {}

    update() {
      this.coordinates.x += this.velocity.x
      this.coordinates.y += this.velocity.y
      if (this.coordinates.y > gameSize.height || this.coordinates.y < 0) this.active = false
    }

    draw() {
      if (this.active) screen.rect(this.coordinates.x, this.coordinates.y, this.size.width, this.size.height)
    }
  }

  class Invader {
    active = true
    size = { width: invaderSize, height: invaderSize }
    patrolX = 0
    speedX = invaderSpeed
    constructor(public coordinates: Coordinates) {}

    update() {
      if (Math.random() > invaderAttackRate && !invadersBelow(this)) {
        invaderShots.push(new Projectile({ x: this.coordinates.x + this.size.width / 2, y: this.coordinates.y + this.size.height - 5 }, { x: 0, y: 2 }))
      }
    }

    draw() {
      if (this.active && invaderCanvas) screen.drawImage(invaderCanvas, this.coordinates.x, this.coordinates.y)
    }

    move() {
      if (this.patrolX < 0 || this.patrolX > 100) {
        this.speedX = -this.speedX
        this.patrolX += this.speedX
        this.coordinates.y += this.size.height
        if (this.coordinates.y + this.size.height * 2 > gameSize.height) lost = true
      } else {
        this.coordinates.x += this.speedX
        this.patrolX += this.speedX
      }
    }

    destroy() {
      this.active = false
      kills += 1
    }
  }

  class Player {
    active = true
    size = { width: 16, height: 8 }
    shooterHeat = -3
    coordinates: Coordinates
    projectile: Projectile[] = []

    constructor() {
      this.coordinates = { x: (gameSize.width / 2 - this.size.width / 2) | 0, y: gameSize.height - this.size.height * 2 }
    }

    update() {
      this.projectile.forEach(p => p.update())
      this.projectile = this.projectile.filter(p => p.active)

      if (!this.active) return

      if (keyState[KEYS.LEFT] && this.coordinates.x > 0) {
        this.coordinates.x -= 2
      } else if (keyState[KEYS.RIGHT] && this.coordinates.x < gameSize.width - this.size.width) {
        this.coordinates.x += 2
      }

      if (keyState[KEYS.SPACE]) {
        this.shooterHeat += 1
        if (this.shooterHeat < 0) {
          this.projectile.push(new Projectile({ x: this.coordinates.x + this.size.width / 2 - 1, y: this.coordinates.y - 1 }, { x: 0, y: -7 }))
        } else if (this.shooterHeat > 12) {
          this.shooterHeat = -3
        }
      } else {
        this.shooterHeat = -3
      }
    }

    draw() {
      if (this.active) {
        screen.rect(this.coordinates.x, this.coordinates.y, this.size.width, this.size.height)
        screen.rect(this.coordinates.x - 2, this.coordinates.y + 2, 20, 6)
        screen.rect(this.coordinates.x + 6, this.coordinates.y - 4, 4, 4)
      }
      this.projectile.forEach(p => p.draw())
    }

    destroy() {
      this.active = false
      lost = true
    }
  }

  let player: Player
  let invaders: Invader[] = []
  let invaderShots: Projectile[] = []

  const invadersBelow = (invader: Invader) => invaders.some(b => Math.abs(invader.coordinates.x - b.coordinates.x) === 0 && b.coordinates.y > invader.coordinates.y)

  const pixelRow = (rowRaw: number): number[] => {
    const row = Math.floor(rowRaw / invaderMultiplier)
    if (row >= blocks.length) return []
    const textRow: number[] = []
    blocks[row].forEach((block, i) => {
      for (let j = 0; j < invaderMultiplier; j++) textRow[i * invaderMultiplier + j] = block * invaderMultiplier + j
    })
    return textRow
  }

  const createInvaders = (): Invader[] => {
    const created: Invader[] = []
    let i = blocks.length * invaderMultiplier
    while (i--) {
      for (const column of pixelRow(i)) created.push(new Invader({ x: column * invaderSize, y: i * invaderSize }))
    }
    return created
  }

  const update = () => {
    // Next level
    if (invaders.length === 0) {
      spawnDelayCounter += 1
      if (spawnDelayCounter < invaderSpawnDelay) return

      level += 1
      invaderAttackRate -= 0.002
      invaderSpeed += 10
      invaders = createInvaders()
      spawnDelayCounter = 0
    }

    if (!lost) {
      player.projectile.forEach(projectile => {
        invaders.forEach(invader => {
          if (collides(projectile, invader)) {
            invader.destroy()
            projectile.active = false
          }
        })
      })

      invaderShots.forEach(shot => {
        if (collides(shot, player)) player.destroy()
      })

      invaders.forEach(invader => invader.update())
    }

    // The player and the projectiles go on (they look nice)
    player.update()
    invaderShots.forEach(shot => shot.update())

    invaders = invaders.filter(invader => invader.active)
  }

  const draw = () => {
    screen.clearRect(0, 0, gameSize.width, gameSize.height)
    screen.fillStyle = 'black'

    if (lost) {
      screen.font = '55px ' + font
      screen.textAlign = 'center'
      screen.fillText('You lost', gameSize.width / 2, gameSize.height / 2)
      screen.font = '20px ' + font
      screen.fillText('Points: ' + kills, gameSize.width / 2, gameSize.height / 2 + 30)
    } else {
      screen.font = '15px ' + font
      screen.textAlign = 'right'
      screen.fillText('Points: ' + kills, gameSize.width, gameSize.height - 12)
    }

    screen.beginPath()
    player.draw()
    if (!lost) invaders.forEach(invader => invader.draw())
    invaderShots.forEach(shot => shot.draw())
    screen.fill()
  }

  const restart = () => {
    if (window.innerWidth > 1200) {
      gameSize = { width: 1200, height: 500 }
      invaderMultiplier = 2
    } else if (window.innerWidth > 800) {
      gameSize = { width: 900, height: 600 }
      invaderMultiplier = 2
    } else {
      gameSize = { width: 600, height: 300 }
      invaderMultiplier = 1
    }
    canvas.width = gameSize.width
    canvas.height = gameSize.height

    kills = 0
    level = -1
    lost = false
    invaderAttackRate = 0.999
    invaderSpeed = 20
    spawnDelayCounter = invaderSpawnDelay
    player = new Player()
    invaders = []
    invaderShots = []
  }

  // The invaders march (and come down) once per second, a bit faster per level
  let marchTimer: ReturnType<typeof setTimeout>
  const march = () => {
    invaders.forEach(invader => invader.move())
    marchTimer = setTimeout(march, Math.max(200, 1000 - level * 1.8))
  }

  const loop = () => {
    if (stopped) return
    update()
    draw()
    frame = requestAnimationFrame(loop)
  }

  const onKey = (down: boolean) => (e: KeyboardEvent) => {
    if (Object.values(KEYS).includes(e.keyCode)) {
      keyState[e.keyCode] = down
      e.preventDefault()
    }
  }
  const onKeyDown = onKey(true)
  const onKeyUp = onKey(false)

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('resize', restart)

  const invaderAsset = new Image()
  invaderAsset.onload = () => {
    if (stopped) return
    invaderCanvas = document.createElement('canvas')
    invaderCanvas.width = invaderSize
    invaderCanvas.height = invaderSize
    invaderCanvas.getContext('2d')!.drawImage(invaderAsset, 0, 0)

    restart()
    march()
    loop()
  }
  invaderAsset.src = '/404/invader.gif'

  return {
    restart,
    stop() {
      stopped = true
      cancelAnimationFrame(frame)
      clearTimeout(marchTimer)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('resize', restart)
    },
  }
}
