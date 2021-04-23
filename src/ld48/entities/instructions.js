import Entity from '../entity'
import { PLAYER_ACTIONS, TILE_SIZE } from '../constants'

class Instructions extends Entity {
  constructor (app, col = 0, row = 0) {
    super(app)
    
    this.solid = false
    this.mass = 0
    this.x = col * TILE_SIZE + TILE_SIZE / 2
    this.y = row * TILE_SIZE + TILE_SIZE / 2
    this.z = 1000
    
    this.animationCounterMax = 3000
  }
  
  play (timeStep) {
    super.play(timeStep)
    
    // Stick to the hero
    const hero = this._app.hero
    if (hero) {
      this.x = hero.x
      this.y = hero.y
    }
  }
  
  paint () {
    // super.paint()
    
    const app = this._app
    const c2d = app.canvas2d
    const camera = app.camera
    const animationSpritesheet = app.assets.instructions
    if (!animationSpritesheet) return
    
    // Hide the instructions if the "idle timer" is still counting
    if (app.instructionsCountdown > 0) return
    
    const SPRITE_SIZE = 64
    let SPRITE_OFFSET_X = 0
    let SPRITE_OFFSET_Y = 0

    const srcSizeX = SPRITE_SIZE * 3
    const srcSizeY = SPRITE_SIZE
    let srcX = 0
    let srcY = 0

    const tgtSizeX = SPRITE_SIZE * 3
    const tgtSizeY = SPRITE_SIZE
    const tgtX = Math.floor(this.x + camera.x) - srcSizeX / 2 + SPRITE_OFFSET_X - (tgtSizeX - srcSizeX) / 2
    const tgtY = Math.floor(this.y + camera.y) - srcSizeY / 2 + SPRITE_OFFSET_Y - (tgtSizeY - srcSizeY) / 2
    
    const animationProgress = this.animationCounter / this.animationCounterMax
    
    if (animationProgress < 0.25) {
      srcY = 0
    } else if (animationProgress < 0.5) {
      srcY = 1 * SPRITE_SIZE
    } else if (animationProgress < 0.75) {
      srcY = 2 * SPRITE_SIZE
    } else {
      srcY = 3 * SPRITE_SIZE
    }
    
    c2d.drawImage(animationSpritesheet.img, srcX, srcY, srcSizeX, srcSizeY, tgtX, tgtY, tgtSizeX, tgtSizeY)
  }
}
  
export default Instructions