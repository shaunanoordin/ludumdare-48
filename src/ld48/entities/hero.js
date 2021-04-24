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
    
    this.intent = undefined
    this.action = undefined
  }
  
  play (timeStep) {
    const app = this._app
    super.play(timeStep)
    
    this.processIntent()
    this.processAction(timeStep)
  }
  
  play_physics_deceleration (timeStep) {
    // Don't decelerate if moving
    if (this.action?.name !== 'move') {
      super.play_physics_deceleration (timeStep)
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
    
    if (action.name === 'move') {
      const moveAcceleration = this.moveAcceleration * timeStep / 1000 || 0
      const actionRotation = Math.atan2(action.attr?.moveY || 0, action.attr?.moveX || 0)
      let moveX = this.moveX + moveAcceleration * Math.cos(actionRotation)
      let moveY = this.moveY + moveAcceleration * Math.sin(actionRotation)

      // Limit max speed
      if (this.moveMaxSpeed >= 0) {
        const moveMaxSpeed = this.moveMaxSpeed;
        const correctedSpeed = Math.min(moveMaxSpeed, Math.sqrt(moveX * moveX + moveY * moveY))
        const moveRotation = Math.atan2(moveY, moveX)
        moveX = correctedSpeed * Math.cos(moveRotation)
        moveY = correctedSpeed * Math.sin(moveRotation)
      }

      this.moveX = moveX
      this.moveY = moveY
      this.rotation = actionRotation
      
      action.counter += timeStep
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
    
    this.colour = (app.playerAction === PLAYER_ACTIONS.POINTER_DOWN)
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

    srcX = (this.moveX < 0) ? 0 : SPRITE_SIZE

    c2d.drawImage(animationSpritesheet.img, srcX, srcY, srcSizeX, srcSizeY, tgtX, tgtY, tgtSizeX, tgtSizeY)
  }
}
  
export default Hero