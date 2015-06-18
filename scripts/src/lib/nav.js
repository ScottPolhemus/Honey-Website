var $ = require('jquery')
require('../vendor/jquery.propascroll.js');

var debounce = require('throttle-debounce').debounce;


var Velocity = require('velocity')

var HoneyNav = function() {
  this.el = document.querySelector('.indicators')
  this.container = document.querySelector('main')
  this.footer = document.querySelector('footer.bottom')
  
  this.updateItems()
  this.updateMap()
  this.updateActive()

  this.easing = [.55, .1, .25, .95]

  $(window)
    .on('resize', function() {
      this.updateMap()
      this.updateActive()
    }.bind(this))
    .on('scroll', this.updateActive.bind(this))

  this.$items.find('a').add('.home-link, .scroll-link, .section-links a')
    .on('click', this.clickNavLink.bind(this))

  $(window).on('keydown', function(event) {
    if(this.sm) { return }

    if(event.which === 40) {
      this.pageDown()
    } else if(event.which === 38) {
      this.pageUp()
    } else {
      return
    }

    event.preventDefault()
  }.bind(this))

  this.scrolling = false

  $(window).on('scrolldown', debounce( 100, true, function(event) {
    if(Site.isBig() && !this.scrolling && $('.page-section.active').first().outerHeight() <= window.innerHeight) {
      this.pageDown()

      $(window).off('mousewheel').on('mousewheel', function(e) {
        e.preventDefault();
      })
    }
  }.bind(this) ) )

  $(window).on('scrollup', debounce( 100, true, function(event) {
    if(Site.isBig() && !this.scrolling && $('.page-section.active').first().outerHeight() <= window.innerHeight) {
      this.pageUp()

      $(window).off('mousewheel').on('mousewheel', function(e) {
        e.preventDefault();
      })
    }
  }.bind(this) ) )

  $(window).on('mousewheel', this.mouseWheel.bind(this))

  $(window).on('scrollstop', debounce( 100, true, function() {
    if(Site.isBig() && !this.scrolling) {
      console.log('yo')

      var $active = $('.page-section.active').first()
      var top = $active.offset().top
      var bottom = top + $active.outerHeight()

      var scrollTop = window.scrollY
      var scrollBottom = scrollTop + window.innerHeight

      if((scrollTop < top || scrollBottom > bottom)) {
        this.scrollTo($('.page-section.active').first()[0])
      }
    }
  }.bind(this) ) )
}

HoneyNav.prototype = {
  updateItems: function() {
    this.items = {}
    this.targets = {}

    var itemElements = this.el.querySelectorAll('li')
    var targetElements = []

    for(var i = 0; i < itemElements.length; i++) {
      var item = itemElements[i]
      var href = item.querySelector('a').getAttribute('href')

      if(href.charAt(0) !== '#') { continue }

      var target = document.querySelector(href)
      var id = href.substr(1)

      this.items[id] = item
      this.targets[id] = target

      targetElements.push(target)
    }

    this.$items = $(itemElements)
    this.$targets = $(targetElements).add(this.footer)
  },

  updateMap: function() {
    var map = {}
    var scrollY = window.scrollY

    for(var t in this.targets) {
      var el = this.targets[t]

      var offset = $(el).offset()
      var top = offset.top

      map[top] = map[top] || []

      map[top].push({
        id: t,
        el: el,
        top: top,
        bottom: top + $(el).height()
      })
    }

    this.map = map

    this.sm = (window.innerHeight < 500) || (window.innerWidth < 700)
  },

  updateActive: function(event) {
    if(this.sm) { return }

    var scrollY = window.scrollY + (window.innerHeight / 2)
    var scrollBottom = scrollY
    var active = []
    var activeItems = []

    for(var sectionY in this.map) {

      if(sectionY < scrollBottom) {
        var sections = this.map[sectionY]

        for(var i = 0; i < sections.length; i++) {
          var section = sections[i]
          var item = this.items[section.id]

          if(section.bottom > scrollY) {
            active.push(section.el)
            activeItems.push(item)
          }
        }
      }

    }

    var atHome = (window.scrollY < window.innerHeight)
    var pastMulti = (window.scrollY > this.targets.feed.offsetTop + window.innerHeight)

    $('body').toggleClass('at-home', atHome)
    $('body').toggleClass('past-multi', pastMulti)

    var atFooter = (window.scrollY + window.innerHeight >= this.footer.offsetTop + (this.footer.offsetHeight / 2))

    if(atFooter) {
      active = []
      activeItems = []
    }

    $(active).add(activeItems).addClass('active')

    this.$targets.not(active).removeClass('active')
    this.$items.not(activeItems).removeClass('active')
  },

  clickNavLink: function(event) {
    event.preventDefault()

    var item = event.currentTarget
    var targetID = item.getAttribute('href').substr(1)
    var target = this.targets[targetID] || $('#'+targetID)[0]

    this.scrollTo(target)
  },

  scrollTo: function(el) {
    this.stopScroll()

    this.scrolling = true

    Velocity(el, 'scroll', {
      duration: 600,
      easing: this.easing,
      offset: function() {
        var offset = (window.innerHeight - el.offsetHeight) * -1

        if(offset >= window.innerHeight || (el.offsetHeight > window.innerHeight)) {
          return 0
        } else {
          return offset
        }
      }(),
      complete: function() {
        this.scrolling = false

        $(window).off('mousewheel').on('mousewheel', this.mouseWheel.bind(this))
      }.bind(this)
    })
  },

  stopScroll: function() {
    this.$targets.velocity('stop')
    this.scrolling = false
  },

  mouseWheel: function() {
    if(this.scrolling) {
      this.stopScroll()
    }
  },

  pageDown: function() {
    var $activeItem = this.$items.filter('.active').last();
    var $next = $();

    if($activeItem.length) {
      $next = $activeItem.next('li')

      if(!$next.length) {
        $next = $activeItem.parents('li').next('li')
      }
    }

    if($next.length) {
      $next.find('a').first().trigger('click')
    } else {
      this.scrollTo(this.footer)
    }
  },

  pageUp: function() {
    var $activeItem = this.$items.filter('.active').last()
    var $prev = $()

    if(!$activeItem.length) {
      if(window.scrollY > window.innerHeight) {
        $prev = this.$items.last()
      } else {
        return false
      }
    } else {
      $prev = $activeItem.prev('li')

      if(!$prev.length) {
        $prev = $activeItem.parents('li').prev('li')
      }
    }

    if($prev.find('li').length) {
      $prev = $prev.find('li').last()
    }

    if($prev.length) {
      $prev.find('a').first().trigger('click')
    }
  }
}

module.exports = HoneyNav