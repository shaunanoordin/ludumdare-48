import {
  APP_WIDTH, APP_HEIGHT, TILE_SIZE,
  PLAYER_ACTIONS, SHAPES,
  ACCEPTABLE_INPUT_DISTANCE_FROM_HERO,
  VICTORY_ANIMATION_TIME,
  PAUSE_AFTER_VICTORY_ANIMATION,
  MAX_PULL_DISTANCE,
} from './constants'
import Physics from './physics'
import Levels from './levels'
import ImageAsset from './image-asset'

const searchParams = new URLSearchParams(window.location.search)
const DEBUG = searchParams.get('debug') || false
const STARTING_LEVEL = (Number.isInteger(parseInt(searchParams.get('level'))))
  ? parseInt(searchParams.get('level')) - 1
  : 0

class LD48 {
  constructor () {
    this.html = {
      main: document.getElementById('main'),
      canvas: document.getElementById('canvas'),
      menu: document.getElementById('menu'),
      buttonHome: document.getElementById('button-home'),
      buttonFullscreen: document.getElementById('button-fullscreen'),
      buttonReload: document.getElementById('button-reload'),
      levelsList: document.getElementById('levels-list'),
    }
    
    this.menu = false
    this.setMenu(false)
    
    this.canvas2d = this.html.canvas.getContext('2d')
    this.canvasWidth = APP_WIDTH
    this.canvasHeight = APP_HEIGHT
    
    this.camera = {
      target: null,  // Target entity to follow. If null, camera is static.
      x: 0,
      y: 0,      
    }
    
    this.setupUI()
    
    this.initialised = false
    this.assets = {}
    
    this.hero = null
    this.entities = []
    this.levels = new Levels(this)
    
    this.playerAction = PLAYER_ACTIONS.IDLE
    this.playerInput = {
      // Mouse/touchscreen input
      pointerStart: undefined,
      pointerCurrent: undefined,
      pointerEnd: undefined,
      
      // Keys that are currently being pressed.
      // keysPressed = { key: { duration, acknowledged } }
      keysPressed: {},
    }
    
    this.victory = false
    this.victoryCountdown = 0
    this.score = 0

    this.prevTime = null
    this.nextFrame = window.requestAnimationFrame(this.main.bind(this))
  }
  
  initialisationCheck () {
    // Assets check
    let allAssetsLoaded = true
    let numLoadedAssets = 0
    let numTotalAssets = 0
    Object.keys(this.assets).forEach((id) => {
      const asset = this.assets[id]
      allAssetsLoaded = allAssetsLoaded && asset.loaded
      if (asset.loaded) numLoadedAssets++
      numTotalAssets++
    })
    
    // Paint status
    this.canvas2d.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
    this.canvas2d.textAlign = 'start'
    this.canvas2d.textBaseline = 'top'
    this.canvas2d.fillStyle = '#ccc'
    this.canvas2d.font = `1em monospace`
    this.canvas2d.fillText(`Loading ${numLoadedAssets} / ${numTotalAssets} `, TILE_SIZE, TILE_SIZE)
    
    if (allAssetsLoaded) {
      this.initialised = true
      this.showUI()
      this.levels.load(STARTING_LEVEL)
    }
  }
  
  /*
  Section: General Logic
  ----------------------------------------------------------------------------
   */
  
  main (time) {
    const timeStep = (this.prevTime) ? time - this.prevTime : time
    this.prevTime = time
    
    if (this.initialised) {
      this.play(timeStep)
      this.paint()
    } else {
      this.initialisationCheck()
    }
    
    this.nextFrame = window.requestAnimationFrame(this.main.bind(this))
  }
  
  play (timeStep) {
    // If the menu is open, pause all action gameplay
    if (this.menu) return
    
    // Run the action gameplay
    // ----------------
    this.entities.forEach(entity => entity.play(timeStep))
    this.checkCollisions(timeStep)
    
    // Cleanup
    this.entities = this.entities.filter(entity => !entity._expired)
    // ----------------
    
    // Victory check!
    // ----------------
    if (this.victory && this.victoryCountdown <= 0) {
      console.log('VICTORY')
      this.setMenu(true)
    }
    
    if (this.victoryCountdown > 0) {
      this.victoryCountdown = Math.max(0, this.victoryCountdown - timeStep)
    }
    // ----------------
    
    // Increment the duration of each currently pressed key
    Object.keys(this.playerInput.keysPressed).forEach(key => {
      if (this.playerInput.keysPressed[key]) this.playerInput.keysPressed[key].duration += timeStep
    })
          
    this.processPlayerInput()
  }
  
