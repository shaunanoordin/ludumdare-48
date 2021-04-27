import { TILE_SIZE, ROTATIONS, DIRECTIONS, SHAPES, PLAYER_ACTIONS, EXPECTED_TIMESTEP } from './constants'

const MOVE_MAX_SPEED_MODIFIER = 2 / EXPECTED_TIMESTEP
const PUSH_MAX_SPEED_MODIFIER = 12 / EXPECTED_TIMESTEP
const MOVE_ACCELERATION_MODIFIER = 1 / EXPECTED_TIMESTEP
const MOVE_DECELERATION_MODIFIER = 0.2 / EXPECTED_TIMESTEP
const PUSH_DECELERATION_MODIFIER = 0.2 / EXPECTED_TIMESTEP

class Entity {
  constructor (app) {
    this._app = app
    
    // General identity stats
    this.colour = '#ccc'
    
    // Expired entities are removed at the end of the cycle.
    this._expired = false
    
    // Positional data
    this.x = 0
    this.y = 0
    this.size = TILE_SIZE
    this._rotation = ROTATIONS.SOUTH  // Rotation in radians
    this.shape = SHAPES.CIRCLE
    this.shapePolygonPath = null  // Only applicable if shape === SHAPES.POLYGON
    
    // Physics (movement): self locomotion and external (pushed) movement.
    this.moveX = 0
    this.moveY = 0
    this.pushX = 0
    this.pushY = 0
    
    // Additional physics
    this._solid = true
    this._movable = true
    this._mass = 2  // Only matters if solid && movable
    this._moveAcceleration = this.size * MOVE_ACCELERATION_MODIFIER
    this._moveDeceleration = this.size * MOVE_DECELERATION_MODIFIER
    this._moveMaxSpeed = this.size * MOVE_MAX_SPEED_MODIFIER
    this._pushDeceleration = this.size * PUSH_DECELERATION_MODIFIER
    this._pushMaxSpeed = this.size * PUSH_MAX_SPEED_MODIFIER
  }
  
  /*
  Section: General Logic
  ----------------------------------------------------------------------------
   */
  
  play (timeStep) {
    // Upkeep: limit speed
    this.doMaxSpeedLimit(timeStep)
    
    // Update position
    const timeCorrection = 1
    // const timeCorrection = (timeStep / EXPECTED_TIMESTEP)  // Edit: time correction may not be needed since Entities fix their own moveXY/pushXY values
    this.x += (this.moveX + this.pushX) * timeCorrection
    this.y += (this.moveY + this.pushY) * timeCorrection
    
    // Upkeep: deceleration
    this.doMoveDeceleration(timeStep)
    this.doPushDeceleration(timeStep)
  }
  
  /*
  Paints entity's hitbox.
   */
  paint (layer = 0) {
    const c2d = this._app.canvas2d
    const camera = this._app.camera
    
    if (layer === 0) {
      c2d.fillStyle = this.colour
      c2d.strokeStyle = '#444'
      c2d.lineWidth = this.mass

      // Draw shape outline
      switch (this.shape) {
      case SHAPES.CIRCLE:
        c2d.beginPath()
        c2d.arc(this.x + camera.x, this.y + camera.y, this.size / 2, 0, 2 * Math.PI)
        c2d.closePath()
        c2d.fill()
        this.solid && c2d.stroke()
        break
      case SHAPES.SQUARE:
        c2d.beginPath()
        c2d.rect(this.x + camera.x - this.size / 2, this.y + camera.y - this.size / 2, this.size, this.size)
        c2d.closePath()
        c2d.fill()
        this.solid && c2d.stroke()
        break
      case SHAPES.POLYGON:
        c2d.beginPath()
        let coords = this.vertices
        if (coords.length >= 1) c2d.moveTo(coords[coords.length-1].x + camera.x, coords[coords.length-1].y + camera.y)
        for (let i = 0 ; i < coords.length ; i++) {
          c2d.lineTo(coords[i].x + camera.x, coords[i].y + camera.y)
        }
        c2d.closePath()
        c2d.fill()
        this.solid && c2d.stroke()
        break
      }

      // Draw anchor point, mostly for debugging
      c2d.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      c2d.beginPath()
      c2d.arc(this.x + camera.x, this.y + camera.y, 2, 0, 2 * Math.PI)  // Anchor point
      if (this.shape === SHAPES.CIRCLE) {  // Direction line
        c2d.moveTo(
          this.x + this.size * 0.1 * Math.cos(this.rotation) + camera.x,
          this.y + this.size * 0.1 * Math.sin(this.rotation) + camera.y
        )
        c2d.lineTo(
          this.x + this.size * 0.5 * Math.cos(this.rotation) + camera.x,
          this.y + this.size * 0.5 * Math.sin(this.rotation) + camera.y
        )
      }
      c2d.stroke()
      c2d.closePath()
    }
  }
  
  /*
  Section: Game Logic
  ----------------------------------------------------------------------------
   */
  
