import Entity from '../entity'
import { PLAYER_ACTIONS, TILE_SIZE } from '../constants'

class Splash extends Entity {
  constructor (app, col = 0, row = 0, topOrBottom = 0) {
    super(app)
    
    this.solid = false
    this.mass = 0
    this.x = col * TILE_SIZE + TILE_SIZE / 2
    this.y = row * TILE_SIZE + TILE_SIZE / 2
    this.z = 1000
    this.topOrBottom = topOrBottom
  }
  
  paint () {
    // super.paint()
    
    const app = this._app
    const c2d = app.canvas2d
    const camera = app.camera
    const animationSpritesheet = app.assets.splash
    if (!animationSpritesheet) return
    
    const SPRITE_SIZE = 64
    let SPRITE_OFFSET_X = 0
    let SPRITE_OFFSET_Y = 0

    const srcSizeX = SPRITE_SIZE * 23
    const srcSizeY = SPRITE_SIZE * 4
    let srcX = 0
    let srcY = this.topOrBottom * srcSizeY

    const tgtSizeX = SPRITE_SIZE * 23
    const tgtSizeY = SPRITE_SIZE * 4
    const tgtX = Math.floor(this.x + camera.x) - srcSizeX / 2 + SPRITE_OFFSET_X - (tgtSizeX - srcSizeX) / 2
    const tgtY = Math.floor(this.y + camera.y) - srcSizeY / 2 + SPRITE_OFFSET_Y - (tgtSizeY - srcSizeY) / 2
    
    c2d.drawImage(animationSpritesheet.img, srcX, srcY, srcSizeX, srcSizeY, tgtX, tgtY, tgtSizeX, tgtSizeY)
  }
}
  
export default Splash