  paint () {
    const c2d = this.canvas2d
    const camera = this.camera
    
    // Camera Controls: focus the camera on the target entity, if any.
    // ----------------
    if (camera.target) {
      camera.x = this.canvasWidth / 2 - camera.target.x
      camera.y = this.canvasHeight / 2 - camera.target.y
    }
    
    c2d.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
    
    c2d.strokeStyle = 'rgba(128, 128, 128, 0.05)'
    c2d.lineWidth = 2
    // ----------------
    
    // Draw grid
    // ----------------
    const offsetX = (this.camera.x % TILE_SIZE) - TILE_SIZE
    const offsetY = (this.camera.y % TILE_SIZE) - TILE_SIZE
    
    for (let y = offsetY ; y < APP_HEIGHT ; y += TILE_SIZE) {
      for (let x = offsetX ; x < APP_WIDTH ; x += TILE_SIZE) {
        c2d.beginPath()
        c2d.rect(x, y, TILE_SIZE, TILE_SIZE)
        c2d.stroke()
        
        // Debug Grid
        if (DEBUG) {
          c2d.fillStyle = '#ccc'
          c2d.font = `1em Source Code Pro`
          c2d.textAlign = 'center'
          c2d.textBaseline = 'middle'
          const col = Math.floor((x - this.camera.x) / TILE_SIZE)
          const row = Math.floor((y - this.camera.y) / TILE_SIZE)
          c2d.fillText(col + ',' + row, x + TILE_SIZE / 2, y + TILE_SIZE / 2)  // using template strings here messes up colours in Brackets.
        }
      }
    }
    // ----------------

    // Draw entities
    // ----------------
    const MAX_LAYER = 2
    for (let layer = 0 ; layer < MAX_LAYER ; layer++) {
      this.entities.forEach(entity => entity.paint(layer))
    }
    // ----------------
    
    // Draw player input
    // ----------------
    if (
      this.playerAction === PLAYER_ACTIONS.POINTER_DOWN
      && this.hero
      && this.playerInput.pointerCurrent
    ) {
      
      const inputCoords = this.playerInput.pointerCurrent
      
      c2d.strokeStyle = '#888'
      c2d.lineWidth = TILE_SIZE / 8
      
      c2d.beginPath()
      c2d.arc(inputCoords.x, inputCoords.y, TILE_SIZE, 0, 2 * Math.PI)
      c2d.stroke()
    }
    // ----------------

    // Draw UI data
    // ----------------
    if (!this.victory) {
      const X_OFFSET = TILE_SIZE * 2.5
      const Y_OFFSET = TILE_SIZE * -1.0
      c2d.font = '3em Source Code Pro'
      c2d.textBaseline = 'bottom'
      c2d.lineWidth = 8

      const health = Math.max(this.hero?.health, 0) || 0
      let text = '❤️'.repeat(health)
      c2d.textAlign = 'left'
      c2d.strokeStyle = '#fff'
      c2d.strokeText(text, X_OFFSET, APP_HEIGHT + Y_OFFSET)
      c2d.fillStyle = '#c44'
      c2d.fillText(text, X_OFFSET, APP_HEIGHT + Y_OFFSET)
      
      text = this.hero?.action?.name + ' (' + this.hero?.moveSpeed.toFixed(2) + ')' 
      c2d.textAlign = 'right'
      c2d.strokeStyle = '#fff'
      c2d.strokeText(text, APP_WIDTH - X_OFFSET, APP_HEIGHT + Y_OFFSET)
      c2d.fillStyle = '#c44'
      c2d.fillText(text, APP_WIDTH - X_OFFSET, APP_HEIGHT + Y_OFFSET)
    }
    // ----------------
    
    // Draw victory
    // ----------------
    if (this.victory) {
      const victoryAnimationTime = Math.max(this.victoryCountdown - PAUSE_AFTER_VICTORY_ANIMATION, 0)
      const fontSize1 = Math.floor((victoryAnimationTime / VICTORY_ANIMATION_TIME) * 50 + 10)
      const fontSize2 = Math.floor((victoryAnimationTime / VICTORY_ANIMATION_TIME) * 50 + 10)
      const VERTICAL_OFFSET = TILE_SIZE / 8
      
      c2d.fillStyle = '#c44'
      c2d.lineWidth = 2
      c2d.textAlign = 'center'
      c2d.strokeStyle = '#fff'
      
      /*
      c2d.font = `${fontSize1}em Source Code Pro`
      c2d.textBaseline = 'bottom'
      c2d.fillText('Nice!', APP_WIDTH / 2, APP_HEIGHT / 2 - VERTICAL_OFFSET)
      c2d.strokeText('Nice!', APP_WIDTH / 2, APP_HEIGHT / 2 - VERTICAL_OFFSET)
      
      c2d.font = `${fontSize2}em Source Code Pro`
      c2d.textBaseline = 'top'
      c2d.fillText(`${this.score} points`, APP_WIDTH / 2, APP_HEIGHT / 2 + VERTICAL_OFFSET)
      c2d.strokeText(`${this.score} points`, APP_WIDTH / 2, APP_HEIGHT / 2 + VERTICAL_OFFSET)
      */
    }
    // ----------------
  }
  
