var $ = require('jquery')

var HoneyPhone = function() {
  this.$el = $('.phone-frame-wrapper .phone-frame')
  this.$target = $('.section-screenshot .phone-frame').first()

  $(window).on('resize', this.resize.bind(this))
  $(window).on('scroll', this.update.bind(this))

  this.render = this.draw.bind(this)
  
  requestAnimationFrame(this.render)
}

HoneyPhone.prototype = {
  resize: function() {
    this.scrollEnd = $('#how-it-works').offset().top

    // X goes from 50% width to the distance to right-third position
    this.startX = this.$el.width() / 2
    this.endX = (window.innerWidth / 2) - (window.innerWidth / 3)

    // Y goes from home position to center of page
    this.startY = -140
    this.endY = (window.innerHeight - 60) / -2
    this.deltaY = this.endY - this.startY

    // Scale changes from big to small
    this.deltaScale = 1 - (200 / 350)

    this.update()
  },

  update: function() {
    // Get progress between zero and one
    this.progress = Math.max(Math.min((window.scrollY / this.scrollEnd), 1), 0)
  },

  draw: function() {
    requestAnimationFrame(this.render)

    // Get transform values for current position
    var distanceX = this.startX + (this.endX * this.progress)
    var distanceY = this.startY + (this.deltaY * this.progress)
    var scale = 1 - (this.deltaScale * this.progress)
    var offsetY = -50 * this.progress

    // Build the transform string
    this.transform = 'translateX('+distanceX+'px) translateY('+distanceY+'px) scale('+scale+') translateY('+offsetY+'%)'

    this.$el.css('transform', this.transform)
  }
}

module.exports = HoneyPhone