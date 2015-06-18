var $ = require('jquery')
var Velocity = require('velocity')

var HoneyCycle = function(el) {
  this.$el = $(el)
  this.$items = this.$el.find('.cycle-item')

  this.index = this.$items.filter('.active').index()

  this.easing = [.55, .1, .25, .95]

  $(window).on('resize', function() {
    var maxH = 0

    for(var i = 0; i < this.$items.length; i++) {
      maxH = Math.max(this.$items.eq(i).height(), maxH)
    }
    
    this.$el.css('min-height', maxH)
  }.bind(this))
}

HoneyCycle.prototype = {
  go: function(i) {
    this.index = i
    
    var $active = this.$items.filter('.active')
    var $next = this.$items.eq(i)

    if(!$next.is($active)) {
      $active.removeClass('active')
      $next.addClass('active')
    }
  }
}

module.exports = HoneyCycle