  /*
  Applies an effect to this entity. Usually called by another antity.
  e.g. a fireball hits this character and applies an "ON FIRE" effect.
   */
  applyEffect (effect, source) {}
  
  /*
  Section: Event Handling
  ----------------------------------------------------------------------------
   */
  
  /*
  Triggers when this entity hits/touches/intersects with another.
   */
  onCollision (target, collisionCorrection) {
    this.doBounce(target, collisionCorrection)
    this.x = collisionCorrection.x
    this.y = collisionCorrection.y
  }
  
  /*
  Section: Physics
  ----------------------------------------------------------------------------
   */
  
  /*
  By default, every moving entity decelerates (because we don't exist in a
  perfect vacuum and the game doesn't take place on a slippery ice).
  Entities can intentionally override this logic,
  e.g. "if a hero is walking, ignore deceleration."
   */
  doMoveDeceleration (timeStep) {
    const moveDeceleration = this.moveDeceleration * timeStep / EXPECTED_TIMESTEP || 0
    const curRotation = Math.atan2(this.moveY, this.moveX)
    const newMoveSpeed = Math.max(0, this.moveSpeed - moveDeceleration)
    this.moveX = newMoveSpeed * Math.cos(curRotation)
    this.moveY = newMoveSpeed * Math.sin(curRotation)
  }
  
  doPushDeceleration (timeStep) {
    const pushDeceleration = this.pushDeceleration * timeStep / EXPECTED_TIMESTEP || 0
    const curRotation = Math.atan2(this.pushY, this.pushX)
    const newPushSpeed = Math.max(0, this.pushSpeed - pushDeceleration)
    this.pushX = newPushSpeed * Math.cos(curRotation)
    this.pushY = newPushSpeed * Math.sin(curRotation)
  }
  
  /*
  Every entity has a maximum speed limit. Intentional movement speed and
  external force movement speed are treated separately.
   */
  doMaxSpeedLimit (timeStep) {
    // Limit max move speed
    if (this.moveMaxSpeed >= 0) {
      const correctedSpeed = Math.min(this.moveMaxSpeed, this.moveSpeed)
      const moveAngle = this.moveAngle
      this.moveX = correctedSpeed * Math.cos(moveAngle)
      this.moveY = correctedSpeed * Math.sin(moveAngle)
    }
    
    // Limit max push speed
    if (this.pushMaxSpeed >= 0) {
      const correctedSpeed = Math.min(this.pushMaxSpeed, this.pushSpeed)
      const pushAngle = this.pushAngle
      this.pushX = correctedSpeed * Math.cos(pushAngle)
      this.pushY = correctedSpeed * Math.sin(pushAngle)
    }
  }
  
  /*
  When a solid pushed entity hits another solid entity, momentum is transferred.
  Usually, this leads to elastic collisions, because that chaos is fun!
   */
  doBounce (target, collisionCorrection) {
    if (
      this.movable && this.solid
      && !target.movable && target.solid
    ) {
      if (
        this.shape === SHAPES.CIRCLE && target.shape === SHAPES.CIRCLE
      ) {
        
        // For circle + circle collisions, the collision correction already
        // tells us the bounce direction.
        const angle = Math.atan2(collisionCorrection.y - this.y, collisionCorrection.x - this.x)
        const speed = Math.sqrt(this.pushX * this.pushX + this.pushY * this.pushY)

        this.pushX = Math.cos(angle) * speed
        this.pushY = Math.sin(angle) * speed

      } else if (
        this.shape === SHAPES.CIRCLE
        && (target.shape === SHAPES.SQUARE || target.shape === SHAPES.POLYGON)
      ) {
        
        // For circle + polygon collisions, we need to know...
        // - the original angle this circle was moving towards (or rather, its
        //   reverse, because we want a bounce)
        // - the normal vector (of the edge) of the polygon this circle collided
        //   into (which we can get from the collision correction)
        // - the angle between them
        const reverseOriginalAngle = Math.atan2(-this.pushY, -this.pushX)
        const normalAngle = Math.atan2(collisionCorrection.y - this.y, collisionCorrection.x - this.x)
        const angleBetween = normalAngle - reverseOriginalAngle
        const angle = reverseOriginalAngle + 2 * angleBetween

        const speed = Math.sqrt(this.pushX * this.pushX + this.pushY * this.pushY)

        this.pushX = Math.cos(angle) * speed
        this.pushY = Math.sin(angle) * speed
        
      } else {
        // For the moment, we're not too concerned about polygons bumping into each other
      }
    } else if (
      this.movable && this.solid
      && target.movable && target.solid
      && collisionCorrection.pushX !== undefined
      && collisionCorrection.pushY !== undefined
    ) {
      this.pushX = collisionCorrection.pushX
      this.pushY = collisionCorrection.pushY
    }
  }
  
  /*
  Section: Getters and Setters
  ----------------------------------------------------------------------------
   */
  
