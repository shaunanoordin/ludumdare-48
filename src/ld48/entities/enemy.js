import Entity from '../entity'
import { PLAYER_ACTIONS, TILE_SIZE } from '../constants'

class Enemy extends Entity {
  constructor (app, col = 0, row = 0) {
    super(app)
    
    this.colour = '#000'
    this.x = col * TILE_SIZE + TILE_SIZE / 2
    this.y = row * TILE_SIZE + TILE_SIZE / 2
    this.z = 100
    
    this.intent = undefined
    this.action = undefined
  }
  
  play (timeStep) {
    const app = this._app
    super.play(timeStep)
    
    this.processIntent()
    this.processAction(timeStep)
  }
  
  play_move_deceleration (timeStep) {
    // Don't decelerate if moving
    if (this.action?.name !== 'move') {
      super.play_move_deceleration (timeStep)
    }
  }
  
  /*
  Translate intent into action.
   */
  processIntent () {
    // Failsafe
    if (!this.action) this.goIdle()
    
    const action = this.action
    const intent = this.intent
    
    if (!intent) {  // Go idle
      if (action?.name === 'move') this.goIdle()
    } else {  // Perform a new action
      // Note: every 'move' action is considered a new action
      
      if (action?.name === 'idle' || action?.name === 'move' )  {  // Can the action be overwritten by a new action? If not, the action must play through to its finish.
        this.action = {
          name: intent.name,
          counter: (action.name === intent.name) ? action.counter : 0,  // If the current action and new intent have the same name, it's just a continuation of the idle or move action, but with new attr values (e.g. new directions)
          attr: (intent.attr) ? { ...intent.attr } : {}
        }
      }
    }
  }
  
  processAction (timeStep) {
    if (!this.action) return
    
    const action = this.action
    
    if (action.name === 'idle') {
      
      // Idle
      
    } else if (action.name === 'move') {
      
      const moveAcceleration = this.moveAcceleration * timeStep / 1000 || 0
      const attrMoveX = action.attr?.moveX || 0
      const attrMoveY = action.attr?.moveY || 0
      const actionRotation = Math.atan2(attrMoveY, attrMoveX)
      let moveX = this.moveX + moveAcceleration * Math.cos(actionRotation)
      let moveY = this.moveY + moveAcceleration * Math.sin(actionRotation)

      this.moveX = moveX
      this.moveY = moveY
      this.rotation = actionRotation
      
      action.counter += timeStep
      
    } else if (action.name === 'dash') {
      const duration = 4  // Time in frames, not seconds. (Seconds seems inconsistent.)
      const progress = action.counter / duration
      
      if (!this.action.attr.acknowledged) {
        const moveX = action.attr.moveX  || 0
        const moveY = action.attr.moveY  || 0
        this.rotation = (action.attr.moveX === 0 && action.attr.moveY === 0)
          ? this.rotation
          : Math.atan2(moveY, moveX)
        action.attr.acknowledged = true
        action.attr.rotation = this.rotation
      }
      
      if (action.attr.rotation !== undefined) {
        const PUSH_POWER = 6 * this.size * timeStep / 1000
        this.pushX += PUSH_POWER  * Math.cos(action.attr.rotation)
        this.pushY += PUSH_POWER * Math.sin(action.attr.rotation)
        console.log('Dash: ', PUSH_POWER, timeStep)
      }
    
      action.counter += 1
      
      if (action.counter >= duration) {  // Time in frames, not seconds
        console.log('Dash ended at: ', action.counter)
        this.goIdle()
      }
    }
  }
  
  goIdle () {
    this.action = {
      name: 'idle',
      counter: 0,
      attr: {},
    }
  }
  
  paint () {
    const app = this._app
    
    this.colour = '#4c4'
    super.paint()
  }
}
  
export default Enemy