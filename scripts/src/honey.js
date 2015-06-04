var $ = require('jquery')
var Flickity = require('flickity')

var ScrollNav = require('./lib/scroll-nav')

var Site = function() {
  this.$header = $('header.top-nav')

  this.nav = new ScrollNav()

  this.$body = $('body')

  $(window).on('scroll', this.checkHeader.bind(this))

  var $sliderIcons = $('.profile-slider-icons');

  new Flickity($sliderIcons[0], {
    cellSelector: '.slider-item',
    pageDots: false,
    wrapAround: true
  })

  var $sliderPhotos = $('.dietitian-slider-photos');

  new Flickity($sliderPhotos[0], {
    cellSelector: '.slider-item',
    pageDots: false,
    prevNextButtons: false,
    contain: true,
    draggable: false
  })
}

Site.prototype = {
  checkHeader: function() {
    this.$body.toggleClass('at-top', window.scrollY <= 50)
  }
}

new Site()