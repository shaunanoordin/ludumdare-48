import Entity from '../entity'
import { PLAYER_ACTIONS, TILE_SIZE } from '../constants'

class Hero extends Entity {
  constructor (app, col = 0, row = 0) {
    super(app)
    
    this.colour = '#000'
    this.x = col * TILE_SIZE + TILE_SIZE / 2
    this.y = row * TILE_SIZE + TILE_SIZE / 2
    this.z = 100
    
    this.animationCounterMax = 1500
  }
  
  paint () {
    const app = this._app
    
    this.colour = (app.playerAction === PLAYER_ACTIONS.PULLING)
      ? '#e42'
      : '#c44'
    super.paint()
    
    const c2d = app.canvas2d
    const camera = app.camera
    const animationSpritesheet = app.assets.hero
    if (!animationSpritesheet) return
    
    const SPRITE_SIZE = 64
    let SPRITE_OFFSET_X = 0
    let SPRITE_OFFSET_Y = 0

    const srcSizeX = SPRITE_SIZE
    const srcSizeY = SPRITE_SIZE
    let srcX = 0
    let srcY = 0

    const tgtSizeX = SPRITE_SIZE * 1.25
    const tgtSizeY = SPRITE_SIZE * 1.25
    const tgtX = Math.floor(this.x + camera.x) - srcSizeX / 2 + SPRITE_OFFSET_X - (tgtSizeX - srcSizeX) / 2
    const tgtY = Math.floor(this.y + camera.y) - srcSizeY / 2 + SPRITE_OFFSET_Y - (tgtSizeY - srcSizeY) / 2

    if (this.movementSpeed) {
      const animationProgress = (this.animationCounter % (this.animationCounterMax / 3)) / (this.animationCounterMax / 3)
      if (animationProgress < 0.5) {
        srcY = 2 * SPRITE_SIZE
      } else {
        srcY = 3 * SPRITE_SIZE
      }
    } else {
      const animationProgress = this.animationCounter / this.animationCounterMax
      if (animationProgress < 0.5) {
        srcY = 0
      } else {
        srcY = SPRITE_SIZE
      }
    }

    srcX = (this.speedX < 0) ? 0 : SPRITE_SIZE

    c2d.drawImage(animationSpritesheet.img, srcX, srcY, srcSizeX, srcSizeY, tgtX, tgtY, tgtSizeX, tgtSizeY)
  }
}
  
export default Hero