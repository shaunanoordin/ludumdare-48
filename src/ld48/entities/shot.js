import Entity from '../entity'
import { TILE_SIZE } from '../constants'

class Shot extends Entity {
  constructor (app, x = 0, y = 0, rotation = 0, source = undefined) {
    super(app)
    
    this.source = source  // Where
    
    this.colour = '#48c'
    this.solid = true
    this.movable = true
    
    this.size = TILE_SIZE / 2
    this.x = x
    this.y = y
    this.z = 80
    
    this.rotation = rotation
    this.moveAcceleration = 2
    this.moveMaxSpeed = 16
  }
  
  onCollision (target, collisionCorrection) {
    super(target, collisionCorrection)
    if (this.source === target) this._expired = true
  }
}
  
export default Shot