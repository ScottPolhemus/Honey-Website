var $ = require('jquery')
var Flickity = require('flickity')
require('flickity-imagesloaded')

var HoneyNav = require('./lib/nav')
var HoneyPhone = require('./lib/phone')
var HoneyCycle = require('./lib/cycle')
var HoneySize = require('./lib/size')

var HoneySite = function() {
  this.loadImages()

  this.$html = $('html')
  this.$body = $('body')
  this.nav = new HoneyNav()
  this.phone = new HoneyPhone()

  $(window).on('scroll', this.checkHeader.bind(this))

  var $sliderIcons = $('.profile-slider-icons');

  var biteSlider = new Flickity($sliderIcons[0], {
    cellSelector: '.slider-item',
    pageDots: false,
    wrapAround: true,
    imagesLoaded: true
  })

  $sliderIcons.find('.slider-item').on('click', function() {
    biteSlider.select($(this).index())
  })

  var $biteCaptions = $sliderIcons.next('.cycle-captions')

  var biteCycle = new HoneyCycle($sliderIcons.next('.cycle-captions'))

  $sliderIcons.on('cellSelect', function() {
    var i = biteSlider.selectedIndex

    biteCycle.go(i)
  })

  var $sliderPhotos = $('.dietitian-slider-photos');

  var dietitianSlider = new Flickity($sliderPhotos[0], {
    cellSelector: '.slider-item',
    pageDots: false,
    prevNextButtons: false,
    contain: true,
    draggable: false,
    imagesLoaded: true
  })

  var dietitianCycle = new HoneyCycle($sliderPhotos.next('.cycle-captions'));

  $sliderPhotos.find('.slider-item').on('click', function() {
    dietitianSlider.select($(this).index())
  })

  $sliderPhotos.on('cellSelect', function() {
    var i = dietitianSlider.selectedIndex

    dietitianCycle.go(i)
  })

  var $cycleShuffle = $('.cycle-shuffle')

  var shuffleCycle = new HoneyCycle($cycleShuffle)

  $cycleShuffle.next('.cycle-shuffle-button').on('click', function() {
    var i = shuffleCycle.index + 1

    i = i >= shuffleCycle.$items.length ? 0 : i

    shuffleCycle.go(i)
  })

  var $featureContent = $('.features-content')
  var $featureItems = $('.features-content-item')
  var $featureImages = $('.features-phone-screenshot')

  $featureItems.on('click', function(event) {
    if(HoneySize.isBig()) {
      var $item = $(event.currentTarget);
      
      $item.addClass('active').siblings().removeClass('active')
      $featureImages.eq($item.index()).addClass('active').siblings().removeClass('active')
    }
  }.bind(this))

  var featureSlider = new Flickity($featureContent[0], {
    cellSelector: '.features-content-item',
    pageDots: false,
    prevNextButtons: true,
    wrapAround: true,
    watchCSS: true,
    imagesLoaded: true
  })

  $featureContent.on('cellSelect', function() {
    var i = featureSlider.selectedIndex
    console.log(i)

    $featureItems.eq(i).addClass('active').siblings().removeClass('active')
    $featureImages.eq(i).addClass('active').siblings().removeClass('active')
  })

  $(window).resize()
  $(window).scroll()
}

HoneySite.prototype = {
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

new HoneySite()