import Entity from '../entity'
import { PLAYER_ACTIONS, TILE_SIZE } from '../constants'

class Coin extends Entity {
  constructor (app, col = 0, row = 0) {
    super(app)
    
    this.colour = '#864'
    this.x = col * TILE_SIZE + TILE_SIZE / 2
    this.y = row * TILE_SIZE + TILE_SIZE / 2
    this.z = 70
    
    this.solid = false
    this.animationCounterMax = 1000
    
    this.pickedUp = false  // Has this coin been picked up by the hero? 
    this.expiryCountdown = 1000  // Time from being picked up to disappearing
  }
  
  onCollision (target, collisionCorrection) {
    const app = this._app
    
    // Coin has been picked up by the hero!
    if (!this.pickedUp && target === app.hero) {
      this.pickedUp = true
      this.animationCounter = 0  // Reset animation
      console.log('ding!')
    }
  }
  
  play (timeStep) {
    super.play(timeStep)
    
    // Once picked up, a coin should disappear.
    if (this.pickedUp) {
      this.expiryCountdown -= timeStep
    }
    if (this.expiryCountdown <= 0) {
      this._expired = true
    }
  }
  
  paint () {
    if (!this.pickedUp) {
      super.paint()
    }
    
    const app = this._app
    const c2d = app.canvas2d
    const camera = app.camera
    const animationSpritesheet = app.assets.coin
    if (!animationSpritesheet) return
    
    if (animationSpritesheet) {
      const SPRITE_SIZE = 32
      let SPRITE_OFFSET_X = 0
      let SPRITE_OFFSET_Y = 0

      const srcSizeX = SPRITE_SIZE
      const srcSizeY = SPRITE_SIZE
      let srcX = (!this.pickedUp) ? 0 : SPRITE_SIZE 
      let srcY = 0

      const tgtSizeX = SPRITE_SIZE * 1.25
      const tgtSizeY = SPRITE_SIZE * 1.25
      const tgtX = Math.floor(this.x + camera.x) - srcSizeX / 2 + SPRITE_OFFSET_X - (tgtSizeX - srcSizeX) / 2
      const tgtY = Math.floor(this.y + camera.y) - srcSizeY / 2 + SPRITE_OFFSET_Y - (tgtSizeY - srcSizeY) / 2
      
      const animationProgress = this.animationCounter / this.animationCounterMax
      if (animationProgress < 0.25) {
        srcY = 0 * SPRITE_SIZE
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
}
  
export default Coin