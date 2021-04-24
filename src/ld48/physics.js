import { SHAPES } from './constants'

const USE_CIRCLE_APPROXIMATION = false

export default class Physics {
  
  //----------------------------------------------------------------
  
  /*  Checks if objA is touching objB.
      If true, returns the corrected coordinates for objA and objB, in form:
        { a: { x, y },
          b: { x, y } }
      If false, returns null.
   */
  static checkCollision (objA, objB) {
    if (!objA || !objB || objA === objB) return null
    
    // Circle + Circle collision
    if (objA.shape === SHAPES.CIRCLE && objB.shape === SHAPES.CIRCLE) {
      return Physics.checkCollision_circleCircle(objA, objB)
    }
    
    // Polygon + Polygon collision. (Squares are polygons, of course.)
    else if (
      (objA.shape === SHAPES.SQUARE || objA.shape === SHAPES.POLYGON) &&
      (objB.shape === SHAPES.SQUARE || objB.shape === SHAPES.POLYGON)
    ) {
      return Physics.checkCollision_polygonPolygon(objA, objB)
    }
    
    // Circle + Polygon collision.
    else if (
      objA.shape === SHAPES.CIRCLE &&
      (objB.shape === SHAPES.SQUARE || objB.shape === SHAPES.POLYGON)
    ) {
      if (USE_CIRCLE_APPROXIMATION) return Physics.checkCollision_polygonPolygon(objA, objB)
      
      return Physics.checkCollision_circlePolygon(objA, objB)
    }
    
    // Polygon + Circle collision
    // It's the reverse of the previous scenario.
    else if (
      (objA.shape === SHAPES.SQUARE || objA.shape === SHAPES.POLYGON) &&
      objB.shape === SHAPES.CIRCLE
    ) {
      if (USE_CIRCLE_APPROXIMATION) return Physics.checkCollision_polygonPolygon(objA, objB)
      
      let correction = Physics.checkCollision_circlePolygon(objB, objA)
      if (correction) {
        correction = {
          a: correction.b,
          b: correction.a,
        }
      }
      return correction
    }
    
    return null
  }
  //----------------------------------------------------------------
  
  static checkCollision_circleCircle (objA, objB) {
    let fractionA = 0
    let fractionB = 0
    if (!objA.solid || !objB.solid) {
      //If either object isn't solid, there's no collision correction.
    } else if (objA.movable && objB.movable) {
      fractionA = 0.5
      fractionB = 0.5
    } else if (objA.movable) {
      fractionA = 1
    } else if (objB.movable) {
      fractionB = 1
    }
    
    const distX = objB.x - objA.x
    const distY = objB.y - objA.y
    const dist = Math.sqrt(distX * distX + distY * distY)
    const minimumDist = objA.radius + objB.radius
    if (dist < minimumDist) {    
      const angle = Math.atan2(distY, distX)
      const correctDist = minimumDist
      const cosAngle = Math.cos(angle)
      const sinAngle = Math.sin(angle)
      
      const motion = Physics.getPostCollisionMotion(objA, objB)

      return {
        a: {
          x: objA.x - cosAngle * (correctDist - dist) * fractionA,
          y: objA.y - sinAngle * (correctDist - dist) * fractionA,
          moveX: motion && motion.a.moveX,
          moveY: motion && motion.a.moveY,
        },
        b: {
          x: objB.x + cosAngle * (correctDist - dist) * fractionB,
          y: objB.y + sinAngle * (correctDist - dist) * fractionB,
          moveX: motion && motion.b.moveX,
          moveY: motion && motion.b.moveY,
        }
      }
    }
    
    return null
  }
  
  //----------------------------------------------------------------
  
