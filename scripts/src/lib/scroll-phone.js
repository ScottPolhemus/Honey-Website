var $ = require('jquery')

var HoneyPhone = function() {
  this.start = 0

  this.$el = $('.phone-frame-wrapper .phone-frame')
  this.$target = $('.section-screenshot .phone-frame').first()

  $(window).on('resize', this.resize.bind(this))
  $(window).on('scroll', this.scroll.bind(this))
}

HoneyPhone.prototype = {
  resize: function() {
    this.scrollEnd = $('#how-it-works').offset().top
    this.scroll()
  },

  scroll: function() {
    var progress = Math.min((window.scrollY / this.scrollEnd), 1)
    progress = Math.max(progress, 0)

    this.progress = progress

    this.update()
  },

  update: function() {
    var startY = -140;
    var endY = (window.innerHeight - 60) / -2
    var deltaY = endY - startY

    var distanceY = startY + (deltaY * this.progress)
    var offsetY = -50 * this.progress

    var startX = this.$el.width() / 2
    var endX = (window.innerWidth / 2) - (window.innerWidth / 3)

    var distanceX = startX + (endX * this.progress)
    
    var deltaScale = 1 - (200 / 350)
    var scale = 1 - (deltaScale * this.progress)

    this.$el.css('transform', 'translateX('+distanceX+'px) translateY('+distanceY+'px) scale('+scale+') translateY('+offsetY+'%)')
  }
}

module.exports = HoneyPhone