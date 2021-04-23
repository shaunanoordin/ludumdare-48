export default class ImageAsset {
  constructor (url) {
    this.url = url
    this.img = null
    this.loaded = false
    this.img = new Image()
    this.img.onload = function() {
      this.loaded = true
    }.bind(this)
    this.img.src = this.url
  }
}