  static checkCollision_polygonPolygon (objA, objB) {
    let fractionA = 0
    let fractionB = 0
    if (!objA.solid || !objB.solid) {
      //If either object isn't solid, there's no collision correction.
    } else if (objA.movable && objB.movable) {
      fractionA = 0.5
      fractionB = 0.5
    } else if (objA.movable) {
      fractionA = 1
    } else if (objB.movable) {
      fractionB = 1
    }
    
    let correction = null
    const verticesA = objA.vertices
    const verticesB = objB.vertices
    const projectionAxes = [...Physics.getShapeNormals(objA), ...Physics.getShapeNormals(objB)]
    for (let i = 0 ; i < projectionAxes.length ; i++) {
      const axis = projectionAxes[i]
      const projectionA = { min: Infinity, max: -Infinity }
      const projectionB = { min: Infinity, max: -Infinity }

      for (let j = 0 ; j < verticesA.length ; j++) {
        const val = Physics.dotProduct(axis, verticesA[j])
        projectionA.min = Math.min(projectionA.min, val)
        projectionA.max = Math.max(projectionA.max, val)
      }
      for (let j = 0 ; j < verticesB.length ; j++) {
        const val = Physics.dotProduct(axis, verticesB[j])
        projectionB.min = Math.min(projectionB.min, val)
        projectionB.max = Math.max(projectionB.max, val)
      }

      const overlap = Math.max(0, Math.min(projectionA.max, projectionB.max) - Math.max(projectionA.min, projectionB.min))
      if (!correction || overlap < correction.magnitude) {
        const sign = Math.sign((projectionB.min + projectionB.max) - (projectionA.min + projectionA.max))
        correction = {
          magnitude: overlap,
          x: axis.x * overlap * sign,
          y: axis.y * overlap * sign,
        }
      }
    }

    if (correction && correction.magnitude > 0) {
      return {
        a: {
          x: objA.x - correction.x * fractionA,
          y: objA.y - correction.y * fractionA,
        },
        b: {
          x: objB.x + correction.x * fractionB,
          y: objB.y + correction.y * fractionB,
        }
      }
    }
    
    return null
  }
  
  //----------------------------------------------------------------
  
  static checkCollision_circlePolygon (objA, objB) {
    let fractionA = 0
    let fractionB = 0
    if (!objA.solid || !objB.solid) {
      //If either object isn't solid, there's no collision correction.
    } else if (objA.movable && objB.movable) {
      fractionA = 0.5
      fractionB = 0.5
    } else if (objA.movable) {
      fractionA = 1
    } else if (objB.movable) {
      fractionB = 1
    }
    
    const distX = objB.x - objA.x
    const distY = objB.y - objA.y
    const dist = Math.sqrt(distX * distX + distY * distY)
    const angle = Math.atan2(distY, distX)
    const centreToCentreAxis = (dist !== 0)
      ? { x: distX / dist, y: distY / dist }
      : { x: 0, y: 0 }

    let correction = null
    const verticesB = objB.vertices
    const projectionAxes = [centreToCentreAxis, ...Physics.getShapeNormals(objB)]
    for (let i = 0 ; i < projectionAxes.length ; i++) {
      const axis = projectionAxes[i]
      const scalarA = Physics.dotProduct(axis, { x: objA.x, y: objA.y })
      const projectionA = { min: scalarA - objA.radius, max: scalarA + objA.radius }
      const projectionB = { min: Infinity, max: -Infinity }
      
      for (let j = 0 ; j < verticesB.length ; j++) {
        const val = Physics.dotProduct(axis, verticesB[j])
        projectionB.min = Math.min(projectionB.min, val)
        projectionB.max = Math.max(projectionB.max, val)
      }

      const overlap = Math.max(0, Math.min(projectionA.max, projectionB.max) - Math.max(projectionA.min, projectionB.min))
      if (!correction || overlap < correction.magnitude) {
        const sign = Math.sign((projectionB.min + projectionB.max) - (projectionA.min + projectionA.max))
        correction = {
          magnitude: overlap,
          x: axis.x * overlap * sign,
          y: axis.y * overlap * sign,
        }
      }
    }

    if (correction && correction.magnitude > 0) {
      return {
        a: {
          x: objA.x - correction.x * fractionA,
          y: objA.y - correction.y * fractionA,
        },
        b: {
          x: objB.x + correction.x * fractionB,
          y: objB.y + correction.y * fractionB,
        }
      }
    }
  }
  
