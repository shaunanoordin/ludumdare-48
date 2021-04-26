import Entity from '../entity'
import { PLAYER_ACTIONS, TILE_SIZE } from '../constants'

class Goal extends Entity {
  constructor (app, col = 0, row = 0) {
    super(app)
    
    this.colour = '#a66'
    this.size = TILE_SIZE * 2
    this.solid = false
    this.x = col * TILE_SIZE + TILE_SIZE / 2
    this.y = row * TILE_SIZE + TILE_SIZE / 2
  }
  
  onCollision (target, collisionCorrection) {
    if (target !== this._app.hero) return null
    
    const goal = this
    const hero = target
    
    // Pull hero to the centre
    const distX = goal.x - hero.x
    const distY = goal.y - hero.y
    const angleToGoal = Math.atan2(distY, distX)
    const distanceToGoal = Math.sqrt(distX * distX + distY * distY)
    
    hero.moveX = Math.cos(angleToGoal) * Math.min(distanceToGoal, hero.moveSpeed)
    hero.moveY = Math.sin(angleToGoal) * Math.min(distanceToGoal, hero.moveSpeed)
    
    if (!this._app.victory) {
      this._app.celebrateVictory()
    }
  }
  
  paint (layer = 0) {
    super.paint(layer)
    
    const app = this._app
    const c2d = app.canvas2d
    const camera = app.camera
    const animationSpritesheet = app.assets.goal
    if (!animationSpritesheet) return
    
    const SPRITE_SIZE = 64
    let SPRITE_OFFSET_X = 0
    let SPRITE_OFFSET_Y = 0

    const srcSizeX = SPRITE_SIZE
    const srcSizeY = SPRITE_SIZE
    let srcX = 0
    let srcY = 0

    const tgtSizeX = SPRITE_SIZE
    const tgtSizeY = SPRITE_SIZE
    const tgtX = Math.floor(this.x + camera.x) - srcSizeX / 2 + SPRITE_OFFSET_X - (tgtSizeX - srcSizeX) / 2
    const tgtY = Math.floor(this.y + camera.y) - srcSizeY / 2 + SPRITE_OFFSET_Y - (tgtSizeY - srcSizeY) / 2
    
    c2d.drawImage(animationSpritesheet.img, srcX, srcY, srcSizeX, srcSizeY, tgtX, tgtY, tgtSizeX, tgtSizeY)
  }
}
  
export default Goal