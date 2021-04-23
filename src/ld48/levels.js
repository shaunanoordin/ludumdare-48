import { PLAYER_ACTIONS, IDLE_TIME_UNTIL_INSTRUCTIONS } from './constants'

import Hero from './entities/hero'
import Goal from './entities/goal'
import Wall from './entities/wall'
import Ball from './entities/ball'
import Coin from './entities/coin'
import Instructions from './entities/instructions'
import Splash from './entities/splash'

const HIGHSCORE_STORAGE_KEY = 'cny2021.levels.highscores'

export default class Levels {
  constructor (app) {
    this._app = app
    this.current = 0
    this.levelGenerators = [
      this.generate_level1.bind(this),
      this.generate_level2.bind(this),
      this.generate_level3.bind(this),
      this.generate_level4.bind(this),
      this.generate_level5.bind(this),
    ]
    this.highScores = this.levelGenerators.map(() => undefined)
    
    this.loadHighScores()
  }
  
  reset () {
    const app = this._app
    app.hero = undefined
    app.instructions = null
    app.entities = []
    app.camera = {
      target: null, x: 0, y: 0,
    }
    app.playerAction = PLAYER_ACTIONS.IDLE
    app.victory = 0
    app.victoryCountdown = 0
    app.instructionsCountdown = IDLE_TIME_UNTIL_INSTRUCTIONS
    app.score = 0
  }
  
  load (level = 0) {
    const app = this._app
    this.current = level
    
    this.reset()
    
    if (this.levelGenerators[level]) {
      this.levelGenerators[level]()
    } else {
      this.generate_default()
    }
    
    // Rearrange: 
    app.entities.sort((a, b) => a.z - b.z)
  }
  
  reload () {
    this.load(this.current)
  }
  
  registerScore (score) {
    if (this.current < 0 || this.current >= this.levelGenerators.length) return
    
    if (
      this.highScores[this.current] === undefined
      || this.highScores[this.current] === null
      || this.highScores[this.current] < score
    ) {
      this.highScores[this.current] = score
    }
    
    this.saveHighScores()
  }
  
  saveHighScores () {
    const storage = window?.localStorage
    if (!storage) return
    storage.setItem(HIGHSCORE_STORAGE_KEY, JSON.stringify(this.highScores))
  }
  
  loadHighScores () {
    const storage = window?.localStorage
    if (!storage) return
    try {
      const str = storage.getItem(HIGHSCORE_STORAGE_KEY)
      this.highScores = (str) ? JSON.parse(str) : []
    } catch (err) {
      this.highScores = []
      console.error(err)
    }
  }
  
  /*  Default level.
   */
  generate_default () {
    const app = this._app
    
    app.hero = new Hero(app, 11, 3)
    app.entities.push(app.hero)
    app.camera.target = app.hero
    
    app.entities.push(new Goal(app, 19, 3))
    
    app.instructions = new Instructions(app, 5, 3)
    app.entities.push(app.instructions)
    
    app.entities.push(new Wall(app, 0, 0, 1, 7))  // West Wall
    app.entities.push(new Wall(app, 22, 0, 1, 7))  // East Wall
    app.entities.push(new Wall(app, 1, 0, 21, 1))  // North Wall
    app.entities.push(new Wall(app, 1, 6, 21, 1))  // South Wall
  }
  
  /*
  Introductory level
   */
  generate_level1 () {
    const app = this._app
    
    app.hero = new Hero(app, 11, 3)
    app.entities.push(app.hero)
    app.camera.target = app.hero
    
    app.entities.push(new Goal(app, 19, 3))
    
    app.instructions = new Instructions(app, 5, 3)
    app.entities.push(app.instructions)
    
    app.entities.push(new Wall(app, 0, 0, 1, 7))  // West Wall
    app.entities.push(new Wall(app, 22, 0, 1, 7))  // East Wall
    app.entities.push(new Wall(app, 1, 0, 21, 1))  // North Wall
    app.entities.push(new Wall(app, 1, 6, 21, 1))  // South Wall
    
    app.entities.push(new Splash(app, 11, -2.5, 0))
    app.entities.push(new Splash(app, 11, 8.5, 1))
    
    app.entities.push(new Coin(app, 3, 3))
    app.entities.push(new Coin(app, 15, 3))
  }
  