  //----------------------------------------------------------------
  
  /*  Gets the NORMALISED normals for each edge of the object's shape. Assumes the object has the 'vertices' property.
   */
  static getShapeNormals (obj) {
    const vertices = obj.vertices
    if (!vertices) return null
    if (vertices.length < 2) return []  //Look, you need to have at least three vertices to be a shape.
    
    //First, calculate the edges connecting each vertice.
    //--------------------------------
    const edges = []
    for (let i = 0 ; i < vertices.length ; i++) {
      const p1 = vertices[i]
      const p2 = vertices[(i+1) % vertices.length]
      edges.push({
        x: p2.x - p1.x,
        y: p2.y - p1.y,
      })
    }
    //--------------------------------
    
    //Calculate the NORMALISED normals for each edge.
    //--------------------------------
    return edges.map((edge) => {
      const dist = Math.sqrt(edge.x * edge.x + edge.y * edge.y)
      if (dist === 0) return { x: 0, y: 0 }
      return {
        x: -edge.y / dist,
        y: edge.x / dist,
      }
    })
    //--------------------------------
  }

  //----------------------------------------------------------------

  static getPostCollisionMotion (objA, objB) {
    if (!objA || !objB) return null
    
    if (
      !objA.movable || !objA.solid || objA.mass === 0
      || !objB.movable || !objB.solid || objB.mass === 0
      || (objA.mass + objB.mass) === 0
    ) return null
    
    // TODO: change movementSpeed to pushSpeed and moveSpeed
    
    const collisionAngle = Math.atan2(objB.y - objA.y, objB.x - objA.x)
    const ANGLE_90 = Math.PI / 2
    const totalMass = objA.mass + objB.mass
    const aSpd = objA.movementSpeed
    const bSpd = objB.movementSpeed
    const aAng = objA.movementAngle
    const bAng = objB.movementAngle
    const aMass = objA.mass
    const bMass = objB.mass
    
    const aGroup =
      ( aSpd * Math.cos(aAng - collisionAngle) * (aMass - bMass)
        + 2 * bMass * bSpd * Math.cos(bAng - collisionAngle)
      ) / totalMass
    const bGroup =
      ( bSpd * Math.cos(bAng - collisionAngle) * (bMass - aMass)
        + 2 * aMass * aSpd * Math.cos(aAng - collisionAngle)
      ) / totalMass
    
    const objA_moveX =
      aGroup * Math.cos(collisionAngle)
      + aSpd * Math.sin(aAng - collisionAngle) * Math.cos(collisionAngle + ANGLE_90)
    const objA_moveY =
      aGroup * Math.sin(collisionAngle)
      + aSpd * Math.sin(aAng - collisionAngle) * Math.sin(collisionAngle + ANGLE_90)
    const objB_moveX =
      bGroup * Math.cos(collisionAngle)
      + bSpd * Math.sin(bAng - collisionAngle) * Math.cos(collisionAngle + ANGLE_90)
    const objB_moveY =
      bGroup * Math.sin(collisionAngle)
      + bSpd * Math.sin(bAng - collisionAngle) * Math.sin(collisionAngle + ANGLE_90)
    
    return {
      a: {
        moveX: objA_moveX,
        moveY: objA_moveY,
      },
      b: {
        moveX: objB_moveX,
        moveY: objB_moveY,
      },
    }
  }
  
  //----------------------------------------------------------------
  
  static dotProduct (vectorA, vectorB) {
    if (!vectorA || !vectorB) return null
    return vectorA.x * vectorB.x + vectorA.y * vectorB.y
  }

  //----------------------------------------------------------------

}