  processPlayerInput (timeStep) {
    if (this.hero) {
      const keysPressed = this.playerInput.keysPressed
      let intent = undefined
      let directionX = 0
      let directionY = 0
      
      if (keysPressed['ArrowRight']) directionX++
      if (keysPressed['ArrowDown']) directionY++
      if (keysPressed['ArrowLeft']) directionX--
      if (keysPressed['ArrowUp']) directionY--
      
      if (
        (keysPressed['x'] && !keysPressed['x'].acknowledged)
        || (keysPressed['X'] && !keysPressed['X'].acknowledged)
      ) {
        intent = {
          name: 'dash',
          directionX,
          directionY,
        }
        if (keysPressed['x']) keysPressed['x'].acknowledged = true
        if (keysPressed['X']) keysPressed['X'].acknowledged = true
      
      } else if (directionX || directionY) {
        intent = {
          name: 'move',
          directionX,
          directionY,
        }
      }
  
      this.hero.intent = intent
    }
  }
  
  /*
  Section: UI and Event Handling
  ----------------------------------------------------------------------------
   */
  
  setupUI () {
    this.html.canvas.width = this.canvasWidth
    this.html.canvas.height = this.canvasHeight
    
    if (window.PointerEvent) {
      this.html.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this))
      this.html.canvas.addEventListener('pointermove', this.onPointerMove.bind(this))
      this.html.canvas.addEventListener('pointerup', this.onPointerUp.bind(this))
      this.html.canvas.addEventListener('pointercancel', this.onPointerUp.bind(this))
    } else {
      this.html.canvas.addEventListener('mousedown', this.onPointerDown.bind(this))
      this.html.canvas.addEventListener('mousemove', this.onPointerMove.bind(this))
      this.html.canvas.addEventListener('mouseup', this.onPointerUp.bind(this))
    }
    
    // Prevent "touch and hold to open context menu" menu on touchscreens.
    this.html.canvas.addEventListener('touchstart', stopEvent)
    this.html.canvas.addEventListener('touchmove', stopEvent)
    this.html.canvas.addEventListener('touchend', stopEvent)
    this.html.canvas.addEventListener('touchcancel', stopEvent)
    
    this.html.buttonHome.addEventListener('click', this.buttonHome_onClick.bind(this))
    this.html.buttonFullscreen.addEventListener('click', this.buttonFullscreen_onClick.bind(this))
    this.html.buttonReload.addEventListener('click', this.buttonReload_onClick.bind(this))
    
    this.html.main.addEventListener('keydown', this.onKeyDown.bind(this))
    this.html.main.addEventListener('keyup', this.onKeyUp.bind(this))
    
    window.addEventListener('resize', this.updateUI.bind(this))
    this.updateUI()
    this.hideUI()  // Hide until all assets are loaded
    
    this.html.main.focus()
  }
  
  hideUI () {
    this.html.buttonHome.style.visibility = 'hidden'
    this.html.buttonReload.style.visibility = 'hidden'
  }
  
  showUI () {
    this.html.buttonHome.style.visibility = 'visible'
    this.html.buttonReload.style.visibility = 'visible'
  }
  
  updateUI () {
    // Fit the Interaction layer to the canvas
    const mainDivBounds = this.html.main.getBoundingClientRect()
    const canvasBounds = this.html.canvas.getBoundingClientRect()
    this.html.menu.style.width = `${canvasBounds.width}px`
    this.html.menu.style.height = `${canvasBounds.height}px`
    this.html.menu.style.top = `${canvasBounds.top - mainDivBounds.top}px`
    this.html.menu.style.left = `${canvasBounds.left}px`
  }
  
  setMenu (menu) {
    this.menu = menu
    if (menu) {
      this.html.menu.style.visibility = 'visible'
      this.html.buttonReload.style.visibility = 'hidden'
    } else {
      this.html.menu.style.visibility = 'hidden'
      this.html.buttonReload.style.visibility = 'visible'
      this.html.main.focus()
    }
  }
  
  onPointerDown (e) {
    const coords = getEventCoords(e, this.html.canvas)
    const camera = this.camera
    
    this.playerInput.pointerStart = undefined
    this.playerInput.pointerCurrent = undefined
    this.playerInput.pointerEnd = undefined
    
    if (this.hero) {
      const distX = this.hero.x - coords.x + camera.x
      const distY = this.hero.y - coords.y + camera.y
      const distFromHero = Math.sqrt(distX * distX + distY * distY)
      const rotation = Math.atan2(distY, distX)
      
      if (distFromHero < ACCEPTABLE_INPUT_DISTANCE_FROM_HERO) {
        this.playerAction = PLAYER_ACTIONS.POINTER_DOWN
        this.playerInput.pointerStart = coords
        this.playerInput.pointerCurrent = coords
      }
    }
    
    this.html.main.focus()
    
    return stopEvent(e)
  }
  
  onPointerMove (e) {
    const coords = getEventCoords(e, this.html.canvas)
    this.playerInput.pointerCurrent = coords
    
    return stopEvent(e)
  }
  
  onPointerUp (e) {
    const coords = getEventCoords(e, this.html.canvas)
    
    if (this.playerAction === PLAYER_ACTIONS.POINTER_DOWN) {
      this.playerInput.pointerEnd = coords
      this.playerAction = PLAYER_ACTIONS.IDLE
    }
    
    return stopEvent(e)
  }
  
  onKeyDown (e) {
    if (!this.playerInput.keysPressed[e.key]) {
      this.playerInput.keysPressed[e.key] = {
        duration: 0,
        acknowledged: false,
      }
    }
  }
  
  onKeyUp (e) {
    this.playerInput.keysPressed[e.key] = undefined
  }
  
  buttonHome_onClick () {
    this.setMenu(!this.menu)
  }
  
  buttonFullscreen_onClick () {
    const isFullscreen = document.fullscreenElement
    if (!isFullscreen) {
      if (this.html.main.requestFullscreen) {
        this.html.main.className = 'fullscreen'
        this.html.main.requestFullscreen()
      }
    } else {
      document.exitFullscreen?.()
      this.html.main.className = ''
    }
    this.updateUI()
  }
  
  buttonReload_onClick () {
    this.levels.reload()
  }
  
  /*
  Section: Gameplay
  ----------------------------------------------------------------------------
   */
  
  celebrateVictory () {
    if (this.victory) return
    this.victory = true
    this.victoryCountdown = VICTORY_ANIMATION_TIME + PAUSE_AFTER_VICTORY_ANIMATION
  }
    
  /*
  Section: Misc
  ----------------------------------------------------------------------------
   */
  
  checkCollisions (timeStep) {
    for (let a = 0 ; a < this.entities.length ; a++) {
      let entityA = this.entities[a]
      
      for (let b = a + 1 ; b < this.entities.length ; b++) {
        let entityB = this.entities[b]
        let collisionCorrection = Physics.checkCollision(entityA, entityB)
        
        if (collisionCorrection) {
          entityA.onCollision(entityB, collisionCorrection.a)
          entityB.onCollision(entityA, collisionCorrection.b)
        }
      }
    }  
  }
}

function getEventCoords (event, element) {
  const xRatio = (element.width && element.offsetWidth) ? element.width / element.offsetWidth : 1
  const yRatio = (element.height && element.offsetHeight) ? element.height / element.offsetHeight : 1
  
  const x = event.offsetX * xRatio
  const y = event.offsetY * yRatio
  return { x, y }
}

function stopEvent (e) {
  if (!e) return false
  e.preventDefault && e.preventDefault()
  e.stopPropagation && e.stopPropagation()
  e.returnValue = false
  e.cancelBubble = true
  return false
}

export default LD48