  /*
  Diagonal shot level
  One shot solution (10 points):
  - Aim directly 45º south-west
    */
  generate_level2 () {
    const app = this._app
    
    app.hero = new Hero(app, 9, 5)
    app.entities.push(app.hero)
    app.camera.target = app.hero
    
    app.entities.push(new Goal(app, 11, 3))
    
    
    app.entities.push(new Wall(app, 0, 0, 1, 11))  // West Wall
    app.entities.push(new Wall(app, 18, 0, 1, 11))  // East Wall
    app.entities.push(new Wall(app, 1, 0, 17, 1))  // North Wall
    app.entities.push(new Wall(app, 1, 10, 17, 1))  // South Wall
    
    app.entities.push(new Coin(app, 5, 2))
    app.entities.push(new Coin(app, 5, 8))
    app.entities.push(new Coin(app, 13, 2))
    app.entities.push(new Coin(app, 13, 8))
    
    app.entities.push(new Coin(app, 3, 3))
    app.entities.push(new Coin(app, 7, 3))
    app.entities.push(new Coin(app, 15, 3))
    
    app.entities.push(new Coin(app, 3, 7))
    app.entities.push(new Coin(app, 7, 7))
    app.entities.push(new Coin(app, 11, 7))
    app.entities.push(new Coin(app, 15, 7))
  }
  
  /*  Ball tutorial level
   */
  generate_level3 () {
    const app = this._app
    
    app.hero = new Hero(app, 12, 3)
    app.entities.push(app.hero)
    app.camera.target = app.hero
    
    app.entities.push(new Goal(app, 21, 3))
    
    app.instructions = new Instructions(app, 5, 3)
    app.entities.push(app.instructions)
    
    app.entities.push(new Wall(app, 0, 0, 1, 7))  // West Wall
    app.entities.push(new Wall(app, 24, 0, 1, 7))  // East Wall
    app.entities.push(new Wall(app, 1, 0, 23, 1))  // North Wall
    app.entities.push(new Wall(app, 1, 6, 23, 1))  // South Wall
    
    app.entities.push(new Ball(app, 4, 3))
    app.entities.push(new Ball(app, 16, 1.5))
    app.entities.push(new Ball(app, 16, 4.5))
    
    app.entities.push(new Coin(app, 6, 2.5))
    app.entities.push(new Coin(app, 6, 3.5))
    app.entities.push(new Coin(app, 7, 2.5))
    app.entities.push(new Coin(app, 7, 3.5))
    app.entities.push(new Coin(app, 8, 2.5))
    app.entities.push(new Coin(app, 8, 3.5))
    
    app.entities.push(new Coin(app, 15, 2.5))
    app.entities.push(new Coin(app, 15, 3.5))
    app.entities.push(new Coin(app, 16, 3))
    app.entities.push(new Coin(app, 17, 2.5))
    app.entities.push(new Coin(app, 17, 3.5))
  }

