import Entity from '../entity'
import { PLAYER_ACTIONS, TILE_SIZE } from '../constants'

class Coin extends Entity {
  constructor (app, col = 0, row = 0) {
    super(app)
    
    this.colour = '#864'
    this.x = col * TILE_SIZE + TILE_SIZE / 2
    this.y = row * TILE_SIZE + TILE_SIZE / 2
    
    this.solid = false
    
    this.pickedUp = false  // Has this coin been picked up by the hero? 
    this.expiryCountdown = 1000  // Time from being picked up to disappearing
  }
  
  onCollision (target, collisionCorrection) {
    const app = this._app
    
    // Coin has been picked up by the hero!
    if (!this.pickedUp && target === app.hero) {
      this.pickedUp = true
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
  
  paint (layer = 0) {
    if (!this.pickedUp) {
      super.paint(layer)
    }
  }
}
  
export default Coin