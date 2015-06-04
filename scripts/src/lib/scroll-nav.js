var $ = require('jquery')
require('jquery-mousewheel')($)

var Velocity = require('velocity')

var ScrollNav = function() {
  this.el = document.querySelector('.indicators')
  this.container = document.querySelector('main')
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
  this.$targets = $(targetElements).add('#home')

  this.updateMap()
  this.updateActive()

  document.addEventListener('resize', this.updateMap.bind(this))
  document.addEventListener('scroll', this.updateActive.bind(this))

  this.$items.find('a').add('.home-link, .scroll-link, .section-links a')
    .on('click', this.clickNavLink.bind(this))

  $(window).on('keydown', function(event) {
    if(event.which === 40) {
      this.pageDown()
    } else if(event.which === 38) {
      this.pageUp()
    } else {
      return
    }

    event.preventDefault()
  }.bind(this))
}

ScrollNav.prototype = {
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
  },

  updateActive: function(event) {
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

    $(active).add(activeItems).addClass('active')

    this.$targets.not(active).removeClass('active')
    this.$items.not(activeItems).removeClass('active')

    $('body').toggleClass('at-home', !$(active).length && scrollY < window.innerHeight)
  },

  clickNavLink: function(event) {
    event.preventDefault()

    var item = event.currentTarget
    var targetID = item.getAttribute('href').substr(1)
    var target = this.targets[targetID] || $('#'+targetID)[0]

    this.scrollTo(target)
  },

  scrollTo: function(el) {
    this.$targets.velocity('stop')

    Velocity(el, 'scroll', {
      duration: 500
    })
  },

  pageDown: function() {
    var $activeItem = this.$items.filter('.active').last();
    var $next = $();

    if(!$activeItem.length) {
      $next = this.$items.first()
    } else {
      $next = $activeItem.next('li')

      if(!$next.length) {
        $next = $activeItem.parents('li').next('li')
      }
    }

    if($next.length) {
      $next.find('a').first().trigger('click')
    }
  },

  pageUp: function() {
    var $activeItem = this.$items.filter('.active').last()
    var $prev = $()

    if(!$activeItem.length) {
      return false
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
    } else {
      $('.home-link').trigger('click')
    }
  }
}

module.exports = ScrollNav