  get left () { return this.x - this.size / 2 }
  get right () { return this.x + this.size / 2 }
  get top () { return this.y - this.size / 2 }
  get bottom () { return this.y + this.size / 2 }
  
  set left (val) { this.x = val + this.size / 2 }
  set right (val) { this.x = val - this.size / 2 }
  set top (val) { this.y = val + this.size / 2 }
  set bottom (val) { this.y = val - this.size / 2 }
  
  get radius () { return this.size / 2 }
  
  set radius (val) { this.size = val * 2 }
  
  get rotation () { return this._rotation }
  
  set rotation (val) {
    this._rotation = val
    while (this._rotation > Math.PI) { this._rotation -= Math.PI * 2 }
    while (this._rotation <= -Math.PI) { this._rotation += Math.PI * 2 }
  }
  
  get direction () {  //Get cardinal direction
    //Favour East and West when rotation is exactly SW, NW, SE or NE.
    if (this._rotation <= Math.PI * 0.25 && this._rotation >= Math.PI * -0.25) { return DIRECTIONS.EAST }
    else if (this._rotation > Math.PI * 0.25 && this._rotation < Math.PI * 0.75) { return DIRECTIONS.SOUTH }
    else if (this._rotation < Math.PI * -0.25 && this._rotation > Math.PI * -0.75) { return DIRECTIONS.NORTH }
    else { return DIRECTIONS.WEST }
  }
  
  set direction (val) {
    switch (val) {
      case DIRECTIONS.EAST:
        this._rotation = ROTATIONS.EAST
        break
      case DIRECTIONS.SOUTH:
        this._rotation = ROTATIONS.SOUTH
        break
      case DIRECTIONS.WEST:
        this._rotation = ROTATIONS.WEST
        break
      case DIRECTIONS.NORTH:
        this._rotation = ROTATIONS.NORTH
        break
    }
  }
  
  get vertices () {
    const v = []
    if (this.shape === SHAPES.SQUARE) {
      v.push({ x: this.left, y: this.top })
      v.push({ x: this.right, y: this.top })
      v.push({ x: this.right, y: this.bottom })
      v.push({ x: this.left, y: this.bottom })
    } else if (this.shape === SHAPES.CIRCLE) {  //Approximation
      CIRCLE_TO_POLYGON_APPROXIMATOR.map((approximator) => {
        v.push({ x: this.x + this.radius * approximator.cosAngle, y: this.y + this.radius * approximator.sinAngle })
      })
    } else if (this.shape === SHAPES.POLYGON) {
      if (!this.shapePolygonPath) return []
      for (let i = 0 ; i < this.shapePolygonPath.length ; i += 2) {
        v.push({ x: this.x + this.shapePolygonPath[i], y: this.y + this.shapePolygonPath[i+1] })
      }
    }
    return v
  }
  
  set vertices (val) { console.error('ERROR: Entity.vertices is read only') }
  
  get solid () { return this._solid }
  get movable () { return this._movable }
  get mass () {  return this._mass }
  get moveAcceleration () { return this._moveAcceleration }
  get moveDeceleration () { return this._moveDeceleration } 
  get moveMaxSpeed () { return this._moveMaxSpeed }
  get pushDeceleration () { return this._pushDeceleration }
  get pushMaxSpeed () { return this._pushMaxSpeed }
  
  set solid (val) { this._solid = val }
  set movable (val) { this._movable = val }
  set mass (val) {  this._mass = val }
  set moveAcceleration (val) { this._moveAcceleration = val }
  set moveDeceleration (val) { this._moveDeceleration = val } 
  set moveMaxSpeed (val) { this._moveMaxSpeed = val }
  set pushDeceleration (val) { this._pushDeceleration = val }
  set pushMaxSpeed (val) { this._pushMaxSpeed = val }
  
  get moveSpeed () { return Math.sqrt(this.moveX * this.moveX + this.moveY * this.moveY) }
  get moveAngle () { return Math.atan2(this.moveY, this.moveX) }
  get pushSpeed () { return Math.sqrt(this.pushX * this.pushX + this.pushY * this.pushY) }
  get pushAngle () { return Math.atan2(this.pushY, this.pushX) }
  
  set moveSpeed (val) { console.error('ERROR: Entity.moveSpeed is read only') }
  set moveAngle (val) { console.error('ERROR: Entity.moveAngle is read only') }
  set pushSpeed (val) { console.error('ERROR: Entity.pushSpeed is read only') }
  set pushAngle (val) { console.error('ERROR: Entity.pushAngle is read only') }
}

const CIRCLE_TO_POLYGON_APPROXIMATOR =
  [ROTATIONS.EAST, ROTATIONS.SOUTHEAST, ROTATIONS.SOUTH, ROTATIONS.SOUTHWEST,
   ROTATIONS.WEST, ROTATIONS.NORTHWEST, ROTATIONS.NORTH, ROTATIONS.NORTHEAST]
  .map((angle) => {
    return ({ cosAngle: Math.cos(angle), sinAngle: Math.sin(angle) })
  })

export default Entity