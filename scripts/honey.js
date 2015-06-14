require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * Flickity imagesLoaded v1.0.0
 * enables imagesLoaded option for Flickity
 */

/*jshint browser: true, strict: true, undef: true, unused: true */

( function( window, factory ) {
  /*global define: false, module: false, require: false */
  'use strict';
  // universal module definition

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
      'flickity/js/index',
      'imagesloaded/imagesloaded'
    ], function( Flickity, imagesLoaded ) {
      return factory( window, Flickity, imagesLoaded );
    });
  } else if ( typeof exports == 'object' ) {
    // CommonJS
    module.exports = factory(
      window,
      require('flickity'),
      require('imagesloaded')
    );
  } else {
    // browser global
    window.Flickity = factory(
      window,
      window.Flickity,
      window.imagesLoaded
    );
  }

}( window, function factory( window, Flickity, imagesLoaded ) {
'use strict';

Flickity.createMethods.push('_createImagesLoaded');

Flickity.prototype._createImagesLoaded = function() {
  this.on( 'activate', this.imagesLoaded );
};

Flickity.prototype.imagesLoaded = function() {
  if ( !this.options.imagesLoaded ) {
    return;
  }
  var _this = this;
  function onImagesLoadedProgress( instance, image ) {
    var cell = _this.getParentCell( image.img );
    _this.cellSizeChange( cell && cell.element );
  }
  imagesLoaded( this.slider ).on( 'progress', onImagesLoadedProgress );
};

return Flickity;

}));

},{"flickity":10,"imagesloaded":2}],2:[function(require,module,exports){
/*!
 * imagesLoaded v3.1.8
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

( function( window, factory ) { 'use strict';
  // universal module definition

  /*global define: false, module: false, require: false */

  if ( typeof define === 'function' && define.amd ) {
    // AMD
    define( [
      'eventEmitter/EventEmitter',
      'eventie/eventie'
    ], function( EventEmitter, eventie ) {
      return factory( window, EventEmitter, eventie );
    });
  } else if ( typeof exports === 'object' ) {
    // CommonJS
    module.exports = factory(
      window,
      require('wolfy87-eventemitter'),
      require('eventie')
    );
  } else {
    // browser global
    window.imagesLoaded = factory(
      window,
      window.EventEmitter,
      window.eventie
    );
  }

})( window,

// --------------------------  factory -------------------------- //

function factory( window, EventEmitter, eventie ) {

'use strict';

var $ = window.jQuery;
var console = window.console;
var hasConsole = typeof console !== 'undefined';

// -------------------------- helpers -------------------------- //

// extend objects
function extend( a, b ) {
  for ( var prop in b ) {
    a[ prop ] = b[ prop ];
  }
  return a;
}

var objToString = Object.prototype.toString;
function isArray( obj ) {
  return objToString.call( obj ) === '[object Array]';
}

// turn element or nodeList into an array
function makeArray( obj ) {
  var ary = [];
  if ( isArray( obj ) ) {
    // use object if already an array
    ary = obj;
  } else if ( typeof obj.length === 'number' ) {
    // convert nodeList to array
    for ( var i=0, len = obj.length; i < len; i++ ) {
      ary.push( obj[i] );
    }
  } else {
    // array of single index
    ary.push( obj );
  }
  return ary;
}

  // -------------------------- imagesLoaded -------------------------- //

  /**
   * @param {Array, Element, NodeList, String} elem
   * @param {Object or Function} options - if function, use as callback
   * @param {Function} onAlways - callback function
   */
  function ImagesLoaded( elem, options, onAlways ) {
    // coerce ImagesLoaded() without new, to be new ImagesLoaded()
    if ( !( this instanceof ImagesLoaded ) ) {
      return new ImagesLoaded( elem, options );
    }
    // use elem as selector string
    if ( typeof elem === 'string' ) {
      elem = document.querySelectorAll( elem );
    }

    this.elements = makeArray( elem );
    this.options = extend( {}, this.options );

    if ( typeof options === 'function' ) {
      onAlways = options;
    } else {
      extend( this.options, options );
    }

    if ( onAlways ) {
      this.on( 'always', onAlways );
    }

    this.getImages();

    if ( $ ) {
      // add jQuery Deferred object
      this.jqDeferred = new $.Deferred();
    }

    // HACK check async to allow time to bind listeners
    var _this = this;
    setTimeout( function() {
      _this.check();
    });
  }

  ImagesLoaded.prototype = new EventEmitter();

  ImagesLoaded.prototype.options = {};

  ImagesLoaded.prototype.getImages = function() {
    this.images = [];

    // filter & find items if we have an item selector
    for ( var i=0, len = this.elements.length; i < len; i++ ) {
      var elem = this.elements[i];
      // filter siblings
      if ( elem.nodeName === 'IMG' ) {
        this.addImage( elem );
      }
      // find children
      // no non-element nodes, #143
      var nodeType = elem.nodeType;
      if ( !nodeType || !( nodeType === 1 || nodeType === 9 || nodeType === 11 ) ) {
        continue;
      }
      var childElems = elem.querySelectorAll('img');
      // concat childElems to filterFound array
      for ( var j=0, jLen = childElems.length; j < jLen; j++ ) {
        var img = childElems[j];
        this.addImage( img );
      }
    }
  };

  /**
   * @param {Image} img
   */
  ImagesLoaded.prototype.addImage = function( img ) {
    var loadingImage = new LoadingImage( img );
    this.images.push( loadingImage );
  };

  ImagesLoaded.prototype.check = function() {
    var _this = this;
    var checkedCount = 0;
    var length = this.images.length;
    this.hasAnyBroken = false;
    // complete if no images
    if ( !length ) {
      this.complete();
      return;
    }

    function onConfirm( image, message ) {
      if ( _this.options.debug && hasConsole ) {
        console.log( 'confirm', image, message );
      }

      _this.progress( image );
      checkedCount++;
      if ( checkedCount === length ) {
        _this.complete();
      }
      return true; // bind once
    }

    for ( var i=0; i < length; i++ ) {
      var loadingImage = this.images[i];
      loadingImage.on( 'confirm', onConfirm );
      loadingImage.check();
    }
  };

  ImagesLoaded.prototype.progress = function( image ) {
    this.hasAnyBroken = this.hasAnyBroken || !image.isLoaded;
    // HACK - Chrome triggers event before object properties have changed. #83
    var _this = this;
    setTimeout( function() {
      _this.emit( 'progress', _this, image );
      if ( _this.jqDeferred && _this.jqDeferred.notify ) {
        _this.jqDeferred.notify( _this, image );
      }
    });
  };

  ImagesLoaded.prototype.complete = function() {
    var eventName = this.hasAnyBroken ? 'fail' : 'done';
    this.isComplete = true;
    var _this = this;
    // HACK - another setTimeout so that confirm happens after progress
    setTimeout( function() {
      _this.emit( eventName, _this );
      _this.emit( 'always', _this );
      if ( _this.jqDeferred ) {
        var jqMethod = _this.hasAnyBroken ? 'reject' : 'resolve';
        _this.jqDeferred[ jqMethod ]( _this );
      }
    });
  };

  // -------------------------- jquery -------------------------- //

  if ( $ ) {
    $.fn.imagesLoaded = function( options, callback ) {
      var instance = new ImagesLoaded( this, options, callback );
      return instance.jqDeferred.promise( $(this) );
    };
  }


  // --------------------------  -------------------------- //

  function LoadingImage( img ) {
    this.img = img;
  }

  LoadingImage.prototype = new EventEmitter();

  LoadingImage.prototype.check = function() {
    // first check cached any previous images that have same src
    var resource = cache[ this.img.src ] || new Resource( this.img.src );
    if ( resource.isConfirmed ) {
      this.confirm( resource.isLoaded, 'cached was confirmed' );
      return;
    }

    // If complete is true and browser supports natural sizes,
    // try to check for image status manually.
    if ( this.img.complete && this.img.naturalWidth !== undefined ) {
      // report based on naturalWidth
      this.confirm( this.img.naturalWidth !== 0, 'naturalWidth' );
      return;
    }

    // If none of the checks above matched, simulate loading on detached element.
    var _this = this;
    resource.on( 'confirm', function( resrc, message ) {
      _this.confirm( resrc.isLoaded, message );
      return true;
    });

    resource.check();
  };

  LoadingImage.prototype.confirm = function( isLoaded, message ) {
    this.isLoaded = isLoaded;
    this.emit( 'confirm', this, message );
  };

  // -------------------------- Resource -------------------------- //

  // Resource checks each src, only once
  // separate class from LoadingImage to prevent memory leaks. See #115

  var cache = {};

  function Resource( src ) {
    this.src = src;
    // add to cache
    cache[ src ] = this;
  }

  Resource.prototype = new EventEmitter();

  Resource.prototype.check = function() {
    // only trigger checking once
    if ( this.isChecked ) {
      return;
    }
    // simulate loading on detached element
    var proxyImage = new Image();
    eventie.bind( proxyImage, 'load', this );
    eventie.bind( proxyImage, 'error', this );
    proxyImage.src = this.src;
    // set flag
    this.isChecked = true;
  };

  // ----- events ----- //

  // trigger specified handler for event type
  Resource.prototype.handleEvent = function( event ) {
    var method = 'on' + event.type;
    if ( this[ method ] ) {
      this[ method ]( event );
    }
  };

  Resource.prototype.onload = function( event ) {
    this.confirm( true, 'onload' );
    this.unbindProxyEvents( event );
  };

  Resource.prototype.onerror = function( event ) {
    this.confirm( false, 'onerror' );
    this.unbindProxyEvents( event );
  };

  // ----- confirm ----- //

  Resource.prototype.confirm = function( isLoaded, message ) {
    this.isConfirmed = true;
    this.isLoaded = isLoaded;
    this.emit( 'confirm', this, message );
  };

  Resource.prototype.unbindProxyEvents = function( event ) {
    eventie.unbind( event.target, 'load', this );
    eventie.unbind( event.target, 'error', this );
  };

  // -----  ----- //

  return ImagesLoaded;

});

},{"eventie":3,"wolfy87-eventemitter":4}],3:[function(require,module,exports){
/*!
 * eventie v1.0.6
 * event binding helper
 *   eventie.bind( elem, 'click', myFn )
 *   eventie.unbind( elem, 'click', myFn )
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true */
/*global define: false, module: false */

( function( window ) {

'use strict';

var docElem = document.documentElement;

var bind = function() {};

function getIEEvent( obj ) {
  var event = window.event;
  // add event.target
  event.target = event.target || event.srcElement || obj;
  return event;
}

if ( docElem.addEventListener ) {
  bind = function( obj, type, fn ) {
    obj.addEventListener( type, fn, false );
  };
} else if ( docElem.attachEvent ) {
  bind = function( obj, type, fn ) {
    obj[ type + fn ] = fn.handleEvent ?
      function() {
        var event = getIEEvent( obj );
        fn.handleEvent.call( fn, event );
      } :
      function() {
        var event = getIEEvent( obj );
        fn.call( obj, event );
      };
    obj.attachEvent( "on" + type, obj[ type + fn ] );
  };
}

var unbind = function() {};

if ( docElem.removeEventListener ) {
  unbind = function( obj, type, fn ) {
    obj.removeEventListener( type, fn, false );
  };
} else if ( docElem.detachEvent ) {
  unbind = function( obj, type, fn ) {
    obj.detachEvent( "on" + type, obj[ type + fn ] );
    try {
      delete obj[ type + fn ];
    } catch ( err ) {
      // can't delete window object properties
      obj[ type + fn ] = undefined;
    }
  };
}

var eventie = {
  bind: bind,
  unbind: unbind
};

// ----- module definition ----- //

if ( typeof define === 'function' && define.amd ) {
  // AMD
  define( eventie );
} else if ( typeof exports === 'object' ) {
  // CommonJS
  module.exports = eventie;
} else {
  // browser global
  window.eventie = eventie;
}

})( window );

},{}],4:[function(require,module,exports){
/*!
 * EventEmitter v4.2.11 - git.io/ee
 * Unlicense - http://unlicense.org/
 * Oliver Caldwell - http://oli.me.uk/
 * @preserve
 */

;(function () {
    'use strict';

    /**
     * Class for managing events.
     * Can be extended to provide event functionality in other classes.
     *
     * @class EventEmitter Manages event registering and emitting.
     */
    function EventEmitter() {}

    // Shortcuts to improve speed and size
    var proto = EventEmitter.prototype;
    var exports = this;
    var originalGlobalValue = exports.EventEmitter;

    /**
     * Finds the index of the listener for the event in its storage array.
     *
     * @param {Function[]} listeners Array of listeners to search through.
     * @param {Function} listener Method to look for.
     * @return {Number} Index of the specified listener, -1 if not found
     * @api private
     */
    function indexOfListener(listeners, listener) {
        var i = listeners.length;
        while (i--) {
            if (listeners[i].listener === listener) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Alias a method while keeping the context correct, to allow for overwriting of target method.
     *
     * @param {String} name The name of the target method.
     * @return {Function} The aliased method
     * @api private
     */
    function alias(name) {
        return function aliasClosure() {
            return this[name].apply(this, arguments);
        };
    }

    /**
     * Returns the listener array for the specified event.
     * Will initialise the event object and listener arrays if required.
     * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
     * Each property in the object response is an array of listener functions.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Function[]|Object} All listener functions for the event.
     */
    proto.getListeners = function getListeners(evt) {
        var events = this._getEvents();
        var response;
        var key;

        // Return a concatenated array of all matching events if
        // the selector is a regular expression.
        if (evt instanceof RegExp) {
            response = {};
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    response[key] = events[key];
                }
            }
        }
        else {
            response = events[evt] || (events[evt] = []);
        }

        return response;
    };

    /**
     * Takes a list of listener objects and flattens it into a list of listener functions.
     *
     * @param {Object[]} listeners Raw listener objects.
     * @return {Function[]} Just the listener functions.
     */
    proto.flattenListeners = function flattenListeners(listeners) {
        var flatListeners = [];
        var i;

        for (i = 0; i < listeners.length; i += 1) {
            flatListeners.push(listeners[i].listener);
        }

        return flatListeners;
    };

    /**
     * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Object} All listener functions for an event in an object.
     */
    proto.getListenersAsObject = function getListenersAsObject(evt) {
        var listeners = this.getListeners(evt);
        var response;

        if (listeners instanceof Array) {
            response = {};
            response[evt] = listeners;
        }

        return response || listeners;
    };

    /**
     * Adds a listener function to the specified event.
     * The listener will not be added if it is a duplicate.
     * If the listener returns true then it will be removed after it is called.
     * If you pass a regular expression as the event name then the listener will be added to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addListener = function addListener(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var listenerIsWrapped = typeof listener === 'object';
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
                listeners[key].push(listenerIsWrapped ? listener : {
                    listener: listener,
                    once: false
                });
            }
        }

        return this;
    };

    /**
     * Alias of addListener
     */
    proto.on = alias('addListener');

    /**
     * Semi-alias of addListener. It will add a listener that will be
     * automatically removed after its first execution.
     *
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addOnceListener = function addOnceListener(evt, listener) {
        return this.addListener(evt, {
            listener: listener,
            once: true
        });
    };

    /**
     * Alias of addOnceListener.
     */
    proto.once = alias('addOnceListener');

    /**
     * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
     * You need to tell it what event names should be matched by a regex.
     *
     * @param {String} evt Name of the event to create.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvent = function defineEvent(evt) {
        this.getListeners(evt);
        return this;
    };

    /**
     * Uses defineEvent to define multiple events.
     *
     * @param {String[]} evts An array of event names to define.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvents = function defineEvents(evts) {
        for (var i = 0; i < evts.length; i += 1) {
            this.defineEvent(evts[i]);
        }
        return this;
    };

    /**
     * Removes a listener function from the specified event.
     * When passed a regular expression as the event name, it will remove the listener from all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to remove the listener from.
     * @param {Function} listener Method to remove from the event.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeListener = function removeListener(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var index;
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                index = indexOfListener(listeners[key], listener);

                if (index !== -1) {
                    listeners[key].splice(index, 1);
                }
            }
        }

        return this;
    };

    /**
     * Alias of removeListener
     */
    proto.off = alias('removeListener');

    /**
     * Adds listeners in bulk using the manipulateListeners method.
     * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
     * You can also pass it a regular expression to add the array of listeners to all events that match it.
     * Yeah, this function does quite a bit. That's probably a bad thing.
     *
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addListeners = function addListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(false, evt, listeners);
    };

    /**
     * Removes listeners in bulk using the manipulateListeners method.
     * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be removed.
     * You can also pass it a regular expression to remove the listeners from all events that match it.
     *
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeListeners = function removeListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(true, evt, listeners);
    };

    /**
     * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
     * The first argument will determine if the listeners are removed (true) or added (false).
     * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be added/removed.
     * You can also pass it a regular expression to manipulate the listeners of all events that match it.
     *
     * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
        var i;
        var value;
        var single = remove ? this.removeListener : this.addListener;
        var multiple = remove ? this.removeListeners : this.addListeners;

        // If evt is an object then pass each of its properties to this method
        if (typeof evt === 'object' && !(evt instanceof RegExp)) {
            for (i in evt) {
                if (evt.hasOwnProperty(i) && (value = evt[i])) {
                    // Pass the single listener straight through to the singular method
                    if (typeof value === 'function') {
                        single.call(this, i, value);
                    }
                    else {
                        // Otherwise pass back to the multiple function
                        multiple.call(this, i, value);
                    }
                }
            }
        }
        else {
            // So evt must be a string
            // And listeners must be an array of listeners
            // Loop over it and pass each one to the multiple method
            i = listeners.length;
            while (i--) {
                single.call(this, evt, listeners[i]);
            }
        }

        return this;
    };

    /**
     * Removes all listeners from a specified event.
     * If you do not specify an event then all listeners will be removed.
     * That means every event will be emptied.
     * You can also pass a regex to remove all events that match it.
     *
     * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeEvent = function removeEvent(evt) {
        var type = typeof evt;
        var events = this._getEvents();
        var key;

        // Remove different things depending on the state of evt
        if (type === 'string') {
            // Remove all listeners for the specified event
            delete events[evt];
        }
        else if (evt instanceof RegExp) {
            // Remove all events matching the regex.
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    delete events[key];
                }
            }
        }
        else {
            // Remove all listeners in all events
            delete this._events;
        }

        return this;
    };

    /**
     * Alias of removeEvent.
     *
     * Added to mirror the node API.
     */
    proto.removeAllListeners = alias('removeEvent');

    /**
     * Emits an event of your choice.
     * When emitted, every listener attached to that event will be executed.
     * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
     * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
     * So they will not arrive within the array on the other side, they will be separate.
     * You can also pass a regular expression to emit to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {Array} [args] Optional array of arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emitEvent = function emitEvent(evt, args) {
        var listeners = this.getListenersAsObject(evt);
        var listener;
        var i;
        var key;
        var response;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                i = listeners[key].length;

                while (i--) {
                    // If the listener returns true then it shall be removed from the event
                    // The function is executed either with a basic call or an apply if there is an args array
                    listener = listeners[key][i];

                    if (listener.once === true) {
                        this.removeListener(evt, listener.listener);
                    }

                    response = listener.listener.apply(this, args || []);

                    if (response === this._getOnceReturnValue()) {
                        this.removeListener(evt, listener.listener);
                    }
                }
            }
        }

        return this;
    };

    /**
     * Alias of emitEvent
     */
    proto.trigger = alias('emitEvent');

    /**
     * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
     * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {...*} Optional additional arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emit = function emit(evt) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this.emitEvent(evt, args);
    };

    /**
     * Sets the current value to check against when executing listeners. If a
     * listeners return value matches the one set here then it will be removed
     * after execution. This value defaults to true.
     *
     * @param {*} value The new value to check for when executing listeners.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.setOnceReturnValue = function setOnceReturnValue(value) {
        this._onceReturnValue = value;
        return this;
    };

    /**
     * Fetches the current value to check against when executing listeners. If
     * the listeners return value matches this one then it should be removed
     * automatically. It will return true by default.
     *
     * @return {*|Boolean} The current value to check for or the default, true.
     * @api private
     */
    proto._getOnceReturnValue = function _getOnceReturnValue() {
        if (this.hasOwnProperty('_onceReturnValue')) {
            return this._onceReturnValue;
        }
        else {
            return true;
        }
    };

    /**
     * Fetches the events object and creates one if required.
     *
     * @return {Object} The events storage object.
     * @api private
     */
    proto._getEvents = function _getEvents() {
        return this._events || (this._events = {});
    };

    /**
     * Reverts the global {@link EventEmitter} to its previous value and returns a reference to this version.
     *
     * @return {Function} Non conflicting EventEmitter class.
     */
    EventEmitter.noConflict = function noConflict() {
        exports.EventEmitter = originalGlobalValue;
        return EventEmitter;
    };

    // Expose the class either via AMD, CommonJS or the global object
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return EventEmitter;
        });
    }
    else if (typeof module === 'object' && module.exports){
        module.exports = EventEmitter;
    }
    else {
        exports.EventEmitter = EventEmitter;
    }
}.call(this));

},{}],5:[function(require,module,exports){
( function( window, factory ) {
  'use strict';
  // universal module definition

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
      './flickity',
      'fizzy-ui-utils/utils'
    ], function( Flickity, utils ) {
      return factory( window, Flickity, utils );
    });
  } else if ( typeof exports == 'object' ) {
    // CommonJS
    module.exports = factory(
      window,
      require('./flickity'),
      require('fizzy-ui-utils')
    );
  } else {
    // browser global
    window.Flickity = window.Flickity || {};
    window.Flickity = factory(
      window,
      window.Flickity,
      window.fizzyUIUtils
    );
  }

}( window, function factory( window, Flickity, utils ) {

'use strict';

// append cells to a document fragment
function getCellsFragment( cells ) {
  var fragment = document.createDocumentFragment();
  for ( var i=0, len = cells.length; i < len; i++ ) {
    var cell = cells[i];
    fragment.appendChild( cell.element );
  }
  return fragment;
}

// -------------------------- add/remove cell prototype -------------------------- //

/**
 * Insert, prepend, or append cells
 * @param {Element, Array, NodeList} elems
 * @param {Integer} index
 */
Flickity.prototype.insert = function( elems, index ) {
  var cells = this._makeCells( elems );
  if ( !cells || !cells.length ) {
    return;
  }
  var len = this.cells.length;
  // default to append
  index = index === undefined ? len : index;
  // add cells with document fragment
  var fragment = getCellsFragment( cells );
  // append to slider
  var isAppend = index == len;
  if ( isAppend ) {
    this.slider.appendChild( fragment );
  } else {
    var insertCellElement = this.cells[ index ].element;
    this.slider.insertBefore( fragment, insertCellElement );
  }
  // add to this.cells
  if ( index === 0 ) {
    // prepend, add to start
    this.cells = cells.concat( this.cells );
  } else if ( isAppend ) {
    // append, add to end
    this.cells = this.cells.concat( cells );
  } else {
    // insert in this.cells
    var endCells = this.cells.splice( index, len - index );
    this.cells = this.cells.concat( cells ).concat( endCells );
  }

  this._sizeCells( cells );

  var selectedIndexDelta = index > this.selectedIndex ? 0 : cells.length;
  this._cellAddedRemoved( index, selectedIndexDelta );
};

Flickity.prototype.append = function( elems ) {
  this.insert( elems, this.cells.length );
};

Flickity.prototype.prepend = function( elems ) {
  this.insert( elems, 0 );
};

/**
 * Remove cells
 * @param {Element, Array, NodeList} elems
 */
Flickity.prototype.remove = function( elems ) {
  var cells = this.getCells( elems );
  var selectedIndexDelta = 0;
  var i, len, cell;
  // calculate selectedIndexDelta, easier if done in seperate loop
  for ( i=0, len = cells.length; i < len; i++ ) {
    cell = cells[i];
    var wasBefore = utils.indexOf( this.cells, cell ) < this.selectedIndex;
    selectedIndexDelta -= wasBefore ? 1 : 0;
  }

  for ( i=0, len = cells.length; i < len; i++ ) {
    cell = cells[i];
    cell.remove();
    // remove item from collection
    utils.removeFrom( this.cells, cell );
  }

  if ( cells.length ) {
    // update stuff
    this._cellAddedRemoved( 0, selectedIndexDelta );
  }
};

// updates when cells are added or removed
Flickity.prototype._cellAddedRemoved = function( changedCellIndex, selectedIndexDelta ) {
  selectedIndexDelta = selectedIndexDelta || 0;
  this.selectedIndex += selectedIndexDelta;
  this.selectedIndex = Math.max( 0, Math.min( this.cells.length - 1, this.selectedIndex ) );

  this.emitEvent( 'cellAddedRemoved', [ changedCellIndex, selectedIndexDelta ] );
  this.cellChange( changedCellIndex );
};

/**
 * logic to be run after a cell's size changes
 * @param {Element} elem - cell's element
 */
Flickity.prototype.cellSizeChange = function( elem ) {
  var cell = this.getCell( elem );
  if ( !cell ) {
    return;
  }
  cell.getSize();

  var index = utils.indexOf( this.cells, cell );
  this.cellChange( index );
};

/**
 * logic any time a cell is changed: added, removed, or size changed
 * @param {Integer} changedCellIndex - index of the changed cell, optional
 */
Flickity.prototype.cellChange = function( changedCellIndex ) {
  // TODO maybe always size all cells unless isSkippingSizing
  // size all cells if necessary
  // if ( !isSkippingSizing ) {
  //   this._sizeCells( this.cells );
  // }

  changedCellIndex = changedCellIndex || 0;

  this._positionCells( changedCellIndex );
  this._getWrapShiftCells();
  this.setGallerySize();
  // position slider
  if ( this.options.freeScroll ) {
    this.positionSlider();
  } else {
    this.positionSliderAtSelected();
    this.select( this.selectedIndex );
  }
};

// -----  ----- //

return Flickity;

}));

},{"./flickity":9,"fizzy-ui-utils":19}],6:[function(require,module,exports){
( function( window, factory ) {
  'use strict';
  // universal module definition

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
      'get-style-property/get-style-property',
      'fizzy-ui-utils/utils'
    ], function( getStyleProperty, utils ) {
      return factory( window, getStyleProperty, utils );
    });
  } else if ( typeof exports == 'object' ) {
    // CommonJS
    module.exports = factory(
      window,
      require('desandro-get-style-property'),
      require('fizzy-ui-utils')
    );
  } else {
    // browser global
    window.Flickity = window.Flickity || {};
    window.Flickity.animatePrototype = factory(
      window,
      window.getStyleProperty,
      window.fizzyUIUtils
    );
  }

}( window, function factory( window, getStyleProperty, utils ) {

'use strict';

// -------------------------- requestAnimationFrame -------------------------- //

// https://gist.github.com/1866474

var lastTime = 0;
var prefixes = 'webkit moz ms o'.split(' ');
// get unprefixed rAF and cAF, if present
var requestAnimationFrame = window.requestAnimationFrame;
var cancelAnimationFrame = window.cancelAnimationFrame;
// loop through vendor prefixes and get prefixed rAF and cAF
var prefix;
for( var i = 0; i < prefixes.length; i++ ) {
  if ( requestAnimationFrame && cancelAnimationFrame ) {
    break;
  }
  prefix = prefixes[i];
  requestAnimationFrame = requestAnimationFrame || window[ prefix + 'RequestAnimationFrame' ];
  cancelAnimationFrame  = cancelAnimationFrame  || window[ prefix + 'CancelAnimationFrame' ] ||
                            window[ prefix + 'CancelRequestAnimationFrame' ];
}

// fallback to setTimeout and clearTimeout if either request/cancel is not supported
if ( !requestAnimationFrame || !cancelAnimationFrame )  {
  requestAnimationFrame = function( callback ) {
    var currTime = new Date().getTime();
    var timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) );
    var id = window.setTimeout( function() {
      callback( currTime + timeToCall );
    }, timeToCall );
    lastTime = currTime + timeToCall;
    return id;
  };

  cancelAnimationFrame = function( id ) {
    window.clearTimeout( id );
  };
}

// -------------------------- animate -------------------------- //

var proto = {};

proto.startAnimation = function() {
  if ( this.isAnimating ) {
    return;
  }

  this.isAnimating = true;
  this.restingFrames = 0;
  this.animate();
};

proto.animate = function() {
  this.applySelectedAttraction();

  var previousX = this.x;

  this.integratePhysics();
  this.positionSlider();
  this.settle( previousX );
  // animate next frame
  if ( this.isAnimating ) {
    var _this = this;
    requestAnimationFrame( function animateFrame() {
      _this.animate();
    });
  }

  /** /
  // log animation frame rate
  var now = new Date();
  if ( this.then ) {
    console.log( ~~( 1000 / (now-this.then)) + 'fps' )
  }
  this.then = now;
  /**/
};


var transformProperty = getStyleProperty('transform');
var is3d = !!getStyleProperty('perspective');

proto.positionSlider = function() {
  var x = this.x;
  // wrap position around
  if ( this.options.wrapAround && this.cells.length > 1 ) {
    x = utils.modulo( x, this.slideableWidth );
    x = x - this.slideableWidth;
    this.shiftWrapCells( x );
  }

  x = x + this.cursorPosition;

  // reverse if right-to-left and using transform
  x = this.options.rightToLeft && transformProperty ? -x : x;

  var value = this.getPositionValue( x );

  if ( transformProperty ) {
    // use 3D tranforms for hardware acceleration on iOS
    // but use 2D when settled, for better font-rendering
    this.slider.style[ transformProperty ] = is3d && this.isAnimating ?
      'translate3d(' + value + ',0,0)' : 'translateX(' + value + ')';
  } else {
    this.slider.style[ this.originSide ] = value;
  }
};

proto.positionSliderAtSelected = function() {
  if ( !this.cells.length ) {
    return;
  }
  var selectedCell = this.cells[ this.selectedIndex ];
  this.x = -selectedCell.target;
  this.positionSlider();
};

proto.getPositionValue = function( position ) {
  if ( this.options.percentPosition ) {
    // percent position, round to 2 digits, like 12.34%
    return ( Math.round( ( position / this.size.innerWidth ) * 10000 ) * 0.01 )+ '%';
  } else {
    // pixel positioning
    return Math.round( position ) + 'px';
  }
};

proto.settle = function( previousX ) {
  // keep track of frames where x hasn't moved
  if ( !this.isPointerDown && Math.round( this.x * 100 ) == Math.round( previousX * 100 ) ) {
    this.restingFrames++;
  }
  // stop animating if resting for 3 or more frames
  if ( this.restingFrames > 2 ) {
    this.isAnimating = false;
    delete this.isFreeScrolling;
    // render position with translateX when settled
    if ( is3d ) {
      this.positionSlider();
    }
    this.dispatchEvent('settle');
  }
};

proto.shiftWrapCells = function( x ) {
  // shift before cells
  var beforeGap = this.cursorPosition + x;
  this._shiftCells( this.beforeShiftCells, beforeGap, -1 );
  // shift after cells
  var afterGap = this.size.innerWidth - ( x + this.slideableWidth + this.cursorPosition );
  this._shiftCells( this.afterShiftCells, afterGap, 1 );
};

proto._shiftCells = function( cells, gap, shift ) {
  for ( var i=0, len = cells.length; i < len; i++ ) {
    var cell = cells[i];
    var cellShift = gap > 0 ? shift : 0;
    cell.wrapShift( cellShift );
    gap -= cell.size.outerWidth;
  }
};

proto._unshiftCells = function( cells ) {
  if ( !cells || !cells.length ) {
    return;
  }
  for ( var i=0, len = cells.length; i < len; i++ ) {
    cells[i].wrapShift( 0 );
  }
};

// -------------------------- physics -------------------------- //

proto.integratePhysics = function() {
  this.velocity += this.accel;
  this.x += this.velocity;
  this.velocity *= this.getFrictionFactor();
  // reset acceleration
  this.accel = 0;
};

proto.applyForce = function( force ) {
  this.accel += force;
};

proto.getFrictionFactor = function() {
  return 1 - this.options[ this.isFreeScrolling ? 'freeScrollFriction' : 'friction' ];
};


proto.getRestingPosition = function() {
  // my thanks to Steven Wittens, who simplified this math greatly
  return this.x + this.velocity / ( 1 - this.getFrictionFactor() );
};


proto.applySelectedAttraction = function() {
  // do not attract if pointer down or no cells
  var len = this.cells.length;
  if ( this.isPointerDown || this.isFreeScrolling || !len ) {
    return;
  }
  var cell = this.cells[ this.selectedIndex ];
  var wrap = this.options.wrapAround && len > 1 ?
    this.slideableWidth * Math.floor( this.selectedIndex / len ) : 0;
  var distance = ( cell.target + wrap ) * -1 - this.x;
  var force = distance * this.options.selectedAttraction;
  this.applyForce( force );
};

return proto;

}));

},{"desandro-get-style-property":15,"fizzy-ui-utils":19}],7:[function(require,module,exports){
( function( window, factory ) {
  'use strict';
  // universal module definition

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
      'get-size/get-size'
    ], function( getSize ) {
      return factory( window, getSize );
    });
  } else if ( typeof exports == 'object' ) {
    // CommonJS
    module.exports = factory(
      window,
      require('get-size')
    );
  } else {
    // browser global
    window.Flickity = window.Flickity || {};
    window.Flickity.Cell = factory(
      window,
      window.getSize
    );
  }

}( window, function factory( window, getSize ) {

'use strict';

function Cell( elem, parent ) {
  this.element = elem;
  this.parent = parent;

  this.create();
}

var isIE8 = 'attachEvent' in window;

Cell.prototype.create = function() {
  this.element.style.position = 'absolute';
  // IE8 prevent child from changing focus http://stackoverflow.com/a/17525223/182183
  if ( isIE8 ) {
    this.element.setAttribute( 'unselectable', 'on' );
  }
  this.x = 0;
  this.shift = 0;
};

Cell.prototype.destroy = function() {
  // reset style
  this.element.style.position = '';
  var side = this.parent.originSide;
  this.element.style[ side ] = '';
};

Cell.prototype.getSize = function() {
  this.size = getSize( this.element );
};

Cell.prototype.setPosition = function( x ) {
  this.x = x;
  this.setDefaultTarget();
  this.renderPosition( x );
};

Cell.prototype.setDefaultTarget = function() {
  var marginProperty = this.parent.originSide == 'left' ? 'marginLeft' : 'marginRight';
  this.target = this.x + this.size[ marginProperty ] +
    this.size.width * this.parent.cellAlign;
};

Cell.prototype.renderPosition = function( x ) {
  // render position of cell with in slider
  var side = this.parent.originSide;
  this.element.style[ side ] = this.parent.getPositionValue( x );
};

/**
 * @param {Integer} factor - 0, 1, or -1
**/
Cell.prototype.wrapShift = function( shift ) {
  this.shift = shift;
  this.renderPosition( this.x + this.parent.slideableWidth * shift );
};

Cell.prototype.remove = function() {
  this.element.parentNode.removeChild( this.element );
};

return Cell;

}));

},{"get-size":20}],8:[function(require,module,exports){
( function( window, factory ) {
  'use strict';
  // universal module definition

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
      'classie/classie',
      'eventie/eventie',
      './flickity',
      'unidragger/unidragger',
      'fizzy-ui-utils/utils'
    ], function( classie, eventie, Flickity, Unidragger, utils ) {
      return factory( window, classie, eventie, Flickity, Unidragger, utils );
    });
  } else if ( typeof exports == 'object' ) {
    // CommonJS
    module.exports = factory(
      window,
      require('desandro-classie'),
      require('eventie'),
      require('./flickity'),
      require('unidragger'),
      require('fizzy-ui-utils')
    );
  } else {
    // browser global
    window.Flickity = window.Flickity || {};
    window.Flickity.dragPrototype = factory(
      window,
      window.classie,
      window.eventie,
      window.Flickity,
      window.Unidragger,
      window.fizzyUIUtils
    );
  }

}( window, function factory( window, classie, eventie, Flickity, Unidragger, utils ) {

'use strict';

// handle IE8 prevent default
function preventDefaultEvent( event ) {
  if ( event.preventDefault ) {
    event.preventDefault();
  } else {
    event.returnValue = false;
  }
}

// ----- defaults ----- //

utils.extend( Flickity.defaults, {
  draggable: true,
  touchVerticalScroll: true
});

// ----- create ----- //

Flickity.createMethods.push('_createDrag');

// -------------------------- drag prototype -------------------------- //

var proto = {};
utils.extend( proto, Unidragger.prototype );

// --------------------------  -------------------------- //

proto._createDrag = function() {
  this.on( 'activate', this.bindDrag );
  this.on( 'uiChange', this._uiChangeDrag );
  this.on( 'childUIPointerDown', this._childUIPointerDownDrag );
  this.on( 'deactivate', this.unbindDrag );
};

proto.bindDrag = function() {
  if ( !this.options.draggable || this.isDragBound ) {
    return;
  }
  classie.add( this.element, 'is-draggable' );
  this.handles = [ this.viewport ];
  this.bindHandles();
  this.isDragBound = true;
};

proto.unbindDrag = function() {
  if ( !this.isDragBound ) {
    return;
  }
  classie.remove( this.element, 'is-draggable' );
  this.unbindHandles();
  delete this.isDragBound;
};

proto._uiChangeDrag = function() {
  delete this.isFreeScrolling;
};

proto._childUIPointerDownDrag = function( event ) {
  preventDefaultEvent( event );
  this.pointerDownFocus( event );
};

// -------------------------- pointer events -------------------------- //

proto.pointerDown = function( event, pointer ) {
  this._dragPointerDown( event, pointer );

  // kludge to blur focused inputs in dragger
  var focused = document.activeElement;
  if ( focused && focused.blur && focused != this.element &&
    // do not blur body for IE9 & 10, #117
    focused != document.body ) {
    focused.blur();
  }
  this.pointerDownFocus( event );
  // stop if it was moving
  this.velocity = 0;
  classie.add( this.viewport, 'is-pointer-down' );
  // bind move and end events
  this._bindPostStartEvents( event );
  this.dispatchEvent( 'pointerDown', event, [ pointer ] );
};

var touchStartEvents = {
  touchstart: true,
  MSPointerDown: true
};

var focusNodes = {
  INPUT: true,
  SELECT: true
};

proto.pointerDownFocus = function( event ) {
  // focus element, if not touch, and its not an input or select
  if ( this.options.accessibility && !touchStartEvents[ event.type ] &&
      !focusNodes[ event.target.nodeName ] ) {
    this.element.focus();
  }
};

// ----- move ----- //

proto.pointerMove = function( event, pointer ) {
  var moveVector = this._dragPointerMove( event, pointer );
  this.touchVerticalScrollMove( event, pointer, moveVector );
  this._dragMove( event, pointer, moveVector );
  this.dispatchEvent( 'pointerMove', event, [ pointer, moveVector ] );
};

proto.hasDragStarted = function( moveVector ) {
  return !this.isTouchScrolling && Math.abs( moveVector.x ) > 3;
};

// ----- up ----- //

proto.pointerUp = function( event, pointer ) {
  delete this.isTouchScrolling;
  classie.remove( this.viewport, 'is-pointer-down' );
  this.dispatchEvent( 'pointerUp', event, [ pointer ] );
  this._dragPointerUp( event, pointer );
};

// -------------------------- vertical scroll -------------------------- //

var touchScrollEvents = {
  // move events
  // mousemove: true,
  touchmove: true,
  MSPointerMove: true
};

// position of pointer, relative to window
function getPointerWindowY( pointer ) {
  var pointerPoint = Unidragger.getPointerPoint( pointer );
  return pointerPoint.y - window.pageYOffset;
}

proto.touchVerticalScrollMove = function( event, pointer, moveVector ) {
  // do not scroll if already dragging, if disabled
  var touchVerticalScroll = this.options.touchVerticalScroll;
  // if touchVerticalScroll is 'withDrag', allow scrolling and dragging
  var canNotScroll = touchVerticalScroll == 'withDrag' ? !touchVerticalScroll :
    this.isDragging || !touchVerticalScroll;
  if ( canNotScroll || !touchScrollEvents[ event.type ] ) {
    return;
  }
  // don't start vertical scrolling until pointer has moved 10 pixels in a direction
  if ( !this.isTouchScrolling && Math.abs( moveVector.y ) > 10 ) {
    // start touch vertical scrolling
    // scroll & pointerY when started
    this.startScrollY = window.pageYOffset;
    this.pointerWindowStartY = getPointerWindowY( pointer );
    // start scroll animation
    this.isTouchScrolling = true;
  }
};

// -------------------------- dragging -------------------------- //

proto.dragStart = function( event, pointer ) {
  this.dragStartPosition = this.x;
  this.startAnimation();
  this.dispatchEvent( 'dragStart', event, [ pointer ] );
};

proto.dragMove = function( event, pointer, moveVector ) {
  preventDefaultEvent( event );

  this.previousDragX = this.x;

  var movedX = moveVector.x;
  // reverse if right-to-left
  var direction = this.options.rightToLeft ? -1 : 1;
  this.x = this.dragStartPosition + movedX * direction;

  if ( !this.options.wrapAround && this.cells.length ) {
    // slow drag
    var originBound = Math.max( -this.cells[0].target, this.dragStartPosition);
    this.x = this.x > originBound ? ( this.x - originBound ) * 0.5 + originBound : this.x;
    var endBound = Math.min( -this.getLastCell().target, this.dragStartPosition );
    this.x = this.x < endBound ? ( this.x - endBound ) * 0.5 + endBound : this.x;
  }

  this.previousDragMoveTime = this.dragMoveTime;
  this.dragMoveTime = new Date();
  this.dispatchEvent( 'dragMove', event, [ pointer, moveVector ] );
};

proto.dragEnd = function( event, pointer ) {
  this.dragEndFlick();
  if ( this.options.freeScroll ) {
    this.isFreeScrolling = true;
  }
  // set selectedIndex based on where flick will end up
  var index = this.dragEndRestingSelect();

  if ( this.options.freeScroll && !this.options.wrapAround ) {
    // if free-scroll & not wrap around
    // do not free-scroll if going outside of bounding cells
    // so bounding cells can attract slider, and keep it in bounds
    var restingX = this.getRestingPosition();
    this.isFreeScrolling = -restingX > this.cells[0].target &&
      -restingX < this.getLastCell().target;
  } else if ( !this.options.freeScroll && index == this.selectedIndex ) {
    // boost selection if selected index has not changed
    index += this.dragEndBoostSelect();
  }
  // apply selection
  // TODO refactor this, selecting here feels weird
  this.select( index );
  this.dispatchEvent( 'dragEnd', event, [ pointer ] );
};

// apply velocity after dragging
proto.dragEndFlick = function() {
  if ( !isFinite( this.previousDragX ) ) {
    return;
  }
  // set slider velocity
  var timeDelta = this.dragMoveTime - this.previousDragMoveTime;
  // prevent divide by 0, if dragMove & dragEnd happened at same time
  if ( timeDelta ) {
    // 60 frames per second, ideally
    // TODO, velocity should be in pixels per millisecond
    // currently in pixels per frame
    timeDelta /= 1000 / 60;
    var xDelta = this.x - this.previousDragX;
    this.velocity = xDelta / timeDelta;
  }
  // reset
  delete this.previousDragX;
};

proto.dragEndRestingSelect = function() {
  var restingX = this.getRestingPosition();
  // how far away from selected cell
  var distance = Math.abs( this.getCellDistance( -restingX, this.selectedIndex ) );
  // get closet resting going up and going down
  var positiveResting = this._getClosestResting( restingX, distance, 1 );
  var negativeResting = this._getClosestResting( restingX, distance, -1 );
  // use closer resting for wrap-around
  var index = positiveResting.distance < negativeResting.distance ?
    positiveResting.index : negativeResting.index;
  // for contain, force boost if delta is not greater than 1
  if ( this.options.contain && !this.options.wrapAround ) {
    index = Math.abs( index - this.selectedIndex ) <= 1 ? this.selectedIndex : index;
  }
  return index;
};

/**
 * given resting X and distance to selected cell
 * get the distance and index of the closest cell
 * @param {Number} restingX - estimated post-flick resting position
 * @param {Number} distance - distance to selected cell
 * @param {Integer} increment - +1 or -1, going up or down
 * @returns {Object} - { distance: {Number}, index: {Integer} }
 */
proto._getClosestResting = function( restingX, distance, increment ) {
  var index = this.selectedIndex;
  var minDistance = Infinity;
  var condition = this.options.contain && !this.options.wrapAround ?
    // if contain, keep going if distance is equal to minDistance
    function( d, md ) { return d <= md; } : function( d, md ) { return d < md; };
  while ( condition( distance, minDistance ) ) {
    // measure distance to next cell
    index += increment;
    minDistance = distance;
    distance = this.getCellDistance( -restingX, index );
    if ( distance === null ) {
      break;
    }
    distance = Math.abs( distance );
  }
  return {
    distance: minDistance,
    // selected was previous index
    index: index - increment
  };
};

/**
 * measure distance between x and a cell target
 * @param {Number} x
 * @param {Integer} index - cell index
 */
proto.getCellDistance = function( x, index ) {
  var len = this.cells.length;
  // wrap around if at least 2 cells
  var isWrapAround = this.options.wrapAround && len > 1;
  var cellIndex = isWrapAround ? utils.modulo( index, len ) : index;
  var cell = this.cells[ cellIndex ];
  if ( !cell ) {
    return null;
  }
  // add distance for wrap-around cells
  var wrap = isWrapAround ? this.slideableWidth * Math.floor( index / len ) : 0;
  return x - ( cell.target + wrap );
};

proto.dragEndBoostSelect = function() {
  var distance = this.getCellDistance( -this.x, this.selectedIndex );
  if ( distance > 0 && this.velocity < -1 ) {
    // if moving towards the right, and positive velocity, and the next attractor
    return 1;
  } else if ( distance < 0 && this.velocity > 1 ) {
    // if moving towards the left, and negative velocity, and previous attractor
    return -1;
  }
  return 0;
};

// ----- staticClick ----- //

proto.staticClick = function( event, pointer ) {
  // get clickedCell, if cell was clicked
  var clickedCell = this.getParentCell( event.target );
  var cellElem = clickedCell && clickedCell.element;
  var cellIndex = clickedCell && utils.indexOf( this.cells, clickedCell );
  this.dispatchEvent( 'staticClick', event, [ pointer, cellElem, cellIndex ] );
};

// -----  ----- //

utils.extend( Flickity.prototype, proto );

// -----  ----- //

return Flickity;

}));

},{"./flickity":9,"desandro-classie":14,"eventie":18,"fizzy-ui-utils":19,"unidragger":24}],9:[function(require,module,exports){
/*!
 * Flickity v1.0.2
 * Touch, responsive, flickable galleries
 *
 * Licensed GPLv3 for open source use
 * or Flickity Commercial License for commercial use
 *
 * http://flickity.metafizzy.co
 * Copyright 2015 Metafizzy
 */

( function( window, factory ) {
  'use strict';
  // universal module definition

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
      'classie/classie',
      'eventEmitter/EventEmitter',
      'eventie/eventie',
      'get-size/get-size',
      'fizzy-ui-utils/utils',
      './cell',
      './animate'
    ], function( classie, EventEmitter, eventie, getSize, utils, Cell, animatePrototype ) {
      return factory( window, classie, EventEmitter, eventie, getSize, utils, Cell, animatePrototype );
    });
  } else if ( typeof exports == 'object' ) {
    // CommonJS
    module.exports = factory(
      window,
      require('desandro-classie'),
      require('wolfy87-eventemitter'),
      require('eventie'),
      require('get-size'),
      require('fizzy-ui-utils'),
      require('./cell'),
      require('./animate')
    );
  } else {
    // browser global
    var _Flickity = window.Flickity;

    window.Flickity = factory(
      window,
      window.classie,
      window.EventEmitter,
      window.eventie,
      window.getSize,
      window.fizzyUIUtils,
      _Flickity.Cell,
      _Flickity.animatePrototype
    );
  }

}( window, function factory( window, classie, EventEmitter, eventie, getSize,
  utils, Cell, animatePrototype ) {

'use strict';

// vars
var jQuery = window.jQuery;
var getComputedStyle = window.getComputedStyle;
var console = window.console;

function moveElements( elems, toElem ) {
  elems = utils.makeArray( elems );
  while ( elems.length ) {
    toElem.appendChild( elems.shift() );
  }
}

// -------------------------- Flickity -------------------------- //

// globally unique identifiers
var GUID = 0;
// internal store of all Flickity intances
var instances = {};

function Flickity( element, options ) {
  var queryElement = utils.getQueryElement( element );
  if ( !queryElement ) {
    if ( console ) {
      console.error( 'Bad element for Flickity: ' + ( queryElement || element ) );
    }
    return;
  }
  this.element = queryElement;
  // add jQuery
  if ( jQuery ) {
    this.$element = jQuery( this.element );
  }
  // options
  this.options = utils.extend( {}, this.constructor.defaults );
  this.option( options );

  // kick things off
  this._create();
}

Flickity.defaults = {
  accessibility: true,
  cellAlign: 'center',
  // cellSelector: undefined,
  // contain: false,
  freeScrollFriction: 0.075, // friction when free-scrolling
  friction: 0.28, // friction when selecting
  // initialIndex: 0,
  percentPosition: true,
  resize: true,
  selectedAttraction: 0.025,
  setGallerySize: true
  // watchCSS: false,
  // wrapAround: false
};

// hash of methods triggered on _create()
Flickity.createMethods = [];

// inherit EventEmitter
utils.extend( Flickity.prototype, EventEmitter.prototype );

Flickity.prototype._create = function() {
  // add id for Flickity.data
  var id = this.guid = ++GUID;
  this.element.flickityGUID = id; // expando
  instances[ id ] = this; // associate via id
  // initial properties
  this.selectedIndex = this.options.initialIndex || 0;
  // how many frames slider has been in same position
  this.restingFrames = 0;
  // initial physics properties
  this.x = 0;
  this.velocity = 0;
  this.accel = 0;
  this.originSide = this.options.rightToLeft ? 'right' : 'left';
  // create viewport & slider
  this.viewport = document.createElement('div');
  this.viewport.className = 'flickity-viewport';
  Flickity.setUnselectable( this.viewport );
  this._createSlider();

  if ( this.options.resize || this.options.watchCSS ) {
    eventie.bind( window, 'resize', this );
    this.isResizeBound = true;
  }

  for ( var i=0, len = Flickity.createMethods.length; i < len; i++ ) {
    var method = Flickity.createMethods[i];
    this[ method ]();
  }

  if ( this.options.watchCSS ) {
    this.watchCSS();
  } else {
    this.activate();
  }

};

/**
 * set options
 * @param {Object} opts
 */
Flickity.prototype.option = function( opts ) {
  utils.extend( this.options, opts );
};

Flickity.prototype.activate = function() {
  if ( this.isActive ) {
    return;
  }
  this.isActive = true;
  classie.add( this.element, 'flickity-enabled' );
  if ( this.options.rightToLeft ) {
    classie.add( this.element, 'flickity-rtl' );
  }

  // move initial cell elements so they can be loaded as cells
  var cellElems = this._filterFindCellElements( this.element.children );
  moveElements( cellElems, this.slider );
  this.viewport.appendChild( this.slider );
  this.element.appendChild( this.viewport );

  this.getSize();
  // get cells from children
  this.reloadCells();

  if ( this.options.accessibility ) {
    // allow element to focusable
    this.element.tabIndex = 0;
    // listen for key presses
    eventie.bind( this.element, 'keydown', this );
  }

  this.emit('activate');

  this.positionSliderAtSelected();
  this.select( this.selectedIndex );
};

// slider positions the cells
Flickity.prototype._createSlider = function() {
  // slider element does all the positioning
  var slider = document.createElement('div');
  slider.className = 'flickity-slider';
  slider.style[ this.originSide ] = 0;
  this.slider = slider;
};

Flickity.prototype._filterFindCellElements = function( elems ) {
  return utils.filterFindElements( elems, this.options.cellSelector );
};

// goes through all children
Flickity.prototype.reloadCells = function() {
  // collection of item elements
  this.cells = this._makeCells( this.slider.children );
  this.positionCells();
  this._getWrapShiftCells();
  this.setGallerySize();
};

/**
 * turn elements into Flickity.Cells
 * @param {Array or NodeList or HTMLElement} elems
 * @returns {Array} items - collection of new Flickity Cells
 */
Flickity.prototype._makeCells = function( elems ) {
  var cellElems = this._filterFindCellElements( elems );

  // create new Flickity for collection
  var cells = [];
  for ( var i=0, len = cellElems.length; i < len; i++ ) {
    var elem = cellElems[i];
    var cell = new Cell( elem, this );
    cells.push( cell );
  }

  return cells;
};

Flickity.prototype.getLastCell = function() {
  return this.cells[ this.cells.length - 1 ];
};

// positions all cells
Flickity.prototype.positionCells = function() {
  // size all cells
  this._sizeCells( this.cells );
  // position all cells
  this._positionCells( 0 );
};

/**
 * position certain cells
 * @param {Integer} index - which cell to start with
 */
Flickity.prototype._positionCells = function( index ) {
  // also measure maxCellHeight
  // start 0 if positioning all cells
  this.maxCellHeight = index ? this.maxCellHeight || 0 : 0;
  var cellX = 0;
  // get cellX
  if ( index > 0 ) {
    var startCell = this.cells[ index - 1 ];
    cellX = startCell.x + startCell.size.outerWidth;
  }
  var cell;
  for ( var len = this.cells.length, i=index; i < len; i++ ) {
    cell = this.cells[i];
    cell.setPosition( cellX );
    cellX += cell.size.outerWidth;
    this.maxCellHeight = Math.max( cell.size.outerHeight, this.maxCellHeight );
  }
  // keep track of cellX for wrap-around
  this.slideableWidth = cellX;
  // contain cell target
  this._containCells();
};

/**
 * cell.getSize() on multiple cells
 * @param {Array} cells
 */
Flickity.prototype._sizeCells = function( cells ) {
  for ( var i=0, len = cells.length; i < len; i++ ) {
    var cell = cells[i];
    cell.getSize();
  }
};

// alias _init for jQuery plugin .flickity()
Flickity.prototype._init =
Flickity.prototype.reposition = function() {
  this.positionCells();
  this.positionSliderAtSelected();
};

Flickity.prototype.getSize = function() {
  this.size = getSize( this.element );
  this.setCellAlign();
  this.cursorPosition = this.size.innerWidth * this.cellAlign;
};

var cellAlignShorthands = {
  // cell align, then based on origin side
  center: {
    left: 0.5,
    right: 0.5
  },
  left: {
    left: 0,
    right: 1
  },
  right: {
    right: 0,
    left: 1
  }
};

Flickity.prototype.setCellAlign = function() {
  var shorthand = cellAlignShorthands[ this.options.cellAlign ];
  this.cellAlign = shorthand ? shorthand[ this.originSide ] : this.options.cellAlign;
};

Flickity.prototype.setGallerySize = function() {
  if ( this.options.setGallerySize ) {
    this.viewport.style.height = this.maxCellHeight + 'px';
  }
};

Flickity.prototype._getWrapShiftCells = function() {
  // only for wrap-around
  if ( !this.options.wrapAround ) {
    return;
  }
  // unshift previous cells
  this._unshiftCells( this.beforeShiftCells );
  this._unshiftCells( this.afterShiftCells );
  // get before cells
  // initial gap
  var gapX = this.cursorPosition;
  var cellIndex = this.cells.length - 1;
  this.beforeShiftCells = this._getGapCells( gapX, cellIndex, -1 );
  // get after cells
  // ending gap between last cell and end of gallery viewport
  gapX = this.size.innerWidth - this.cursorPosition;
  // start cloning at first cell, working forwards
  this.afterShiftCells = this._getGapCells( gapX, 0, 1 );
};

Flickity.prototype._getGapCells = function( gapX, cellIndex, increment ) {
  // keep adding cells until the cover the initial gap
  var cells = [];
  while ( gapX > 0 ) {
    var cell = this.cells[ cellIndex ];
    if ( !cell ) {
      break;
    }
    cells.push( cell );
    cellIndex += increment;
    gapX -= cell.size.outerWidth;
  }
  return cells;
};

// ----- contain ----- //

// contain cell targets so no excess sliding
Flickity.prototype._containCells = function() {
  if ( !this.options.contain || this.options.wrapAround || !this.cells.length ) {
    return;
  }
  var startMargin = this.options.rightToLeft ? 'marginRight' : 'marginLeft';
  var endMargin = this.options.rightToLeft ? 'marginLeft' : 'marginRight';
  var firstCellStartMargin = this.cells[0].size[ startMargin ];
  var lastCell = this.getLastCell();
  var contentWidth = this.slideableWidth - lastCell.size[ endMargin ];
  var endLimit = contentWidth - this.size.innerWidth * ( 1 - this.cellAlign );
  // content is less than gallery size
  var isContentSmaller = contentWidth < this.size.innerWidth;
  // contain each cell target
  for ( var i=0, len = this.cells.length; i < len; i++ ) {
    var cell = this.cells[i];
    // reset default target
    cell.setDefaultTarget();
    if ( isContentSmaller ) {
      // all cells fit inside gallery
      cell.target = contentWidth * this.cellAlign;
    } else {
      // contain to bounds
      cell.target = Math.max( cell.target, this.cursorPosition + firstCellStartMargin );
      cell.target = Math.min( cell.target, endLimit );
    }
  }
};

// -----  ----- //

/**
 * emits events via eventEmitter and jQuery events
 * @param {String} type - name of event
 * @param {Event} event - original event
 * @param {Array} args - extra arguments
 */
Flickity.prototype.dispatchEvent = function( type, event, args ) {
  var emitArgs = [ event ].concat( args );
  this.emitEvent( type, emitArgs );

  if ( jQuery && this.$element ) {
    if ( event ) {
      // create jQuery event
      var $event = jQuery.Event( event );
      $event.type = type;
      this.$element.trigger( $event, args );
    } else {
      // just trigger with type if no event available
      this.$element.trigger( type, args );
    }
  }
};

// -------------------------- select -------------------------- //

/**
 * @param {Integer} index - index of the cell
 * @param {Boolean} isWrap - will wrap-around to last/first if at the end
 */
Flickity.prototype.select = function( index, isWrap ) {
  if ( !this.isActive ) {
    return;
  }
  // wrap position so slider is within normal area
  var len = this.cells.length;
  if ( this.options.wrapAround && len > 1 ) {
    if ( index < 0 ) {
      this.x -= this.slideableWidth;
    } else if ( index >= len ) {
      this.x += this.slideableWidth;
    }
  }

  if ( this.options.wrapAround || isWrap ) {
    index = utils.modulo( index, len );
  }

  if ( this.cells[ index ] ) {
    this.selectedIndex = index;
    this.setSelectedCell();
    this.startAnimation();
    this.dispatchEvent('cellSelect');
  }
};

Flickity.prototype.previous = function( isWrap ) {
  this.select( this.selectedIndex - 1, isWrap );
};

Flickity.prototype.next = function( isWrap ) {
  this.select( this.selectedIndex + 1, isWrap );
};

Flickity.prototype.setSelectedCell = function() {
  this._removeSelectedCellClass();
  this.selectedCell = this.cells[ this.selectedIndex ];
  this.selectedElement = this.selectedCell.element;
  classie.add( this.selectedElement, 'is-selected' );
};

Flickity.prototype._removeSelectedCellClass = function() {
  if ( this.selectedCell ) {
    classie.remove( this.selectedCell.element, 'is-selected' );
  }
};

// -------------------------- get cells -------------------------- //

/**
 * get Flickity.Cell, given an Element
 * @param {Element} elem
 * @returns {Flickity.Cell} item
 */
Flickity.prototype.getCell = function( elem ) {
  // loop through cells to get the one that matches
  for ( var i=0, len = this.cells.length; i < len; i++ ) {
    var cell = this.cells[i];
    if ( cell.element == elem ) {
      return cell;
    }
  }
};

/**
 * get collection of Flickity.Cells, given Elements
 * @param {Element, Array, NodeList} elems
 * @returns {Array} cells - Flickity.Cells
 */
Flickity.prototype.getCells = function( elems ) {
  elems = utils.makeArray( elems );
  var cells = [];
  for ( var i=0, len = elems.length; i < len; i++ ) {
    var elem = elems[i];
    var cell = this.getCell( elem );
    if ( cell ) {
      cells.push( cell );
    }
  }
  return cells;
};

/**
 * get cell elements
 * @returns {Array} cellElems
 */
Flickity.prototype.getCellElements = function() {
  var cellElems = [];
  for ( var i=0, len = this.cells.length; i < len; i++ ) {
    cellElems.push( this.cells[i].element );
  }
  return cellElems;
};

/**
 * get parent cell from an element
 * @param {Element} elem
 * @returns {Flickit.Cell} cell
 */
Flickity.prototype.getParentCell = function( elem ) {
  // first check if elem is cell
  var cell = this.getCell( elem );
  if ( cell ) {
    return cell;
  }
  // try to get parent cell elem
  elem = utils.getParent( elem, '.flickity-slider > *' );
  return this.getCell( elem );
};

// -------------------------- events -------------------------- //

Flickity.prototype.uiChange = function() {
  this.emit('uiChange');
};

Flickity.prototype.childUIPointerDown = function( event ) {
  this.emitEvent( 'childUIPointerDown', [ event ] );
};

// ----- resize ----- //

Flickity.prototype.onresize = function() {
  this.watchCSS();
  this.resize();
};

utils.debounceMethod( Flickity, 'onresize', 150 );

Flickity.prototype.resize = function() {
  if ( !this.isActive ) {
    return;
  }
  this.getSize();
  // wrap values
  if ( this.options.wrapAround ) {
    this.x = utils.modulo( this.x, this.slideableWidth );
  }
  this.positionCells();
  this._getWrapShiftCells();
  this.setGallerySize();
  this.positionSliderAtSelected();
};

var supportsConditionalCSS = Flickity.supportsConditionalCSS = ( function() {
  var supports;
  return function checkSupport() {
    if ( supports !== undefined ) {
      return supports;
    }
    if ( !getComputedStyle ) {
      supports = false;
      return;
    }
    // style body's :after and check that
    var style = document.createElement('style');
    var cssText = document.createTextNode('body:after { content: "foo"; display: none; }');
    style.appendChild( cssText );
    document.head.appendChild( style );
    var afterContent = getComputedStyle( document.body, ':after' ).content;
    // check if able to get :after content
    supports = afterContent.indexOf('foo') != -1;
    document.head.removeChild( style );
    return supports;
  };
})();

// watches the :after property, activates/deactivates
Flickity.prototype.watchCSS = function() {
  var watchOption = this.options.watchCSS;
  if ( !watchOption ) {
    return;
  }
  var supports = supportsConditionalCSS();
  if ( !supports ) {
    // activate if watch option is fallbackOn
    var method = watchOption == 'fallbackOn' ? 'activate' : 'deactivate';
    this[ method ]();
    return;
  }

  var afterContent = getComputedStyle( this.element, ':after' ).content;
  // activate if :after { content: 'flickity' }
  if ( afterContent.indexOf('flickity') != -1 ) {
    this.activate();
  } else {
    this.deactivate();
  }
};

// ----- keydown ----- //

// go previous/next if left/right keys pressed
Flickity.prototype.onkeydown = function( event ) {
  // only work if element is in focus
  if ( !this.options.accessibility ||
    ( document.activeElement && document.activeElement != this.element ) ) {
    return;
  }

  if ( event.keyCode == 37 ) {
    // go left
    var leftMethod = this.options.rightToLeft ? 'next' : 'previous';
    this.uiChange();
    this[ leftMethod ]();
  } else if ( event.keyCode == 39 ) {
    // go right
    var rightMethod = this.options.rightToLeft ? 'previous' : 'next';
    this.uiChange();
    this[ rightMethod ]();
  }
};

// -------------------------- destroy -------------------------- //

// deactivate all Flickity functionality, but keep stuff available
Flickity.prototype.deactivate = function() {
  if ( !this.isActive ) {
    return;
  }
  classie.remove( this.element, 'flickity-enabled' );
  classie.remove( this.element, 'flickity-rtl' );
  // destroy cells
  for ( var i=0, len = this.cells.length; i < len; i++ ) {
    var cell = this.cells[i];
    cell.destroy();
  }
  this._removeSelectedCellClass();
  this.element.removeChild( this.viewport );
  // move child elements back into element
  moveElements( this.slider.children, this.element );
  if ( this.options.accessibility ) {
    this.element.removeAttribute('tabIndex');
    eventie.unbind( this.element, 'keydown', this );
  }
  // set flags
  this.isActive = false;
  this.emit('deactivate');
};

Flickity.prototype.destroy = function() {
  this.deactivate();
  if ( this.isResizeBound ) {
    eventie.unbind( window, 'resize', this );
  }
  this.emit('destroy');
  if ( jQuery && this.$element ) {
    jQuery.removeData( this.element, 'flickity' );
  }
  delete this.element.flickityGUID;
  delete instances[ this.guid ];
};

// -------------------------- prototype -------------------------- //

utils.extend( Flickity.prototype, animatePrototype );

// -------------------------- extras -------------------------- //

// quick check for IE8
var isIE8 = 'attachEvent' in window;

Flickity.setUnselectable = function( elem ) {
  if ( !isIE8 ) {
    return;
  }
  // IE8 prevent child from changing focus http://stackoverflow.com/a/17525223/182183
  elem.setAttribute( 'unselectable', 'on' );
};

/**
 * get Flickity instance from element
 * @param {Element} elem
 * @returns {Flickity}
 */
Flickity.data = function( elem ) {
  elem = utils.getQueryElement( elem );
  var id = elem && elem.flickityGUID;
  return id && instances[ id ];
};

utils.htmlInit( Flickity, 'flickity' );

if ( jQuery && jQuery.bridget ) {
  jQuery.bridget( 'flickity', Flickity );
}

Flickity.Cell = Cell;

return Flickity;

}));

},{"./animate":6,"./cell":7,"desandro-classie":14,"eventie":18,"fizzy-ui-utils":19,"get-size":20,"wolfy87-eventemitter":25}],10:[function(require,module,exports){
/**
 * Flickity index
 * used for AMD and CommonJS exports
 */

( function( window, factory ) {
  'use strict';
  // universal module definition

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
      './flickity',
      './drag',
      './prev-next-button',
      './page-dots',
      './player',
      './add-remove-cell'
    ], factory );
  } else if ( typeof exports == 'object' ) {
    // CommonJS
    module.exports = factory(
      require('./flickity'),
      require('./drag'),
      require('./prev-next-button'),
      require('./page-dots'),
      require('./player'),
      require('./add-remove-cell')
    );
  }

})( window, function factory( Flickity ) {
  /*jshint strict: false*/
  return Flickity;
});

},{"./add-remove-cell":5,"./drag":8,"./flickity":9,"./page-dots":11,"./player":12,"./prev-next-button":13}],11:[function(require,module,exports){
( function( window, factory ) {
  'use strict';
  // universal module definition

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
      'eventie/eventie',
      './flickity',
      'tap-listener/tap-listener',
      'fizzy-ui-utils/utils'
    ], function( eventie, Flickity, TapListener, utils ) {
      return factory( window, eventie, Flickity, TapListener, utils );
    });
  } else if ( typeof exports == 'object' ) {
    // CommonJS
    module.exports = factory(
      window,
      require('eventie'),
      require('./flickity'),
      require('tap-listener'),
      require('fizzy-ui-utils')
    );
  } else {
    // browser global
    window.Flickity = window.Flickity || {};
    window.Flickity.PageDots = factory(
      window,
      window.eventie,
      window.Flickity,
      window.TapListener,
      window.fizzyUIUtils
    );
  }

}( window, function factory( window, eventie, Flickity, TapListener, utils ) {

// -------------------------- PageDots -------------------------- //

'use strict';

function PageDots( parent ) {
  this.parent = parent;
  this._create();
}

PageDots.prototype = new TapListener();

PageDots.prototype._create = function() {
  // create holder element
  this.holder = document.createElement('ol');
  this.holder.className = 'flickity-page-dots';
  Flickity.setUnselectable( this.holder );
  // create dots, array of elements
  this.dots = [];
  // update on select
  var _this = this;
  this.onCellSelect = function() {
    _this.updateSelected();
  };
  this.parent.on( 'cellSelect', this.onCellSelect );
  // tap
  this.on( 'tap', this.onTap );
  // pointerDown
  this.on( 'pointerDown', function onPointerDown( button, event ) {
    _this.parent.childUIPointerDown( event );
  });
};

PageDots.prototype.activate = function() {
  this.setDots();
  this.updateSelected();
  this.bindTap( this.holder );
  // add to DOM
  this.parent.element.appendChild( this.holder );
};

PageDots.prototype.deactivate = function() {
  // remove from DOM
  this.parent.element.removeChild( this.holder );
  TapListener.prototype.destroy.call( this );
};

PageDots.prototype.setDots = function() {
  // get difference between number of cells and number of dots
  var delta = this.parent.cells.length - this.dots.length;
  if ( delta > 0 ) {
    this.addDots( delta );
  } else if ( delta < 0 ) {
    this.removeDots( -delta );
  }
};

PageDots.prototype.addDots = function( count ) {
  var fragment = document.createDocumentFragment();
  var newDots = [];
  while ( count ) {
    var dot = document.createElement('li');
    dot.className = 'dot';
    fragment.appendChild( dot );
    newDots.push( dot );
    count--;
  }
  this.holder.appendChild( fragment );
  this.dots = this.dots.concat( newDots );
};

PageDots.prototype.removeDots = function( count ) {
  // remove from this.dots collection
  var removeDots = this.dots.splice( this.dots.length - count, count );
  // remove from DOM
  for ( var i=0, len = removeDots.length; i < len; i++ ) {
    var dot = removeDots[i];
    this.holder.removeChild( dot );
  }
};

PageDots.prototype.updateSelected = function() {
  // remove selected class on previous
  if ( this.selectedDot ) {
    this.selectedDot.className = 'dot';
  }
  // don't proceed if no dots
  if ( !this.dots.length ) {
    return;
  }
  this.selectedDot = this.dots[ this.parent.selectedIndex ];
  this.selectedDot.className = 'dot is-selected';
};

PageDots.prototype.onTap = function( event ) {
  var target = event.target;
  // only care about dot clicks
  if ( target.nodeName != 'LI' ) {
    return;
  }

  this.parent.uiChange();
  var index = utils.indexOf( this.dots, target );
  this.parent.select( index );
};

PageDots.prototype.destroy = function() {
  this.deactivate();
};

Flickity.PageDots = PageDots;

// -------------------------- Flickity -------------------------- //

utils.extend( Flickity.defaults, {
  pageDots: true
});

Flickity.createMethods.push('_createPageDots');

Flickity.prototype._createPageDots = function() {
  if ( !this.options.pageDots ) {
    return;
  }
  this.pageDots = new PageDots( this );
  this.on( 'activate', this.activatePageDots );
  this.on( 'cellAddedRemoved', this.onCellAddedRemovedPageDots );
  this.on( 'deactivate', this.deactivatePageDots );
};

Flickity.prototype.activatePageDots = function() {
  this.pageDots.activate();
};

Flickity.prototype.onCellAddedRemovedPageDots = function() {
  this.pageDots.setDots();
};

Flickity.prototype.deactivatePageDots = function() {
  this.pageDots.deactivate();
};

// -----  ----- //

Flickity.PageDots = PageDots;

return PageDots;

}));

},{"./flickity":9,"eventie":18,"fizzy-ui-utils":19,"tap-listener":22}],12:[function(require,module,exports){
( function( window, factory ) {
  'use strict';
  // universal module definition

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
      'eventEmitter/EventEmitter',
      'eventie/eventie',
      './flickity'
    ], function( EventEmitter, eventie, Flickity ) {
      return factory( EventEmitter, eventie, Flickity );
    });
  } else if ( typeof exports == 'object' ) {
    // CommonJS
    module.exports = factory(
      require('wolfy87-eventemitter'),
      require('eventie'),
      require('./flickity')
    );
  } else {
    // browser global
    window.Flickity = window.Flickity || {};
    window.Flickity.Player = factory(
      window.EventEmitter,
      window.eventie,
      window.Flickity
    );
  }

}( window, function factory( EventEmitter, eventie, Flickity ) {

'use strict';

// -------------------------- Page Visibility -------------------------- //
// https://developer.mozilla.org/en-US/docs/Web/Guide/User_experience/Using_the_Page_Visibility_API

var hiddenProperty, visibilityEvent;
if ( 'hidden' in document ) {
  hiddenProperty = 'hidden';
  visibilityEvent = 'visibilitychange';
} else if ( 'webkitHidden' in document ) {
  hiddenProperty = 'webkitHidden';
  visibilityEvent = 'webkitvisibilitychange';
}

// -------------------------- Player -------------------------- //

function Player( parent ) {
  this.isPlaying = false;
  this.parent = parent;
  // visibility change event handler
  if ( visibilityEvent ) {
    var _this = this;
    this.onVisibilityChange = function() {
      _this.visibilityChange();
    };
  }
}

Player.prototype = new EventEmitter();

// start play
Player.prototype.play = function() {
  this.isPlaying = true;
  // playing kills pauses
  delete this.isPaused;
  // listen to visibility change
  if ( visibilityEvent ) {
    document.addEventListener( visibilityEvent, this.onVisibilityChange, false );
  }
  // start ticking
  this.tick();
};

Player.prototype.tick = function() {
  // do not tick if paused or not playing
  if ( !this.isPlaying || this.isPaused ) {
    return;
  }
  // keep track of when .tick()
  this.tickTime = new Date();
  var time = this.parent.options.autoPlay;
  // default to 3 seconds
  time = typeof time == 'number' ? time : 3000;
  var _this = this;
  this.timeout = setTimeout( function() {
    _this.parent.next( true );
    _this.tick();
  }, time );
};

Player.prototype.stop = function() {
  this.isPlaying = false;
  // stopping kills pauses
  delete this.isPaused;
  this.clear();
  // remove visibility change event
  if ( visibilityEvent ) {
    document.removeEventListener( visibilityEvent, this.onVisibilityChange, false );
  }
};

Player.prototype.clear = function() {
  clearTimeout( this.timeout );
};

Player.prototype.pause = function() {
  if ( this.isPlaying ) {
    this.isPaused = true;
    this.clear();
  }
};

Player.prototype.unpause = function() {
  // re-start play if in unpaused state
  if ( this.isPaused ) {
    this.play();
  }
};

// pause if page visibility is hidden, unpause if visible
Player.prototype.visibilityChange = function() {
  var isHidden = document[ hiddenProperty ];
  this[ isHidden ? 'pause' : 'unpause' ]();
};

// -------------------------- Flickity -------------------------- //

// utils.extend( Flickity.defaults, {
//   autoPlay: false
// });

Flickity.createMethods.push('_createPlayer');

Flickity.prototype._createPlayer = function() {
  this.player = new Player( this );

  this.on( 'activate', this.activatePlayer );
  this.on( 'uiChange', this.stopPlayer );
  this.on( 'pointerDown', this.stopPlayer );
  this.on( 'deactivate', this.deactivatePlayer );
};

Flickity.prototype.activatePlayer = function() {
  if ( !this.options.autoPlay ) {
    return;
  }
  this.player.play();
  eventie.bind( this.element, 'mouseenter', this );
  this.isMouseenterBound = true;
};

Flickity.prototype.stopPlayer = function() {
  this.player.stop();
};

Flickity.prototype.deactivatePlayer = function() {
  this.player.stop();
  if ( this.isMouseenterBound ) {
    eventie.unbind( this.element, 'mouseenter', this );
    delete this.isMouseenterBound;
  }
};

// ----- mouseenter/leave ----- //

// pause auto-play on hover
Flickity.prototype.onmouseenter = function() {
  this.player.pause();
  eventie.bind( this.element, 'mouseleave', this );
};

// resume auto-play on hover off
Flickity.prototype.onmouseleave = function() {
  this.player.unpause();
  eventie.unbind( this.element, 'mouseleave', this );
};

// -----  ----- //

Flickity.Player = Player;

return Player;

}));

},{"./flickity":9,"eventie":18,"wolfy87-eventemitter":25}],13:[function(require,module,exports){
// -------------------------- prev/next button -------------------------- //

( function( window, factory ) {
  'use strict';
  // universal module definition

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
      'eventie/eventie',
      './flickity',
      'tap-listener/tap-listener',
      'fizzy-ui-utils/utils'
    ], function( eventie, Flickity, TapListener, utils ) {
      return factory( window, eventie, Flickity, TapListener, utils );
    });
  } else if ( typeof exports == 'object' ) {
    // CommonJS
    module.exports = factory(
      window,
      require('eventie'),
      require('./flickity'),
      require('tap-listener'),
      require('fizzy-ui-utils')
    );
  } else {
    // browser global
    window.Flickity = window.Flickity || {};
    window.Flickity.PrevNextButton = factory(
      window,
      window.eventie,
      window.Flickity,
      window.TapListener,
      window.fizzyUIUtils
    );
  }

}( window, function factory( window, eventie, Flickity, TapListener, utils ) {

'use strict';

// ----- inline SVG support ----- //

var svgURI = 'http://www.w3.org/2000/svg';

// only check on demand, not on script load
var supportsInlineSVG = ( function() {
  var supports;
  function checkSupport() {
    if ( supports !== undefined ) {
      return supports;
    }
    var div = document.createElement('div');
    div.innerHTML = '<svg/>';
    supports = ( div.firstChild && div.firstChild.namespaceURI ) == svgURI;
    return supports;
  }
  return checkSupport;
})();

// -------------------------- PrevNextButton -------------------------- //

function PrevNextButton( direction, parent ) {
  this.direction = direction;
  this.parent = parent;
  this._create();
}

PrevNextButton.prototype = new TapListener();

PrevNextButton.prototype._create = function() {
  // properties
  this.isEnabled = true;
  this.isPrevious = this.direction == -1;
  var leftDirection = this.parent.options.rightToLeft ? 1 : -1;
  this.isLeft = this.direction == leftDirection;

  var element = this.element = document.createElement('button');
  element.className = 'flickity-prev-next-button';
  element.className += this.isPrevious ? ' previous' : ' next';
  // prevent button from submitting form http://stackoverflow.com/a/10836076/182183
  element.setAttribute( 'type', 'button' );
  Flickity.setUnselectable( element );
  // create arrow
  if ( supportsInlineSVG() ) {
    var svg = this.createSVG();
    element.appendChild( svg );
  } else {
    // SVG not supported, set button text
    this.setArrowText();
    element.className += ' no-svg';
  }
  // update on select
  var _this = this;
  this.onCellSelect = function() {
    _this.update();
  };
  this.parent.on( 'cellSelect', this.onCellSelect );
  // tap
  this.on( 'tap', this.onTap );
  // pointerDown
  this.on( 'pointerDown', function onPointerDown( button, event ) {
    _this.parent.childUIPointerDown( event );
  });
};

PrevNextButton.prototype.activate = function() {
  this.update();
  this.bindTap( this.element );
  // click events from keyboard
  eventie.bind( this.element, 'click', this );
  // add to DOM
  this.parent.element.appendChild( this.element );
};

PrevNextButton.prototype.deactivate = function() {
  // remove from DOM
  this.parent.element.removeChild( this.element );
  // do regular TapListener destroy
  TapListener.prototype.destroy.call( this );
  // click events from keyboard
  eventie.unbind( this.element, 'click', this );
};

PrevNextButton.prototype.createSVG = function() {
  var svg = document.createElementNS( svgURI, 'svg');
  svg.setAttribute( 'viewBox', '0 0 100 100' );
  var path = document.createElementNS( svgURI, 'path');
  path.setAttribute( 'd', 'M 50,0 L 60,10 L 20,50 L 60,90 L 50,100 L 0,50 Z' );
  path.setAttribute( 'class', 'arrow' );
  // adjust arrow
  var arrowTransform = this.isLeft ? 'translate(15,0)' :
    'translate(85,100) rotate(180)';
  path.setAttribute( 'transform', arrowTransform );
  svg.appendChild( path );
  return svg;
};

PrevNextButton.prototype.setArrowText = function() {
  var parentOptions = this.parent.options;
  var arrowText = this.isLeft ? parentOptions.leftArrowText : parentOptions.rightArrowText;
  utils.setText( this.element, arrowText );
};

PrevNextButton.prototype.onTap = function() {
  if ( !this.isEnabled ) {
    return;
  }
  this.parent.uiChange();
  var method = this.isPrevious ? 'previous' : 'next';
  this.parent[ method ]();
};

PrevNextButton.prototype.handleEvent = utils.handleEvent;

PrevNextButton.prototype.onclick = function() {
  // only allow clicks from keyboard
  var focused = document.activeElement;
  if ( focused && focused == this.element ) {
    this.onTap();
  }
};

// -----  ----- //

PrevNextButton.prototype.enable = function() {
  if ( this.isEnabled ) {
    return;
  }
  this.element.disabled = false;
  this.isEnabled = true;
};

PrevNextButton.prototype.disable = function() {
  if ( !this.isEnabled ) {
    return;
  }
  this.element.disabled = true;
  this.isEnabled = false;
};

PrevNextButton.prototype.update = function() {
  // index of first or last cell, if previous or next
  var cells = this.parent.cells;
  // enable is wrapAround and at least 2 cells
  if ( this.parent.options.wrapAround && cells.length > 1 ) {
    this.enable();
    return;
  }
  var lastIndex = cells.length ? cells.length - 1 : 0;
  var boundIndex = this.isPrevious ? 0 : lastIndex;
  var method = this.parent.selectedIndex == boundIndex ? 'disable' : 'enable';
  this[ method ]();
};

PrevNextButton.prototype.destroy = function() {
  this.deactivate();
};

// -------------------------- Flickity prototype -------------------------- //

utils.extend( Flickity.defaults, {
  prevNextButtons: true,
  leftArrowText: '‹',
  rightArrowText: '›'
});

Flickity.createMethods.push('_createPrevNextButtons');

Flickity.prototype._createPrevNextButtons = function() {
  if ( !this.options.prevNextButtons ) {
    return;
  }

  this.prevButton = new PrevNextButton( -1, this );
  this.nextButton = new PrevNextButton( 1, this );

  this.on( 'activate', this.activatePrevNextButtons );
};

Flickity.prototype.activatePrevNextButtons = function() {
  this.prevButton.activate();
  this.nextButton.activate();
  this.on( 'deactivate', this.deactivatePrevNextButtons );
};

Flickity.prototype.deactivatePrevNextButtons = function() {
  this.prevButton.deactivate();
  this.nextButton.deactivate();
  this.off( 'deactivate', this.deactivatePrevNextButtons );
};

// --------------------------  -------------------------- //

Flickity.PrevNextButton = PrevNextButton;

return PrevNextButton;

}));

},{"./flickity":9,"eventie":18,"fizzy-ui-utils":19,"tap-listener":22}],14:[function(require,module,exports){
/*!
 * classie v1.0.1
 * class helper functions
 * from bonzo https://github.com/ded/bonzo
 * MIT license
 * 
 * classie.has( elem, 'my-class' ) -> true/false
 * classie.add( elem, 'my-new-class' )
 * classie.remove( elem, 'my-unwanted-class' )
 * classie.toggle( elem, 'my-class' )
 */

/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false, module: false */

( function( window ) {

'use strict';

// class helper functions from bonzo https://github.com/ded/bonzo

function classReg( className ) {
  return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
}

// classList support for class management
// altho to be fair, the api sucks because it won't accept multiple classes at once
var hasClass, addClass, removeClass;

if ( 'classList' in document.documentElement ) {
  hasClass = function( elem, c ) {
    return elem.classList.contains( c );
  };
  addClass = function( elem, c ) {
    elem.classList.add( c );
  };
  removeClass = function( elem, c ) {
    elem.classList.remove( c );
  };
}
else {
  hasClass = function( elem, c ) {
    return classReg( c ).test( elem.className );
  };
  addClass = function( elem, c ) {
    if ( !hasClass( elem, c ) ) {
      elem.className = elem.className + ' ' + c;
    }
  };
  removeClass = function( elem, c ) {
    elem.className = elem.className.replace( classReg( c ), ' ' );
  };
}

function toggleClass( elem, c ) {
  var fn = hasClass( elem, c ) ? removeClass : addClass;
  fn( elem, c );
}

var classie = {
  // full names
  hasClass: hasClass,
  addClass: addClass,
  removeClass: removeClass,
  toggleClass: toggleClass,
  // short names
  has: hasClass,
  add: addClass,
  remove: removeClass,
  toggle: toggleClass
};

// transport
if ( typeof define === 'function' && define.amd ) {
  // AMD
  define( classie );
} else if ( typeof exports === 'object' ) {
  // CommonJS
  module.exports = classie;
} else {
  // browser global
  window.classie = classie;
}

})( window );

},{}],15:[function(require,module,exports){
/*!
 * getStyleProperty v1.0.4
 * original by kangax
 * http://perfectionkills.com/feature-testing-css-properties/
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true */
/*global define: false, exports: false, module: false */

( function( window ) {

'use strict';

var prefixes = 'Webkit Moz ms Ms O'.split(' ');
var docElemStyle = document.documentElement.style;

function getStyleProperty( propName ) {
  if ( !propName ) {
    return;
  }

  // test standard property first
  if ( typeof docElemStyle[ propName ] === 'string' ) {
    return propName;
  }

  // capitalize
  propName = propName.charAt(0).toUpperCase() + propName.slice(1);

  // test vendor specific properties
  var prefixed;
  for ( var i=0, len = prefixes.length; i < len; i++ ) {
    prefixed = prefixes[i] + propName;
    if ( typeof docElemStyle[ prefixed ] === 'string' ) {
      return prefixed;
    }
  }
}

// transport
if ( typeof define === 'function' && define.amd ) {
  // AMD
  define( function() {
    return getStyleProperty;
  });
} else if ( typeof exports === 'object' ) {
  // CommonJS for Component
  module.exports = getStyleProperty;
} else {
  // browser global
  window.getStyleProperty = getStyleProperty;
}

})( window );

},{}],16:[function(require,module,exports){
/**
 * matchesSelector v1.0.3
 * matchesSelector( element, '.selector' )
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false, module: false */

( function( ElemProto ) {

  'use strict';

  var matchesMethod = ( function() {
    // check for the standard method name first
    if ( ElemProto.matches ) {
      return 'matches';
    }
    // check un-prefixed
    if ( ElemProto.matchesSelector ) {
      return 'matchesSelector';
    }
    // check vendor prefixes
    var prefixes = [ 'webkit', 'moz', 'ms', 'o' ];

    for ( var i=0, len = prefixes.length; i < len; i++ ) {
      var prefix = prefixes[i];
      var method = prefix + 'MatchesSelector';
      if ( ElemProto[ method ] ) {
        return method;
      }
    }
  })();

  // ----- match ----- //

  function match( elem, selector ) {
    return elem[ matchesMethod ]( selector );
  }

  // ----- appendToFragment ----- //

  function checkParent( elem ) {
    // not needed if already has parent
    if ( elem.parentNode ) {
      return;
    }
    var fragment = document.createDocumentFragment();
    fragment.appendChild( elem );
  }

  // ----- query ----- //

  // fall back to using QSA
  // thx @jonathantneal https://gist.github.com/3062955
  function query( elem, selector ) {
    // append to fragment if no parent
    checkParent( elem );

    // match elem with all selected elems of parent
    var elems = elem.parentNode.querySelectorAll( selector );
    for ( var i=0, len = elems.length; i < len; i++ ) {
      // return true if match
      if ( elems[i] === elem ) {
        return true;
      }
    }
    // otherwise return false
    return false;
  }

  // ----- matchChild ----- //

  function matchChild( elem, selector ) {
    checkParent( elem );
    return match( elem, selector );
  }

  // ----- matchesSelector ----- //

  var matchesSelector;

  if ( matchesMethod ) {
    // IE9 supports matchesSelector, but doesn't work on orphaned elems
    // check for that
    var div = document.createElement('div');
    var supportsOrphans = match( div, 'div' );
    matchesSelector = supportsOrphans ? match : matchChild;
  } else {
    matchesSelector = query;
  }

  // transport
  if ( typeof define === 'function' && define.amd ) {
    // AMD
    define( function() {
      return matchesSelector;
    });
  } else if ( typeof exports === 'object' ) {
    module.exports = matchesSelector;
  }
  else {
    // browser global
    window.matchesSelector = matchesSelector;
  }

})( Element.prototype );

},{}],17:[function(require,module,exports){
/*!
 * docReady v1.0.3
 * Cross browser DOMContentLoaded event emitter
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true*/
/*global define: false, require: false, module: false */

( function( window ) {

'use strict';

var document = window.document;
// collection of functions to be triggered on ready
var queue = [];

function docReady( fn ) {
  // throw out non-functions
  if ( typeof fn !== 'function' ) {
    return;
  }

  if ( docReady.isReady ) {
    // ready now, hit it
    fn();
  } else {
    // queue function when ready
    queue.push( fn );
  }
}

docReady.isReady = false;

// triggered on various doc ready events
function init( event ) {
  // bail if IE8 document is not ready just yet
  var isIE8NotReady = event.type === 'readystatechange' && document.readyState !== 'complete';
  if ( docReady.isReady || isIE8NotReady ) {
    return;
  }
  docReady.isReady = true;

  // process queue
  for ( var i=0, len = queue.length; i < len; i++ ) {
    var fn = queue[i];
    fn();
  }
}

function defineDocReady( eventie ) {
  eventie.bind( document, 'DOMContentLoaded', init );
  eventie.bind( document, 'readystatechange', init );
  eventie.bind( window, 'load', init );

  return docReady;
}

// transport
if ( typeof define === 'function' && define.amd ) {
  // AMD
  // if RequireJS, then doc is already ready
  docReady.isReady = typeof requirejs === 'function';
  define( [ 'eventie/eventie' ], defineDocReady );
} else if ( typeof exports === 'object' ) {
  module.exports = defineDocReady( require('eventie') );
} else {
  // browser global
  window.docReady = defineDocReady( window.eventie );
}

})( window );

},{"eventie":18}],18:[function(require,module,exports){
arguments[4][3][0].apply(exports,arguments)
},{"dup":3}],19:[function(require,module,exports){
/**
 * Fizzy UI utils v1.0.1
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true, strict: true */

( function( window, factory ) {
  /*global define: false, module: false, require: false */
  'use strict';
  // universal module definition

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
      'doc-ready/doc-ready',
      'matches-selector/matches-selector'
    ], function( docReady, matchesSelector ) {
      return factory( window, docReady, matchesSelector );
    });
  } else if ( typeof exports == 'object' ) {
    // CommonJS
    module.exports = factory(
      window,
      require('doc-ready'),
      require('desandro-matches-selector')
    );
  } else {
    // browser global
    window.fizzyUIUtils = factory(
      window,
      window.docReady,
      window.matchesSelector
    );
  }

}( window, function factory( window, docReady, matchesSelector ) {

'use strict';

var utils = {};

// ----- extend ----- //

// extends objects
utils.extend = function( a, b ) {
  for ( var prop in b ) {
    a[ prop ] = b[ prop ];
  }
  return a;
};

// ----- modulo ----- //

utils.modulo = function( num, div ) {
  return ( ( num % div ) + div ) % div;
};

// ----- isArray ----- //
  
var objToString = Object.prototype.toString;
utils.isArray = function( obj ) {
  return objToString.call( obj ) == '[object Array]';
};

// ----- makeArray ----- //

// turn element or nodeList into an array
utils.makeArray = function( obj ) {
  var ary = [];
  if ( utils.isArray( obj ) ) {
    // use object if already an array
    ary = obj;
  } else if ( obj && typeof obj.length == 'number' ) {
    // convert nodeList to array
    for ( var i=0, len = obj.length; i < len; i++ ) {
      ary.push( obj[i] );
    }
  } else {
    // array of single index
    ary.push( obj );
  }
  return ary;
};

// ----- indexOf ----- //

// index of helper cause IE8
utils.indexOf = Array.prototype.indexOf ? function( ary, obj ) {
    return ary.indexOf( obj );
  } : function( ary, obj ) {
    for ( var i=0, len = ary.length; i < len; i++ ) {
      if ( ary[i] === obj ) {
        return i;
      }
    }
    return -1;
  };

// ----- removeFrom ----- //

utils.removeFrom = function( ary, obj ) {
  var index = utils.indexOf( ary, obj );
  if ( index != -1 ) {
    ary.splice( index, 1 );
  }
};

// ----- isElement ----- //

// http://stackoverflow.com/a/384380/182183
utils.isElement = ( typeof HTMLElement == 'function' || typeof HTMLElement == 'object' ) ?
  function isElementDOM2( obj ) {
    return obj instanceof HTMLElement;
  } :
  function isElementQuirky( obj ) {
    return obj && typeof obj == 'object' &&
      obj.nodeType == 1 && typeof obj.nodeName == 'string';
  };

// ----- setText ----- //

utils.setText = ( function() {
  var setTextProperty;
  function setText( elem, text ) {
    // only check setTextProperty once
    setTextProperty = setTextProperty || ( document.documentElement.textContent !== undefined ? 'textContent' : 'innerText' );
    elem[ setTextProperty ] = text;
  }
  return setText;
})();

// ----- getParent ----- //

utils.getParent = function( elem, selector ) {
  while ( elem != document.body ) {
    elem = elem.parentNode;
    if ( matchesSelector( elem, selector ) ) {
      return elem;
    }
  }
};

// ----- getQueryElement ----- //

// use element as selector string
utils.getQueryElement = function( elem ) {
  if ( typeof elem == 'string' ) {
    return document.querySelector( elem );
  }
  return elem;
};

// ----- handleEvent ----- //

// enable .ontype to trigger from .addEventListener( elem, 'type' )
utils.handleEvent = function( event ) {
  var method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

// ----- filterFindElements ----- //

utils.filterFindElements = function( elems, selector ) {
  // make array of elems
  elems = utils.makeArray( elems );
  var ffElems = [];

  for ( var i=0, len = elems.length; i < len; i++ ) {
    var elem = elems[i];
    // check that elem is an actual element
    if ( !utils.isElement( elem ) ) {
      continue;
    }
    // filter & find items if we have a selector
    if ( selector ) {
      // filter siblings
      if ( matchesSelector( elem, selector ) ) {
        ffElems.push( elem );
      }
      // find children
      var childElems = elem.querySelectorAll( selector );
      // concat childElems to filterFound array
      for ( var j=0, jLen = childElems.length; j < jLen; j++ ) {
        ffElems.push( childElems[j] );
      }
    } else {
      ffElems.push( elem );
    }
  }

  return ffElems;
};

// ----- debounceMethod ----- //

utils.debounceMethod = function( _class, methodName, threshold ) {
  // original method
  var method = _class.prototype[ methodName ];
  var timeoutName = methodName + 'Timeout';

  _class.prototype[ methodName ] = function() {
    var timeout = this[ timeoutName ];
    if ( timeout ) {
      clearTimeout( timeout );
    }
    var args = arguments;

    var _this = this;
    this[ timeoutName ] = setTimeout( function() {
      method.apply( _this, args );
      delete _this[ timeoutName ];
    }, threshold || 100 );
  };
};

// ----- htmlInit ----- //

// http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/
utils.toDashed = function( str ) {
  return str.replace( /(.)([A-Z])/g, function( match, $1, $2 ) {
    return $1 + '-' + $2;
  }).toLowerCase();
};

var console = window.console;
/**
 * allow user to initialize classes via .js-namespace class
 * htmlInit( Widget, 'widgetName' )
 * options are parsed from data-namespace-option attribute
 */
utils.htmlInit = function( WidgetClass, namespace ) {
  docReady( function() {
    var dashedNamespace = utils.toDashed( namespace );
    var elems = document.querySelectorAll( '.js-' + dashedNamespace );
    var dataAttr = 'data-' + dashedNamespace + '-options';

    for ( var i=0, len = elems.length; i < len; i++ ) {
      var elem = elems[i];
      var attr = elem.getAttribute( dataAttr );
      var options;
      try {
        options = attr && JSON.parse( attr );
      } catch ( error ) {
        // log error, do not initialize
        if ( console ) {
          console.error( 'Error parsing ' + dataAttr + ' on ' +
            elem.nodeName.toLowerCase() + ( elem.id ? '#' + elem.id : '' ) + ': ' +
            error );
        }
        continue;
      }
      // initialize
      var instance = new WidgetClass( elem, options );
      // make available via $().data('layoutname')
      var jQuery = window.jQuery;
      if ( jQuery ) {
        jQuery.data( elem, namespace, instance );
      }
    }
  });
};

// -----  ----- //

return utils;

}));

},{"desandro-matches-selector":16,"doc-ready":17}],20:[function(require,module,exports){
/*!
 * getSize v1.2.2
 * measure size of elements
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false, exports: false, require: false, module: false, console: false */

( function( window, undefined ) {

'use strict';

// -------------------------- helpers -------------------------- //

// get a number from a string, not a percentage
function getStyleSize( value ) {
  var num = parseFloat( value );
  // not a percent like '100%', and a number
  var isValid = value.indexOf('%') === -1 && !isNaN( num );
  return isValid && num;
}

function noop() {}

var logError = typeof console === 'undefined' ? noop :
  function( message ) {
    console.error( message );
  };

// -------------------------- measurements -------------------------- //

var measurements = [
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginBottom',
  'borderLeftWidth',
  'borderRightWidth',
  'borderTopWidth',
  'borderBottomWidth'
];

function getZeroSize() {
  var size = {
    width: 0,
    height: 0,
    innerWidth: 0,
    innerHeight: 0,
    outerWidth: 0,
    outerHeight: 0
  };
  for ( var i=0, len = measurements.length; i < len; i++ ) {
    var measurement = measurements[i];
    size[ measurement ] = 0;
  }
  return size;
}



function defineGetSize( getStyleProperty ) {

// -------------------------- setup -------------------------- //

var isSetup = false;

var getStyle, boxSizingProp, isBoxSizeOuter;

/**
 * setup vars and functions
 * do it on initial getSize(), rather than on script load
 * For Firefox bug https://bugzilla.mozilla.org/show_bug.cgi?id=548397
 */
function setup() {
  // setup once
  if ( isSetup ) {
    return;
  }
  isSetup = true;

  var getComputedStyle = window.getComputedStyle;
  getStyle = ( function() {
    var getStyleFn = getComputedStyle ?
      function( elem ) {
        return getComputedStyle( elem, null );
      } :
      function( elem ) {
        return elem.currentStyle;
      };

      return function getStyle( elem ) {
        var style = getStyleFn( elem );
        if ( !style ) {
          logError( 'Style returned ' + style +
            '. Are you running this code in a hidden iframe on Firefox? ' +
            'See http://bit.ly/getsizebug1' );
        }
        return style;
      };
  })();

  // -------------------------- box sizing -------------------------- //

  boxSizingProp = getStyleProperty('boxSizing');

  /**
   * WebKit measures the outer-width on style.width on border-box elems
   * IE & Firefox measures the inner-width
   */
  if ( boxSizingProp ) {
    var div = document.createElement('div');
    div.style.width = '200px';
    div.style.padding = '1px 2px 3px 4px';
    div.style.borderStyle = 'solid';
    div.style.borderWidth = '1px 2px 3px 4px';
    div.style[ boxSizingProp ] = 'border-box';

    var body = document.body || document.documentElement;
    body.appendChild( div );
    var style = getStyle( div );

    isBoxSizeOuter = getStyleSize( style.width ) === 200;
    body.removeChild( div );
  }

}

// -------------------------- getSize -------------------------- //

function getSize( elem ) {
  setup();

  // use querySeletor if elem is string
  if ( typeof elem === 'string' ) {
    elem = document.querySelector( elem );
  }

  // do not proceed on non-objects
  if ( !elem || typeof elem !== 'object' || !elem.nodeType ) {
    return;
  }

  var style = getStyle( elem );

  // if hidden, everything is 0
  if ( style.display === 'none' ) {
    return getZeroSize();
  }

  var size = {};
  size.width = elem.offsetWidth;
  size.height = elem.offsetHeight;

  var isBorderBox = size.isBorderBox = !!( boxSizingProp &&
    style[ boxSizingProp ] && style[ boxSizingProp ] === 'border-box' );

  // get all measurements
  for ( var i=0, len = measurements.length; i < len; i++ ) {
    var measurement = measurements[i];
    var value = style[ measurement ];
    value = mungeNonPixel( elem, value );
    var num = parseFloat( value );
    // any 'auto', 'medium' value will be 0
    size[ measurement ] = !isNaN( num ) ? num : 0;
  }

  var paddingWidth = size.paddingLeft + size.paddingRight;
  var paddingHeight = size.paddingTop + size.paddingBottom;
  var marginWidth = size.marginLeft + size.marginRight;
  var marginHeight = size.marginTop + size.marginBottom;
  var borderWidth = size.borderLeftWidth + size.borderRightWidth;
  var borderHeight = size.borderTopWidth + size.borderBottomWidth;

  var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;

  // overwrite width and height if we can get it from style
  var styleWidth = getStyleSize( style.width );
  if ( styleWidth !== false ) {
    size.width = styleWidth +
      // add padding and border unless it's already including it
      ( isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth );
  }

  var styleHeight = getStyleSize( style.height );
  if ( styleHeight !== false ) {
    size.height = styleHeight +
      // add padding and border unless it's already including it
      ( isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight );
  }

  size.innerWidth = size.width - ( paddingWidth + borderWidth );
  size.innerHeight = size.height - ( paddingHeight + borderHeight );

  size.outerWidth = size.width + marginWidth;
  size.outerHeight = size.height + marginHeight;

  return size;
}

// IE8 returns percent values, not pixels
// taken from jQuery's curCSS
function mungeNonPixel( elem, value ) {
  // IE8 and has percent value
  if ( window.getComputedStyle || value.indexOf('%') === -1 ) {
    return value;
  }
  var style = elem.style;
  // Remember the original values
  var left = style.left;
  var rs = elem.runtimeStyle;
  var rsLeft = rs && rs.left;

  // Put in the new values to get a computed value out
  if ( rsLeft ) {
    rs.left = elem.currentStyle.left;
  }
  style.left = value;
  value = style.pixelLeft;

  // Revert the changed values
  style.left = left;
  if ( rsLeft ) {
    rs.left = rsLeft;
  }

  return value;
}

return getSize;

}

// transport
if ( typeof define === 'function' && define.amd ) {
  // AMD for RequireJS
  define( [ 'get-style-property/get-style-property' ], defineGetSize );
} else if ( typeof exports === 'object' ) {
  // CommonJS for Component
  module.exports = defineGetSize( require('desandro-get-style-property') );
} else {
  // browser global
  window.getSize = defineGetSize( window.getStyleProperty );
}

})( window );

},{"desandro-get-style-property":15}],21:[function(require,module,exports){
/*!
 * Unipointer v1.1.0
 * base class for doing one thing with pointer event
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true, strict: true */
/*global define: false, module: false, require: false */

( function( window, factory ) {
  'use strict';
  // universal module definition

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
      'eventEmitter/EventEmitter',
      'eventie/eventie'
    ], function( EventEmitter, eventie ) {
      return factory( window, EventEmitter, eventie );
    });
  } else if ( typeof exports == 'object' ) {
    // CommonJS
    module.exports = factory(
      window,
      require('wolfy87-eventemitter'),
      require('eventie')
    );
  } else {
    // browser global
    window.Unipointer = factory(
      window,
      window.EventEmitter,
      window.eventie
    );
  }

}( window, function factory( window, EventEmitter, eventie ) {

'use strict';

function noop() {}

function Unipointer() {}

// inherit EventEmitter
Unipointer.prototype = new EventEmitter();

Unipointer.prototype.bindStartEvent = function( elem ) {
  this._bindStartEvent( elem, true );
};

Unipointer.prototype.unbindStartEvent = function( elem ) {
  this._bindStartEvent( elem, false );
};

/**
 * works as unbinder, as you can ._bindStart( false ) to unbind
 * @param {Boolean} isBind - will unbind if falsey
 */
Unipointer.prototype._bindStartEvent = function( elem, isBind ) {
  // munge isBind, default to true
  isBind = isBind === undefined ? true : !!isBind;
  var bindMethod = isBind ? 'bind' : 'unbind';

  if ( window.navigator.pointerEnabled ) {
    // W3C Pointer Events, IE11. See https://coderwall.com/p/mfreca
    eventie[ bindMethod ]( elem, 'pointerdown', this );
  } else if ( window.navigator.msPointerEnabled ) {
    // IE10 Pointer Events
    eventie[ bindMethod ]( elem, 'MSPointerDown', this );
  } else {
    // listen for both, for devices like Chrome Pixel
    eventie[ bindMethod ]( elem, 'mousedown', this );
    eventie[ bindMethod ]( elem, 'touchstart', this );
  }
};

// trigger handler methods for events
Unipointer.prototype.handleEvent = function( event ) {
  var method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

// returns the touch that we're keeping track of
Unipointer.prototype.getTouch = function( touches ) {
  for ( var i=0, len = touches.length; i < len; i++ ) {
    var touch = touches[i];
    if ( touch.identifier == this.pointerIdentifier ) {
      return touch;
    }
  }
};

// ----- start event ----- //

Unipointer.prototype.onmousedown = function( event ) {
  // dismiss clicks from right or middle buttons
  var button = event.button;
  if ( button && ( button !== 0 && button !== 1 ) ) {
    return;
  }
  this._pointerDown( event, event );
};

Unipointer.prototype.ontouchstart = function( event ) {
  this._pointerDown( event, event.changedTouches[0] );
};

Unipointer.prototype.onMSPointerDown =
Unipointer.prototype.onpointerdown = function( event ) {
  this._pointerDown( event, event );
};

/**
 * pointer start
 * @param {Event} event
 * @param {Event or Touch} pointer
 */
Unipointer.prototype._pointerDown = function( event, pointer ) {
  // dismiss other pointers
  if ( this.isPointerDown ) {
    return;
  }

  this.isPointerDown = true;
  // save pointer identifier to match up touch events
  this.pointerIdentifier = pointer.pointerId !== undefined ?
    // pointerId for pointer events, touch.indentifier for touch events
    pointer.pointerId : pointer.identifier;

  this.pointerDown( event, pointer );
};

Unipointer.prototype.pointerDown = function( event, pointer ) {
  this._bindPostStartEvents( event );
  this.emitEvent( 'pointerDown', [ event, pointer ] );
};

// hash of events to be bound after start event
var postStartEvents = {
  mousedown: [ 'mousemove', 'mouseup' ],
  touchstart: [ 'touchmove', 'touchend', 'touchcancel' ],
  pointerdown: [ 'pointermove', 'pointerup', 'pointercancel' ],
  MSPointerDown: [ 'MSPointerMove', 'MSPointerUp', 'MSPointerCancel' ]
};

Unipointer.prototype._bindPostStartEvents = function( event ) {
  if ( !event ) {
    return;
  }
  // get proper events to match start event
  var events = postStartEvents[ event.type ];
  // IE8 needs to be bound to document
  var node = event.preventDefault ? window : document;
  // bind events to node
  for ( var i=0, len = events.length; i < len; i++ ) {
    var evnt = events[i];
    eventie.bind( node, evnt, this );
  }
  // save these arguments
  this._boundPointerEvents = {
    events: events,
    node: node
  };
};

Unipointer.prototype._unbindPostStartEvents = function() {
  var args = this._boundPointerEvents;
  // IE8 can trigger dragEnd twice, check for _boundEvents
  if ( !args || !args.events ) {
    return;
  }

  for ( var i=0, len = args.events.length; i < len; i++ ) {
    var event = args.events[i];
    eventie.unbind( args.node, event, this );
  }
  delete this._boundPointerEvents;
};

// ----- move event ----- //

Unipointer.prototype.onmousemove = function( event ) {
  this._pointerMove( event, event );
};

Unipointer.prototype.onMSPointerMove =
Unipointer.prototype.onpointermove = function( event ) {
  if ( event.pointerId == this.pointerIdentifier ) {
    this._pointerMove( event, event );
  }
};

Unipointer.prototype.ontouchmove = function( event ) {
  var touch = this.getTouch( event.changedTouches );
  if ( touch ) {
    this._pointerMove( event, touch );
  }
};

/**
 * pointer move
 * @param {Event} event
 * @param {Event or Touch} pointer
 * @private
 */
Unipointer.prototype._pointerMove = function( event, pointer ) {
  this.pointerMove( event, pointer );
};

// public
Unipointer.prototype.pointerMove = function( event, pointer ) {
  this.emitEvent( 'pointerMove', [ event, pointer ] );
};

// ----- end event ----- //


Unipointer.prototype.onmouseup = function( event ) {
  this._pointerUp( event, event );
};

Unipointer.prototype.onMSPointerUp =
Unipointer.prototype.onpointerup = function( event ) {
  if ( event.pointerId == this.pointerIdentifier ) {
    this._pointerUp( event, event );
  }
};

Unipointer.prototype.ontouchend = function( event ) {
  var touch = this.getTouch( event.changedTouches );
  if ( touch ) {
    this._pointerUp( event, touch );
  }
};

/**
 * pointer up
 * @param {Event} event
 * @param {Event or Touch} pointer
 * @private
 */
Unipointer.prototype._pointerUp = function( event, pointer ) {
  this._pointerDone();
  this.pointerUp( event, pointer );
};

// public
Unipointer.prototype.pointerUp = function( event, pointer ) {
  this.emitEvent( 'pointerUp', [ event, pointer ] );
};

// ----- pointer done ----- //

// triggered on pointer up & pointer cancel
Unipointer.prototype._pointerDone = function() {
  // reset properties
  this.isPointerDown = false;
  delete this.pointerIdentifier;
  // remove events
  this._unbindPostStartEvents();
  this.pointerDone();
};

Unipointer.prototype.pointerDone = noop;

// ----- pointer cancel ----- //

Unipointer.prototype.onMSPointerCancel =
Unipointer.prototype.onpointercancel = function( event ) {
  if ( event.pointerId == this.pointerIdentifier ) {
    this._pointerCancel( event, event );
  }
};

Unipointer.prototype.ontouchcancel = function( event ) {
  var touch = this.getTouch( event.changedTouches );
  if ( touch ) {
    this._pointerCancel( event, touch );
  }
};

/**
 * pointer cancel
 * @param {Event} event
 * @param {Event or Touch} pointer
 * @private
 */
Unipointer.prototype._pointerCancel = function( event, pointer ) {
  this._pointerDone();
  this.pointerCancel( event, pointer );
};

// public
Unipointer.prototype.pointerCancel = function( event, pointer ) {
  this.emitEvent( 'pointerCancel', [ event, pointer ] );
};

// -----  ----- //

// utility function for getting x/y cooridinates from event, because IE8
Unipointer.getPointerPoint = function( pointer ) {
  return {
    x: pointer.pageX !== undefined ? pointer.pageX : pointer.clientX,
    y: pointer.pageY !== undefined ? pointer.pageY : pointer.clientY
  };
};

// -----  ----- //

return Unipointer;

}));

},{"eventie":18,"wolfy87-eventemitter":25}],22:[function(require,module,exports){
/*!
 * Tap listener v1.1.1
 * listens to taps
 * MIT license
 */

/*jshint browser: true, unused: true, undef: true, strict: true */

( function( window, factory ) {
  /*global define: false, module: false, require: false */
  'use strict';
  // universal module definition

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
      'unipointer/unipointer'
    ], function( Unipointer ) {
      return factory( window, Unipointer );
    });
  } else if ( typeof exports == 'object' ) {
    // CommonJS
    module.exports = factory(
      window,
      require('unipointer')
    );
  } else {
    // browser global
    window.TapListener = factory(
      window,
      window.Unipointer
    );
  }

}( window, function factory( window, Unipointer ) {

'use strict';

// handle IE8 prevent default
function preventDefaultEvent( event ) {
  if ( event.preventDefault ) {
    event.preventDefault();
  } else {
    event.returnValue = false;
  }
}

// --------------------------  TapListener -------------------------- //

function TapListener( elem ) {
  this.bindTap( elem );
}

// inherit Unipointer & EventEmitter
TapListener.prototype = new Unipointer();

/**
 * bind tap event to element
 * @param {Element} elem
 */
TapListener.prototype.bindTap = function( elem ) {
  if ( !elem ) {
    return;
  }
  this.unbindTap();
  this.tapElement = elem;
  this._bindStartEvent( elem, true );
};

TapListener.prototype.unbindTap = function() {
  if ( !this.tapElement ) {
    return;
  }
  this._bindStartEvent( this.tapElement, true );
  delete this.tapElement;
};

var pointerDown = TapListener.prototype.pointerDown;

TapListener.prototype.pointerDown = function( event ) {
  // prevent default event for touch, disables tap then click
  if ( event.type == 'touchstart' ) {
    preventDefaultEvent( event );
  }
  pointerDown.apply( this, arguments );
};

var isPageOffset = window.pageYOffset !== undefined;
/**
 * pointer up
 * @param {Event} event
 * @param {Event or Touch} pointer
 */
TapListener.prototype.pointerUp = function( event, pointer ) {
  var pointerPoint = Unipointer.getPointerPoint( pointer );
  var boundingRect = this.tapElement.getBoundingClientRect();
  // standard or IE8 scroll positions
  var scrollX = isPageOffset ? window.pageXOffset : document.body.scrollLeft;
  var scrollY = isPageOffset ? window.pageYOffset : document.body.scrollTop;
  // calculate if pointer is inside tapElement
  var isInside = pointerPoint.x >= boundingRect.left + scrollX &&
    pointerPoint.x <= boundingRect.right + scrollX &&
    pointerPoint.y >= boundingRect.top + scrollY &&
    pointerPoint.y <= boundingRect.bottom + scrollY;
  // trigger callback if pointer is inside element
  if ( isInside ) {
    this.emitEvent( 'tap', [ event, pointer ] );
  }
};

TapListener.prototype.destroy = function() {
  this.pointerDone();
  this.unbindTap();
};

// -----  ----- //

return TapListener;

}));

},{"unipointer":21}],23:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21,"eventie":18,"wolfy87-eventemitter":25}],24:[function(require,module,exports){
/*!
 * Unidragger v1.1.3
 * Draggable base class
 * MIT license
 */

/*jshint browser: true, unused: true, undef: true, strict: true */

( function( window, factory ) {
  /*global define: false, module: false, require: false */
  'use strict';
  // universal module definition

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
      'eventie/eventie',
      'unipointer/unipointer'
    ], function( eventie, Unipointer ) {
      return factory( window, eventie, Unipointer );
    });
  } else if ( typeof exports == 'object' ) {
    // CommonJS
    module.exports = factory(
      window,
      require('eventie'),
      require('unipointer')
    );
  } else {
    // browser global
    window.Unidragger = factory(
      window,
      window.eventie,
      window.Unipointer
    );
  }

}( window, function factory( window, eventie, Unipointer ) {

'use strict';

// -----  ----- //

function noop() {}

// handle IE8 prevent default
function preventDefaultEvent( event ) {
  if ( event.preventDefault ) {
    event.preventDefault();
  } else {
    event.returnValue = false;
  }
}

// -------------------------- Unidragger -------------------------- //

function Unidragger() {}

// inherit Unipointer & EventEmitter
Unidragger.prototype = new Unipointer();

// ----- bind start ----- //

Unidragger.prototype.bindHandles = function() {
  this._bindHandles( true );
};

Unidragger.prototype.unbindHandles = function() {
  this._bindHandles( false );
};

var navigator = window.navigator;
/**
 * works as unbinder, as you can .bindHandles( false ) to unbind
 * @param {Boolean} isBind - will unbind if falsey
 */
Unidragger.prototype._bindHandles = function( isBind ) {
  // munge isBind, default to true
  isBind = isBind === undefined ? true : !!isBind;
  // extra bind logic
  var binderExtra;
  if ( navigator.pointerEnabled ) {
    binderExtra = function( handle ) {
      // disable scrolling on the element
      handle.style.touchAction = isBind ? 'none' : '';
    };
  } else if ( navigator.msPointerEnabled ) {
    binderExtra = function( handle ) {
      // disable scrolling on the element
      handle.style.msTouchAction = isBind ? 'none' : '';
    };
  } else {
    binderExtra = function() {
      // TODO re-enable img.ondragstart when unbinding
      if ( isBind ) {
        disableImgOndragstart( handle );
      }
    };
  }
  // bind each handle
  var bindMethod = isBind ? 'bind' : 'unbind';
  for ( var i=0, len = this.handles.length; i < len; i++ ) {
    var handle = this.handles[i];
    this._bindStartEvent( handle, isBind );
    binderExtra( handle );
    eventie[ bindMethod ]( handle, 'click', this );
  }
};

// remove default dragging interaction on all images in IE8
// IE8 does its own drag thing on images, which messes stuff up

function noDragStart() {
  return false;
}

// TODO replace this with a IE8 test
var isIE8 = 'attachEvent' in document.documentElement;

// IE8 only
var disableImgOndragstart = !isIE8 ? noop : function( handle ) {

  if ( handle.nodeName == 'IMG' ) {
    handle.ondragstart = noDragStart;
  }

  var images = handle.querySelectorAll('img');
  for ( var i=0, len = images.length; i < len; i++ ) {
    var img = images[i];
    img.ondragstart = noDragStart;
  }
};

// ----- start event ----- //

/**
 * pointer start
 * @param {Event} event
 * @param {Event or Touch} pointer
 */
Unidragger.prototype.pointerDown = function( event, pointer ) {
  this._dragPointerDown( event, pointer );
  // kludge to blur focused inputs in dragger
  var focused = document.activeElement;
  if ( focused && focused.blur ) {
    focused.blur();
  }
  // bind move and end events
  this._bindPostStartEvents( event );
  this.emitEvent( 'pointerDown', [ event, pointer ] );
};

// base pointer down logic
Unidragger.prototype._dragPointerDown = function( event, pointer ) {
  // track to see when dragging starts
  this.pointerDownPoint = Unipointer.getPointerPoint( pointer );

  // prevent default, unless touchstart or <select>
  var isTouchstart = event.type == 'touchstart';
  var targetNodeName = event.target.nodeName;
  if ( !isTouchstart && targetNodeName != 'SELECT' ) {
    preventDefaultEvent( event );
  }
};

// ----- move event ----- //

/**
 * drag move
 * @param {Event} event
 * @param {Event or Touch} pointer
 */
Unidragger.prototype.pointerMove = function( event, pointer ) {
  var moveVector = this._dragPointerMove( event, pointer );
  this.emitEvent( 'pointerMove', [ event, pointer, moveVector ] );
  this._dragMove( event, pointer, moveVector );
};

// base pointer move logic
Unidragger.prototype._dragPointerMove = function( event, pointer ) {
  var movePoint = Unipointer.getPointerPoint( pointer );
  var moveVector = {
    x: movePoint.x - this.pointerDownPoint.x,
    y: movePoint.y - this.pointerDownPoint.y
  };
  // start drag if pointer has moved far enough to start drag
  if ( !this.isDragging && this.hasDragStarted( moveVector ) ) {
    this._dragStart( event, pointer );
  }
  return moveVector;
};

// condition if pointer has moved far enough to start drag
Unidragger.prototype.hasDragStarted = function( moveVector ) {
  return Math.abs( moveVector.x ) > 3 || Math.abs( moveVector.y ) > 3;
};


// ----- end event ----- //

/**
 * pointer up
 * @param {Event} event
 * @param {Event or Touch} pointer
 */
Unidragger.prototype.pointerUp = function( event, pointer ) {
  this.emitEvent( 'pointerUp', [ event, pointer ] );
  this._dragPointerUp( event, pointer );
};

Unidragger.prototype._dragPointerUp = function( event, pointer ) {
  if ( this.isDragging ) {
    this._dragEnd( event, pointer );
  } else {
    // pointer didn't move enough for drag to start
    this._staticClick( event, pointer );
  }
};

// -------------------------- drag -------------------------- //

// dragStart
Unidragger.prototype._dragStart = function( event, pointer ) {
  this.isDragging = true;
  this.dragStartPoint = Unidragger.getPointerPoint( pointer );
  // prevent clicks
  this.isPreventingClicks = true;

  this.dragStart( event, pointer );
};

Unidragger.prototype.dragStart = function( event, pointer ) {
  this.emitEvent( 'dragStart', [ event, pointer ] );
};

// dragMove
Unidragger.prototype._dragMove = function( event, pointer, moveVector ) {
  // do not drag if not dragging yet
  if ( !this.isDragging ) {
    return;
  }

  this.dragMove( event, pointer, moveVector );
};

Unidragger.prototype.dragMove = function( event, pointer, moveVector ) {
  preventDefaultEvent( event );
  this.emitEvent( 'dragMove', [ event, pointer, moveVector ] );
};

// dragEnd
Unidragger.prototype._dragEnd = function( event, pointer ) {
  // set flags
  this.isDragging = false;
  // re-enable clicking async
  var _this = this;
  setTimeout( function() {
    delete _this.isPreventingClicks;
  });

  this.dragEnd( event, pointer );
};

Unidragger.prototype.dragEnd = function( event, pointer ) {
  this.emitEvent( 'dragEnd', [ event, pointer ] );
};

// ----- onclick ----- //

// handle all clicks and prevent clicks when dragging
Unidragger.prototype.onclick = function( event ) {
  if ( this.isPreventingClicks ) {
    preventDefaultEvent( event );
  }
};

// ----- staticClick ----- //

// triggered after pointer down & up with no/tiny movement
Unidragger.prototype._staticClick = function( event, pointer ) {
  // allow click in <input>s and <textarea>s
  var nodeName = event.target.nodeName;
  if ( nodeName == 'INPUT' || nodeName == 'TEXTAREA' ) {
    event.target.focus();
  }
  this.staticClick( event, pointer );
};

Unidragger.prototype.staticClick = function( event, pointer ) {
  this.emitEvent( 'staticClick', [ event, pointer ] );
};

// -----  ----- //

Unidragger.getPointerPoint = function( pointer ) {
  return {
    x: pointer.pageX !== undefined ? pointer.pageX : pointer.clientX,
    y: pointer.pageY !== undefined ? pointer.pageY : pointer.clientY
  };
};

// -----  ----- //

Unidragger.getPointerPoint = Unipointer.getPointerPoint;

return Unidragger;

}));

},{"eventie":18,"unipointer":23}],25:[function(require,module,exports){
arguments[4][4][0].apply(exports,arguments)
},{"dup":4}],26:[function(require,module,exports){
var $ = (window.jQuery)
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
},{"./lib/scroll-nav":27,"flickity":10,"flickity-imagesloaded":1}],27:[function(require,module,exports){
var $ = (window.jQuery)
require('jquery-mousewheel')($)

var Velocity = require('velocity')

var ScrollNav = function() {
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
}

ScrollNav.prototype = {
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
    this.$targets = $(targetElements).add('#home').add(this.footer)
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

    var atHome = !$(active).length && scrollY < window.innerHeight

    $('body').toggleClass('at-home', atHome)

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
    this.$targets.velocity('stop')

    Velocity(el, 'scroll', {
      duration: 600,
      easing: this.easing,
      offset: function() {
        var offset = (window.innerHeight - el.offsetHeight) * -1

        if(offset >= window.innerHeight) {
          return 0
        } else {
          return offset
        }
      }()
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
    } else {
      $('.home-link').trigger('click')
    }
  }
}

module.exports = ScrollNav
},{"jquery-mousewheel":"jquery-mousewheel","velocity":"velocity"}],"jquery-mousewheel":[function(require,module,exports){
/*! Copyright (c) 2013 Brandon Aaron (http://brandon.aaron.sh)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Version: 3.1.12
 *
 * Requires: jQuery 1.2.2+
 */

(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS style for Browserify
        module.exports = factory;
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    var toFix  = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'],
        toBind = ( 'onwheel' in document || document.documentMode >= 9 ) ?
                    ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'],
        slice  = Array.prototype.slice,
        nullLowestDeltaTimeout, lowestDelta;

    if ( $.event.fixHooks ) {
        for ( var i = toFix.length; i; ) {
            $.event.fixHooks[ toFix[--i] ] = $.event.mouseHooks;
        }
    }

    var special = $.event.special.mousewheel = {
        version: '3.1.12',

        setup: function() {
            if ( this.addEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.addEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = handler;
            }
            // Store the line height and page height for this particular element
            $.data(this, 'mousewheel-line-height', special.getLineHeight(this));
            $.data(this, 'mousewheel-page-height', special.getPageHeight(this));
        },

        teardown: function() {
            if ( this.removeEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.removeEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = null;
            }
            // Clean up the data we added to the element
            $.removeData(this, 'mousewheel-line-height');
            $.removeData(this, 'mousewheel-page-height');
        },

        getLineHeight: function(elem) {
            var $elem = $(elem),
                $parent = $elem['offsetParent' in $.fn ? 'offsetParent' : 'parent']();
            if (!$parent.length) {
                $parent = $('body');
            }
            return parseInt($parent.css('fontSize'), 10) || parseInt($elem.css('fontSize'), 10) || 16;
        },

        getPageHeight: function(elem) {
            return $(elem).height();
        },

        settings: {
            adjustOldDeltas: true, // see shouldAdjustOldDeltas() below
            normalizeOffset: true  // calls getBoundingClientRect for each event
        }
    };

    $.fn.extend({
        mousewheel: function(fn) {
            return fn ? this.bind('mousewheel', fn) : this.trigger('mousewheel');
        },

        unmousewheel: function(fn) {
            return this.unbind('mousewheel', fn);
        }
    });


    function handler(event) {
        var orgEvent   = event || window.event,
            args       = slice.call(arguments, 1),
            delta      = 0,
            deltaX     = 0,
            deltaY     = 0,
            absDelta   = 0,
            offsetX    = 0,
            offsetY    = 0;
        event = $.event.fix(orgEvent);
        event.type = 'mousewheel';

        // Old school scrollwheel delta
        if ( 'detail'      in orgEvent ) { deltaY = orgEvent.detail * -1;      }
        if ( 'wheelDelta'  in orgEvent ) { deltaY = orgEvent.wheelDelta;       }
        if ( 'wheelDeltaY' in orgEvent ) { deltaY = orgEvent.wheelDeltaY;      }
        if ( 'wheelDeltaX' in orgEvent ) { deltaX = orgEvent.wheelDeltaX * -1; }

        // Firefox < 17 horizontal scrolling related to DOMMouseScroll event
        if ( 'axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
            deltaX = deltaY * -1;
            deltaY = 0;
        }

        // Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy
        delta = deltaY === 0 ? deltaX : deltaY;

        // New school wheel delta (wheel event)
        if ( 'deltaY' in orgEvent ) {
            deltaY = orgEvent.deltaY * -1;
            delta  = deltaY;
        }
        if ( 'deltaX' in orgEvent ) {
            deltaX = orgEvent.deltaX;
            if ( deltaY === 0 ) { delta  = deltaX * -1; }
        }

        // No change actually happened, no reason to go any further
        if ( deltaY === 0 && deltaX === 0 ) { return; }

        // Need to convert lines and pages to pixels if we aren't already in pixels
        // There are three delta modes:
        //   * deltaMode 0 is by pixels, nothing to do
        //   * deltaMode 1 is by lines
        //   * deltaMode 2 is by pages
        if ( orgEvent.deltaMode === 1 ) {
            var lineHeight = $.data(this, 'mousewheel-line-height');
            delta  *= lineHeight;
            deltaY *= lineHeight;
            deltaX *= lineHeight;
        } else if ( orgEvent.deltaMode === 2 ) {
            var pageHeight = $.data(this, 'mousewheel-page-height');
            delta  *= pageHeight;
            deltaY *= pageHeight;
            deltaX *= pageHeight;
        }

        // Store lowest absolute delta to normalize the delta values
        absDelta = Math.max( Math.abs(deltaY), Math.abs(deltaX) );

        if ( !lowestDelta || absDelta < lowestDelta ) {
            lowestDelta = absDelta;

            // Adjust older deltas if necessary
            if ( shouldAdjustOldDeltas(orgEvent, absDelta) ) {
                lowestDelta /= 40;
            }
        }

        // Adjust older deltas if necessary
        if ( shouldAdjustOldDeltas(orgEvent, absDelta) ) {
            // Divide all the things by 40!
            delta  /= 40;
            deltaX /= 40;
            deltaY /= 40;
        }

        // Get a whole, normalized value for the deltas
        delta  = Math[ delta  >= 1 ? 'floor' : 'ceil' ](delta  / lowestDelta);
        deltaX = Math[ deltaX >= 1 ? 'floor' : 'ceil' ](deltaX / lowestDelta);
        deltaY = Math[ deltaY >= 1 ? 'floor' : 'ceil' ](deltaY / lowestDelta);

        // Normalise offsetX and offsetY properties
        if ( special.settings.normalizeOffset && this.getBoundingClientRect ) {
            var boundingRect = this.getBoundingClientRect();
            offsetX = event.clientX - boundingRect.left;
            offsetY = event.clientY - boundingRect.top;
        }

        // Add information to the event object
        event.deltaX = deltaX;
        event.deltaY = deltaY;
        event.deltaFactor = lowestDelta;
        event.offsetX = offsetX;
        event.offsetY = offsetY;
        // Go ahead and set deltaMode to 0 since we converted to pixels
        // Although this is a little odd since we overwrite the deltaX/Y
        // properties with normalized deltas.
        event.deltaMode = 0;

        // Add event and delta to the front of the arguments
        args.unshift(event, delta, deltaX, deltaY);

        // Clearout lowestDelta after sometime to better
        // handle multiple device types that give different
        // a different lowestDelta
        // Ex: trackpad = 3 and mouse wheel = 120
        if (nullLowestDeltaTimeout) { clearTimeout(nullLowestDeltaTimeout); }
        nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);

        return ($.event.dispatch || $.event.handle).apply(this, args);
    }

    function nullLowestDelta() {
        lowestDelta = null;
    }

    function shouldAdjustOldDeltas(orgEvent, absDelta) {
        // If this is an older event and the delta is divisable by 120,
        // then we are assuming that the browser is treating this as an
        // older mouse wheel event and that we should divide the deltas
        // by 40 to try and get a more usable deltaFactor.
        // Side note, this actually impacts the reported scroll distance
        // in older browsers and can cause scrolling to be slower than native.
        // Turn this off by setting $.event.special.mousewheel.settings.adjustOldDeltas to false.
        return special.settings.adjustOldDeltas && orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
    }

}));

},{}],"velocity":[function(require,module,exports){
/*! VelocityJS.org (1.2.2). (C) 2014 Julian Shapiro. MIT @license: en.wikipedia.org/wiki/MIT_License */

/*************************
   Velocity jQuery Shim
*************************/

/*! VelocityJS.org jQuery Shim (1.0.1). (C) 2014 The jQuery Foundation. MIT @license: en.wikipedia.org/wiki/MIT_License. */

/* This file contains the jQuery functions that Velocity relies on, thereby removing Velocity's dependency on a full copy of jQuery, and allowing it to work in any environment. */
/* These shimmed functions are only used if jQuery isn't present. If both this shim and jQuery are loaded, Velocity defaults to jQuery proper. */
/* Browser support: Using this shim instead of jQuery proper removes support for IE8. */

;(function (window) {
    /***************
         Setup
    ***************/

    /* If jQuery is already loaded, there's no point in loading this shim. */
    if (window.jQuery) {
        return;
    }

    /* jQuery base. */
    var $ = function (selector, context) {
        return new $.fn.init(selector, context);
    };

    /********************
       Private Methods
    ********************/

    /* jQuery */
    $.isWindow = function (obj) {
        /* jshint eqeqeq: false */
        return obj != null && obj == obj.window;
    };

    /* jQuery */
    $.type = function (obj) {
        if (obj == null) {
            return obj + "";
        }

        return typeof obj === "object" || typeof obj === "function" ?
            class2type[toString.call(obj)] || "object" :
            typeof obj;
    };

    /* jQuery */
    $.isArray = Array.isArray || function (obj) {
        return $.type(obj) === "array";
    };

    /* jQuery */
    function isArraylike (obj) {
        var length = obj.length,
            type = $.type(obj);

        if (type === "function" || $.isWindow(obj)) {
            return false;
        }

        if (obj.nodeType === 1 && length) {
            return true;
        }

        return type === "array" || length === 0 || typeof length === "number" && length > 0 && (length - 1) in obj;
    }

    /***************
       $ Methods
    ***************/

    /* jQuery: Support removed for IE<9. */
    $.isPlainObject = function (obj) {
        var key;

        if (!obj || $.type(obj) !== "object" || obj.nodeType || $.isWindow(obj)) {
            return false;
        }

        try {
            if (obj.constructor &&
                !hasOwn.call(obj, "constructor") &&
                !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
                return false;
            }
        } catch (e) {
            return false;
        }

        for (key in obj) {}

        return key === undefined || hasOwn.call(obj, key);
    };

    /* jQuery */
    $.each = function(obj, callback, args) {
        var value,
            i = 0,
            length = obj.length,
            isArray = isArraylike(obj);

        if (args) {
            if (isArray) {
                for (; i < length; i++) {
                    value = callback.apply(obj[i], args);

                    if (value === false) {
                        break;
                    }
                }
            } else {
                for (i in obj) {
                    value = callback.apply(obj[i], args);

                    if (value === false) {
                        break;
                    }
                }
            }

        } else {
            if (isArray) {
                for (; i < length; i++) {
                    value = callback.call(obj[i], i, obj[i]);

                    if (value === false) {
                        break;
                    }
                }
            } else {
                for (i in obj) {
                    value = callback.call(obj[i], i, obj[i]);

                    if (value === false) {
                        break;
                    }
                }
            }
        }

        return obj;
    };

    /* Custom */
    $.data = function (node, key, value) {
        /* $.getData() */
        if (value === undefined) {
            var id = node[$.expando],
                store = id && cache[id];

            if (key === undefined) {
                return store;
            } else if (store) {
                if (key in store) {
                    return store[key];
                }
            }
        /* $.setData() */
        } else if (key !== undefined) {
            var id = node[$.expando] || (node[$.expando] = ++$.uuid);

            cache[id] = cache[id] || {};
            cache[id][key] = value;

            return value;
        }
    };

    /* Custom */
    $.removeData = function (node, keys) {
        var id = node[$.expando],
            store = id && cache[id];

        if (store) {
            $.each(keys, function(_, key) {
                delete store[key];
            });
        }
    };

    /* jQuery */
    $.extend = function () {
        var src, copyIsArray, copy, name, options, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;

        if (typeof target === "boolean") {
            deep = target;

            target = arguments[i] || {};
            i++;
        }

        if (typeof target !== "object" && $.type(target) !== "function") {
            target = {};
        }

        if (i === length) {
            target = this;
            i--;
        }

        for (; i < length; i++) {
            if ((options = arguments[i]) != null) {
                for (name in options) {
                    src = target[name];
                    copy = options[name];

                    if (target === copy) {
                        continue;
                    }

                    if (deep && copy && ($.isPlainObject(copy) || (copyIsArray = $.isArray(copy)))) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && $.isArray(src) ? src : [];

                        } else {
                            clone = src && $.isPlainObject(src) ? src : {};
                        }

                        target[name] = $.extend(deep, clone, copy);

                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }

        return target;
    };

    /* jQuery 1.4.3 */
    $.queue = function (elem, type, data) {
        function $makeArray (arr, results) {
            var ret = results || [];

            if (arr != null) {
                if (isArraylike(Object(arr))) {
                    /* $.merge */
                    (function(first, second) {
                        var len = +second.length,
                            j = 0,
                            i = first.length;

                        while (j < len) {
                            first[i++] = second[j++];
                        }

                        if (len !== len) {
                            while (second[j] !== undefined) {
                                first[i++] = second[j++];
                            }
                        }

                        first.length = i;

                        return first;
                    })(ret, typeof arr === "string" ? [arr] : arr);
                } else {
                    [].push.call(ret, arr);
                }
            }

            return ret;
        }

        if (!elem) {
            return;
        }

        type = (type || "fx") + "queue";

        var q = $.data(elem, type);

        if (!data) {
            return q || [];
        }

        if (!q || $.isArray(data)) {
            q = $.data(elem, type, $makeArray(data));
        } else {
            q.push(data);
        }

        return q;
    };

    /* jQuery 1.4.3 */
    $.dequeue = function (elems, type) {
        /* Custom: Embed element iteration. */
        $.each(elems.nodeType ? [ elems ] : elems, function(i, elem) {
            type = type || "fx";

            var queue = $.queue(elem, type),
                fn = queue.shift();

            if (fn === "inprogress") {
                fn = queue.shift();
            }

            if (fn) {
                if (type === "fx") {
                    queue.unshift("inprogress");
                }

                fn.call(elem, function() {
                    $.dequeue(elem, type);
                });
            }
        });
    };

    /******************
       $.fn Methods
    ******************/

    /* jQuery */
    $.fn = $.prototype = {
        init: function (selector) {
            /* Just return the element wrapped inside an array; don't proceed with the actual jQuery node wrapping process. */
            if (selector.nodeType) {
                this[0] = selector;

                return this;
            } else {
                throw new Error("Not a DOM node.");
            }
        },

        offset: function () {
            /* jQuery altered code: Dropped disconnected DOM node checking. */
            var box = this[0].getBoundingClientRect ? this[0].getBoundingClientRect() : { top: 0, left: 0 };

            return {
                top: box.top + (window.pageYOffset || document.scrollTop  || 0)  - (document.clientTop  || 0),
                left: box.left + (window.pageXOffset || document.scrollLeft  || 0) - (document.clientLeft || 0)
            };
        },

        position: function () {
            /* jQuery */
            function offsetParent() {
                var offsetParent = this.offsetParent || document;

                while (offsetParent && (!offsetParent.nodeType.toLowerCase === "html" && offsetParent.style.position === "static")) {
                    offsetParent = offsetParent.offsetParent;
                }

                return offsetParent || document;
            }

            /* Zepto */
            var elem = this[0],
                offsetParent = offsetParent.apply(elem),
                offset = this.offset(),
                parentOffset = /^(?:body|html)$/i.test(offsetParent.nodeName) ? { top: 0, left: 0 } : $(offsetParent).offset()

            offset.top -= parseFloat(elem.style.marginTop) || 0;
            offset.left -= parseFloat(elem.style.marginLeft) || 0;

            if (offsetParent.style) {
                parentOffset.top += parseFloat(offsetParent.style.borderTopWidth) || 0
                parentOffset.left += parseFloat(offsetParent.style.borderLeftWidth) || 0
            }

            return {
                top: offset.top - parentOffset.top,
                left: offset.left - parentOffset.left
            };
        }
    };

    /**********************
       Private Variables
    **********************/

    /* For $.data() */
    var cache = {};
    $.expando = "velocity" + (new Date().getTime());
    $.uuid = 0;

    /* For $.queue() */
    var class2type = {},
        hasOwn = class2type.hasOwnProperty,
        toString = class2type.toString;

    var types = "Boolean Number String Function Array Date RegExp Object Error".split(" ");
    for (var i = 0; i < types.length; i++) {
        class2type["[object " + types[i] + "]"] = types[i].toLowerCase();
    }

    /* Makes $(node) possible, without having to call init. */
    $.fn.init.prototype = $.fn;

    /* Globalize Velocity onto the window, and assign its Utilities property. */
    window.Velocity = { Utilities: $ };
})(window);

/******************
    Velocity.js
******************/

;(function (factory) {
    /* CommonJS module. */
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = factory();
    /* AMD module. */
    } else if (typeof define === "function" && define.amd) {
        define(factory);
    /* Browser globals. */
    } else {
        factory();
    }
}(function() {
return function (global, window, document, undefined) {

    /***************
        Summary
    ***************/

    /*
    - CSS: CSS stack that works independently from the rest of Velocity.
    - animate(): Core animation method that iterates over the targeted elements and queues the incoming call onto each element individually.
      - Pre-Queueing: Prepare the element for animation by instantiating its data cache and processing the call's options.
      - Queueing: The logic that runs once the call has reached its point of execution in the element's $.queue() stack.
                  Most logic is placed here to avoid risking it becoming stale (if the element's properties have changed).
      - Pushing: Consolidation of the tween data followed by its push onto the global in-progress calls container.
    - tick(): The single requestAnimationFrame loop responsible for tweening all in-progress calls.
    - completeCall(): Handles the cleanup process for each Velocity call.
    */

    /*********************
       Helper Functions
    *********************/

    /* IE detection. Gist: https://gist.github.com/julianshapiro/9098609 */
    var IE = (function() {
        if (document.documentMode) {
            return document.documentMode;
        } else {
            for (var i = 7; i > 4; i--) {
                var div = document.createElement("div");

                div.innerHTML = "<!--[if IE " + i + "]><span></span><![endif]-->";

                if (div.getElementsByTagName("span").length) {
                    div = null;

                    return i;
                }
            }
        }

        return undefined;
    })();

    /* rAF shim. Gist: https://gist.github.com/julianshapiro/9497513 */
    var rAFShim = (function() {
        var timeLast = 0;

        return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(callback) {
            var timeCurrent = (new Date()).getTime(),
                timeDelta;

            /* Dynamically set delay on a per-tick basis to match 60fps. */
            /* Technique by Erik Moller. MIT license: https://gist.github.com/paulirish/1579671 */
            timeDelta = Math.max(0, 16 - (timeCurrent - timeLast));
            timeLast = timeCurrent + timeDelta;

            return setTimeout(function() { callback(timeCurrent + timeDelta); }, timeDelta);
        };
    })();

    /* Array compacting. Copyright Lo-Dash. MIT License: https://github.com/lodash/lodash/blob/master/LICENSE.txt */
    function compactSparseArray (array) {
        var index = -1,
            length = array ? array.length : 0,
            result = [];

        while (++index < length) {
            var value = array[index];

            if (value) {
                result.push(value);
            }
        }

        return result;
    }

    function sanitizeElements (elements) {
        /* Unwrap jQuery/Zepto objects. */
        if (Type.isWrapped(elements)) {
            elements = [].slice.call(elements);
        /* Wrap a single element in an array so that $.each() can iterate with the element instead of its node's children. */
        } else if (Type.isNode(elements)) {
            elements = [ elements ];
        }

        return elements;
    }

    var Type = {
        isString: function (variable) {
            return (typeof variable === "string");
        },
        isArray: Array.isArray || function (variable) {
            return Object.prototype.toString.call(variable) === "[object Array]";
        },
        isFunction: function (variable) {
            return Object.prototype.toString.call(variable) === "[object Function]";
        },
        isNode: function (variable) {
            return variable && variable.nodeType;
        },
        /* Copyright Martin Bohm. MIT License: https://gist.github.com/Tomalak/818a78a226a0738eaade */
        isNodeList: function (variable) {
            return typeof variable === "object" &&
                /^\[object (HTMLCollection|NodeList|Object)\]$/.test(Object.prototype.toString.call(variable)) &&
                variable.length !== undefined &&
                (variable.length === 0 || (typeof variable[0] === "object" && variable[0].nodeType > 0));
        },
        /* Determine if variable is a wrapped jQuery or Zepto element. */
        isWrapped: function (variable) {
            return variable && (variable.jquery || (window.Zepto && window.Zepto.zepto.isZ(variable)));
        },
        isSVG: function (variable) {
            return window.SVGElement && (variable instanceof window.SVGElement);
        },
        isEmptyObject: function (variable) {
            for (var name in variable) {
                return false;
            }

            return true;
        }
    };

    /*****************
       Dependencies
    *****************/

    var $,
        isJQuery = false;

    if (global.fn && global.fn.jquery) {
        $ = global;
        isJQuery = true;
    } else {
        $ = window.Velocity.Utilities;
    }

    if (IE <= 8 && !isJQuery) {
        throw new Error("Velocity: IE8 and below require jQuery to be loaded before Velocity.");
    } else if (IE <= 7) {
        /* Revert to jQuery's $.animate(), and lose Velocity's extra features. */
        jQuery.fn.velocity = jQuery.fn.animate;

        /* Now that $.fn.velocity is aliased, abort this Velocity declaration. */
        return;
    }

    /*****************
        Constants
    *****************/

    var DURATION_DEFAULT = 400,
        EASING_DEFAULT = "swing";

    /*************
        State
    *************/

    var Velocity = {
        /* Container for page-wide Velocity state data. */
        State: {
            /* Detect mobile devices to determine if mobileHA should be turned on. */
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            /* The mobileHA option's behavior changes on older Android devices (Gingerbread, versions 2.3.3-2.3.7). */
            isAndroid: /Android/i.test(navigator.userAgent),
            isGingerbread: /Android 2\.3\.[3-7]/i.test(navigator.userAgent),
            isChrome: window.chrome,
            isFirefox: /Firefox/i.test(navigator.userAgent),
            /* Create a cached element for re-use when checking for CSS property prefixes. */
            prefixElement: document.createElement("div"),
            /* Cache every prefix match to avoid repeating lookups. */
            prefixMatches: {},
            /* Cache the anchor used for animating window scrolling. */
            scrollAnchor: null,
            /* Cache the browser-specific property names associated with the scroll anchor. */
            scrollPropertyLeft: null,
            scrollPropertyTop: null,
            /* Keep track of whether our RAF tick is running. */
            isTicking: false,
            /* Container for every in-progress call to Velocity. */
            calls: []
        },
        /* Velocity's custom CSS stack. Made global for unit testing. */
        CSS: { /* Defined below. */ },
        /* A shim of the jQuery utility functions used by Velocity -- provided by Velocity's optional jQuery shim. */
        Utilities: $,
        /* Container for the user's custom animation redirects that are referenced by name in place of the properties map argument. */
        Redirects: { /* Manually registered by the user. */ },
        Easings: { /* Defined below. */ },
        /* Attempt to use ES6 Promises by default. Users can override this with a third-party promises library. */
        Promise: window.Promise,
        /* Velocity option defaults, which can be overriden by the user. */
        defaults: {
            queue: "",
            duration: DURATION_DEFAULT,
            easing: EASING_DEFAULT,
            begin: undefined,
            complete: undefined,
            progress: undefined,
            display: undefined,
            visibility: undefined,
            loop: false,
            delay: false,
            mobileHA: true,
            /* Advanced: Set to false to prevent property values from being cached between consecutive Velocity-initiated chain calls. */
            _cacheValues: true
        },
        /* A design goal of Velocity is to cache data wherever possible in order to avoid DOM requerying. Accordingly, each element has a data cache. */
        init: function (element) {
            $.data(element, "velocity", {
                /* Store whether this is an SVG element, since its properties are retrieved and updated differently than standard HTML elements. */
                isSVG: Type.isSVG(element),
                /* Keep track of whether the element is currently being animated by Velocity.
                   This is used to ensure that property values are not transferred between non-consecutive (stale) calls. */
                isAnimating: false,
                /* A reference to the element's live computedStyle object. Learn more here: https://developer.mozilla.org/en/docs/Web/API/window.getComputedStyle */
                computedStyle: null,
                /* Tween data is cached for each animation on the element so that data can be passed across calls --
                   in particular, end values are used as subsequent start values in consecutive Velocity calls. */
                tweensContainer: null,
                /* The full root property values of each CSS hook being animated on this element are cached so that:
                   1) Concurrently-animating hooks sharing the same root can have their root values' merged into one while tweening.
                   2) Post-hook-injection root values can be transferred over to consecutively chained Velocity calls as starting root values. */
                rootPropertyValueCache: {},
                /* A cache for transform updates, which must be manually flushed via CSS.flushTransformCache(). */
                transformCache: {}
            });
        },
        /* A parallel to jQuery's $.css(), used for getting/setting Velocity's hooked CSS properties. */
        hook: null, /* Defined below. */
        /* Velocity-wide animation time remapping for testing purposes. */
        mock: false,
        version: { major: 1, minor: 2, patch: 2 },
        /* Set to 1 or 2 (most verbose) to output debug info to console. */
        debug: false
    };

    /* Retrieve the appropriate scroll anchor and property name for the browser: https://developer.mozilla.org/en-US/docs/Web/API/Window.scrollY */
    if (window.pageYOffset !== undefined) {
        Velocity.State.scrollAnchor = window;
        Velocity.State.scrollPropertyLeft = "pageXOffset";
        Velocity.State.scrollPropertyTop = "pageYOffset";
    } else {
        Velocity.State.scrollAnchor = document.documentElement || document.body.parentNode || document.body;
        Velocity.State.scrollPropertyLeft = "scrollLeft";
        Velocity.State.scrollPropertyTop = "scrollTop";
    }

    /* Shorthand alias for jQuery's $.data() utility. */
    function Data (element) {
        /* Hardcode a reference to the plugin name. */
        var response = $.data(element, "velocity");

        /* jQuery <=1.4.2 returns null instead of undefined when no match is found. We normalize this behavior. */
        return response === null ? undefined : response;
    };

    /**************
        Easing
    **************/

    /* Step easing generator. */
    function generateStep (steps) {
        return function (p) {
            return Math.round(p * steps) * (1 / steps);
        };
    }

    /* Bezier curve function generator. Copyright Gaetan Renaudeau. MIT License: http://en.wikipedia.org/wiki/MIT_License */
    function generateBezier (mX1, mY1, mX2, mY2) {
        var NEWTON_ITERATIONS = 4,
            NEWTON_MIN_SLOPE = 0.001,
            SUBDIVISION_PRECISION = 0.0000001,
            SUBDIVISION_MAX_ITERATIONS = 10,
            kSplineTableSize = 11,
            kSampleStepSize = 1.0 / (kSplineTableSize - 1.0),
            float32ArraySupported = "Float32Array" in window;

        /* Must contain four arguments. */
        if (arguments.length !== 4) {
            return false;
        }

        /* Arguments must be numbers. */
        for (var i = 0; i < 4; ++i) {
            if (typeof arguments[i] !== "number" || isNaN(arguments[i]) || !isFinite(arguments[i])) {
                return false;
            }
        }

        /* X values must be in the [0, 1] range. */
        mX1 = Math.min(mX1, 1);
        mX2 = Math.min(mX2, 1);
        mX1 = Math.max(mX1, 0);
        mX2 = Math.max(mX2, 0);

        var mSampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);

        function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
        function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
        function C (aA1)      { return 3.0 * aA1; }

        function calcBezier (aT, aA1, aA2) {
            return ((A(aA1, aA2)*aT + B(aA1, aA2))*aT + C(aA1))*aT;
        }

        function getSlope (aT, aA1, aA2) {
            return 3.0 * A(aA1, aA2)*aT*aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
        }

        function newtonRaphsonIterate (aX, aGuessT) {
            for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
                var currentSlope = getSlope(aGuessT, mX1, mX2);

                if (currentSlope === 0.0) return aGuessT;

                var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
                aGuessT -= currentX / currentSlope;
            }

            return aGuessT;
        }

        function calcSampleValues () {
            for (var i = 0; i < kSplineTableSize; ++i) {
                mSampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
            }
        }

        function binarySubdivide (aX, aA, aB) {
            var currentX, currentT, i = 0;

            do {
                currentT = aA + (aB - aA) / 2.0;
                currentX = calcBezier(currentT, mX1, mX2) - aX;
                if (currentX > 0.0) {
                  aB = currentT;
                } else {
                  aA = currentT;
                }
            } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);

            return currentT;
        }

        function getTForX (aX) {
            var intervalStart = 0.0,
                currentSample = 1,
                lastSample = kSplineTableSize - 1;

            for (; currentSample != lastSample && mSampleValues[currentSample] <= aX; ++currentSample) {
                intervalStart += kSampleStepSize;
            }

            --currentSample;

            var dist = (aX - mSampleValues[currentSample]) / (mSampleValues[currentSample+1] - mSampleValues[currentSample]),
                guessForT = intervalStart + dist * kSampleStepSize,
                initialSlope = getSlope(guessForT, mX1, mX2);

            if (initialSlope >= NEWTON_MIN_SLOPE) {
                return newtonRaphsonIterate(aX, guessForT);
            } else if (initialSlope == 0.0) {
                return guessForT;
            } else {
                return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize);
            }
        }

        var _precomputed = false;

        function precompute() {
            _precomputed = true;
            if (mX1 != mY1 || mX2 != mY2) calcSampleValues();
        }

        var f = function (aX) {
            if (!_precomputed) precompute();
            if (mX1 === mY1 && mX2 === mY2) return aX;
            if (aX === 0) return 0;
            if (aX === 1) return 1;

            return calcBezier(getTForX(aX), mY1, mY2);
        };

        f.getControlPoints = function() { return [{ x: mX1, y: mY1 }, { x: mX2, y: mY2 }]; };

        var str = "generateBezier(" + [mX1, mY1, mX2, mY2] + ")";
        f.toString = function () { return str; };

        return f;
    }

    /* Runge-Kutta spring physics function generator. Adapted from Framer.js, copyright Koen Bok. MIT License: http://en.wikipedia.org/wiki/MIT_License */
    /* Given a tension, friction, and duration, a simulation at 60FPS will first run without a defined duration in order to calculate the full path. A second pass
       then adjusts the time delta -- using the relation between actual time and duration -- to calculate the path for the duration-constrained animation. */
    var generateSpringRK4 = (function () {
        function springAccelerationForState (state) {
            return (-state.tension * state.x) - (state.friction * state.v);
        }

        function springEvaluateStateWithDerivative (initialState, dt, derivative) {
            var state = {
                x: initialState.x + derivative.dx * dt,
                v: initialState.v + derivative.dv * dt,
                tension: initialState.tension,
                friction: initialState.friction
            };

            return { dx: state.v, dv: springAccelerationForState(state) };
        }

        function springIntegrateState (state, dt) {
            var a = {
                    dx: state.v,
                    dv: springAccelerationForState(state)
                },
                b = springEvaluateStateWithDerivative(state, dt * 0.5, a),
                c = springEvaluateStateWithDerivative(state, dt * 0.5, b),
                d = springEvaluateStateWithDerivative(state, dt, c),
                dxdt = 1.0 / 6.0 * (a.dx + 2.0 * (b.dx + c.dx) + d.dx),
                dvdt = 1.0 / 6.0 * (a.dv + 2.0 * (b.dv + c.dv) + d.dv);

            state.x = state.x + dxdt * dt;
            state.v = state.v + dvdt * dt;

            return state;
        }

        return function springRK4Factory (tension, friction, duration) {

            var initState = {
                    x: -1,
                    v: 0,
                    tension: null,
                    friction: null
                },
                path = [0],
                time_lapsed = 0,
                tolerance = 1 / 10000,
                DT = 16 / 1000,
                have_duration, dt, last_state;

            tension = parseFloat(tension) || 500;
            friction = parseFloat(friction) || 20;
            duration = duration || null;

            initState.tension = tension;
            initState.friction = friction;

            have_duration = duration !== null;

            /* Calculate the actual time it takes for this animation to complete with the provided conditions. */
            if (have_duration) {
                /* Run the simulation without a duration. */
                time_lapsed = springRK4Factory(tension, friction);
                /* Compute the adjusted time delta. */
                dt = time_lapsed / duration * DT;
            } else {
                dt = DT;
            }

            while (true) {
                /* Next/step function .*/
                last_state = springIntegrateState(last_state || initState, dt);
                /* Store the position. */
                path.push(1 + last_state.x);
                time_lapsed += 16;
                /* If the change threshold is reached, break. */
                if (!(Math.abs(last_state.x) > tolerance && Math.abs(last_state.v) > tolerance)) {
                    break;
                }
            }

            /* If duration is not defined, return the actual time required for completing this animation. Otherwise, return a closure that holds the
               computed path and returns a snapshot of the position according to a given percentComplete. */
            return !have_duration ? time_lapsed : function(percentComplete) { return path[ (percentComplete * (path.length - 1)) | 0 ]; };
        };
    }());

    /* jQuery easings. */
    Velocity.Easings = {
        linear: function(p) { return p; },
        swing: function(p) { return 0.5 - Math.cos( p * Math.PI ) / 2 },
        /* Bonus "spring" easing, which is a less exaggerated version of easeInOutElastic. */
        spring: function(p) { return 1 - (Math.cos(p * 4.5 * Math.PI) * Math.exp(-p * 6)); }
    };

    /* CSS3 and Robert Penner easings. */
    $.each(
        [
            [ "ease", [ 0.25, 0.1, 0.25, 1.0 ] ],
            [ "ease-in", [ 0.42, 0.0, 1.00, 1.0 ] ],
            [ "ease-out", [ 0.00, 0.0, 0.58, 1.0 ] ],
            [ "ease-in-out", [ 0.42, 0.0, 0.58, 1.0 ] ],
            [ "easeInSine", [ 0.47, 0, 0.745, 0.715 ] ],
            [ "easeOutSine", [ 0.39, 0.575, 0.565, 1 ] ],
            [ "easeInOutSine", [ 0.445, 0.05, 0.55, 0.95 ] ],
            [ "easeInQuad", [ 0.55, 0.085, 0.68, 0.53 ] ],
            [ "easeOutQuad", [ 0.25, 0.46, 0.45, 0.94 ] ],
            [ "easeInOutQuad", [ 0.455, 0.03, 0.515, 0.955 ] ],
            [ "easeInCubic", [ 0.55, 0.055, 0.675, 0.19 ] ],
            [ "easeOutCubic", [ 0.215, 0.61, 0.355, 1 ] ],
            [ "easeInOutCubic", [ 0.645, 0.045, 0.355, 1 ] ],
            [ "easeInQuart", [ 0.895, 0.03, 0.685, 0.22 ] ],
            [ "easeOutQuart", [ 0.165, 0.84, 0.44, 1 ] ],
            [ "easeInOutQuart", [ 0.77, 0, 0.175, 1 ] ],
            [ "easeInQuint", [ 0.755, 0.05, 0.855, 0.06 ] ],
            [ "easeOutQuint", [ 0.23, 1, 0.32, 1 ] ],
            [ "easeInOutQuint", [ 0.86, 0, 0.07, 1 ] ],
            [ "easeInExpo", [ 0.95, 0.05, 0.795, 0.035 ] ],
            [ "easeOutExpo", [ 0.19, 1, 0.22, 1 ] ],
            [ "easeInOutExpo", [ 1, 0, 0, 1 ] ],
            [ "easeInCirc", [ 0.6, 0.04, 0.98, 0.335 ] ],
            [ "easeOutCirc", [ 0.075, 0.82, 0.165, 1 ] ],
            [ "easeInOutCirc", [ 0.785, 0.135, 0.15, 0.86 ] ]
        ], function(i, easingArray) {
            Velocity.Easings[easingArray[0]] = generateBezier.apply(null, easingArray[1]);
        });

    /* Determine the appropriate easing type given an easing input. */
    function getEasing(value, duration) {
        var easing = value;

        /* The easing option can either be a string that references a pre-registered easing,
           or it can be a two-/four-item array of integers to be converted into a bezier/spring function. */
        if (Type.isString(value)) {
            /* Ensure that the easing has been assigned to jQuery's Velocity.Easings object. */
            if (!Velocity.Easings[value]) {
                easing = false;
            }
        } else if (Type.isArray(value) && value.length === 1) {
            easing = generateStep.apply(null, value);
        } else if (Type.isArray(value) && value.length === 2) {
            /* springRK4 must be passed the animation's duration. */
            /* Note: If the springRK4 array contains non-numbers, generateSpringRK4() returns an easing
               function generated with default tension and friction values. */
            easing = generateSpringRK4.apply(null, value.concat([ duration ]));
        } else if (Type.isArray(value) && value.length === 4) {
            /* Note: If the bezier array contains non-numbers, generateBezier() returns false. */
            easing = generateBezier.apply(null, value);
        } else {
            easing = false;
        }

        /* Revert to the Velocity-wide default easing type, or fall back to "swing" (which is also jQuery's default)
           if the Velocity-wide default has been incorrectly modified. */
        if (easing === false) {
            if (Velocity.Easings[Velocity.defaults.easing]) {
                easing = Velocity.defaults.easing;
            } else {
                easing = EASING_DEFAULT;
            }
        }

        return easing;
    }

    /*****************
        CSS Stack
    *****************/

    /* The CSS object is a highly condensed and performant CSS stack that fully replaces jQuery's.
       It handles the validation, getting, and setting of both standard CSS properties and CSS property hooks. */
    /* Note: A "CSS" shorthand is aliased so that our code is easier to read. */
    var CSS = Velocity.CSS = {

        /*************
            RegEx
        *************/

        RegEx: {
            isHex: /^#([A-f\d]{3}){1,2}$/i,
            /* Unwrap a property value's surrounding text, e.g. "rgba(4, 3, 2, 1)" ==> "4, 3, 2, 1" and "rect(4px 3px 2px 1px)" ==> "4px 3px 2px 1px". */
            valueUnwrap: /^[A-z]+\((.*)\)$/i,
            wrappedValueAlreadyExtracted: /[0-9.]+ [0-9.]+ [0-9.]+( [0-9.]+)?/,
            /* Split a multi-value property into an array of subvalues, e.g. "rgba(4, 3, 2, 1) 4px 3px 2px 1px" ==> [ "rgba(4, 3, 2, 1)", "4px", "3px", "2px", "1px" ]. */
            valueSplit: /([A-z]+\(.+\))|(([A-z0-9#-.]+?)(?=\s|$))/ig
        },

        /************
            Lists
        ************/

        Lists: {
            colors: [ "fill", "stroke", "stopColor", "color", "backgroundColor", "borderColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor", "outlineColor" ],
            transformsBase: [ "translateX", "translateY", "scale", "scaleX", "scaleY", "skewX", "skewY", "rotateZ" ],
            transforms3D: [ "transformPerspective", "translateZ", "scaleZ", "rotateX", "rotateY" ]
        },

        /************
            Hooks
        ************/

        /* Hooks allow a subproperty (e.g. "boxShadowBlur") of a compound-value CSS property
           (e.g. "boxShadow: X Y Blur Spread Color") to be animated as if it were a discrete property. */
        /* Note: Beyond enabling fine-grained property animation, hooking is necessary since Velocity only
           tweens properties with single numeric values; unlike CSS transitions, Velocity does not interpolate compound-values. */
        Hooks: {
            /********************
                Registration
            ********************/

            /* Templates are a concise way of indicating which subproperties must be individually registered for each compound-value CSS property. */
            /* Each template consists of the compound-value's base name, its constituent subproperty names, and those subproperties' default values. */
            templates: {
                "textShadow": [ "Color X Y Blur", "black 0px 0px 0px" ],
                "boxShadow": [ "Color X Y Blur Spread", "black 0px 0px 0px 0px" ],
                "clip": [ "Top Right Bottom Left", "0px 0px 0px 0px" ],
                "backgroundPosition": [ "X Y", "0% 0%" ],
                "transformOrigin": [ "X Y Z", "50% 50% 0px" ],
                "perspectiveOrigin": [ "X Y", "50% 50%" ]
            },

            /* A "registered" hook is one that has been converted from its template form into a live,
               tweenable property. It contains data to associate it with its root property. */
            registered: {
                /* Note: A registered hook looks like this ==> textShadowBlur: [ "textShadow", 3 ],
                   which consists of the subproperty's name, the associated root property's name,
                   and the subproperty's position in the root's value. */
            },
            /* Convert the templates into individual hooks then append them to the registered object above. */
            register: function () {
                /* Color hooks registration: Colors are defaulted to white -- as opposed to black -- since colors that are
                   currently set to "transparent" default to their respective template below when color-animated,
                   and white is typically a closer match to transparent than black is. An exception is made for text ("color"),
                   which is almost always set closer to black than white. */
                for (var i = 0; i < CSS.Lists.colors.length; i++) {
                    var rgbComponents = (CSS.Lists.colors[i] === "color") ? "0 0 0 1" : "255 255 255 1";
                    CSS.Hooks.templates[CSS.Lists.colors[i]] = [ "Red Green Blue Alpha", rgbComponents ];
                }

                var rootProperty,
                    hookTemplate,
                    hookNames;

                /* In IE, color values inside compound-value properties are positioned at the end the value instead of at the beginning.
                   Thus, we re-arrange the templates accordingly. */
                if (IE) {
                    for (rootProperty in CSS.Hooks.templates) {
                        hookTemplate = CSS.Hooks.templates[rootProperty];
                        hookNames = hookTemplate[0].split(" ");

                        var defaultValues = hookTemplate[1].match(CSS.RegEx.valueSplit);

                        if (hookNames[0] === "Color") {
                            /* Reposition both the hook's name and its default value to the end of their respective strings. */
                            hookNames.push(hookNames.shift());
                            defaultValues.push(defaultValues.shift());

                            /* Replace the existing template for the hook's root property. */
                            CSS.Hooks.templates[rootProperty] = [ hookNames.join(" "), defaultValues.join(" ") ];
                        }
                    }
                }

                /* Hook registration. */
                for (rootProperty in CSS.Hooks.templates) {
                    hookTemplate = CSS.Hooks.templates[rootProperty];
                    hookNames = hookTemplate[0].split(" ");

                    for (var i in hookNames) {
                        var fullHookName = rootProperty + hookNames[i],
                            hookPosition = i;

                        /* For each hook, register its full name (e.g. textShadowBlur) with its root property (e.g. textShadow)
                           and the hook's position in its template's default value string. */
                        CSS.Hooks.registered[fullHookName] = [ rootProperty, hookPosition ];
                    }
                }
            },

            /*****************************
               Injection and Extraction
            *****************************/

            /* Look up the root property associated with the hook (e.g. return "textShadow" for "textShadowBlur"). */
            /* Since a hook cannot be set directly (the browser won't recognize it), style updating for hooks is routed through the hook's root property. */
            getRoot: function (property) {
                var hookData = CSS.Hooks.registered[property];

                if (hookData) {
                    return hookData[0];
                } else {
                    /* If there was no hook match, return the property name untouched. */
                    return property;
                }
            },
            /* Convert any rootPropertyValue, null or otherwise, into a space-delimited list of hook values so that
               the targeted hook can be injected or extracted at its standard position. */
            cleanRootPropertyValue: function(rootProperty, rootPropertyValue) {
                /* If the rootPropertyValue is wrapped with "rgb()", "clip()", etc., remove the wrapping to normalize the value before manipulation. */
                if (CSS.RegEx.valueUnwrap.test(rootPropertyValue)) {
                    rootPropertyValue = rootPropertyValue.match(CSS.RegEx.valueUnwrap)[1];
                }

                /* If rootPropertyValue is a CSS null-value (from which there's inherently no hook value to extract),
                   default to the root's default value as defined in CSS.Hooks.templates. */
                /* Note: CSS null-values include "none", "auto", and "transparent". They must be converted into their
                   zero-values (e.g. textShadow: "none" ==> textShadow: "0px 0px 0px black") for hook manipulation to proceed. */
                if (CSS.Values.isCSSNullValue(rootPropertyValue)) {
                    rootPropertyValue = CSS.Hooks.templates[rootProperty][1];
                }

                return rootPropertyValue;
            },
            /* Extracted the hook's value from its root property's value. This is used to get the starting value of an animating hook. */
            extractValue: function (fullHookName, rootPropertyValue) {
                var hookData = CSS.Hooks.registered[fullHookName];

                if (hookData) {
                    var hookRoot = hookData[0],
                        hookPosition = hookData[1];

                    rootPropertyValue = CSS.Hooks.cleanRootPropertyValue(hookRoot, rootPropertyValue);

                    /* Split rootPropertyValue into its constituent hook values then grab the desired hook at its standard position. */
                    return rootPropertyValue.toString().match(CSS.RegEx.valueSplit)[hookPosition];
                } else {
                    /* If the provided fullHookName isn't a registered hook, return the rootPropertyValue that was passed in. */
                    return rootPropertyValue;
                }
            },
            /* Inject the hook's value into its root property's value. This is used to piece back together the root property
               once Velocity has updated one of its individually hooked values through tweening. */
            injectValue: function (fullHookName, hookValue, rootPropertyValue) {
                var hookData = CSS.Hooks.registered[fullHookName];

                if (hookData) {
                    var hookRoot = hookData[0],
                        hookPosition = hookData[1],
                        rootPropertyValueParts,
                        rootPropertyValueUpdated;

                    rootPropertyValue = CSS.Hooks.cleanRootPropertyValue(hookRoot, rootPropertyValue);

                    /* Split rootPropertyValue into its individual hook values, replace the targeted value with hookValue,
                       then reconstruct the rootPropertyValue string. */
                    rootPropertyValueParts = rootPropertyValue.toString().match(CSS.RegEx.valueSplit);
                    rootPropertyValueParts[hookPosition] = hookValue;
                    rootPropertyValueUpdated = rootPropertyValueParts.join(" ");

                    return rootPropertyValueUpdated;
                } else {
                    /* If the provided fullHookName isn't a registered hook, return the rootPropertyValue that was passed in. */
                    return rootPropertyValue;
                }
            }
        },

        /*******************
           Normalizations
        *******************/

        /* Normalizations standardize CSS property manipulation by pollyfilling browser-specific implementations (e.g. opacity)
           and reformatting special properties (e.g. clip, rgba) to look like standard ones. */
        Normalizations: {
            /* Normalizations are passed a normalization target (either the property's name, its extracted value, or its injected value),
               the targeted element (which may need to be queried), and the targeted property value. */
            registered: {
                clip: function (type, element, propertyValue) {
                    switch (type) {
                        case "name":
                            return "clip";
                        /* Clip needs to be unwrapped and stripped of its commas during extraction. */
                        case "extract":
                            var extracted;

                            /* If Velocity also extracted this value, skip extraction. */
                            if (CSS.RegEx.wrappedValueAlreadyExtracted.test(propertyValue)) {
                                extracted = propertyValue;
                            } else {
                                /* Remove the "rect()" wrapper. */
                                extracted = propertyValue.toString().match(CSS.RegEx.valueUnwrap);

                                /* Strip off commas. */
                                extracted = extracted ? extracted[1].replace(/,(\s+)?/g, " ") : propertyValue;
                            }

                            return extracted;
                        /* Clip needs to be re-wrapped during injection. */
                        case "inject":
                            return "rect(" + propertyValue + ")";
                    }
                },

                blur: function(type, element, propertyValue) {
                    switch (type) {
                        case "name":
                            return Velocity.State.isFirefox ? "filter" : "-webkit-filter";
                        case "extract":
                            var extracted = parseFloat(propertyValue);

                            /* If extracted is NaN, meaning the value isn't already extracted. */
                            if (!(extracted || extracted === 0)) {
                                var blurComponent = propertyValue.toString().match(/blur\(([0-9]+[A-z]+)\)/i);

                                /* If the filter string had a blur component, return just the blur value and unit type. */
                                if (blurComponent) {
                                    extracted = blurComponent[1];
                                /* If the component doesn't exist, default blur to 0. */
                                } else {
                                    extracted = 0;
                                }
                            }

                            return extracted;
                        /* Blur needs to be re-wrapped during injection. */
                        case "inject":
                            /* For the blur effect to be fully de-applied, it needs to be set to "none" instead of 0. */
                            if (!parseFloat(propertyValue)) {
                                return "none";
                            } else {
                                return "blur(" + propertyValue + ")";
                            }
                    }
                },

                /* <=IE8 do not support the standard opacity property. They use filter:alpha(opacity=INT) instead. */
                opacity: function (type, element, propertyValue) {
                    if (IE <= 8) {
                        switch (type) {
                            case "name":
                                return "filter";
                            case "extract":
                                /* <=IE8 return a "filter" value of "alpha(opacity=\d{1,3})".
                                   Extract the value and convert it to a decimal value to match the standard CSS opacity property's formatting. */
                                var extracted = propertyValue.toString().match(/alpha\(opacity=(.*)\)/i);

                                if (extracted) {
                                    /* Convert to decimal value. */
                                    propertyValue = extracted[1] / 100;
                                } else {
                                    /* When extracting opacity, default to 1 since a null value means opacity hasn't been set. */
                                    propertyValue = 1;
                                }

                                return propertyValue;
                            case "inject":
                                /* Opacified elements are required to have their zoom property set to a non-zero value. */
                                element.style.zoom = 1;

                                /* Setting the filter property on elements with certain font property combinations can result in a
                                   highly unappealing ultra-bolding effect. There's no way to remedy this throughout a tween, but dropping the
                                   value altogether (when opacity hits 1) at leasts ensures that the glitch is gone post-tweening. */
                                if (parseFloat(propertyValue) >= 1) {
                                    return "";
                                } else {
                                  /* As per the filter property's spec, convert the decimal value to a whole number and wrap the value. */
                                  return "alpha(opacity=" + parseInt(parseFloat(propertyValue) * 100, 10) + ")";
                                }
                        }
                    /* With all other browsers, normalization is not required; return the same values that were passed in. */
                    } else {
                        switch (type) {
                            case "name":
                                return "opacity";
                            case "extract":
                                return propertyValue;
                            case "inject":
                                return propertyValue;
                        }
                    }
                }
            },

            /*****************************
                Batched Registrations
            *****************************/

            /* Note: Batched normalizations extend the CSS.Normalizations.registered object. */
            register: function () {

                /*****************
                    Transforms
                *****************/

                /* Transforms are the subproperties contained by the CSS "transform" property. Transforms must undergo normalization
                   so that they can be referenced in a properties map by their individual names. */
                /* Note: When transforms are "set", they are actually assigned to a per-element transformCache. When all transform
                   setting is complete complete, CSS.flushTransformCache() must be manually called to flush the values to the DOM.
                   Transform setting is batched in this way to improve performance: the transform style only needs to be updated
                   once when multiple transform subproperties are being animated simultaneously. */
                /* Note: IE9 and Android Gingerbread have support for 2D -- but not 3D -- transforms. Since animating unsupported
                   transform properties results in the browser ignoring the *entire* transform string, we prevent these 3D values
                   from being normalized for these browsers so that tweening skips these properties altogether
                   (since it will ignore them as being unsupported by the browser.) */
                if (!(IE <= 9) && !Velocity.State.isGingerbread) {
                    /* Note: Since the standalone CSS "perspective" property and the CSS transform "perspective" subproperty
                    share the same name, the latter is given a unique token within Velocity: "transformPerspective". */
                    CSS.Lists.transformsBase = CSS.Lists.transformsBase.concat(CSS.Lists.transforms3D);
                }

                for (var i = 0; i < CSS.Lists.transformsBase.length; i++) {
                    /* Wrap the dynamically generated normalization function in a new scope so that transformName's value is
                    paired with its respective function. (Otherwise, all functions would take the final for loop's transformName.) */
                    (function() {
                        var transformName = CSS.Lists.transformsBase[i];

                        CSS.Normalizations.registered[transformName] = function (type, element, propertyValue) {
                            switch (type) {
                                /* The normalized property name is the parent "transform" property -- the property that is actually set in CSS. */
                                case "name":
                                    return "transform";
                                /* Transform values are cached onto a per-element transformCache object. */
                                case "extract":
                                    /* If this transform has yet to be assigned a value, return its null value. */
                                    if (Data(element) === undefined || Data(element).transformCache[transformName] === undefined) {
                                        /* Scale CSS.Lists.transformsBase default to 1 whereas all other transform properties default to 0. */
                                        return /^scale/i.test(transformName) ? 1 : 0;
                                    /* When transform values are set, they are wrapped in parentheses as per the CSS spec.
                                       Thus, when extracting their values (for tween calculations), we strip off the parentheses. */
                                    } else {
                                        return Data(element).transformCache[transformName].replace(/[()]/g, "");
                                    }
                                case "inject":
                                    var invalid = false;

                                    /* If an individual transform property contains an unsupported unit type, the browser ignores the *entire* transform property.
                                       Thus, protect users from themselves by skipping setting for transform values supplied with invalid unit types. */
                                    /* Switch on the base transform type; ignore the axis by removing the last letter from the transform's name. */
                                    switch (transformName.substr(0, transformName.length - 1)) {
                                        /* Whitelist unit types for each transform. */
                                        case "translate":
                                            invalid = !/(%|px|em|rem|vw|vh|\d)$/i.test(propertyValue);
                                            break;
                                        /* Since an axis-free "scale" property is supported as well, a little hack is used here to detect it by chopping off its last letter. */
                                        case "scal":
                                        case "scale":
                                            /* Chrome on Android has a bug in which scaled elements blur if their initial scale
                                               value is below 1 (which can happen with forcefeeding). Thus, we detect a yet-unset scale property
                                               and ensure that its first value is always 1. More info: http://stackoverflow.com/questions/10417890/css3-animations-with-transform-causes-blurred-elements-on-webkit/10417962#10417962 */
                                            if (Velocity.State.isAndroid && Data(element).transformCache[transformName] === undefined && propertyValue < 1) {
                                                propertyValue = 1;
                                            }

                                            invalid = !/(\d)$/i.test(propertyValue);
                                            break;
                                        case "skew":
                                            invalid = !/(deg|\d)$/i.test(propertyValue);
                                            break;
                                        case "rotate":
                                            invalid = !/(deg|\d)$/i.test(propertyValue);
                                            break;
                                    }

                                    if (!invalid) {
                                        /* As per the CSS spec, wrap the value in parentheses. */
                                        Data(element).transformCache[transformName] = "(" + propertyValue + ")";
                                    }

                                    /* Although the value is set on the transformCache object, return the newly-updated value for the calling code to process as normal. */
                                    return Data(element).transformCache[transformName];
                            }
                        };
                    })();
                }

                /*************
                    Colors
                *************/

                /* Since Velocity only animates a single numeric value per property, color animation is achieved by hooking the individual RGBA components of CSS color properties.
                   Accordingly, color values must be normalized (e.g. "#ff0000", "red", and "rgb(255, 0, 0)" ==> "255 0 0 1") so that their components can be injected/extracted by CSS.Hooks logic. */
                for (var i = 0; i < CSS.Lists.colors.length; i++) {
                    /* Wrap the dynamically generated normalization function in a new scope so that colorName's value is paired with its respective function.
                       (Otherwise, all functions would take the final for loop's colorName.) */
                    (function () {
                        var colorName = CSS.Lists.colors[i];

                        /* Note: In IE<=8, which support rgb but not rgba, color properties are reverted to rgb by stripping off the alpha component. */
                        CSS.Normalizations.registered[colorName] = function(type, element, propertyValue) {
                            switch (type) {
                                case "name":
                                    return colorName;
                                /* Convert all color values into the rgb format. (Old IE can return hex values and color names instead of rgb/rgba.) */
                                case "extract":
                                    var extracted;

                                    /* If the color is already in its hookable form (e.g. "255 255 255 1") due to having been previously extracted, skip extraction. */
                                    if (CSS.RegEx.wrappedValueAlreadyExtracted.test(propertyValue)) {
                                        extracted = propertyValue;
                                    } else {
                                        var converted,
                                            colorNames = {
                                                black: "rgb(0, 0, 0)",
                                                blue: "rgb(0, 0, 255)",
                                                gray: "rgb(128, 128, 128)",
                                                green: "rgb(0, 128, 0)",
                                                red: "rgb(255, 0, 0)",
                                                white: "rgb(255, 255, 255)"
                                            };

                                        /* Convert color names to rgb. */
                                        if (/^[A-z]+$/i.test(propertyValue)) {
                                            if (colorNames[propertyValue] !== undefined) {
                                                converted = colorNames[propertyValue]
                                            } else {
                                                /* If an unmatched color name is provided, default to black. */
                                                converted = colorNames.black;
                                            }
                                        /* Convert hex values to rgb. */
                                        } else if (CSS.RegEx.isHex.test(propertyValue)) {
                                            converted = "rgb(" + CSS.Values.hexToRgb(propertyValue).join(" ") + ")";
                                        /* If the provided color doesn't match any of the accepted color formats, default to black. */
                                        } else if (!(/^rgba?\(/i.test(propertyValue))) {
                                            converted = colorNames.black;
                                        }

                                        /* Remove the surrounding "rgb/rgba()" string then replace commas with spaces and strip
                                           repeated spaces (in case the value included spaces to begin with). */
                                        extracted = (converted || propertyValue).toString().match(CSS.RegEx.valueUnwrap)[1].replace(/,(\s+)?/g, " ");
                                    }

                                    /* So long as this isn't <=IE8, add a fourth (alpha) component if it's missing and default it to 1 (visible). */
                                    if (!(IE <= 8) && extracted.split(" ").length === 3) {
                                        extracted += " 1";
                                    }

                                    return extracted;
                                case "inject":
                                    /* If this is IE<=8 and an alpha component exists, strip it off. */
                                    if (IE <= 8) {
                                        if (propertyValue.split(" ").length === 4) {
                                            propertyValue = propertyValue.split(/\s+/).slice(0, 3).join(" ");
                                        }
                                    /* Otherwise, add a fourth (alpha) component if it's missing and default it to 1 (visible). */
                                    } else if (propertyValue.split(" ").length === 3) {
                                        propertyValue += " 1";
                                    }

                                    /* Re-insert the browser-appropriate wrapper("rgb/rgba()"), insert commas, and strip off decimal units
                                       on all values but the fourth (R, G, and B only accept whole numbers). */
                                    return (IE <= 8 ? "rgb" : "rgba") + "(" + propertyValue.replace(/\s+/g, ",").replace(/\.(\d)+(?=,)/g, "") + ")";
                            }
                        };
                    })();
                }
            }
        },

        /************************
           CSS Property Names
        ************************/

        Names: {
            /* Camelcase a property name into its JavaScript notation (e.g. "background-color" ==> "backgroundColor").
               Camelcasing is used to normalize property names between and across calls. */
            camelCase: function (property) {
                return property.replace(/-(\w)/g, function (match, subMatch) {
                    return subMatch.toUpperCase();
                });
            },

            /* For SVG elements, some properties (namely, dimensional ones) are GET/SET via the element's HTML attributes (instead of via CSS styles). */
            SVGAttribute: function (property) {
                var SVGAttributes = "width|height|x|y|cx|cy|r|rx|ry|x1|x2|y1|y2";

                /* Certain browsers require an SVG transform to be applied as an attribute. (Otherwise, application via CSS is preferable due to 3D support.) */
                if (IE || (Velocity.State.isAndroid && !Velocity.State.isChrome)) {
                    SVGAttributes += "|transform";
                }

                return new RegExp("^(" + SVGAttributes + ")$", "i").test(property);
            },

            /* Determine whether a property should be set with a vendor prefix. */
            /* If a prefixed version of the property exists, return it. Otherwise, return the original property name.
               If the property is not at all supported by the browser, return a false flag. */
            prefixCheck: function (property) {
                /* If this property has already been checked, return the cached value. */
                if (Velocity.State.prefixMatches[property]) {
                    return [ Velocity.State.prefixMatches[property], true ];
                } else {
                    var vendors = [ "", "Webkit", "Moz", "ms", "O" ];

                    for (var i = 0, vendorsLength = vendors.length; i < vendorsLength; i++) {
                        var propertyPrefixed;

                        if (i === 0) {
                            propertyPrefixed = property;
                        } else {
                            /* Capitalize the first letter of the property to conform to JavaScript vendor prefix notation (e.g. webkitFilter). */
                            propertyPrefixed = vendors[i] + property.replace(/^\w/, function(match) { return match.toUpperCase(); });
                        }

                        /* Check if the browser supports this property as prefixed. */
                        if (Type.isString(Velocity.State.prefixElement.style[propertyPrefixed])) {
                            /* Cache the match. */
                            Velocity.State.prefixMatches[property] = propertyPrefixed;

                            return [ propertyPrefixed, true ];
                        }
                    }

                    /* If the browser doesn't support this property in any form, include a false flag so that the caller can decide how to proceed. */
                    return [ property, false ];
                }
            }
        },

        /************************
           CSS Property Values
        ************************/

        Values: {
            /* Hex to RGB conversion. Copyright Tim Down: http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb */
            hexToRgb: function (hex) {
                var shortformRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
                    longformRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i,
                    rgbParts;

                hex = hex.replace(shortformRegex, function (m, r, g, b) {
                    return r + r + g + g + b + b;
                });

                rgbParts = longformRegex.exec(hex);

                return rgbParts ? [ parseInt(rgbParts[1], 16), parseInt(rgbParts[2], 16), parseInt(rgbParts[3], 16) ] : [ 0, 0, 0 ];
            },

            isCSSNullValue: function (value) {
                /* The browser defaults CSS values that have not been set to either 0 or one of several possible null-value strings.
                   Thus, we check for both falsiness and these special strings. */
                /* Null-value checking is performed to default the special strings to 0 (for the sake of tweening) or their hook
                   templates as defined as CSS.Hooks (for the sake of hook injection/extraction). */
                /* Note: Chrome returns "rgba(0, 0, 0, 0)" for an undefined color whereas IE returns "transparent". */
                return (value == 0 || /^(none|auto|transparent|(rgba\(0, ?0, ?0, ?0\)))$/i.test(value));
            },

            /* Retrieve a property's default unit type. Used for assigning a unit type when one is not supplied by the user. */
            getUnitType: function (property) {
                if (/^(rotate|skew)/i.test(property)) {
                    return "deg";
                } else if (/(^(scale|scaleX|scaleY|scaleZ|alpha|flexGrow|flexHeight|zIndex|fontWeight)$)|((opacity|red|green|blue|alpha)$)/i.test(property)) {
                    /* The above properties are unitless. */
                    return "";
                } else {
                    /* Default to px for all other properties. */
                    return "px";
                }
            },

            /* HTML elements default to an associated display type when they're not set to display:none. */
            /* Note: This function is used for correctly setting the non-"none" display value in certain Velocity redirects, such as fadeIn/Out. */
            getDisplayType: function (element) {
                var tagName = element && element.tagName.toString().toLowerCase();

                if (/^(b|big|i|small|tt|abbr|acronym|cite|code|dfn|em|kbd|strong|samp|var|a|bdo|br|img|map|object|q|script|span|sub|sup|button|input|label|select|textarea)$/i.test(tagName)) {
                    return "inline";
                } else if (/^(li)$/i.test(tagName)) {
                    return "list-item";
                } else if (/^(tr)$/i.test(tagName)) {
                    return "table-row";
                } else if (/^(table)$/i.test(tagName)) {
                    return "table";
                } else if (/^(tbody)$/i.test(tagName)) {
                    return "table-row-group";
                /* Default to "block" when no match is found. */
                } else {
                    return "block";
                }
            },

            /* The class add/remove functions are used to temporarily apply a "velocity-animating" class to elements while they're animating. */
            addClass: function (element, className) {
                if (element.classList) {
                    element.classList.add(className);
                } else {
                    element.className += (element.className.length ? " " : "") + className;
                }
            },

            removeClass: function (element, className) {
                if (element.classList) {
                    element.classList.remove(className);
                } else {
                    element.className = element.className.toString().replace(new RegExp("(^|\\s)" + className.split(" ").join("|") + "(\\s|$)", "gi"), " ");
                }
            }
        },

        /****************************
           Style Getting & Setting
        ****************************/

        /* The singular getPropertyValue, which routes the logic for all normalizations, hooks, and standard CSS properties. */
        getPropertyValue: function (element, property, rootPropertyValue, forceStyleLookup) {
            /* Get an element's computed property value. */
            /* Note: Retrieving the value of a CSS property cannot simply be performed by checking an element's
               style attribute (which only reflects user-defined values). Instead, the browser must be queried for a property's
               *computed* value. You can read more about getComputedStyle here: https://developer.mozilla.org/en/docs/Web/API/window.getComputedStyle */
            function computePropertyValue (element, property) {
                /* When box-sizing isn't set to border-box, height and width style values are incorrectly computed when an
                   element's scrollbars are visible (which expands the element's dimensions). Thus, we defer to the more accurate
                   offsetHeight/Width property, which includes the total dimensions for interior, border, padding, and scrollbar.
                   We subtract border and padding to get the sum of interior + scrollbar. */
                var computedValue = 0;

                /* IE<=8 doesn't support window.getComputedStyle, thus we defer to jQuery, which has an extensive array
                   of hacks to accurately retrieve IE8 property values. Re-implementing that logic here is not worth bloating the
                   codebase for a dying browser. The performance repercussions of using jQuery here are minimal since
                   Velocity is optimized to rarely (and sometimes never) query the DOM. Further, the $.css() codepath isn't that slow. */
                if (IE <= 8) {
                    computedValue = $.css(element, property); /* GET */
                /* All other browsers support getComputedStyle. The returned live object reference is cached onto its
                   associated element so that it does not need to be refetched upon every GET. */
                } else {
                    /* Browsers do not return height and width values for elements that are set to display:"none". Thus, we temporarily
                       toggle display to the element type's default value. */
                    var toggleDisplay = false;

                    if (/^(width|height)$/.test(property) && CSS.getPropertyValue(element, "display") === 0) {
                        toggleDisplay = true;
                        CSS.setPropertyValue(element, "display", CSS.Values.getDisplayType(element));
                    }

                    function revertDisplay () {
                        if (toggleDisplay) {
                            CSS.setPropertyValue(element, "display", "none");
                        }
                    }

                    if (!forceStyleLookup) {
                        if (property === "height" && CSS.getPropertyValue(element, "boxSizing").toString().toLowerCase() !== "border-box") {
                            var contentBoxHeight = element.offsetHeight - (parseFloat(CSS.getPropertyValue(element, "borderTopWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "borderBottomWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingTop")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingBottom")) || 0);
                            revertDisplay();

                            return contentBoxHeight;
                        } else if (property === "width" && CSS.getPropertyValue(element, "boxSizing").toString().toLowerCase() !== "border-box") {
                            var contentBoxWidth = element.offsetWidth - (parseFloat(CSS.getPropertyValue(element, "borderLeftWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "borderRightWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingLeft")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingRight")) || 0);
                            revertDisplay();

                            return contentBoxWidth;
                        }
                    }

                    var computedStyle;

                    /* For elements that Velocity hasn't been called on directly (e.g. when Velocity queries the DOM on behalf
                       of a parent of an element its animating), perform a direct getComputedStyle lookup since the object isn't cached. */
                    if (Data(element) === undefined) {
                        computedStyle = window.getComputedStyle(element, null); /* GET */
                    /* If the computedStyle object has yet to be cached, do so now. */
                    } else if (!Data(element).computedStyle) {
                        computedStyle = Data(element).computedStyle = window.getComputedStyle(element, null); /* GET */
                    /* If computedStyle is cached, use it. */
                    } else {
                        computedStyle = Data(element).computedStyle;
                    }

                    /* IE and Firefox do not return a value for the generic borderColor -- they only return individual values for each border side's color.
                       Also, in all browsers, when border colors aren't all the same, a compound value is returned that Velocity isn't setup to parse.
                       So, as a polyfill for querying individual border side colors, we just return the top border's color and animate all borders from that value. */
                    if (property === "borderColor") {
                        property = "borderTopColor";
                    }

                    /* IE9 has a bug in which the "filter" property must be accessed from computedStyle using the getPropertyValue method
                       instead of a direct property lookup. The getPropertyValue method is slower than a direct lookup, which is why we avoid it by default. */
                    if (IE === 9 && property === "filter") {
                        computedValue = computedStyle.getPropertyValue(property); /* GET */
                    } else {
                        computedValue = computedStyle[property];
                    }

                    /* Fall back to the property's style value (if defined) when computedValue returns nothing,
                       which can happen when the element hasn't been painted. */
                    if (computedValue === "" || computedValue === null) {
                        computedValue = element.style[property];
                    }

                    revertDisplay();
                }

                /* For top, right, bottom, and left (TRBL) values that are set to "auto" on elements of "fixed" or "absolute" position,
                   defer to jQuery for converting "auto" to a numeric value. (For elements with a "static" or "relative" position, "auto" has the same
                   effect as being set to 0, so no conversion is necessary.) */
                /* An example of why numeric conversion is necessary: When an element with "position:absolute" has an untouched "left"
                   property, which reverts to "auto", left's value is 0 relative to its parent element, but is often non-zero relative
                   to its *containing* (not parent) element, which is the nearest "position:relative" ancestor or the viewport (and always the viewport in the case of "position:fixed"). */
                if (computedValue === "auto" && /^(top|right|bottom|left)$/i.test(property)) {
                    var position = computePropertyValue(element, "position"); /* GET */

                    /* For absolute positioning, jQuery's $.position() only returns values for top and left;
                       right and bottom will have their "auto" value reverted to 0. */
                    /* Note: A jQuery object must be created here since jQuery doesn't have a low-level alias for $.position().
                       Not a big deal since we're currently in a GET batch anyway. */
                    if (position === "fixed" || (position === "absolute" && /top|left/i.test(property))) {
                        /* Note: jQuery strips the pixel unit from its returned values; we re-add it here to conform with computePropertyValue's behavior. */
                        computedValue = $(element).position()[property] + "px"; /* GET */
                    }
                }

                return computedValue;
            }

            var propertyValue;

            /* If this is a hooked property (e.g. "clipLeft" instead of the root property of "clip"),
               extract the hook's value from a normalized rootPropertyValue using CSS.Hooks.extractValue(). */
            if (CSS.Hooks.registered[property]) {
                var hook = property,
                    hookRoot = CSS.Hooks.getRoot(hook);

                /* If a cached rootPropertyValue wasn't passed in (which Velocity always attempts to do in order to avoid requerying the DOM),
                   query the DOM for the root property's value. */
                if (rootPropertyValue === undefined) {
                    /* Since the browser is now being directly queried, use the official post-prefixing property name for this lookup. */
                    rootPropertyValue = CSS.getPropertyValue(element, CSS.Names.prefixCheck(hookRoot)[0]); /* GET */
                }

                /* If this root has a normalization registered, peform the associated normalization extraction. */
                if (CSS.Normalizations.registered[hookRoot]) {
                    rootPropertyValue = CSS.Normalizations.registered[hookRoot]("extract", element, rootPropertyValue);
                }

                /* Extract the hook's value. */
                propertyValue = CSS.Hooks.extractValue(hook, rootPropertyValue);

            /* If this is a normalized property (e.g. "opacity" becomes "filter" in <=IE8) or "translateX" becomes "transform"),
               normalize the property's name and value, and handle the special case of transforms. */
            /* Note: Normalizing a property is mutually exclusive from hooking a property since hook-extracted values are strictly
               numerical and therefore do not require normalization extraction. */
            } else if (CSS.Normalizations.registered[property]) {
                var normalizedPropertyName,
                    normalizedPropertyValue;

                normalizedPropertyName = CSS.Normalizations.registered[property]("name", element);

                /* Transform values are calculated via normalization extraction (see below), which checks against the element's transformCache.
                   At no point do transform GETs ever actually query the DOM; initial stylesheet values are never processed.
                   This is because parsing 3D transform matrices is not always accurate and would bloat our codebase;
                   thus, normalization extraction defaults initial transform values to their zero-values (e.g. 1 for scaleX and 0 for translateX). */
                if (normalizedPropertyName !== "transform") {
                    normalizedPropertyValue = computePropertyValue(element, CSS.Names.prefixCheck(normalizedPropertyName)[0]); /* GET */

                    /* If the value is a CSS null-value and this property has a hook template, use that zero-value template so that hooks can be extracted from it. */
                    if (CSS.Values.isCSSNullValue(normalizedPropertyValue) && CSS.Hooks.templates[property]) {
                        normalizedPropertyValue = CSS.Hooks.templates[property][1];
                    }
                }

                propertyValue = CSS.Normalizations.registered[property]("extract", element, normalizedPropertyValue);
            }

            /* If a (numeric) value wasn't produced via hook extraction or normalization, query the DOM. */
            if (!/^[\d-]/.test(propertyValue)) {
                /* For SVG elements, dimensional properties (which SVGAttribute() detects) are tweened via
                   their HTML attribute values instead of their CSS style values. */
                if (Data(element) && Data(element).isSVG && CSS.Names.SVGAttribute(property)) {
                    /* Since the height/width attribute values must be set manually, they don't reflect computed values.
                       Thus, we use use getBBox() to ensure we always get values for elements with undefined height/width attributes. */
                    if (/^(height|width)$/i.test(property)) {
                        /* Firefox throws an error if .getBBox() is called on an SVG that isn't attached to the DOM. */
                        try {
                            propertyValue = element.getBBox()[property];
                        } catch (error) {
                            propertyValue = 0;
                        }
                    /* Otherwise, access the attribute value directly. */
                    } else {
                        propertyValue = element.getAttribute(property);
                    }
                } else {
                    propertyValue = computePropertyValue(element, CSS.Names.prefixCheck(property)[0]); /* GET */
                }
            }

            /* Since property lookups are for animation purposes (which entails computing the numeric delta between start and end values),
               convert CSS null-values to an integer of value 0. */
            if (CSS.Values.isCSSNullValue(propertyValue)) {
                propertyValue = 0;
            }

            if (Velocity.debug >= 2) console.log("Get " + property + ": " + propertyValue);

            return propertyValue;
        },

        /* The singular setPropertyValue, which routes the logic for all normalizations, hooks, and standard CSS properties. */
        setPropertyValue: function(element, property, propertyValue, rootPropertyValue, scrollData) {
            var propertyName = property;

            /* In order to be subjected to call options and element queueing, scroll animation is routed through Velocity as if it were a standard CSS property. */
            if (property === "scroll") {
                /* If a container option is present, scroll the container instead of the browser window. */
                if (scrollData.container) {
                    scrollData.container["scroll" + scrollData.direction] = propertyValue;
                /* Otherwise, Velocity defaults to scrolling the browser window. */
                } else {
                    if (scrollData.direction === "Left") {
                        window.scrollTo(propertyValue, scrollData.alternateValue);
                    } else {
                        window.scrollTo(scrollData.alternateValue, propertyValue);
                    }
                }
            } else {
                /* Transforms (translateX, rotateZ, etc.) are applied to a per-element transformCache object, which is manually flushed via flushTransformCache().
                   Thus, for now, we merely cache transforms being SET. */
                if (CSS.Normalizations.registered[property] && CSS.Normalizations.registered[property]("name", element) === "transform") {
                    /* Perform a normalization injection. */
                    /* Note: The normalization logic handles the transformCache updating. */
                    CSS.Normalizations.registered[property]("inject", element, propertyValue);

                    propertyName = "transform";
                    propertyValue = Data(element).transformCache[property];
                } else {
                    /* Inject hooks. */
                    if (CSS.Hooks.registered[property]) {
                        var hookName = property,
                            hookRoot = CSS.Hooks.getRoot(property);

                        /* If a cached rootPropertyValue was not provided, query the DOM for the hookRoot's current value. */
                        rootPropertyValue = rootPropertyValue || CSS.getPropertyValue(element, hookRoot); /* GET */

                        propertyValue = CSS.Hooks.injectValue(hookName, propertyValue, rootPropertyValue);
                        property = hookRoot;
                    }

                    /* Normalize names and values. */
                    if (CSS.Normalizations.registered[property]) {
                        propertyValue = CSS.Normalizations.registered[property]("inject", element, propertyValue);
                        property = CSS.Normalizations.registered[property]("name", element);
                    }

                    /* Assign the appropriate vendor prefix before performing an official style update. */
                    propertyName = CSS.Names.prefixCheck(property)[0];

                    /* A try/catch is used for IE<=8, which throws an error when "invalid" CSS values are set, e.g. a negative width.
                       Try/catch is avoided for other browsers since it incurs a performance overhead. */
                    if (IE <= 8) {
                        try {
                            element.style[propertyName] = propertyValue;
                        } catch (error) { if (Velocity.debug) console.log("Browser does not support [" + propertyValue + "] for [" + propertyName + "]"); }
                    /* SVG elements have their dimensional properties (width, height, x, y, cx, etc.) applied directly as attributes instead of as styles. */
                    /* Note: IE8 does not support SVG elements, so it's okay that we skip it for SVG animation. */
                    } else if (Data(element) && Data(element).isSVG && CSS.Names.SVGAttribute(property)) {
                        /* Note: For SVG attributes, vendor-prefixed property names are never used. */
                        /* Note: Not all CSS properties can be animated via attributes, but the browser won't throw an error for unsupported properties. */
                        element.setAttribute(property, propertyValue);
                    } else {
                        element.style[propertyName] = propertyValue;
                    }

                    if (Velocity.debug >= 2) console.log("Set " + property + " (" + propertyName + "): " + propertyValue);
                }
            }

            /* Return the normalized property name and value in case the caller wants to know how these values were modified before being applied to the DOM. */
            return [ propertyName, propertyValue ];
        },

        /* To increase performance by batching transform updates into a single SET, transforms are not directly applied to an element until flushTransformCache() is called. */
        /* Note: Velocity applies transform properties in the same order that they are chronogically introduced to the element's CSS styles. */
        flushTransformCache: function(element) {
            var transformString = "";

            /* Certain browsers require that SVG transforms be applied as an attribute. However, the SVG transform attribute takes a modified version of CSS's transform string
               (units are dropped and, except for skewX/Y, subproperties are merged into their master property -- e.g. scaleX and scaleY are merged into scale(X Y). */
            if ((IE || (Velocity.State.isAndroid && !Velocity.State.isChrome)) && Data(element).isSVG) {
                /* Since transform values are stored in their parentheses-wrapped form, we use a helper function to strip out their numeric values.
                   Further, SVG transform properties only take unitless (representing pixels) values, so it's okay that parseFloat() strips the unit suffixed to the float value. */
                function getTransformFloat (transformProperty) {
                    return parseFloat(CSS.getPropertyValue(element, transformProperty));
                }

                /* Create an object to organize all the transforms that we'll apply to the SVG element. To keep the logic simple,
                   we process *all* transform properties -- even those that may not be explicitly applied (since they default to their zero-values anyway). */
                var SVGTransforms = {
                    translate: [ getTransformFloat("translateX"), getTransformFloat("translateY") ],
                    skewX: [ getTransformFloat("skewX") ], skewY: [ getTransformFloat("skewY") ],
                    /* If the scale property is set (non-1), use that value for the scaleX and scaleY values
                       (this behavior mimics the result of animating all these properties at once on HTML elements). */
                    scale: getTransformFloat("scale") !== 1 ? [ getTransformFloat("scale"), getTransformFloat("scale") ] : [ getTransformFloat("scaleX"), getTransformFloat("scaleY") ],
                    /* Note: SVG's rotate transform takes three values: rotation degrees followed by the X and Y values
                       defining the rotation's origin point. We ignore the origin values (default them to 0). */
                    rotate: [ getTransformFloat("rotateZ"), 0, 0 ]
                };

                /* Iterate through the transform properties in the user-defined property map order.
                   (This mimics the behavior of non-SVG transform animation.) */
                $.each(Data(element).transformCache, function(transformName) {
                    /* Except for with skewX/Y, revert the axis-specific transform subproperties to their axis-free master
                       properties so that they match up with SVG's accepted transform properties. */
                    if (/^translate/i.test(transformName)) {
                        transformName = "translate";
                    } else if (/^scale/i.test(transformName)) {
                        transformName = "scale";
                    } else if (/^rotate/i.test(transformName)) {
                        transformName = "rotate";
                    }

                    /* Check that we haven't yet deleted the property from the SVGTransforms container. */
                    if (SVGTransforms[transformName]) {
                        /* Append the transform property in the SVG-supported transform format. As per the spec, surround the space-delimited values in parentheses. */
                        transformString += transformName + "(" + SVGTransforms[transformName].join(" ") + ")" + " ";

                        /* After processing an SVG transform property, delete it from the SVGTransforms container so we don't
                           re-insert the same master property if we encounter another one of its axis-specific properties. */
                        delete SVGTransforms[transformName];
                    }
                });
            } else {
                var transformValue,
                    perspective;

                /* Transform properties are stored as members of the transformCache object. Concatenate all the members into a string. */
                $.each(Data(element).transformCache, function(transformName) {
                    transformValue = Data(element).transformCache[transformName];

                    /* Transform's perspective subproperty must be set first in order to take effect. Store it temporarily. */
                    if (transformName === "transformPerspective") {
                        perspective = transformValue;
                        return true;
                    }

                    /* IE9 only supports one rotation type, rotateZ, which it refers to as "rotate". */
                    if (IE === 9 && transformName === "rotateZ") {
                        transformName = "rotate";
                    }

                    transformString += transformName + transformValue + " ";
                });

                /* If present, set the perspective subproperty first. */
                if (perspective) {
                    transformString = "perspective" + perspective + " " + transformString;
                }
            }

            CSS.setPropertyValue(element, "transform", transformString);
        }
    };

    /* Register hooks and normalizations. */
    CSS.Hooks.register();
    CSS.Normalizations.register();

    /* Allow hook setting in the same fashion as jQuery's $.css(). */
    Velocity.hook = function (elements, arg2, arg3) {
        var value = undefined;

        elements = sanitizeElements(elements);

        $.each(elements, function(i, element) {
            /* Initialize Velocity's per-element data cache if this element hasn't previously been animated. */
            if (Data(element) === undefined) {
                Velocity.init(element);
            }

            /* Get property value. If an element set was passed in, only return the value for the first element. */
            if (arg3 === undefined) {
                if (value === undefined) {
                    value = Velocity.CSS.getPropertyValue(element, arg2);
                }
            /* Set property value. */
            } else {
                /* sPV returns an array of the normalized propertyName/propertyValue pair used to update the DOM. */
                var adjustedSet = Velocity.CSS.setPropertyValue(element, arg2, arg3);

                /* Transform properties don't automatically set. They have to be flushed to the DOM. */
                if (adjustedSet[0] === "transform") {
                    Velocity.CSS.flushTransformCache(element);
                }

                value = adjustedSet;
            }
        });

        return value;
    };

    /*****************
        Animation
    *****************/

    var animate = function() {

        /******************
            Call Chain
        ******************/

        /* Logic for determining what to return to the call stack when exiting out of Velocity. */
        function getChain () {
            /* If we are using the utility function, attempt to return this call's promise. If no promise library was detected,
               default to null instead of returning the targeted elements so that utility function's return value is standardized. */
            if (isUtility) {
                return promiseData.promise || null;
            /* Otherwise, if we're using $.fn, return the jQuery-/Zepto-wrapped element set. */
            } else {
                return elementsWrapped;
            }
        }

        /*************************
           Arguments Assignment
        *************************/

        /* To allow for expressive CoffeeScript code, Velocity supports an alternative syntax in which "elements" (or "e"), "properties" (or "p"), and "options" (or "o")
           objects are defined on a container object that's passed in as Velocity's sole argument. */
        /* Note: Some browsers automatically populate arguments with a "properties" object. We detect it by checking for its default "names" property. */
        var syntacticSugar = (arguments[0] && (arguments[0].p || (($.isPlainObject(arguments[0].properties) && !arguments[0].properties.names) || Type.isString(arguments[0].properties)))),
            /* Whether Velocity was called via the utility function (as opposed to on a jQuery/Zepto object). */
            isUtility,
            /* When Velocity is called via the utility function ($.Velocity()/Velocity()), elements are explicitly
               passed in as the first parameter. Thus, argument positioning varies. We normalize them here. */
            elementsWrapped,
            argumentIndex;

        var elements,
            propertiesMap,
            options;

        /* Detect jQuery/Zepto elements being animated via the $.fn method. */
        if (Type.isWrapped(this)) {
            isUtility = false;

            argumentIndex = 0;
            elements = this;
            elementsWrapped = this;
        /* Otherwise, raw elements are being animated via the utility function. */
        } else {
            isUtility = true;

            argumentIndex = 1;
            elements = syntacticSugar ? (arguments[0].elements || arguments[0].e) : arguments[0];
        }

        elements = sanitizeElements(elements);

        if (!elements) {
            return;
        }

        if (syntacticSugar) {
            propertiesMap = arguments[0].properties || arguments[0].p;
            options = arguments[0].options || arguments[0].o;
        } else {
            propertiesMap = arguments[argumentIndex];
            options = arguments[argumentIndex + 1];
        }

        /* The length of the element set (in the form of a nodeList or an array of elements) is defaulted to 1 in case a
           single raw DOM element is passed in (which doesn't contain a length property). */
        var elementsLength = elements.length,
            elementsIndex = 0;

        /***************************
            Argument Overloading
        ***************************/

        /* Support is included for jQuery's argument overloading: $.animate(propertyMap [, duration] [, easing] [, complete]).
           Overloading is detected by checking for the absence of an object being passed into options. */
        /* Note: The stop and finish actions do not accept animation options, and are therefore excluded from this check. */
        if (!/^(stop|finish)$/i.test(propertiesMap) && !$.isPlainObject(options)) {
            /* The utility function shifts all arguments one position to the right, so we adjust for that offset. */
            var startingArgumentPosition = argumentIndex + 1;

            options = {};

            /* Iterate through all options arguments */
            for (var i = startingArgumentPosition; i < arguments.length; i++) {
                /* Treat a number as a duration. Parse it out. */
                /* Note: The following RegEx will return true if passed an array with a number as its first item.
                   Thus, arrays are skipped from this check. */
                if (!Type.isArray(arguments[i]) && (/^(fast|normal|slow)$/i.test(arguments[i]) || /^\d/.test(arguments[i]))) {
                    options.duration = arguments[i];
                /* Treat strings and arrays as easings. */
                } else if (Type.isString(arguments[i]) || Type.isArray(arguments[i])) {
                    options.easing = arguments[i];
                /* Treat a function as a complete callback. */
                } else if (Type.isFunction(arguments[i])) {
                    options.complete = arguments[i];
                }
            }
        }

        /***************
            Promises
        ***************/

        var promiseData = {
                promise: null,
                resolver: null,
                rejecter: null
            };

        /* If this call was made via the utility function (which is the default method of invocation when jQuery/Zepto are not being used), and if
           promise support was detected, create a promise object for this call and store references to its resolver and rejecter methods. The resolve
           method is used when a call completes naturally or is prematurely stopped by the user. In both cases, completeCall() handles the associated
           call cleanup and promise resolving logic. The reject method is used when an invalid set of arguments is passed into a Velocity call. */
        /* Note: Velocity employs a call-based queueing architecture, which means that stopping an animating element actually stops the full call that
           triggered it -- not that one element exclusively. Similarly, there is one promise per call, and all elements targeted by a Velocity call are
           grouped together for the purposes of resolving and rejecting a promise. */
        if (isUtility && Velocity.Promise) {
            promiseData.promise = new Velocity.Promise(function (resolve, reject) {
                promiseData.resolver = resolve;
                promiseData.rejecter = reject;
            });
        }

        /*********************
           Action Detection
        *********************/

        /* Velocity's behavior is categorized into "actions": Elements can either be specially scrolled into view,
           or they can be started, stopped, or reversed. If a literal or referenced properties map is passed in as Velocity's
           first argument, the associated action is "start". Alternatively, "scroll", "reverse", or "stop" can be passed in instead of a properties map. */
        var action;

        switch (propertiesMap) {
            case "scroll":
                action = "scroll";
                break;

            case "reverse":
                action = "reverse";
                break;

            case "finish":
            case "stop":
                /*******************
                    Action: Stop
                *******************/

                /* Clear the currently-active delay on each targeted element. */
                $.each(elements, function(i, element) {
                    if (Data(element) && Data(element).delayTimer) {
                        /* Stop the timer from triggering its cached next() function. */
                        clearTimeout(Data(element).delayTimer.setTimeout);

                        /* Manually call the next() function so that the subsequent queue items can progress. */
                        if (Data(element).delayTimer.next) {
                            Data(element).delayTimer.next();
                        }

                        delete Data(element).delayTimer;
                    }
                });

                var callsToStop = [];

                /* When the stop action is triggered, the elements' currently active call is immediately stopped. The active call might have
                   been applied to multiple elements, in which case all of the call's elements will be stopped. When an element
                   is stopped, the next item in its animation queue is immediately triggered. */
                /* An additional argument may be passed in to clear an element's remaining queued calls. Either true (which defaults to the "fx" queue)
                   or a custom queue string can be passed in. */
                /* Note: The stop command runs prior to Velocity's Queueing phase since its behavior is intended to take effect *immediately*,
                   regardless of the element's current queue state. */

                /* Iterate through every active call. */
                $.each(Velocity.State.calls, function(i, activeCall) {
                    /* Inactive calls are set to false by the logic inside completeCall(). Skip them. */
                    if (activeCall) {
                        /* Iterate through the active call's targeted elements. */
                        $.each(activeCall[1], function(k, activeElement) {
                            /* If true was passed in as a secondary argument, clear absolutely all calls on this element. Otherwise, only
                               clear calls associated with the relevant queue. */
                            /* Call stopping logic works as follows:
                               - options === true --> stop current default queue calls (and queue:false calls), including remaining queued ones.
                               - options === undefined --> stop current queue:"" call and all queue:false calls.
                               - options === false --> stop only queue:false calls.
                               - options === "custom" --> stop current queue:"custom" call, including remaining queued ones (there is no functionality to only clear the currently-running queue:"custom" call). */
                            var queueName = (options === undefined) ? "" : options;

                            if (queueName !== true && (activeCall[2].queue !== queueName) && !(options === undefined && activeCall[2].queue === false)) {
                                return true;
                            }

                            /* Iterate through the calls targeted by the stop command. */
                            $.each(elements, function(l, element) {                                
                                /* Check that this call was applied to the target element. */
                                if (element === activeElement) {
                                    /* Optionally clear the remaining queued calls. */
                                    if (options === true || Type.isString(options)) {
                                        /* Iterate through the items in the element's queue. */
                                        $.each($.queue(element, Type.isString(options) ? options : ""), function(_, item) {
                                            /* The queue array can contain an "inprogress" string, which we skip. */
                                            if (Type.isFunction(item)) {
                                                /* Pass the item's callback a flag indicating that we want to abort from the queue call.
                                                   (Specifically, the queue will resolve the call's associated promise then abort.)  */
                                                item(null, true);
                                            }
                                        });

                                        /* Clearing the $.queue() array is achieved by resetting it to []. */
                                        $.queue(element, Type.isString(options) ? options : "", []);
                                    }

                                    if (propertiesMap === "stop") {
                                        /* Since "reverse" uses cached start values (the previous call's endValues), these values must be
                                           changed to reflect the final value that the elements were actually tweened to. */
                                        /* Note: If only queue:false animations are currently running on an element, it won't have a tweensContainer
                                           object. Also, queue:false animations can't be reversed. */
                                        if (Data(element) && Data(element).tweensContainer && queueName !== false) {
                                            $.each(Data(element).tweensContainer, function(m, activeTween) {
                                                activeTween.endValue = activeTween.currentValue;
                                            });
                                        }

                                        callsToStop.push(i);
                                    } else if (propertiesMap === "finish") {
                                        /* To get active tweens to finish immediately, we forcefully shorten their durations to 1ms so that
                                        they finish upon the next rAf tick then proceed with normal call completion logic. */
                                        activeCall[2].duration = 1;
                                    }
                                }
                            });
                        });
                    }
                });

                /* Prematurely call completeCall() on each matched active call. Pass an additional flag for "stop" to indicate
                   that the complete callback and display:none setting should be skipped since we're completing prematurely. */
                if (propertiesMap === "stop") {
                    $.each(callsToStop, function(i, j) {
                        completeCall(j, true);
                    });

                    if (promiseData.promise) {
                        /* Immediately resolve the promise associated with this stop call since stop runs synchronously. */
                        promiseData.resolver(elements);
                    }
                }

                /* Since we're stopping, and not proceeding with queueing, exit out of Velocity. */
                return getChain();

            default:
                /* Treat a non-empty plain object as a literal properties map. */
                if ($.isPlainObject(propertiesMap) && !Type.isEmptyObject(propertiesMap)) {
                    action = "start";

                /****************
                    Redirects
                ****************/

                /* Check if a string matches a registered redirect (see Redirects above). */
                } else if (Type.isString(propertiesMap) && Velocity.Redirects[propertiesMap]) {
                    var opts = $.extend({}, options),
                        durationOriginal = opts.duration,
                        delayOriginal = opts.delay || 0;

                    /* If the backwards option was passed in, reverse the element set so that elements animate from the last to the first. */
                    if (opts.backwards === true) {
                        elements = $.extend(true, [], elements).reverse();
                    }

                    /* Individually trigger the redirect for each element in the set to prevent users from having to handle iteration logic in their redirect. */
                    $.each(elements, function(elementIndex, element) {
                        /* If the stagger option was passed in, successively delay each element by the stagger value (in ms). Retain the original delay value. */
                        if (parseFloat(opts.stagger)) {
                            opts.delay = delayOriginal + (parseFloat(opts.stagger) * elementIndex);
                        } else if (Type.isFunction(opts.stagger)) {
                            opts.delay = delayOriginal + opts.stagger.call(element, elementIndex, elementsLength);
                        }

                        /* If the drag option was passed in, successively increase/decrease (depending on the presense of opts.backwards)
                           the duration of each element's animation, using floors to prevent producing very short durations. */
                        if (opts.drag) {
                            /* Default the duration of UI pack effects (callouts and transitions) to 1000ms instead of the usual default duration of 400ms. */
                            opts.duration = parseFloat(durationOriginal) || (/^(callout|transition)/.test(propertiesMap) ? 1000 : DURATION_DEFAULT);

                            /* For each element, take the greater duration of: A) animation completion percentage relative to the original duration,
                               B) 75% of the original duration, or C) a 200ms fallback (in case duration is already set to a low value).
                               The end result is a baseline of 75% of the redirect's duration that increases/decreases as the end of the element set is approached. */
                            opts.duration = Math.max(opts.duration * (opts.backwards ? 1 - elementIndex/elementsLength : (elementIndex + 1) / elementsLength), opts.duration * 0.75, 200);
                        }

                        /* Pass in the call's opts object so that the redirect can optionally extend it. It defaults to an empty object instead of null to
                           reduce the opts checking logic required inside the redirect. */
                        Velocity.Redirects[propertiesMap].call(element, element, opts || {}, elementIndex, elementsLength, elements, promiseData.promise ? promiseData : undefined);
                    });

                    /* Since the animation logic resides within the redirect's own code, abort the remainder of this call.
                       (The performance overhead up to this point is virtually non-existant.) */
                    /* Note: The jQuery call chain is kept intact by returning the complete element set. */
                    return getChain();
                } else {
                    var abortError = "Velocity: First argument (" + propertiesMap + ") was not a property map, a known action, or a registered redirect. Aborting.";

                    if (promiseData.promise) {
                        promiseData.rejecter(new Error(abortError));
                    } else {
                        console.log(abortError);
                    }

                    return getChain();
                }
        }

        /**************************
            Call-Wide Variables
        **************************/

        /* A container for CSS unit conversion ratios (e.g. %, rem, and em ==> px) that is used to cache ratios across all elements
           being animated in a single Velocity call. Calculating unit ratios necessitates DOM querying and updating, and is therefore
           avoided (via caching) wherever possible. This container is call-wide instead of page-wide to avoid the risk of using stale
           conversion metrics across Velocity animations that are not immediately consecutively chained. */
        var callUnitConversionData = {
                lastParent: null,
                lastPosition: null,
                lastFontSize: null,
                lastPercentToPxWidth: null,
                lastPercentToPxHeight: null,
                lastEmToPx: null,
                remToPx: null,
                vwToPx: null,
                vhToPx: null
            };

        /* A container for all the ensuing tween data and metadata associated with this call. This container gets pushed to the page-wide
           Velocity.State.calls array that is processed during animation ticking. */
        var call = [];

        /************************
           Element Processing
        ************************/

        /* Element processing consists of three parts -- data processing that cannot go stale and data processing that *can* go stale (i.e. third-party style modifications):
           1) Pre-Queueing: Element-wide variables, including the element's data storage, are instantiated. Call options are prepared. If triggered, the Stop action is executed.
           2) Queueing: The logic that runs once this call has reached its point of execution in the element's $.queue() stack. Most logic is placed here to avoid risking it becoming stale.
           3) Pushing: Consolidation of the tween data followed by its push onto the global in-progress calls container.
        */

        function processElement () {

            /*************************
               Part I: Pre-Queueing
            *************************/

            /***************************
               Element-Wide Variables
            ***************************/

            var element = this,
                /* The runtime opts object is the extension of the current call's options and Velocity's page-wide option defaults. */
                opts = $.extend({}, Velocity.defaults, options),
                /* A container for the processed data associated with each property in the propertyMap.
                   (Each property in the map produces its own "tween".) */
                tweensContainer = {},
                elementUnitConversionData;

            /******************
               Element Init
            ******************/

            if (Data(element) === undefined) {
                Velocity.init(element);
            }

            /******************
               Option: Delay
            ******************/

            /* Since queue:false doesn't respect the item's existing queue, we avoid injecting its delay here (it's set later on). */
            /* Note: Velocity rolls its own delay function since jQuery doesn't have a utility alias for $.fn.delay()
               (and thus requires jQuery element creation, which we avoid since its overhead includes DOM querying). */
            if (parseFloat(opts.delay) && opts.queue !== false) {
                $.queue(element, opts.queue, function(next) {
                    /* This is a flag used to indicate to the upcoming completeCall() function that this queue entry was initiated by Velocity. See completeCall() for further details. */
                    Velocity.velocityQueueEntryFlag = true;

                    /* The ensuing queue item (which is assigned to the "next" argument that $.queue() automatically passes in) will be triggered after a setTimeout delay.
                       The setTimeout is stored so that it can be subjected to clearTimeout() if this animation is prematurely stopped via Velocity's "stop" command. */
                    Data(element).delayTimer = {
                        setTimeout: setTimeout(next, parseFloat(opts.delay)),
                        next: next
                    };
                });
            }

            /*********************
               Option: Duration
            *********************/

            /* Support for jQuery's named durations. */
            switch (opts.duration.toString().toLowerCase()) {
                case "fast":
                    opts.duration = 200;
                    break;

                case "normal":
                    opts.duration = DURATION_DEFAULT;
                    break;

                case "slow":
                    opts.duration = 600;
                    break;

                default:
                    /* Remove the potential "ms" suffix and default to 1 if the user is attempting to set a duration of 0 (in order to produce an immediate style change). */
                    opts.duration = parseFloat(opts.duration) || 1;
            }

            /************************
               Global Option: Mock
            ************************/

            if (Velocity.mock !== false) {
                /* In mock mode, all animations are forced to 1ms so that they occur immediately upon the next rAF tick.
                   Alternatively, a multiplier can be passed in to time remap all delays and durations. */
                if (Velocity.mock === true) {
                    opts.duration = opts.delay = 1;
                } else {
                    opts.duration *= parseFloat(Velocity.mock) || 1;
                    opts.delay *= parseFloat(Velocity.mock) || 1;
                }
            }

            /*******************
               Option: Easing
            *******************/

            opts.easing = getEasing(opts.easing, opts.duration);

            /**********************
               Option: Callbacks
            **********************/

            /* Callbacks must functions. Otherwise, default to null. */
            if (opts.begin && !Type.isFunction(opts.begin)) {
                opts.begin = null;
            }

            if (opts.progress && !Type.isFunction(opts.progress)) {
                opts.progress = null;
            }

            if (opts.complete && !Type.isFunction(opts.complete)) {
                opts.complete = null;
            }

            /*********************************
               Option: Display & Visibility
            *********************************/

            /* Refer to Velocity's documentation (VelocityJS.org/#displayAndVisibility) for a description of the display and visibility options' behavior. */
            /* Note: We strictly check for undefined instead of falsiness because display accepts an empty string value. */
            if (opts.display !== undefined && opts.display !== null) {
                opts.display = opts.display.toString().toLowerCase();

                /* Users can pass in a special "auto" value to instruct Velocity to set the element to its default display value. */
                if (opts.display === "auto") {
                    opts.display = Velocity.CSS.Values.getDisplayType(element);
                }
            }

            if (opts.visibility !== undefined && opts.visibility !== null) {
                opts.visibility = opts.visibility.toString().toLowerCase();
            }

            /**********************
               Option: mobileHA
            **********************/

            /* When set to true, and if this is a mobile device, mobileHA automatically enables hardware acceleration (via a null transform hack)
               on animating elements. HA is removed from the element at the completion of its animation. */
            /* Note: Android Gingerbread doesn't support HA. If a null transform hack (mobileHA) is in fact set, it will prevent other tranform subproperties from taking effect. */
            /* Note: You can read more about the use of mobileHA in Velocity's documentation: VelocityJS.org/#mobileHA. */
            opts.mobileHA = (opts.mobileHA && Velocity.State.isMobile && !Velocity.State.isGingerbread);

            /***********************
               Part II: Queueing
            ***********************/

            /* When a set of elements is targeted by a Velocity call, the set is broken up and each element has the current Velocity call individually queued onto it.
               In this way, each element's existing queue is respected; some elements may already be animating and accordingly should not have this current Velocity call triggered immediately. */
            /* In each queue, tween data is processed for each animating property then pushed onto the call-wide calls array. When the last element in the set has had its tweens processed,
               the call array is pushed to Velocity.State.calls for live processing by the requestAnimationFrame tick. */
            function buildQueue (next) {

                /*******************
                   Option: Begin
                *******************/

                /* The begin callback is fired once per call -- not once per elemenet -- and is passed the full raw DOM element set as both its context and its first argument. */
                if (opts.begin && elementsIndex === 0) {
                    /* We throw callbacks in a setTimeout so that thrown errors don't halt the execution of Velocity itself. */
                    try {
                        opts.begin.call(elements, elements);
                    } catch (error) {
                        setTimeout(function() { throw error; }, 1);
                    }
                }

                /*****************************************
                   Tween Data Construction (for Scroll)
                *****************************************/

                /* Note: In order to be subjected to chaining and animation options, scroll's tweening is routed through Velocity as if it were a standard CSS property animation. */
                if (action === "scroll") {
                    /* The scroll action uniquely takes an optional "offset" option -- specified in pixels -- that offsets the targeted scroll position. */
                    var scrollDirection = (/^x$/i.test(opts.axis) ? "Left" : "Top"),
                        scrollOffset = parseFloat(opts.offset) || 0,
                        scrollPositionCurrent,
                        scrollPositionCurrentAlternate,
                        scrollPositionEnd;

                    /* Scroll also uniquely takes an optional "container" option, which indicates the parent element that should be scrolled --
                       as opposed to the browser window itself. This is useful for scrolling toward an element that's inside an overflowing parent element. */
                    if (opts.container) {
                        /* Ensure that either a jQuery object or a raw DOM element was passed in. */
                        if (Type.isWrapped(opts.container) || Type.isNode(opts.container)) {
                            /* Extract the raw DOM element from the jQuery wrapper. */
                            opts.container = opts.container[0] || opts.container;
                            /* Note: Unlike other properties in Velocity, the browser's scroll position is never cached since it so frequently changes
                               (due to the user's natural interaction with the page). */
                            scrollPositionCurrent = opts.container["scroll" + scrollDirection]; /* GET */

                            /* $.position() values are relative to the container's currently viewable area (without taking into account the container's true dimensions
                               -- say, for example, if the container was not overflowing). Thus, the scroll end value is the sum of the child element's position *and*
                               the scroll container's current scroll position. */
                            scrollPositionEnd = (scrollPositionCurrent + $(element).position()[scrollDirection.toLowerCase()]) + scrollOffset; /* GET */
                        /* If a value other than a jQuery object or a raw DOM element was passed in, default to null so that this option is ignored. */
                        } else {
                            opts.container = null;
                        }
                    } else {
                        /* If the window itself is being scrolled -- not a containing element -- perform a live scroll position lookup using
                           the appropriate cached property names (which differ based on browser type). */
                        scrollPositionCurrent = Velocity.State.scrollAnchor[Velocity.State["scrollProperty" + scrollDirection]]; /* GET */
                        /* When scrolling the browser window, cache the alternate axis's current value since window.scrollTo() doesn't let us change only one value at a time. */
                        scrollPositionCurrentAlternate = Velocity.State.scrollAnchor[Velocity.State["scrollProperty" + (scrollDirection === "Left" ? "Top" : "Left")]]; /* GET */

                        /* Unlike $.position(), $.offset() values are relative to the browser window's true dimensions -- not merely its currently viewable area --
                           and therefore end values do not need to be compounded onto current values. */
                        scrollPositionEnd = $(element).offset()[scrollDirection.toLowerCase()] + scrollOffset; /* GET */
                    }

                    /* Since there's only one format that scroll's associated tweensContainer can take, we create it manually. */
                    tweensContainer = {
                        scroll: {
                            rootPropertyValue: false,
                            startValue: scrollPositionCurrent,
                            currentValue: scrollPositionCurrent,
                            endValue: scrollPositionEnd,
                            unitType: "",
                            easing: opts.easing,
                            scrollData: {
                                container: opts.container,
                                direction: scrollDirection,
                                alternateValue: scrollPositionCurrentAlternate
                            }
                        },
                        element: element
                    };

                    if (Velocity.debug) console.log("tweensContainer (scroll): ", tweensContainer.scroll, element);

                /******************************************
                   Tween Data Construction (for Reverse)
                ******************************************/

                /* Reverse acts like a "start" action in that a property map is animated toward. The only difference is
                   that the property map used for reverse is the inverse of the map used in the previous call. Thus, we manipulate
                   the previous call to construct our new map: use the previous map's end values as our new map's start values. Copy over all other data. */
                /* Note: Reverse can be directly called via the "reverse" parameter, or it can be indirectly triggered via the loop option. (Loops are composed of multiple reverses.) */
                /* Note: Reverse calls do not need to be consecutively chained onto a currently-animating element in order to operate on cached values;
                   there is no harm to reverse being called on a potentially stale data cache since reverse's behavior is simply defined
                   as reverting to the element's values as they were prior to the previous *Velocity* call. */
                } else if (action === "reverse") {
                    /* Abort if there is no prior animation data to reverse to. */
                    if (!Data(element).tweensContainer) {
                        /* Dequeue the element so that this queue entry releases itself immediately, allowing subsequent queue entries to run. */
                        $.dequeue(element, opts.queue);

                        return;
                    } else {
                        /*********************
                           Options Parsing
                        *********************/

                        /* If the element was hidden via the display option in the previous call,
                           revert display to "auto" prior to reversal so that the element is visible again. */
                        if (Data(element).opts.display === "none") {
                            Data(element).opts.display = "auto";
                        }

                        if (Data(element).opts.visibility === "hidden") {
                            Data(element).opts.visibility = "visible";
                        }

                        /* If the loop option was set in the previous call, disable it so that "reverse" calls aren't recursively generated.
                           Further, remove the previous call's callback options; typically, users do not want these to be refired. */
                        Data(element).opts.loop = false;
                        Data(element).opts.begin = null;
                        Data(element).opts.complete = null;

                        /* Since we're extending an opts object that has already been extended with the defaults options object,
                           we remove non-explicitly-defined properties that are auto-assigned values. */
                        if (!options.easing) {
                            delete opts.easing;
                        }

                        if (!options.duration) {
                            delete opts.duration;
                        }

                        /* The opts object used for reversal is an extension of the options object optionally passed into this
                           reverse call plus the options used in the previous Velocity call. */
                        opts = $.extend({}, Data(element).opts, opts);

                        /*************************************
                           Tweens Container Reconstruction
                        *************************************/

                        /* Create a deepy copy (indicated via the true flag) of the previous call's tweensContainer. */
                        var lastTweensContainer = $.extend(true, {}, Data(element).tweensContainer);

                        /* Manipulate the previous tweensContainer by replacing its end values and currentValues with its start values. */
                        for (var lastTween in lastTweensContainer) {
                            /* In addition to tween data, tweensContainers contain an element property that we ignore here. */
                            if (lastTween !== "element") {
                                var lastStartValue = lastTweensContainer[lastTween].startValue;

                                lastTweensContainer[lastTween].startValue = lastTweensContainer[lastTween].currentValue = lastTweensContainer[lastTween].endValue;
                                lastTweensContainer[lastTween].endValue = lastStartValue;

                                /* Easing is the only option that embeds into the individual tween data (since it can be defined on a per-property basis).
                                   Accordingly, every property's easing value must be updated when an options object is passed in with a reverse call.
                                   The side effect of this extensibility is that all per-property easing values are forcefully reset to the new value. */
                                if (!Type.isEmptyObject(options)) {
                                    lastTweensContainer[lastTween].easing = opts.easing;
                                }

                                if (Velocity.debug) console.log("reverse tweensContainer (" + lastTween + "): " + JSON.stringify(lastTweensContainer[lastTween]), element);
                            }
                        }

                        tweensContainer = lastTweensContainer;
                    }

                /*****************************************
                   Tween Data Construction (for Start)
                *****************************************/

                } else if (action === "start") {

                    /*************************
                        Value Transferring
                    *************************/

                    /* If this queue entry follows a previous Velocity-initiated queue entry *and* if this entry was created
                       while the element was in the process of being animated by Velocity, then this current call is safe to use
                       the end values from the prior call as its start values. Velocity attempts to perform this value transfer
                       process whenever possible in order to avoid requerying the DOM. */
                    /* If values aren't transferred from a prior call and start values were not forcefed by the user (more on this below),
                       then the DOM is queried for the element's current values as a last resort. */
                    /* Note: Conversely, animation reversal (and looping) *always* perform inter-call value transfers; they never requery the DOM. */
                    var lastTweensContainer;

                    /* The per-element isAnimating flag is used to indicate whether it's safe (i.e. the data isn't stale)
                       to transfer over end values to use as start values. If it's set to true and there is a previous
                       Velocity call to pull values from, do so. */
                    if (Data(element).tweensContainer && Data(element).isAnimating === true) {
                        lastTweensContainer = Data(element).tweensContainer;
                    }

                    /***************************
                       Tween Data Calculation
                    ***************************/

                    /* This function parses property data and defaults endValue, easing, and startValue as appropriate. */
                    /* Property map values can either take the form of 1) a single value representing the end value,
                       or 2) an array in the form of [ endValue, [, easing] [, startValue] ].
                       The optional third parameter is a forcefed startValue to be used instead of querying the DOM for
                       the element's current value. Read Velocity's docmentation to learn more about forcefeeding: VelocityJS.org/#forcefeeding */
                    function parsePropertyValue (valueData, skipResolvingEasing) {
                        var endValue = undefined,
                            easing = undefined,
                            startValue = undefined;

                        /* Handle the array format, which can be structured as one of three potential overloads:
                           A) [ endValue, easing, startValue ], B) [ endValue, easing ], or C) [ endValue, startValue ] */
                        if (Type.isArray(valueData)) {
                            /* endValue is always the first item in the array. Don't bother validating endValue's value now
                               since the ensuing property cycling logic does that. */
                            endValue = valueData[0];

                            /* Two-item array format: If the second item is a number, function, or hex string, treat it as a
                               start value since easings can only be non-hex strings or arrays. */
                            if ((!Type.isArray(valueData[1]) && /^[\d-]/.test(valueData[1])) || Type.isFunction(valueData[1]) || CSS.RegEx.isHex.test(valueData[1])) {
                                startValue = valueData[1];
                            /* Two or three-item array: If the second item is a non-hex string or an array, treat it as an easing. */
                            } else if ((Type.isString(valueData[1]) && !CSS.RegEx.isHex.test(valueData[1])) || Type.isArray(valueData[1])) {
                                easing = skipResolvingEasing ? valueData[1] : getEasing(valueData[1], opts.duration);

                                /* Don't bother validating startValue's value now since the ensuing property cycling logic inherently does that. */
                                if (valueData[2] !== undefined) {
                                    startValue = valueData[2];
                                }
                            }
                        /* Handle the single-value format. */
                        } else {
                            endValue = valueData;
                        }

                        /* Default to the call's easing if a per-property easing type was not defined. */
                        if (!skipResolvingEasing) {
                            easing = easing || opts.easing;
                        }

                        /* If functions were passed in as values, pass the function the current element as its context,
                           plus the element's index and the element set's size as arguments. Then, assign the returned value. */
                        if (Type.isFunction(endValue)) {
                            endValue = endValue.call(element, elementsIndex, elementsLength);
                        }

                        if (Type.isFunction(startValue)) {
                            startValue = startValue.call(element, elementsIndex, elementsLength);
                        }

                        /* Allow startValue to be left as undefined to indicate to the ensuing code that its value was not forcefed. */
                        return [ endValue || 0, easing, startValue ];
                    }

                    /* Cycle through each property in the map, looking for shorthand color properties (e.g. "color" as opposed to "colorRed"). Inject the corresponding
                       colorRed, colorGreen, and colorBlue RGB component tweens into the propertiesMap (which Velocity understands) and remove the shorthand property. */
                    $.each(propertiesMap, function(property, value) {
                        /* Find shorthand color properties that have been passed a hex string. */
                        if (RegExp("^" + CSS.Lists.colors.join("$|^") + "$").test(property)) {
                            /* Parse the value data for each shorthand. */
                            var valueData = parsePropertyValue(value, true),
                                endValue = valueData[0],
                                easing = valueData[1],
                                startValue = valueData[2];

                            if (CSS.RegEx.isHex.test(endValue)) {
                                /* Convert the hex strings into their RGB component arrays. */
                                var colorComponents = [ "Red", "Green", "Blue" ],
                                    endValueRGB = CSS.Values.hexToRgb(endValue),
                                    startValueRGB = startValue ? CSS.Values.hexToRgb(startValue) : undefined;

                                /* Inject the RGB component tweens into propertiesMap. */
                                for (var i = 0; i < colorComponents.length; i++) {
                                    var dataArray = [ endValueRGB[i] ];

                                    if (easing) {
                                        dataArray.push(easing);
                                    }

                                    if (startValueRGB !== undefined) {
                                        dataArray.push(startValueRGB[i]);
                                    }

                                    propertiesMap[property + colorComponents[i]] = dataArray;
                                }

                                /* Remove the intermediary shorthand property entry now that we've processed it. */
                                delete propertiesMap[property];
                            }
                        }
                    });

                    /* Create a tween out of each property, and append its associated data to tweensContainer. */
                    for (var property in propertiesMap) {

                        /**************************
                           Start Value Sourcing
                        **************************/

                        /* Parse out endValue, easing, and startValue from the property's data. */
                        var valueData = parsePropertyValue(propertiesMap[property]),
                            endValue = valueData[0],
                            easing = valueData[1],
                            startValue = valueData[2];

                        /* Now that the original property name's format has been used for the parsePropertyValue() lookup above,
                           we force the property to its camelCase styling to normalize it for manipulation. */
                        property = CSS.Names.camelCase(property);

                        /* In case this property is a hook, there are circumstances where we will intend to work on the hook's root property and not the hooked subproperty. */
                        var rootProperty = CSS.Hooks.getRoot(property),
                            rootPropertyValue = false;

                        /* Other than for the dummy tween property, properties that are not supported by the browser (and do not have an associated normalization) will
                           inherently produce no style changes when set, so they are skipped in order to decrease animation tick overhead.
                           Property support is determined via prefixCheck(), which returns a false flag when no supported is detected. */
                        /* Note: Since SVG elements have some of their properties directly applied as HTML attributes,
                           there is no way to check for their explicit browser support, and so we skip skip this check for them. */
                        if (!Data(element).isSVG && rootProperty !== "tween" && CSS.Names.prefixCheck(rootProperty)[1] === false && CSS.Normalizations.registered[rootProperty] === undefined) {
                            if (Velocity.debug) console.log("Skipping [" + rootProperty + "] due to a lack of browser support.");

                            continue;
                        }

                        /* If the display option is being set to a non-"none" (e.g. "block") and opacity (filter on IE<=8) is being
                           animated to an endValue of non-zero, the user's intention is to fade in from invisible, thus we forcefeed opacity
                           a startValue of 0 if its startValue hasn't already been sourced by value transferring or prior forcefeeding. */
                        if (((opts.display !== undefined && opts.display !== null && opts.display !== "none") || (opts.visibility !== undefined && opts.visibility !== "hidden")) && /opacity|filter/.test(property) && !startValue && endValue !== 0) {
                            startValue = 0;
                        }

                        /* If values have been transferred from the previous Velocity call, extract the endValue and rootPropertyValue
                           for all of the current call's properties that were *also* animated in the previous call. */
                        /* Note: Value transferring can optionally be disabled by the user via the _cacheValues option. */
                        if (opts._cacheValues && lastTweensContainer && lastTweensContainer[property]) {
                            if (startValue === undefined) {
                                startValue = lastTweensContainer[property].endValue + lastTweensContainer[property].unitType;
                            }

                            /* The previous call's rootPropertyValue is extracted from the element's data cache since that's the
                               instance of rootPropertyValue that gets freshly updated by the tweening process, whereas the rootPropertyValue
                               attached to the incoming lastTweensContainer is equal to the root property's value prior to any tweening. */
                            rootPropertyValue = Data(element).rootPropertyValueCache[rootProperty];
                        /* If values were not transferred from a previous Velocity call, query the DOM as needed. */
                        } else {
                            /* Handle hooked properties. */
                            if (CSS.Hooks.registered[property]) {
                               if (startValue === undefined) {
                                    rootPropertyValue = CSS.getPropertyValue(element, rootProperty); /* GET */
                                    /* Note: The following getPropertyValue() call does not actually trigger a DOM query;
                                       getPropertyValue() will extract the hook from rootPropertyValue. */
                                    startValue = CSS.getPropertyValue(element, property, rootPropertyValue);
                                /* If startValue is already defined via forcefeeding, do not query the DOM for the root property's value;
                                   just grab rootProperty's zero-value template from CSS.Hooks. This overwrites the element's actual
                                   root property value (if one is set), but this is acceptable since the primary reason users forcefeed is
                                   to avoid DOM queries, and thus we likewise avoid querying the DOM for the root property's value. */
                                } else {
                                    /* Grab this hook's zero-value template, e.g. "0px 0px 0px black". */
                                    rootPropertyValue = CSS.Hooks.templates[rootProperty][1];
                                }
                            /* Handle non-hooked properties that haven't already been defined via forcefeeding. */
                            } else if (startValue === undefined) {
                                startValue = CSS.getPropertyValue(element, property); /* GET */
                            }
                        }

                        /**************************
                           Value Data Extraction
                        **************************/

                        var separatedValue,
                            endValueUnitType,
                            startValueUnitType,
                            operator = false;

                        /* Separates a property value into its numeric value and its unit type. */
                        function separateValue (property, value) {
                            var unitType,
                                numericValue;

                            numericValue = (value || "0")
                                .toString()
                                .toLowerCase()
                                /* Match the unit type at the end of the value. */
                                .replace(/[%A-z]+$/, function(match) {
                                    /* Grab the unit type. */
                                    unitType = match;

                                    /* Strip the unit type off of value. */
                                    return "";
                                });

                            /* If no unit type was supplied, assign one that is appropriate for this property (e.g. "deg" for rotateZ or "px" for width). */
                            if (!unitType) {
                                unitType = CSS.Values.getUnitType(property);
                            }

                            return [ numericValue, unitType ];
                        }

                        /* Separate startValue. */
                        separatedValue = separateValue(property, startValue);
                        startValue = separatedValue[0];
                        startValueUnitType = separatedValue[1];

                        /* Separate endValue, and extract a value operator (e.g. "+=", "-=") if one exists. */
                        separatedValue = separateValue(property, endValue);
                        endValue = separatedValue[0].replace(/^([+-\/*])=/, function(match, subMatch) {
                            operator = subMatch;

                            /* Strip the operator off of the value. */
                            return "";
                        });
                        endValueUnitType = separatedValue[1];

                        /* Parse float values from endValue and startValue. Default to 0 if NaN is returned. */
                        startValue = parseFloat(startValue) || 0;
                        endValue = parseFloat(endValue) || 0;

                        /***************************************
                           Property-Specific Value Conversion
                        ***************************************/

                        /* Custom support for properties that don't actually accept the % unit type, but where pollyfilling is trivial and relatively foolproof. */
                        if (endValueUnitType === "%") {
                            /* A %-value fontSize/lineHeight is relative to the parent's fontSize (as opposed to the parent's dimensions),
                               which is identical to the em unit's behavior, so we piggyback off of that. */
                            if (/^(fontSize|lineHeight)$/.test(property)) {
                                /* Convert % into an em decimal value. */
                                endValue = endValue / 100;
                                endValueUnitType = "em";
                            /* For scaleX and scaleY, convert the value into its decimal format and strip off the unit type. */
                            } else if (/^scale/.test(property)) {
                                endValue = endValue / 100;
                                endValueUnitType = "";
                            /* For RGB components, take the defined percentage of 255 and strip off the unit type. */
                            } else if (/(Red|Green|Blue)$/i.test(property)) {
                                endValue = (endValue / 100) * 255;
                                endValueUnitType = "";
                            }
                        }

                        /***************************
                           Unit Ratio Calculation
                        ***************************/

                        /* When queried, the browser returns (most) CSS property values in pixels. Therefore, if an endValue with a unit type of
                           %, em, or rem is animated toward, startValue must be converted from pixels into the same unit type as endValue in order
                           for value manipulation logic (increment/decrement) to proceed. Further, if the startValue was forcefed or transferred
                           from a previous call, startValue may also not be in pixels. Unit conversion logic therefore consists of two steps:
                           1) Calculating the ratio of %/em/rem/vh/vw relative to pixels
                           2) Converting startValue into the same unit of measurement as endValue based on these ratios. */
                        /* Unit conversion ratios are calculated by inserting a sibling node next to the target node, copying over its position property,
                           setting values with the target unit type then comparing the returned pixel value. */
                        /* Note: Even if only one of these unit types is being animated, all unit ratios are calculated at once since the overhead
                           of batching the SETs and GETs together upfront outweights the potential overhead
                           of layout thrashing caused by re-querying for uncalculated ratios for subsequently-processed properties. */
                        /* Todo: Shift this logic into the calls' first tick instance so that it's synced with RAF. */
                        function calculateUnitRatios () {

                            /************************
                                Same Ratio Checks
                            ************************/

                            /* The properties below are used to determine whether the element differs sufficiently from this call's
                               previously iterated element to also differ in its unit conversion ratios. If the properties match up with those
                               of the prior element, the prior element's conversion ratios are used. Like most optimizations in Velocity,
                               this is done to minimize DOM querying. */
                            var sameRatioIndicators = {
                                    myParent: element.parentNode || document.body, /* GET */
                                    position: CSS.getPropertyValue(element, "position"), /* GET */
                                    fontSize: CSS.getPropertyValue(element, "fontSize") /* GET */
                                },
                                /* Determine if the same % ratio can be used. % is based on the element's position value and its parent's width and height dimensions. */
                                samePercentRatio = ((sameRatioIndicators.position === callUnitConversionData.lastPosition) && (sameRatioIndicators.myParent === callUnitConversionData.lastParent)),
                                /* Determine if the same em ratio can be used. em is relative to the element's fontSize. */
                                sameEmRatio = (sameRatioIndicators.fontSize === callUnitConversionData.lastFontSize);

                            /* Store these ratio indicators call-wide for the next element to compare against. */
                            callUnitConversionData.lastParent = sameRatioIndicators.myParent;
                            callUnitConversionData.lastPosition = sameRatioIndicators.position;
                            callUnitConversionData.lastFontSize = sameRatioIndicators.fontSize;

                            /***************************
                               Element-Specific Units
                            ***************************/

                            /* Note: IE8 rounds to the nearest pixel when returning CSS values, thus we perform conversions using a measurement
                               of 100 (instead of 1) to give our ratios a precision of at least 2 decimal values. */
                            var measurement = 100,
                                unitRatios = {};

                            if (!sameEmRatio || !samePercentRatio) {
                                var dummy = Data(element).isSVG ? document.createElementNS("http://www.w3.org/2000/svg", "rect") : document.createElement("div");

                                Velocity.init(dummy);
                                sameRatioIndicators.myParent.appendChild(dummy);

                                /* To accurately and consistently calculate conversion ratios, the element's cascaded overflow and box-sizing are stripped.
                                   Similarly, since width/height can be artificially constrained by their min-/max- equivalents, these are controlled for as well. */
                                /* Note: Overflow must be also be controlled for per-axis since the overflow property overwrites its per-axis values. */
                                $.each([ "overflow", "overflowX", "overflowY" ], function(i, property) {
                                    Velocity.CSS.setPropertyValue(dummy, property, "hidden");
                                });
                                Velocity.CSS.setPropertyValue(dummy, "position", sameRatioIndicators.position);
                                Velocity.CSS.setPropertyValue(dummy, "fontSize", sameRatioIndicators.fontSize);
                                Velocity.CSS.setPropertyValue(dummy, "boxSizing", "content-box");

                                /* width and height act as our proxy properties for measuring the horizontal and vertical % ratios. */
                                $.each([ "minWidth", "maxWidth", "width", "minHeight", "maxHeight", "height" ], function(i, property) {
                                    Velocity.CSS.setPropertyValue(dummy, property, measurement + "%");
                                });
                                /* paddingLeft arbitrarily acts as our proxy property for the em ratio. */
                                Velocity.CSS.setPropertyValue(dummy, "paddingLeft", measurement + "em");

                                /* Divide the returned value by the measurement to get the ratio between 1% and 1px. Default to 1 since working with 0 can produce Infinite. */
                                unitRatios.percentToPxWidth = callUnitConversionData.lastPercentToPxWidth = (parseFloat(CSS.getPropertyValue(dummy, "width", null, true)) || 1) / measurement; /* GET */
                                unitRatios.percentToPxHeight = callUnitConversionData.lastPercentToPxHeight = (parseFloat(CSS.getPropertyValue(dummy, "height", null, true)) || 1) / measurement; /* GET */
                                unitRatios.emToPx = callUnitConversionData.lastEmToPx = (parseFloat(CSS.getPropertyValue(dummy, "paddingLeft")) || 1) / measurement; /* GET */

                                sameRatioIndicators.myParent.removeChild(dummy);
                            } else {
                                unitRatios.emToPx = callUnitConversionData.lastEmToPx;
                                unitRatios.percentToPxWidth = callUnitConversionData.lastPercentToPxWidth;
                                unitRatios.percentToPxHeight = callUnitConversionData.lastPercentToPxHeight;
                            }

                            /***************************
                               Element-Agnostic Units
                            ***************************/

                            /* Whereas % and em ratios are determined on a per-element basis, the rem unit only needs to be checked
                               once per call since it's exclusively dependant upon document.body's fontSize. If this is the first time
                               that calculateUnitRatios() is being run during this call, remToPx will still be set to its default value of null,
                               so we calculate it now. */
                            if (callUnitConversionData.remToPx === null) {
                                /* Default to browsers' default fontSize of 16px in the case of 0. */
                                callUnitConversionData.remToPx = parseFloat(CSS.getPropertyValue(document.body, "fontSize")) || 16; /* GET */
                            }

                            /* Similarly, viewport units are %-relative to the window's inner dimensions. */
                            if (callUnitConversionData.vwToPx === null) {
                                callUnitConversionData.vwToPx = parseFloat(window.innerWidth) / 100; /* GET */
                                callUnitConversionData.vhToPx = parseFloat(window.innerHeight) / 100; /* GET */
                            }

                            unitRatios.remToPx = callUnitConversionData.remToPx;
                            unitRatios.vwToPx = callUnitConversionData.vwToPx;
                            unitRatios.vhToPx = callUnitConversionData.vhToPx;

                            if (Velocity.debug >= 1) console.log("Unit ratios: " + JSON.stringify(unitRatios), element);

                            return unitRatios;
                        }

                        /********************
                           Unit Conversion
                        ********************/

                        /* The * and / operators, which are not passed in with an associated unit, inherently use startValue's unit. Skip value and unit conversion. */
                        if (/[\/*]/.test(operator)) {
                            endValueUnitType = startValueUnitType;
                        /* If startValue and endValue differ in unit type, convert startValue into the same unit type as endValue so that if endValueUnitType
                           is a relative unit (%, em, rem), the values set during tweening will continue to be accurately relative even if the metrics they depend
                           on are dynamically changing during the course of the animation. Conversely, if we always normalized into px and used px for setting values, the px ratio
                           would become stale if the original unit being animated toward was relative and the underlying metrics change during the animation. */
                        /* Since 0 is 0 in any unit type, no conversion is necessary when startValue is 0 -- we just start at 0 with endValueUnitType. */
                        } else if ((startValueUnitType !== endValueUnitType) && startValue !== 0) {
                            /* Unit conversion is also skipped when endValue is 0, but *startValueUnitType* must be used for tween values to remain accurate. */
                            /* Note: Skipping unit conversion here means that if endValueUnitType was originally a relative unit, the animation won't relatively
                               match the underlying metrics if they change, but this is acceptable since we're animating toward invisibility instead of toward visibility,
                               which remains past the point of the animation's completion. */
                            if (endValue === 0) {
                                endValueUnitType = startValueUnitType;
                            } else {
                                /* By this point, we cannot avoid unit conversion (it's undesirable since it causes layout thrashing).
                                   If we haven't already, we trigger calculateUnitRatios(), which runs once per element per call. */
                                elementUnitConversionData = elementUnitConversionData || calculateUnitRatios();

                                /* The following RegEx matches CSS properties that have their % values measured relative to the x-axis. */
                                /* Note: W3C spec mandates that all of margin and padding's properties (even top and bottom) are %-relative to the *width* of the parent element. */
                                var axis = (/margin|padding|left|right|width|text|word|letter/i.test(property) || /X$/.test(property) || property === "x") ? "x" : "y";

                                /* In order to avoid generating n^2 bespoke conversion functions, unit conversion is a two-step process:
                                   1) Convert startValue into pixels. 2) Convert this new pixel value into endValue's unit type. */
                                switch (startValueUnitType) {
                                    case "%":
                                        /* Note: translateX and translateY are the only properties that are %-relative to an element's own dimensions -- not its parent's dimensions.
                                           Velocity does not include a special conversion process to account for this behavior. Therefore, animating translateX/Y from a % value
                                           to a non-% value will produce an incorrect start value. Fortunately, this sort of cross-unit conversion is rarely done by users in practice. */
                                        startValue *= (axis === "x" ? elementUnitConversionData.percentToPxWidth : elementUnitConversionData.percentToPxHeight);
                                        break;

                                    case "px":
                                        /* px acts as our midpoint in the unit conversion process; do nothing. */
                                        break;

                                    default:
                                        startValue *= elementUnitConversionData[startValueUnitType + "ToPx"];
                                }

                                /* Invert the px ratios to convert into to the target unit. */
                                switch (endValueUnitType) {
                                    case "%":
                                        startValue *= 1 / (axis === "x" ? elementUnitConversionData.percentToPxWidth : elementUnitConversionData.percentToPxHeight);
                                        break;

                                    case "px":
                                        /* startValue is already in px, do nothing; we're done. */
                                        break;

                                    default:
                                        startValue *= 1 / elementUnitConversionData[endValueUnitType + "ToPx"];
                                }
                            }
                        }

                        /*********************
                           Relative Values
                        *********************/

                        /* Operator logic must be performed last since it requires unit-normalized start and end values. */
                        /* Note: Relative *percent values* do not behave how most people think; while one would expect "+=50%"
                           to increase the property 1.5x its current value, it in fact increases the percent units in absolute terms:
                           50 points is added on top of the current % value. */
                        switch (operator) {
                            case "+":
                                endValue = startValue + endValue;
                                break;

                            case "-":
                                endValue = startValue - endValue;
                                break;

                            case "*":
                                endValue = startValue * endValue;
                                break;

                            case "/":
                                endValue = startValue / endValue;
                                break;
                        }

                        /**************************
                           tweensContainer Push
                        **************************/

                        /* Construct the per-property tween object, and push it to the element's tweensContainer. */
                        tweensContainer[property] = {
                            rootPropertyValue: rootPropertyValue,
                            startValue: startValue,
                            currentValue: startValue,
                            endValue: endValue,
                            unitType: endValueUnitType,
                            easing: easing
                        };

                        if (Velocity.debug) console.log("tweensContainer (" + property + "): " + JSON.stringify(tweensContainer[property]), element);
                    }

                    /* Along with its property data, store a reference to the element itself onto tweensContainer. */
                    tweensContainer.element = element;
                }

                /*****************
                    Call Push
                *****************/

                /* Note: tweensContainer can be empty if all of the properties in this call's property map were skipped due to not
                   being supported by the browser. The element property is used for checking that the tweensContainer has been appended to. */
                if (tweensContainer.element) {
                    /* Apply the "velocity-animating" indicator class. */
                    CSS.Values.addClass(element, "velocity-animating");

                    /* The call array houses the tweensContainers for each element being animated in the current call. */
                    call.push(tweensContainer);

                    /* Store the tweensContainer and options if we're working on the default effects queue, so that they can be used by the reverse command. */
                    if (opts.queue === "") {
                        Data(element).tweensContainer = tweensContainer;
                        Data(element).opts = opts;
                    }

                    /* Switch on the element's animating flag. */
                    Data(element).isAnimating = true;

                    /* Once the final element in this call's element set has been processed, push the call array onto
                       Velocity.State.calls for the animation tick to immediately begin processing. */
                    if (elementsIndex === elementsLength - 1) {
                        /* Add the current call plus its associated metadata (the element set and the call's options) onto the global call container.
                           Anything on this call container is subjected to tick() processing. */
                        Velocity.State.calls.push([ call, elements, opts, null, promiseData.resolver ]);

                        /* If the animation tick isn't running, start it. (Velocity shuts it off when there are no active calls to process.) */
                        if (Velocity.State.isTicking === false) {
                            Velocity.State.isTicking = true;

                            /* Start the tick loop. */
                            tick();
                        }
                    } else {
                        elementsIndex++;
                    }
                }
            }

            /* When the queue option is set to false, the call skips the element's queue and fires immediately. */
            if (opts.queue === false) {
                /* Since this buildQueue call doesn't respect the element's existing queue (which is where a delay option would have been appended),
                   we manually inject the delay property here with an explicit setTimeout. */
                if (opts.delay) {
                    setTimeout(buildQueue, opts.delay);
                } else {
                    buildQueue();
                }
            /* Otherwise, the call undergoes element queueing as normal. */
            /* Note: To interoperate with jQuery, Velocity uses jQuery's own $.queue() stack for queuing logic. */
            } else {
                $.queue(element, opts.queue, function(next, clearQueue) {
                    /* If the clearQueue flag was passed in by the stop command, resolve this call's promise. (Promises can only be resolved once,
                       so it's fine if this is repeatedly triggered for each element in the associated call.) */
                    if (clearQueue === true) {
                        if (promiseData.promise) {
                            promiseData.resolver(elements);
                        }

                        /* Do not continue with animation queueing. */
                        return true;
                    }

                    /* This flag indicates to the upcoming completeCall() function that this queue entry was initiated by Velocity.
                       See completeCall() for further details. */
                    Velocity.velocityQueueEntryFlag = true;

                    buildQueue(next);
                });
            }

            /*********************
                Auto-Dequeuing
            *********************/

            /* As per jQuery's $.queue() behavior, to fire the first non-custom-queue entry on an element, the element
               must be dequeued if its queue stack consists *solely* of the current call. (This can be determined by checking
               for the "inprogress" item that jQuery prepends to active queue stack arrays.) Regardless, whenever the element's
               queue is further appended with additional items -- including $.delay()'s or even $.animate() calls, the queue's
               first entry is automatically fired. This behavior contrasts that of custom queues, which never auto-fire. */
            /* Note: When an element set is being subjected to a non-parallel Velocity call, the animation will not begin until
               each one of the elements in the set has reached the end of its individually pre-existing queue chain. */
            /* Note: Unfortunately, most people don't fully grasp jQuery's powerful, yet quirky, $.queue() function.
               Lean more here: http://stackoverflow.com/questions/1058158/can-somebody-explain-jquery-queue-to-me */
            if ((opts.queue === "" || opts.queue === "fx") && $.queue(element)[0] !== "inprogress") {
                $.dequeue(element);
            }
        }

        /**************************
           Element Set Iteration
        **************************/

        /* If the "nodeType" property exists on the elements variable, we're animating a single element.
           Place it in an array so that $.each() can iterate over it. */
        $.each(elements, function(i, element) {
            /* Ensure each element in a set has a nodeType (is a real element) to avoid throwing errors. */
            if (Type.isNode(element)) {
                processElement.call(element);
            }
        });

        /******************
           Option: Loop
        ******************/

        /* The loop option accepts an integer indicating how many times the element should loop between the values in the
           current call's properties map and the element's property values prior to this call. */
        /* Note: The loop option's logic is performed here -- after element processing -- because the current call needs
           to undergo its queue insertion prior to the loop option generating its series of constituent "reverse" calls,
           which chain after the current call. Two reverse calls (two "alternations") constitute one loop. */
        var opts = $.extend({}, Velocity.defaults, options),
            reverseCallsCount;

        opts.loop = parseInt(opts.loop);
        reverseCallsCount = (opts.loop * 2) - 1;

        if (opts.loop) {
            /* Double the loop count to convert it into its appropriate number of "reverse" calls.
               Subtract 1 from the resulting value since the current call is included in the total alternation count. */
            for (var x = 0; x < reverseCallsCount; x++) {
                /* Since the logic for the reverse action occurs inside Queueing and therefore this call's options object
                   isn't parsed until then as well, the current call's delay option must be explicitly passed into the reverse
                   call so that the delay logic that occurs inside *Pre-Queueing* can process it. */
                var reverseOptions = {
                    delay: opts.delay,
                    progress: opts.progress
                };

                /* If a complete callback was passed into this call, transfer it to the loop redirect's final "reverse" call
                   so that it's triggered when the entire redirect is complete (and not when the very first animation is complete). */
                if (x === reverseCallsCount - 1) {
                    reverseOptions.display = opts.display;
                    reverseOptions.visibility = opts.visibility;
                    reverseOptions.complete = opts.complete;
                }

                animate(elements, "reverse", reverseOptions);
            }
        }

        /***************
            Chaining
        ***************/

        /* Return the elements back to the call chain, with wrapped elements taking precedence in case Velocity was called via the $.fn. extension. */
        return getChain();
    };

    /* Turn Velocity into the animation function, extended with the pre-existing Velocity object. */
    Velocity = $.extend(animate, Velocity);
    /* For legacy support, also expose the literal animate method. */
    Velocity.animate = animate;

    /**************
        Timing
    **************/

    /* Ticker function. */
    var ticker = window.requestAnimationFrame || rAFShim;

    /* Inactive browser tabs pause rAF, which results in all active animations immediately sprinting to their completion states when the tab refocuses.
       To get around this, we dynamically switch rAF to setTimeout (which the browser *doesn't* pause) when the tab loses focus. We skip this for mobile
       devices to avoid wasting battery power on inactive tabs. */
    /* Note: Tab focus detection doesn't work on older versions of IE, but that's okay since they don't support rAF to begin with. */
    if (!Velocity.State.isMobile && document.hidden !== undefined) {
        document.addEventListener("visibilitychange", function() {
            /* Reassign the rAF function (which the global tick() function uses) based on the tab's focus state. */
            if (document.hidden) {
                ticker = function(callback) {
                    /* The tick function needs a truthy first argument in order to pass its internal timestamp check. */
                    return setTimeout(function() { callback(true) }, 16);
                };

                /* The rAF loop has been paused by the browser, so we manually restart the tick. */
                tick();
            } else {
                ticker = window.requestAnimationFrame || rAFShim;
            }
        });
    }

    /************
        Tick
    ************/

    /* Note: All calls to Velocity are pushed to the Velocity.State.calls array, which is fully iterated through upon each tick. */
    function tick (timestamp) {
        /* An empty timestamp argument indicates that this is the first tick occurence since ticking was turned on.
           We leverage this metadata to fully ignore the first tick pass since RAF's initial pass is fired whenever
           the browser's next tick sync time occurs, which results in the first elements subjected to Velocity
           calls being animated out of sync with any elements animated immediately thereafter. In short, we ignore
           the first RAF tick pass so that elements being immediately consecutively animated -- instead of simultaneously animated
           by the same Velocity call -- are properly batched into the same initial RAF tick and consequently remain in sync thereafter. */
        if (timestamp) {
            /* We ignore RAF's high resolution timestamp since it can be significantly offset when the browser is
               under high stress; we opt for choppiness over allowing the browser to drop huge chunks of frames. */
            var timeCurrent = (new Date).getTime();

            /********************
               Call Iteration
            ********************/

            var callsLength = Velocity.State.calls.length;

            /* To speed up iterating over this array, it is compacted (falsey items -- calls that have completed -- are removed)
               when its length has ballooned to a point that can impact tick performance. This only becomes necessary when animation
               has been continuous with many elements over a long period of time; whenever all active calls are completed, completeCall() clears Velocity.State.calls. */
            if (callsLength > 10000) {
                Velocity.State.calls = compactSparseArray(Velocity.State.calls);
            }

            /* Iterate through each active call. */
            for (var i = 0; i < callsLength; i++) {
                /* When a Velocity call is completed, its Velocity.State.calls entry is set to false. Continue on to the next call. */
                if (!Velocity.State.calls[i]) {
                    continue;
                }

                /************************
                   Call-Wide Variables
                ************************/

                var callContainer = Velocity.State.calls[i],
                    call = callContainer[0],
                    opts = callContainer[2],
                    timeStart = callContainer[3],
                    firstTick = !!timeStart,
                    tweenDummyValue = null;

                /* If timeStart is undefined, then this is the first time that this call has been processed by tick().
                   We assign timeStart now so that its value is as close to the real animation start time as possible.
                   (Conversely, had timeStart been defined when this call was added to Velocity.State.calls, the delay
                   between that time and now would cause the first few frames of the tween to be skipped since
                   percentComplete is calculated relative to timeStart.) */
                /* Further, subtract 16ms (the approximate resolution of RAF) from the current time value so that the
                   first tick iteration isn't wasted by animating at 0% tween completion, which would produce the
                   same style value as the element's current value. */
                if (!timeStart) {
                    timeStart = Velocity.State.calls[i][3] = timeCurrent - 16;
                }

                /* The tween's completion percentage is relative to the tween's start time, not the tween's start value
                   (which would result in unpredictable tween durations since JavaScript's timers are not particularly accurate).
                   Accordingly, we ensure that percentComplete does not exceed 1. */
                var percentComplete = Math.min((timeCurrent - timeStart) / opts.duration, 1);

                /**********************
                   Element Iteration
                **********************/

                /* For every call, iterate through each of the elements in its set. */
                for (var j = 0, callLength = call.length; j < callLength; j++) {
                    var tweensContainer = call[j],
                        element = tweensContainer.element;

                    /* Check to see if this element has been deleted midway through the animation by checking for the
                       continued existence of its data cache. If it's gone, skip animating this element. */
                    if (!Data(element)) {
                        continue;
                    }

                    var transformPropertyExists = false;

                    /**********************************
                       Display & Visibility Toggling
                    **********************************/

                    /* If the display option is set to non-"none", set it upfront so that the element can become visible before tweening begins.
                       (Otherwise, display's "none" value is set in completeCall() once the animation has completed.) */
                    if (opts.display !== undefined && opts.display !== null && opts.display !== "none") {
                        if (opts.display === "flex") {
                            var flexValues = [ "-webkit-box", "-moz-box", "-ms-flexbox", "-webkit-flex" ];

                            $.each(flexValues, function(i, flexValue) {
                                CSS.setPropertyValue(element, "display", flexValue);
                            });
                        }

                        CSS.setPropertyValue(element, "display", opts.display);
                    }

                    /* Same goes with the visibility option, but its "none" equivalent is "hidden". */
                    if (opts.visibility !== undefined && opts.visibility !== "hidden") {
                        CSS.setPropertyValue(element, "visibility", opts.visibility);
                    }

                    /************************
                       Property Iteration
                    ************************/

                    /* For every element, iterate through each property. */
                    for (var property in tweensContainer) {
                        /* Note: In addition to property tween data, tweensContainer contains a reference to its associated element. */
                        if (property !== "element") {
                            var tween = tweensContainer[property],
                                currentValue,
                                /* Easing can either be a pre-genereated function or a string that references a pre-registered easing
                                   on the Velocity.Easings object. In either case, return the appropriate easing *function*. */
                                easing = Type.isString(tween.easing) ? Velocity.Easings[tween.easing] : tween.easing;

                            /******************************
                               Current Value Calculation
                            ******************************/

                            /* If this is the last tick pass (if we've reached 100% completion for this tween),
                               ensure that currentValue is explicitly set to its target endValue so that it's not subjected to any rounding. */
                            if (percentComplete === 1) {
                                currentValue = tween.endValue;
                            /* Otherwise, calculate currentValue based on the current delta from startValue. */
                            } else {
                                var tweenDelta = tween.endValue - tween.startValue;
                                currentValue = tween.startValue + (tweenDelta * easing(percentComplete, opts, tweenDelta));

                                /* If no value change is occurring, don't proceed with DOM updating. */
                                if (!firstTick && (currentValue === tween.currentValue)) {
                                    continue;
                                }
                            }

                            tween.currentValue = currentValue;

                            /* If we're tweening a fake 'tween' property in order to log transition values, update the one-per-call variable so that
                               it can be passed into the progress callback. */ 
                            if (property === "tween") {
                                tweenDummyValue = currentValue;
                            } else {
                                /******************
                                   Hooks: Part I
                                ******************/

                                /* For hooked properties, the newly-updated rootPropertyValueCache is cached onto the element so that it can be used
                                   for subsequent hooks in this call that are associated with the same root property. If we didn't cache the updated
                                   rootPropertyValue, each subsequent update to the root property in this tick pass would reset the previous hook's
                                   updates to rootPropertyValue prior to injection. A nice performance byproduct of rootPropertyValue caching is that
                                   subsequently chained animations using the same hookRoot but a different hook can use this cached rootPropertyValue. */
                                if (CSS.Hooks.registered[property]) {
                                    var hookRoot = CSS.Hooks.getRoot(property),
                                        rootPropertyValueCache = Data(element).rootPropertyValueCache[hookRoot];

                                    if (rootPropertyValueCache) {
                                        tween.rootPropertyValue = rootPropertyValueCache;
                                    }
                                }

                                /*****************
                                    DOM Update
                                *****************/

                                /* setPropertyValue() returns an array of the property name and property value post any normalization that may have been performed. */
                                /* Note: To solve an IE<=8 positioning bug, the unit type is dropped when setting a property value of 0. */
                                var adjustedSetData = CSS.setPropertyValue(element, /* SET */
                                                                           property,
                                                                           tween.currentValue + (parseFloat(currentValue) === 0 ? "" : tween.unitType),
                                                                           tween.rootPropertyValue,
                                                                           tween.scrollData);

                                /*******************
                                   Hooks: Part II
                                *******************/

                                /* Now that we have the hook's updated rootPropertyValue (the post-processed value provided by adjustedSetData), cache it onto the element. */
                                if (CSS.Hooks.registered[property]) {
                                    /* Since adjustedSetData contains normalized data ready for DOM updating, the rootPropertyValue needs to be re-extracted from its normalized form. ?? */
                                    if (CSS.Normalizations.registered[hookRoot]) {
                                        Data(element).rootPropertyValueCache[hookRoot] = CSS.Normalizations.registered[hookRoot]("extract", null, adjustedSetData[1]);
                                    } else {
                                        Data(element).rootPropertyValueCache[hookRoot] = adjustedSetData[1];
                                    }
                                }

                                /***************
                                   Transforms
                                ***************/

                                /* Flag whether a transform property is being animated so that flushTransformCache() can be triggered once this tick pass is complete. */
                                if (adjustedSetData[0] === "transform") {
                                    transformPropertyExists = true;
                                }

                            }
                        }
                    }

                    /****************
                        mobileHA
                    ****************/

                    /* If mobileHA is enabled, set the translate3d transform to null to force hardware acceleration.
                       It's safe to override this property since Velocity doesn't actually support its animation (hooks are used in its place). */
                    if (opts.mobileHA) {
                        /* Don't set the null transform hack if we've already done so. */
                        if (Data(element).transformCache.translate3d === undefined) {
                            /* All entries on the transformCache object are later concatenated into a single transform string via flushTransformCache(). */
                            Data(element).transformCache.translate3d = "(0px, 0px, 0px)";

                            transformPropertyExists = true;
                        }
                    }

                    if (transformPropertyExists) {
                        CSS.flushTransformCache(element);
                    }
                }

                /* The non-"none" display value is only applied to an element once -- when its associated call is first ticked through.
                   Accordingly, it's set to false so that it isn't re-processed by this call in the next tick. */
                if (opts.display !== undefined && opts.display !== "none") {
                    Velocity.State.calls[i][2].display = false;
                }
                if (opts.visibility !== undefined && opts.visibility !== "hidden") {
                    Velocity.State.calls[i][2].visibility = false;
                }

                /* Pass the elements and the timing data (percentComplete, msRemaining, timeStart, tweenDummyValue) into the progress callback. */
                if (opts.progress) {
                    opts.progress.call(callContainer[1],
                                       callContainer[1],
                                       percentComplete,
                                       Math.max(0, (timeStart + opts.duration) - timeCurrent),
                                       timeStart,
                                       tweenDummyValue);
                }

                /* If this call has finished tweening, pass its index to completeCall() to handle call cleanup. */
                if (percentComplete === 1) {
                    completeCall(i);
                }
            }
        }

        /* Note: completeCall() sets the isTicking flag to false when the last call on Velocity.State.calls has completed. */
        if (Velocity.State.isTicking) {
            ticker(tick);
        }
    }

    /**********************
        Call Completion
    **********************/

    /* Note: Unlike tick(), which processes all active calls at once, call completion is handled on a per-call basis. */
    function completeCall (callIndex, isStopped) {
        /* Ensure the call exists. */
        if (!Velocity.State.calls[callIndex]) {
            return false;
        }

        /* Pull the metadata from the call. */
        var call = Velocity.State.calls[callIndex][0],
            elements = Velocity.State.calls[callIndex][1],
            opts = Velocity.State.calls[callIndex][2],
            resolver = Velocity.State.calls[callIndex][4];

        var remainingCallsExist = false;

        /*************************
           Element Finalization
        *************************/

        for (var i = 0, callLength = call.length; i < callLength; i++) {
            var element = call[i].element;

            /* If the user set display to "none" (intending to hide the element), set it now that the animation has completed. */
            /* Note: display:none isn't set when calls are manually stopped (via Velocity("stop"). */
            /* Note: Display gets ignored with "reverse" calls and infinite loops, since this behavior would be undesirable. */
            if (!isStopped && !opts.loop) {
                if (opts.display === "none") {
                    CSS.setPropertyValue(element, "display", opts.display);
                }

                if (opts.visibility === "hidden") {
                    CSS.setPropertyValue(element, "visibility", opts.visibility);
                }
            }

            /* If the element's queue is empty (if only the "inprogress" item is left at position 0) or if its queue is about to run
               a non-Velocity-initiated entry, turn off the isAnimating flag. A non-Velocity-initiatied queue entry's logic might alter
               an element's CSS values and thereby cause Velocity's cached value data to go stale. To detect if a queue entry was initiated by Velocity,
               we check for the existence of our special Velocity.queueEntryFlag declaration, which minifiers won't rename since the flag
               is assigned to jQuery's global $ object and thus exists out of Velocity's own scope. */
            if (opts.loop !== true && ($.queue(element)[1] === undefined || !/\.velocityQueueEntryFlag/i.test($.queue(element)[1]))) {
                /* The element may have been deleted. Ensure that its data cache still exists before acting on it. */
                if (Data(element)) {
                    Data(element).isAnimating = false;
                    /* Clear the element's rootPropertyValueCache, which will become stale. */
                    Data(element).rootPropertyValueCache = {};

                    var transformHAPropertyExists = false;
                    /* If any 3D transform subproperty is at its default value (regardless of unit type), remove it. */
                    $.each(CSS.Lists.transforms3D, function(i, transformName) {
                        var defaultValue = /^scale/.test(transformName) ? 1 : 0,
                            currentValue = Data(element).transformCache[transformName];

                        if (Data(element).transformCache[transformName] !== undefined && new RegExp("^\\(" + defaultValue + "[^.]").test(currentValue)) {
                            transformHAPropertyExists = true;

                            delete Data(element).transformCache[transformName];
                        }
                    });

                    /* Mobile devices have hardware acceleration removed at the end of the animation in order to avoid hogging the GPU's memory. */
                    if (opts.mobileHA) {
                        transformHAPropertyExists = true;
                        delete Data(element).transformCache.translate3d;
                    }

                    /* Flush the subproperty removals to the DOM. */
                    if (transformHAPropertyExists) {
                        CSS.flushTransformCache(element);
                    }

                    /* Remove the "velocity-animating" indicator class. */
                    CSS.Values.removeClass(element, "velocity-animating");
                }
            }

            /*********************
               Option: Complete
            *********************/

            /* Complete is fired once per call (not once per element) and is passed the full raw DOM element set as both its context and its first argument. */
            /* Note: Callbacks aren't fired when calls are manually stopped (via Velocity("stop"). */
            if (!isStopped && opts.complete && !opts.loop && (i === callLength - 1)) {
                /* We throw callbacks in a setTimeout so that thrown errors don't halt the execution of Velocity itself. */
                try {
                    opts.complete.call(elements, elements);
                } catch (error) {
                    setTimeout(function() { throw error; }, 1);
                }
            }

            /**********************
               Promise Resolving
            **********************/

            /* Note: Infinite loops don't return promises. */
            if (resolver && opts.loop !== true) {
                resolver(elements);
            }

            /****************************
               Option: Loop (Infinite)
            ****************************/

            if (Data(element) && opts.loop === true && !isStopped) {
                /* If a rotateX/Y/Z property is being animated to 360 deg with loop:true, swap tween start/end values to enable
                   continuous iterative rotation looping. (Otherise, the element would just rotate back and forth.) */
                $.each(Data(element).tweensContainer, function(propertyName, tweenContainer) {
                    if (/^rotate/.test(propertyName) && parseFloat(tweenContainer.endValue) === 360) {
                        tweenContainer.endValue = 0;
                        tweenContainer.startValue = 360;
                    }

                    if (/^backgroundPosition/.test(propertyName) && parseFloat(tweenContainer.endValue) === 100 && tweenContainer.unitType === "%") {
                        tweenContainer.endValue = 0;
                        tweenContainer.startValue = 100;
                    }
                });

                Velocity(element, "reverse", { loop: true, delay: opts.delay });
            }

            /***************
               Dequeueing
            ***************/

            /* Fire the next call in the queue so long as this call's queue wasn't set to false (to trigger a parallel animation),
               which would have already caused the next call to fire. Note: Even if the end of the animation queue has been reached,
               $.dequeue() must still be called in order to completely clear jQuery's animation queue. */
            if (opts.queue !== false) {
                $.dequeue(element, opts.queue);
            }
        }

        /************************
           Calls Array Cleanup
        ************************/

        /* Since this call is complete, set it to false so that the rAF tick skips it. This array is later compacted via compactSparseArray().
          (For performance reasons, the call is set to false instead of being deleted from the array: http://www.html5rocks.com/en/tutorials/speed/v8/) */
        Velocity.State.calls[callIndex] = false;

        /* Iterate through the calls array to determine if this was the final in-progress animation.
           If so, set a flag to end ticking and clear the calls array. */
        for (var j = 0, callsLength = Velocity.State.calls.length; j < callsLength; j++) {
            if (Velocity.State.calls[j] !== false) {
                remainingCallsExist = true;

                break;
            }
        }

        if (remainingCallsExist === false) {
            /* tick() will detect this flag upon its next iteration and subsequently turn itself off. */
            Velocity.State.isTicking = false;

            /* Clear the calls array so that its length is reset. */
            delete Velocity.State.calls;
            Velocity.State.calls = [];
        }
    }

    /******************
        Frameworks
    ******************/

    /* Both jQuery and Zepto allow their $.fn object to be extended to allow wrapped elements to be subjected to plugin calls.
       If either framework is loaded, register a "velocity" extension pointing to Velocity's core animate() method.  Velocity
       also registers itself onto a global container (window.jQuery || window.Zepto || window) so that certain features are
       accessible beyond just a per-element scope. This master object contains an .animate() method, which is later assigned to $.fn
       (if jQuery or Zepto are present). Accordingly, Velocity can both act on wrapped DOM elements and stand alone for targeting raw DOM elements. */
    global.Velocity = Velocity;

    if (global !== window) {
        /* Assign the element function to Velocity's core animate() method. */
        global.fn.velocity = animate;
        /* Assign the object function's defaults to Velocity's global defaults object. */
        global.fn.velocity.defaults = Velocity.defaults;
    }

    /***********************
       Packaged Redirects
    ***********************/

    /* slideUp, slideDown */
    $.each([ "Down", "Up" ], function(i, direction) {
        Velocity.Redirects["slide" + direction] = function (element, options, elementsIndex, elementsSize, elements, promiseData) {
            var opts = $.extend({}, options),
                begin = opts.begin,
                complete = opts.complete,
                computedValues = { height: "", marginTop: "", marginBottom: "", paddingTop: "", paddingBottom: "" },
                inlineValues = {};

            if (opts.display === undefined) {
                /* Show the element before slideDown begins and hide the element after slideUp completes. */
                /* Note: Inline elements cannot have dimensions animated, so they're reverted to inline-block. */
                opts.display = (direction === "Down" ? (Velocity.CSS.Values.getDisplayType(element) === "inline" ? "inline-block" : "block") : "none");
            }

            opts.begin = function() {
                /* If the user passed in a begin callback, fire it now. */
                begin && begin.call(elements, elements);

                /* Cache the elements' original vertical dimensional property values so that we can animate back to them. */
                for (var property in computedValues) {
                    inlineValues[property] = element.style[property];

                    /* For slideDown, use forcefeeding to animate all vertical properties from 0. For slideUp,
                       use forcefeeding to start from computed values and animate down to 0. */
                    var propertyValue = Velocity.CSS.getPropertyValue(element, property);
                    computedValues[property] = (direction === "Down") ? [ propertyValue, 0 ] : [ 0, propertyValue ];
                }

                /* Force vertical overflow content to clip so that sliding works as expected. */
                inlineValues.overflow = element.style.overflow;
                element.style.overflow = "hidden";
            }

            opts.complete = function() {
                /* Reset element to its pre-slide inline values once its slide animation is complete. */
                for (var property in inlineValues) {
                    element.style[property] = inlineValues[property];
                }

                /* If the user passed in a complete callback, fire it now. */
                complete && complete.call(elements, elements);
                promiseData && promiseData.resolver(elements);
            };

            Velocity(element, computedValues, opts);
        };
    });

    /* fadeIn, fadeOut */
    $.each([ "In", "Out" ], function(i, direction) {
        Velocity.Redirects["fade" + direction] = function (element, options, elementsIndex, elementsSize, elements, promiseData) {
            var opts = $.extend({}, options),
                propertiesMap = { opacity: (direction === "In") ? 1 : 0 },
                originalComplete = opts.complete;

            /* Since redirects are triggered individually for each element in the animated set, avoid repeatedly triggering
               callbacks by firing them only when the final element has been reached. */
            if (elementsIndex !== elementsSize - 1) {
                opts.complete = opts.begin = null;
            } else {
                opts.complete = function() {
                    if (originalComplete) {
                        originalComplete.call(elements, elements);
                    }

                    promiseData && promiseData.resolver(elements);
                }
            }

            /* If a display was passed in, use it. Otherwise, default to "none" for fadeOut or the element-specific default for fadeIn. */
            /* Note: We allow users to pass in "null" to skip display setting altogether. */
            if (opts.display === undefined) {
                opts.display = (direction === "In" ? "auto" : "none");
            }

            Velocity(this, propertiesMap, opts);
        };
    });

    return Velocity;
}((window.jQuery || window.Zepto || window), window, document);
}));

/******************
   Known Issues
******************/

/* The CSS spec mandates that the translateX/Y/Z transforms are %-relative to the element itself -- not its parent.
Velocity, however, doesn't make this distinction. Thus, converting to or from the % unit with these subproperties
will produce an inaccurate conversion value. The same issue exists with the cx/cy attributes of SVG circles and ellipses. */
},{}]},{},[26])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZmxpY2tpdHktaW1hZ2VzbG9hZGVkL2ZsaWNraXR5LWltYWdlc2xvYWRlZC5qcyIsIm5vZGVfbW9kdWxlcy9mbGlja2l0eS1pbWFnZXNsb2FkZWQvbm9kZV9tb2R1bGVzL2ltYWdlc2xvYWRlZC9pbWFnZXNsb2FkZWQuanMiLCJub2RlX21vZHVsZXMvZmxpY2tpdHktaW1hZ2VzbG9hZGVkL25vZGVfbW9kdWxlcy9pbWFnZXNsb2FkZWQvbm9kZV9tb2R1bGVzL2V2ZW50aWUvZXZlbnRpZS5qcyIsIm5vZGVfbW9kdWxlcy9mbGlja2l0eS1pbWFnZXNsb2FkZWQvbm9kZV9tb2R1bGVzL2ltYWdlc2xvYWRlZC9ub2RlX21vZHVsZXMvd29sZnk4Ny1ldmVudGVtaXR0ZXIvRXZlbnRFbWl0dGVyLmpzIiwibm9kZV9tb2R1bGVzL2ZsaWNraXR5L2pzL2FkZC1yZW1vdmUtY2VsbC5qcyIsIm5vZGVfbW9kdWxlcy9mbGlja2l0eS9qcy9hbmltYXRlLmpzIiwibm9kZV9tb2R1bGVzL2ZsaWNraXR5L2pzL2NlbGwuanMiLCJub2RlX21vZHVsZXMvZmxpY2tpdHkvanMvZHJhZy5qcyIsIm5vZGVfbW9kdWxlcy9mbGlja2l0eS9qcy9mbGlja2l0eS5qcyIsIm5vZGVfbW9kdWxlcy9mbGlja2l0eS9qcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9mbGlja2l0eS9qcy9wYWdlLWRvdHMuanMiLCJub2RlX21vZHVsZXMvZmxpY2tpdHkvanMvcGxheWVyLmpzIiwibm9kZV9tb2R1bGVzL2ZsaWNraXR5L2pzL3ByZXYtbmV4dC1idXR0b24uanMiLCJub2RlX21vZHVsZXMvZmxpY2tpdHkvbm9kZV9tb2R1bGVzL2Rlc2FuZHJvLWNsYXNzaWUvY2xhc3NpZS5qcyIsIm5vZGVfbW9kdWxlcy9mbGlja2l0eS9ub2RlX21vZHVsZXMvZGVzYW5kcm8tZ2V0LXN0eWxlLXByb3BlcnR5L2dldC1zdHlsZS1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9mbGlja2l0eS9ub2RlX21vZHVsZXMvZGVzYW5kcm8tbWF0Y2hlcy1zZWxlY3Rvci9tYXRjaGVzLXNlbGVjdG9yLmpzIiwibm9kZV9tb2R1bGVzL2ZsaWNraXR5L25vZGVfbW9kdWxlcy9kb2MtcmVhZHkvZG9jLXJlYWR5LmpzIiwibm9kZV9tb2R1bGVzL2ZsaWNraXR5L25vZGVfbW9kdWxlcy9maXp6eS11aS11dGlscy91dGlscy5qcyIsIm5vZGVfbW9kdWxlcy9mbGlja2l0eS9ub2RlX21vZHVsZXMvZ2V0LXNpemUvZ2V0LXNpemUuanMiLCJub2RlX21vZHVsZXMvZmxpY2tpdHkvbm9kZV9tb2R1bGVzL3RhcC1saXN0ZW5lci9ub2RlX21vZHVsZXMvdW5pcG9pbnRlci91bmlwb2ludGVyLmpzIiwibm9kZV9tb2R1bGVzL2ZsaWNraXR5L25vZGVfbW9kdWxlcy90YXAtbGlzdGVuZXIvdGFwLWxpc3RlbmVyLmpzIiwibm9kZV9tb2R1bGVzL2ZsaWNraXR5L25vZGVfbW9kdWxlcy91bmlkcmFnZ2VyL3VuaWRyYWdnZXIuanMiLCJzY3JpcHRzL3NyYy9ob25leS5qcyIsInNjcmlwdHMvc3JjL2xpYi9zY3JvbGwtbmF2LmpzIiwiYm93ZXJfY29tcG9uZW50cy9qcXVlcnktbW91c2V3aGVlbC9qcXVlcnkubW91c2V3aGVlbC5qcyIsImJvd2VyX2NvbXBvbmVudHMvdmVsb2NpdHkvdmVsb2NpdHkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9VQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0WEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2x0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3BUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiFcbiAqIEZsaWNraXR5IGltYWdlc0xvYWRlZCB2MS4wLjBcbiAqIGVuYWJsZXMgaW1hZ2VzTG9hZGVkIG9wdGlvbiBmb3IgRmxpY2tpdHlcbiAqL1xuXG4vKmpzaGludCBicm93c2VyOiB0cnVlLCBzdHJpY3Q6IHRydWUsIHVuZGVmOiB0cnVlLCB1bnVzZWQ6IHRydWUgKi9cblxuKCBmdW5jdGlvbiggd2luZG93LCBmYWN0b3J5ICkge1xuICAvKmdsb2JhbCBkZWZpbmU6IGZhbHNlLCBtb2R1bGU6IGZhbHNlLCByZXF1aXJlOiBmYWxzZSAqL1xuICAndXNlIHN0cmljdCc7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIGlmICggdHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCBbXG4gICAgICAnZmxpY2tpdHkvanMvaW5kZXgnLFxuICAgICAgJ2ltYWdlc2xvYWRlZC9pbWFnZXNsb2FkZWQnXG4gICAgXSwgZnVuY3Rpb24oIEZsaWNraXR5LCBpbWFnZXNMb2FkZWQgKSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSggd2luZG93LCBGbGlja2l0eSwgaW1hZ2VzTG9hZGVkICk7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoIHR5cGVvZiBleHBvcnRzID09ICdvYmplY3QnICkge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LFxuICAgICAgcmVxdWlyZSgnZmxpY2tpdHknKSxcbiAgICAgIHJlcXVpcmUoJ2ltYWdlc2xvYWRlZCcpXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5GbGlja2l0eSA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICB3aW5kb3cuRmxpY2tpdHksXG4gICAgICB3aW5kb3cuaW1hZ2VzTG9hZGVkXG4gICAgKTtcbiAgfVxuXG59KCB3aW5kb3csIGZ1bmN0aW9uIGZhY3RvcnkoIHdpbmRvdywgRmxpY2tpdHksIGltYWdlc0xvYWRlZCApIHtcbid1c2Ugc3RyaWN0JztcblxuRmxpY2tpdHkuY3JlYXRlTWV0aG9kcy5wdXNoKCdfY3JlYXRlSW1hZ2VzTG9hZGVkJyk7XG5cbkZsaWNraXR5LnByb3RvdHlwZS5fY3JlYXRlSW1hZ2VzTG9hZGVkID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMub24oICdhY3RpdmF0ZScsIHRoaXMuaW1hZ2VzTG9hZGVkICk7XG59O1xuXG5GbGlja2l0eS5wcm90b3R5cGUuaW1hZ2VzTG9hZGVkID0gZnVuY3Rpb24oKSB7XG4gIGlmICggIXRoaXMub3B0aW9ucy5pbWFnZXNMb2FkZWQgKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIGZ1bmN0aW9uIG9uSW1hZ2VzTG9hZGVkUHJvZ3Jlc3MoIGluc3RhbmNlLCBpbWFnZSApIHtcbiAgICB2YXIgY2VsbCA9IF90aGlzLmdldFBhcmVudENlbGwoIGltYWdlLmltZyApO1xuICAgIF90aGlzLmNlbGxTaXplQ2hhbmdlKCBjZWxsICYmIGNlbGwuZWxlbWVudCApO1xuICB9XG4gIGltYWdlc0xvYWRlZCggdGhpcy5zbGlkZXIgKS5vbiggJ3Byb2dyZXNzJywgb25JbWFnZXNMb2FkZWRQcm9ncmVzcyApO1xufTtcblxucmV0dXJuIEZsaWNraXR5O1xuXG59KSk7XG4iLCIvKiFcbiAqIGltYWdlc0xvYWRlZCB2My4xLjhcbiAqIEphdmFTY3JpcHQgaXMgYWxsIGxpa2UgXCJZb3UgaW1hZ2VzIGFyZSBkb25lIHlldCBvciB3aGF0P1wiXG4gKiBNSVQgTGljZW5zZVxuICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdywgZmFjdG9yeSApIHsgJ3VzZSBzdHJpY3QnO1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICAvKmdsb2JhbCBkZWZpbmU6IGZhbHNlLCBtb2R1bGU6IGZhbHNlLCByZXF1aXJlOiBmYWxzZSAqL1xuXG4gIGlmICggdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSggW1xuICAgICAgJ2V2ZW50RW1pdHRlci9FdmVudEVtaXR0ZXInLFxuICAgICAgJ2V2ZW50aWUvZXZlbnRpZSdcbiAgICBdLCBmdW5jdGlvbiggRXZlbnRFbWl0dGVyLCBldmVudGllICkge1xuICAgICAgcmV0dXJuIGZhY3RvcnkoIHdpbmRvdywgRXZlbnRFbWl0dGVyLCBldmVudGllICk7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyApIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHJlcXVpcmUoJ3dvbGZ5ODctZXZlbnRlbWl0dGVyJyksXG4gICAgICByZXF1aXJlKCdldmVudGllJylcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93LmltYWdlc0xvYWRlZCA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICB3aW5kb3cuRXZlbnRFbWl0dGVyLFxuICAgICAgd2luZG93LmV2ZW50aWVcbiAgICApO1xuICB9XG5cbn0pKCB3aW5kb3csXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICBmYWN0b3J5IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbmZ1bmN0aW9uIGZhY3RvcnkoIHdpbmRvdywgRXZlbnRFbWl0dGVyLCBldmVudGllICkge1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciAkID0gd2luZG93LmpRdWVyeTtcbnZhciBjb25zb2xlID0gd2luZG93LmNvbnNvbGU7XG52YXIgaGFzQ29uc29sZSA9IHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGVscGVycyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4vLyBleHRlbmQgb2JqZWN0c1xuZnVuY3Rpb24gZXh0ZW5kKCBhLCBiICkge1xuICBmb3IgKCB2YXIgcHJvcCBpbiBiICkge1xuICAgIGFbIHByb3AgXSA9IGJbIHByb3AgXTtcbiAgfVxuICByZXR1cm4gYTtcbn1cblxudmFyIG9ialRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbmZ1bmN0aW9uIGlzQXJyYXkoIG9iaiApIHtcbiAgcmV0dXJuIG9ialRvU3RyaW5nLmNhbGwoIG9iaiApID09PSAnW29iamVjdCBBcnJheV0nO1xufVxuXG4vLyB0dXJuIGVsZW1lbnQgb3Igbm9kZUxpc3QgaW50byBhbiBhcnJheVxuZnVuY3Rpb24gbWFrZUFycmF5KCBvYmogKSB7XG4gIHZhciBhcnkgPSBbXTtcbiAgaWYgKCBpc0FycmF5KCBvYmogKSApIHtcbiAgICAvLyB1c2Ugb2JqZWN0IGlmIGFscmVhZHkgYW4gYXJyYXlcbiAgICBhcnkgPSBvYmo7XG4gIH0gZWxzZSBpZiAoIHR5cGVvZiBvYmoubGVuZ3RoID09PSAnbnVtYmVyJyApIHtcbiAgICAvLyBjb252ZXJ0IG5vZGVMaXN0IHRvIGFycmF5XG4gICAgZm9yICggdmFyIGk9MCwgbGVuID0gb2JqLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgYXJ5LnB1c2goIG9ialtpXSApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBhcnJheSBvZiBzaW5nbGUgaW5kZXhcbiAgICBhcnkucHVzaCggb2JqICk7XG4gIH1cbiAgcmV0dXJuIGFyeTtcbn1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBpbWFnZXNMb2FkZWQgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAvKipcbiAgICogQHBhcmFtIHtBcnJheSwgRWxlbWVudCwgTm9kZUxpc3QsIFN0cmluZ30gZWxlbVxuICAgKiBAcGFyYW0ge09iamVjdCBvciBGdW5jdGlvbn0gb3B0aW9ucyAtIGlmIGZ1bmN0aW9uLCB1c2UgYXMgY2FsbGJhY2tcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gb25BbHdheXMgLSBjYWxsYmFjayBmdW5jdGlvblxuICAgKi9cbiAgZnVuY3Rpb24gSW1hZ2VzTG9hZGVkKCBlbGVtLCBvcHRpb25zLCBvbkFsd2F5cyApIHtcbiAgICAvLyBjb2VyY2UgSW1hZ2VzTG9hZGVkKCkgd2l0aG91dCBuZXcsIHRvIGJlIG5ldyBJbWFnZXNMb2FkZWQoKVxuICAgIGlmICggISggdGhpcyBpbnN0YW5jZW9mIEltYWdlc0xvYWRlZCApICkge1xuICAgICAgcmV0dXJuIG5ldyBJbWFnZXNMb2FkZWQoIGVsZW0sIG9wdGlvbnMgKTtcbiAgICB9XG4gICAgLy8gdXNlIGVsZW0gYXMgc2VsZWN0b3Igc3RyaW5nXG4gICAgaWYgKCB0eXBlb2YgZWxlbSA9PT0gJ3N0cmluZycgKSB7XG4gICAgICBlbGVtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggZWxlbSApO1xuICAgIH1cblxuICAgIHRoaXMuZWxlbWVudHMgPSBtYWtlQXJyYXkoIGVsZW0gKTtcbiAgICB0aGlzLm9wdGlvbnMgPSBleHRlbmQoIHt9LCB0aGlzLm9wdGlvbnMgKTtcblxuICAgIGlmICggdHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICBvbkFsd2F5cyA9IG9wdGlvbnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4dGVuZCggdGhpcy5vcHRpb25zLCBvcHRpb25zICk7XG4gICAgfVxuXG4gICAgaWYgKCBvbkFsd2F5cyApIHtcbiAgICAgIHRoaXMub24oICdhbHdheXMnLCBvbkFsd2F5cyApO1xuICAgIH1cblxuICAgIHRoaXMuZ2V0SW1hZ2VzKCk7XG5cbiAgICBpZiAoICQgKSB7XG4gICAgICAvLyBhZGQgalF1ZXJ5IERlZmVycmVkIG9iamVjdFxuICAgICAgdGhpcy5qcURlZmVycmVkID0gbmV3ICQuRGVmZXJyZWQoKTtcbiAgICB9XG5cbiAgICAvLyBIQUNLIGNoZWNrIGFzeW5jIHRvIGFsbG93IHRpbWUgdG8gYmluZCBsaXN0ZW5lcnNcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuICAgICAgX3RoaXMuY2hlY2soKTtcbiAgICB9KTtcbiAgfVxuXG4gIEltYWdlc0xvYWRlZC5wcm90b3R5cGUgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbiAgSW1hZ2VzTG9hZGVkLnByb3RvdHlwZS5vcHRpb25zID0ge307XG5cbiAgSW1hZ2VzTG9hZGVkLnByb3RvdHlwZS5nZXRJbWFnZXMgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmltYWdlcyA9IFtdO1xuXG4gICAgLy8gZmlsdGVyICYgZmluZCBpdGVtcyBpZiB3ZSBoYXZlIGFuIGl0ZW0gc2VsZWN0b3JcbiAgICBmb3IgKCB2YXIgaT0wLCBsZW4gPSB0aGlzLmVsZW1lbnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgdmFyIGVsZW0gPSB0aGlzLmVsZW1lbnRzW2ldO1xuICAgICAgLy8gZmlsdGVyIHNpYmxpbmdzXG4gICAgICBpZiAoIGVsZW0ubm9kZU5hbWUgPT09ICdJTUcnICkge1xuICAgICAgICB0aGlzLmFkZEltYWdlKCBlbGVtICk7XG4gICAgICB9XG4gICAgICAvLyBmaW5kIGNoaWxkcmVuXG4gICAgICAvLyBubyBub24tZWxlbWVudCBub2RlcywgIzE0M1xuICAgICAgdmFyIG5vZGVUeXBlID0gZWxlbS5ub2RlVHlwZTtcbiAgICAgIGlmICggIW5vZGVUeXBlIHx8ICEoIG5vZGVUeXBlID09PSAxIHx8IG5vZGVUeXBlID09PSA5IHx8IG5vZGVUeXBlID09PSAxMSApICkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHZhciBjaGlsZEVsZW1zID0gZWxlbS5xdWVyeVNlbGVjdG9yQWxsKCdpbWcnKTtcbiAgICAgIC8vIGNvbmNhdCBjaGlsZEVsZW1zIHRvIGZpbHRlckZvdW5kIGFycmF5XG4gICAgICBmb3IgKCB2YXIgaj0wLCBqTGVuID0gY2hpbGRFbGVtcy5sZW5ndGg7IGogPCBqTGVuOyBqKysgKSB7XG4gICAgICAgIHZhciBpbWcgPSBjaGlsZEVsZW1zW2pdO1xuICAgICAgICB0aGlzLmFkZEltYWdlKCBpbWcgKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7SW1hZ2V9IGltZ1xuICAgKi9cbiAgSW1hZ2VzTG9hZGVkLnByb3RvdHlwZS5hZGRJbWFnZSA9IGZ1bmN0aW9uKCBpbWcgKSB7XG4gICAgdmFyIGxvYWRpbmdJbWFnZSA9IG5ldyBMb2FkaW5nSW1hZ2UoIGltZyApO1xuICAgIHRoaXMuaW1hZ2VzLnB1c2goIGxvYWRpbmdJbWFnZSApO1xuICB9O1xuXG4gIEltYWdlc0xvYWRlZC5wcm90b3R5cGUuY2hlY2sgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHZhciBjaGVja2VkQ291bnQgPSAwO1xuICAgIHZhciBsZW5ndGggPSB0aGlzLmltYWdlcy5sZW5ndGg7XG4gICAgdGhpcy5oYXNBbnlCcm9rZW4gPSBmYWxzZTtcbiAgICAvLyBjb21wbGV0ZSBpZiBubyBpbWFnZXNcbiAgICBpZiAoICFsZW5ndGggKSB7XG4gICAgICB0aGlzLmNvbXBsZXRlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb25Db25maXJtKCBpbWFnZSwgbWVzc2FnZSApIHtcbiAgICAgIGlmICggX3RoaXMub3B0aW9ucy5kZWJ1ZyAmJiBoYXNDb25zb2xlICkge1xuICAgICAgICBjb25zb2xlLmxvZyggJ2NvbmZpcm0nLCBpbWFnZSwgbWVzc2FnZSApO1xuICAgICAgfVxuXG4gICAgICBfdGhpcy5wcm9ncmVzcyggaW1hZ2UgKTtcbiAgICAgIGNoZWNrZWRDb3VudCsrO1xuICAgICAgaWYgKCBjaGVja2VkQ291bnQgPT09IGxlbmd0aCApIHtcbiAgICAgICAgX3RoaXMuY29tcGxldGUoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlOyAvLyBiaW5kIG9uY2VcbiAgICB9XG5cbiAgICBmb3IgKCB2YXIgaT0wOyBpIDwgbGVuZ3RoOyBpKysgKSB7XG4gICAgICB2YXIgbG9hZGluZ0ltYWdlID0gdGhpcy5pbWFnZXNbaV07XG4gICAgICBsb2FkaW5nSW1hZ2Uub24oICdjb25maXJtJywgb25Db25maXJtICk7XG4gICAgICBsb2FkaW5nSW1hZ2UuY2hlY2soKTtcbiAgICB9XG4gIH07XG5cbiAgSW1hZ2VzTG9hZGVkLnByb3RvdHlwZS5wcm9ncmVzcyA9IGZ1bmN0aW9uKCBpbWFnZSApIHtcbiAgICB0aGlzLmhhc0FueUJyb2tlbiA9IHRoaXMuaGFzQW55QnJva2VuIHx8ICFpbWFnZS5pc0xvYWRlZDtcbiAgICAvLyBIQUNLIC0gQ2hyb21lIHRyaWdnZXJzIGV2ZW50IGJlZm9yZSBvYmplY3QgcHJvcGVydGllcyBoYXZlIGNoYW5nZWQuICM4M1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG4gICAgICBfdGhpcy5lbWl0KCAncHJvZ3Jlc3MnLCBfdGhpcywgaW1hZ2UgKTtcbiAgICAgIGlmICggX3RoaXMuanFEZWZlcnJlZCAmJiBfdGhpcy5qcURlZmVycmVkLm5vdGlmeSApIHtcbiAgICAgICAgX3RoaXMuanFEZWZlcnJlZC5ub3RpZnkoIF90aGlzLCBpbWFnZSApO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIEltYWdlc0xvYWRlZC5wcm90b3R5cGUuY29tcGxldGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZXZlbnROYW1lID0gdGhpcy5oYXNBbnlCcm9rZW4gPyAnZmFpbCcgOiAnZG9uZSc7XG4gICAgdGhpcy5pc0NvbXBsZXRlID0gdHJ1ZTtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIC8vIEhBQ0sgLSBhbm90aGVyIHNldFRpbWVvdXQgc28gdGhhdCBjb25maXJtIGhhcHBlbnMgYWZ0ZXIgcHJvZ3Jlc3NcbiAgICBzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcbiAgICAgIF90aGlzLmVtaXQoIGV2ZW50TmFtZSwgX3RoaXMgKTtcbiAgICAgIF90aGlzLmVtaXQoICdhbHdheXMnLCBfdGhpcyApO1xuICAgICAgaWYgKCBfdGhpcy5qcURlZmVycmVkICkge1xuICAgICAgICB2YXIganFNZXRob2QgPSBfdGhpcy5oYXNBbnlCcm9rZW4gPyAncmVqZWN0JyA6ICdyZXNvbHZlJztcbiAgICAgICAgX3RoaXMuanFEZWZlcnJlZFsganFNZXRob2QgXSggX3RoaXMgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBqcXVlcnkgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICBpZiAoICQgKSB7XG4gICAgJC5mbi5pbWFnZXNMb2FkZWQgPSBmdW5jdGlvbiggb3B0aW9ucywgY2FsbGJhY2sgKSB7XG4gICAgICB2YXIgaW5zdGFuY2UgPSBuZXcgSW1hZ2VzTG9hZGVkKCB0aGlzLCBvcHRpb25zLCBjYWxsYmFjayApO1xuICAgICAgcmV0dXJuIGluc3RhbmNlLmpxRGVmZXJyZWQucHJvbWlzZSggJCh0aGlzKSApO1xuICAgIH07XG4gIH1cblxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIGZ1bmN0aW9uIExvYWRpbmdJbWFnZSggaW1nICkge1xuICAgIHRoaXMuaW1nID0gaW1nO1xuICB9XG5cbiAgTG9hZGluZ0ltYWdlLnByb3RvdHlwZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICBMb2FkaW5nSW1hZ2UucHJvdG90eXBlLmNoZWNrID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gZmlyc3QgY2hlY2sgY2FjaGVkIGFueSBwcmV2aW91cyBpbWFnZXMgdGhhdCBoYXZlIHNhbWUgc3JjXG4gICAgdmFyIHJlc291cmNlID0gY2FjaGVbIHRoaXMuaW1nLnNyYyBdIHx8IG5ldyBSZXNvdXJjZSggdGhpcy5pbWcuc3JjICk7XG4gICAgaWYgKCByZXNvdXJjZS5pc0NvbmZpcm1lZCApIHtcbiAgICAgIHRoaXMuY29uZmlybSggcmVzb3VyY2UuaXNMb2FkZWQsICdjYWNoZWQgd2FzIGNvbmZpcm1lZCcgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiBjb21wbGV0ZSBpcyB0cnVlIGFuZCBicm93c2VyIHN1cHBvcnRzIG5hdHVyYWwgc2l6ZXMsXG4gICAgLy8gdHJ5IHRvIGNoZWNrIGZvciBpbWFnZSBzdGF0dXMgbWFudWFsbHkuXG4gICAgaWYgKCB0aGlzLmltZy5jb21wbGV0ZSAmJiB0aGlzLmltZy5uYXR1cmFsV2lkdGggIT09IHVuZGVmaW5lZCApIHtcbiAgICAgIC8vIHJlcG9ydCBiYXNlZCBvbiBuYXR1cmFsV2lkdGhcbiAgICAgIHRoaXMuY29uZmlybSggdGhpcy5pbWcubmF0dXJhbFdpZHRoICE9PSAwLCAnbmF0dXJhbFdpZHRoJyApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIG5vbmUgb2YgdGhlIGNoZWNrcyBhYm92ZSBtYXRjaGVkLCBzaW11bGF0ZSBsb2FkaW5nIG9uIGRldGFjaGVkIGVsZW1lbnQuXG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICByZXNvdXJjZS5vbiggJ2NvbmZpcm0nLCBmdW5jdGlvbiggcmVzcmMsIG1lc3NhZ2UgKSB7XG4gICAgICBfdGhpcy5jb25maXJtKCByZXNyYy5pc0xvYWRlZCwgbWVzc2FnZSApO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG5cbiAgICByZXNvdXJjZS5jaGVjaygpO1xuICB9O1xuXG4gIExvYWRpbmdJbWFnZS5wcm90b3R5cGUuY29uZmlybSA9IGZ1bmN0aW9uKCBpc0xvYWRlZCwgbWVzc2FnZSApIHtcbiAgICB0aGlzLmlzTG9hZGVkID0gaXNMb2FkZWQ7XG4gICAgdGhpcy5lbWl0KCAnY29uZmlybScsIHRoaXMsIG1lc3NhZ2UgKTtcbiAgfTtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBSZXNvdXJjZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIC8vIFJlc291cmNlIGNoZWNrcyBlYWNoIHNyYywgb25seSBvbmNlXG4gIC8vIHNlcGFyYXRlIGNsYXNzIGZyb20gTG9hZGluZ0ltYWdlIHRvIHByZXZlbnQgbWVtb3J5IGxlYWtzLiBTZWUgIzExNVxuXG4gIHZhciBjYWNoZSA9IHt9O1xuXG4gIGZ1bmN0aW9uIFJlc291cmNlKCBzcmMgKSB7XG4gICAgdGhpcy5zcmMgPSBzcmM7XG4gICAgLy8gYWRkIHRvIGNhY2hlXG4gICAgY2FjaGVbIHNyYyBdID0gdGhpcztcbiAgfVxuXG4gIFJlc291cmNlLnByb3RvdHlwZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICBSZXNvdXJjZS5wcm90b3R5cGUuY2hlY2sgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBvbmx5IHRyaWdnZXIgY2hlY2tpbmcgb25jZVxuICAgIGlmICggdGhpcy5pc0NoZWNrZWQgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIHNpbXVsYXRlIGxvYWRpbmcgb24gZGV0YWNoZWQgZWxlbWVudFxuICAgIHZhciBwcm94eUltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgZXZlbnRpZS5iaW5kKCBwcm94eUltYWdlLCAnbG9hZCcsIHRoaXMgKTtcbiAgICBldmVudGllLmJpbmQoIHByb3h5SW1hZ2UsICdlcnJvcicsIHRoaXMgKTtcbiAgICBwcm94eUltYWdlLnNyYyA9IHRoaXMuc3JjO1xuICAgIC8vIHNldCBmbGFnXG4gICAgdGhpcy5pc0NoZWNrZWQgPSB0cnVlO1xuICB9O1xuXG4gIC8vIC0tLS0tIGV2ZW50cyAtLS0tLSAvL1xuXG4gIC8vIHRyaWdnZXIgc3BlY2lmaWVkIGhhbmRsZXIgZm9yIGV2ZW50IHR5cGVcbiAgUmVzb3VyY2UucHJvdG90eXBlLmhhbmRsZUV2ZW50ID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICAgIHZhciBtZXRob2QgPSAnb24nICsgZXZlbnQudHlwZTtcbiAgICBpZiAoIHRoaXNbIG1ldGhvZCBdICkge1xuICAgICAgdGhpc1sgbWV0aG9kIF0oIGV2ZW50ICk7XG4gICAgfVxuICB9O1xuXG4gIFJlc291cmNlLnByb3RvdHlwZS5vbmxvYWQgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gICAgdGhpcy5jb25maXJtKCB0cnVlLCAnb25sb2FkJyApO1xuICAgIHRoaXMudW5iaW5kUHJveHlFdmVudHMoIGV2ZW50ICk7XG4gIH07XG5cbiAgUmVzb3VyY2UucHJvdG90eXBlLm9uZXJyb3IgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gICAgdGhpcy5jb25maXJtKCBmYWxzZSwgJ29uZXJyb3InICk7XG4gICAgdGhpcy51bmJpbmRQcm94eUV2ZW50cyggZXZlbnQgKTtcbiAgfTtcblxuICAvLyAtLS0tLSBjb25maXJtIC0tLS0tIC8vXG5cbiAgUmVzb3VyY2UucHJvdG90eXBlLmNvbmZpcm0gPSBmdW5jdGlvbiggaXNMb2FkZWQsIG1lc3NhZ2UgKSB7XG4gICAgdGhpcy5pc0NvbmZpcm1lZCA9IHRydWU7XG4gICAgdGhpcy5pc0xvYWRlZCA9IGlzTG9hZGVkO1xuICAgIHRoaXMuZW1pdCggJ2NvbmZpcm0nLCB0aGlzLCBtZXNzYWdlICk7XG4gIH07XG5cbiAgUmVzb3VyY2UucHJvdG90eXBlLnVuYmluZFByb3h5RXZlbnRzID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICAgIGV2ZW50aWUudW5iaW5kKCBldmVudC50YXJnZXQsICdsb2FkJywgdGhpcyApO1xuICAgIGV2ZW50aWUudW5iaW5kKCBldmVudC50YXJnZXQsICdlcnJvcicsIHRoaXMgKTtcbiAgfTtcblxuICAvLyAtLS0tLSAgLS0tLS0gLy9cblxuICByZXR1cm4gSW1hZ2VzTG9hZGVkO1xuXG59KTtcbiIsIi8qIVxuICogZXZlbnRpZSB2MS4wLjZcbiAqIGV2ZW50IGJpbmRpbmcgaGVscGVyXG4gKiAgIGV2ZW50aWUuYmluZCggZWxlbSwgJ2NsaWNrJywgbXlGbiApXG4gKiAgIGV2ZW50aWUudW5iaW5kKCBlbGVtLCAnY2xpY2snLCBteUZuIClcbiAqIE1JVCBsaWNlbnNlXG4gKi9cblxuLypqc2hpbnQgYnJvd3NlcjogdHJ1ZSwgdW5kZWY6IHRydWUsIHVudXNlZDogdHJ1ZSAqL1xuLypnbG9iYWwgZGVmaW5lOiBmYWxzZSwgbW9kdWxlOiBmYWxzZSAqL1xuXG4oIGZ1bmN0aW9uKCB3aW5kb3cgKSB7XG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGRvY0VsZW0gPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cbnZhciBiaW5kID0gZnVuY3Rpb24oKSB7fTtcblxuZnVuY3Rpb24gZ2V0SUVFdmVudCggb2JqICkge1xuICB2YXIgZXZlbnQgPSB3aW5kb3cuZXZlbnQ7XG4gIC8vIGFkZCBldmVudC50YXJnZXRcbiAgZXZlbnQudGFyZ2V0ID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LnNyY0VsZW1lbnQgfHwgb2JqO1xuICByZXR1cm4gZXZlbnQ7XG59XG5cbmlmICggZG9jRWxlbS5hZGRFdmVudExpc3RlbmVyICkge1xuICBiaW5kID0gZnVuY3Rpb24oIG9iaiwgdHlwZSwgZm4gKSB7XG4gICAgb2JqLmFkZEV2ZW50TGlzdGVuZXIoIHR5cGUsIGZuLCBmYWxzZSApO1xuICB9O1xufSBlbHNlIGlmICggZG9jRWxlbS5hdHRhY2hFdmVudCApIHtcbiAgYmluZCA9IGZ1bmN0aW9uKCBvYmosIHR5cGUsIGZuICkge1xuICAgIG9ialsgdHlwZSArIGZuIF0gPSBmbi5oYW5kbGVFdmVudCA/XG4gICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGV2ZW50ID0gZ2V0SUVFdmVudCggb2JqICk7XG4gICAgICAgIGZuLmhhbmRsZUV2ZW50LmNhbGwoIGZuLCBldmVudCApO1xuICAgICAgfSA6XG4gICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGV2ZW50ID0gZ2V0SUVFdmVudCggb2JqICk7XG4gICAgICAgIGZuLmNhbGwoIG9iaiwgZXZlbnQgKTtcbiAgICAgIH07XG4gICAgb2JqLmF0dGFjaEV2ZW50KCBcIm9uXCIgKyB0eXBlLCBvYmpbIHR5cGUgKyBmbiBdICk7XG4gIH07XG59XG5cbnZhciB1bmJpbmQgPSBmdW5jdGlvbigpIHt9O1xuXG5pZiAoIGRvY0VsZW0ucmVtb3ZlRXZlbnRMaXN0ZW5lciApIHtcbiAgdW5iaW5kID0gZnVuY3Rpb24oIG9iaiwgdHlwZSwgZm4gKSB7XG4gICAgb2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIoIHR5cGUsIGZuLCBmYWxzZSApO1xuICB9O1xufSBlbHNlIGlmICggZG9jRWxlbS5kZXRhY2hFdmVudCApIHtcbiAgdW5iaW5kID0gZnVuY3Rpb24oIG9iaiwgdHlwZSwgZm4gKSB7XG4gICAgb2JqLmRldGFjaEV2ZW50KCBcIm9uXCIgKyB0eXBlLCBvYmpbIHR5cGUgKyBmbiBdICk7XG4gICAgdHJ5IHtcbiAgICAgIGRlbGV0ZSBvYmpbIHR5cGUgKyBmbiBdO1xuICAgIH0gY2F0Y2ggKCBlcnIgKSB7XG4gICAgICAvLyBjYW4ndCBkZWxldGUgd2luZG93IG9iamVjdCBwcm9wZXJ0aWVzXG4gICAgICBvYmpbIHR5cGUgKyBmbiBdID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgfTtcbn1cblxudmFyIGV2ZW50aWUgPSB7XG4gIGJpbmQ6IGJpbmQsXG4gIHVuYmluZDogdW5iaW5kXG59O1xuXG4vLyAtLS0tLSBtb2R1bGUgZGVmaW5pdGlvbiAtLS0tLSAvL1xuXG5pZiAoIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgLy8gQU1EXG4gIGRlZmluZSggZXZlbnRpZSApO1xufSBlbHNlIGlmICggdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICkge1xuICAvLyBDb21tb25KU1xuICBtb2R1bGUuZXhwb3J0cyA9IGV2ZW50aWU7XG59IGVsc2Uge1xuICAvLyBicm93c2VyIGdsb2JhbFxuICB3aW5kb3cuZXZlbnRpZSA9IGV2ZW50aWU7XG59XG5cbn0pKCB3aW5kb3cgKTtcbiIsIi8qIVxuICogRXZlbnRFbWl0dGVyIHY0LjIuMTEgLSBnaXQuaW8vZWVcbiAqIFVubGljZW5zZSAtIGh0dHA6Ly91bmxpY2Vuc2Uub3JnL1xuICogT2xpdmVyIENhbGR3ZWxsIC0gaHR0cDovL29saS5tZS51ay9cbiAqIEBwcmVzZXJ2ZVxuICovXG5cbjsoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8qKlxuICAgICAqIENsYXNzIGZvciBtYW5hZ2luZyBldmVudHMuXG4gICAgICogQ2FuIGJlIGV4dGVuZGVkIHRvIHByb3ZpZGUgZXZlbnQgZnVuY3Rpb25hbGl0eSBpbiBvdGhlciBjbGFzc2VzLlxuICAgICAqXG4gICAgICogQGNsYXNzIEV2ZW50RW1pdHRlciBNYW5hZ2VzIGV2ZW50IHJlZ2lzdGVyaW5nIGFuZCBlbWl0dGluZy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7fVxuXG4gICAgLy8gU2hvcnRjdXRzIHRvIGltcHJvdmUgc3BlZWQgYW5kIHNpemVcbiAgICB2YXIgcHJvdG8gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlO1xuICAgIHZhciBleHBvcnRzID0gdGhpcztcbiAgICB2YXIgb3JpZ2luYWxHbG9iYWxWYWx1ZSA9IGV4cG9ydHMuRXZlbnRFbWl0dGVyO1xuXG4gICAgLyoqXG4gICAgICogRmluZHMgdGhlIGluZGV4IG9mIHRoZSBsaXN0ZW5lciBmb3IgdGhlIGV2ZW50IGluIGl0cyBzdG9yYWdlIGFycmF5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbltdfSBsaXN0ZW5lcnMgQXJyYXkgb2YgbGlzdGVuZXJzIHRvIHNlYXJjaCB0aHJvdWdoLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBsb29rIGZvci5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IEluZGV4IG9mIHRoZSBzcGVjaWZpZWQgbGlzdGVuZXIsIC0xIGlmIG5vdCBmb3VuZFxuICAgICAqIEBhcGkgcHJpdmF0ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGluZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lcnMsIGxpc3RlbmVyKSB7XG4gICAgICAgIHZhciBpID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbGlhcyBhIG1ldGhvZCB3aGlsZSBrZWVwaW5nIHRoZSBjb250ZXh0IGNvcnJlY3QsIHRvIGFsbG93IGZvciBvdmVyd3JpdGluZyBvZiB0YXJnZXQgbWV0aG9kLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHRhcmdldCBtZXRob2QuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IFRoZSBhbGlhc2VkIG1ldGhvZFxuICAgICAqIEBhcGkgcHJpdmF0ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGFsaWFzKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGFsaWFzQ2xvc3VyZSgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzW25hbWVdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgbGlzdGVuZXIgYXJyYXkgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG4gICAgICogV2lsbCBpbml0aWFsaXNlIHRoZSBldmVudCBvYmplY3QgYW5kIGxpc3RlbmVyIGFycmF5cyBpZiByZXF1aXJlZC5cbiAgICAgKiBXaWxsIHJldHVybiBhbiBvYmplY3QgaWYgeW91IHVzZSBhIHJlZ2V4IHNlYXJjaC4gVGhlIG9iamVjdCBjb250YWlucyBrZXlzIGZvciBlYWNoIG1hdGNoZWQgZXZlbnQuIFNvIC9iYVtyel0vIG1pZ2h0IHJldHVybiBhbiBvYmplY3QgY29udGFpbmluZyBiYXIgYW5kIGJhei4gQnV0IG9ubHkgaWYgeW91IGhhdmUgZWl0aGVyIGRlZmluZWQgdGhlbSB3aXRoIGRlZmluZUV2ZW50IG9yIGFkZGVkIHNvbWUgbGlzdGVuZXJzIHRvIHRoZW0uXG4gICAgICogRWFjaCBwcm9wZXJ0eSBpbiB0aGUgb2JqZWN0IHJlc3BvbnNlIGlzIGFuIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIHJldHVybiB0aGUgbGlzdGVuZXJzIGZyb20uXG4gICAgICogQHJldHVybiB7RnVuY3Rpb25bXXxPYmplY3R9IEFsbCBsaXN0ZW5lciBmdW5jdGlvbnMgZm9yIHRoZSBldmVudC5cbiAgICAgKi9cbiAgICBwcm90by5nZXRMaXN0ZW5lcnMgPSBmdW5jdGlvbiBnZXRMaXN0ZW5lcnMoZXZ0KSB7XG4gICAgICAgIHZhciBldmVudHMgPSB0aGlzLl9nZXRFdmVudHMoKTtcbiAgICAgICAgdmFyIHJlc3BvbnNlO1xuICAgICAgICB2YXIga2V5O1xuXG4gICAgICAgIC8vIFJldHVybiBhIGNvbmNhdGVuYXRlZCBhcnJheSBvZiBhbGwgbWF0Y2hpbmcgZXZlbnRzIGlmXG4gICAgICAgIC8vIHRoZSBzZWxlY3RvciBpcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAgICAgICAgaWYgKGV2dCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgcmVzcG9uc2UgPSB7fTtcbiAgICAgICAgICAgIGZvciAoa2V5IGluIGV2ZW50cykge1xuICAgICAgICAgICAgICAgIGlmIChldmVudHMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBldnQudGVzdChrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlW2tleV0gPSBldmVudHNba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXNwb25zZSA9IGV2ZW50c1tldnRdIHx8IChldmVudHNbZXZ0XSA9IFtdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVGFrZXMgYSBsaXN0IG9mIGxpc3RlbmVyIG9iamVjdHMgYW5kIGZsYXR0ZW5zIGl0IGludG8gYSBsaXN0IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0W119IGxpc3RlbmVycyBSYXcgbGlzdGVuZXIgb2JqZWN0cy5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbltdfSBKdXN0IHRoZSBsaXN0ZW5lciBmdW5jdGlvbnMuXG4gICAgICovXG4gICAgcHJvdG8uZmxhdHRlbkxpc3RlbmVycyA9IGZ1bmN0aW9uIGZsYXR0ZW5MaXN0ZW5lcnMobGlzdGVuZXJzKSB7XG4gICAgICAgIHZhciBmbGF0TGlzdGVuZXJzID0gW107XG4gICAgICAgIHZhciBpO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGZsYXRMaXN0ZW5lcnMucHVzaChsaXN0ZW5lcnNbaV0ubGlzdGVuZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZsYXRMaXN0ZW5lcnM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEZldGNoZXMgdGhlIHJlcXVlc3RlZCBsaXN0ZW5lcnMgdmlhIGdldExpc3RlbmVycyBidXQgd2lsbCBhbHdheXMgcmV0dXJuIHRoZSByZXN1bHRzIGluc2lkZSBhbiBvYmplY3QuIFRoaXMgaXMgbWFpbmx5IGZvciBpbnRlcm5hbCB1c2UgYnV0IG90aGVycyBtYXkgZmluZCBpdCB1c2VmdWwuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZXR1cm4gdGhlIGxpc3RlbmVycyBmcm9tLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQWxsIGxpc3RlbmVyIGZ1bmN0aW9ucyBmb3IgYW4gZXZlbnQgaW4gYW4gb2JqZWN0LlxuICAgICAqL1xuICAgIHByb3RvLmdldExpc3RlbmVyc0FzT2JqZWN0ID0gZnVuY3Rpb24gZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KSB7XG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVycyhldnQpO1xuICAgICAgICB2YXIgcmVzcG9uc2U7XG5cbiAgICAgICAgaWYgKGxpc3RlbmVycyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICByZXNwb25zZSA9IHt9O1xuICAgICAgICAgICAgcmVzcG9uc2VbZXZ0XSA9IGxpc3RlbmVycztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXNwb25zZSB8fCBsaXN0ZW5lcnM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lciBmdW5jdGlvbiB0byB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICAgICAqIFRoZSBsaXN0ZW5lciB3aWxsIG5vdCBiZSBhZGRlZCBpZiBpdCBpcyBhIGR1cGxpY2F0ZS5cbiAgICAgKiBJZiB0aGUgbGlzdGVuZXIgcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGl0IGlzIGNhbGxlZC5cbiAgICAgKiBJZiB5b3UgcGFzcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhcyB0aGUgZXZlbnQgbmFtZSB0aGVuIHRoZSBsaXN0ZW5lciB3aWxsIGJlIGFkZGVkIHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGF0dGFjaCB0aGUgbGlzdGVuZXIgdG8uXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBldmVudCBpcyBlbWl0dGVkLiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGNhbGxpbmcuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8uYWRkTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG4gICAgICAgIHZhciBsaXN0ZW5lcklzV3JhcHBlZCA9IHR5cGVvZiBsaXN0ZW5lciA9PT0gJ29iamVjdCc7XG4gICAgICAgIHZhciBrZXk7XG5cbiAgICAgICAgZm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkgJiYgaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyc1trZXldLCBsaXN0ZW5lcikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzW2tleV0ucHVzaChsaXN0ZW5lcklzV3JhcHBlZCA/IGxpc3RlbmVyIDoge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcjogbGlzdGVuZXIsXG4gICAgICAgICAgICAgICAgICAgIG9uY2U6IGZhbHNlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQWxpYXMgb2YgYWRkTGlzdGVuZXJcbiAgICAgKi9cbiAgICBwcm90by5vbiA9IGFsaWFzKCdhZGRMaXN0ZW5lcicpO1xuXG4gICAgLyoqXG4gICAgICogU2VtaS1hbGlhcyBvZiBhZGRMaXN0ZW5lci4gSXQgd2lsbCBhZGQgYSBsaXN0ZW5lciB0aGF0IHdpbGwgYmVcbiAgICAgKiBhdXRvbWF0aWNhbGx5IHJlbW92ZWQgYWZ0ZXIgaXRzIGZpcnN0IGV4ZWN1dGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGF0dGFjaCB0aGUgbGlzdGVuZXIgdG8uXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBldmVudCBpcyBlbWl0dGVkLiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGNhbGxpbmcuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8uYWRkT25jZUxpc3RlbmVyID0gZnVuY3Rpb24gYWRkT25jZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoZXZ0LCB7XG4gICAgICAgICAgICBsaXN0ZW5lcjogbGlzdGVuZXIsXG4gICAgICAgICAgICBvbmNlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBbGlhcyBvZiBhZGRPbmNlTGlzdGVuZXIuXG4gICAgICovXG4gICAgcHJvdG8ub25jZSA9IGFsaWFzKCdhZGRPbmNlTGlzdGVuZXInKTtcblxuICAgIC8qKlxuICAgICAqIERlZmluZXMgYW4gZXZlbnQgbmFtZS4gVGhpcyBpcyByZXF1aXJlZCBpZiB5b3Ugd2FudCB0byB1c2UgYSByZWdleCB0byBhZGQgYSBsaXN0ZW5lciB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gSWYgeW91IGRvbid0IGRvIHRoaXMgdGhlbiBob3cgZG8geW91IGV4cGVjdCBpdCB0byBrbm93IHdoYXQgZXZlbnQgdG8gYWRkIHRvPyBTaG91bGQgaXQganVzdCBhZGQgdG8gZXZlcnkgcG9zc2libGUgbWF0Y2ggZm9yIGEgcmVnZXg/IE5vLiBUaGF0IGlzIHNjYXJ5IGFuZCBiYWQuXG4gICAgICogWW91IG5lZWQgdG8gdGVsbCBpdCB3aGF0IGV2ZW50IG5hbWVzIHNob3VsZCBiZSBtYXRjaGVkIGJ5IGEgcmVnZXguXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGNyZWF0ZS5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5kZWZpbmVFdmVudCA9IGZ1bmN0aW9uIGRlZmluZUV2ZW50KGV2dCkge1xuICAgICAgICB0aGlzLmdldExpc3RlbmVycyhldnQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVXNlcyBkZWZpbmVFdmVudCB0byBkZWZpbmUgbXVsdGlwbGUgZXZlbnRzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmdbXX0gZXZ0cyBBbiBhcnJheSBvZiBldmVudCBuYW1lcyB0byBkZWZpbmUuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8uZGVmaW5lRXZlbnRzID0gZnVuY3Rpb24gZGVmaW5lRXZlbnRzKGV2dHMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBldnRzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICB0aGlzLmRlZmluZUV2ZW50KGV2dHNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGEgbGlzdGVuZXIgZnVuY3Rpb24gZnJvbSB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICAgICAqIFdoZW4gcGFzc2VkIGEgcmVndWxhciBleHByZXNzaW9uIGFzIHRoZSBldmVudCBuYW1lLCBpdCB3aWxsIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbSBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20uXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIHJlbW92ZSBmcm9tIHRoZSBldmVudC5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIpIHtcbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcbiAgICAgICAgdmFyIGluZGV4O1xuICAgICAgICB2YXIga2V5O1xuXG4gICAgICAgIGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuICAgICAgICAgICAgaWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBpbmRleE9mTGlzdGVuZXIobGlzdGVuZXJzW2tleV0sIGxpc3RlbmVyKTtcblxuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzW2tleV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQWxpYXMgb2YgcmVtb3ZlTGlzdGVuZXJcbiAgICAgKi9cbiAgICBwcm90by5vZmYgPSBhbGlhcygncmVtb3ZlTGlzdGVuZXInKTtcblxuICAgIC8qKlxuICAgICAqIEFkZHMgbGlzdGVuZXJzIGluIGJ1bGsgdXNpbmcgdGhlIG1hbmlwdWxhdGVMaXN0ZW5lcnMgbWV0aG9kLlxuICAgICAqIElmIHlvdSBwYXNzIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHlvdSBjYW4gYWRkIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSBhZGRlZC5cbiAgICAgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBhZGQgdGhlIGFycmF5IG9mIGxpc3RlbmVycyB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG4gICAgICogWWVhaCwgdGhpcyBmdW5jdGlvbiBkb2VzIHF1aXRlIGEgYml0LiBUaGF0J3MgcHJvYmFibHkgYSBiYWQgdGhpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gYWRkIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIGFkZC5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5hZGRMaXN0ZW5lcnMgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcnMoZXZ0LCBsaXN0ZW5lcnMpIHtcbiAgICAgICAgLy8gUGFzcyB0aHJvdWdoIHRvIG1hbmlwdWxhdGVMaXN0ZW5lcnNcbiAgICAgICAgcmV0dXJuIHRoaXMubWFuaXB1bGF0ZUxpc3RlbmVycyhmYWxzZSwgZXZ0LCBsaXN0ZW5lcnMpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGxpc3RlbmVycyBpbiBidWxrIHVzaW5nIHRoZSBtYW5pcHVsYXRlTGlzdGVuZXJzIG1ldGhvZC5cbiAgICAgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIHJlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuXG4gICAgICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIHJlbW92ZWQuXG4gICAgICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgZnJvbSBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbltdfSBbbGlzdGVuZXJzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdG8gcmVtb3ZlLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHByb3RvLnJlbW92ZUxpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVycyhldnQsIGxpc3RlbmVycykge1xuICAgICAgICAvLyBQYXNzIHRocm91Z2ggdG8gbWFuaXB1bGF0ZUxpc3RlbmVyc1xuICAgICAgICByZXR1cm4gdGhpcy5tYW5pcHVsYXRlTGlzdGVuZXJzKHRydWUsIGV2dCwgbGlzdGVuZXJzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRWRpdHMgbGlzdGVuZXJzIGluIGJ1bGsuIFRoZSBhZGRMaXN0ZW5lcnMgYW5kIHJlbW92ZUxpc3RlbmVycyBtZXRob2RzIGJvdGggdXNlIHRoaXMgdG8gZG8gdGhlaXIgam9iLiBZb3Ugc2hvdWxkIHJlYWxseSB1c2UgdGhvc2UgaW5zdGVhZCwgdGhpcyBpcyBhIGxpdHRsZSBsb3dlciBsZXZlbC5cbiAgICAgKiBUaGUgZmlyc3QgYXJndW1lbnQgd2lsbCBkZXRlcm1pbmUgaWYgdGhlIGxpc3RlbmVycyBhcmUgcmVtb3ZlZCAodHJ1ZSkgb3IgYWRkZWQgKGZhbHNlKS5cbiAgICAgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIGFkZC9yZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gVGhlIG9iamVjdCBzaG91bGQgY29udGFpbiBrZXkgdmFsdWUgcGFpcnMgb2YgZXZlbnRzIGFuZCBsaXN0ZW5lcnMgb3IgbGlzdGVuZXIgYXJyYXlzLlxuICAgICAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSBhZGRlZC9yZW1vdmVkLlxuICAgICAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGEgcmVndWxhciBleHByZXNzaW9uIHRvIG1hbmlwdWxhdGUgdGhlIGxpc3RlbmVycyBvZiBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IHJlbW92ZSBUcnVlIGlmIHlvdSB3YW50IHRvIHJlbW92ZSBsaXN0ZW5lcnMsIGZhbHNlIGlmIHlvdSB3YW50IHRvIGFkZC5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gYWRkL3JlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIGFkZC9yZW1vdmUuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8ubWFuaXB1bGF0ZUxpc3RlbmVycyA9IGZ1bmN0aW9uIG1hbmlwdWxhdGVMaXN0ZW5lcnMocmVtb3ZlLCBldnQsIGxpc3RlbmVycykge1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgdmFyIHZhbHVlO1xuICAgICAgICB2YXIgc2luZ2xlID0gcmVtb3ZlID8gdGhpcy5yZW1vdmVMaXN0ZW5lciA6IHRoaXMuYWRkTGlzdGVuZXI7XG4gICAgICAgIHZhciBtdWx0aXBsZSA9IHJlbW92ZSA/IHRoaXMucmVtb3ZlTGlzdGVuZXJzIDogdGhpcy5hZGRMaXN0ZW5lcnM7XG5cbiAgICAgICAgLy8gSWYgZXZ0IGlzIGFuIG9iamVjdCB0aGVuIHBhc3MgZWFjaCBvZiBpdHMgcHJvcGVydGllcyB0byB0aGlzIG1ldGhvZFxuICAgICAgICBpZiAodHlwZW9mIGV2dCA9PT0gJ29iamVjdCcgJiYgIShldnQgaW5zdGFuY2VvZiBSZWdFeHApKSB7XG4gICAgICAgICAgICBmb3IgKGkgaW4gZXZ0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2dC5oYXNPd25Qcm9wZXJ0eShpKSAmJiAodmFsdWUgPSBldnRbaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFBhc3MgdGhlIHNpbmdsZSBsaXN0ZW5lciBzdHJhaWdodCB0aHJvdWdoIHRvIHRoZSBzaW5ndWxhciBtZXRob2RcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlLmNhbGwodGhpcywgaSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIHBhc3MgYmFjayB0byB0aGUgbXVsdGlwbGUgZnVuY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpcGxlLmNhbGwodGhpcywgaSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gU28gZXZ0IG11c3QgYmUgYSBzdHJpbmdcbiAgICAgICAgICAgIC8vIEFuZCBsaXN0ZW5lcnMgbXVzdCBiZSBhbiBhcnJheSBvZiBsaXN0ZW5lcnNcbiAgICAgICAgICAgIC8vIExvb3Agb3ZlciBpdCBhbmQgcGFzcyBlYWNoIG9uZSB0byB0aGUgbXVsdGlwbGUgbWV0aG9kXG4gICAgICAgICAgICBpID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICBzaW5nbGUuY2FsbCh0aGlzLCBldnQsIGxpc3RlbmVyc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGZyb20gYSBzcGVjaWZpZWQgZXZlbnQuXG4gICAgICogSWYgeW91IGRvIG5vdCBzcGVjaWZ5IGFuIGV2ZW50IHRoZW4gYWxsIGxpc3RlbmVycyB3aWxsIGJlIHJlbW92ZWQuXG4gICAgICogVGhhdCBtZWFucyBldmVyeSBldmVudCB3aWxsIGJlIGVtcHRpZWQuXG4gICAgICogWW91IGNhbiBhbHNvIHBhc3MgYSByZWdleCB0byByZW1vdmUgYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBbZXZ0XSBPcHRpb25hbCBuYW1lIG9mIHRoZSBldmVudCB0byByZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IuIFdpbGwgcmVtb3ZlIGZyb20gZXZlcnkgZXZlbnQgaWYgbm90IHBhc3NlZC5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5yZW1vdmVFdmVudCA9IGZ1bmN0aW9uIHJlbW92ZUV2ZW50KGV2dCkge1xuICAgICAgICB2YXIgdHlwZSA9IHR5cGVvZiBldnQ7XG4gICAgICAgIHZhciBldmVudHMgPSB0aGlzLl9nZXRFdmVudHMoKTtcbiAgICAgICAgdmFyIGtleTtcblxuICAgICAgICAvLyBSZW1vdmUgZGlmZmVyZW50IHRoaW5ncyBkZXBlbmRpbmcgb24gdGhlIHN0YXRlIG9mIGV2dFxuICAgICAgICBpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIFJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50XG4gICAgICAgICAgICBkZWxldGUgZXZlbnRzW2V2dF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZXZ0IGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICAvLyBSZW1vdmUgYWxsIGV2ZW50cyBtYXRjaGluZyB0aGUgcmVnZXguXG4gICAgICAgICAgICBmb3IgKGtleSBpbiBldmVudHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnRzLmhhc093blByb3BlcnR5KGtleSkgJiYgZXZ0LnRlc3Qoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZXZlbnRzW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgaW4gYWxsIGV2ZW50c1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50cztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBbGlhcyBvZiByZW1vdmVFdmVudC5cbiAgICAgKlxuICAgICAqIEFkZGVkIHRvIG1pcnJvciB0aGUgbm9kZSBBUEkuXG4gICAgICovXG4gICAgcHJvdG8ucmVtb3ZlQWxsTGlzdGVuZXJzID0gYWxpYXMoJ3JlbW92ZUV2ZW50Jyk7XG5cbiAgICAvKipcbiAgICAgKiBFbWl0cyBhbiBldmVudCBvZiB5b3VyIGNob2ljZS5cbiAgICAgKiBXaGVuIGVtaXR0ZWQsIGV2ZXJ5IGxpc3RlbmVyIGF0dGFjaGVkIHRvIHRoYXQgZXZlbnQgd2lsbCBiZSBleGVjdXRlZC5cbiAgICAgKiBJZiB5b3UgcGFzcyB0aGUgb3B0aW9uYWwgYXJndW1lbnQgYXJyYXkgdGhlbiB0aG9zZSBhcmd1bWVudHMgd2lsbCBiZSBwYXNzZWQgdG8gZXZlcnkgbGlzdGVuZXIgdXBvbiBleGVjdXRpb24uXG4gICAgICogQmVjYXVzZSBpdCB1c2VzIGBhcHBseWAsIHlvdXIgYXJyYXkgb2YgYXJndW1lbnRzIHdpbGwgYmUgcGFzc2VkIGFzIGlmIHlvdSB3cm90ZSB0aGVtIG91dCBzZXBhcmF0ZWx5LlxuICAgICAqIFNvIHRoZXkgd2lsbCBub3QgYXJyaXZlIHdpdGhpbiB0aGUgYXJyYXkgb24gdGhlIG90aGVyIHNpZGUsIHRoZXkgd2lsbCBiZSBzZXBhcmF0ZS5cbiAgICAgKiBZb3UgY2FuIGFsc28gcGFzcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBlbWl0IHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGVtaXQgYW5kIGV4ZWN1dGUgbGlzdGVuZXJzIGZvci5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBbYXJnc10gT3B0aW9uYWwgYXJyYXkgb2YgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBlYWNoIGxpc3RlbmVyLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHByb3RvLmVtaXRFdmVudCA9IGZ1bmN0aW9uIGVtaXRFdmVudChldnQsIGFyZ3MpIHtcbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcbiAgICAgICAgdmFyIGxpc3RlbmVyO1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgdmFyIGtleTtcbiAgICAgICAgdmFyIHJlc3BvbnNlO1xuXG4gICAgICAgIGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuICAgICAgICAgICAgaWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgaSA9IGxpc3RlbmVyc1trZXldLmxlbmd0aDtcblxuICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGxpc3RlbmVyIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHNoYWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGZ1bmN0aW9uIGlzIGV4ZWN1dGVkIGVpdGhlciB3aXRoIGEgYmFzaWMgY2FsbCBvciBhbiBhcHBseSBpZiB0aGVyZSBpcyBhbiBhcmdzIGFycmF5XG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyID0gbGlzdGVuZXJzW2tleV1baV07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpc3RlbmVyLm9uY2UgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lci5saXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IGxpc3RlbmVyLmxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3MgfHwgW10pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZSA9PT0gdGhpcy5fZ2V0T25jZVJldHVyblZhbHVlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lci5saXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQWxpYXMgb2YgZW1pdEV2ZW50XG4gICAgICovXG4gICAgcHJvdG8udHJpZ2dlciA9IGFsaWFzKCdlbWl0RXZlbnQnKTtcblxuICAgIC8qKlxuICAgICAqIFN1YnRseSBkaWZmZXJlbnQgZnJvbSBlbWl0RXZlbnQgaW4gdGhhdCBpdCB3aWxsIHBhc3MgaXRzIGFyZ3VtZW50cyBvbiB0byB0aGUgbGlzdGVuZXJzLCBhcyBvcHBvc2VkIHRvIHRha2luZyBhIHNpbmdsZSBhcnJheSBvZiBhcmd1bWVudHMgdG8gcGFzcyBvbi5cbiAgICAgKiBBcyB3aXRoIGVtaXRFdmVudCwgeW91IGNhbiBwYXNzIGEgcmVnZXggaW4gcGxhY2Ugb2YgdGhlIGV2ZW50IG5hbWUgdG8gZW1pdCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBlbWl0IGFuZCBleGVjdXRlIGxpc3RlbmVycyBmb3IuXG4gICAgICogQHBhcmFtIHsuLi4qfSBPcHRpb25hbCBhZGRpdGlvbmFsIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gZWFjaCBsaXN0ZW5lci5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5lbWl0ID0gZnVuY3Rpb24gZW1pdChldnQpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICByZXR1cm4gdGhpcy5lbWl0RXZlbnQoZXZ0LCBhcmdzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgY3VycmVudCB2YWx1ZSB0byBjaGVjayBhZ2FpbnN0IHdoZW4gZXhlY3V0aW5nIGxpc3RlbmVycy4gSWYgYVxuICAgICAqIGxpc3RlbmVycyByZXR1cm4gdmFsdWUgbWF0Y2hlcyB0aGUgb25lIHNldCBoZXJlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkXG4gICAgICogYWZ0ZXIgZXhlY3V0aW9uLiBUaGlzIHZhbHVlIGRlZmF1bHRzIHRvIHRydWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBuZXcgdmFsdWUgdG8gY2hlY2sgZm9yIHdoZW4gZXhlY3V0aW5nIGxpc3RlbmVycy5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5zZXRPbmNlUmV0dXJuVmFsdWUgPSBmdW5jdGlvbiBzZXRPbmNlUmV0dXJuVmFsdWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fb25jZVJldHVyblZhbHVlID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBGZXRjaGVzIHRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGFnYWluc3Qgd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLiBJZlxuICAgICAqIHRoZSBsaXN0ZW5lcnMgcmV0dXJuIHZhbHVlIG1hdGNoZXMgdGhpcyBvbmUgdGhlbiBpdCBzaG91bGQgYmUgcmVtb3ZlZFxuICAgICAqIGF1dG9tYXRpY2FsbHkuIEl0IHdpbGwgcmV0dXJuIHRydWUgYnkgZGVmYXVsdC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4geyp8Qm9vbGVhbn0gVGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgZm9yIG9yIHRoZSBkZWZhdWx0LCB0cnVlLlxuICAgICAqIEBhcGkgcHJpdmF0ZVxuICAgICAqL1xuICAgIHByb3RvLl9nZXRPbmNlUmV0dXJuVmFsdWUgPSBmdW5jdGlvbiBfZ2V0T25jZVJldHVyblZhbHVlKCkge1xuICAgICAgICBpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eSgnX29uY2VSZXR1cm5WYWx1ZScpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fb25jZVJldHVyblZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRmV0Y2hlcyB0aGUgZXZlbnRzIG9iamVjdCBhbmQgY3JlYXRlcyBvbmUgaWYgcmVxdWlyZWQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBldmVudHMgc3RvcmFnZSBvYmplY3QuXG4gICAgICogQGFwaSBwcml2YXRlXG4gICAgICovXG4gICAgcHJvdG8uX2dldEV2ZW50cyA9IGZ1bmN0aW9uIF9nZXRFdmVudHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ldmVudHMgfHwgKHRoaXMuX2V2ZW50cyA9IHt9KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmV2ZXJ0cyB0aGUgZ2xvYmFsIHtAbGluayBFdmVudEVtaXR0ZXJ9IHRvIGl0cyBwcmV2aW91cyB2YWx1ZSBhbmQgcmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGlzIHZlcnNpb24uXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gTm9uIGNvbmZsaWN0aW5nIEV2ZW50RW1pdHRlciBjbGFzcy5cbiAgICAgKi9cbiAgICBFdmVudEVtaXR0ZXIubm9Db25mbGljdCA9IGZ1bmN0aW9uIG5vQ29uZmxpY3QoKSB7XG4gICAgICAgIGV4cG9ydHMuRXZlbnRFbWl0dGVyID0gb3JpZ2luYWxHbG9iYWxWYWx1ZTtcbiAgICAgICAgcmV0dXJuIEV2ZW50RW1pdHRlcjtcbiAgICB9O1xuXG4gICAgLy8gRXhwb3NlIHRoZSBjbGFzcyBlaXRoZXIgdmlhIEFNRCwgQ29tbW9uSlMgb3IgdGhlIGdsb2JhbCBvYmplY3RcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gRXZlbnRFbWl0dGVyO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpe1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGV4cG9ydHMuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuICAgIH1cbn0uY2FsbCh0aGlzKSk7XG4iLCIoIGZ1bmN0aW9uKCB3aW5kb3csIGZhY3RvcnkgKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG5cbiAgaWYgKCB0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoIFtcbiAgICAgICcuL2ZsaWNraXR5JyxcbiAgICAgICdmaXp6eS11aS11dGlscy91dGlscydcbiAgICBdLCBmdW5jdGlvbiggRmxpY2tpdHksIHV0aWxzICkge1xuICAgICAgcmV0dXJuIGZhY3RvcnkoIHdpbmRvdywgRmxpY2tpdHksIHV0aWxzICk7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoIHR5cGVvZiBleHBvcnRzID09ICdvYmplY3QnICkge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LFxuICAgICAgcmVxdWlyZSgnLi9mbGlja2l0eScpLFxuICAgICAgcmVxdWlyZSgnZml6enktdWktdXRpbHMnKVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cuRmxpY2tpdHkgPSB3aW5kb3cuRmxpY2tpdHkgfHwge307XG4gICAgd2luZG93LkZsaWNraXR5ID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHdpbmRvdy5GbGlja2l0eSxcbiAgICAgIHdpbmRvdy5maXp6eVVJVXRpbHNcbiAgICApO1xuICB9XG5cbn0oIHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSggd2luZG93LCBGbGlja2l0eSwgdXRpbHMgKSB7XG5cbid1c2Ugc3RyaWN0JztcblxuLy8gYXBwZW5kIGNlbGxzIHRvIGEgZG9jdW1lbnQgZnJhZ21lbnRcbmZ1bmN0aW9uIGdldENlbGxzRnJhZ21lbnQoIGNlbGxzICkge1xuICB2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gIGZvciAoIHZhciBpPTAsIGxlbiA9IGNlbGxzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgIHZhciBjZWxsID0gY2VsbHNbaV07XG4gICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQoIGNlbGwuZWxlbWVudCApO1xuICB9XG4gIHJldHVybiBmcmFnbWVudDtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYWRkL3JlbW92ZSBjZWxsIHByb3RvdHlwZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4vKipcbiAqIEluc2VydCwgcHJlcGVuZCwgb3IgYXBwZW5kIGNlbGxzXG4gKiBAcGFyYW0ge0VsZW1lbnQsIEFycmF5LCBOb2RlTGlzdH0gZWxlbXNcbiAqIEBwYXJhbSB7SW50ZWdlcn0gaW5kZXhcbiAqL1xuRmxpY2tpdHkucHJvdG90eXBlLmluc2VydCA9IGZ1bmN0aW9uKCBlbGVtcywgaW5kZXggKSB7XG4gIHZhciBjZWxscyA9IHRoaXMuX21ha2VDZWxscyggZWxlbXMgKTtcbiAgaWYgKCAhY2VsbHMgfHwgIWNlbGxzLmxlbmd0aCApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIGxlbiA9IHRoaXMuY2VsbHMubGVuZ3RoO1xuICAvLyBkZWZhdWx0IHRvIGFwcGVuZFxuICBpbmRleCA9IGluZGV4ID09PSB1bmRlZmluZWQgPyBsZW4gOiBpbmRleDtcbiAgLy8gYWRkIGNlbGxzIHdpdGggZG9jdW1lbnQgZnJhZ21lbnRcbiAgdmFyIGZyYWdtZW50ID0gZ2V0Q2VsbHNGcmFnbWVudCggY2VsbHMgKTtcbiAgLy8gYXBwZW5kIHRvIHNsaWRlclxuICB2YXIgaXNBcHBlbmQgPSBpbmRleCA9PSBsZW47XG4gIGlmICggaXNBcHBlbmQgKSB7XG4gICAgdGhpcy5zbGlkZXIuYXBwZW5kQ2hpbGQoIGZyYWdtZW50ICk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGluc2VydENlbGxFbGVtZW50ID0gdGhpcy5jZWxsc1sgaW5kZXggXS5lbGVtZW50O1xuICAgIHRoaXMuc2xpZGVyLmluc2VydEJlZm9yZSggZnJhZ21lbnQsIGluc2VydENlbGxFbGVtZW50ICk7XG4gIH1cbiAgLy8gYWRkIHRvIHRoaXMuY2VsbHNcbiAgaWYgKCBpbmRleCA9PT0gMCApIHtcbiAgICAvLyBwcmVwZW5kLCBhZGQgdG8gc3RhcnRcbiAgICB0aGlzLmNlbGxzID0gY2VsbHMuY29uY2F0KCB0aGlzLmNlbGxzICk7XG4gIH0gZWxzZSBpZiAoIGlzQXBwZW5kICkge1xuICAgIC8vIGFwcGVuZCwgYWRkIHRvIGVuZFxuICAgIHRoaXMuY2VsbHMgPSB0aGlzLmNlbGxzLmNvbmNhdCggY2VsbHMgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBpbnNlcnQgaW4gdGhpcy5jZWxsc1xuICAgIHZhciBlbmRDZWxscyA9IHRoaXMuY2VsbHMuc3BsaWNlKCBpbmRleCwgbGVuIC0gaW5kZXggKTtcbiAgICB0aGlzLmNlbGxzID0gdGhpcy5jZWxscy5jb25jYXQoIGNlbGxzICkuY29uY2F0KCBlbmRDZWxscyApO1xuICB9XG5cbiAgdGhpcy5fc2l6ZUNlbGxzKCBjZWxscyApO1xuXG4gIHZhciBzZWxlY3RlZEluZGV4RGVsdGEgPSBpbmRleCA+IHRoaXMuc2VsZWN0ZWRJbmRleCA/IDAgOiBjZWxscy5sZW5ndGg7XG4gIHRoaXMuX2NlbGxBZGRlZFJlbW92ZWQoIGluZGV4LCBzZWxlY3RlZEluZGV4RGVsdGEgKTtcbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbiggZWxlbXMgKSB7XG4gIHRoaXMuaW5zZXJ0KCBlbGVtcywgdGhpcy5jZWxscy5sZW5ndGggKTtcbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5wcmVwZW5kID0gZnVuY3Rpb24oIGVsZW1zICkge1xuICB0aGlzLmluc2VydCggZWxlbXMsIDAgKTtcbn07XG5cbi8qKlxuICogUmVtb3ZlIGNlbGxzXG4gKiBAcGFyYW0ge0VsZW1lbnQsIEFycmF5LCBOb2RlTGlzdH0gZWxlbXNcbiAqL1xuRmxpY2tpdHkucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKCBlbGVtcyApIHtcbiAgdmFyIGNlbGxzID0gdGhpcy5nZXRDZWxscyggZWxlbXMgKTtcbiAgdmFyIHNlbGVjdGVkSW5kZXhEZWx0YSA9IDA7XG4gIHZhciBpLCBsZW4sIGNlbGw7XG4gIC8vIGNhbGN1bGF0ZSBzZWxlY3RlZEluZGV4RGVsdGEsIGVhc2llciBpZiBkb25lIGluIHNlcGVyYXRlIGxvb3BcbiAgZm9yICggaT0wLCBsZW4gPSBjZWxscy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICBjZWxsID0gY2VsbHNbaV07XG4gICAgdmFyIHdhc0JlZm9yZSA9IHV0aWxzLmluZGV4T2YoIHRoaXMuY2VsbHMsIGNlbGwgKSA8IHRoaXMuc2VsZWN0ZWRJbmRleDtcbiAgICBzZWxlY3RlZEluZGV4RGVsdGEgLT0gd2FzQmVmb3JlID8gMSA6IDA7XG4gIH1cblxuICBmb3IgKCBpPTAsIGxlbiA9IGNlbGxzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgIGNlbGwgPSBjZWxsc1tpXTtcbiAgICBjZWxsLnJlbW92ZSgpO1xuICAgIC8vIHJlbW92ZSBpdGVtIGZyb20gY29sbGVjdGlvblxuICAgIHV0aWxzLnJlbW92ZUZyb20oIHRoaXMuY2VsbHMsIGNlbGwgKTtcbiAgfVxuXG4gIGlmICggY2VsbHMubGVuZ3RoICkge1xuICAgIC8vIHVwZGF0ZSBzdHVmZlxuICAgIHRoaXMuX2NlbGxBZGRlZFJlbW92ZWQoIDAsIHNlbGVjdGVkSW5kZXhEZWx0YSApO1xuICB9XG59O1xuXG4vLyB1cGRhdGVzIHdoZW4gY2VsbHMgYXJlIGFkZGVkIG9yIHJlbW92ZWRcbkZsaWNraXR5LnByb3RvdHlwZS5fY2VsbEFkZGVkUmVtb3ZlZCA9IGZ1bmN0aW9uKCBjaGFuZ2VkQ2VsbEluZGV4LCBzZWxlY3RlZEluZGV4RGVsdGEgKSB7XG4gIHNlbGVjdGVkSW5kZXhEZWx0YSA9IHNlbGVjdGVkSW5kZXhEZWx0YSB8fCAwO1xuICB0aGlzLnNlbGVjdGVkSW5kZXggKz0gc2VsZWN0ZWRJbmRleERlbHRhO1xuICB0aGlzLnNlbGVjdGVkSW5kZXggPSBNYXRoLm1heCggMCwgTWF0aC5taW4oIHRoaXMuY2VsbHMubGVuZ3RoIC0gMSwgdGhpcy5zZWxlY3RlZEluZGV4ICkgKTtcblxuICB0aGlzLmVtaXRFdmVudCggJ2NlbGxBZGRlZFJlbW92ZWQnLCBbIGNoYW5nZWRDZWxsSW5kZXgsIHNlbGVjdGVkSW5kZXhEZWx0YSBdICk7XG4gIHRoaXMuY2VsbENoYW5nZSggY2hhbmdlZENlbGxJbmRleCApO1xufTtcblxuLyoqXG4gKiBsb2dpYyB0byBiZSBydW4gYWZ0ZXIgYSBjZWxsJ3Mgc2l6ZSBjaGFuZ2VzXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW0gLSBjZWxsJ3MgZWxlbWVudFxuICovXG5GbGlja2l0eS5wcm90b3R5cGUuY2VsbFNpemVDaGFuZ2UgPSBmdW5jdGlvbiggZWxlbSApIHtcbiAgdmFyIGNlbGwgPSB0aGlzLmdldENlbGwoIGVsZW0gKTtcbiAgaWYgKCAhY2VsbCApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY2VsbC5nZXRTaXplKCk7XG5cbiAgdmFyIGluZGV4ID0gdXRpbHMuaW5kZXhPZiggdGhpcy5jZWxscywgY2VsbCApO1xuICB0aGlzLmNlbGxDaGFuZ2UoIGluZGV4ICk7XG59O1xuXG4vKipcbiAqIGxvZ2ljIGFueSB0aW1lIGEgY2VsbCBpcyBjaGFuZ2VkOiBhZGRlZCwgcmVtb3ZlZCwgb3Igc2l6ZSBjaGFuZ2VkXG4gKiBAcGFyYW0ge0ludGVnZXJ9IGNoYW5nZWRDZWxsSW5kZXggLSBpbmRleCBvZiB0aGUgY2hhbmdlZCBjZWxsLCBvcHRpb25hbFxuICovXG5GbGlja2l0eS5wcm90b3R5cGUuY2VsbENoYW5nZSA9IGZ1bmN0aW9uKCBjaGFuZ2VkQ2VsbEluZGV4ICkge1xuICAvLyBUT0RPIG1heWJlIGFsd2F5cyBzaXplIGFsbCBjZWxscyB1bmxlc3MgaXNTa2lwcGluZ1NpemluZ1xuICAvLyBzaXplIGFsbCBjZWxscyBpZiBuZWNlc3NhcnlcbiAgLy8gaWYgKCAhaXNTa2lwcGluZ1NpemluZyApIHtcbiAgLy8gICB0aGlzLl9zaXplQ2VsbHMoIHRoaXMuY2VsbHMgKTtcbiAgLy8gfVxuXG4gIGNoYW5nZWRDZWxsSW5kZXggPSBjaGFuZ2VkQ2VsbEluZGV4IHx8IDA7XG5cbiAgdGhpcy5fcG9zaXRpb25DZWxscyggY2hhbmdlZENlbGxJbmRleCApO1xuICB0aGlzLl9nZXRXcmFwU2hpZnRDZWxscygpO1xuICB0aGlzLnNldEdhbGxlcnlTaXplKCk7XG4gIC8vIHBvc2l0aW9uIHNsaWRlclxuICBpZiAoIHRoaXMub3B0aW9ucy5mcmVlU2Nyb2xsICkge1xuICAgIHRoaXMucG9zaXRpb25TbGlkZXIoKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnBvc2l0aW9uU2xpZGVyQXRTZWxlY3RlZCgpO1xuICAgIHRoaXMuc2VsZWN0KCB0aGlzLnNlbGVjdGVkSW5kZXggKTtcbiAgfVxufTtcblxuLy8gLS0tLS0gIC0tLS0tIC8vXG5cbnJldHVybiBGbGlja2l0eTtcblxufSkpO1xuIiwiKCBmdW5jdGlvbiggd2luZG93LCBmYWN0b3J5ICkge1xuICAndXNlIHN0cmljdCc7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIGlmICggdHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCBbXG4gICAgICAnZ2V0LXN0eWxlLXByb3BlcnR5L2dldC1zdHlsZS1wcm9wZXJ0eScsXG4gICAgICAnZml6enktdWktdXRpbHMvdXRpbHMnXG4gICAgXSwgZnVuY3Rpb24oIGdldFN0eWxlUHJvcGVydHksIHV0aWxzICkge1xuICAgICAgcmV0dXJuIGZhY3RvcnkoIHdpbmRvdywgZ2V0U3R5bGVQcm9wZXJ0eSwgdXRpbHMgKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIGV4cG9ydHMgPT0gJ29iamVjdCcgKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICByZXF1aXJlKCdkZXNhbmRyby1nZXQtc3R5bGUtcHJvcGVydHknKSxcbiAgICAgIHJlcXVpcmUoJ2Zpenp5LXVpLXV0aWxzJylcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93LkZsaWNraXR5ID0gd2luZG93LkZsaWNraXR5IHx8IHt9O1xuICAgIHdpbmRvdy5GbGlja2l0eS5hbmltYXRlUHJvdG90eXBlID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHdpbmRvdy5nZXRTdHlsZVByb3BlcnR5LFxuICAgICAgd2luZG93LmZpenp5VUlVdGlsc1xuICAgICk7XG4gIH1cblxufSggd2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KCB3aW5kb3csIGdldFN0eWxlUHJvcGVydHksIHV0aWxzICkge1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHJlcXVlc3RBbmltYXRpb25GcmFtZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4vLyBodHRwczovL2dpc3QuZ2l0aHViLmNvbS8xODY2NDc0XG5cbnZhciBsYXN0VGltZSA9IDA7XG52YXIgcHJlZml4ZXMgPSAnd2Via2l0IG1veiBtcyBvJy5zcGxpdCgnICcpO1xuLy8gZ2V0IHVucHJlZml4ZWQgckFGIGFuZCBjQUYsIGlmIHByZXNlbnRcbnZhciByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xudmFyIGNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lO1xuLy8gbG9vcCB0aHJvdWdoIHZlbmRvciBwcmVmaXhlcyBhbmQgZ2V0IHByZWZpeGVkIHJBRiBhbmQgY0FGXG52YXIgcHJlZml4O1xuZm9yKCB2YXIgaSA9IDA7IGkgPCBwcmVmaXhlcy5sZW5ndGg7IGkrKyApIHtcbiAgaWYgKCByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgJiYgY2FuY2VsQW5pbWF0aW9uRnJhbWUgKSB7XG4gICAgYnJlYWs7XG4gIH1cbiAgcHJlZml4ID0gcHJlZml4ZXNbaV07XG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3dbIHByZWZpeCArICdSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnIF07XG4gIGNhbmNlbEFuaW1hdGlvbkZyYW1lICA9IGNhbmNlbEFuaW1hdGlvbkZyYW1lICB8fCB3aW5kb3dbIHByZWZpeCArICdDYW5jZWxBbmltYXRpb25GcmFtZScgXSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvd1sgcHJlZml4ICsgJ0NhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZScgXTtcbn1cblxuLy8gZmFsbGJhY2sgdG8gc2V0VGltZW91dCBhbmQgY2xlYXJUaW1lb3V0IGlmIGVpdGhlciByZXF1ZXN0L2NhbmNlbCBpcyBub3Qgc3VwcG9ydGVkXG5pZiAoICFyZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgIWNhbmNlbEFuaW1hdGlvbkZyYW1lICkgIHtcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oIGNhbGxiYWNrICkge1xuICAgIHZhciBjdXJyVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIHZhciB0aW1lVG9DYWxsID0gTWF0aC5tYXgoIDAsIDE2IC0gKCBjdXJyVGltZSAtIGxhc3RUaW1lICkgKTtcbiAgICB2YXIgaWQgPSB3aW5kb3cuc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG4gICAgICBjYWxsYmFjayggY3VyclRpbWUgKyB0aW1lVG9DYWxsICk7XG4gICAgfSwgdGltZVRvQ2FsbCApO1xuICAgIGxhc3RUaW1lID0gY3VyclRpbWUgKyB0aW1lVG9DYWxsO1xuICAgIHJldHVybiBpZDtcbiAgfTtcblxuICBjYW5jZWxBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKCBpZCApIHtcbiAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KCBpZCApO1xuICB9O1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBhbmltYXRlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbnZhciBwcm90byA9IHt9O1xuXG5wcm90by5zdGFydEFuaW1hdGlvbiA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIHRoaXMuaXNBbmltYXRpbmcgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhpcy5pc0FuaW1hdGluZyA9IHRydWU7XG4gIHRoaXMucmVzdGluZ0ZyYW1lcyA9IDA7XG4gIHRoaXMuYW5pbWF0ZSgpO1xufTtcblxucHJvdG8uYW5pbWF0ZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmFwcGx5U2VsZWN0ZWRBdHRyYWN0aW9uKCk7XG5cbiAgdmFyIHByZXZpb3VzWCA9IHRoaXMueDtcblxuICB0aGlzLmludGVncmF0ZVBoeXNpY3MoKTtcbiAgdGhpcy5wb3NpdGlvblNsaWRlcigpO1xuICB0aGlzLnNldHRsZSggcHJldmlvdXNYICk7XG4gIC8vIGFuaW1hdGUgbmV4dCBmcmFtZVxuICBpZiAoIHRoaXMuaXNBbmltYXRpbmcgKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoIGZ1bmN0aW9uIGFuaW1hdGVGcmFtZSgpIHtcbiAgICAgIF90aGlzLmFuaW1hdGUoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiAvXG4gIC8vIGxvZyBhbmltYXRpb24gZnJhbWUgcmF0ZVxuICB2YXIgbm93ID0gbmV3IERhdGUoKTtcbiAgaWYgKCB0aGlzLnRoZW4gKSB7XG4gICAgY29uc29sZS5sb2coIH5+KCAxMDAwIC8gKG5vdy10aGlzLnRoZW4pKSArICdmcHMnIClcbiAgfVxuICB0aGlzLnRoZW4gPSBub3c7XG4gIC8qKi9cbn07XG5cblxudmFyIHRyYW5zZm9ybVByb3BlcnR5ID0gZ2V0U3R5bGVQcm9wZXJ0eSgndHJhbnNmb3JtJyk7XG52YXIgaXMzZCA9ICEhZ2V0U3R5bGVQcm9wZXJ0eSgncGVyc3BlY3RpdmUnKTtcblxucHJvdG8ucG9zaXRpb25TbGlkZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHggPSB0aGlzLng7XG4gIC8vIHdyYXAgcG9zaXRpb24gYXJvdW5kXG4gIGlmICggdGhpcy5vcHRpb25zLndyYXBBcm91bmQgJiYgdGhpcy5jZWxscy5sZW5ndGggPiAxICkge1xuICAgIHggPSB1dGlscy5tb2R1bG8oIHgsIHRoaXMuc2xpZGVhYmxlV2lkdGggKTtcbiAgICB4ID0geCAtIHRoaXMuc2xpZGVhYmxlV2lkdGg7XG4gICAgdGhpcy5zaGlmdFdyYXBDZWxscyggeCApO1xuICB9XG5cbiAgeCA9IHggKyB0aGlzLmN1cnNvclBvc2l0aW9uO1xuXG4gIC8vIHJldmVyc2UgaWYgcmlnaHQtdG8tbGVmdCBhbmQgdXNpbmcgdHJhbnNmb3JtXG4gIHggPSB0aGlzLm9wdGlvbnMucmlnaHRUb0xlZnQgJiYgdHJhbnNmb3JtUHJvcGVydHkgPyAteCA6IHg7XG5cbiAgdmFyIHZhbHVlID0gdGhpcy5nZXRQb3NpdGlvblZhbHVlKCB4ICk7XG5cbiAgaWYgKCB0cmFuc2Zvcm1Qcm9wZXJ0eSApIHtcbiAgICAvLyB1c2UgM0QgdHJhbmZvcm1zIGZvciBoYXJkd2FyZSBhY2NlbGVyYXRpb24gb24gaU9TXG4gICAgLy8gYnV0IHVzZSAyRCB3aGVuIHNldHRsZWQsIGZvciBiZXR0ZXIgZm9udC1yZW5kZXJpbmdcbiAgICB0aGlzLnNsaWRlci5zdHlsZVsgdHJhbnNmb3JtUHJvcGVydHkgXSA9IGlzM2QgJiYgdGhpcy5pc0FuaW1hdGluZyA/XG4gICAgICAndHJhbnNsYXRlM2QoJyArIHZhbHVlICsgJywwLDApJyA6ICd0cmFuc2xhdGVYKCcgKyB2YWx1ZSArICcpJztcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnNsaWRlci5zdHlsZVsgdGhpcy5vcmlnaW5TaWRlIF0gPSB2YWx1ZTtcbiAgfVxufTtcblxucHJvdG8ucG9zaXRpb25TbGlkZXJBdFNlbGVjdGVkID0gZnVuY3Rpb24oKSB7XG4gIGlmICggIXRoaXMuY2VsbHMubGVuZ3RoICkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgc2VsZWN0ZWRDZWxsID0gdGhpcy5jZWxsc1sgdGhpcy5zZWxlY3RlZEluZGV4IF07XG4gIHRoaXMueCA9IC1zZWxlY3RlZENlbGwudGFyZ2V0O1xuICB0aGlzLnBvc2l0aW9uU2xpZGVyKCk7XG59O1xuXG5wcm90by5nZXRQb3NpdGlvblZhbHVlID0gZnVuY3Rpb24oIHBvc2l0aW9uICkge1xuICBpZiAoIHRoaXMub3B0aW9ucy5wZXJjZW50UG9zaXRpb24gKSB7XG4gICAgLy8gcGVyY2VudCBwb3NpdGlvbiwgcm91bmQgdG8gMiBkaWdpdHMsIGxpa2UgMTIuMzQlXG4gICAgcmV0dXJuICggTWF0aC5yb3VuZCggKCBwb3NpdGlvbiAvIHRoaXMuc2l6ZS5pbm5lcldpZHRoICkgKiAxMDAwMCApICogMC4wMSApKyAnJSc7XG4gIH0gZWxzZSB7XG4gICAgLy8gcGl4ZWwgcG9zaXRpb25pbmdcbiAgICByZXR1cm4gTWF0aC5yb3VuZCggcG9zaXRpb24gKSArICdweCc7XG4gIH1cbn07XG5cbnByb3RvLnNldHRsZSA9IGZ1bmN0aW9uKCBwcmV2aW91c1ggKSB7XG4gIC8vIGtlZXAgdHJhY2sgb2YgZnJhbWVzIHdoZXJlIHggaGFzbid0IG1vdmVkXG4gIGlmICggIXRoaXMuaXNQb2ludGVyRG93biAmJiBNYXRoLnJvdW5kKCB0aGlzLnggKiAxMDAgKSA9PSBNYXRoLnJvdW5kKCBwcmV2aW91c1ggKiAxMDAgKSApIHtcbiAgICB0aGlzLnJlc3RpbmdGcmFtZXMrKztcbiAgfVxuICAvLyBzdG9wIGFuaW1hdGluZyBpZiByZXN0aW5nIGZvciAzIG9yIG1vcmUgZnJhbWVzXG4gIGlmICggdGhpcy5yZXN0aW5nRnJhbWVzID4gMiApIHtcbiAgICB0aGlzLmlzQW5pbWF0aW5nID0gZmFsc2U7XG4gICAgZGVsZXRlIHRoaXMuaXNGcmVlU2Nyb2xsaW5nO1xuICAgIC8vIHJlbmRlciBwb3NpdGlvbiB3aXRoIHRyYW5zbGF0ZVggd2hlbiBzZXR0bGVkXG4gICAgaWYgKCBpczNkICkge1xuICAgICAgdGhpcy5wb3NpdGlvblNsaWRlcigpO1xuICAgIH1cbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ3NldHRsZScpO1xuICB9XG59O1xuXG5wcm90by5zaGlmdFdyYXBDZWxscyA9IGZ1bmN0aW9uKCB4ICkge1xuICAvLyBzaGlmdCBiZWZvcmUgY2VsbHNcbiAgdmFyIGJlZm9yZUdhcCA9IHRoaXMuY3Vyc29yUG9zaXRpb24gKyB4O1xuICB0aGlzLl9zaGlmdENlbGxzKCB0aGlzLmJlZm9yZVNoaWZ0Q2VsbHMsIGJlZm9yZUdhcCwgLTEgKTtcbiAgLy8gc2hpZnQgYWZ0ZXIgY2VsbHNcbiAgdmFyIGFmdGVyR2FwID0gdGhpcy5zaXplLmlubmVyV2lkdGggLSAoIHggKyB0aGlzLnNsaWRlYWJsZVdpZHRoICsgdGhpcy5jdXJzb3JQb3NpdGlvbiApO1xuICB0aGlzLl9zaGlmdENlbGxzKCB0aGlzLmFmdGVyU2hpZnRDZWxscywgYWZ0ZXJHYXAsIDEgKTtcbn07XG5cbnByb3RvLl9zaGlmdENlbGxzID0gZnVuY3Rpb24oIGNlbGxzLCBnYXAsIHNoaWZ0ICkge1xuICBmb3IgKCB2YXIgaT0wLCBsZW4gPSBjZWxscy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICB2YXIgY2VsbCA9IGNlbGxzW2ldO1xuICAgIHZhciBjZWxsU2hpZnQgPSBnYXAgPiAwID8gc2hpZnQgOiAwO1xuICAgIGNlbGwud3JhcFNoaWZ0KCBjZWxsU2hpZnQgKTtcbiAgICBnYXAgLT0gY2VsbC5zaXplLm91dGVyV2lkdGg7XG4gIH1cbn07XG5cbnByb3RvLl91bnNoaWZ0Q2VsbHMgPSBmdW5jdGlvbiggY2VsbHMgKSB7XG4gIGlmICggIWNlbGxzIHx8ICFjZWxscy5sZW5ndGggKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGZvciAoIHZhciBpPTAsIGxlbiA9IGNlbGxzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgIGNlbGxzW2ldLndyYXBTaGlmdCggMCApO1xuICB9XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBwaHlzaWNzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbnByb3RvLmludGVncmF0ZVBoeXNpY3MgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy52ZWxvY2l0eSArPSB0aGlzLmFjY2VsO1xuICB0aGlzLnggKz0gdGhpcy52ZWxvY2l0eTtcbiAgdGhpcy52ZWxvY2l0eSAqPSB0aGlzLmdldEZyaWN0aW9uRmFjdG9yKCk7XG4gIC8vIHJlc2V0IGFjY2VsZXJhdGlvblxuICB0aGlzLmFjY2VsID0gMDtcbn07XG5cbnByb3RvLmFwcGx5Rm9yY2UgPSBmdW5jdGlvbiggZm9yY2UgKSB7XG4gIHRoaXMuYWNjZWwgKz0gZm9yY2U7XG59O1xuXG5wcm90by5nZXRGcmljdGlvbkZhY3RvciA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gMSAtIHRoaXMub3B0aW9uc1sgdGhpcy5pc0ZyZWVTY3JvbGxpbmcgPyAnZnJlZVNjcm9sbEZyaWN0aW9uJyA6ICdmcmljdGlvbicgXTtcbn07XG5cblxucHJvdG8uZ2V0UmVzdGluZ1Bvc2l0aW9uID0gZnVuY3Rpb24oKSB7XG4gIC8vIG15IHRoYW5rcyB0byBTdGV2ZW4gV2l0dGVucywgd2hvIHNpbXBsaWZpZWQgdGhpcyBtYXRoIGdyZWF0bHlcbiAgcmV0dXJuIHRoaXMueCArIHRoaXMudmVsb2NpdHkgLyAoIDEgLSB0aGlzLmdldEZyaWN0aW9uRmFjdG9yKCkgKTtcbn07XG5cblxucHJvdG8uYXBwbHlTZWxlY3RlZEF0dHJhY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgLy8gZG8gbm90IGF0dHJhY3QgaWYgcG9pbnRlciBkb3duIG9yIG5vIGNlbGxzXG4gIHZhciBsZW4gPSB0aGlzLmNlbGxzLmxlbmd0aDtcbiAgaWYgKCB0aGlzLmlzUG9pbnRlckRvd24gfHwgdGhpcy5pc0ZyZWVTY3JvbGxpbmcgfHwgIWxlbiApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIGNlbGwgPSB0aGlzLmNlbGxzWyB0aGlzLnNlbGVjdGVkSW5kZXggXTtcbiAgdmFyIHdyYXAgPSB0aGlzLm9wdGlvbnMud3JhcEFyb3VuZCAmJiBsZW4gPiAxID9cbiAgICB0aGlzLnNsaWRlYWJsZVdpZHRoICogTWF0aC5mbG9vciggdGhpcy5zZWxlY3RlZEluZGV4IC8gbGVuICkgOiAwO1xuICB2YXIgZGlzdGFuY2UgPSAoIGNlbGwudGFyZ2V0ICsgd3JhcCApICogLTEgLSB0aGlzLng7XG4gIHZhciBmb3JjZSA9IGRpc3RhbmNlICogdGhpcy5vcHRpb25zLnNlbGVjdGVkQXR0cmFjdGlvbjtcbiAgdGhpcy5hcHBseUZvcmNlKCBmb3JjZSApO1xufTtcblxucmV0dXJuIHByb3RvO1xuXG59KSk7XG4iLCIoIGZ1bmN0aW9uKCB3aW5kb3csIGZhY3RvcnkgKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG5cbiAgaWYgKCB0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoIFtcbiAgICAgICdnZXQtc2l6ZS9nZXQtc2l6ZSdcbiAgICBdLCBmdW5jdGlvbiggZ2V0U2l6ZSApIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KCB3aW5kb3csIGdldFNpemUgKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIGV4cG9ydHMgPT0gJ29iamVjdCcgKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICByZXF1aXJlKCdnZXQtc2l6ZScpXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5GbGlja2l0eSA9IHdpbmRvdy5GbGlja2l0eSB8fCB7fTtcbiAgICB3aW5kb3cuRmxpY2tpdHkuQ2VsbCA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICB3aW5kb3cuZ2V0U2l6ZVxuICAgICk7XG4gIH1cblxufSggd2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KCB3aW5kb3csIGdldFNpemUgKSB7XG5cbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gQ2VsbCggZWxlbSwgcGFyZW50ICkge1xuICB0aGlzLmVsZW1lbnQgPSBlbGVtO1xuICB0aGlzLnBhcmVudCA9IHBhcmVudDtcblxuICB0aGlzLmNyZWF0ZSgpO1xufVxuXG52YXIgaXNJRTggPSAnYXR0YWNoRXZlbnQnIGluIHdpbmRvdztcblxuQ2VsbC5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIC8vIElFOCBwcmV2ZW50IGNoaWxkIGZyb20gY2hhbmdpbmcgZm9jdXMgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTc1MjUyMjMvMTgyMTgzXG4gIGlmICggaXNJRTggKSB7XG4gICAgdGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZSggJ3Vuc2VsZWN0YWJsZScsICdvbicgKTtcbiAgfVxuICB0aGlzLnggPSAwO1xuICB0aGlzLnNoaWZ0ID0gMDtcbn07XG5cbkNlbGwucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgLy8gcmVzZXQgc3R5bGVcbiAgdGhpcy5lbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJyc7XG4gIHZhciBzaWRlID0gdGhpcy5wYXJlbnQub3JpZ2luU2lkZTtcbiAgdGhpcy5lbGVtZW50LnN0eWxlWyBzaWRlIF0gPSAnJztcbn07XG5cbkNlbGwucHJvdG90eXBlLmdldFNpemUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5zaXplID0gZ2V0U2l6ZSggdGhpcy5lbGVtZW50ICk7XG59O1xuXG5DZWxsLnByb3RvdHlwZS5zZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKCB4ICkge1xuICB0aGlzLnggPSB4O1xuICB0aGlzLnNldERlZmF1bHRUYXJnZXQoKTtcbiAgdGhpcy5yZW5kZXJQb3NpdGlvbiggeCApO1xufTtcblxuQ2VsbC5wcm90b3R5cGUuc2V0RGVmYXVsdFRhcmdldCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbWFyZ2luUHJvcGVydHkgPSB0aGlzLnBhcmVudC5vcmlnaW5TaWRlID09ICdsZWZ0JyA/ICdtYXJnaW5MZWZ0JyA6ICdtYXJnaW5SaWdodCc7XG4gIHRoaXMudGFyZ2V0ID0gdGhpcy54ICsgdGhpcy5zaXplWyBtYXJnaW5Qcm9wZXJ0eSBdICtcbiAgICB0aGlzLnNpemUud2lkdGggKiB0aGlzLnBhcmVudC5jZWxsQWxpZ247XG59O1xuXG5DZWxsLnByb3RvdHlwZS5yZW5kZXJQb3NpdGlvbiA9IGZ1bmN0aW9uKCB4ICkge1xuICAvLyByZW5kZXIgcG9zaXRpb24gb2YgY2VsbCB3aXRoIGluIHNsaWRlclxuICB2YXIgc2lkZSA9IHRoaXMucGFyZW50Lm9yaWdpblNpZGU7XG4gIHRoaXMuZWxlbWVudC5zdHlsZVsgc2lkZSBdID0gdGhpcy5wYXJlbnQuZ2V0UG9zaXRpb25WYWx1ZSggeCApO1xufTtcblxuLyoqXG4gKiBAcGFyYW0ge0ludGVnZXJ9IGZhY3RvciAtIDAsIDEsIG9yIC0xXG4qKi9cbkNlbGwucHJvdG90eXBlLndyYXBTaGlmdCA9IGZ1bmN0aW9uKCBzaGlmdCApIHtcbiAgdGhpcy5zaGlmdCA9IHNoaWZ0O1xuICB0aGlzLnJlbmRlclBvc2l0aW9uKCB0aGlzLnggKyB0aGlzLnBhcmVudC5zbGlkZWFibGVXaWR0aCAqIHNoaWZ0ICk7XG59O1xuXG5DZWxsLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoIHRoaXMuZWxlbWVudCApO1xufTtcblxucmV0dXJuIENlbGw7XG5cbn0pKTtcbiIsIiggZnVuY3Rpb24oIHdpbmRvdywgZmFjdG9yeSApIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICBpZiAoIHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSggW1xuICAgICAgJ2NsYXNzaWUvY2xhc3NpZScsXG4gICAgICAnZXZlbnRpZS9ldmVudGllJyxcbiAgICAgICcuL2ZsaWNraXR5JyxcbiAgICAgICd1bmlkcmFnZ2VyL3VuaWRyYWdnZXInLFxuICAgICAgJ2Zpenp5LXVpLXV0aWxzL3V0aWxzJ1xuICAgIF0sIGZ1bmN0aW9uKCBjbGFzc2llLCBldmVudGllLCBGbGlja2l0eSwgVW5pZHJhZ2dlciwgdXRpbHMgKSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSggd2luZG93LCBjbGFzc2llLCBldmVudGllLCBGbGlja2l0eSwgVW5pZHJhZ2dlciwgdXRpbHMgKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIGV4cG9ydHMgPT0gJ29iamVjdCcgKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICByZXF1aXJlKCdkZXNhbmRyby1jbGFzc2llJyksXG4gICAgICByZXF1aXJlKCdldmVudGllJyksXG4gICAgICByZXF1aXJlKCcuL2ZsaWNraXR5JyksXG4gICAgICByZXF1aXJlKCd1bmlkcmFnZ2VyJyksXG4gICAgICByZXF1aXJlKCdmaXp6eS11aS11dGlscycpXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5GbGlja2l0eSA9IHdpbmRvdy5GbGlja2l0eSB8fCB7fTtcbiAgICB3aW5kb3cuRmxpY2tpdHkuZHJhZ1Byb3RvdHlwZSA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICB3aW5kb3cuY2xhc3NpZSxcbiAgICAgIHdpbmRvdy5ldmVudGllLFxuICAgICAgd2luZG93LkZsaWNraXR5LFxuICAgICAgd2luZG93LlVuaWRyYWdnZXIsXG4gICAgICB3aW5kb3cuZml6enlVSVV0aWxzXG4gICAgKTtcbiAgfVxuXG59KCB3aW5kb3csIGZ1bmN0aW9uIGZhY3RvcnkoIHdpbmRvdywgY2xhc3NpZSwgZXZlbnRpZSwgRmxpY2tpdHksIFVuaWRyYWdnZXIsIHV0aWxzICkge1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIGhhbmRsZSBJRTggcHJldmVudCBkZWZhdWx0XG5mdW5jdGlvbiBwcmV2ZW50RGVmYXVsdEV2ZW50KCBldmVudCApIHtcbiAgaWYgKCBldmVudC5wcmV2ZW50RGVmYXVsdCApIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICB9IGVsc2Uge1xuICAgIGV2ZW50LnJldHVyblZhbHVlID0gZmFsc2U7XG4gIH1cbn1cblxuLy8gLS0tLS0gZGVmYXVsdHMgLS0tLS0gLy9cblxudXRpbHMuZXh0ZW5kKCBGbGlja2l0eS5kZWZhdWx0cywge1xuICBkcmFnZ2FibGU6IHRydWUsXG4gIHRvdWNoVmVydGljYWxTY3JvbGw6IHRydWVcbn0pO1xuXG4vLyAtLS0tLSBjcmVhdGUgLS0tLS0gLy9cblxuRmxpY2tpdHkuY3JlYXRlTWV0aG9kcy5wdXNoKCdfY3JlYXRlRHJhZycpO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkcmFnIHByb3RvdHlwZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG52YXIgcHJvdG8gPSB7fTtcbnV0aWxzLmV4dGVuZCggcHJvdG8sIFVuaWRyYWdnZXIucHJvdG90eXBlICk7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5wcm90by5fY3JlYXRlRHJhZyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLm9uKCAnYWN0aXZhdGUnLCB0aGlzLmJpbmREcmFnICk7XG4gIHRoaXMub24oICd1aUNoYW5nZScsIHRoaXMuX3VpQ2hhbmdlRHJhZyApO1xuICB0aGlzLm9uKCAnY2hpbGRVSVBvaW50ZXJEb3duJywgdGhpcy5fY2hpbGRVSVBvaW50ZXJEb3duRHJhZyApO1xuICB0aGlzLm9uKCAnZGVhY3RpdmF0ZScsIHRoaXMudW5iaW5kRHJhZyApO1xufTtcblxucHJvdG8uYmluZERyYWcgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCAhdGhpcy5vcHRpb25zLmRyYWdnYWJsZSB8fCB0aGlzLmlzRHJhZ0JvdW5kICkge1xuICAgIHJldHVybjtcbiAgfVxuICBjbGFzc2llLmFkZCggdGhpcy5lbGVtZW50LCAnaXMtZHJhZ2dhYmxlJyApO1xuICB0aGlzLmhhbmRsZXMgPSBbIHRoaXMudmlld3BvcnQgXTtcbiAgdGhpcy5iaW5kSGFuZGxlcygpO1xuICB0aGlzLmlzRHJhZ0JvdW5kID0gdHJ1ZTtcbn07XG5cbnByb3RvLnVuYmluZERyYWcgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCAhdGhpcy5pc0RyYWdCb3VuZCApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY2xhc3NpZS5yZW1vdmUoIHRoaXMuZWxlbWVudCwgJ2lzLWRyYWdnYWJsZScgKTtcbiAgdGhpcy51bmJpbmRIYW5kbGVzKCk7XG4gIGRlbGV0ZSB0aGlzLmlzRHJhZ0JvdW5kO1xufTtcblxucHJvdG8uX3VpQ2hhbmdlRHJhZyA9IGZ1bmN0aW9uKCkge1xuICBkZWxldGUgdGhpcy5pc0ZyZWVTY3JvbGxpbmc7XG59O1xuXG5wcm90by5fY2hpbGRVSVBvaW50ZXJEb3duRHJhZyA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgcHJldmVudERlZmF1bHRFdmVudCggZXZlbnQgKTtcbiAgdGhpcy5wb2ludGVyRG93bkZvY3VzKCBldmVudCApO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gcG9pbnRlciBldmVudHMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxucHJvdG8ucG9pbnRlckRvd24gPSBmdW5jdGlvbiggZXZlbnQsIHBvaW50ZXIgKSB7XG4gIHRoaXMuX2RyYWdQb2ludGVyRG93biggZXZlbnQsIHBvaW50ZXIgKTtcblxuICAvLyBrbHVkZ2UgdG8gYmx1ciBmb2N1c2VkIGlucHV0cyBpbiBkcmFnZ2VyXG4gIHZhciBmb2N1c2VkID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgaWYgKCBmb2N1c2VkICYmIGZvY3VzZWQuYmx1ciAmJiBmb2N1c2VkICE9IHRoaXMuZWxlbWVudCAmJlxuICAgIC8vIGRvIG5vdCBibHVyIGJvZHkgZm9yIElFOSAmIDEwLCAjMTE3XG4gICAgZm9jdXNlZCAhPSBkb2N1bWVudC5ib2R5ICkge1xuICAgIGZvY3VzZWQuYmx1cigpO1xuICB9XG4gIHRoaXMucG9pbnRlckRvd25Gb2N1cyggZXZlbnQgKTtcbiAgLy8gc3RvcCBpZiBpdCB3YXMgbW92aW5nXG4gIHRoaXMudmVsb2NpdHkgPSAwO1xuICBjbGFzc2llLmFkZCggdGhpcy52aWV3cG9ydCwgJ2lzLXBvaW50ZXItZG93bicgKTtcbiAgLy8gYmluZCBtb3ZlIGFuZCBlbmQgZXZlbnRzXG4gIHRoaXMuX2JpbmRQb3N0U3RhcnRFdmVudHMoIGV2ZW50ICk7XG4gIHRoaXMuZGlzcGF0Y2hFdmVudCggJ3BvaW50ZXJEb3duJywgZXZlbnQsIFsgcG9pbnRlciBdICk7XG59O1xuXG52YXIgdG91Y2hTdGFydEV2ZW50cyA9IHtcbiAgdG91Y2hzdGFydDogdHJ1ZSxcbiAgTVNQb2ludGVyRG93bjogdHJ1ZVxufTtcblxudmFyIGZvY3VzTm9kZXMgPSB7XG4gIElOUFVUOiB0cnVlLFxuICBTRUxFQ1Q6IHRydWVcbn07XG5cbnByb3RvLnBvaW50ZXJEb3duRm9jdXMgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gIC8vIGZvY3VzIGVsZW1lbnQsIGlmIG5vdCB0b3VjaCwgYW5kIGl0cyBub3QgYW4gaW5wdXQgb3Igc2VsZWN0XG4gIGlmICggdGhpcy5vcHRpb25zLmFjY2Vzc2liaWxpdHkgJiYgIXRvdWNoU3RhcnRFdmVudHNbIGV2ZW50LnR5cGUgXSAmJlxuICAgICAgIWZvY3VzTm9kZXNbIGV2ZW50LnRhcmdldC5ub2RlTmFtZSBdICkge1xuICAgIHRoaXMuZWxlbWVudC5mb2N1cygpO1xuICB9XG59O1xuXG4vLyAtLS0tLSBtb3ZlIC0tLS0tIC8vXG5cbnByb3RvLnBvaW50ZXJNb3ZlID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyICkge1xuICB2YXIgbW92ZVZlY3RvciA9IHRoaXMuX2RyYWdQb2ludGVyTW92ZSggZXZlbnQsIHBvaW50ZXIgKTtcbiAgdGhpcy50b3VjaFZlcnRpY2FsU2Nyb2xsTW92ZSggZXZlbnQsIHBvaW50ZXIsIG1vdmVWZWN0b3IgKTtcbiAgdGhpcy5fZHJhZ01vdmUoIGV2ZW50LCBwb2ludGVyLCBtb3ZlVmVjdG9yICk7XG4gIHRoaXMuZGlzcGF0Y2hFdmVudCggJ3BvaW50ZXJNb3ZlJywgZXZlbnQsIFsgcG9pbnRlciwgbW92ZVZlY3RvciBdICk7XG59O1xuXG5wcm90by5oYXNEcmFnU3RhcnRlZCA9IGZ1bmN0aW9uKCBtb3ZlVmVjdG9yICkge1xuICByZXR1cm4gIXRoaXMuaXNUb3VjaFNjcm9sbGluZyAmJiBNYXRoLmFicyggbW92ZVZlY3Rvci54ICkgPiAzO1xufTtcblxuLy8gLS0tLS0gdXAgLS0tLS0gLy9cblxucHJvdG8ucG9pbnRlclVwID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyICkge1xuICBkZWxldGUgdGhpcy5pc1RvdWNoU2Nyb2xsaW5nO1xuICBjbGFzc2llLnJlbW92ZSggdGhpcy52aWV3cG9ydCwgJ2lzLXBvaW50ZXItZG93bicgKTtcbiAgdGhpcy5kaXNwYXRjaEV2ZW50KCAncG9pbnRlclVwJywgZXZlbnQsIFsgcG9pbnRlciBdICk7XG4gIHRoaXMuX2RyYWdQb2ludGVyVXAoIGV2ZW50LCBwb2ludGVyICk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB2ZXJ0aWNhbCBzY3JvbGwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxudmFyIHRvdWNoU2Nyb2xsRXZlbnRzID0ge1xuICAvLyBtb3ZlIGV2ZW50c1xuICAvLyBtb3VzZW1vdmU6IHRydWUsXG4gIHRvdWNobW92ZTogdHJ1ZSxcbiAgTVNQb2ludGVyTW92ZTogdHJ1ZVxufTtcblxuLy8gcG9zaXRpb24gb2YgcG9pbnRlciwgcmVsYXRpdmUgdG8gd2luZG93XG5mdW5jdGlvbiBnZXRQb2ludGVyV2luZG93WSggcG9pbnRlciApIHtcbiAgdmFyIHBvaW50ZXJQb2ludCA9IFVuaWRyYWdnZXIuZ2V0UG9pbnRlclBvaW50KCBwb2ludGVyICk7XG4gIHJldHVybiBwb2ludGVyUG9pbnQueSAtIHdpbmRvdy5wYWdlWU9mZnNldDtcbn1cblxucHJvdG8udG91Y2hWZXJ0aWNhbFNjcm9sbE1vdmUgPSBmdW5jdGlvbiggZXZlbnQsIHBvaW50ZXIsIG1vdmVWZWN0b3IgKSB7XG4gIC8vIGRvIG5vdCBzY3JvbGwgaWYgYWxyZWFkeSBkcmFnZ2luZywgaWYgZGlzYWJsZWRcbiAgdmFyIHRvdWNoVmVydGljYWxTY3JvbGwgPSB0aGlzLm9wdGlvbnMudG91Y2hWZXJ0aWNhbFNjcm9sbDtcbiAgLy8gaWYgdG91Y2hWZXJ0aWNhbFNjcm9sbCBpcyAnd2l0aERyYWcnLCBhbGxvdyBzY3JvbGxpbmcgYW5kIGRyYWdnaW5nXG4gIHZhciBjYW5Ob3RTY3JvbGwgPSB0b3VjaFZlcnRpY2FsU2Nyb2xsID09ICd3aXRoRHJhZycgPyAhdG91Y2hWZXJ0aWNhbFNjcm9sbCA6XG4gICAgdGhpcy5pc0RyYWdnaW5nIHx8ICF0b3VjaFZlcnRpY2FsU2Nyb2xsO1xuICBpZiAoIGNhbk5vdFNjcm9sbCB8fCAhdG91Y2hTY3JvbGxFdmVudHNbIGV2ZW50LnR5cGUgXSApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gZG9uJ3Qgc3RhcnQgdmVydGljYWwgc2Nyb2xsaW5nIHVudGlsIHBvaW50ZXIgaGFzIG1vdmVkIDEwIHBpeGVscyBpbiBhIGRpcmVjdGlvblxuICBpZiAoICF0aGlzLmlzVG91Y2hTY3JvbGxpbmcgJiYgTWF0aC5hYnMoIG1vdmVWZWN0b3IueSApID4gMTAgKSB7XG4gICAgLy8gc3RhcnQgdG91Y2ggdmVydGljYWwgc2Nyb2xsaW5nXG4gICAgLy8gc2Nyb2xsICYgcG9pbnRlclkgd2hlbiBzdGFydGVkXG4gICAgdGhpcy5zdGFydFNjcm9sbFkgPSB3aW5kb3cucGFnZVlPZmZzZXQ7XG4gICAgdGhpcy5wb2ludGVyV2luZG93U3RhcnRZID0gZ2V0UG9pbnRlcldpbmRvd1koIHBvaW50ZXIgKTtcbiAgICAvLyBzdGFydCBzY3JvbGwgYW5pbWF0aW9uXG4gICAgdGhpcy5pc1RvdWNoU2Nyb2xsaW5nID0gdHJ1ZTtcbiAgfVxufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZHJhZ2dpbmcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxucHJvdG8uZHJhZ1N0YXJ0ID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyICkge1xuICB0aGlzLmRyYWdTdGFydFBvc2l0aW9uID0gdGhpcy54O1xuICB0aGlzLnN0YXJ0QW5pbWF0aW9uKCk7XG4gIHRoaXMuZGlzcGF0Y2hFdmVudCggJ2RyYWdTdGFydCcsIGV2ZW50LCBbIHBvaW50ZXIgXSApO1xufTtcblxucHJvdG8uZHJhZ01vdmUgPSBmdW5jdGlvbiggZXZlbnQsIHBvaW50ZXIsIG1vdmVWZWN0b3IgKSB7XG4gIHByZXZlbnREZWZhdWx0RXZlbnQoIGV2ZW50ICk7XG5cbiAgdGhpcy5wcmV2aW91c0RyYWdYID0gdGhpcy54O1xuXG4gIHZhciBtb3ZlZFggPSBtb3ZlVmVjdG9yLng7XG4gIC8vIHJldmVyc2UgaWYgcmlnaHQtdG8tbGVmdFxuICB2YXIgZGlyZWN0aW9uID0gdGhpcy5vcHRpb25zLnJpZ2h0VG9MZWZ0ID8gLTEgOiAxO1xuICB0aGlzLnggPSB0aGlzLmRyYWdTdGFydFBvc2l0aW9uICsgbW92ZWRYICogZGlyZWN0aW9uO1xuXG4gIGlmICggIXRoaXMub3B0aW9ucy53cmFwQXJvdW5kICYmIHRoaXMuY2VsbHMubGVuZ3RoICkge1xuICAgIC8vIHNsb3cgZHJhZ1xuICAgIHZhciBvcmlnaW5Cb3VuZCA9IE1hdGgubWF4KCAtdGhpcy5jZWxsc1swXS50YXJnZXQsIHRoaXMuZHJhZ1N0YXJ0UG9zaXRpb24pO1xuICAgIHRoaXMueCA9IHRoaXMueCA+IG9yaWdpbkJvdW5kID8gKCB0aGlzLnggLSBvcmlnaW5Cb3VuZCApICogMC41ICsgb3JpZ2luQm91bmQgOiB0aGlzLng7XG4gICAgdmFyIGVuZEJvdW5kID0gTWF0aC5taW4oIC10aGlzLmdldExhc3RDZWxsKCkudGFyZ2V0LCB0aGlzLmRyYWdTdGFydFBvc2l0aW9uICk7XG4gICAgdGhpcy54ID0gdGhpcy54IDwgZW5kQm91bmQgPyAoIHRoaXMueCAtIGVuZEJvdW5kICkgKiAwLjUgKyBlbmRCb3VuZCA6IHRoaXMueDtcbiAgfVxuXG4gIHRoaXMucHJldmlvdXNEcmFnTW92ZVRpbWUgPSB0aGlzLmRyYWdNb3ZlVGltZTtcbiAgdGhpcy5kcmFnTW92ZVRpbWUgPSBuZXcgRGF0ZSgpO1xuICB0aGlzLmRpc3BhdGNoRXZlbnQoICdkcmFnTW92ZScsIGV2ZW50LCBbIHBvaW50ZXIsIG1vdmVWZWN0b3IgXSApO1xufTtcblxucHJvdG8uZHJhZ0VuZCA9IGZ1bmN0aW9uKCBldmVudCwgcG9pbnRlciApIHtcbiAgdGhpcy5kcmFnRW5kRmxpY2soKTtcbiAgaWYgKCB0aGlzLm9wdGlvbnMuZnJlZVNjcm9sbCApIHtcbiAgICB0aGlzLmlzRnJlZVNjcm9sbGluZyA9IHRydWU7XG4gIH1cbiAgLy8gc2V0IHNlbGVjdGVkSW5kZXggYmFzZWQgb24gd2hlcmUgZmxpY2sgd2lsbCBlbmQgdXBcbiAgdmFyIGluZGV4ID0gdGhpcy5kcmFnRW5kUmVzdGluZ1NlbGVjdCgpO1xuXG4gIGlmICggdGhpcy5vcHRpb25zLmZyZWVTY3JvbGwgJiYgIXRoaXMub3B0aW9ucy53cmFwQXJvdW5kICkge1xuICAgIC8vIGlmIGZyZWUtc2Nyb2xsICYgbm90IHdyYXAgYXJvdW5kXG4gICAgLy8gZG8gbm90IGZyZWUtc2Nyb2xsIGlmIGdvaW5nIG91dHNpZGUgb2YgYm91bmRpbmcgY2VsbHNcbiAgICAvLyBzbyBib3VuZGluZyBjZWxscyBjYW4gYXR0cmFjdCBzbGlkZXIsIGFuZCBrZWVwIGl0IGluIGJvdW5kc1xuICAgIHZhciByZXN0aW5nWCA9IHRoaXMuZ2V0UmVzdGluZ1Bvc2l0aW9uKCk7XG4gICAgdGhpcy5pc0ZyZWVTY3JvbGxpbmcgPSAtcmVzdGluZ1ggPiB0aGlzLmNlbGxzWzBdLnRhcmdldCAmJlxuICAgICAgLXJlc3RpbmdYIDwgdGhpcy5nZXRMYXN0Q2VsbCgpLnRhcmdldDtcbiAgfSBlbHNlIGlmICggIXRoaXMub3B0aW9ucy5mcmVlU2Nyb2xsICYmIGluZGV4ID09IHRoaXMuc2VsZWN0ZWRJbmRleCApIHtcbiAgICAvLyBib29zdCBzZWxlY3Rpb24gaWYgc2VsZWN0ZWQgaW5kZXggaGFzIG5vdCBjaGFuZ2VkXG4gICAgaW5kZXggKz0gdGhpcy5kcmFnRW5kQm9vc3RTZWxlY3QoKTtcbiAgfVxuICAvLyBhcHBseSBzZWxlY3Rpb25cbiAgLy8gVE9ETyByZWZhY3RvciB0aGlzLCBzZWxlY3RpbmcgaGVyZSBmZWVscyB3ZWlyZFxuICB0aGlzLnNlbGVjdCggaW5kZXggKTtcbiAgdGhpcy5kaXNwYXRjaEV2ZW50KCAnZHJhZ0VuZCcsIGV2ZW50LCBbIHBvaW50ZXIgXSApO1xufTtcblxuLy8gYXBwbHkgdmVsb2NpdHkgYWZ0ZXIgZHJhZ2dpbmdcbnByb3RvLmRyYWdFbmRGbGljayA9IGZ1bmN0aW9uKCkge1xuICBpZiAoICFpc0Zpbml0ZSggdGhpcy5wcmV2aW91c0RyYWdYICkgKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vIHNldCBzbGlkZXIgdmVsb2NpdHlcbiAgdmFyIHRpbWVEZWx0YSA9IHRoaXMuZHJhZ01vdmVUaW1lIC0gdGhpcy5wcmV2aW91c0RyYWdNb3ZlVGltZTtcbiAgLy8gcHJldmVudCBkaXZpZGUgYnkgMCwgaWYgZHJhZ01vdmUgJiBkcmFnRW5kIGhhcHBlbmVkIGF0IHNhbWUgdGltZVxuICBpZiAoIHRpbWVEZWx0YSApIHtcbiAgICAvLyA2MCBmcmFtZXMgcGVyIHNlY29uZCwgaWRlYWxseVxuICAgIC8vIFRPRE8sIHZlbG9jaXR5IHNob3VsZCBiZSBpbiBwaXhlbHMgcGVyIG1pbGxpc2Vjb25kXG4gICAgLy8gY3VycmVudGx5IGluIHBpeGVscyBwZXIgZnJhbWVcbiAgICB0aW1lRGVsdGEgLz0gMTAwMCAvIDYwO1xuICAgIHZhciB4RGVsdGEgPSB0aGlzLnggLSB0aGlzLnByZXZpb3VzRHJhZ1g7XG4gICAgdGhpcy52ZWxvY2l0eSA9IHhEZWx0YSAvIHRpbWVEZWx0YTtcbiAgfVxuICAvLyByZXNldFxuICBkZWxldGUgdGhpcy5wcmV2aW91c0RyYWdYO1xufTtcblxucHJvdG8uZHJhZ0VuZFJlc3RpbmdTZWxlY3QgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJlc3RpbmdYID0gdGhpcy5nZXRSZXN0aW5nUG9zaXRpb24oKTtcbiAgLy8gaG93IGZhciBhd2F5IGZyb20gc2VsZWN0ZWQgY2VsbFxuICB2YXIgZGlzdGFuY2UgPSBNYXRoLmFicyggdGhpcy5nZXRDZWxsRGlzdGFuY2UoIC1yZXN0aW5nWCwgdGhpcy5zZWxlY3RlZEluZGV4ICkgKTtcbiAgLy8gZ2V0IGNsb3NldCByZXN0aW5nIGdvaW5nIHVwIGFuZCBnb2luZyBkb3duXG4gIHZhciBwb3NpdGl2ZVJlc3RpbmcgPSB0aGlzLl9nZXRDbG9zZXN0UmVzdGluZyggcmVzdGluZ1gsIGRpc3RhbmNlLCAxICk7XG4gIHZhciBuZWdhdGl2ZVJlc3RpbmcgPSB0aGlzLl9nZXRDbG9zZXN0UmVzdGluZyggcmVzdGluZ1gsIGRpc3RhbmNlLCAtMSApO1xuICAvLyB1c2UgY2xvc2VyIHJlc3RpbmcgZm9yIHdyYXAtYXJvdW5kXG4gIHZhciBpbmRleCA9IHBvc2l0aXZlUmVzdGluZy5kaXN0YW5jZSA8IG5lZ2F0aXZlUmVzdGluZy5kaXN0YW5jZSA/XG4gICAgcG9zaXRpdmVSZXN0aW5nLmluZGV4IDogbmVnYXRpdmVSZXN0aW5nLmluZGV4O1xuICAvLyBmb3IgY29udGFpbiwgZm9yY2UgYm9vc3QgaWYgZGVsdGEgaXMgbm90IGdyZWF0ZXIgdGhhbiAxXG4gIGlmICggdGhpcy5vcHRpb25zLmNvbnRhaW4gJiYgIXRoaXMub3B0aW9ucy53cmFwQXJvdW5kICkge1xuICAgIGluZGV4ID0gTWF0aC5hYnMoIGluZGV4IC0gdGhpcy5zZWxlY3RlZEluZGV4ICkgPD0gMSA/IHRoaXMuc2VsZWN0ZWRJbmRleCA6IGluZGV4O1xuICB9XG4gIHJldHVybiBpbmRleDtcbn07XG5cbi8qKlxuICogZ2l2ZW4gcmVzdGluZyBYIGFuZCBkaXN0YW5jZSB0byBzZWxlY3RlZCBjZWxsXG4gKiBnZXQgdGhlIGRpc3RhbmNlIGFuZCBpbmRleCBvZiB0aGUgY2xvc2VzdCBjZWxsXG4gKiBAcGFyYW0ge051bWJlcn0gcmVzdGluZ1ggLSBlc3RpbWF0ZWQgcG9zdC1mbGljayByZXN0aW5nIHBvc2l0aW9uXG4gKiBAcGFyYW0ge051bWJlcn0gZGlzdGFuY2UgLSBkaXN0YW5jZSB0byBzZWxlY3RlZCBjZWxsXG4gKiBAcGFyYW0ge0ludGVnZXJ9IGluY3JlbWVudCAtICsxIG9yIC0xLCBnb2luZyB1cCBvciBkb3duXG4gKiBAcmV0dXJucyB7T2JqZWN0fSAtIHsgZGlzdGFuY2U6IHtOdW1iZXJ9LCBpbmRleDoge0ludGVnZXJ9IH1cbiAqL1xucHJvdG8uX2dldENsb3Nlc3RSZXN0aW5nID0gZnVuY3Rpb24oIHJlc3RpbmdYLCBkaXN0YW5jZSwgaW5jcmVtZW50ICkge1xuICB2YXIgaW5kZXggPSB0aGlzLnNlbGVjdGVkSW5kZXg7XG4gIHZhciBtaW5EaXN0YW5jZSA9IEluZmluaXR5O1xuICB2YXIgY29uZGl0aW9uID0gdGhpcy5vcHRpb25zLmNvbnRhaW4gJiYgIXRoaXMub3B0aW9ucy53cmFwQXJvdW5kID9cbiAgICAvLyBpZiBjb250YWluLCBrZWVwIGdvaW5nIGlmIGRpc3RhbmNlIGlzIGVxdWFsIHRvIG1pbkRpc3RhbmNlXG4gICAgZnVuY3Rpb24oIGQsIG1kICkgeyByZXR1cm4gZCA8PSBtZDsgfSA6IGZ1bmN0aW9uKCBkLCBtZCApIHsgcmV0dXJuIGQgPCBtZDsgfTtcbiAgd2hpbGUgKCBjb25kaXRpb24oIGRpc3RhbmNlLCBtaW5EaXN0YW5jZSApICkge1xuICAgIC8vIG1lYXN1cmUgZGlzdGFuY2UgdG8gbmV4dCBjZWxsXG4gICAgaW5kZXggKz0gaW5jcmVtZW50O1xuICAgIG1pbkRpc3RhbmNlID0gZGlzdGFuY2U7XG4gICAgZGlzdGFuY2UgPSB0aGlzLmdldENlbGxEaXN0YW5jZSggLXJlc3RpbmdYLCBpbmRleCApO1xuICAgIGlmICggZGlzdGFuY2UgPT09IG51bGwgKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgZGlzdGFuY2UgPSBNYXRoLmFicyggZGlzdGFuY2UgKTtcbiAgfVxuICByZXR1cm4ge1xuICAgIGRpc3RhbmNlOiBtaW5EaXN0YW5jZSxcbiAgICAvLyBzZWxlY3RlZCB3YXMgcHJldmlvdXMgaW5kZXhcbiAgICBpbmRleDogaW5kZXggLSBpbmNyZW1lbnRcbiAgfTtcbn07XG5cbi8qKlxuICogbWVhc3VyZSBkaXN0YW5jZSBiZXR3ZWVuIHggYW5kIGEgY2VsbCB0YXJnZXRcbiAqIEBwYXJhbSB7TnVtYmVyfSB4XG4gKiBAcGFyYW0ge0ludGVnZXJ9IGluZGV4IC0gY2VsbCBpbmRleFxuICovXG5wcm90by5nZXRDZWxsRGlzdGFuY2UgPSBmdW5jdGlvbiggeCwgaW5kZXggKSB7XG4gIHZhciBsZW4gPSB0aGlzLmNlbGxzLmxlbmd0aDtcbiAgLy8gd3JhcCBhcm91bmQgaWYgYXQgbGVhc3QgMiBjZWxsc1xuICB2YXIgaXNXcmFwQXJvdW5kID0gdGhpcy5vcHRpb25zLndyYXBBcm91bmQgJiYgbGVuID4gMTtcbiAgdmFyIGNlbGxJbmRleCA9IGlzV3JhcEFyb3VuZCA/IHV0aWxzLm1vZHVsbyggaW5kZXgsIGxlbiApIDogaW5kZXg7XG4gIHZhciBjZWxsID0gdGhpcy5jZWxsc1sgY2VsbEluZGV4IF07XG4gIGlmICggIWNlbGwgKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgLy8gYWRkIGRpc3RhbmNlIGZvciB3cmFwLWFyb3VuZCBjZWxsc1xuICB2YXIgd3JhcCA9IGlzV3JhcEFyb3VuZCA/IHRoaXMuc2xpZGVhYmxlV2lkdGggKiBNYXRoLmZsb29yKCBpbmRleCAvIGxlbiApIDogMDtcbiAgcmV0dXJuIHggLSAoIGNlbGwudGFyZ2V0ICsgd3JhcCApO1xufTtcblxucHJvdG8uZHJhZ0VuZEJvb3N0U2VsZWN0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBkaXN0YW5jZSA9IHRoaXMuZ2V0Q2VsbERpc3RhbmNlKCAtdGhpcy54LCB0aGlzLnNlbGVjdGVkSW5kZXggKTtcbiAgaWYgKCBkaXN0YW5jZSA+IDAgJiYgdGhpcy52ZWxvY2l0eSA8IC0xICkge1xuICAgIC8vIGlmIG1vdmluZyB0b3dhcmRzIHRoZSByaWdodCwgYW5kIHBvc2l0aXZlIHZlbG9jaXR5LCBhbmQgdGhlIG5leHQgYXR0cmFjdG9yXG4gICAgcmV0dXJuIDE7XG4gIH0gZWxzZSBpZiAoIGRpc3RhbmNlIDwgMCAmJiB0aGlzLnZlbG9jaXR5ID4gMSApIHtcbiAgICAvLyBpZiBtb3ZpbmcgdG93YXJkcyB0aGUgbGVmdCwgYW5kIG5lZ2F0aXZlIHZlbG9jaXR5LCBhbmQgcHJldmlvdXMgYXR0cmFjdG9yXG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuLy8gLS0tLS0gc3RhdGljQ2xpY2sgLS0tLS0gLy9cblxucHJvdG8uc3RhdGljQ2xpY2sgPSBmdW5jdGlvbiggZXZlbnQsIHBvaW50ZXIgKSB7XG4gIC8vIGdldCBjbGlja2VkQ2VsbCwgaWYgY2VsbCB3YXMgY2xpY2tlZFxuICB2YXIgY2xpY2tlZENlbGwgPSB0aGlzLmdldFBhcmVudENlbGwoIGV2ZW50LnRhcmdldCApO1xuICB2YXIgY2VsbEVsZW0gPSBjbGlja2VkQ2VsbCAmJiBjbGlja2VkQ2VsbC5lbGVtZW50O1xuICB2YXIgY2VsbEluZGV4ID0gY2xpY2tlZENlbGwgJiYgdXRpbHMuaW5kZXhPZiggdGhpcy5jZWxscywgY2xpY2tlZENlbGwgKTtcbiAgdGhpcy5kaXNwYXRjaEV2ZW50KCAnc3RhdGljQ2xpY2snLCBldmVudCwgWyBwb2ludGVyLCBjZWxsRWxlbSwgY2VsbEluZGV4IF0gKTtcbn07XG5cbi8vIC0tLS0tICAtLS0tLSAvL1xuXG51dGlscy5leHRlbmQoIEZsaWNraXR5LnByb3RvdHlwZSwgcHJvdG8gKTtcblxuLy8gLS0tLS0gIC0tLS0tIC8vXG5cbnJldHVybiBGbGlja2l0eTtcblxufSkpO1xuIiwiLyohXG4gKiBGbGlja2l0eSB2MS4wLjJcbiAqIFRvdWNoLCByZXNwb25zaXZlLCBmbGlja2FibGUgZ2FsbGVyaWVzXG4gKlxuICogTGljZW5zZWQgR1BMdjMgZm9yIG9wZW4gc291cmNlIHVzZVxuICogb3IgRmxpY2tpdHkgQ29tbWVyY2lhbCBMaWNlbnNlIGZvciBjb21tZXJjaWFsIHVzZVxuICpcbiAqIGh0dHA6Ly9mbGlja2l0eS5tZXRhZml6enkuY29cbiAqIENvcHlyaWdodCAyMDE1IE1ldGFmaXp6eVxuICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdywgZmFjdG9yeSApIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICBpZiAoIHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSggW1xuICAgICAgJ2NsYXNzaWUvY2xhc3NpZScsXG4gICAgICAnZXZlbnRFbWl0dGVyL0V2ZW50RW1pdHRlcicsXG4gICAgICAnZXZlbnRpZS9ldmVudGllJyxcbiAgICAgICdnZXQtc2l6ZS9nZXQtc2l6ZScsXG4gICAgICAnZml6enktdWktdXRpbHMvdXRpbHMnLFxuICAgICAgJy4vY2VsbCcsXG4gICAgICAnLi9hbmltYXRlJ1xuICAgIF0sIGZ1bmN0aW9uKCBjbGFzc2llLCBFdmVudEVtaXR0ZXIsIGV2ZW50aWUsIGdldFNpemUsIHV0aWxzLCBDZWxsLCBhbmltYXRlUHJvdG90eXBlICkge1xuICAgICAgcmV0dXJuIGZhY3RvcnkoIHdpbmRvdywgY2xhc3NpZSwgRXZlbnRFbWl0dGVyLCBldmVudGllLCBnZXRTaXplLCB1dGlscywgQ2VsbCwgYW5pbWF0ZVByb3RvdHlwZSApO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCB0eXBlb2YgZXhwb3J0cyA9PSAnb2JqZWN0JyApIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHJlcXVpcmUoJ2Rlc2FuZHJvLWNsYXNzaWUnKSxcbiAgICAgIHJlcXVpcmUoJ3dvbGZ5ODctZXZlbnRlbWl0dGVyJyksXG4gICAgICByZXF1aXJlKCdldmVudGllJyksXG4gICAgICByZXF1aXJlKCdnZXQtc2l6ZScpLFxuICAgICAgcmVxdWlyZSgnZml6enktdWktdXRpbHMnKSxcbiAgICAgIHJlcXVpcmUoJy4vY2VsbCcpLFxuICAgICAgcmVxdWlyZSgnLi9hbmltYXRlJylcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgdmFyIF9GbGlja2l0eSA9IHdpbmRvdy5GbGlja2l0eTtcblxuICAgIHdpbmRvdy5GbGlja2l0eSA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICB3aW5kb3cuY2xhc3NpZSxcbiAgICAgIHdpbmRvdy5FdmVudEVtaXR0ZXIsXG4gICAgICB3aW5kb3cuZXZlbnRpZSxcbiAgICAgIHdpbmRvdy5nZXRTaXplLFxuICAgICAgd2luZG93LmZpenp5VUlVdGlscyxcbiAgICAgIF9GbGlja2l0eS5DZWxsLFxuICAgICAgX0ZsaWNraXR5LmFuaW1hdGVQcm90b3R5cGVcbiAgICApO1xuICB9XG5cbn0oIHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSggd2luZG93LCBjbGFzc2llLCBFdmVudEVtaXR0ZXIsIGV2ZW50aWUsIGdldFNpemUsXG4gIHV0aWxzLCBDZWxsLCBhbmltYXRlUHJvdG90eXBlICkge1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIHZhcnNcbnZhciBqUXVlcnkgPSB3aW5kb3cualF1ZXJ5O1xudmFyIGdldENvbXB1dGVkU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZTtcbnZhciBjb25zb2xlID0gd2luZG93LmNvbnNvbGU7XG5cbmZ1bmN0aW9uIG1vdmVFbGVtZW50cyggZWxlbXMsIHRvRWxlbSApIHtcbiAgZWxlbXMgPSB1dGlscy5tYWtlQXJyYXkoIGVsZW1zICk7XG4gIHdoaWxlICggZWxlbXMubGVuZ3RoICkge1xuICAgIHRvRWxlbS5hcHBlbmRDaGlsZCggZWxlbXMuc2hpZnQoKSApO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEZsaWNraXR5IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbi8vIGdsb2JhbGx5IHVuaXF1ZSBpZGVudGlmaWVyc1xudmFyIEdVSUQgPSAwO1xuLy8gaW50ZXJuYWwgc3RvcmUgb2YgYWxsIEZsaWNraXR5IGludGFuY2VzXG52YXIgaW5zdGFuY2VzID0ge307XG5cbmZ1bmN0aW9uIEZsaWNraXR5KCBlbGVtZW50LCBvcHRpb25zICkge1xuICB2YXIgcXVlcnlFbGVtZW50ID0gdXRpbHMuZ2V0UXVlcnlFbGVtZW50KCBlbGVtZW50ICk7XG4gIGlmICggIXF1ZXJ5RWxlbWVudCApIHtcbiAgICBpZiAoIGNvbnNvbGUgKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCAnQmFkIGVsZW1lbnQgZm9yIEZsaWNraXR5OiAnICsgKCBxdWVyeUVsZW1lbnQgfHwgZWxlbWVudCApICk7XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLmVsZW1lbnQgPSBxdWVyeUVsZW1lbnQ7XG4gIC8vIGFkZCBqUXVlcnlcbiAgaWYgKCBqUXVlcnkgKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGpRdWVyeSggdGhpcy5lbGVtZW50ICk7XG4gIH1cbiAgLy8gb3B0aW9uc1xuICB0aGlzLm9wdGlvbnMgPSB1dGlscy5leHRlbmQoIHt9LCB0aGlzLmNvbnN0cnVjdG9yLmRlZmF1bHRzICk7XG4gIHRoaXMub3B0aW9uKCBvcHRpb25zICk7XG5cbiAgLy8ga2ljayB0aGluZ3Mgb2ZmXG4gIHRoaXMuX2NyZWF0ZSgpO1xufVxuXG5GbGlja2l0eS5kZWZhdWx0cyA9IHtcbiAgYWNjZXNzaWJpbGl0eTogdHJ1ZSxcbiAgY2VsbEFsaWduOiAnY2VudGVyJyxcbiAgLy8gY2VsbFNlbGVjdG9yOiB1bmRlZmluZWQsXG4gIC8vIGNvbnRhaW46IGZhbHNlLFxuICBmcmVlU2Nyb2xsRnJpY3Rpb246IDAuMDc1LCAvLyBmcmljdGlvbiB3aGVuIGZyZWUtc2Nyb2xsaW5nXG4gIGZyaWN0aW9uOiAwLjI4LCAvLyBmcmljdGlvbiB3aGVuIHNlbGVjdGluZ1xuICAvLyBpbml0aWFsSW5kZXg6IDAsXG4gIHBlcmNlbnRQb3NpdGlvbjogdHJ1ZSxcbiAgcmVzaXplOiB0cnVlLFxuICBzZWxlY3RlZEF0dHJhY3Rpb246IDAuMDI1LFxuICBzZXRHYWxsZXJ5U2l6ZTogdHJ1ZVxuICAvLyB3YXRjaENTUzogZmFsc2UsXG4gIC8vIHdyYXBBcm91bmQ6IGZhbHNlXG59O1xuXG4vLyBoYXNoIG9mIG1ldGhvZHMgdHJpZ2dlcmVkIG9uIF9jcmVhdGUoKVxuRmxpY2tpdHkuY3JlYXRlTWV0aG9kcyA9IFtdO1xuXG4vLyBpbmhlcml0IEV2ZW50RW1pdHRlclxudXRpbHMuZXh0ZW5kKCBGbGlja2l0eS5wcm90b3R5cGUsIEV2ZW50RW1pdHRlci5wcm90b3R5cGUgKTtcblxuRmxpY2tpdHkucHJvdG90eXBlLl9jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgLy8gYWRkIGlkIGZvciBGbGlja2l0eS5kYXRhXG4gIHZhciBpZCA9IHRoaXMuZ3VpZCA9ICsrR1VJRDtcbiAgdGhpcy5lbGVtZW50LmZsaWNraXR5R1VJRCA9IGlkOyAvLyBleHBhbmRvXG4gIGluc3RhbmNlc1sgaWQgXSA9IHRoaXM7IC8vIGFzc29jaWF0ZSB2aWEgaWRcbiAgLy8gaW5pdGlhbCBwcm9wZXJ0aWVzXG4gIHRoaXMuc2VsZWN0ZWRJbmRleCA9IHRoaXMub3B0aW9ucy5pbml0aWFsSW5kZXggfHwgMDtcbiAgLy8gaG93IG1hbnkgZnJhbWVzIHNsaWRlciBoYXMgYmVlbiBpbiBzYW1lIHBvc2l0aW9uXG4gIHRoaXMucmVzdGluZ0ZyYW1lcyA9IDA7XG4gIC8vIGluaXRpYWwgcGh5c2ljcyBwcm9wZXJ0aWVzXG4gIHRoaXMueCA9IDA7XG4gIHRoaXMudmVsb2NpdHkgPSAwO1xuICB0aGlzLmFjY2VsID0gMDtcbiAgdGhpcy5vcmlnaW5TaWRlID0gdGhpcy5vcHRpb25zLnJpZ2h0VG9MZWZ0ID8gJ3JpZ2h0JyA6ICdsZWZ0JztcbiAgLy8gY3JlYXRlIHZpZXdwb3J0ICYgc2xpZGVyXG4gIHRoaXMudmlld3BvcnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGhpcy52aWV3cG9ydC5jbGFzc05hbWUgPSAnZmxpY2tpdHktdmlld3BvcnQnO1xuICBGbGlja2l0eS5zZXRVbnNlbGVjdGFibGUoIHRoaXMudmlld3BvcnQgKTtcbiAgdGhpcy5fY3JlYXRlU2xpZGVyKCk7XG5cbiAgaWYgKCB0aGlzLm9wdGlvbnMucmVzaXplIHx8IHRoaXMub3B0aW9ucy53YXRjaENTUyApIHtcbiAgICBldmVudGllLmJpbmQoIHdpbmRvdywgJ3Jlc2l6ZScsIHRoaXMgKTtcbiAgICB0aGlzLmlzUmVzaXplQm91bmQgPSB0cnVlO1xuICB9XG5cbiAgZm9yICggdmFyIGk9MCwgbGVuID0gRmxpY2tpdHkuY3JlYXRlTWV0aG9kcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICB2YXIgbWV0aG9kID0gRmxpY2tpdHkuY3JlYXRlTWV0aG9kc1tpXTtcbiAgICB0aGlzWyBtZXRob2QgXSgpO1xuICB9XG5cbiAgaWYgKCB0aGlzLm9wdGlvbnMud2F0Y2hDU1MgKSB7XG4gICAgdGhpcy53YXRjaENTUygpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuYWN0aXZhdGUoKTtcbiAgfVxuXG59O1xuXG4vKipcbiAqIHNldCBvcHRpb25zXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0c1xuICovXG5GbGlja2l0eS5wcm90b3R5cGUub3B0aW9uID0gZnVuY3Rpb24oIG9wdHMgKSB7XG4gIHV0aWxzLmV4dGVuZCggdGhpcy5vcHRpb25zLCBvcHRzICk7XG59O1xuXG5GbGlja2l0eS5wcm90b3R5cGUuYWN0aXZhdGUgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCB0aGlzLmlzQWN0aXZlICkge1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLmlzQWN0aXZlID0gdHJ1ZTtcbiAgY2xhc3NpZS5hZGQoIHRoaXMuZWxlbWVudCwgJ2ZsaWNraXR5LWVuYWJsZWQnICk7XG4gIGlmICggdGhpcy5vcHRpb25zLnJpZ2h0VG9MZWZ0ICkge1xuICAgIGNsYXNzaWUuYWRkKCB0aGlzLmVsZW1lbnQsICdmbGlja2l0eS1ydGwnICk7XG4gIH1cblxuICAvLyBtb3ZlIGluaXRpYWwgY2VsbCBlbGVtZW50cyBzbyB0aGV5IGNhbiBiZSBsb2FkZWQgYXMgY2VsbHNcbiAgdmFyIGNlbGxFbGVtcyA9IHRoaXMuX2ZpbHRlckZpbmRDZWxsRWxlbWVudHMoIHRoaXMuZWxlbWVudC5jaGlsZHJlbiApO1xuICBtb3ZlRWxlbWVudHMoIGNlbGxFbGVtcywgdGhpcy5zbGlkZXIgKTtcbiAgdGhpcy52aWV3cG9ydC5hcHBlbmRDaGlsZCggdGhpcy5zbGlkZXIgKTtcbiAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKCB0aGlzLnZpZXdwb3J0ICk7XG5cbiAgdGhpcy5nZXRTaXplKCk7XG4gIC8vIGdldCBjZWxscyBmcm9tIGNoaWxkcmVuXG4gIHRoaXMucmVsb2FkQ2VsbHMoKTtcblxuICBpZiAoIHRoaXMub3B0aW9ucy5hY2Nlc3NpYmlsaXR5ICkge1xuICAgIC8vIGFsbG93IGVsZW1lbnQgdG8gZm9jdXNhYmxlXG4gICAgdGhpcy5lbGVtZW50LnRhYkluZGV4ID0gMDtcbiAgICAvLyBsaXN0ZW4gZm9yIGtleSBwcmVzc2VzXG4gICAgZXZlbnRpZS5iaW5kKCB0aGlzLmVsZW1lbnQsICdrZXlkb3duJywgdGhpcyApO1xuICB9XG5cbiAgdGhpcy5lbWl0KCdhY3RpdmF0ZScpO1xuXG4gIHRoaXMucG9zaXRpb25TbGlkZXJBdFNlbGVjdGVkKCk7XG4gIHRoaXMuc2VsZWN0KCB0aGlzLnNlbGVjdGVkSW5kZXggKTtcbn07XG5cbi8vIHNsaWRlciBwb3NpdGlvbnMgdGhlIGNlbGxzXG5GbGlja2l0eS5wcm90b3R5cGUuX2NyZWF0ZVNsaWRlciA9IGZ1bmN0aW9uKCkge1xuICAvLyBzbGlkZXIgZWxlbWVudCBkb2VzIGFsbCB0aGUgcG9zaXRpb25pbmdcbiAgdmFyIHNsaWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBzbGlkZXIuY2xhc3NOYW1lID0gJ2ZsaWNraXR5LXNsaWRlcic7XG4gIHNsaWRlci5zdHlsZVsgdGhpcy5vcmlnaW5TaWRlIF0gPSAwO1xuICB0aGlzLnNsaWRlciA9IHNsaWRlcjtcbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5fZmlsdGVyRmluZENlbGxFbGVtZW50cyA9IGZ1bmN0aW9uKCBlbGVtcyApIHtcbiAgcmV0dXJuIHV0aWxzLmZpbHRlckZpbmRFbGVtZW50cyggZWxlbXMsIHRoaXMub3B0aW9ucy5jZWxsU2VsZWN0b3IgKTtcbn07XG5cbi8vIGdvZXMgdGhyb3VnaCBhbGwgY2hpbGRyZW5cbkZsaWNraXR5LnByb3RvdHlwZS5yZWxvYWRDZWxscyA9IGZ1bmN0aW9uKCkge1xuICAvLyBjb2xsZWN0aW9uIG9mIGl0ZW0gZWxlbWVudHNcbiAgdGhpcy5jZWxscyA9IHRoaXMuX21ha2VDZWxscyggdGhpcy5zbGlkZXIuY2hpbGRyZW4gKTtcbiAgdGhpcy5wb3NpdGlvbkNlbGxzKCk7XG4gIHRoaXMuX2dldFdyYXBTaGlmdENlbGxzKCk7XG4gIHRoaXMuc2V0R2FsbGVyeVNpemUoKTtcbn07XG5cbi8qKlxuICogdHVybiBlbGVtZW50cyBpbnRvIEZsaWNraXR5LkNlbGxzXG4gKiBAcGFyYW0ge0FycmF5IG9yIE5vZGVMaXN0IG9yIEhUTUxFbGVtZW50fSBlbGVtc1xuICogQHJldHVybnMge0FycmF5fSBpdGVtcyAtIGNvbGxlY3Rpb24gb2YgbmV3IEZsaWNraXR5IENlbGxzXG4gKi9cbkZsaWNraXR5LnByb3RvdHlwZS5fbWFrZUNlbGxzID0gZnVuY3Rpb24oIGVsZW1zICkge1xuICB2YXIgY2VsbEVsZW1zID0gdGhpcy5fZmlsdGVyRmluZENlbGxFbGVtZW50cyggZWxlbXMgKTtcblxuICAvLyBjcmVhdGUgbmV3IEZsaWNraXR5IGZvciBjb2xsZWN0aW9uXG4gIHZhciBjZWxscyA9IFtdO1xuICBmb3IgKCB2YXIgaT0wLCBsZW4gPSBjZWxsRWxlbXMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgdmFyIGVsZW0gPSBjZWxsRWxlbXNbaV07XG4gICAgdmFyIGNlbGwgPSBuZXcgQ2VsbCggZWxlbSwgdGhpcyApO1xuICAgIGNlbGxzLnB1c2goIGNlbGwgKTtcbiAgfVxuXG4gIHJldHVybiBjZWxscztcbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5nZXRMYXN0Q2VsbCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5jZWxsc1sgdGhpcy5jZWxscy5sZW5ndGggLSAxIF07XG59O1xuXG4vLyBwb3NpdGlvbnMgYWxsIGNlbGxzXG5GbGlja2l0eS5wcm90b3R5cGUucG9zaXRpb25DZWxscyA9IGZ1bmN0aW9uKCkge1xuICAvLyBzaXplIGFsbCBjZWxsc1xuICB0aGlzLl9zaXplQ2VsbHMoIHRoaXMuY2VsbHMgKTtcbiAgLy8gcG9zaXRpb24gYWxsIGNlbGxzXG4gIHRoaXMuX3Bvc2l0aW9uQ2VsbHMoIDAgKTtcbn07XG5cbi8qKlxuICogcG9zaXRpb24gY2VydGFpbiBjZWxsc1xuICogQHBhcmFtIHtJbnRlZ2VyfSBpbmRleCAtIHdoaWNoIGNlbGwgdG8gc3RhcnQgd2l0aFxuICovXG5GbGlja2l0eS5wcm90b3R5cGUuX3Bvc2l0aW9uQ2VsbHMgPSBmdW5jdGlvbiggaW5kZXggKSB7XG4gIC8vIGFsc28gbWVhc3VyZSBtYXhDZWxsSGVpZ2h0XG4gIC8vIHN0YXJ0IDAgaWYgcG9zaXRpb25pbmcgYWxsIGNlbGxzXG4gIHRoaXMubWF4Q2VsbEhlaWdodCA9IGluZGV4ID8gdGhpcy5tYXhDZWxsSGVpZ2h0IHx8IDAgOiAwO1xuICB2YXIgY2VsbFggPSAwO1xuICAvLyBnZXQgY2VsbFhcbiAgaWYgKCBpbmRleCA+IDAgKSB7XG4gICAgdmFyIHN0YXJ0Q2VsbCA9IHRoaXMuY2VsbHNbIGluZGV4IC0gMSBdO1xuICAgIGNlbGxYID0gc3RhcnRDZWxsLnggKyBzdGFydENlbGwuc2l6ZS5vdXRlcldpZHRoO1xuICB9XG4gIHZhciBjZWxsO1xuICBmb3IgKCB2YXIgbGVuID0gdGhpcy5jZWxscy5sZW5ndGgsIGk9aW5kZXg7IGkgPCBsZW47IGkrKyApIHtcbiAgICBjZWxsID0gdGhpcy5jZWxsc1tpXTtcbiAgICBjZWxsLnNldFBvc2l0aW9uKCBjZWxsWCApO1xuICAgIGNlbGxYICs9IGNlbGwuc2l6ZS5vdXRlcldpZHRoO1xuICAgIHRoaXMubWF4Q2VsbEhlaWdodCA9IE1hdGgubWF4KCBjZWxsLnNpemUub3V0ZXJIZWlnaHQsIHRoaXMubWF4Q2VsbEhlaWdodCApO1xuICB9XG4gIC8vIGtlZXAgdHJhY2sgb2YgY2VsbFggZm9yIHdyYXAtYXJvdW5kXG4gIHRoaXMuc2xpZGVhYmxlV2lkdGggPSBjZWxsWDtcbiAgLy8gY29udGFpbiBjZWxsIHRhcmdldFxuICB0aGlzLl9jb250YWluQ2VsbHMoKTtcbn07XG5cbi8qKlxuICogY2VsbC5nZXRTaXplKCkgb24gbXVsdGlwbGUgY2VsbHNcbiAqIEBwYXJhbSB7QXJyYXl9IGNlbGxzXG4gKi9cbkZsaWNraXR5LnByb3RvdHlwZS5fc2l6ZUNlbGxzID0gZnVuY3Rpb24oIGNlbGxzICkge1xuICBmb3IgKCB2YXIgaT0wLCBsZW4gPSBjZWxscy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICB2YXIgY2VsbCA9IGNlbGxzW2ldO1xuICAgIGNlbGwuZ2V0U2l6ZSgpO1xuICB9XG59O1xuXG4vLyBhbGlhcyBfaW5pdCBmb3IgalF1ZXJ5IHBsdWdpbiAuZmxpY2tpdHkoKVxuRmxpY2tpdHkucHJvdG90eXBlLl9pbml0ID1cbkZsaWNraXR5LnByb3RvdHlwZS5yZXBvc2l0aW9uID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucG9zaXRpb25DZWxscygpO1xuICB0aGlzLnBvc2l0aW9uU2xpZGVyQXRTZWxlY3RlZCgpO1xufTtcblxuRmxpY2tpdHkucHJvdG90eXBlLmdldFNpemUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5zaXplID0gZ2V0U2l6ZSggdGhpcy5lbGVtZW50ICk7XG4gIHRoaXMuc2V0Q2VsbEFsaWduKCk7XG4gIHRoaXMuY3Vyc29yUG9zaXRpb24gPSB0aGlzLnNpemUuaW5uZXJXaWR0aCAqIHRoaXMuY2VsbEFsaWduO1xufTtcblxudmFyIGNlbGxBbGlnblNob3J0aGFuZHMgPSB7XG4gIC8vIGNlbGwgYWxpZ24sIHRoZW4gYmFzZWQgb24gb3JpZ2luIHNpZGVcbiAgY2VudGVyOiB7XG4gICAgbGVmdDogMC41LFxuICAgIHJpZ2h0OiAwLjVcbiAgfSxcbiAgbGVmdDoge1xuICAgIGxlZnQ6IDAsXG4gICAgcmlnaHQ6IDFcbiAgfSxcbiAgcmlnaHQ6IHtcbiAgICByaWdodDogMCxcbiAgICBsZWZ0OiAxXG4gIH1cbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5zZXRDZWxsQWxpZ24gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHNob3J0aGFuZCA9IGNlbGxBbGlnblNob3J0aGFuZHNbIHRoaXMub3B0aW9ucy5jZWxsQWxpZ24gXTtcbiAgdGhpcy5jZWxsQWxpZ24gPSBzaG9ydGhhbmQgPyBzaG9ydGhhbmRbIHRoaXMub3JpZ2luU2lkZSBdIDogdGhpcy5vcHRpb25zLmNlbGxBbGlnbjtcbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5zZXRHYWxsZXJ5U2l6ZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIHRoaXMub3B0aW9ucy5zZXRHYWxsZXJ5U2l6ZSApIHtcbiAgICB0aGlzLnZpZXdwb3J0LnN0eWxlLmhlaWdodCA9IHRoaXMubWF4Q2VsbEhlaWdodCArICdweCc7XG4gIH1cbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5fZ2V0V3JhcFNoaWZ0Q2VsbHMgPSBmdW5jdGlvbigpIHtcbiAgLy8gb25seSBmb3Igd3JhcC1hcm91bmRcbiAgaWYgKCAhdGhpcy5vcHRpb25zLndyYXBBcm91bmQgKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vIHVuc2hpZnQgcHJldmlvdXMgY2VsbHNcbiAgdGhpcy5fdW5zaGlmdENlbGxzKCB0aGlzLmJlZm9yZVNoaWZ0Q2VsbHMgKTtcbiAgdGhpcy5fdW5zaGlmdENlbGxzKCB0aGlzLmFmdGVyU2hpZnRDZWxscyApO1xuICAvLyBnZXQgYmVmb3JlIGNlbGxzXG4gIC8vIGluaXRpYWwgZ2FwXG4gIHZhciBnYXBYID0gdGhpcy5jdXJzb3JQb3NpdGlvbjtcbiAgdmFyIGNlbGxJbmRleCA9IHRoaXMuY2VsbHMubGVuZ3RoIC0gMTtcbiAgdGhpcy5iZWZvcmVTaGlmdENlbGxzID0gdGhpcy5fZ2V0R2FwQ2VsbHMoIGdhcFgsIGNlbGxJbmRleCwgLTEgKTtcbiAgLy8gZ2V0IGFmdGVyIGNlbGxzXG4gIC8vIGVuZGluZyBnYXAgYmV0d2VlbiBsYXN0IGNlbGwgYW5kIGVuZCBvZiBnYWxsZXJ5IHZpZXdwb3J0XG4gIGdhcFggPSB0aGlzLnNpemUuaW5uZXJXaWR0aCAtIHRoaXMuY3Vyc29yUG9zaXRpb247XG4gIC8vIHN0YXJ0IGNsb25pbmcgYXQgZmlyc3QgY2VsbCwgd29ya2luZyBmb3J3YXJkc1xuICB0aGlzLmFmdGVyU2hpZnRDZWxscyA9IHRoaXMuX2dldEdhcENlbGxzKCBnYXBYLCAwLCAxICk7XG59O1xuXG5GbGlja2l0eS5wcm90b3R5cGUuX2dldEdhcENlbGxzID0gZnVuY3Rpb24oIGdhcFgsIGNlbGxJbmRleCwgaW5jcmVtZW50ICkge1xuICAvLyBrZWVwIGFkZGluZyBjZWxscyB1bnRpbCB0aGUgY292ZXIgdGhlIGluaXRpYWwgZ2FwXG4gIHZhciBjZWxscyA9IFtdO1xuICB3aGlsZSAoIGdhcFggPiAwICkge1xuICAgIHZhciBjZWxsID0gdGhpcy5jZWxsc1sgY2VsbEluZGV4IF07XG4gICAgaWYgKCAhY2VsbCApIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjZWxscy5wdXNoKCBjZWxsICk7XG4gICAgY2VsbEluZGV4ICs9IGluY3JlbWVudDtcbiAgICBnYXBYIC09IGNlbGwuc2l6ZS5vdXRlcldpZHRoO1xuICB9XG4gIHJldHVybiBjZWxscztcbn07XG5cbi8vIC0tLS0tIGNvbnRhaW4gLS0tLS0gLy9cblxuLy8gY29udGFpbiBjZWxsIHRhcmdldHMgc28gbm8gZXhjZXNzIHNsaWRpbmdcbkZsaWNraXR5LnByb3RvdHlwZS5fY29udGFpbkNlbGxzID0gZnVuY3Rpb24oKSB7XG4gIGlmICggIXRoaXMub3B0aW9ucy5jb250YWluIHx8IHRoaXMub3B0aW9ucy53cmFwQXJvdW5kIHx8ICF0aGlzLmNlbGxzLmxlbmd0aCApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIHN0YXJ0TWFyZ2luID0gdGhpcy5vcHRpb25zLnJpZ2h0VG9MZWZ0ID8gJ21hcmdpblJpZ2h0JyA6ICdtYXJnaW5MZWZ0JztcbiAgdmFyIGVuZE1hcmdpbiA9IHRoaXMub3B0aW9ucy5yaWdodFRvTGVmdCA/ICdtYXJnaW5MZWZ0JyA6ICdtYXJnaW5SaWdodCc7XG4gIHZhciBmaXJzdENlbGxTdGFydE1hcmdpbiA9IHRoaXMuY2VsbHNbMF0uc2l6ZVsgc3RhcnRNYXJnaW4gXTtcbiAgdmFyIGxhc3RDZWxsID0gdGhpcy5nZXRMYXN0Q2VsbCgpO1xuICB2YXIgY29udGVudFdpZHRoID0gdGhpcy5zbGlkZWFibGVXaWR0aCAtIGxhc3RDZWxsLnNpemVbIGVuZE1hcmdpbiBdO1xuICB2YXIgZW5kTGltaXQgPSBjb250ZW50V2lkdGggLSB0aGlzLnNpemUuaW5uZXJXaWR0aCAqICggMSAtIHRoaXMuY2VsbEFsaWduICk7XG4gIC8vIGNvbnRlbnQgaXMgbGVzcyB0aGFuIGdhbGxlcnkgc2l6ZVxuICB2YXIgaXNDb250ZW50U21hbGxlciA9IGNvbnRlbnRXaWR0aCA8IHRoaXMuc2l6ZS5pbm5lcldpZHRoO1xuICAvLyBjb250YWluIGVhY2ggY2VsbCB0YXJnZXRcbiAgZm9yICggdmFyIGk9MCwgbGVuID0gdGhpcy5jZWxscy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICB2YXIgY2VsbCA9IHRoaXMuY2VsbHNbaV07XG4gICAgLy8gcmVzZXQgZGVmYXVsdCB0YXJnZXRcbiAgICBjZWxsLnNldERlZmF1bHRUYXJnZXQoKTtcbiAgICBpZiAoIGlzQ29udGVudFNtYWxsZXIgKSB7XG4gICAgICAvLyBhbGwgY2VsbHMgZml0IGluc2lkZSBnYWxsZXJ5XG4gICAgICBjZWxsLnRhcmdldCA9IGNvbnRlbnRXaWR0aCAqIHRoaXMuY2VsbEFsaWduO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBjb250YWluIHRvIGJvdW5kc1xuICAgICAgY2VsbC50YXJnZXQgPSBNYXRoLm1heCggY2VsbC50YXJnZXQsIHRoaXMuY3Vyc29yUG9zaXRpb24gKyBmaXJzdENlbGxTdGFydE1hcmdpbiApO1xuICAgICAgY2VsbC50YXJnZXQgPSBNYXRoLm1pbiggY2VsbC50YXJnZXQsIGVuZExpbWl0ICk7XG4gICAgfVxuICB9XG59O1xuXG4vLyAtLS0tLSAgLS0tLS0gLy9cblxuLyoqXG4gKiBlbWl0cyBldmVudHMgdmlhIGV2ZW50RW1pdHRlciBhbmQgalF1ZXJ5IGV2ZW50c1xuICogQHBhcmFtIHtTdHJpbmd9IHR5cGUgLSBuYW1lIG9mIGV2ZW50XG4gKiBAcGFyYW0ge0V2ZW50fSBldmVudCAtIG9yaWdpbmFsIGV2ZW50XG4gKiBAcGFyYW0ge0FycmF5fSBhcmdzIC0gZXh0cmEgYXJndW1lbnRzXG4gKi9cbkZsaWNraXR5LnByb3RvdHlwZS5kaXNwYXRjaEV2ZW50ID0gZnVuY3Rpb24oIHR5cGUsIGV2ZW50LCBhcmdzICkge1xuICB2YXIgZW1pdEFyZ3MgPSBbIGV2ZW50IF0uY29uY2F0KCBhcmdzICk7XG4gIHRoaXMuZW1pdEV2ZW50KCB0eXBlLCBlbWl0QXJncyApO1xuXG4gIGlmICggalF1ZXJ5ICYmIHRoaXMuJGVsZW1lbnQgKSB7XG4gICAgaWYgKCBldmVudCApIHtcbiAgICAgIC8vIGNyZWF0ZSBqUXVlcnkgZXZlbnRcbiAgICAgIHZhciAkZXZlbnQgPSBqUXVlcnkuRXZlbnQoIGV2ZW50ICk7XG4gICAgICAkZXZlbnQudHlwZSA9IHR5cGU7XG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoICRldmVudCwgYXJncyApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBqdXN0IHRyaWdnZXIgd2l0aCB0eXBlIGlmIG5vIGV2ZW50IGF2YWlsYWJsZVxuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCB0eXBlLCBhcmdzICk7XG4gICAgfVxuICB9XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBzZWxlY3QgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuLyoqXG4gKiBAcGFyYW0ge0ludGVnZXJ9IGluZGV4IC0gaW5kZXggb2YgdGhlIGNlbGxcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNXcmFwIC0gd2lsbCB3cmFwLWFyb3VuZCB0byBsYXN0L2ZpcnN0IGlmIGF0IHRoZSBlbmRcbiAqL1xuRmxpY2tpdHkucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uKCBpbmRleCwgaXNXcmFwICkge1xuICBpZiAoICF0aGlzLmlzQWN0aXZlICkge1xuICAgIHJldHVybjtcbiAgfVxuICAvLyB3cmFwIHBvc2l0aW9uIHNvIHNsaWRlciBpcyB3aXRoaW4gbm9ybWFsIGFyZWFcbiAgdmFyIGxlbiA9IHRoaXMuY2VsbHMubGVuZ3RoO1xuICBpZiAoIHRoaXMub3B0aW9ucy53cmFwQXJvdW5kICYmIGxlbiA+IDEgKSB7XG4gICAgaWYgKCBpbmRleCA8IDAgKSB7XG4gICAgICB0aGlzLnggLT0gdGhpcy5zbGlkZWFibGVXaWR0aDtcbiAgICB9IGVsc2UgaWYgKCBpbmRleCA+PSBsZW4gKSB7XG4gICAgICB0aGlzLnggKz0gdGhpcy5zbGlkZWFibGVXaWR0aDtcbiAgICB9XG4gIH1cblxuICBpZiAoIHRoaXMub3B0aW9ucy53cmFwQXJvdW5kIHx8IGlzV3JhcCApIHtcbiAgICBpbmRleCA9IHV0aWxzLm1vZHVsbyggaW5kZXgsIGxlbiApO1xuICB9XG5cbiAgaWYgKCB0aGlzLmNlbGxzWyBpbmRleCBdICkge1xuICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IGluZGV4O1xuICAgIHRoaXMuc2V0U2VsZWN0ZWRDZWxsKCk7XG4gICAgdGhpcy5zdGFydEFuaW1hdGlvbigpO1xuICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnY2VsbFNlbGVjdCcpO1xuICB9XG59O1xuXG5GbGlja2l0eS5wcm90b3R5cGUucHJldmlvdXMgPSBmdW5jdGlvbiggaXNXcmFwICkge1xuICB0aGlzLnNlbGVjdCggdGhpcy5zZWxlY3RlZEluZGV4IC0gMSwgaXNXcmFwICk7XG59O1xuXG5GbGlja2l0eS5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uKCBpc1dyYXAgKSB7XG4gIHRoaXMuc2VsZWN0KCB0aGlzLnNlbGVjdGVkSW5kZXggKyAxLCBpc1dyYXAgKTtcbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5zZXRTZWxlY3RlZENlbGwgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fcmVtb3ZlU2VsZWN0ZWRDZWxsQ2xhc3MoKTtcbiAgdGhpcy5zZWxlY3RlZENlbGwgPSB0aGlzLmNlbGxzWyB0aGlzLnNlbGVjdGVkSW5kZXggXTtcbiAgdGhpcy5zZWxlY3RlZEVsZW1lbnQgPSB0aGlzLnNlbGVjdGVkQ2VsbC5lbGVtZW50O1xuICBjbGFzc2llLmFkZCggdGhpcy5zZWxlY3RlZEVsZW1lbnQsICdpcy1zZWxlY3RlZCcgKTtcbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5fcmVtb3ZlU2VsZWN0ZWRDZWxsQ2xhc3MgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCB0aGlzLnNlbGVjdGVkQ2VsbCApIHtcbiAgICBjbGFzc2llLnJlbW92ZSggdGhpcy5zZWxlY3RlZENlbGwuZWxlbWVudCwgJ2lzLXNlbGVjdGVkJyApO1xuICB9XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBnZXQgY2VsbHMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuLyoqXG4gKiBnZXQgRmxpY2tpdHkuQ2VsbCwgZ2l2ZW4gYW4gRWxlbWVudFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtXG4gKiBAcmV0dXJucyB7RmxpY2tpdHkuQ2VsbH0gaXRlbVxuICovXG5GbGlja2l0eS5wcm90b3R5cGUuZ2V0Q2VsbCA9IGZ1bmN0aW9uKCBlbGVtICkge1xuICAvLyBsb29wIHRocm91Z2ggY2VsbHMgdG8gZ2V0IHRoZSBvbmUgdGhhdCBtYXRjaGVzXG4gIGZvciAoIHZhciBpPTAsIGxlbiA9IHRoaXMuY2VsbHMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgdmFyIGNlbGwgPSB0aGlzLmNlbGxzW2ldO1xuICAgIGlmICggY2VsbC5lbGVtZW50ID09IGVsZW0gKSB7XG4gICAgICByZXR1cm4gY2VsbDtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogZ2V0IGNvbGxlY3Rpb24gb2YgRmxpY2tpdHkuQ2VsbHMsIGdpdmVuIEVsZW1lbnRzXG4gKiBAcGFyYW0ge0VsZW1lbnQsIEFycmF5LCBOb2RlTGlzdH0gZWxlbXNcbiAqIEByZXR1cm5zIHtBcnJheX0gY2VsbHMgLSBGbGlja2l0eS5DZWxsc1xuICovXG5GbGlja2l0eS5wcm90b3R5cGUuZ2V0Q2VsbHMgPSBmdW5jdGlvbiggZWxlbXMgKSB7XG4gIGVsZW1zID0gdXRpbHMubWFrZUFycmF5KCBlbGVtcyApO1xuICB2YXIgY2VsbHMgPSBbXTtcbiAgZm9yICggdmFyIGk9MCwgbGVuID0gZWxlbXMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgdmFyIGVsZW0gPSBlbGVtc1tpXTtcbiAgICB2YXIgY2VsbCA9IHRoaXMuZ2V0Q2VsbCggZWxlbSApO1xuICAgIGlmICggY2VsbCApIHtcbiAgICAgIGNlbGxzLnB1c2goIGNlbGwgKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNlbGxzO1xufTtcblxuLyoqXG4gKiBnZXQgY2VsbCBlbGVtZW50c1xuICogQHJldHVybnMge0FycmF5fSBjZWxsRWxlbXNcbiAqL1xuRmxpY2tpdHkucHJvdG90eXBlLmdldENlbGxFbGVtZW50cyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY2VsbEVsZW1zID0gW107XG4gIGZvciAoIHZhciBpPTAsIGxlbiA9IHRoaXMuY2VsbHMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgY2VsbEVsZW1zLnB1c2goIHRoaXMuY2VsbHNbaV0uZWxlbWVudCApO1xuICB9XG4gIHJldHVybiBjZWxsRWxlbXM7XG59O1xuXG4vKipcbiAqIGdldCBwYXJlbnQgY2VsbCBmcm9tIGFuIGVsZW1lbnRcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbVxuICogQHJldHVybnMge0ZsaWNraXQuQ2VsbH0gY2VsbFxuICovXG5GbGlja2l0eS5wcm90b3R5cGUuZ2V0UGFyZW50Q2VsbCA9IGZ1bmN0aW9uKCBlbGVtICkge1xuICAvLyBmaXJzdCBjaGVjayBpZiBlbGVtIGlzIGNlbGxcbiAgdmFyIGNlbGwgPSB0aGlzLmdldENlbGwoIGVsZW0gKTtcbiAgaWYgKCBjZWxsICkge1xuICAgIHJldHVybiBjZWxsO1xuICB9XG4gIC8vIHRyeSB0byBnZXQgcGFyZW50IGNlbGwgZWxlbVxuICBlbGVtID0gdXRpbHMuZ2V0UGFyZW50KCBlbGVtLCAnLmZsaWNraXR5LXNsaWRlciA+IConICk7XG4gIHJldHVybiB0aGlzLmdldENlbGwoIGVsZW0gKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGV2ZW50cyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5GbGlja2l0eS5wcm90b3R5cGUudWlDaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5lbWl0KCd1aUNoYW5nZScpO1xufTtcblxuRmxpY2tpdHkucHJvdG90eXBlLmNoaWxkVUlQb2ludGVyRG93biA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgdGhpcy5lbWl0RXZlbnQoICdjaGlsZFVJUG9pbnRlckRvd24nLCBbIGV2ZW50IF0gKTtcbn07XG5cbi8vIC0tLS0tIHJlc2l6ZSAtLS0tLSAvL1xuXG5GbGlja2l0eS5wcm90b3R5cGUub25yZXNpemUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy53YXRjaENTUygpO1xuICB0aGlzLnJlc2l6ZSgpO1xufTtcblxudXRpbHMuZGVib3VuY2VNZXRob2QoIEZsaWNraXR5LCAnb25yZXNpemUnLCAxNTAgKTtcblxuRmxpY2tpdHkucHJvdG90eXBlLnJlc2l6ZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAoICF0aGlzLmlzQWN0aXZlICkge1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLmdldFNpemUoKTtcbiAgLy8gd3JhcCB2YWx1ZXNcbiAgaWYgKCB0aGlzLm9wdGlvbnMud3JhcEFyb3VuZCApIHtcbiAgICB0aGlzLnggPSB1dGlscy5tb2R1bG8oIHRoaXMueCwgdGhpcy5zbGlkZWFibGVXaWR0aCApO1xuICB9XG4gIHRoaXMucG9zaXRpb25DZWxscygpO1xuICB0aGlzLl9nZXRXcmFwU2hpZnRDZWxscygpO1xuICB0aGlzLnNldEdhbGxlcnlTaXplKCk7XG4gIHRoaXMucG9zaXRpb25TbGlkZXJBdFNlbGVjdGVkKCk7XG59O1xuXG52YXIgc3VwcG9ydHNDb25kaXRpb25hbENTUyA9IEZsaWNraXR5LnN1cHBvcnRzQ29uZGl0aW9uYWxDU1MgPSAoIGZ1bmN0aW9uKCkge1xuICB2YXIgc3VwcG9ydHM7XG4gIHJldHVybiBmdW5jdGlvbiBjaGVja1N1cHBvcnQoKSB7XG4gICAgaWYgKCBzdXBwb3J0cyAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgcmV0dXJuIHN1cHBvcnRzO1xuICAgIH1cbiAgICBpZiAoICFnZXRDb21wdXRlZFN0eWxlICkge1xuICAgICAgc3VwcG9ydHMgPSBmYWxzZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gc3R5bGUgYm9keSdzIDphZnRlciBhbmQgY2hlY2sgdGhhdFxuICAgIHZhciBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgdmFyIGNzc1RleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnYm9keTphZnRlciB7IGNvbnRlbnQ6IFwiZm9vXCI7IGRpc3BsYXk6IG5vbmU7IH0nKTtcbiAgICBzdHlsZS5hcHBlbmRDaGlsZCggY3NzVGV4dCApO1xuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoIHN0eWxlICk7XG4gICAgdmFyIGFmdGVyQ29udGVudCA9IGdldENvbXB1dGVkU3R5bGUoIGRvY3VtZW50LmJvZHksICc6YWZ0ZXInICkuY29udGVudDtcbiAgICAvLyBjaGVjayBpZiBhYmxlIHRvIGdldCA6YWZ0ZXIgY29udGVudFxuICAgIHN1cHBvcnRzID0gYWZ0ZXJDb250ZW50LmluZGV4T2YoJ2ZvbycpICE9IC0xO1xuICAgIGRvY3VtZW50LmhlYWQucmVtb3ZlQ2hpbGQoIHN0eWxlICk7XG4gICAgcmV0dXJuIHN1cHBvcnRzO1xuICB9O1xufSkoKTtcblxuLy8gd2F0Y2hlcyB0aGUgOmFmdGVyIHByb3BlcnR5LCBhY3RpdmF0ZXMvZGVhY3RpdmF0ZXNcbkZsaWNraXR5LnByb3RvdHlwZS53YXRjaENTUyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgd2F0Y2hPcHRpb24gPSB0aGlzLm9wdGlvbnMud2F0Y2hDU1M7XG4gIGlmICggIXdhdGNoT3B0aW9uICkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgc3VwcG9ydHMgPSBzdXBwb3J0c0NvbmRpdGlvbmFsQ1NTKCk7XG4gIGlmICggIXN1cHBvcnRzICkge1xuICAgIC8vIGFjdGl2YXRlIGlmIHdhdGNoIG9wdGlvbiBpcyBmYWxsYmFja09uXG4gICAgdmFyIG1ldGhvZCA9IHdhdGNoT3B0aW9uID09ICdmYWxsYmFja09uJyA/ICdhY3RpdmF0ZScgOiAnZGVhY3RpdmF0ZSc7XG4gICAgdGhpc1sgbWV0aG9kIF0oKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgYWZ0ZXJDb250ZW50ID0gZ2V0Q29tcHV0ZWRTdHlsZSggdGhpcy5lbGVtZW50LCAnOmFmdGVyJyApLmNvbnRlbnQ7XG4gIC8vIGFjdGl2YXRlIGlmIDphZnRlciB7IGNvbnRlbnQ6ICdmbGlja2l0eScgfVxuICBpZiAoIGFmdGVyQ29udGVudC5pbmRleE9mKCdmbGlja2l0eScpICE9IC0xICkge1xuICAgIHRoaXMuYWN0aXZhdGUoKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmRlYWN0aXZhdGUoKTtcbiAgfVxufTtcblxuLy8gLS0tLS0ga2V5ZG93biAtLS0tLSAvL1xuXG4vLyBnbyBwcmV2aW91cy9uZXh0IGlmIGxlZnQvcmlnaHQga2V5cyBwcmVzc2VkXG5GbGlja2l0eS5wcm90b3R5cGUub25rZXlkb3duID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICAvLyBvbmx5IHdvcmsgaWYgZWxlbWVudCBpcyBpbiBmb2N1c1xuICBpZiAoICF0aGlzLm9wdGlvbnMuYWNjZXNzaWJpbGl0eSB8fFxuICAgICggZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50ICE9IHRoaXMuZWxlbWVudCApICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICggZXZlbnQua2V5Q29kZSA9PSAzNyApIHtcbiAgICAvLyBnbyBsZWZ0XG4gICAgdmFyIGxlZnRNZXRob2QgPSB0aGlzLm9wdGlvbnMucmlnaHRUb0xlZnQgPyAnbmV4dCcgOiAncHJldmlvdXMnO1xuICAgIHRoaXMudWlDaGFuZ2UoKTtcbiAgICB0aGlzWyBsZWZ0TWV0aG9kIF0oKTtcbiAgfSBlbHNlIGlmICggZXZlbnQua2V5Q29kZSA9PSAzOSApIHtcbiAgICAvLyBnbyByaWdodFxuICAgIHZhciByaWdodE1ldGhvZCA9IHRoaXMub3B0aW9ucy5yaWdodFRvTGVmdCA/ICdwcmV2aW91cycgOiAnbmV4dCc7XG4gICAgdGhpcy51aUNoYW5nZSgpO1xuICAgIHRoaXNbIHJpZ2h0TWV0aG9kIF0oKTtcbiAgfVxufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGVzdHJveSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4vLyBkZWFjdGl2YXRlIGFsbCBGbGlja2l0eSBmdW5jdGlvbmFsaXR5LCBidXQga2VlcCBzdHVmZiBhdmFpbGFibGVcbkZsaWNraXR5LnByb3RvdHlwZS5kZWFjdGl2YXRlID0gZnVuY3Rpb24oKSB7XG4gIGlmICggIXRoaXMuaXNBY3RpdmUgKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNsYXNzaWUucmVtb3ZlKCB0aGlzLmVsZW1lbnQsICdmbGlja2l0eS1lbmFibGVkJyApO1xuICBjbGFzc2llLnJlbW92ZSggdGhpcy5lbGVtZW50LCAnZmxpY2tpdHktcnRsJyApO1xuICAvLyBkZXN0cm95IGNlbGxzXG4gIGZvciAoIHZhciBpPTAsIGxlbiA9IHRoaXMuY2VsbHMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgdmFyIGNlbGwgPSB0aGlzLmNlbGxzW2ldO1xuICAgIGNlbGwuZGVzdHJveSgpO1xuICB9XG4gIHRoaXMuX3JlbW92ZVNlbGVjdGVkQ2VsbENsYXNzKCk7XG4gIHRoaXMuZWxlbWVudC5yZW1vdmVDaGlsZCggdGhpcy52aWV3cG9ydCApO1xuICAvLyBtb3ZlIGNoaWxkIGVsZW1lbnRzIGJhY2sgaW50byBlbGVtZW50XG4gIG1vdmVFbGVtZW50cyggdGhpcy5zbGlkZXIuY2hpbGRyZW4sIHRoaXMuZWxlbWVudCApO1xuICBpZiAoIHRoaXMub3B0aW9ucy5hY2Nlc3NpYmlsaXR5ICkge1xuICAgIHRoaXMuZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ3RhYkluZGV4Jyk7XG4gICAgZXZlbnRpZS51bmJpbmQoIHRoaXMuZWxlbWVudCwgJ2tleWRvd24nLCB0aGlzICk7XG4gIH1cbiAgLy8gc2V0IGZsYWdzXG4gIHRoaXMuaXNBY3RpdmUgPSBmYWxzZTtcbiAgdGhpcy5lbWl0KCdkZWFjdGl2YXRlJyk7XG59O1xuXG5GbGlja2l0eS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmRlYWN0aXZhdGUoKTtcbiAgaWYgKCB0aGlzLmlzUmVzaXplQm91bmQgKSB7XG4gICAgZXZlbnRpZS51bmJpbmQoIHdpbmRvdywgJ3Jlc2l6ZScsIHRoaXMgKTtcbiAgfVxuICB0aGlzLmVtaXQoJ2Rlc3Ryb3knKTtcbiAgaWYgKCBqUXVlcnkgJiYgdGhpcy4kZWxlbWVudCApIHtcbiAgICBqUXVlcnkucmVtb3ZlRGF0YSggdGhpcy5lbGVtZW50LCAnZmxpY2tpdHknICk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuZWxlbWVudC5mbGlja2l0eUdVSUQ7XG4gIGRlbGV0ZSBpbnN0YW5jZXNbIHRoaXMuZ3VpZCBdO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gcHJvdG90eXBlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbnV0aWxzLmV4dGVuZCggRmxpY2tpdHkucHJvdG90eXBlLCBhbmltYXRlUHJvdG90eXBlICk7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGV4dHJhcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4vLyBxdWljayBjaGVjayBmb3IgSUU4XG52YXIgaXNJRTggPSAnYXR0YWNoRXZlbnQnIGluIHdpbmRvdztcblxuRmxpY2tpdHkuc2V0VW5zZWxlY3RhYmxlID0gZnVuY3Rpb24oIGVsZW0gKSB7XG4gIGlmICggIWlzSUU4ICkge1xuICAgIHJldHVybjtcbiAgfVxuICAvLyBJRTggcHJldmVudCBjaGlsZCBmcm9tIGNoYW5naW5nIGZvY3VzIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzE3NTI1MjIzLzE4MjE4M1xuICBlbGVtLnNldEF0dHJpYnV0ZSggJ3Vuc2VsZWN0YWJsZScsICdvbicgKTtcbn07XG5cbi8qKlxuICogZ2V0IEZsaWNraXR5IGluc3RhbmNlIGZyb20gZWxlbWVudFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtXG4gKiBAcmV0dXJucyB7RmxpY2tpdHl9XG4gKi9cbkZsaWNraXR5LmRhdGEgPSBmdW5jdGlvbiggZWxlbSApIHtcbiAgZWxlbSA9IHV0aWxzLmdldFF1ZXJ5RWxlbWVudCggZWxlbSApO1xuICB2YXIgaWQgPSBlbGVtICYmIGVsZW0uZmxpY2tpdHlHVUlEO1xuICByZXR1cm4gaWQgJiYgaW5zdGFuY2VzWyBpZCBdO1xufTtcblxudXRpbHMuaHRtbEluaXQoIEZsaWNraXR5LCAnZmxpY2tpdHknICk7XG5cbmlmICggalF1ZXJ5ICYmIGpRdWVyeS5icmlkZ2V0ICkge1xuICBqUXVlcnkuYnJpZGdldCggJ2ZsaWNraXR5JywgRmxpY2tpdHkgKTtcbn1cblxuRmxpY2tpdHkuQ2VsbCA9IENlbGw7XG5cbnJldHVybiBGbGlja2l0eTtcblxufSkpO1xuIiwiLyoqXG4gKiBGbGlja2l0eSBpbmRleFxuICogdXNlZCBmb3IgQU1EIGFuZCBDb21tb25KUyBleHBvcnRzXG4gKi9cblxuKCBmdW5jdGlvbiggd2luZG93LCBmYWN0b3J5ICkge1xuICAndXNlIHN0cmljdCc7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIGlmICggdHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCBbXG4gICAgICAnLi9mbGlja2l0eScsXG4gICAgICAnLi9kcmFnJyxcbiAgICAgICcuL3ByZXYtbmV4dC1idXR0b24nLFxuICAgICAgJy4vcGFnZS1kb3RzJyxcbiAgICAgICcuL3BsYXllcicsXG4gICAgICAnLi9hZGQtcmVtb3ZlLWNlbGwnXG4gICAgXSwgZmFjdG9yeSApO1xuICB9IGVsc2UgaWYgKCB0eXBlb2YgZXhwb3J0cyA9PSAnb2JqZWN0JyApIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShcbiAgICAgIHJlcXVpcmUoJy4vZmxpY2tpdHknKSxcbiAgICAgIHJlcXVpcmUoJy4vZHJhZycpLFxuICAgICAgcmVxdWlyZSgnLi9wcmV2LW5leHQtYnV0dG9uJyksXG4gICAgICByZXF1aXJlKCcuL3BhZ2UtZG90cycpLFxuICAgICAgcmVxdWlyZSgnLi9wbGF5ZXInKSxcbiAgICAgIHJlcXVpcmUoJy4vYWRkLXJlbW92ZS1jZWxsJylcbiAgICApO1xuICB9XG5cbn0pKCB3aW5kb3csIGZ1bmN0aW9uIGZhY3RvcnkoIEZsaWNraXR5ICkge1xuICAvKmpzaGludCBzdHJpY3Q6IGZhbHNlKi9cbiAgcmV0dXJuIEZsaWNraXR5O1xufSk7XG4iLCIoIGZ1bmN0aW9uKCB3aW5kb3csIGZhY3RvcnkgKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG5cbiAgaWYgKCB0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoIFtcbiAgICAgICdldmVudGllL2V2ZW50aWUnLFxuICAgICAgJy4vZmxpY2tpdHknLFxuICAgICAgJ3RhcC1saXN0ZW5lci90YXAtbGlzdGVuZXInLFxuICAgICAgJ2Zpenp5LXVpLXV0aWxzL3V0aWxzJ1xuICAgIF0sIGZ1bmN0aW9uKCBldmVudGllLCBGbGlja2l0eSwgVGFwTGlzdGVuZXIsIHV0aWxzICkge1xuICAgICAgcmV0dXJuIGZhY3RvcnkoIHdpbmRvdywgZXZlbnRpZSwgRmxpY2tpdHksIFRhcExpc3RlbmVyLCB1dGlscyApO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCB0eXBlb2YgZXhwb3J0cyA9PSAnb2JqZWN0JyApIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHJlcXVpcmUoJ2V2ZW50aWUnKSxcbiAgICAgIHJlcXVpcmUoJy4vZmxpY2tpdHknKSxcbiAgICAgIHJlcXVpcmUoJ3RhcC1saXN0ZW5lcicpLFxuICAgICAgcmVxdWlyZSgnZml6enktdWktdXRpbHMnKVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cuRmxpY2tpdHkgPSB3aW5kb3cuRmxpY2tpdHkgfHwge307XG4gICAgd2luZG93LkZsaWNraXR5LlBhZ2VEb3RzID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHdpbmRvdy5ldmVudGllLFxuICAgICAgd2luZG93LkZsaWNraXR5LFxuICAgICAgd2luZG93LlRhcExpc3RlbmVyLFxuICAgICAgd2luZG93LmZpenp5VUlVdGlsc1xuICAgICk7XG4gIH1cblxufSggd2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KCB3aW5kb3csIGV2ZW50aWUsIEZsaWNraXR5LCBUYXBMaXN0ZW5lciwgdXRpbHMgKSB7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBhZ2VEb3RzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gUGFnZURvdHMoIHBhcmVudCApIHtcbiAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gIHRoaXMuX2NyZWF0ZSgpO1xufVxuXG5QYWdlRG90cy5wcm90b3R5cGUgPSBuZXcgVGFwTGlzdGVuZXIoKTtcblxuUGFnZURvdHMucHJvdG90eXBlLl9jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgLy8gY3JlYXRlIGhvbGRlciBlbGVtZW50XG4gIHRoaXMuaG9sZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb2wnKTtcbiAgdGhpcy5ob2xkZXIuY2xhc3NOYW1lID0gJ2ZsaWNraXR5LXBhZ2UtZG90cyc7XG4gIEZsaWNraXR5LnNldFVuc2VsZWN0YWJsZSggdGhpcy5ob2xkZXIgKTtcbiAgLy8gY3JlYXRlIGRvdHMsIGFycmF5IG9mIGVsZW1lbnRzXG4gIHRoaXMuZG90cyA9IFtdO1xuICAvLyB1cGRhdGUgb24gc2VsZWN0XG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIHRoaXMub25DZWxsU2VsZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgX3RoaXMudXBkYXRlU2VsZWN0ZWQoKTtcbiAgfTtcbiAgdGhpcy5wYXJlbnQub24oICdjZWxsU2VsZWN0JywgdGhpcy5vbkNlbGxTZWxlY3QgKTtcbiAgLy8gdGFwXG4gIHRoaXMub24oICd0YXAnLCB0aGlzLm9uVGFwICk7XG4gIC8vIHBvaW50ZXJEb3duXG4gIHRoaXMub24oICdwb2ludGVyRG93bicsIGZ1bmN0aW9uIG9uUG9pbnRlckRvd24oIGJ1dHRvbiwgZXZlbnQgKSB7XG4gICAgX3RoaXMucGFyZW50LmNoaWxkVUlQb2ludGVyRG93biggZXZlbnQgKTtcbiAgfSk7XG59O1xuXG5QYWdlRG90cy5wcm90b3R5cGUuYWN0aXZhdGUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5zZXREb3RzKCk7XG4gIHRoaXMudXBkYXRlU2VsZWN0ZWQoKTtcbiAgdGhpcy5iaW5kVGFwKCB0aGlzLmhvbGRlciApO1xuICAvLyBhZGQgdG8gRE9NXG4gIHRoaXMucGFyZW50LmVsZW1lbnQuYXBwZW5kQ2hpbGQoIHRoaXMuaG9sZGVyICk7XG59O1xuXG5QYWdlRG90cy5wcm90b3R5cGUuZGVhY3RpdmF0ZSA9IGZ1bmN0aW9uKCkge1xuICAvLyByZW1vdmUgZnJvbSBET01cbiAgdGhpcy5wYXJlbnQuZWxlbWVudC5yZW1vdmVDaGlsZCggdGhpcy5ob2xkZXIgKTtcbiAgVGFwTGlzdGVuZXIucHJvdG90eXBlLmRlc3Ryb3kuY2FsbCggdGhpcyApO1xufTtcblxuUGFnZURvdHMucHJvdG90eXBlLnNldERvdHMgPSBmdW5jdGlvbigpIHtcbiAgLy8gZ2V0IGRpZmZlcmVuY2UgYmV0d2VlbiBudW1iZXIgb2YgY2VsbHMgYW5kIG51bWJlciBvZiBkb3RzXG4gIHZhciBkZWx0YSA9IHRoaXMucGFyZW50LmNlbGxzLmxlbmd0aCAtIHRoaXMuZG90cy5sZW5ndGg7XG4gIGlmICggZGVsdGEgPiAwICkge1xuICAgIHRoaXMuYWRkRG90cyggZGVsdGEgKTtcbiAgfSBlbHNlIGlmICggZGVsdGEgPCAwICkge1xuICAgIHRoaXMucmVtb3ZlRG90cyggLWRlbHRhICk7XG4gIH1cbn07XG5cblBhZ2VEb3RzLnByb3RvdHlwZS5hZGREb3RzID0gZnVuY3Rpb24oIGNvdW50ICkge1xuICB2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gIHZhciBuZXdEb3RzID0gW107XG4gIHdoaWxlICggY291bnQgKSB7XG4gICAgdmFyIGRvdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgZG90LmNsYXNzTmFtZSA9ICdkb3QnO1xuICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKCBkb3QgKTtcbiAgICBuZXdEb3RzLnB1c2goIGRvdCApO1xuICAgIGNvdW50LS07XG4gIH1cbiAgdGhpcy5ob2xkZXIuYXBwZW5kQ2hpbGQoIGZyYWdtZW50ICk7XG4gIHRoaXMuZG90cyA9IHRoaXMuZG90cy5jb25jYXQoIG5ld0RvdHMgKTtcbn07XG5cblBhZ2VEb3RzLnByb3RvdHlwZS5yZW1vdmVEb3RzID0gZnVuY3Rpb24oIGNvdW50ICkge1xuICAvLyByZW1vdmUgZnJvbSB0aGlzLmRvdHMgY29sbGVjdGlvblxuICB2YXIgcmVtb3ZlRG90cyA9IHRoaXMuZG90cy5zcGxpY2UoIHRoaXMuZG90cy5sZW5ndGggLSBjb3VudCwgY291bnQgKTtcbiAgLy8gcmVtb3ZlIGZyb20gRE9NXG4gIGZvciAoIHZhciBpPTAsIGxlbiA9IHJlbW92ZURvdHMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgdmFyIGRvdCA9IHJlbW92ZURvdHNbaV07XG4gICAgdGhpcy5ob2xkZXIucmVtb3ZlQ2hpbGQoIGRvdCApO1xuICB9XG59O1xuXG5QYWdlRG90cy5wcm90b3R5cGUudXBkYXRlU2VsZWN0ZWQgPSBmdW5jdGlvbigpIHtcbiAgLy8gcmVtb3ZlIHNlbGVjdGVkIGNsYXNzIG9uIHByZXZpb3VzXG4gIGlmICggdGhpcy5zZWxlY3RlZERvdCApIHtcbiAgICB0aGlzLnNlbGVjdGVkRG90LmNsYXNzTmFtZSA9ICdkb3QnO1xuICB9XG4gIC8vIGRvbid0IHByb2NlZWQgaWYgbm8gZG90c1xuICBpZiAoICF0aGlzLmRvdHMubGVuZ3RoICkge1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLnNlbGVjdGVkRG90ID0gdGhpcy5kb3RzWyB0aGlzLnBhcmVudC5zZWxlY3RlZEluZGV4IF07XG4gIHRoaXMuc2VsZWN0ZWREb3QuY2xhc3NOYW1lID0gJ2RvdCBpcy1zZWxlY3RlZCc7XG59O1xuXG5QYWdlRG90cy5wcm90b3R5cGUub25UYXAgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gIHZhciB0YXJnZXQgPSBldmVudC50YXJnZXQ7XG4gIC8vIG9ubHkgY2FyZSBhYm91dCBkb3QgY2xpY2tzXG4gIGlmICggdGFyZ2V0Lm5vZGVOYW1lICE9ICdMSScgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhpcy5wYXJlbnQudWlDaGFuZ2UoKTtcbiAgdmFyIGluZGV4ID0gdXRpbHMuaW5kZXhPZiggdGhpcy5kb3RzLCB0YXJnZXQgKTtcbiAgdGhpcy5wYXJlbnQuc2VsZWN0KCBpbmRleCApO1xufTtcblxuUGFnZURvdHMucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5kZWFjdGl2YXRlKCk7XG59O1xuXG5GbGlja2l0eS5QYWdlRG90cyA9IFBhZ2VEb3RzO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBGbGlja2l0eSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG51dGlscy5leHRlbmQoIEZsaWNraXR5LmRlZmF1bHRzLCB7XG4gIHBhZ2VEb3RzOiB0cnVlXG59KTtcblxuRmxpY2tpdHkuY3JlYXRlTWV0aG9kcy5wdXNoKCdfY3JlYXRlUGFnZURvdHMnKTtcblxuRmxpY2tpdHkucHJvdG90eXBlLl9jcmVhdGVQYWdlRG90cyA9IGZ1bmN0aW9uKCkge1xuICBpZiAoICF0aGlzLm9wdGlvbnMucGFnZURvdHMgKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMucGFnZURvdHMgPSBuZXcgUGFnZURvdHMoIHRoaXMgKTtcbiAgdGhpcy5vbiggJ2FjdGl2YXRlJywgdGhpcy5hY3RpdmF0ZVBhZ2VEb3RzICk7XG4gIHRoaXMub24oICdjZWxsQWRkZWRSZW1vdmVkJywgdGhpcy5vbkNlbGxBZGRlZFJlbW92ZWRQYWdlRG90cyApO1xuICB0aGlzLm9uKCAnZGVhY3RpdmF0ZScsIHRoaXMuZGVhY3RpdmF0ZVBhZ2VEb3RzICk7XG59O1xuXG5GbGlja2l0eS5wcm90b3R5cGUuYWN0aXZhdGVQYWdlRG90cyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnBhZ2VEb3RzLmFjdGl2YXRlKCk7XG59O1xuXG5GbGlja2l0eS5wcm90b3R5cGUub25DZWxsQWRkZWRSZW1vdmVkUGFnZURvdHMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wYWdlRG90cy5zZXREb3RzKCk7XG59O1xuXG5GbGlja2l0eS5wcm90b3R5cGUuZGVhY3RpdmF0ZVBhZ2VEb3RzID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucGFnZURvdHMuZGVhY3RpdmF0ZSgpO1xufTtcblxuLy8gLS0tLS0gIC0tLS0tIC8vXG5cbkZsaWNraXR5LlBhZ2VEb3RzID0gUGFnZURvdHM7XG5cbnJldHVybiBQYWdlRG90cztcblxufSkpO1xuIiwiKCBmdW5jdGlvbiggd2luZG93LCBmYWN0b3J5ICkge1xuICAndXNlIHN0cmljdCc7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIGlmICggdHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCBbXG4gICAgICAnZXZlbnRFbWl0dGVyL0V2ZW50RW1pdHRlcicsXG4gICAgICAnZXZlbnRpZS9ldmVudGllJyxcbiAgICAgICcuL2ZsaWNraXR5J1xuICAgIF0sIGZ1bmN0aW9uKCBFdmVudEVtaXR0ZXIsIGV2ZW50aWUsIEZsaWNraXR5ICkge1xuICAgICAgcmV0dXJuIGZhY3RvcnkoIEV2ZW50RW1pdHRlciwgZXZlbnRpZSwgRmxpY2tpdHkgKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIGV4cG9ydHMgPT0gJ29iamVjdCcgKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoXG4gICAgICByZXF1aXJlKCd3b2xmeTg3LWV2ZW50ZW1pdHRlcicpLFxuICAgICAgcmVxdWlyZSgnZXZlbnRpZScpLFxuICAgICAgcmVxdWlyZSgnLi9mbGlja2l0eScpXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5GbGlja2l0eSA9IHdpbmRvdy5GbGlja2l0eSB8fCB7fTtcbiAgICB3aW5kb3cuRmxpY2tpdHkuUGxheWVyID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdy5FdmVudEVtaXR0ZXIsXG4gICAgICB3aW5kb3cuZXZlbnRpZSxcbiAgICAgIHdpbmRvdy5GbGlja2l0eVxuICAgICk7XG4gIH1cblxufSggd2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KCBFdmVudEVtaXR0ZXIsIGV2ZW50aWUsIEZsaWNraXR5ICkge1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBhZ2UgVmlzaWJpbGl0eSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvR3VpZGUvVXNlcl9leHBlcmllbmNlL1VzaW5nX3RoZV9QYWdlX1Zpc2liaWxpdHlfQVBJXG5cbnZhciBoaWRkZW5Qcm9wZXJ0eSwgdmlzaWJpbGl0eUV2ZW50O1xuaWYgKCAnaGlkZGVuJyBpbiBkb2N1bWVudCApIHtcbiAgaGlkZGVuUHJvcGVydHkgPSAnaGlkZGVuJztcbiAgdmlzaWJpbGl0eUV2ZW50ID0gJ3Zpc2liaWxpdHljaGFuZ2UnO1xufSBlbHNlIGlmICggJ3dlYmtpdEhpZGRlbicgaW4gZG9jdW1lbnQgKSB7XG4gIGhpZGRlblByb3BlcnR5ID0gJ3dlYmtpdEhpZGRlbic7XG4gIHZpc2liaWxpdHlFdmVudCA9ICd3ZWJraXR2aXNpYmlsaXR5Y2hhbmdlJztcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUGxheWVyIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbmZ1bmN0aW9uIFBsYXllciggcGFyZW50ICkge1xuICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xuICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgLy8gdmlzaWJpbGl0eSBjaGFuZ2UgZXZlbnQgaGFuZGxlclxuICBpZiAoIHZpc2liaWxpdHlFdmVudCApIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHRoaXMub25WaXNpYmlsaXR5Q2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICBfdGhpcy52aXNpYmlsaXR5Q2hhbmdlKCk7XG4gICAgfTtcbiAgfVxufVxuXG5QbGF5ZXIucHJvdG90eXBlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4vLyBzdGFydCBwbGF5XG5QbGF5ZXIucHJvdG90eXBlLnBsYXkgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5pc1BsYXlpbmcgPSB0cnVlO1xuICAvLyBwbGF5aW5nIGtpbGxzIHBhdXNlc1xuICBkZWxldGUgdGhpcy5pc1BhdXNlZDtcbiAgLy8gbGlzdGVuIHRvIHZpc2liaWxpdHkgY2hhbmdlXG4gIGlmICggdmlzaWJpbGl0eUV2ZW50ICkge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoIHZpc2liaWxpdHlFdmVudCwgdGhpcy5vblZpc2liaWxpdHlDaGFuZ2UsIGZhbHNlICk7XG4gIH1cbiAgLy8gc3RhcnQgdGlja2luZ1xuICB0aGlzLnRpY2soKTtcbn07XG5cblBsYXllci5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuICAvLyBkbyBub3QgdGljayBpZiBwYXVzZWQgb3Igbm90IHBsYXlpbmdcbiAgaWYgKCAhdGhpcy5pc1BsYXlpbmcgfHwgdGhpcy5pc1BhdXNlZCApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8ga2VlcCB0cmFjayBvZiB3aGVuIC50aWNrKClcbiAgdGhpcy50aWNrVGltZSA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gdGhpcy5wYXJlbnQub3B0aW9ucy5hdXRvUGxheTtcbiAgLy8gZGVmYXVsdCB0byAzIHNlY29uZHNcbiAgdGltZSA9IHR5cGVvZiB0aW1lID09ICdudW1iZXInID8gdGltZSA6IDMwMDA7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuICAgIF90aGlzLnBhcmVudC5uZXh0KCB0cnVlICk7XG4gICAgX3RoaXMudGljaygpO1xuICB9LCB0aW1lICk7XG59O1xuXG5QbGF5ZXIucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcbiAgLy8gc3RvcHBpbmcga2lsbHMgcGF1c2VzXG4gIGRlbGV0ZSB0aGlzLmlzUGF1c2VkO1xuICB0aGlzLmNsZWFyKCk7XG4gIC8vIHJlbW92ZSB2aXNpYmlsaXR5IGNoYW5nZSBldmVudFxuICBpZiAoIHZpc2liaWxpdHlFdmVudCApIHtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCB2aXNpYmlsaXR5RXZlbnQsIHRoaXMub25WaXNpYmlsaXR5Q2hhbmdlLCBmYWxzZSApO1xuICB9XG59O1xuXG5QbGF5ZXIucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gIGNsZWFyVGltZW91dCggdGhpcy50aW1lb3V0ICk7XG59O1xuXG5QbGF5ZXIucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24oKSB7XG4gIGlmICggdGhpcy5pc1BsYXlpbmcgKSB7XG4gICAgdGhpcy5pc1BhdXNlZCA9IHRydWU7XG4gICAgdGhpcy5jbGVhcigpO1xuICB9XG59O1xuXG5QbGF5ZXIucHJvdG90eXBlLnVucGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgLy8gcmUtc3RhcnQgcGxheSBpZiBpbiB1bnBhdXNlZCBzdGF0ZVxuICBpZiAoIHRoaXMuaXNQYXVzZWQgKSB7XG4gICAgdGhpcy5wbGF5KCk7XG4gIH1cbn07XG5cbi8vIHBhdXNlIGlmIHBhZ2UgdmlzaWJpbGl0eSBpcyBoaWRkZW4sIHVucGF1c2UgaWYgdmlzaWJsZVxuUGxheWVyLnByb3RvdHlwZS52aXNpYmlsaXR5Q2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpc0hpZGRlbiA9IGRvY3VtZW50WyBoaWRkZW5Qcm9wZXJ0eSBdO1xuICB0aGlzWyBpc0hpZGRlbiA/ICdwYXVzZScgOiAndW5wYXVzZScgXSgpO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gRmxpY2tpdHkgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuLy8gdXRpbHMuZXh0ZW5kKCBGbGlja2l0eS5kZWZhdWx0cywge1xuLy8gICBhdXRvUGxheTogZmFsc2Vcbi8vIH0pO1xuXG5GbGlja2l0eS5jcmVhdGVNZXRob2RzLnB1c2goJ19jcmVhdGVQbGF5ZXInKTtcblxuRmxpY2tpdHkucHJvdG90eXBlLl9jcmVhdGVQbGF5ZXIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wbGF5ZXIgPSBuZXcgUGxheWVyKCB0aGlzICk7XG5cbiAgdGhpcy5vbiggJ2FjdGl2YXRlJywgdGhpcy5hY3RpdmF0ZVBsYXllciApO1xuICB0aGlzLm9uKCAndWlDaGFuZ2UnLCB0aGlzLnN0b3BQbGF5ZXIgKTtcbiAgdGhpcy5vbiggJ3BvaW50ZXJEb3duJywgdGhpcy5zdG9wUGxheWVyICk7XG4gIHRoaXMub24oICdkZWFjdGl2YXRlJywgdGhpcy5kZWFjdGl2YXRlUGxheWVyICk7XG59O1xuXG5GbGlja2l0eS5wcm90b3R5cGUuYWN0aXZhdGVQbGF5ZXIgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCAhdGhpcy5vcHRpb25zLmF1dG9QbGF5ICkge1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLnBsYXllci5wbGF5KCk7XG4gIGV2ZW50aWUuYmluZCggdGhpcy5lbGVtZW50LCAnbW91c2VlbnRlcicsIHRoaXMgKTtcbiAgdGhpcy5pc01vdXNlZW50ZXJCb3VuZCA9IHRydWU7XG59O1xuXG5GbGlja2l0eS5wcm90b3R5cGUuc3RvcFBsYXllciA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnBsYXllci5zdG9wKCk7XG59O1xuXG5GbGlja2l0eS5wcm90b3R5cGUuZGVhY3RpdmF0ZVBsYXllciA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnBsYXllci5zdG9wKCk7XG4gIGlmICggdGhpcy5pc01vdXNlZW50ZXJCb3VuZCApIHtcbiAgICBldmVudGllLnVuYmluZCggdGhpcy5lbGVtZW50LCAnbW91c2VlbnRlcicsIHRoaXMgKTtcbiAgICBkZWxldGUgdGhpcy5pc01vdXNlZW50ZXJCb3VuZDtcbiAgfVxufTtcblxuLy8gLS0tLS0gbW91c2VlbnRlci9sZWF2ZSAtLS0tLSAvL1xuXG4vLyBwYXVzZSBhdXRvLXBsYXkgb24gaG92ZXJcbkZsaWNraXR5LnByb3RvdHlwZS5vbm1vdXNlZW50ZXIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wbGF5ZXIucGF1c2UoKTtcbiAgZXZlbnRpZS5iaW5kKCB0aGlzLmVsZW1lbnQsICdtb3VzZWxlYXZlJywgdGhpcyApO1xufTtcblxuLy8gcmVzdW1lIGF1dG8tcGxheSBvbiBob3ZlciBvZmZcbkZsaWNraXR5LnByb3RvdHlwZS5vbm1vdXNlbGVhdmUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wbGF5ZXIudW5wYXVzZSgpO1xuICBldmVudGllLnVuYmluZCggdGhpcy5lbGVtZW50LCAnbW91c2VsZWF2ZScsIHRoaXMgKTtcbn07XG5cbi8vIC0tLS0tICAtLS0tLSAvL1xuXG5GbGlja2l0eS5QbGF5ZXIgPSBQbGF5ZXI7XG5cbnJldHVybiBQbGF5ZXI7XG5cbn0pKTtcbiIsIi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHByZXYvbmV4dCBidXR0b24gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuKCBmdW5jdGlvbiggd2luZG93LCBmYWN0b3J5ICkge1xuICAndXNlIHN0cmljdCc7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIGlmICggdHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCBbXG4gICAgICAnZXZlbnRpZS9ldmVudGllJyxcbiAgICAgICcuL2ZsaWNraXR5JyxcbiAgICAgICd0YXAtbGlzdGVuZXIvdGFwLWxpc3RlbmVyJyxcbiAgICAgICdmaXp6eS11aS11dGlscy91dGlscydcbiAgICBdLCBmdW5jdGlvbiggZXZlbnRpZSwgRmxpY2tpdHksIFRhcExpc3RlbmVyLCB1dGlscyApIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KCB3aW5kb3csIGV2ZW50aWUsIEZsaWNraXR5LCBUYXBMaXN0ZW5lciwgdXRpbHMgKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIGV4cG9ydHMgPT0gJ29iamVjdCcgKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICByZXF1aXJlKCdldmVudGllJyksXG4gICAgICByZXF1aXJlKCcuL2ZsaWNraXR5JyksXG4gICAgICByZXF1aXJlKCd0YXAtbGlzdGVuZXInKSxcbiAgICAgIHJlcXVpcmUoJ2Zpenp5LXVpLXV0aWxzJylcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93LkZsaWNraXR5ID0gd2luZG93LkZsaWNraXR5IHx8IHt9O1xuICAgIHdpbmRvdy5GbGlja2l0eS5QcmV2TmV4dEJ1dHRvbiA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICB3aW5kb3cuZXZlbnRpZSxcbiAgICAgIHdpbmRvdy5GbGlja2l0eSxcbiAgICAgIHdpbmRvdy5UYXBMaXN0ZW5lcixcbiAgICAgIHdpbmRvdy5maXp6eVVJVXRpbHNcbiAgICApO1xuICB9XG5cbn0oIHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSggd2luZG93LCBldmVudGllLCBGbGlja2l0eSwgVGFwTGlzdGVuZXIsIHV0aWxzICkge1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIC0tLS0tIGlubGluZSBTVkcgc3VwcG9ydCAtLS0tLSAvL1xuXG52YXIgc3ZnVVJJID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcblxuLy8gb25seSBjaGVjayBvbiBkZW1hbmQsIG5vdCBvbiBzY3JpcHQgbG9hZFxudmFyIHN1cHBvcnRzSW5saW5lU1ZHID0gKCBmdW5jdGlvbigpIHtcbiAgdmFyIHN1cHBvcnRzO1xuICBmdW5jdGlvbiBjaGVja1N1cHBvcnQoKSB7XG4gICAgaWYgKCBzdXBwb3J0cyAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgcmV0dXJuIHN1cHBvcnRzO1xuICAgIH1cbiAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZGl2LmlubmVySFRNTCA9ICc8c3ZnLz4nO1xuICAgIHN1cHBvcnRzID0gKCBkaXYuZmlyc3RDaGlsZCAmJiBkaXYuZmlyc3RDaGlsZC5uYW1lc3BhY2VVUkkgKSA9PSBzdmdVUkk7XG4gICAgcmV0dXJuIHN1cHBvcnRzO1xuICB9XG4gIHJldHVybiBjaGVja1N1cHBvcnQ7XG59KSgpO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQcmV2TmV4dEJ1dHRvbiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5mdW5jdGlvbiBQcmV2TmV4dEJ1dHRvbiggZGlyZWN0aW9uLCBwYXJlbnQgKSB7XG4gIHRoaXMuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgdGhpcy5fY3JlYXRlKCk7XG59XG5cblByZXZOZXh0QnV0dG9uLnByb3RvdHlwZSA9IG5ldyBUYXBMaXN0ZW5lcigpO1xuXG5QcmV2TmV4dEJ1dHRvbi5wcm90b3R5cGUuX2NyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAvLyBwcm9wZXJ0aWVzXG4gIHRoaXMuaXNFbmFibGVkID0gdHJ1ZTtcbiAgdGhpcy5pc1ByZXZpb3VzID0gdGhpcy5kaXJlY3Rpb24gPT0gLTE7XG4gIHZhciBsZWZ0RGlyZWN0aW9uID0gdGhpcy5wYXJlbnQub3B0aW9ucy5yaWdodFRvTGVmdCA/IDEgOiAtMTtcbiAgdGhpcy5pc0xlZnQgPSB0aGlzLmRpcmVjdGlvbiA9PSBsZWZ0RGlyZWN0aW9uO1xuXG4gIHZhciBlbGVtZW50ID0gdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gIGVsZW1lbnQuY2xhc3NOYW1lID0gJ2ZsaWNraXR5LXByZXYtbmV4dC1idXR0b24nO1xuICBlbGVtZW50LmNsYXNzTmFtZSArPSB0aGlzLmlzUHJldmlvdXMgPyAnIHByZXZpb3VzJyA6ICcgbmV4dCc7XG4gIC8vIHByZXZlbnQgYnV0dG9uIGZyb20gc3VibWl0dGluZyBmb3JtIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEwODM2MDc2LzE4MjE4M1xuICBlbGVtZW50LnNldEF0dHJpYnV0ZSggJ3R5cGUnLCAnYnV0dG9uJyApO1xuICBGbGlja2l0eS5zZXRVbnNlbGVjdGFibGUoIGVsZW1lbnQgKTtcbiAgLy8gY3JlYXRlIGFycm93XG4gIGlmICggc3VwcG9ydHNJbmxpbmVTVkcoKSApIHtcbiAgICB2YXIgc3ZnID0gdGhpcy5jcmVhdGVTVkcoKTtcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKCBzdmcgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBTVkcgbm90IHN1cHBvcnRlZCwgc2V0IGJ1dHRvbiB0ZXh0XG4gICAgdGhpcy5zZXRBcnJvd1RleHQoKTtcbiAgICBlbGVtZW50LmNsYXNzTmFtZSArPSAnIG5vLXN2Zyc7XG4gIH1cbiAgLy8gdXBkYXRlIG9uIHNlbGVjdFxuICB2YXIgX3RoaXMgPSB0aGlzO1xuICB0aGlzLm9uQ2VsbFNlbGVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIF90aGlzLnVwZGF0ZSgpO1xuICB9O1xuICB0aGlzLnBhcmVudC5vbiggJ2NlbGxTZWxlY3QnLCB0aGlzLm9uQ2VsbFNlbGVjdCApO1xuICAvLyB0YXBcbiAgdGhpcy5vbiggJ3RhcCcsIHRoaXMub25UYXAgKTtcbiAgLy8gcG9pbnRlckRvd25cbiAgdGhpcy5vbiggJ3BvaW50ZXJEb3duJywgZnVuY3Rpb24gb25Qb2ludGVyRG93biggYnV0dG9uLCBldmVudCApIHtcbiAgICBfdGhpcy5wYXJlbnQuY2hpbGRVSVBvaW50ZXJEb3duKCBldmVudCApO1xuICB9KTtcbn07XG5cblByZXZOZXh0QnV0dG9uLnByb3RvdHlwZS5hY3RpdmF0ZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnVwZGF0ZSgpO1xuICB0aGlzLmJpbmRUYXAoIHRoaXMuZWxlbWVudCApO1xuICAvLyBjbGljayBldmVudHMgZnJvbSBrZXlib2FyZFxuICBldmVudGllLmJpbmQoIHRoaXMuZWxlbWVudCwgJ2NsaWNrJywgdGhpcyApO1xuICAvLyBhZGQgdG8gRE9NXG4gIHRoaXMucGFyZW50LmVsZW1lbnQuYXBwZW5kQ2hpbGQoIHRoaXMuZWxlbWVudCApO1xufTtcblxuUHJldk5leHRCdXR0b24ucHJvdG90eXBlLmRlYWN0aXZhdGUgPSBmdW5jdGlvbigpIHtcbiAgLy8gcmVtb3ZlIGZyb20gRE9NXG4gIHRoaXMucGFyZW50LmVsZW1lbnQucmVtb3ZlQ2hpbGQoIHRoaXMuZWxlbWVudCApO1xuICAvLyBkbyByZWd1bGFyIFRhcExpc3RlbmVyIGRlc3Ryb3lcbiAgVGFwTGlzdGVuZXIucHJvdG90eXBlLmRlc3Ryb3kuY2FsbCggdGhpcyApO1xuICAvLyBjbGljayBldmVudHMgZnJvbSBrZXlib2FyZFxuICBldmVudGllLnVuYmluZCggdGhpcy5lbGVtZW50LCAnY2xpY2snLCB0aGlzICk7XG59O1xuXG5QcmV2TmV4dEJ1dHRvbi5wcm90b3R5cGUuY3JlYXRlU1ZHID0gZnVuY3Rpb24oKSB7XG4gIHZhciBzdmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoIHN2Z1VSSSwgJ3N2ZycpO1xuICBzdmcuc2V0QXR0cmlidXRlKCAndmlld0JveCcsICcwIDAgMTAwIDEwMCcgKTtcbiAgdmFyIHBhdGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoIHN2Z1VSSSwgJ3BhdGgnKTtcbiAgcGF0aC5zZXRBdHRyaWJ1dGUoICdkJywgJ00gNTAsMCBMIDYwLDEwIEwgMjAsNTAgTCA2MCw5MCBMIDUwLDEwMCBMIDAsNTAgWicgKTtcbiAgcGF0aC5zZXRBdHRyaWJ1dGUoICdjbGFzcycsICdhcnJvdycgKTtcbiAgLy8gYWRqdXN0IGFycm93XG4gIHZhciBhcnJvd1RyYW5zZm9ybSA9IHRoaXMuaXNMZWZ0ID8gJ3RyYW5zbGF0ZSgxNSwwKScgOlxuICAgICd0cmFuc2xhdGUoODUsMTAwKSByb3RhdGUoMTgwKSc7XG4gIHBhdGguc2V0QXR0cmlidXRlKCAndHJhbnNmb3JtJywgYXJyb3dUcmFuc2Zvcm0gKTtcbiAgc3ZnLmFwcGVuZENoaWxkKCBwYXRoICk7XG4gIHJldHVybiBzdmc7XG59O1xuXG5QcmV2TmV4dEJ1dHRvbi5wcm90b3R5cGUuc2V0QXJyb3dUZXh0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwYXJlbnRPcHRpb25zID0gdGhpcy5wYXJlbnQub3B0aW9ucztcbiAgdmFyIGFycm93VGV4dCA9IHRoaXMuaXNMZWZ0ID8gcGFyZW50T3B0aW9ucy5sZWZ0QXJyb3dUZXh0IDogcGFyZW50T3B0aW9ucy5yaWdodEFycm93VGV4dDtcbiAgdXRpbHMuc2V0VGV4dCggdGhpcy5lbGVtZW50LCBhcnJvd1RleHQgKTtcbn07XG5cblByZXZOZXh0QnV0dG9uLnByb3RvdHlwZS5vblRhcCA9IGZ1bmN0aW9uKCkge1xuICBpZiAoICF0aGlzLmlzRW5hYmxlZCApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5wYXJlbnQudWlDaGFuZ2UoKTtcbiAgdmFyIG1ldGhvZCA9IHRoaXMuaXNQcmV2aW91cyA/ICdwcmV2aW91cycgOiAnbmV4dCc7XG4gIHRoaXMucGFyZW50WyBtZXRob2QgXSgpO1xufTtcblxuUHJldk5leHRCdXR0b24ucHJvdG90eXBlLmhhbmRsZUV2ZW50ID0gdXRpbHMuaGFuZGxlRXZlbnQ7XG5cblByZXZOZXh0QnV0dG9uLnByb3RvdHlwZS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XG4gIC8vIG9ubHkgYWxsb3cgY2xpY2tzIGZyb20ga2V5Ym9hcmRcbiAgdmFyIGZvY3VzZWQgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICBpZiAoIGZvY3VzZWQgJiYgZm9jdXNlZCA9PSB0aGlzLmVsZW1lbnQgKSB7XG4gICAgdGhpcy5vblRhcCgpO1xuICB9XG59O1xuXG4vLyAtLS0tLSAgLS0tLS0gLy9cblxuUHJldk5leHRCdXR0b24ucHJvdG90eXBlLmVuYWJsZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIHRoaXMuaXNFbmFibGVkICkge1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLmVsZW1lbnQuZGlzYWJsZWQgPSBmYWxzZTtcbiAgdGhpcy5pc0VuYWJsZWQgPSB0cnVlO1xufTtcblxuUHJldk5leHRCdXR0b24ucHJvdG90eXBlLmRpc2FibGUgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCAhdGhpcy5pc0VuYWJsZWQgKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMuZWxlbWVudC5kaXNhYmxlZCA9IHRydWU7XG4gIHRoaXMuaXNFbmFibGVkID0gZmFsc2U7XG59O1xuXG5QcmV2TmV4dEJ1dHRvbi5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gIC8vIGluZGV4IG9mIGZpcnN0IG9yIGxhc3QgY2VsbCwgaWYgcHJldmlvdXMgb3IgbmV4dFxuICB2YXIgY2VsbHMgPSB0aGlzLnBhcmVudC5jZWxscztcbiAgLy8gZW5hYmxlIGlzIHdyYXBBcm91bmQgYW5kIGF0IGxlYXN0IDIgY2VsbHNcbiAgaWYgKCB0aGlzLnBhcmVudC5vcHRpb25zLndyYXBBcm91bmQgJiYgY2VsbHMubGVuZ3RoID4gMSApIHtcbiAgICB0aGlzLmVuYWJsZSgpO1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbGFzdEluZGV4ID0gY2VsbHMubGVuZ3RoID8gY2VsbHMubGVuZ3RoIC0gMSA6IDA7XG4gIHZhciBib3VuZEluZGV4ID0gdGhpcy5pc1ByZXZpb3VzID8gMCA6IGxhc3RJbmRleDtcbiAgdmFyIG1ldGhvZCA9IHRoaXMucGFyZW50LnNlbGVjdGVkSW5kZXggPT0gYm91bmRJbmRleCA/ICdkaXNhYmxlJyA6ICdlbmFibGUnO1xuICB0aGlzWyBtZXRob2QgXSgpO1xufTtcblxuUHJldk5leHRCdXR0b24ucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5kZWFjdGl2YXRlKCk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBGbGlja2l0eSBwcm90b3R5cGUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxudXRpbHMuZXh0ZW5kKCBGbGlja2l0eS5kZWZhdWx0cywge1xuICBwcmV2TmV4dEJ1dHRvbnM6IHRydWUsXG4gIGxlZnRBcnJvd1RleHQ6ICfigLknLFxuICByaWdodEFycm93VGV4dDogJ+KAuidcbn0pO1xuXG5GbGlja2l0eS5jcmVhdGVNZXRob2RzLnB1c2goJ19jcmVhdGVQcmV2TmV4dEJ1dHRvbnMnKTtcblxuRmxpY2tpdHkucHJvdG90eXBlLl9jcmVhdGVQcmV2TmV4dEJ1dHRvbnMgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCAhdGhpcy5vcHRpb25zLnByZXZOZXh0QnV0dG9ucyApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLnByZXZCdXR0b24gPSBuZXcgUHJldk5leHRCdXR0b24oIC0xLCB0aGlzICk7XG4gIHRoaXMubmV4dEJ1dHRvbiA9IG5ldyBQcmV2TmV4dEJ1dHRvbiggMSwgdGhpcyApO1xuXG4gIHRoaXMub24oICdhY3RpdmF0ZScsIHRoaXMuYWN0aXZhdGVQcmV2TmV4dEJ1dHRvbnMgKTtcbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5hY3RpdmF0ZVByZXZOZXh0QnV0dG9ucyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnByZXZCdXR0b24uYWN0aXZhdGUoKTtcbiAgdGhpcy5uZXh0QnV0dG9uLmFjdGl2YXRlKCk7XG4gIHRoaXMub24oICdkZWFjdGl2YXRlJywgdGhpcy5kZWFjdGl2YXRlUHJldk5leHRCdXR0b25zICk7XG59O1xuXG5GbGlja2l0eS5wcm90b3R5cGUuZGVhY3RpdmF0ZVByZXZOZXh0QnV0dG9ucyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnByZXZCdXR0b24uZGVhY3RpdmF0ZSgpO1xuICB0aGlzLm5leHRCdXR0b24uZGVhY3RpdmF0ZSgpO1xuICB0aGlzLm9mZiggJ2RlYWN0aXZhdGUnLCB0aGlzLmRlYWN0aXZhdGVQcmV2TmV4dEJ1dHRvbnMgKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5GbGlja2l0eS5QcmV2TmV4dEJ1dHRvbiA9IFByZXZOZXh0QnV0dG9uO1xuXG5yZXR1cm4gUHJldk5leHRCdXR0b247XG5cbn0pKTtcbiIsIi8qIVxuICogY2xhc3NpZSB2MS4wLjFcbiAqIGNsYXNzIGhlbHBlciBmdW5jdGlvbnNcbiAqIGZyb20gYm9uem8gaHR0cHM6Ly9naXRodWIuY29tL2RlZC9ib256b1xuICogTUlUIGxpY2Vuc2VcbiAqIFxuICogY2xhc3NpZS5oYXMoIGVsZW0sICdteS1jbGFzcycgKSAtPiB0cnVlL2ZhbHNlXG4gKiBjbGFzc2llLmFkZCggZWxlbSwgJ215LW5ldy1jbGFzcycgKVxuICogY2xhc3NpZS5yZW1vdmUoIGVsZW0sICdteS11bndhbnRlZC1jbGFzcycgKVxuICogY2xhc3NpZS50b2dnbGUoIGVsZW0sICdteS1jbGFzcycgKVxuICovXG5cbi8qanNoaW50IGJyb3dzZXI6IHRydWUsIHN0cmljdDogdHJ1ZSwgdW5kZWY6IHRydWUsIHVudXNlZDogdHJ1ZSAqL1xuLypnbG9iYWwgZGVmaW5lOiBmYWxzZSwgbW9kdWxlOiBmYWxzZSAqL1xuXG4oIGZ1bmN0aW9uKCB3aW5kb3cgKSB7XG5cbid1c2Ugc3RyaWN0JztcblxuLy8gY2xhc3MgaGVscGVyIGZ1bmN0aW9ucyBmcm9tIGJvbnpvIGh0dHBzOi8vZ2l0aHViLmNvbS9kZWQvYm9uem9cblxuZnVuY3Rpb24gY2xhc3NSZWcoIGNsYXNzTmFtZSApIHtcbiAgcmV0dXJuIG5ldyBSZWdFeHAoXCIoXnxcXFxccyspXCIgKyBjbGFzc05hbWUgKyBcIihcXFxccyt8JClcIik7XG59XG5cbi8vIGNsYXNzTGlzdCBzdXBwb3J0IGZvciBjbGFzcyBtYW5hZ2VtZW50XG4vLyBhbHRobyB0byBiZSBmYWlyLCB0aGUgYXBpIHN1Y2tzIGJlY2F1c2UgaXQgd29uJ3QgYWNjZXB0IG11bHRpcGxlIGNsYXNzZXMgYXQgb25jZVxudmFyIGhhc0NsYXNzLCBhZGRDbGFzcywgcmVtb3ZlQ2xhc3M7XG5cbmlmICggJ2NsYXNzTGlzdCcgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICkge1xuICBoYXNDbGFzcyA9IGZ1bmN0aW9uKCBlbGVtLCBjICkge1xuICAgIHJldHVybiBlbGVtLmNsYXNzTGlzdC5jb250YWlucyggYyApO1xuICB9O1xuICBhZGRDbGFzcyA9IGZ1bmN0aW9uKCBlbGVtLCBjICkge1xuICAgIGVsZW0uY2xhc3NMaXN0LmFkZCggYyApO1xuICB9O1xuICByZW1vdmVDbGFzcyA9IGZ1bmN0aW9uKCBlbGVtLCBjICkge1xuICAgIGVsZW0uY2xhc3NMaXN0LnJlbW92ZSggYyApO1xuICB9O1xufVxuZWxzZSB7XG4gIGhhc0NsYXNzID0gZnVuY3Rpb24oIGVsZW0sIGMgKSB7XG4gICAgcmV0dXJuIGNsYXNzUmVnKCBjICkudGVzdCggZWxlbS5jbGFzc05hbWUgKTtcbiAgfTtcbiAgYWRkQ2xhc3MgPSBmdW5jdGlvbiggZWxlbSwgYyApIHtcbiAgICBpZiAoICFoYXNDbGFzcyggZWxlbSwgYyApICkge1xuICAgICAgZWxlbS5jbGFzc05hbWUgPSBlbGVtLmNsYXNzTmFtZSArICcgJyArIGM7XG4gICAgfVxuICB9O1xuICByZW1vdmVDbGFzcyA9IGZ1bmN0aW9uKCBlbGVtLCBjICkge1xuICAgIGVsZW0uY2xhc3NOYW1lID0gZWxlbS5jbGFzc05hbWUucmVwbGFjZSggY2xhc3NSZWcoIGMgKSwgJyAnICk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHRvZ2dsZUNsYXNzKCBlbGVtLCBjICkge1xuICB2YXIgZm4gPSBoYXNDbGFzcyggZWxlbSwgYyApID8gcmVtb3ZlQ2xhc3MgOiBhZGRDbGFzcztcbiAgZm4oIGVsZW0sIGMgKTtcbn1cblxudmFyIGNsYXNzaWUgPSB7XG4gIC8vIGZ1bGwgbmFtZXNcbiAgaGFzQ2xhc3M6IGhhc0NsYXNzLFxuICBhZGRDbGFzczogYWRkQ2xhc3MsXG4gIHJlbW92ZUNsYXNzOiByZW1vdmVDbGFzcyxcbiAgdG9nZ2xlQ2xhc3M6IHRvZ2dsZUNsYXNzLFxuICAvLyBzaG9ydCBuYW1lc1xuICBoYXM6IGhhc0NsYXNzLFxuICBhZGQ6IGFkZENsYXNzLFxuICByZW1vdmU6IHJlbW92ZUNsYXNzLFxuICB0b2dnbGU6IHRvZ2dsZUNsYXNzXG59O1xuXG4vLyB0cmFuc3BvcnRcbmlmICggdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAvLyBBTURcbiAgZGVmaW5lKCBjbGFzc2llICk7XG59IGVsc2UgaWYgKCB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgKSB7XG4gIC8vIENvbW1vbkpTXG4gIG1vZHVsZS5leHBvcnRzID0gY2xhc3NpZTtcbn0gZWxzZSB7XG4gIC8vIGJyb3dzZXIgZ2xvYmFsXG4gIHdpbmRvdy5jbGFzc2llID0gY2xhc3NpZTtcbn1cblxufSkoIHdpbmRvdyApO1xuIiwiLyohXG4gKiBnZXRTdHlsZVByb3BlcnR5IHYxLjAuNFxuICogb3JpZ2luYWwgYnkga2FuZ2F4XG4gKiBodHRwOi8vcGVyZmVjdGlvbmtpbGxzLmNvbS9mZWF0dXJlLXRlc3RpbmctY3NzLXByb3BlcnRpZXMvXG4gKiBNSVQgbGljZW5zZVxuICovXG5cbi8qanNoaW50IGJyb3dzZXI6IHRydWUsIHN0cmljdDogdHJ1ZSwgdW5kZWY6IHRydWUgKi9cbi8qZ2xvYmFsIGRlZmluZTogZmFsc2UsIGV4cG9ydHM6IGZhbHNlLCBtb2R1bGU6IGZhbHNlICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdyApIHtcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgcHJlZml4ZXMgPSAnV2Via2l0IE1veiBtcyBNcyBPJy5zcGxpdCgnICcpO1xudmFyIGRvY0VsZW1TdHlsZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZTtcblxuZnVuY3Rpb24gZ2V0U3R5bGVQcm9wZXJ0eSggcHJvcE5hbWUgKSB7XG4gIGlmICggIXByb3BOYW1lICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIHRlc3Qgc3RhbmRhcmQgcHJvcGVydHkgZmlyc3RcbiAgaWYgKCB0eXBlb2YgZG9jRWxlbVN0eWxlWyBwcm9wTmFtZSBdID09PSAnc3RyaW5nJyApIHtcbiAgICByZXR1cm4gcHJvcE5hbWU7XG4gIH1cblxuICAvLyBjYXBpdGFsaXplXG4gIHByb3BOYW1lID0gcHJvcE5hbWUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwcm9wTmFtZS5zbGljZSgxKTtcblxuICAvLyB0ZXN0IHZlbmRvciBzcGVjaWZpYyBwcm9wZXJ0aWVzXG4gIHZhciBwcmVmaXhlZDtcbiAgZm9yICggdmFyIGk9MCwgbGVuID0gcHJlZml4ZXMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgcHJlZml4ZWQgPSBwcmVmaXhlc1tpXSArIHByb3BOYW1lO1xuICAgIGlmICggdHlwZW9mIGRvY0VsZW1TdHlsZVsgcHJlZml4ZWQgXSA9PT0gJ3N0cmluZycgKSB7XG4gICAgICByZXR1cm4gcHJlZml4ZWQ7XG4gICAgfVxuICB9XG59XG5cbi8vIHRyYW5zcG9ydFxuaWYgKCB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gIC8vIEFNRFxuICBkZWZpbmUoIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBnZXRTdHlsZVByb3BlcnR5O1xuICB9KTtcbn0gZWxzZSBpZiAoIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyApIHtcbiAgLy8gQ29tbW9uSlMgZm9yIENvbXBvbmVudFxuICBtb2R1bGUuZXhwb3J0cyA9IGdldFN0eWxlUHJvcGVydHk7XG59IGVsc2Uge1xuICAvLyBicm93c2VyIGdsb2JhbFxuICB3aW5kb3cuZ2V0U3R5bGVQcm9wZXJ0eSA9IGdldFN0eWxlUHJvcGVydHk7XG59XG5cbn0pKCB3aW5kb3cgKTtcbiIsIi8qKlxuICogbWF0Y2hlc1NlbGVjdG9yIHYxLjAuM1xuICogbWF0Y2hlc1NlbGVjdG9yKCBlbGVtZW50LCAnLnNlbGVjdG9yJyApXG4gKiBNSVQgbGljZW5zZVxuICovXG5cbi8qanNoaW50IGJyb3dzZXI6IHRydWUsIHN0cmljdDogdHJ1ZSwgdW5kZWY6IHRydWUsIHVudXNlZDogdHJ1ZSAqL1xuLypnbG9iYWwgZGVmaW5lOiBmYWxzZSwgbW9kdWxlOiBmYWxzZSAqL1xuXG4oIGZ1bmN0aW9uKCBFbGVtUHJvdG8gKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBtYXRjaGVzTWV0aG9kID0gKCBmdW5jdGlvbigpIHtcbiAgICAvLyBjaGVjayBmb3IgdGhlIHN0YW5kYXJkIG1ldGhvZCBuYW1lIGZpcnN0XG4gICAgaWYgKCBFbGVtUHJvdG8ubWF0Y2hlcyApIHtcbiAgICAgIHJldHVybiAnbWF0Y2hlcyc7XG4gICAgfVxuICAgIC8vIGNoZWNrIHVuLXByZWZpeGVkXG4gICAgaWYgKCBFbGVtUHJvdG8ubWF0Y2hlc1NlbGVjdG9yICkge1xuICAgICAgcmV0dXJuICdtYXRjaGVzU2VsZWN0b3InO1xuICAgIH1cbiAgICAvLyBjaGVjayB2ZW5kb3IgcHJlZml4ZXNcbiAgICB2YXIgcHJlZml4ZXMgPSBbICd3ZWJraXQnLCAnbW96JywgJ21zJywgJ28nIF07XG5cbiAgICBmb3IgKCB2YXIgaT0wLCBsZW4gPSBwcmVmaXhlcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgIHZhciBwcmVmaXggPSBwcmVmaXhlc1tpXTtcbiAgICAgIHZhciBtZXRob2QgPSBwcmVmaXggKyAnTWF0Y2hlc1NlbGVjdG9yJztcbiAgICAgIGlmICggRWxlbVByb3RvWyBtZXRob2QgXSApIHtcbiAgICAgICAgcmV0dXJuIG1ldGhvZDtcbiAgICAgIH1cbiAgICB9XG4gIH0pKCk7XG5cbiAgLy8gLS0tLS0gbWF0Y2ggLS0tLS0gLy9cblxuICBmdW5jdGlvbiBtYXRjaCggZWxlbSwgc2VsZWN0b3IgKSB7XG4gICAgcmV0dXJuIGVsZW1bIG1hdGNoZXNNZXRob2QgXSggc2VsZWN0b3IgKTtcbiAgfVxuXG4gIC8vIC0tLS0tIGFwcGVuZFRvRnJhZ21lbnQgLS0tLS0gLy9cblxuICBmdW5jdGlvbiBjaGVja1BhcmVudCggZWxlbSApIHtcbiAgICAvLyBub3QgbmVlZGVkIGlmIGFscmVhZHkgaGFzIHBhcmVudFxuICAgIGlmICggZWxlbS5wYXJlbnROb2RlICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQoIGVsZW0gKTtcbiAgfVxuXG4gIC8vIC0tLS0tIHF1ZXJ5IC0tLS0tIC8vXG5cbiAgLy8gZmFsbCBiYWNrIHRvIHVzaW5nIFFTQVxuICAvLyB0aHggQGpvbmF0aGFudG5lYWwgaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vMzA2Mjk1NVxuICBmdW5jdGlvbiBxdWVyeSggZWxlbSwgc2VsZWN0b3IgKSB7XG4gICAgLy8gYXBwZW5kIHRvIGZyYWdtZW50IGlmIG5vIHBhcmVudFxuICAgIGNoZWNrUGFyZW50KCBlbGVtICk7XG5cbiAgICAvLyBtYXRjaCBlbGVtIHdpdGggYWxsIHNlbGVjdGVkIGVsZW1zIG9mIHBhcmVudFxuICAgIHZhciBlbGVtcyA9IGVsZW0ucGFyZW50Tm9kZS5xdWVyeVNlbGVjdG9yQWxsKCBzZWxlY3RvciApO1xuICAgIGZvciAoIHZhciBpPTAsIGxlbiA9IGVsZW1zLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgLy8gcmV0dXJuIHRydWUgaWYgbWF0Y2hcbiAgICAgIGlmICggZWxlbXNbaV0gPT09IGVsZW0gKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBvdGhlcndpc2UgcmV0dXJuIGZhbHNlXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gLS0tLS0gbWF0Y2hDaGlsZCAtLS0tLSAvL1xuXG4gIGZ1bmN0aW9uIG1hdGNoQ2hpbGQoIGVsZW0sIHNlbGVjdG9yICkge1xuICAgIGNoZWNrUGFyZW50KCBlbGVtICk7XG4gICAgcmV0dXJuIG1hdGNoKCBlbGVtLCBzZWxlY3RvciApO1xuICB9XG5cbiAgLy8gLS0tLS0gbWF0Y2hlc1NlbGVjdG9yIC0tLS0tIC8vXG5cbiAgdmFyIG1hdGNoZXNTZWxlY3RvcjtcblxuICBpZiAoIG1hdGNoZXNNZXRob2QgKSB7XG4gICAgLy8gSUU5IHN1cHBvcnRzIG1hdGNoZXNTZWxlY3RvciwgYnV0IGRvZXNuJ3Qgd29yayBvbiBvcnBoYW5lZCBlbGVtc1xuICAgIC8vIGNoZWNrIGZvciB0aGF0XG4gICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHZhciBzdXBwb3J0c09ycGhhbnMgPSBtYXRjaCggZGl2LCAnZGl2JyApO1xuICAgIG1hdGNoZXNTZWxlY3RvciA9IHN1cHBvcnRzT3JwaGFucyA/IG1hdGNoIDogbWF0Y2hDaGlsZDtcbiAgfSBlbHNlIHtcbiAgICBtYXRjaGVzU2VsZWN0b3IgPSBxdWVyeTtcbiAgfVxuXG4gIC8vIHRyYW5zcG9ydFxuICBpZiAoIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG1hdGNoZXNTZWxlY3RvcjtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICkge1xuICAgIG1vZHVsZS5leHBvcnRzID0gbWF0Y2hlc1NlbGVjdG9yO1xuICB9XG4gIGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93Lm1hdGNoZXNTZWxlY3RvciA9IG1hdGNoZXNTZWxlY3RvcjtcbiAgfVxuXG59KSggRWxlbWVudC5wcm90b3R5cGUgKTtcbiIsIi8qIVxuICogZG9jUmVhZHkgdjEuMC4zXG4gKiBDcm9zcyBicm93c2VyIERPTUNvbnRlbnRMb2FkZWQgZXZlbnQgZW1pdHRlclxuICogTUlUIGxpY2Vuc2VcbiAqL1xuXG4vKmpzaGludCBicm93c2VyOiB0cnVlLCBzdHJpY3Q6IHRydWUsIHVuZGVmOiB0cnVlLCB1bnVzZWQ6IHRydWUqL1xuLypnbG9iYWwgZGVmaW5lOiBmYWxzZSwgcmVxdWlyZTogZmFsc2UsIG1vZHVsZTogZmFsc2UgKi9cblxuKCBmdW5jdGlvbiggd2luZG93ICkge1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBkb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudDtcbi8vIGNvbGxlY3Rpb24gb2YgZnVuY3Rpb25zIHRvIGJlIHRyaWdnZXJlZCBvbiByZWFkeVxudmFyIHF1ZXVlID0gW107XG5cbmZ1bmN0aW9uIGRvY1JlYWR5KCBmbiApIHtcbiAgLy8gdGhyb3cgb3V0IG5vbi1mdW5jdGlvbnNcbiAgaWYgKCB0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKCBkb2NSZWFkeS5pc1JlYWR5ICkge1xuICAgIC8vIHJlYWR5IG5vdywgaGl0IGl0XG4gICAgZm4oKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBxdWV1ZSBmdW5jdGlvbiB3aGVuIHJlYWR5XG4gICAgcXVldWUucHVzaCggZm4gKTtcbiAgfVxufVxuXG5kb2NSZWFkeS5pc1JlYWR5ID0gZmFsc2U7XG5cbi8vIHRyaWdnZXJlZCBvbiB2YXJpb3VzIGRvYyByZWFkeSBldmVudHNcbmZ1bmN0aW9uIGluaXQoIGV2ZW50ICkge1xuICAvLyBiYWlsIGlmIElFOCBkb2N1bWVudCBpcyBub3QgcmVhZHkganVzdCB5ZXRcbiAgdmFyIGlzSUU4Tm90UmVhZHkgPSBldmVudC50eXBlID09PSAncmVhZHlzdGF0ZWNoYW5nZScgJiYgZG9jdW1lbnQucmVhZHlTdGF0ZSAhPT0gJ2NvbXBsZXRlJztcbiAgaWYgKCBkb2NSZWFkeS5pc1JlYWR5IHx8IGlzSUU4Tm90UmVhZHkgKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGRvY1JlYWR5LmlzUmVhZHkgPSB0cnVlO1xuXG4gIC8vIHByb2Nlc3MgcXVldWVcbiAgZm9yICggdmFyIGk9MCwgbGVuID0gcXVldWUubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgdmFyIGZuID0gcXVldWVbaV07XG4gICAgZm4oKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZWZpbmVEb2NSZWFkeSggZXZlbnRpZSApIHtcbiAgZXZlbnRpZS5iaW5kKCBkb2N1bWVudCwgJ0RPTUNvbnRlbnRMb2FkZWQnLCBpbml0ICk7XG4gIGV2ZW50aWUuYmluZCggZG9jdW1lbnQsICdyZWFkeXN0YXRlY2hhbmdlJywgaW5pdCApO1xuICBldmVudGllLmJpbmQoIHdpbmRvdywgJ2xvYWQnLCBpbml0ICk7XG5cbiAgcmV0dXJuIGRvY1JlYWR5O1xufVxuXG4vLyB0cmFuc3BvcnRcbmlmICggdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAvLyBBTURcbiAgLy8gaWYgUmVxdWlyZUpTLCB0aGVuIGRvYyBpcyBhbHJlYWR5IHJlYWR5XG4gIGRvY1JlYWR5LmlzUmVhZHkgPSB0eXBlb2YgcmVxdWlyZWpzID09PSAnZnVuY3Rpb24nO1xuICBkZWZpbmUoIFsgJ2V2ZW50aWUvZXZlbnRpZScgXSwgZGVmaW5lRG9jUmVhZHkgKTtcbn0gZWxzZSBpZiAoIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyApIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBkZWZpbmVEb2NSZWFkeSggcmVxdWlyZSgnZXZlbnRpZScpICk7XG59IGVsc2Uge1xuICAvLyBicm93c2VyIGdsb2JhbFxuICB3aW5kb3cuZG9jUmVhZHkgPSBkZWZpbmVEb2NSZWFkeSggd2luZG93LmV2ZW50aWUgKTtcbn1cblxufSkoIHdpbmRvdyApO1xuIiwiLyoqXG4gKiBGaXp6eSBVSSB1dGlscyB2MS4wLjFcbiAqIE1JVCBsaWNlbnNlXG4gKi9cblxuLypqc2hpbnQgYnJvd3NlcjogdHJ1ZSwgdW5kZWY6IHRydWUsIHVudXNlZDogdHJ1ZSwgc3RyaWN0OiB0cnVlICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdywgZmFjdG9yeSApIHtcbiAgLypnbG9iYWwgZGVmaW5lOiBmYWxzZSwgbW9kdWxlOiBmYWxzZSwgcmVxdWlyZTogZmFsc2UgKi9cbiAgJ3VzZSBzdHJpY3QnO1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICBpZiAoIHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSggW1xuICAgICAgJ2RvYy1yZWFkeS9kb2MtcmVhZHknLFxuICAgICAgJ21hdGNoZXMtc2VsZWN0b3IvbWF0Y2hlcy1zZWxlY3RvcidcbiAgICBdLCBmdW5jdGlvbiggZG9jUmVhZHksIG1hdGNoZXNTZWxlY3RvciApIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KCB3aW5kb3csIGRvY1JlYWR5LCBtYXRjaGVzU2VsZWN0b3IgKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIGV4cG9ydHMgPT0gJ29iamVjdCcgKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICByZXF1aXJlKCdkb2MtcmVhZHknKSxcbiAgICAgIHJlcXVpcmUoJ2Rlc2FuZHJvLW1hdGNoZXMtc2VsZWN0b3InKVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cuZml6enlVSVV0aWxzID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHdpbmRvdy5kb2NSZWFkeSxcbiAgICAgIHdpbmRvdy5tYXRjaGVzU2VsZWN0b3JcbiAgICApO1xuICB9XG5cbn0oIHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSggd2luZG93LCBkb2NSZWFkeSwgbWF0Y2hlc1NlbGVjdG9yICkge1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciB1dGlscyA9IHt9O1xuXG4vLyAtLS0tLSBleHRlbmQgLS0tLS0gLy9cblxuLy8gZXh0ZW5kcyBvYmplY3RzXG51dGlscy5leHRlbmQgPSBmdW5jdGlvbiggYSwgYiApIHtcbiAgZm9yICggdmFyIHByb3AgaW4gYiApIHtcbiAgICBhWyBwcm9wIF0gPSBiWyBwcm9wIF07XG4gIH1cbiAgcmV0dXJuIGE7XG59O1xuXG4vLyAtLS0tLSBtb2R1bG8gLS0tLS0gLy9cblxudXRpbHMubW9kdWxvID0gZnVuY3Rpb24oIG51bSwgZGl2ICkge1xuICByZXR1cm4gKCAoIG51bSAlIGRpdiApICsgZGl2ICkgJSBkaXY7XG59O1xuXG4vLyAtLS0tLSBpc0FycmF5IC0tLS0tIC8vXG4gIFxudmFyIG9ialRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbnV0aWxzLmlzQXJyYXkgPSBmdW5jdGlvbiggb2JqICkge1xuICByZXR1cm4gb2JqVG9TdHJpbmcuY2FsbCggb2JqICkgPT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG5cbi8vIC0tLS0tIG1ha2VBcnJheSAtLS0tLSAvL1xuXG4vLyB0dXJuIGVsZW1lbnQgb3Igbm9kZUxpc3QgaW50byBhbiBhcnJheVxudXRpbHMubWFrZUFycmF5ID0gZnVuY3Rpb24oIG9iaiApIHtcbiAgdmFyIGFyeSA9IFtdO1xuICBpZiAoIHV0aWxzLmlzQXJyYXkoIG9iaiApICkge1xuICAgIC8vIHVzZSBvYmplY3QgaWYgYWxyZWFkeSBhbiBhcnJheVxuICAgIGFyeSA9IG9iajtcbiAgfSBlbHNlIGlmICggb2JqICYmIHR5cGVvZiBvYmoubGVuZ3RoID09ICdudW1iZXInICkge1xuICAgIC8vIGNvbnZlcnQgbm9kZUxpc3QgdG8gYXJyYXlcbiAgICBmb3IgKCB2YXIgaT0wLCBsZW4gPSBvYmoubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICBhcnkucHVzaCggb2JqW2ldICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIGFycmF5IG9mIHNpbmdsZSBpbmRleFxuICAgIGFyeS5wdXNoKCBvYmogKTtcbiAgfVxuICByZXR1cm4gYXJ5O1xufTtcblxuLy8gLS0tLS0gaW5kZXhPZiAtLS0tLSAvL1xuXG4vLyBpbmRleCBvZiBoZWxwZXIgY2F1c2UgSUU4XG51dGlscy5pbmRleE9mID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2YgPyBmdW5jdGlvbiggYXJ5LCBvYmogKSB7XG4gICAgcmV0dXJuIGFyeS5pbmRleE9mKCBvYmogKTtcbiAgfSA6IGZ1bmN0aW9uKCBhcnksIG9iaiApIHtcbiAgICBmb3IgKCB2YXIgaT0wLCBsZW4gPSBhcnkubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICBpZiAoIGFyeVtpXSA9PT0gb2JqICkge1xuICAgICAgICByZXR1cm4gaTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xO1xuICB9O1xuXG4vLyAtLS0tLSByZW1vdmVGcm9tIC0tLS0tIC8vXG5cbnV0aWxzLnJlbW92ZUZyb20gPSBmdW5jdGlvbiggYXJ5LCBvYmogKSB7XG4gIHZhciBpbmRleCA9IHV0aWxzLmluZGV4T2YoIGFyeSwgb2JqICk7XG4gIGlmICggaW5kZXggIT0gLTEgKSB7XG4gICAgYXJ5LnNwbGljZSggaW5kZXgsIDEgKTtcbiAgfVxufTtcblxuLy8gLS0tLS0gaXNFbGVtZW50IC0tLS0tIC8vXG5cbi8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM4NDM4MC8xODIxODNcbnV0aWxzLmlzRWxlbWVudCA9ICggdHlwZW9mIEhUTUxFbGVtZW50ID09ICdmdW5jdGlvbicgfHwgdHlwZW9mIEhUTUxFbGVtZW50ID09ICdvYmplY3QnICkgP1xuICBmdW5jdGlvbiBpc0VsZW1lbnRET00yKCBvYmogKSB7XG4gICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIEhUTUxFbGVtZW50O1xuICB9IDpcbiAgZnVuY3Rpb24gaXNFbGVtZW50UXVpcmt5KCBvYmogKSB7XG4gICAgcmV0dXJuIG9iaiAmJiB0eXBlb2Ygb2JqID09ICdvYmplY3QnICYmXG4gICAgICBvYmoubm9kZVR5cGUgPT0gMSAmJiB0eXBlb2Ygb2JqLm5vZGVOYW1lID09ICdzdHJpbmcnO1xuICB9O1xuXG4vLyAtLS0tLSBzZXRUZXh0IC0tLS0tIC8vXG5cbnV0aWxzLnNldFRleHQgPSAoIGZ1bmN0aW9uKCkge1xuICB2YXIgc2V0VGV4dFByb3BlcnR5O1xuICBmdW5jdGlvbiBzZXRUZXh0KCBlbGVtLCB0ZXh0ICkge1xuICAgIC8vIG9ubHkgY2hlY2sgc2V0VGV4dFByb3BlcnR5IG9uY2VcbiAgICBzZXRUZXh0UHJvcGVydHkgPSBzZXRUZXh0UHJvcGVydHkgfHwgKCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQudGV4dENvbnRlbnQgIT09IHVuZGVmaW5lZCA/ICd0ZXh0Q29udGVudCcgOiAnaW5uZXJUZXh0JyApO1xuICAgIGVsZW1bIHNldFRleHRQcm9wZXJ0eSBdID0gdGV4dDtcbiAgfVxuICByZXR1cm4gc2V0VGV4dDtcbn0pKCk7XG5cbi8vIC0tLS0tIGdldFBhcmVudCAtLS0tLSAvL1xuXG51dGlscy5nZXRQYXJlbnQgPSBmdW5jdGlvbiggZWxlbSwgc2VsZWN0b3IgKSB7XG4gIHdoaWxlICggZWxlbSAhPSBkb2N1bWVudC5ib2R5ICkge1xuICAgIGVsZW0gPSBlbGVtLnBhcmVudE5vZGU7XG4gICAgaWYgKCBtYXRjaGVzU2VsZWN0b3IoIGVsZW0sIHNlbGVjdG9yICkgKSB7XG4gICAgICByZXR1cm4gZWxlbTtcbiAgICB9XG4gIH1cbn07XG5cbi8vIC0tLS0tIGdldFF1ZXJ5RWxlbWVudCAtLS0tLSAvL1xuXG4vLyB1c2UgZWxlbWVudCBhcyBzZWxlY3RvciBzdHJpbmdcbnV0aWxzLmdldFF1ZXJ5RWxlbWVudCA9IGZ1bmN0aW9uKCBlbGVtICkge1xuICBpZiAoIHR5cGVvZiBlbGVtID09ICdzdHJpbmcnICkge1xuICAgIHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCBlbGVtICk7XG4gIH1cbiAgcmV0dXJuIGVsZW07XG59O1xuXG4vLyAtLS0tLSBoYW5kbGVFdmVudCAtLS0tLSAvL1xuXG4vLyBlbmFibGUgLm9udHlwZSB0byB0cmlnZ2VyIGZyb20gLmFkZEV2ZW50TGlzdGVuZXIoIGVsZW0sICd0eXBlJyApXG51dGlscy5oYW5kbGVFdmVudCA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgdmFyIG1ldGhvZCA9ICdvbicgKyBldmVudC50eXBlO1xuICBpZiAoIHRoaXNbIG1ldGhvZCBdICkge1xuICAgIHRoaXNbIG1ldGhvZCBdKCBldmVudCApO1xuICB9XG59O1xuXG4vLyAtLS0tLSBmaWx0ZXJGaW5kRWxlbWVudHMgLS0tLS0gLy9cblxudXRpbHMuZmlsdGVyRmluZEVsZW1lbnRzID0gZnVuY3Rpb24oIGVsZW1zLCBzZWxlY3RvciApIHtcbiAgLy8gbWFrZSBhcnJheSBvZiBlbGVtc1xuICBlbGVtcyA9IHV0aWxzLm1ha2VBcnJheSggZWxlbXMgKTtcbiAgdmFyIGZmRWxlbXMgPSBbXTtcblxuICBmb3IgKCB2YXIgaT0wLCBsZW4gPSBlbGVtcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICB2YXIgZWxlbSA9IGVsZW1zW2ldO1xuICAgIC8vIGNoZWNrIHRoYXQgZWxlbSBpcyBhbiBhY3R1YWwgZWxlbWVudFxuICAgIGlmICggIXV0aWxzLmlzRWxlbWVudCggZWxlbSApICkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIC8vIGZpbHRlciAmIGZpbmQgaXRlbXMgaWYgd2UgaGF2ZSBhIHNlbGVjdG9yXG4gICAgaWYgKCBzZWxlY3RvciApIHtcbiAgICAgIC8vIGZpbHRlciBzaWJsaW5nc1xuICAgICAgaWYgKCBtYXRjaGVzU2VsZWN0b3IoIGVsZW0sIHNlbGVjdG9yICkgKSB7XG4gICAgICAgIGZmRWxlbXMucHVzaCggZWxlbSApO1xuICAgICAgfVxuICAgICAgLy8gZmluZCBjaGlsZHJlblxuICAgICAgdmFyIGNoaWxkRWxlbXMgPSBlbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoIHNlbGVjdG9yICk7XG4gICAgICAvLyBjb25jYXQgY2hpbGRFbGVtcyB0byBmaWx0ZXJGb3VuZCBhcnJheVxuICAgICAgZm9yICggdmFyIGo9MCwgakxlbiA9IGNoaWxkRWxlbXMubGVuZ3RoOyBqIDwgakxlbjsgaisrICkge1xuICAgICAgICBmZkVsZW1zLnB1c2goIGNoaWxkRWxlbXNbal0gKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZmZFbGVtcy5wdXNoKCBlbGVtICk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZmRWxlbXM7XG59O1xuXG4vLyAtLS0tLSBkZWJvdW5jZU1ldGhvZCAtLS0tLSAvL1xuXG51dGlscy5kZWJvdW5jZU1ldGhvZCA9IGZ1bmN0aW9uKCBfY2xhc3MsIG1ldGhvZE5hbWUsIHRocmVzaG9sZCApIHtcbiAgLy8gb3JpZ2luYWwgbWV0aG9kXG4gIHZhciBtZXRob2QgPSBfY2xhc3MucHJvdG90eXBlWyBtZXRob2ROYW1lIF07XG4gIHZhciB0aW1lb3V0TmFtZSA9IG1ldGhvZE5hbWUgKyAnVGltZW91dCc7XG5cbiAgX2NsYXNzLnByb3RvdHlwZVsgbWV0aG9kTmFtZSBdID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRpbWVvdXQgPSB0aGlzWyB0aW1lb3V0TmFtZSBdO1xuICAgIGlmICggdGltZW91dCApIHtcbiAgICAgIGNsZWFyVGltZW91dCggdGltZW91dCApO1xuICAgIH1cbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcblxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdGhpc1sgdGltZW91dE5hbWUgXSA9IHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuICAgICAgbWV0aG9kLmFwcGx5KCBfdGhpcywgYXJncyApO1xuICAgICAgZGVsZXRlIF90aGlzWyB0aW1lb3V0TmFtZSBdO1xuICAgIH0sIHRocmVzaG9sZCB8fCAxMDAgKTtcbiAgfTtcbn07XG5cbi8vIC0tLS0tIGh0bWxJbml0IC0tLS0tIC8vXG5cbi8vIGh0dHA6Ly9qYW1lc3JvYmVydHMubmFtZS9ibG9nLzIwMTAvMDIvMjIvc3RyaW5nLWZ1bmN0aW9ucy1mb3ItamF2YXNjcmlwdC10cmltLXRvLWNhbWVsLWNhc2UtdG8tZGFzaGVkLWFuZC10by11bmRlcnNjb3JlL1xudXRpbHMudG9EYXNoZWQgPSBmdW5jdGlvbiggc3RyICkge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoIC8oLikoW0EtWl0pL2csIGZ1bmN0aW9uKCBtYXRjaCwgJDEsICQyICkge1xuICAgIHJldHVybiAkMSArICctJyArICQyO1xuICB9KS50b0xvd2VyQ2FzZSgpO1xufTtcblxudmFyIGNvbnNvbGUgPSB3aW5kb3cuY29uc29sZTtcbi8qKlxuICogYWxsb3cgdXNlciB0byBpbml0aWFsaXplIGNsYXNzZXMgdmlhIC5qcy1uYW1lc3BhY2UgY2xhc3NcbiAqIGh0bWxJbml0KCBXaWRnZXQsICd3aWRnZXROYW1lJyApXG4gKiBvcHRpb25zIGFyZSBwYXJzZWQgZnJvbSBkYXRhLW5hbWVzcGFjZS1vcHRpb24gYXR0cmlidXRlXG4gKi9cbnV0aWxzLmh0bWxJbml0ID0gZnVuY3Rpb24oIFdpZGdldENsYXNzLCBuYW1lc3BhY2UgKSB7XG4gIGRvY1JlYWR5KCBmdW5jdGlvbigpIHtcbiAgICB2YXIgZGFzaGVkTmFtZXNwYWNlID0gdXRpbHMudG9EYXNoZWQoIG5hbWVzcGFjZSApO1xuICAgIHZhciBlbGVtcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICcuanMtJyArIGRhc2hlZE5hbWVzcGFjZSApO1xuICAgIHZhciBkYXRhQXR0ciA9ICdkYXRhLScgKyBkYXNoZWROYW1lc3BhY2UgKyAnLW9wdGlvbnMnO1xuXG4gICAgZm9yICggdmFyIGk9MCwgbGVuID0gZWxlbXMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICB2YXIgZWxlbSA9IGVsZW1zW2ldO1xuICAgICAgdmFyIGF0dHIgPSBlbGVtLmdldEF0dHJpYnV0ZSggZGF0YUF0dHIgKTtcbiAgICAgIHZhciBvcHRpb25zO1xuICAgICAgdHJ5IHtcbiAgICAgICAgb3B0aW9ucyA9IGF0dHIgJiYgSlNPTi5wYXJzZSggYXR0ciApO1xuICAgICAgfSBjYXRjaCAoIGVycm9yICkge1xuICAgICAgICAvLyBsb2cgZXJyb3IsIGRvIG5vdCBpbml0aWFsaXplXG4gICAgICAgIGlmICggY29uc29sZSApIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCAnRXJyb3IgcGFyc2luZyAnICsgZGF0YUF0dHIgKyAnIG9uICcgK1xuICAgICAgICAgICAgZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpICsgKCBlbGVtLmlkID8gJyMnICsgZWxlbS5pZCA6ICcnICkgKyAnOiAnICtcbiAgICAgICAgICAgIGVycm9yICk7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvLyBpbml0aWFsaXplXG4gICAgICB2YXIgaW5zdGFuY2UgPSBuZXcgV2lkZ2V0Q2xhc3MoIGVsZW0sIG9wdGlvbnMgKTtcbiAgICAgIC8vIG1ha2UgYXZhaWxhYmxlIHZpYSAkKCkuZGF0YSgnbGF5b3V0bmFtZScpXG4gICAgICB2YXIgalF1ZXJ5ID0gd2luZG93LmpRdWVyeTtcbiAgICAgIGlmICggalF1ZXJ5ICkge1xuICAgICAgICBqUXVlcnkuZGF0YSggZWxlbSwgbmFtZXNwYWNlLCBpbnN0YW5jZSApO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59O1xuXG4vLyAtLS0tLSAgLS0tLS0gLy9cblxucmV0dXJuIHV0aWxzO1xuXG59KSk7XG4iLCIvKiFcbiAqIGdldFNpemUgdjEuMi4yXG4gKiBtZWFzdXJlIHNpemUgb2YgZWxlbWVudHNcbiAqIE1JVCBsaWNlbnNlXG4gKi9cblxuLypqc2hpbnQgYnJvd3NlcjogdHJ1ZSwgc3RyaWN0OiB0cnVlLCB1bmRlZjogdHJ1ZSwgdW51c2VkOiB0cnVlICovXG4vKmdsb2JhbCBkZWZpbmU6IGZhbHNlLCBleHBvcnRzOiBmYWxzZSwgcmVxdWlyZTogZmFsc2UsIG1vZHVsZTogZmFsc2UsIGNvbnNvbGU6IGZhbHNlICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdywgdW5kZWZpbmVkICkge1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGhlbHBlcnMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuLy8gZ2V0IGEgbnVtYmVyIGZyb20gYSBzdHJpbmcsIG5vdCBhIHBlcmNlbnRhZ2VcbmZ1bmN0aW9uIGdldFN0eWxlU2l6ZSggdmFsdWUgKSB7XG4gIHZhciBudW0gPSBwYXJzZUZsb2F0KCB2YWx1ZSApO1xuICAvLyBub3QgYSBwZXJjZW50IGxpa2UgJzEwMCUnLCBhbmQgYSBudW1iZXJcbiAgdmFyIGlzVmFsaWQgPSB2YWx1ZS5pbmRleE9mKCclJykgPT09IC0xICYmICFpc05hTiggbnVtICk7XG4gIHJldHVybiBpc1ZhbGlkICYmIG51bTtcbn1cblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnZhciBsb2dFcnJvciA9IHR5cGVvZiBjb25zb2xlID09PSAndW5kZWZpbmVkJyA/IG5vb3AgOlxuICBmdW5jdGlvbiggbWVzc2FnZSApIHtcbiAgICBjb25zb2xlLmVycm9yKCBtZXNzYWdlICk7XG4gIH07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG1lYXN1cmVtZW50cyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG52YXIgbWVhc3VyZW1lbnRzID0gW1xuICAncGFkZGluZ0xlZnQnLFxuICAncGFkZGluZ1JpZ2h0JyxcbiAgJ3BhZGRpbmdUb3AnLFxuICAncGFkZGluZ0JvdHRvbScsXG4gICdtYXJnaW5MZWZ0JyxcbiAgJ21hcmdpblJpZ2h0JyxcbiAgJ21hcmdpblRvcCcsXG4gICdtYXJnaW5Cb3R0b20nLFxuICAnYm9yZGVyTGVmdFdpZHRoJyxcbiAgJ2JvcmRlclJpZ2h0V2lkdGgnLFxuICAnYm9yZGVyVG9wV2lkdGgnLFxuICAnYm9yZGVyQm90dG9tV2lkdGgnXG5dO1xuXG5mdW5jdGlvbiBnZXRaZXJvU2l6ZSgpIHtcbiAgdmFyIHNpemUgPSB7XG4gICAgd2lkdGg6IDAsXG4gICAgaGVpZ2h0OiAwLFxuICAgIGlubmVyV2lkdGg6IDAsXG4gICAgaW5uZXJIZWlnaHQ6IDAsXG4gICAgb3V0ZXJXaWR0aDogMCxcbiAgICBvdXRlckhlaWdodDogMFxuICB9O1xuICBmb3IgKCB2YXIgaT0wLCBsZW4gPSBtZWFzdXJlbWVudHMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgdmFyIG1lYXN1cmVtZW50ID0gbWVhc3VyZW1lbnRzW2ldO1xuICAgIHNpemVbIG1lYXN1cmVtZW50IF0gPSAwO1xuICB9XG4gIHJldHVybiBzaXplO1xufVxuXG5cblxuZnVuY3Rpb24gZGVmaW5lR2V0U2l6ZSggZ2V0U3R5bGVQcm9wZXJ0eSApIHtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gc2V0dXAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxudmFyIGlzU2V0dXAgPSBmYWxzZTtcblxudmFyIGdldFN0eWxlLCBib3hTaXppbmdQcm9wLCBpc0JveFNpemVPdXRlcjtcblxuLyoqXG4gKiBzZXR1cCB2YXJzIGFuZCBmdW5jdGlvbnNcbiAqIGRvIGl0IG9uIGluaXRpYWwgZ2V0U2l6ZSgpLCByYXRoZXIgdGhhbiBvbiBzY3JpcHQgbG9hZFxuICogRm9yIEZpcmVmb3ggYnVnIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTU0ODM5N1xuICovXG5mdW5jdGlvbiBzZXR1cCgpIHtcbiAgLy8gc2V0dXAgb25jZVxuICBpZiAoIGlzU2V0dXAgKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlzU2V0dXAgPSB0cnVlO1xuXG4gIHZhciBnZXRDb21wdXRlZFN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGU7XG4gIGdldFN0eWxlID0gKCBmdW5jdGlvbigpIHtcbiAgICB2YXIgZ2V0U3R5bGVGbiA9IGdldENvbXB1dGVkU3R5bGUgP1xuICAgICAgZnVuY3Rpb24oIGVsZW0gKSB7XG4gICAgICAgIHJldHVybiBnZXRDb21wdXRlZFN0eWxlKCBlbGVtLCBudWxsICk7XG4gICAgICB9IDpcbiAgICAgIGZ1bmN0aW9uKCBlbGVtICkge1xuICAgICAgICByZXR1cm4gZWxlbS5jdXJyZW50U3R5bGU7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gZnVuY3Rpb24gZ2V0U3R5bGUoIGVsZW0gKSB7XG4gICAgICAgIHZhciBzdHlsZSA9IGdldFN0eWxlRm4oIGVsZW0gKTtcbiAgICAgICAgaWYgKCAhc3R5bGUgKSB7XG4gICAgICAgICAgbG9nRXJyb3IoICdTdHlsZSByZXR1cm5lZCAnICsgc3R5bGUgK1xuICAgICAgICAgICAgJy4gQXJlIHlvdSBydW5uaW5nIHRoaXMgY29kZSBpbiBhIGhpZGRlbiBpZnJhbWUgb24gRmlyZWZveD8gJyArXG4gICAgICAgICAgICAnU2VlIGh0dHA6Ly9iaXQubHkvZ2V0c2l6ZWJ1ZzEnICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0eWxlO1xuICAgICAgfTtcbiAgfSkoKTtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBib3ggc2l6aW5nIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgYm94U2l6aW5nUHJvcCA9IGdldFN0eWxlUHJvcGVydHkoJ2JveFNpemluZycpO1xuXG4gIC8qKlxuICAgKiBXZWJLaXQgbWVhc3VyZXMgdGhlIG91dGVyLXdpZHRoIG9uIHN0eWxlLndpZHRoIG9uIGJvcmRlci1ib3ggZWxlbXNcbiAgICogSUUgJiBGaXJlZm94IG1lYXN1cmVzIHRoZSBpbm5lci13aWR0aFxuICAgKi9cbiAgaWYgKCBib3hTaXppbmdQcm9wICkge1xuICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBkaXYuc3R5bGUud2lkdGggPSAnMjAwcHgnO1xuICAgIGRpdi5zdHlsZS5wYWRkaW5nID0gJzFweCAycHggM3B4IDRweCc7XG4gICAgZGl2LnN0eWxlLmJvcmRlclN0eWxlID0gJ3NvbGlkJztcbiAgICBkaXYuc3R5bGUuYm9yZGVyV2lkdGggPSAnMXB4IDJweCAzcHggNHB4JztcbiAgICBkaXYuc3R5bGVbIGJveFNpemluZ1Byb3AgXSA9ICdib3JkZXItYm94JztcblxuICAgIHZhciBib2R5ID0gZG9jdW1lbnQuYm9keSB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gICAgYm9keS5hcHBlbmRDaGlsZCggZGl2ICk7XG4gICAgdmFyIHN0eWxlID0gZ2V0U3R5bGUoIGRpdiApO1xuXG4gICAgaXNCb3hTaXplT3V0ZXIgPSBnZXRTdHlsZVNpemUoIHN0eWxlLndpZHRoICkgPT09IDIwMDtcbiAgICBib2R5LnJlbW92ZUNoaWxkKCBkaXYgKTtcbiAgfVxuXG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGdldFNpemUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuZnVuY3Rpb24gZ2V0U2l6ZSggZWxlbSApIHtcbiAgc2V0dXAoKTtcblxuICAvLyB1c2UgcXVlcnlTZWxldG9yIGlmIGVsZW0gaXMgc3RyaW5nXG4gIGlmICggdHlwZW9mIGVsZW0gPT09ICdzdHJpbmcnICkge1xuICAgIGVsZW0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCBlbGVtICk7XG4gIH1cblxuICAvLyBkbyBub3QgcHJvY2VlZCBvbiBub24tb2JqZWN0c1xuICBpZiAoICFlbGVtIHx8IHR5cGVvZiBlbGVtICE9PSAnb2JqZWN0JyB8fCAhZWxlbS5ub2RlVHlwZSApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgc3R5bGUgPSBnZXRTdHlsZSggZWxlbSApO1xuXG4gIC8vIGlmIGhpZGRlbiwgZXZlcnl0aGluZyBpcyAwXG4gIGlmICggc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnICkge1xuICAgIHJldHVybiBnZXRaZXJvU2l6ZSgpO1xuICB9XG5cbiAgdmFyIHNpemUgPSB7fTtcbiAgc2l6ZS53aWR0aCA9IGVsZW0ub2Zmc2V0V2lkdGg7XG4gIHNpemUuaGVpZ2h0ID0gZWxlbS5vZmZzZXRIZWlnaHQ7XG5cbiAgdmFyIGlzQm9yZGVyQm94ID0gc2l6ZS5pc0JvcmRlckJveCA9ICEhKCBib3hTaXppbmdQcm9wICYmXG4gICAgc3R5bGVbIGJveFNpemluZ1Byb3AgXSAmJiBzdHlsZVsgYm94U2l6aW5nUHJvcCBdID09PSAnYm9yZGVyLWJveCcgKTtcblxuICAvLyBnZXQgYWxsIG1lYXN1cmVtZW50c1xuICBmb3IgKCB2YXIgaT0wLCBsZW4gPSBtZWFzdXJlbWVudHMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgdmFyIG1lYXN1cmVtZW50ID0gbWVhc3VyZW1lbnRzW2ldO1xuICAgIHZhciB2YWx1ZSA9IHN0eWxlWyBtZWFzdXJlbWVudCBdO1xuICAgIHZhbHVlID0gbXVuZ2VOb25QaXhlbCggZWxlbSwgdmFsdWUgKTtcbiAgICB2YXIgbnVtID0gcGFyc2VGbG9hdCggdmFsdWUgKTtcbiAgICAvLyBhbnkgJ2F1dG8nLCAnbWVkaXVtJyB2YWx1ZSB3aWxsIGJlIDBcbiAgICBzaXplWyBtZWFzdXJlbWVudCBdID0gIWlzTmFOKCBudW0gKSA/IG51bSA6IDA7XG4gIH1cblxuICB2YXIgcGFkZGluZ1dpZHRoID0gc2l6ZS5wYWRkaW5nTGVmdCArIHNpemUucGFkZGluZ1JpZ2h0O1xuICB2YXIgcGFkZGluZ0hlaWdodCA9IHNpemUucGFkZGluZ1RvcCArIHNpemUucGFkZGluZ0JvdHRvbTtcbiAgdmFyIG1hcmdpbldpZHRoID0gc2l6ZS5tYXJnaW5MZWZ0ICsgc2l6ZS5tYXJnaW5SaWdodDtcbiAgdmFyIG1hcmdpbkhlaWdodCA9IHNpemUubWFyZ2luVG9wICsgc2l6ZS5tYXJnaW5Cb3R0b207XG4gIHZhciBib3JkZXJXaWR0aCA9IHNpemUuYm9yZGVyTGVmdFdpZHRoICsgc2l6ZS5ib3JkZXJSaWdodFdpZHRoO1xuICB2YXIgYm9yZGVySGVpZ2h0ID0gc2l6ZS5ib3JkZXJUb3BXaWR0aCArIHNpemUuYm9yZGVyQm90dG9tV2lkdGg7XG5cbiAgdmFyIGlzQm9yZGVyQm94U2l6ZU91dGVyID0gaXNCb3JkZXJCb3ggJiYgaXNCb3hTaXplT3V0ZXI7XG5cbiAgLy8gb3ZlcndyaXRlIHdpZHRoIGFuZCBoZWlnaHQgaWYgd2UgY2FuIGdldCBpdCBmcm9tIHN0eWxlXG4gIHZhciBzdHlsZVdpZHRoID0gZ2V0U3R5bGVTaXplKCBzdHlsZS53aWR0aCApO1xuICBpZiAoIHN0eWxlV2lkdGggIT09IGZhbHNlICkge1xuICAgIHNpemUud2lkdGggPSBzdHlsZVdpZHRoICtcbiAgICAgIC8vIGFkZCBwYWRkaW5nIGFuZCBib3JkZXIgdW5sZXNzIGl0J3MgYWxyZWFkeSBpbmNsdWRpbmcgaXRcbiAgICAgICggaXNCb3JkZXJCb3hTaXplT3V0ZXIgPyAwIDogcGFkZGluZ1dpZHRoICsgYm9yZGVyV2lkdGggKTtcbiAgfVxuXG4gIHZhciBzdHlsZUhlaWdodCA9IGdldFN0eWxlU2l6ZSggc3R5bGUuaGVpZ2h0ICk7XG4gIGlmICggc3R5bGVIZWlnaHQgIT09IGZhbHNlICkge1xuICAgIHNpemUuaGVpZ2h0ID0gc3R5bGVIZWlnaHQgK1xuICAgICAgLy8gYWRkIHBhZGRpbmcgYW5kIGJvcmRlciB1bmxlc3MgaXQncyBhbHJlYWR5IGluY2x1ZGluZyBpdFxuICAgICAgKCBpc0JvcmRlckJveFNpemVPdXRlciA/IDAgOiBwYWRkaW5nSGVpZ2h0ICsgYm9yZGVySGVpZ2h0ICk7XG4gIH1cblxuICBzaXplLmlubmVyV2lkdGggPSBzaXplLndpZHRoIC0gKCBwYWRkaW5nV2lkdGggKyBib3JkZXJXaWR0aCApO1xuICBzaXplLmlubmVySGVpZ2h0ID0gc2l6ZS5oZWlnaHQgLSAoIHBhZGRpbmdIZWlnaHQgKyBib3JkZXJIZWlnaHQgKTtcblxuICBzaXplLm91dGVyV2lkdGggPSBzaXplLndpZHRoICsgbWFyZ2luV2lkdGg7XG4gIHNpemUub3V0ZXJIZWlnaHQgPSBzaXplLmhlaWdodCArIG1hcmdpbkhlaWdodDtcblxuICByZXR1cm4gc2l6ZTtcbn1cblxuLy8gSUU4IHJldHVybnMgcGVyY2VudCB2YWx1ZXMsIG5vdCBwaXhlbHNcbi8vIHRha2VuIGZyb20galF1ZXJ5J3MgY3VyQ1NTXG5mdW5jdGlvbiBtdW5nZU5vblBpeGVsKCBlbGVtLCB2YWx1ZSApIHtcbiAgLy8gSUU4IGFuZCBoYXMgcGVyY2VudCB2YWx1ZVxuICBpZiAoIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlIHx8IHZhbHVlLmluZGV4T2YoJyUnKSA9PT0gLTEgKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIHZhciBzdHlsZSA9IGVsZW0uc3R5bGU7XG4gIC8vIFJlbWVtYmVyIHRoZSBvcmlnaW5hbCB2YWx1ZXNcbiAgdmFyIGxlZnQgPSBzdHlsZS5sZWZ0O1xuICB2YXIgcnMgPSBlbGVtLnJ1bnRpbWVTdHlsZTtcbiAgdmFyIHJzTGVmdCA9IHJzICYmIHJzLmxlZnQ7XG5cbiAgLy8gUHV0IGluIHRoZSBuZXcgdmFsdWVzIHRvIGdldCBhIGNvbXB1dGVkIHZhbHVlIG91dFxuICBpZiAoIHJzTGVmdCApIHtcbiAgICBycy5sZWZ0ID0gZWxlbS5jdXJyZW50U3R5bGUubGVmdDtcbiAgfVxuICBzdHlsZS5sZWZ0ID0gdmFsdWU7XG4gIHZhbHVlID0gc3R5bGUucGl4ZWxMZWZ0O1xuXG4gIC8vIFJldmVydCB0aGUgY2hhbmdlZCB2YWx1ZXNcbiAgc3R5bGUubGVmdCA9IGxlZnQ7XG4gIGlmICggcnNMZWZ0ICkge1xuICAgIHJzLmxlZnQgPSByc0xlZnQ7XG4gIH1cblxuICByZXR1cm4gdmFsdWU7XG59XG5cbnJldHVybiBnZXRTaXplO1xuXG59XG5cbi8vIHRyYW5zcG9ydFxuaWYgKCB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gIC8vIEFNRCBmb3IgUmVxdWlyZUpTXG4gIGRlZmluZSggWyAnZ2V0LXN0eWxlLXByb3BlcnR5L2dldC1zdHlsZS1wcm9wZXJ0eScgXSwgZGVmaW5lR2V0U2l6ZSApO1xufSBlbHNlIGlmICggdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICkge1xuICAvLyBDb21tb25KUyBmb3IgQ29tcG9uZW50XG4gIG1vZHVsZS5leHBvcnRzID0gZGVmaW5lR2V0U2l6ZSggcmVxdWlyZSgnZGVzYW5kcm8tZ2V0LXN0eWxlLXByb3BlcnR5JykgKTtcbn0gZWxzZSB7XG4gIC8vIGJyb3dzZXIgZ2xvYmFsXG4gIHdpbmRvdy5nZXRTaXplID0gZGVmaW5lR2V0U2l6ZSggd2luZG93LmdldFN0eWxlUHJvcGVydHkgKTtcbn1cblxufSkoIHdpbmRvdyApO1xuIiwiLyohXG4gKiBVbmlwb2ludGVyIHYxLjEuMFxuICogYmFzZSBjbGFzcyBmb3IgZG9pbmcgb25lIHRoaW5nIHdpdGggcG9pbnRlciBldmVudFxuICogTUlUIGxpY2Vuc2VcbiAqL1xuXG4vKmpzaGludCBicm93c2VyOiB0cnVlLCB1bmRlZjogdHJ1ZSwgdW51c2VkOiB0cnVlLCBzdHJpY3Q6IHRydWUgKi9cbi8qZ2xvYmFsIGRlZmluZTogZmFsc2UsIG1vZHVsZTogZmFsc2UsIHJlcXVpcmU6IGZhbHNlICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdywgZmFjdG9yeSApIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICBpZiAoIHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSggW1xuICAgICAgJ2V2ZW50RW1pdHRlci9FdmVudEVtaXR0ZXInLFxuICAgICAgJ2V2ZW50aWUvZXZlbnRpZSdcbiAgICBdLCBmdW5jdGlvbiggRXZlbnRFbWl0dGVyLCBldmVudGllICkge1xuICAgICAgcmV0dXJuIGZhY3RvcnkoIHdpbmRvdywgRXZlbnRFbWl0dGVyLCBldmVudGllICk7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoIHR5cGVvZiBleHBvcnRzID09ICdvYmplY3QnICkge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LFxuICAgICAgcmVxdWlyZSgnd29sZnk4Ny1ldmVudGVtaXR0ZXInKSxcbiAgICAgIHJlcXVpcmUoJ2V2ZW50aWUnKVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cuVW5pcG9pbnRlciA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICB3aW5kb3cuRXZlbnRFbWl0dGVyLFxuICAgICAgd2luZG93LmV2ZW50aWVcbiAgICApO1xuICB9XG5cbn0oIHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSggd2luZG93LCBFdmVudEVtaXR0ZXIsIGV2ZW50aWUgKSB7XG5cbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbmZ1bmN0aW9uIFVuaXBvaW50ZXIoKSB7fVxuXG4vLyBpbmhlcml0IEV2ZW50RW1pdHRlclxuVW5pcG9pbnRlci5wcm90b3R5cGUgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cblVuaXBvaW50ZXIucHJvdG90eXBlLmJpbmRTdGFydEV2ZW50ID0gZnVuY3Rpb24oIGVsZW0gKSB7XG4gIHRoaXMuX2JpbmRTdGFydEV2ZW50KCBlbGVtLCB0cnVlICk7XG59O1xuXG5Vbmlwb2ludGVyLnByb3RvdHlwZS51bmJpbmRTdGFydEV2ZW50ID0gZnVuY3Rpb24oIGVsZW0gKSB7XG4gIHRoaXMuX2JpbmRTdGFydEV2ZW50KCBlbGVtLCBmYWxzZSApO1xufTtcblxuLyoqXG4gKiB3b3JrcyBhcyB1bmJpbmRlciwgYXMgeW91IGNhbiAuX2JpbmRTdGFydCggZmFsc2UgKSB0byB1bmJpbmRcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNCaW5kIC0gd2lsbCB1bmJpbmQgaWYgZmFsc2V5XG4gKi9cblVuaXBvaW50ZXIucHJvdG90eXBlLl9iaW5kU3RhcnRFdmVudCA9IGZ1bmN0aW9uKCBlbGVtLCBpc0JpbmQgKSB7XG4gIC8vIG11bmdlIGlzQmluZCwgZGVmYXVsdCB0byB0cnVlXG4gIGlzQmluZCA9IGlzQmluZCA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6ICEhaXNCaW5kO1xuICB2YXIgYmluZE1ldGhvZCA9IGlzQmluZCA/ICdiaW5kJyA6ICd1bmJpbmQnO1xuXG4gIGlmICggd2luZG93Lm5hdmlnYXRvci5wb2ludGVyRW5hYmxlZCApIHtcbiAgICAvLyBXM0MgUG9pbnRlciBFdmVudHMsIElFMTEuIFNlZSBodHRwczovL2NvZGVyd2FsbC5jb20vcC9tZnJlY2FcbiAgICBldmVudGllWyBiaW5kTWV0aG9kIF0oIGVsZW0sICdwb2ludGVyZG93bicsIHRoaXMgKTtcbiAgfSBlbHNlIGlmICggd2luZG93Lm5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkICkge1xuICAgIC8vIElFMTAgUG9pbnRlciBFdmVudHNcbiAgICBldmVudGllWyBiaW5kTWV0aG9kIF0oIGVsZW0sICdNU1BvaW50ZXJEb3duJywgdGhpcyApO1xuICB9IGVsc2Uge1xuICAgIC8vIGxpc3RlbiBmb3IgYm90aCwgZm9yIGRldmljZXMgbGlrZSBDaHJvbWUgUGl4ZWxcbiAgICBldmVudGllWyBiaW5kTWV0aG9kIF0oIGVsZW0sICdtb3VzZWRvd24nLCB0aGlzICk7XG4gICAgZXZlbnRpZVsgYmluZE1ldGhvZCBdKCBlbGVtLCAndG91Y2hzdGFydCcsIHRoaXMgKTtcbiAgfVxufTtcblxuLy8gdHJpZ2dlciBoYW5kbGVyIG1ldGhvZHMgZm9yIGV2ZW50c1xuVW5pcG9pbnRlci5wcm90b3R5cGUuaGFuZGxlRXZlbnQgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gIHZhciBtZXRob2QgPSAnb24nICsgZXZlbnQudHlwZTtcbiAgaWYgKCB0aGlzWyBtZXRob2QgXSApIHtcbiAgICB0aGlzWyBtZXRob2QgXSggZXZlbnQgKTtcbiAgfVxufTtcblxuLy8gcmV0dXJucyB0aGUgdG91Y2ggdGhhdCB3ZSdyZSBrZWVwaW5nIHRyYWNrIG9mXG5Vbmlwb2ludGVyLnByb3RvdHlwZS5nZXRUb3VjaCA9IGZ1bmN0aW9uKCB0b3VjaGVzICkge1xuICBmb3IgKCB2YXIgaT0wLCBsZW4gPSB0b3VjaGVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgIHZhciB0b3VjaCA9IHRvdWNoZXNbaV07XG4gICAgaWYgKCB0b3VjaC5pZGVudGlmaWVyID09IHRoaXMucG9pbnRlcklkZW50aWZpZXIgKSB7XG4gICAgICByZXR1cm4gdG91Y2g7XG4gICAgfVxuICB9XG59O1xuXG4vLyAtLS0tLSBzdGFydCBldmVudCAtLS0tLSAvL1xuXG5Vbmlwb2ludGVyLnByb3RvdHlwZS5vbm1vdXNlZG93biA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgLy8gZGlzbWlzcyBjbGlja3MgZnJvbSByaWdodCBvciBtaWRkbGUgYnV0dG9uc1xuICB2YXIgYnV0dG9uID0gZXZlbnQuYnV0dG9uO1xuICBpZiAoIGJ1dHRvbiAmJiAoIGJ1dHRvbiAhPT0gMCAmJiBidXR0b24gIT09IDEgKSApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5fcG9pbnRlckRvd24oIGV2ZW50LCBldmVudCApO1xufTtcblxuVW5pcG9pbnRlci5wcm90b3R5cGUub250b3VjaHN0YXJ0ID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICB0aGlzLl9wb2ludGVyRG93biggZXZlbnQsIGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdICk7XG59O1xuXG5Vbmlwb2ludGVyLnByb3RvdHlwZS5vbk1TUG9pbnRlckRvd24gPVxuVW5pcG9pbnRlci5wcm90b3R5cGUub25wb2ludGVyZG93biA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgdGhpcy5fcG9pbnRlckRvd24oIGV2ZW50LCBldmVudCApO1xufTtcblxuLyoqXG4gKiBwb2ludGVyIHN0YXJ0XG4gKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICogQHBhcmFtIHtFdmVudCBvciBUb3VjaH0gcG9pbnRlclxuICovXG5Vbmlwb2ludGVyLnByb3RvdHlwZS5fcG9pbnRlckRvd24gPSBmdW5jdGlvbiggZXZlbnQsIHBvaW50ZXIgKSB7XG4gIC8vIGRpc21pc3Mgb3RoZXIgcG9pbnRlcnNcbiAgaWYgKCB0aGlzLmlzUG9pbnRlckRvd24gKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhpcy5pc1BvaW50ZXJEb3duID0gdHJ1ZTtcbiAgLy8gc2F2ZSBwb2ludGVyIGlkZW50aWZpZXIgdG8gbWF0Y2ggdXAgdG91Y2ggZXZlbnRzXG4gIHRoaXMucG9pbnRlcklkZW50aWZpZXIgPSBwb2ludGVyLnBvaW50ZXJJZCAhPT0gdW5kZWZpbmVkID9cbiAgICAvLyBwb2ludGVySWQgZm9yIHBvaW50ZXIgZXZlbnRzLCB0b3VjaC5pbmRlbnRpZmllciBmb3IgdG91Y2ggZXZlbnRzXG4gICAgcG9pbnRlci5wb2ludGVySWQgOiBwb2ludGVyLmlkZW50aWZpZXI7XG5cbiAgdGhpcy5wb2ludGVyRG93biggZXZlbnQsIHBvaW50ZXIgKTtcbn07XG5cblVuaXBvaW50ZXIucHJvdG90eXBlLnBvaW50ZXJEb3duID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyICkge1xuICB0aGlzLl9iaW5kUG9zdFN0YXJ0RXZlbnRzKCBldmVudCApO1xuICB0aGlzLmVtaXRFdmVudCggJ3BvaW50ZXJEb3duJywgWyBldmVudCwgcG9pbnRlciBdICk7XG59O1xuXG4vLyBoYXNoIG9mIGV2ZW50cyB0byBiZSBib3VuZCBhZnRlciBzdGFydCBldmVudFxudmFyIHBvc3RTdGFydEV2ZW50cyA9IHtcbiAgbW91c2Vkb3duOiBbICdtb3VzZW1vdmUnLCAnbW91c2V1cCcgXSxcbiAgdG91Y2hzdGFydDogWyAndG91Y2htb3ZlJywgJ3RvdWNoZW5kJywgJ3RvdWNoY2FuY2VsJyBdLFxuICBwb2ludGVyZG93bjogWyAncG9pbnRlcm1vdmUnLCAncG9pbnRlcnVwJywgJ3BvaW50ZXJjYW5jZWwnIF0sXG4gIE1TUG9pbnRlckRvd246IFsgJ01TUG9pbnRlck1vdmUnLCAnTVNQb2ludGVyVXAnLCAnTVNQb2ludGVyQ2FuY2VsJyBdXG59O1xuXG5Vbmlwb2ludGVyLnByb3RvdHlwZS5fYmluZFBvc3RTdGFydEV2ZW50cyA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgaWYgKCAhZXZlbnQgKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vIGdldCBwcm9wZXIgZXZlbnRzIHRvIG1hdGNoIHN0YXJ0IGV2ZW50XG4gIHZhciBldmVudHMgPSBwb3N0U3RhcnRFdmVudHNbIGV2ZW50LnR5cGUgXTtcbiAgLy8gSUU4IG5lZWRzIHRvIGJlIGJvdW5kIHRvIGRvY3VtZW50XG4gIHZhciBub2RlID0gZXZlbnQucHJldmVudERlZmF1bHQgPyB3aW5kb3cgOiBkb2N1bWVudDtcbiAgLy8gYmluZCBldmVudHMgdG8gbm9kZVxuICBmb3IgKCB2YXIgaT0wLCBsZW4gPSBldmVudHMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgdmFyIGV2bnQgPSBldmVudHNbaV07XG4gICAgZXZlbnRpZS5iaW5kKCBub2RlLCBldm50LCB0aGlzICk7XG4gIH1cbiAgLy8gc2F2ZSB0aGVzZSBhcmd1bWVudHNcbiAgdGhpcy5fYm91bmRQb2ludGVyRXZlbnRzID0ge1xuICAgIGV2ZW50czogZXZlbnRzLFxuICAgIG5vZGU6IG5vZGVcbiAgfTtcbn07XG5cblVuaXBvaW50ZXIucHJvdG90eXBlLl91bmJpbmRQb3N0U3RhcnRFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGFyZ3MgPSB0aGlzLl9ib3VuZFBvaW50ZXJFdmVudHM7XG4gIC8vIElFOCBjYW4gdHJpZ2dlciBkcmFnRW5kIHR3aWNlLCBjaGVjayBmb3IgX2JvdW5kRXZlbnRzXG4gIGlmICggIWFyZ3MgfHwgIWFyZ3MuZXZlbnRzICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGZvciAoIHZhciBpPTAsIGxlbiA9IGFyZ3MuZXZlbnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgIHZhciBldmVudCA9IGFyZ3MuZXZlbnRzW2ldO1xuICAgIGV2ZW50aWUudW5iaW5kKCBhcmdzLm5vZGUsIGV2ZW50LCB0aGlzICk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2JvdW5kUG9pbnRlckV2ZW50cztcbn07XG5cbi8vIC0tLS0tIG1vdmUgZXZlbnQgLS0tLS0gLy9cblxuVW5pcG9pbnRlci5wcm90b3R5cGUub25tb3VzZW1vdmUgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gIHRoaXMuX3BvaW50ZXJNb3ZlKCBldmVudCwgZXZlbnQgKTtcbn07XG5cblVuaXBvaW50ZXIucHJvdG90eXBlLm9uTVNQb2ludGVyTW92ZSA9XG5Vbmlwb2ludGVyLnByb3RvdHlwZS5vbnBvaW50ZXJtb3ZlID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICBpZiAoIGV2ZW50LnBvaW50ZXJJZCA9PSB0aGlzLnBvaW50ZXJJZGVudGlmaWVyICkge1xuICAgIHRoaXMuX3BvaW50ZXJNb3ZlKCBldmVudCwgZXZlbnQgKTtcbiAgfVxufTtcblxuVW5pcG9pbnRlci5wcm90b3R5cGUub250b3VjaG1vdmUgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gIHZhciB0b3VjaCA9IHRoaXMuZ2V0VG91Y2goIGV2ZW50LmNoYW5nZWRUb3VjaGVzICk7XG4gIGlmICggdG91Y2ggKSB7XG4gICAgdGhpcy5fcG9pbnRlck1vdmUoIGV2ZW50LCB0b3VjaCApO1xuICB9XG59O1xuXG4vKipcbiAqIHBvaW50ZXIgbW92ZVxuICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAqIEBwYXJhbSB7RXZlbnQgb3IgVG91Y2h9IHBvaW50ZXJcbiAqIEBwcml2YXRlXG4gKi9cblVuaXBvaW50ZXIucHJvdG90eXBlLl9wb2ludGVyTW92ZSA9IGZ1bmN0aW9uKCBldmVudCwgcG9pbnRlciApIHtcbiAgdGhpcy5wb2ludGVyTW92ZSggZXZlbnQsIHBvaW50ZXIgKTtcbn07XG5cbi8vIHB1YmxpY1xuVW5pcG9pbnRlci5wcm90b3R5cGUucG9pbnRlck1vdmUgPSBmdW5jdGlvbiggZXZlbnQsIHBvaW50ZXIgKSB7XG4gIHRoaXMuZW1pdEV2ZW50KCAncG9pbnRlck1vdmUnLCBbIGV2ZW50LCBwb2ludGVyIF0gKTtcbn07XG5cbi8vIC0tLS0tIGVuZCBldmVudCAtLS0tLSAvL1xuXG5cblVuaXBvaW50ZXIucHJvdG90eXBlLm9ubW91c2V1cCA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgdGhpcy5fcG9pbnRlclVwKCBldmVudCwgZXZlbnQgKTtcbn07XG5cblVuaXBvaW50ZXIucHJvdG90eXBlLm9uTVNQb2ludGVyVXAgPVxuVW5pcG9pbnRlci5wcm90b3R5cGUub25wb2ludGVydXAgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gIGlmICggZXZlbnQucG9pbnRlcklkID09IHRoaXMucG9pbnRlcklkZW50aWZpZXIgKSB7XG4gICAgdGhpcy5fcG9pbnRlclVwKCBldmVudCwgZXZlbnQgKTtcbiAgfVxufTtcblxuVW5pcG9pbnRlci5wcm90b3R5cGUub250b3VjaGVuZCA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgdmFyIHRvdWNoID0gdGhpcy5nZXRUb3VjaCggZXZlbnQuY2hhbmdlZFRvdWNoZXMgKTtcbiAgaWYgKCB0b3VjaCApIHtcbiAgICB0aGlzLl9wb2ludGVyVXAoIGV2ZW50LCB0b3VjaCApO1xuICB9XG59O1xuXG4vKipcbiAqIHBvaW50ZXIgdXBcbiAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gKiBAcGFyYW0ge0V2ZW50IG9yIFRvdWNofSBwb2ludGVyXG4gKiBAcHJpdmF0ZVxuICovXG5Vbmlwb2ludGVyLnByb3RvdHlwZS5fcG9pbnRlclVwID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyICkge1xuICB0aGlzLl9wb2ludGVyRG9uZSgpO1xuICB0aGlzLnBvaW50ZXJVcCggZXZlbnQsIHBvaW50ZXIgKTtcbn07XG5cbi8vIHB1YmxpY1xuVW5pcG9pbnRlci5wcm90b3R5cGUucG9pbnRlclVwID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyICkge1xuICB0aGlzLmVtaXRFdmVudCggJ3BvaW50ZXJVcCcsIFsgZXZlbnQsIHBvaW50ZXIgXSApO1xufTtcblxuLy8gLS0tLS0gcG9pbnRlciBkb25lIC0tLS0tIC8vXG5cbi8vIHRyaWdnZXJlZCBvbiBwb2ludGVyIHVwICYgcG9pbnRlciBjYW5jZWxcblVuaXBvaW50ZXIucHJvdG90eXBlLl9wb2ludGVyRG9uZSA9IGZ1bmN0aW9uKCkge1xuICAvLyByZXNldCBwcm9wZXJ0aWVzXG4gIHRoaXMuaXNQb2ludGVyRG93biA9IGZhbHNlO1xuICBkZWxldGUgdGhpcy5wb2ludGVySWRlbnRpZmllcjtcbiAgLy8gcmVtb3ZlIGV2ZW50c1xuICB0aGlzLl91bmJpbmRQb3N0U3RhcnRFdmVudHMoKTtcbiAgdGhpcy5wb2ludGVyRG9uZSgpO1xufTtcblxuVW5pcG9pbnRlci5wcm90b3R5cGUucG9pbnRlckRvbmUgPSBub29wO1xuXG4vLyAtLS0tLSBwb2ludGVyIGNhbmNlbCAtLS0tLSAvL1xuXG5Vbmlwb2ludGVyLnByb3RvdHlwZS5vbk1TUG9pbnRlckNhbmNlbCA9XG5Vbmlwb2ludGVyLnByb3RvdHlwZS5vbnBvaW50ZXJjYW5jZWwgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gIGlmICggZXZlbnQucG9pbnRlcklkID09IHRoaXMucG9pbnRlcklkZW50aWZpZXIgKSB7XG4gICAgdGhpcy5fcG9pbnRlckNhbmNlbCggZXZlbnQsIGV2ZW50ICk7XG4gIH1cbn07XG5cblVuaXBvaW50ZXIucHJvdG90eXBlLm9udG91Y2hjYW5jZWwgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gIHZhciB0b3VjaCA9IHRoaXMuZ2V0VG91Y2goIGV2ZW50LmNoYW5nZWRUb3VjaGVzICk7XG4gIGlmICggdG91Y2ggKSB7XG4gICAgdGhpcy5fcG9pbnRlckNhbmNlbCggZXZlbnQsIHRvdWNoICk7XG4gIH1cbn07XG5cbi8qKlxuICogcG9pbnRlciBjYW5jZWxcbiAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gKiBAcGFyYW0ge0V2ZW50IG9yIFRvdWNofSBwb2ludGVyXG4gKiBAcHJpdmF0ZVxuICovXG5Vbmlwb2ludGVyLnByb3RvdHlwZS5fcG9pbnRlckNhbmNlbCA9IGZ1bmN0aW9uKCBldmVudCwgcG9pbnRlciApIHtcbiAgdGhpcy5fcG9pbnRlckRvbmUoKTtcbiAgdGhpcy5wb2ludGVyQ2FuY2VsKCBldmVudCwgcG9pbnRlciApO1xufTtcblxuLy8gcHVibGljXG5Vbmlwb2ludGVyLnByb3RvdHlwZS5wb2ludGVyQ2FuY2VsID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyICkge1xuICB0aGlzLmVtaXRFdmVudCggJ3BvaW50ZXJDYW5jZWwnLCBbIGV2ZW50LCBwb2ludGVyIF0gKTtcbn07XG5cbi8vIC0tLS0tICAtLS0tLSAvL1xuXG4vLyB1dGlsaXR5IGZ1bmN0aW9uIGZvciBnZXR0aW5nIHgveSBjb29yaWRpbmF0ZXMgZnJvbSBldmVudCwgYmVjYXVzZSBJRThcblVuaXBvaW50ZXIuZ2V0UG9pbnRlclBvaW50ID0gZnVuY3Rpb24oIHBvaW50ZXIgKSB7XG4gIHJldHVybiB7XG4gICAgeDogcG9pbnRlci5wYWdlWCAhPT0gdW5kZWZpbmVkID8gcG9pbnRlci5wYWdlWCA6IHBvaW50ZXIuY2xpZW50WCxcbiAgICB5OiBwb2ludGVyLnBhZ2VZICE9PSB1bmRlZmluZWQgPyBwb2ludGVyLnBhZ2VZIDogcG9pbnRlci5jbGllbnRZXG4gIH07XG59O1xuXG4vLyAtLS0tLSAgLS0tLS0gLy9cblxucmV0dXJuIFVuaXBvaW50ZXI7XG5cbn0pKTtcbiIsIi8qIVxuICogVGFwIGxpc3RlbmVyIHYxLjEuMVxuICogbGlzdGVucyB0byB0YXBzXG4gKiBNSVQgbGljZW5zZVxuICovXG5cbi8qanNoaW50IGJyb3dzZXI6IHRydWUsIHVudXNlZDogdHJ1ZSwgdW5kZWY6IHRydWUsIHN0cmljdDogdHJ1ZSAqL1xuXG4oIGZ1bmN0aW9uKCB3aW5kb3csIGZhY3RvcnkgKSB7XG4gIC8qZ2xvYmFsIGRlZmluZTogZmFsc2UsIG1vZHVsZTogZmFsc2UsIHJlcXVpcmU6IGZhbHNlICovXG4gICd1c2Ugc3RyaWN0JztcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG5cbiAgaWYgKCB0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoIFtcbiAgICAgICd1bmlwb2ludGVyL3VuaXBvaW50ZXInXG4gICAgXSwgZnVuY3Rpb24oIFVuaXBvaW50ZXIgKSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSggd2luZG93LCBVbmlwb2ludGVyICk7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoIHR5cGVvZiBleHBvcnRzID09ICdvYmplY3QnICkge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LFxuICAgICAgcmVxdWlyZSgndW5pcG9pbnRlcicpXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5UYXBMaXN0ZW5lciA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICB3aW5kb3cuVW5pcG9pbnRlclxuICAgICk7XG4gIH1cblxufSggd2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KCB3aW5kb3csIFVuaXBvaW50ZXIgKSB7XG5cbid1c2Ugc3RyaWN0JztcblxuLy8gaGFuZGxlIElFOCBwcmV2ZW50IGRlZmF1bHRcbmZ1bmN0aW9uIHByZXZlbnREZWZhdWx0RXZlbnQoIGV2ZW50ICkge1xuICBpZiAoIGV2ZW50LnByZXZlbnREZWZhdWx0ICkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gIH0gZWxzZSB7XG4gICAgZXZlbnQucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAgVGFwTGlzdGVuZXIgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuZnVuY3Rpb24gVGFwTGlzdGVuZXIoIGVsZW0gKSB7XG4gIHRoaXMuYmluZFRhcCggZWxlbSApO1xufVxuXG4vLyBpbmhlcml0IFVuaXBvaW50ZXIgJiBFdmVudEVtaXR0ZXJcblRhcExpc3RlbmVyLnByb3RvdHlwZSA9IG5ldyBVbmlwb2ludGVyKCk7XG5cbi8qKlxuICogYmluZCB0YXAgZXZlbnQgdG8gZWxlbWVudFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtXG4gKi9cblRhcExpc3RlbmVyLnByb3RvdHlwZS5iaW5kVGFwID0gZnVuY3Rpb24oIGVsZW0gKSB7XG4gIGlmICggIWVsZW0gKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMudW5iaW5kVGFwKCk7XG4gIHRoaXMudGFwRWxlbWVudCA9IGVsZW07XG4gIHRoaXMuX2JpbmRTdGFydEV2ZW50KCBlbGVtLCB0cnVlICk7XG59O1xuXG5UYXBMaXN0ZW5lci5wcm90b3R5cGUudW5iaW5kVGFwID0gZnVuY3Rpb24oKSB7XG4gIGlmICggIXRoaXMudGFwRWxlbWVudCApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5fYmluZFN0YXJ0RXZlbnQoIHRoaXMudGFwRWxlbWVudCwgdHJ1ZSApO1xuICBkZWxldGUgdGhpcy50YXBFbGVtZW50O1xufTtcblxudmFyIHBvaW50ZXJEb3duID0gVGFwTGlzdGVuZXIucHJvdG90eXBlLnBvaW50ZXJEb3duO1xuXG5UYXBMaXN0ZW5lci5wcm90b3R5cGUucG9pbnRlckRvd24gPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gIC8vIHByZXZlbnQgZGVmYXVsdCBldmVudCBmb3IgdG91Y2gsIGRpc2FibGVzIHRhcCB0aGVuIGNsaWNrXG4gIGlmICggZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCcgKSB7XG4gICAgcHJldmVudERlZmF1bHRFdmVudCggZXZlbnQgKTtcbiAgfVxuICBwb2ludGVyRG93bi5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG59O1xuXG52YXIgaXNQYWdlT2Zmc2V0ID0gd2luZG93LnBhZ2VZT2Zmc2V0ICE9PSB1bmRlZmluZWQ7XG4vKipcbiAqIHBvaW50ZXIgdXBcbiAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gKiBAcGFyYW0ge0V2ZW50IG9yIFRvdWNofSBwb2ludGVyXG4gKi9cblRhcExpc3RlbmVyLnByb3RvdHlwZS5wb2ludGVyVXAgPSBmdW5jdGlvbiggZXZlbnQsIHBvaW50ZXIgKSB7XG4gIHZhciBwb2ludGVyUG9pbnQgPSBVbmlwb2ludGVyLmdldFBvaW50ZXJQb2ludCggcG9pbnRlciApO1xuICB2YXIgYm91bmRpbmdSZWN0ID0gdGhpcy50YXBFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAvLyBzdGFuZGFyZCBvciBJRTggc2Nyb2xsIHBvc2l0aW9uc1xuICB2YXIgc2Nyb2xsWCA9IGlzUGFnZU9mZnNldCA/IHdpbmRvdy5wYWdlWE9mZnNldCA6IGRvY3VtZW50LmJvZHkuc2Nyb2xsTGVmdDtcbiAgdmFyIHNjcm9sbFkgPSBpc1BhZ2VPZmZzZXQgPyB3aW5kb3cucGFnZVlPZmZzZXQgOiBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcDtcbiAgLy8gY2FsY3VsYXRlIGlmIHBvaW50ZXIgaXMgaW5zaWRlIHRhcEVsZW1lbnRcbiAgdmFyIGlzSW5zaWRlID0gcG9pbnRlclBvaW50LnggPj0gYm91bmRpbmdSZWN0LmxlZnQgKyBzY3JvbGxYICYmXG4gICAgcG9pbnRlclBvaW50LnggPD0gYm91bmRpbmdSZWN0LnJpZ2h0ICsgc2Nyb2xsWCAmJlxuICAgIHBvaW50ZXJQb2ludC55ID49IGJvdW5kaW5nUmVjdC50b3AgKyBzY3JvbGxZICYmXG4gICAgcG9pbnRlclBvaW50LnkgPD0gYm91bmRpbmdSZWN0LmJvdHRvbSArIHNjcm9sbFk7XG4gIC8vIHRyaWdnZXIgY2FsbGJhY2sgaWYgcG9pbnRlciBpcyBpbnNpZGUgZWxlbWVudFxuICBpZiAoIGlzSW5zaWRlICkge1xuICAgIHRoaXMuZW1pdEV2ZW50KCAndGFwJywgWyBldmVudCwgcG9pbnRlciBdICk7XG4gIH1cbn07XG5cblRhcExpc3RlbmVyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucG9pbnRlckRvbmUoKTtcbiAgdGhpcy51bmJpbmRUYXAoKTtcbn07XG5cbi8vIC0tLS0tICAtLS0tLSAvL1xuXG5yZXR1cm4gVGFwTGlzdGVuZXI7XG5cbn0pKTtcbiIsIi8qIVxuICogVW5pZHJhZ2dlciB2MS4xLjNcbiAqIERyYWdnYWJsZSBiYXNlIGNsYXNzXG4gKiBNSVQgbGljZW5zZVxuICovXG5cbi8qanNoaW50IGJyb3dzZXI6IHRydWUsIHVudXNlZDogdHJ1ZSwgdW5kZWY6IHRydWUsIHN0cmljdDogdHJ1ZSAqL1xuXG4oIGZ1bmN0aW9uKCB3aW5kb3csIGZhY3RvcnkgKSB7XG4gIC8qZ2xvYmFsIGRlZmluZTogZmFsc2UsIG1vZHVsZTogZmFsc2UsIHJlcXVpcmU6IGZhbHNlICovXG4gICd1c2Ugc3RyaWN0JztcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG5cbiAgaWYgKCB0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoIFtcbiAgICAgICdldmVudGllL2V2ZW50aWUnLFxuICAgICAgJ3VuaXBvaW50ZXIvdW5pcG9pbnRlcidcbiAgICBdLCBmdW5jdGlvbiggZXZlbnRpZSwgVW5pcG9pbnRlciApIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KCB3aW5kb3csIGV2ZW50aWUsIFVuaXBvaW50ZXIgKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIGV4cG9ydHMgPT0gJ29iamVjdCcgKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICByZXF1aXJlKCdldmVudGllJyksXG4gICAgICByZXF1aXJlKCd1bmlwb2ludGVyJylcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93LlVuaWRyYWdnZXIgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LFxuICAgICAgd2luZG93LmV2ZW50aWUsXG4gICAgICB3aW5kb3cuVW5pcG9pbnRlclxuICAgICk7XG4gIH1cblxufSggd2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KCB3aW5kb3csIGV2ZW50aWUsIFVuaXBvaW50ZXIgKSB7XG5cbid1c2Ugc3RyaWN0JztcblxuLy8gLS0tLS0gIC0tLS0tIC8vXG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG4vLyBoYW5kbGUgSUU4IHByZXZlbnQgZGVmYXVsdFxuZnVuY3Rpb24gcHJldmVudERlZmF1bHRFdmVudCggZXZlbnQgKSB7XG4gIGlmICggZXZlbnQucHJldmVudERlZmF1bHQgKSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgfSBlbHNlIHtcbiAgICBldmVudC5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFVuaWRyYWdnZXIgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuZnVuY3Rpb24gVW5pZHJhZ2dlcigpIHt9XG5cbi8vIGluaGVyaXQgVW5pcG9pbnRlciAmIEV2ZW50RW1pdHRlclxuVW5pZHJhZ2dlci5wcm90b3R5cGUgPSBuZXcgVW5pcG9pbnRlcigpO1xuXG4vLyAtLS0tLSBiaW5kIHN0YXJ0IC0tLS0tIC8vXG5cblVuaWRyYWdnZXIucHJvdG90eXBlLmJpbmRIYW5kbGVzID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2JpbmRIYW5kbGVzKCB0cnVlICk7XG59O1xuXG5VbmlkcmFnZ2VyLnByb3RvdHlwZS51bmJpbmRIYW5kbGVzID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2JpbmRIYW5kbGVzKCBmYWxzZSApO1xufTtcblxudmFyIG5hdmlnYXRvciA9IHdpbmRvdy5uYXZpZ2F0b3I7XG4vKipcbiAqIHdvcmtzIGFzIHVuYmluZGVyLCBhcyB5b3UgY2FuIC5iaW5kSGFuZGxlcyggZmFsc2UgKSB0byB1bmJpbmRcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNCaW5kIC0gd2lsbCB1bmJpbmQgaWYgZmFsc2V5XG4gKi9cblVuaWRyYWdnZXIucHJvdG90eXBlLl9iaW5kSGFuZGxlcyA9IGZ1bmN0aW9uKCBpc0JpbmQgKSB7XG4gIC8vIG11bmdlIGlzQmluZCwgZGVmYXVsdCB0byB0cnVlXG4gIGlzQmluZCA9IGlzQmluZCA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6ICEhaXNCaW5kO1xuICAvLyBleHRyYSBiaW5kIGxvZ2ljXG4gIHZhciBiaW5kZXJFeHRyYTtcbiAgaWYgKCBuYXZpZ2F0b3IucG9pbnRlckVuYWJsZWQgKSB7XG4gICAgYmluZGVyRXh0cmEgPSBmdW5jdGlvbiggaGFuZGxlICkge1xuICAgICAgLy8gZGlzYWJsZSBzY3JvbGxpbmcgb24gdGhlIGVsZW1lbnRcbiAgICAgIGhhbmRsZS5zdHlsZS50b3VjaEFjdGlvbiA9IGlzQmluZCA/ICdub25lJyA6ICcnO1xuICAgIH07XG4gIH0gZWxzZSBpZiAoIG5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkICkge1xuICAgIGJpbmRlckV4dHJhID0gZnVuY3Rpb24oIGhhbmRsZSApIHtcbiAgICAgIC8vIGRpc2FibGUgc2Nyb2xsaW5nIG9uIHRoZSBlbGVtZW50XG4gICAgICBoYW5kbGUuc3R5bGUubXNUb3VjaEFjdGlvbiA9IGlzQmluZCA/ICdub25lJyA6ICcnO1xuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgYmluZGVyRXh0cmEgPSBmdW5jdGlvbigpIHtcbiAgICAgIC8vIFRPRE8gcmUtZW5hYmxlIGltZy5vbmRyYWdzdGFydCB3aGVuIHVuYmluZGluZ1xuICAgICAgaWYgKCBpc0JpbmQgKSB7XG4gICAgICAgIGRpc2FibGVJbWdPbmRyYWdzdGFydCggaGFuZGxlICk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICAvLyBiaW5kIGVhY2ggaGFuZGxlXG4gIHZhciBiaW5kTWV0aG9kID0gaXNCaW5kID8gJ2JpbmQnIDogJ3VuYmluZCc7XG4gIGZvciAoIHZhciBpPTAsIGxlbiA9IHRoaXMuaGFuZGxlcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICB2YXIgaGFuZGxlID0gdGhpcy5oYW5kbGVzW2ldO1xuICAgIHRoaXMuX2JpbmRTdGFydEV2ZW50KCBoYW5kbGUsIGlzQmluZCApO1xuICAgIGJpbmRlckV4dHJhKCBoYW5kbGUgKTtcbiAgICBldmVudGllWyBiaW5kTWV0aG9kIF0oIGhhbmRsZSwgJ2NsaWNrJywgdGhpcyApO1xuICB9XG59O1xuXG4vLyByZW1vdmUgZGVmYXVsdCBkcmFnZ2luZyBpbnRlcmFjdGlvbiBvbiBhbGwgaW1hZ2VzIGluIElFOFxuLy8gSUU4IGRvZXMgaXRzIG93biBkcmFnIHRoaW5nIG9uIGltYWdlcywgd2hpY2ggbWVzc2VzIHN0dWZmIHVwXG5cbmZ1bmN0aW9uIG5vRHJhZ1N0YXJ0KCkge1xuICByZXR1cm4gZmFsc2U7XG59XG5cbi8vIFRPRE8gcmVwbGFjZSB0aGlzIHdpdGggYSBJRTggdGVzdFxudmFyIGlzSUU4ID0gJ2F0dGFjaEV2ZW50JyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cbi8vIElFOCBvbmx5XG52YXIgZGlzYWJsZUltZ09uZHJhZ3N0YXJ0ID0gIWlzSUU4ID8gbm9vcCA6IGZ1bmN0aW9uKCBoYW5kbGUgKSB7XG5cbiAgaWYgKCBoYW5kbGUubm9kZU5hbWUgPT0gJ0lNRycgKSB7XG4gICAgaGFuZGxlLm9uZHJhZ3N0YXJ0ID0gbm9EcmFnU3RhcnQ7XG4gIH1cblxuICB2YXIgaW1hZ2VzID0gaGFuZGxlLnF1ZXJ5U2VsZWN0b3JBbGwoJ2ltZycpO1xuICBmb3IgKCB2YXIgaT0wLCBsZW4gPSBpbWFnZXMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgdmFyIGltZyA9IGltYWdlc1tpXTtcbiAgICBpbWcub25kcmFnc3RhcnQgPSBub0RyYWdTdGFydDtcbiAgfVxufTtcblxuLy8gLS0tLS0gc3RhcnQgZXZlbnQgLS0tLS0gLy9cblxuLyoqXG4gKiBwb2ludGVyIHN0YXJ0XG4gKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICogQHBhcmFtIHtFdmVudCBvciBUb3VjaH0gcG9pbnRlclxuICovXG5VbmlkcmFnZ2VyLnByb3RvdHlwZS5wb2ludGVyRG93biA9IGZ1bmN0aW9uKCBldmVudCwgcG9pbnRlciApIHtcbiAgdGhpcy5fZHJhZ1BvaW50ZXJEb3duKCBldmVudCwgcG9pbnRlciApO1xuICAvLyBrbHVkZ2UgdG8gYmx1ciBmb2N1c2VkIGlucHV0cyBpbiBkcmFnZ2VyXG4gIHZhciBmb2N1c2VkID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgaWYgKCBmb2N1c2VkICYmIGZvY3VzZWQuYmx1ciApIHtcbiAgICBmb2N1c2VkLmJsdXIoKTtcbiAgfVxuICAvLyBiaW5kIG1vdmUgYW5kIGVuZCBldmVudHNcbiAgdGhpcy5fYmluZFBvc3RTdGFydEV2ZW50cyggZXZlbnQgKTtcbiAgdGhpcy5lbWl0RXZlbnQoICdwb2ludGVyRG93bicsIFsgZXZlbnQsIHBvaW50ZXIgXSApO1xufTtcblxuLy8gYmFzZSBwb2ludGVyIGRvd24gbG9naWNcblVuaWRyYWdnZXIucHJvdG90eXBlLl9kcmFnUG9pbnRlckRvd24gPSBmdW5jdGlvbiggZXZlbnQsIHBvaW50ZXIgKSB7XG4gIC8vIHRyYWNrIHRvIHNlZSB3aGVuIGRyYWdnaW5nIHN0YXJ0c1xuICB0aGlzLnBvaW50ZXJEb3duUG9pbnQgPSBVbmlwb2ludGVyLmdldFBvaW50ZXJQb2ludCggcG9pbnRlciApO1xuXG4gIC8vIHByZXZlbnQgZGVmYXVsdCwgdW5sZXNzIHRvdWNoc3RhcnQgb3IgPHNlbGVjdD5cbiAgdmFyIGlzVG91Y2hzdGFydCA9IGV2ZW50LnR5cGUgPT0gJ3RvdWNoc3RhcnQnO1xuICB2YXIgdGFyZ2V0Tm9kZU5hbWUgPSBldmVudC50YXJnZXQubm9kZU5hbWU7XG4gIGlmICggIWlzVG91Y2hzdGFydCAmJiB0YXJnZXROb2RlTmFtZSAhPSAnU0VMRUNUJyApIHtcbiAgICBwcmV2ZW50RGVmYXVsdEV2ZW50KCBldmVudCApO1xuICB9XG59O1xuXG4vLyAtLS0tLSBtb3ZlIGV2ZW50IC0tLS0tIC8vXG5cbi8qKlxuICogZHJhZyBtb3ZlXG4gKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICogQHBhcmFtIHtFdmVudCBvciBUb3VjaH0gcG9pbnRlclxuICovXG5VbmlkcmFnZ2VyLnByb3RvdHlwZS5wb2ludGVyTW92ZSA9IGZ1bmN0aW9uKCBldmVudCwgcG9pbnRlciApIHtcbiAgdmFyIG1vdmVWZWN0b3IgPSB0aGlzLl9kcmFnUG9pbnRlck1vdmUoIGV2ZW50LCBwb2ludGVyICk7XG4gIHRoaXMuZW1pdEV2ZW50KCAncG9pbnRlck1vdmUnLCBbIGV2ZW50LCBwb2ludGVyLCBtb3ZlVmVjdG9yIF0gKTtcbiAgdGhpcy5fZHJhZ01vdmUoIGV2ZW50LCBwb2ludGVyLCBtb3ZlVmVjdG9yICk7XG59O1xuXG4vLyBiYXNlIHBvaW50ZXIgbW92ZSBsb2dpY1xuVW5pZHJhZ2dlci5wcm90b3R5cGUuX2RyYWdQb2ludGVyTW92ZSA9IGZ1bmN0aW9uKCBldmVudCwgcG9pbnRlciApIHtcbiAgdmFyIG1vdmVQb2ludCA9IFVuaXBvaW50ZXIuZ2V0UG9pbnRlclBvaW50KCBwb2ludGVyICk7XG4gIHZhciBtb3ZlVmVjdG9yID0ge1xuICAgIHg6IG1vdmVQb2ludC54IC0gdGhpcy5wb2ludGVyRG93blBvaW50LngsXG4gICAgeTogbW92ZVBvaW50LnkgLSB0aGlzLnBvaW50ZXJEb3duUG9pbnQueVxuICB9O1xuICAvLyBzdGFydCBkcmFnIGlmIHBvaW50ZXIgaGFzIG1vdmVkIGZhciBlbm91Z2ggdG8gc3RhcnQgZHJhZ1xuICBpZiAoICF0aGlzLmlzRHJhZ2dpbmcgJiYgdGhpcy5oYXNEcmFnU3RhcnRlZCggbW92ZVZlY3RvciApICkge1xuICAgIHRoaXMuX2RyYWdTdGFydCggZXZlbnQsIHBvaW50ZXIgKTtcbiAgfVxuICByZXR1cm4gbW92ZVZlY3Rvcjtcbn07XG5cbi8vIGNvbmRpdGlvbiBpZiBwb2ludGVyIGhhcyBtb3ZlZCBmYXIgZW5vdWdoIHRvIHN0YXJ0IGRyYWdcblVuaWRyYWdnZXIucHJvdG90eXBlLmhhc0RyYWdTdGFydGVkID0gZnVuY3Rpb24oIG1vdmVWZWN0b3IgKSB7XG4gIHJldHVybiBNYXRoLmFicyggbW92ZVZlY3Rvci54ICkgPiAzIHx8IE1hdGguYWJzKCBtb3ZlVmVjdG9yLnkgKSA+IDM7XG59O1xuXG5cbi8vIC0tLS0tIGVuZCBldmVudCAtLS0tLSAvL1xuXG4vKipcbiAqIHBvaW50ZXIgdXBcbiAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gKiBAcGFyYW0ge0V2ZW50IG9yIFRvdWNofSBwb2ludGVyXG4gKi9cblVuaWRyYWdnZXIucHJvdG90eXBlLnBvaW50ZXJVcCA9IGZ1bmN0aW9uKCBldmVudCwgcG9pbnRlciApIHtcbiAgdGhpcy5lbWl0RXZlbnQoICdwb2ludGVyVXAnLCBbIGV2ZW50LCBwb2ludGVyIF0gKTtcbiAgdGhpcy5fZHJhZ1BvaW50ZXJVcCggZXZlbnQsIHBvaW50ZXIgKTtcbn07XG5cblVuaWRyYWdnZXIucHJvdG90eXBlLl9kcmFnUG9pbnRlclVwID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyICkge1xuICBpZiAoIHRoaXMuaXNEcmFnZ2luZyApIHtcbiAgICB0aGlzLl9kcmFnRW5kKCBldmVudCwgcG9pbnRlciApO1xuICB9IGVsc2Uge1xuICAgIC8vIHBvaW50ZXIgZGlkbid0IG1vdmUgZW5vdWdoIGZvciBkcmFnIHRvIHN0YXJ0XG4gICAgdGhpcy5fc3RhdGljQ2xpY2soIGV2ZW50LCBwb2ludGVyICk7XG4gIH1cbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRyYWcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuLy8gZHJhZ1N0YXJ0XG5VbmlkcmFnZ2VyLnByb3RvdHlwZS5fZHJhZ1N0YXJ0ID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyICkge1xuICB0aGlzLmlzRHJhZ2dpbmcgPSB0cnVlO1xuICB0aGlzLmRyYWdTdGFydFBvaW50ID0gVW5pZHJhZ2dlci5nZXRQb2ludGVyUG9pbnQoIHBvaW50ZXIgKTtcbiAgLy8gcHJldmVudCBjbGlja3NcbiAgdGhpcy5pc1ByZXZlbnRpbmdDbGlja3MgPSB0cnVlO1xuXG4gIHRoaXMuZHJhZ1N0YXJ0KCBldmVudCwgcG9pbnRlciApO1xufTtcblxuVW5pZHJhZ2dlci5wcm90b3R5cGUuZHJhZ1N0YXJ0ID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyICkge1xuICB0aGlzLmVtaXRFdmVudCggJ2RyYWdTdGFydCcsIFsgZXZlbnQsIHBvaW50ZXIgXSApO1xufTtcblxuLy8gZHJhZ01vdmVcblVuaWRyYWdnZXIucHJvdG90eXBlLl9kcmFnTW92ZSA9IGZ1bmN0aW9uKCBldmVudCwgcG9pbnRlciwgbW92ZVZlY3RvciApIHtcbiAgLy8gZG8gbm90IGRyYWcgaWYgbm90IGRyYWdnaW5nIHlldFxuICBpZiAoICF0aGlzLmlzRHJhZ2dpbmcgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhpcy5kcmFnTW92ZSggZXZlbnQsIHBvaW50ZXIsIG1vdmVWZWN0b3IgKTtcbn07XG5cblVuaWRyYWdnZXIucHJvdG90eXBlLmRyYWdNb3ZlID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyLCBtb3ZlVmVjdG9yICkge1xuICBwcmV2ZW50RGVmYXVsdEV2ZW50KCBldmVudCApO1xuICB0aGlzLmVtaXRFdmVudCggJ2RyYWdNb3ZlJywgWyBldmVudCwgcG9pbnRlciwgbW92ZVZlY3RvciBdICk7XG59O1xuXG4vLyBkcmFnRW5kXG5VbmlkcmFnZ2VyLnByb3RvdHlwZS5fZHJhZ0VuZCA9IGZ1bmN0aW9uKCBldmVudCwgcG9pbnRlciApIHtcbiAgLy8gc2V0IGZsYWdzXG4gIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xuICAvLyByZS1lbmFibGUgY2xpY2tpbmcgYXN5bmNcbiAgdmFyIF90aGlzID0gdGhpcztcbiAgc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG4gICAgZGVsZXRlIF90aGlzLmlzUHJldmVudGluZ0NsaWNrcztcbiAgfSk7XG5cbiAgdGhpcy5kcmFnRW5kKCBldmVudCwgcG9pbnRlciApO1xufTtcblxuVW5pZHJhZ2dlci5wcm90b3R5cGUuZHJhZ0VuZCA9IGZ1bmN0aW9uKCBldmVudCwgcG9pbnRlciApIHtcbiAgdGhpcy5lbWl0RXZlbnQoICdkcmFnRW5kJywgWyBldmVudCwgcG9pbnRlciBdICk7XG59O1xuXG4vLyAtLS0tLSBvbmNsaWNrIC0tLS0tIC8vXG5cbi8vIGhhbmRsZSBhbGwgY2xpY2tzIGFuZCBwcmV2ZW50IGNsaWNrcyB3aGVuIGRyYWdnaW5nXG5VbmlkcmFnZ2VyLnByb3RvdHlwZS5vbmNsaWNrID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICBpZiAoIHRoaXMuaXNQcmV2ZW50aW5nQ2xpY2tzICkge1xuICAgIHByZXZlbnREZWZhdWx0RXZlbnQoIGV2ZW50ICk7XG4gIH1cbn07XG5cbi8vIC0tLS0tIHN0YXRpY0NsaWNrIC0tLS0tIC8vXG5cbi8vIHRyaWdnZXJlZCBhZnRlciBwb2ludGVyIGRvd24gJiB1cCB3aXRoIG5vL3RpbnkgbW92ZW1lbnRcblVuaWRyYWdnZXIucHJvdG90eXBlLl9zdGF0aWNDbGljayA9IGZ1bmN0aW9uKCBldmVudCwgcG9pbnRlciApIHtcbiAgLy8gYWxsb3cgY2xpY2sgaW4gPGlucHV0PnMgYW5kIDx0ZXh0YXJlYT5zXG4gIHZhciBub2RlTmFtZSA9IGV2ZW50LnRhcmdldC5ub2RlTmFtZTtcbiAgaWYgKCBub2RlTmFtZSA9PSAnSU5QVVQnIHx8IG5vZGVOYW1lID09ICdURVhUQVJFQScgKSB7XG4gICAgZXZlbnQudGFyZ2V0LmZvY3VzKCk7XG4gIH1cbiAgdGhpcy5zdGF0aWNDbGljayggZXZlbnQsIHBvaW50ZXIgKTtcbn07XG5cblVuaWRyYWdnZXIucHJvdG90eXBlLnN0YXRpY0NsaWNrID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyICkge1xuICB0aGlzLmVtaXRFdmVudCggJ3N0YXRpY0NsaWNrJywgWyBldmVudCwgcG9pbnRlciBdICk7XG59O1xuXG4vLyAtLS0tLSAgLS0tLS0gLy9cblxuVW5pZHJhZ2dlci5nZXRQb2ludGVyUG9pbnQgPSBmdW5jdGlvbiggcG9pbnRlciApIHtcbiAgcmV0dXJuIHtcbiAgICB4OiBwb2ludGVyLnBhZ2VYICE9PSB1bmRlZmluZWQgPyBwb2ludGVyLnBhZ2VYIDogcG9pbnRlci5jbGllbnRYLFxuICAgIHk6IHBvaW50ZXIucGFnZVkgIT09IHVuZGVmaW5lZCA/IHBvaW50ZXIucGFnZVkgOiBwb2ludGVyLmNsaWVudFlcbiAgfTtcbn07XG5cbi8vIC0tLS0tICAtLS0tLSAvL1xuXG5VbmlkcmFnZ2VyLmdldFBvaW50ZXJQb2ludCA9IFVuaXBvaW50ZXIuZ2V0UG9pbnRlclBvaW50O1xuXG5yZXR1cm4gVW5pZHJhZ2dlcjtcblxufSkpO1xuIiwidmFyICQgPSAod2luZG93LmpRdWVyeSlcbnZhciBGbGlja2l0eSA9IHJlcXVpcmUoJ2ZsaWNraXR5JylcbnJlcXVpcmUoJ2ZsaWNraXR5LWltYWdlc2xvYWRlZCcpXG5cbnZhciBTY3JvbGxOYXYgPSByZXF1aXJlKCcuL2xpYi9zY3JvbGwtbmF2JylcblxudmFyIFNpdGUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5sb2FkSW1hZ2VzKClcblxuICB0aGlzLiRib2R5ID0gJCgnYm9keScpXG4gIHRoaXMubmF2ID0gbmV3IFNjcm9sbE5hdigpXG5cbiAgJCh3aW5kb3cpLm9uKCdzY3JvbGwnLCB0aGlzLmNoZWNrSGVhZGVyLmJpbmQodGhpcykpXG5cbiAgdmFyICRzbGlkZXJJY29ucyA9ICQoJy5wcm9maWxlLXNsaWRlci1pY29ucycpO1xuXG4gIG5ldyBGbGlja2l0eSgkc2xpZGVySWNvbnNbMF0sIHtcbiAgICBjZWxsU2VsZWN0b3I6ICcuc2xpZGVyLWl0ZW0nLFxuICAgIHBhZ2VEb3RzOiBmYWxzZSxcbiAgICB3cmFwQXJvdW5kOiB0cnVlXG4gIH0pXG5cbiAgdmFyICRzbGlkZXJQaG90b3MgPSAkKCcuZGlldGl0aWFuLXNsaWRlci1waG90b3MnKTtcblxuICB2YXIgZGlldGl0aWFuU2xpZGVyID0gbmV3IEZsaWNraXR5KCRzbGlkZXJQaG90b3NbMF0sIHtcbiAgICBjZWxsU2VsZWN0b3I6ICcuc2xpZGVyLWl0ZW0nLFxuICAgIHBhZ2VEb3RzOiBmYWxzZSxcbiAgICBwcmV2TmV4dEJ1dHRvbnM6IGZhbHNlLFxuICAgIGNvbnRhaW46IHRydWUsXG4gICAgZHJhZ2dhYmxlOiBmYWxzZVxuICB9KVxuXG4gICRzbGlkZXJQaG90b3MuZmluZCgnLnNsaWRlci1pdGVtJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgZGlldGl0aWFuU2xpZGVyLnNlbGVjdCgkKHRoaXMpLmluZGV4KCkpXG4gIH0pXG5cbiAgdmFyICRjeWNsZUNhcHRpb25zID0gJCgnLmN5Y2xlLWNhcHRpb25zJylcblxuICAkc2xpZGVyUGhvdG9zLm9uKCdjZWxsU2VsZWN0JywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGkgPSBkaWV0aXRpYW5TbGlkZXIuc2VsZWN0ZWRJbmRleFxuXG4gICAgJGN5Y2xlQ2FwdGlvbnMuZmluZCgnLmN5Y2xlLWl0ZW0nKS5lcShpKS5hZGRDbGFzcygnYWN0aXZlJykuc2libGluZ3MoKS5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgfSlcblxuICB2YXIgJGN5Y2xlU2h1ZmZsZSA9ICQoJy5jeWNsZS1zaHVmZmxlJylcblxuICAkY3ljbGVTaHVmZmxlLm5leHQoJy5jeWNsZS1zaHVmZmxlLWJ1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIHZhciAkYWN0aXZlID0gJGN5Y2xlU2h1ZmZsZS5maW5kKCcuYWN0aXZlJylcbiAgICB2YXIgJG5leHQgPSAkYWN0aXZlLm5leHQoJy5jeWNsZS1pdGVtJylcblxuICAgIGlmKCEkbmV4dC5sZW5ndGgpIHtcbiAgICAgICRuZXh0ID0gJGN5Y2xlU2h1ZmZsZS5maW5kKCcuY3ljbGUtaXRlbScpLmZpcnN0KClcbiAgICB9XG5cbiAgICAkbmV4dC5hZGRDbGFzcygnYWN0aXZlJykuc2libGluZ3MoKS5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgfSlcbn1cblxuU2l0ZS5wcm90b3R5cGUgPSB7XG4gIGNoZWNrSGVhZGVyOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLiRib2R5LnRvZ2dsZUNsYXNzKCdhdC10b3AnLCB3aW5kb3cuc2Nyb2xsWSA8PSA1MClcbiAgfSxcblxuICBsb2FkSW1hZ2VzOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgJGVsZW1lbnRzVG9Mb2FkID0gJCgnW2RhdGEtYmctc3JjXScpLm5vdCgnLmJnLWxvYWRpbmcsIC5iZy1sb2FkZWQnKVxuXG4gICAgJGVsZW1lbnRzVG9Mb2FkLmVhY2goZnVuY3Rpb24oKSB7XG5cbiAgICAgIHZhciAkZWwgPSAkKHRoaXMpXG5cbiAgICAgIHZhciBzcmMgPSAkZWwuYXR0cignZGF0YS1iZy1zcmMnKVxuXG4gICAgICAkZWwuYWRkQ2xhc3MoJ2JnLWxvYWRpbmcnKVxuXG4gICAgICB2YXIgaW0gPSBuZXcgSW1hZ2UoKVxuXG4gICAgICAkKGltKS5vbignbG9hZCcsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICRlbC5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCAndXJsKCcrc3JjKycpJykucmVtb3ZlQ2xhc3MoJ2JnLWxvYWRpbmcnKS5hZGRDbGFzcygnYmctbG9hZGVkJylcblxuICAgICAgfSlcblxuICAgICAgaW0uc3JjID0gc3JjXG5cbiAgICAgIGlmKGltLmNvbXBsZXRlKSB7XG4gICAgICAgICQoaW0pLnRyaWdnZXIoJ2xvYWQnKVxuICAgICAgfVxuXG4gICAgfSlcbiAgfVxufVxuXG5uZXcgU2l0ZSgpIiwidmFyICQgPSAod2luZG93LmpRdWVyeSlcbnJlcXVpcmUoJ2pxdWVyeS1tb3VzZXdoZWVsJykoJClcblxudmFyIFZlbG9jaXR5ID0gcmVxdWlyZSgndmVsb2NpdHknKVxuXG52YXIgU2Nyb2xsTmF2ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuaW5kaWNhdG9ycycpXG4gIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWFpbicpXG4gIHRoaXMuZm9vdGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZm9vdGVyLmJvdHRvbScpXG4gIFxuICB0aGlzLnVwZGF0ZUl0ZW1zKClcbiAgdGhpcy51cGRhdGVNYXAoKVxuICB0aGlzLnVwZGF0ZUFjdGl2ZSgpXG5cbiAgdGhpcy5lYXNpbmcgPSBbLjU1LCAuMSwgLjI1LCAuOTVdXG5cbiAgJCh3aW5kb3cpXG4gICAgLm9uKCdyZXNpemUnLCBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMudXBkYXRlTWFwKClcbiAgICAgIHRoaXMudXBkYXRlQWN0aXZlKClcbiAgICB9LmJpbmQodGhpcykpXG4gICAgLm9uKCdzY3JvbGwnLCB0aGlzLnVwZGF0ZUFjdGl2ZS5iaW5kKHRoaXMpKVxuXG4gIHRoaXMuJGl0ZW1zLmZpbmQoJ2EnKS5hZGQoJy5ob21lLWxpbmssIC5zY3JvbGwtbGluaywgLnNlY3Rpb24tbGlua3MgYScpXG4gICAgLm9uKCdjbGljaycsIHRoaXMuY2xpY2tOYXZMaW5rLmJpbmQodGhpcykpXG5cbiAgJCh3aW5kb3cpLm9uKCdrZXlkb3duJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBpZih0aGlzLnNtKSB7IHJldHVybiB9XG5cbiAgICBpZihldmVudC53aGljaCA9PT0gNDApIHtcbiAgICAgIHRoaXMucGFnZURvd24oKVxuICAgIH0gZWxzZSBpZihldmVudC53aGljaCA9PT0gMzgpIHtcbiAgICAgIHRoaXMucGFnZVVwKClcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICB9LmJpbmQodGhpcykpXG59XG5cblNjcm9sbE5hdi5wcm90b3R5cGUgPSB7XG4gIHVwZGF0ZUl0ZW1zOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLml0ZW1zID0ge31cbiAgICB0aGlzLnRhcmdldHMgPSB7fVxuXG4gICAgdmFyIGl0ZW1FbGVtZW50cyA9IHRoaXMuZWwucXVlcnlTZWxlY3RvckFsbCgnbGknKVxuICAgIHZhciB0YXJnZXRFbGVtZW50cyA9IFtdXG5cbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgaXRlbUVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaXRlbSA9IGl0ZW1FbGVtZW50c1tpXVxuICAgICAgdmFyIGhyZWYgPSBpdGVtLnF1ZXJ5U2VsZWN0b3IoJ2EnKS5nZXRBdHRyaWJ1dGUoJ2hyZWYnKVxuXG4gICAgICBpZihocmVmLmNoYXJBdCgwKSAhPT0gJyMnKSB7IGNvbnRpbnVlIH1cblxuICAgICAgdmFyIHRhcmdldCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoaHJlZilcbiAgICAgIHZhciBpZCA9IGhyZWYuc3Vic3RyKDEpXG5cbiAgICAgIHRoaXMuaXRlbXNbaWRdID0gaXRlbVxuICAgICAgdGhpcy50YXJnZXRzW2lkXSA9IHRhcmdldFxuXG4gICAgICB0YXJnZXRFbGVtZW50cy5wdXNoKHRhcmdldClcbiAgICB9XG5cbiAgICB0aGlzLiRpdGVtcyA9ICQoaXRlbUVsZW1lbnRzKVxuICAgIHRoaXMuJHRhcmdldHMgPSAkKHRhcmdldEVsZW1lbnRzKS5hZGQoJyNob21lJykuYWRkKHRoaXMuZm9vdGVyKVxuICB9LFxuXG4gIHVwZGF0ZU1hcDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1hcCA9IHt9XG4gICAgdmFyIHNjcm9sbFkgPSB3aW5kb3cuc2Nyb2xsWVxuXG4gICAgZm9yKHZhciB0IGluIHRoaXMudGFyZ2V0cykge1xuICAgICAgdmFyIGVsID0gdGhpcy50YXJnZXRzW3RdXG5cbiAgICAgIHZhciBvZmZzZXQgPSAkKGVsKS5vZmZzZXQoKVxuICAgICAgdmFyIHRvcCA9IG9mZnNldC50b3BcblxuICAgICAgbWFwW3RvcF0gPSBtYXBbdG9wXSB8fCBbXVxuXG4gICAgICBtYXBbdG9wXS5wdXNoKHtcbiAgICAgICAgaWQ6IHQsXG4gICAgICAgIGVsOiBlbCxcbiAgICAgICAgdG9wOiB0b3AsXG4gICAgICAgIGJvdHRvbTogdG9wICsgJChlbCkuaGVpZ2h0KClcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgdGhpcy5tYXAgPSBtYXBcblxuICAgIHRoaXMuc20gPSAod2luZG93LmlubmVySGVpZ2h0IDwgNTAwKSB8fCAod2luZG93LmlubmVyV2lkdGggPCA3MDApXG4gIH0sXG5cbiAgdXBkYXRlQWN0aXZlOiBmdW5jdGlvbihldmVudCkge1xuICAgIGlmKHRoaXMuc20pIHsgcmV0dXJuIH1cblxuICAgIHZhciBzY3JvbGxZID0gd2luZG93LnNjcm9sbFkgKyAod2luZG93LmlubmVySGVpZ2h0IC8gMilcbiAgICB2YXIgc2Nyb2xsQm90dG9tID0gc2Nyb2xsWVxuICAgIHZhciBhY3RpdmUgPSBbXVxuICAgIHZhciBhY3RpdmVJdGVtcyA9IFtdXG5cbiAgICBmb3IodmFyIHNlY3Rpb25ZIGluIHRoaXMubWFwKSB7XG5cbiAgICAgIGlmKHNlY3Rpb25ZIDwgc2Nyb2xsQm90dG9tKSB7XG4gICAgICAgIHZhciBzZWN0aW9ucyA9IHRoaXMubWFwW3NlY3Rpb25ZXVxuXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBzZWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBzZWN0aW9uID0gc2VjdGlvbnNbaV1cbiAgICAgICAgICB2YXIgaXRlbSA9IHRoaXMuaXRlbXNbc2VjdGlvbi5pZF1cblxuICAgICAgICAgIGlmKHNlY3Rpb24uYm90dG9tID4gc2Nyb2xsWSkge1xuICAgICAgICAgICAgYWN0aXZlLnB1c2goc2VjdGlvbi5lbClcbiAgICAgICAgICAgIGFjdGl2ZUl0ZW1zLnB1c2goaXRlbSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgIH1cblxuICAgIHZhciBhdEhvbWUgPSAhJChhY3RpdmUpLmxlbmd0aCAmJiBzY3JvbGxZIDwgd2luZG93LmlubmVySGVpZ2h0XG5cbiAgICAkKCdib2R5JykudG9nZ2xlQ2xhc3MoJ2F0LWhvbWUnLCBhdEhvbWUpXG5cbiAgICAkKGFjdGl2ZSkuYWRkKGFjdGl2ZUl0ZW1zKS5hZGRDbGFzcygnYWN0aXZlJylcblxuICAgIHRoaXMuJHRhcmdldHMubm90KGFjdGl2ZSkucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgdGhpcy4kaXRlbXMubm90KGFjdGl2ZUl0ZW1zKS5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgfSxcblxuICBjbGlja05hdkxpbms6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuXG4gICAgdmFyIGl0ZW0gPSBldmVudC5jdXJyZW50VGFyZ2V0XG4gICAgdmFyIHRhcmdldElEID0gaXRlbS5nZXRBdHRyaWJ1dGUoJ2hyZWYnKS5zdWJzdHIoMSlcbiAgICB2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXRzW3RhcmdldElEXSB8fCAkKCcjJyt0YXJnZXRJRClbMF1cblxuICAgIHRoaXMuc2Nyb2xsVG8odGFyZ2V0KVxuICB9LFxuXG4gIHNjcm9sbFRvOiBmdW5jdGlvbihlbCkge1xuICAgIHRoaXMuJHRhcmdldHMudmVsb2NpdHkoJ3N0b3AnKVxuXG4gICAgVmVsb2NpdHkoZWwsICdzY3JvbGwnLCB7XG4gICAgICBkdXJhdGlvbjogNjAwLFxuICAgICAgZWFzaW5nOiB0aGlzLmVhc2luZyxcbiAgICAgIG9mZnNldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBvZmZzZXQgPSAod2luZG93LmlubmVySGVpZ2h0IC0gZWwub2Zmc2V0SGVpZ2h0KSAqIC0xXG5cbiAgICAgICAgaWYob2Zmc2V0ID49IHdpbmRvdy5pbm5lckhlaWdodCkge1xuICAgICAgICAgIHJldHVybiAwXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG9mZnNldFxuICAgICAgICB9XG4gICAgICB9KClcbiAgICB9KVxuICB9LFxuXG4gIHBhZ2VEb3duOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgJGFjdGl2ZUl0ZW0gPSB0aGlzLiRpdGVtcy5maWx0ZXIoJy5hY3RpdmUnKS5sYXN0KCk7XG4gICAgdmFyICRuZXh0ID0gJCgpO1xuXG4gICAgaWYoISRhY3RpdmVJdGVtLmxlbmd0aCkge1xuICAgICAgJG5leHQgPSB0aGlzLiRpdGVtcy5maXJzdCgpXG4gICAgfSBlbHNlIHtcbiAgICAgICRuZXh0ID0gJGFjdGl2ZUl0ZW0ubmV4dCgnbGknKVxuXG4gICAgICBpZighJG5leHQubGVuZ3RoKSB7XG4gICAgICAgICRuZXh0ID0gJGFjdGl2ZUl0ZW0ucGFyZW50cygnbGknKS5uZXh0KCdsaScpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYoJG5leHQubGVuZ3RoKSB7XG4gICAgICAkbmV4dC5maW5kKCdhJykuZmlyc3QoKS50cmlnZ2VyKCdjbGljaycpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2Nyb2xsVG8odGhpcy5mb290ZXIpXG4gICAgfVxuICB9LFxuXG4gIHBhZ2VVcDogZnVuY3Rpb24oKSB7XG4gICAgdmFyICRhY3RpdmVJdGVtID0gdGhpcy4kaXRlbXMuZmlsdGVyKCcuYWN0aXZlJykubGFzdCgpXG4gICAgdmFyICRwcmV2ID0gJCgpXG5cbiAgICBpZighJGFjdGl2ZUl0ZW0ubGVuZ3RoKSB7XG4gICAgICBpZih3aW5kb3cuc2Nyb2xsWSA+IHdpbmRvdy5pbm5lckhlaWdodCkge1xuICAgICAgICAkcHJldiA9IHRoaXMuJGl0ZW1zLmxhc3QoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICRwcmV2ID0gJGFjdGl2ZUl0ZW0ucHJldignbGknKVxuXG4gICAgICBpZighJHByZXYubGVuZ3RoKSB7XG4gICAgICAgICRwcmV2ID0gJGFjdGl2ZUl0ZW0ucGFyZW50cygnbGknKS5wcmV2KCdsaScpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYoJHByZXYuZmluZCgnbGknKS5sZW5ndGgpIHtcbiAgICAgICRwcmV2ID0gJHByZXYuZmluZCgnbGknKS5sYXN0KClcbiAgICB9XG5cblxuICAgIGlmKCRwcmV2Lmxlbmd0aCkge1xuICAgICAgJHByZXYuZmluZCgnYScpLmZpcnN0KCkudHJpZ2dlcignY2xpY2snKVxuICAgIH0gZWxzZSB7XG4gICAgICAkKCcuaG9tZS1saW5rJykudHJpZ2dlcignY2xpY2snKVxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNjcm9sbE5hdiIsIi8qISBDb3B5cmlnaHQgKGMpIDIwMTMgQnJhbmRvbiBBYXJvbiAoaHR0cDovL2JyYW5kb24uYWFyb24uc2gpXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UgKExJQ0VOU0UudHh0KS5cbiAqXG4gKiBWZXJzaW9uOiAzLjEuMTJcbiAqXG4gKiBSZXF1aXJlczogalF1ZXJ5IDEuMi4yK1xuICovXG5cbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICggdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAgICAgICAvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG4gICAgICAgIGRlZmluZShbJ2pxdWVyeSddLCBmYWN0b3J5KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICAvLyBOb2RlL0NvbW1vbkpTIHN0eWxlIGZvciBCcm93c2VyaWZ5XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBCcm93c2VyIGdsb2JhbHNcbiAgICAgICAgZmFjdG9yeShqUXVlcnkpO1xuICAgIH1cbn0oZnVuY3Rpb24gKCQpIHtcblxuICAgIHZhciB0b0ZpeCAgPSBbJ3doZWVsJywgJ21vdXNld2hlZWwnLCAnRE9NTW91c2VTY3JvbGwnLCAnTW96TW91c2VQaXhlbFNjcm9sbCddLFxuICAgICAgICB0b0JpbmQgPSAoICdvbndoZWVsJyBpbiBkb2N1bWVudCB8fCBkb2N1bWVudC5kb2N1bWVudE1vZGUgPj0gOSApID9cbiAgICAgICAgICAgICAgICAgICAgWyd3aGVlbCddIDogWydtb3VzZXdoZWVsJywgJ0RvbU1vdXNlU2Nyb2xsJywgJ01vek1vdXNlUGl4ZWxTY3JvbGwnXSxcbiAgICAgICAgc2xpY2UgID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLFxuICAgICAgICBudWxsTG93ZXN0RGVsdGFUaW1lb3V0LCBsb3dlc3REZWx0YTtcblxuICAgIGlmICggJC5ldmVudC5maXhIb29rcyApIHtcbiAgICAgICAgZm9yICggdmFyIGkgPSB0b0ZpeC5sZW5ndGg7IGk7ICkge1xuICAgICAgICAgICAgJC5ldmVudC5maXhIb29rc1sgdG9GaXhbLS1pXSBdID0gJC5ldmVudC5tb3VzZUhvb2tzO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHNwZWNpYWwgPSAkLmV2ZW50LnNwZWNpYWwubW91c2V3aGVlbCA9IHtcbiAgICAgICAgdmVyc2lvbjogJzMuMS4xMicsXG5cbiAgICAgICAgc2V0dXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCB0aGlzLmFkZEV2ZW50TGlzdGVuZXIgKSB7XG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSB0b0JpbmQubGVuZ3RoOyBpOyApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKCB0b0JpbmRbLS1pXSwgaGFuZGxlciwgZmFsc2UgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMub25tb3VzZXdoZWVsID0gaGFuZGxlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFN0b3JlIHRoZSBsaW5lIGhlaWdodCBhbmQgcGFnZSBoZWlnaHQgZm9yIHRoaXMgcGFydGljdWxhciBlbGVtZW50XG4gICAgICAgICAgICAkLmRhdGEodGhpcywgJ21vdXNld2hlZWwtbGluZS1oZWlnaHQnLCBzcGVjaWFsLmdldExpbmVIZWlnaHQodGhpcykpO1xuICAgICAgICAgICAgJC5kYXRhKHRoaXMsICdtb3VzZXdoZWVsLXBhZ2UtaGVpZ2h0Jywgc3BlY2lhbC5nZXRQYWdlSGVpZ2h0KHRoaXMpKTtcbiAgICAgICAgfSxcblxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lciApIHtcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IHRvQmluZC5sZW5ndGg7IGk7ICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoIHRvQmluZFstLWldLCBoYW5kbGVyLCBmYWxzZSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbm1vdXNld2hlZWwgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQ2xlYW4gdXAgdGhlIGRhdGEgd2UgYWRkZWQgdG8gdGhlIGVsZW1lbnRcbiAgICAgICAgICAgICQucmVtb3ZlRGF0YSh0aGlzLCAnbW91c2V3aGVlbC1saW5lLWhlaWdodCcpO1xuICAgICAgICAgICAgJC5yZW1vdmVEYXRhKHRoaXMsICdtb3VzZXdoZWVsLXBhZ2UtaGVpZ2h0Jyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0TGluZUhlaWdodDogZnVuY3Rpb24oZWxlbSkge1xuICAgICAgICAgICAgdmFyICRlbGVtID0gJChlbGVtKSxcbiAgICAgICAgICAgICAgICAkcGFyZW50ID0gJGVsZW1bJ29mZnNldFBhcmVudCcgaW4gJC5mbiA/ICdvZmZzZXRQYXJlbnQnIDogJ3BhcmVudCddKCk7XG4gICAgICAgICAgICBpZiAoISRwYXJlbnQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgJHBhcmVudCA9ICQoJ2JvZHknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwYXJzZUludCgkcGFyZW50LmNzcygnZm9udFNpemUnKSwgMTApIHx8IHBhcnNlSW50KCRlbGVtLmNzcygnZm9udFNpemUnKSwgMTApIHx8IDE2O1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldFBhZ2VIZWlnaHQ6IGZ1bmN0aW9uKGVsZW0pIHtcbiAgICAgICAgICAgIHJldHVybiAkKGVsZW0pLmhlaWdodCgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICBhZGp1c3RPbGREZWx0YXM6IHRydWUsIC8vIHNlZSBzaG91bGRBZGp1c3RPbGREZWx0YXMoKSBiZWxvd1xuICAgICAgICAgICAgbm9ybWFsaXplT2Zmc2V0OiB0cnVlICAvLyBjYWxscyBnZXRCb3VuZGluZ0NsaWVudFJlY3QgZm9yIGVhY2ggZXZlbnRcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmZuLmV4dGVuZCh7XG4gICAgICAgIG1vdXNld2hlZWw6IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4gPyB0aGlzLmJpbmQoJ21vdXNld2hlZWwnLCBmbikgOiB0aGlzLnRyaWdnZXIoJ21vdXNld2hlZWwnKTtcbiAgICAgICAgfSxcblxuICAgICAgICB1bm1vdXNld2hlZWw6IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy51bmJpbmQoJ21vdXNld2hlZWwnLCBmbik7XG4gICAgICAgIH1cbiAgICB9KTtcblxuXG4gICAgZnVuY3Rpb24gaGFuZGxlcihldmVudCkge1xuICAgICAgICB2YXIgb3JnRXZlbnQgICA9IGV2ZW50IHx8IHdpbmRvdy5ldmVudCxcbiAgICAgICAgICAgIGFyZ3MgICAgICAgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSksXG4gICAgICAgICAgICBkZWx0YSAgICAgID0gMCxcbiAgICAgICAgICAgIGRlbHRhWCAgICAgPSAwLFxuICAgICAgICAgICAgZGVsdGFZICAgICA9IDAsXG4gICAgICAgICAgICBhYnNEZWx0YSAgID0gMCxcbiAgICAgICAgICAgIG9mZnNldFggICAgPSAwLFxuICAgICAgICAgICAgb2Zmc2V0WSAgICA9IDA7XG4gICAgICAgIGV2ZW50ID0gJC5ldmVudC5maXgob3JnRXZlbnQpO1xuICAgICAgICBldmVudC50eXBlID0gJ21vdXNld2hlZWwnO1xuXG4gICAgICAgIC8vIE9sZCBzY2hvb2wgc2Nyb2xsd2hlZWwgZGVsdGFcbiAgICAgICAgaWYgKCAnZGV0YWlsJyAgICAgIGluIG9yZ0V2ZW50ICkgeyBkZWx0YVkgPSBvcmdFdmVudC5kZXRhaWwgKiAtMTsgICAgICB9XG4gICAgICAgIGlmICggJ3doZWVsRGVsdGEnICBpbiBvcmdFdmVudCApIHsgZGVsdGFZID0gb3JnRXZlbnQud2hlZWxEZWx0YTsgICAgICAgfVxuICAgICAgICBpZiAoICd3aGVlbERlbHRhWScgaW4gb3JnRXZlbnQgKSB7IGRlbHRhWSA9IG9yZ0V2ZW50LndoZWVsRGVsdGFZOyAgICAgIH1cbiAgICAgICAgaWYgKCAnd2hlZWxEZWx0YVgnIGluIG9yZ0V2ZW50ICkgeyBkZWx0YVggPSBvcmdFdmVudC53aGVlbERlbHRhWCAqIC0xOyB9XG5cbiAgICAgICAgLy8gRmlyZWZveCA8IDE3IGhvcml6b250YWwgc2Nyb2xsaW5nIHJlbGF0ZWQgdG8gRE9NTW91c2VTY3JvbGwgZXZlbnRcbiAgICAgICAgaWYgKCAnYXhpcycgaW4gb3JnRXZlbnQgJiYgb3JnRXZlbnQuYXhpcyA9PT0gb3JnRXZlbnQuSE9SSVpPTlRBTF9BWElTICkge1xuICAgICAgICAgICAgZGVsdGFYID0gZGVsdGFZICogLTE7XG4gICAgICAgICAgICBkZWx0YVkgPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2V0IGRlbHRhIHRvIGJlIGRlbHRhWSBvciBkZWx0YVggaWYgZGVsdGFZIGlzIDAgZm9yIGJhY2t3YXJkcyBjb21wYXRhYmlsaXRpeVxuICAgICAgICBkZWx0YSA9IGRlbHRhWSA9PT0gMCA/IGRlbHRhWCA6IGRlbHRhWTtcblxuICAgICAgICAvLyBOZXcgc2Nob29sIHdoZWVsIGRlbHRhICh3aGVlbCBldmVudClcbiAgICAgICAgaWYgKCAnZGVsdGFZJyBpbiBvcmdFdmVudCApIHtcbiAgICAgICAgICAgIGRlbHRhWSA9IG9yZ0V2ZW50LmRlbHRhWSAqIC0xO1xuICAgICAgICAgICAgZGVsdGEgID0gZGVsdGFZO1xuICAgICAgICB9XG4gICAgICAgIGlmICggJ2RlbHRhWCcgaW4gb3JnRXZlbnQgKSB7XG4gICAgICAgICAgICBkZWx0YVggPSBvcmdFdmVudC5kZWx0YVg7XG4gICAgICAgICAgICBpZiAoIGRlbHRhWSA9PT0gMCApIHsgZGVsdGEgID0gZGVsdGFYICogLTE7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5vIGNoYW5nZSBhY3R1YWxseSBoYXBwZW5lZCwgbm8gcmVhc29uIHRvIGdvIGFueSBmdXJ0aGVyXG4gICAgICAgIGlmICggZGVsdGFZID09PSAwICYmIGRlbHRhWCA9PT0gMCApIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgLy8gTmVlZCB0byBjb252ZXJ0IGxpbmVzIGFuZCBwYWdlcyB0byBwaXhlbHMgaWYgd2UgYXJlbid0IGFscmVhZHkgaW4gcGl4ZWxzXG4gICAgICAgIC8vIFRoZXJlIGFyZSB0aHJlZSBkZWx0YSBtb2RlczpcbiAgICAgICAgLy8gICAqIGRlbHRhTW9kZSAwIGlzIGJ5IHBpeGVscywgbm90aGluZyB0byBkb1xuICAgICAgICAvLyAgICogZGVsdGFNb2RlIDEgaXMgYnkgbGluZXNcbiAgICAgICAgLy8gICAqIGRlbHRhTW9kZSAyIGlzIGJ5IHBhZ2VzXG4gICAgICAgIGlmICggb3JnRXZlbnQuZGVsdGFNb2RlID09PSAxICkge1xuICAgICAgICAgICAgdmFyIGxpbmVIZWlnaHQgPSAkLmRhdGEodGhpcywgJ21vdXNld2hlZWwtbGluZS1oZWlnaHQnKTtcbiAgICAgICAgICAgIGRlbHRhICAqPSBsaW5lSGVpZ2h0O1xuICAgICAgICAgICAgZGVsdGFZICo9IGxpbmVIZWlnaHQ7XG4gICAgICAgICAgICBkZWx0YVggKj0gbGluZUhlaWdodDtcbiAgICAgICAgfSBlbHNlIGlmICggb3JnRXZlbnQuZGVsdGFNb2RlID09PSAyICkge1xuICAgICAgICAgICAgdmFyIHBhZ2VIZWlnaHQgPSAkLmRhdGEodGhpcywgJ21vdXNld2hlZWwtcGFnZS1oZWlnaHQnKTtcbiAgICAgICAgICAgIGRlbHRhICAqPSBwYWdlSGVpZ2h0O1xuICAgICAgICAgICAgZGVsdGFZICo9IHBhZ2VIZWlnaHQ7XG4gICAgICAgICAgICBkZWx0YVggKj0gcGFnZUhlaWdodDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN0b3JlIGxvd2VzdCBhYnNvbHV0ZSBkZWx0YSB0byBub3JtYWxpemUgdGhlIGRlbHRhIHZhbHVlc1xuICAgICAgICBhYnNEZWx0YSA9IE1hdGgubWF4KCBNYXRoLmFicyhkZWx0YVkpLCBNYXRoLmFicyhkZWx0YVgpICk7XG5cbiAgICAgICAgaWYgKCAhbG93ZXN0RGVsdGEgfHwgYWJzRGVsdGEgPCBsb3dlc3REZWx0YSApIHtcbiAgICAgICAgICAgIGxvd2VzdERlbHRhID0gYWJzRGVsdGE7XG5cbiAgICAgICAgICAgIC8vIEFkanVzdCBvbGRlciBkZWx0YXMgaWYgbmVjZXNzYXJ5XG4gICAgICAgICAgICBpZiAoIHNob3VsZEFkanVzdE9sZERlbHRhcyhvcmdFdmVudCwgYWJzRGVsdGEpICkge1xuICAgICAgICAgICAgICAgIGxvd2VzdERlbHRhIC89IDQwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRqdXN0IG9sZGVyIGRlbHRhcyBpZiBuZWNlc3NhcnlcbiAgICAgICAgaWYgKCBzaG91bGRBZGp1c3RPbGREZWx0YXMob3JnRXZlbnQsIGFic0RlbHRhKSApIHtcbiAgICAgICAgICAgIC8vIERpdmlkZSBhbGwgdGhlIHRoaW5ncyBieSA0MCFcbiAgICAgICAgICAgIGRlbHRhICAvPSA0MDtcbiAgICAgICAgICAgIGRlbHRhWCAvPSA0MDtcbiAgICAgICAgICAgIGRlbHRhWSAvPSA0MDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdldCBhIHdob2xlLCBub3JtYWxpemVkIHZhbHVlIGZvciB0aGUgZGVsdGFzXG4gICAgICAgIGRlbHRhICA9IE1hdGhbIGRlbHRhICA+PSAxID8gJ2Zsb29yJyA6ICdjZWlsJyBdKGRlbHRhICAvIGxvd2VzdERlbHRhKTtcbiAgICAgICAgZGVsdGFYID0gTWF0aFsgZGVsdGFYID49IDEgPyAnZmxvb3InIDogJ2NlaWwnIF0oZGVsdGFYIC8gbG93ZXN0RGVsdGEpO1xuICAgICAgICBkZWx0YVkgPSBNYXRoWyBkZWx0YVkgPj0gMSA/ICdmbG9vcicgOiAnY2VpbCcgXShkZWx0YVkgLyBsb3dlc3REZWx0YSk7XG5cbiAgICAgICAgLy8gTm9ybWFsaXNlIG9mZnNldFggYW5kIG9mZnNldFkgcHJvcGVydGllc1xuICAgICAgICBpZiAoIHNwZWNpYWwuc2V0dGluZ3Mubm9ybWFsaXplT2Zmc2V0ICYmIHRoaXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0ICkge1xuICAgICAgICAgICAgdmFyIGJvdW5kaW5nUmVjdCA9IHRoaXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICBvZmZzZXRYID0gZXZlbnQuY2xpZW50WCAtIGJvdW5kaW5nUmVjdC5sZWZ0O1xuICAgICAgICAgICAgb2Zmc2V0WSA9IGV2ZW50LmNsaWVudFkgLSBib3VuZGluZ1JlY3QudG9wO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIGluZm9ybWF0aW9uIHRvIHRoZSBldmVudCBvYmplY3RcbiAgICAgICAgZXZlbnQuZGVsdGFYID0gZGVsdGFYO1xuICAgICAgICBldmVudC5kZWx0YVkgPSBkZWx0YVk7XG4gICAgICAgIGV2ZW50LmRlbHRhRmFjdG9yID0gbG93ZXN0RGVsdGE7XG4gICAgICAgIGV2ZW50Lm9mZnNldFggPSBvZmZzZXRYO1xuICAgICAgICBldmVudC5vZmZzZXRZID0gb2Zmc2V0WTtcbiAgICAgICAgLy8gR28gYWhlYWQgYW5kIHNldCBkZWx0YU1vZGUgdG8gMCBzaW5jZSB3ZSBjb252ZXJ0ZWQgdG8gcGl4ZWxzXG4gICAgICAgIC8vIEFsdGhvdWdoIHRoaXMgaXMgYSBsaXR0bGUgb2RkIHNpbmNlIHdlIG92ZXJ3cml0ZSB0aGUgZGVsdGFYL1lcbiAgICAgICAgLy8gcHJvcGVydGllcyB3aXRoIG5vcm1hbGl6ZWQgZGVsdGFzLlxuICAgICAgICBldmVudC5kZWx0YU1vZGUgPSAwO1xuXG4gICAgICAgIC8vIEFkZCBldmVudCBhbmQgZGVsdGEgdG8gdGhlIGZyb250IG9mIHRoZSBhcmd1bWVudHNcbiAgICAgICAgYXJncy51bnNoaWZ0KGV2ZW50LCBkZWx0YSwgZGVsdGFYLCBkZWx0YVkpO1xuXG4gICAgICAgIC8vIENsZWFyb3V0IGxvd2VzdERlbHRhIGFmdGVyIHNvbWV0aW1lIHRvIGJldHRlclxuICAgICAgICAvLyBoYW5kbGUgbXVsdGlwbGUgZGV2aWNlIHR5cGVzIHRoYXQgZ2l2ZSBkaWZmZXJlbnRcbiAgICAgICAgLy8gYSBkaWZmZXJlbnQgbG93ZXN0RGVsdGFcbiAgICAgICAgLy8gRXg6IHRyYWNrcGFkID0gMyBhbmQgbW91c2Ugd2hlZWwgPSAxMjBcbiAgICAgICAgaWYgKG51bGxMb3dlc3REZWx0YVRpbWVvdXQpIHsgY2xlYXJUaW1lb3V0KG51bGxMb3dlc3REZWx0YVRpbWVvdXQpOyB9XG4gICAgICAgIG51bGxMb3dlc3REZWx0YVRpbWVvdXQgPSBzZXRUaW1lb3V0KG51bGxMb3dlc3REZWx0YSwgMjAwKTtcblxuICAgICAgICByZXR1cm4gKCQuZXZlbnQuZGlzcGF0Y2ggfHwgJC5ldmVudC5oYW5kbGUpLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG51bGxMb3dlc3REZWx0YSgpIHtcbiAgICAgICAgbG93ZXN0RGVsdGEgPSBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3VsZEFkanVzdE9sZERlbHRhcyhvcmdFdmVudCwgYWJzRGVsdGEpIHtcbiAgICAgICAgLy8gSWYgdGhpcyBpcyBhbiBvbGRlciBldmVudCBhbmQgdGhlIGRlbHRhIGlzIGRpdmlzYWJsZSBieSAxMjAsXG4gICAgICAgIC8vIHRoZW4gd2UgYXJlIGFzc3VtaW5nIHRoYXQgdGhlIGJyb3dzZXIgaXMgdHJlYXRpbmcgdGhpcyBhcyBhblxuICAgICAgICAvLyBvbGRlciBtb3VzZSB3aGVlbCBldmVudCBhbmQgdGhhdCB3ZSBzaG91bGQgZGl2aWRlIHRoZSBkZWx0YXNcbiAgICAgICAgLy8gYnkgNDAgdG8gdHJ5IGFuZCBnZXQgYSBtb3JlIHVzYWJsZSBkZWx0YUZhY3Rvci5cbiAgICAgICAgLy8gU2lkZSBub3RlLCB0aGlzIGFjdHVhbGx5IGltcGFjdHMgdGhlIHJlcG9ydGVkIHNjcm9sbCBkaXN0YW5jZVxuICAgICAgICAvLyBpbiBvbGRlciBicm93c2VycyBhbmQgY2FuIGNhdXNlIHNjcm9sbGluZyB0byBiZSBzbG93ZXIgdGhhbiBuYXRpdmUuXG4gICAgICAgIC8vIFR1cm4gdGhpcyBvZmYgYnkgc2V0dGluZyAkLmV2ZW50LnNwZWNpYWwubW91c2V3aGVlbC5zZXR0aW5ncy5hZGp1c3RPbGREZWx0YXMgdG8gZmFsc2UuXG4gICAgICAgIHJldHVybiBzcGVjaWFsLnNldHRpbmdzLmFkanVzdE9sZERlbHRhcyAmJiBvcmdFdmVudC50eXBlID09PSAnbW91c2V3aGVlbCcgJiYgYWJzRGVsdGEgJSAxMjAgPT09IDA7XG4gICAgfVxuXG59KSk7XG4iLCIvKiEgVmVsb2NpdHlKUy5vcmcgKDEuMi4yKS4gKEMpIDIwMTQgSnVsaWFuIFNoYXBpcm8uIE1JVCBAbGljZW5zZTogZW4ud2lraXBlZGlhLm9yZy93aWtpL01JVF9MaWNlbnNlICovXG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgIFZlbG9jaXR5IGpRdWVyeSBTaGltXHJcbioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG4vKiEgVmVsb2NpdHlKUy5vcmcgalF1ZXJ5IFNoaW0gKDEuMC4xKS4gKEMpIDIwMTQgVGhlIGpRdWVyeSBGb3VuZGF0aW9uLiBNSVQgQGxpY2Vuc2U6IGVuLndpa2lwZWRpYS5vcmcvd2lraS9NSVRfTGljZW5zZS4gKi9cclxuXHJcbi8qIFRoaXMgZmlsZSBjb250YWlucyB0aGUgalF1ZXJ5IGZ1bmN0aW9ucyB0aGF0IFZlbG9jaXR5IHJlbGllcyBvbiwgdGhlcmVieSByZW1vdmluZyBWZWxvY2l0eSdzIGRlcGVuZGVuY3kgb24gYSBmdWxsIGNvcHkgb2YgalF1ZXJ5LCBhbmQgYWxsb3dpbmcgaXQgdG8gd29yayBpbiBhbnkgZW52aXJvbm1lbnQuICovXHJcbi8qIFRoZXNlIHNoaW1tZWQgZnVuY3Rpb25zIGFyZSBvbmx5IHVzZWQgaWYgalF1ZXJ5IGlzbid0IHByZXNlbnQuIElmIGJvdGggdGhpcyBzaGltIGFuZCBqUXVlcnkgYXJlIGxvYWRlZCwgVmVsb2NpdHkgZGVmYXVsdHMgdG8galF1ZXJ5IHByb3Blci4gKi9cclxuLyogQnJvd3NlciBzdXBwb3J0OiBVc2luZyB0aGlzIHNoaW0gaW5zdGVhZCBvZiBqUXVlcnkgcHJvcGVyIHJlbW92ZXMgc3VwcG9ydCBmb3IgSUU4LiAqL1xyXG5cclxuOyhmdW5jdGlvbiAod2luZG93KSB7XHJcbiAgICAvKioqKioqKioqKioqKioqXHJcbiAgICAgICAgIFNldHVwXHJcbiAgICAqKioqKioqKioqKioqKiovXHJcblxyXG4gICAgLyogSWYgalF1ZXJ5IGlzIGFscmVhZHkgbG9hZGVkLCB0aGVyZSdzIG5vIHBvaW50IGluIGxvYWRpbmcgdGhpcyBzaGltLiAqL1xyXG4gICAgaWYgKHdpbmRvdy5qUXVlcnkpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLyogalF1ZXJ5IGJhc2UuICovXHJcbiAgICB2YXIgJCA9IGZ1bmN0aW9uIChzZWxlY3RvciwgY29udGV4dCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgJC5mbi5pbml0KHNlbGVjdG9yLCBjb250ZXh0KTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgICBQcml2YXRlIE1ldGhvZHNcclxuICAgICoqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuICAgIC8qIGpRdWVyeSAqL1xyXG4gICAgJC5pc1dpbmRvdyA9IGZ1bmN0aW9uIChvYmopIHtcclxuICAgICAgICAvKiBqc2hpbnQgZXFlcWVxOiBmYWxzZSAqL1xyXG4gICAgICAgIHJldHVybiBvYmogIT0gbnVsbCAmJiBvYmogPT0gb2JqLndpbmRvdztcclxuICAgIH07XHJcblxyXG4gICAgLyogalF1ZXJ5ICovXHJcbiAgICAkLnR5cGUgPSBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgaWYgKG9iaiA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBvYmogKyBcIlwiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIG9iaiA9PT0gXCJmdW5jdGlvblwiID9cclxuICAgICAgICAgICAgY2xhc3MydHlwZVt0b1N0cmluZy5jYWxsKG9iaildIHx8IFwib2JqZWN0XCIgOlxyXG4gICAgICAgICAgICB0eXBlb2Ygb2JqO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKiBqUXVlcnkgKi9cclxuICAgICQuaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKG9iaikge1xyXG4gICAgICAgIHJldHVybiAkLnR5cGUob2JqKSA9PT0gXCJhcnJheVwiO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKiBqUXVlcnkgKi9cclxuICAgIGZ1bmN0aW9uIGlzQXJyYXlsaWtlIChvYmopIHtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gb2JqLmxlbmd0aCxcclxuICAgICAgICAgICAgdHlwZSA9ICQudHlwZShvYmopO1xyXG5cclxuICAgICAgICBpZiAodHlwZSA9PT0gXCJmdW5jdGlvblwiIHx8ICQuaXNXaW5kb3cob2JqKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAob2JqLm5vZGVUeXBlID09PSAxICYmIGxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0eXBlID09PSBcImFycmF5XCIgfHwgbGVuZ3RoID09PSAwIHx8IHR5cGVvZiBsZW5ndGggPT09IFwibnVtYmVyXCIgJiYgbGVuZ3RoID4gMCAmJiAobGVuZ3RoIC0gMSkgaW4gb2JqO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKioqKioqKioqKioqKipcclxuICAgICAgICQgTWV0aG9kc1xyXG4gICAgKioqKioqKioqKioqKioqL1xyXG5cclxuICAgIC8qIGpRdWVyeTogU3VwcG9ydCByZW1vdmVkIGZvciBJRTw5LiAqL1xyXG4gICAgJC5pc1BsYWluT2JqZWN0ID0gZnVuY3Rpb24gKG9iaikge1xyXG4gICAgICAgIHZhciBrZXk7XHJcblxyXG4gICAgICAgIGlmICghb2JqIHx8ICQudHlwZShvYmopICE9PSBcIm9iamVjdFwiIHx8IG9iai5ub2RlVHlwZSB8fCAkLmlzV2luZG93KG9iaikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKG9iai5jb25zdHJ1Y3RvciAmJlxyXG4gICAgICAgICAgICAgICAgIWhhc093bi5jYWxsKG9iaiwgXCJjb25zdHJ1Y3RvclwiKSAmJlxyXG4gICAgICAgICAgICAgICAgIWhhc093bi5jYWxsKG9iai5jb25zdHJ1Y3Rvci5wcm90b3R5cGUsIFwiaXNQcm90b3R5cGVPZlwiKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGtleSBpbiBvYmopIHt9XHJcblxyXG4gICAgICAgIHJldHVybiBrZXkgPT09IHVuZGVmaW5lZCB8fCBoYXNPd24uY2FsbChvYmosIGtleSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qIGpRdWVyeSAqL1xyXG4gICAgJC5lYWNoID0gZnVuY3Rpb24ob2JqLCBjYWxsYmFjaywgYXJncykge1xyXG4gICAgICAgIHZhciB2YWx1ZSxcclxuICAgICAgICAgICAgaSA9IDAsXHJcbiAgICAgICAgICAgIGxlbmd0aCA9IG9iai5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlzQXJyYXkgPSBpc0FycmF5bGlrZShvYmopO1xyXG5cclxuICAgICAgICBpZiAoYXJncykge1xyXG4gICAgICAgICAgICBpZiAoaXNBcnJheSkge1xyXG4gICAgICAgICAgICAgICAgZm9yICg7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gY2FsbGJhY2suYXBwbHkob2JqW2ldLCBhcmdzKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBjYWxsYmFjay5hcHBseShvYmpbaV0sIGFyZ3MpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAoaXNBcnJheSkge1xyXG4gICAgICAgICAgICAgICAgZm9yICg7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gY2FsbGJhY2suY2FsbChvYmpbaV0sIGksIG9ialtpXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZm9yIChpIGluIG9iaikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gY2FsbGJhY2suY2FsbChvYmpbaV0sIGksIG9ialtpXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKiBDdXN0b20gKi9cclxuICAgICQuZGF0YSA9IGZ1bmN0aW9uIChub2RlLCBrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgLyogJC5nZXREYXRhKCkgKi9cclxuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB2YXIgaWQgPSBub2RlWyQuZXhwYW5kb10sXHJcbiAgICAgICAgICAgICAgICBzdG9yZSA9IGlkICYmIGNhY2hlW2lkXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3JlO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHN0b3JlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoa2V5IGluIHN0b3JlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0b3JlW2tleV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAvKiAkLnNldERhdGEoKSAqL1xyXG4gICAgICAgIH0gZWxzZSBpZiAoa2V5ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdmFyIGlkID0gbm9kZVskLmV4cGFuZG9dIHx8IChub2RlWyQuZXhwYW5kb10gPSArKyQudXVpZCk7XHJcblxyXG4gICAgICAgICAgICBjYWNoZVtpZF0gPSBjYWNoZVtpZF0gfHwge307XHJcbiAgICAgICAgICAgIGNhY2hlW2lkXVtrZXldID0gdmFsdWU7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvKiBDdXN0b20gKi9cclxuICAgICQucmVtb3ZlRGF0YSA9IGZ1bmN0aW9uIChub2RlLCBrZXlzKSB7XHJcbiAgICAgICAgdmFyIGlkID0gbm9kZVskLmV4cGFuZG9dLFxyXG4gICAgICAgICAgICBzdG9yZSA9IGlkICYmIGNhY2hlW2lkXTtcclxuXHJcbiAgICAgICAgaWYgKHN0b3JlKSB7XHJcbiAgICAgICAgICAgICQuZWFjaChrZXlzLCBmdW5jdGlvbihfLCBrZXkpIHtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBzdG9yZVtrZXldO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qIGpRdWVyeSAqL1xyXG4gICAgJC5leHRlbmQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHNyYywgY29weUlzQXJyYXksIGNvcHksIG5hbWUsIG9wdGlvbnMsIGNsb25lLFxyXG4gICAgICAgICAgICB0YXJnZXQgPSBhcmd1bWVudHNbMF0gfHwge30sXHJcbiAgICAgICAgICAgIGkgPSAxLFxyXG4gICAgICAgICAgICBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoLFxyXG4gICAgICAgICAgICBkZWVwID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0ID09PSBcImJvb2xlYW5cIikge1xyXG4gICAgICAgICAgICBkZWVwID0gdGFyZ2V0O1xyXG5cclxuICAgICAgICAgICAgdGFyZ2V0ID0gYXJndW1lbnRzW2ldIHx8IHt9O1xyXG4gICAgICAgICAgICBpKys7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIHRhcmdldCAhPT0gXCJvYmplY3RcIiAmJiAkLnR5cGUodGFyZ2V0KSAhPT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgIHRhcmdldCA9IHt9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGkgPT09IGxlbmd0aCkge1xyXG4gICAgICAgICAgICB0YXJnZXQgPSB0aGlzO1xyXG4gICAgICAgICAgICBpLS07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICgob3B0aW9ucyA9IGFyZ3VtZW50c1tpXSkgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChuYW1lIGluIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBzcmMgPSB0YXJnZXRbbmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgY29weSA9IG9wdGlvbnNbbmFtZV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQgPT09IGNvcHkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGVlcCAmJiBjb3B5ICYmICgkLmlzUGxhaW5PYmplY3QoY29weSkgfHwgKGNvcHlJc0FycmF5ID0gJC5pc0FycmF5KGNvcHkpKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvcHlJc0FycmF5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3B5SXNBcnJheSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmUgPSBzcmMgJiYgJC5pc0FycmF5KHNyYykgPyBzcmMgOiBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZSA9IHNyYyAmJiAkLmlzUGxhaW5PYmplY3Qoc3JjKSA/IHNyYyA6IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRbbmFtZV0gPSAkLmV4dGVuZChkZWVwLCBjbG9uZSwgY29weSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY29weSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFtuYW1lXSA9IGNvcHk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xyXG4gICAgfTtcclxuXHJcbiAgICAvKiBqUXVlcnkgMS40LjMgKi9cclxuICAgICQucXVldWUgPSBmdW5jdGlvbiAoZWxlbSwgdHlwZSwgZGF0YSkge1xyXG4gICAgICAgIGZ1bmN0aW9uICRtYWtlQXJyYXkgKGFyciwgcmVzdWx0cykge1xyXG4gICAgICAgICAgICB2YXIgcmV0ID0gcmVzdWx0cyB8fCBbXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChhcnIgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzQXJyYXlsaWtlKE9iamVjdChhcnIpKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8qICQubWVyZ2UgKi9cclxuICAgICAgICAgICAgICAgICAgICAoZnVuY3Rpb24oZmlyc3QsIHNlY29uZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGVuID0gK3NlY29uZC5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqID0gMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkgPSBmaXJzdC5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaiA8IGxlbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3RbaSsrXSA9IHNlY29uZFtqKytdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGVuICE9PSBsZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChzZWNvbmRbal0gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0W2krK10gPSBzZWNvbmRbaisrXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3QubGVuZ3RoID0gaTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmaXJzdDtcclxuICAgICAgICAgICAgICAgICAgICB9KShyZXQsIHR5cGVvZiBhcnIgPT09IFwic3RyaW5nXCIgPyBbYXJyXSA6IGFycik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIFtdLnB1c2guY2FsbChyZXQsIGFycik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWVsZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdHlwZSA9ICh0eXBlIHx8IFwiZnhcIikgKyBcInF1ZXVlXCI7XHJcblxyXG4gICAgICAgIHZhciBxID0gJC5kYXRhKGVsZW0sIHR5cGUpO1xyXG5cclxuICAgICAgICBpZiAoIWRhdGEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHEgfHwgW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXEgfHwgJC5pc0FycmF5KGRhdGEpKSB7XHJcbiAgICAgICAgICAgIHEgPSAkLmRhdGEoZWxlbSwgdHlwZSwgJG1ha2VBcnJheShkYXRhKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcS5wdXNoKGRhdGEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHE7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qIGpRdWVyeSAxLjQuMyAqL1xyXG4gICAgJC5kZXF1ZXVlID0gZnVuY3Rpb24gKGVsZW1zLCB0eXBlKSB7XHJcbiAgICAgICAgLyogQ3VzdG9tOiBFbWJlZCBlbGVtZW50IGl0ZXJhdGlvbi4gKi9cclxuICAgICAgICAkLmVhY2goZWxlbXMubm9kZVR5cGUgPyBbIGVsZW1zIF0gOiBlbGVtcywgZnVuY3Rpb24oaSwgZWxlbSkge1xyXG4gICAgICAgICAgICB0eXBlID0gdHlwZSB8fCBcImZ4XCI7XHJcblxyXG4gICAgICAgICAgICB2YXIgcXVldWUgPSAkLnF1ZXVlKGVsZW0sIHR5cGUpLFxyXG4gICAgICAgICAgICAgICAgZm4gPSBxdWV1ZS5zaGlmdCgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGZuID09PSBcImlucHJvZ3Jlc3NcIikge1xyXG4gICAgICAgICAgICAgICAgZm4gPSBxdWV1ZS5zaGlmdCgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZm4pIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlID09PSBcImZ4XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBxdWV1ZS51bnNoaWZ0KFwiaW5wcm9ncmVzc1wiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBmbi5jYWxsKGVsZW0sIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQuZGVxdWV1ZShlbGVtLCB0eXBlKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKioqKioqKioqKioqKioqKipcclxuICAgICAgICQuZm4gTWV0aG9kc1xyXG4gICAgKioqKioqKioqKioqKioqKioqL1xyXG5cclxuICAgIC8qIGpRdWVyeSAqL1xyXG4gICAgJC5mbiA9ICQucHJvdG90eXBlID0ge1xyXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICAvKiBKdXN0IHJldHVybiB0aGUgZWxlbWVudCB3cmFwcGVkIGluc2lkZSBhbiBhcnJheTsgZG9uJ3QgcHJvY2VlZCB3aXRoIHRoZSBhY3R1YWwgalF1ZXJ5IG5vZGUgd3JhcHBpbmcgcHJvY2Vzcy4gKi9cclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yLm5vZGVUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzWzBdID0gc2VsZWN0b3I7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgYSBET00gbm9kZS5cIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBvZmZzZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLyogalF1ZXJ5IGFsdGVyZWQgY29kZTogRHJvcHBlZCBkaXNjb25uZWN0ZWQgRE9NIG5vZGUgY2hlY2tpbmcuICovXHJcbiAgICAgICAgICAgIHZhciBib3ggPSB0aGlzWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCA/IHRoaXNbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkgOiB7IHRvcDogMCwgbGVmdDogMCB9O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHRvcDogYm94LnRvcCArICh3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jdW1lbnQuc2Nyb2xsVG9wICB8fCAwKSAgLSAoZG9jdW1lbnQuY2xpZW50VG9wICB8fCAwKSxcclxuICAgICAgICAgICAgICAgIGxlZnQ6IGJveC5sZWZ0ICsgKHdpbmRvdy5wYWdlWE9mZnNldCB8fCBkb2N1bWVudC5zY3JvbGxMZWZ0ICB8fCAwKSAtIChkb2N1bWVudC5jbGllbnRMZWZ0IHx8IDApXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcG9zaXRpb246IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLyogalF1ZXJ5ICovXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIG9mZnNldFBhcmVudCgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnQgPSB0aGlzLm9mZnNldFBhcmVudCB8fCBkb2N1bWVudDtcclxuXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAob2Zmc2V0UGFyZW50ICYmICghb2Zmc2V0UGFyZW50Lm5vZGVUeXBlLnRvTG93ZXJDYXNlID09PSBcImh0bWxcIiAmJiBvZmZzZXRQYXJlbnQuc3R5bGUucG9zaXRpb24gPT09IFwic3RhdGljXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0UGFyZW50ID0gb2Zmc2V0UGFyZW50Lm9mZnNldFBhcmVudDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2Zmc2V0UGFyZW50IHx8IGRvY3VtZW50O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvKiBaZXB0byAqL1xyXG4gICAgICAgICAgICB2YXIgZWxlbSA9IHRoaXNbMF0sXHJcbiAgICAgICAgICAgICAgICBvZmZzZXRQYXJlbnQgPSBvZmZzZXRQYXJlbnQuYXBwbHkoZWxlbSksXHJcbiAgICAgICAgICAgICAgICBvZmZzZXQgPSB0aGlzLm9mZnNldCgpLFxyXG4gICAgICAgICAgICAgICAgcGFyZW50T2Zmc2V0ID0gL14oPzpib2R5fGh0bWwpJC9pLnRlc3Qob2Zmc2V0UGFyZW50Lm5vZGVOYW1lKSA/IHsgdG9wOiAwLCBsZWZ0OiAwIH0gOiAkKG9mZnNldFBhcmVudCkub2Zmc2V0KClcclxuXHJcbiAgICAgICAgICAgIG9mZnNldC50b3AgLT0gcGFyc2VGbG9hdChlbGVtLnN0eWxlLm1hcmdpblRvcCkgfHwgMDtcclxuICAgICAgICAgICAgb2Zmc2V0LmxlZnQgLT0gcGFyc2VGbG9hdChlbGVtLnN0eWxlLm1hcmdpbkxlZnQpIHx8IDA7XHJcblxyXG4gICAgICAgICAgICBpZiAob2Zmc2V0UGFyZW50LnN0eWxlKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnRPZmZzZXQudG9wICs9IHBhcnNlRmxvYXQob2Zmc2V0UGFyZW50LnN0eWxlLmJvcmRlclRvcFdpZHRoKSB8fCAwXHJcbiAgICAgICAgICAgICAgICBwYXJlbnRPZmZzZXQubGVmdCArPSBwYXJzZUZsb2F0KG9mZnNldFBhcmVudC5zdHlsZS5ib3JkZXJMZWZ0V2lkdGgpIHx8IDBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHRvcDogb2Zmc2V0LnRvcCAtIHBhcmVudE9mZnNldC50b3AsXHJcbiAgICAgICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdCAtIHBhcmVudE9mZnNldC5sZWZ0XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgUHJpdmF0ZSBWYXJpYWJsZXNcclxuICAgICoqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG4gICAgLyogRm9yICQuZGF0YSgpICovXHJcbiAgICB2YXIgY2FjaGUgPSB7fTtcclxuICAgICQuZXhwYW5kbyA9IFwidmVsb2NpdHlcIiArIChuZXcgRGF0ZSgpLmdldFRpbWUoKSk7XHJcbiAgICAkLnV1aWQgPSAwO1xyXG5cclxuICAgIC8qIEZvciAkLnF1ZXVlKCkgKi9cclxuICAgIHZhciBjbGFzczJ0eXBlID0ge30sXHJcbiAgICAgICAgaGFzT3duID0gY2xhc3MydHlwZS5oYXNPd25Qcm9wZXJ0eSxcclxuICAgICAgICB0b1N0cmluZyA9IGNsYXNzMnR5cGUudG9TdHJpbmc7XHJcblxyXG4gICAgdmFyIHR5cGVzID0gXCJCb29sZWFuIE51bWJlciBTdHJpbmcgRnVuY3Rpb24gQXJyYXkgRGF0ZSBSZWdFeHAgT2JqZWN0IEVycm9yXCIuc3BsaXQoXCIgXCIpO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0eXBlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGNsYXNzMnR5cGVbXCJbb2JqZWN0IFwiICsgdHlwZXNbaV0gKyBcIl1cIl0gPSB0eXBlc1tpXS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qIE1ha2VzICQobm9kZSkgcG9zc2libGUsIHdpdGhvdXQgaGF2aW5nIHRvIGNhbGwgaW5pdC4gKi9cclxuICAgICQuZm4uaW5pdC5wcm90b3R5cGUgPSAkLmZuO1xyXG5cclxuICAgIC8qIEdsb2JhbGl6ZSBWZWxvY2l0eSBvbnRvIHRoZSB3aW5kb3csIGFuZCBhc3NpZ24gaXRzIFV0aWxpdGllcyBwcm9wZXJ0eS4gKi9cclxuICAgIHdpbmRvdy5WZWxvY2l0eSA9IHsgVXRpbGl0aWVzOiAkIH07XHJcbn0pKHdpbmRvdyk7XG5cbi8qKioqKioqKioqKioqKioqKipcbiAgICBWZWxvY2l0eS5qc1xuKioqKioqKioqKioqKioqKioqL1xuXG47KGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgLyogQ29tbW9uSlMgbW9kdWxlLiAqL1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgICAvKiBBTUQgbW9kdWxlLiAqL1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKGZhY3RvcnkpO1xuICAgIC8qIEJyb3dzZXIgZ2xvYmFscy4gKi9cbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KCk7XG4gICAgfVxufShmdW5jdGlvbigpIHtcbnJldHVybiBmdW5jdGlvbiAoZ2xvYmFsLCB3aW5kb3csIGRvY3VtZW50LCB1bmRlZmluZWQpIHtcblxuICAgIC8qKioqKioqKioqKioqKipcbiAgICAgICAgU3VtbWFyeVxuICAgICoqKioqKioqKioqKioqKi9cblxuICAgIC8qXG4gICAgLSBDU1M6IENTUyBzdGFjayB0aGF0IHdvcmtzIGluZGVwZW5kZW50bHkgZnJvbSB0aGUgcmVzdCBvZiBWZWxvY2l0eS5cbiAgICAtIGFuaW1hdGUoKTogQ29yZSBhbmltYXRpb24gbWV0aG9kIHRoYXQgaXRlcmF0ZXMgb3ZlciB0aGUgdGFyZ2V0ZWQgZWxlbWVudHMgYW5kIHF1ZXVlcyB0aGUgaW5jb21pbmcgY2FsbCBvbnRvIGVhY2ggZWxlbWVudCBpbmRpdmlkdWFsbHkuXG4gICAgICAtIFByZS1RdWV1ZWluZzogUHJlcGFyZSB0aGUgZWxlbWVudCBmb3IgYW5pbWF0aW9uIGJ5IGluc3RhbnRpYXRpbmcgaXRzIGRhdGEgY2FjaGUgYW5kIHByb2Nlc3NpbmcgdGhlIGNhbGwncyBvcHRpb25zLlxuICAgICAgLSBRdWV1ZWluZzogVGhlIGxvZ2ljIHRoYXQgcnVucyBvbmNlIHRoZSBjYWxsIGhhcyByZWFjaGVkIGl0cyBwb2ludCBvZiBleGVjdXRpb24gaW4gdGhlIGVsZW1lbnQncyAkLnF1ZXVlKCkgc3RhY2suXG4gICAgICAgICAgICAgICAgICBNb3N0IGxvZ2ljIGlzIHBsYWNlZCBoZXJlIHRvIGF2b2lkIHJpc2tpbmcgaXQgYmVjb21pbmcgc3RhbGUgKGlmIHRoZSBlbGVtZW50J3MgcHJvcGVydGllcyBoYXZlIGNoYW5nZWQpLlxuICAgICAgLSBQdXNoaW5nOiBDb25zb2xpZGF0aW9uIG9mIHRoZSB0d2VlbiBkYXRhIGZvbGxvd2VkIGJ5IGl0cyBwdXNoIG9udG8gdGhlIGdsb2JhbCBpbi1wcm9ncmVzcyBjYWxscyBjb250YWluZXIuXG4gICAgLSB0aWNrKCk6IFRoZSBzaW5nbGUgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIGxvb3AgcmVzcG9uc2libGUgZm9yIHR3ZWVuaW5nIGFsbCBpbi1wcm9ncmVzcyBjYWxscy5cbiAgICAtIGNvbXBsZXRlQ2FsbCgpOiBIYW5kbGVzIHRoZSBjbGVhbnVwIHByb2Nlc3MgZm9yIGVhY2ggVmVsb2NpdHkgY2FsbC5cbiAgICAqL1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKlxuICAgICAgIEhlbHBlciBGdW5jdGlvbnNcbiAgICAqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAvKiBJRSBkZXRlY3Rpb24uIEdpc3Q6IGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL2p1bGlhbnNoYXBpcm8vOTA5ODYwOSAqL1xuICAgIHZhciBJRSA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGRvY3VtZW50LmRvY3VtZW50TW9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmRvY3VtZW50TW9kZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSA3OyBpID4gNDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cbiAgICAgICAgICAgICAgICBkaXYuaW5uZXJIVE1MID0gXCI8IS0tW2lmIElFIFwiICsgaSArIFwiXT48c3Bhbj48L3NwYW4+PCFbZW5kaWZdLS0+XCI7XG5cbiAgICAgICAgICAgICAgICBpZiAoZGl2LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic3BhblwiKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgZGl2ID0gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH0pKCk7XG5cbiAgICAvKiByQUYgc2hpbS4gR2lzdDogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vanVsaWFuc2hhcGlyby85NDk3NTEzICovXG4gICAgdmFyIHJBRlNoaW0gPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0aW1lTGFzdCA9IDA7XG5cbiAgICAgICAgcmV0dXJuIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIHRpbWVDdXJyZW50ID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKSxcbiAgICAgICAgICAgICAgICB0aW1lRGVsdGE7XG5cbiAgICAgICAgICAgIC8qIER5bmFtaWNhbGx5IHNldCBkZWxheSBvbiBhIHBlci10aWNrIGJhc2lzIHRvIG1hdGNoIDYwZnBzLiAqL1xuICAgICAgICAgICAgLyogVGVjaG5pcXVlIGJ5IEVyaWsgTW9sbGVyLiBNSVQgbGljZW5zZTogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vcGF1bGlyaXNoLzE1Nzk2NzEgKi9cbiAgICAgICAgICAgIHRpbWVEZWx0YSA9IE1hdGgubWF4KDAsIDE2IC0gKHRpbWVDdXJyZW50IC0gdGltZUxhc3QpKTtcbiAgICAgICAgICAgIHRpbWVMYXN0ID0gdGltZUN1cnJlbnQgKyB0aW1lRGVsdGE7XG5cbiAgICAgICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayh0aW1lQ3VycmVudCArIHRpbWVEZWx0YSk7IH0sIHRpbWVEZWx0YSk7XG4gICAgICAgIH07XG4gICAgfSkoKTtcblxuICAgIC8qIEFycmF5IGNvbXBhY3RpbmcuIENvcHlyaWdodCBMby1EYXNoLiBNSVQgTGljZW5zZTogaHR0cHM6Ly9naXRodWIuY29tL2xvZGFzaC9sb2Rhc2gvYmxvYi9tYXN0ZXIvTElDRU5TRS50eHQgKi9cbiAgICBmdW5jdGlvbiBjb21wYWN0U3BhcnNlQXJyYXkgKGFycmF5KSB7XG4gICAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgICAgbGVuZ3RoID0gYXJyYXkgPyBhcnJheS5sZW5ndGggOiAwLFxuICAgICAgICAgICAgcmVzdWx0ID0gW107XG5cbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGFycmF5W2luZGV4XTtcblxuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2godmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzYW5pdGl6ZUVsZW1lbnRzIChlbGVtZW50cykge1xuICAgICAgICAvKiBVbndyYXAgalF1ZXJ5L1plcHRvIG9iamVjdHMuICovXG4gICAgICAgIGlmIChUeXBlLmlzV3JhcHBlZChlbGVtZW50cykpIHtcbiAgICAgICAgICAgIGVsZW1lbnRzID0gW10uc2xpY2UuY2FsbChlbGVtZW50cyk7XG4gICAgICAgIC8qIFdyYXAgYSBzaW5nbGUgZWxlbWVudCBpbiBhbiBhcnJheSBzbyB0aGF0ICQuZWFjaCgpIGNhbiBpdGVyYXRlIHdpdGggdGhlIGVsZW1lbnQgaW5zdGVhZCBvZiBpdHMgbm9kZSdzIGNoaWxkcmVuLiAqL1xuICAgICAgICB9IGVsc2UgaWYgKFR5cGUuaXNOb2RlKGVsZW1lbnRzKSkge1xuICAgICAgICAgICAgZWxlbWVudHMgPSBbIGVsZW1lbnRzIF07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZWxlbWVudHM7XG4gICAgfVxuXG4gICAgdmFyIFR5cGUgPSB7XG4gICAgICAgIGlzU3RyaW5nOiBmdW5jdGlvbiAodmFyaWFibGUpIHtcbiAgICAgICAgICAgIHJldHVybiAodHlwZW9mIHZhcmlhYmxlID09PSBcInN0cmluZ1wiKTtcbiAgICAgICAgfSxcbiAgICAgICAgaXNBcnJheTogQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAodmFyaWFibGUpIHtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFyaWFibGUpID09PSBcIltvYmplY3QgQXJyYXldXCI7XG4gICAgICAgIH0sXG4gICAgICAgIGlzRnVuY3Rpb246IGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YXJpYWJsZSkgPT09IFwiW29iamVjdCBGdW5jdGlvbl1cIjtcbiAgICAgICAgfSxcbiAgICAgICAgaXNOb2RlOiBmdW5jdGlvbiAodmFyaWFibGUpIHtcbiAgICAgICAgICAgIHJldHVybiB2YXJpYWJsZSAmJiB2YXJpYWJsZS5ub2RlVHlwZTtcbiAgICAgICAgfSxcbiAgICAgICAgLyogQ29weXJpZ2h0IE1hcnRpbiBCb2htLiBNSVQgTGljZW5zZTogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vVG9tYWxhay84MThhNzhhMjI2YTA3MzhlYWFkZSAqL1xuICAgICAgICBpc05vZGVMaXN0OiBmdW5jdGlvbiAodmFyaWFibGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgdmFyaWFibGUgPT09IFwib2JqZWN0XCIgJiZcbiAgICAgICAgICAgICAgICAvXlxcW29iamVjdCAoSFRNTENvbGxlY3Rpb258Tm9kZUxpc3R8T2JqZWN0KVxcXSQvLnRlc3QoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhcmlhYmxlKSkgJiZcbiAgICAgICAgICAgICAgICB2YXJpYWJsZS5sZW5ndGggIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgICAgICh2YXJpYWJsZS5sZW5ndGggPT09IDAgfHwgKHR5cGVvZiB2YXJpYWJsZVswXSA9PT0gXCJvYmplY3RcIiAmJiB2YXJpYWJsZVswXS5ub2RlVHlwZSA+IDApKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyogRGV0ZXJtaW5lIGlmIHZhcmlhYmxlIGlzIGEgd3JhcHBlZCBqUXVlcnkgb3IgWmVwdG8gZWxlbWVudC4gKi9cbiAgICAgICAgaXNXcmFwcGVkOiBmdW5jdGlvbiAodmFyaWFibGUpIHtcbiAgICAgICAgICAgIHJldHVybiB2YXJpYWJsZSAmJiAodmFyaWFibGUuanF1ZXJ5IHx8ICh3aW5kb3cuWmVwdG8gJiYgd2luZG93LlplcHRvLnplcHRvLmlzWih2YXJpYWJsZSkpKTtcbiAgICAgICAgfSxcbiAgICAgICAgaXNTVkc6IGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5TVkdFbGVtZW50ICYmICh2YXJpYWJsZSBpbnN0YW5jZW9mIHdpbmRvdy5TVkdFbGVtZW50KTtcbiAgICAgICAgfSxcbiAgICAgICAgaXNFbXB0eU9iamVjdDogZnVuY3Rpb24gKHZhcmlhYmxlKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBuYW1lIGluIHZhcmlhYmxlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKioqKioqKioqKioqKioqKipcbiAgICAgICBEZXBlbmRlbmNpZXNcbiAgICAqKioqKioqKioqKioqKioqKi9cblxuICAgIHZhciAkLFxuICAgICAgICBpc0pRdWVyeSA9IGZhbHNlO1xuXG4gICAgaWYgKGdsb2JhbC5mbiAmJiBnbG9iYWwuZm4uanF1ZXJ5KSB7XG4gICAgICAgICQgPSBnbG9iYWw7XG4gICAgICAgIGlzSlF1ZXJ5ID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkID0gd2luZG93LlZlbG9jaXR5LlV0aWxpdGllcztcbiAgICB9XG5cbiAgICBpZiAoSUUgPD0gOCAmJiAhaXNKUXVlcnkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVmVsb2NpdHk6IElFOCBhbmQgYmVsb3cgcmVxdWlyZSBqUXVlcnkgdG8gYmUgbG9hZGVkIGJlZm9yZSBWZWxvY2l0eS5cIik7XG4gICAgfSBlbHNlIGlmIChJRSA8PSA3KSB7XG4gICAgICAgIC8qIFJldmVydCB0byBqUXVlcnkncyAkLmFuaW1hdGUoKSwgYW5kIGxvc2UgVmVsb2NpdHkncyBleHRyYSBmZWF0dXJlcy4gKi9cbiAgICAgICAgalF1ZXJ5LmZuLnZlbG9jaXR5ID0galF1ZXJ5LmZuLmFuaW1hdGU7XG5cbiAgICAgICAgLyogTm93IHRoYXQgJC5mbi52ZWxvY2l0eSBpcyBhbGlhc2VkLCBhYm9ydCB0aGlzIFZlbG9jaXR5IGRlY2xhcmF0aW9uLiAqL1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKioqXG4gICAgICAgIENvbnN0YW50c1xuICAgICoqKioqKioqKioqKioqKioqL1xuXG4gICAgdmFyIERVUkFUSU9OX0RFRkFVTFQgPSA0MDAsXG4gICAgICAgIEVBU0lOR19ERUZBVUxUID0gXCJzd2luZ1wiO1xuXG4gICAgLyoqKioqKioqKioqKipcbiAgICAgICAgU3RhdGVcbiAgICAqKioqKioqKioqKioqL1xuXG4gICAgdmFyIFZlbG9jaXR5ID0ge1xuICAgICAgICAvKiBDb250YWluZXIgZm9yIHBhZ2Utd2lkZSBWZWxvY2l0eSBzdGF0ZSBkYXRhLiAqL1xuICAgICAgICBTdGF0ZToge1xuICAgICAgICAgICAgLyogRGV0ZWN0IG1vYmlsZSBkZXZpY2VzIHRvIGRldGVybWluZSBpZiBtb2JpbGVIQSBzaG91bGQgYmUgdHVybmVkIG9uLiAqL1xuICAgICAgICAgICAgaXNNb2JpbGU6IC9BbmRyb2lkfHdlYk9TfGlQaG9uZXxpUGFkfGlQb2R8QmxhY2tCZXJyeXxJRU1vYmlsZXxPcGVyYSBNaW5pL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSxcbiAgICAgICAgICAgIC8qIFRoZSBtb2JpbGVIQSBvcHRpb24ncyBiZWhhdmlvciBjaGFuZ2VzIG9uIG9sZGVyIEFuZHJvaWQgZGV2aWNlcyAoR2luZ2VyYnJlYWQsIHZlcnNpb25zIDIuMy4zLTIuMy43KS4gKi9cbiAgICAgICAgICAgIGlzQW5kcm9pZDogL0FuZHJvaWQvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpLFxuICAgICAgICAgICAgaXNHaW5nZXJicmVhZDogL0FuZHJvaWQgMlxcLjNcXC5bMy03XS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCksXG4gICAgICAgICAgICBpc0Nocm9tZTogd2luZG93LmNocm9tZSxcbiAgICAgICAgICAgIGlzRmlyZWZveDogL0ZpcmVmb3gvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpLFxuICAgICAgICAgICAgLyogQ3JlYXRlIGEgY2FjaGVkIGVsZW1lbnQgZm9yIHJlLXVzZSB3aGVuIGNoZWNraW5nIGZvciBDU1MgcHJvcGVydHkgcHJlZml4ZXMuICovXG4gICAgICAgICAgICBwcmVmaXhFbGVtZW50OiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpLFxuICAgICAgICAgICAgLyogQ2FjaGUgZXZlcnkgcHJlZml4IG1hdGNoIHRvIGF2b2lkIHJlcGVhdGluZyBsb29rdXBzLiAqL1xuICAgICAgICAgICAgcHJlZml4TWF0Y2hlczoge30sXG4gICAgICAgICAgICAvKiBDYWNoZSB0aGUgYW5jaG9yIHVzZWQgZm9yIGFuaW1hdGluZyB3aW5kb3cgc2Nyb2xsaW5nLiAqL1xuICAgICAgICAgICAgc2Nyb2xsQW5jaG9yOiBudWxsLFxuICAgICAgICAgICAgLyogQ2FjaGUgdGhlIGJyb3dzZXItc3BlY2lmaWMgcHJvcGVydHkgbmFtZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBzY3JvbGwgYW5jaG9yLiAqL1xuICAgICAgICAgICAgc2Nyb2xsUHJvcGVydHlMZWZ0OiBudWxsLFxuICAgICAgICAgICAgc2Nyb2xsUHJvcGVydHlUb3A6IG51bGwsXG4gICAgICAgICAgICAvKiBLZWVwIHRyYWNrIG9mIHdoZXRoZXIgb3VyIFJBRiB0aWNrIGlzIHJ1bm5pbmcuICovXG4gICAgICAgICAgICBpc1RpY2tpbmc6IGZhbHNlLFxuICAgICAgICAgICAgLyogQ29udGFpbmVyIGZvciBldmVyeSBpbi1wcm9ncmVzcyBjYWxsIHRvIFZlbG9jaXR5LiAqL1xuICAgICAgICAgICAgY2FsbHM6IFtdXG4gICAgICAgIH0sXG4gICAgICAgIC8qIFZlbG9jaXR5J3MgY3VzdG9tIENTUyBzdGFjay4gTWFkZSBnbG9iYWwgZm9yIHVuaXQgdGVzdGluZy4gKi9cbiAgICAgICAgQ1NTOiB7IC8qIERlZmluZWQgYmVsb3cuICovIH0sXG4gICAgICAgIC8qIEEgc2hpbSBvZiB0aGUgalF1ZXJ5IHV0aWxpdHkgZnVuY3Rpb25zIHVzZWQgYnkgVmVsb2NpdHkgLS0gcHJvdmlkZWQgYnkgVmVsb2NpdHkncyBvcHRpb25hbCBqUXVlcnkgc2hpbS4gKi9cbiAgICAgICAgVXRpbGl0aWVzOiAkLFxuICAgICAgICAvKiBDb250YWluZXIgZm9yIHRoZSB1c2VyJ3MgY3VzdG9tIGFuaW1hdGlvbiByZWRpcmVjdHMgdGhhdCBhcmUgcmVmZXJlbmNlZCBieSBuYW1lIGluIHBsYWNlIG9mIHRoZSBwcm9wZXJ0aWVzIG1hcCBhcmd1bWVudC4gKi9cbiAgICAgICAgUmVkaXJlY3RzOiB7IC8qIE1hbnVhbGx5IHJlZ2lzdGVyZWQgYnkgdGhlIHVzZXIuICovIH0sXG4gICAgICAgIEVhc2luZ3M6IHsgLyogRGVmaW5lZCBiZWxvdy4gKi8gfSxcbiAgICAgICAgLyogQXR0ZW1wdCB0byB1c2UgRVM2IFByb21pc2VzIGJ5IGRlZmF1bHQuIFVzZXJzIGNhbiBvdmVycmlkZSB0aGlzIHdpdGggYSB0aGlyZC1wYXJ0eSBwcm9taXNlcyBsaWJyYXJ5LiAqL1xuICAgICAgICBQcm9taXNlOiB3aW5kb3cuUHJvbWlzZSxcbiAgICAgICAgLyogVmVsb2NpdHkgb3B0aW9uIGRlZmF1bHRzLCB3aGljaCBjYW4gYmUgb3ZlcnJpZGVuIGJ5IHRoZSB1c2VyLiAqL1xuICAgICAgICBkZWZhdWx0czoge1xuICAgICAgICAgICAgcXVldWU6IFwiXCIsXG4gICAgICAgICAgICBkdXJhdGlvbjogRFVSQVRJT05fREVGQVVMVCxcbiAgICAgICAgICAgIGVhc2luZzogRUFTSU5HX0RFRkFVTFQsXG4gICAgICAgICAgICBiZWdpbjogdW5kZWZpbmVkLFxuICAgICAgICAgICAgY29tcGxldGU6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHByb2dyZXNzOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBkaXNwbGF5OiB1bmRlZmluZWQsXG4gICAgICAgICAgICB2aXNpYmlsaXR5OiB1bmRlZmluZWQsXG4gICAgICAgICAgICBsb29wOiBmYWxzZSxcbiAgICAgICAgICAgIGRlbGF5OiBmYWxzZSxcbiAgICAgICAgICAgIG1vYmlsZUhBOiB0cnVlLFxuICAgICAgICAgICAgLyogQWR2YW5jZWQ6IFNldCB0byBmYWxzZSB0byBwcmV2ZW50IHByb3BlcnR5IHZhbHVlcyBmcm9tIGJlaW5nIGNhY2hlZCBiZXR3ZWVuIGNvbnNlY3V0aXZlIFZlbG9jaXR5LWluaXRpYXRlZCBjaGFpbiBjYWxscy4gKi9cbiAgICAgICAgICAgIF9jYWNoZVZhbHVlczogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICAvKiBBIGRlc2lnbiBnb2FsIG9mIFZlbG9jaXR5IGlzIHRvIGNhY2hlIGRhdGEgd2hlcmV2ZXIgcG9zc2libGUgaW4gb3JkZXIgdG8gYXZvaWQgRE9NIHJlcXVlcnlpbmcuIEFjY29yZGluZ2x5LCBlYWNoIGVsZW1lbnQgaGFzIGEgZGF0YSBjYWNoZS4gKi9cbiAgICAgICAgaW5pdDogZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICQuZGF0YShlbGVtZW50LCBcInZlbG9jaXR5XCIsIHtcbiAgICAgICAgICAgICAgICAvKiBTdG9yZSB3aGV0aGVyIHRoaXMgaXMgYW4gU1ZHIGVsZW1lbnQsIHNpbmNlIGl0cyBwcm9wZXJ0aWVzIGFyZSByZXRyaWV2ZWQgYW5kIHVwZGF0ZWQgZGlmZmVyZW50bHkgdGhhbiBzdGFuZGFyZCBIVE1MIGVsZW1lbnRzLiAqL1xuICAgICAgICAgICAgICAgIGlzU1ZHOiBUeXBlLmlzU1ZHKGVsZW1lbnQpLFxuICAgICAgICAgICAgICAgIC8qIEtlZXAgdHJhY2sgb2Ygd2hldGhlciB0aGUgZWxlbWVudCBpcyBjdXJyZW50bHkgYmVpbmcgYW5pbWF0ZWQgYnkgVmVsb2NpdHkuXG4gICAgICAgICAgICAgICAgICAgVGhpcyBpcyB1c2VkIHRvIGVuc3VyZSB0aGF0IHByb3BlcnR5IHZhbHVlcyBhcmUgbm90IHRyYW5zZmVycmVkIGJldHdlZW4gbm9uLWNvbnNlY3V0aXZlIChzdGFsZSkgY2FsbHMuICovXG4gICAgICAgICAgICAgICAgaXNBbmltYXRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgICAgIC8qIEEgcmVmZXJlbmNlIHRvIHRoZSBlbGVtZW50J3MgbGl2ZSBjb21wdXRlZFN0eWxlIG9iamVjdC4gTGVhcm4gbW9yZSBoZXJlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9kb2NzL1dlYi9BUEkvd2luZG93LmdldENvbXB1dGVkU3R5bGUgKi9cbiAgICAgICAgICAgICAgICBjb21wdXRlZFN0eWxlOiBudWxsLFxuICAgICAgICAgICAgICAgIC8qIFR3ZWVuIGRhdGEgaXMgY2FjaGVkIGZvciBlYWNoIGFuaW1hdGlvbiBvbiB0aGUgZWxlbWVudCBzbyB0aGF0IGRhdGEgY2FuIGJlIHBhc3NlZCBhY3Jvc3MgY2FsbHMgLS1cbiAgICAgICAgICAgICAgICAgICBpbiBwYXJ0aWN1bGFyLCBlbmQgdmFsdWVzIGFyZSB1c2VkIGFzIHN1YnNlcXVlbnQgc3RhcnQgdmFsdWVzIGluIGNvbnNlY3V0aXZlIFZlbG9jaXR5IGNhbGxzLiAqL1xuICAgICAgICAgICAgICAgIHR3ZWVuc0NvbnRhaW5lcjogbnVsbCxcbiAgICAgICAgICAgICAgICAvKiBUaGUgZnVsbCByb290IHByb3BlcnR5IHZhbHVlcyBvZiBlYWNoIENTUyBob29rIGJlaW5nIGFuaW1hdGVkIG9uIHRoaXMgZWxlbWVudCBhcmUgY2FjaGVkIHNvIHRoYXQ6XG4gICAgICAgICAgICAgICAgICAgMSkgQ29uY3VycmVudGx5LWFuaW1hdGluZyBob29rcyBzaGFyaW5nIHRoZSBzYW1lIHJvb3QgY2FuIGhhdmUgdGhlaXIgcm9vdCB2YWx1ZXMnIG1lcmdlZCBpbnRvIG9uZSB3aGlsZSB0d2VlbmluZy5cbiAgICAgICAgICAgICAgICAgICAyKSBQb3N0LWhvb2staW5qZWN0aW9uIHJvb3QgdmFsdWVzIGNhbiBiZSB0cmFuc2ZlcnJlZCBvdmVyIHRvIGNvbnNlY3V0aXZlbHkgY2hhaW5lZCBWZWxvY2l0eSBjYWxscyBhcyBzdGFydGluZyByb290IHZhbHVlcy4gKi9cbiAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZUNhY2hlOiB7fSxcbiAgICAgICAgICAgICAgICAvKiBBIGNhY2hlIGZvciB0cmFuc2Zvcm0gdXBkYXRlcywgd2hpY2ggbXVzdCBiZSBtYW51YWxseSBmbHVzaGVkIHZpYSBDU1MuZmx1c2hUcmFuc2Zvcm1DYWNoZSgpLiAqL1xuICAgICAgICAgICAgICAgIHRyYW5zZm9ybUNhY2hlOiB7fVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qIEEgcGFyYWxsZWwgdG8galF1ZXJ5J3MgJC5jc3MoKSwgdXNlZCBmb3IgZ2V0dGluZy9zZXR0aW5nIFZlbG9jaXR5J3MgaG9va2VkIENTUyBwcm9wZXJ0aWVzLiAqL1xuICAgICAgICBob29rOiBudWxsLCAvKiBEZWZpbmVkIGJlbG93LiAqL1xuICAgICAgICAvKiBWZWxvY2l0eS13aWRlIGFuaW1hdGlvbiB0aW1lIHJlbWFwcGluZyBmb3IgdGVzdGluZyBwdXJwb3Nlcy4gKi9cbiAgICAgICAgbW9jazogZmFsc2UsXG4gICAgICAgIHZlcnNpb246IHsgbWFqb3I6IDEsIG1pbm9yOiAyLCBwYXRjaDogMiB9LFxuICAgICAgICAvKiBTZXQgdG8gMSBvciAyIChtb3N0IHZlcmJvc2UpIHRvIG91dHB1dCBkZWJ1ZyBpbmZvIHRvIGNvbnNvbGUuICovXG4gICAgICAgIGRlYnVnOiBmYWxzZVxuICAgIH07XG5cbiAgICAvKiBSZXRyaWV2ZSB0aGUgYXBwcm9wcmlhdGUgc2Nyb2xsIGFuY2hvciBhbmQgcHJvcGVydHkgbmFtZSBmb3IgdGhlIGJyb3dzZXI6IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XaW5kb3cuc2Nyb2xsWSAqL1xuICAgIGlmICh3aW5kb3cucGFnZVlPZmZzZXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBWZWxvY2l0eS5TdGF0ZS5zY3JvbGxBbmNob3IgPSB3aW5kb3c7XG4gICAgICAgIFZlbG9jaXR5LlN0YXRlLnNjcm9sbFByb3BlcnR5TGVmdCA9IFwicGFnZVhPZmZzZXRcIjtcbiAgICAgICAgVmVsb2NpdHkuU3RhdGUuc2Nyb2xsUHJvcGVydHlUb3AgPSBcInBhZ2VZT2Zmc2V0XCI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgVmVsb2NpdHkuU3RhdGUuc2Nyb2xsQW5jaG9yID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8IGRvY3VtZW50LmJvZHkucGFyZW50Tm9kZSB8fCBkb2N1bWVudC5ib2R5O1xuICAgICAgICBWZWxvY2l0eS5TdGF0ZS5zY3JvbGxQcm9wZXJ0eUxlZnQgPSBcInNjcm9sbExlZnRcIjtcbiAgICAgICAgVmVsb2NpdHkuU3RhdGUuc2Nyb2xsUHJvcGVydHlUb3AgPSBcInNjcm9sbFRvcFwiO1xuICAgIH1cblxuICAgIC8qIFNob3J0aGFuZCBhbGlhcyBmb3IgalF1ZXJ5J3MgJC5kYXRhKCkgdXRpbGl0eS4gKi9cbiAgICBmdW5jdGlvbiBEYXRhIChlbGVtZW50KSB7XG4gICAgICAgIC8qIEhhcmRjb2RlIGEgcmVmZXJlbmNlIHRvIHRoZSBwbHVnaW4gbmFtZS4gKi9cbiAgICAgICAgdmFyIHJlc3BvbnNlID0gJC5kYXRhKGVsZW1lbnQsIFwidmVsb2NpdHlcIik7XG5cbiAgICAgICAgLyogalF1ZXJ5IDw9MS40LjIgcmV0dXJucyBudWxsIGluc3RlYWQgb2YgdW5kZWZpbmVkIHdoZW4gbm8gbWF0Y2ggaXMgZm91bmQuIFdlIG5vcm1hbGl6ZSB0aGlzIGJlaGF2aW9yLiAqL1xuICAgICAgICByZXR1cm4gcmVzcG9uc2UgPT09IG51bGwgPyB1bmRlZmluZWQgOiByZXNwb25zZTtcbiAgICB9O1xuXG4gICAgLyoqKioqKioqKioqKioqXG4gICAgICAgIEVhc2luZ1xuICAgICoqKioqKioqKioqKioqL1xuXG4gICAgLyogU3RlcCBlYXNpbmcgZ2VuZXJhdG9yLiAqL1xuICAgIGZ1bmN0aW9uIGdlbmVyYXRlU3RlcCAoc3RlcHMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChwKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChwICogc3RlcHMpICogKDEgLyBzdGVwcyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyogQmV6aWVyIGN1cnZlIGZ1bmN0aW9uIGdlbmVyYXRvci4gQ29weXJpZ2h0IEdhZXRhbiBSZW5hdWRlYXUuIE1JVCBMaWNlbnNlOiBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL01JVF9MaWNlbnNlICovXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGVCZXppZXIgKG1YMSwgbVkxLCBtWDIsIG1ZMikge1xuICAgICAgICB2YXIgTkVXVE9OX0lURVJBVElPTlMgPSA0LFxuICAgICAgICAgICAgTkVXVE9OX01JTl9TTE9QRSA9IDAuMDAxLFxuICAgICAgICAgICAgU1VCRElWSVNJT05fUFJFQ0lTSU9OID0gMC4wMDAwMDAxLFxuICAgICAgICAgICAgU1VCRElWSVNJT05fTUFYX0lURVJBVElPTlMgPSAxMCxcbiAgICAgICAgICAgIGtTcGxpbmVUYWJsZVNpemUgPSAxMSxcbiAgICAgICAgICAgIGtTYW1wbGVTdGVwU2l6ZSA9IDEuMCAvIChrU3BsaW5lVGFibGVTaXplIC0gMS4wKSxcbiAgICAgICAgICAgIGZsb2F0MzJBcnJheVN1cHBvcnRlZCA9IFwiRmxvYXQzMkFycmF5XCIgaW4gd2luZG93O1xuXG4gICAgICAgIC8qIE11c3QgY29udGFpbiBmb3VyIGFyZ3VtZW50cy4gKi9cbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggIT09IDQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIEFyZ3VtZW50cyBtdXN0IGJlIG51bWJlcnMuICovXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgKytpKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGFyZ3VtZW50c1tpXSAhPT0gXCJudW1iZXJcIiB8fCBpc05hTihhcmd1bWVudHNbaV0pIHx8ICFpc0Zpbml0ZShhcmd1bWVudHNbaV0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyogWCB2YWx1ZXMgbXVzdCBiZSBpbiB0aGUgWzAsIDFdIHJhbmdlLiAqL1xuICAgICAgICBtWDEgPSBNYXRoLm1pbihtWDEsIDEpO1xuICAgICAgICBtWDIgPSBNYXRoLm1pbihtWDIsIDEpO1xuICAgICAgICBtWDEgPSBNYXRoLm1heChtWDEsIDApO1xuICAgICAgICBtWDIgPSBNYXRoLm1heChtWDIsIDApO1xuXG4gICAgICAgIHZhciBtU2FtcGxlVmFsdWVzID0gZmxvYXQzMkFycmF5U3VwcG9ydGVkID8gbmV3IEZsb2F0MzJBcnJheShrU3BsaW5lVGFibGVTaXplKSA6IG5ldyBBcnJheShrU3BsaW5lVGFibGVTaXplKTtcblxuICAgICAgICBmdW5jdGlvbiBBIChhQTEsIGFBMikgeyByZXR1cm4gMS4wIC0gMy4wICogYUEyICsgMy4wICogYUExOyB9XG4gICAgICAgIGZ1bmN0aW9uIEIgKGFBMSwgYUEyKSB7IHJldHVybiAzLjAgKiBhQTIgLSA2LjAgKiBhQTE7IH1cbiAgICAgICAgZnVuY3Rpb24gQyAoYUExKSAgICAgIHsgcmV0dXJuIDMuMCAqIGFBMTsgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNhbGNCZXppZXIgKGFULCBhQTEsIGFBMikge1xuICAgICAgICAgICAgcmV0dXJuICgoQShhQTEsIGFBMikqYVQgKyBCKGFBMSwgYUEyKSkqYVQgKyBDKGFBMSkpKmFUO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0U2xvcGUgKGFULCBhQTEsIGFBMikge1xuICAgICAgICAgICAgcmV0dXJuIDMuMCAqIEEoYUExLCBhQTIpKmFUKmFUICsgMi4wICogQihhQTEsIGFBMikgKiBhVCArIEMoYUExKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIG5ld3RvblJhcGhzb25JdGVyYXRlIChhWCwgYUd1ZXNzVCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBORVdUT05fSVRFUkFUSU9OUzsgKytpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRTbG9wZSA9IGdldFNsb3BlKGFHdWVzc1QsIG1YMSwgbVgyKTtcblxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50U2xvcGUgPT09IDAuMCkgcmV0dXJuIGFHdWVzc1Q7XG5cbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudFggPSBjYWxjQmV6aWVyKGFHdWVzc1QsIG1YMSwgbVgyKSAtIGFYO1xuICAgICAgICAgICAgICAgIGFHdWVzc1QgLT0gY3VycmVudFggLyBjdXJyZW50U2xvcGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBhR3Vlc3NUO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY2FsY1NhbXBsZVZhbHVlcyAoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtTcGxpbmVUYWJsZVNpemU7ICsraSkge1xuICAgICAgICAgICAgICAgIG1TYW1wbGVWYWx1ZXNbaV0gPSBjYWxjQmV6aWVyKGkgKiBrU2FtcGxlU3RlcFNpemUsIG1YMSwgbVgyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGJpbmFyeVN1YmRpdmlkZSAoYVgsIGFBLCBhQikge1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRYLCBjdXJyZW50VCwgaSA9IDA7XG5cbiAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50VCA9IGFBICsgKGFCIC0gYUEpIC8gMi4wO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRYID0gY2FsY0JlemllcihjdXJyZW50VCwgbVgxLCBtWDIpIC0gYVg7XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRYID4gMC4wKSB7XG4gICAgICAgICAgICAgICAgICBhQiA9IGN1cnJlbnRUO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBhQSA9IGN1cnJlbnRUO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gd2hpbGUgKE1hdGguYWJzKGN1cnJlbnRYKSA+IFNVQkRJVklTSU9OX1BSRUNJU0lPTiAmJiArK2kgPCBTVUJESVZJU0lPTl9NQVhfSVRFUkFUSU9OUyk7XG5cbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50VDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGdldFRGb3JYIChhWCkge1xuICAgICAgICAgICAgdmFyIGludGVydmFsU3RhcnQgPSAwLjAsXG4gICAgICAgICAgICAgICAgY3VycmVudFNhbXBsZSA9IDEsXG4gICAgICAgICAgICAgICAgbGFzdFNhbXBsZSA9IGtTcGxpbmVUYWJsZVNpemUgLSAxO1xuXG4gICAgICAgICAgICBmb3IgKDsgY3VycmVudFNhbXBsZSAhPSBsYXN0U2FtcGxlICYmIG1TYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0gPD0gYVg7ICsrY3VycmVudFNhbXBsZSkge1xuICAgICAgICAgICAgICAgIGludGVydmFsU3RhcnQgKz0ga1NhbXBsZVN0ZXBTaXplO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAtLWN1cnJlbnRTYW1wbGU7XG5cbiAgICAgICAgICAgIHZhciBkaXN0ID0gKGFYIC0gbVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSkgLyAobVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlKzFdIC0gbVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSksXG4gICAgICAgICAgICAgICAgZ3Vlc3NGb3JUID0gaW50ZXJ2YWxTdGFydCArIGRpc3QgKiBrU2FtcGxlU3RlcFNpemUsXG4gICAgICAgICAgICAgICAgaW5pdGlhbFNsb3BlID0gZ2V0U2xvcGUoZ3Vlc3NGb3JULCBtWDEsIG1YMik7XG5cbiAgICAgICAgICAgIGlmIChpbml0aWFsU2xvcGUgPj0gTkVXVE9OX01JTl9TTE9QRSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXd0b25SYXBoc29uSXRlcmF0ZShhWCwgZ3Vlc3NGb3JUKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5pdGlhbFNsb3BlID09IDAuMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBndWVzc0ZvclQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBiaW5hcnlTdWJkaXZpZGUoYVgsIGludGVydmFsU3RhcnQsIGludGVydmFsU3RhcnQgKyBrU2FtcGxlU3RlcFNpemUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIF9wcmVjb21wdXRlZCA9IGZhbHNlO1xuXG4gICAgICAgIGZ1bmN0aW9uIHByZWNvbXB1dGUoKSB7XG4gICAgICAgICAgICBfcHJlY29tcHV0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKG1YMSAhPSBtWTEgfHwgbVgyICE9IG1ZMikgY2FsY1NhbXBsZVZhbHVlcygpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGYgPSBmdW5jdGlvbiAoYVgpIHtcbiAgICAgICAgICAgIGlmICghX3ByZWNvbXB1dGVkKSBwcmVjb21wdXRlKCk7XG4gICAgICAgICAgICBpZiAobVgxID09PSBtWTEgJiYgbVgyID09PSBtWTIpIHJldHVybiBhWDtcbiAgICAgICAgICAgIGlmIChhWCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgICAgICAgICBpZiAoYVggPT09IDEpIHJldHVybiAxO1xuXG4gICAgICAgICAgICByZXR1cm4gY2FsY0JlemllcihnZXRURm9yWChhWCksIG1ZMSwgbVkyKTtcbiAgICAgICAgfTtcblxuICAgICAgICBmLmdldENvbnRyb2xQb2ludHMgPSBmdW5jdGlvbigpIHsgcmV0dXJuIFt7IHg6IG1YMSwgeTogbVkxIH0sIHsgeDogbVgyLCB5OiBtWTIgfV07IH07XG5cbiAgICAgICAgdmFyIHN0ciA9IFwiZ2VuZXJhdGVCZXppZXIoXCIgKyBbbVgxLCBtWTEsIG1YMiwgbVkyXSArIFwiKVwiO1xuICAgICAgICBmLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gc3RyOyB9O1xuXG4gICAgICAgIHJldHVybiBmO1xuICAgIH1cblxuICAgIC8qIFJ1bmdlLUt1dHRhIHNwcmluZyBwaHlzaWNzIGZ1bmN0aW9uIGdlbmVyYXRvci4gQWRhcHRlZCBmcm9tIEZyYW1lci5qcywgY29weXJpZ2h0IEtvZW4gQm9rLiBNSVQgTGljZW5zZTogaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9NSVRfTGljZW5zZSAqL1xuICAgIC8qIEdpdmVuIGEgdGVuc2lvbiwgZnJpY3Rpb24sIGFuZCBkdXJhdGlvbiwgYSBzaW11bGF0aW9uIGF0IDYwRlBTIHdpbGwgZmlyc3QgcnVuIHdpdGhvdXQgYSBkZWZpbmVkIGR1cmF0aW9uIGluIG9yZGVyIHRvIGNhbGN1bGF0ZSB0aGUgZnVsbCBwYXRoLiBBIHNlY29uZCBwYXNzXG4gICAgICAgdGhlbiBhZGp1c3RzIHRoZSB0aW1lIGRlbHRhIC0tIHVzaW5nIHRoZSByZWxhdGlvbiBiZXR3ZWVuIGFjdHVhbCB0aW1lIGFuZCBkdXJhdGlvbiAtLSB0byBjYWxjdWxhdGUgdGhlIHBhdGggZm9yIHRoZSBkdXJhdGlvbi1jb25zdHJhaW5lZCBhbmltYXRpb24uICovXG4gICAgdmFyIGdlbmVyYXRlU3ByaW5nUks0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gc3ByaW5nQWNjZWxlcmF0aW9uRm9yU3RhdGUgKHN0YXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gKC1zdGF0ZS50ZW5zaW9uICogc3RhdGUueCkgLSAoc3RhdGUuZnJpY3Rpb24gKiBzdGF0ZS52KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNwcmluZ0V2YWx1YXRlU3RhdGVXaXRoRGVyaXZhdGl2ZSAoaW5pdGlhbFN0YXRlLCBkdCwgZGVyaXZhdGl2ZSkge1xuICAgICAgICAgICAgdmFyIHN0YXRlID0ge1xuICAgICAgICAgICAgICAgIHg6IGluaXRpYWxTdGF0ZS54ICsgZGVyaXZhdGl2ZS5keCAqIGR0LFxuICAgICAgICAgICAgICAgIHY6IGluaXRpYWxTdGF0ZS52ICsgZGVyaXZhdGl2ZS5kdiAqIGR0LFxuICAgICAgICAgICAgICAgIHRlbnNpb246IGluaXRpYWxTdGF0ZS50ZW5zaW9uLFxuICAgICAgICAgICAgICAgIGZyaWN0aW9uOiBpbml0aWFsU3RhdGUuZnJpY3Rpb25cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHJldHVybiB7IGR4OiBzdGF0ZS52LCBkdjogc3ByaW5nQWNjZWxlcmF0aW9uRm9yU3RhdGUoc3RhdGUpIH07XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBzcHJpbmdJbnRlZ3JhdGVTdGF0ZSAoc3RhdGUsIGR0KSB7XG4gICAgICAgICAgICB2YXIgYSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZHg6IHN0YXRlLnYsXG4gICAgICAgICAgICAgICAgICAgIGR2OiBzcHJpbmdBY2NlbGVyYXRpb25Gb3JTdGF0ZShzdGF0ZSlcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGIgPSBzcHJpbmdFdmFsdWF0ZVN0YXRlV2l0aERlcml2YXRpdmUoc3RhdGUsIGR0ICogMC41LCBhKSxcbiAgICAgICAgICAgICAgICBjID0gc3ByaW5nRXZhbHVhdGVTdGF0ZVdpdGhEZXJpdmF0aXZlKHN0YXRlLCBkdCAqIDAuNSwgYiksXG4gICAgICAgICAgICAgICAgZCA9IHNwcmluZ0V2YWx1YXRlU3RhdGVXaXRoRGVyaXZhdGl2ZShzdGF0ZSwgZHQsIGMpLFxuICAgICAgICAgICAgICAgIGR4ZHQgPSAxLjAgLyA2LjAgKiAoYS5keCArIDIuMCAqIChiLmR4ICsgYy5keCkgKyBkLmR4KSxcbiAgICAgICAgICAgICAgICBkdmR0ID0gMS4wIC8gNi4wICogKGEuZHYgKyAyLjAgKiAoYi5kdiArIGMuZHYpICsgZC5kdik7XG5cbiAgICAgICAgICAgIHN0YXRlLnggPSBzdGF0ZS54ICsgZHhkdCAqIGR0O1xuICAgICAgICAgICAgc3RhdGUudiA9IHN0YXRlLnYgKyBkdmR0ICogZHQ7XG5cbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBzcHJpbmdSSzRGYWN0b3J5ICh0ZW5zaW9uLCBmcmljdGlvbiwgZHVyYXRpb24pIHtcblxuICAgICAgICAgICAgdmFyIGluaXRTdGF0ZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgeDogLTEsXG4gICAgICAgICAgICAgICAgICAgIHY6IDAsXG4gICAgICAgICAgICAgICAgICAgIHRlbnNpb246IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIGZyaWN0aW9uOiBudWxsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwYXRoID0gWzBdLFxuICAgICAgICAgICAgICAgIHRpbWVfbGFwc2VkID0gMCxcbiAgICAgICAgICAgICAgICB0b2xlcmFuY2UgPSAxIC8gMTAwMDAsXG4gICAgICAgICAgICAgICAgRFQgPSAxNiAvIDEwMDAsXG4gICAgICAgICAgICAgICAgaGF2ZV9kdXJhdGlvbiwgZHQsIGxhc3Rfc3RhdGU7XG5cbiAgICAgICAgICAgIHRlbnNpb24gPSBwYXJzZUZsb2F0KHRlbnNpb24pIHx8IDUwMDtcbiAgICAgICAgICAgIGZyaWN0aW9uID0gcGFyc2VGbG9hdChmcmljdGlvbikgfHwgMjA7XG4gICAgICAgICAgICBkdXJhdGlvbiA9IGR1cmF0aW9uIHx8IG51bGw7XG5cbiAgICAgICAgICAgIGluaXRTdGF0ZS50ZW5zaW9uID0gdGVuc2lvbjtcbiAgICAgICAgICAgIGluaXRTdGF0ZS5mcmljdGlvbiA9IGZyaWN0aW9uO1xuXG4gICAgICAgICAgICBoYXZlX2R1cmF0aW9uID0gZHVyYXRpb24gIT09IG51bGw7XG5cbiAgICAgICAgICAgIC8qIENhbGN1bGF0ZSB0aGUgYWN0dWFsIHRpbWUgaXQgdGFrZXMgZm9yIHRoaXMgYW5pbWF0aW9uIHRvIGNvbXBsZXRlIHdpdGggdGhlIHByb3ZpZGVkIGNvbmRpdGlvbnMuICovXG4gICAgICAgICAgICBpZiAoaGF2ZV9kdXJhdGlvbikge1xuICAgICAgICAgICAgICAgIC8qIFJ1biB0aGUgc2ltdWxhdGlvbiB3aXRob3V0IGEgZHVyYXRpb24uICovXG4gICAgICAgICAgICAgICAgdGltZV9sYXBzZWQgPSBzcHJpbmdSSzRGYWN0b3J5KHRlbnNpb24sIGZyaWN0aW9uKTtcbiAgICAgICAgICAgICAgICAvKiBDb21wdXRlIHRoZSBhZGp1c3RlZCB0aW1lIGRlbHRhLiAqL1xuICAgICAgICAgICAgICAgIGR0ID0gdGltZV9sYXBzZWQgLyBkdXJhdGlvbiAqIERUO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkdCA9IERUO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICAgIC8qIE5leHQvc3RlcCBmdW5jdGlvbiAuKi9cbiAgICAgICAgICAgICAgICBsYXN0X3N0YXRlID0gc3ByaW5nSW50ZWdyYXRlU3RhdGUobGFzdF9zdGF0ZSB8fCBpbml0U3RhdGUsIGR0KTtcbiAgICAgICAgICAgICAgICAvKiBTdG9yZSB0aGUgcG9zaXRpb24uICovXG4gICAgICAgICAgICAgICAgcGF0aC5wdXNoKDEgKyBsYXN0X3N0YXRlLngpO1xuICAgICAgICAgICAgICAgIHRpbWVfbGFwc2VkICs9IDE2O1xuICAgICAgICAgICAgICAgIC8qIElmIHRoZSBjaGFuZ2UgdGhyZXNob2xkIGlzIHJlYWNoZWQsIGJyZWFrLiAqL1xuICAgICAgICAgICAgICAgIGlmICghKE1hdGguYWJzKGxhc3Rfc3RhdGUueCkgPiB0b2xlcmFuY2UgJiYgTWF0aC5hYnMobGFzdF9zdGF0ZS52KSA+IHRvbGVyYW5jZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiBJZiBkdXJhdGlvbiBpcyBub3QgZGVmaW5lZCwgcmV0dXJuIHRoZSBhY3R1YWwgdGltZSByZXF1aXJlZCBmb3IgY29tcGxldGluZyB0aGlzIGFuaW1hdGlvbi4gT3RoZXJ3aXNlLCByZXR1cm4gYSBjbG9zdXJlIHRoYXQgaG9sZHMgdGhlXG4gICAgICAgICAgICAgICBjb21wdXRlZCBwYXRoIGFuZCByZXR1cm5zIGEgc25hcHNob3Qgb2YgdGhlIHBvc2l0aW9uIGFjY29yZGluZyB0byBhIGdpdmVuIHBlcmNlbnRDb21wbGV0ZS4gKi9cbiAgICAgICAgICAgIHJldHVybiAhaGF2ZV9kdXJhdGlvbiA/IHRpbWVfbGFwc2VkIDogZnVuY3Rpb24ocGVyY2VudENvbXBsZXRlKSB7IHJldHVybiBwYXRoWyAocGVyY2VudENvbXBsZXRlICogKHBhdGgubGVuZ3RoIC0gMSkpIHwgMCBdOyB9O1xuICAgICAgICB9O1xuICAgIH0oKSk7XG5cbiAgICAvKiBqUXVlcnkgZWFzaW5ncy4gKi9cbiAgICBWZWxvY2l0eS5FYXNpbmdzID0ge1xuICAgICAgICBsaW5lYXI6IGZ1bmN0aW9uKHApIHsgcmV0dXJuIHA7IH0sXG4gICAgICAgIHN3aW5nOiBmdW5jdGlvbihwKSB7IHJldHVybiAwLjUgLSBNYXRoLmNvcyggcCAqIE1hdGguUEkgKSAvIDIgfSxcbiAgICAgICAgLyogQm9udXMgXCJzcHJpbmdcIiBlYXNpbmcsIHdoaWNoIGlzIGEgbGVzcyBleGFnZ2VyYXRlZCB2ZXJzaW9uIG9mIGVhc2VJbk91dEVsYXN0aWMuICovXG4gICAgICAgIHNwcmluZzogZnVuY3Rpb24ocCkgeyByZXR1cm4gMSAtIChNYXRoLmNvcyhwICogNC41ICogTWF0aC5QSSkgKiBNYXRoLmV4cCgtcCAqIDYpKTsgfVxuICAgIH07XG5cbiAgICAvKiBDU1MzIGFuZCBSb2JlcnQgUGVubmVyIGVhc2luZ3MuICovXG4gICAgJC5lYWNoKFxuICAgICAgICBbXG4gICAgICAgICAgICBbIFwiZWFzZVwiLCBbIDAuMjUsIDAuMSwgMC4yNSwgMS4wIF0gXSxcbiAgICAgICAgICAgIFsgXCJlYXNlLWluXCIsIFsgMC40MiwgMC4wLCAxLjAwLCAxLjAgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2Utb3V0XCIsIFsgMC4wMCwgMC4wLCAwLjU4LCAxLjAgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2UtaW4tb3V0XCIsIFsgMC40MiwgMC4wLCAwLjU4LCAxLjAgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2VJblNpbmVcIiwgWyAwLjQ3LCAwLCAwLjc0NSwgMC43MTUgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2VPdXRTaW5lXCIsIFsgMC4zOSwgMC41NzUsIDAuNTY1LCAxIF0gXSxcbiAgICAgICAgICAgIFsgXCJlYXNlSW5PdXRTaW5lXCIsIFsgMC40NDUsIDAuMDUsIDAuNTUsIDAuOTUgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2VJblF1YWRcIiwgWyAwLjU1LCAwLjA4NSwgMC42OCwgMC41MyBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZU91dFF1YWRcIiwgWyAwLjI1LCAwLjQ2LCAwLjQ1LCAwLjk0IF0gXSxcbiAgICAgICAgICAgIFsgXCJlYXNlSW5PdXRRdWFkXCIsIFsgMC40NTUsIDAuMDMsIDAuNTE1LCAwLjk1NSBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZUluQ3ViaWNcIiwgWyAwLjU1LCAwLjA1NSwgMC42NzUsIDAuMTkgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2VPdXRDdWJpY1wiLCBbIDAuMjE1LCAwLjYxLCAwLjM1NSwgMSBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZUluT3V0Q3ViaWNcIiwgWyAwLjY0NSwgMC4wNDUsIDAuMzU1LCAxIF0gXSxcbiAgICAgICAgICAgIFsgXCJlYXNlSW5RdWFydFwiLCBbIDAuODk1LCAwLjAzLCAwLjY4NSwgMC4yMiBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZU91dFF1YXJ0XCIsIFsgMC4xNjUsIDAuODQsIDAuNDQsIDEgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2VJbk91dFF1YXJ0XCIsIFsgMC43NywgMCwgMC4xNzUsIDEgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2VJblF1aW50XCIsIFsgMC43NTUsIDAuMDUsIDAuODU1LCAwLjA2IF0gXSxcbiAgICAgICAgICAgIFsgXCJlYXNlT3V0UXVpbnRcIiwgWyAwLjIzLCAxLCAwLjMyLCAxIF0gXSxcbiAgICAgICAgICAgIFsgXCJlYXNlSW5PdXRRdWludFwiLCBbIDAuODYsIDAsIDAuMDcsIDEgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2VJbkV4cG9cIiwgWyAwLjk1LCAwLjA1LCAwLjc5NSwgMC4wMzUgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2VPdXRFeHBvXCIsIFsgMC4xOSwgMSwgMC4yMiwgMSBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZUluT3V0RXhwb1wiLCBbIDEsIDAsIDAsIDEgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2VJbkNpcmNcIiwgWyAwLjYsIDAuMDQsIDAuOTgsIDAuMzM1IF0gXSxcbiAgICAgICAgICAgIFsgXCJlYXNlT3V0Q2lyY1wiLCBbIDAuMDc1LCAwLjgyLCAwLjE2NSwgMSBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZUluT3V0Q2lyY1wiLCBbIDAuNzg1LCAwLjEzNSwgMC4xNSwgMC44NiBdIF1cbiAgICAgICAgXSwgZnVuY3Rpb24oaSwgZWFzaW5nQXJyYXkpIHtcbiAgICAgICAgICAgIFZlbG9jaXR5LkVhc2luZ3NbZWFzaW5nQXJyYXlbMF1dID0gZ2VuZXJhdGVCZXppZXIuYXBwbHkobnVsbCwgZWFzaW5nQXJyYXlbMV0pO1xuICAgICAgICB9KTtcblxuICAgIC8qIERldGVybWluZSB0aGUgYXBwcm9wcmlhdGUgZWFzaW5nIHR5cGUgZ2l2ZW4gYW4gZWFzaW5nIGlucHV0LiAqL1xuICAgIGZ1bmN0aW9uIGdldEVhc2luZyh2YWx1ZSwgZHVyYXRpb24pIHtcbiAgICAgICAgdmFyIGVhc2luZyA9IHZhbHVlO1xuXG4gICAgICAgIC8qIFRoZSBlYXNpbmcgb3B0aW9uIGNhbiBlaXRoZXIgYmUgYSBzdHJpbmcgdGhhdCByZWZlcmVuY2VzIGEgcHJlLXJlZ2lzdGVyZWQgZWFzaW5nLFxuICAgICAgICAgICBvciBpdCBjYW4gYmUgYSB0d28tL2ZvdXItaXRlbSBhcnJheSBvZiBpbnRlZ2VycyB0byBiZSBjb252ZXJ0ZWQgaW50byBhIGJlemllci9zcHJpbmcgZnVuY3Rpb24uICovXG4gICAgICAgIGlmIChUeXBlLmlzU3RyaW5nKHZhbHVlKSkge1xuICAgICAgICAgICAgLyogRW5zdXJlIHRoYXQgdGhlIGVhc2luZyBoYXMgYmVlbiBhc3NpZ25lZCB0byBqUXVlcnkncyBWZWxvY2l0eS5FYXNpbmdzIG9iamVjdC4gKi9cbiAgICAgICAgICAgIGlmICghVmVsb2NpdHkuRWFzaW5nc1t2YWx1ZV0pIHtcbiAgICAgICAgICAgICAgICBlYXNpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChUeXBlLmlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgZWFzaW5nID0gZ2VuZXJhdGVTdGVwLmFwcGx5KG51bGwsIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChUeXBlLmlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgLyogc3ByaW5nUks0IG11c3QgYmUgcGFzc2VkIHRoZSBhbmltYXRpb24ncyBkdXJhdGlvbi4gKi9cbiAgICAgICAgICAgIC8qIE5vdGU6IElmIHRoZSBzcHJpbmdSSzQgYXJyYXkgY29udGFpbnMgbm9uLW51bWJlcnMsIGdlbmVyYXRlU3ByaW5nUks0KCkgcmV0dXJucyBhbiBlYXNpbmdcbiAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdlbmVyYXRlZCB3aXRoIGRlZmF1bHQgdGVuc2lvbiBhbmQgZnJpY3Rpb24gdmFsdWVzLiAqL1xuICAgICAgICAgICAgZWFzaW5nID0gZ2VuZXJhdGVTcHJpbmdSSzQuYXBwbHkobnVsbCwgdmFsdWUuY29uY2F0KFsgZHVyYXRpb24gXSkpO1xuICAgICAgICB9IGVsc2UgaWYgKFR5cGUuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSA0KSB7XG4gICAgICAgICAgICAvKiBOb3RlOiBJZiB0aGUgYmV6aWVyIGFycmF5IGNvbnRhaW5zIG5vbi1udW1iZXJzLCBnZW5lcmF0ZUJlemllcigpIHJldHVybnMgZmFsc2UuICovXG4gICAgICAgICAgICBlYXNpbmcgPSBnZW5lcmF0ZUJlemllci5hcHBseShudWxsLCB2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlYXNpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIFJldmVydCB0byB0aGUgVmVsb2NpdHktd2lkZSBkZWZhdWx0IGVhc2luZyB0eXBlLCBvciBmYWxsIGJhY2sgdG8gXCJzd2luZ1wiICh3aGljaCBpcyBhbHNvIGpRdWVyeSdzIGRlZmF1bHQpXG4gICAgICAgICAgIGlmIHRoZSBWZWxvY2l0eS13aWRlIGRlZmF1bHQgaGFzIGJlZW4gaW5jb3JyZWN0bHkgbW9kaWZpZWQuICovXG4gICAgICAgIGlmIChlYXNpbmcgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBpZiAoVmVsb2NpdHkuRWFzaW5nc1tWZWxvY2l0eS5kZWZhdWx0cy5lYXNpbmddKSB7XG4gICAgICAgICAgICAgICAgZWFzaW5nID0gVmVsb2NpdHkuZGVmYXVsdHMuZWFzaW5nO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBlYXNpbmcgPSBFQVNJTkdfREVGQVVMVDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlYXNpbmc7XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKioqXG4gICAgICAgIENTUyBTdGFja1xuICAgICoqKioqKioqKioqKioqKioqL1xuXG4gICAgLyogVGhlIENTUyBvYmplY3QgaXMgYSBoaWdobHkgY29uZGVuc2VkIGFuZCBwZXJmb3JtYW50IENTUyBzdGFjayB0aGF0IGZ1bGx5IHJlcGxhY2VzIGpRdWVyeSdzLlxuICAgICAgIEl0IGhhbmRsZXMgdGhlIHZhbGlkYXRpb24sIGdldHRpbmcsIGFuZCBzZXR0aW5nIG9mIGJvdGggc3RhbmRhcmQgQ1NTIHByb3BlcnRpZXMgYW5kIENTUyBwcm9wZXJ0eSBob29rcy4gKi9cbiAgICAvKiBOb3RlOiBBIFwiQ1NTXCIgc2hvcnRoYW5kIGlzIGFsaWFzZWQgc28gdGhhdCBvdXIgY29kZSBpcyBlYXNpZXIgdG8gcmVhZC4gKi9cbiAgICB2YXIgQ1NTID0gVmVsb2NpdHkuQ1NTID0ge1xuXG4gICAgICAgIC8qKioqKioqKioqKioqXG4gICAgICAgICAgICBSZWdFeFxuICAgICAgICAqKioqKioqKioqKioqL1xuXG4gICAgICAgIFJlZ0V4OiB7XG4gICAgICAgICAgICBpc0hleDogL14jKFtBLWZcXGRdezN9KXsxLDJ9JC9pLFxuICAgICAgICAgICAgLyogVW53cmFwIGEgcHJvcGVydHkgdmFsdWUncyBzdXJyb3VuZGluZyB0ZXh0LCBlLmcuIFwicmdiYSg0LCAzLCAyLCAxKVwiID09PiBcIjQsIDMsIDIsIDFcIiBhbmQgXCJyZWN0KDRweCAzcHggMnB4IDFweClcIiA9PT4gXCI0cHggM3B4IDJweCAxcHhcIi4gKi9cbiAgICAgICAgICAgIHZhbHVlVW53cmFwOiAvXltBLXpdK1xcKCguKilcXCkkL2ksXG4gICAgICAgICAgICB3cmFwcGVkVmFsdWVBbHJlYWR5RXh0cmFjdGVkOiAvWzAtOS5dKyBbMC05Ll0rIFswLTkuXSsoIFswLTkuXSspPy8sXG4gICAgICAgICAgICAvKiBTcGxpdCBhIG11bHRpLXZhbHVlIHByb3BlcnR5IGludG8gYW4gYXJyYXkgb2Ygc3VidmFsdWVzLCBlLmcuIFwicmdiYSg0LCAzLCAyLCAxKSA0cHggM3B4IDJweCAxcHhcIiA9PT4gWyBcInJnYmEoNCwgMywgMiwgMSlcIiwgXCI0cHhcIiwgXCIzcHhcIiwgXCIycHhcIiwgXCIxcHhcIiBdLiAqL1xuICAgICAgICAgICAgdmFsdWVTcGxpdDogLyhbQS16XStcXCguK1xcKSl8KChbQS16MC05Iy0uXSs/KSg/PVxcc3wkKSkvaWdcbiAgICAgICAgfSxcblxuICAgICAgICAvKioqKioqKioqKioqXG4gICAgICAgICAgICBMaXN0c1xuICAgICAgICAqKioqKioqKioqKiovXG5cbiAgICAgICAgTGlzdHM6IHtcbiAgICAgICAgICAgIGNvbG9yczogWyBcImZpbGxcIiwgXCJzdHJva2VcIiwgXCJzdG9wQ29sb3JcIiwgXCJjb2xvclwiLCBcImJhY2tncm91bmRDb2xvclwiLCBcImJvcmRlckNvbG9yXCIsIFwiYm9yZGVyVG9wQ29sb3JcIiwgXCJib3JkZXJSaWdodENvbG9yXCIsIFwiYm9yZGVyQm90dG9tQ29sb3JcIiwgXCJib3JkZXJMZWZ0Q29sb3JcIiwgXCJvdXRsaW5lQ29sb3JcIiBdLFxuICAgICAgICAgICAgdHJhbnNmb3Jtc0Jhc2U6IFsgXCJ0cmFuc2xhdGVYXCIsIFwidHJhbnNsYXRlWVwiLCBcInNjYWxlXCIsIFwic2NhbGVYXCIsIFwic2NhbGVZXCIsIFwic2tld1hcIiwgXCJza2V3WVwiLCBcInJvdGF0ZVpcIiBdLFxuICAgICAgICAgICAgdHJhbnNmb3JtczNEOiBbIFwidHJhbnNmb3JtUGVyc3BlY3RpdmVcIiwgXCJ0cmFuc2xhdGVaXCIsIFwic2NhbGVaXCIsIFwicm90YXRlWFwiLCBcInJvdGF0ZVlcIiBdXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqKioqKioqKioqKlxuICAgICAgICAgICAgSG9va3NcbiAgICAgICAgKioqKioqKioqKioqL1xuXG4gICAgICAgIC8qIEhvb2tzIGFsbG93IGEgc3VicHJvcGVydHkgKGUuZy4gXCJib3hTaGFkb3dCbHVyXCIpIG9mIGEgY29tcG91bmQtdmFsdWUgQ1NTIHByb3BlcnR5XG4gICAgICAgICAgIChlLmcuIFwiYm94U2hhZG93OiBYIFkgQmx1ciBTcHJlYWQgQ29sb3JcIikgdG8gYmUgYW5pbWF0ZWQgYXMgaWYgaXQgd2VyZSBhIGRpc2NyZXRlIHByb3BlcnR5LiAqL1xuICAgICAgICAvKiBOb3RlOiBCZXlvbmQgZW5hYmxpbmcgZmluZS1ncmFpbmVkIHByb3BlcnR5IGFuaW1hdGlvbiwgaG9va2luZyBpcyBuZWNlc3Nhcnkgc2luY2UgVmVsb2NpdHkgb25seVxuICAgICAgICAgICB0d2VlbnMgcHJvcGVydGllcyB3aXRoIHNpbmdsZSBudW1lcmljIHZhbHVlczsgdW5saWtlIENTUyB0cmFuc2l0aW9ucywgVmVsb2NpdHkgZG9lcyBub3QgaW50ZXJwb2xhdGUgY29tcG91bmQtdmFsdWVzLiAqL1xuICAgICAgICBIb29rczoge1xuICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgUmVnaXN0cmF0aW9uXG4gICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgLyogVGVtcGxhdGVzIGFyZSBhIGNvbmNpc2Ugd2F5IG9mIGluZGljYXRpbmcgd2hpY2ggc3VicHJvcGVydGllcyBtdXN0IGJlIGluZGl2aWR1YWxseSByZWdpc3RlcmVkIGZvciBlYWNoIGNvbXBvdW5kLXZhbHVlIENTUyBwcm9wZXJ0eS4gKi9cbiAgICAgICAgICAgIC8qIEVhY2ggdGVtcGxhdGUgY29uc2lzdHMgb2YgdGhlIGNvbXBvdW5kLXZhbHVlJ3MgYmFzZSBuYW1lLCBpdHMgY29uc3RpdHVlbnQgc3VicHJvcGVydHkgbmFtZXMsIGFuZCB0aG9zZSBzdWJwcm9wZXJ0aWVzJyBkZWZhdWx0IHZhbHVlcy4gKi9cbiAgICAgICAgICAgIHRlbXBsYXRlczoge1xuICAgICAgICAgICAgICAgIFwidGV4dFNoYWRvd1wiOiBbIFwiQ29sb3IgWCBZIEJsdXJcIiwgXCJibGFjayAwcHggMHB4IDBweFwiIF0sXG4gICAgICAgICAgICAgICAgXCJib3hTaGFkb3dcIjogWyBcIkNvbG9yIFggWSBCbHVyIFNwcmVhZFwiLCBcImJsYWNrIDBweCAwcHggMHB4IDBweFwiIF0sXG4gICAgICAgICAgICAgICAgXCJjbGlwXCI6IFsgXCJUb3AgUmlnaHQgQm90dG9tIExlZnRcIiwgXCIwcHggMHB4IDBweCAwcHhcIiBdLFxuICAgICAgICAgICAgICAgIFwiYmFja2dyb3VuZFBvc2l0aW9uXCI6IFsgXCJYIFlcIiwgXCIwJSAwJVwiIF0sXG4gICAgICAgICAgICAgICAgXCJ0cmFuc2Zvcm1PcmlnaW5cIjogWyBcIlggWSBaXCIsIFwiNTAlIDUwJSAwcHhcIiBdLFxuICAgICAgICAgICAgICAgIFwicGVyc3BlY3RpdmVPcmlnaW5cIjogWyBcIlggWVwiLCBcIjUwJSA1MCVcIiBdXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKiBBIFwicmVnaXN0ZXJlZFwiIGhvb2sgaXMgb25lIHRoYXQgaGFzIGJlZW4gY29udmVydGVkIGZyb20gaXRzIHRlbXBsYXRlIGZvcm0gaW50byBhIGxpdmUsXG4gICAgICAgICAgICAgICB0d2VlbmFibGUgcHJvcGVydHkuIEl0IGNvbnRhaW5zIGRhdGEgdG8gYXNzb2NpYXRlIGl0IHdpdGggaXRzIHJvb3QgcHJvcGVydHkuICovXG4gICAgICAgICAgICByZWdpc3RlcmVkOiB7XG4gICAgICAgICAgICAgICAgLyogTm90ZTogQSByZWdpc3RlcmVkIGhvb2sgbG9va3MgbGlrZSB0aGlzID09PiB0ZXh0U2hhZG93Qmx1cjogWyBcInRleHRTaGFkb3dcIiwgMyBdLFxuICAgICAgICAgICAgICAgICAgIHdoaWNoIGNvbnNpc3RzIG9mIHRoZSBzdWJwcm9wZXJ0eSdzIG5hbWUsIHRoZSBhc3NvY2lhdGVkIHJvb3QgcHJvcGVydHkncyBuYW1lLFxuICAgICAgICAgICAgICAgICAgIGFuZCB0aGUgc3VicHJvcGVydHkncyBwb3NpdGlvbiBpbiB0aGUgcm9vdCdzIHZhbHVlLiAqL1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qIENvbnZlcnQgdGhlIHRlbXBsYXRlcyBpbnRvIGluZGl2aWR1YWwgaG9va3MgdGhlbiBhcHBlbmQgdGhlbSB0byB0aGUgcmVnaXN0ZXJlZCBvYmplY3QgYWJvdmUuICovXG4gICAgICAgICAgICByZWdpc3RlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8qIENvbG9yIGhvb2tzIHJlZ2lzdHJhdGlvbjogQ29sb3JzIGFyZSBkZWZhdWx0ZWQgdG8gd2hpdGUgLS0gYXMgb3Bwb3NlZCB0byBibGFjayAtLSBzaW5jZSBjb2xvcnMgdGhhdCBhcmVcbiAgICAgICAgICAgICAgICAgICBjdXJyZW50bHkgc2V0IHRvIFwidHJhbnNwYXJlbnRcIiBkZWZhdWx0IHRvIHRoZWlyIHJlc3BlY3RpdmUgdGVtcGxhdGUgYmVsb3cgd2hlbiBjb2xvci1hbmltYXRlZCxcbiAgICAgICAgICAgICAgICAgICBhbmQgd2hpdGUgaXMgdHlwaWNhbGx5IGEgY2xvc2VyIG1hdGNoIHRvIHRyYW5zcGFyZW50IHRoYW4gYmxhY2sgaXMuIEFuIGV4Y2VwdGlvbiBpcyBtYWRlIGZvciB0ZXh0IChcImNvbG9yXCIpLFxuICAgICAgICAgICAgICAgICAgIHdoaWNoIGlzIGFsbW9zdCBhbHdheXMgc2V0IGNsb3NlciB0byBibGFjayB0aGFuIHdoaXRlLiAqL1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgQ1NTLkxpc3RzLmNvbG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmdiQ29tcG9uZW50cyA9IChDU1MuTGlzdHMuY29sb3JzW2ldID09PSBcImNvbG9yXCIpID8gXCIwIDAgMCAxXCIgOiBcIjI1NSAyNTUgMjU1IDFcIjtcbiAgICAgICAgICAgICAgICAgICAgQ1NTLkhvb2tzLnRlbXBsYXRlc1tDU1MuTGlzdHMuY29sb3JzW2ldXSA9IFsgXCJSZWQgR3JlZW4gQmx1ZSBBbHBoYVwiLCByZ2JDb21wb25lbnRzIF07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHJvb3RQcm9wZXJ0eSxcbiAgICAgICAgICAgICAgICAgICAgaG9va1RlbXBsYXRlLFxuICAgICAgICAgICAgICAgICAgICBob29rTmFtZXM7XG5cbiAgICAgICAgICAgICAgICAvKiBJbiBJRSwgY29sb3IgdmFsdWVzIGluc2lkZSBjb21wb3VuZC12YWx1ZSBwcm9wZXJ0aWVzIGFyZSBwb3NpdGlvbmVkIGF0IHRoZSBlbmQgdGhlIHZhbHVlIGluc3RlYWQgb2YgYXQgdGhlIGJlZ2lubmluZy5cbiAgICAgICAgICAgICAgICAgICBUaHVzLCB3ZSByZS1hcnJhbmdlIHRoZSB0ZW1wbGF0ZXMgYWNjb3JkaW5nbHkuICovXG4gICAgICAgICAgICAgICAgaWYgKElFKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAocm9vdFByb3BlcnR5IGluIENTUy5Ib29rcy50ZW1wbGF0ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvb2tUZW1wbGF0ZSA9IENTUy5Ib29rcy50ZW1wbGF0ZXNbcm9vdFByb3BlcnR5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvb2tOYW1lcyA9IGhvb2tUZW1wbGF0ZVswXS5zcGxpdChcIiBcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkZWZhdWx0VmFsdWVzID0gaG9va1RlbXBsYXRlWzFdLm1hdGNoKENTUy5SZWdFeC52YWx1ZVNwbGl0KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhvb2tOYW1lc1swXSA9PT0gXCJDb2xvclwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogUmVwb3NpdGlvbiBib3RoIHRoZSBob29rJ3MgbmFtZSBhbmQgaXRzIGRlZmF1bHQgdmFsdWUgdG8gdGhlIGVuZCBvZiB0aGVpciByZXNwZWN0aXZlIHN0cmluZ3MuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9va05hbWVzLnB1c2goaG9va05hbWVzLnNoaWZ0KCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZXMucHVzaChkZWZhdWx0VmFsdWVzLnNoaWZ0KCkpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogUmVwbGFjZSB0aGUgZXhpc3RpbmcgdGVtcGxhdGUgZm9yIHRoZSBob29rJ3Mgcm9vdCBwcm9wZXJ0eS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBDU1MuSG9va3MudGVtcGxhdGVzW3Jvb3RQcm9wZXJ0eV0gPSBbIGhvb2tOYW1lcy5qb2luKFwiIFwiKSwgZGVmYXVsdFZhbHVlcy5qb2luKFwiIFwiKSBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyogSG9vayByZWdpc3RyYXRpb24uICovXG4gICAgICAgICAgICAgICAgZm9yIChyb290UHJvcGVydHkgaW4gQ1NTLkhvb2tzLnRlbXBsYXRlcykge1xuICAgICAgICAgICAgICAgICAgICBob29rVGVtcGxhdGUgPSBDU1MuSG9va3MudGVtcGxhdGVzW3Jvb3RQcm9wZXJ0eV07XG4gICAgICAgICAgICAgICAgICAgIGhvb2tOYW1lcyA9IGhvb2tUZW1wbGF0ZVswXS5zcGxpdChcIiBcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBob29rTmFtZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmdWxsSG9va05hbWUgPSByb290UHJvcGVydHkgKyBob29rTmFtZXNbaV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9va1Bvc2l0aW9uID0gaTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogRm9yIGVhY2ggaG9vaywgcmVnaXN0ZXIgaXRzIGZ1bGwgbmFtZSAoZS5nLiB0ZXh0U2hhZG93Qmx1cikgd2l0aCBpdHMgcm9vdCBwcm9wZXJ0eSAoZS5nLiB0ZXh0U2hhZG93KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kIHRoZSBob29rJ3MgcG9zaXRpb24gaW4gaXRzIHRlbXBsYXRlJ3MgZGVmYXVsdCB2YWx1ZSBzdHJpbmcuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBDU1MuSG9va3MucmVnaXN0ZXJlZFtmdWxsSG9va05hbWVdID0gWyByb290UHJvcGVydHksIGhvb2tQb3NpdGlvbiBdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICBJbmplY3Rpb24gYW5kIEV4dHJhY3Rpb25cbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAvKiBMb29rIHVwIHRoZSByb290IHByb3BlcnR5IGFzc29jaWF0ZWQgd2l0aCB0aGUgaG9vayAoZS5nLiByZXR1cm4gXCJ0ZXh0U2hhZG93XCIgZm9yIFwidGV4dFNoYWRvd0JsdXJcIikuICovXG4gICAgICAgICAgICAvKiBTaW5jZSBhIGhvb2sgY2Fubm90IGJlIHNldCBkaXJlY3RseSAodGhlIGJyb3dzZXIgd29uJ3QgcmVjb2duaXplIGl0KSwgc3R5bGUgdXBkYXRpbmcgZm9yIGhvb2tzIGlzIHJvdXRlZCB0aHJvdWdoIHRoZSBob29rJ3Mgcm9vdCBwcm9wZXJ0eS4gKi9cbiAgICAgICAgICAgIGdldFJvb3Q6IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIHZhciBob29rRGF0YSA9IENTUy5Ib29rcy5yZWdpc3RlcmVkW3Byb3BlcnR5XTtcblxuICAgICAgICAgICAgICAgIGlmIChob29rRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaG9va0RhdGFbMF07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlcmUgd2FzIG5vIGhvb2sgbWF0Y2gsIHJldHVybiB0aGUgcHJvcGVydHkgbmFtZSB1bnRvdWNoZWQuICovXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyogQ29udmVydCBhbnkgcm9vdFByb3BlcnR5VmFsdWUsIG51bGwgb3Igb3RoZXJ3aXNlLCBpbnRvIGEgc3BhY2UtZGVsaW1pdGVkIGxpc3Qgb2YgaG9vayB2YWx1ZXMgc28gdGhhdFxuICAgICAgICAgICAgICAgdGhlIHRhcmdldGVkIGhvb2sgY2FuIGJlIGluamVjdGVkIG9yIGV4dHJhY3RlZCBhdCBpdHMgc3RhbmRhcmQgcG9zaXRpb24uICovXG4gICAgICAgICAgICBjbGVhblJvb3RQcm9wZXJ0eVZhbHVlOiBmdW5jdGlvbihyb290UHJvcGVydHksIHJvb3RQcm9wZXJ0eVZhbHVlKSB7XG4gICAgICAgICAgICAgICAgLyogSWYgdGhlIHJvb3RQcm9wZXJ0eVZhbHVlIGlzIHdyYXBwZWQgd2l0aCBcInJnYigpXCIsIFwiY2xpcCgpXCIsIGV0Yy4sIHJlbW92ZSB0aGUgd3JhcHBpbmcgdG8gbm9ybWFsaXplIHRoZSB2YWx1ZSBiZWZvcmUgbWFuaXB1bGF0aW9uLiAqL1xuICAgICAgICAgICAgICAgIGlmIChDU1MuUmVnRXgudmFsdWVVbndyYXAudGVzdChyb290UHJvcGVydHlWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSByb290UHJvcGVydHlWYWx1ZS5tYXRjaChDU1MuUmVnRXgudmFsdWVVbndyYXApWzFdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qIElmIHJvb3RQcm9wZXJ0eVZhbHVlIGlzIGEgQ1NTIG51bGwtdmFsdWUgKGZyb20gd2hpY2ggdGhlcmUncyBpbmhlcmVudGx5IG5vIGhvb2sgdmFsdWUgdG8gZXh0cmFjdCksXG4gICAgICAgICAgICAgICAgICAgZGVmYXVsdCB0byB0aGUgcm9vdCdzIGRlZmF1bHQgdmFsdWUgYXMgZGVmaW5lZCBpbiBDU1MuSG9va3MudGVtcGxhdGVzLiAqL1xuICAgICAgICAgICAgICAgIC8qIE5vdGU6IENTUyBudWxsLXZhbHVlcyBpbmNsdWRlIFwibm9uZVwiLCBcImF1dG9cIiwgYW5kIFwidHJhbnNwYXJlbnRcIi4gVGhleSBtdXN0IGJlIGNvbnZlcnRlZCBpbnRvIHRoZWlyXG4gICAgICAgICAgICAgICAgICAgemVyby12YWx1ZXMgKGUuZy4gdGV4dFNoYWRvdzogXCJub25lXCIgPT0+IHRleHRTaGFkb3c6IFwiMHB4IDBweCAwcHggYmxhY2tcIikgZm9yIGhvb2sgbWFuaXB1bGF0aW9uIHRvIHByb2NlZWQuICovXG4gICAgICAgICAgICAgICAgaWYgKENTUy5WYWx1ZXMuaXNDU1NOdWxsVmFsdWUocm9vdFByb3BlcnR5VmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gQ1NTLkhvb2tzLnRlbXBsYXRlc1tyb290UHJvcGVydHldWzFdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiByb290UHJvcGVydHlWYWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKiBFeHRyYWN0ZWQgdGhlIGhvb2sncyB2YWx1ZSBmcm9tIGl0cyByb290IHByb3BlcnR5J3MgdmFsdWUuIFRoaXMgaXMgdXNlZCB0byBnZXQgdGhlIHN0YXJ0aW5nIHZhbHVlIG9mIGFuIGFuaW1hdGluZyBob29rLiAqL1xuICAgICAgICAgICAgZXh0cmFjdFZhbHVlOiBmdW5jdGlvbiAoZnVsbEhvb2tOYW1lLCByb290UHJvcGVydHlWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBob29rRGF0YSA9IENTUy5Ib29rcy5yZWdpc3RlcmVkW2Z1bGxIb29rTmFtZV07XG5cbiAgICAgICAgICAgICAgICBpZiAoaG9va0RhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhvb2tSb290ID0gaG9va0RhdGFbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBob29rUG9zaXRpb24gPSBob29rRGF0YVsxXTtcblxuICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSA9IENTUy5Ib29rcy5jbGVhblJvb3RQcm9wZXJ0eVZhbHVlKGhvb2tSb290LCByb290UHJvcGVydHlWYWx1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLyogU3BsaXQgcm9vdFByb3BlcnR5VmFsdWUgaW50byBpdHMgY29uc3RpdHVlbnQgaG9vayB2YWx1ZXMgdGhlbiBncmFiIHRoZSBkZXNpcmVkIGhvb2sgYXQgaXRzIHN0YW5kYXJkIHBvc2l0aW9uLiAqL1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcm9vdFByb3BlcnR5VmFsdWUudG9TdHJpbmcoKS5tYXRjaChDU1MuUmVnRXgudmFsdWVTcGxpdClbaG9va1Bvc2l0aW9uXTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgcHJvdmlkZWQgZnVsbEhvb2tOYW1lIGlzbid0IGEgcmVnaXN0ZXJlZCBob29rLCByZXR1cm4gdGhlIHJvb3RQcm9wZXJ0eVZhbHVlIHRoYXQgd2FzIHBhc3NlZCBpbi4gKi9cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJvb3RQcm9wZXJ0eVZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKiBJbmplY3QgdGhlIGhvb2sncyB2YWx1ZSBpbnRvIGl0cyByb290IHByb3BlcnR5J3MgdmFsdWUuIFRoaXMgaXMgdXNlZCB0byBwaWVjZSBiYWNrIHRvZ2V0aGVyIHRoZSByb290IHByb3BlcnR5XG4gICAgICAgICAgICAgICBvbmNlIFZlbG9jaXR5IGhhcyB1cGRhdGVkIG9uZSBvZiBpdHMgaW5kaXZpZHVhbGx5IGhvb2tlZCB2YWx1ZXMgdGhyb3VnaCB0d2VlbmluZy4gKi9cbiAgICAgICAgICAgIGluamVjdFZhbHVlOiBmdW5jdGlvbiAoZnVsbEhvb2tOYW1lLCBob29rVmFsdWUsIHJvb3RQcm9wZXJ0eVZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGhvb2tEYXRhID0gQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbZnVsbEhvb2tOYW1lXTtcblxuICAgICAgICAgICAgICAgIGlmIChob29rRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaG9va1Jvb3QgPSBob29rRGF0YVswXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvb2tQb3NpdGlvbiA9IGhvb2tEYXRhWzFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWVQYXJ0cyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlVXBkYXRlZDtcblxuICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSA9IENTUy5Ib29rcy5jbGVhblJvb3RQcm9wZXJ0eVZhbHVlKGhvb2tSb290LCByb290UHJvcGVydHlWYWx1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLyogU3BsaXQgcm9vdFByb3BlcnR5VmFsdWUgaW50byBpdHMgaW5kaXZpZHVhbCBob29rIHZhbHVlcywgcmVwbGFjZSB0aGUgdGFyZ2V0ZWQgdmFsdWUgd2l0aCBob29rVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmVjb25zdHJ1Y3QgdGhlIHJvb3RQcm9wZXJ0eVZhbHVlIHN0cmluZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWVQYXJ0cyA9IHJvb3RQcm9wZXJ0eVZhbHVlLnRvU3RyaW5nKCkubWF0Y2goQ1NTLlJlZ0V4LnZhbHVlU3BsaXQpO1xuICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZVBhcnRzW2hvb2tQb3NpdGlvbl0gPSBob29rVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlVXBkYXRlZCA9IHJvb3RQcm9wZXJ0eVZhbHVlUGFydHMuam9pbihcIiBcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJvb3RQcm9wZXJ0eVZhbHVlVXBkYXRlZDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgcHJvdmlkZWQgZnVsbEhvb2tOYW1lIGlzbid0IGEgcmVnaXN0ZXJlZCBob29rLCByZXR1cm4gdGhlIHJvb3RQcm9wZXJ0eVZhbHVlIHRoYXQgd2FzIHBhc3NlZCBpbi4gKi9cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJvb3RQcm9wZXJ0eVZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICBOb3JtYWxpemF0aW9uc1xuICAgICAgICAqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgIC8qIE5vcm1hbGl6YXRpb25zIHN0YW5kYXJkaXplIENTUyBwcm9wZXJ0eSBtYW5pcHVsYXRpb24gYnkgcG9sbHlmaWxsaW5nIGJyb3dzZXItc3BlY2lmaWMgaW1wbGVtZW50YXRpb25zIChlLmcuIG9wYWNpdHkpXG4gICAgICAgICAgIGFuZCByZWZvcm1hdHRpbmcgc3BlY2lhbCBwcm9wZXJ0aWVzIChlLmcuIGNsaXAsIHJnYmEpIHRvIGxvb2sgbGlrZSBzdGFuZGFyZCBvbmVzLiAqL1xuICAgICAgICBOb3JtYWxpemF0aW9uczoge1xuICAgICAgICAgICAgLyogTm9ybWFsaXphdGlvbnMgYXJlIHBhc3NlZCBhIG5vcm1hbGl6YXRpb24gdGFyZ2V0IChlaXRoZXIgdGhlIHByb3BlcnR5J3MgbmFtZSwgaXRzIGV4dHJhY3RlZCB2YWx1ZSwgb3IgaXRzIGluamVjdGVkIHZhbHVlKSxcbiAgICAgICAgICAgICAgIHRoZSB0YXJnZXRlZCBlbGVtZW50ICh3aGljaCBtYXkgbmVlZCB0byBiZSBxdWVyaWVkKSwgYW5kIHRoZSB0YXJnZXRlZCBwcm9wZXJ0eSB2YWx1ZS4gKi9cbiAgICAgICAgICAgIHJlZ2lzdGVyZWQ6IHtcbiAgICAgICAgICAgICAgICBjbGlwOiBmdW5jdGlvbiAodHlwZSwgZWxlbWVudCwgcHJvcGVydHlWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJuYW1lXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiY2xpcFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogQ2xpcCBuZWVkcyB0byBiZSB1bndyYXBwZWQgYW5kIHN0cmlwcGVkIG9mIGl0cyBjb21tYXMgZHVyaW5nIGV4dHJhY3Rpb24uICovXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZXh0cmFjdFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBleHRyYWN0ZWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBWZWxvY2l0eSBhbHNvIGV4dHJhY3RlZCB0aGlzIHZhbHVlLCBza2lwIGV4dHJhY3Rpb24uICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENTUy5SZWdFeC53cmFwcGVkVmFsdWVBbHJlYWR5RXh0cmFjdGVkLnRlc3QocHJvcGVydHlWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFjdGVkID0gcHJvcGVydHlWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBSZW1vdmUgdGhlIFwicmVjdCgpXCIgd3JhcHBlci4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFjdGVkID0gcHJvcGVydHlWYWx1ZS50b1N0cmluZygpLm1hdGNoKENTUy5SZWdFeC52YWx1ZVVud3JhcCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU3RyaXAgb2ZmIGNvbW1hcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFjdGVkID0gZXh0cmFjdGVkID8gZXh0cmFjdGVkWzFdLnJlcGxhY2UoLywoXFxzKyk/L2csIFwiIFwiKSA6IHByb3BlcnR5VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4dHJhY3RlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIENsaXAgbmVlZHMgdG8gYmUgcmUtd3JhcHBlZCBkdXJpbmcgaW5qZWN0aW9uLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImluamVjdFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcInJlY3QoXCIgKyBwcm9wZXJ0eVZhbHVlICsgXCIpXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgYmx1cjogZnVuY3Rpb24odHlwZSwgZWxlbWVudCwgcHJvcGVydHlWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJuYW1lXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFZlbG9jaXR5LlN0YXRlLmlzRmlyZWZveCA/IFwiZmlsdGVyXCIgOiBcIi13ZWJraXQtZmlsdGVyXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZXh0cmFjdFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBleHRyYWN0ZWQgPSBwYXJzZUZsb2F0KHByb3BlcnR5VmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgZXh0cmFjdGVkIGlzIE5hTiwgbWVhbmluZyB0aGUgdmFsdWUgaXNuJ3QgYWxyZWFkeSBleHRyYWN0ZWQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEoZXh0cmFjdGVkIHx8IGV4dHJhY3RlZCA9PT0gMCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGJsdXJDb21wb25lbnQgPSBwcm9wZXJ0eVZhbHVlLnRvU3RyaW5nKCkubWF0Y2goL2JsdXJcXCgoWzAtOV0rW0Etel0rKVxcKS9pKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgZmlsdGVyIHN0cmluZyBoYWQgYSBibHVyIGNvbXBvbmVudCwgcmV0dXJuIGp1c3QgdGhlIGJsdXIgdmFsdWUgYW5kIHVuaXQgdHlwZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJsdXJDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhY3RlZCA9IGJsdXJDb21wb25lbnRbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBjb21wb25lbnQgZG9lc24ndCBleGlzdCwgZGVmYXVsdCBibHVyIHRvIDAuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYWN0ZWQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4dHJhY3RlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIEJsdXIgbmVlZHMgdG8gYmUgcmUtd3JhcHBlZCBkdXJpbmcgaW5qZWN0aW9uLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImluamVjdFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEZvciB0aGUgYmx1ciBlZmZlY3QgdG8gYmUgZnVsbHkgZGUtYXBwbGllZCwgaXQgbmVlZHMgdG8gYmUgc2V0IHRvIFwibm9uZVwiIGluc3RlYWQgb2YgMC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXBhcnNlRmxvYXQocHJvcGVydHlWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcImJsdXIoXCIgKyBwcm9wZXJ0eVZhbHVlICsgXCIpXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIC8qIDw9SUU4IGRvIG5vdCBzdXBwb3J0IHRoZSBzdGFuZGFyZCBvcGFjaXR5IHByb3BlcnR5LiBUaGV5IHVzZSBmaWx0ZXI6YWxwaGEob3BhY2l0eT1JTlQpIGluc3RlYWQuICovXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogZnVuY3Rpb24gKHR5cGUsIGVsZW1lbnQsIHByb3BlcnR5VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKElFIDw9IDgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJuYW1lXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcImZpbHRlclwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJleHRyYWN0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIDw9SUU4IHJldHVybiBhIFwiZmlsdGVyXCIgdmFsdWUgb2YgXCJhbHBoYShvcGFjaXR5PVxcZHsxLDN9KVwiLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFeHRyYWN0IHRoZSB2YWx1ZSBhbmQgY29udmVydCBpdCB0byBhIGRlY2ltYWwgdmFsdWUgdG8gbWF0Y2ggdGhlIHN0YW5kYXJkIENTUyBvcGFjaXR5IHByb3BlcnR5J3MgZm9ybWF0dGluZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4dHJhY3RlZCA9IHByb3BlcnR5VmFsdWUudG9TdHJpbmcoKS5tYXRjaCgvYWxwaGFcXChvcGFjaXR5PSguKilcXCkvaSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4dHJhY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ29udmVydCB0byBkZWNpbWFsIHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IGV4dHJhY3RlZFsxXSAvIDEwMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFdoZW4gZXh0cmFjdGluZyBvcGFjaXR5LCBkZWZhdWx0IHRvIDEgc2luY2UgYSBudWxsIHZhbHVlIG1lYW5zIG9wYWNpdHkgaGFzbid0IGJlZW4gc2V0LiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydHlWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaW5qZWN0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE9wYWNpZmllZCBlbGVtZW50cyBhcmUgcmVxdWlyZWQgdG8gaGF2ZSB0aGVpciB6b29tIHByb3BlcnR5IHNldCB0byBhIG5vbi16ZXJvIHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlLnpvb20gPSAxO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNldHRpbmcgdGhlIGZpbHRlciBwcm9wZXJ0eSBvbiBlbGVtZW50cyB3aXRoIGNlcnRhaW4gZm9udCBwcm9wZXJ0eSBjb21iaW5hdGlvbnMgY2FuIHJlc3VsdCBpbiBhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hseSB1bmFwcGVhbGluZyB1bHRyYS1ib2xkaW5nIGVmZmVjdC4gVGhlcmUncyBubyB3YXkgdG8gcmVtZWR5IHRoaXMgdGhyb3VnaG91dCBhIHR3ZWVuLCBidXQgZHJvcHBpbmcgdGhlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlIGFsdG9nZXRoZXIgKHdoZW4gb3BhY2l0eSBoaXRzIDEpIGF0IGxlYXN0cyBlbnN1cmVzIHRoYXQgdGhlIGdsaXRjaCBpcyBnb25lIHBvc3QtdHdlZW5pbmcuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJzZUZsb2F0KHByb3BlcnR5VmFsdWUpID49IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEFzIHBlciB0aGUgZmlsdGVyIHByb3BlcnR5J3Mgc3BlYywgY29udmVydCB0aGUgZGVjaW1hbCB2YWx1ZSB0byBhIHdob2xlIG51bWJlciBhbmQgd3JhcCB0aGUgdmFsdWUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiYWxwaGEob3BhY2l0eT1cIiArIHBhcnNlSW50KHBhcnNlRmxvYXQocHJvcGVydHlWYWx1ZSkgKiAxMDAsIDEwKSArIFwiKVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8qIFdpdGggYWxsIG90aGVyIGJyb3dzZXJzLCBub3JtYWxpemF0aW9uIGlzIG5vdCByZXF1aXJlZDsgcmV0dXJuIHRoZSBzYW1lIHZhbHVlcyB0aGF0IHdlcmUgcGFzc2VkIGluLiAqL1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm5hbWVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwib3BhY2l0eVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJleHRyYWN0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eVZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpbmplY3RcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICBCYXRjaGVkIFJlZ2lzdHJhdGlvbnNcbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAvKiBOb3RlOiBCYXRjaGVkIG5vcm1hbGl6YXRpb25zIGV4dGVuZCB0aGUgQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWQgb2JqZWN0LiAqL1xuICAgICAgICAgICAgcmVnaXN0ZXI6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICBUcmFuc2Zvcm1zXG4gICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICAvKiBUcmFuc2Zvcm1zIGFyZSB0aGUgc3VicHJvcGVydGllcyBjb250YWluZWQgYnkgdGhlIENTUyBcInRyYW5zZm9ybVwiIHByb3BlcnR5LiBUcmFuc2Zvcm1zIG11c3QgdW5kZXJnbyBub3JtYWxpemF0aW9uXG4gICAgICAgICAgICAgICAgICAgc28gdGhhdCB0aGV5IGNhbiBiZSByZWZlcmVuY2VkIGluIGEgcHJvcGVydGllcyBtYXAgYnkgdGhlaXIgaW5kaXZpZHVhbCBuYW1lcy4gKi9cbiAgICAgICAgICAgICAgICAvKiBOb3RlOiBXaGVuIHRyYW5zZm9ybXMgYXJlIFwic2V0XCIsIHRoZXkgYXJlIGFjdHVhbGx5IGFzc2lnbmVkIHRvIGEgcGVyLWVsZW1lbnQgdHJhbnNmb3JtQ2FjaGUuIFdoZW4gYWxsIHRyYW5zZm9ybVxuICAgICAgICAgICAgICAgICAgIHNldHRpbmcgaXMgY29tcGxldGUgY29tcGxldGUsIENTUy5mbHVzaFRyYW5zZm9ybUNhY2hlKCkgbXVzdCBiZSBtYW51YWxseSBjYWxsZWQgdG8gZmx1c2ggdGhlIHZhbHVlcyB0byB0aGUgRE9NLlxuICAgICAgICAgICAgICAgICAgIFRyYW5zZm9ybSBzZXR0aW5nIGlzIGJhdGNoZWQgaW4gdGhpcyB3YXkgdG8gaW1wcm92ZSBwZXJmb3JtYW5jZTogdGhlIHRyYW5zZm9ybSBzdHlsZSBvbmx5IG5lZWRzIHRvIGJlIHVwZGF0ZWRcbiAgICAgICAgICAgICAgICAgICBvbmNlIHdoZW4gbXVsdGlwbGUgdHJhbnNmb3JtIHN1YnByb3BlcnRpZXMgYXJlIGJlaW5nIGFuaW1hdGVkIHNpbXVsdGFuZW91c2x5LiAqL1xuICAgICAgICAgICAgICAgIC8qIE5vdGU6IElFOSBhbmQgQW5kcm9pZCBHaW5nZXJicmVhZCBoYXZlIHN1cHBvcnQgZm9yIDJEIC0tIGJ1dCBub3QgM0QgLS0gdHJhbnNmb3Jtcy4gU2luY2UgYW5pbWF0aW5nIHVuc3VwcG9ydGVkXG4gICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtIHByb3BlcnRpZXMgcmVzdWx0cyBpbiB0aGUgYnJvd3NlciBpZ25vcmluZyB0aGUgKmVudGlyZSogdHJhbnNmb3JtIHN0cmluZywgd2UgcHJldmVudCB0aGVzZSAzRCB2YWx1ZXNcbiAgICAgICAgICAgICAgICAgICBmcm9tIGJlaW5nIG5vcm1hbGl6ZWQgZm9yIHRoZXNlIGJyb3dzZXJzIHNvIHRoYXQgdHdlZW5pbmcgc2tpcHMgdGhlc2UgcHJvcGVydGllcyBhbHRvZ2V0aGVyXG4gICAgICAgICAgICAgICAgICAgKHNpbmNlIGl0IHdpbGwgaWdub3JlIHRoZW0gYXMgYmVpbmcgdW5zdXBwb3J0ZWQgYnkgdGhlIGJyb3dzZXIuKSAqL1xuICAgICAgICAgICAgICAgIGlmICghKElFIDw9IDkpICYmICFWZWxvY2l0eS5TdGF0ZS5pc0dpbmdlcmJyZWFkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFNpbmNlIHRoZSBzdGFuZGFsb25lIENTUyBcInBlcnNwZWN0aXZlXCIgcHJvcGVydHkgYW5kIHRoZSBDU1MgdHJhbnNmb3JtIFwicGVyc3BlY3RpdmVcIiBzdWJwcm9wZXJ0eVxuICAgICAgICAgICAgICAgICAgICBzaGFyZSB0aGUgc2FtZSBuYW1lLCB0aGUgbGF0dGVyIGlzIGdpdmVuIGEgdW5pcXVlIHRva2VuIHdpdGhpbiBWZWxvY2l0eTogXCJ0cmFuc2Zvcm1QZXJzcGVjdGl2ZVwiLiAqL1xuICAgICAgICAgICAgICAgICAgICBDU1MuTGlzdHMudHJhbnNmb3Jtc0Jhc2UgPSBDU1MuTGlzdHMudHJhbnNmb3Jtc0Jhc2UuY29uY2F0KENTUy5MaXN0cy50cmFuc2Zvcm1zM0QpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgQ1NTLkxpc3RzLnRyYW5zZm9ybXNCYXNlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIFdyYXAgdGhlIGR5bmFtaWNhbGx5IGdlbmVyYXRlZCBub3JtYWxpemF0aW9uIGZ1bmN0aW9uIGluIGEgbmV3IHNjb3BlIHNvIHRoYXQgdHJhbnNmb3JtTmFtZSdzIHZhbHVlIGlzXG4gICAgICAgICAgICAgICAgICAgIHBhaXJlZCB3aXRoIGl0cyByZXNwZWN0aXZlIGZ1bmN0aW9uLiAoT3RoZXJ3aXNlLCBhbGwgZnVuY3Rpb25zIHdvdWxkIHRha2UgdGhlIGZpbmFsIGZvciBsb29wJ3MgdHJhbnNmb3JtTmFtZS4pICovXG4gICAgICAgICAgICAgICAgICAgIChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0cmFuc2Zvcm1OYW1lID0gQ1NTLkxpc3RzLnRyYW5zZm9ybXNCYXNlW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFt0cmFuc2Zvcm1OYW1lXSA9IGZ1bmN0aW9uICh0eXBlLCBlbGVtZW50LCBwcm9wZXJ0eVZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRoZSBub3JtYWxpemVkIHByb3BlcnR5IG5hbWUgaXMgdGhlIHBhcmVudCBcInRyYW5zZm9ybVwiIHByb3BlcnR5IC0tIHRoZSBwcm9wZXJ0eSB0aGF0IGlzIGFjdHVhbGx5IHNldCBpbiBDU1MuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJuYW1lXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJ0cmFuc2Zvcm1cIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVHJhbnNmb3JtIHZhbHVlcyBhcmUgY2FjaGVkIG9udG8gYSBwZXItZWxlbWVudCB0cmFuc2Zvcm1DYWNoZSBvYmplY3QuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJleHRyYWN0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGlzIHRyYW5zZm9ybSBoYXMgeWV0IHRvIGJlIGFzc2lnbmVkIGEgdmFsdWUsIHJldHVybiBpdHMgbnVsbCB2YWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpID09PSB1bmRlZmluZWQgfHwgRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU2NhbGUgQ1NTLkxpc3RzLnRyYW5zZm9ybXNCYXNlIGRlZmF1bHQgdG8gMSB3aGVyZWFzIGFsbCBvdGhlciB0cmFuc2Zvcm0gcHJvcGVydGllcyBkZWZhdWx0IHRvIDAuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC9ec2NhbGUvaS50ZXN0KHRyYW5zZm9ybU5hbWUpID8gMSA6IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBXaGVuIHRyYW5zZm9ybSB2YWx1ZXMgYXJlIHNldCwgdGhleSBhcmUgd3JhcHBlZCBpbiBwYXJlbnRoZXNlcyBhcyBwZXIgdGhlIENTUyBzcGVjLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVGh1cywgd2hlbiBleHRyYWN0aW5nIHRoZWlyIHZhbHVlcyAoZm9yIHR3ZWVuIGNhbGN1bGF0aW9ucyksIHdlIHN0cmlwIG9mZiB0aGUgcGFyZW50aGVzZXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdLnJlcGxhY2UoL1soKV0vZywgXCJcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpbmplY3RcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbnZhbGlkID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIGFuIGluZGl2aWR1YWwgdHJhbnNmb3JtIHByb3BlcnR5IGNvbnRhaW5zIGFuIHVuc3VwcG9ydGVkIHVuaXQgdHlwZSwgdGhlIGJyb3dzZXIgaWdub3JlcyB0aGUgKmVudGlyZSogdHJhbnNmb3JtIHByb3BlcnR5LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVGh1cywgcHJvdGVjdCB1c2VycyBmcm9tIHRoZW1zZWx2ZXMgYnkgc2tpcHBpbmcgc2V0dGluZyBmb3IgdHJhbnNmb3JtIHZhbHVlcyBzdXBwbGllZCB3aXRoIGludmFsaWQgdW5pdCB0eXBlcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFN3aXRjaCBvbiB0aGUgYmFzZSB0cmFuc2Zvcm0gdHlwZTsgaWdub3JlIHRoZSBheGlzIGJ5IHJlbW92aW5nIHRoZSBsYXN0IGxldHRlciBmcm9tIHRoZSB0cmFuc2Zvcm0ncyBuYW1lLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0cmFuc2Zvcm1OYW1lLnN1YnN0cigwLCB0cmFuc2Zvcm1OYW1lLmxlbmd0aCAtIDEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogV2hpdGVsaXN0IHVuaXQgdHlwZXMgZm9yIGVhY2ggdHJhbnNmb3JtLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ0cmFuc2xhdGVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW52YWxpZCA9ICEvKCV8cHh8ZW18cmVtfHZ3fHZofFxcZCkkL2kudGVzdChwcm9wZXJ0eVZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU2luY2UgYW4gYXhpcy1mcmVlIFwic2NhbGVcIiBwcm9wZXJ0eSBpcyBzdXBwb3J0ZWQgYXMgd2VsbCwgYSBsaXR0bGUgaGFjayBpcyB1c2VkIGhlcmUgdG8gZGV0ZWN0IGl0IGJ5IGNob3BwaW5nIG9mZiBpdHMgbGFzdCBsZXR0ZXIuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInNjYWxcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwic2NhbGVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ2hyb21lIG9uIEFuZHJvaWQgaGFzIGEgYnVnIGluIHdoaWNoIHNjYWxlZCBlbGVtZW50cyBibHVyIGlmIHRoZWlyIGluaXRpYWwgc2NhbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgaXMgYmVsb3cgMSAod2hpY2ggY2FuIGhhcHBlbiB3aXRoIGZvcmNlZmVlZGluZykuIFRodXMsIHdlIGRldGVjdCBhIHlldC11bnNldCBzY2FsZSBwcm9wZXJ0eVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmQgZW5zdXJlIHRoYXQgaXRzIGZpcnN0IHZhbHVlIGlzIGFsd2F5cyAxLiBNb3JlIGluZm86IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA0MTc4OTAvY3NzMy1hbmltYXRpb25zLXdpdGgtdHJhbnNmb3JtLWNhdXNlcy1ibHVycmVkLWVsZW1lbnRzLW9uLXdlYmtpdC8xMDQxNzk2MiMxMDQxNzk2MiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoVmVsb2NpdHkuU3RhdGUuaXNBbmRyb2lkICYmIERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGVbdHJhbnNmb3JtTmFtZV0gPT09IHVuZGVmaW5lZCAmJiBwcm9wZXJ0eVZhbHVlIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnZhbGlkID0gIS8oXFxkKSQvaS50ZXN0KHByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwic2tld1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnZhbGlkID0gIS8oZGVnfFxcZCkkL2kudGVzdChwcm9wZXJ0eVZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInJvdGF0ZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnZhbGlkID0gIS8oZGVnfFxcZCkkL2kudGVzdChwcm9wZXJ0eVZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaW52YWxpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEFzIHBlciB0aGUgQ1NTIHNwZWMsIHdyYXAgdGhlIHZhbHVlIGluIHBhcmVudGhlc2VzLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGVbdHJhbnNmb3JtTmFtZV0gPSBcIihcIiArIHByb3BlcnR5VmFsdWUgKyBcIilcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQWx0aG91Z2ggdGhlIHZhbHVlIGlzIHNldCBvbiB0aGUgdHJhbnNmb3JtQ2FjaGUgb2JqZWN0LCByZXR1cm4gdGhlIG5ld2x5LXVwZGF0ZWQgdmFsdWUgZm9yIHRoZSBjYWxsaW5nIGNvZGUgdG8gcHJvY2VzcyBhcyBub3JtYWwuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9KSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgIENvbG9yc1xuICAgICAgICAgICAgICAgICoqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICAvKiBTaW5jZSBWZWxvY2l0eSBvbmx5IGFuaW1hdGVzIGEgc2luZ2xlIG51bWVyaWMgdmFsdWUgcGVyIHByb3BlcnR5LCBjb2xvciBhbmltYXRpb24gaXMgYWNoaWV2ZWQgYnkgaG9va2luZyB0aGUgaW5kaXZpZHVhbCBSR0JBIGNvbXBvbmVudHMgb2YgQ1NTIGNvbG9yIHByb3BlcnRpZXMuXG4gICAgICAgICAgICAgICAgICAgQWNjb3JkaW5nbHksIGNvbG9yIHZhbHVlcyBtdXN0IGJlIG5vcm1hbGl6ZWQgKGUuZy4gXCIjZmYwMDAwXCIsIFwicmVkXCIsIGFuZCBcInJnYigyNTUsIDAsIDApXCIgPT0+IFwiMjU1IDAgMCAxXCIpIHNvIHRoYXQgdGhlaXIgY29tcG9uZW50cyBjYW4gYmUgaW5qZWN0ZWQvZXh0cmFjdGVkIGJ5IENTUy5Ib29rcyBsb2dpYy4gKi9cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IENTUy5MaXN0cy5jb2xvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgLyogV3JhcCB0aGUgZHluYW1pY2FsbHkgZ2VuZXJhdGVkIG5vcm1hbGl6YXRpb24gZnVuY3Rpb24gaW4gYSBuZXcgc2NvcGUgc28gdGhhdCBjb2xvck5hbWUncyB2YWx1ZSBpcyBwYWlyZWQgd2l0aCBpdHMgcmVzcGVjdGl2ZSBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICAgKE90aGVyd2lzZSwgYWxsIGZ1bmN0aW9ucyB3b3VsZCB0YWtlIHRoZSBmaW5hbCBmb3IgbG9vcCdzIGNvbG9yTmFtZS4pICovXG4gICAgICAgICAgICAgICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29sb3JOYW1lID0gQ1NTLkxpc3RzLmNvbG9yc1tpXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogSW4gSUU8PTgsIHdoaWNoIHN1cHBvcnQgcmdiIGJ1dCBub3QgcmdiYSwgY29sb3IgcHJvcGVydGllcyBhcmUgcmV2ZXJ0ZWQgdG8gcmdiIGJ5IHN0cmlwcGluZyBvZmYgdGhlIGFscGhhIGNvbXBvbmVudC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW2NvbG9yTmFtZV0gPSBmdW5jdGlvbih0eXBlLCBlbGVtZW50LCBwcm9wZXJ0eVZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJuYW1lXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sb3JOYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDb252ZXJ0IGFsbCBjb2xvciB2YWx1ZXMgaW50byB0aGUgcmdiIGZvcm1hdC4gKE9sZCBJRSBjYW4gcmV0dXJuIGhleCB2YWx1ZXMgYW5kIGNvbG9yIG5hbWVzIGluc3RlYWQgb2YgcmdiL3JnYmEuKSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZXh0cmFjdFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4dHJhY3RlZDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGNvbG9yIGlzIGFscmVhZHkgaW4gaXRzIGhvb2thYmxlIGZvcm0gKGUuZy4gXCIyNTUgMjU1IDI1NSAxXCIpIGR1ZSB0byBoYXZpbmcgYmVlbiBwcmV2aW91c2x5IGV4dHJhY3RlZCwgc2tpcCBleHRyYWN0aW9uLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENTUy5SZWdFeC53cmFwcGVkVmFsdWVBbHJlYWR5RXh0cmFjdGVkLnRlc3QocHJvcGVydHlWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYWN0ZWQgPSBwcm9wZXJ0eVZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29udmVydGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvck5hbWVzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmxhY2s6IFwicmdiKDAsIDAsIDApXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBibHVlOiBcInJnYigwLCAwLCAyNTUpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncmF5OiBcInJnYigxMjgsIDEyOCwgMTI4KVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JlZW46IFwicmdiKDAsIDEyOCwgMClcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZDogXCJyZ2IoMjU1LCAwLCAwKVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpdGU6IFwicmdiKDI1NSwgMjU1LCAyNTUpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENvbnZlcnQgY29sb3IgbmFtZXMgdG8gcmdiLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgvXltBLXpdKyQvaS50ZXN0KHByb3BlcnR5VmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2xvck5hbWVzW3Byb3BlcnR5VmFsdWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnRlZCA9IGNvbG9yTmFtZXNbcHJvcGVydHlWYWx1ZV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIGFuIHVubWF0Y2hlZCBjb2xvciBuYW1lIGlzIHByb3ZpZGVkLCBkZWZhdWx0IHRvIGJsYWNrLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udmVydGVkID0gY29sb3JOYW1lcy5ibGFjaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENvbnZlcnQgaGV4IHZhbHVlcyB0byByZ2IuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChDU1MuUmVnRXguaXNIZXgudGVzdChwcm9wZXJ0eVZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb252ZXJ0ZWQgPSBcInJnYihcIiArIENTUy5WYWx1ZXMuaGV4VG9SZ2IocHJvcGVydHlWYWx1ZSkuam9pbihcIiBcIikgKyBcIilcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgcHJvdmlkZWQgY29sb3IgZG9lc24ndCBtYXRjaCBhbnkgb2YgdGhlIGFjY2VwdGVkIGNvbG9yIGZvcm1hdHMsIGRlZmF1bHQgdG8gYmxhY2suICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghKC9ecmdiYT9cXCgvaS50ZXN0KHByb3BlcnR5VmFsdWUpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb252ZXJ0ZWQgPSBjb2xvck5hbWVzLmJsYWNrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFJlbW92ZSB0aGUgc3Vycm91bmRpbmcgXCJyZ2IvcmdiYSgpXCIgc3RyaW5nIHRoZW4gcmVwbGFjZSBjb21tYXMgd2l0aCBzcGFjZXMgYW5kIHN0cmlwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVwZWF0ZWQgc3BhY2VzIChpbiBjYXNlIHRoZSB2YWx1ZSBpbmNsdWRlZCBzcGFjZXMgdG8gYmVnaW4gd2l0aCkuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFjdGVkID0gKGNvbnZlcnRlZCB8fCBwcm9wZXJ0eVZhbHVlKS50b1N0cmluZygpLm1hdGNoKENTUy5SZWdFeC52YWx1ZVVud3JhcClbMV0ucmVwbGFjZSgvLChcXHMrKT8vZywgXCIgXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTbyBsb25nIGFzIHRoaXMgaXNuJ3QgPD1JRTgsIGFkZCBhIGZvdXJ0aCAoYWxwaGEpIGNvbXBvbmVudCBpZiBpdCdzIG1pc3NpbmcgYW5kIGRlZmF1bHQgaXQgdG8gMSAodmlzaWJsZSkuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIShJRSA8PSA4KSAmJiBleHRyYWN0ZWQuc3BsaXQoXCIgXCIpLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhY3RlZCArPSBcIiAxXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBleHRyYWN0ZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpbmplY3RcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoaXMgaXMgSUU8PTggYW5kIGFuIGFscGhhIGNvbXBvbmVudCBleGlzdHMsIHN0cmlwIGl0IG9mZi4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChJRSA8PSA4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5VmFsdWUuc3BsaXQoXCIgXCIpLmxlbmd0aCA9PT0gNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gcHJvcGVydHlWYWx1ZS5zcGxpdCgvXFxzKy8pLnNsaWNlKDAsIDMpLmpvaW4oXCIgXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE90aGVyd2lzZSwgYWRkIGEgZm91cnRoIChhbHBoYSkgY29tcG9uZW50IGlmIGl0J3MgbWlzc2luZyBhbmQgZGVmYXVsdCBpdCB0byAxICh2aXNpYmxlKS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHlWYWx1ZS5zcGxpdChcIiBcIikubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSArPSBcIiAxXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFJlLWluc2VydCB0aGUgYnJvd3Nlci1hcHByb3ByaWF0ZSB3cmFwcGVyKFwicmdiL3JnYmEoKVwiKSwgaW5zZXJ0IGNvbW1hcywgYW5kIHN0cmlwIG9mZiBkZWNpbWFsIHVuaXRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbiBhbGwgdmFsdWVzIGJ1dCB0aGUgZm91cnRoIChSLCBHLCBhbmQgQiBvbmx5IGFjY2VwdCB3aG9sZSBudW1iZXJzKS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoSUUgPD0gOCA/IFwicmdiXCIgOiBcInJnYmFcIikgKyBcIihcIiArIHByb3BlcnR5VmFsdWUucmVwbGFjZSgvXFxzKy9nLCBcIixcIikucmVwbGFjZSgvXFwuKFxcZCkrKD89LCkvZywgXCJcIikgKyBcIilcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9KSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgIENTUyBQcm9wZXJ0eSBOYW1lc1xuICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgTmFtZXM6IHtcbiAgICAgICAgICAgIC8qIENhbWVsY2FzZSBhIHByb3BlcnR5IG5hbWUgaW50byBpdHMgSmF2YVNjcmlwdCBub3RhdGlvbiAoZS5nLiBcImJhY2tncm91bmQtY29sb3JcIiA9PT4gXCJiYWNrZ3JvdW5kQ29sb3JcIikuXG4gICAgICAgICAgICAgICBDYW1lbGNhc2luZyBpcyB1c2VkIHRvIG5vcm1hbGl6ZSBwcm9wZXJ0eSBuYW1lcyBiZXR3ZWVuIGFuZCBhY3Jvc3MgY2FsbHMuICovXG4gICAgICAgICAgICBjYW1lbENhc2U6IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eS5yZXBsYWNlKC8tKFxcdykvZywgZnVuY3Rpb24gKG1hdGNoLCBzdWJNYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3ViTWF0Y2gudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qIEZvciBTVkcgZWxlbWVudHMsIHNvbWUgcHJvcGVydGllcyAobmFtZWx5LCBkaW1lbnNpb25hbCBvbmVzKSBhcmUgR0VUL1NFVCB2aWEgdGhlIGVsZW1lbnQncyBIVE1MIGF0dHJpYnV0ZXMgKGluc3RlYWQgb2YgdmlhIENTUyBzdHlsZXMpLiAqL1xuICAgICAgICAgICAgU1ZHQXR0cmlidXRlOiBmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICB2YXIgU1ZHQXR0cmlidXRlcyA9IFwid2lkdGh8aGVpZ2h0fHh8eXxjeHxjeXxyfHJ4fHJ5fHgxfHgyfHkxfHkyXCI7XG5cbiAgICAgICAgICAgICAgICAvKiBDZXJ0YWluIGJyb3dzZXJzIHJlcXVpcmUgYW4gU1ZHIHRyYW5zZm9ybSB0byBiZSBhcHBsaWVkIGFzIGFuIGF0dHJpYnV0ZS4gKE90aGVyd2lzZSwgYXBwbGljYXRpb24gdmlhIENTUyBpcyBwcmVmZXJhYmxlIGR1ZSB0byAzRCBzdXBwb3J0LikgKi9cbiAgICAgICAgICAgICAgICBpZiAoSUUgfHwgKFZlbG9jaXR5LlN0YXRlLmlzQW5kcm9pZCAmJiAhVmVsb2NpdHkuU3RhdGUuaXNDaHJvbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIFNWR0F0dHJpYnV0ZXMgKz0gXCJ8dHJhbnNmb3JtXCI7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAoXCJeKFwiICsgU1ZHQXR0cmlidXRlcyArIFwiKSRcIiwgXCJpXCIpLnRlc3QocHJvcGVydHkpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyogRGV0ZXJtaW5lIHdoZXRoZXIgYSBwcm9wZXJ0eSBzaG91bGQgYmUgc2V0IHdpdGggYSB2ZW5kb3IgcHJlZml4LiAqL1xuICAgICAgICAgICAgLyogSWYgYSBwcmVmaXhlZCB2ZXJzaW9uIG9mIHRoZSBwcm9wZXJ0eSBleGlzdHMsIHJldHVybiBpdC4gT3RoZXJ3aXNlLCByZXR1cm4gdGhlIG9yaWdpbmFsIHByb3BlcnR5IG5hbWUuXG4gICAgICAgICAgICAgICBJZiB0aGUgcHJvcGVydHkgaXMgbm90IGF0IGFsbCBzdXBwb3J0ZWQgYnkgdGhlIGJyb3dzZXIsIHJldHVybiBhIGZhbHNlIGZsYWcuICovXG4gICAgICAgICAgICBwcmVmaXhDaGVjazogZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgLyogSWYgdGhpcyBwcm9wZXJ0eSBoYXMgYWxyZWFkeSBiZWVuIGNoZWNrZWQsIHJldHVybiB0aGUgY2FjaGVkIHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgIGlmIChWZWxvY2l0eS5TdGF0ZS5wcmVmaXhNYXRjaGVzW3Byb3BlcnR5XSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWyBWZWxvY2l0eS5TdGF0ZS5wcmVmaXhNYXRjaGVzW3Byb3BlcnR5XSwgdHJ1ZSBdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2ZW5kb3JzID0gWyBcIlwiLCBcIldlYmtpdFwiLCBcIk1velwiLCBcIm1zXCIsIFwiT1wiIF07XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIHZlbmRvcnNMZW5ndGggPSB2ZW5kb3JzLmxlbmd0aDsgaSA8IHZlbmRvcnNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByb3BlcnR5UHJlZml4ZWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlQcmVmaXhlZCA9IHByb3BlcnR5O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDYXBpdGFsaXplIHRoZSBmaXJzdCBsZXR0ZXIgb2YgdGhlIHByb3BlcnR5IHRvIGNvbmZvcm0gdG8gSmF2YVNjcmlwdCB2ZW5kb3IgcHJlZml4IG5vdGF0aW9uIChlLmcuIHdlYmtpdEZpbHRlcikuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlQcmVmaXhlZCA9IHZlbmRvcnNbaV0gKyBwcm9wZXJ0eS5yZXBsYWNlKC9eXFx3LywgZnVuY3Rpb24obWF0Y2gpIHsgcmV0dXJuIG1hdGNoLnRvVXBwZXJDYXNlKCk7IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBDaGVjayBpZiB0aGUgYnJvd3NlciBzdXBwb3J0cyB0aGlzIHByb3BlcnR5IGFzIHByZWZpeGVkLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFR5cGUuaXNTdHJpbmcoVmVsb2NpdHkuU3RhdGUucHJlZml4RWxlbWVudC5zdHlsZVtwcm9wZXJ0eVByZWZpeGVkXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDYWNoZSB0aGUgbWF0Y2guICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuU3RhdGUucHJlZml4TWF0Y2hlc1twcm9wZXJ0eV0gPSBwcm9wZXJ0eVByZWZpeGVkO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsgcHJvcGVydHlQcmVmaXhlZCwgdHJ1ZSBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGJyb3dzZXIgZG9lc24ndCBzdXBwb3J0IHRoaXMgcHJvcGVydHkgaW4gYW55IGZvcm0sIGluY2x1ZGUgYSBmYWxzZSBmbGFnIHNvIHRoYXQgdGhlIGNhbGxlciBjYW4gZGVjaWRlIGhvdyB0byBwcm9jZWVkLiAqL1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWyBwcm9wZXJ0eSwgZmFsc2UgXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICBDU1MgUHJvcGVydHkgVmFsdWVzXG4gICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICBWYWx1ZXM6IHtcbiAgICAgICAgICAgIC8qIEhleCB0byBSR0IgY29udmVyc2lvbi4gQ29weXJpZ2h0IFRpbSBEb3duOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzU2MjM4MzgvcmdiLXRvLWhleC1hbmQtaGV4LXRvLXJnYiAqL1xuICAgICAgICAgICAgaGV4VG9SZ2I6IGZ1bmN0aW9uIChoZXgpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2hvcnRmb3JtUmVnZXggPSAvXiM/KFthLWZcXGRdKShbYS1mXFxkXSkoW2EtZlxcZF0pJC9pLFxuICAgICAgICAgICAgICAgICAgICBsb25nZm9ybVJlZ2V4ID0gL14jPyhbYS1mXFxkXXsyfSkoW2EtZlxcZF17Mn0pKFthLWZcXGRdezJ9KSQvaSxcbiAgICAgICAgICAgICAgICAgICAgcmdiUGFydHM7XG5cbiAgICAgICAgICAgICAgICBoZXggPSBoZXgucmVwbGFjZShzaG9ydGZvcm1SZWdleCwgZnVuY3Rpb24gKG0sIHIsIGcsIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHIgKyByICsgZyArIGcgKyBiICsgYjtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHJnYlBhcnRzID0gbG9uZ2Zvcm1SZWdleC5leGVjKGhleCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmdiUGFydHMgPyBbIHBhcnNlSW50KHJnYlBhcnRzWzFdLCAxNiksIHBhcnNlSW50KHJnYlBhcnRzWzJdLCAxNiksIHBhcnNlSW50KHJnYlBhcnRzWzNdLCAxNikgXSA6IFsgMCwgMCwgMCBdO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgaXNDU1NOdWxsVmFsdWU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIC8qIFRoZSBicm93c2VyIGRlZmF1bHRzIENTUyB2YWx1ZXMgdGhhdCBoYXZlIG5vdCBiZWVuIHNldCB0byBlaXRoZXIgMCBvciBvbmUgb2Ygc2V2ZXJhbCBwb3NzaWJsZSBudWxsLXZhbHVlIHN0cmluZ3MuXG4gICAgICAgICAgICAgICAgICAgVGh1cywgd2UgY2hlY2sgZm9yIGJvdGggZmFsc2luZXNzIGFuZCB0aGVzZSBzcGVjaWFsIHN0cmluZ3MuICovXG4gICAgICAgICAgICAgICAgLyogTnVsbC12YWx1ZSBjaGVja2luZyBpcyBwZXJmb3JtZWQgdG8gZGVmYXVsdCB0aGUgc3BlY2lhbCBzdHJpbmdzIHRvIDAgKGZvciB0aGUgc2FrZSBvZiB0d2VlbmluZykgb3IgdGhlaXIgaG9va1xuICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlcyBhcyBkZWZpbmVkIGFzIENTUy5Ib29rcyAoZm9yIHRoZSBzYWtlIG9mIGhvb2sgaW5qZWN0aW9uL2V4dHJhY3Rpb24pLiAqL1xuICAgICAgICAgICAgICAgIC8qIE5vdGU6IENocm9tZSByZXR1cm5zIFwicmdiYSgwLCAwLCAwLCAwKVwiIGZvciBhbiB1bmRlZmluZWQgY29sb3Igd2hlcmVhcyBJRSByZXR1cm5zIFwidHJhbnNwYXJlbnRcIi4gKi9cbiAgICAgICAgICAgICAgICByZXR1cm4gKHZhbHVlID09IDAgfHwgL14obm9uZXxhdXRvfHRyYW5zcGFyZW50fChyZ2JhXFwoMCwgPzAsID8wLCA/MFxcKSkpJC9pLnRlc3QodmFsdWUpKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qIFJldHJpZXZlIGEgcHJvcGVydHkncyBkZWZhdWx0IHVuaXQgdHlwZS4gVXNlZCBmb3IgYXNzaWduaW5nIGEgdW5pdCB0eXBlIHdoZW4gb25lIGlzIG5vdCBzdXBwbGllZCBieSB0aGUgdXNlci4gKi9cbiAgICAgICAgICAgIGdldFVuaXRUeXBlOiBmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICBpZiAoL14ocm90YXRlfHNrZXcpL2kudGVzdChwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiZGVnXCI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvKF4oc2NhbGV8c2NhbGVYfHNjYWxlWXxzY2FsZVp8YWxwaGF8ZmxleEdyb3d8ZmxleEhlaWdodHx6SW5kZXh8Zm9udFdlaWdodCkkKXwoKG9wYWNpdHl8cmVkfGdyZWVufGJsdWV8YWxwaGEpJCkvaS50ZXN0KHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgICAgICAvKiBUaGUgYWJvdmUgcHJvcGVydGllcyBhcmUgdW5pdGxlc3MuICovXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIERlZmF1bHQgdG8gcHggZm9yIGFsbCBvdGhlciBwcm9wZXJ0aWVzLiAqL1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJweFwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qIEhUTUwgZWxlbWVudHMgZGVmYXVsdCB0byBhbiBhc3NvY2lhdGVkIGRpc3BsYXkgdHlwZSB3aGVuIHRoZXkncmUgbm90IHNldCB0byBkaXNwbGF5Om5vbmUuICovXG4gICAgICAgICAgICAvKiBOb3RlOiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgZm9yIGNvcnJlY3RseSBzZXR0aW5nIHRoZSBub24tXCJub25lXCIgZGlzcGxheSB2YWx1ZSBpbiBjZXJ0YWluIFZlbG9jaXR5IHJlZGlyZWN0cywgc3VjaCBhcyBmYWRlSW4vT3V0LiAqL1xuICAgICAgICAgICAgZ2V0RGlzcGxheVR5cGU6IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIHRhZ05hbWUgPSBlbGVtZW50ICYmIGVsZW1lbnQudGFnTmFtZS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoL14oYnxiaWd8aXxzbWFsbHx0dHxhYmJyfGFjcm9ueW18Y2l0ZXxjb2RlfGRmbnxlbXxrYmR8c3Ryb25nfHNhbXB8dmFyfGF8YmRvfGJyfGltZ3xtYXB8b2JqZWN0fHF8c2NyaXB0fHNwYW58c3VifHN1cHxidXR0b258aW5wdXR8bGFiZWx8c2VsZWN0fHRleHRhcmVhKSQvaS50ZXN0KHRhZ05hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcImlubGluZVwiO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoL14obGkpJC9pLnRlc3QodGFnTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwibGlzdC1pdGVtXCI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvXih0cikkL2kudGVzdCh0YWdOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJ0YWJsZS1yb3dcIjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9eKHRhYmxlKSQvaS50ZXN0KHRhZ05hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcInRhYmxlXCI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvXih0Ym9keSkkL2kudGVzdCh0YWdOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJ0YWJsZS1yb3ctZ3JvdXBcIjtcbiAgICAgICAgICAgICAgICAvKiBEZWZhdWx0IHRvIFwiYmxvY2tcIiB3aGVuIG5vIG1hdGNoIGlzIGZvdW5kLiAqL1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcImJsb2NrXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyogVGhlIGNsYXNzIGFkZC9yZW1vdmUgZnVuY3Rpb25zIGFyZSB1c2VkIHRvIHRlbXBvcmFyaWx5IGFwcGx5IGEgXCJ2ZWxvY2l0eS1hbmltYXRpbmdcIiBjbGFzcyB0byBlbGVtZW50cyB3aGlsZSB0aGV5J3JlIGFuaW1hdGluZy4gKi9cbiAgICAgICAgICAgIGFkZENsYXNzOiBmdW5jdGlvbiAoZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQuY2xhc3NMaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NOYW1lICs9IChlbGVtZW50LmNsYXNzTmFtZS5sZW5ndGggPyBcIiBcIiA6IFwiXCIpICsgY2xhc3NOYW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHJlbW92ZUNsYXNzOiBmdW5jdGlvbiAoZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQuY2xhc3NMaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gZWxlbWVudC5jbGFzc05hbWUudG9TdHJpbmcoKS5yZXBsYWNlKG5ldyBSZWdFeHAoXCIoXnxcXFxccylcIiArIGNsYXNzTmFtZS5zcGxpdChcIiBcIikuam9pbihcInxcIikgKyBcIihcXFxcc3wkKVwiLCBcImdpXCIpLCBcIiBcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgIFN0eWxlIEdldHRpbmcgJiBTZXR0aW5nXG4gICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgLyogVGhlIHNpbmd1bGFyIGdldFByb3BlcnR5VmFsdWUsIHdoaWNoIHJvdXRlcyB0aGUgbG9naWMgZm9yIGFsbCBub3JtYWxpemF0aW9ucywgaG9va3MsIGFuZCBzdGFuZGFyZCBDU1MgcHJvcGVydGllcy4gKi9cbiAgICAgICAgZ2V0UHJvcGVydHlWYWx1ZTogZnVuY3Rpb24gKGVsZW1lbnQsIHByb3BlcnR5LCByb290UHJvcGVydHlWYWx1ZSwgZm9yY2VTdHlsZUxvb2t1cCkge1xuICAgICAgICAgICAgLyogR2V0IGFuIGVsZW1lbnQncyBjb21wdXRlZCBwcm9wZXJ0eSB2YWx1ZS4gKi9cbiAgICAgICAgICAgIC8qIE5vdGU6IFJldHJpZXZpbmcgdGhlIHZhbHVlIG9mIGEgQ1NTIHByb3BlcnR5IGNhbm5vdCBzaW1wbHkgYmUgcGVyZm9ybWVkIGJ5IGNoZWNraW5nIGFuIGVsZW1lbnQnc1xuICAgICAgICAgICAgICAgc3R5bGUgYXR0cmlidXRlICh3aGljaCBvbmx5IHJlZmxlY3RzIHVzZXItZGVmaW5lZCB2YWx1ZXMpLiBJbnN0ZWFkLCB0aGUgYnJvd3NlciBtdXN0IGJlIHF1ZXJpZWQgZm9yIGEgcHJvcGVydHknc1xuICAgICAgICAgICAgICAgKmNvbXB1dGVkKiB2YWx1ZS4gWW91IGNhbiByZWFkIG1vcmUgYWJvdXQgZ2V0Q29tcHV0ZWRTdHlsZSBoZXJlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9kb2NzL1dlYi9BUEkvd2luZG93LmdldENvbXB1dGVkU3R5bGUgKi9cbiAgICAgICAgICAgIGZ1bmN0aW9uIGNvbXB1dGVQcm9wZXJ0eVZhbHVlIChlbGVtZW50LCBwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIC8qIFdoZW4gYm94LXNpemluZyBpc24ndCBzZXQgdG8gYm9yZGVyLWJveCwgaGVpZ2h0IGFuZCB3aWR0aCBzdHlsZSB2YWx1ZXMgYXJlIGluY29ycmVjdGx5IGNvbXB1dGVkIHdoZW4gYW5cbiAgICAgICAgICAgICAgICAgICBlbGVtZW50J3Mgc2Nyb2xsYmFycyBhcmUgdmlzaWJsZSAod2hpY2ggZXhwYW5kcyB0aGUgZWxlbWVudCdzIGRpbWVuc2lvbnMpLiBUaHVzLCB3ZSBkZWZlciB0byB0aGUgbW9yZSBhY2N1cmF0ZVxuICAgICAgICAgICAgICAgICAgIG9mZnNldEhlaWdodC9XaWR0aCBwcm9wZXJ0eSwgd2hpY2ggaW5jbHVkZXMgdGhlIHRvdGFsIGRpbWVuc2lvbnMgZm9yIGludGVyaW9yLCBib3JkZXIsIHBhZGRpbmcsIGFuZCBzY3JvbGxiYXIuXG4gICAgICAgICAgICAgICAgICAgV2Ugc3VidHJhY3QgYm9yZGVyIGFuZCBwYWRkaW5nIHRvIGdldCB0aGUgc3VtIG9mIGludGVyaW9yICsgc2Nyb2xsYmFyLiAqL1xuICAgICAgICAgICAgICAgIHZhciBjb21wdXRlZFZhbHVlID0gMDtcblxuICAgICAgICAgICAgICAgIC8qIElFPD04IGRvZXNuJ3Qgc3VwcG9ydCB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSwgdGh1cyB3ZSBkZWZlciB0byBqUXVlcnksIHdoaWNoIGhhcyBhbiBleHRlbnNpdmUgYXJyYXlcbiAgICAgICAgICAgICAgICAgICBvZiBoYWNrcyB0byBhY2N1cmF0ZWx5IHJldHJpZXZlIElFOCBwcm9wZXJ0eSB2YWx1ZXMuIFJlLWltcGxlbWVudGluZyB0aGF0IGxvZ2ljIGhlcmUgaXMgbm90IHdvcnRoIGJsb2F0aW5nIHRoZVxuICAgICAgICAgICAgICAgICAgIGNvZGViYXNlIGZvciBhIGR5aW5nIGJyb3dzZXIuIFRoZSBwZXJmb3JtYW5jZSByZXBlcmN1c3Npb25zIG9mIHVzaW5nIGpRdWVyeSBoZXJlIGFyZSBtaW5pbWFsIHNpbmNlXG4gICAgICAgICAgICAgICAgICAgVmVsb2NpdHkgaXMgb3B0aW1pemVkIHRvIHJhcmVseSAoYW5kIHNvbWV0aW1lcyBuZXZlcikgcXVlcnkgdGhlIERPTS4gRnVydGhlciwgdGhlICQuY3NzKCkgY29kZXBhdGggaXNuJ3QgdGhhdCBzbG93LiAqL1xuICAgICAgICAgICAgICAgIGlmIChJRSA8PSA4KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkVmFsdWUgPSAkLmNzcyhlbGVtZW50LCBwcm9wZXJ0eSk7IC8qIEdFVCAqL1xuICAgICAgICAgICAgICAgIC8qIEFsbCBvdGhlciBicm93c2VycyBzdXBwb3J0IGdldENvbXB1dGVkU3R5bGUuIFRoZSByZXR1cm5lZCBsaXZlIG9iamVjdCByZWZlcmVuY2UgaXMgY2FjaGVkIG9udG8gaXRzXG4gICAgICAgICAgICAgICAgICAgYXNzb2NpYXRlZCBlbGVtZW50IHNvIHRoYXQgaXQgZG9lcyBub3QgbmVlZCB0byBiZSByZWZldGNoZWQgdXBvbiBldmVyeSBHRVQuICovXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLyogQnJvd3NlcnMgZG8gbm90IHJldHVybiBoZWlnaHQgYW5kIHdpZHRoIHZhbHVlcyBmb3IgZWxlbWVudHMgdGhhdCBhcmUgc2V0IHRvIGRpc3BsYXk6XCJub25lXCIuIFRodXMsIHdlIHRlbXBvcmFyaWx5XG4gICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZSBkaXNwbGF5IHRvIHRoZSBlbGVtZW50IHR5cGUncyBkZWZhdWx0IHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICB2YXIgdG9nZ2xlRGlzcGxheSA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICgvXih3aWR0aHxoZWlnaHQpJC8udGVzdChwcm9wZXJ0eSkgJiYgQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJkaXNwbGF5XCIpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b2dnbGVEaXNwbGF5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiZGlzcGxheVwiLCBDU1MuVmFsdWVzLmdldERpc3BsYXlUeXBlKGVsZW1lbnQpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHJldmVydERpc3BsYXkgKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRvZ2dsZURpc3BsYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmb3JjZVN0eWxlTG9va3VwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHkgPT09IFwiaGVpZ2h0XCIgJiYgQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJib3hTaXppbmdcIikudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpICE9PSBcImJvcmRlci1ib3hcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb250ZW50Qm94SGVpZ2h0ID0gZWxlbWVudC5vZmZzZXRIZWlnaHQgLSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImJvcmRlclRvcFdpZHRoXCIpKSB8fCAwKSAtIChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiYm9yZGVyQm90dG9tV2lkdGhcIikpIHx8IDApIC0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJwYWRkaW5nVG9wXCIpKSB8fCAwKSAtIChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwicGFkZGluZ0JvdHRvbVwiKSkgfHwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV2ZXJ0RGlzcGxheSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnRCb3hIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSBcIndpZHRoXCIgJiYgQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJib3hTaXppbmdcIikudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpICE9PSBcImJvcmRlci1ib3hcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb250ZW50Qm94V2lkdGggPSBlbGVtZW50Lm9mZnNldFdpZHRoIC0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJib3JkZXJMZWZ0V2lkdGhcIikpIHx8IDApIC0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJib3JkZXJSaWdodFdpZHRoXCIpKSB8fCAwKSAtIChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwicGFkZGluZ0xlZnRcIikpIHx8IDApIC0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJwYWRkaW5nUmlnaHRcIikpIHx8IDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldmVydERpc3BsYXkoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50Qm94V2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgY29tcHV0ZWRTdHlsZTtcblxuICAgICAgICAgICAgICAgICAgICAvKiBGb3IgZWxlbWVudHMgdGhhdCBWZWxvY2l0eSBoYXNuJ3QgYmVlbiBjYWxsZWQgb24gZGlyZWN0bHkgKGUuZy4gd2hlbiBWZWxvY2l0eSBxdWVyaWVzIHRoZSBET00gb24gYmVoYWxmXG4gICAgICAgICAgICAgICAgICAgICAgIG9mIGEgcGFyZW50IG9mIGFuIGVsZW1lbnQgaXRzIGFuaW1hdGluZyksIHBlcmZvcm0gYSBkaXJlY3QgZ2V0Q29tcHV0ZWRTdHlsZSBsb29rdXAgc2luY2UgdGhlIG9iamVjdCBpc24ndCBjYWNoZWQuICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50LCBudWxsKTsgLyogR0VUICovXG4gICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBjb21wdXRlZFN0eWxlIG9iamVjdCBoYXMgeWV0IHRvIGJlIGNhY2hlZCwgZG8gc28gbm93LiAqL1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFEYXRhKGVsZW1lbnQpLmNvbXB1dGVkU3R5bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkU3R5bGUgPSBEYXRhKGVsZW1lbnQpLmNvbXB1dGVkU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50LCBudWxsKTsgLyogR0VUICovXG4gICAgICAgICAgICAgICAgICAgIC8qIElmIGNvbXB1dGVkU3R5bGUgaXMgY2FjaGVkLCB1c2UgaXQuICovXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wdXRlZFN0eWxlID0gRGF0YShlbGVtZW50KS5jb21wdXRlZFN0eWxlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLyogSUUgYW5kIEZpcmVmb3ggZG8gbm90IHJldHVybiBhIHZhbHVlIGZvciB0aGUgZ2VuZXJpYyBib3JkZXJDb2xvciAtLSB0aGV5IG9ubHkgcmV0dXJuIGluZGl2aWR1YWwgdmFsdWVzIGZvciBlYWNoIGJvcmRlciBzaWRlJ3MgY29sb3IuXG4gICAgICAgICAgICAgICAgICAgICAgIEFsc28sIGluIGFsbCBicm93c2Vycywgd2hlbiBib3JkZXIgY29sb3JzIGFyZW4ndCBhbGwgdGhlIHNhbWUsIGEgY29tcG91bmQgdmFsdWUgaXMgcmV0dXJuZWQgdGhhdCBWZWxvY2l0eSBpc24ndCBzZXR1cCB0byBwYXJzZS5cbiAgICAgICAgICAgICAgICAgICAgICAgU28sIGFzIGEgcG9seWZpbGwgZm9yIHF1ZXJ5aW5nIGluZGl2aWR1YWwgYm9yZGVyIHNpZGUgY29sb3JzLCB3ZSBqdXN0IHJldHVybiB0aGUgdG9wIGJvcmRlcidzIGNvbG9yIGFuZCBhbmltYXRlIGFsbCBib3JkZXJzIGZyb20gdGhhdCB2YWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5ID09PSBcImJvcmRlckNvbG9yXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5ID0gXCJib3JkZXJUb3BDb2xvclwiO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLyogSUU5IGhhcyBhIGJ1ZyBpbiB3aGljaCB0aGUgXCJmaWx0ZXJcIiBwcm9wZXJ0eSBtdXN0IGJlIGFjY2Vzc2VkIGZyb20gY29tcHV0ZWRTdHlsZSB1c2luZyB0aGUgZ2V0UHJvcGVydHlWYWx1ZSBtZXRob2RcbiAgICAgICAgICAgICAgICAgICAgICAgaW5zdGVhZCBvZiBhIGRpcmVjdCBwcm9wZXJ0eSBsb29rdXAuIFRoZSBnZXRQcm9wZXJ0eVZhbHVlIG1ldGhvZCBpcyBzbG93ZXIgdGhhbiBhIGRpcmVjdCBsb29rdXAsIHdoaWNoIGlzIHdoeSB3ZSBhdm9pZCBpdCBieSBkZWZhdWx0LiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAoSUUgPT09IDkgJiYgcHJvcGVydHkgPT09IFwiZmlsdGVyXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkVmFsdWUgPSBjb21wdXRlZFN0eWxlLmdldFByb3BlcnR5VmFsdWUocHJvcGVydHkpOyAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkVmFsdWUgPSBjb21wdXRlZFN0eWxlW3Byb3BlcnR5XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8qIEZhbGwgYmFjayB0byB0aGUgcHJvcGVydHkncyBzdHlsZSB2YWx1ZSAoaWYgZGVmaW5lZCkgd2hlbiBjb21wdXRlZFZhbHVlIHJldHVybnMgbm90aGluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgd2hpY2ggY2FuIGhhcHBlbiB3aGVuIHRoZSBlbGVtZW50IGhhc24ndCBiZWVuIHBhaW50ZWQuICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wdXRlZFZhbHVlID09PSBcIlwiIHx8IGNvbXB1dGVkVmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkVmFsdWUgPSBlbGVtZW50LnN0eWxlW3Byb3BlcnR5XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldmVydERpc3BsYXkoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKiBGb3IgdG9wLCByaWdodCwgYm90dG9tLCBhbmQgbGVmdCAoVFJCTCkgdmFsdWVzIHRoYXQgYXJlIHNldCB0byBcImF1dG9cIiBvbiBlbGVtZW50cyBvZiBcImZpeGVkXCIgb3IgXCJhYnNvbHV0ZVwiIHBvc2l0aW9uLFxuICAgICAgICAgICAgICAgICAgIGRlZmVyIHRvIGpRdWVyeSBmb3IgY29udmVydGluZyBcImF1dG9cIiB0byBhIG51bWVyaWMgdmFsdWUuIChGb3IgZWxlbWVudHMgd2l0aCBhIFwic3RhdGljXCIgb3IgXCJyZWxhdGl2ZVwiIHBvc2l0aW9uLCBcImF1dG9cIiBoYXMgdGhlIHNhbWVcbiAgICAgICAgICAgICAgICAgICBlZmZlY3QgYXMgYmVpbmcgc2V0IHRvIDAsIHNvIG5vIGNvbnZlcnNpb24gaXMgbmVjZXNzYXJ5LikgKi9cbiAgICAgICAgICAgICAgICAvKiBBbiBleGFtcGxlIG9mIHdoeSBudW1lcmljIGNvbnZlcnNpb24gaXMgbmVjZXNzYXJ5OiBXaGVuIGFuIGVsZW1lbnQgd2l0aCBcInBvc2l0aW9uOmFic29sdXRlXCIgaGFzIGFuIHVudG91Y2hlZCBcImxlZnRcIlxuICAgICAgICAgICAgICAgICAgIHByb3BlcnR5LCB3aGljaCByZXZlcnRzIHRvIFwiYXV0b1wiLCBsZWZ0J3MgdmFsdWUgaXMgMCByZWxhdGl2ZSB0byBpdHMgcGFyZW50IGVsZW1lbnQsIGJ1dCBpcyBvZnRlbiBub24temVybyByZWxhdGl2ZVxuICAgICAgICAgICAgICAgICAgIHRvIGl0cyAqY29udGFpbmluZyogKG5vdCBwYXJlbnQpIGVsZW1lbnQsIHdoaWNoIGlzIHRoZSBuZWFyZXN0IFwicG9zaXRpb246cmVsYXRpdmVcIiBhbmNlc3RvciBvciB0aGUgdmlld3BvcnQgKGFuZCBhbHdheXMgdGhlIHZpZXdwb3J0IGluIHRoZSBjYXNlIG9mIFwicG9zaXRpb246Zml4ZWRcIikuICovXG4gICAgICAgICAgICAgICAgaWYgKGNvbXB1dGVkVmFsdWUgPT09IFwiYXV0b1wiICYmIC9eKHRvcHxyaWdodHxib3R0b218bGVmdCkkL2kudGVzdChwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvc2l0aW9uID0gY29tcHV0ZVByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJwb3NpdGlvblwiKTsgLyogR0VUICovXG5cbiAgICAgICAgICAgICAgICAgICAgLyogRm9yIGFic29sdXRlIHBvc2l0aW9uaW5nLCBqUXVlcnkncyAkLnBvc2l0aW9uKCkgb25seSByZXR1cm5zIHZhbHVlcyBmb3IgdG9wIGFuZCBsZWZ0O1xuICAgICAgICAgICAgICAgICAgICAgICByaWdodCBhbmQgYm90dG9tIHdpbGwgaGF2ZSB0aGVpciBcImF1dG9cIiB2YWx1ZSByZXZlcnRlZCB0byAwLiAqL1xuICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBBIGpRdWVyeSBvYmplY3QgbXVzdCBiZSBjcmVhdGVkIGhlcmUgc2luY2UgalF1ZXJ5IGRvZXNuJ3QgaGF2ZSBhIGxvdy1sZXZlbCBhbGlhcyBmb3IgJC5wb3NpdGlvbigpLlxuICAgICAgICAgICAgICAgICAgICAgICBOb3QgYSBiaWcgZGVhbCBzaW5jZSB3ZSdyZSBjdXJyZW50bHkgaW4gYSBHRVQgYmF0Y2ggYW55d2F5LiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAocG9zaXRpb24gPT09IFwiZml4ZWRcIiB8fCAocG9zaXRpb24gPT09IFwiYWJzb2x1dGVcIiAmJiAvdG9wfGxlZnQvaS50ZXN0KHByb3BlcnR5KSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IGpRdWVyeSBzdHJpcHMgdGhlIHBpeGVsIHVuaXQgZnJvbSBpdHMgcmV0dXJuZWQgdmFsdWVzOyB3ZSByZS1hZGQgaXQgaGVyZSB0byBjb25mb3JtIHdpdGggY29tcHV0ZVByb3BlcnR5VmFsdWUncyBiZWhhdmlvci4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkVmFsdWUgPSAkKGVsZW1lbnQpLnBvc2l0aW9uKClbcHJvcGVydHldICsgXCJweFwiOyAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBjb21wdXRlZFZhbHVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcHJvcGVydHlWYWx1ZTtcblxuICAgICAgICAgICAgLyogSWYgdGhpcyBpcyBhIGhvb2tlZCBwcm9wZXJ0eSAoZS5nLiBcImNsaXBMZWZ0XCIgaW5zdGVhZCBvZiB0aGUgcm9vdCBwcm9wZXJ0eSBvZiBcImNsaXBcIiksXG4gICAgICAgICAgICAgICBleHRyYWN0IHRoZSBob29rJ3MgdmFsdWUgZnJvbSBhIG5vcm1hbGl6ZWQgcm9vdFByb3BlcnR5VmFsdWUgdXNpbmcgQ1NTLkhvb2tzLmV4dHJhY3RWYWx1ZSgpLiAqL1xuICAgICAgICAgICAgaWYgKENTUy5Ib29rcy5yZWdpc3RlcmVkW3Byb3BlcnR5XSkge1xuICAgICAgICAgICAgICAgIHZhciBob29rID0gcHJvcGVydHksXG4gICAgICAgICAgICAgICAgICAgIGhvb2tSb290ID0gQ1NTLkhvb2tzLmdldFJvb3QoaG9vayk7XG5cbiAgICAgICAgICAgICAgICAvKiBJZiBhIGNhY2hlZCByb290UHJvcGVydHlWYWx1ZSB3YXNuJ3QgcGFzc2VkIGluICh3aGljaCBWZWxvY2l0eSBhbHdheXMgYXR0ZW1wdHMgdG8gZG8gaW4gb3JkZXIgdG8gYXZvaWQgcmVxdWVyeWluZyB0aGUgRE9NKSxcbiAgICAgICAgICAgICAgICAgICBxdWVyeSB0aGUgRE9NIGZvciB0aGUgcm9vdCBwcm9wZXJ0eSdzIHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgIGlmIChyb290UHJvcGVydHlWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIFNpbmNlIHRoZSBicm93c2VyIGlzIG5vdyBiZWluZyBkaXJlY3RseSBxdWVyaWVkLCB1c2UgdGhlIG9mZmljaWFsIHBvc3QtcHJlZml4aW5nIHByb3BlcnR5IG5hbWUgZm9yIHRoaXMgbG9va3VwLiAqL1xuICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSA9IENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIENTUy5OYW1lcy5wcmVmaXhDaGVjayhob29rUm9vdClbMF0pOyAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKiBJZiB0aGlzIHJvb3QgaGFzIGEgbm9ybWFsaXphdGlvbiByZWdpc3RlcmVkLCBwZWZvcm0gdGhlIGFzc29jaWF0ZWQgbm9ybWFsaXphdGlvbiBleHRyYWN0aW9uLiAqL1xuICAgICAgICAgICAgICAgIGlmIChDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtob29rUm9vdF0pIHtcbiAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtob29rUm9vdF0oXCJleHRyYWN0XCIsIGVsZW1lbnQsIHJvb3RQcm9wZXJ0eVZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKiBFeHRyYWN0IHRoZSBob29rJ3MgdmFsdWUuICovXG4gICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IENTUy5Ib29rcy5leHRyYWN0VmFsdWUoaG9vaywgcm9vdFByb3BlcnR5VmFsdWUpO1xuXG4gICAgICAgICAgICAvKiBJZiB0aGlzIGlzIGEgbm9ybWFsaXplZCBwcm9wZXJ0eSAoZS5nLiBcIm9wYWNpdHlcIiBiZWNvbWVzIFwiZmlsdGVyXCIgaW4gPD1JRTgpIG9yIFwidHJhbnNsYXRlWFwiIGJlY29tZXMgXCJ0cmFuc2Zvcm1cIiksXG4gICAgICAgICAgICAgICBub3JtYWxpemUgdGhlIHByb3BlcnR5J3MgbmFtZSBhbmQgdmFsdWUsIGFuZCBoYW5kbGUgdGhlIHNwZWNpYWwgY2FzZSBvZiB0cmFuc2Zvcm1zLiAqL1xuICAgICAgICAgICAgLyogTm90ZTogTm9ybWFsaXppbmcgYSBwcm9wZXJ0eSBpcyBtdXR1YWxseSBleGNsdXNpdmUgZnJvbSBob29raW5nIGEgcHJvcGVydHkgc2luY2UgaG9vay1leHRyYWN0ZWQgdmFsdWVzIGFyZSBzdHJpY3RseVxuICAgICAgICAgICAgICAgbnVtZXJpY2FsIGFuZCB0aGVyZWZvcmUgZG8gbm90IHJlcXVpcmUgbm9ybWFsaXphdGlvbiBleHRyYWN0aW9uLiAqL1xuICAgICAgICAgICAgfSBlbHNlIGlmIChDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0pIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9ybWFsaXplZFByb3BlcnR5TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgbm9ybWFsaXplZFByb3BlcnR5VmFsdWU7XG5cbiAgICAgICAgICAgICAgICBub3JtYWxpemVkUHJvcGVydHlOYW1lID0gQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbcHJvcGVydHldKFwibmFtZVwiLCBlbGVtZW50KTtcblxuICAgICAgICAgICAgICAgIC8qIFRyYW5zZm9ybSB2YWx1ZXMgYXJlIGNhbGN1bGF0ZWQgdmlhIG5vcm1hbGl6YXRpb24gZXh0cmFjdGlvbiAoc2VlIGJlbG93KSwgd2hpY2ggY2hlY2tzIGFnYWluc3QgdGhlIGVsZW1lbnQncyB0cmFuc2Zvcm1DYWNoZS5cbiAgICAgICAgICAgICAgICAgICBBdCBubyBwb2ludCBkbyB0cmFuc2Zvcm0gR0VUcyBldmVyIGFjdHVhbGx5IHF1ZXJ5IHRoZSBET007IGluaXRpYWwgc3R5bGVzaGVldCB2YWx1ZXMgYXJlIG5ldmVyIHByb2Nlc3NlZC5cbiAgICAgICAgICAgICAgICAgICBUaGlzIGlzIGJlY2F1c2UgcGFyc2luZyAzRCB0cmFuc2Zvcm0gbWF0cmljZXMgaXMgbm90IGFsd2F5cyBhY2N1cmF0ZSBhbmQgd291bGQgYmxvYXQgb3VyIGNvZGViYXNlO1xuICAgICAgICAgICAgICAgICAgIHRodXMsIG5vcm1hbGl6YXRpb24gZXh0cmFjdGlvbiBkZWZhdWx0cyBpbml0aWFsIHRyYW5zZm9ybSB2YWx1ZXMgdG8gdGhlaXIgemVyby12YWx1ZXMgKGUuZy4gMSBmb3Igc2NhbGVYIGFuZCAwIGZvciB0cmFuc2xhdGVYKS4gKi9cbiAgICAgICAgICAgICAgICBpZiAobm9ybWFsaXplZFByb3BlcnR5TmFtZSAhPT0gXCJ0cmFuc2Zvcm1cIikge1xuICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVkUHJvcGVydHlWYWx1ZSA9IGNvbXB1dGVQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIENTUy5OYW1lcy5wcmVmaXhDaGVjayhub3JtYWxpemVkUHJvcGVydHlOYW1lKVswXSk7IC8qIEdFVCAqL1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSB2YWx1ZSBpcyBhIENTUyBudWxsLXZhbHVlIGFuZCB0aGlzIHByb3BlcnR5IGhhcyBhIGhvb2sgdGVtcGxhdGUsIHVzZSB0aGF0IHplcm8tdmFsdWUgdGVtcGxhdGUgc28gdGhhdCBob29rcyBjYW4gYmUgZXh0cmFjdGVkIGZyb20gaXQuICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChDU1MuVmFsdWVzLmlzQ1NTTnVsbFZhbHVlKG5vcm1hbGl6ZWRQcm9wZXJ0eVZhbHVlKSAmJiBDU1MuSG9va3MudGVtcGxhdGVzW3Byb3BlcnR5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9ybWFsaXplZFByb3BlcnR5VmFsdWUgPSBDU1MuSG9va3MudGVtcGxhdGVzW3Byb3BlcnR5XVsxXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0oXCJleHRyYWN0XCIsIGVsZW1lbnQsIG5vcm1hbGl6ZWRQcm9wZXJ0eVZhbHVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyogSWYgYSAobnVtZXJpYykgdmFsdWUgd2Fzbid0IHByb2R1Y2VkIHZpYSBob29rIGV4dHJhY3Rpb24gb3Igbm9ybWFsaXphdGlvbiwgcXVlcnkgdGhlIERPTS4gKi9cbiAgICAgICAgICAgIGlmICghL15bXFxkLV0vLnRlc3QocHJvcGVydHlWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAvKiBGb3IgU1ZHIGVsZW1lbnRzLCBkaW1lbnNpb25hbCBwcm9wZXJ0aWVzICh3aGljaCBTVkdBdHRyaWJ1dGUoKSBkZXRlY3RzKSBhcmUgdHdlZW5lZCB2aWFcbiAgICAgICAgICAgICAgICAgICB0aGVpciBIVE1MIGF0dHJpYnV0ZSB2YWx1ZXMgaW5zdGVhZCBvZiB0aGVpciBDU1Mgc3R5bGUgdmFsdWVzLiAqL1xuICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpICYmIERhdGEoZWxlbWVudCkuaXNTVkcgJiYgQ1NTLk5hbWVzLlNWR0F0dHJpYnV0ZShwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogU2luY2UgdGhlIGhlaWdodC93aWR0aCBhdHRyaWJ1dGUgdmFsdWVzIG11c3QgYmUgc2V0IG1hbnVhbGx5LCB0aGV5IGRvbid0IHJlZmxlY3QgY29tcHV0ZWQgdmFsdWVzLlxuICAgICAgICAgICAgICAgICAgICAgICBUaHVzLCB3ZSB1c2UgdXNlIGdldEJCb3goKSB0byBlbnN1cmUgd2UgYWx3YXlzIGdldCB2YWx1ZXMgZm9yIGVsZW1lbnRzIHdpdGggdW5kZWZpbmVkIGhlaWdodC93aWR0aCBhdHRyaWJ1dGVzLiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAoL14oaGVpZ2h0fHdpZHRoKSQvaS50ZXN0KHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogRmlyZWZveCB0aHJvd3MgYW4gZXJyb3IgaWYgLmdldEJCb3goKSBpcyBjYWxsZWQgb24gYW4gU1ZHIHRoYXQgaXNuJ3QgYXR0YWNoZWQgdG8gdGhlIERPTS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IGVsZW1lbnQuZ2V0QkJveCgpW3Byb3BlcnR5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8qIE90aGVyd2lzZSwgYWNjZXNzIHRoZSBhdHRyaWJ1dGUgdmFsdWUgZGlyZWN0bHkuICovXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUocHJvcGVydHkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IGNvbXB1dGVQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIENTUy5OYW1lcy5wcmVmaXhDaGVjayhwcm9wZXJ0eSlbMF0pOyAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIFNpbmNlIHByb3BlcnR5IGxvb2t1cHMgYXJlIGZvciBhbmltYXRpb24gcHVycG9zZXMgKHdoaWNoIGVudGFpbHMgY29tcHV0aW5nIHRoZSBudW1lcmljIGRlbHRhIGJldHdlZW4gc3RhcnQgYW5kIGVuZCB2YWx1ZXMpLFxuICAgICAgICAgICAgICAgY29udmVydCBDU1MgbnVsbC12YWx1ZXMgdG8gYW4gaW50ZWdlciBvZiB2YWx1ZSAwLiAqL1xuICAgICAgICAgICAgaWYgKENTUy5WYWx1ZXMuaXNDU1NOdWxsVmFsdWUocHJvcGVydHlWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKFZlbG9jaXR5LmRlYnVnID49IDIpIGNvbnNvbGUubG9nKFwiR2V0IFwiICsgcHJvcGVydHkgKyBcIjogXCIgKyBwcm9wZXJ0eVZhbHVlKTtcblxuICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5VmFsdWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyogVGhlIHNpbmd1bGFyIHNldFByb3BlcnR5VmFsdWUsIHdoaWNoIHJvdXRlcyB0aGUgbG9naWMgZm9yIGFsbCBub3JtYWxpemF0aW9ucywgaG9va3MsIGFuZCBzdGFuZGFyZCBDU1MgcHJvcGVydGllcy4gKi9cbiAgICAgICAgc2V0UHJvcGVydHlWYWx1ZTogZnVuY3Rpb24oZWxlbWVudCwgcHJvcGVydHksIHByb3BlcnR5VmFsdWUsIHJvb3RQcm9wZXJ0eVZhbHVlLCBzY3JvbGxEYXRhKSB7XG4gICAgICAgICAgICB2YXIgcHJvcGVydHlOYW1lID0gcHJvcGVydHk7XG5cbiAgICAgICAgICAgIC8qIEluIG9yZGVyIHRvIGJlIHN1YmplY3RlZCB0byBjYWxsIG9wdGlvbnMgYW5kIGVsZW1lbnQgcXVldWVpbmcsIHNjcm9sbCBhbmltYXRpb24gaXMgcm91dGVkIHRocm91Z2ggVmVsb2NpdHkgYXMgaWYgaXQgd2VyZSBhIHN0YW5kYXJkIENTUyBwcm9wZXJ0eS4gKi9cbiAgICAgICAgICAgIGlmIChwcm9wZXJ0eSA9PT0gXCJzY3JvbGxcIikge1xuICAgICAgICAgICAgICAgIC8qIElmIGEgY29udGFpbmVyIG9wdGlvbiBpcyBwcmVzZW50LCBzY3JvbGwgdGhlIGNvbnRhaW5lciBpbnN0ZWFkIG9mIHRoZSBicm93c2VyIHdpbmRvdy4gKi9cbiAgICAgICAgICAgICAgICBpZiAoc2Nyb2xsRGF0YS5jb250YWluZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsRGF0YS5jb250YWluZXJbXCJzY3JvbGxcIiArIHNjcm9sbERhdGEuZGlyZWN0aW9uXSA9IHByb3BlcnR5VmFsdWU7XG4gICAgICAgICAgICAgICAgLyogT3RoZXJ3aXNlLCBWZWxvY2l0eSBkZWZhdWx0cyB0byBzY3JvbGxpbmcgdGhlIGJyb3dzZXIgd2luZG93LiAqL1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY3JvbGxEYXRhLmRpcmVjdGlvbiA9PT0gXCJMZWZ0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5zY3JvbGxUbyhwcm9wZXJ0eVZhbHVlLCBzY3JvbGxEYXRhLmFsdGVybmF0ZVZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5zY3JvbGxUbyhzY3JvbGxEYXRhLmFsdGVybmF0ZVZhbHVlLCBwcm9wZXJ0eVZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLyogVHJhbnNmb3JtcyAodHJhbnNsYXRlWCwgcm90YXRlWiwgZXRjLikgYXJlIGFwcGxpZWQgdG8gYSBwZXItZWxlbWVudCB0cmFuc2Zvcm1DYWNoZSBvYmplY3QsIHdoaWNoIGlzIG1hbnVhbGx5IGZsdXNoZWQgdmlhIGZsdXNoVHJhbnNmb3JtQ2FjaGUoKS5cbiAgICAgICAgICAgICAgICAgICBUaHVzLCBmb3Igbm93LCB3ZSBtZXJlbHkgY2FjaGUgdHJhbnNmb3JtcyBiZWluZyBTRVQuICovXG4gICAgICAgICAgICAgICAgaWYgKENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XSAmJiBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0oXCJuYW1lXCIsIGVsZW1lbnQpID09PSBcInRyYW5zZm9ybVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIFBlcmZvcm0gYSBub3JtYWxpemF0aW9uIGluamVjdGlvbi4gKi9cbiAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogVGhlIG5vcm1hbGl6YXRpb24gbG9naWMgaGFuZGxlcyB0aGUgdHJhbnNmb3JtQ2FjaGUgdXBkYXRpbmcuICovXG4gICAgICAgICAgICAgICAgICAgIENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XShcImluamVjdFwiLCBlbGVtZW50LCBwcm9wZXJ0eVZhbHVlKTtcblxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBcInRyYW5zZm9ybVwiO1xuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVtwcm9wZXJ0eV07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLyogSW5qZWN0IGhvb2tzLiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbcHJvcGVydHldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaG9va05hbWUgPSBwcm9wZXJ0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob29rUm9vdCA9IENTUy5Ib29rcy5nZXRSb290KHByb3BlcnR5KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgYSBjYWNoZWQgcm9vdFByb3BlcnR5VmFsdWUgd2FzIG5vdCBwcm92aWRlZCwgcXVlcnkgdGhlIERPTSBmb3IgdGhlIGhvb2tSb290J3MgY3VycmVudCB2YWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gcm9vdFByb3BlcnR5VmFsdWUgfHwgQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgaG9va1Jvb3QpOyAvKiBHRVQgKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IENTUy5Ib29rcy5pbmplY3RWYWx1ZShob29rTmFtZSwgcHJvcGVydHlWYWx1ZSwgcm9vdFByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHkgPSBob29rUm9vdDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8qIE5vcm1hbGl6ZSBuYW1lcyBhbmQgdmFsdWVzLiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbcHJvcGVydHldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbcHJvcGVydHldKFwiaW5qZWN0XCIsIGVsZW1lbnQsIHByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHkgPSBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0oXCJuYW1lXCIsIGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLyogQXNzaWduIHRoZSBhcHByb3ByaWF0ZSB2ZW5kb3IgcHJlZml4IGJlZm9yZSBwZXJmb3JtaW5nIGFuIG9mZmljaWFsIHN0eWxlIHVwZGF0ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gQ1NTLk5hbWVzLnByZWZpeENoZWNrKHByb3BlcnR5KVswXTtcblxuICAgICAgICAgICAgICAgICAgICAvKiBBIHRyeS9jYXRjaCBpcyB1c2VkIGZvciBJRTw9OCwgd2hpY2ggdGhyb3dzIGFuIGVycm9yIHdoZW4gXCJpbnZhbGlkXCIgQ1NTIHZhbHVlcyBhcmUgc2V0LCBlLmcuIGEgbmVnYXRpdmUgd2lkdGguXG4gICAgICAgICAgICAgICAgICAgICAgIFRyeS9jYXRjaCBpcyBhdm9pZGVkIGZvciBvdGhlciBicm93c2VycyBzaW5jZSBpdCBpbmN1cnMgYSBwZXJmb3JtYW5jZSBvdmVyaGVhZC4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKElFIDw9IDgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5zdHlsZVtwcm9wZXJ0eU5hbWVdID0gcHJvcGVydHlWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7IGlmIChWZWxvY2l0eS5kZWJ1ZykgY29uc29sZS5sb2coXCJCcm93c2VyIGRvZXMgbm90IHN1cHBvcnQgW1wiICsgcHJvcGVydHlWYWx1ZSArIFwiXSBmb3IgW1wiICsgcHJvcGVydHlOYW1lICsgXCJdXCIpOyB9XG4gICAgICAgICAgICAgICAgICAgIC8qIFNWRyBlbGVtZW50cyBoYXZlIHRoZWlyIGRpbWVuc2lvbmFsIHByb3BlcnRpZXMgKHdpZHRoLCBoZWlnaHQsIHgsIHksIGN4LCBldGMuKSBhcHBsaWVkIGRpcmVjdGx5IGFzIGF0dHJpYnV0ZXMgaW5zdGVhZCBvZiBhcyBzdHlsZXMuICovXG4gICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IElFOCBkb2VzIG5vdCBzdXBwb3J0IFNWRyBlbGVtZW50cywgc28gaXQncyBva2F5IHRoYXQgd2Ugc2tpcCBpdCBmb3IgU1ZHIGFuaW1hdGlvbi4gKi9cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChEYXRhKGVsZW1lbnQpICYmIERhdGEoZWxlbWVudCkuaXNTVkcgJiYgQ1NTLk5hbWVzLlNWR0F0dHJpYnV0ZShwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IEZvciBTVkcgYXR0cmlidXRlcywgdmVuZG9yLXByZWZpeGVkIHByb3BlcnR5IG5hbWVzIGFyZSBuZXZlciB1c2VkLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogTm90IGFsbCBDU1MgcHJvcGVydGllcyBjYW4gYmUgYW5pbWF0ZWQgdmlhIGF0dHJpYnV0ZXMsIGJ1dCB0aGUgYnJvd3NlciB3b24ndCB0aHJvdyBhbiBlcnJvciBmb3IgdW5zdXBwb3J0ZWQgcHJvcGVydGllcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKHByb3BlcnR5LCBwcm9wZXJ0eVZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc3R5bGVbcHJvcGVydHlOYW1lXSA9IHByb3BlcnR5VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoVmVsb2NpdHkuZGVidWcgPj0gMikgY29uc29sZS5sb2coXCJTZXQgXCIgKyBwcm9wZXJ0eSArIFwiIChcIiArIHByb3BlcnR5TmFtZSArIFwiKTogXCIgKyBwcm9wZXJ0eVZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIFJldHVybiB0aGUgbm9ybWFsaXplZCBwcm9wZXJ0eSBuYW1lIGFuZCB2YWx1ZSBpbiBjYXNlIHRoZSBjYWxsZXIgd2FudHMgdG8ga25vdyBob3cgdGhlc2UgdmFsdWVzIHdlcmUgbW9kaWZpZWQgYmVmb3JlIGJlaW5nIGFwcGxpZWQgdG8gdGhlIERPTS4gKi9cbiAgICAgICAgICAgIHJldHVybiBbIHByb3BlcnR5TmFtZSwgcHJvcGVydHlWYWx1ZSBdO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qIFRvIGluY3JlYXNlIHBlcmZvcm1hbmNlIGJ5IGJhdGNoaW5nIHRyYW5zZm9ybSB1cGRhdGVzIGludG8gYSBzaW5nbGUgU0VULCB0cmFuc2Zvcm1zIGFyZSBub3QgZGlyZWN0bHkgYXBwbGllZCB0byBhbiBlbGVtZW50IHVudGlsIGZsdXNoVHJhbnNmb3JtQ2FjaGUoKSBpcyBjYWxsZWQuICovXG4gICAgICAgIC8qIE5vdGU6IFZlbG9jaXR5IGFwcGxpZXMgdHJhbnNmb3JtIHByb3BlcnRpZXMgaW4gdGhlIHNhbWUgb3JkZXIgdGhhdCB0aGV5IGFyZSBjaHJvbm9naWNhbGx5IGludHJvZHVjZWQgdG8gdGhlIGVsZW1lbnQncyBDU1Mgc3R5bGVzLiAqL1xuICAgICAgICBmbHVzaFRyYW5zZm9ybUNhY2hlOiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgdHJhbnNmb3JtU3RyaW5nID0gXCJcIjtcblxuICAgICAgICAgICAgLyogQ2VydGFpbiBicm93c2VycyByZXF1aXJlIHRoYXQgU1ZHIHRyYW5zZm9ybXMgYmUgYXBwbGllZCBhcyBhbiBhdHRyaWJ1dGUuIEhvd2V2ZXIsIHRoZSBTVkcgdHJhbnNmb3JtIGF0dHJpYnV0ZSB0YWtlcyBhIG1vZGlmaWVkIHZlcnNpb24gb2YgQ1NTJ3MgdHJhbnNmb3JtIHN0cmluZ1xuICAgICAgICAgICAgICAgKHVuaXRzIGFyZSBkcm9wcGVkIGFuZCwgZXhjZXB0IGZvciBza2V3WC9ZLCBzdWJwcm9wZXJ0aWVzIGFyZSBtZXJnZWQgaW50byB0aGVpciBtYXN0ZXIgcHJvcGVydHkgLS0gZS5nLiBzY2FsZVggYW5kIHNjYWxlWSBhcmUgbWVyZ2VkIGludG8gc2NhbGUoWCBZKS4gKi9cbiAgICAgICAgICAgIGlmICgoSUUgfHwgKFZlbG9jaXR5LlN0YXRlLmlzQW5kcm9pZCAmJiAhVmVsb2NpdHkuU3RhdGUuaXNDaHJvbWUpKSAmJiBEYXRhKGVsZW1lbnQpLmlzU1ZHKSB7XG4gICAgICAgICAgICAgICAgLyogU2luY2UgdHJhbnNmb3JtIHZhbHVlcyBhcmUgc3RvcmVkIGluIHRoZWlyIHBhcmVudGhlc2VzLXdyYXBwZWQgZm9ybSwgd2UgdXNlIGEgaGVscGVyIGZ1bmN0aW9uIHRvIHN0cmlwIG91dCB0aGVpciBudW1lcmljIHZhbHVlcy5cbiAgICAgICAgICAgICAgICAgICBGdXJ0aGVyLCBTVkcgdHJhbnNmb3JtIHByb3BlcnRpZXMgb25seSB0YWtlIHVuaXRsZXNzIChyZXByZXNlbnRpbmcgcGl4ZWxzKSB2YWx1ZXMsIHNvIGl0J3Mgb2theSB0aGF0IHBhcnNlRmxvYXQoKSBzdHJpcHMgdGhlIHVuaXQgc3VmZml4ZWQgdG8gdGhlIGZsb2F0IHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdldFRyYW5zZm9ybUZsb2F0ICh0cmFuc2Zvcm1Qcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCB0cmFuc2Zvcm1Qcm9wZXJ0eSkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qIENyZWF0ZSBhbiBvYmplY3QgdG8gb3JnYW5pemUgYWxsIHRoZSB0cmFuc2Zvcm1zIHRoYXQgd2UnbGwgYXBwbHkgdG8gdGhlIFNWRyBlbGVtZW50LiBUbyBrZWVwIHRoZSBsb2dpYyBzaW1wbGUsXG4gICAgICAgICAgICAgICAgICAgd2UgcHJvY2VzcyAqYWxsKiB0cmFuc2Zvcm0gcHJvcGVydGllcyAtLSBldmVuIHRob3NlIHRoYXQgbWF5IG5vdCBiZSBleHBsaWNpdGx5IGFwcGxpZWQgKHNpbmNlIHRoZXkgZGVmYXVsdCB0byB0aGVpciB6ZXJvLXZhbHVlcyBhbnl3YXkpLiAqL1xuICAgICAgICAgICAgICAgIHZhciBTVkdUcmFuc2Zvcm1zID0ge1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2xhdGU6IFsgZ2V0VHJhbnNmb3JtRmxvYXQoXCJ0cmFuc2xhdGVYXCIpLCBnZXRUcmFuc2Zvcm1GbG9hdChcInRyYW5zbGF0ZVlcIikgXSxcbiAgICAgICAgICAgICAgICAgICAgc2tld1g6IFsgZ2V0VHJhbnNmb3JtRmxvYXQoXCJza2V3WFwiKSBdLCBza2V3WTogWyBnZXRUcmFuc2Zvcm1GbG9hdChcInNrZXdZXCIpIF0sXG4gICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBzY2FsZSBwcm9wZXJ0eSBpcyBzZXQgKG5vbi0xKSwgdXNlIHRoYXQgdmFsdWUgZm9yIHRoZSBzY2FsZVggYW5kIHNjYWxlWSB2YWx1ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgKHRoaXMgYmVoYXZpb3IgbWltaWNzIHRoZSByZXN1bHQgb2YgYW5pbWF0aW5nIGFsbCB0aGVzZSBwcm9wZXJ0aWVzIGF0IG9uY2Ugb24gSFRNTCBlbGVtZW50cykuICovXG4gICAgICAgICAgICAgICAgICAgIHNjYWxlOiBnZXRUcmFuc2Zvcm1GbG9hdChcInNjYWxlXCIpICE9PSAxID8gWyBnZXRUcmFuc2Zvcm1GbG9hdChcInNjYWxlXCIpLCBnZXRUcmFuc2Zvcm1GbG9hdChcInNjYWxlXCIpIF0gOiBbIGdldFRyYW5zZm9ybUZsb2F0KFwic2NhbGVYXCIpLCBnZXRUcmFuc2Zvcm1GbG9hdChcInNjYWxlWVwiKSBdLFxuICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBTVkcncyByb3RhdGUgdHJhbnNmb3JtIHRha2VzIHRocmVlIHZhbHVlczogcm90YXRpb24gZGVncmVlcyBmb2xsb3dlZCBieSB0aGUgWCBhbmQgWSB2YWx1ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgZGVmaW5pbmcgdGhlIHJvdGF0aW9uJ3Mgb3JpZ2luIHBvaW50LiBXZSBpZ25vcmUgdGhlIG9yaWdpbiB2YWx1ZXMgKGRlZmF1bHQgdGhlbSB0byAwKS4gKi9cbiAgICAgICAgICAgICAgICAgICAgcm90YXRlOiBbIGdldFRyYW5zZm9ybUZsb2F0KFwicm90YXRlWlwiKSwgMCwgMCBdXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qIEl0ZXJhdGUgdGhyb3VnaCB0aGUgdHJhbnNmb3JtIHByb3BlcnRpZXMgaW4gdGhlIHVzZXItZGVmaW5lZCBwcm9wZXJ0eSBtYXAgb3JkZXIuXG4gICAgICAgICAgICAgICAgICAgKFRoaXMgbWltaWNzIHRoZSBiZWhhdmlvciBvZiBub24tU1ZHIHRyYW5zZm9ybSBhbmltYXRpb24uKSAqL1xuICAgICAgICAgICAgICAgICQuZWFjaChEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlLCBmdW5jdGlvbih0cmFuc2Zvcm1OYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIEV4Y2VwdCBmb3Igd2l0aCBza2V3WC9ZLCByZXZlcnQgdGhlIGF4aXMtc3BlY2lmaWMgdHJhbnNmb3JtIHN1YnByb3BlcnRpZXMgdG8gdGhlaXIgYXhpcy1mcmVlIG1hc3RlclxuICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzIHNvIHRoYXQgdGhleSBtYXRjaCB1cCB3aXRoIFNWRydzIGFjY2VwdGVkIHRyYW5zZm9ybSBwcm9wZXJ0aWVzLiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAoL150cmFuc2xhdGUvaS50ZXN0KHRyYW5zZm9ybU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1OYW1lID0gXCJ0cmFuc2xhdGVcIjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvXnNjYWxlL2kudGVzdCh0cmFuc2Zvcm1OYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtTmFtZSA9IFwic2NhbGVcIjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvXnJvdGF0ZS9pLnRlc3QodHJhbnNmb3JtTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybU5hbWUgPSBcInJvdGF0ZVwiO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLyogQ2hlY2sgdGhhdCB3ZSBoYXZlbid0IHlldCBkZWxldGVkIHRoZSBwcm9wZXJ0eSBmcm9tIHRoZSBTVkdUcmFuc2Zvcm1zIGNvbnRhaW5lci4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKFNWR1RyYW5zZm9ybXNbdHJhbnNmb3JtTmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIEFwcGVuZCB0aGUgdHJhbnNmb3JtIHByb3BlcnR5IGluIHRoZSBTVkctc3VwcG9ydGVkIHRyYW5zZm9ybSBmb3JtYXQuIEFzIHBlciB0aGUgc3BlYywgc3Vycm91bmQgdGhlIHNwYWNlLWRlbGltaXRlZCB2YWx1ZXMgaW4gcGFyZW50aGVzZXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1TdHJpbmcgKz0gdHJhbnNmb3JtTmFtZSArIFwiKFwiICsgU1ZHVHJhbnNmb3Jtc1t0cmFuc2Zvcm1OYW1lXS5qb2luKFwiIFwiKSArIFwiKVwiICsgXCIgXCI7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIEFmdGVyIHByb2Nlc3NpbmcgYW4gU1ZHIHRyYW5zZm9ybSBwcm9wZXJ0eSwgZGVsZXRlIGl0IGZyb20gdGhlIFNWR1RyYW5zZm9ybXMgY29udGFpbmVyIHNvIHdlIGRvbid0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICByZS1pbnNlcnQgdGhlIHNhbWUgbWFzdGVyIHByb3BlcnR5IGlmIHdlIGVuY291bnRlciBhbm90aGVyIG9uZSBvZiBpdHMgYXhpcy1zcGVjaWZpYyBwcm9wZXJ0aWVzLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIFNWR1RyYW5zZm9ybXNbdHJhbnNmb3JtTmFtZV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHRyYW5zZm9ybVZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBwZXJzcGVjdGl2ZTtcblxuICAgICAgICAgICAgICAgIC8qIFRyYW5zZm9ybSBwcm9wZXJ0aWVzIGFyZSBzdG9yZWQgYXMgbWVtYmVycyBvZiB0aGUgdHJhbnNmb3JtQ2FjaGUgb2JqZWN0LiBDb25jYXRlbmF0ZSBhbGwgdGhlIG1lbWJlcnMgaW50byBhIHN0cmluZy4gKi9cbiAgICAgICAgICAgICAgICAkLmVhY2goRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZSwgZnVuY3Rpb24odHJhbnNmb3JtTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1WYWx1ZSA9IERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGVbdHJhbnNmb3JtTmFtZV07XG5cbiAgICAgICAgICAgICAgICAgICAgLyogVHJhbnNmb3JtJ3MgcGVyc3BlY3RpdmUgc3VicHJvcGVydHkgbXVzdCBiZSBzZXQgZmlyc3QgaW4gb3JkZXIgdG8gdGFrZSBlZmZlY3QuIFN0b3JlIGl0IHRlbXBvcmFyaWx5LiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAodHJhbnNmb3JtTmFtZSA9PT0gXCJ0cmFuc2Zvcm1QZXJzcGVjdGl2ZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZXJzcGVjdGl2ZSA9IHRyYW5zZm9ybVZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBJRTkgb25seSBzdXBwb3J0cyBvbmUgcm90YXRpb24gdHlwZSwgcm90YXRlWiwgd2hpY2ggaXQgcmVmZXJzIHRvIGFzIFwicm90YXRlXCIuICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChJRSA9PT0gOSAmJiB0cmFuc2Zvcm1OYW1lID09PSBcInJvdGF0ZVpcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtTmFtZSA9IFwicm90YXRlXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1TdHJpbmcgKz0gdHJhbnNmb3JtTmFtZSArIHRyYW5zZm9ybVZhbHVlICsgXCIgXCI7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvKiBJZiBwcmVzZW50LCBzZXQgdGhlIHBlcnNwZWN0aXZlIHN1YnByb3BlcnR5IGZpcnN0LiAqL1xuICAgICAgICAgICAgICAgIGlmIChwZXJzcGVjdGl2ZSkge1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1TdHJpbmcgPSBcInBlcnNwZWN0aXZlXCIgKyBwZXJzcGVjdGl2ZSArIFwiIFwiICsgdHJhbnNmb3JtU3RyaW5nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgQ1NTLnNldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJ0cmFuc2Zvcm1cIiwgdHJhbnNmb3JtU3RyaW5nKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKiBSZWdpc3RlciBob29rcyBhbmQgbm9ybWFsaXphdGlvbnMuICovXG4gICAgQ1NTLkhvb2tzLnJlZ2lzdGVyKCk7XG4gICAgQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyKCk7XG5cbiAgICAvKiBBbGxvdyBob29rIHNldHRpbmcgaW4gdGhlIHNhbWUgZmFzaGlvbiBhcyBqUXVlcnkncyAkLmNzcygpLiAqL1xuICAgIFZlbG9jaXR5Lmhvb2sgPSBmdW5jdGlvbiAoZWxlbWVudHMsIGFyZzIsIGFyZzMpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIGVsZW1lbnRzID0gc2FuaXRpemVFbGVtZW50cyhlbGVtZW50cyk7XG5cbiAgICAgICAgJC5lYWNoKGVsZW1lbnRzLCBmdW5jdGlvbihpLCBlbGVtZW50KSB7XG4gICAgICAgICAgICAvKiBJbml0aWFsaXplIFZlbG9jaXR5J3MgcGVyLWVsZW1lbnQgZGF0YSBjYWNoZSBpZiB0aGlzIGVsZW1lbnQgaGFzbid0IHByZXZpb3VzbHkgYmVlbiBhbmltYXRlZC4gKi9cbiAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBWZWxvY2l0eS5pbml0KGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiBHZXQgcHJvcGVydHkgdmFsdWUuIElmIGFuIGVsZW1lbnQgc2V0IHdhcyBwYXNzZWQgaW4sIG9ubHkgcmV0dXJuIHRoZSB2YWx1ZSBmb3IgdGhlIGZpcnN0IGVsZW1lbnQuICovXG4gICAgICAgICAgICBpZiAoYXJnMyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBWZWxvY2l0eS5DU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBhcmcyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAvKiBTZXQgcHJvcGVydHkgdmFsdWUuICovXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8qIHNQViByZXR1cm5zIGFuIGFycmF5IG9mIHRoZSBub3JtYWxpemVkIHByb3BlcnR5TmFtZS9wcm9wZXJ0eVZhbHVlIHBhaXIgdXNlZCB0byB1cGRhdGUgdGhlIERPTS4gKi9cbiAgICAgICAgICAgICAgICB2YXIgYWRqdXN0ZWRTZXQgPSBWZWxvY2l0eS5DU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBhcmcyLCBhcmczKTtcblxuICAgICAgICAgICAgICAgIC8qIFRyYW5zZm9ybSBwcm9wZXJ0aWVzIGRvbid0IGF1dG9tYXRpY2FsbHkgc2V0LiBUaGV5IGhhdmUgdG8gYmUgZmx1c2hlZCB0byB0aGUgRE9NLiAqL1xuICAgICAgICAgICAgICAgIGlmIChhZGp1c3RlZFNldFswXSA9PT0gXCJ0cmFuc2Zvcm1cIikge1xuICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5DU1MuZmx1c2hUcmFuc2Zvcm1DYWNoZShlbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGFkanVzdGVkU2V0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcblxuICAgIC8qKioqKioqKioqKioqKioqKlxuICAgICAgICBBbmltYXRpb25cbiAgICAqKioqKioqKioqKioqKioqKi9cblxuICAgIHZhciBhbmltYXRlID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgLyoqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgQ2FsbCBDaGFpblxuICAgICAgICAqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgLyogTG9naWMgZm9yIGRldGVybWluaW5nIHdoYXQgdG8gcmV0dXJuIHRvIHRoZSBjYWxsIHN0YWNrIHdoZW4gZXhpdGluZyBvdXQgb2YgVmVsb2NpdHkuICovXG4gICAgICAgIGZ1bmN0aW9uIGdldENoYWluICgpIHtcbiAgICAgICAgICAgIC8qIElmIHdlIGFyZSB1c2luZyB0aGUgdXRpbGl0eSBmdW5jdGlvbiwgYXR0ZW1wdCB0byByZXR1cm4gdGhpcyBjYWxsJ3MgcHJvbWlzZS4gSWYgbm8gcHJvbWlzZSBsaWJyYXJ5IHdhcyBkZXRlY3RlZCxcbiAgICAgICAgICAgICAgIGRlZmF1bHQgdG8gbnVsbCBpbnN0ZWFkIG9mIHJldHVybmluZyB0aGUgdGFyZ2V0ZWQgZWxlbWVudHMgc28gdGhhdCB1dGlsaXR5IGZ1bmN0aW9uJ3MgcmV0dXJuIHZhbHVlIGlzIHN0YW5kYXJkaXplZC4gKi9cbiAgICAgICAgICAgIGlmIChpc1V0aWxpdHkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZURhdGEucHJvbWlzZSB8fCBudWxsO1xuICAgICAgICAgICAgLyogT3RoZXJ3aXNlLCBpZiB3ZSdyZSB1c2luZyAkLmZuLCByZXR1cm4gdGhlIGpRdWVyeS0vWmVwdG8td3JhcHBlZCBlbGVtZW50IHNldC4gKi9cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnRzV3JhcHBlZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgIEFyZ3VtZW50cyBBc3NpZ25tZW50XG4gICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgLyogVG8gYWxsb3cgZm9yIGV4cHJlc3NpdmUgQ29mZmVlU2NyaXB0IGNvZGUsIFZlbG9jaXR5IHN1cHBvcnRzIGFuIGFsdGVybmF0aXZlIHN5bnRheCBpbiB3aGljaCBcImVsZW1lbnRzXCIgKG9yIFwiZVwiKSwgXCJwcm9wZXJ0aWVzXCIgKG9yIFwicFwiKSwgYW5kIFwib3B0aW9uc1wiIChvciBcIm9cIilcbiAgICAgICAgICAgb2JqZWN0cyBhcmUgZGVmaW5lZCBvbiBhIGNvbnRhaW5lciBvYmplY3QgdGhhdCdzIHBhc3NlZCBpbiBhcyBWZWxvY2l0eSdzIHNvbGUgYXJndW1lbnQuICovXG4gICAgICAgIC8qIE5vdGU6IFNvbWUgYnJvd3NlcnMgYXV0b21hdGljYWxseSBwb3B1bGF0ZSBhcmd1bWVudHMgd2l0aCBhIFwicHJvcGVydGllc1wiIG9iamVjdC4gV2UgZGV0ZWN0IGl0IGJ5IGNoZWNraW5nIGZvciBpdHMgZGVmYXVsdCBcIm5hbWVzXCIgcHJvcGVydHkuICovXG4gICAgICAgIHZhciBzeW50YWN0aWNTdWdhciA9IChhcmd1bWVudHNbMF0gJiYgKGFyZ3VtZW50c1swXS5wIHx8ICgoJC5pc1BsYWluT2JqZWN0KGFyZ3VtZW50c1swXS5wcm9wZXJ0aWVzKSAmJiAhYXJndW1lbnRzWzBdLnByb3BlcnRpZXMubmFtZXMpIHx8IFR5cGUuaXNTdHJpbmcoYXJndW1lbnRzWzBdLnByb3BlcnRpZXMpKSkpLFxuICAgICAgICAgICAgLyogV2hldGhlciBWZWxvY2l0eSB3YXMgY2FsbGVkIHZpYSB0aGUgdXRpbGl0eSBmdW5jdGlvbiAoYXMgb3Bwb3NlZCB0byBvbiBhIGpRdWVyeS9aZXB0byBvYmplY3QpLiAqL1xuICAgICAgICAgICAgaXNVdGlsaXR5LFxuICAgICAgICAgICAgLyogV2hlbiBWZWxvY2l0eSBpcyBjYWxsZWQgdmlhIHRoZSB1dGlsaXR5IGZ1bmN0aW9uICgkLlZlbG9jaXR5KCkvVmVsb2NpdHkoKSksIGVsZW1lbnRzIGFyZSBleHBsaWNpdGx5XG4gICAgICAgICAgICAgICBwYXNzZWQgaW4gYXMgdGhlIGZpcnN0IHBhcmFtZXRlci4gVGh1cywgYXJndW1lbnQgcG9zaXRpb25pbmcgdmFyaWVzLiBXZSBub3JtYWxpemUgdGhlbSBoZXJlLiAqL1xuICAgICAgICAgICAgZWxlbWVudHNXcmFwcGVkLFxuICAgICAgICAgICAgYXJndW1lbnRJbmRleDtcblxuICAgICAgICB2YXIgZWxlbWVudHMsXG4gICAgICAgICAgICBwcm9wZXJ0aWVzTWFwLFxuICAgICAgICAgICAgb3B0aW9ucztcblxuICAgICAgICAvKiBEZXRlY3QgalF1ZXJ5L1plcHRvIGVsZW1lbnRzIGJlaW5nIGFuaW1hdGVkIHZpYSB0aGUgJC5mbiBtZXRob2QuICovXG4gICAgICAgIGlmIChUeXBlLmlzV3JhcHBlZCh0aGlzKSkge1xuICAgICAgICAgICAgaXNVdGlsaXR5ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGFyZ3VtZW50SW5kZXggPSAwO1xuICAgICAgICAgICAgZWxlbWVudHMgPSB0aGlzO1xuICAgICAgICAgICAgZWxlbWVudHNXcmFwcGVkID0gdGhpcztcbiAgICAgICAgLyogT3RoZXJ3aXNlLCByYXcgZWxlbWVudHMgYXJlIGJlaW5nIGFuaW1hdGVkIHZpYSB0aGUgdXRpbGl0eSBmdW5jdGlvbi4gKi9cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlzVXRpbGl0eSA9IHRydWU7XG5cbiAgICAgICAgICAgIGFyZ3VtZW50SW5kZXggPSAxO1xuICAgICAgICAgICAgZWxlbWVudHMgPSBzeW50YWN0aWNTdWdhciA/IChhcmd1bWVudHNbMF0uZWxlbWVudHMgfHwgYXJndW1lbnRzWzBdLmUpIDogYXJndW1lbnRzWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudHMgPSBzYW5pdGl6ZUVsZW1lbnRzKGVsZW1lbnRzKTtcblxuICAgICAgICBpZiAoIWVsZW1lbnRzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3ludGFjdGljU3VnYXIpIHtcbiAgICAgICAgICAgIHByb3BlcnRpZXNNYXAgPSBhcmd1bWVudHNbMF0ucHJvcGVydGllcyB8fCBhcmd1bWVudHNbMF0ucDtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBhcmd1bWVudHNbMF0ub3B0aW9ucyB8fCBhcmd1bWVudHNbMF0ubztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByb3BlcnRpZXNNYXAgPSBhcmd1bWVudHNbYXJndW1lbnRJbmRleF07XG4gICAgICAgICAgICBvcHRpb25zID0gYXJndW1lbnRzW2FyZ3VtZW50SW5kZXggKyAxXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIFRoZSBsZW5ndGggb2YgdGhlIGVsZW1lbnQgc2V0IChpbiB0aGUgZm9ybSBvZiBhIG5vZGVMaXN0IG9yIGFuIGFycmF5IG9mIGVsZW1lbnRzKSBpcyBkZWZhdWx0ZWQgdG8gMSBpbiBjYXNlIGFcbiAgICAgICAgICAgc2luZ2xlIHJhdyBET00gZWxlbWVudCBpcyBwYXNzZWQgaW4gKHdoaWNoIGRvZXNuJ3QgY29udGFpbiBhIGxlbmd0aCBwcm9wZXJ0eSkuICovXG4gICAgICAgIHZhciBlbGVtZW50c0xlbmd0aCA9IGVsZW1lbnRzLmxlbmd0aCxcbiAgICAgICAgICAgIGVsZW1lbnRzSW5kZXggPSAwO1xuXG4gICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgIEFyZ3VtZW50IE92ZXJsb2FkaW5nXG4gICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAvKiBTdXBwb3J0IGlzIGluY2x1ZGVkIGZvciBqUXVlcnkncyBhcmd1bWVudCBvdmVybG9hZGluZzogJC5hbmltYXRlKHByb3BlcnR5TWFwIFssIGR1cmF0aW9uXSBbLCBlYXNpbmddIFssIGNvbXBsZXRlXSkuXG4gICAgICAgICAgIE92ZXJsb2FkaW5nIGlzIGRldGVjdGVkIGJ5IGNoZWNraW5nIGZvciB0aGUgYWJzZW5jZSBvZiBhbiBvYmplY3QgYmVpbmcgcGFzc2VkIGludG8gb3B0aW9ucy4gKi9cbiAgICAgICAgLyogTm90ZTogVGhlIHN0b3AgYW5kIGZpbmlzaCBhY3Rpb25zIGRvIG5vdCBhY2NlcHQgYW5pbWF0aW9uIG9wdGlvbnMsIGFuZCBhcmUgdGhlcmVmb3JlIGV4Y2x1ZGVkIGZyb20gdGhpcyBjaGVjay4gKi9cbiAgICAgICAgaWYgKCEvXihzdG9wfGZpbmlzaCkkL2kudGVzdChwcm9wZXJ0aWVzTWFwKSAmJiAhJC5pc1BsYWluT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICAvKiBUaGUgdXRpbGl0eSBmdW5jdGlvbiBzaGlmdHMgYWxsIGFyZ3VtZW50cyBvbmUgcG9zaXRpb24gdG8gdGhlIHJpZ2h0LCBzbyB3ZSBhZGp1c3QgZm9yIHRoYXQgb2Zmc2V0LiAqL1xuICAgICAgICAgICAgdmFyIHN0YXJ0aW5nQXJndW1lbnRQb3NpdGlvbiA9IGFyZ3VtZW50SW5kZXggKyAxO1xuXG4gICAgICAgICAgICBvcHRpb25zID0ge307XG5cbiAgICAgICAgICAgIC8qIEl0ZXJhdGUgdGhyb3VnaCBhbGwgb3B0aW9ucyBhcmd1bWVudHMgKi9cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBzdGFydGluZ0FyZ3VtZW50UG9zaXRpb247IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvKiBUcmVhdCBhIG51bWJlciBhcyBhIGR1cmF0aW9uLiBQYXJzZSBpdCBvdXQuICovXG4gICAgICAgICAgICAgICAgLyogTm90ZTogVGhlIGZvbGxvd2luZyBSZWdFeCB3aWxsIHJldHVybiB0cnVlIGlmIHBhc3NlZCBhbiBhcnJheSB3aXRoIGEgbnVtYmVyIGFzIGl0cyBmaXJzdCBpdGVtLlxuICAgICAgICAgICAgICAgICAgIFRodXMsIGFycmF5cyBhcmUgc2tpcHBlZCBmcm9tIHRoaXMgY2hlY2suICovXG4gICAgICAgICAgICAgICAgaWYgKCFUeXBlLmlzQXJyYXkoYXJndW1lbnRzW2ldKSAmJiAoL14oZmFzdHxub3JtYWx8c2xvdykkL2kudGVzdChhcmd1bWVudHNbaV0pIHx8IC9eXFxkLy50ZXN0KGFyZ3VtZW50c1tpXSkpKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZHVyYXRpb24gPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICAgICAgLyogVHJlYXQgc3RyaW5ncyBhbmQgYXJyYXlzIGFzIGVhc2luZ3MuICovXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChUeXBlLmlzU3RyaW5nKGFyZ3VtZW50c1tpXSkgfHwgVHlwZS5pc0FycmF5KGFyZ3VtZW50c1tpXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5lYXNpbmcgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICAgICAgLyogVHJlYXQgYSBmdW5jdGlvbiBhcyBhIGNvbXBsZXRlIGNhbGxiYWNrLiAqL1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoVHlwZS5pc0Z1bmN0aW9uKGFyZ3VtZW50c1tpXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5jb21wbGV0ZSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKioqKioqKioqKioqKioqXG4gICAgICAgICAgICBQcm9taXNlc1xuICAgICAgICAqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgdmFyIHByb21pc2VEYXRhID0ge1xuICAgICAgICAgICAgICAgIHByb21pc2U6IG51bGwsXG4gICAgICAgICAgICAgICAgcmVzb2x2ZXI6IG51bGwsXG4gICAgICAgICAgICAgICAgcmVqZWN0ZXI6IG51bGxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgLyogSWYgdGhpcyBjYWxsIHdhcyBtYWRlIHZpYSB0aGUgdXRpbGl0eSBmdW5jdGlvbiAod2hpY2ggaXMgdGhlIGRlZmF1bHQgbWV0aG9kIG9mIGludm9jYXRpb24gd2hlbiBqUXVlcnkvWmVwdG8gYXJlIG5vdCBiZWluZyB1c2VkKSwgYW5kIGlmXG4gICAgICAgICAgIHByb21pc2Ugc3VwcG9ydCB3YXMgZGV0ZWN0ZWQsIGNyZWF0ZSBhIHByb21pc2Ugb2JqZWN0IGZvciB0aGlzIGNhbGwgYW5kIHN0b3JlIHJlZmVyZW5jZXMgdG8gaXRzIHJlc29sdmVyIGFuZCByZWplY3RlciBtZXRob2RzLiBUaGUgcmVzb2x2ZVxuICAgICAgICAgICBtZXRob2QgaXMgdXNlZCB3aGVuIGEgY2FsbCBjb21wbGV0ZXMgbmF0dXJhbGx5IG9yIGlzIHByZW1hdHVyZWx5IHN0b3BwZWQgYnkgdGhlIHVzZXIuIEluIGJvdGggY2FzZXMsIGNvbXBsZXRlQ2FsbCgpIGhhbmRsZXMgdGhlIGFzc29jaWF0ZWRcbiAgICAgICAgICAgY2FsbCBjbGVhbnVwIGFuZCBwcm9taXNlIHJlc29sdmluZyBsb2dpYy4gVGhlIHJlamVjdCBtZXRob2QgaXMgdXNlZCB3aGVuIGFuIGludmFsaWQgc2V0IG9mIGFyZ3VtZW50cyBpcyBwYXNzZWQgaW50byBhIFZlbG9jaXR5IGNhbGwuICovXG4gICAgICAgIC8qIE5vdGU6IFZlbG9jaXR5IGVtcGxveXMgYSBjYWxsLWJhc2VkIHF1ZXVlaW5nIGFyY2hpdGVjdHVyZSwgd2hpY2ggbWVhbnMgdGhhdCBzdG9wcGluZyBhbiBhbmltYXRpbmcgZWxlbWVudCBhY3R1YWxseSBzdG9wcyB0aGUgZnVsbCBjYWxsIHRoYXRcbiAgICAgICAgICAgdHJpZ2dlcmVkIGl0IC0tIG5vdCB0aGF0IG9uZSBlbGVtZW50IGV4Y2x1c2l2ZWx5LiBTaW1pbGFybHksIHRoZXJlIGlzIG9uZSBwcm9taXNlIHBlciBjYWxsLCBhbmQgYWxsIGVsZW1lbnRzIHRhcmdldGVkIGJ5IGEgVmVsb2NpdHkgY2FsbCBhcmVcbiAgICAgICAgICAgZ3JvdXBlZCB0b2dldGhlciBmb3IgdGhlIHB1cnBvc2VzIG9mIHJlc29sdmluZyBhbmQgcmVqZWN0aW5nIGEgcHJvbWlzZS4gKi9cbiAgICAgICAgaWYgKGlzVXRpbGl0eSAmJiBWZWxvY2l0eS5Qcm9taXNlKSB7XG4gICAgICAgICAgICBwcm9taXNlRGF0YS5wcm9taXNlID0gbmV3IFZlbG9jaXR5LlByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgIHByb21pc2VEYXRhLnJlc29sdmVyID0gcmVzb2x2ZTtcbiAgICAgICAgICAgICAgICBwcm9taXNlRGF0YS5yZWplY3RlciA9IHJlamVjdDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICBBY3Rpb24gRGV0ZWN0aW9uXG4gICAgICAgICoqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAvKiBWZWxvY2l0eSdzIGJlaGF2aW9yIGlzIGNhdGVnb3JpemVkIGludG8gXCJhY3Rpb25zXCI6IEVsZW1lbnRzIGNhbiBlaXRoZXIgYmUgc3BlY2lhbGx5IHNjcm9sbGVkIGludG8gdmlldyxcbiAgICAgICAgICAgb3IgdGhleSBjYW4gYmUgc3RhcnRlZCwgc3RvcHBlZCwgb3IgcmV2ZXJzZWQuIElmIGEgbGl0ZXJhbCBvciByZWZlcmVuY2VkIHByb3BlcnRpZXMgbWFwIGlzIHBhc3NlZCBpbiBhcyBWZWxvY2l0eSdzXG4gICAgICAgICAgIGZpcnN0IGFyZ3VtZW50LCB0aGUgYXNzb2NpYXRlZCBhY3Rpb24gaXMgXCJzdGFydFwiLiBBbHRlcm5hdGl2ZWx5LCBcInNjcm9sbFwiLCBcInJldmVyc2VcIiwgb3IgXCJzdG9wXCIgY2FuIGJlIHBhc3NlZCBpbiBpbnN0ZWFkIG9mIGEgcHJvcGVydGllcyBtYXAuICovXG4gICAgICAgIHZhciBhY3Rpb247XG5cbiAgICAgICAgc3dpdGNoIChwcm9wZXJ0aWVzTWFwKSB7XG4gICAgICAgICAgICBjYXNlIFwic2Nyb2xsXCI6XG4gICAgICAgICAgICAgICAgYWN0aW9uID0gXCJzY3JvbGxcIjtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBcInJldmVyc2VcIjpcbiAgICAgICAgICAgICAgICBhY3Rpb24gPSBcInJldmVyc2VcIjtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBcImZpbmlzaFwiOlxuICAgICAgICAgICAgY2FzZSBcInN0b3BcIjpcbiAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICBBY3Rpb246IFN0b3BcbiAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgLyogQ2xlYXIgdGhlIGN1cnJlbnRseS1hY3RpdmUgZGVsYXkgb24gZWFjaCB0YXJnZXRlZCBlbGVtZW50LiAqL1xuICAgICAgICAgICAgICAgICQuZWFjaChlbGVtZW50cywgZnVuY3Rpb24oaSwgZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KSAmJiBEYXRhKGVsZW1lbnQpLmRlbGF5VGltZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFN0b3AgdGhlIHRpbWVyIGZyb20gdHJpZ2dlcmluZyBpdHMgY2FjaGVkIG5leHQoKSBmdW5jdGlvbi4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChEYXRhKGVsZW1lbnQpLmRlbGF5VGltZXIuc2V0VGltZW91dCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIE1hbnVhbGx5IGNhbGwgdGhlIG5leHQoKSBmdW5jdGlvbiBzbyB0aGF0IHRoZSBzdWJzZXF1ZW50IHF1ZXVlIGl0ZW1zIGNhbiBwcm9ncmVzcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpLmRlbGF5VGltZXIubmV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkuZGVsYXlUaW1lci5uZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBEYXRhKGVsZW1lbnQpLmRlbGF5VGltZXI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHZhciBjYWxsc1RvU3RvcCA9IFtdO1xuXG4gICAgICAgICAgICAgICAgLyogV2hlbiB0aGUgc3RvcCBhY3Rpb24gaXMgdHJpZ2dlcmVkLCB0aGUgZWxlbWVudHMnIGN1cnJlbnRseSBhY3RpdmUgY2FsbCBpcyBpbW1lZGlhdGVseSBzdG9wcGVkLiBUaGUgYWN0aXZlIGNhbGwgbWlnaHQgaGF2ZVxuICAgICAgICAgICAgICAgICAgIGJlZW4gYXBwbGllZCB0byBtdWx0aXBsZSBlbGVtZW50cywgaW4gd2hpY2ggY2FzZSBhbGwgb2YgdGhlIGNhbGwncyBlbGVtZW50cyB3aWxsIGJlIHN0b3BwZWQuIFdoZW4gYW4gZWxlbWVudFxuICAgICAgICAgICAgICAgICAgIGlzIHN0b3BwZWQsIHRoZSBuZXh0IGl0ZW0gaW4gaXRzIGFuaW1hdGlvbiBxdWV1ZSBpcyBpbW1lZGlhdGVseSB0cmlnZ2VyZWQuICovXG4gICAgICAgICAgICAgICAgLyogQW4gYWRkaXRpb25hbCBhcmd1bWVudCBtYXkgYmUgcGFzc2VkIGluIHRvIGNsZWFyIGFuIGVsZW1lbnQncyByZW1haW5pbmcgcXVldWVkIGNhbGxzLiBFaXRoZXIgdHJ1ZSAod2hpY2ggZGVmYXVsdHMgdG8gdGhlIFwiZnhcIiBxdWV1ZSlcbiAgICAgICAgICAgICAgICAgICBvciBhIGN1c3RvbSBxdWV1ZSBzdHJpbmcgY2FuIGJlIHBhc3NlZCBpbi4gKi9cbiAgICAgICAgICAgICAgICAvKiBOb3RlOiBUaGUgc3RvcCBjb21tYW5kIHJ1bnMgcHJpb3IgdG8gVmVsb2NpdHkncyBRdWV1ZWluZyBwaGFzZSBzaW5jZSBpdHMgYmVoYXZpb3IgaXMgaW50ZW5kZWQgdG8gdGFrZSBlZmZlY3QgKmltbWVkaWF0ZWx5KixcbiAgICAgICAgICAgICAgICAgICByZWdhcmRsZXNzIG9mIHRoZSBlbGVtZW50J3MgY3VycmVudCBxdWV1ZSBzdGF0ZS4gKi9cblxuICAgICAgICAgICAgICAgIC8qIEl0ZXJhdGUgdGhyb3VnaCBldmVyeSBhY3RpdmUgY2FsbC4gKi9cbiAgICAgICAgICAgICAgICAkLmVhY2goVmVsb2NpdHkuU3RhdGUuY2FsbHMsIGZ1bmN0aW9uKGksIGFjdGl2ZUNhbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogSW5hY3RpdmUgY2FsbHMgYXJlIHNldCB0byBmYWxzZSBieSB0aGUgbG9naWMgaW5zaWRlIGNvbXBsZXRlQ2FsbCgpLiBTa2lwIHRoZW0uICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChhY3RpdmVDYWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBJdGVyYXRlIHRocm91Z2ggdGhlIGFjdGl2ZSBjYWxsJ3MgdGFyZ2V0ZWQgZWxlbWVudHMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goYWN0aXZlQ2FsbFsxXSwgZnVuY3Rpb24oaywgYWN0aXZlRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRydWUgd2FzIHBhc3NlZCBpbiBhcyBhIHNlY29uZGFyeSBhcmd1bWVudCwgY2xlYXIgYWJzb2x1dGVseSBhbGwgY2FsbHMgb24gdGhpcyBlbGVtZW50LiBPdGhlcndpc2UsIG9ubHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhciBjYWxscyBhc3NvY2lhdGVkIHdpdGggdGhlIHJlbGV2YW50IHF1ZXVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENhbGwgc3RvcHBpbmcgbG9naWMgd29ya3MgYXMgZm9sbG93czpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIG9wdGlvbnMgPT09IHRydWUgLS0+IHN0b3AgY3VycmVudCBkZWZhdWx0IHF1ZXVlIGNhbGxzIChhbmQgcXVldWU6ZmFsc2UgY2FsbHMpLCBpbmNsdWRpbmcgcmVtYWluaW5nIHF1ZXVlZCBvbmVzLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0gb3B0aW9ucyA9PT0gdW5kZWZpbmVkIC0tPiBzdG9wIGN1cnJlbnQgcXVldWU6XCJcIiBjYWxsIGFuZCBhbGwgcXVldWU6ZmFsc2UgY2FsbHMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLSBvcHRpb25zID09PSBmYWxzZSAtLT4gc3RvcCBvbmx5IHF1ZXVlOmZhbHNlIGNhbGxzLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0gb3B0aW9ucyA9PT0gXCJjdXN0b21cIiAtLT4gc3RvcCBjdXJyZW50IHF1ZXVlOlwiY3VzdG9tXCIgY2FsbCwgaW5jbHVkaW5nIHJlbWFpbmluZyBxdWV1ZWQgb25lcyAodGhlcmUgaXMgbm8gZnVuY3Rpb25hbGl0eSB0byBvbmx5IGNsZWFyIHRoZSBjdXJyZW50bHktcnVubmluZyBxdWV1ZTpcImN1c3RvbVwiIGNhbGwpLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBxdWV1ZU5hbWUgPSAob3B0aW9ucyA9PT0gdW5kZWZpbmVkKSA/IFwiXCIgOiBvcHRpb25zO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXVlTmFtZSAhPT0gdHJ1ZSAmJiAoYWN0aXZlQ2FsbFsyXS5xdWV1ZSAhPT0gcXVldWVOYW1lKSAmJiAhKG9wdGlvbnMgPT09IHVuZGVmaW5lZCAmJiBhY3RpdmVDYWxsWzJdLnF1ZXVlID09PSBmYWxzZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSXRlcmF0ZSB0aHJvdWdoIHRoZSBjYWxscyB0YXJnZXRlZCBieSB0aGUgc3RvcCBjb21tYW5kLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChlbGVtZW50cywgZnVuY3Rpb24obCwgZWxlbWVudCkgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENoZWNrIHRoYXQgdGhpcyBjYWxsIHdhcyBhcHBsaWVkIHRvIHRoZSB0YXJnZXQgZWxlbWVudC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQgPT09IGFjdGl2ZUVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE9wdGlvbmFsbHkgY2xlYXIgdGhlIHJlbWFpbmluZyBxdWV1ZWQgY2FsbHMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucyA9PT0gdHJ1ZSB8fCBUeXBlLmlzU3RyaW5nKG9wdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSXRlcmF0ZSB0aHJvdWdoIHRoZSBpdGVtcyBpbiB0aGUgZWxlbWVudCdzIHF1ZXVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaCgkLnF1ZXVlKGVsZW1lbnQsIFR5cGUuaXNTdHJpbmcob3B0aW9ucykgPyBvcHRpb25zIDogXCJcIiksIGZ1bmN0aW9uKF8sIGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlIHF1ZXVlIGFycmF5IGNhbiBjb250YWluIGFuIFwiaW5wcm9ncmVzc1wiIHN0cmluZywgd2hpY2ggd2Ugc2tpcC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFR5cGUuaXNGdW5jdGlvbihpdGVtKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogUGFzcyB0aGUgaXRlbSdzIGNhbGxiYWNrIGEgZmxhZyBpbmRpY2F0aW5nIHRoYXQgd2Ugd2FudCB0byBhYm9ydCBmcm9tIHRoZSBxdWV1ZSBjYWxsLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKFNwZWNpZmljYWxseSwgdGhlIHF1ZXVlIHdpbGwgcmVzb2x2ZSB0aGUgY2FsbCdzIGFzc29jaWF0ZWQgcHJvbWlzZSB0aGVuIGFib3J0LikgICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtKG51bGwsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDbGVhcmluZyB0aGUgJC5xdWV1ZSgpIGFycmF5IGlzIGFjaGlldmVkIGJ5IHJlc2V0dGluZyBpdCB0byBbXS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLnF1ZXVlKGVsZW1lbnQsIFR5cGUuaXNTdHJpbmcob3B0aW9ucykgPyBvcHRpb25zIDogXCJcIiwgW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydGllc01hcCA9PT0gXCJzdG9wXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSBcInJldmVyc2VcIiB1c2VzIGNhY2hlZCBzdGFydCB2YWx1ZXMgKHRoZSBwcmV2aW91cyBjYWxsJ3MgZW5kVmFsdWVzKSwgdGhlc2UgdmFsdWVzIG11c3QgYmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VkIHRvIHJlZmxlY3QgdGhlIGZpbmFsIHZhbHVlIHRoYXQgdGhlIGVsZW1lbnRzIHdlcmUgYWN0dWFsbHkgdHdlZW5lZCB0by4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBJZiBvbmx5IHF1ZXVlOmZhbHNlIGFuaW1hdGlvbnMgYXJlIGN1cnJlbnRseSBydW5uaW5nIG9uIGFuIGVsZW1lbnQsIGl0IHdvbid0IGhhdmUgYSB0d2VlbnNDb250YWluZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QuIEFsc28sIHF1ZXVlOmZhbHNlIGFuaW1hdGlvbnMgY2FuJ3QgYmUgcmV2ZXJzZWQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkgJiYgRGF0YShlbGVtZW50KS50d2VlbnNDb250YWluZXIgJiYgcXVldWVOYW1lICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goRGF0YShlbGVtZW50KS50d2VlbnNDb250YWluZXIsIGZ1bmN0aW9uKG0sIGFjdGl2ZVR3ZWVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmVUd2Vlbi5lbmRWYWx1ZSA9IGFjdGl2ZVR3ZWVuLmN1cnJlbnRWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbHNUb1N0b3AucHVzaChpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydGllc01hcCA9PT0gXCJmaW5pc2hcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRvIGdldCBhY3RpdmUgdHdlZW5zIHRvIGZpbmlzaCBpbW1lZGlhdGVseSwgd2UgZm9yY2VmdWxseSBzaG9ydGVuIHRoZWlyIGR1cmF0aW9ucyB0byAxbXMgc28gdGhhdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZXkgZmluaXNoIHVwb24gdGhlIG5leHQgckFmIHRpY2sgdGhlbiBwcm9jZWVkIHdpdGggbm9ybWFsIGNhbGwgY29tcGxldGlvbiBsb2dpYy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmVDYWxsWzJdLmR1cmF0aW9uID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8qIFByZW1hdHVyZWx5IGNhbGwgY29tcGxldGVDYWxsKCkgb24gZWFjaCBtYXRjaGVkIGFjdGl2ZSBjYWxsLiBQYXNzIGFuIGFkZGl0aW9uYWwgZmxhZyBmb3IgXCJzdG9wXCIgdG8gaW5kaWNhdGVcbiAgICAgICAgICAgICAgICAgICB0aGF0IHRoZSBjb21wbGV0ZSBjYWxsYmFjayBhbmQgZGlzcGxheTpub25lIHNldHRpbmcgc2hvdWxkIGJlIHNraXBwZWQgc2luY2Ugd2UncmUgY29tcGxldGluZyBwcmVtYXR1cmVseS4gKi9cbiAgICAgICAgICAgICAgICBpZiAocHJvcGVydGllc01hcCA9PT0gXCJzdG9wXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGNhbGxzVG9TdG9wLCBmdW5jdGlvbihpLCBqKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZUNhbGwoaiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9taXNlRGF0YS5wcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBJbW1lZGlhdGVseSByZXNvbHZlIHRoZSBwcm9taXNlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHN0b3AgY2FsbCBzaW5jZSBzdG9wIHJ1bnMgc3luY2hyb25vdXNseS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VEYXRhLnJlc29sdmVyKGVsZW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qIFNpbmNlIHdlJ3JlIHN0b3BwaW5nLCBhbmQgbm90IHByb2NlZWRpbmcgd2l0aCBxdWV1ZWluZywgZXhpdCBvdXQgb2YgVmVsb2NpdHkuICovXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldENoYWluKCk7XG5cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgLyogVHJlYXQgYSBub24tZW1wdHkgcGxhaW4gb2JqZWN0IGFzIGEgbGl0ZXJhbCBwcm9wZXJ0aWVzIG1hcC4gKi9cbiAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHByb3BlcnRpZXNNYXApICYmICFUeXBlLmlzRW1wdHlPYmplY3QocHJvcGVydGllc01hcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gXCJzdGFydFwiO1xuXG4gICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgUmVkaXJlY3RzXG4gICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgIC8qIENoZWNrIGlmIGEgc3RyaW5nIG1hdGNoZXMgYSByZWdpc3RlcmVkIHJlZGlyZWN0IChzZWUgUmVkaXJlY3RzIGFib3ZlKS4gKi9cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFR5cGUuaXNTdHJpbmcocHJvcGVydGllc01hcCkgJiYgVmVsb2NpdHkuUmVkaXJlY3RzW3Byb3BlcnRpZXNNYXBdKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvcHRzID0gJC5leHRlbmQoe30sIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgZHVyYXRpb25PcmlnaW5hbCA9IG9wdHMuZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxheU9yaWdpbmFsID0gb3B0cy5kZWxheSB8fCAwO1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBiYWNrd2FyZHMgb3B0aW9uIHdhcyBwYXNzZWQgaW4sIHJldmVyc2UgdGhlIGVsZW1lbnQgc2V0IHNvIHRoYXQgZWxlbWVudHMgYW5pbWF0ZSBmcm9tIHRoZSBsYXN0IHRvIHRoZSBmaXJzdC4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMuYmFja3dhcmRzID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50cyA9ICQuZXh0ZW5kKHRydWUsIFtdLCBlbGVtZW50cykucmV2ZXJzZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLyogSW5kaXZpZHVhbGx5IHRyaWdnZXIgdGhlIHJlZGlyZWN0IGZvciBlYWNoIGVsZW1lbnQgaW4gdGhlIHNldCB0byBwcmV2ZW50IHVzZXJzIGZyb20gaGF2aW5nIHRvIGhhbmRsZSBpdGVyYXRpb24gbG9naWMgaW4gdGhlaXIgcmVkaXJlY3QuICovXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChlbGVtZW50cywgZnVuY3Rpb24oZWxlbWVudEluZGV4LCBlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgc3RhZ2dlciBvcHRpb24gd2FzIHBhc3NlZCBpbiwgc3VjY2Vzc2l2ZWx5IGRlbGF5IGVhY2ggZWxlbWVudCBieSB0aGUgc3RhZ2dlciB2YWx1ZSAoaW4gbXMpLiBSZXRhaW4gdGhlIG9yaWdpbmFsIGRlbGF5IHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlRmxvYXQob3B0cy5zdGFnZ2VyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMuZGVsYXkgPSBkZWxheU9yaWdpbmFsICsgKHBhcnNlRmxvYXQob3B0cy5zdGFnZ2VyKSAqIGVsZW1lbnRJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFR5cGUuaXNGdW5jdGlvbihvcHRzLnN0YWdnZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0cy5kZWxheSA9IGRlbGF5T3JpZ2luYWwgKyBvcHRzLnN0YWdnZXIuY2FsbChlbGVtZW50LCBlbGVtZW50SW5kZXgsIGVsZW1lbnRzTGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGRyYWcgb3B0aW9uIHdhcyBwYXNzZWQgaW4sIHN1Y2Nlc3NpdmVseSBpbmNyZWFzZS9kZWNyZWFzZSAoZGVwZW5kaW5nIG9uIHRoZSBwcmVzZW5zZSBvZiBvcHRzLmJhY2t3YXJkcylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBkdXJhdGlvbiBvZiBlYWNoIGVsZW1lbnQncyBhbmltYXRpb24sIHVzaW5nIGZsb29ycyB0byBwcmV2ZW50IHByb2R1Y2luZyB2ZXJ5IHNob3J0IGR1cmF0aW9ucy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLmRyYWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBEZWZhdWx0IHRoZSBkdXJhdGlvbiBvZiBVSSBwYWNrIGVmZmVjdHMgKGNhbGxvdXRzIGFuZCB0cmFuc2l0aW9ucykgdG8gMTAwMG1zIGluc3RlYWQgb2YgdGhlIHVzdWFsIGRlZmF1bHQgZHVyYXRpb24gb2YgNDAwbXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0cy5kdXJhdGlvbiA9IHBhcnNlRmxvYXQoZHVyYXRpb25PcmlnaW5hbCkgfHwgKC9eKGNhbGxvdXR8dHJhbnNpdGlvbikvLnRlc3QocHJvcGVydGllc01hcCkgPyAxMDAwIDogRFVSQVRJT05fREVGQVVMVCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBGb3IgZWFjaCBlbGVtZW50LCB0YWtlIHRoZSBncmVhdGVyIGR1cmF0aW9uIG9mOiBBKSBhbmltYXRpb24gY29tcGxldGlvbiBwZXJjZW50YWdlIHJlbGF0aXZlIHRvIHRoZSBvcmlnaW5hbCBkdXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCKSA3NSUgb2YgdGhlIG9yaWdpbmFsIGR1cmF0aW9uLCBvciBDKSBhIDIwMG1zIGZhbGxiYWNrIChpbiBjYXNlIGR1cmF0aW9uIGlzIGFscmVhZHkgc2V0IHRvIGEgbG93IHZhbHVlKS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUaGUgZW5kIHJlc3VsdCBpcyBhIGJhc2VsaW5lIG9mIDc1JSBvZiB0aGUgcmVkaXJlY3QncyBkdXJhdGlvbiB0aGF0IGluY3JlYXNlcy9kZWNyZWFzZXMgYXMgdGhlIGVuZCBvZiB0aGUgZWxlbWVudCBzZXQgaXMgYXBwcm9hY2hlZC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmR1cmF0aW9uID0gTWF0aC5tYXgob3B0cy5kdXJhdGlvbiAqIChvcHRzLmJhY2t3YXJkcyA/IDEgLSBlbGVtZW50SW5kZXgvZWxlbWVudHNMZW5ndGggOiAoZWxlbWVudEluZGV4ICsgMSkgLyBlbGVtZW50c0xlbmd0aCksIG9wdHMuZHVyYXRpb24gKiAwLjc1LCAyMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBQYXNzIGluIHRoZSBjYWxsJ3Mgb3B0cyBvYmplY3Qgc28gdGhhdCB0aGUgcmVkaXJlY3QgY2FuIG9wdGlvbmFsbHkgZXh0ZW5kIGl0LiBJdCBkZWZhdWx0cyB0byBhbiBlbXB0eSBvYmplY3QgaW5zdGVhZCBvZiBudWxsIHRvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICByZWR1Y2UgdGhlIG9wdHMgY2hlY2tpbmcgbG9naWMgcmVxdWlyZWQgaW5zaWRlIHRoZSByZWRpcmVjdC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LlJlZGlyZWN0c1twcm9wZXJ0aWVzTWFwXS5jYWxsKGVsZW1lbnQsIGVsZW1lbnQsIG9wdHMgfHwge30sIGVsZW1lbnRJbmRleCwgZWxlbWVudHNMZW5ndGgsIGVsZW1lbnRzLCBwcm9taXNlRGF0YS5wcm9taXNlID8gcHJvbWlzZURhdGEgOiB1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSB0aGUgYW5pbWF0aW9uIGxvZ2ljIHJlc2lkZXMgd2l0aGluIHRoZSByZWRpcmVjdCdzIG93biBjb2RlLCBhYm9ydCB0aGUgcmVtYWluZGVyIG9mIHRoaXMgY2FsbC5cbiAgICAgICAgICAgICAgICAgICAgICAgKFRoZSBwZXJmb3JtYW5jZSBvdmVyaGVhZCB1cCB0byB0aGlzIHBvaW50IGlzIHZpcnR1YWxseSBub24tZXhpc3RhbnQuKSAqL1xuICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBUaGUgalF1ZXJ5IGNhbGwgY2hhaW4gaXMga2VwdCBpbnRhY3QgYnkgcmV0dXJuaW5nIHRoZSBjb21wbGV0ZSBlbGVtZW50IHNldC4gKi9cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdldENoYWluKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFib3J0RXJyb3IgPSBcIlZlbG9jaXR5OiBGaXJzdCBhcmd1bWVudCAoXCIgKyBwcm9wZXJ0aWVzTWFwICsgXCIpIHdhcyBub3QgYSBwcm9wZXJ0eSBtYXAsIGEga25vd24gYWN0aW9uLCBvciBhIHJlZ2lzdGVyZWQgcmVkaXJlY3QuIEFib3J0aW5nLlwiO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9taXNlRGF0YS5wcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlRGF0YS5yZWplY3RlcihuZXcgRXJyb3IoYWJvcnRFcnJvcikpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYWJvcnRFcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2V0Q2hhaW4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgIENhbGwtV2lkZSBWYXJpYWJsZXNcbiAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgLyogQSBjb250YWluZXIgZm9yIENTUyB1bml0IGNvbnZlcnNpb24gcmF0aW9zIChlLmcuICUsIHJlbSwgYW5kIGVtID09PiBweCkgdGhhdCBpcyB1c2VkIHRvIGNhY2hlIHJhdGlvcyBhY3Jvc3MgYWxsIGVsZW1lbnRzXG4gICAgICAgICAgIGJlaW5nIGFuaW1hdGVkIGluIGEgc2luZ2xlIFZlbG9jaXR5IGNhbGwuIENhbGN1bGF0aW5nIHVuaXQgcmF0aW9zIG5lY2Vzc2l0YXRlcyBET00gcXVlcnlpbmcgYW5kIHVwZGF0aW5nLCBhbmQgaXMgdGhlcmVmb3JlXG4gICAgICAgICAgIGF2b2lkZWQgKHZpYSBjYWNoaW5nKSB3aGVyZXZlciBwb3NzaWJsZS4gVGhpcyBjb250YWluZXIgaXMgY2FsbC13aWRlIGluc3RlYWQgb2YgcGFnZS13aWRlIHRvIGF2b2lkIHRoZSByaXNrIG9mIHVzaW5nIHN0YWxlXG4gICAgICAgICAgIGNvbnZlcnNpb24gbWV0cmljcyBhY3Jvc3MgVmVsb2NpdHkgYW5pbWF0aW9ucyB0aGF0IGFyZSBub3QgaW1tZWRpYXRlbHkgY29uc2VjdXRpdmVseSBjaGFpbmVkLiAqL1xuICAgICAgICB2YXIgY2FsbFVuaXRDb252ZXJzaW9uRGF0YSA9IHtcbiAgICAgICAgICAgICAgICBsYXN0UGFyZW50OiBudWxsLFxuICAgICAgICAgICAgICAgIGxhc3RQb3NpdGlvbjogbnVsbCxcbiAgICAgICAgICAgICAgICBsYXN0Rm9udFNpemU6IG51bGwsXG4gICAgICAgICAgICAgICAgbGFzdFBlcmNlbnRUb1B4V2lkdGg6IG51bGwsXG4gICAgICAgICAgICAgICAgbGFzdFBlcmNlbnRUb1B4SGVpZ2h0OiBudWxsLFxuICAgICAgICAgICAgICAgIGxhc3RFbVRvUHg6IG51bGwsXG4gICAgICAgICAgICAgICAgcmVtVG9QeDogbnVsbCxcbiAgICAgICAgICAgICAgICB2d1RvUHg6IG51bGwsXG4gICAgICAgICAgICAgICAgdmhUb1B4OiBudWxsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIC8qIEEgY29udGFpbmVyIGZvciBhbGwgdGhlIGVuc3VpbmcgdHdlZW4gZGF0YSBhbmQgbWV0YWRhdGEgYXNzb2NpYXRlZCB3aXRoIHRoaXMgY2FsbC4gVGhpcyBjb250YWluZXIgZ2V0cyBwdXNoZWQgdG8gdGhlIHBhZ2Utd2lkZVxuICAgICAgICAgICBWZWxvY2l0eS5TdGF0ZS5jYWxscyBhcnJheSB0aGF0IGlzIHByb2Nlc3NlZCBkdXJpbmcgYW5pbWF0aW9uIHRpY2tpbmcuICovXG4gICAgICAgIHZhciBjYWxsID0gW107XG5cbiAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICBFbGVtZW50IFByb2Nlc3NpbmdcbiAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgIC8qIEVsZW1lbnQgcHJvY2Vzc2luZyBjb25zaXN0cyBvZiB0aHJlZSBwYXJ0cyAtLSBkYXRhIHByb2Nlc3NpbmcgdGhhdCBjYW5ub3QgZ28gc3RhbGUgYW5kIGRhdGEgcHJvY2Vzc2luZyB0aGF0ICpjYW4qIGdvIHN0YWxlIChpLmUuIHRoaXJkLXBhcnR5IHN0eWxlIG1vZGlmaWNhdGlvbnMpOlxuICAgICAgICAgICAxKSBQcmUtUXVldWVpbmc6IEVsZW1lbnQtd2lkZSB2YXJpYWJsZXMsIGluY2x1ZGluZyB0aGUgZWxlbWVudCdzIGRhdGEgc3RvcmFnZSwgYXJlIGluc3RhbnRpYXRlZC4gQ2FsbCBvcHRpb25zIGFyZSBwcmVwYXJlZC4gSWYgdHJpZ2dlcmVkLCB0aGUgU3RvcCBhY3Rpb24gaXMgZXhlY3V0ZWQuXG4gICAgICAgICAgIDIpIFF1ZXVlaW5nOiBUaGUgbG9naWMgdGhhdCBydW5zIG9uY2UgdGhpcyBjYWxsIGhhcyByZWFjaGVkIGl0cyBwb2ludCBvZiBleGVjdXRpb24gaW4gdGhlIGVsZW1lbnQncyAkLnF1ZXVlKCkgc3RhY2suIE1vc3QgbG9naWMgaXMgcGxhY2VkIGhlcmUgdG8gYXZvaWQgcmlza2luZyBpdCBiZWNvbWluZyBzdGFsZS5cbiAgICAgICAgICAgMykgUHVzaGluZzogQ29uc29saWRhdGlvbiBvZiB0aGUgdHdlZW4gZGF0YSBmb2xsb3dlZCBieSBpdHMgcHVzaCBvbnRvIHRoZSBnbG9iYWwgaW4tcHJvZ3Jlc3MgY2FsbHMgY29udGFpbmVyLlxuICAgICAgICAqL1xuXG4gICAgICAgIGZ1bmN0aW9uIHByb2Nlc3NFbGVtZW50ICgpIHtcblxuICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgIFBhcnQgSTogUHJlLVF1ZXVlaW5nXG4gICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICBFbGVtZW50LVdpZGUgVmFyaWFibGVzXG4gICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgIHZhciBlbGVtZW50ID0gdGhpcyxcbiAgICAgICAgICAgICAgICAvKiBUaGUgcnVudGltZSBvcHRzIG9iamVjdCBpcyB0aGUgZXh0ZW5zaW9uIG9mIHRoZSBjdXJyZW50IGNhbGwncyBvcHRpb25zIGFuZCBWZWxvY2l0eSdzIHBhZ2Utd2lkZSBvcHRpb24gZGVmYXVsdHMuICovXG4gICAgICAgICAgICAgICAgb3B0cyA9ICQuZXh0ZW5kKHt9LCBWZWxvY2l0eS5kZWZhdWx0cywgb3B0aW9ucyksXG4gICAgICAgICAgICAgICAgLyogQSBjb250YWluZXIgZm9yIHRoZSBwcm9jZXNzZWQgZGF0YSBhc3NvY2lhdGVkIHdpdGggZWFjaCBwcm9wZXJ0eSBpbiB0aGUgcHJvcGVydHlNYXAuXG4gICAgICAgICAgICAgICAgICAgKEVhY2ggcHJvcGVydHkgaW4gdGhlIG1hcCBwcm9kdWNlcyBpdHMgb3duIFwidHdlZW5cIi4pICovXG4gICAgICAgICAgICAgICAgdHdlZW5zQ29udGFpbmVyID0ge30sXG4gICAgICAgICAgICAgICAgZWxlbWVudFVuaXRDb252ZXJzaW9uRGF0YTtcblxuICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgRWxlbWVudCBJbml0XG4gICAgICAgICAgICAqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBWZWxvY2l0eS5pbml0KGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICBPcHRpb246IERlbGF5XG4gICAgICAgICAgICAqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgIC8qIFNpbmNlIHF1ZXVlOmZhbHNlIGRvZXNuJ3QgcmVzcGVjdCB0aGUgaXRlbSdzIGV4aXN0aW5nIHF1ZXVlLCB3ZSBhdm9pZCBpbmplY3RpbmcgaXRzIGRlbGF5IGhlcmUgKGl0J3Mgc2V0IGxhdGVyIG9uKS4gKi9cbiAgICAgICAgICAgIC8qIE5vdGU6IFZlbG9jaXR5IHJvbGxzIGl0cyBvd24gZGVsYXkgZnVuY3Rpb24gc2luY2UgalF1ZXJ5IGRvZXNuJ3QgaGF2ZSBhIHV0aWxpdHkgYWxpYXMgZm9yICQuZm4uZGVsYXkoKVxuICAgICAgICAgICAgICAgKGFuZCB0aHVzIHJlcXVpcmVzIGpRdWVyeSBlbGVtZW50IGNyZWF0aW9uLCB3aGljaCB3ZSBhdm9pZCBzaW5jZSBpdHMgb3ZlcmhlYWQgaW5jbHVkZXMgRE9NIHF1ZXJ5aW5nKS4gKi9cbiAgICAgICAgICAgIGlmIChwYXJzZUZsb2F0KG9wdHMuZGVsYXkpICYmIG9wdHMucXVldWUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgJC5xdWV1ZShlbGVtZW50LCBvcHRzLnF1ZXVlLCBmdW5jdGlvbihuZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIFRoaXMgaXMgYSBmbGFnIHVzZWQgdG8gaW5kaWNhdGUgdG8gdGhlIHVwY29taW5nIGNvbXBsZXRlQ2FsbCgpIGZ1bmN0aW9uIHRoYXQgdGhpcyBxdWV1ZSBlbnRyeSB3YXMgaW5pdGlhdGVkIGJ5IFZlbG9jaXR5LiBTZWUgY29tcGxldGVDYWxsKCkgZm9yIGZ1cnRoZXIgZGV0YWlscy4gKi9cbiAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkudmVsb2NpdHlRdWV1ZUVudHJ5RmxhZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgLyogVGhlIGVuc3VpbmcgcXVldWUgaXRlbSAod2hpY2ggaXMgYXNzaWduZWQgdG8gdGhlIFwibmV4dFwiIGFyZ3VtZW50IHRoYXQgJC5xdWV1ZSgpIGF1dG9tYXRpY2FsbHkgcGFzc2VzIGluKSB3aWxsIGJlIHRyaWdnZXJlZCBhZnRlciBhIHNldFRpbWVvdXQgZGVsYXkuXG4gICAgICAgICAgICAgICAgICAgICAgIFRoZSBzZXRUaW1lb3V0IGlzIHN0b3JlZCBzbyB0aGF0IGl0IGNhbiBiZSBzdWJqZWN0ZWQgdG8gY2xlYXJUaW1lb3V0KCkgaWYgdGhpcyBhbmltYXRpb24gaXMgcHJlbWF0dXJlbHkgc3RvcHBlZCB2aWEgVmVsb2NpdHkncyBcInN0b3BcIiBjb21tYW5kLiAqL1xuICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLmRlbGF5VGltZXIgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0OiBzZXRUaW1lb3V0KG5leHQsIHBhcnNlRmxvYXQob3B0cy5kZWxheSkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dDogbmV4dFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICBPcHRpb246IER1cmF0aW9uXG4gICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgIC8qIFN1cHBvcnQgZm9yIGpRdWVyeSdzIG5hbWVkIGR1cmF0aW9ucy4gKi9cbiAgICAgICAgICAgIHN3aXRjaCAob3B0cy5kdXJhdGlvbi50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiZmFzdFwiOlxuICAgICAgICAgICAgICAgICAgICBvcHRzLmR1cmF0aW9uID0gMjAwO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgXCJub3JtYWxcIjpcbiAgICAgICAgICAgICAgICAgICAgb3B0cy5kdXJhdGlvbiA9IERVUkFUSU9OX0RFRkFVTFQ7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBcInNsb3dcIjpcbiAgICAgICAgICAgICAgICAgICAgb3B0cy5kdXJhdGlvbiA9IDYwMDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAvKiBSZW1vdmUgdGhlIHBvdGVudGlhbCBcIm1zXCIgc3VmZml4IGFuZCBkZWZhdWx0IHRvIDEgaWYgdGhlIHVzZXIgaXMgYXR0ZW1wdGluZyB0byBzZXQgYSBkdXJhdGlvbiBvZiAwIChpbiBvcmRlciB0byBwcm9kdWNlIGFuIGltbWVkaWF0ZSBzdHlsZSBjaGFuZ2UpLiAqL1xuICAgICAgICAgICAgICAgICAgICBvcHRzLmR1cmF0aW9uID0gcGFyc2VGbG9hdChvcHRzLmR1cmF0aW9uKSB8fCAxO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICBHbG9iYWwgT3B0aW9uOiBNb2NrXG4gICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgIGlmIChWZWxvY2l0eS5tb2NrICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIC8qIEluIG1vY2sgbW9kZSwgYWxsIGFuaW1hdGlvbnMgYXJlIGZvcmNlZCB0byAxbXMgc28gdGhhdCB0aGV5IG9jY3VyIGltbWVkaWF0ZWx5IHVwb24gdGhlIG5leHQgckFGIHRpY2suXG4gICAgICAgICAgICAgICAgICAgQWx0ZXJuYXRpdmVseSwgYSBtdWx0aXBsaWVyIGNhbiBiZSBwYXNzZWQgaW4gdG8gdGltZSByZW1hcCBhbGwgZGVsYXlzIGFuZCBkdXJhdGlvbnMuICovXG4gICAgICAgICAgICAgICAgaWYgKFZlbG9jaXR5Lm1vY2sgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0cy5kdXJhdGlvbiA9IG9wdHMuZGVsYXkgPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdHMuZHVyYXRpb24gKj0gcGFyc2VGbG9hdChWZWxvY2l0eS5tb2NrKSB8fCAxO1xuICAgICAgICAgICAgICAgICAgICBvcHRzLmRlbGF5ICo9IHBhcnNlRmxvYXQoVmVsb2NpdHkubW9jaykgfHwgMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICBPcHRpb246IEVhc2luZ1xuICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgb3B0cy5lYXNpbmcgPSBnZXRFYXNpbmcob3B0cy5lYXNpbmcsIG9wdHMuZHVyYXRpb24pO1xuXG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgT3B0aW9uOiBDYWxsYmFja3NcbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgIC8qIENhbGxiYWNrcyBtdXN0IGZ1bmN0aW9ucy4gT3RoZXJ3aXNlLCBkZWZhdWx0IHRvIG51bGwuICovXG4gICAgICAgICAgICBpZiAob3B0cy5iZWdpbiAmJiAhVHlwZS5pc0Z1bmN0aW9uKG9wdHMuYmVnaW4pKSB7XG4gICAgICAgICAgICAgICAgb3B0cy5iZWdpbiA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvcHRzLnByb2dyZXNzICYmICFUeXBlLmlzRnVuY3Rpb24ob3B0cy5wcm9ncmVzcykpIHtcbiAgICAgICAgICAgICAgICBvcHRzLnByb2dyZXNzID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9wdHMuY29tcGxldGUgJiYgIVR5cGUuaXNGdW5jdGlvbihvcHRzLmNvbXBsZXRlKSkge1xuICAgICAgICAgICAgICAgIG9wdHMuY29tcGxldGUgPSBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICBPcHRpb246IERpc3BsYXkgJiBWaXNpYmlsaXR5XG4gICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgIC8qIFJlZmVyIHRvIFZlbG9jaXR5J3MgZG9jdW1lbnRhdGlvbiAoVmVsb2NpdHlKUy5vcmcvI2Rpc3BsYXlBbmRWaXNpYmlsaXR5KSBmb3IgYSBkZXNjcmlwdGlvbiBvZiB0aGUgZGlzcGxheSBhbmQgdmlzaWJpbGl0eSBvcHRpb25zJyBiZWhhdmlvci4gKi9cbiAgICAgICAgICAgIC8qIE5vdGU6IFdlIHN0cmljdGx5IGNoZWNrIGZvciB1bmRlZmluZWQgaW5zdGVhZCBvZiBmYWxzaW5lc3MgYmVjYXVzZSBkaXNwbGF5IGFjY2VwdHMgYW4gZW1wdHkgc3RyaW5nIHZhbHVlLiAqL1xuICAgICAgICAgICAgaWYgKG9wdHMuZGlzcGxheSAhPT0gdW5kZWZpbmVkICYmIG9wdHMuZGlzcGxheSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG9wdHMuZGlzcGxheSA9IG9wdHMuZGlzcGxheS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICAgICAgICAvKiBVc2VycyBjYW4gcGFzcyBpbiBhIHNwZWNpYWwgXCJhdXRvXCIgdmFsdWUgdG8gaW5zdHJ1Y3QgVmVsb2NpdHkgdG8gc2V0IHRoZSBlbGVtZW50IHRvIGl0cyBkZWZhdWx0IGRpc3BsYXkgdmFsdWUuICovXG4gICAgICAgICAgICAgICAgaWYgKG9wdHMuZGlzcGxheSA9PT0gXCJhdXRvXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0cy5kaXNwbGF5ID0gVmVsb2NpdHkuQ1NTLlZhbHVlcy5nZXREaXNwbGF5VHlwZShlbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvcHRzLnZpc2liaWxpdHkgIT09IHVuZGVmaW5lZCAmJiBvcHRzLnZpc2liaWxpdHkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBvcHRzLnZpc2liaWxpdHkgPSBvcHRzLnZpc2liaWxpdHkudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgT3B0aW9uOiBtb2JpbGVIQVxuICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgLyogV2hlbiBzZXQgdG8gdHJ1ZSwgYW5kIGlmIHRoaXMgaXMgYSBtb2JpbGUgZGV2aWNlLCBtb2JpbGVIQSBhdXRvbWF0aWNhbGx5IGVuYWJsZXMgaGFyZHdhcmUgYWNjZWxlcmF0aW9uICh2aWEgYSBudWxsIHRyYW5zZm9ybSBoYWNrKVxuICAgICAgICAgICAgICAgb24gYW5pbWF0aW5nIGVsZW1lbnRzLiBIQSBpcyByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQgYXQgdGhlIGNvbXBsZXRpb24gb2YgaXRzIGFuaW1hdGlvbi4gKi9cbiAgICAgICAgICAgIC8qIE5vdGU6IEFuZHJvaWQgR2luZ2VyYnJlYWQgZG9lc24ndCBzdXBwb3J0IEhBLiBJZiBhIG51bGwgdHJhbnNmb3JtIGhhY2sgKG1vYmlsZUhBKSBpcyBpbiBmYWN0IHNldCwgaXQgd2lsbCBwcmV2ZW50IG90aGVyIHRyYW5mb3JtIHN1YnByb3BlcnRpZXMgZnJvbSB0YWtpbmcgZWZmZWN0LiAqL1xuICAgICAgICAgICAgLyogTm90ZTogWW91IGNhbiByZWFkIG1vcmUgYWJvdXQgdGhlIHVzZSBvZiBtb2JpbGVIQSBpbiBWZWxvY2l0eSdzIGRvY3VtZW50YXRpb246IFZlbG9jaXR5SlMub3JnLyNtb2JpbGVIQS4gKi9cbiAgICAgICAgICAgIG9wdHMubW9iaWxlSEEgPSAob3B0cy5tb2JpbGVIQSAmJiBWZWxvY2l0eS5TdGF0ZS5pc01vYmlsZSAmJiAhVmVsb2NpdHkuU3RhdGUuaXNHaW5nZXJicmVhZCk7XG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgUGFydCBJSTogUXVldWVpbmdcbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAvKiBXaGVuIGEgc2V0IG9mIGVsZW1lbnRzIGlzIHRhcmdldGVkIGJ5IGEgVmVsb2NpdHkgY2FsbCwgdGhlIHNldCBpcyBicm9rZW4gdXAgYW5kIGVhY2ggZWxlbWVudCBoYXMgdGhlIGN1cnJlbnQgVmVsb2NpdHkgY2FsbCBpbmRpdmlkdWFsbHkgcXVldWVkIG9udG8gaXQuXG4gICAgICAgICAgICAgICBJbiB0aGlzIHdheSwgZWFjaCBlbGVtZW50J3MgZXhpc3RpbmcgcXVldWUgaXMgcmVzcGVjdGVkOyBzb21lIGVsZW1lbnRzIG1heSBhbHJlYWR5IGJlIGFuaW1hdGluZyBhbmQgYWNjb3JkaW5nbHkgc2hvdWxkIG5vdCBoYXZlIHRoaXMgY3VycmVudCBWZWxvY2l0eSBjYWxsIHRyaWdnZXJlZCBpbW1lZGlhdGVseS4gKi9cbiAgICAgICAgICAgIC8qIEluIGVhY2ggcXVldWUsIHR3ZWVuIGRhdGEgaXMgcHJvY2Vzc2VkIGZvciBlYWNoIGFuaW1hdGluZyBwcm9wZXJ0eSB0aGVuIHB1c2hlZCBvbnRvIHRoZSBjYWxsLXdpZGUgY2FsbHMgYXJyYXkuIFdoZW4gdGhlIGxhc3QgZWxlbWVudCBpbiB0aGUgc2V0IGhhcyBoYWQgaXRzIHR3ZWVucyBwcm9jZXNzZWQsXG4gICAgICAgICAgICAgICB0aGUgY2FsbCBhcnJheSBpcyBwdXNoZWQgdG8gVmVsb2NpdHkuU3RhdGUuY2FsbHMgZm9yIGxpdmUgcHJvY2Vzc2luZyBieSB0aGUgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHRpY2suICovXG4gICAgICAgICAgICBmdW5jdGlvbiBidWlsZFF1ZXVlIChuZXh0KSB7XG5cbiAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgIE9wdGlvbjogQmVnaW5cbiAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgLyogVGhlIGJlZ2luIGNhbGxiYWNrIGlzIGZpcmVkIG9uY2UgcGVyIGNhbGwgLS0gbm90IG9uY2UgcGVyIGVsZW1lbmV0IC0tIGFuZCBpcyBwYXNzZWQgdGhlIGZ1bGwgcmF3IERPTSBlbGVtZW50IHNldCBhcyBib3RoIGl0cyBjb250ZXh0IGFuZCBpdHMgZmlyc3QgYXJndW1lbnQuICovXG4gICAgICAgICAgICAgICAgaWYgKG9wdHMuYmVnaW4gJiYgZWxlbWVudHNJbmRleCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAvKiBXZSB0aHJvdyBjYWxsYmFja3MgaW4gYSBzZXRUaW1lb3V0IHNvIHRoYXQgdGhyb3duIGVycm9ycyBkb24ndCBoYWx0IHRoZSBleGVjdXRpb24gb2YgVmVsb2NpdHkgaXRzZWxmLiAqL1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3B0cy5iZWdpbi5jYWxsKGVsZW1lbnRzLCBlbGVtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyB0aHJvdyBlcnJvcjsgfSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICBUd2VlbiBEYXRhIENvbnN0cnVjdGlvbiAoZm9yIFNjcm9sbClcbiAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgIC8qIE5vdGU6IEluIG9yZGVyIHRvIGJlIHN1YmplY3RlZCB0byBjaGFpbmluZyBhbmQgYW5pbWF0aW9uIG9wdGlvbnMsIHNjcm9sbCdzIHR3ZWVuaW5nIGlzIHJvdXRlZCB0aHJvdWdoIFZlbG9jaXR5IGFzIGlmIGl0IHdlcmUgYSBzdGFuZGFyZCBDU1MgcHJvcGVydHkgYW5pbWF0aW9uLiAqL1xuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24gPT09IFwic2Nyb2xsXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogVGhlIHNjcm9sbCBhY3Rpb24gdW5pcXVlbHkgdGFrZXMgYW4gb3B0aW9uYWwgXCJvZmZzZXRcIiBvcHRpb24gLS0gc3BlY2lmaWVkIGluIHBpeGVscyAtLSB0aGF0IG9mZnNldHMgdGhlIHRhcmdldGVkIHNjcm9sbCBwb3NpdGlvbi4gKi9cbiAgICAgICAgICAgICAgICAgICAgdmFyIHNjcm9sbERpcmVjdGlvbiA9ICgvXngkL2kudGVzdChvcHRzLmF4aXMpID8gXCJMZWZ0XCIgOiBcIlRvcFwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbE9mZnNldCA9IHBhcnNlRmxvYXQob3B0cy5vZmZzZXQpIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbkN1cnJlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbkN1cnJlbnRBbHRlcm5hdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbkVuZDtcblxuICAgICAgICAgICAgICAgICAgICAvKiBTY3JvbGwgYWxzbyB1bmlxdWVseSB0YWtlcyBhbiBvcHRpb25hbCBcImNvbnRhaW5lclwiIG9wdGlvbiwgd2hpY2ggaW5kaWNhdGVzIHRoZSBwYXJlbnQgZWxlbWVudCB0aGF0IHNob3VsZCBiZSBzY3JvbGxlZCAtLVxuICAgICAgICAgICAgICAgICAgICAgICBhcyBvcHBvc2VkIHRvIHRoZSBicm93c2VyIHdpbmRvdyBpdHNlbGYuIFRoaXMgaXMgdXNlZnVsIGZvciBzY3JvbGxpbmcgdG93YXJkIGFuIGVsZW1lbnQgdGhhdCdzIGluc2lkZSBhbiBvdmVyZmxvd2luZyBwYXJlbnQgZWxlbWVudC4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMuY29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBFbnN1cmUgdGhhdCBlaXRoZXIgYSBqUXVlcnkgb2JqZWN0IG9yIGEgcmF3IERPTSBlbGVtZW50IHdhcyBwYXNzZWQgaW4uICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoVHlwZS5pc1dyYXBwZWQob3B0cy5jb250YWluZXIpIHx8IFR5cGUuaXNOb2RlKG9wdHMuY29udGFpbmVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEV4dHJhY3QgdGhlIHJhdyBET00gZWxlbWVudCBmcm9tIHRoZSBqUXVlcnkgd3JhcHBlci4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmNvbnRhaW5lciA9IG9wdHMuY29udGFpbmVyWzBdIHx8IG9wdHMuY29udGFpbmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFVubGlrZSBvdGhlciBwcm9wZXJ0aWVzIGluIFZlbG9jaXR5LCB0aGUgYnJvd3NlcidzIHNjcm9sbCBwb3NpdGlvbiBpcyBuZXZlciBjYWNoZWQgc2luY2UgaXQgc28gZnJlcXVlbnRseSBjaGFuZ2VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGR1ZSB0byB0aGUgdXNlcidzIG5hdHVyYWwgaW50ZXJhY3Rpb24gd2l0aCB0aGUgcGFnZSkuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsUG9zaXRpb25DdXJyZW50ID0gb3B0cy5jb250YWluZXJbXCJzY3JvbGxcIiArIHNjcm9sbERpcmVjdGlvbl07IC8qIEdFVCAqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogJC5wb3NpdGlvbigpIHZhbHVlcyBhcmUgcmVsYXRpdmUgdG8gdGhlIGNvbnRhaW5lcidzIGN1cnJlbnRseSB2aWV3YWJsZSBhcmVhICh3aXRob3V0IHRha2luZyBpbnRvIGFjY291bnQgdGhlIGNvbnRhaW5lcidzIHRydWUgZGltZW5zaW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0tIHNheSwgZm9yIGV4YW1wbGUsIGlmIHRoZSBjb250YWluZXIgd2FzIG5vdCBvdmVyZmxvd2luZykuIFRodXMsIHRoZSBzY3JvbGwgZW5kIHZhbHVlIGlzIHRoZSBzdW0gb2YgdGhlIGNoaWxkIGVsZW1lbnQncyBwb3NpdGlvbiAqYW5kKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBzY3JvbGwgY29udGFpbmVyJ3MgY3VycmVudCBzY3JvbGwgcG9zaXRpb24uICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsUG9zaXRpb25FbmQgPSAoc2Nyb2xsUG9zaXRpb25DdXJyZW50ICsgJChlbGVtZW50KS5wb3NpdGlvbigpW3Njcm9sbERpcmVjdGlvbi50b0xvd2VyQ2FzZSgpXSkgKyBzY3JvbGxPZmZzZXQ7IC8qIEdFVCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgYSB2YWx1ZSBvdGhlciB0aGFuIGEgalF1ZXJ5IG9iamVjdCBvciBhIHJhdyBET00gZWxlbWVudCB3YXMgcGFzc2VkIGluLCBkZWZhdWx0IHRvIG51bGwgc28gdGhhdCB0aGlzIG9wdGlvbiBpcyBpZ25vcmVkLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmNvbnRhaW5lciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgd2luZG93IGl0c2VsZiBpcyBiZWluZyBzY3JvbGxlZCAtLSBub3QgYSBjb250YWluaW5nIGVsZW1lbnQgLS0gcGVyZm9ybSBhIGxpdmUgc2Nyb2xsIHBvc2l0aW9uIGxvb2t1cCB1c2luZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIGFwcHJvcHJpYXRlIGNhY2hlZCBwcm9wZXJ0eSBuYW1lcyAod2hpY2ggZGlmZmVyIGJhc2VkIG9uIGJyb3dzZXIgdHlwZSkuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbkN1cnJlbnQgPSBWZWxvY2l0eS5TdGF0ZS5zY3JvbGxBbmNob3JbVmVsb2NpdHkuU3RhdGVbXCJzY3JvbGxQcm9wZXJ0eVwiICsgc2Nyb2xsRGlyZWN0aW9uXV07IC8qIEdFVCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogV2hlbiBzY3JvbGxpbmcgdGhlIGJyb3dzZXIgd2luZG93LCBjYWNoZSB0aGUgYWx0ZXJuYXRlIGF4aXMncyBjdXJyZW50IHZhbHVlIHNpbmNlIHdpbmRvdy5zY3JvbGxUbygpIGRvZXNuJ3QgbGV0IHVzIGNoYW5nZSBvbmx5IG9uZSB2YWx1ZSBhdCBhIHRpbWUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbkN1cnJlbnRBbHRlcm5hdGUgPSBWZWxvY2l0eS5TdGF0ZS5zY3JvbGxBbmNob3JbVmVsb2NpdHkuU3RhdGVbXCJzY3JvbGxQcm9wZXJ0eVwiICsgKHNjcm9sbERpcmVjdGlvbiA9PT0gXCJMZWZ0XCIgPyBcIlRvcFwiIDogXCJMZWZ0XCIpXV07IC8qIEdFVCAqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBVbmxpa2UgJC5wb3NpdGlvbigpLCAkLm9mZnNldCgpIHZhbHVlcyBhcmUgcmVsYXRpdmUgdG8gdGhlIGJyb3dzZXIgd2luZG93J3MgdHJ1ZSBkaW1lbnNpb25zIC0tIG5vdCBtZXJlbHkgaXRzIGN1cnJlbnRseSB2aWV3YWJsZSBhcmVhIC0tXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBhbmQgdGhlcmVmb3JlIGVuZCB2YWx1ZXMgZG8gbm90IG5lZWQgdG8gYmUgY29tcG91bmRlZCBvbnRvIGN1cnJlbnQgdmFsdWVzLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsUG9zaXRpb25FbmQgPSAkKGVsZW1lbnQpLm9mZnNldCgpW3Njcm9sbERpcmVjdGlvbi50b0xvd2VyQ2FzZSgpXSArIHNjcm9sbE9mZnNldDsgLyogR0VUICovXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSB0aGVyZSdzIG9ubHkgb25lIGZvcm1hdCB0aGF0IHNjcm9sbCdzIGFzc29jaWF0ZWQgdHdlZW5zQ29udGFpbmVyIGNhbiB0YWtlLCB3ZSBjcmVhdGUgaXQgbWFudWFsbHkuICovXG4gICAgICAgICAgICAgICAgICAgIHR3ZWVuc0NvbnRhaW5lciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlOiBzY3JvbGxQb3NpdGlvbkN1cnJlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZhbHVlOiBzY3JvbGxQb3NpdGlvbkN1cnJlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWU6IHNjcm9sbFBvc2l0aW9uRW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRUeXBlOiBcIlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVhc2luZzogb3B0cy5lYXNpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsRGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXI6IG9wdHMuY29udGFpbmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246IHNjcm9sbERpcmVjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWx0ZXJuYXRlVmFsdWU6IHNjcm9sbFBvc2l0aW9uQ3VycmVudEFsdGVybmF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50OiBlbGVtZW50XG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKFZlbG9jaXR5LmRlYnVnKSBjb25zb2xlLmxvZyhcInR3ZWVuc0NvbnRhaW5lciAoc2Nyb2xsKTogXCIsIHR3ZWVuc0NvbnRhaW5lci5zY3JvbGwsIGVsZW1lbnQpO1xuXG4gICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgIFR3ZWVuIERhdGEgQ29uc3RydWN0aW9uIChmb3IgUmV2ZXJzZSlcbiAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICAvKiBSZXZlcnNlIGFjdHMgbGlrZSBhIFwic3RhcnRcIiBhY3Rpb24gaW4gdGhhdCBhIHByb3BlcnR5IG1hcCBpcyBhbmltYXRlZCB0b3dhcmQuIFRoZSBvbmx5IGRpZmZlcmVuY2UgaXNcbiAgICAgICAgICAgICAgICAgICB0aGF0IHRoZSBwcm9wZXJ0eSBtYXAgdXNlZCBmb3IgcmV2ZXJzZSBpcyB0aGUgaW52ZXJzZSBvZiB0aGUgbWFwIHVzZWQgaW4gdGhlIHByZXZpb3VzIGNhbGwuIFRodXMsIHdlIG1hbmlwdWxhdGVcbiAgICAgICAgICAgICAgICAgICB0aGUgcHJldmlvdXMgY2FsbCB0byBjb25zdHJ1Y3Qgb3VyIG5ldyBtYXA6IHVzZSB0aGUgcHJldmlvdXMgbWFwJ3MgZW5kIHZhbHVlcyBhcyBvdXIgbmV3IG1hcCdzIHN0YXJ0IHZhbHVlcy4gQ29weSBvdmVyIGFsbCBvdGhlciBkYXRhLiAqL1xuICAgICAgICAgICAgICAgIC8qIE5vdGU6IFJldmVyc2UgY2FuIGJlIGRpcmVjdGx5IGNhbGxlZCB2aWEgdGhlIFwicmV2ZXJzZVwiIHBhcmFtZXRlciwgb3IgaXQgY2FuIGJlIGluZGlyZWN0bHkgdHJpZ2dlcmVkIHZpYSB0aGUgbG9vcCBvcHRpb24uIChMb29wcyBhcmUgY29tcG9zZWQgb2YgbXVsdGlwbGUgcmV2ZXJzZXMuKSAqL1xuICAgICAgICAgICAgICAgIC8qIE5vdGU6IFJldmVyc2UgY2FsbHMgZG8gbm90IG5lZWQgdG8gYmUgY29uc2VjdXRpdmVseSBjaGFpbmVkIG9udG8gYSBjdXJyZW50bHktYW5pbWF0aW5nIGVsZW1lbnQgaW4gb3JkZXIgdG8gb3BlcmF0ZSBvbiBjYWNoZWQgdmFsdWVzO1xuICAgICAgICAgICAgICAgICAgIHRoZXJlIGlzIG5vIGhhcm0gdG8gcmV2ZXJzZSBiZWluZyBjYWxsZWQgb24gYSBwb3RlbnRpYWxseSBzdGFsZSBkYXRhIGNhY2hlIHNpbmNlIHJldmVyc2UncyBiZWhhdmlvciBpcyBzaW1wbHkgZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgIGFzIHJldmVydGluZyB0byB0aGUgZWxlbWVudCdzIHZhbHVlcyBhcyB0aGV5IHdlcmUgcHJpb3IgdG8gdGhlIHByZXZpb3VzICpWZWxvY2l0eSogY2FsbC4gKi9cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJyZXZlcnNlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogQWJvcnQgaWYgdGhlcmUgaXMgbm8gcHJpb3IgYW5pbWF0aW9uIGRhdGEgdG8gcmV2ZXJzZSB0by4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFEYXRhKGVsZW1lbnQpLnR3ZWVuc0NvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogRGVxdWV1ZSB0aGUgZWxlbWVudCBzbyB0aGF0IHRoaXMgcXVldWUgZW50cnkgcmVsZWFzZXMgaXRzZWxmIGltbWVkaWF0ZWx5LCBhbGxvd2luZyBzdWJzZXF1ZW50IHF1ZXVlIGVudHJpZXMgdG8gcnVuLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgJC5kZXF1ZXVlKGVsZW1lbnQsIG9wdHMucXVldWUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBPcHRpb25zIFBhcnNpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGVsZW1lbnQgd2FzIGhpZGRlbiB2aWEgdGhlIGRpc3BsYXkgb3B0aW9uIGluIHRoZSBwcmV2aW91cyBjYWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV2ZXJ0IGRpc3BsYXkgdG8gXCJhdXRvXCIgcHJpb3IgdG8gcmV2ZXJzYWwgc28gdGhhdCB0aGUgZWxlbWVudCBpcyB2aXNpYmxlIGFnYWluLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkub3B0cy5kaXNwbGF5ID09PSBcIm5vbmVcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkub3B0cy5kaXNwbGF5ID0gXCJhdXRvXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpLm9wdHMudmlzaWJpbGl0eSA9PT0gXCJoaWRkZW5cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkub3B0cy52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBsb29wIG9wdGlvbiB3YXMgc2V0IGluIHRoZSBwcmV2aW91cyBjYWxsLCBkaXNhYmxlIGl0IHNvIHRoYXQgXCJyZXZlcnNlXCIgY2FsbHMgYXJlbid0IHJlY3Vyc2l2ZWx5IGdlbmVyYXRlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIEZ1cnRoZXIsIHJlbW92ZSB0aGUgcHJldmlvdXMgY2FsbCdzIGNhbGxiYWNrIG9wdGlvbnM7IHR5cGljYWxseSwgdXNlcnMgZG8gbm90IHdhbnQgdGhlc2UgdG8gYmUgcmVmaXJlZC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkub3B0cy5sb29wID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLm9wdHMuYmVnaW4gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5vcHRzLmNvbXBsZXRlID0gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogU2luY2Ugd2UncmUgZXh0ZW5kaW5nIGFuIG9wdHMgb2JqZWN0IHRoYXQgaGFzIGFscmVhZHkgYmVlbiBleHRlbmRlZCB3aXRoIHRoZSBkZWZhdWx0cyBvcHRpb25zIG9iamVjdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHdlIHJlbW92ZSBub24tZXhwbGljaXRseS1kZWZpbmVkIHByb3BlcnRpZXMgdGhhdCBhcmUgYXV0by1hc3NpZ25lZCB2YWx1ZXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMuZWFzaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG9wdHMuZWFzaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMuZHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgb3B0cy5kdXJhdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlIG9wdHMgb2JqZWN0IHVzZWQgZm9yIHJldmVyc2FsIGlzIGFuIGV4dGVuc2lvbiBvZiB0aGUgb3B0aW9ucyBvYmplY3Qgb3B0aW9uYWxseSBwYXNzZWQgaW50byB0aGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICByZXZlcnNlIGNhbGwgcGx1cyB0aGUgb3B0aW9ucyB1c2VkIGluIHRoZSBwcmV2aW91cyBWZWxvY2l0eSBjYWxsLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgb3B0cyA9ICQuZXh0ZW5kKHt9LCBEYXRhKGVsZW1lbnQpLm9wdHMsIG9wdHMpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgVHdlZW5zIENvbnRhaW5lciBSZWNvbnN0cnVjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogQ3JlYXRlIGEgZGVlcHkgY29weSAoaW5kaWNhdGVkIHZpYSB0aGUgdHJ1ZSBmbGFnKSBvZiB0aGUgcHJldmlvdXMgY2FsbCdzIHR3ZWVuc0NvbnRhaW5lci4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXN0VHdlZW5zQ29udGFpbmVyID0gJC5leHRlbmQodHJ1ZSwge30sIERhdGEoZWxlbWVudCkudHdlZW5zQ29udGFpbmVyKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogTWFuaXB1bGF0ZSB0aGUgcHJldmlvdXMgdHdlZW5zQ29udGFpbmVyIGJ5IHJlcGxhY2luZyBpdHMgZW5kIHZhbHVlcyBhbmQgY3VycmVudFZhbHVlcyB3aXRoIGl0cyBzdGFydCB2YWx1ZXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBsYXN0VHdlZW4gaW4gbGFzdFR3ZWVuc0NvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEluIGFkZGl0aW9uIHRvIHR3ZWVuIGRhdGEsIHR3ZWVuc0NvbnRhaW5lcnMgY29udGFpbiBhbiBlbGVtZW50IHByb3BlcnR5IHRoYXQgd2UgaWdub3JlIGhlcmUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RUd2VlbiAhPT0gXCJlbGVtZW50XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RTdGFydFZhbHVlID0gbGFzdFR3ZWVuc0NvbnRhaW5lcltsYXN0VHdlZW5dLnN0YXJ0VmFsdWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFR3ZWVuc0NvbnRhaW5lcltsYXN0VHdlZW5dLnN0YXJ0VmFsdWUgPSBsYXN0VHdlZW5zQ29udGFpbmVyW2xhc3RUd2Vlbl0uY3VycmVudFZhbHVlID0gbGFzdFR3ZWVuc0NvbnRhaW5lcltsYXN0VHdlZW5dLmVuZFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0VHdlZW5zQ29udGFpbmVyW2xhc3RUd2Vlbl0uZW5kVmFsdWUgPSBsYXN0U3RhcnRWYWx1ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBFYXNpbmcgaXMgdGhlIG9ubHkgb3B0aW9uIHRoYXQgZW1iZWRzIGludG8gdGhlIGluZGl2aWR1YWwgdHdlZW4gZGF0YSAoc2luY2UgaXQgY2FuIGJlIGRlZmluZWQgb24gYSBwZXItcHJvcGVydHkgYmFzaXMpLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBY2NvcmRpbmdseSwgZXZlcnkgcHJvcGVydHkncyBlYXNpbmcgdmFsdWUgbXVzdCBiZSB1cGRhdGVkIHdoZW4gYW4gb3B0aW9ucyBvYmplY3QgaXMgcGFzc2VkIGluIHdpdGggYSByZXZlcnNlIGNhbGwuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBzaWRlIGVmZmVjdCBvZiB0aGlzIGV4dGVuc2liaWxpdHkgaXMgdGhhdCBhbGwgcGVyLXByb3BlcnR5IGVhc2luZyB2YWx1ZXMgYXJlIGZvcmNlZnVsbHkgcmVzZXQgdG8gdGhlIG5ldyB2YWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFUeXBlLmlzRW1wdHlPYmplY3Qob3B0aW9ucykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RUd2VlbnNDb250YWluZXJbbGFzdFR3ZWVuXS5lYXNpbmcgPSBvcHRzLmVhc2luZztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChWZWxvY2l0eS5kZWJ1ZykgY29uc29sZS5sb2coXCJyZXZlcnNlIHR3ZWVuc0NvbnRhaW5lciAoXCIgKyBsYXN0VHdlZW4gKyBcIik6IFwiICsgSlNPTi5zdHJpbmdpZnkobGFzdFR3ZWVuc0NvbnRhaW5lcltsYXN0VHdlZW5dKSwgZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB0d2VlbnNDb250YWluZXIgPSBsYXN0VHdlZW5zQ29udGFpbmVyO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICBUd2VlbiBEYXRhIENvbnN0cnVjdGlvbiAoZm9yIFN0YXJ0KVxuICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFwic3RhcnRcIikge1xuXG4gICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgICAgICBWYWx1ZSBUcmFuc2ZlcnJpbmdcbiAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGlzIHF1ZXVlIGVudHJ5IGZvbGxvd3MgYSBwcmV2aW91cyBWZWxvY2l0eS1pbml0aWF0ZWQgcXVldWUgZW50cnkgKmFuZCogaWYgdGhpcyBlbnRyeSB3YXMgY3JlYXRlZFxuICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSB0aGUgZWxlbWVudCB3YXMgaW4gdGhlIHByb2Nlc3Mgb2YgYmVpbmcgYW5pbWF0ZWQgYnkgVmVsb2NpdHksIHRoZW4gdGhpcyBjdXJyZW50IGNhbGwgaXMgc2FmZSB0byB1c2VcbiAgICAgICAgICAgICAgICAgICAgICAgdGhlIGVuZCB2YWx1ZXMgZnJvbSB0aGUgcHJpb3IgY2FsbCBhcyBpdHMgc3RhcnQgdmFsdWVzLiBWZWxvY2l0eSBhdHRlbXB0cyB0byBwZXJmb3JtIHRoaXMgdmFsdWUgdHJhbnNmZXJcbiAgICAgICAgICAgICAgICAgICAgICAgcHJvY2VzcyB3aGVuZXZlciBwb3NzaWJsZSBpbiBvcmRlciB0byBhdm9pZCByZXF1ZXJ5aW5nIHRoZSBET00uICovXG4gICAgICAgICAgICAgICAgICAgIC8qIElmIHZhbHVlcyBhcmVuJ3QgdHJhbnNmZXJyZWQgZnJvbSBhIHByaW9yIGNhbGwgYW5kIHN0YXJ0IHZhbHVlcyB3ZXJlIG5vdCBmb3JjZWZlZCBieSB0aGUgdXNlciAobW9yZSBvbiB0aGlzIGJlbG93KSxcbiAgICAgICAgICAgICAgICAgICAgICAgdGhlbiB0aGUgRE9NIGlzIHF1ZXJpZWQgZm9yIHRoZSBlbGVtZW50J3MgY3VycmVudCB2YWx1ZXMgYXMgYSBsYXN0IHJlc29ydC4gKi9cbiAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogQ29udmVyc2VseSwgYW5pbWF0aW9uIHJldmVyc2FsIChhbmQgbG9vcGluZykgKmFsd2F5cyogcGVyZm9ybSBpbnRlci1jYWxsIHZhbHVlIHRyYW5zZmVyczsgdGhleSBuZXZlciByZXF1ZXJ5IHRoZSBET00uICovXG4gICAgICAgICAgICAgICAgICAgIHZhciBsYXN0VHdlZW5zQ29udGFpbmVyO1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIFRoZSBwZXItZWxlbWVudCBpc0FuaW1hdGluZyBmbGFnIGlzIHVzZWQgdG8gaW5kaWNhdGUgd2hldGhlciBpdCdzIHNhZmUgKGkuZS4gdGhlIGRhdGEgaXNuJ3Qgc3RhbGUpXG4gICAgICAgICAgICAgICAgICAgICAgIHRvIHRyYW5zZmVyIG92ZXIgZW5kIHZhbHVlcyB0byB1c2UgYXMgc3RhcnQgdmFsdWVzLiBJZiBpdCdzIHNldCB0byB0cnVlIGFuZCB0aGVyZSBpcyBhIHByZXZpb3VzXG4gICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5IGNhbGwgdG8gcHVsbCB2YWx1ZXMgZnJvbSwgZG8gc28uICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpLnR3ZWVuc0NvbnRhaW5lciAmJiBEYXRhKGVsZW1lbnQpLmlzQW5pbWF0aW5nID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0VHdlZW5zQ29udGFpbmVyID0gRGF0YShlbGVtZW50KS50d2VlbnNDb250YWluZXI7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgICAgIFR3ZWVuIERhdGEgQ2FsY3VsYXRpb25cbiAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIFRoaXMgZnVuY3Rpb24gcGFyc2VzIHByb3BlcnR5IGRhdGEgYW5kIGRlZmF1bHRzIGVuZFZhbHVlLCBlYXNpbmcsIGFuZCBzdGFydFZhbHVlIGFzIGFwcHJvcHJpYXRlLiAqL1xuICAgICAgICAgICAgICAgICAgICAvKiBQcm9wZXJ0eSBtYXAgdmFsdWVzIGNhbiBlaXRoZXIgdGFrZSB0aGUgZm9ybSBvZiAxKSBhIHNpbmdsZSB2YWx1ZSByZXByZXNlbnRpbmcgdGhlIGVuZCB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgb3IgMikgYW4gYXJyYXkgaW4gdGhlIGZvcm0gb2YgWyBlbmRWYWx1ZSwgWywgZWFzaW5nXSBbLCBzdGFydFZhbHVlXSBdLlxuICAgICAgICAgICAgICAgICAgICAgICBUaGUgb3B0aW9uYWwgdGhpcmQgcGFyYW1ldGVyIGlzIGEgZm9yY2VmZWQgc3RhcnRWYWx1ZSB0byBiZSB1c2VkIGluc3RlYWQgb2YgcXVlcnlpbmcgdGhlIERPTSBmb3JcbiAgICAgICAgICAgICAgICAgICAgICAgdGhlIGVsZW1lbnQncyBjdXJyZW50IHZhbHVlLiBSZWFkIFZlbG9jaXR5J3MgZG9jbWVudGF0aW9uIHRvIGxlYXJuIG1vcmUgYWJvdXQgZm9yY2VmZWVkaW5nOiBWZWxvY2l0eUpTLm9yZy8jZm9yY2VmZWVkaW5nICovXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHBhcnNlUHJvcGVydHlWYWx1ZSAodmFsdWVEYXRhLCBza2lwUmVzb2x2aW5nRWFzaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZW5kVmFsdWUgPSB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWFzaW5nID0gdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIEhhbmRsZSB0aGUgYXJyYXkgZm9ybWF0LCB3aGljaCBjYW4gYmUgc3RydWN0dXJlZCBhcyBvbmUgb2YgdGhyZWUgcG90ZW50aWFsIG92ZXJsb2FkczpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIEEpIFsgZW5kVmFsdWUsIGVhc2luZywgc3RhcnRWYWx1ZSBdLCBCKSBbIGVuZFZhbHVlLCBlYXNpbmcgXSwgb3IgQykgWyBlbmRWYWx1ZSwgc3RhcnRWYWx1ZSBdICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoVHlwZS5pc0FycmF5KHZhbHVlRGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBlbmRWYWx1ZSBpcyBhbHdheXMgdGhlIGZpcnN0IGl0ZW0gaW4gdGhlIGFycmF5LiBEb24ndCBib3RoZXIgdmFsaWRhdGluZyBlbmRWYWx1ZSdzIHZhbHVlIG5vd1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmNlIHRoZSBlbnN1aW5nIHByb3BlcnR5IGN5Y2xpbmcgbG9naWMgZG9lcyB0aGF0LiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gdmFsdWVEYXRhWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVHdvLWl0ZW0gYXJyYXkgZm9ybWF0OiBJZiB0aGUgc2Vjb25kIGl0ZW0gaXMgYSBudW1iZXIsIGZ1bmN0aW9uLCBvciBoZXggc3RyaW5nLCB0cmVhdCBpdCBhcyBhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQgdmFsdWUgc2luY2UgZWFzaW5ncyBjYW4gb25seSBiZSBub24taGV4IHN0cmluZ3Mgb3IgYXJyYXlzLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoIVR5cGUuaXNBcnJheSh2YWx1ZURhdGFbMV0pICYmIC9eW1xcZC1dLy50ZXN0KHZhbHVlRGF0YVsxXSkpIHx8IFR5cGUuaXNGdW5jdGlvbih2YWx1ZURhdGFbMV0pIHx8IENTUy5SZWdFeC5pc0hleC50ZXN0KHZhbHVlRGF0YVsxXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IHZhbHVlRGF0YVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUd28gb3IgdGhyZWUtaXRlbSBhcnJheTogSWYgdGhlIHNlY29uZCBpdGVtIGlzIGEgbm9uLWhleCBzdHJpbmcgb3IgYW4gYXJyYXksIHRyZWF0IGl0IGFzIGFuIGVhc2luZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKChUeXBlLmlzU3RyaW5nKHZhbHVlRGF0YVsxXSkgJiYgIUNTUy5SZWdFeC5pc0hleC50ZXN0KHZhbHVlRGF0YVsxXSkpIHx8IFR5cGUuaXNBcnJheSh2YWx1ZURhdGFbMV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVhc2luZyA9IHNraXBSZXNvbHZpbmdFYXNpbmcgPyB2YWx1ZURhdGFbMV0gOiBnZXRFYXNpbmcodmFsdWVEYXRhWzFdLCBvcHRzLmR1cmF0aW9uKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBEb24ndCBib3RoZXIgdmFsaWRhdGluZyBzdGFydFZhbHVlJ3MgdmFsdWUgbm93IHNpbmNlIHRoZSBlbnN1aW5nIHByb3BlcnR5IGN5Y2xpbmcgbG9naWMgaW5oZXJlbnRseSBkb2VzIHRoYXQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZURhdGFbMl0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IHZhbHVlRGF0YVsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIEhhbmRsZSB0aGUgc2luZ2xlLXZhbHVlIGZvcm1hdC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSB2YWx1ZURhdGE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIERlZmF1bHQgdG8gdGhlIGNhbGwncyBlYXNpbmcgaWYgYSBwZXItcHJvcGVydHkgZWFzaW5nIHR5cGUgd2FzIG5vdCBkZWZpbmVkLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFza2lwUmVzb2x2aW5nRWFzaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWFzaW5nID0gZWFzaW5nIHx8IG9wdHMuZWFzaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBmdW5jdGlvbnMgd2VyZSBwYXNzZWQgaW4gYXMgdmFsdWVzLCBwYXNzIHRoZSBmdW5jdGlvbiB0aGUgY3VycmVudCBlbGVtZW50IGFzIGl0cyBjb250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgcGx1cyB0aGUgZWxlbWVudCdzIGluZGV4IGFuZCB0aGUgZWxlbWVudCBzZXQncyBzaXplIGFzIGFyZ3VtZW50cy4gVGhlbiwgYXNzaWduIHRoZSByZXR1cm5lZCB2YWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChUeXBlLmlzRnVuY3Rpb24oZW5kVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSBlbmRWYWx1ZS5jYWxsKGVsZW1lbnQsIGVsZW1lbnRzSW5kZXgsIGVsZW1lbnRzTGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFR5cGUuaXNGdW5jdGlvbihzdGFydFZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSBzdGFydFZhbHVlLmNhbGwoZWxlbWVudCwgZWxlbWVudHNJbmRleCwgZWxlbWVudHNMZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBBbGxvdyBzdGFydFZhbHVlIHRvIGJlIGxlZnQgYXMgdW5kZWZpbmVkIHRvIGluZGljYXRlIHRvIHRoZSBlbnN1aW5nIGNvZGUgdGhhdCBpdHMgdmFsdWUgd2FzIG5vdCBmb3JjZWZlZC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbIGVuZFZhbHVlIHx8IDAsIGVhc2luZywgc3RhcnRWYWx1ZSBdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLyogQ3ljbGUgdGhyb3VnaCBlYWNoIHByb3BlcnR5IGluIHRoZSBtYXAsIGxvb2tpbmcgZm9yIHNob3J0aGFuZCBjb2xvciBwcm9wZXJ0aWVzIChlLmcuIFwiY29sb3JcIiBhcyBvcHBvc2VkIHRvIFwiY29sb3JSZWRcIikuIEluamVjdCB0aGUgY29ycmVzcG9uZGluZ1xuICAgICAgICAgICAgICAgICAgICAgICBjb2xvclJlZCwgY29sb3JHcmVlbiwgYW5kIGNvbG9yQmx1ZSBSR0IgY29tcG9uZW50IHR3ZWVucyBpbnRvIHRoZSBwcm9wZXJ0aWVzTWFwICh3aGljaCBWZWxvY2l0eSB1bmRlcnN0YW5kcykgYW5kIHJlbW92ZSB0aGUgc2hvcnRoYW5kIHByb3BlcnR5LiAqL1xuICAgICAgICAgICAgICAgICAgICAkLmVhY2gocHJvcGVydGllc01hcCwgZnVuY3Rpb24ocHJvcGVydHksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBGaW5kIHNob3J0aGFuZCBjb2xvciBwcm9wZXJ0aWVzIHRoYXQgaGF2ZSBiZWVuIHBhc3NlZCBhIGhleCBzdHJpbmcuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoUmVnRXhwKFwiXlwiICsgQ1NTLkxpc3RzLmNvbG9ycy5qb2luKFwiJHxeXCIpICsgXCIkXCIpLnRlc3QocHJvcGVydHkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogUGFyc2UgdGhlIHZhbHVlIGRhdGEgZm9yIGVhY2ggc2hvcnRoYW5kLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZURhdGEgPSBwYXJzZVByb3BlcnR5VmFsdWUodmFsdWUsIHRydWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IHZhbHVlRGF0YVswXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWFzaW5nID0gdmFsdWVEYXRhWzFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gdmFsdWVEYXRhWzJdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENTUy5SZWdFeC5pc0hleC50ZXN0KGVuZFZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDb252ZXJ0IHRoZSBoZXggc3RyaW5ncyBpbnRvIHRoZWlyIFJHQiBjb21wb25lbnQgYXJyYXlzLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29sb3JDb21wb25lbnRzID0gWyBcIlJlZFwiLCBcIkdyZWVuXCIsIFwiQmx1ZVwiIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZVJHQiA9IENTUy5WYWx1ZXMuaGV4VG9SZ2IoZW5kVmFsdWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZVJHQiA9IHN0YXJ0VmFsdWUgPyBDU1MuVmFsdWVzLmhleFRvUmdiKHN0YXJ0VmFsdWUpIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEluamVjdCB0aGUgUkdCIGNvbXBvbmVudCB0d2VlbnMgaW50byBwcm9wZXJ0aWVzTWFwLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbG9yQ29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGFBcnJheSA9IFsgZW5kVmFsdWVSR0JbaV0gXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVhc2luZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFBcnJheS5wdXNoKGVhc2luZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGFydFZhbHVlUkdCICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhQXJyYXkucHVzaChzdGFydFZhbHVlUkdCW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllc01hcFtwcm9wZXJ0eSArIGNvbG9yQ29tcG9uZW50c1tpXV0gPSBkYXRhQXJyYXk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBSZW1vdmUgdGhlIGludGVybWVkaWFyeSBzaG9ydGhhbmQgcHJvcGVydHkgZW50cnkgbm93IHRoYXQgd2UndmUgcHJvY2Vzc2VkIGl0LiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgcHJvcGVydGllc01hcFtwcm9wZXJ0eV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAvKiBDcmVhdGUgYSB0d2VlbiBvdXQgb2YgZWFjaCBwcm9wZXJ0eSwgYW5kIGFwcGVuZCBpdHMgYXNzb2NpYXRlZCBkYXRhIHRvIHR3ZWVuc0NvbnRhaW5lci4gKi9cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcGVydHkgaW4gcHJvcGVydGllc01hcCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFN0YXJ0IFZhbHVlIFNvdXJjaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogUGFyc2Ugb3V0IGVuZFZhbHVlLCBlYXNpbmcsIGFuZCBzdGFydFZhbHVlIGZyb20gdGhlIHByb3BlcnR5J3MgZGF0YS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZURhdGEgPSBwYXJzZVByb3BlcnR5VmFsdWUocHJvcGVydGllc01hcFtwcm9wZXJ0eV0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gdmFsdWVEYXRhWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVhc2luZyA9IHZhbHVlRGF0YVsxXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gdmFsdWVEYXRhWzJdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3cgdGhhdCB0aGUgb3JpZ2luYWwgcHJvcGVydHkgbmFtZSdzIGZvcm1hdCBoYXMgYmVlbiB1c2VkIGZvciB0aGUgcGFyc2VQcm9wZXJ0eVZhbHVlKCkgbG9va3VwIGFib3ZlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgd2UgZm9yY2UgdGhlIHByb3BlcnR5IHRvIGl0cyBjYW1lbENhc2Ugc3R5bGluZyB0byBub3JtYWxpemUgaXQgZm9yIG1hbmlwdWxhdGlvbi4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5ID0gQ1NTLk5hbWVzLmNhbWVsQ2FzZShwcm9wZXJ0eSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIEluIGNhc2UgdGhpcyBwcm9wZXJ0eSBpcyBhIGhvb2ssIHRoZXJlIGFyZSBjaXJjdW1zdGFuY2VzIHdoZXJlIHdlIHdpbGwgaW50ZW5kIHRvIHdvcmsgb24gdGhlIGhvb2sncyByb290IHByb3BlcnR5IGFuZCBub3QgdGhlIGhvb2tlZCBzdWJwcm9wZXJ0eS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByb290UHJvcGVydHkgPSBDU1MuSG9va3MuZ2V0Um9vdChwcm9wZXJ0eSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogT3RoZXIgdGhhbiBmb3IgdGhlIGR1bW15IHR3ZWVuIHByb3BlcnR5LCBwcm9wZXJ0aWVzIHRoYXQgYXJlIG5vdCBzdXBwb3J0ZWQgYnkgdGhlIGJyb3dzZXIgKGFuZCBkbyBub3QgaGF2ZSBhbiBhc3NvY2lhdGVkIG5vcm1hbGl6YXRpb24pIHdpbGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaGVyZW50bHkgcHJvZHVjZSBubyBzdHlsZSBjaGFuZ2VzIHdoZW4gc2V0LCBzbyB0aGV5IGFyZSBza2lwcGVkIGluIG9yZGVyIHRvIGRlY3JlYXNlIGFuaW1hdGlvbiB0aWNrIG92ZXJoZWFkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgUHJvcGVydHkgc3VwcG9ydCBpcyBkZXRlcm1pbmVkIHZpYSBwcmVmaXhDaGVjaygpLCB3aGljaCByZXR1cm5zIGEgZmFsc2UgZmxhZyB3aGVuIG5vIHN1cHBvcnRlZCBpcyBkZXRlY3RlZC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFNpbmNlIFNWRyBlbGVtZW50cyBoYXZlIHNvbWUgb2YgdGhlaXIgcHJvcGVydGllcyBkaXJlY3RseSBhcHBsaWVkIGFzIEhUTUwgYXR0cmlidXRlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZXJlIGlzIG5vIHdheSB0byBjaGVjayBmb3IgdGhlaXIgZXhwbGljaXQgYnJvd3NlciBzdXBwb3J0LCBhbmQgc28gd2Ugc2tpcCBza2lwIHRoaXMgY2hlY2sgZm9yIHRoZW0uICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIURhdGEoZWxlbWVudCkuaXNTVkcgJiYgcm9vdFByb3BlcnR5ICE9PSBcInR3ZWVuXCIgJiYgQ1NTLk5hbWVzLnByZWZpeENoZWNrKHJvb3RQcm9wZXJ0eSlbMV0gPT09IGZhbHNlICYmIENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Jvb3RQcm9wZXJ0eV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChWZWxvY2l0eS5kZWJ1ZykgY29uc29sZS5sb2coXCJTa2lwcGluZyBbXCIgKyByb290UHJvcGVydHkgKyBcIl0gZHVlIHRvIGEgbGFjayBvZiBicm93c2VyIHN1cHBvcnQuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBkaXNwbGF5IG9wdGlvbiBpcyBiZWluZyBzZXQgdG8gYSBub24tXCJub25lXCIgKGUuZy4gXCJibG9ja1wiKSBhbmQgb3BhY2l0eSAoZmlsdGVyIG9uIElFPD04KSBpcyBiZWluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0ZWQgdG8gYW4gZW5kVmFsdWUgb2Ygbm9uLXplcm8sIHRoZSB1c2VyJ3MgaW50ZW50aW9uIGlzIHRvIGZhZGUgaW4gZnJvbSBpbnZpc2libGUsIHRodXMgd2UgZm9yY2VmZWVkIG9wYWNpdHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGEgc3RhcnRWYWx1ZSBvZiAwIGlmIGl0cyBzdGFydFZhbHVlIGhhc24ndCBhbHJlYWR5IGJlZW4gc291cmNlZCBieSB2YWx1ZSB0cmFuc2ZlcnJpbmcgb3IgcHJpb3IgZm9yY2VmZWVkaW5nLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCgob3B0cy5kaXNwbGF5ICE9PSB1bmRlZmluZWQgJiYgb3B0cy5kaXNwbGF5ICE9PSBudWxsICYmIG9wdHMuZGlzcGxheSAhPT0gXCJub25lXCIpIHx8IChvcHRzLnZpc2liaWxpdHkgIT09IHVuZGVmaW5lZCAmJiBvcHRzLnZpc2liaWxpdHkgIT09IFwiaGlkZGVuXCIpKSAmJiAvb3BhY2l0eXxmaWx0ZXIvLnRlc3QocHJvcGVydHkpICYmICFzdGFydFZhbHVlICYmIGVuZFZhbHVlICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHZhbHVlcyBoYXZlIGJlZW4gdHJhbnNmZXJyZWQgZnJvbSB0aGUgcHJldmlvdXMgVmVsb2NpdHkgY2FsbCwgZXh0cmFjdCB0aGUgZW5kVmFsdWUgYW5kIHJvb3RQcm9wZXJ0eVZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgYWxsIG9mIHRoZSBjdXJyZW50IGNhbGwncyBwcm9wZXJ0aWVzIHRoYXQgd2VyZSAqYWxzbyogYW5pbWF0ZWQgaW4gdGhlIHByZXZpb3VzIGNhbGwuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBWYWx1ZSB0cmFuc2ZlcnJpbmcgY2FuIG9wdGlvbmFsbHkgYmUgZGlzYWJsZWQgYnkgdGhlIHVzZXIgdmlhIHRoZSBfY2FjaGVWYWx1ZXMgb3B0aW9uLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMuX2NhY2hlVmFsdWVzICYmIGxhc3RUd2VlbnNDb250YWluZXIgJiYgbGFzdFR3ZWVuc0NvbnRhaW5lcltwcm9wZXJ0eV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RhcnRWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSBsYXN0VHdlZW5zQ29udGFpbmVyW3Byb3BlcnR5XS5lbmRWYWx1ZSArIGxhc3RUd2VlbnNDb250YWluZXJbcHJvcGVydHldLnVuaXRUeXBlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRoZSBwcmV2aW91cyBjYWxsJ3Mgcm9vdFByb3BlcnR5VmFsdWUgaXMgZXh0cmFjdGVkIGZyb20gdGhlIGVsZW1lbnQncyBkYXRhIGNhY2hlIHNpbmNlIHRoYXQncyB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZSBvZiByb290UHJvcGVydHlWYWx1ZSB0aGF0IGdldHMgZnJlc2hseSB1cGRhdGVkIGJ5IHRoZSB0d2VlbmluZyBwcm9jZXNzLCB3aGVyZWFzIHRoZSByb290UHJvcGVydHlWYWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dGFjaGVkIHRvIHRoZSBpbmNvbWluZyBsYXN0VHdlZW5zQ29udGFpbmVyIGlzIGVxdWFsIHRvIHRoZSByb290IHByb3BlcnR5J3MgdmFsdWUgcHJpb3IgdG8gYW55IHR3ZWVuaW5nLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gRGF0YShlbGVtZW50KS5yb290UHJvcGVydHlWYWx1ZUNhY2hlW3Jvb3RQcm9wZXJ0eV07XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB2YWx1ZXMgd2VyZSBub3QgdHJhbnNmZXJyZWQgZnJvbSBhIHByZXZpb3VzIFZlbG9jaXR5IGNhbGwsIHF1ZXJ5IHRoZSBET00gYXMgbmVlZGVkLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBIYW5kbGUgaG9va2VkIHByb3BlcnRpZXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENTUy5Ib29rcy5yZWdpc3RlcmVkW3Byb3BlcnR5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGFydFZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgcm9vdFByb3BlcnR5KTsgLyogR0VUICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBUaGUgZm9sbG93aW5nIGdldFByb3BlcnR5VmFsdWUoKSBjYWxsIGRvZXMgbm90IGFjdHVhbGx5IHRyaWdnZXIgYSBET00gcXVlcnk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRQcm9wZXJ0eVZhbHVlKCkgd2lsbCBleHRyYWN0IHRoZSBob29rIGZyb20gcm9vdFByb3BlcnR5VmFsdWUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgcHJvcGVydHksIHJvb3RQcm9wZXJ0eVZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgc3RhcnRWYWx1ZSBpcyBhbHJlYWR5IGRlZmluZWQgdmlhIGZvcmNlZmVlZGluZywgZG8gbm90IHF1ZXJ5IHRoZSBET00gZm9yIHRoZSByb290IHByb3BlcnR5J3MgdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGp1c3QgZ3JhYiByb290UHJvcGVydHkncyB6ZXJvLXZhbHVlIHRlbXBsYXRlIGZyb20gQ1NTLkhvb2tzLiBUaGlzIG92ZXJ3cml0ZXMgdGhlIGVsZW1lbnQncyBhY3R1YWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdCBwcm9wZXJ0eSB2YWx1ZSAoaWYgb25lIGlzIHNldCksIGJ1dCB0aGlzIGlzIGFjY2VwdGFibGUgc2luY2UgdGhlIHByaW1hcnkgcmVhc29uIHVzZXJzIGZvcmNlZmVlZCBpc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0byBhdm9pZCBET00gcXVlcmllcywgYW5kIHRodXMgd2UgbGlrZXdpc2UgYXZvaWQgcXVlcnlpbmcgdGhlIERPTSBmb3IgdGhlIHJvb3QgcHJvcGVydHkncyB2YWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEdyYWIgdGhpcyBob29rJ3MgemVyby12YWx1ZSB0ZW1wbGF0ZSwgZS5nLiBcIjBweCAwcHggMHB4IGJsYWNrXCIuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSA9IENTUy5Ib29rcy50ZW1wbGF0ZXNbcm9vdFByb3BlcnR5XVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEhhbmRsZSBub24taG9va2VkIHByb3BlcnRpZXMgdGhhdCBoYXZlbid0IGFscmVhZHkgYmVlbiBkZWZpbmVkIHZpYSBmb3JjZWZlZWRpbmcuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzdGFydFZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIHByb3BlcnR5KTsgLyogR0VUICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFZhbHVlIERhdGEgRXh0cmFjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZXBhcmF0ZWRWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZVVuaXRUeXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWVVbml0VHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVyYXRvciA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBTZXBhcmF0ZXMgYSBwcm9wZXJ0eSB2YWx1ZSBpbnRvIGl0cyBudW1lcmljIHZhbHVlIGFuZCBpdHMgdW5pdCB0eXBlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gc2VwYXJhdGVWYWx1ZSAocHJvcGVydHksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHVuaXRUeXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1lcmljVmFsdWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1lcmljVmFsdWUgPSAodmFsdWUgfHwgXCIwXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50b1N0cmluZygpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE1hdGNoIHRoZSB1bml0IHR5cGUgYXQgdGhlIGVuZCBvZiB0aGUgdmFsdWUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9bJUEtel0rJC8sIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBHcmFiIHRoZSB1bml0IHR5cGUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0VHlwZSA9IG1hdGNoO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTdHJpcCB0aGUgdW5pdCB0eXBlIG9mZiBvZiB2YWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIG5vIHVuaXQgdHlwZSB3YXMgc3VwcGxpZWQsIGFzc2lnbiBvbmUgdGhhdCBpcyBhcHByb3ByaWF0ZSBmb3IgdGhpcyBwcm9wZXJ0eSAoZS5nLiBcImRlZ1wiIGZvciByb3RhdGVaIG9yIFwicHhcIiBmb3Igd2lkdGgpLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdW5pdFR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFR5cGUgPSBDU1MuVmFsdWVzLmdldFVuaXRUeXBlKHByb3BlcnR5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWyBudW1lcmljVmFsdWUsIHVuaXRUeXBlIF07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNlcGFyYXRlIHN0YXJ0VmFsdWUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXBhcmF0ZWRWYWx1ZSA9IHNlcGFyYXRlVmFsdWUocHJvcGVydHksIHN0YXJ0VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IHNlcGFyYXRlZFZhbHVlWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZVVuaXRUeXBlID0gc2VwYXJhdGVkVmFsdWVbMV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNlcGFyYXRlIGVuZFZhbHVlLCBhbmQgZXh0cmFjdCBhIHZhbHVlIG9wZXJhdG9yIChlLmcuIFwiKz1cIiwgXCItPVwiKSBpZiBvbmUgZXhpc3RzLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VwYXJhdGVkVmFsdWUgPSBzZXBhcmF0ZVZhbHVlKHByb3BlcnR5LCBlbmRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IHNlcGFyYXRlZFZhbHVlWzBdLnJlcGxhY2UoL14oWystXFwvKl0pPS8sIGZ1bmN0aW9uKG1hdGNoLCBzdWJNYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wZXJhdG9yID0gc3ViTWF0Y2g7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTdHJpcCB0aGUgb3BlcmF0b3Igb2ZmIG9mIHRoZSB2YWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWVVbml0VHlwZSA9IHNlcGFyYXRlZFZhbHVlWzFdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBQYXJzZSBmbG9hdCB2YWx1ZXMgZnJvbSBlbmRWYWx1ZSBhbmQgc3RhcnRWYWx1ZS4gRGVmYXVsdCB0byAwIGlmIE5hTiBpcyByZXR1cm5lZC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSBwYXJzZUZsb2F0KHN0YXJ0VmFsdWUpIHx8IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IHBhcnNlRmxvYXQoZW5kVmFsdWUpIHx8IDA7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFByb3BlcnR5LVNwZWNpZmljIFZhbHVlIENvbnZlcnNpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogQ3VzdG9tIHN1cHBvcnQgZm9yIHByb3BlcnRpZXMgdGhhdCBkb24ndCBhY3R1YWxseSBhY2NlcHQgdGhlICUgdW5pdCB0eXBlLCBidXQgd2hlcmUgcG9sbHlmaWxsaW5nIGlzIHRyaXZpYWwgYW5kIHJlbGF0aXZlbHkgZm9vbHByb29mLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVuZFZhbHVlVW5pdFR5cGUgPT09IFwiJVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQSAlLXZhbHVlIGZvbnRTaXplL2xpbmVIZWlnaHQgaXMgcmVsYXRpdmUgdG8gdGhlIHBhcmVudCdzIGZvbnRTaXplIChhcyBvcHBvc2VkIHRvIHRoZSBwYXJlbnQncyBkaW1lbnNpb25zKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGljaCBpcyBpZGVudGljYWwgdG8gdGhlIGVtIHVuaXQncyBiZWhhdmlvciwgc28gd2UgcGlnZ3liYWNrIG9mZiBvZiB0aGF0LiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgvXihmb250U2l6ZXxsaW5lSGVpZ2h0KSQvLnRlc3QocHJvcGVydHkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENvbnZlcnQgJSBpbnRvIGFuIGVtIGRlY2ltYWwgdmFsdWUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gZW5kVmFsdWUgLyAxMDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlVW5pdFR5cGUgPSBcImVtXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRm9yIHNjYWxlWCBhbmQgc2NhbGVZLCBjb252ZXJ0IHRoZSB2YWx1ZSBpbnRvIGl0cyBkZWNpbWFsIGZvcm1hdCBhbmQgc3RyaXAgb2ZmIHRoZSB1bml0IHR5cGUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvXnNjYWxlLy50ZXN0KHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IGVuZFZhbHVlIC8gMTAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZVVuaXRUeXBlID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBGb3IgUkdCIGNvbXBvbmVudHMsIHRha2UgdGhlIGRlZmluZWQgcGVyY2VudGFnZSBvZiAyNTUgYW5kIHN0cmlwIG9mZiB0aGUgdW5pdCB0eXBlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoLyhSZWR8R3JlZW58Qmx1ZSkkL2kudGVzdChwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSAoZW5kVmFsdWUgLyAxMDApICogMjU1O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZVVuaXRUeXBlID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFVuaXQgUmF0aW8gQ2FsY3VsYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogV2hlbiBxdWVyaWVkLCB0aGUgYnJvd3NlciByZXR1cm5zIChtb3N0KSBDU1MgcHJvcGVydHkgdmFsdWVzIGluIHBpeGVscy4gVGhlcmVmb3JlLCBpZiBhbiBlbmRWYWx1ZSB3aXRoIGEgdW5pdCB0eXBlIG9mXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAlLCBlbSwgb3IgcmVtIGlzIGFuaW1hdGVkIHRvd2FyZCwgc3RhcnRWYWx1ZSBtdXN0IGJlIGNvbnZlcnRlZCBmcm9tIHBpeGVscyBpbnRvIHRoZSBzYW1lIHVuaXQgdHlwZSBhcyBlbmRWYWx1ZSBpbiBvcmRlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIHZhbHVlIG1hbmlwdWxhdGlvbiBsb2dpYyAoaW5jcmVtZW50L2RlY3JlbWVudCkgdG8gcHJvY2VlZC4gRnVydGhlciwgaWYgdGhlIHN0YXJ0VmFsdWUgd2FzIGZvcmNlZmVkIG9yIHRyYW5zZmVycmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBmcm9tIGEgcHJldmlvdXMgY2FsbCwgc3RhcnRWYWx1ZSBtYXkgYWxzbyBub3QgYmUgaW4gcGl4ZWxzLiBVbml0IGNvbnZlcnNpb24gbG9naWMgdGhlcmVmb3JlIGNvbnNpc3RzIG9mIHR3byBzdGVwczpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIDEpIENhbGN1bGF0aW5nIHRoZSByYXRpbyBvZiAlL2VtL3JlbS92aC92dyByZWxhdGl2ZSB0byBwaXhlbHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIDIpIENvbnZlcnRpbmcgc3RhcnRWYWx1ZSBpbnRvIHRoZSBzYW1lIHVuaXQgb2YgbWVhc3VyZW1lbnQgYXMgZW5kVmFsdWUgYmFzZWQgb24gdGhlc2UgcmF0aW9zLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogVW5pdCBjb252ZXJzaW9uIHJhdGlvcyBhcmUgY2FsY3VsYXRlZCBieSBpbnNlcnRpbmcgYSBzaWJsaW5nIG5vZGUgbmV4dCB0byB0aGUgdGFyZ2V0IG5vZGUsIGNvcHlpbmcgb3ZlciBpdHMgcG9zaXRpb24gcHJvcGVydHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBzZXR0aW5nIHZhbHVlcyB3aXRoIHRoZSB0YXJnZXQgdW5pdCB0eXBlIHRoZW4gY29tcGFyaW5nIHRoZSByZXR1cm5lZCBwaXhlbCB2YWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IEV2ZW4gaWYgb25seSBvbmUgb2YgdGhlc2UgdW5pdCB0eXBlcyBpcyBiZWluZyBhbmltYXRlZCwgYWxsIHVuaXQgcmF0aW9zIGFyZSBjYWxjdWxhdGVkIGF0IG9uY2Ugc2luY2UgdGhlIG92ZXJoZWFkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBvZiBiYXRjaGluZyB0aGUgU0VUcyBhbmQgR0VUcyB0b2dldGhlciB1cGZyb250IG91dHdlaWdodHMgdGhlIHBvdGVudGlhbCBvdmVyaGVhZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgb2YgbGF5b3V0IHRocmFzaGluZyBjYXVzZWQgYnkgcmUtcXVlcnlpbmcgZm9yIHVuY2FsY3VsYXRlZCByYXRpb3MgZm9yIHN1YnNlcXVlbnRseS1wcm9jZXNzZWQgcHJvcGVydGllcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRvZG86IFNoaWZ0IHRoaXMgbG9naWMgaW50byB0aGUgY2FsbHMnIGZpcnN0IHRpY2sgaW5zdGFuY2Ugc28gdGhhdCBpdCdzIHN5bmNlZCB3aXRoIFJBRi4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGNhbGN1bGF0ZVVuaXRSYXRpb3MgKCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTYW1lIFJhdGlvIENoZWNrc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRoZSBwcm9wZXJ0aWVzIGJlbG93IGFyZSB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIHRoZSBlbGVtZW50IGRpZmZlcnMgc3VmZmljaWVudGx5IGZyb20gdGhpcyBjYWxsJ3NcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmV2aW91c2x5IGl0ZXJhdGVkIGVsZW1lbnQgdG8gYWxzbyBkaWZmZXIgaW4gaXRzIHVuaXQgY29udmVyc2lvbiByYXRpb3MuIElmIHRoZSBwcm9wZXJ0aWVzIG1hdGNoIHVwIHdpdGggdGhvc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZiB0aGUgcHJpb3IgZWxlbWVudCwgdGhlIHByaW9yIGVsZW1lbnQncyBjb252ZXJzaW9uIHJhdGlvcyBhcmUgdXNlZC4gTGlrZSBtb3N0IG9wdGltaXphdGlvbnMgaW4gVmVsb2NpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcyBpcyBkb25lIHRvIG1pbmltaXplIERPTSBxdWVyeWluZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2FtZVJhdGlvSW5kaWNhdG9ycyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG15UGFyZW50OiBlbGVtZW50LnBhcmVudE5vZGUgfHwgZG9jdW1lbnQuYm9keSwgLyogR0VUICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJwb3NpdGlvblwiKSwgLyogR0VUICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJmb250U2l6ZVwiKSAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRGV0ZXJtaW5lIGlmIHRoZSBzYW1lICUgcmF0aW8gY2FuIGJlIHVzZWQuICUgaXMgYmFzZWQgb24gdGhlIGVsZW1lbnQncyBwb3NpdGlvbiB2YWx1ZSBhbmQgaXRzIHBhcmVudCdzIHdpZHRoIGFuZCBoZWlnaHQgZGltZW5zaW9ucy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2FtZVBlcmNlbnRSYXRpbyA9ICgoc2FtZVJhdGlvSW5kaWNhdG9ycy5wb3NpdGlvbiA9PT0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0UG9zaXRpb24pICYmIChzYW1lUmF0aW9JbmRpY2F0b3JzLm15UGFyZW50ID09PSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RQYXJlbnQpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRGV0ZXJtaW5lIGlmIHRoZSBzYW1lIGVtIHJhdGlvIGNhbiBiZSB1c2VkLiBlbSBpcyByZWxhdGl2ZSB0byB0aGUgZWxlbWVudCdzIGZvbnRTaXplLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYW1lRW1SYXRpbyA9IChzYW1lUmF0aW9JbmRpY2F0b3JzLmZvbnRTaXplID09PSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RGb250U2l6ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTdG9yZSB0aGVzZSByYXRpbyBpbmRpY2F0b3JzIGNhbGwtd2lkZSBmb3IgdGhlIG5leHQgZWxlbWVudCB0byBjb21wYXJlIGFnYWluc3QuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0UGFyZW50ID0gc2FtZVJhdGlvSW5kaWNhdG9ycy5teVBhcmVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RQb3NpdGlvbiA9IHNhbWVSYXRpb0luZGljYXRvcnMucG9zaXRpb247XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0Rm9udFNpemUgPSBzYW1lUmF0aW9JbmRpY2F0b3JzLmZvbnRTaXplO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEVsZW1lbnQtU3BlY2lmaWMgVW5pdHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBJRTggcm91bmRzIHRvIHRoZSBuZWFyZXN0IHBpeGVsIHdoZW4gcmV0dXJuaW5nIENTUyB2YWx1ZXMsIHRodXMgd2UgcGVyZm9ybSBjb252ZXJzaW9ucyB1c2luZyBhIG1lYXN1cmVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2YgMTAwIChpbnN0ZWFkIG9mIDEpIHRvIGdpdmUgb3VyIHJhdGlvcyBhIHByZWNpc2lvbiBvZiBhdCBsZWFzdCAyIGRlY2ltYWwgdmFsdWVzLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtZWFzdXJlbWVudCA9IDEwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcyA9IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzYW1lRW1SYXRpbyB8fCAhc2FtZVBlcmNlbnRSYXRpbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZHVtbXkgPSBEYXRhKGVsZW1lbnQpLmlzU1ZHID8gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJyZWN0XCIpIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5pbml0KGR1bW15KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2FtZVJhdGlvSW5kaWNhdG9ycy5teVBhcmVudC5hcHBlbmRDaGlsZChkdW1teSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVG8gYWNjdXJhdGVseSBhbmQgY29uc2lzdGVudGx5IGNhbGN1bGF0ZSBjb252ZXJzaW9uIHJhdGlvcywgdGhlIGVsZW1lbnQncyBjYXNjYWRlZCBvdmVyZmxvdyBhbmQgYm94LXNpemluZyBhcmUgc3RyaXBwZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNpbWlsYXJseSwgc2luY2Ugd2lkdGgvaGVpZ2h0IGNhbiBiZSBhcnRpZmljaWFsbHkgY29uc3RyYWluZWQgYnkgdGhlaXIgbWluLS9tYXgtIGVxdWl2YWxlbnRzLCB0aGVzZSBhcmUgY29udHJvbGxlZCBmb3IgYXMgd2VsbC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogT3ZlcmZsb3cgbXVzdCBiZSBhbHNvIGJlIGNvbnRyb2xsZWQgZm9yIHBlci1heGlzIHNpbmNlIHRoZSBvdmVyZmxvdyBwcm9wZXJ0eSBvdmVyd3JpdGVzIGl0cyBwZXItYXhpcyB2YWx1ZXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChbIFwib3ZlcmZsb3dcIiwgXCJvdmVyZmxvd1hcIiwgXCJvdmVyZmxvd1lcIiBdLCBmdW5jdGlvbihpLCBwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuQ1NTLnNldFByb3BlcnR5VmFsdWUoZHVtbXksIHByb3BlcnR5LCBcImhpZGRlblwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LkNTUy5zZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBcInBvc2l0aW9uXCIsIHNhbWVSYXRpb0luZGljYXRvcnMucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5DU1Muc2V0UHJvcGVydHlWYWx1ZShkdW1teSwgXCJmb250U2l6ZVwiLCBzYW1lUmF0aW9JbmRpY2F0b3JzLmZvbnRTaXplKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuQ1NTLnNldFByb3BlcnR5VmFsdWUoZHVtbXksIFwiYm94U2l6aW5nXCIsIFwiY29udGVudC1ib3hcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogd2lkdGggYW5kIGhlaWdodCBhY3QgYXMgb3VyIHByb3h5IHByb3BlcnRpZXMgZm9yIG1lYXN1cmluZyB0aGUgaG9yaXpvbnRhbCBhbmQgdmVydGljYWwgJSByYXRpb3MuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChbIFwibWluV2lkdGhcIiwgXCJtYXhXaWR0aFwiLCBcIndpZHRoXCIsIFwibWluSGVpZ2h0XCIsIFwibWF4SGVpZ2h0XCIsIFwiaGVpZ2h0XCIgXSwgZnVuY3Rpb24oaSwgcHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LkNTUy5zZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBwcm9wZXJ0eSwgbWVhc3VyZW1lbnQgKyBcIiVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBwYWRkaW5nTGVmdCBhcmJpdHJhcmlseSBhY3RzIGFzIG91ciBwcm94eSBwcm9wZXJ0eSBmb3IgdGhlIGVtIHJhdGlvLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5DU1Muc2V0UHJvcGVydHlWYWx1ZShkdW1teSwgXCJwYWRkaW5nTGVmdFwiLCBtZWFzdXJlbWVudCArIFwiZW1cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRGl2aWRlIHRoZSByZXR1cm5lZCB2YWx1ZSBieSB0aGUgbWVhc3VyZW1lbnQgdG8gZ2V0IHRoZSByYXRpbyBiZXR3ZWVuIDElIGFuZCAxcHguIERlZmF1bHQgdG8gMSBzaW5jZSB3b3JraW5nIHdpdGggMCBjYW4gcHJvZHVjZSBJbmZpbml0ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcy5wZXJjZW50VG9QeFdpZHRoID0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0UGVyY2VudFRvUHhXaWR0aCA9IChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBcIndpZHRoXCIsIG51bGwsIHRydWUpKSB8fCAxKSAvIG1lYXN1cmVtZW50OyAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcy5wZXJjZW50VG9QeEhlaWdodCA9IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdFBlcmNlbnRUb1B4SGVpZ2h0ID0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZHVtbXksIFwiaGVpZ2h0XCIsIG51bGwsIHRydWUpKSB8fCAxKSAvIG1lYXN1cmVtZW50OyAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcy5lbVRvUHggPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RFbVRvUHggPSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShkdW1teSwgXCJwYWRkaW5nTGVmdFwiKSkgfHwgMSkgLyBtZWFzdXJlbWVudDsgLyogR0VUICovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2FtZVJhdGlvSW5kaWNhdG9ycy5teVBhcmVudC5yZW1vdmVDaGlsZChkdW1teSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcy5lbVRvUHggPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RFbVRvUHg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRSYXRpb3MucGVyY2VudFRvUHhXaWR0aCA9IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdFBlcmNlbnRUb1B4V2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRSYXRpb3MucGVyY2VudFRvUHhIZWlnaHQgPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RQZXJjZW50VG9QeEhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRWxlbWVudC1BZ25vc3RpYyBVbml0c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFdoZXJlYXMgJSBhbmQgZW0gcmF0aW9zIGFyZSBkZXRlcm1pbmVkIG9uIGEgcGVyLWVsZW1lbnQgYmFzaXMsIHRoZSByZW0gdW5pdCBvbmx5IG5lZWRzIHRvIGJlIGNoZWNrZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbmNlIHBlciBjYWxsIHNpbmNlIGl0J3MgZXhjbHVzaXZlbHkgZGVwZW5kYW50IHVwb24gZG9jdW1lbnQuYm9keSdzIGZvbnRTaXplLiBJZiB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdCBjYWxjdWxhdGVVbml0UmF0aW9zKCkgaXMgYmVpbmcgcnVuIGR1cmluZyB0aGlzIGNhbGwsIHJlbVRvUHggd2lsbCBzdGlsbCBiZSBzZXQgdG8gaXRzIGRlZmF1bHQgdmFsdWUgb2YgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzbyB3ZSBjYWxjdWxhdGUgaXQgbm93LiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYWxsVW5pdENvbnZlcnNpb25EYXRhLnJlbVRvUHggPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRGVmYXVsdCB0byBicm93c2VycycgZGVmYXVsdCBmb250U2l6ZSBvZiAxNnB4IGluIHRoZSBjYXNlIG9mIDAuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxVbml0Q29udmVyc2lvbkRhdGEucmVtVG9QeCA9IHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZG9jdW1lbnQuYm9keSwgXCJmb250U2l6ZVwiKSkgfHwgMTY7IC8qIEdFVCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNpbWlsYXJseSwgdmlld3BvcnQgdW5pdHMgYXJlICUtcmVsYXRpdmUgdG8gdGhlIHdpbmRvdydzIGlubmVyIGRpbWVuc2lvbnMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxVbml0Q29udmVyc2lvbkRhdGEudndUb1B4ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxVbml0Q29udmVyc2lvbkRhdGEudndUb1B4ID0gcGFyc2VGbG9hdCh3aW5kb3cuaW5uZXJXaWR0aCkgLyAxMDA7IC8qIEdFVCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsVW5pdENvbnZlcnNpb25EYXRhLnZoVG9QeCA9IHBhcnNlRmxvYXQod2luZG93LmlubmVySGVpZ2h0KSAvIDEwMDsgLyogR0VUICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcy5yZW1Ub1B4ID0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5yZW1Ub1B4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRSYXRpb3MudndUb1B4ID0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS52d1RvUHg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcy52aFRvUHggPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLnZoVG9QeDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChWZWxvY2l0eS5kZWJ1ZyA+PSAxKSBjb25zb2xlLmxvZyhcIlVuaXQgcmF0aW9zOiBcIiArIEpTT04uc3RyaW5naWZ5KHVuaXRSYXRpb3MpLCBlbGVtZW50KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1bml0UmF0aW9zO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFVuaXQgQ29udmVyc2lvblxuICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRoZSAqIGFuZCAvIG9wZXJhdG9ycywgd2hpY2ggYXJlIG5vdCBwYXNzZWQgaW4gd2l0aCBhbiBhc3NvY2lhdGVkIHVuaXQsIGluaGVyZW50bHkgdXNlIHN0YXJ0VmFsdWUncyB1bml0LiBTa2lwIHZhbHVlIGFuZCB1bml0IGNvbnZlcnNpb24uICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoL1tcXC8qXS8udGVzdChvcGVyYXRvcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZVVuaXRUeXBlID0gc3RhcnRWYWx1ZVVuaXRUeXBlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgc3RhcnRWYWx1ZSBhbmQgZW5kVmFsdWUgZGlmZmVyIGluIHVuaXQgdHlwZSwgY29udmVydCBzdGFydFZhbHVlIGludG8gdGhlIHNhbWUgdW5pdCB0eXBlIGFzIGVuZFZhbHVlIHNvIHRoYXQgaWYgZW5kVmFsdWVVbml0VHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgaXMgYSByZWxhdGl2ZSB1bml0ICglLCBlbSwgcmVtKSwgdGhlIHZhbHVlcyBzZXQgZHVyaW5nIHR3ZWVuaW5nIHdpbGwgY29udGludWUgdG8gYmUgYWNjdXJhdGVseSByZWxhdGl2ZSBldmVuIGlmIHRoZSBtZXRyaWNzIHRoZXkgZGVwZW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBvbiBhcmUgZHluYW1pY2FsbHkgY2hhbmdpbmcgZHVyaW5nIHRoZSBjb3Vyc2Ugb2YgdGhlIGFuaW1hdGlvbi4gQ29udmVyc2VseSwgaWYgd2UgYWx3YXlzIG5vcm1hbGl6ZWQgaW50byBweCBhbmQgdXNlZCBweCBmb3Igc2V0dGluZyB2YWx1ZXMsIHRoZSBweCByYXRpb1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgd291bGQgYmVjb21lIHN0YWxlIGlmIHRoZSBvcmlnaW5hbCB1bml0IGJlaW5nIGFuaW1hdGVkIHRvd2FyZCB3YXMgcmVsYXRpdmUgYW5kIHRoZSB1bmRlcmx5aW5nIG1ldHJpY3MgY2hhbmdlIGR1cmluZyB0aGUgYW5pbWF0aW9uLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogU2luY2UgMCBpcyAwIGluIGFueSB1bml0IHR5cGUsIG5vIGNvbnZlcnNpb24gaXMgbmVjZXNzYXJ5IHdoZW4gc3RhcnRWYWx1ZSBpcyAwIC0tIHdlIGp1c3Qgc3RhcnQgYXQgMCB3aXRoIGVuZFZhbHVlVW5pdFR5cGUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKChzdGFydFZhbHVlVW5pdFR5cGUgIT09IGVuZFZhbHVlVW5pdFR5cGUpICYmIHN0YXJ0VmFsdWUgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBVbml0IGNvbnZlcnNpb24gaXMgYWxzbyBza2lwcGVkIHdoZW4gZW5kVmFsdWUgaXMgMCwgYnV0ICpzdGFydFZhbHVlVW5pdFR5cGUqIG11c3QgYmUgdXNlZCBmb3IgdHdlZW4gdmFsdWVzIHRvIHJlbWFpbiBhY2N1cmF0ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBTa2lwcGluZyB1bml0IGNvbnZlcnNpb24gaGVyZSBtZWFucyB0aGF0IGlmIGVuZFZhbHVlVW5pdFR5cGUgd2FzIG9yaWdpbmFsbHkgYSByZWxhdGl2ZSB1bml0LCB0aGUgYW5pbWF0aW9uIHdvbid0IHJlbGF0aXZlbHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaCB0aGUgdW5kZXJseWluZyBtZXRyaWNzIGlmIHRoZXkgY2hhbmdlLCBidXQgdGhpcyBpcyBhY2NlcHRhYmxlIHNpbmNlIHdlJ3JlIGFuaW1hdGluZyB0b3dhcmQgaW52aXNpYmlsaXR5IGluc3RlYWQgb2YgdG93YXJkIHZpc2liaWxpdHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpY2ggcmVtYWlucyBwYXN0IHRoZSBwb2ludCBvZiB0aGUgYW5pbWF0aW9uJ3MgY29tcGxldGlvbi4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW5kVmFsdWUgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWVVbml0VHlwZSA9IHN0YXJ0VmFsdWVVbml0VHlwZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBCeSB0aGlzIHBvaW50LCB3ZSBjYW5ub3QgYXZvaWQgdW5pdCBjb252ZXJzaW9uIChpdCdzIHVuZGVzaXJhYmxlIHNpbmNlIGl0IGNhdXNlcyBsYXlvdXQgdGhyYXNoaW5nKS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSWYgd2UgaGF2ZW4ndCBhbHJlYWR5LCB3ZSB0cmlnZ2VyIGNhbGN1bGF0ZVVuaXRSYXRpb3MoKSwgd2hpY2ggcnVucyBvbmNlIHBlciBlbGVtZW50IHBlciBjYWxsLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50VW5pdENvbnZlcnNpb25EYXRhID0gZWxlbWVudFVuaXRDb252ZXJzaW9uRGF0YSB8fCBjYWxjdWxhdGVVbml0UmF0aW9zKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlIGZvbGxvd2luZyBSZWdFeCBtYXRjaGVzIENTUyBwcm9wZXJ0aWVzIHRoYXQgaGF2ZSB0aGVpciAlIHZhbHVlcyBtZWFzdXJlZCByZWxhdGl2ZSB0byB0aGUgeC1heGlzLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBXM0Mgc3BlYyBtYW5kYXRlcyB0aGF0IGFsbCBvZiBtYXJnaW4gYW5kIHBhZGRpbmcncyBwcm9wZXJ0aWVzIChldmVuIHRvcCBhbmQgYm90dG9tKSBhcmUgJS1yZWxhdGl2ZSB0byB0aGUgKndpZHRoKiBvZiB0aGUgcGFyZW50IGVsZW1lbnQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBheGlzID0gKC9tYXJnaW58cGFkZGluZ3xsZWZ0fHJpZ2h0fHdpZHRofHRleHR8d29yZHxsZXR0ZXIvaS50ZXN0KHByb3BlcnR5KSB8fCAvWCQvLnRlc3QocHJvcGVydHkpIHx8IHByb3BlcnR5ID09PSBcInhcIikgPyBcInhcIiA6IFwieVwiO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEluIG9yZGVyIHRvIGF2b2lkIGdlbmVyYXRpbmcgbl4yIGJlc3Bva2UgY29udmVyc2lvbiBmdW5jdGlvbnMsIHVuaXQgY29udmVyc2lvbiBpcyBhIHR3by1zdGVwIHByb2Nlc3M6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDEpIENvbnZlcnQgc3RhcnRWYWx1ZSBpbnRvIHBpeGVscy4gMikgQ29udmVydCB0aGlzIG5ldyBwaXhlbCB2YWx1ZSBpbnRvIGVuZFZhbHVlJ3MgdW5pdCB0eXBlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHN0YXJ0VmFsdWVVbml0VHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIiVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiB0cmFuc2xhdGVYIGFuZCB0cmFuc2xhdGVZIGFyZSB0aGUgb25seSBwcm9wZXJ0aWVzIHRoYXQgYXJlICUtcmVsYXRpdmUgdG8gYW4gZWxlbWVudCdzIG93biBkaW1lbnNpb25zIC0tIG5vdCBpdHMgcGFyZW50J3MgZGltZW5zaW9ucy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eSBkb2VzIG5vdCBpbmNsdWRlIGEgc3BlY2lhbCBjb252ZXJzaW9uIHByb2Nlc3MgdG8gYWNjb3VudCBmb3IgdGhpcyBiZWhhdmlvci4gVGhlcmVmb3JlLCBhbmltYXRpbmcgdHJhbnNsYXRlWC9ZIGZyb20gYSAlIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG8gYSBub24tJSB2YWx1ZSB3aWxsIHByb2R1Y2UgYW4gaW5jb3JyZWN0IHN0YXJ0IHZhbHVlLiBGb3J0dW5hdGVseSwgdGhpcyBzb3J0IG9mIGNyb3NzLXVuaXQgY29udmVyc2lvbiBpcyByYXJlbHkgZG9uZSBieSB1c2VycyBpbiBwcmFjdGljZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlICo9IChheGlzID09PSBcInhcIiA/IGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGEucGVyY2VudFRvUHhXaWR0aCA6IGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGEucGVyY2VudFRvUHhIZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwicHhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBweCBhY3RzIGFzIG91ciBtaWRwb2ludCBpbiB0aGUgdW5pdCBjb252ZXJzaW9uIHByb2Nlc3M7IGRvIG5vdGhpbmcuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSAqPSBlbGVtZW50VW5pdENvbnZlcnNpb25EYXRhW3N0YXJ0VmFsdWVVbml0VHlwZSArIFwiVG9QeFwiXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEludmVydCB0aGUgcHggcmF0aW9zIHRvIGNvbnZlcnQgaW50byB0byB0aGUgdGFyZ2V0IHVuaXQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoZW5kVmFsdWVVbml0VHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIiVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlICo9IDEgLyAoYXhpcyA9PT0gXCJ4XCIgPyBlbGVtZW50VW5pdENvbnZlcnNpb25EYXRhLnBlcmNlbnRUb1B4V2lkdGggOiBlbGVtZW50VW5pdENvbnZlcnNpb25EYXRhLnBlcmNlbnRUb1B4SGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInB4XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogc3RhcnRWYWx1ZSBpcyBhbHJlYWR5IGluIHB4LCBkbyBub3RoaW5nOyB3ZSdyZSBkb25lLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgKj0gMSAvIGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGFbZW5kVmFsdWVVbml0VHlwZSArIFwiVG9QeFwiXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVsYXRpdmUgVmFsdWVzXG4gICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIE9wZXJhdG9yIGxvZ2ljIG11c3QgYmUgcGVyZm9ybWVkIGxhc3Qgc2luY2UgaXQgcmVxdWlyZXMgdW5pdC1ub3JtYWxpemVkIHN0YXJ0IGFuZCBlbmQgdmFsdWVzLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogUmVsYXRpdmUgKnBlcmNlbnQgdmFsdWVzKiBkbyBub3QgYmVoYXZlIGhvdyBtb3N0IHBlb3BsZSB0aGluazsgd2hpbGUgb25lIHdvdWxkIGV4cGVjdCBcIis9NTAlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvIGluY3JlYXNlIHRoZSBwcm9wZXJ0eSAxLjV4IGl0cyBjdXJyZW50IHZhbHVlLCBpdCBpbiBmYWN0IGluY3JlYXNlcyB0aGUgcGVyY2VudCB1bml0cyBpbiBhYnNvbHV0ZSB0ZXJtczpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIDUwIHBvaW50cyBpcyBhZGRlZCBvbiB0b3Agb2YgdGhlIGN1cnJlbnQgJSB2YWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiK1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IHN0YXJ0VmFsdWUgKyBlbmRWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiLVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IHN0YXJ0VmFsdWUgLSBlbmRWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiKlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IHN0YXJ0VmFsdWUgKiBlbmRWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiL1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IHN0YXJ0VmFsdWUgLyBlbmRWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW5zQ29udGFpbmVyIFB1c2hcbiAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBDb25zdHJ1Y3QgdGhlIHBlci1wcm9wZXJ0eSB0d2VlbiBvYmplY3QsIGFuZCBwdXNoIGl0IHRvIHRoZSBlbGVtZW50J3MgdHdlZW5zQ29udGFpbmVyLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW5zQ29udGFpbmVyW3Byb3BlcnR5XSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZTogcm9vdFByb3BlcnR5VmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZTogc3RhcnRWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWU6IHN0YXJ0VmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWU6IGVuZFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRUeXBlOiBlbmRWYWx1ZVVuaXRUeXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVhc2luZzogZWFzaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoVmVsb2NpdHkuZGVidWcpIGNvbnNvbGUubG9nKFwidHdlZW5zQ29udGFpbmVyIChcIiArIHByb3BlcnR5ICsgXCIpOiBcIiArIEpTT04uc3RyaW5naWZ5KHR3ZWVuc0NvbnRhaW5lcltwcm9wZXJ0eV0pLCBlbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8qIEFsb25nIHdpdGggaXRzIHByb3BlcnR5IGRhdGEsIHN0b3JlIGEgcmVmZXJlbmNlIHRvIHRoZSBlbGVtZW50IGl0c2VsZiBvbnRvIHR3ZWVuc0NvbnRhaW5lci4gKi9cbiAgICAgICAgICAgICAgICAgICAgdHdlZW5zQ29udGFpbmVyLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICBDYWxsIFB1c2hcbiAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgIC8qIE5vdGU6IHR3ZWVuc0NvbnRhaW5lciBjYW4gYmUgZW1wdHkgaWYgYWxsIG9mIHRoZSBwcm9wZXJ0aWVzIGluIHRoaXMgY2FsbCdzIHByb3BlcnR5IG1hcCB3ZXJlIHNraXBwZWQgZHVlIHRvIG5vdFxuICAgICAgICAgICAgICAgICAgIGJlaW5nIHN1cHBvcnRlZCBieSB0aGUgYnJvd3Nlci4gVGhlIGVsZW1lbnQgcHJvcGVydHkgaXMgdXNlZCBmb3IgY2hlY2tpbmcgdGhhdCB0aGUgdHdlZW5zQ29udGFpbmVyIGhhcyBiZWVuIGFwcGVuZGVkIHRvLiAqL1xuICAgICAgICAgICAgICAgIGlmICh0d2VlbnNDb250YWluZXIuZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAvKiBBcHBseSB0aGUgXCJ2ZWxvY2l0eS1hbmltYXRpbmdcIiBpbmRpY2F0b3IgY2xhc3MuICovXG4gICAgICAgICAgICAgICAgICAgIENTUy5WYWx1ZXMuYWRkQ2xhc3MoZWxlbWVudCwgXCJ2ZWxvY2l0eS1hbmltYXRpbmdcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgLyogVGhlIGNhbGwgYXJyYXkgaG91c2VzIHRoZSB0d2VlbnNDb250YWluZXJzIGZvciBlYWNoIGVsZW1lbnQgYmVpbmcgYW5pbWF0ZWQgaW4gdGhlIGN1cnJlbnQgY2FsbC4gKi9cbiAgICAgICAgICAgICAgICAgICAgY2FsbC5wdXNoKHR3ZWVuc0NvbnRhaW5lcik7XG5cbiAgICAgICAgICAgICAgICAgICAgLyogU3RvcmUgdGhlIHR3ZWVuc0NvbnRhaW5lciBhbmQgb3B0aW9ucyBpZiB3ZSdyZSB3b3JraW5nIG9uIHRoZSBkZWZhdWx0IGVmZmVjdHMgcXVldWUsIHNvIHRoYXQgdGhleSBjYW4gYmUgdXNlZCBieSB0aGUgcmV2ZXJzZSBjb21tYW5kLiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5xdWV1ZSA9PT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS50d2VlbnNDb250YWluZXIgPSB0d2VlbnNDb250YWluZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLm9wdHMgPSBvcHRzO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLyogU3dpdGNoIG9uIHRoZSBlbGVtZW50J3MgYW5pbWF0aW5nIGZsYWcuICovXG4gICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkuaXNBbmltYXRpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIE9uY2UgdGhlIGZpbmFsIGVsZW1lbnQgaW4gdGhpcyBjYWxsJ3MgZWxlbWVudCBzZXQgaGFzIGJlZW4gcHJvY2Vzc2VkLCBwdXNoIHRoZSBjYWxsIGFycmF5IG9udG9cbiAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuU3RhdGUuY2FsbHMgZm9yIHRoZSBhbmltYXRpb24gdGljayB0byBpbW1lZGlhdGVseSBiZWdpbiBwcm9jZXNzaW5nLiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudHNJbmRleCA9PT0gZWxlbWVudHNMZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBBZGQgdGhlIGN1cnJlbnQgY2FsbCBwbHVzIGl0cyBhc3NvY2lhdGVkIG1ldGFkYXRhICh0aGUgZWxlbWVudCBzZXQgYW5kIHRoZSBjYWxsJ3Mgb3B0aW9ucykgb250byB0aGUgZ2xvYmFsIGNhbGwgY29udGFpbmVyLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgQW55dGhpbmcgb24gdGhpcyBjYWxsIGNvbnRhaW5lciBpcyBzdWJqZWN0ZWQgdG8gdGljaygpIHByb2Nlc3NpbmcuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5TdGF0ZS5jYWxscy5wdXNoKFsgY2FsbCwgZWxlbWVudHMsIG9wdHMsIG51bGwsIHByb21pc2VEYXRhLnJlc29sdmVyIF0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgYW5pbWF0aW9uIHRpY2sgaXNuJ3QgcnVubmluZywgc3RhcnQgaXQuIChWZWxvY2l0eSBzaHV0cyBpdCBvZmYgd2hlbiB0aGVyZSBhcmUgbm8gYWN0aXZlIGNhbGxzIHRvIHByb2Nlc3MuKSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFZlbG9jaXR5LlN0YXRlLmlzVGlja2luZyA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5TdGF0ZS5pc1RpY2tpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU3RhcnQgdGhlIHRpY2sgbG9vcC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aWNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50c0luZGV4Kys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIFdoZW4gdGhlIHF1ZXVlIG9wdGlvbiBpcyBzZXQgdG8gZmFsc2UsIHRoZSBjYWxsIHNraXBzIHRoZSBlbGVtZW50J3MgcXVldWUgYW5kIGZpcmVzIGltbWVkaWF0ZWx5LiAqL1xuICAgICAgICAgICAgaWYgKG9wdHMucXVldWUgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgLyogU2luY2UgdGhpcyBidWlsZFF1ZXVlIGNhbGwgZG9lc24ndCByZXNwZWN0IHRoZSBlbGVtZW50J3MgZXhpc3RpbmcgcXVldWUgKHdoaWNoIGlzIHdoZXJlIGEgZGVsYXkgb3B0aW9uIHdvdWxkIGhhdmUgYmVlbiBhcHBlbmRlZCksXG4gICAgICAgICAgICAgICAgICAgd2UgbWFudWFsbHkgaW5qZWN0IHRoZSBkZWxheSBwcm9wZXJ0eSBoZXJlIHdpdGggYW4gZXhwbGljaXQgc2V0VGltZW91dC4gKi9cbiAgICAgICAgICAgICAgICBpZiAob3B0cy5kZWxheSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGJ1aWxkUXVldWUsIG9wdHMuZGVsYXkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGJ1aWxkUXVldWUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAvKiBPdGhlcndpc2UsIHRoZSBjYWxsIHVuZGVyZ29lcyBlbGVtZW50IHF1ZXVlaW5nIGFzIG5vcm1hbC4gKi9cbiAgICAgICAgICAgIC8qIE5vdGU6IFRvIGludGVyb3BlcmF0ZSB3aXRoIGpRdWVyeSwgVmVsb2NpdHkgdXNlcyBqUXVlcnkncyBvd24gJC5xdWV1ZSgpIHN0YWNrIGZvciBxdWV1aW5nIGxvZ2ljLiAqL1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkLnF1ZXVlKGVsZW1lbnQsIG9wdHMucXVldWUsIGZ1bmN0aW9uKG5leHQsIGNsZWFyUXVldWUpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGNsZWFyUXVldWUgZmxhZyB3YXMgcGFzc2VkIGluIGJ5IHRoZSBzdG9wIGNvbW1hbmQsIHJlc29sdmUgdGhpcyBjYWxsJ3MgcHJvbWlzZS4gKFByb21pc2VzIGNhbiBvbmx5IGJlIHJlc29sdmVkIG9uY2UsXG4gICAgICAgICAgICAgICAgICAgICAgIHNvIGl0J3MgZmluZSBpZiB0aGlzIGlzIHJlcGVhdGVkbHkgdHJpZ2dlcmVkIGZvciBlYWNoIGVsZW1lbnQgaW4gdGhlIGFzc29jaWF0ZWQgY2FsbC4pICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChjbGVhclF1ZXVlID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvbWlzZURhdGEucHJvbWlzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VEYXRhLnJlc29sdmVyKGVsZW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogRG8gbm90IGNvbnRpbnVlIHdpdGggYW5pbWF0aW9uIHF1ZXVlaW5nLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBUaGlzIGZsYWcgaW5kaWNhdGVzIHRvIHRoZSB1cGNvbWluZyBjb21wbGV0ZUNhbGwoKSBmdW5jdGlvbiB0aGF0IHRoaXMgcXVldWUgZW50cnkgd2FzIGluaXRpYXRlZCBieSBWZWxvY2l0eS5cbiAgICAgICAgICAgICAgICAgICAgICAgU2VlIGNvbXBsZXRlQ2FsbCgpIGZvciBmdXJ0aGVyIGRldGFpbHMuICovXG4gICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LnZlbG9jaXR5UXVldWVFbnRyeUZsYWcgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIGJ1aWxkUXVldWUobmV4dCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICBBdXRvLURlcXVldWluZ1xuICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAvKiBBcyBwZXIgalF1ZXJ5J3MgJC5xdWV1ZSgpIGJlaGF2aW9yLCB0byBmaXJlIHRoZSBmaXJzdCBub24tY3VzdG9tLXF1ZXVlIGVudHJ5IG9uIGFuIGVsZW1lbnQsIHRoZSBlbGVtZW50XG4gICAgICAgICAgICAgICBtdXN0IGJlIGRlcXVldWVkIGlmIGl0cyBxdWV1ZSBzdGFjayBjb25zaXN0cyAqc29sZWx5KiBvZiB0aGUgY3VycmVudCBjYWxsLiAoVGhpcyBjYW4gYmUgZGV0ZXJtaW5lZCBieSBjaGVja2luZ1xuICAgICAgICAgICAgICAgZm9yIHRoZSBcImlucHJvZ3Jlc3NcIiBpdGVtIHRoYXQgalF1ZXJ5IHByZXBlbmRzIHRvIGFjdGl2ZSBxdWV1ZSBzdGFjayBhcnJheXMuKSBSZWdhcmRsZXNzLCB3aGVuZXZlciB0aGUgZWxlbWVudCdzXG4gICAgICAgICAgICAgICBxdWV1ZSBpcyBmdXJ0aGVyIGFwcGVuZGVkIHdpdGggYWRkaXRpb25hbCBpdGVtcyAtLSBpbmNsdWRpbmcgJC5kZWxheSgpJ3Mgb3IgZXZlbiAkLmFuaW1hdGUoKSBjYWxscywgdGhlIHF1ZXVlJ3NcbiAgICAgICAgICAgICAgIGZpcnN0IGVudHJ5IGlzIGF1dG9tYXRpY2FsbHkgZmlyZWQuIFRoaXMgYmVoYXZpb3IgY29udHJhc3RzIHRoYXQgb2YgY3VzdG9tIHF1ZXVlcywgd2hpY2ggbmV2ZXIgYXV0by1maXJlLiAqL1xuICAgICAgICAgICAgLyogTm90ZTogV2hlbiBhbiBlbGVtZW50IHNldCBpcyBiZWluZyBzdWJqZWN0ZWQgdG8gYSBub24tcGFyYWxsZWwgVmVsb2NpdHkgY2FsbCwgdGhlIGFuaW1hdGlvbiB3aWxsIG5vdCBiZWdpbiB1bnRpbFxuICAgICAgICAgICAgICAgZWFjaCBvbmUgb2YgdGhlIGVsZW1lbnRzIGluIHRoZSBzZXQgaGFzIHJlYWNoZWQgdGhlIGVuZCBvZiBpdHMgaW5kaXZpZHVhbGx5IHByZS1leGlzdGluZyBxdWV1ZSBjaGFpbi4gKi9cbiAgICAgICAgICAgIC8qIE5vdGU6IFVuZm9ydHVuYXRlbHksIG1vc3QgcGVvcGxlIGRvbid0IGZ1bGx5IGdyYXNwIGpRdWVyeSdzIHBvd2VyZnVsLCB5ZXQgcXVpcmt5LCAkLnF1ZXVlKCkgZnVuY3Rpb24uXG4gICAgICAgICAgICAgICBMZWFuIG1vcmUgaGVyZTogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDU4MTU4L2Nhbi1zb21lYm9keS1leHBsYWluLWpxdWVyeS1xdWV1ZS10by1tZSAqL1xuICAgICAgICAgICAgaWYgKChvcHRzLnF1ZXVlID09PSBcIlwiIHx8IG9wdHMucXVldWUgPT09IFwiZnhcIikgJiYgJC5xdWV1ZShlbGVtZW50KVswXSAhPT0gXCJpbnByb2dyZXNzXCIpIHtcbiAgICAgICAgICAgICAgICAkLmRlcXVldWUoZWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgRWxlbWVudCBTZXQgSXRlcmF0aW9uXG4gICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgIC8qIElmIHRoZSBcIm5vZGVUeXBlXCIgcHJvcGVydHkgZXhpc3RzIG9uIHRoZSBlbGVtZW50cyB2YXJpYWJsZSwgd2UncmUgYW5pbWF0aW5nIGEgc2luZ2xlIGVsZW1lbnQuXG4gICAgICAgICAgIFBsYWNlIGl0IGluIGFuIGFycmF5IHNvIHRoYXQgJC5lYWNoKCkgY2FuIGl0ZXJhdGUgb3ZlciBpdC4gKi9cbiAgICAgICAgJC5lYWNoKGVsZW1lbnRzLCBmdW5jdGlvbihpLCBlbGVtZW50KSB7XG4gICAgICAgICAgICAvKiBFbnN1cmUgZWFjaCBlbGVtZW50IGluIGEgc2V0IGhhcyBhIG5vZGVUeXBlIChpcyBhIHJlYWwgZWxlbWVudCkgdG8gYXZvaWQgdGhyb3dpbmcgZXJyb3JzLiAqL1xuICAgICAgICAgICAgaWYgKFR5cGUuaXNOb2RlKGVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgcHJvY2Vzc0VsZW1lbnQuY2FsbChlbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLyoqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICBPcHRpb246IExvb3BcbiAgICAgICAgKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgIC8qIFRoZSBsb29wIG9wdGlvbiBhY2NlcHRzIGFuIGludGVnZXIgaW5kaWNhdGluZyBob3cgbWFueSB0aW1lcyB0aGUgZWxlbWVudCBzaG91bGQgbG9vcCBiZXR3ZWVuIHRoZSB2YWx1ZXMgaW4gdGhlXG4gICAgICAgICAgIGN1cnJlbnQgY2FsbCdzIHByb3BlcnRpZXMgbWFwIGFuZCB0aGUgZWxlbWVudCdzIHByb3BlcnR5IHZhbHVlcyBwcmlvciB0byB0aGlzIGNhbGwuICovXG4gICAgICAgIC8qIE5vdGU6IFRoZSBsb29wIG9wdGlvbidzIGxvZ2ljIGlzIHBlcmZvcm1lZCBoZXJlIC0tIGFmdGVyIGVsZW1lbnQgcHJvY2Vzc2luZyAtLSBiZWNhdXNlIHRoZSBjdXJyZW50IGNhbGwgbmVlZHNcbiAgICAgICAgICAgdG8gdW5kZXJnbyBpdHMgcXVldWUgaW5zZXJ0aW9uIHByaW9yIHRvIHRoZSBsb29wIG9wdGlvbiBnZW5lcmF0aW5nIGl0cyBzZXJpZXMgb2YgY29uc3RpdHVlbnQgXCJyZXZlcnNlXCIgY2FsbHMsXG4gICAgICAgICAgIHdoaWNoIGNoYWluIGFmdGVyIHRoZSBjdXJyZW50IGNhbGwuIFR3byByZXZlcnNlIGNhbGxzICh0d28gXCJhbHRlcm5hdGlvbnNcIikgY29uc3RpdHV0ZSBvbmUgbG9vcC4gKi9cbiAgICAgICAgdmFyIG9wdHMgPSAkLmV4dGVuZCh7fSwgVmVsb2NpdHkuZGVmYXVsdHMsIG9wdGlvbnMpLFxuICAgICAgICAgICAgcmV2ZXJzZUNhbGxzQ291bnQ7XG5cbiAgICAgICAgb3B0cy5sb29wID0gcGFyc2VJbnQob3B0cy5sb29wKTtcbiAgICAgICAgcmV2ZXJzZUNhbGxzQ291bnQgPSAob3B0cy5sb29wICogMikgLSAxO1xuXG4gICAgICAgIGlmIChvcHRzLmxvb3ApIHtcbiAgICAgICAgICAgIC8qIERvdWJsZSB0aGUgbG9vcCBjb3VudCB0byBjb252ZXJ0IGl0IGludG8gaXRzIGFwcHJvcHJpYXRlIG51bWJlciBvZiBcInJldmVyc2VcIiBjYWxscy5cbiAgICAgICAgICAgICAgIFN1YnRyYWN0IDEgZnJvbSB0aGUgcmVzdWx0aW5nIHZhbHVlIHNpbmNlIHRoZSBjdXJyZW50IGNhbGwgaXMgaW5jbHVkZWQgaW4gdGhlIHRvdGFsIGFsdGVybmF0aW9uIGNvdW50LiAqL1xuICAgICAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPCByZXZlcnNlQ2FsbHNDb3VudDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgLyogU2luY2UgdGhlIGxvZ2ljIGZvciB0aGUgcmV2ZXJzZSBhY3Rpb24gb2NjdXJzIGluc2lkZSBRdWV1ZWluZyBhbmQgdGhlcmVmb3JlIHRoaXMgY2FsbCdzIG9wdGlvbnMgb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgaXNuJ3QgcGFyc2VkIHVudGlsIHRoZW4gYXMgd2VsbCwgdGhlIGN1cnJlbnQgY2FsbCdzIGRlbGF5IG9wdGlvbiBtdXN0IGJlIGV4cGxpY2l0bHkgcGFzc2VkIGludG8gdGhlIHJldmVyc2VcbiAgICAgICAgICAgICAgICAgICBjYWxsIHNvIHRoYXQgdGhlIGRlbGF5IGxvZ2ljIHRoYXQgb2NjdXJzIGluc2lkZSAqUHJlLVF1ZXVlaW5nKiBjYW4gcHJvY2VzcyBpdC4gKi9cbiAgICAgICAgICAgICAgICB2YXIgcmV2ZXJzZU9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGF5OiBvcHRzLmRlbGF5LFxuICAgICAgICAgICAgICAgICAgICBwcm9ncmVzczogb3B0cy5wcm9ncmVzc1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKiBJZiBhIGNvbXBsZXRlIGNhbGxiYWNrIHdhcyBwYXNzZWQgaW50byB0aGlzIGNhbGwsIHRyYW5zZmVyIGl0IHRvIHRoZSBsb29wIHJlZGlyZWN0J3MgZmluYWwgXCJyZXZlcnNlXCIgY2FsbFxuICAgICAgICAgICAgICAgICAgIHNvIHRoYXQgaXQncyB0cmlnZ2VyZWQgd2hlbiB0aGUgZW50aXJlIHJlZGlyZWN0IGlzIGNvbXBsZXRlIChhbmQgbm90IHdoZW4gdGhlIHZlcnkgZmlyc3QgYW5pbWF0aW9uIGlzIGNvbXBsZXRlKS4gKi9cbiAgICAgICAgICAgICAgICBpZiAoeCA9PT0gcmV2ZXJzZUNhbGxzQ291bnQgLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldmVyc2VPcHRpb25zLmRpc3BsYXkgPSBvcHRzLmRpc3BsYXk7XG4gICAgICAgICAgICAgICAgICAgIHJldmVyc2VPcHRpb25zLnZpc2liaWxpdHkgPSBvcHRzLnZpc2liaWxpdHk7XG4gICAgICAgICAgICAgICAgICAgIHJldmVyc2VPcHRpb25zLmNvbXBsZXRlID0gb3B0cy5jb21wbGV0ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBhbmltYXRlKGVsZW1lbnRzLCBcInJldmVyc2VcIiwgcmV2ZXJzZU9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqKioqKioqKioqKioqKlxuICAgICAgICAgICAgQ2hhaW5pbmdcbiAgICAgICAgKioqKioqKioqKioqKioqL1xuXG4gICAgICAgIC8qIFJldHVybiB0aGUgZWxlbWVudHMgYmFjayB0byB0aGUgY2FsbCBjaGFpbiwgd2l0aCB3cmFwcGVkIGVsZW1lbnRzIHRha2luZyBwcmVjZWRlbmNlIGluIGNhc2UgVmVsb2NpdHkgd2FzIGNhbGxlZCB2aWEgdGhlICQuZm4uIGV4dGVuc2lvbi4gKi9cbiAgICAgICAgcmV0dXJuIGdldENoYWluKCk7XG4gICAgfTtcblxuICAgIC8qIFR1cm4gVmVsb2NpdHkgaW50byB0aGUgYW5pbWF0aW9uIGZ1bmN0aW9uLCBleHRlbmRlZCB3aXRoIHRoZSBwcmUtZXhpc3RpbmcgVmVsb2NpdHkgb2JqZWN0LiAqL1xuICAgIFZlbG9jaXR5ID0gJC5leHRlbmQoYW5pbWF0ZSwgVmVsb2NpdHkpO1xuICAgIC8qIEZvciBsZWdhY3kgc3VwcG9ydCwgYWxzbyBleHBvc2UgdGhlIGxpdGVyYWwgYW5pbWF0ZSBtZXRob2QuICovXG4gICAgVmVsb2NpdHkuYW5pbWF0ZSA9IGFuaW1hdGU7XG5cbiAgICAvKioqKioqKioqKioqKipcbiAgICAgICAgVGltaW5nXG4gICAgKioqKioqKioqKioqKiovXG5cbiAgICAvKiBUaWNrZXIgZnVuY3Rpb24uICovXG4gICAgdmFyIHRpY2tlciA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgckFGU2hpbTtcblxuICAgIC8qIEluYWN0aXZlIGJyb3dzZXIgdGFicyBwYXVzZSByQUYsIHdoaWNoIHJlc3VsdHMgaW4gYWxsIGFjdGl2ZSBhbmltYXRpb25zIGltbWVkaWF0ZWx5IHNwcmludGluZyB0byB0aGVpciBjb21wbGV0aW9uIHN0YXRlcyB3aGVuIHRoZSB0YWIgcmVmb2N1c2VzLlxuICAgICAgIFRvIGdldCBhcm91bmQgdGhpcywgd2UgZHluYW1pY2FsbHkgc3dpdGNoIHJBRiB0byBzZXRUaW1lb3V0ICh3aGljaCB0aGUgYnJvd3NlciAqZG9lc24ndCogcGF1c2UpIHdoZW4gdGhlIHRhYiBsb3NlcyBmb2N1cy4gV2Ugc2tpcCB0aGlzIGZvciBtb2JpbGVcbiAgICAgICBkZXZpY2VzIHRvIGF2b2lkIHdhc3RpbmcgYmF0dGVyeSBwb3dlciBvbiBpbmFjdGl2ZSB0YWJzLiAqL1xuICAgIC8qIE5vdGU6IFRhYiBmb2N1cyBkZXRlY3Rpb24gZG9lc24ndCB3b3JrIG9uIG9sZGVyIHZlcnNpb25zIG9mIElFLCBidXQgdGhhdCdzIG9rYXkgc2luY2UgdGhleSBkb24ndCBzdXBwb3J0IHJBRiB0byBiZWdpbiB3aXRoLiAqL1xuICAgIGlmICghVmVsb2NpdHkuU3RhdGUuaXNNb2JpbGUgJiYgZG9jdW1lbnQuaGlkZGVuICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInZpc2liaWxpdHljaGFuZ2VcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvKiBSZWFzc2lnbiB0aGUgckFGIGZ1bmN0aW9uICh3aGljaCB0aGUgZ2xvYmFsIHRpY2soKSBmdW5jdGlvbiB1c2VzKSBiYXNlZCBvbiB0aGUgdGFiJ3MgZm9jdXMgc3RhdGUuICovXG4gICAgICAgICAgICBpZiAoZG9jdW1lbnQuaGlkZGVuKSB7XG4gICAgICAgICAgICAgICAgdGlja2VyID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgLyogVGhlIHRpY2sgZnVuY3Rpb24gbmVlZHMgYSB0cnV0aHkgZmlyc3QgYXJndW1lbnQgaW4gb3JkZXIgdG8gcGFzcyBpdHMgaW50ZXJuYWwgdGltZXN0YW1wIGNoZWNrLiAqL1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2sodHJ1ZSkgfSwgMTYpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvKiBUaGUgckFGIGxvb3AgaGFzIGJlZW4gcGF1c2VkIGJ5IHRoZSBicm93c2VyLCBzbyB3ZSBtYW51YWxseSByZXN0YXJ0IHRoZSB0aWNrLiAqL1xuICAgICAgICAgICAgICAgIHRpY2soKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGlja2VyID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCByQUZTaGltO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqXG4gICAgICAgIFRpY2tcbiAgICAqKioqKioqKioqKiovXG5cbiAgICAvKiBOb3RlOiBBbGwgY2FsbHMgdG8gVmVsb2NpdHkgYXJlIHB1c2hlZCB0byB0aGUgVmVsb2NpdHkuU3RhdGUuY2FsbHMgYXJyYXksIHdoaWNoIGlzIGZ1bGx5IGl0ZXJhdGVkIHRocm91Z2ggdXBvbiBlYWNoIHRpY2suICovXG4gICAgZnVuY3Rpb24gdGljayAodGltZXN0YW1wKSB7XG4gICAgICAgIC8qIEFuIGVtcHR5IHRpbWVzdGFtcCBhcmd1bWVudCBpbmRpY2F0ZXMgdGhhdCB0aGlzIGlzIHRoZSBmaXJzdCB0aWNrIG9jY3VyZW5jZSBzaW5jZSB0aWNraW5nIHdhcyB0dXJuZWQgb24uXG4gICAgICAgICAgIFdlIGxldmVyYWdlIHRoaXMgbWV0YWRhdGEgdG8gZnVsbHkgaWdub3JlIHRoZSBmaXJzdCB0aWNrIHBhc3Mgc2luY2UgUkFGJ3MgaW5pdGlhbCBwYXNzIGlzIGZpcmVkIHdoZW5ldmVyXG4gICAgICAgICAgIHRoZSBicm93c2VyJ3MgbmV4dCB0aWNrIHN5bmMgdGltZSBvY2N1cnMsIHdoaWNoIHJlc3VsdHMgaW4gdGhlIGZpcnN0IGVsZW1lbnRzIHN1YmplY3RlZCB0byBWZWxvY2l0eVxuICAgICAgICAgICBjYWxscyBiZWluZyBhbmltYXRlZCBvdXQgb2Ygc3luYyB3aXRoIGFueSBlbGVtZW50cyBhbmltYXRlZCBpbW1lZGlhdGVseSB0aGVyZWFmdGVyLiBJbiBzaG9ydCwgd2UgaWdub3JlXG4gICAgICAgICAgIHRoZSBmaXJzdCBSQUYgdGljayBwYXNzIHNvIHRoYXQgZWxlbWVudHMgYmVpbmcgaW1tZWRpYXRlbHkgY29uc2VjdXRpdmVseSBhbmltYXRlZCAtLSBpbnN0ZWFkIG9mIHNpbXVsdGFuZW91c2x5IGFuaW1hdGVkXG4gICAgICAgICAgIGJ5IHRoZSBzYW1lIFZlbG9jaXR5IGNhbGwgLS0gYXJlIHByb3Blcmx5IGJhdGNoZWQgaW50byB0aGUgc2FtZSBpbml0aWFsIFJBRiB0aWNrIGFuZCBjb25zZXF1ZW50bHkgcmVtYWluIGluIHN5bmMgdGhlcmVhZnRlci4gKi9cbiAgICAgICAgaWYgKHRpbWVzdGFtcCkge1xuICAgICAgICAgICAgLyogV2UgaWdub3JlIFJBRidzIGhpZ2ggcmVzb2x1dGlvbiB0aW1lc3RhbXAgc2luY2UgaXQgY2FuIGJlIHNpZ25pZmljYW50bHkgb2Zmc2V0IHdoZW4gdGhlIGJyb3dzZXIgaXNcbiAgICAgICAgICAgICAgIHVuZGVyIGhpZ2ggc3RyZXNzOyB3ZSBvcHQgZm9yIGNob3BwaW5lc3Mgb3ZlciBhbGxvd2luZyB0aGUgYnJvd3NlciB0byBkcm9wIGh1Z2UgY2h1bmtzIG9mIGZyYW1lcy4gKi9cbiAgICAgICAgICAgIHZhciB0aW1lQ3VycmVudCA9IChuZXcgRGF0ZSkuZ2V0VGltZSgpO1xuXG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgIENhbGwgSXRlcmF0aW9uXG4gICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgdmFyIGNhbGxzTGVuZ3RoID0gVmVsb2NpdHkuU3RhdGUuY2FsbHMubGVuZ3RoO1xuXG4gICAgICAgICAgICAvKiBUbyBzcGVlZCB1cCBpdGVyYXRpbmcgb3ZlciB0aGlzIGFycmF5LCBpdCBpcyBjb21wYWN0ZWQgKGZhbHNleSBpdGVtcyAtLSBjYWxscyB0aGF0IGhhdmUgY29tcGxldGVkIC0tIGFyZSByZW1vdmVkKVxuICAgICAgICAgICAgICAgd2hlbiBpdHMgbGVuZ3RoIGhhcyBiYWxsb29uZWQgdG8gYSBwb2ludCB0aGF0IGNhbiBpbXBhY3QgdGljayBwZXJmb3JtYW5jZS4gVGhpcyBvbmx5IGJlY29tZXMgbmVjZXNzYXJ5IHdoZW4gYW5pbWF0aW9uXG4gICAgICAgICAgICAgICBoYXMgYmVlbiBjb250aW51b3VzIHdpdGggbWFueSBlbGVtZW50cyBvdmVyIGEgbG9uZyBwZXJpb2Qgb2YgdGltZTsgd2hlbmV2ZXIgYWxsIGFjdGl2ZSBjYWxscyBhcmUgY29tcGxldGVkLCBjb21wbGV0ZUNhbGwoKSBjbGVhcnMgVmVsb2NpdHkuU3RhdGUuY2FsbHMuICovXG4gICAgICAgICAgICBpZiAoY2FsbHNMZW5ndGggPiAxMDAwMCkge1xuICAgICAgICAgICAgICAgIFZlbG9jaXR5LlN0YXRlLmNhbGxzID0gY29tcGFjdFNwYXJzZUFycmF5KFZlbG9jaXR5LlN0YXRlLmNhbGxzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyogSXRlcmF0ZSB0aHJvdWdoIGVhY2ggYWN0aXZlIGNhbGwuICovXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvKiBXaGVuIGEgVmVsb2NpdHkgY2FsbCBpcyBjb21wbGV0ZWQsIGl0cyBWZWxvY2l0eS5TdGF0ZS5jYWxscyBlbnRyeSBpcyBzZXQgdG8gZmFsc2UuIENvbnRpbnVlIG9uIHRvIHRoZSBuZXh0IGNhbGwuICovXG4gICAgICAgICAgICAgICAgaWYgKCFWZWxvY2l0eS5TdGF0ZS5jYWxsc1tpXSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgQ2FsbC1XaWRlIFZhcmlhYmxlc1xuICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgIHZhciBjYWxsQ29udGFpbmVyID0gVmVsb2NpdHkuU3RhdGUuY2FsbHNbaV0sXG4gICAgICAgICAgICAgICAgICAgIGNhbGwgPSBjYWxsQ29udGFpbmVyWzBdLFxuICAgICAgICAgICAgICAgICAgICBvcHRzID0gY2FsbENvbnRhaW5lclsyXSxcbiAgICAgICAgICAgICAgICAgICAgdGltZVN0YXJ0ID0gY2FsbENvbnRhaW5lclszXSxcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RUaWNrID0gISF0aW1lU3RhcnQsXG4gICAgICAgICAgICAgICAgICAgIHR3ZWVuRHVtbXlWYWx1ZSA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAvKiBJZiB0aW1lU3RhcnQgaXMgdW5kZWZpbmVkLCB0aGVuIHRoaXMgaXMgdGhlIGZpcnN0IHRpbWUgdGhhdCB0aGlzIGNhbGwgaGFzIGJlZW4gcHJvY2Vzc2VkIGJ5IHRpY2soKS5cbiAgICAgICAgICAgICAgICAgICBXZSBhc3NpZ24gdGltZVN0YXJ0IG5vdyBzbyB0aGF0IGl0cyB2YWx1ZSBpcyBhcyBjbG9zZSB0byB0aGUgcmVhbCBhbmltYXRpb24gc3RhcnQgdGltZSBhcyBwb3NzaWJsZS5cbiAgICAgICAgICAgICAgICAgICAoQ29udmVyc2VseSwgaGFkIHRpbWVTdGFydCBiZWVuIGRlZmluZWQgd2hlbiB0aGlzIGNhbGwgd2FzIGFkZGVkIHRvIFZlbG9jaXR5LlN0YXRlLmNhbGxzLCB0aGUgZGVsYXlcbiAgICAgICAgICAgICAgICAgICBiZXR3ZWVuIHRoYXQgdGltZSBhbmQgbm93IHdvdWxkIGNhdXNlIHRoZSBmaXJzdCBmZXcgZnJhbWVzIG9mIHRoZSB0d2VlbiB0byBiZSBza2lwcGVkIHNpbmNlXG4gICAgICAgICAgICAgICAgICAgcGVyY2VudENvbXBsZXRlIGlzIGNhbGN1bGF0ZWQgcmVsYXRpdmUgdG8gdGltZVN0YXJ0LikgKi9cbiAgICAgICAgICAgICAgICAvKiBGdXJ0aGVyLCBzdWJ0cmFjdCAxNm1zICh0aGUgYXBwcm94aW1hdGUgcmVzb2x1dGlvbiBvZiBSQUYpIGZyb20gdGhlIGN1cnJlbnQgdGltZSB2YWx1ZSBzbyB0aGF0IHRoZVxuICAgICAgICAgICAgICAgICAgIGZpcnN0IHRpY2sgaXRlcmF0aW9uIGlzbid0IHdhc3RlZCBieSBhbmltYXRpbmcgYXQgMCUgdHdlZW4gY29tcGxldGlvbiwgd2hpY2ggd291bGQgcHJvZHVjZSB0aGVcbiAgICAgICAgICAgICAgICAgICBzYW1lIHN0eWxlIHZhbHVlIGFzIHRoZSBlbGVtZW50J3MgY3VycmVudCB2YWx1ZS4gKi9cbiAgICAgICAgICAgICAgICBpZiAoIXRpbWVTdGFydCkge1xuICAgICAgICAgICAgICAgICAgICB0aW1lU3RhcnQgPSBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tpXVszXSA9IHRpbWVDdXJyZW50IC0gMTY7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyogVGhlIHR3ZWVuJ3MgY29tcGxldGlvbiBwZXJjZW50YWdlIGlzIHJlbGF0aXZlIHRvIHRoZSB0d2VlbidzIHN0YXJ0IHRpbWUsIG5vdCB0aGUgdHdlZW4ncyBzdGFydCB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICh3aGljaCB3b3VsZCByZXN1bHQgaW4gdW5wcmVkaWN0YWJsZSB0d2VlbiBkdXJhdGlvbnMgc2luY2UgSmF2YVNjcmlwdCdzIHRpbWVycyBhcmUgbm90IHBhcnRpY3VsYXJseSBhY2N1cmF0ZSkuXG4gICAgICAgICAgICAgICAgICAgQWNjb3JkaW5nbHksIHdlIGVuc3VyZSB0aGF0IHBlcmNlbnRDb21wbGV0ZSBkb2VzIG5vdCBleGNlZWQgMS4gKi9cbiAgICAgICAgICAgICAgICB2YXIgcGVyY2VudENvbXBsZXRlID0gTWF0aC5taW4oKHRpbWVDdXJyZW50IC0gdGltZVN0YXJ0KSAvIG9wdHMuZHVyYXRpb24sIDEpO1xuXG4gICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICBFbGVtZW50IEl0ZXJhdGlvblxuICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICAvKiBGb3IgZXZlcnkgY2FsbCwgaXRlcmF0ZSB0aHJvdWdoIGVhY2ggb2YgdGhlIGVsZW1lbnRzIGluIGl0cyBzZXQuICovXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDAsIGNhbGxMZW5ndGggPSBjYWxsLmxlbmd0aDsgaiA8IGNhbGxMZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdHdlZW5zQ29udGFpbmVyID0gY2FsbFtqXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQgPSB0d2VlbnNDb250YWluZXIuZWxlbWVudDtcblxuICAgICAgICAgICAgICAgICAgICAvKiBDaGVjayB0byBzZWUgaWYgdGhpcyBlbGVtZW50IGhhcyBiZWVuIGRlbGV0ZWQgbWlkd2F5IHRocm91Z2ggdGhlIGFuaW1hdGlvbiBieSBjaGVja2luZyBmb3IgdGhlXG4gICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlZCBleGlzdGVuY2Ugb2YgaXRzIGRhdGEgY2FjaGUuIElmIGl0J3MgZ29uZSwgc2tpcCBhbmltYXRpbmcgdGhpcyBlbGVtZW50LiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAoIURhdGEoZWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHRyYW5zZm9ybVByb3BlcnR5RXhpc3RzID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgRGlzcGxheSAmIFZpc2liaWxpdHkgVG9nZ2xpbmdcbiAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgZGlzcGxheSBvcHRpb24gaXMgc2V0IHRvIG5vbi1cIm5vbmVcIiwgc2V0IGl0IHVwZnJvbnQgc28gdGhhdCB0aGUgZWxlbWVudCBjYW4gYmVjb21lIHZpc2libGUgYmVmb3JlIHR3ZWVuaW5nIGJlZ2lucy5cbiAgICAgICAgICAgICAgICAgICAgICAgKE90aGVyd2lzZSwgZGlzcGxheSdzIFwibm9uZVwiIHZhbHVlIGlzIHNldCBpbiBjb21wbGV0ZUNhbGwoKSBvbmNlIHRoZSBhbmltYXRpb24gaGFzIGNvbXBsZXRlZC4pICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLmRpc3BsYXkgIT09IHVuZGVmaW5lZCAmJiBvcHRzLmRpc3BsYXkgIT09IG51bGwgJiYgb3B0cy5kaXNwbGF5ICE9PSBcIm5vbmVcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMuZGlzcGxheSA9PT0gXCJmbGV4XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZmxleFZhbHVlcyA9IFsgXCItd2Via2l0LWJveFwiLCBcIi1tb3otYm94XCIsIFwiLW1zLWZsZXhib3hcIiwgXCItd2Via2l0LWZsZXhcIiBdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGZsZXhWYWx1ZXMsIGZ1bmN0aW9uKGksIGZsZXhWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImRpc3BsYXlcIiwgZmxleFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgQ1NTLnNldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJkaXNwbGF5XCIsIG9wdHMuZGlzcGxheSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBTYW1lIGdvZXMgd2l0aCB0aGUgdmlzaWJpbGl0eSBvcHRpb24sIGJ1dCBpdHMgXCJub25lXCIgZXF1aXZhbGVudCBpcyBcImhpZGRlblwiLiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy52aXNpYmlsaXR5ICE9PSB1bmRlZmluZWQgJiYgb3B0cy52aXNpYmlsaXR5ICE9PSBcImhpZGRlblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInZpc2liaWxpdHlcIiwgb3B0cy52aXNpYmlsaXR5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgUHJvcGVydHkgSXRlcmF0aW9uXG4gICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAvKiBGb3IgZXZlcnkgZWxlbWVudCwgaXRlcmF0ZSB0aHJvdWdoIGVhY2ggcHJvcGVydHkuICovXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BlcnR5IGluIHR3ZWVuc0NvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogSW4gYWRkaXRpb24gdG8gcHJvcGVydHkgdHdlZW4gZGF0YSwgdHdlZW5zQ29udGFpbmVyIGNvbnRhaW5zIGEgcmVmZXJlbmNlIHRvIGl0cyBhc3NvY2lhdGVkIGVsZW1lbnQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHkgIT09IFwiZWxlbWVudFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHR3ZWVuID0gdHdlZW5zQ29udGFpbmVyW3Byb3BlcnR5XSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBFYXNpbmcgY2FuIGVpdGhlciBiZSBhIHByZS1nZW5lcmVhdGVkIGZ1bmN0aW9uIG9yIGEgc3RyaW5nIHRoYXQgcmVmZXJlbmNlcyBhIHByZS1yZWdpc3RlcmVkIGVhc2luZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbiB0aGUgVmVsb2NpdHkuRWFzaW5ncyBvYmplY3QuIEluIGVpdGhlciBjYXNlLCByZXR1cm4gdGhlIGFwcHJvcHJpYXRlIGVhc2luZyAqZnVuY3Rpb24qLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlYXNpbmcgPSBUeXBlLmlzU3RyaW5nKHR3ZWVuLmVhc2luZykgPyBWZWxvY2l0eS5FYXNpbmdzW3R3ZWVuLmVhc2luZ10gOiB0d2Vlbi5lYXNpbmc7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ3VycmVudCBWYWx1ZSBDYWxjdWxhdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoaXMgaXMgdGhlIGxhc3QgdGljayBwYXNzIChpZiB3ZSd2ZSByZWFjaGVkIDEwMCUgY29tcGxldGlvbiBmb3IgdGhpcyB0d2VlbiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5zdXJlIHRoYXQgY3VycmVudFZhbHVlIGlzIGV4cGxpY2l0bHkgc2V0IHRvIGl0cyB0YXJnZXQgZW5kVmFsdWUgc28gdGhhdCBpdCdzIG5vdCBzdWJqZWN0ZWQgdG8gYW55IHJvdW5kaW5nLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZXJjZW50Q29tcGxldGUgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZhbHVlID0gdHdlZW4uZW5kVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogT3RoZXJ3aXNlLCBjYWxjdWxhdGUgY3VycmVudFZhbHVlIGJhc2VkIG9uIHRoZSBjdXJyZW50IGRlbHRhIGZyb20gc3RhcnRWYWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdHdlZW5EZWx0YSA9IHR3ZWVuLmVuZFZhbHVlIC0gdHdlZW4uc3RhcnRWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZhbHVlID0gdHdlZW4uc3RhcnRWYWx1ZSArICh0d2VlbkRlbHRhICogZWFzaW5nKHBlcmNlbnRDb21wbGV0ZSwgb3B0cywgdHdlZW5EZWx0YSkpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIG5vIHZhbHVlIGNoYW5nZSBpcyBvY2N1cnJpbmcsIGRvbid0IHByb2NlZWQgd2l0aCBET00gdXBkYXRpbmcuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZmlyc3RUaWNrICYmIChjdXJyZW50VmFsdWUgPT09IHR3ZWVuLmN1cnJlbnRWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW4uY3VycmVudFZhbHVlID0gY3VycmVudFZhbHVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgd2UncmUgdHdlZW5pbmcgYSBmYWtlICd0d2VlbicgcHJvcGVydHkgaW4gb3JkZXIgdG8gbG9nIHRyYW5zaXRpb24gdmFsdWVzLCB1cGRhdGUgdGhlIG9uZS1wZXItY2FsbCB2YXJpYWJsZSBzbyB0aGF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXQgY2FuIGJlIHBhc3NlZCBpbnRvIHRoZSBwcm9ncmVzcyBjYWxsYmFjay4gKi8gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5ID09PSBcInR3ZWVuXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW5EdW1teVZhbHVlID0gY3VycmVudFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSG9va3M6IFBhcnQgSVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRm9yIGhvb2tlZCBwcm9wZXJ0aWVzLCB0aGUgbmV3bHktdXBkYXRlZCByb290UHJvcGVydHlWYWx1ZUNhY2hlIGlzIGNhY2hlZCBvbnRvIHRoZSBlbGVtZW50IHNvIHRoYXQgaXQgY2FuIGJlIHVzZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIHN1YnNlcXVlbnQgaG9va3MgaW4gdGhpcyBjYWxsIHRoYXQgYXJlIGFzc29jaWF0ZWQgd2l0aCB0aGUgc2FtZSByb290IHByb3BlcnR5LiBJZiB3ZSBkaWRuJ3QgY2FjaGUgdGhlIHVwZGF0ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUsIGVhY2ggc3Vic2VxdWVudCB1cGRhdGUgdG8gdGhlIHJvb3QgcHJvcGVydHkgaW4gdGhpcyB0aWNrIHBhc3Mgd291bGQgcmVzZXQgdGhlIHByZXZpb3VzIGhvb2snc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVzIHRvIHJvb3RQcm9wZXJ0eVZhbHVlIHByaW9yIHRvIGluamVjdGlvbi4gQSBuaWNlIHBlcmZvcm1hbmNlIGJ5cHJvZHVjdCBvZiByb290UHJvcGVydHlWYWx1ZSBjYWNoaW5nIGlzIHRoYXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2VxdWVudGx5IGNoYWluZWQgYW5pbWF0aW9ucyB1c2luZyB0aGUgc2FtZSBob29rUm9vdCBidXQgYSBkaWZmZXJlbnQgaG9vayBjYW4gdXNlIHRoaXMgY2FjaGVkIHJvb3RQcm9wZXJ0eVZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbcHJvcGVydHldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaG9va1Jvb3QgPSBDU1MuSG9va3MuZ2V0Um9vdChwcm9wZXJ0eSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWVDYWNoZSA9IERhdGEoZWxlbWVudCkucm9vdFByb3BlcnR5VmFsdWVDYWNoZVtob29rUm9vdF07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyb290UHJvcGVydHlWYWx1ZUNhY2hlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW4ucm9vdFByb3BlcnR5VmFsdWUgPSByb290UHJvcGVydHlWYWx1ZUNhY2hlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBET00gVXBkYXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHNldFByb3BlcnR5VmFsdWUoKSByZXR1cm5zIGFuIGFycmF5IG9mIHRoZSBwcm9wZXJ0eSBuYW1lIGFuZCBwcm9wZXJ0eSB2YWx1ZSBwb3N0IGFueSBub3JtYWxpemF0aW9uIHRoYXQgbWF5IGhhdmUgYmVlbiBwZXJmb3JtZWQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFRvIHNvbHZlIGFuIElFPD04IHBvc2l0aW9uaW5nIGJ1ZywgdGhlIHVuaXQgdHlwZSBpcyBkcm9wcGVkIHdoZW4gc2V0dGluZyBhIHByb3BlcnR5IHZhbHVlIG9mIDAuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhZGp1c3RlZFNldERhdGEgPSBDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCAvKiBTRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW4uY3VycmVudFZhbHVlICsgKHBhcnNlRmxvYXQoY3VycmVudFZhbHVlKSA9PT0gMCA/IFwiXCIgOiB0d2Vlbi51bml0VHlwZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0d2Vlbi5yb290UHJvcGVydHlWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuLnNjcm9sbERhdGEpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEhvb2tzOiBQYXJ0IElJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogTm93IHRoYXQgd2UgaGF2ZSB0aGUgaG9vaydzIHVwZGF0ZWQgcm9vdFByb3BlcnR5VmFsdWUgKHRoZSBwb3N0LXByb2Nlc3NlZCB2YWx1ZSBwcm92aWRlZCBieSBhZGp1c3RlZFNldERhdGEpLCBjYWNoZSBpdCBvbnRvIHRoZSBlbGVtZW50LiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbcHJvcGVydHldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSBhZGp1c3RlZFNldERhdGEgY29udGFpbnMgbm9ybWFsaXplZCBkYXRhIHJlYWR5IGZvciBET00gdXBkYXRpbmcsIHRoZSByb290UHJvcGVydHlWYWx1ZSBuZWVkcyB0byBiZSByZS1leHRyYWN0ZWQgZnJvbSBpdHMgbm9ybWFsaXplZCBmb3JtLiA/PyAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW2hvb2tSb290XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkucm9vdFByb3BlcnR5VmFsdWVDYWNoZVtob29rUm9vdF0gPSBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtob29rUm9vdF0oXCJleHRyYWN0XCIsIG51bGwsIGFkanVzdGVkU2V0RGF0YVsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkucm9vdFByb3BlcnR5VmFsdWVDYWNoZVtob29rUm9vdF0gPSBhZGp1c3RlZFNldERhdGFbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRyYW5zZm9ybXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEZsYWcgd2hldGhlciBhIHRyYW5zZm9ybSBwcm9wZXJ0eSBpcyBiZWluZyBhbmltYXRlZCBzbyB0aGF0IGZsdXNoVHJhbnNmb3JtQ2FjaGUoKSBjYW4gYmUgdHJpZ2dlcmVkIG9uY2UgdGhpcyB0aWNrIHBhc3MgaXMgY29tcGxldGUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhZGp1c3RlZFNldERhdGFbMF0gPT09IFwidHJhbnNmb3JtXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVByb3BlcnR5RXhpc3RzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vYmlsZUhBXG4gICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICAgICAgLyogSWYgbW9iaWxlSEEgaXMgZW5hYmxlZCwgc2V0IHRoZSB0cmFuc2xhdGUzZCB0cmFuc2Zvcm0gdG8gbnVsbCB0byBmb3JjZSBoYXJkd2FyZSBhY2NlbGVyYXRpb24uXG4gICAgICAgICAgICAgICAgICAgICAgIEl0J3Mgc2FmZSB0byBvdmVycmlkZSB0aGlzIHByb3BlcnR5IHNpbmNlIFZlbG9jaXR5IGRvZXNuJ3QgYWN0dWFsbHkgc3VwcG9ydCBpdHMgYW5pbWF0aW9uIChob29rcyBhcmUgdXNlZCBpbiBpdHMgcGxhY2UpLiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5tb2JpbGVIQSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogRG9uJ3Qgc2V0IHRoZSBudWxsIHRyYW5zZm9ybSBoYWNrIGlmIHdlJ3ZlIGFscmVhZHkgZG9uZSBzby4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlLnRyYW5zbGF0ZTNkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBBbGwgZW50cmllcyBvbiB0aGUgdHJhbnNmb3JtQ2FjaGUgb2JqZWN0IGFyZSBsYXRlciBjb25jYXRlbmF0ZWQgaW50byBhIHNpbmdsZSB0cmFuc2Zvcm0gc3RyaW5nIHZpYSBmbHVzaFRyYW5zZm9ybUNhY2hlKCkuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZS50cmFuc2xhdGUzZCA9IFwiKDBweCwgMHB4LCAwcHgpXCI7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1Qcm9wZXJ0eUV4aXN0cyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodHJhbnNmb3JtUHJvcGVydHlFeGlzdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIENTUy5mbHVzaFRyYW5zZm9ybUNhY2hlKGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyogVGhlIG5vbi1cIm5vbmVcIiBkaXNwbGF5IHZhbHVlIGlzIG9ubHkgYXBwbGllZCB0byBhbiBlbGVtZW50IG9uY2UgLS0gd2hlbiBpdHMgYXNzb2NpYXRlZCBjYWxsIGlzIGZpcnN0IHRpY2tlZCB0aHJvdWdoLlxuICAgICAgICAgICAgICAgICAgIEFjY29yZGluZ2x5LCBpdCdzIHNldCB0byBmYWxzZSBzbyB0aGF0IGl0IGlzbid0IHJlLXByb2Nlc3NlZCBieSB0aGlzIGNhbGwgaW4gdGhlIG5leHQgdGljay4gKi9cbiAgICAgICAgICAgICAgICBpZiAob3B0cy5kaXNwbGF5ICE9PSB1bmRlZmluZWQgJiYgb3B0cy5kaXNwbGF5ICE9PSBcIm5vbmVcIikge1xuICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tpXVsyXS5kaXNwbGF5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChvcHRzLnZpc2liaWxpdHkgIT09IHVuZGVmaW5lZCAmJiBvcHRzLnZpc2liaWxpdHkgIT09IFwiaGlkZGVuXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuU3RhdGUuY2FsbHNbaV1bMl0udmlzaWJpbGl0eSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qIFBhc3MgdGhlIGVsZW1lbnRzIGFuZCB0aGUgdGltaW5nIGRhdGEgKHBlcmNlbnRDb21wbGV0ZSwgbXNSZW1haW5pbmcsIHRpbWVTdGFydCwgdHdlZW5EdW1teVZhbHVlKSBpbnRvIHRoZSBwcm9ncmVzcyBjYWxsYmFjay4gKi9cbiAgICAgICAgICAgICAgICBpZiAob3B0cy5wcm9ncmVzcykge1xuICAgICAgICAgICAgICAgICAgICBvcHRzLnByb2dyZXNzLmNhbGwoY2FsbENvbnRhaW5lclsxXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxDb250YWluZXJbMV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZXJjZW50Q29tcGxldGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1heCgwLCAodGltZVN0YXJ0ICsgb3B0cy5kdXJhdGlvbikgLSB0aW1lQ3VycmVudCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lU3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0d2VlbkR1bW15VmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qIElmIHRoaXMgY2FsbCBoYXMgZmluaXNoZWQgdHdlZW5pbmcsIHBhc3MgaXRzIGluZGV4IHRvIGNvbXBsZXRlQ2FsbCgpIHRvIGhhbmRsZSBjYWxsIGNsZWFudXAuICovXG4gICAgICAgICAgICAgICAgaWYgKHBlcmNlbnRDb21wbGV0ZSA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZUNhbGwoaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyogTm90ZTogY29tcGxldGVDYWxsKCkgc2V0cyB0aGUgaXNUaWNraW5nIGZsYWcgdG8gZmFsc2Ugd2hlbiB0aGUgbGFzdCBjYWxsIG9uIFZlbG9jaXR5LlN0YXRlLmNhbGxzIGhhcyBjb21wbGV0ZWQuICovXG4gICAgICAgIGlmIChWZWxvY2l0eS5TdGF0ZS5pc1RpY2tpbmcpIHtcbiAgICAgICAgICAgIHRpY2tlcih0aWNrKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIENhbGwgQ29tcGxldGlvblxuICAgICoqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAvKiBOb3RlOiBVbmxpa2UgdGljaygpLCB3aGljaCBwcm9jZXNzZXMgYWxsIGFjdGl2ZSBjYWxscyBhdCBvbmNlLCBjYWxsIGNvbXBsZXRpb24gaXMgaGFuZGxlZCBvbiBhIHBlci1jYWxsIGJhc2lzLiAqL1xuICAgIGZ1bmN0aW9uIGNvbXBsZXRlQ2FsbCAoY2FsbEluZGV4LCBpc1N0b3BwZWQpIHtcbiAgICAgICAgLyogRW5zdXJlIHRoZSBjYWxsIGV4aXN0cy4gKi9cbiAgICAgICAgaWYgKCFWZWxvY2l0eS5TdGF0ZS5jYWxsc1tjYWxsSW5kZXhdKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBQdWxsIHRoZSBtZXRhZGF0YSBmcm9tIHRoZSBjYWxsLiAqL1xuICAgICAgICB2YXIgY2FsbCA9IFZlbG9jaXR5LlN0YXRlLmNhbGxzW2NhbGxJbmRleF1bMF0sXG4gICAgICAgICAgICBlbGVtZW50cyA9IFZlbG9jaXR5LlN0YXRlLmNhbGxzW2NhbGxJbmRleF1bMV0sXG4gICAgICAgICAgICBvcHRzID0gVmVsb2NpdHkuU3RhdGUuY2FsbHNbY2FsbEluZGV4XVsyXSxcbiAgICAgICAgICAgIHJlc29sdmVyID0gVmVsb2NpdHkuU3RhdGUuY2FsbHNbY2FsbEluZGV4XVs0XTtcblxuICAgICAgICB2YXIgcmVtYWluaW5nQ2FsbHNFeGlzdCA9IGZhbHNlO1xuXG4gICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgIEVsZW1lbnQgRmluYWxpemF0aW9uXG4gICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGNhbGxMZW5ndGggPSBjYWxsLmxlbmd0aDsgaSA8IGNhbGxMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSBjYWxsW2ldLmVsZW1lbnQ7XG5cbiAgICAgICAgICAgIC8qIElmIHRoZSB1c2VyIHNldCBkaXNwbGF5IHRvIFwibm9uZVwiIChpbnRlbmRpbmcgdG8gaGlkZSB0aGUgZWxlbWVudCksIHNldCBpdCBub3cgdGhhdCB0aGUgYW5pbWF0aW9uIGhhcyBjb21wbGV0ZWQuICovXG4gICAgICAgICAgICAvKiBOb3RlOiBkaXNwbGF5Om5vbmUgaXNuJ3Qgc2V0IHdoZW4gY2FsbHMgYXJlIG1hbnVhbGx5IHN0b3BwZWQgKHZpYSBWZWxvY2l0eShcInN0b3BcIikuICovXG4gICAgICAgICAgICAvKiBOb3RlOiBEaXNwbGF5IGdldHMgaWdub3JlZCB3aXRoIFwicmV2ZXJzZVwiIGNhbGxzIGFuZCBpbmZpbml0ZSBsb29wcywgc2luY2UgdGhpcyBiZWhhdmlvciB3b3VsZCBiZSB1bmRlc2lyYWJsZS4gKi9cbiAgICAgICAgICAgIGlmICghaXNTdG9wcGVkICYmICFvcHRzLmxvb3ApIHtcbiAgICAgICAgICAgICAgICBpZiAob3B0cy5kaXNwbGF5ID09PSBcIm5vbmVcIikge1xuICAgICAgICAgICAgICAgICAgICBDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImRpc3BsYXlcIiwgb3B0cy5kaXNwbGF5KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0cy52aXNpYmlsaXR5ID09PSBcImhpZGRlblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwidmlzaWJpbGl0eVwiLCBvcHRzLnZpc2liaWxpdHkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyogSWYgdGhlIGVsZW1lbnQncyBxdWV1ZSBpcyBlbXB0eSAoaWYgb25seSB0aGUgXCJpbnByb2dyZXNzXCIgaXRlbSBpcyBsZWZ0IGF0IHBvc2l0aW9uIDApIG9yIGlmIGl0cyBxdWV1ZSBpcyBhYm91dCB0byBydW5cbiAgICAgICAgICAgICAgIGEgbm9uLVZlbG9jaXR5LWluaXRpYXRlZCBlbnRyeSwgdHVybiBvZmYgdGhlIGlzQW5pbWF0aW5nIGZsYWcuIEEgbm9uLVZlbG9jaXR5LWluaXRpYXRpZWQgcXVldWUgZW50cnkncyBsb2dpYyBtaWdodCBhbHRlclxuICAgICAgICAgICAgICAgYW4gZWxlbWVudCdzIENTUyB2YWx1ZXMgYW5kIHRoZXJlYnkgY2F1c2UgVmVsb2NpdHkncyBjYWNoZWQgdmFsdWUgZGF0YSB0byBnbyBzdGFsZS4gVG8gZGV0ZWN0IGlmIGEgcXVldWUgZW50cnkgd2FzIGluaXRpYXRlZCBieSBWZWxvY2l0eSxcbiAgICAgICAgICAgICAgIHdlIGNoZWNrIGZvciB0aGUgZXhpc3RlbmNlIG9mIG91ciBzcGVjaWFsIFZlbG9jaXR5LnF1ZXVlRW50cnlGbGFnIGRlY2xhcmF0aW9uLCB3aGljaCBtaW5pZmllcnMgd29uJ3QgcmVuYW1lIHNpbmNlIHRoZSBmbGFnXG4gICAgICAgICAgICAgICBpcyBhc3NpZ25lZCB0byBqUXVlcnkncyBnbG9iYWwgJCBvYmplY3QgYW5kIHRodXMgZXhpc3RzIG91dCBvZiBWZWxvY2l0eSdzIG93biBzY29wZS4gKi9cbiAgICAgICAgICAgIGlmIChvcHRzLmxvb3AgIT09IHRydWUgJiYgKCQucXVldWUoZWxlbWVudClbMV0gPT09IHVuZGVmaW5lZCB8fCAhL1xcLnZlbG9jaXR5UXVldWVFbnRyeUZsYWcvaS50ZXN0KCQucXVldWUoZWxlbWVudClbMV0pKSkge1xuICAgICAgICAgICAgICAgIC8qIFRoZSBlbGVtZW50IG1heSBoYXZlIGJlZW4gZGVsZXRlZC4gRW5zdXJlIHRoYXQgaXRzIGRhdGEgY2FjaGUgc3RpbGwgZXhpc3RzIGJlZm9yZSBhY3Rpbmcgb24gaXQuICovXG4gICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5pc0FuaW1hdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAvKiBDbGVhciB0aGUgZWxlbWVudCdzIHJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGUsIHdoaWNoIHdpbGwgYmVjb21lIHN0YWxlLiAqL1xuICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLnJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGUgPSB7fTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgdHJhbnNmb3JtSEFQcm9wZXJ0eUV4aXN0cyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAvKiBJZiBhbnkgM0QgdHJhbnNmb3JtIHN1YnByb3BlcnR5IGlzIGF0IGl0cyBkZWZhdWx0IHZhbHVlIChyZWdhcmRsZXNzIG9mIHVuaXQgdHlwZSksIHJlbW92ZSBpdC4gKi9cbiAgICAgICAgICAgICAgICAgICAgJC5lYWNoKENTUy5MaXN0cy50cmFuc2Zvcm1zM0QsIGZ1bmN0aW9uKGksIHRyYW5zZm9ybU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkZWZhdWx0VmFsdWUgPSAvXnNjYWxlLy50ZXN0KHRyYW5zZm9ybU5hbWUpID8gMSA6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZhbHVlID0gRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGVbdHJhbnNmb3JtTmFtZV0gIT09IHVuZGVmaW5lZCAmJiBuZXcgUmVnRXhwKFwiXlxcXFwoXCIgKyBkZWZhdWx0VmFsdWUgKyBcIlteLl1cIikudGVzdChjdXJyZW50VmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtSEFQcm9wZXJ0eUV4aXN0cyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLyogTW9iaWxlIGRldmljZXMgaGF2ZSBoYXJkd2FyZSBhY2NlbGVyYXRpb24gcmVtb3ZlZCBhdCB0aGUgZW5kIG9mIHRoZSBhbmltYXRpb24gaW4gb3JkZXIgdG8gYXZvaWQgaG9nZ2luZyB0aGUgR1BVJ3MgbWVtb3J5LiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5tb2JpbGVIQSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtSEFQcm9wZXJ0eUV4aXN0cyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZS50cmFuc2xhdGUzZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8qIEZsdXNoIHRoZSBzdWJwcm9wZXJ0eSByZW1vdmFscyB0byB0aGUgRE9NLiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAodHJhbnNmb3JtSEFQcm9wZXJ0eUV4aXN0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgQ1NTLmZsdXNoVHJhbnNmb3JtQ2FjaGUoZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBSZW1vdmUgdGhlIFwidmVsb2NpdHktYW5pbWF0aW5nXCIgaW5kaWNhdG9yIGNsYXNzLiAqL1xuICAgICAgICAgICAgICAgICAgICBDU1MuVmFsdWVzLnJlbW92ZUNsYXNzKGVsZW1lbnQsIFwidmVsb2NpdHktYW5pbWF0aW5nXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgT3B0aW9uOiBDb21wbGV0ZVxuICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAvKiBDb21wbGV0ZSBpcyBmaXJlZCBvbmNlIHBlciBjYWxsIChub3Qgb25jZSBwZXIgZWxlbWVudCkgYW5kIGlzIHBhc3NlZCB0aGUgZnVsbCByYXcgRE9NIGVsZW1lbnQgc2V0IGFzIGJvdGggaXRzIGNvbnRleHQgYW5kIGl0cyBmaXJzdCBhcmd1bWVudC4gKi9cbiAgICAgICAgICAgIC8qIE5vdGU6IENhbGxiYWNrcyBhcmVuJ3QgZmlyZWQgd2hlbiBjYWxscyBhcmUgbWFudWFsbHkgc3RvcHBlZCAodmlhIFZlbG9jaXR5KFwic3RvcFwiKS4gKi9cbiAgICAgICAgICAgIGlmICghaXNTdG9wcGVkICYmIG9wdHMuY29tcGxldGUgJiYgIW9wdHMubG9vcCAmJiAoaSA9PT0gY2FsbExlbmd0aCAtIDEpKSB7XG4gICAgICAgICAgICAgICAgLyogV2UgdGhyb3cgY2FsbGJhY2tzIGluIGEgc2V0VGltZW91dCBzbyB0aGF0IHRocm93biBlcnJvcnMgZG9uJ3QgaGFsdCB0aGUgZXhlY3V0aW9uIG9mIFZlbG9jaXR5IGl0c2VsZi4gKi9cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBvcHRzLmNvbXBsZXRlLmNhbGwoZWxlbWVudHMsIGVsZW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyB0aHJvdyBlcnJvcjsgfSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgUHJvbWlzZSBSZXNvbHZpbmdcbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgIC8qIE5vdGU6IEluZmluaXRlIGxvb3BzIGRvbid0IHJldHVybiBwcm9taXNlcy4gKi9cbiAgICAgICAgICAgIGlmIChyZXNvbHZlciAmJiBvcHRzLmxvb3AgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlcihlbGVtZW50cyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICBPcHRpb246IExvb3AgKEluZmluaXRlKVxuICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkgJiYgb3B0cy5sb29wID09PSB0cnVlICYmICFpc1N0b3BwZWQpIHtcbiAgICAgICAgICAgICAgICAvKiBJZiBhIHJvdGF0ZVgvWS9aIHByb3BlcnR5IGlzIGJlaW5nIGFuaW1hdGVkIHRvIDM2MCBkZWcgd2l0aCBsb29wOnRydWUsIHN3YXAgdHdlZW4gc3RhcnQvZW5kIHZhbHVlcyB0byBlbmFibGVcbiAgICAgICAgICAgICAgICAgICBjb250aW51b3VzIGl0ZXJhdGl2ZSByb3RhdGlvbiBsb29waW5nLiAoT3RoZXJpc2UsIHRoZSBlbGVtZW50IHdvdWxkIGp1c3Qgcm90YXRlIGJhY2sgYW5kIGZvcnRoLikgKi9cbiAgICAgICAgICAgICAgICAkLmVhY2goRGF0YShlbGVtZW50KS50d2VlbnNDb250YWluZXIsIGZ1bmN0aW9uKHByb3BlcnR5TmFtZSwgdHdlZW5Db250YWluZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKC9ecm90YXRlLy50ZXN0KHByb3BlcnR5TmFtZSkgJiYgcGFyc2VGbG9hdCh0d2VlbkNvbnRhaW5lci5lbmRWYWx1ZSkgPT09IDM2MCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW5Db250YWluZXIuZW5kVmFsdWUgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW5Db250YWluZXIuc3RhcnRWYWx1ZSA9IDM2MDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICgvXmJhY2tncm91bmRQb3NpdGlvbi8udGVzdChwcm9wZXJ0eU5hbWUpICYmIHBhcnNlRmxvYXQodHdlZW5Db250YWluZXIuZW5kVmFsdWUpID09PSAxMDAgJiYgdHdlZW5Db250YWluZXIudW5pdFR5cGUgPT09IFwiJVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0d2VlbkNvbnRhaW5lci5lbmRWYWx1ZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB0d2VlbkNvbnRhaW5lci5zdGFydFZhbHVlID0gMTAwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBWZWxvY2l0eShlbGVtZW50LCBcInJldmVyc2VcIiwgeyBsb29wOiB0cnVlLCBkZWxheTogb3B0cy5kZWxheSB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgRGVxdWV1ZWluZ1xuICAgICAgICAgICAgKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAvKiBGaXJlIHRoZSBuZXh0IGNhbGwgaW4gdGhlIHF1ZXVlIHNvIGxvbmcgYXMgdGhpcyBjYWxsJ3MgcXVldWUgd2Fzbid0IHNldCB0byBmYWxzZSAodG8gdHJpZ2dlciBhIHBhcmFsbGVsIGFuaW1hdGlvbiksXG4gICAgICAgICAgICAgICB3aGljaCB3b3VsZCBoYXZlIGFscmVhZHkgY2F1c2VkIHRoZSBuZXh0IGNhbGwgdG8gZmlyZS4gTm90ZTogRXZlbiBpZiB0aGUgZW5kIG9mIHRoZSBhbmltYXRpb24gcXVldWUgaGFzIGJlZW4gcmVhY2hlZCxcbiAgICAgICAgICAgICAgICQuZGVxdWV1ZSgpIG11c3Qgc3RpbGwgYmUgY2FsbGVkIGluIG9yZGVyIHRvIGNvbXBsZXRlbHkgY2xlYXIgalF1ZXJ5J3MgYW5pbWF0aW9uIHF1ZXVlLiAqL1xuICAgICAgICAgICAgaWYgKG9wdHMucXVldWUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgJC5kZXF1ZXVlKGVsZW1lbnQsIG9wdHMucXVldWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICBDYWxscyBBcnJheSBDbGVhbnVwXG4gICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAvKiBTaW5jZSB0aGlzIGNhbGwgaXMgY29tcGxldGUsIHNldCBpdCB0byBmYWxzZSBzbyB0aGF0IHRoZSByQUYgdGljayBza2lwcyBpdC4gVGhpcyBhcnJheSBpcyBsYXRlciBjb21wYWN0ZWQgdmlhIGNvbXBhY3RTcGFyc2VBcnJheSgpLlxuICAgICAgICAgIChGb3IgcGVyZm9ybWFuY2UgcmVhc29ucywgdGhlIGNhbGwgaXMgc2V0IHRvIGZhbHNlIGluc3RlYWQgb2YgYmVpbmcgZGVsZXRlZCBmcm9tIHRoZSBhcnJheTogaHR0cDovL3d3dy5odG1sNXJvY2tzLmNvbS9lbi90dXRvcmlhbHMvc3BlZWQvdjgvKSAqL1xuICAgICAgICBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tjYWxsSW5kZXhdID0gZmFsc2U7XG5cbiAgICAgICAgLyogSXRlcmF0ZSB0aHJvdWdoIHRoZSBjYWxscyBhcnJheSB0byBkZXRlcm1pbmUgaWYgdGhpcyB3YXMgdGhlIGZpbmFsIGluLXByb2dyZXNzIGFuaW1hdGlvbi5cbiAgICAgICAgICAgSWYgc28sIHNldCBhIGZsYWcgdG8gZW5kIHRpY2tpbmcgYW5kIGNsZWFyIHRoZSBjYWxscyBhcnJheS4gKi9cbiAgICAgICAgZm9yICh2YXIgaiA9IDAsIGNhbGxzTGVuZ3RoID0gVmVsb2NpdHkuU3RhdGUuY2FsbHMubGVuZ3RoOyBqIDwgY2FsbHNMZW5ndGg7IGorKykge1xuICAgICAgICAgICAgaWYgKFZlbG9jaXR5LlN0YXRlLmNhbGxzW2pdICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJlbWFpbmluZ0NhbGxzRXhpc3QgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVtYWluaW5nQ2FsbHNFeGlzdCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIC8qIHRpY2soKSB3aWxsIGRldGVjdCB0aGlzIGZsYWcgdXBvbiBpdHMgbmV4dCBpdGVyYXRpb24gYW5kIHN1YnNlcXVlbnRseSB0dXJuIGl0c2VsZiBvZmYuICovXG4gICAgICAgICAgICBWZWxvY2l0eS5TdGF0ZS5pc1RpY2tpbmcgPSBmYWxzZTtcblxuICAgICAgICAgICAgLyogQ2xlYXIgdGhlIGNhbGxzIGFycmF5IHNvIHRoYXQgaXRzIGxlbmd0aCBpcyByZXNldC4gKi9cbiAgICAgICAgICAgIGRlbGV0ZSBWZWxvY2l0eS5TdGF0ZS5jYWxscztcbiAgICAgICAgICAgIFZlbG9jaXR5LlN0YXRlLmNhbGxzID0gW107XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEZyYW1ld29ya3NcbiAgICAqKioqKioqKioqKioqKioqKiovXG5cbiAgICAvKiBCb3RoIGpRdWVyeSBhbmQgWmVwdG8gYWxsb3cgdGhlaXIgJC5mbiBvYmplY3QgdG8gYmUgZXh0ZW5kZWQgdG8gYWxsb3cgd3JhcHBlZCBlbGVtZW50cyB0byBiZSBzdWJqZWN0ZWQgdG8gcGx1Z2luIGNhbGxzLlxuICAgICAgIElmIGVpdGhlciBmcmFtZXdvcmsgaXMgbG9hZGVkLCByZWdpc3RlciBhIFwidmVsb2NpdHlcIiBleHRlbnNpb24gcG9pbnRpbmcgdG8gVmVsb2NpdHkncyBjb3JlIGFuaW1hdGUoKSBtZXRob2QuICBWZWxvY2l0eVxuICAgICAgIGFsc28gcmVnaXN0ZXJzIGl0c2VsZiBvbnRvIGEgZ2xvYmFsIGNvbnRhaW5lciAod2luZG93LmpRdWVyeSB8fCB3aW5kb3cuWmVwdG8gfHwgd2luZG93KSBzbyB0aGF0IGNlcnRhaW4gZmVhdHVyZXMgYXJlXG4gICAgICAgYWNjZXNzaWJsZSBiZXlvbmQganVzdCBhIHBlci1lbGVtZW50IHNjb3BlLiBUaGlzIG1hc3RlciBvYmplY3QgY29udGFpbnMgYW4gLmFuaW1hdGUoKSBtZXRob2QsIHdoaWNoIGlzIGxhdGVyIGFzc2lnbmVkIHRvICQuZm5cbiAgICAgICAoaWYgalF1ZXJ5IG9yIFplcHRvIGFyZSBwcmVzZW50KS4gQWNjb3JkaW5nbHksIFZlbG9jaXR5IGNhbiBib3RoIGFjdCBvbiB3cmFwcGVkIERPTSBlbGVtZW50cyBhbmQgc3RhbmQgYWxvbmUgZm9yIHRhcmdldGluZyByYXcgRE9NIGVsZW1lbnRzLiAqL1xuICAgIGdsb2JhbC5WZWxvY2l0eSA9IFZlbG9jaXR5O1xuXG4gICAgaWYgKGdsb2JhbCAhPT0gd2luZG93KSB7XG4gICAgICAgIC8qIEFzc2lnbiB0aGUgZWxlbWVudCBmdW5jdGlvbiB0byBWZWxvY2l0eSdzIGNvcmUgYW5pbWF0ZSgpIG1ldGhvZC4gKi9cbiAgICAgICAgZ2xvYmFsLmZuLnZlbG9jaXR5ID0gYW5pbWF0ZTtcbiAgICAgICAgLyogQXNzaWduIHRoZSBvYmplY3QgZnVuY3Rpb24ncyBkZWZhdWx0cyB0byBWZWxvY2l0eSdzIGdsb2JhbCBkZWZhdWx0cyBvYmplY3QuICovXG4gICAgICAgIGdsb2JhbC5mbi52ZWxvY2l0eS5kZWZhdWx0cyA9IFZlbG9jaXR5LmRlZmF1bHRzO1xuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgIFBhY2thZ2VkIFJlZGlyZWN0c1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgLyogc2xpZGVVcCwgc2xpZGVEb3duICovXG4gICAgJC5lYWNoKFsgXCJEb3duXCIsIFwiVXBcIiBdLCBmdW5jdGlvbihpLCBkaXJlY3Rpb24pIHtcbiAgICAgICAgVmVsb2NpdHkuUmVkaXJlY3RzW1wic2xpZGVcIiArIGRpcmVjdGlvbl0gPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucywgZWxlbWVudHNJbmRleCwgZWxlbWVudHNTaXplLCBlbGVtZW50cywgcHJvbWlzZURhdGEpIHtcbiAgICAgICAgICAgIHZhciBvcHRzID0gJC5leHRlbmQoe30sIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgIGJlZ2luID0gb3B0cy5iZWdpbixcbiAgICAgICAgICAgICAgICBjb21wbGV0ZSA9IG9wdHMuY29tcGxldGUsXG4gICAgICAgICAgICAgICAgY29tcHV0ZWRWYWx1ZXMgPSB7IGhlaWdodDogXCJcIiwgbWFyZ2luVG9wOiBcIlwiLCBtYXJnaW5Cb3R0b206IFwiXCIsIHBhZGRpbmdUb3A6IFwiXCIsIHBhZGRpbmdCb3R0b206IFwiXCIgfSxcbiAgICAgICAgICAgICAgICBpbmxpbmVWYWx1ZXMgPSB7fTtcblxuICAgICAgICAgICAgaWYgKG9wdHMuZGlzcGxheSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgLyogU2hvdyB0aGUgZWxlbWVudCBiZWZvcmUgc2xpZGVEb3duIGJlZ2lucyBhbmQgaGlkZSB0aGUgZWxlbWVudCBhZnRlciBzbGlkZVVwIGNvbXBsZXRlcy4gKi9cbiAgICAgICAgICAgICAgICAvKiBOb3RlOiBJbmxpbmUgZWxlbWVudHMgY2Fubm90IGhhdmUgZGltZW5zaW9ucyBhbmltYXRlZCwgc28gdGhleSdyZSByZXZlcnRlZCB0byBpbmxpbmUtYmxvY2suICovXG4gICAgICAgICAgICAgICAgb3B0cy5kaXNwbGF5ID0gKGRpcmVjdGlvbiA9PT0gXCJEb3duXCIgPyAoVmVsb2NpdHkuQ1NTLlZhbHVlcy5nZXREaXNwbGF5VHlwZShlbGVtZW50KSA9PT0gXCJpbmxpbmVcIiA/IFwiaW5saW5lLWJsb2NrXCIgOiBcImJsb2NrXCIpIDogXCJub25lXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvcHRzLmJlZ2luID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLyogSWYgdGhlIHVzZXIgcGFzc2VkIGluIGEgYmVnaW4gY2FsbGJhY2ssIGZpcmUgaXQgbm93LiAqL1xuICAgICAgICAgICAgICAgIGJlZ2luICYmIGJlZ2luLmNhbGwoZWxlbWVudHMsIGVsZW1lbnRzKTtcblxuICAgICAgICAgICAgICAgIC8qIENhY2hlIHRoZSBlbGVtZW50cycgb3JpZ2luYWwgdmVydGljYWwgZGltZW5zaW9uYWwgcHJvcGVydHkgdmFsdWVzIHNvIHRoYXQgd2UgY2FuIGFuaW1hdGUgYmFjayB0byB0aGVtLiAqL1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BlcnR5IGluIGNvbXB1dGVkVmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlubGluZVZhbHVlc1twcm9wZXJ0eV0gPSBlbGVtZW50LnN0eWxlW3Byb3BlcnR5XTtcblxuICAgICAgICAgICAgICAgICAgICAvKiBGb3Igc2xpZGVEb3duLCB1c2UgZm9yY2VmZWVkaW5nIHRvIGFuaW1hdGUgYWxsIHZlcnRpY2FsIHByb3BlcnRpZXMgZnJvbSAwLiBGb3Igc2xpZGVVcCxcbiAgICAgICAgICAgICAgICAgICAgICAgdXNlIGZvcmNlZmVlZGluZyB0byBzdGFydCBmcm9tIGNvbXB1dGVkIHZhbHVlcyBhbmQgYW5pbWF0ZSBkb3duIHRvIDAuICovXG4gICAgICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eVZhbHVlID0gVmVsb2NpdHkuQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgcHJvcGVydHkpO1xuICAgICAgICAgICAgICAgICAgICBjb21wdXRlZFZhbHVlc1twcm9wZXJ0eV0gPSAoZGlyZWN0aW9uID09PSBcIkRvd25cIikgPyBbIHByb3BlcnR5VmFsdWUsIDAgXSA6IFsgMCwgcHJvcGVydHlWYWx1ZSBdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qIEZvcmNlIHZlcnRpY2FsIG92ZXJmbG93IGNvbnRlbnQgdG8gY2xpcCBzbyB0aGF0IHNsaWRpbmcgd29ya3MgYXMgZXhwZWN0ZWQuICovXG4gICAgICAgICAgICAgICAgaW5saW5lVmFsdWVzLm92ZXJmbG93ID0gZWxlbWVudC5zdHlsZS5vdmVyZmxvdztcbiAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlLm92ZXJmbG93ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3B0cy5jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8qIFJlc2V0IGVsZW1lbnQgdG8gaXRzIHByZS1zbGlkZSBpbmxpbmUgdmFsdWVzIG9uY2UgaXRzIHNsaWRlIGFuaW1hdGlvbiBpcyBjb21wbGV0ZS4gKi9cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiBpbmxpbmVWYWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5zdHlsZVtwcm9wZXJ0eV0gPSBpbmxpbmVWYWx1ZXNbcHJvcGVydHldO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qIElmIHRoZSB1c2VyIHBhc3NlZCBpbiBhIGNvbXBsZXRlIGNhbGxiYWNrLCBmaXJlIGl0IG5vdy4gKi9cbiAgICAgICAgICAgICAgICBjb21wbGV0ZSAmJiBjb21wbGV0ZS5jYWxsKGVsZW1lbnRzLCBlbGVtZW50cyk7XG4gICAgICAgICAgICAgICAgcHJvbWlzZURhdGEgJiYgcHJvbWlzZURhdGEucmVzb2x2ZXIoZWxlbWVudHMpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgVmVsb2NpdHkoZWxlbWVudCwgY29tcHV0ZWRWYWx1ZXMsIG9wdHMpO1xuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgLyogZmFkZUluLCBmYWRlT3V0ICovXG4gICAgJC5lYWNoKFsgXCJJblwiLCBcIk91dFwiIF0sIGZ1bmN0aW9uKGksIGRpcmVjdGlvbikge1xuICAgICAgICBWZWxvY2l0eS5SZWRpcmVjdHNbXCJmYWRlXCIgKyBkaXJlY3Rpb25dID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMsIGVsZW1lbnRzSW5kZXgsIGVsZW1lbnRzU2l6ZSwgZWxlbWVudHMsIHByb21pc2VEYXRhKSB7XG4gICAgICAgICAgICB2YXIgb3B0cyA9ICQuZXh0ZW5kKHt9LCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzTWFwID0geyBvcGFjaXR5OiAoZGlyZWN0aW9uID09PSBcIkluXCIpID8gMSA6IDAgfSxcbiAgICAgICAgICAgICAgICBvcmlnaW5hbENvbXBsZXRlID0gb3B0cy5jb21wbGV0ZTtcblxuICAgICAgICAgICAgLyogU2luY2UgcmVkaXJlY3RzIGFyZSB0cmlnZ2VyZWQgaW5kaXZpZHVhbGx5IGZvciBlYWNoIGVsZW1lbnQgaW4gdGhlIGFuaW1hdGVkIHNldCwgYXZvaWQgcmVwZWF0ZWRseSB0cmlnZ2VyaW5nXG4gICAgICAgICAgICAgICBjYWxsYmFja3MgYnkgZmlyaW5nIHRoZW0gb25seSB3aGVuIHRoZSBmaW5hbCBlbGVtZW50IGhhcyBiZWVuIHJlYWNoZWQuICovXG4gICAgICAgICAgICBpZiAoZWxlbWVudHNJbmRleCAhPT0gZWxlbWVudHNTaXplIC0gMSkge1xuICAgICAgICAgICAgICAgIG9wdHMuY29tcGxldGUgPSBvcHRzLmJlZ2luID0gbnVsbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3B0cy5jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAob3JpZ2luYWxDb21wbGV0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luYWxDb21wbGV0ZS5jYWxsKGVsZW1lbnRzLCBlbGVtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlRGF0YSAmJiBwcm9taXNlRGF0YS5yZXNvbHZlcihlbGVtZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiBJZiBhIGRpc3BsYXkgd2FzIHBhc3NlZCBpbiwgdXNlIGl0LiBPdGhlcndpc2UsIGRlZmF1bHQgdG8gXCJub25lXCIgZm9yIGZhZGVPdXQgb3IgdGhlIGVsZW1lbnQtc3BlY2lmaWMgZGVmYXVsdCBmb3IgZmFkZUluLiAqL1xuICAgICAgICAgICAgLyogTm90ZTogV2UgYWxsb3cgdXNlcnMgdG8gcGFzcyBpbiBcIm51bGxcIiB0byBza2lwIGRpc3BsYXkgc2V0dGluZyBhbHRvZ2V0aGVyLiAqL1xuICAgICAgICAgICAgaWYgKG9wdHMuZGlzcGxheSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgb3B0cy5kaXNwbGF5ID0gKGRpcmVjdGlvbiA9PT0gXCJJblwiID8gXCJhdXRvXCIgOiBcIm5vbmVcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIFZlbG9jaXR5KHRoaXMsIHByb3BlcnRpZXNNYXAsIG9wdHMpO1xuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIFZlbG9jaXR5O1xufSgod2luZG93LmpRdWVyeSB8fCB3aW5kb3cuWmVwdG8gfHwgd2luZG93KSwgd2luZG93LCBkb2N1bWVudCk7XG59KSk7XG5cbi8qKioqKioqKioqKioqKioqKipcbiAgIEtub3duIElzc3Vlc1xuKioqKioqKioqKioqKioqKioqL1xuXG4vKiBUaGUgQ1NTIHNwZWMgbWFuZGF0ZXMgdGhhdCB0aGUgdHJhbnNsYXRlWC9ZL1ogdHJhbnNmb3JtcyBhcmUgJS1yZWxhdGl2ZSB0byB0aGUgZWxlbWVudCBpdHNlbGYgLS0gbm90IGl0cyBwYXJlbnQuXG5WZWxvY2l0eSwgaG93ZXZlciwgZG9lc24ndCBtYWtlIHRoaXMgZGlzdGluY3Rpb24uIFRodXMsIGNvbnZlcnRpbmcgdG8gb3IgZnJvbSB0aGUgJSB1bml0IHdpdGggdGhlc2Ugc3VicHJvcGVydGllc1xud2lsbCBwcm9kdWNlIGFuIGluYWNjdXJhdGUgY29udmVyc2lvbiB2YWx1ZS4gVGhlIHNhbWUgaXNzdWUgZXhpc3RzIHdpdGggdGhlIGN4L2N5IGF0dHJpYnV0ZXMgb2YgU1ZHIGNpcmNsZXMgYW5kIGVsbGlwc2VzLiAqLyJdfQ==
