import Entity from '../entity'
import { TILE_SIZE } from '../constants'

class Ball extends Entity {
  constructor (app, col = 0, row = 0) {
    super(app)
    
    this.colour = '#48c'
    this.solid = true
    this.movable = true
    this.x = col * TILE_SIZE + TILE_SIZE / 2
    this.y = row * TILE_SIZE + TILE_SIZE / 2
  }
}
  
export default Ball