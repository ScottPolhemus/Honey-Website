var $ = require('jquery')
var Flickity = require('flickity')
require('flickity-imagesloaded')

var ScrollNav = require('./lib/scroll-nav')

var Site = function() {
  this.loadImages()

  this.$body = $('body')
  this.nav = new ScrollNav()

  $(window).on('scroll', this.checkHeader.bind(this))

  var $sliderIcons = $('.profile-slider-icons');

  new Flickity($sliderIcons[0], {
    cellSelector: '.slider-item',
    pageDots: false,
    wrapAround: true
  })

  var $sliderPhotos = $('.dietitian-slider-photos');

  var dietitianSlider = new Flickity($sliderPhotos[0], {
    cellSelector: '.slider-item',
    pageDots: false,
    prevNextButtons: false,
    contain: true,
    draggable: false
  })

  $sliderPhotos.find('.slider-item').on('click', function() {
    dietitianSlider.select($(this).index())
  })

  var $cycleCaptions = $('.cycle-captions')

  $sliderPhotos.on('cellSelect', function() {
    var i = dietitianSlider.selectedIndex

    $cycleCaptions.find('.cycle-item').eq(i).addClass('active').siblings().removeClass('active')
  })

  var $cycleShuffle = $('.cycle-shuffle')

  $cycleShuffle.next('.cycle-shuffle-button').on('click', function() {
    var $active = $cycleShuffle.find('.active')
    var $next = $active.next('.cycle-item')

    if(!$next.length) {
      $next = $cycleShuffle.find('.cycle-item').first()
    }

    $next.addClass('active').siblings().removeClass('active')
  })
}

Site.prototype = {
  checkHeader: function() {
    this.$body.toggleClass('at-top', window.scrollY <= 50)
  },

  loadImages: function() {
    var $elementsToLoad = $('[data-bg-src]').not('.bg-loading, .bg-loaded')

    $elementsToLoad.each(function() {

      var $el = $(this)

      var src = $el.attr('data-bg-src')

      $el.addClass('bg-loading')

      var im = new Image()

      $(im).on('load', function() {

        $el.css('background-image', 'url('+src+')').removeClass('bg-loading').addClass('bg-loaded')

      })

      im.src = src

      if(im.complete) {
        $(im).trigger('load')
      }

    })
  }
}

new Site()