  /*
  S-tube bounce level
  One shot solution (10 points):
  - Aim directly 45º north-east
   */
  generate_level4 () {
    const app = this._app
    
    app.hero = new Hero(app, 11.5, 7.5)
    app.entities.push(app.hero)
    app.camera.target = app.hero
    
    app.entities.push(new Goal(app, 20.5, 2.5))
    
    app.instructions = new Instructions(app, 5, 3)
    app.entities.push(app.instructions)
    
    app.entities.push(new Wall(app, 0, 0, 1, 16))  // West Wall
    app.entities.push(new Wall(app, 23, 0, 1, 16))  // East Wall
    app.entities.push(new Wall(app, 1, 0, 22, 1))  // North Wall
    app.entities.push(new Wall(app, 1, 15, 22, 1))  // South Wall
    app.entities.push(new Wall(app, 5, 5, 18, 1))
    app.entities.push(new Wall(app, 1, 10, 18, 1))
    
    app.entities.push(new Coin(app, 6.5, 2.5))
    app.entities.push(new Coin(app, 10, 2.5))
    app.entities.push(new Coin(app, 13, 2.5))
    app.entities.push(new Coin(app, 16.5, 2.5))
    
    app.entities.push(new Coin(app, 6.5, 7.5))
    app.entities.push(new Coin(app, 16.5, 7.5))
    
    app.entities.push(new Coin(app, 2.5, 12.5))
    app.entities.push(new Coin(app, 6.5, 12.5))
    app.entities.push(new Coin(app, 10, 12.5))
    app.entities.push(new Coin(app, 13, 12.5))
    app.entities.push(new Coin(app, 16.5, 12.5))
  }

  /*
  High difficulty level with corners and bouncing balls.
  One shot solution (10 points):
  - shoot DIRECTLY south...
  - ...when the horizontal ball is moving left at (11,8)
   */
  generate_level5 () {
    const app = this._app
    
    app.hero = new Hero(app, 11, 12)
    app.entities.push(app.hero)
    app.camera.target = app.hero
    
    app.entities.push(new Goal(app, 14, 8))
    
    app.instructions = new Instructions(app, 5, 3)
    app.entities.push(app.instructions)
    
    app.entities.push(new Wall(app, 0, 0, 1, 15))  // West Wall
    app.entities.push(new Wall(app, 25, 0, 1, 21))  // East Wall
    app.entities.push(new Wall(app, 1, 0, 24, 1))  // North Wall
    app.entities.push(new Wall(app, 1, 14, 9, 1))  // South Wall 1
    app.entities.push(new Wall(app, 10, 20, 15, 1))  // South Wall 2
    app.entities.push(new Wall(app, 9, 7, 1, 3))
    app.entities.push(new Wall(app, 1, 1, 3, 3, 'se'))
    app.entities.push(new Wall(app, 1, 11, 3, 3, 'ne'))
    app.entities.push(new Wall(app, 10, 1, 3, 3, 'sw'))
    app.entities.push(new Wall(app, 16, 11, 9, 9, 'nw'))
    app.entities.push(new Wall(app, 10, 14, 6, 6, 'ne'))
    app.entities.push(new Wall(app, 13, 1, 3, 3, 'se'))
    app.entities.push(new Wall(app, 22, 1, 3, 3, 'sw'))
    
    let ball
    
    app.entities.push(ball = new Ball(app, 5, 11))
    ball.moveDeceleration = 0
    ball.speedY = -6.5
    
    app.entities.push(ball = new Ball(app, 6, 12))
    ball.moveDeceleration = 0
    ball.speedY = -6.5
    
    app.entities.push(ball = new Ball(app, 7, 13))
    ball.moveDeceleration = 0
    ball.speedY = -6.5
    
    app.entities.push(ball = new Ball(app, 11, 8))
    ball.moveDeceleration = 0
    ball.speedX = 7.5
    
    app.entities.push(new Coin(app, 15.5, 14.5))
    app.entities.push(new Coin(app, 6, 12))
    app.entities.push(new Coin(app, 20, 12))
    app.entities.push(new Coin(app, 20, 2))
    app.entities.push(new Coin(app, 14, 5))
    app.entities.push(new Coin(app, 11, 8))
    app.entities.push(new Coin(app, 22, 10))
    app.entities.push(new Coin(app, 20, 8))
    app.entities.push(new Coin(app, 17, 2))
    app.entities.push(new Coin(app, 2, 8))
    app.entities.push(new Coin(app, 6, 2))
  }
}
