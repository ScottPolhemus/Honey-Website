var $ = require('jquery')
var Velocity = require('velocity')

var Cycle = function(el) {
  this.$el = $(el)
  this.$items = this.$el.find('.cycle-item')

  this.index = this.$items.filter('.active').index()

  this.easing = [.55, .1, .25, .95]

  $(window).on('resize', function() {
    var maxH = 0;

    for(var i = 0; i < this.$items.length; i++) {
      maxH = Math.max(this.$items.eq(i).height(), maxH)
    }
    
    this.$el.css('min-height', maxH);
  }.bind(this))
}

Cycle.prototype = {
  go: function(i) {
    var $active = this.$items.filter('.active')
    var $next = this.$items.eq(i)

    $next.addClass('active')
    $active.removeClass('active')

    // $active.addClass('out')
    // $next.addClass('in')

    // Velocity($active[0], {
    //   opacity: [0, 1]
    // }, {
    //   display: 'none',
    //   duration: 300,
    //   complete: function(el) {
    //     this.$items.removeClass('in out')

    //     $next.addClass('active')
    //     $active.removeClass('active')
    //   }.bind(this),
    //   easing: this.easing
    // })

    // Velocity($next[0], {
    //   opacity: [1, 0]
    // }, {
    //   duration: 300,
    //   easing: this.easing
    // })

    // Velocity(this.$el[0], {
    //   height: [$next.height(), $active.height()]
    // }, {
    //   duration: 300,
    //   easing: this.easing,
    //   complete: function(el) {
    //     $(el).attr('style', '')
    //   }
    // })

    this.index = i
  }
}

module.exports = Cycle