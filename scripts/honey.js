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
var ScrollPhone = require('./lib/scroll-phone')
var Cycle = require('./lib/cycle')

var Site = function() {
  this.loadImages()

  this.$body = $('body')
  this.nav = new ScrollNav()
  this.phone = new ScrollPhone()

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

  var biteCycle = new Cycle($sliderIcons.next('.cycle-captions'))

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

  var dietitianCycle = new Cycle($sliderPhotos.next('.cycle-captions'));

  $sliderPhotos.find('.slider-item').on('click', function() {
    dietitianSlider.select($(this).index())
  })

  $sliderPhotos.on('cellSelect', function() {
    var i = dietitianSlider.selectedIndex

    dietitianCycle.go(i)
  })

  var $cycleShuffle = $('.cycle-shuffle')

  var shuffleCycle = new Cycle($cycleShuffle)

  $cycleShuffle.next('.cycle-shuffle-button').on('click', function() {
    var i = shuffleCycle.index + 1

    i = i >= shuffleCycle.$items.length ? 0 : i

    shuffleCycle.go(i)
  })

  var $featureContent = $('.features-content')
  var $featureItems = $('.features-content-item')
  var $featureImages = $('.features-phone-screenshot')

  $featureItems.on('click', function(event) {
    if(this.isBig()) {
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
}

Site.prototype = {
  isSmall: function() {
    var ww = window.innerWidth
    var wh = window.innerHeight

    return (ww < 700 || wh < 500)
  },

  isBig: function() {
    var ww = window.innerWidth
    var wh = window.innerHeight

    return (ww >= 700 && wh >= 500)
  },

  getSize: function() {
    return this.isSmall ? 'small' : 'big';
  },

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

},{"./lib/cycle":27,"./lib/scroll-nav":28,"./lib/scroll-phone":29,"flickity":10,"flickity-imagesloaded":1}],27:[function(require,module,exports){
var $ = (window.jQuery)
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
},{"velocity":"velocity"}],28:[function(require,module,exports){
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
    }
  }
}

module.exports = ScrollNav
},{"jquery-mousewheel":"jquery-mousewheel","velocity":"velocity"}],29:[function(require,module,exports){
var $ = (window.jQuery)

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
},{}],"jquery-mousewheel":[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZmxpY2tpdHktaW1hZ2VzbG9hZGVkL2ZsaWNraXR5LWltYWdlc2xvYWRlZC5qcyIsIm5vZGVfbW9kdWxlcy9mbGlja2l0eS1pbWFnZXNsb2FkZWQvbm9kZV9tb2R1bGVzL2ltYWdlc2xvYWRlZC9pbWFnZXNsb2FkZWQuanMiLCJub2RlX21vZHVsZXMvZmxpY2tpdHktaW1hZ2VzbG9hZGVkL25vZGVfbW9kdWxlcy9pbWFnZXNsb2FkZWQvbm9kZV9tb2R1bGVzL2V2ZW50aWUvZXZlbnRpZS5qcyIsIm5vZGVfbW9kdWxlcy9mbGlja2l0eS1pbWFnZXNsb2FkZWQvbm9kZV9tb2R1bGVzL2ltYWdlc2xvYWRlZC9ub2RlX21vZHVsZXMvd29sZnk4Ny1ldmVudGVtaXR0ZXIvRXZlbnRFbWl0dGVyLmpzIiwibm9kZV9tb2R1bGVzL2ZsaWNraXR5L2pzL2FkZC1yZW1vdmUtY2VsbC5qcyIsIm5vZGVfbW9kdWxlcy9mbGlja2l0eS9qcy9hbmltYXRlLmpzIiwibm9kZV9tb2R1bGVzL2ZsaWNraXR5L2pzL2NlbGwuanMiLCJub2RlX21vZHVsZXMvZmxpY2tpdHkvanMvZHJhZy5qcyIsIm5vZGVfbW9kdWxlcy9mbGlja2l0eS9qcy9mbGlja2l0eS5qcyIsIm5vZGVfbW9kdWxlcy9mbGlja2l0eS9qcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9mbGlja2l0eS9qcy9wYWdlLWRvdHMuanMiLCJub2RlX21vZHVsZXMvZmxpY2tpdHkvanMvcGxheWVyLmpzIiwibm9kZV9tb2R1bGVzL2ZsaWNraXR5L2pzL3ByZXYtbmV4dC1idXR0b24uanMiLCJub2RlX21vZHVsZXMvZmxpY2tpdHkvbm9kZV9tb2R1bGVzL2Rlc2FuZHJvLWNsYXNzaWUvY2xhc3NpZS5qcyIsIm5vZGVfbW9kdWxlcy9mbGlja2l0eS9ub2RlX21vZHVsZXMvZGVzYW5kcm8tZ2V0LXN0eWxlLXByb3BlcnR5L2dldC1zdHlsZS1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9mbGlja2l0eS9ub2RlX21vZHVsZXMvZGVzYW5kcm8tbWF0Y2hlcy1zZWxlY3Rvci9tYXRjaGVzLXNlbGVjdG9yLmpzIiwibm9kZV9tb2R1bGVzL2ZsaWNraXR5L25vZGVfbW9kdWxlcy9kb2MtcmVhZHkvZG9jLXJlYWR5LmpzIiwibm9kZV9tb2R1bGVzL2ZsaWNraXR5L25vZGVfbW9kdWxlcy9maXp6eS11aS11dGlscy91dGlscy5qcyIsIm5vZGVfbW9kdWxlcy9mbGlja2l0eS9ub2RlX21vZHVsZXMvZ2V0LXNpemUvZ2V0LXNpemUuanMiLCJub2RlX21vZHVsZXMvZmxpY2tpdHkvbm9kZV9tb2R1bGVzL3RhcC1saXN0ZW5lci9ub2RlX21vZHVsZXMvdW5pcG9pbnRlci91bmlwb2ludGVyLmpzIiwibm9kZV9tb2R1bGVzL2ZsaWNraXR5L25vZGVfbW9kdWxlcy90YXAtbGlzdGVuZXIvdGFwLWxpc3RlbmVyLmpzIiwibm9kZV9tb2R1bGVzL2ZsaWNraXR5L25vZGVfbW9kdWxlcy91bmlkcmFnZ2VyL3VuaWRyYWdnZXIuanMiLCJzY3JpcHRzL3NyYy9ob25leS5qcyIsInNjcmlwdHMvc3JjL2xpYi9jeWNsZS5qcyIsInNjcmlwdHMvc3JjL2xpYi9zY3JvbGwtbmF2LmpzIiwic2NyaXB0cy9zcmMvbGliL3Njcm9sbC1waG9uZS5qcyIsImJvd2VyX2NvbXBvbmVudHMvanF1ZXJ5LW1vdXNld2hlZWwvanF1ZXJ5Lm1vdXNld2hlZWwuanMiLCJib3dlcl9jb21wb25lbnRzL3ZlbG9jaXR5L3ZlbG9jaXR5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4ZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9PQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIVxuICogRmxpY2tpdHkgaW1hZ2VzTG9hZGVkIHYxLjAuMFxuICogZW5hYmxlcyBpbWFnZXNMb2FkZWQgb3B0aW9uIGZvciBGbGlja2l0eVxuICovXG5cbi8qanNoaW50IGJyb3dzZXI6IHRydWUsIHN0cmljdDogdHJ1ZSwgdW5kZWY6IHRydWUsIHVudXNlZDogdHJ1ZSAqL1xuXG4oIGZ1bmN0aW9uKCB3aW5kb3csIGZhY3RvcnkgKSB7XG4gIC8qZ2xvYmFsIGRlZmluZTogZmFsc2UsIG1vZHVsZTogZmFsc2UsIHJlcXVpcmU6IGZhbHNlICovXG4gICd1c2Ugc3RyaWN0JztcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG5cbiAgaWYgKCB0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoIFtcbiAgICAgICdmbGlja2l0eS9qcy9pbmRleCcsXG4gICAgICAnaW1hZ2VzbG9hZGVkL2ltYWdlc2xvYWRlZCdcbiAgICBdLCBmdW5jdGlvbiggRmxpY2tpdHksIGltYWdlc0xvYWRlZCApIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KCB3aW5kb3csIEZsaWNraXR5LCBpbWFnZXNMb2FkZWQgKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIGV4cG9ydHMgPT0gJ29iamVjdCcgKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICByZXF1aXJlKCdmbGlja2l0eScpLFxuICAgICAgcmVxdWlyZSgnaW1hZ2VzbG9hZGVkJylcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93LkZsaWNraXR5ID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHdpbmRvdy5GbGlja2l0eSxcbiAgICAgIHdpbmRvdy5pbWFnZXNMb2FkZWRcbiAgICApO1xuICB9XG5cbn0oIHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSggd2luZG93LCBGbGlja2l0eSwgaW1hZ2VzTG9hZGVkICkge1xuJ3VzZSBzdHJpY3QnO1xuXG5GbGlja2l0eS5jcmVhdGVNZXRob2RzLnB1c2goJ19jcmVhdGVJbWFnZXNMb2FkZWQnKTtcblxuRmxpY2tpdHkucHJvdG90eXBlLl9jcmVhdGVJbWFnZXNMb2FkZWQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5vbiggJ2FjdGl2YXRlJywgdGhpcy5pbWFnZXNMb2FkZWQgKTtcbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5pbWFnZXNMb2FkZWQgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCAhdGhpcy5vcHRpb25zLmltYWdlc0xvYWRlZCApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIF90aGlzID0gdGhpcztcbiAgZnVuY3Rpb24gb25JbWFnZXNMb2FkZWRQcm9ncmVzcyggaW5zdGFuY2UsIGltYWdlICkge1xuICAgIHZhciBjZWxsID0gX3RoaXMuZ2V0UGFyZW50Q2VsbCggaW1hZ2UuaW1nICk7XG4gICAgX3RoaXMuY2VsbFNpemVDaGFuZ2UoIGNlbGwgJiYgY2VsbC5lbGVtZW50ICk7XG4gIH1cbiAgaW1hZ2VzTG9hZGVkKCB0aGlzLnNsaWRlciApLm9uKCAncHJvZ3Jlc3MnLCBvbkltYWdlc0xvYWRlZFByb2dyZXNzICk7XG59O1xuXG5yZXR1cm4gRmxpY2tpdHk7XG5cbn0pKTtcbiIsIi8qIVxuICogaW1hZ2VzTG9hZGVkIHYzLjEuOFxuICogSmF2YVNjcmlwdCBpcyBhbGwgbGlrZSBcIllvdSBpbWFnZXMgYXJlIGRvbmUgeWV0IG9yIHdoYXQ/XCJcbiAqIE1JVCBMaWNlbnNlXG4gKi9cblxuKCBmdW5jdGlvbiggd2luZG93LCBmYWN0b3J5ICkgeyAndXNlIHN0cmljdCc7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIC8qZ2xvYmFsIGRlZmluZTogZmFsc2UsIG1vZHVsZTogZmFsc2UsIHJlcXVpcmU6IGZhbHNlICovXG5cbiAgaWYgKCB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCBbXG4gICAgICAnZXZlbnRFbWl0dGVyL0V2ZW50RW1pdHRlcicsXG4gICAgICAnZXZlbnRpZS9ldmVudGllJ1xuICAgIF0sIGZ1bmN0aW9uKCBFdmVudEVtaXR0ZXIsIGV2ZW50aWUgKSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSggd2luZG93LCBFdmVudEVtaXR0ZXIsIGV2ZW50aWUgKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICkge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LFxuICAgICAgcmVxdWlyZSgnd29sZnk4Ny1ldmVudGVtaXR0ZXInKSxcbiAgICAgIHJlcXVpcmUoJ2V2ZW50aWUnKVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cuaW1hZ2VzTG9hZGVkID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHdpbmRvdy5FdmVudEVtaXR0ZXIsXG4gICAgICB3aW5kb3cuZXZlbnRpZVxuICAgICk7XG4gIH1cblxufSkoIHdpbmRvdyxcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gIGZhY3RvcnkgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuZnVuY3Rpb24gZmFjdG9yeSggd2luZG93LCBFdmVudEVtaXR0ZXIsIGV2ZW50aWUgKSB7XG5cbid1c2Ugc3RyaWN0JztcblxudmFyICQgPSB3aW5kb3cualF1ZXJ5O1xudmFyIGNvbnNvbGUgPSB3aW5kb3cuY29uc29sZTtcbnZhciBoYXNDb25zb2xlID0gdHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBoZWxwZXJzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbi8vIGV4dGVuZCBvYmplY3RzXG5mdW5jdGlvbiBleHRlbmQoIGEsIGIgKSB7XG4gIGZvciAoIHZhciBwcm9wIGluIGIgKSB7XG4gICAgYVsgcHJvcCBdID0gYlsgcHJvcCBdO1xuICB9XG4gIHJldHVybiBhO1xufVxuXG52YXIgb2JqVG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuZnVuY3Rpb24gaXNBcnJheSggb2JqICkge1xuICByZXR1cm4gb2JqVG9TdHJpbmcuY2FsbCggb2JqICkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59XG5cbi8vIHR1cm4gZWxlbWVudCBvciBub2RlTGlzdCBpbnRvIGFuIGFycmF5XG5mdW5jdGlvbiBtYWtlQXJyYXkoIG9iaiApIHtcbiAgdmFyIGFyeSA9IFtdO1xuICBpZiAoIGlzQXJyYXkoIG9iaiApICkge1xuICAgIC8vIHVzZSBvYmplY3QgaWYgYWxyZWFkeSBhbiBhcnJheVxuICAgIGFyeSA9IG9iajtcbiAgfSBlbHNlIGlmICggdHlwZW9mIG9iai5sZW5ndGggPT09ICdudW1iZXInICkge1xuICAgIC8vIGNvbnZlcnQgbm9kZUxpc3QgdG8gYXJyYXlcbiAgICBmb3IgKCB2YXIgaT0wLCBsZW4gPSBvYmoubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICBhcnkucHVzaCggb2JqW2ldICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIGFycmF5IG9mIHNpbmdsZSBpbmRleFxuICAgIGFyeS5wdXNoKCBvYmogKTtcbiAgfVxuICByZXR1cm4gYXJ5O1xufVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGltYWdlc0xvYWRlZCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0FycmF5LCBFbGVtZW50LCBOb2RlTGlzdCwgU3RyaW5nfSBlbGVtXG4gICAqIEBwYXJhbSB7T2JqZWN0IG9yIEZ1bmN0aW9ufSBvcHRpb25zIC0gaWYgZnVuY3Rpb24sIHVzZSBhcyBjYWxsYmFja1xuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBvbkFsd2F5cyAtIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAqL1xuICBmdW5jdGlvbiBJbWFnZXNMb2FkZWQoIGVsZW0sIG9wdGlvbnMsIG9uQWx3YXlzICkge1xuICAgIC8vIGNvZXJjZSBJbWFnZXNMb2FkZWQoKSB3aXRob3V0IG5ldywgdG8gYmUgbmV3IEltYWdlc0xvYWRlZCgpXG4gICAgaWYgKCAhKCB0aGlzIGluc3RhbmNlb2YgSW1hZ2VzTG9hZGVkICkgKSB7XG4gICAgICByZXR1cm4gbmV3IEltYWdlc0xvYWRlZCggZWxlbSwgb3B0aW9ucyApO1xuICAgIH1cbiAgICAvLyB1c2UgZWxlbSBhcyBzZWxlY3RvciBzdHJpbmdcbiAgICBpZiAoIHR5cGVvZiBlbGVtID09PSAnc3RyaW5nJyApIHtcbiAgICAgIGVsZW0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCBlbGVtICk7XG4gICAgfVxuXG4gICAgdGhpcy5lbGVtZW50cyA9IG1ha2VBcnJheSggZWxlbSApO1xuICAgIHRoaXMub3B0aW9ucyA9IGV4dGVuZCgge30sIHRoaXMub3B0aW9ucyApO1xuXG4gICAgaWYgKCB0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgIG9uQWx3YXlzID0gb3B0aW9ucztcbiAgICB9IGVsc2Uge1xuICAgICAgZXh0ZW5kKCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMgKTtcbiAgICB9XG5cbiAgICBpZiAoIG9uQWx3YXlzICkge1xuICAgICAgdGhpcy5vbiggJ2Fsd2F5cycsIG9uQWx3YXlzICk7XG4gICAgfVxuXG4gICAgdGhpcy5nZXRJbWFnZXMoKTtcblxuICAgIGlmICggJCApIHtcbiAgICAgIC8vIGFkZCBqUXVlcnkgRGVmZXJyZWQgb2JqZWN0XG4gICAgICB0aGlzLmpxRGVmZXJyZWQgPSBuZXcgJC5EZWZlcnJlZCgpO1xuICAgIH1cblxuICAgIC8vIEhBQ0sgY2hlY2sgYXN5bmMgdG8gYWxsb3cgdGltZSB0byBiaW5kIGxpc3RlbmVyc1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG4gICAgICBfdGhpcy5jaGVjaygpO1xuICAgIH0pO1xuICB9XG5cbiAgSW1hZ2VzTG9hZGVkLnByb3RvdHlwZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICBJbWFnZXNMb2FkZWQucHJvdG90eXBlLm9wdGlvbnMgPSB7fTtcblxuICBJbWFnZXNMb2FkZWQucHJvdG90eXBlLmdldEltYWdlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaW1hZ2VzID0gW107XG5cbiAgICAvLyBmaWx0ZXIgJiBmaW5kIGl0ZW1zIGlmIHdlIGhhdmUgYW4gaXRlbSBzZWxlY3RvclxuICAgIGZvciAoIHZhciBpPTAsIGxlbiA9IHRoaXMuZWxlbWVudHMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICB2YXIgZWxlbSA9IHRoaXMuZWxlbWVudHNbaV07XG4gICAgICAvLyBmaWx0ZXIgc2libGluZ3NcbiAgICAgIGlmICggZWxlbS5ub2RlTmFtZSA9PT0gJ0lNRycgKSB7XG4gICAgICAgIHRoaXMuYWRkSW1hZ2UoIGVsZW0gKTtcbiAgICAgIH1cbiAgICAgIC8vIGZpbmQgY2hpbGRyZW5cbiAgICAgIC8vIG5vIG5vbi1lbGVtZW50IG5vZGVzLCAjMTQzXG4gICAgICB2YXIgbm9kZVR5cGUgPSBlbGVtLm5vZGVUeXBlO1xuICAgICAgaWYgKCAhbm9kZVR5cGUgfHwgISggbm9kZVR5cGUgPT09IDEgfHwgbm9kZVR5cGUgPT09IDkgfHwgbm9kZVR5cGUgPT09IDExICkgKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdmFyIGNoaWxkRWxlbXMgPSBlbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoJ2ltZycpO1xuICAgICAgLy8gY29uY2F0IGNoaWxkRWxlbXMgdG8gZmlsdGVyRm91bmQgYXJyYXlcbiAgICAgIGZvciAoIHZhciBqPTAsIGpMZW4gPSBjaGlsZEVsZW1zLmxlbmd0aDsgaiA8IGpMZW47IGorKyApIHtcbiAgICAgICAgdmFyIGltZyA9IGNoaWxkRWxlbXNbal07XG4gICAgICAgIHRoaXMuYWRkSW1hZ2UoIGltZyApO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogQHBhcmFtIHtJbWFnZX0gaW1nXG4gICAqL1xuICBJbWFnZXNMb2FkZWQucHJvdG90eXBlLmFkZEltYWdlID0gZnVuY3Rpb24oIGltZyApIHtcbiAgICB2YXIgbG9hZGluZ0ltYWdlID0gbmV3IExvYWRpbmdJbWFnZSggaW1nICk7XG4gICAgdGhpcy5pbWFnZXMucHVzaCggbG9hZGluZ0ltYWdlICk7XG4gIH07XG5cbiAgSW1hZ2VzTG9hZGVkLnByb3RvdHlwZS5jaGVjayA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdmFyIGNoZWNrZWRDb3VudCA9IDA7XG4gICAgdmFyIGxlbmd0aCA9IHRoaXMuaW1hZ2VzLmxlbmd0aDtcbiAgICB0aGlzLmhhc0FueUJyb2tlbiA9IGZhbHNlO1xuICAgIC8vIGNvbXBsZXRlIGlmIG5vIGltYWdlc1xuICAgIGlmICggIWxlbmd0aCApIHtcbiAgICAgIHRoaXMuY29tcGxldGUoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvbkNvbmZpcm0oIGltYWdlLCBtZXNzYWdlICkge1xuICAgICAgaWYgKCBfdGhpcy5vcHRpb25zLmRlYnVnICYmIGhhc0NvbnNvbGUgKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCAnY29uZmlybScsIGltYWdlLCBtZXNzYWdlICk7XG4gICAgICB9XG5cbiAgICAgIF90aGlzLnByb2dyZXNzKCBpbWFnZSApO1xuICAgICAgY2hlY2tlZENvdW50Kys7XG4gICAgICBpZiAoIGNoZWNrZWRDb3VudCA9PT0gbGVuZ3RoICkge1xuICAgICAgICBfdGhpcy5jb21wbGV0ZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7IC8vIGJpbmQgb25jZVxuICAgIH1cblxuICAgIGZvciAoIHZhciBpPTA7IGkgPCBsZW5ndGg7IGkrKyApIHtcbiAgICAgIHZhciBsb2FkaW5nSW1hZ2UgPSB0aGlzLmltYWdlc1tpXTtcbiAgICAgIGxvYWRpbmdJbWFnZS5vbiggJ2NvbmZpcm0nLCBvbkNvbmZpcm0gKTtcbiAgICAgIGxvYWRpbmdJbWFnZS5jaGVjaygpO1xuICAgIH1cbiAgfTtcblxuICBJbWFnZXNMb2FkZWQucHJvdG90eXBlLnByb2dyZXNzID0gZnVuY3Rpb24oIGltYWdlICkge1xuICAgIHRoaXMuaGFzQW55QnJva2VuID0gdGhpcy5oYXNBbnlCcm9rZW4gfHwgIWltYWdlLmlzTG9hZGVkO1xuICAgIC8vIEhBQ0sgLSBDaHJvbWUgdHJpZ2dlcnMgZXZlbnQgYmVmb3JlIG9iamVjdCBwcm9wZXJ0aWVzIGhhdmUgY2hhbmdlZC4gIzgzXG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICBzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcbiAgICAgIF90aGlzLmVtaXQoICdwcm9ncmVzcycsIF90aGlzLCBpbWFnZSApO1xuICAgICAgaWYgKCBfdGhpcy5qcURlZmVycmVkICYmIF90aGlzLmpxRGVmZXJyZWQubm90aWZ5ICkge1xuICAgICAgICBfdGhpcy5qcURlZmVycmVkLm5vdGlmeSggX3RoaXMsIGltYWdlICk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgSW1hZ2VzTG9hZGVkLnByb3RvdHlwZS5jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBldmVudE5hbWUgPSB0aGlzLmhhc0FueUJyb2tlbiA/ICdmYWlsJyA6ICdkb25lJztcbiAgICB0aGlzLmlzQ29tcGxldGUgPSB0cnVlO1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgLy8gSEFDSyAtIGFub3RoZXIgc2V0VGltZW91dCBzbyB0aGF0IGNvbmZpcm0gaGFwcGVucyBhZnRlciBwcm9ncmVzc1xuICAgIHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuICAgICAgX3RoaXMuZW1pdCggZXZlbnROYW1lLCBfdGhpcyApO1xuICAgICAgX3RoaXMuZW1pdCggJ2Fsd2F5cycsIF90aGlzICk7XG4gICAgICBpZiAoIF90aGlzLmpxRGVmZXJyZWQgKSB7XG4gICAgICAgIHZhciBqcU1ldGhvZCA9IF90aGlzLmhhc0FueUJyb2tlbiA/ICdyZWplY3QnIDogJ3Jlc29sdmUnO1xuICAgICAgICBfdGhpcy5qcURlZmVycmVkWyBqcU1ldGhvZCBdKCBfdGhpcyApO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGpxdWVyeSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIGlmICggJCApIHtcbiAgICAkLmZuLmltYWdlc0xvYWRlZCA9IGZ1bmN0aW9uKCBvcHRpb25zLCBjYWxsYmFjayApIHtcbiAgICAgIHZhciBpbnN0YW5jZSA9IG5ldyBJbWFnZXNMb2FkZWQoIHRoaXMsIG9wdGlvbnMsIGNhbGxiYWNrICk7XG4gICAgICByZXR1cm4gaW5zdGFuY2UuanFEZWZlcnJlZC5wcm9taXNlKCAkKHRoaXMpICk7XG4gICAgfTtcbiAgfVxuXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgZnVuY3Rpb24gTG9hZGluZ0ltYWdlKCBpbWcgKSB7XG4gICAgdGhpcy5pbWcgPSBpbWc7XG4gIH1cblxuICBMb2FkaW5nSW1hZ2UucHJvdG90eXBlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gIExvYWRpbmdJbWFnZS5wcm90b3R5cGUuY2hlY2sgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBmaXJzdCBjaGVjayBjYWNoZWQgYW55IHByZXZpb3VzIGltYWdlcyB0aGF0IGhhdmUgc2FtZSBzcmNcbiAgICB2YXIgcmVzb3VyY2UgPSBjYWNoZVsgdGhpcy5pbWcuc3JjIF0gfHwgbmV3IFJlc291cmNlKCB0aGlzLmltZy5zcmMgKTtcbiAgICBpZiAoIHJlc291cmNlLmlzQ29uZmlybWVkICkge1xuICAgICAgdGhpcy5jb25maXJtKCByZXNvdXJjZS5pc0xvYWRlZCwgJ2NhY2hlZCB3YXMgY29uZmlybWVkJyApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIGNvbXBsZXRlIGlzIHRydWUgYW5kIGJyb3dzZXIgc3VwcG9ydHMgbmF0dXJhbCBzaXplcyxcbiAgICAvLyB0cnkgdG8gY2hlY2sgZm9yIGltYWdlIHN0YXR1cyBtYW51YWxseS5cbiAgICBpZiAoIHRoaXMuaW1nLmNvbXBsZXRlICYmIHRoaXMuaW1nLm5hdHVyYWxXaWR0aCAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgLy8gcmVwb3J0IGJhc2VkIG9uIG5hdHVyYWxXaWR0aFxuICAgICAgdGhpcy5jb25maXJtKCB0aGlzLmltZy5uYXR1cmFsV2lkdGggIT09IDAsICduYXR1cmFsV2lkdGgnICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgbm9uZSBvZiB0aGUgY2hlY2tzIGFib3ZlIG1hdGNoZWQsIHNpbXVsYXRlIGxvYWRpbmcgb24gZGV0YWNoZWQgZWxlbWVudC5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHJlc291cmNlLm9uKCAnY29uZmlybScsIGZ1bmN0aW9uKCByZXNyYywgbWVzc2FnZSApIHtcbiAgICAgIF90aGlzLmNvbmZpcm0oIHJlc3JjLmlzTG9hZGVkLCBtZXNzYWdlICk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcblxuICAgIHJlc291cmNlLmNoZWNrKCk7XG4gIH07XG5cbiAgTG9hZGluZ0ltYWdlLnByb3RvdHlwZS5jb25maXJtID0gZnVuY3Rpb24oIGlzTG9hZGVkLCBtZXNzYWdlICkge1xuICAgIHRoaXMuaXNMb2FkZWQgPSBpc0xvYWRlZDtcbiAgICB0aGlzLmVtaXQoICdjb25maXJtJywgdGhpcywgbWVzc2FnZSApO1xuICB9O1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFJlc291cmNlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgLy8gUmVzb3VyY2UgY2hlY2tzIGVhY2ggc3JjLCBvbmx5IG9uY2VcbiAgLy8gc2VwYXJhdGUgY2xhc3MgZnJvbSBMb2FkaW5nSW1hZ2UgdG8gcHJldmVudCBtZW1vcnkgbGVha3MuIFNlZSAjMTE1XG5cbiAgdmFyIGNhY2hlID0ge307XG5cbiAgZnVuY3Rpb24gUmVzb3VyY2UoIHNyYyApIHtcbiAgICB0aGlzLnNyYyA9IHNyYztcbiAgICAvLyBhZGQgdG8gY2FjaGVcbiAgICBjYWNoZVsgc3JjIF0gPSB0aGlzO1xuICB9XG5cbiAgUmVzb3VyY2UucHJvdG90eXBlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gIFJlc291cmNlLnByb3RvdHlwZS5jaGVjayA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIG9ubHkgdHJpZ2dlciBjaGVja2luZyBvbmNlXG4gICAgaWYgKCB0aGlzLmlzQ2hlY2tlZCApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gc2ltdWxhdGUgbG9hZGluZyBvbiBkZXRhY2hlZCBlbGVtZW50XG4gICAgdmFyIHByb3h5SW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICBldmVudGllLmJpbmQoIHByb3h5SW1hZ2UsICdsb2FkJywgdGhpcyApO1xuICAgIGV2ZW50aWUuYmluZCggcHJveHlJbWFnZSwgJ2Vycm9yJywgdGhpcyApO1xuICAgIHByb3h5SW1hZ2Uuc3JjID0gdGhpcy5zcmM7XG4gICAgLy8gc2V0IGZsYWdcbiAgICB0aGlzLmlzQ2hlY2tlZCA9IHRydWU7XG4gIH07XG5cbiAgLy8gLS0tLS0gZXZlbnRzIC0tLS0tIC8vXG5cbiAgLy8gdHJpZ2dlciBzcGVjaWZpZWQgaGFuZGxlciBmb3IgZXZlbnQgdHlwZVxuICBSZXNvdXJjZS5wcm90b3R5cGUuaGFuZGxlRXZlbnQgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gICAgdmFyIG1ldGhvZCA9ICdvbicgKyBldmVudC50eXBlO1xuICAgIGlmICggdGhpc1sgbWV0aG9kIF0gKSB7XG4gICAgICB0aGlzWyBtZXRob2QgXSggZXZlbnQgKTtcbiAgICB9XG4gIH07XG5cbiAgUmVzb3VyY2UucHJvdG90eXBlLm9ubG9hZCA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgICB0aGlzLmNvbmZpcm0oIHRydWUsICdvbmxvYWQnICk7XG4gICAgdGhpcy51bmJpbmRQcm94eUV2ZW50cyggZXZlbnQgKTtcbiAgfTtcblxuICBSZXNvdXJjZS5wcm90b3R5cGUub25lcnJvciA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgICB0aGlzLmNvbmZpcm0oIGZhbHNlLCAnb25lcnJvcicgKTtcbiAgICB0aGlzLnVuYmluZFByb3h5RXZlbnRzKCBldmVudCApO1xuICB9O1xuXG4gIC8vIC0tLS0tIGNvbmZpcm0gLS0tLS0gLy9cblxuICBSZXNvdXJjZS5wcm90b3R5cGUuY29uZmlybSA9IGZ1bmN0aW9uKCBpc0xvYWRlZCwgbWVzc2FnZSApIHtcbiAgICB0aGlzLmlzQ29uZmlybWVkID0gdHJ1ZTtcbiAgICB0aGlzLmlzTG9hZGVkID0gaXNMb2FkZWQ7XG4gICAgdGhpcy5lbWl0KCAnY29uZmlybScsIHRoaXMsIG1lc3NhZ2UgKTtcbiAgfTtcblxuICBSZXNvdXJjZS5wcm90b3R5cGUudW5iaW5kUHJveHlFdmVudHMgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gICAgZXZlbnRpZS51bmJpbmQoIGV2ZW50LnRhcmdldCwgJ2xvYWQnLCB0aGlzICk7XG4gICAgZXZlbnRpZS51bmJpbmQoIGV2ZW50LnRhcmdldCwgJ2Vycm9yJywgdGhpcyApO1xuICB9O1xuXG4gIC8vIC0tLS0tICAtLS0tLSAvL1xuXG4gIHJldHVybiBJbWFnZXNMb2FkZWQ7XG5cbn0pO1xuIiwiLyohXG4gKiBldmVudGllIHYxLjAuNlxuICogZXZlbnQgYmluZGluZyBoZWxwZXJcbiAqICAgZXZlbnRpZS5iaW5kKCBlbGVtLCAnY2xpY2snLCBteUZuIClcbiAqICAgZXZlbnRpZS51bmJpbmQoIGVsZW0sICdjbGljaycsIG15Rm4gKVxuICogTUlUIGxpY2Vuc2VcbiAqL1xuXG4vKmpzaGludCBicm93c2VyOiB0cnVlLCB1bmRlZjogdHJ1ZSwgdW51c2VkOiB0cnVlICovXG4vKmdsb2JhbCBkZWZpbmU6IGZhbHNlLCBtb2R1bGU6IGZhbHNlICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdyApIHtcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgZG9jRWxlbSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblxudmFyIGJpbmQgPSBmdW5jdGlvbigpIHt9O1xuXG5mdW5jdGlvbiBnZXRJRUV2ZW50KCBvYmogKSB7XG4gIHZhciBldmVudCA9IHdpbmRvdy5ldmVudDtcbiAgLy8gYWRkIGV2ZW50LnRhcmdldFxuICBldmVudC50YXJnZXQgPSBldmVudC50YXJnZXQgfHwgZXZlbnQuc3JjRWxlbWVudCB8fCBvYmo7XG4gIHJldHVybiBldmVudDtcbn1cblxuaWYgKCBkb2NFbGVtLmFkZEV2ZW50TGlzdGVuZXIgKSB7XG4gIGJpbmQgPSBmdW5jdGlvbiggb2JqLCB0eXBlLCBmbiApIHtcbiAgICBvYmouYWRkRXZlbnRMaXN0ZW5lciggdHlwZSwgZm4sIGZhbHNlICk7XG4gIH07XG59IGVsc2UgaWYgKCBkb2NFbGVtLmF0dGFjaEV2ZW50ICkge1xuICBiaW5kID0gZnVuY3Rpb24oIG9iaiwgdHlwZSwgZm4gKSB7XG4gICAgb2JqWyB0eXBlICsgZm4gXSA9IGZuLmhhbmRsZUV2ZW50ID9cbiAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZXZlbnQgPSBnZXRJRUV2ZW50KCBvYmogKTtcbiAgICAgICAgZm4uaGFuZGxlRXZlbnQuY2FsbCggZm4sIGV2ZW50ICk7XG4gICAgICB9IDpcbiAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZXZlbnQgPSBnZXRJRUV2ZW50KCBvYmogKTtcbiAgICAgICAgZm4uY2FsbCggb2JqLCBldmVudCApO1xuICAgICAgfTtcbiAgICBvYmouYXR0YWNoRXZlbnQoIFwib25cIiArIHR5cGUsIG9ialsgdHlwZSArIGZuIF0gKTtcbiAgfTtcbn1cblxudmFyIHVuYmluZCA9IGZ1bmN0aW9uKCkge307XG5cbmlmICggZG9jRWxlbS5yZW1vdmVFdmVudExpc3RlbmVyICkge1xuICB1bmJpbmQgPSBmdW5jdGlvbiggb2JqLCB0eXBlLCBmbiApIHtcbiAgICBvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lciggdHlwZSwgZm4sIGZhbHNlICk7XG4gIH07XG59IGVsc2UgaWYgKCBkb2NFbGVtLmRldGFjaEV2ZW50ICkge1xuICB1bmJpbmQgPSBmdW5jdGlvbiggb2JqLCB0eXBlLCBmbiApIHtcbiAgICBvYmouZGV0YWNoRXZlbnQoIFwib25cIiArIHR5cGUsIG9ialsgdHlwZSArIGZuIF0gKTtcbiAgICB0cnkge1xuICAgICAgZGVsZXRlIG9ialsgdHlwZSArIGZuIF07XG4gICAgfSBjYXRjaCAoIGVyciApIHtcbiAgICAgIC8vIGNhbid0IGRlbGV0ZSB3aW5kb3cgb2JqZWN0IHByb3BlcnRpZXNcbiAgICAgIG9ialsgdHlwZSArIGZuIF0gPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9O1xufVxuXG52YXIgZXZlbnRpZSA9IHtcbiAgYmluZDogYmluZCxcbiAgdW5iaW5kOiB1bmJpbmRcbn07XG5cbi8vIC0tLS0tIG1vZHVsZSBkZWZpbml0aW9uIC0tLS0tIC8vXG5cbmlmICggdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAvLyBBTURcbiAgZGVmaW5lKCBldmVudGllICk7XG59IGVsc2UgaWYgKCB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgKSB7XG4gIC8vIENvbW1vbkpTXG4gIG1vZHVsZS5leHBvcnRzID0gZXZlbnRpZTtcbn0gZWxzZSB7XG4gIC8vIGJyb3dzZXIgZ2xvYmFsXG4gIHdpbmRvdy5ldmVudGllID0gZXZlbnRpZTtcbn1cblxufSkoIHdpbmRvdyApO1xuIiwiLyohXG4gKiBFdmVudEVtaXR0ZXIgdjQuMi4xMSAtIGdpdC5pby9lZVxuICogVW5saWNlbnNlIC0gaHR0cDovL3VubGljZW5zZS5vcmcvXG4gKiBPbGl2ZXIgQ2FsZHdlbGwgLSBodHRwOi8vb2xpLm1lLnVrL1xuICogQHByZXNlcnZlXG4gKi9cblxuOyhmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogQ2xhc3MgZm9yIG1hbmFnaW5nIGV2ZW50cy5cbiAgICAgKiBDYW4gYmUgZXh0ZW5kZWQgdG8gcHJvdmlkZSBldmVudCBmdW5jdGlvbmFsaXR5IGluIG90aGVyIGNsYXNzZXMuXG4gICAgICpcbiAgICAgKiBAY2xhc3MgRXZlbnRFbWl0dGVyIE1hbmFnZXMgZXZlbnQgcmVnaXN0ZXJpbmcgYW5kIGVtaXR0aW5nLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHt9XG5cbiAgICAvLyBTaG9ydGN1dHMgdG8gaW1wcm92ZSBzcGVlZCBhbmQgc2l6ZVxuICAgIHZhciBwcm90byA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGU7XG4gICAgdmFyIGV4cG9ydHMgPSB0aGlzO1xuICAgIHZhciBvcmlnaW5hbEdsb2JhbFZhbHVlID0gZXhwb3J0cy5FdmVudEVtaXR0ZXI7XG5cbiAgICAvKipcbiAgICAgKiBGaW5kcyB0aGUgaW5kZXggb2YgdGhlIGxpc3RlbmVyIGZvciB0aGUgZXZlbnQgaW4gaXRzIHN0b3JhZ2UgYXJyYXkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9uW119IGxpc3RlbmVycyBBcnJheSBvZiBsaXN0ZW5lcnMgdG8gc2VhcmNoIHRocm91Z2guXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIGxvb2sgZm9yLlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gSW5kZXggb2YgdGhlIHNwZWNpZmllZCBsaXN0ZW5lciwgLTEgaWYgbm90IGZvdW5kXG4gICAgICogQGFwaSBwcml2YXRlXG4gICAgICovXG4gICAgZnVuY3Rpb24gaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVycywgbGlzdGVuZXIpIHtcbiAgICAgICAgdmFyIGkgPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzW2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFsaWFzIGEgbWV0aG9kIHdoaWxlIGtlZXBpbmcgdGhlIGNvbnRleHQgY29ycmVjdCwgdG8gYWxsb3cgZm9yIG92ZXJ3cml0aW5nIG9mIHRhcmdldCBtZXRob2QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgdGFyZ2V0IG1ldGhvZC5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIGFsaWFzZWQgbWV0aG9kXG4gICAgICogQGFwaSBwcml2YXRlXG4gICAgICovXG4gICAgZnVuY3Rpb24gYWxpYXMobmFtZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gYWxpYXNDbG9zdXJlKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbbmFtZV0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBsaXN0ZW5lciBhcnJheSBmb3IgdGhlIHNwZWNpZmllZCBldmVudC5cbiAgICAgKiBXaWxsIGluaXRpYWxpc2UgdGhlIGV2ZW50IG9iamVjdCBhbmQgbGlzdGVuZXIgYXJyYXlzIGlmIHJlcXVpcmVkLlxuICAgICAqIFdpbGwgcmV0dXJuIGFuIG9iamVjdCBpZiB5b3UgdXNlIGEgcmVnZXggc2VhcmNoLiBUaGUgb2JqZWN0IGNvbnRhaW5zIGtleXMgZm9yIGVhY2ggbWF0Y2hlZCBldmVudC4gU28gL2JhW3J6XS8gbWlnaHQgcmV0dXJuIGFuIG9iamVjdCBjb250YWluaW5nIGJhciBhbmQgYmF6LiBCdXQgb25seSBpZiB5b3UgaGF2ZSBlaXRoZXIgZGVmaW5lZCB0aGVtIHdpdGggZGVmaW5lRXZlbnQgb3IgYWRkZWQgc29tZSBsaXN0ZW5lcnMgdG8gdGhlbS5cbiAgICAgKiBFYWNoIHByb3BlcnR5IGluIHRoZSBvYmplY3QgcmVzcG9uc2UgaXMgYW4gYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gcmV0dXJuIHRoZSBsaXN0ZW5lcnMgZnJvbS5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbltdfE9iamVjdH0gQWxsIGxpc3RlbmVyIGZ1bmN0aW9ucyBmb3IgdGhlIGV2ZW50LlxuICAgICAqL1xuICAgIHByb3RvLmdldExpc3RlbmVycyA9IGZ1bmN0aW9uIGdldExpc3RlbmVycyhldnQpIHtcbiAgICAgICAgdmFyIGV2ZW50cyA9IHRoaXMuX2dldEV2ZW50cygpO1xuICAgICAgICB2YXIgcmVzcG9uc2U7XG4gICAgICAgIHZhciBrZXk7XG5cbiAgICAgICAgLy8gUmV0dXJuIGEgY29uY2F0ZW5hdGVkIGFycmF5IG9mIGFsbCBtYXRjaGluZyBldmVudHMgaWZcbiAgICAgICAgLy8gdGhlIHNlbGVjdG9yIGlzIGEgcmVndWxhciBleHByZXNzaW9uLlxuICAgICAgICBpZiAoZXZ0IGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICByZXNwb25zZSA9IHt9O1xuICAgICAgICAgICAgZm9yIChrZXkgaW4gZXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGV2dC50ZXN0KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2Vba2V5XSA9IGV2ZW50c1trZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlc3BvbnNlID0gZXZlbnRzW2V2dF0gfHwgKGV2ZW50c1tldnRdID0gW10pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUYWtlcyBhIGxpc3Qgb2YgbGlzdGVuZXIgb2JqZWN0cyBhbmQgZmxhdHRlbnMgaXQgaW50byBhIGxpc3Qgb2YgbGlzdGVuZXIgZnVuY3Rpb25zLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3RbXX0gbGlzdGVuZXJzIFJhdyBsaXN0ZW5lciBvYmplY3RzLlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9uW119IEp1c3QgdGhlIGxpc3RlbmVyIGZ1bmN0aW9ucy5cbiAgICAgKi9cbiAgICBwcm90by5mbGF0dGVuTGlzdGVuZXJzID0gZnVuY3Rpb24gZmxhdHRlbkxpc3RlbmVycyhsaXN0ZW5lcnMpIHtcbiAgICAgICAgdmFyIGZsYXRMaXN0ZW5lcnMgPSBbXTtcbiAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgZmxhdExpc3RlbmVycy5wdXNoKGxpc3RlbmVyc1tpXS5saXN0ZW5lcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmxhdExpc3RlbmVycztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRmV0Y2hlcyB0aGUgcmVxdWVzdGVkIGxpc3RlbmVycyB2aWEgZ2V0TGlzdGVuZXJzIGJ1dCB3aWxsIGFsd2F5cyByZXR1cm4gdGhlIHJlc3VsdHMgaW5zaWRlIGFuIG9iamVjdC4gVGhpcyBpcyBtYWlubHkgZm9yIGludGVybmFsIHVzZSBidXQgb3RoZXJzIG1heSBmaW5kIGl0IHVzZWZ1bC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIHJldHVybiB0aGUgbGlzdGVuZXJzIGZyb20uXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBBbGwgbGlzdGVuZXIgZnVuY3Rpb25zIGZvciBhbiBldmVudCBpbiBhbiBvYmplY3QuXG4gICAgICovXG4gICAgcHJvdG8uZ2V0TGlzdGVuZXJzQXNPYmplY3QgPSBmdW5jdGlvbiBnZXRMaXN0ZW5lcnNBc09iamVjdChldnQpIHtcbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzKGV2dCk7XG4gICAgICAgIHZhciByZXNwb25zZTtcblxuICAgICAgICBpZiAobGlzdGVuZXJzIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIHJlc3BvbnNlID0ge307XG4gICAgICAgICAgICByZXNwb25zZVtldnRdID0gbGlzdGVuZXJzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlIHx8IGxpc3RlbmVycztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxpc3RlbmVyIGZ1bmN0aW9uIHRvIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG4gICAgICogVGhlIGxpc3RlbmVyIHdpbGwgbm90IGJlIGFkZGVkIGlmIGl0IGlzIGEgZHVwbGljYXRlLlxuICAgICAqIElmIHRoZSBsaXN0ZW5lciByZXR1cm5zIHRydWUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgaXQgaXMgY2FsbGVkLlxuICAgICAqIElmIHlvdSBwYXNzIGEgcmVndWxhciBleHByZXNzaW9uIGFzIHRoZSBldmVudCBuYW1lIHRoZW4gdGhlIGxpc3RlbmVyIHdpbGwgYmUgYWRkZWQgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gYXR0YWNoIHRoZSBsaXN0ZW5lciB0by5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGV2ZW50IGlzIGVtaXR0ZWQuIElmIHRoZSBmdW5jdGlvbiByZXR1cm5zIHRydWUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgY2FsbGluZy5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uIGFkZExpc3RlbmVyKGV2dCwgbGlzdGVuZXIpIHtcbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcbiAgICAgICAgdmFyIGxpc3RlbmVySXNXcmFwcGVkID0gdHlwZW9mIGxpc3RlbmVyID09PSAnb2JqZWN0JztcbiAgICAgICAgdmFyIGtleTtcblxuICAgICAgICBmb3IgKGtleSBpbiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIGlmIChsaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBpbmRleE9mTGlzdGVuZXIobGlzdGVuZXJzW2tleV0sIGxpc3RlbmVyKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnNba2V5XS5wdXNoKGxpc3RlbmVySXNXcmFwcGVkID8gbGlzdGVuZXIgOiB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyOiBsaXN0ZW5lcixcbiAgICAgICAgICAgICAgICAgICAgb25jZTogZmFsc2VcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBbGlhcyBvZiBhZGRMaXN0ZW5lclxuICAgICAqL1xuICAgIHByb3RvLm9uID0gYWxpYXMoJ2FkZExpc3RlbmVyJyk7XG5cbiAgICAvKipcbiAgICAgKiBTZW1pLWFsaWFzIG9mIGFkZExpc3RlbmVyLiBJdCB3aWxsIGFkZCBhIGxpc3RlbmVyIHRoYXQgd2lsbCBiZVxuICAgICAqIGF1dG9tYXRpY2FsbHkgcmVtb3ZlZCBhZnRlciBpdHMgZmlyc3QgZXhlY3V0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gYXR0YWNoIHRoZSBsaXN0ZW5lciB0by5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGV2ZW50IGlzIGVtaXR0ZWQuIElmIHRoZSBmdW5jdGlvbiByZXR1cm5zIHRydWUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgY2FsbGluZy5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5hZGRPbmNlTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRPbmNlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lcikge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGRMaXN0ZW5lcihldnQsIHtcbiAgICAgICAgICAgIGxpc3RlbmVyOiBsaXN0ZW5lcixcbiAgICAgICAgICAgIG9uY2U6IHRydWVcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFsaWFzIG9mIGFkZE9uY2VMaXN0ZW5lci5cbiAgICAgKi9cbiAgICBwcm90by5vbmNlID0gYWxpYXMoJ2FkZE9uY2VMaXN0ZW5lcicpO1xuXG4gICAgLyoqXG4gICAgICogRGVmaW5lcyBhbiBldmVudCBuYW1lLiBUaGlzIGlzIHJlcXVpcmVkIGlmIHlvdSB3YW50IHRvIHVzZSBhIHJlZ2V4IHRvIGFkZCBhIGxpc3RlbmVyIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBJZiB5b3UgZG9uJ3QgZG8gdGhpcyB0aGVuIGhvdyBkbyB5b3UgZXhwZWN0IGl0IHRvIGtub3cgd2hhdCBldmVudCB0byBhZGQgdG8/IFNob3VsZCBpdCBqdXN0IGFkZCB0byBldmVyeSBwb3NzaWJsZSBtYXRjaCBmb3IgYSByZWdleD8gTm8uIFRoYXQgaXMgc2NhcnkgYW5kIGJhZC5cbiAgICAgKiBZb3UgbmVlZCB0byB0ZWxsIGl0IHdoYXQgZXZlbnQgbmFtZXMgc2hvdWxkIGJlIG1hdGNoZWQgYnkgYSByZWdleC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gY3JlYXRlLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHByb3RvLmRlZmluZUV2ZW50ID0gZnVuY3Rpb24gZGVmaW5lRXZlbnQoZXZ0KSB7XG4gICAgICAgIHRoaXMuZ2V0TGlzdGVuZXJzKGV2dCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBVc2VzIGRlZmluZUV2ZW50IHRvIGRlZmluZSBtdWx0aXBsZSBldmVudHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ1tdfSBldnRzIEFuIGFycmF5IG9mIGV2ZW50IG5hbWVzIHRvIGRlZmluZS5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5kZWZpbmVFdmVudHMgPSBmdW5jdGlvbiBkZWZpbmVFdmVudHMoZXZ0cykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV2dHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIHRoaXMuZGVmaW5lRXZlbnQoZXZ0c1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgYSBsaXN0ZW5lciBmdW5jdGlvbiBmcm9tIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG4gICAgICogV2hlbiBwYXNzZWQgYSByZWd1bGFyIGV4cHJlc3Npb24gYXMgdGhlIGV2ZW50IG5hbWUsIGl0IHdpbGwgcmVtb3ZlIHRoZSBsaXN0ZW5lciBmcm9tIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gcmVtb3ZlIGZyb20gdGhlIGV2ZW50LlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHByb3RvLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lcikge1xuICAgICAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnNBc09iamVjdChldnQpO1xuICAgICAgICB2YXIgaW5kZXg7XG4gICAgICAgIHZhciBrZXk7XG5cbiAgICAgICAgZm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICBpbmRleCA9IGluZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lcnNba2V5XSwgbGlzdGVuZXIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnNba2V5XS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBbGlhcyBvZiByZW1vdmVMaXN0ZW5lclxuICAgICAqL1xuICAgIHByb3RvLm9mZiA9IGFsaWFzKCdyZW1vdmVMaXN0ZW5lcicpO1xuXG4gICAgLyoqXG4gICAgICogQWRkcyBsaXN0ZW5lcnMgaW4gYnVsayB1c2luZyB0aGUgbWFuaXB1bGF0ZUxpc3RlbmVycyBtZXRob2QuXG4gICAgICogSWYgeW91IHBhc3MgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgeW91IGNhbiBhZGQgdG8gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIFRoZSBvYmplY3Qgc2hvdWxkIGNvbnRhaW4ga2V5IHZhbHVlIHBhaXJzIG9mIGV2ZW50cyBhbmQgbGlzdGVuZXJzIG9yIGxpc3RlbmVyIGFycmF5cy4gWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIGFkZGVkLlxuICAgICAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGEgcmVndWxhciBleHByZXNzaW9uIHRvIGFkZCB0aGUgYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cbiAgICAgKiBZZWFoLCB0aGlzIGZ1bmN0aW9uIGRvZXMgcXVpdGUgYSBiaXQuIFRoYXQncyBwcm9iYWJseSBhIGJhZCB0aGluZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdHxSZWdFeHB9IGV2dCBBbiBldmVudCBuYW1lIGlmIHlvdSB3aWxsIHBhc3MgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIG5leHQuIEFuIG9iamVjdCBpZiB5b3Ugd2lzaCB0byBhZGQgdG8gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbltdfSBbbGlzdGVuZXJzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdG8gYWRkLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHByb3RvLmFkZExpc3RlbmVycyA9IGZ1bmN0aW9uIGFkZExpc3RlbmVycyhldnQsIGxpc3RlbmVycykge1xuICAgICAgICAvLyBQYXNzIHRocm91Z2ggdG8gbWFuaXB1bGF0ZUxpc3RlbmVyc1xuICAgICAgICByZXR1cm4gdGhpcy5tYW5pcHVsYXRlTGlzdGVuZXJzKGZhbHNlLCBldnQsIGxpc3RlbmVycyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgbGlzdGVuZXJzIGluIGJ1bGsgdXNpbmcgdGhlIG1hbmlwdWxhdGVMaXN0ZW5lcnMgbWV0aG9kLlxuICAgICAqIElmIHlvdSBwYXNzIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHlvdSBjYW4gcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIFRoZSBvYmplY3Qgc2hvdWxkIGNvbnRhaW4ga2V5IHZhbHVlIHBhaXJzIG9mIGV2ZW50cyBhbmQgbGlzdGVuZXJzIG9yIGxpc3RlbmVyIGFycmF5cy5cbiAgICAgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhbiBldmVudCBuYW1lIGFuZCBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYmUgcmVtb3ZlZC5cbiAgICAgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byByZW1vdmUgdGhlIGxpc3RlbmVycyBmcm9tIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdHxSZWdFeHB9IGV2dCBBbiBldmVudCBuYW1lIGlmIHlvdSB3aWxsIHBhc3MgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIG5leHQuIEFuIG9iamVjdCBpZiB5b3Ugd2lzaCB0byByZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byByZW1vdmUuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8ucmVtb3ZlTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXJzKGV2dCwgbGlzdGVuZXJzKSB7XG4gICAgICAgIC8vIFBhc3MgdGhyb3VnaCB0byBtYW5pcHVsYXRlTGlzdGVuZXJzXG4gICAgICAgIHJldHVybiB0aGlzLm1hbmlwdWxhdGVMaXN0ZW5lcnModHJ1ZSwgZXZ0LCBsaXN0ZW5lcnMpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBFZGl0cyBsaXN0ZW5lcnMgaW4gYnVsay4gVGhlIGFkZExpc3RlbmVycyBhbmQgcmVtb3ZlTGlzdGVuZXJzIG1ldGhvZHMgYm90aCB1c2UgdGhpcyB0byBkbyB0aGVpciBqb2IuIFlvdSBzaG91bGQgcmVhbGx5IHVzZSB0aG9zZSBpbnN0ZWFkLCB0aGlzIGlzIGEgbGl0dGxlIGxvd2VyIGxldmVsLlxuICAgICAqIFRoZSBmaXJzdCBhcmd1bWVudCB3aWxsIGRldGVybWluZSBpZiB0aGUgbGlzdGVuZXJzIGFyZSByZW1vdmVkICh0cnVlKSBvciBhZGRlZCAoZmFsc2UpLlxuICAgICAqIElmIHlvdSBwYXNzIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHlvdSBjYW4gYWRkL3JlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuXG4gICAgICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIGFkZGVkL3JlbW92ZWQuXG4gICAgICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gbWFuaXB1bGF0ZSB0aGUgbGlzdGVuZXJzIG9mIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gcmVtb3ZlIFRydWUgaWYgeW91IHdhbnQgdG8gcmVtb3ZlIGxpc3RlbmVycywgZmFsc2UgaWYgeW91IHdhbnQgdG8gYWRkLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdHxSZWdFeHB9IGV2dCBBbiBldmVudCBuYW1lIGlmIHlvdSB3aWxsIHBhc3MgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIG5leHQuIEFuIG9iamVjdCBpZiB5b3Ugd2lzaCB0byBhZGQvcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbltdfSBbbGlzdGVuZXJzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdG8gYWRkL3JlbW92ZS5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBwcm90by5tYW5pcHVsYXRlTGlzdGVuZXJzID0gZnVuY3Rpb24gbWFuaXB1bGF0ZUxpc3RlbmVycyhyZW1vdmUsIGV2dCwgbGlzdGVuZXJzKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICB2YXIgdmFsdWU7XG4gICAgICAgIHZhciBzaW5nbGUgPSByZW1vdmUgPyB0aGlzLnJlbW92ZUxpc3RlbmVyIDogdGhpcy5hZGRMaXN0ZW5lcjtcbiAgICAgICAgdmFyIG11bHRpcGxlID0gcmVtb3ZlID8gdGhpcy5yZW1vdmVMaXN0ZW5lcnMgOiB0aGlzLmFkZExpc3RlbmVycztcblxuICAgICAgICAvLyBJZiBldnQgaXMgYW4gb2JqZWN0IHRoZW4gcGFzcyBlYWNoIG9mIGl0cyBwcm9wZXJ0aWVzIHRvIHRoaXMgbWV0aG9kXG4gICAgICAgIGlmICh0eXBlb2YgZXZ0ID09PSAnb2JqZWN0JyAmJiAhKGV2dCBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcbiAgICAgICAgICAgIGZvciAoaSBpbiBldnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZ0Lmhhc093blByb3BlcnR5KGkpICYmICh2YWx1ZSA9IGV2dFtpXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gUGFzcyB0aGUgc2luZ2xlIGxpc3RlbmVyIHN0cmFpZ2h0IHRocm91Z2ggdG8gdGhlIHNpbmd1bGFyIG1ldGhvZFxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGUuY2FsbCh0aGlzLCBpLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBPdGhlcndpc2UgcGFzcyBiYWNrIHRvIHRoZSBtdWx0aXBsZSBmdW5jdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlwbGUuY2FsbCh0aGlzLCBpLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBTbyBldnQgbXVzdCBiZSBhIHN0cmluZ1xuICAgICAgICAgICAgLy8gQW5kIGxpc3RlbmVycyBtdXN0IGJlIGFuIGFycmF5IG9mIGxpc3RlbmVyc1xuICAgICAgICAgICAgLy8gTG9vcCBvdmVyIGl0IGFuZCBwYXNzIGVhY2ggb25lIHRvIHRoZSBtdWx0aXBsZSBtZXRob2RcbiAgICAgICAgICAgIGkgPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgIHNpbmdsZS5jYWxsKHRoaXMsIGV2dCwgbGlzdGVuZXJzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgZnJvbSBhIHNwZWNpZmllZCBldmVudC5cbiAgICAgKiBJZiB5b3UgZG8gbm90IHNwZWNpZnkgYW4gZXZlbnQgdGhlbiBhbGwgbGlzdGVuZXJzIHdpbGwgYmUgcmVtb3ZlZC5cbiAgICAgKiBUaGF0IG1lYW5zIGV2ZXJ5IGV2ZW50IHdpbGwgYmUgZW1wdGllZC5cbiAgICAgKiBZb3UgY2FuIGFsc28gcGFzcyBhIHJlZ2V4IHRvIHJlbW92ZSBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IFtldnRdIE9wdGlvbmFsIG5hbWUgb2YgdGhlIGV2ZW50IHRvIHJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvci4gV2lsbCByZW1vdmUgZnJvbSBldmVyeSBldmVudCBpZiBub3QgcGFzc2VkLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHByb3RvLnJlbW92ZUV2ZW50ID0gZnVuY3Rpb24gcmVtb3ZlRXZlbnQoZXZ0KSB7XG4gICAgICAgIHZhciB0eXBlID0gdHlwZW9mIGV2dDtcbiAgICAgICAgdmFyIGV2ZW50cyA9IHRoaXMuX2dldEV2ZW50cygpO1xuICAgICAgICB2YXIga2V5O1xuXG4gICAgICAgIC8vIFJlbW92ZSBkaWZmZXJlbnQgdGhpbmdzIGRlcGVuZGluZyBvbiB0aGUgc3RhdGUgb2YgZXZ0XG4gICAgICAgIGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgLy8gUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnRcbiAgICAgICAgICAgIGRlbGV0ZSBldmVudHNbZXZ0XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChldnQgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgIC8vIFJlbW92ZSBhbGwgZXZlbnRzIG1hdGNoaW5nIHRoZSByZWdleC5cbiAgICAgICAgICAgIGZvciAoa2V5IGluIGV2ZW50cykge1xuICAgICAgICAgICAgICAgIGlmIChldmVudHMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBldnQudGVzdChrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBldmVudHNba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBSZW1vdmUgYWxsIGxpc3RlbmVycyBpbiBhbGwgZXZlbnRzXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fZXZlbnRzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFsaWFzIG9mIHJlbW92ZUV2ZW50LlxuICAgICAqXG4gICAgICogQWRkZWQgdG8gbWlycm9yIHRoZSBub2RlIEFQSS5cbiAgICAgKi9cbiAgICBwcm90by5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBhbGlhcygncmVtb3ZlRXZlbnQnKTtcblxuICAgIC8qKlxuICAgICAqIEVtaXRzIGFuIGV2ZW50IG9mIHlvdXIgY2hvaWNlLlxuICAgICAqIFdoZW4gZW1pdHRlZCwgZXZlcnkgbGlzdGVuZXIgYXR0YWNoZWQgdG8gdGhhdCBldmVudCB3aWxsIGJlIGV4ZWN1dGVkLlxuICAgICAqIElmIHlvdSBwYXNzIHRoZSBvcHRpb25hbCBhcmd1bWVudCBhcnJheSB0aGVuIHRob3NlIGFyZ3VtZW50cyB3aWxsIGJlIHBhc3NlZCB0byBldmVyeSBsaXN0ZW5lciB1cG9uIGV4ZWN1dGlvbi5cbiAgICAgKiBCZWNhdXNlIGl0IHVzZXMgYGFwcGx5YCwgeW91ciBhcnJheSBvZiBhcmd1bWVudHMgd2lsbCBiZSBwYXNzZWQgYXMgaWYgeW91IHdyb3RlIHRoZW0gb3V0IHNlcGFyYXRlbHkuXG4gICAgICogU28gdGhleSB3aWxsIG5vdCBhcnJpdmUgd2l0aGluIHRoZSBhcnJheSBvbiB0aGUgb3RoZXIgc2lkZSwgdGhleSB3aWxsIGJlIHNlcGFyYXRlLlxuICAgICAqIFlvdSBjYW4gYWxzbyBwYXNzIGEgcmVndWxhciBleHByZXNzaW9uIHRvIGVtaXQgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gZW1pdCBhbmQgZXhlY3V0ZSBsaXN0ZW5lcnMgZm9yLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IFthcmdzXSBPcHRpb25hbCBhcnJheSBvZiBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIHRvIGVhY2ggbGlzdGVuZXIuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgcHJvdG8uZW1pdEV2ZW50ID0gZnVuY3Rpb24gZW1pdEV2ZW50KGV2dCwgYXJncykge1xuICAgICAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnNBc09iamVjdChldnQpO1xuICAgICAgICB2YXIgbGlzdGVuZXI7XG4gICAgICAgIHZhciBpO1xuICAgICAgICB2YXIga2V5O1xuICAgICAgICB2YXIgcmVzcG9uc2U7XG5cbiAgICAgICAgZm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICBpID0gbGlzdGVuZXJzW2tleV0ubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgbGlzdGVuZXIgcmV0dXJucyB0cnVlIHRoZW4gaXQgc2hhbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBldmVudFxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgZnVuY3Rpb24gaXMgZXhlY3V0ZWQgZWl0aGVyIHdpdGggYSBiYXNpYyBjYWxsIG9yIGFuIGFwcGx5IGlmIHRoZXJlIGlzIGFuIGFyZ3MgYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIgPSBsaXN0ZW5lcnNba2V5XVtpXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXIub25jZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcihldnQsIGxpc3RlbmVyLmxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gbGlzdGVuZXIubGlzdGVuZXIuYXBwbHkodGhpcywgYXJncyB8fCBbXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlID09PSB0aGlzLl9nZXRPbmNlUmV0dXJuVmFsdWUoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcihldnQsIGxpc3RlbmVyLmxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBbGlhcyBvZiBlbWl0RXZlbnRcbiAgICAgKi9cbiAgICBwcm90by50cmlnZ2VyID0gYWxpYXMoJ2VtaXRFdmVudCcpO1xuXG4gICAgLyoqXG4gICAgICogU3VidGx5IGRpZmZlcmVudCBmcm9tIGVtaXRFdmVudCBpbiB0aGF0IGl0IHdpbGwgcGFzcyBpdHMgYXJndW1lbnRzIG9uIHRvIHRoZSBsaXN0ZW5lcnMsIGFzIG9wcG9zZWQgdG8gdGFraW5nIGEgc2luZ2xlIGFycmF5IG9mIGFyZ3VtZW50cyB0byBwYXNzIG9uLlxuICAgICAqIEFzIHdpdGggZW1pdEV2ZW50LCB5b3UgY2FuIHBhc3MgYSByZWdleCBpbiBwbGFjZSBvZiB0aGUgZXZlbnQgbmFtZSB0byBlbWl0IHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGVtaXQgYW5kIGV4ZWN1dGUgbGlzdGVuZXJzIGZvci5cbiAgICAgKiBAcGFyYW0gey4uLip9IE9wdGlvbmFsIGFkZGl0aW9uYWwgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBlYWNoIGxpc3RlbmVyLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHByb3RvLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2dCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgIHJldHVybiB0aGlzLmVtaXRFdmVudChldnQsIGFyZ3MpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGFnYWluc3Qgd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLiBJZiBhXG4gICAgICogbGlzdGVuZXJzIHJldHVybiB2YWx1ZSBtYXRjaGVzIHRoZSBvbmUgc2V0IGhlcmUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWRcbiAgICAgKiBhZnRlciBleGVjdXRpb24uIFRoaXMgdmFsdWUgZGVmYXVsdHMgdG8gdHJ1ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIG5ldyB2YWx1ZSB0byBjaGVjayBmb3Igd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHByb3RvLnNldE9uY2VSZXR1cm5WYWx1ZSA9IGZ1bmN0aW9uIHNldE9uY2VSZXR1cm5WYWx1ZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLl9vbmNlUmV0dXJuVmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEZldGNoZXMgdGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgYWdhaW5zdCB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuIElmXG4gICAgICogdGhlIGxpc3RlbmVycyByZXR1cm4gdmFsdWUgbWF0Y2hlcyB0aGlzIG9uZSB0aGVuIGl0IHNob3VsZCBiZSByZW1vdmVkXG4gICAgICogYXV0b21hdGljYWxseS4gSXQgd2lsbCByZXR1cm4gdHJ1ZSBieSBkZWZhdWx0LlxuICAgICAqXG4gICAgICogQHJldHVybiB7KnxCb29sZWFufSBUaGUgY3VycmVudCB2YWx1ZSB0byBjaGVjayBmb3Igb3IgdGhlIGRlZmF1bHQsIHRydWUuXG4gICAgICogQGFwaSBwcml2YXRlXG4gICAgICovXG4gICAgcHJvdG8uX2dldE9uY2VSZXR1cm5WYWx1ZSA9IGZ1bmN0aW9uIF9nZXRPbmNlUmV0dXJuVmFsdWUoKSB7XG4gICAgICAgIGlmICh0aGlzLmhhc093blByb3BlcnR5KCdfb25jZVJldHVyblZhbHVlJykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9vbmNlUmV0dXJuVmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBGZXRjaGVzIHRoZSBldmVudHMgb2JqZWN0IGFuZCBjcmVhdGVzIG9uZSBpZiByZXF1aXJlZC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGV2ZW50cyBzdG9yYWdlIG9iamVjdC5cbiAgICAgKiBAYXBpIHByaXZhdGVcbiAgICAgKi9cbiAgICBwcm90by5fZ2V0RXZlbnRzID0gZnVuY3Rpb24gX2dldEV2ZW50cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2V2ZW50cyB8fCAodGhpcy5fZXZlbnRzID0ge30pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZXZlcnRzIHRoZSBnbG9iYWwge0BsaW5rIEV2ZW50RW1pdHRlcn0gdG8gaXRzIHByZXZpb3VzIHZhbHVlIGFuZCByZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoaXMgdmVyc2lvbi5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBOb24gY29uZmxpY3RpbmcgRXZlbnRFbWl0dGVyIGNsYXNzLlxuICAgICAqL1xuICAgIEV2ZW50RW1pdHRlci5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gbm9Db25mbGljdCgpIHtcbiAgICAgICAgZXhwb3J0cy5FdmVudEVtaXR0ZXIgPSBvcmlnaW5hbEdsb2JhbFZhbHVlO1xuICAgICAgICByZXR1cm4gRXZlbnRFbWl0dGVyO1xuICAgIH07XG5cbiAgICAvLyBFeHBvc2UgdGhlIGNsYXNzIGVpdGhlciB2aWEgQU1ELCBDb21tb25KUyBvciB0aGUgZ2xvYmFsIG9iamVjdFxuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBFdmVudEVtaXR0ZXI7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cyl7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZXhwb3J0cy5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG4gICAgfVxufS5jYWxsKHRoaXMpKTtcbiIsIiggZnVuY3Rpb24oIHdpbmRvdywgZmFjdG9yeSApIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICBpZiAoIHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSggW1xuICAgICAgJy4vZmxpY2tpdHknLFxuICAgICAgJ2Zpenp5LXVpLXV0aWxzL3V0aWxzJ1xuICAgIF0sIGZ1bmN0aW9uKCBGbGlja2l0eSwgdXRpbHMgKSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSggd2luZG93LCBGbGlja2l0eSwgdXRpbHMgKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIGV4cG9ydHMgPT0gJ29iamVjdCcgKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICByZXF1aXJlKCcuL2ZsaWNraXR5JyksXG4gICAgICByZXF1aXJlKCdmaXp6eS11aS11dGlscycpXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5GbGlja2l0eSA9IHdpbmRvdy5GbGlja2l0eSB8fCB7fTtcbiAgICB3aW5kb3cuRmxpY2tpdHkgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LFxuICAgICAgd2luZG93LkZsaWNraXR5LFxuICAgICAgd2luZG93LmZpenp5VUlVdGlsc1xuICAgICk7XG4gIH1cblxufSggd2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KCB3aW5kb3csIEZsaWNraXR5LCB1dGlscyApIHtcblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBhcHBlbmQgY2VsbHMgdG8gYSBkb2N1bWVudCBmcmFnbWVudFxuZnVuY3Rpb24gZ2V0Q2VsbHNGcmFnbWVudCggY2VsbHMgKSB7XG4gIHZhciBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgZm9yICggdmFyIGk9MCwgbGVuID0gY2VsbHMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgdmFyIGNlbGwgPSBjZWxsc1tpXTtcbiAgICBmcmFnbWVudC5hcHBlbmRDaGlsZCggY2VsbC5lbGVtZW50ICk7XG4gIH1cbiAgcmV0dXJuIGZyYWdtZW50O1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBhZGQvcmVtb3ZlIGNlbGwgcHJvdG90eXBlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbi8qKlxuICogSW5zZXJ0LCBwcmVwZW5kLCBvciBhcHBlbmQgY2VsbHNcbiAqIEBwYXJhbSB7RWxlbWVudCwgQXJyYXksIE5vZGVMaXN0fSBlbGVtc1xuICogQHBhcmFtIHtJbnRlZ2VyfSBpbmRleFxuICovXG5GbGlja2l0eS5wcm90b3R5cGUuaW5zZXJ0ID0gZnVuY3Rpb24oIGVsZW1zLCBpbmRleCApIHtcbiAgdmFyIGNlbGxzID0gdGhpcy5fbWFrZUNlbGxzKCBlbGVtcyApO1xuICBpZiAoICFjZWxscyB8fCAhY2VsbHMubGVuZ3RoICkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbGVuID0gdGhpcy5jZWxscy5sZW5ndGg7XG4gIC8vIGRlZmF1bHQgdG8gYXBwZW5kXG4gIGluZGV4ID0gaW5kZXggPT09IHVuZGVmaW5lZCA/IGxlbiA6IGluZGV4O1xuICAvLyBhZGQgY2VsbHMgd2l0aCBkb2N1bWVudCBmcmFnbWVudFxuICB2YXIgZnJhZ21lbnQgPSBnZXRDZWxsc0ZyYWdtZW50KCBjZWxscyApO1xuICAvLyBhcHBlbmQgdG8gc2xpZGVyXG4gIHZhciBpc0FwcGVuZCA9IGluZGV4ID09IGxlbjtcbiAgaWYgKCBpc0FwcGVuZCApIHtcbiAgICB0aGlzLnNsaWRlci5hcHBlbmRDaGlsZCggZnJhZ21lbnQgKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgaW5zZXJ0Q2VsbEVsZW1lbnQgPSB0aGlzLmNlbGxzWyBpbmRleCBdLmVsZW1lbnQ7XG4gICAgdGhpcy5zbGlkZXIuaW5zZXJ0QmVmb3JlKCBmcmFnbWVudCwgaW5zZXJ0Q2VsbEVsZW1lbnQgKTtcbiAgfVxuICAvLyBhZGQgdG8gdGhpcy5jZWxsc1xuICBpZiAoIGluZGV4ID09PSAwICkge1xuICAgIC8vIHByZXBlbmQsIGFkZCB0byBzdGFydFxuICAgIHRoaXMuY2VsbHMgPSBjZWxscy5jb25jYXQoIHRoaXMuY2VsbHMgKTtcbiAgfSBlbHNlIGlmICggaXNBcHBlbmQgKSB7XG4gICAgLy8gYXBwZW5kLCBhZGQgdG8gZW5kXG4gICAgdGhpcy5jZWxscyA9IHRoaXMuY2VsbHMuY29uY2F0KCBjZWxscyApO1xuICB9IGVsc2Uge1xuICAgIC8vIGluc2VydCBpbiB0aGlzLmNlbGxzXG4gICAgdmFyIGVuZENlbGxzID0gdGhpcy5jZWxscy5zcGxpY2UoIGluZGV4LCBsZW4gLSBpbmRleCApO1xuICAgIHRoaXMuY2VsbHMgPSB0aGlzLmNlbGxzLmNvbmNhdCggY2VsbHMgKS5jb25jYXQoIGVuZENlbGxzICk7XG4gIH1cblxuICB0aGlzLl9zaXplQ2VsbHMoIGNlbGxzICk7XG5cbiAgdmFyIHNlbGVjdGVkSW5kZXhEZWx0YSA9IGluZGV4ID4gdGhpcy5zZWxlY3RlZEluZGV4ID8gMCA6IGNlbGxzLmxlbmd0aDtcbiAgdGhpcy5fY2VsbEFkZGVkUmVtb3ZlZCggaW5kZXgsIHNlbGVjdGVkSW5kZXhEZWx0YSApO1xufTtcblxuRmxpY2tpdHkucHJvdG90eXBlLmFwcGVuZCA9IGZ1bmN0aW9uKCBlbGVtcyApIHtcbiAgdGhpcy5pbnNlcnQoIGVsZW1zLCB0aGlzLmNlbGxzLmxlbmd0aCApO1xufTtcblxuRmxpY2tpdHkucHJvdG90eXBlLnByZXBlbmQgPSBmdW5jdGlvbiggZWxlbXMgKSB7XG4gIHRoaXMuaW5zZXJ0KCBlbGVtcywgMCApO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgY2VsbHNcbiAqIEBwYXJhbSB7RWxlbWVudCwgQXJyYXksIE5vZGVMaXN0fSBlbGVtc1xuICovXG5GbGlja2l0eS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oIGVsZW1zICkge1xuICB2YXIgY2VsbHMgPSB0aGlzLmdldENlbGxzKCBlbGVtcyApO1xuICB2YXIgc2VsZWN0ZWRJbmRleERlbHRhID0gMDtcbiAgdmFyIGksIGxlbiwgY2VsbDtcbiAgLy8gY2FsY3VsYXRlIHNlbGVjdGVkSW5kZXhEZWx0YSwgZWFzaWVyIGlmIGRvbmUgaW4gc2VwZXJhdGUgbG9vcFxuICBmb3IgKCBpPTAsIGxlbiA9IGNlbGxzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgIGNlbGwgPSBjZWxsc1tpXTtcbiAgICB2YXIgd2FzQmVmb3JlID0gdXRpbHMuaW5kZXhPZiggdGhpcy5jZWxscywgY2VsbCApIDwgdGhpcy5zZWxlY3RlZEluZGV4O1xuICAgIHNlbGVjdGVkSW5kZXhEZWx0YSAtPSB3YXNCZWZvcmUgPyAxIDogMDtcbiAgfVxuXG4gIGZvciAoIGk9MCwgbGVuID0gY2VsbHMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgY2VsbCA9IGNlbGxzW2ldO1xuICAgIGNlbGwucmVtb3ZlKCk7XG4gICAgLy8gcmVtb3ZlIGl0ZW0gZnJvbSBjb2xsZWN0aW9uXG4gICAgdXRpbHMucmVtb3ZlRnJvbSggdGhpcy5jZWxscywgY2VsbCApO1xuICB9XG5cbiAgaWYgKCBjZWxscy5sZW5ndGggKSB7XG4gICAgLy8gdXBkYXRlIHN0dWZmXG4gICAgdGhpcy5fY2VsbEFkZGVkUmVtb3ZlZCggMCwgc2VsZWN0ZWRJbmRleERlbHRhICk7XG4gIH1cbn07XG5cbi8vIHVwZGF0ZXMgd2hlbiBjZWxscyBhcmUgYWRkZWQgb3IgcmVtb3ZlZFxuRmxpY2tpdHkucHJvdG90eXBlLl9jZWxsQWRkZWRSZW1vdmVkID0gZnVuY3Rpb24oIGNoYW5nZWRDZWxsSW5kZXgsIHNlbGVjdGVkSW5kZXhEZWx0YSApIHtcbiAgc2VsZWN0ZWRJbmRleERlbHRhID0gc2VsZWN0ZWRJbmRleERlbHRhIHx8IDA7XG4gIHRoaXMuc2VsZWN0ZWRJbmRleCArPSBzZWxlY3RlZEluZGV4RGVsdGE7XG4gIHRoaXMuc2VsZWN0ZWRJbmRleCA9IE1hdGgubWF4KCAwLCBNYXRoLm1pbiggdGhpcy5jZWxscy5sZW5ndGggLSAxLCB0aGlzLnNlbGVjdGVkSW5kZXggKSApO1xuXG4gIHRoaXMuZW1pdEV2ZW50KCAnY2VsbEFkZGVkUmVtb3ZlZCcsIFsgY2hhbmdlZENlbGxJbmRleCwgc2VsZWN0ZWRJbmRleERlbHRhIF0gKTtcbiAgdGhpcy5jZWxsQ2hhbmdlKCBjaGFuZ2VkQ2VsbEluZGV4ICk7XG59O1xuXG4vKipcbiAqIGxvZ2ljIHRvIGJlIHJ1biBhZnRlciBhIGNlbGwncyBzaXplIGNoYW5nZXNcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbSAtIGNlbGwncyBlbGVtZW50XG4gKi9cbkZsaWNraXR5LnByb3RvdHlwZS5jZWxsU2l6ZUNoYW5nZSA9IGZ1bmN0aW9uKCBlbGVtICkge1xuICB2YXIgY2VsbCA9IHRoaXMuZ2V0Q2VsbCggZWxlbSApO1xuICBpZiAoICFjZWxsICkge1xuICAgIHJldHVybjtcbiAgfVxuICBjZWxsLmdldFNpemUoKTtcblxuICB2YXIgaW5kZXggPSB1dGlscy5pbmRleE9mKCB0aGlzLmNlbGxzLCBjZWxsICk7XG4gIHRoaXMuY2VsbENoYW5nZSggaW5kZXggKTtcbn07XG5cbi8qKlxuICogbG9naWMgYW55IHRpbWUgYSBjZWxsIGlzIGNoYW5nZWQ6IGFkZGVkLCByZW1vdmVkLCBvciBzaXplIGNoYW5nZWRcbiAqIEBwYXJhbSB7SW50ZWdlcn0gY2hhbmdlZENlbGxJbmRleCAtIGluZGV4IG9mIHRoZSBjaGFuZ2VkIGNlbGwsIG9wdGlvbmFsXG4gKi9cbkZsaWNraXR5LnByb3RvdHlwZS5jZWxsQ2hhbmdlID0gZnVuY3Rpb24oIGNoYW5nZWRDZWxsSW5kZXggKSB7XG4gIC8vIFRPRE8gbWF5YmUgYWx3YXlzIHNpemUgYWxsIGNlbGxzIHVubGVzcyBpc1NraXBwaW5nU2l6aW5nXG4gIC8vIHNpemUgYWxsIGNlbGxzIGlmIG5lY2Vzc2FyeVxuICAvLyBpZiAoICFpc1NraXBwaW5nU2l6aW5nICkge1xuICAvLyAgIHRoaXMuX3NpemVDZWxscyggdGhpcy5jZWxscyApO1xuICAvLyB9XG5cbiAgY2hhbmdlZENlbGxJbmRleCA9IGNoYW5nZWRDZWxsSW5kZXggfHwgMDtcblxuICB0aGlzLl9wb3NpdGlvbkNlbGxzKCBjaGFuZ2VkQ2VsbEluZGV4ICk7XG4gIHRoaXMuX2dldFdyYXBTaGlmdENlbGxzKCk7XG4gIHRoaXMuc2V0R2FsbGVyeVNpemUoKTtcbiAgLy8gcG9zaXRpb24gc2xpZGVyXG4gIGlmICggdGhpcy5vcHRpb25zLmZyZWVTY3JvbGwgKSB7XG4gICAgdGhpcy5wb3NpdGlvblNsaWRlcigpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMucG9zaXRpb25TbGlkZXJBdFNlbGVjdGVkKCk7XG4gICAgdGhpcy5zZWxlY3QoIHRoaXMuc2VsZWN0ZWRJbmRleCApO1xuICB9XG59O1xuXG4vLyAtLS0tLSAgLS0tLS0gLy9cblxucmV0dXJuIEZsaWNraXR5O1xuXG59KSk7XG4iLCIoIGZ1bmN0aW9uKCB3aW5kb3csIGZhY3RvcnkgKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG5cbiAgaWYgKCB0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoIFtcbiAgICAgICdnZXQtc3R5bGUtcHJvcGVydHkvZ2V0LXN0eWxlLXByb3BlcnR5JyxcbiAgICAgICdmaXp6eS11aS11dGlscy91dGlscydcbiAgICBdLCBmdW5jdGlvbiggZ2V0U3R5bGVQcm9wZXJ0eSwgdXRpbHMgKSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSggd2luZG93LCBnZXRTdHlsZVByb3BlcnR5LCB1dGlscyApO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCB0eXBlb2YgZXhwb3J0cyA9PSAnb2JqZWN0JyApIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHJlcXVpcmUoJ2Rlc2FuZHJvLWdldC1zdHlsZS1wcm9wZXJ0eScpLFxuICAgICAgcmVxdWlyZSgnZml6enktdWktdXRpbHMnKVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cuRmxpY2tpdHkgPSB3aW5kb3cuRmxpY2tpdHkgfHwge307XG4gICAgd2luZG93LkZsaWNraXR5LmFuaW1hdGVQcm90b3R5cGUgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LFxuICAgICAgd2luZG93LmdldFN0eWxlUHJvcGVydHksXG4gICAgICB3aW5kb3cuZml6enlVSVV0aWxzXG4gICAgKTtcbiAgfVxuXG59KCB3aW5kb3csIGZ1bmN0aW9uIGZhY3RvcnkoIHdpbmRvdywgZ2V0U3R5bGVQcm9wZXJ0eSwgdXRpbHMgKSB7XG5cbid1c2Ugc3RyaWN0JztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbi8vIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tLzE4NjY0NzRcblxudmFyIGxhc3RUaW1lID0gMDtcbnZhciBwcmVmaXhlcyA9ICd3ZWJraXQgbW96IG1zIG8nLnNwbGl0KCcgJyk7XG4vLyBnZXQgdW5wcmVmaXhlZCByQUYgYW5kIGNBRiwgaWYgcHJlc2VudFxudmFyIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG52YXIgY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWU7XG4vLyBsb29wIHRocm91Z2ggdmVuZG9yIHByZWZpeGVzIGFuZCBnZXQgcHJlZml4ZWQgckFGIGFuZCBjQUZcbnZhciBwcmVmaXg7XG5mb3IoIHZhciBpID0gMDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrICkge1xuICBpZiAoIHJlcXVlc3RBbmltYXRpb25GcmFtZSAmJiBjYW5jZWxBbmltYXRpb25GcmFtZSApIHtcbiAgICBicmVhaztcbiAgfVxuICBwcmVmaXggPSBwcmVmaXhlc1tpXTtcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvd1sgcHJlZml4ICsgJ1JlcXVlc3RBbmltYXRpb25GcmFtZScgXTtcbiAgY2FuY2VsQW5pbWF0aW9uRnJhbWUgID0gY2FuY2VsQW5pbWF0aW9uRnJhbWUgIHx8IHdpbmRvd1sgcHJlZml4ICsgJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJyBdIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93WyBwcmVmaXggKyAnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJyBdO1xufVxuXG4vLyBmYWxsYmFjayB0byBzZXRUaW1lb3V0IGFuZCBjbGVhclRpbWVvdXQgaWYgZWl0aGVyIHJlcXVlc3QvY2FuY2VsIGlzIG5vdCBzdXBwb3J0ZWRcbmlmICggIXJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCAhY2FuY2VsQW5pbWF0aW9uRnJhbWUgKSAge1xuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbiggY2FsbGJhY2sgKSB7XG4gICAgdmFyIGN1cnJUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgdmFyIHRpbWVUb0NhbGwgPSBNYXRoLm1heCggMCwgMTYgLSAoIGN1cnJUaW1lIC0gbGFzdFRpbWUgKSApO1xuICAgIHZhciBpZCA9IHdpbmRvdy5zZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcbiAgICAgIGNhbGxiYWNrKCBjdXJyVGltZSArIHRpbWVUb0NhbGwgKTtcbiAgICB9LCB0aW1lVG9DYWxsICk7XG4gICAgbGFzdFRpbWUgPSBjdXJyVGltZSArIHRpbWVUb0NhbGw7XG4gICAgcmV0dXJuIGlkO1xuICB9O1xuXG4gIGNhbmNlbEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oIGlkICkge1xuICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoIGlkICk7XG4gIH07XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGFuaW1hdGUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxudmFyIHByb3RvID0ge307XG5cbnByb3RvLnN0YXJ0QW5pbWF0aW9uID0gZnVuY3Rpb24oKSB7XG4gIGlmICggdGhpcy5pc0FuaW1hdGluZyApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLmlzQW5pbWF0aW5nID0gdHJ1ZTtcbiAgdGhpcy5yZXN0aW5nRnJhbWVzID0gMDtcbiAgdGhpcy5hbmltYXRlKCk7XG59O1xuXG5wcm90by5hbmltYXRlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuYXBwbHlTZWxlY3RlZEF0dHJhY3Rpb24oKTtcblxuICB2YXIgcHJldmlvdXNYID0gdGhpcy54O1xuXG4gIHRoaXMuaW50ZWdyYXRlUGh5c2ljcygpO1xuICB0aGlzLnBvc2l0aW9uU2xpZGVyKCk7XG4gIHRoaXMuc2V0dGxlKCBwcmV2aW91c1ggKTtcbiAgLy8gYW5pbWF0ZSBuZXh0IGZyYW1lXG4gIGlmICggdGhpcy5pc0FuaW1hdGluZyApIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSggZnVuY3Rpb24gYW5pbWF0ZUZyYW1lKCkge1xuICAgICAgX3RoaXMuYW5pbWF0ZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIC9cbiAgLy8gbG9nIGFuaW1hdGlvbiBmcmFtZSByYXRlXG4gIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICBpZiAoIHRoaXMudGhlbiApIHtcbiAgICBjb25zb2xlLmxvZyggfn4oIDEwMDAgLyAobm93LXRoaXMudGhlbikpICsgJ2ZwcycgKVxuICB9XG4gIHRoaXMudGhlbiA9IG5vdztcbiAgLyoqL1xufTtcblxuXG52YXIgdHJhbnNmb3JtUHJvcGVydHkgPSBnZXRTdHlsZVByb3BlcnR5KCd0cmFuc2Zvcm0nKTtcbnZhciBpczNkID0gISFnZXRTdHlsZVByb3BlcnR5KCdwZXJzcGVjdGl2ZScpO1xuXG5wcm90by5wb3NpdGlvblNsaWRlciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgeCA9IHRoaXMueDtcbiAgLy8gd3JhcCBwb3NpdGlvbiBhcm91bmRcbiAgaWYgKCB0aGlzLm9wdGlvbnMud3JhcEFyb3VuZCAmJiB0aGlzLmNlbGxzLmxlbmd0aCA+IDEgKSB7XG4gICAgeCA9IHV0aWxzLm1vZHVsbyggeCwgdGhpcy5zbGlkZWFibGVXaWR0aCApO1xuICAgIHggPSB4IC0gdGhpcy5zbGlkZWFibGVXaWR0aDtcbiAgICB0aGlzLnNoaWZ0V3JhcENlbGxzKCB4ICk7XG4gIH1cblxuICB4ID0geCArIHRoaXMuY3Vyc29yUG9zaXRpb247XG5cbiAgLy8gcmV2ZXJzZSBpZiByaWdodC10by1sZWZ0IGFuZCB1c2luZyB0cmFuc2Zvcm1cbiAgeCA9IHRoaXMub3B0aW9ucy5yaWdodFRvTGVmdCAmJiB0cmFuc2Zvcm1Qcm9wZXJ0eSA/IC14IDogeDtcblxuICB2YXIgdmFsdWUgPSB0aGlzLmdldFBvc2l0aW9uVmFsdWUoIHggKTtcblxuICBpZiAoIHRyYW5zZm9ybVByb3BlcnR5ICkge1xuICAgIC8vIHVzZSAzRCB0cmFuZm9ybXMgZm9yIGhhcmR3YXJlIGFjY2VsZXJhdGlvbiBvbiBpT1NcbiAgICAvLyBidXQgdXNlIDJEIHdoZW4gc2V0dGxlZCwgZm9yIGJldHRlciBmb250LXJlbmRlcmluZ1xuICAgIHRoaXMuc2xpZGVyLnN0eWxlWyB0cmFuc2Zvcm1Qcm9wZXJ0eSBdID0gaXMzZCAmJiB0aGlzLmlzQW5pbWF0aW5nID9cbiAgICAgICd0cmFuc2xhdGUzZCgnICsgdmFsdWUgKyAnLDAsMCknIDogJ3RyYW5zbGF0ZVgoJyArIHZhbHVlICsgJyknO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuc2xpZGVyLnN0eWxlWyB0aGlzLm9yaWdpblNpZGUgXSA9IHZhbHVlO1xuICB9XG59O1xuXG5wcm90by5wb3NpdGlvblNsaWRlckF0U2VsZWN0ZWQgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCAhdGhpcy5jZWxscy5sZW5ndGggKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBzZWxlY3RlZENlbGwgPSB0aGlzLmNlbGxzWyB0aGlzLnNlbGVjdGVkSW5kZXggXTtcbiAgdGhpcy54ID0gLXNlbGVjdGVkQ2VsbC50YXJnZXQ7XG4gIHRoaXMucG9zaXRpb25TbGlkZXIoKTtcbn07XG5cbnByb3RvLmdldFBvc2l0aW9uVmFsdWUgPSBmdW5jdGlvbiggcG9zaXRpb24gKSB7XG4gIGlmICggdGhpcy5vcHRpb25zLnBlcmNlbnRQb3NpdGlvbiApIHtcbiAgICAvLyBwZXJjZW50IHBvc2l0aW9uLCByb3VuZCB0byAyIGRpZ2l0cywgbGlrZSAxMi4zNCVcbiAgICByZXR1cm4gKCBNYXRoLnJvdW5kKCAoIHBvc2l0aW9uIC8gdGhpcy5zaXplLmlubmVyV2lkdGggKSAqIDEwMDAwICkgKiAwLjAxICkrICclJztcbiAgfSBlbHNlIHtcbiAgICAvLyBwaXhlbCBwb3NpdGlvbmluZ1xuICAgIHJldHVybiBNYXRoLnJvdW5kKCBwb3NpdGlvbiApICsgJ3B4JztcbiAgfVxufTtcblxucHJvdG8uc2V0dGxlID0gZnVuY3Rpb24oIHByZXZpb3VzWCApIHtcbiAgLy8ga2VlcCB0cmFjayBvZiBmcmFtZXMgd2hlcmUgeCBoYXNuJ3QgbW92ZWRcbiAgaWYgKCAhdGhpcy5pc1BvaW50ZXJEb3duICYmIE1hdGgucm91bmQoIHRoaXMueCAqIDEwMCApID09IE1hdGgucm91bmQoIHByZXZpb3VzWCAqIDEwMCApICkge1xuICAgIHRoaXMucmVzdGluZ0ZyYW1lcysrO1xuICB9XG4gIC8vIHN0b3AgYW5pbWF0aW5nIGlmIHJlc3RpbmcgZm9yIDMgb3IgbW9yZSBmcmFtZXNcbiAgaWYgKCB0aGlzLnJlc3RpbmdGcmFtZXMgPiAyICkge1xuICAgIHRoaXMuaXNBbmltYXRpbmcgPSBmYWxzZTtcbiAgICBkZWxldGUgdGhpcy5pc0ZyZWVTY3JvbGxpbmc7XG4gICAgLy8gcmVuZGVyIHBvc2l0aW9uIHdpdGggdHJhbnNsYXRlWCB3aGVuIHNldHRsZWRcbiAgICBpZiAoIGlzM2QgKSB7XG4gICAgICB0aGlzLnBvc2l0aW9uU2xpZGVyKCk7XG4gICAgfVxuICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnc2V0dGxlJyk7XG4gIH1cbn07XG5cbnByb3RvLnNoaWZ0V3JhcENlbGxzID0gZnVuY3Rpb24oIHggKSB7XG4gIC8vIHNoaWZ0IGJlZm9yZSBjZWxsc1xuICB2YXIgYmVmb3JlR2FwID0gdGhpcy5jdXJzb3JQb3NpdGlvbiArIHg7XG4gIHRoaXMuX3NoaWZ0Q2VsbHMoIHRoaXMuYmVmb3JlU2hpZnRDZWxscywgYmVmb3JlR2FwLCAtMSApO1xuICAvLyBzaGlmdCBhZnRlciBjZWxsc1xuICB2YXIgYWZ0ZXJHYXAgPSB0aGlzLnNpemUuaW5uZXJXaWR0aCAtICggeCArIHRoaXMuc2xpZGVhYmxlV2lkdGggKyB0aGlzLmN1cnNvclBvc2l0aW9uICk7XG4gIHRoaXMuX3NoaWZ0Q2VsbHMoIHRoaXMuYWZ0ZXJTaGlmdENlbGxzLCBhZnRlckdhcCwgMSApO1xufTtcblxucHJvdG8uX3NoaWZ0Q2VsbHMgPSBmdW5jdGlvbiggY2VsbHMsIGdhcCwgc2hpZnQgKSB7XG4gIGZvciAoIHZhciBpPTAsIGxlbiA9IGNlbGxzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgIHZhciBjZWxsID0gY2VsbHNbaV07XG4gICAgdmFyIGNlbGxTaGlmdCA9IGdhcCA+IDAgPyBzaGlmdCA6IDA7XG4gICAgY2VsbC53cmFwU2hpZnQoIGNlbGxTaGlmdCApO1xuICAgIGdhcCAtPSBjZWxsLnNpemUub3V0ZXJXaWR0aDtcbiAgfVxufTtcblxucHJvdG8uX3Vuc2hpZnRDZWxscyA9IGZ1bmN0aW9uKCBjZWxscyApIHtcbiAgaWYgKCAhY2VsbHMgfHwgIWNlbGxzLmxlbmd0aCApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZm9yICggdmFyIGk9MCwgbGVuID0gY2VsbHMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgY2VsbHNbaV0ud3JhcFNoaWZ0KCAwICk7XG4gIH1cbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHBoeXNpY3MgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxucHJvdG8uaW50ZWdyYXRlUGh5c2ljcyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnZlbG9jaXR5ICs9IHRoaXMuYWNjZWw7XG4gIHRoaXMueCArPSB0aGlzLnZlbG9jaXR5O1xuICB0aGlzLnZlbG9jaXR5ICo9IHRoaXMuZ2V0RnJpY3Rpb25GYWN0b3IoKTtcbiAgLy8gcmVzZXQgYWNjZWxlcmF0aW9uXG4gIHRoaXMuYWNjZWwgPSAwO1xufTtcblxucHJvdG8uYXBwbHlGb3JjZSA9IGZ1bmN0aW9uKCBmb3JjZSApIHtcbiAgdGhpcy5hY2NlbCArPSBmb3JjZTtcbn07XG5cbnByb3RvLmdldEZyaWN0aW9uRmFjdG9yID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAxIC0gdGhpcy5vcHRpb25zWyB0aGlzLmlzRnJlZVNjcm9sbGluZyA/ICdmcmVlU2Nyb2xsRnJpY3Rpb24nIDogJ2ZyaWN0aW9uJyBdO1xufTtcblxuXG5wcm90by5nZXRSZXN0aW5nUG9zaXRpb24gPSBmdW5jdGlvbigpIHtcbiAgLy8gbXkgdGhhbmtzIHRvIFN0ZXZlbiBXaXR0ZW5zLCB3aG8gc2ltcGxpZmllZCB0aGlzIG1hdGggZ3JlYXRseVxuICByZXR1cm4gdGhpcy54ICsgdGhpcy52ZWxvY2l0eSAvICggMSAtIHRoaXMuZ2V0RnJpY3Rpb25GYWN0b3IoKSApO1xufTtcblxuXG5wcm90by5hcHBseVNlbGVjdGVkQXR0cmFjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAvLyBkbyBub3QgYXR0cmFjdCBpZiBwb2ludGVyIGRvd24gb3Igbm8gY2VsbHNcbiAgdmFyIGxlbiA9IHRoaXMuY2VsbHMubGVuZ3RoO1xuICBpZiAoIHRoaXMuaXNQb2ludGVyRG93biB8fCB0aGlzLmlzRnJlZVNjcm9sbGluZyB8fCAhbGVuICkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgY2VsbCA9IHRoaXMuY2VsbHNbIHRoaXMuc2VsZWN0ZWRJbmRleCBdO1xuICB2YXIgd3JhcCA9IHRoaXMub3B0aW9ucy53cmFwQXJvdW5kICYmIGxlbiA+IDEgP1xuICAgIHRoaXMuc2xpZGVhYmxlV2lkdGggKiBNYXRoLmZsb29yKCB0aGlzLnNlbGVjdGVkSW5kZXggLyBsZW4gKSA6IDA7XG4gIHZhciBkaXN0YW5jZSA9ICggY2VsbC50YXJnZXQgKyB3cmFwICkgKiAtMSAtIHRoaXMueDtcbiAgdmFyIGZvcmNlID0gZGlzdGFuY2UgKiB0aGlzLm9wdGlvbnMuc2VsZWN0ZWRBdHRyYWN0aW9uO1xuICB0aGlzLmFwcGx5Rm9yY2UoIGZvcmNlICk7XG59O1xuXG5yZXR1cm4gcHJvdG87XG5cbn0pKTtcbiIsIiggZnVuY3Rpb24oIHdpbmRvdywgZmFjdG9yeSApIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICBpZiAoIHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSggW1xuICAgICAgJ2dldC1zaXplL2dldC1zaXplJ1xuICAgIF0sIGZ1bmN0aW9uKCBnZXRTaXplICkge1xuICAgICAgcmV0dXJuIGZhY3RvcnkoIHdpbmRvdywgZ2V0U2l6ZSApO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCB0eXBlb2YgZXhwb3J0cyA9PSAnb2JqZWN0JyApIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHJlcXVpcmUoJ2dldC1zaXplJylcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93LkZsaWNraXR5ID0gd2luZG93LkZsaWNraXR5IHx8IHt9O1xuICAgIHdpbmRvdy5GbGlja2l0eS5DZWxsID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHdpbmRvdy5nZXRTaXplXG4gICAgKTtcbiAgfVxuXG59KCB3aW5kb3csIGZ1bmN0aW9uIGZhY3RvcnkoIHdpbmRvdywgZ2V0U2l6ZSApIHtcblxuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBDZWxsKCBlbGVtLCBwYXJlbnQgKSB7XG4gIHRoaXMuZWxlbWVudCA9IGVsZW07XG4gIHRoaXMucGFyZW50ID0gcGFyZW50O1xuXG4gIHRoaXMuY3JlYXRlKCk7XG59XG5cbnZhciBpc0lFOCA9ICdhdHRhY2hFdmVudCcgaW4gd2luZG93O1xuXG5DZWxsLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5lbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgLy8gSUU4IHByZXZlbnQgY2hpbGQgZnJvbSBjaGFuZ2luZyBmb2N1cyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xNzUyNTIyMy8xODIxODNcbiAgaWYgKCBpc0lFOCApIHtcbiAgICB0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKCAndW5zZWxlY3RhYmxlJywgJ29uJyApO1xuICB9XG4gIHRoaXMueCA9IDA7XG4gIHRoaXMuc2hpZnQgPSAwO1xufTtcblxuQ2VsbC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAvLyByZXNldCBzdHlsZVxuICB0aGlzLmVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnJztcbiAgdmFyIHNpZGUgPSB0aGlzLnBhcmVudC5vcmlnaW5TaWRlO1xuICB0aGlzLmVsZW1lbnQuc3R5bGVbIHNpZGUgXSA9ICcnO1xufTtcblxuQ2VsbC5wcm90b3R5cGUuZ2V0U2l6ZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnNpemUgPSBnZXRTaXplKCB0aGlzLmVsZW1lbnQgKTtcbn07XG5cbkNlbGwucHJvdG90eXBlLnNldFBvc2l0aW9uID0gZnVuY3Rpb24oIHggKSB7XG4gIHRoaXMueCA9IHg7XG4gIHRoaXMuc2V0RGVmYXVsdFRhcmdldCgpO1xuICB0aGlzLnJlbmRlclBvc2l0aW9uKCB4ICk7XG59O1xuXG5DZWxsLnByb3RvdHlwZS5zZXREZWZhdWx0VGFyZ2V0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBtYXJnaW5Qcm9wZXJ0eSA9IHRoaXMucGFyZW50Lm9yaWdpblNpZGUgPT0gJ2xlZnQnID8gJ21hcmdpbkxlZnQnIDogJ21hcmdpblJpZ2h0JztcbiAgdGhpcy50YXJnZXQgPSB0aGlzLnggKyB0aGlzLnNpemVbIG1hcmdpblByb3BlcnR5IF0gK1xuICAgIHRoaXMuc2l6ZS53aWR0aCAqIHRoaXMucGFyZW50LmNlbGxBbGlnbjtcbn07XG5cbkNlbGwucHJvdG90eXBlLnJlbmRlclBvc2l0aW9uID0gZnVuY3Rpb24oIHggKSB7XG4gIC8vIHJlbmRlciBwb3NpdGlvbiBvZiBjZWxsIHdpdGggaW4gc2xpZGVyXG4gIHZhciBzaWRlID0gdGhpcy5wYXJlbnQub3JpZ2luU2lkZTtcbiAgdGhpcy5lbGVtZW50LnN0eWxlWyBzaWRlIF0gPSB0aGlzLnBhcmVudC5nZXRQb3NpdGlvblZhbHVlKCB4ICk7XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7SW50ZWdlcn0gZmFjdG9yIC0gMCwgMSwgb3IgLTFcbioqL1xuQ2VsbC5wcm90b3R5cGUud3JhcFNoaWZ0ID0gZnVuY3Rpb24oIHNoaWZ0ICkge1xuICB0aGlzLnNoaWZ0ID0gc2hpZnQ7XG4gIHRoaXMucmVuZGVyUG9zaXRpb24oIHRoaXMueCArIHRoaXMucGFyZW50LnNsaWRlYWJsZVdpZHRoICogc2hpZnQgKTtcbn07XG5cbkNlbGwucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCggdGhpcy5lbGVtZW50ICk7XG59O1xuXG5yZXR1cm4gQ2VsbDtcblxufSkpO1xuIiwiKCBmdW5jdGlvbiggd2luZG93LCBmYWN0b3J5ICkge1xuICAndXNlIHN0cmljdCc7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIGlmICggdHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCBbXG4gICAgICAnY2xhc3NpZS9jbGFzc2llJyxcbiAgICAgICdldmVudGllL2V2ZW50aWUnLFxuICAgICAgJy4vZmxpY2tpdHknLFxuICAgICAgJ3VuaWRyYWdnZXIvdW5pZHJhZ2dlcicsXG4gICAgICAnZml6enktdWktdXRpbHMvdXRpbHMnXG4gICAgXSwgZnVuY3Rpb24oIGNsYXNzaWUsIGV2ZW50aWUsIEZsaWNraXR5LCBVbmlkcmFnZ2VyLCB1dGlscyApIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KCB3aW5kb3csIGNsYXNzaWUsIGV2ZW50aWUsIEZsaWNraXR5LCBVbmlkcmFnZ2VyLCB1dGlscyApO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCB0eXBlb2YgZXhwb3J0cyA9PSAnb2JqZWN0JyApIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHJlcXVpcmUoJ2Rlc2FuZHJvLWNsYXNzaWUnKSxcbiAgICAgIHJlcXVpcmUoJ2V2ZW50aWUnKSxcbiAgICAgIHJlcXVpcmUoJy4vZmxpY2tpdHknKSxcbiAgICAgIHJlcXVpcmUoJ3VuaWRyYWdnZXInKSxcbiAgICAgIHJlcXVpcmUoJ2Zpenp5LXVpLXV0aWxzJylcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93LkZsaWNraXR5ID0gd2luZG93LkZsaWNraXR5IHx8IHt9O1xuICAgIHdpbmRvdy5GbGlja2l0eS5kcmFnUHJvdG90eXBlID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHdpbmRvdy5jbGFzc2llLFxuICAgICAgd2luZG93LmV2ZW50aWUsXG4gICAgICB3aW5kb3cuRmxpY2tpdHksXG4gICAgICB3aW5kb3cuVW5pZHJhZ2dlcixcbiAgICAgIHdpbmRvdy5maXp6eVVJVXRpbHNcbiAgICApO1xuICB9XG5cbn0oIHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSggd2luZG93LCBjbGFzc2llLCBldmVudGllLCBGbGlja2l0eSwgVW5pZHJhZ2dlciwgdXRpbHMgKSB7XG5cbid1c2Ugc3RyaWN0JztcblxuLy8gaGFuZGxlIElFOCBwcmV2ZW50IGRlZmF1bHRcbmZ1bmN0aW9uIHByZXZlbnREZWZhdWx0RXZlbnQoIGV2ZW50ICkge1xuICBpZiAoIGV2ZW50LnByZXZlbnREZWZhdWx0ICkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gIH0gZWxzZSB7XG4gICAgZXZlbnQucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgfVxufVxuXG4vLyAtLS0tLSBkZWZhdWx0cyAtLS0tLSAvL1xuXG51dGlscy5leHRlbmQoIEZsaWNraXR5LmRlZmF1bHRzLCB7XG4gIGRyYWdnYWJsZTogdHJ1ZSxcbiAgdG91Y2hWZXJ0aWNhbFNjcm9sbDogdHJ1ZVxufSk7XG5cbi8vIC0tLS0tIGNyZWF0ZSAtLS0tLSAvL1xuXG5GbGlja2l0eS5jcmVhdGVNZXRob2RzLnB1c2goJ19jcmVhdGVEcmFnJyk7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRyYWcgcHJvdG90eXBlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbnZhciBwcm90byA9IHt9O1xudXRpbHMuZXh0ZW5kKCBwcm90bywgVW5pZHJhZ2dlci5wcm90b3R5cGUgKTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbnByb3RvLl9jcmVhdGVEcmFnID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMub24oICdhY3RpdmF0ZScsIHRoaXMuYmluZERyYWcgKTtcbiAgdGhpcy5vbiggJ3VpQ2hhbmdlJywgdGhpcy5fdWlDaGFuZ2VEcmFnICk7XG4gIHRoaXMub24oICdjaGlsZFVJUG9pbnRlckRvd24nLCB0aGlzLl9jaGlsZFVJUG9pbnRlckRvd25EcmFnICk7XG4gIHRoaXMub24oICdkZWFjdGl2YXRlJywgdGhpcy51bmJpbmREcmFnICk7XG59O1xuXG5wcm90by5iaW5kRHJhZyA9IGZ1bmN0aW9uKCkge1xuICBpZiAoICF0aGlzLm9wdGlvbnMuZHJhZ2dhYmxlIHx8IHRoaXMuaXNEcmFnQm91bmQgKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNsYXNzaWUuYWRkKCB0aGlzLmVsZW1lbnQsICdpcy1kcmFnZ2FibGUnICk7XG4gIHRoaXMuaGFuZGxlcyA9IFsgdGhpcy52aWV3cG9ydCBdO1xuICB0aGlzLmJpbmRIYW5kbGVzKCk7XG4gIHRoaXMuaXNEcmFnQm91bmQgPSB0cnVlO1xufTtcblxucHJvdG8udW5iaW5kRHJhZyA9IGZ1bmN0aW9uKCkge1xuICBpZiAoICF0aGlzLmlzRHJhZ0JvdW5kICkge1xuICAgIHJldHVybjtcbiAgfVxuICBjbGFzc2llLnJlbW92ZSggdGhpcy5lbGVtZW50LCAnaXMtZHJhZ2dhYmxlJyApO1xuICB0aGlzLnVuYmluZEhhbmRsZXMoKTtcbiAgZGVsZXRlIHRoaXMuaXNEcmFnQm91bmQ7XG59O1xuXG5wcm90by5fdWlDaGFuZ2VEcmFnID0gZnVuY3Rpb24oKSB7XG4gIGRlbGV0ZSB0aGlzLmlzRnJlZVNjcm9sbGluZztcbn07XG5cbnByb3RvLl9jaGlsZFVJUG9pbnRlckRvd25EcmFnID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICBwcmV2ZW50RGVmYXVsdEV2ZW50KCBldmVudCApO1xuICB0aGlzLnBvaW50ZXJEb3duRm9jdXMoIGV2ZW50ICk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBwb2ludGVyIGV2ZW50cyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5wcm90by5wb2ludGVyRG93biA9IGZ1bmN0aW9uKCBldmVudCwgcG9pbnRlciApIHtcbiAgdGhpcy5fZHJhZ1BvaW50ZXJEb3duKCBldmVudCwgcG9pbnRlciApO1xuXG4gIC8vIGtsdWRnZSB0byBibHVyIGZvY3VzZWQgaW5wdXRzIGluIGRyYWdnZXJcbiAgdmFyIGZvY3VzZWQgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICBpZiAoIGZvY3VzZWQgJiYgZm9jdXNlZC5ibHVyICYmIGZvY3VzZWQgIT0gdGhpcy5lbGVtZW50ICYmXG4gICAgLy8gZG8gbm90IGJsdXIgYm9keSBmb3IgSUU5ICYgMTAsICMxMTdcbiAgICBmb2N1c2VkICE9IGRvY3VtZW50LmJvZHkgKSB7XG4gICAgZm9jdXNlZC5ibHVyKCk7XG4gIH1cbiAgdGhpcy5wb2ludGVyRG93bkZvY3VzKCBldmVudCApO1xuICAvLyBzdG9wIGlmIGl0IHdhcyBtb3ZpbmdcbiAgdGhpcy52ZWxvY2l0eSA9IDA7XG4gIGNsYXNzaWUuYWRkKCB0aGlzLnZpZXdwb3J0LCAnaXMtcG9pbnRlci1kb3duJyApO1xuICAvLyBiaW5kIG1vdmUgYW5kIGVuZCBldmVudHNcbiAgdGhpcy5fYmluZFBvc3RTdGFydEV2ZW50cyggZXZlbnQgKTtcbiAgdGhpcy5kaXNwYXRjaEV2ZW50KCAncG9pbnRlckRvd24nLCBldmVudCwgWyBwb2ludGVyIF0gKTtcbn07XG5cbnZhciB0b3VjaFN0YXJ0RXZlbnRzID0ge1xuICB0b3VjaHN0YXJ0OiB0cnVlLFxuICBNU1BvaW50ZXJEb3duOiB0cnVlXG59O1xuXG52YXIgZm9jdXNOb2RlcyA9IHtcbiAgSU5QVVQ6IHRydWUsXG4gIFNFTEVDVDogdHJ1ZVxufTtcblxucHJvdG8ucG9pbnRlckRvd25Gb2N1cyA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgLy8gZm9jdXMgZWxlbWVudCwgaWYgbm90IHRvdWNoLCBhbmQgaXRzIG5vdCBhbiBpbnB1dCBvciBzZWxlY3RcbiAgaWYgKCB0aGlzLm9wdGlvbnMuYWNjZXNzaWJpbGl0eSAmJiAhdG91Y2hTdGFydEV2ZW50c1sgZXZlbnQudHlwZSBdICYmXG4gICAgICAhZm9jdXNOb2Rlc1sgZXZlbnQudGFyZ2V0Lm5vZGVOYW1lIF0gKSB7XG4gICAgdGhpcy5lbGVtZW50LmZvY3VzKCk7XG4gIH1cbn07XG5cbi8vIC0tLS0tIG1vdmUgLS0tLS0gLy9cblxucHJvdG8ucG9pbnRlck1vdmUgPSBmdW5jdGlvbiggZXZlbnQsIHBvaW50ZXIgKSB7XG4gIHZhciBtb3ZlVmVjdG9yID0gdGhpcy5fZHJhZ1BvaW50ZXJNb3ZlKCBldmVudCwgcG9pbnRlciApO1xuICB0aGlzLnRvdWNoVmVydGljYWxTY3JvbGxNb3ZlKCBldmVudCwgcG9pbnRlciwgbW92ZVZlY3RvciApO1xuICB0aGlzLl9kcmFnTW92ZSggZXZlbnQsIHBvaW50ZXIsIG1vdmVWZWN0b3IgKTtcbiAgdGhpcy5kaXNwYXRjaEV2ZW50KCAncG9pbnRlck1vdmUnLCBldmVudCwgWyBwb2ludGVyLCBtb3ZlVmVjdG9yIF0gKTtcbn07XG5cbnByb3RvLmhhc0RyYWdTdGFydGVkID0gZnVuY3Rpb24oIG1vdmVWZWN0b3IgKSB7XG4gIHJldHVybiAhdGhpcy5pc1RvdWNoU2Nyb2xsaW5nICYmIE1hdGguYWJzKCBtb3ZlVmVjdG9yLnggKSA+IDM7XG59O1xuXG4vLyAtLS0tLSB1cCAtLS0tLSAvL1xuXG5wcm90by5wb2ludGVyVXAgPSBmdW5jdGlvbiggZXZlbnQsIHBvaW50ZXIgKSB7XG4gIGRlbGV0ZSB0aGlzLmlzVG91Y2hTY3JvbGxpbmc7XG4gIGNsYXNzaWUucmVtb3ZlKCB0aGlzLnZpZXdwb3J0LCAnaXMtcG9pbnRlci1kb3duJyApO1xuICB0aGlzLmRpc3BhdGNoRXZlbnQoICdwb2ludGVyVXAnLCBldmVudCwgWyBwb2ludGVyIF0gKTtcbiAgdGhpcy5fZHJhZ1BvaW50ZXJVcCggZXZlbnQsIHBvaW50ZXIgKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHZlcnRpY2FsIHNjcm9sbCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG52YXIgdG91Y2hTY3JvbGxFdmVudHMgPSB7XG4gIC8vIG1vdmUgZXZlbnRzXG4gIC8vIG1vdXNlbW92ZTogdHJ1ZSxcbiAgdG91Y2htb3ZlOiB0cnVlLFxuICBNU1BvaW50ZXJNb3ZlOiB0cnVlXG59O1xuXG4vLyBwb3NpdGlvbiBvZiBwb2ludGVyLCByZWxhdGl2ZSB0byB3aW5kb3dcbmZ1bmN0aW9uIGdldFBvaW50ZXJXaW5kb3dZKCBwb2ludGVyICkge1xuICB2YXIgcG9pbnRlclBvaW50ID0gVW5pZHJhZ2dlci5nZXRQb2ludGVyUG9pbnQoIHBvaW50ZXIgKTtcbiAgcmV0dXJuIHBvaW50ZXJQb2ludC55IC0gd2luZG93LnBhZ2VZT2Zmc2V0O1xufVxuXG5wcm90by50b3VjaFZlcnRpY2FsU2Nyb2xsTW92ZSA9IGZ1bmN0aW9uKCBldmVudCwgcG9pbnRlciwgbW92ZVZlY3RvciApIHtcbiAgLy8gZG8gbm90IHNjcm9sbCBpZiBhbHJlYWR5IGRyYWdnaW5nLCBpZiBkaXNhYmxlZFxuICB2YXIgdG91Y2hWZXJ0aWNhbFNjcm9sbCA9IHRoaXMub3B0aW9ucy50b3VjaFZlcnRpY2FsU2Nyb2xsO1xuICAvLyBpZiB0b3VjaFZlcnRpY2FsU2Nyb2xsIGlzICd3aXRoRHJhZycsIGFsbG93IHNjcm9sbGluZyBhbmQgZHJhZ2dpbmdcbiAgdmFyIGNhbk5vdFNjcm9sbCA9IHRvdWNoVmVydGljYWxTY3JvbGwgPT0gJ3dpdGhEcmFnJyA/ICF0b3VjaFZlcnRpY2FsU2Nyb2xsIDpcbiAgICB0aGlzLmlzRHJhZ2dpbmcgfHwgIXRvdWNoVmVydGljYWxTY3JvbGw7XG4gIGlmICggY2FuTm90U2Nyb2xsIHx8ICF0b3VjaFNjcm9sbEV2ZW50c1sgZXZlbnQudHlwZSBdICkge1xuICAgIHJldHVybjtcbiAgfVxuICAvLyBkb24ndCBzdGFydCB2ZXJ0aWNhbCBzY3JvbGxpbmcgdW50aWwgcG9pbnRlciBoYXMgbW92ZWQgMTAgcGl4ZWxzIGluIGEgZGlyZWN0aW9uXG4gIGlmICggIXRoaXMuaXNUb3VjaFNjcm9sbGluZyAmJiBNYXRoLmFicyggbW92ZVZlY3Rvci55ICkgPiAxMCApIHtcbiAgICAvLyBzdGFydCB0b3VjaCB2ZXJ0aWNhbCBzY3JvbGxpbmdcbiAgICAvLyBzY3JvbGwgJiBwb2ludGVyWSB3aGVuIHN0YXJ0ZWRcbiAgICB0aGlzLnN0YXJ0U2Nyb2xsWSA9IHdpbmRvdy5wYWdlWU9mZnNldDtcbiAgICB0aGlzLnBvaW50ZXJXaW5kb3dTdGFydFkgPSBnZXRQb2ludGVyV2luZG93WSggcG9pbnRlciApO1xuICAgIC8vIHN0YXJ0IHNjcm9sbCBhbmltYXRpb25cbiAgICB0aGlzLmlzVG91Y2hTY3JvbGxpbmcgPSB0cnVlO1xuICB9XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkcmFnZ2luZyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5wcm90by5kcmFnU3RhcnQgPSBmdW5jdGlvbiggZXZlbnQsIHBvaW50ZXIgKSB7XG4gIHRoaXMuZHJhZ1N0YXJ0UG9zaXRpb24gPSB0aGlzLng7XG4gIHRoaXMuc3RhcnRBbmltYXRpb24oKTtcbiAgdGhpcy5kaXNwYXRjaEV2ZW50KCAnZHJhZ1N0YXJ0JywgZXZlbnQsIFsgcG9pbnRlciBdICk7XG59O1xuXG5wcm90by5kcmFnTW92ZSA9IGZ1bmN0aW9uKCBldmVudCwgcG9pbnRlciwgbW92ZVZlY3RvciApIHtcbiAgcHJldmVudERlZmF1bHRFdmVudCggZXZlbnQgKTtcblxuICB0aGlzLnByZXZpb3VzRHJhZ1ggPSB0aGlzLng7XG5cbiAgdmFyIG1vdmVkWCA9IG1vdmVWZWN0b3IueDtcbiAgLy8gcmV2ZXJzZSBpZiByaWdodC10by1sZWZ0XG4gIHZhciBkaXJlY3Rpb24gPSB0aGlzLm9wdGlvbnMucmlnaHRUb0xlZnQgPyAtMSA6IDE7XG4gIHRoaXMueCA9IHRoaXMuZHJhZ1N0YXJ0UG9zaXRpb24gKyBtb3ZlZFggKiBkaXJlY3Rpb247XG5cbiAgaWYgKCAhdGhpcy5vcHRpb25zLndyYXBBcm91bmQgJiYgdGhpcy5jZWxscy5sZW5ndGggKSB7XG4gICAgLy8gc2xvdyBkcmFnXG4gICAgdmFyIG9yaWdpbkJvdW5kID0gTWF0aC5tYXgoIC10aGlzLmNlbGxzWzBdLnRhcmdldCwgdGhpcy5kcmFnU3RhcnRQb3NpdGlvbik7XG4gICAgdGhpcy54ID0gdGhpcy54ID4gb3JpZ2luQm91bmQgPyAoIHRoaXMueCAtIG9yaWdpbkJvdW5kICkgKiAwLjUgKyBvcmlnaW5Cb3VuZCA6IHRoaXMueDtcbiAgICB2YXIgZW5kQm91bmQgPSBNYXRoLm1pbiggLXRoaXMuZ2V0TGFzdENlbGwoKS50YXJnZXQsIHRoaXMuZHJhZ1N0YXJ0UG9zaXRpb24gKTtcbiAgICB0aGlzLnggPSB0aGlzLnggPCBlbmRCb3VuZCA/ICggdGhpcy54IC0gZW5kQm91bmQgKSAqIDAuNSArIGVuZEJvdW5kIDogdGhpcy54O1xuICB9XG5cbiAgdGhpcy5wcmV2aW91c0RyYWdNb3ZlVGltZSA9IHRoaXMuZHJhZ01vdmVUaW1lO1xuICB0aGlzLmRyYWdNb3ZlVGltZSA9IG5ldyBEYXRlKCk7XG4gIHRoaXMuZGlzcGF0Y2hFdmVudCggJ2RyYWdNb3ZlJywgZXZlbnQsIFsgcG9pbnRlciwgbW92ZVZlY3RvciBdICk7XG59O1xuXG5wcm90by5kcmFnRW5kID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyICkge1xuICB0aGlzLmRyYWdFbmRGbGljaygpO1xuICBpZiAoIHRoaXMub3B0aW9ucy5mcmVlU2Nyb2xsICkge1xuICAgIHRoaXMuaXNGcmVlU2Nyb2xsaW5nID0gdHJ1ZTtcbiAgfVxuICAvLyBzZXQgc2VsZWN0ZWRJbmRleCBiYXNlZCBvbiB3aGVyZSBmbGljayB3aWxsIGVuZCB1cFxuICB2YXIgaW5kZXggPSB0aGlzLmRyYWdFbmRSZXN0aW5nU2VsZWN0KCk7XG5cbiAgaWYgKCB0aGlzLm9wdGlvbnMuZnJlZVNjcm9sbCAmJiAhdGhpcy5vcHRpb25zLndyYXBBcm91bmQgKSB7XG4gICAgLy8gaWYgZnJlZS1zY3JvbGwgJiBub3Qgd3JhcCBhcm91bmRcbiAgICAvLyBkbyBub3QgZnJlZS1zY3JvbGwgaWYgZ29pbmcgb3V0c2lkZSBvZiBib3VuZGluZyBjZWxsc1xuICAgIC8vIHNvIGJvdW5kaW5nIGNlbGxzIGNhbiBhdHRyYWN0IHNsaWRlciwgYW5kIGtlZXAgaXQgaW4gYm91bmRzXG4gICAgdmFyIHJlc3RpbmdYID0gdGhpcy5nZXRSZXN0aW5nUG9zaXRpb24oKTtcbiAgICB0aGlzLmlzRnJlZVNjcm9sbGluZyA9IC1yZXN0aW5nWCA+IHRoaXMuY2VsbHNbMF0udGFyZ2V0ICYmXG4gICAgICAtcmVzdGluZ1ggPCB0aGlzLmdldExhc3RDZWxsKCkudGFyZ2V0O1xuICB9IGVsc2UgaWYgKCAhdGhpcy5vcHRpb25zLmZyZWVTY3JvbGwgJiYgaW5kZXggPT0gdGhpcy5zZWxlY3RlZEluZGV4ICkge1xuICAgIC8vIGJvb3N0IHNlbGVjdGlvbiBpZiBzZWxlY3RlZCBpbmRleCBoYXMgbm90IGNoYW5nZWRcbiAgICBpbmRleCArPSB0aGlzLmRyYWdFbmRCb29zdFNlbGVjdCgpO1xuICB9XG4gIC8vIGFwcGx5IHNlbGVjdGlvblxuICAvLyBUT0RPIHJlZmFjdG9yIHRoaXMsIHNlbGVjdGluZyBoZXJlIGZlZWxzIHdlaXJkXG4gIHRoaXMuc2VsZWN0KCBpbmRleCApO1xuICB0aGlzLmRpc3BhdGNoRXZlbnQoICdkcmFnRW5kJywgZXZlbnQsIFsgcG9pbnRlciBdICk7XG59O1xuXG4vLyBhcHBseSB2ZWxvY2l0eSBhZnRlciBkcmFnZ2luZ1xucHJvdG8uZHJhZ0VuZEZsaWNrID0gZnVuY3Rpb24oKSB7XG4gIGlmICggIWlzRmluaXRlKCB0aGlzLnByZXZpb3VzRHJhZ1ggKSApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gc2V0IHNsaWRlciB2ZWxvY2l0eVxuICB2YXIgdGltZURlbHRhID0gdGhpcy5kcmFnTW92ZVRpbWUgLSB0aGlzLnByZXZpb3VzRHJhZ01vdmVUaW1lO1xuICAvLyBwcmV2ZW50IGRpdmlkZSBieSAwLCBpZiBkcmFnTW92ZSAmIGRyYWdFbmQgaGFwcGVuZWQgYXQgc2FtZSB0aW1lXG4gIGlmICggdGltZURlbHRhICkge1xuICAgIC8vIDYwIGZyYW1lcyBwZXIgc2Vjb25kLCBpZGVhbGx5XG4gICAgLy8gVE9ETywgdmVsb2NpdHkgc2hvdWxkIGJlIGluIHBpeGVscyBwZXIgbWlsbGlzZWNvbmRcbiAgICAvLyBjdXJyZW50bHkgaW4gcGl4ZWxzIHBlciBmcmFtZVxuICAgIHRpbWVEZWx0YSAvPSAxMDAwIC8gNjA7XG4gICAgdmFyIHhEZWx0YSA9IHRoaXMueCAtIHRoaXMucHJldmlvdXNEcmFnWDtcbiAgICB0aGlzLnZlbG9jaXR5ID0geERlbHRhIC8gdGltZURlbHRhO1xuICB9XG4gIC8vIHJlc2V0XG4gIGRlbGV0ZSB0aGlzLnByZXZpb3VzRHJhZ1g7XG59O1xuXG5wcm90by5kcmFnRW5kUmVzdGluZ1NlbGVjdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmVzdGluZ1ggPSB0aGlzLmdldFJlc3RpbmdQb3NpdGlvbigpO1xuICAvLyBob3cgZmFyIGF3YXkgZnJvbSBzZWxlY3RlZCBjZWxsXG4gIHZhciBkaXN0YW5jZSA9IE1hdGguYWJzKCB0aGlzLmdldENlbGxEaXN0YW5jZSggLXJlc3RpbmdYLCB0aGlzLnNlbGVjdGVkSW5kZXggKSApO1xuICAvLyBnZXQgY2xvc2V0IHJlc3RpbmcgZ29pbmcgdXAgYW5kIGdvaW5nIGRvd25cbiAgdmFyIHBvc2l0aXZlUmVzdGluZyA9IHRoaXMuX2dldENsb3Nlc3RSZXN0aW5nKCByZXN0aW5nWCwgZGlzdGFuY2UsIDEgKTtcbiAgdmFyIG5lZ2F0aXZlUmVzdGluZyA9IHRoaXMuX2dldENsb3Nlc3RSZXN0aW5nKCByZXN0aW5nWCwgZGlzdGFuY2UsIC0xICk7XG4gIC8vIHVzZSBjbG9zZXIgcmVzdGluZyBmb3Igd3JhcC1hcm91bmRcbiAgdmFyIGluZGV4ID0gcG9zaXRpdmVSZXN0aW5nLmRpc3RhbmNlIDwgbmVnYXRpdmVSZXN0aW5nLmRpc3RhbmNlID9cbiAgICBwb3NpdGl2ZVJlc3RpbmcuaW5kZXggOiBuZWdhdGl2ZVJlc3RpbmcuaW5kZXg7XG4gIC8vIGZvciBjb250YWluLCBmb3JjZSBib29zdCBpZiBkZWx0YSBpcyBub3QgZ3JlYXRlciB0aGFuIDFcbiAgaWYgKCB0aGlzLm9wdGlvbnMuY29udGFpbiAmJiAhdGhpcy5vcHRpb25zLndyYXBBcm91bmQgKSB7XG4gICAgaW5kZXggPSBNYXRoLmFicyggaW5kZXggLSB0aGlzLnNlbGVjdGVkSW5kZXggKSA8PSAxID8gdGhpcy5zZWxlY3RlZEluZGV4IDogaW5kZXg7XG4gIH1cbiAgcmV0dXJuIGluZGV4O1xufTtcblxuLyoqXG4gKiBnaXZlbiByZXN0aW5nIFggYW5kIGRpc3RhbmNlIHRvIHNlbGVjdGVkIGNlbGxcbiAqIGdldCB0aGUgZGlzdGFuY2UgYW5kIGluZGV4IG9mIHRoZSBjbG9zZXN0IGNlbGxcbiAqIEBwYXJhbSB7TnVtYmVyfSByZXN0aW5nWCAtIGVzdGltYXRlZCBwb3N0LWZsaWNrIHJlc3RpbmcgcG9zaXRpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSBkaXN0YW5jZSAtIGRpc3RhbmNlIHRvIHNlbGVjdGVkIGNlbGxcbiAqIEBwYXJhbSB7SW50ZWdlcn0gaW5jcmVtZW50IC0gKzEgb3IgLTEsIGdvaW5nIHVwIG9yIGRvd25cbiAqIEByZXR1cm5zIHtPYmplY3R9IC0geyBkaXN0YW5jZToge051bWJlcn0sIGluZGV4OiB7SW50ZWdlcn0gfVxuICovXG5wcm90by5fZ2V0Q2xvc2VzdFJlc3RpbmcgPSBmdW5jdGlvbiggcmVzdGluZ1gsIGRpc3RhbmNlLCBpbmNyZW1lbnQgKSB7XG4gIHZhciBpbmRleCA9IHRoaXMuc2VsZWN0ZWRJbmRleDtcbiAgdmFyIG1pbkRpc3RhbmNlID0gSW5maW5pdHk7XG4gIHZhciBjb25kaXRpb24gPSB0aGlzLm9wdGlvbnMuY29udGFpbiAmJiAhdGhpcy5vcHRpb25zLndyYXBBcm91bmQgP1xuICAgIC8vIGlmIGNvbnRhaW4sIGtlZXAgZ29pbmcgaWYgZGlzdGFuY2UgaXMgZXF1YWwgdG8gbWluRGlzdGFuY2VcbiAgICBmdW5jdGlvbiggZCwgbWQgKSB7IHJldHVybiBkIDw9IG1kOyB9IDogZnVuY3Rpb24oIGQsIG1kICkgeyByZXR1cm4gZCA8IG1kOyB9O1xuICB3aGlsZSAoIGNvbmRpdGlvbiggZGlzdGFuY2UsIG1pbkRpc3RhbmNlICkgKSB7XG4gICAgLy8gbWVhc3VyZSBkaXN0YW5jZSB0byBuZXh0IGNlbGxcbiAgICBpbmRleCArPSBpbmNyZW1lbnQ7XG4gICAgbWluRGlzdGFuY2UgPSBkaXN0YW5jZTtcbiAgICBkaXN0YW5jZSA9IHRoaXMuZ2V0Q2VsbERpc3RhbmNlKCAtcmVzdGluZ1gsIGluZGV4ICk7XG4gICAgaWYgKCBkaXN0YW5jZSA9PT0gbnVsbCApIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBkaXN0YW5jZSA9IE1hdGguYWJzKCBkaXN0YW5jZSApO1xuICB9XG4gIHJldHVybiB7XG4gICAgZGlzdGFuY2U6IG1pbkRpc3RhbmNlLFxuICAgIC8vIHNlbGVjdGVkIHdhcyBwcmV2aW91cyBpbmRleFxuICAgIGluZGV4OiBpbmRleCAtIGluY3JlbWVudFxuICB9O1xufTtcblxuLyoqXG4gKiBtZWFzdXJlIGRpc3RhbmNlIGJldHdlZW4geCBhbmQgYSBjZWxsIHRhcmdldFxuICogQHBhcmFtIHtOdW1iZXJ9IHhcbiAqIEBwYXJhbSB7SW50ZWdlcn0gaW5kZXggLSBjZWxsIGluZGV4XG4gKi9cbnByb3RvLmdldENlbGxEaXN0YW5jZSA9IGZ1bmN0aW9uKCB4LCBpbmRleCApIHtcbiAgdmFyIGxlbiA9IHRoaXMuY2VsbHMubGVuZ3RoO1xuICAvLyB3cmFwIGFyb3VuZCBpZiBhdCBsZWFzdCAyIGNlbGxzXG4gIHZhciBpc1dyYXBBcm91bmQgPSB0aGlzLm9wdGlvbnMud3JhcEFyb3VuZCAmJiBsZW4gPiAxO1xuICB2YXIgY2VsbEluZGV4ID0gaXNXcmFwQXJvdW5kID8gdXRpbHMubW9kdWxvKCBpbmRleCwgbGVuICkgOiBpbmRleDtcbiAgdmFyIGNlbGwgPSB0aGlzLmNlbGxzWyBjZWxsSW5kZXggXTtcbiAgaWYgKCAhY2VsbCApIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICAvLyBhZGQgZGlzdGFuY2UgZm9yIHdyYXAtYXJvdW5kIGNlbGxzXG4gIHZhciB3cmFwID0gaXNXcmFwQXJvdW5kID8gdGhpcy5zbGlkZWFibGVXaWR0aCAqIE1hdGguZmxvb3IoIGluZGV4IC8gbGVuICkgOiAwO1xuICByZXR1cm4geCAtICggY2VsbC50YXJnZXQgKyB3cmFwICk7XG59O1xuXG5wcm90by5kcmFnRW5kQm9vc3RTZWxlY3QgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGRpc3RhbmNlID0gdGhpcy5nZXRDZWxsRGlzdGFuY2UoIC10aGlzLngsIHRoaXMuc2VsZWN0ZWRJbmRleCApO1xuICBpZiAoIGRpc3RhbmNlID4gMCAmJiB0aGlzLnZlbG9jaXR5IDwgLTEgKSB7XG4gICAgLy8gaWYgbW92aW5nIHRvd2FyZHMgdGhlIHJpZ2h0LCBhbmQgcG9zaXRpdmUgdmVsb2NpdHksIGFuZCB0aGUgbmV4dCBhdHRyYWN0b3JcbiAgICByZXR1cm4gMTtcbiAgfSBlbHNlIGlmICggZGlzdGFuY2UgPCAwICYmIHRoaXMudmVsb2NpdHkgPiAxICkge1xuICAgIC8vIGlmIG1vdmluZyB0b3dhcmRzIHRoZSBsZWZ0LCBhbmQgbmVnYXRpdmUgdmVsb2NpdHksIGFuZCBwcmV2aW91cyBhdHRyYWN0b3JcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG4vLyAtLS0tLSBzdGF0aWNDbGljayAtLS0tLSAvL1xuXG5wcm90by5zdGF0aWNDbGljayA9IGZ1bmN0aW9uKCBldmVudCwgcG9pbnRlciApIHtcbiAgLy8gZ2V0IGNsaWNrZWRDZWxsLCBpZiBjZWxsIHdhcyBjbGlja2VkXG4gIHZhciBjbGlja2VkQ2VsbCA9IHRoaXMuZ2V0UGFyZW50Q2VsbCggZXZlbnQudGFyZ2V0ICk7XG4gIHZhciBjZWxsRWxlbSA9IGNsaWNrZWRDZWxsICYmIGNsaWNrZWRDZWxsLmVsZW1lbnQ7XG4gIHZhciBjZWxsSW5kZXggPSBjbGlja2VkQ2VsbCAmJiB1dGlscy5pbmRleE9mKCB0aGlzLmNlbGxzLCBjbGlja2VkQ2VsbCApO1xuICB0aGlzLmRpc3BhdGNoRXZlbnQoICdzdGF0aWNDbGljaycsIGV2ZW50LCBbIHBvaW50ZXIsIGNlbGxFbGVtLCBjZWxsSW5kZXggXSApO1xufTtcblxuLy8gLS0tLS0gIC0tLS0tIC8vXG5cbnV0aWxzLmV4dGVuZCggRmxpY2tpdHkucHJvdG90eXBlLCBwcm90byApO1xuXG4vLyAtLS0tLSAgLS0tLS0gLy9cblxucmV0dXJuIEZsaWNraXR5O1xuXG59KSk7XG4iLCIvKiFcbiAqIEZsaWNraXR5IHYxLjAuMlxuICogVG91Y2gsIHJlc3BvbnNpdmUsIGZsaWNrYWJsZSBnYWxsZXJpZXNcbiAqXG4gKiBMaWNlbnNlZCBHUEx2MyBmb3Igb3BlbiBzb3VyY2UgdXNlXG4gKiBvciBGbGlja2l0eSBDb21tZXJjaWFsIExpY2Vuc2UgZm9yIGNvbW1lcmNpYWwgdXNlXG4gKlxuICogaHR0cDovL2ZsaWNraXR5Lm1ldGFmaXp6eS5jb1xuICogQ29weXJpZ2h0IDIwMTUgTWV0YWZpenp5XG4gKi9cblxuKCBmdW5jdGlvbiggd2luZG93LCBmYWN0b3J5ICkge1xuICAndXNlIHN0cmljdCc7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIGlmICggdHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCBbXG4gICAgICAnY2xhc3NpZS9jbGFzc2llJyxcbiAgICAgICdldmVudEVtaXR0ZXIvRXZlbnRFbWl0dGVyJyxcbiAgICAgICdldmVudGllL2V2ZW50aWUnLFxuICAgICAgJ2dldC1zaXplL2dldC1zaXplJyxcbiAgICAgICdmaXp6eS11aS11dGlscy91dGlscycsXG4gICAgICAnLi9jZWxsJyxcbiAgICAgICcuL2FuaW1hdGUnXG4gICAgXSwgZnVuY3Rpb24oIGNsYXNzaWUsIEV2ZW50RW1pdHRlciwgZXZlbnRpZSwgZ2V0U2l6ZSwgdXRpbHMsIENlbGwsIGFuaW1hdGVQcm90b3R5cGUgKSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSggd2luZG93LCBjbGFzc2llLCBFdmVudEVtaXR0ZXIsIGV2ZW50aWUsIGdldFNpemUsIHV0aWxzLCBDZWxsLCBhbmltYXRlUHJvdG90eXBlICk7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoIHR5cGVvZiBleHBvcnRzID09ICdvYmplY3QnICkge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LFxuICAgICAgcmVxdWlyZSgnZGVzYW5kcm8tY2xhc3NpZScpLFxuICAgICAgcmVxdWlyZSgnd29sZnk4Ny1ldmVudGVtaXR0ZXInKSxcbiAgICAgIHJlcXVpcmUoJ2V2ZW50aWUnKSxcbiAgICAgIHJlcXVpcmUoJ2dldC1zaXplJyksXG4gICAgICByZXF1aXJlKCdmaXp6eS11aS11dGlscycpLFxuICAgICAgcmVxdWlyZSgnLi9jZWxsJyksXG4gICAgICByZXF1aXJlKCcuL2FuaW1hdGUnKVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB2YXIgX0ZsaWNraXR5ID0gd2luZG93LkZsaWNraXR5O1xuXG4gICAgd2luZG93LkZsaWNraXR5ID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHdpbmRvdy5jbGFzc2llLFxuICAgICAgd2luZG93LkV2ZW50RW1pdHRlcixcbiAgICAgIHdpbmRvdy5ldmVudGllLFxuICAgICAgd2luZG93LmdldFNpemUsXG4gICAgICB3aW5kb3cuZml6enlVSVV0aWxzLFxuICAgICAgX0ZsaWNraXR5LkNlbGwsXG4gICAgICBfRmxpY2tpdHkuYW5pbWF0ZVByb3RvdHlwZVxuICAgICk7XG4gIH1cblxufSggd2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KCB3aW5kb3csIGNsYXNzaWUsIEV2ZW50RW1pdHRlciwgZXZlbnRpZSwgZ2V0U2l6ZSxcbiAgdXRpbHMsIENlbGwsIGFuaW1hdGVQcm90b3R5cGUgKSB7XG5cbid1c2Ugc3RyaWN0JztcblxuLy8gdmFyc1xudmFyIGpRdWVyeSA9IHdpbmRvdy5qUXVlcnk7XG52YXIgZ2V0Q29tcHV0ZWRTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlO1xudmFyIGNvbnNvbGUgPSB3aW5kb3cuY29uc29sZTtcblxuZnVuY3Rpb24gbW92ZUVsZW1lbnRzKCBlbGVtcywgdG9FbGVtICkge1xuICBlbGVtcyA9IHV0aWxzLm1ha2VBcnJheSggZWxlbXMgKTtcbiAgd2hpbGUgKCBlbGVtcy5sZW5ndGggKSB7XG4gICAgdG9FbGVtLmFwcGVuZENoaWxkKCBlbGVtcy5zaGlmdCgpICk7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gRmxpY2tpdHkgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuLy8gZ2xvYmFsbHkgdW5pcXVlIGlkZW50aWZpZXJzXG52YXIgR1VJRCA9IDA7XG4vLyBpbnRlcm5hbCBzdG9yZSBvZiBhbGwgRmxpY2tpdHkgaW50YW5jZXNcbnZhciBpbnN0YW5jZXMgPSB7fTtcblxuZnVuY3Rpb24gRmxpY2tpdHkoIGVsZW1lbnQsIG9wdGlvbnMgKSB7XG4gIHZhciBxdWVyeUVsZW1lbnQgPSB1dGlscy5nZXRRdWVyeUVsZW1lbnQoIGVsZW1lbnQgKTtcbiAgaWYgKCAhcXVlcnlFbGVtZW50ICkge1xuICAgIGlmICggY29uc29sZSApIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoICdCYWQgZWxlbWVudCBmb3IgRmxpY2tpdHk6ICcgKyAoIHF1ZXJ5RWxlbWVudCB8fCBlbGVtZW50ICkgKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMuZWxlbWVudCA9IHF1ZXJ5RWxlbWVudDtcbiAgLy8gYWRkIGpRdWVyeVxuICBpZiAoIGpRdWVyeSApIHtcbiAgICB0aGlzLiRlbGVtZW50ID0galF1ZXJ5KCB0aGlzLmVsZW1lbnQgKTtcbiAgfVxuICAvLyBvcHRpb25zXG4gIHRoaXMub3B0aW9ucyA9IHV0aWxzLmV4dGVuZCgge30sIHRoaXMuY29uc3RydWN0b3IuZGVmYXVsdHMgKTtcbiAgdGhpcy5vcHRpb24oIG9wdGlvbnMgKTtcblxuICAvLyBraWNrIHRoaW5ncyBvZmZcbiAgdGhpcy5fY3JlYXRlKCk7XG59XG5cbkZsaWNraXR5LmRlZmF1bHRzID0ge1xuICBhY2Nlc3NpYmlsaXR5OiB0cnVlLFxuICBjZWxsQWxpZ246ICdjZW50ZXInLFxuICAvLyBjZWxsU2VsZWN0b3I6IHVuZGVmaW5lZCxcbiAgLy8gY29udGFpbjogZmFsc2UsXG4gIGZyZWVTY3JvbGxGcmljdGlvbjogMC4wNzUsIC8vIGZyaWN0aW9uIHdoZW4gZnJlZS1zY3JvbGxpbmdcbiAgZnJpY3Rpb246IDAuMjgsIC8vIGZyaWN0aW9uIHdoZW4gc2VsZWN0aW5nXG4gIC8vIGluaXRpYWxJbmRleDogMCxcbiAgcGVyY2VudFBvc2l0aW9uOiB0cnVlLFxuICByZXNpemU6IHRydWUsXG4gIHNlbGVjdGVkQXR0cmFjdGlvbjogMC4wMjUsXG4gIHNldEdhbGxlcnlTaXplOiB0cnVlXG4gIC8vIHdhdGNoQ1NTOiBmYWxzZSxcbiAgLy8gd3JhcEFyb3VuZDogZmFsc2Vcbn07XG5cbi8vIGhhc2ggb2YgbWV0aG9kcyB0cmlnZ2VyZWQgb24gX2NyZWF0ZSgpXG5GbGlja2l0eS5jcmVhdGVNZXRob2RzID0gW107XG5cbi8vIGluaGVyaXQgRXZlbnRFbWl0dGVyXG51dGlscy5leHRlbmQoIEZsaWNraXR5LnByb3RvdHlwZSwgRXZlbnRFbWl0dGVyLnByb3RvdHlwZSApO1xuXG5GbGlja2l0eS5wcm90b3R5cGUuX2NyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAvLyBhZGQgaWQgZm9yIEZsaWNraXR5LmRhdGFcbiAgdmFyIGlkID0gdGhpcy5ndWlkID0gKytHVUlEO1xuICB0aGlzLmVsZW1lbnQuZmxpY2tpdHlHVUlEID0gaWQ7IC8vIGV4cGFuZG9cbiAgaW5zdGFuY2VzWyBpZCBdID0gdGhpczsgLy8gYXNzb2NpYXRlIHZpYSBpZFxuICAvLyBpbml0aWFsIHByb3BlcnRpZXNcbiAgdGhpcy5zZWxlY3RlZEluZGV4ID0gdGhpcy5vcHRpb25zLmluaXRpYWxJbmRleCB8fCAwO1xuICAvLyBob3cgbWFueSBmcmFtZXMgc2xpZGVyIGhhcyBiZWVuIGluIHNhbWUgcG9zaXRpb25cbiAgdGhpcy5yZXN0aW5nRnJhbWVzID0gMDtcbiAgLy8gaW5pdGlhbCBwaHlzaWNzIHByb3BlcnRpZXNcbiAgdGhpcy54ID0gMDtcbiAgdGhpcy52ZWxvY2l0eSA9IDA7XG4gIHRoaXMuYWNjZWwgPSAwO1xuICB0aGlzLm9yaWdpblNpZGUgPSB0aGlzLm9wdGlvbnMucmlnaHRUb0xlZnQgPyAncmlnaHQnIDogJ2xlZnQnO1xuICAvLyBjcmVhdGUgdmlld3BvcnQgJiBzbGlkZXJcbiAgdGhpcy52aWV3cG9ydCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB0aGlzLnZpZXdwb3J0LmNsYXNzTmFtZSA9ICdmbGlja2l0eS12aWV3cG9ydCc7XG4gIEZsaWNraXR5LnNldFVuc2VsZWN0YWJsZSggdGhpcy52aWV3cG9ydCApO1xuICB0aGlzLl9jcmVhdGVTbGlkZXIoKTtcblxuICBpZiAoIHRoaXMub3B0aW9ucy5yZXNpemUgfHwgdGhpcy5vcHRpb25zLndhdGNoQ1NTICkge1xuICAgIGV2ZW50aWUuYmluZCggd2luZG93LCAncmVzaXplJywgdGhpcyApO1xuICAgIHRoaXMuaXNSZXNpemVCb3VuZCA9IHRydWU7XG4gIH1cblxuICBmb3IgKCB2YXIgaT0wLCBsZW4gPSBGbGlja2l0eS5jcmVhdGVNZXRob2RzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgIHZhciBtZXRob2QgPSBGbGlja2l0eS5jcmVhdGVNZXRob2RzW2ldO1xuICAgIHRoaXNbIG1ldGhvZCBdKCk7XG4gIH1cblxuICBpZiAoIHRoaXMub3B0aW9ucy53YXRjaENTUyApIHtcbiAgICB0aGlzLndhdGNoQ1NTKCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5hY3RpdmF0ZSgpO1xuICB9XG5cbn07XG5cbi8qKlxuICogc2V0IG9wdGlvbnNcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzXG4gKi9cbkZsaWNraXR5LnByb3RvdHlwZS5vcHRpb24gPSBmdW5jdGlvbiggb3B0cyApIHtcbiAgdXRpbHMuZXh0ZW5kKCB0aGlzLm9wdGlvbnMsIG9wdHMgKTtcbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5hY3RpdmF0ZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIHRoaXMuaXNBY3RpdmUgKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMuaXNBY3RpdmUgPSB0cnVlO1xuICBjbGFzc2llLmFkZCggdGhpcy5lbGVtZW50LCAnZmxpY2tpdHktZW5hYmxlZCcgKTtcbiAgaWYgKCB0aGlzLm9wdGlvbnMucmlnaHRUb0xlZnQgKSB7XG4gICAgY2xhc3NpZS5hZGQoIHRoaXMuZWxlbWVudCwgJ2ZsaWNraXR5LXJ0bCcgKTtcbiAgfVxuXG4gIC8vIG1vdmUgaW5pdGlhbCBjZWxsIGVsZW1lbnRzIHNvIHRoZXkgY2FuIGJlIGxvYWRlZCBhcyBjZWxsc1xuICB2YXIgY2VsbEVsZW1zID0gdGhpcy5fZmlsdGVyRmluZENlbGxFbGVtZW50cyggdGhpcy5lbGVtZW50LmNoaWxkcmVuICk7XG4gIG1vdmVFbGVtZW50cyggY2VsbEVsZW1zLCB0aGlzLnNsaWRlciApO1xuICB0aGlzLnZpZXdwb3J0LmFwcGVuZENoaWxkKCB0aGlzLnNsaWRlciApO1xuICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoIHRoaXMudmlld3BvcnQgKTtcblxuICB0aGlzLmdldFNpemUoKTtcbiAgLy8gZ2V0IGNlbGxzIGZyb20gY2hpbGRyZW5cbiAgdGhpcy5yZWxvYWRDZWxscygpO1xuXG4gIGlmICggdGhpcy5vcHRpb25zLmFjY2Vzc2liaWxpdHkgKSB7XG4gICAgLy8gYWxsb3cgZWxlbWVudCB0byBmb2N1c2FibGVcbiAgICB0aGlzLmVsZW1lbnQudGFiSW5kZXggPSAwO1xuICAgIC8vIGxpc3RlbiBmb3Iga2V5IHByZXNzZXNcbiAgICBldmVudGllLmJpbmQoIHRoaXMuZWxlbWVudCwgJ2tleWRvd24nLCB0aGlzICk7XG4gIH1cblxuICB0aGlzLmVtaXQoJ2FjdGl2YXRlJyk7XG5cbiAgdGhpcy5wb3NpdGlvblNsaWRlckF0U2VsZWN0ZWQoKTtcbiAgdGhpcy5zZWxlY3QoIHRoaXMuc2VsZWN0ZWRJbmRleCApO1xufTtcblxuLy8gc2xpZGVyIHBvc2l0aW9ucyB0aGUgY2VsbHNcbkZsaWNraXR5LnByb3RvdHlwZS5fY3JlYXRlU2xpZGVyID0gZnVuY3Rpb24oKSB7XG4gIC8vIHNsaWRlciBlbGVtZW50IGRvZXMgYWxsIHRoZSBwb3NpdGlvbmluZ1xuICB2YXIgc2xpZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHNsaWRlci5jbGFzc05hbWUgPSAnZmxpY2tpdHktc2xpZGVyJztcbiAgc2xpZGVyLnN0eWxlWyB0aGlzLm9yaWdpblNpZGUgXSA9IDA7XG4gIHRoaXMuc2xpZGVyID0gc2xpZGVyO1xufTtcblxuRmxpY2tpdHkucHJvdG90eXBlLl9maWx0ZXJGaW5kQ2VsbEVsZW1lbnRzID0gZnVuY3Rpb24oIGVsZW1zICkge1xuICByZXR1cm4gdXRpbHMuZmlsdGVyRmluZEVsZW1lbnRzKCBlbGVtcywgdGhpcy5vcHRpb25zLmNlbGxTZWxlY3RvciApO1xufTtcblxuLy8gZ29lcyB0aHJvdWdoIGFsbCBjaGlsZHJlblxuRmxpY2tpdHkucHJvdG90eXBlLnJlbG9hZENlbGxzID0gZnVuY3Rpb24oKSB7XG4gIC8vIGNvbGxlY3Rpb24gb2YgaXRlbSBlbGVtZW50c1xuICB0aGlzLmNlbGxzID0gdGhpcy5fbWFrZUNlbGxzKCB0aGlzLnNsaWRlci5jaGlsZHJlbiApO1xuICB0aGlzLnBvc2l0aW9uQ2VsbHMoKTtcbiAgdGhpcy5fZ2V0V3JhcFNoaWZ0Q2VsbHMoKTtcbiAgdGhpcy5zZXRHYWxsZXJ5U2l6ZSgpO1xufTtcblxuLyoqXG4gKiB0dXJuIGVsZW1lbnRzIGludG8gRmxpY2tpdHkuQ2VsbHNcbiAqIEBwYXJhbSB7QXJyYXkgb3IgTm9kZUxpc3Qgb3IgSFRNTEVsZW1lbnR9IGVsZW1zXG4gKiBAcmV0dXJucyB7QXJyYXl9IGl0ZW1zIC0gY29sbGVjdGlvbiBvZiBuZXcgRmxpY2tpdHkgQ2VsbHNcbiAqL1xuRmxpY2tpdHkucHJvdG90eXBlLl9tYWtlQ2VsbHMgPSBmdW5jdGlvbiggZWxlbXMgKSB7XG4gIHZhciBjZWxsRWxlbXMgPSB0aGlzLl9maWx0ZXJGaW5kQ2VsbEVsZW1lbnRzKCBlbGVtcyApO1xuXG4gIC8vIGNyZWF0ZSBuZXcgRmxpY2tpdHkgZm9yIGNvbGxlY3Rpb25cbiAgdmFyIGNlbGxzID0gW107XG4gIGZvciAoIHZhciBpPTAsIGxlbiA9IGNlbGxFbGVtcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICB2YXIgZWxlbSA9IGNlbGxFbGVtc1tpXTtcbiAgICB2YXIgY2VsbCA9IG5ldyBDZWxsKCBlbGVtLCB0aGlzICk7XG4gICAgY2VsbHMucHVzaCggY2VsbCApO1xuICB9XG5cbiAgcmV0dXJuIGNlbGxzO1xufTtcblxuRmxpY2tpdHkucHJvdG90eXBlLmdldExhc3RDZWxsID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmNlbGxzWyB0aGlzLmNlbGxzLmxlbmd0aCAtIDEgXTtcbn07XG5cbi8vIHBvc2l0aW9ucyBhbGwgY2VsbHNcbkZsaWNraXR5LnByb3RvdHlwZS5wb3NpdGlvbkNlbGxzID0gZnVuY3Rpb24oKSB7XG4gIC8vIHNpemUgYWxsIGNlbGxzXG4gIHRoaXMuX3NpemVDZWxscyggdGhpcy5jZWxscyApO1xuICAvLyBwb3NpdGlvbiBhbGwgY2VsbHNcbiAgdGhpcy5fcG9zaXRpb25DZWxscyggMCApO1xufTtcblxuLyoqXG4gKiBwb3NpdGlvbiBjZXJ0YWluIGNlbGxzXG4gKiBAcGFyYW0ge0ludGVnZXJ9IGluZGV4IC0gd2hpY2ggY2VsbCB0byBzdGFydCB3aXRoXG4gKi9cbkZsaWNraXR5LnByb3RvdHlwZS5fcG9zaXRpb25DZWxscyA9IGZ1bmN0aW9uKCBpbmRleCApIHtcbiAgLy8gYWxzbyBtZWFzdXJlIG1heENlbGxIZWlnaHRcbiAgLy8gc3RhcnQgMCBpZiBwb3NpdGlvbmluZyBhbGwgY2VsbHNcbiAgdGhpcy5tYXhDZWxsSGVpZ2h0ID0gaW5kZXggPyB0aGlzLm1heENlbGxIZWlnaHQgfHwgMCA6IDA7XG4gIHZhciBjZWxsWCA9IDA7XG4gIC8vIGdldCBjZWxsWFxuICBpZiAoIGluZGV4ID4gMCApIHtcbiAgICB2YXIgc3RhcnRDZWxsID0gdGhpcy5jZWxsc1sgaW5kZXggLSAxIF07XG4gICAgY2VsbFggPSBzdGFydENlbGwueCArIHN0YXJ0Q2VsbC5zaXplLm91dGVyV2lkdGg7XG4gIH1cbiAgdmFyIGNlbGw7XG4gIGZvciAoIHZhciBsZW4gPSB0aGlzLmNlbGxzLmxlbmd0aCwgaT1pbmRleDsgaSA8IGxlbjsgaSsrICkge1xuICAgIGNlbGwgPSB0aGlzLmNlbGxzW2ldO1xuICAgIGNlbGwuc2V0UG9zaXRpb24oIGNlbGxYICk7XG4gICAgY2VsbFggKz0gY2VsbC5zaXplLm91dGVyV2lkdGg7XG4gICAgdGhpcy5tYXhDZWxsSGVpZ2h0ID0gTWF0aC5tYXgoIGNlbGwuc2l6ZS5vdXRlckhlaWdodCwgdGhpcy5tYXhDZWxsSGVpZ2h0ICk7XG4gIH1cbiAgLy8ga2VlcCB0cmFjayBvZiBjZWxsWCBmb3Igd3JhcC1hcm91bmRcbiAgdGhpcy5zbGlkZWFibGVXaWR0aCA9IGNlbGxYO1xuICAvLyBjb250YWluIGNlbGwgdGFyZ2V0XG4gIHRoaXMuX2NvbnRhaW5DZWxscygpO1xufTtcblxuLyoqXG4gKiBjZWxsLmdldFNpemUoKSBvbiBtdWx0aXBsZSBjZWxsc1xuICogQHBhcmFtIHtBcnJheX0gY2VsbHNcbiAqL1xuRmxpY2tpdHkucHJvdG90eXBlLl9zaXplQ2VsbHMgPSBmdW5jdGlvbiggY2VsbHMgKSB7XG4gIGZvciAoIHZhciBpPTAsIGxlbiA9IGNlbGxzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgIHZhciBjZWxsID0gY2VsbHNbaV07XG4gICAgY2VsbC5nZXRTaXplKCk7XG4gIH1cbn07XG5cbi8vIGFsaWFzIF9pbml0IGZvciBqUXVlcnkgcGx1Z2luIC5mbGlja2l0eSgpXG5GbGlja2l0eS5wcm90b3R5cGUuX2luaXQgPVxuRmxpY2tpdHkucHJvdG90eXBlLnJlcG9zaXRpb24gPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wb3NpdGlvbkNlbGxzKCk7XG4gIHRoaXMucG9zaXRpb25TbGlkZXJBdFNlbGVjdGVkKCk7XG59O1xuXG5GbGlja2l0eS5wcm90b3R5cGUuZ2V0U2l6ZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnNpemUgPSBnZXRTaXplKCB0aGlzLmVsZW1lbnQgKTtcbiAgdGhpcy5zZXRDZWxsQWxpZ24oKTtcbiAgdGhpcy5jdXJzb3JQb3NpdGlvbiA9IHRoaXMuc2l6ZS5pbm5lcldpZHRoICogdGhpcy5jZWxsQWxpZ247XG59O1xuXG52YXIgY2VsbEFsaWduU2hvcnRoYW5kcyA9IHtcbiAgLy8gY2VsbCBhbGlnbiwgdGhlbiBiYXNlZCBvbiBvcmlnaW4gc2lkZVxuICBjZW50ZXI6IHtcbiAgICBsZWZ0OiAwLjUsXG4gICAgcmlnaHQ6IDAuNVxuICB9LFxuICBsZWZ0OiB7XG4gICAgbGVmdDogMCxcbiAgICByaWdodDogMVxuICB9LFxuICByaWdodDoge1xuICAgIHJpZ2h0OiAwLFxuICAgIGxlZnQ6IDFcbiAgfVxufTtcblxuRmxpY2tpdHkucHJvdG90eXBlLnNldENlbGxBbGlnbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc2hvcnRoYW5kID0gY2VsbEFsaWduU2hvcnRoYW5kc1sgdGhpcy5vcHRpb25zLmNlbGxBbGlnbiBdO1xuICB0aGlzLmNlbGxBbGlnbiA9IHNob3J0aGFuZCA/IHNob3J0aGFuZFsgdGhpcy5vcmlnaW5TaWRlIF0gOiB0aGlzLm9wdGlvbnMuY2VsbEFsaWduO1xufTtcblxuRmxpY2tpdHkucHJvdG90eXBlLnNldEdhbGxlcnlTaXplID0gZnVuY3Rpb24oKSB7XG4gIGlmICggdGhpcy5vcHRpb25zLnNldEdhbGxlcnlTaXplICkge1xuICAgIHRoaXMudmlld3BvcnQuc3R5bGUuaGVpZ2h0ID0gdGhpcy5tYXhDZWxsSGVpZ2h0ICsgJ3B4JztcbiAgfVxufTtcblxuRmxpY2tpdHkucHJvdG90eXBlLl9nZXRXcmFwU2hpZnRDZWxscyA9IGZ1bmN0aW9uKCkge1xuICAvLyBvbmx5IGZvciB3cmFwLWFyb3VuZFxuICBpZiAoICF0aGlzLm9wdGlvbnMud3JhcEFyb3VuZCApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gdW5zaGlmdCBwcmV2aW91cyBjZWxsc1xuICB0aGlzLl91bnNoaWZ0Q2VsbHMoIHRoaXMuYmVmb3JlU2hpZnRDZWxscyApO1xuICB0aGlzLl91bnNoaWZ0Q2VsbHMoIHRoaXMuYWZ0ZXJTaGlmdENlbGxzICk7XG4gIC8vIGdldCBiZWZvcmUgY2VsbHNcbiAgLy8gaW5pdGlhbCBnYXBcbiAgdmFyIGdhcFggPSB0aGlzLmN1cnNvclBvc2l0aW9uO1xuICB2YXIgY2VsbEluZGV4ID0gdGhpcy5jZWxscy5sZW5ndGggLSAxO1xuICB0aGlzLmJlZm9yZVNoaWZ0Q2VsbHMgPSB0aGlzLl9nZXRHYXBDZWxscyggZ2FwWCwgY2VsbEluZGV4LCAtMSApO1xuICAvLyBnZXQgYWZ0ZXIgY2VsbHNcbiAgLy8gZW5kaW5nIGdhcCBiZXR3ZWVuIGxhc3QgY2VsbCBhbmQgZW5kIG9mIGdhbGxlcnkgdmlld3BvcnRcbiAgZ2FwWCA9IHRoaXMuc2l6ZS5pbm5lcldpZHRoIC0gdGhpcy5jdXJzb3JQb3NpdGlvbjtcbiAgLy8gc3RhcnQgY2xvbmluZyBhdCBmaXJzdCBjZWxsLCB3b3JraW5nIGZvcndhcmRzXG4gIHRoaXMuYWZ0ZXJTaGlmdENlbGxzID0gdGhpcy5fZ2V0R2FwQ2VsbHMoIGdhcFgsIDAsIDEgKTtcbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5fZ2V0R2FwQ2VsbHMgPSBmdW5jdGlvbiggZ2FwWCwgY2VsbEluZGV4LCBpbmNyZW1lbnQgKSB7XG4gIC8vIGtlZXAgYWRkaW5nIGNlbGxzIHVudGlsIHRoZSBjb3ZlciB0aGUgaW5pdGlhbCBnYXBcbiAgdmFyIGNlbGxzID0gW107XG4gIHdoaWxlICggZ2FwWCA+IDAgKSB7XG4gICAgdmFyIGNlbGwgPSB0aGlzLmNlbGxzWyBjZWxsSW5kZXggXTtcbiAgICBpZiAoICFjZWxsICkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNlbGxzLnB1c2goIGNlbGwgKTtcbiAgICBjZWxsSW5kZXggKz0gaW5jcmVtZW50O1xuICAgIGdhcFggLT0gY2VsbC5zaXplLm91dGVyV2lkdGg7XG4gIH1cbiAgcmV0dXJuIGNlbGxzO1xufTtcblxuLy8gLS0tLS0gY29udGFpbiAtLS0tLSAvL1xuXG4vLyBjb250YWluIGNlbGwgdGFyZ2V0cyBzbyBubyBleGNlc3Mgc2xpZGluZ1xuRmxpY2tpdHkucHJvdG90eXBlLl9jb250YWluQ2VsbHMgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCAhdGhpcy5vcHRpb25zLmNvbnRhaW4gfHwgdGhpcy5vcHRpb25zLndyYXBBcm91bmQgfHwgIXRoaXMuY2VsbHMubGVuZ3RoICkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgc3RhcnRNYXJnaW4gPSB0aGlzLm9wdGlvbnMucmlnaHRUb0xlZnQgPyAnbWFyZ2luUmlnaHQnIDogJ21hcmdpbkxlZnQnO1xuICB2YXIgZW5kTWFyZ2luID0gdGhpcy5vcHRpb25zLnJpZ2h0VG9MZWZ0ID8gJ21hcmdpbkxlZnQnIDogJ21hcmdpblJpZ2h0JztcbiAgdmFyIGZpcnN0Q2VsbFN0YXJ0TWFyZ2luID0gdGhpcy5jZWxsc1swXS5zaXplWyBzdGFydE1hcmdpbiBdO1xuICB2YXIgbGFzdENlbGwgPSB0aGlzLmdldExhc3RDZWxsKCk7XG4gIHZhciBjb250ZW50V2lkdGggPSB0aGlzLnNsaWRlYWJsZVdpZHRoIC0gbGFzdENlbGwuc2l6ZVsgZW5kTWFyZ2luIF07XG4gIHZhciBlbmRMaW1pdCA9IGNvbnRlbnRXaWR0aCAtIHRoaXMuc2l6ZS5pbm5lcldpZHRoICogKCAxIC0gdGhpcy5jZWxsQWxpZ24gKTtcbiAgLy8gY29udGVudCBpcyBsZXNzIHRoYW4gZ2FsbGVyeSBzaXplXG4gIHZhciBpc0NvbnRlbnRTbWFsbGVyID0gY29udGVudFdpZHRoIDwgdGhpcy5zaXplLmlubmVyV2lkdGg7XG4gIC8vIGNvbnRhaW4gZWFjaCBjZWxsIHRhcmdldFxuICBmb3IgKCB2YXIgaT0wLCBsZW4gPSB0aGlzLmNlbGxzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgIHZhciBjZWxsID0gdGhpcy5jZWxsc1tpXTtcbiAgICAvLyByZXNldCBkZWZhdWx0IHRhcmdldFxuICAgIGNlbGwuc2V0RGVmYXVsdFRhcmdldCgpO1xuICAgIGlmICggaXNDb250ZW50U21hbGxlciApIHtcbiAgICAgIC8vIGFsbCBjZWxscyBmaXQgaW5zaWRlIGdhbGxlcnlcbiAgICAgIGNlbGwudGFyZ2V0ID0gY29udGVudFdpZHRoICogdGhpcy5jZWxsQWxpZ247XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGNvbnRhaW4gdG8gYm91bmRzXG4gICAgICBjZWxsLnRhcmdldCA9IE1hdGgubWF4KCBjZWxsLnRhcmdldCwgdGhpcy5jdXJzb3JQb3NpdGlvbiArIGZpcnN0Q2VsbFN0YXJ0TWFyZ2luICk7XG4gICAgICBjZWxsLnRhcmdldCA9IE1hdGgubWluKCBjZWxsLnRhcmdldCwgZW5kTGltaXQgKTtcbiAgICB9XG4gIH1cbn07XG5cbi8vIC0tLS0tICAtLS0tLSAvL1xuXG4vKipcbiAqIGVtaXRzIGV2ZW50cyB2aWEgZXZlbnRFbWl0dGVyIGFuZCBqUXVlcnkgZXZlbnRzXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZSAtIG5hbWUgb2YgZXZlbnRcbiAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gb3JpZ2luYWwgZXZlbnRcbiAqIEBwYXJhbSB7QXJyYXl9IGFyZ3MgLSBleHRyYSBhcmd1bWVudHNcbiAqL1xuRmxpY2tpdHkucHJvdG90eXBlLmRpc3BhdGNoRXZlbnQgPSBmdW5jdGlvbiggdHlwZSwgZXZlbnQsIGFyZ3MgKSB7XG4gIHZhciBlbWl0QXJncyA9IFsgZXZlbnQgXS5jb25jYXQoIGFyZ3MgKTtcbiAgdGhpcy5lbWl0RXZlbnQoIHR5cGUsIGVtaXRBcmdzICk7XG5cbiAgaWYgKCBqUXVlcnkgJiYgdGhpcy4kZWxlbWVudCApIHtcbiAgICBpZiAoIGV2ZW50ICkge1xuICAgICAgLy8gY3JlYXRlIGpRdWVyeSBldmVudFxuICAgICAgdmFyICRldmVudCA9IGpRdWVyeS5FdmVudCggZXZlbnQgKTtcbiAgICAgICRldmVudC50eXBlID0gdHlwZTtcbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlciggJGV2ZW50LCBhcmdzICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGp1c3QgdHJpZ2dlciB3aXRoIHR5cGUgaWYgbm8gZXZlbnQgYXZhaWxhYmxlXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoIHR5cGUsIGFyZ3MgKTtcbiAgICB9XG4gIH1cbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHNlbGVjdCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4vKipcbiAqIEBwYXJhbSB7SW50ZWdlcn0gaW5kZXggLSBpbmRleCBvZiB0aGUgY2VsbFxuICogQHBhcmFtIHtCb29sZWFufSBpc1dyYXAgLSB3aWxsIHdyYXAtYXJvdW5kIHRvIGxhc3QvZmlyc3QgaWYgYXQgdGhlIGVuZFxuICovXG5GbGlja2l0eS5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24oIGluZGV4LCBpc1dyYXAgKSB7XG4gIGlmICggIXRoaXMuaXNBY3RpdmUgKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vIHdyYXAgcG9zaXRpb24gc28gc2xpZGVyIGlzIHdpdGhpbiBub3JtYWwgYXJlYVxuICB2YXIgbGVuID0gdGhpcy5jZWxscy5sZW5ndGg7XG4gIGlmICggdGhpcy5vcHRpb25zLndyYXBBcm91bmQgJiYgbGVuID4gMSApIHtcbiAgICBpZiAoIGluZGV4IDwgMCApIHtcbiAgICAgIHRoaXMueCAtPSB0aGlzLnNsaWRlYWJsZVdpZHRoO1xuICAgIH0gZWxzZSBpZiAoIGluZGV4ID49IGxlbiApIHtcbiAgICAgIHRoaXMueCArPSB0aGlzLnNsaWRlYWJsZVdpZHRoO1xuICAgIH1cbiAgfVxuXG4gIGlmICggdGhpcy5vcHRpb25zLndyYXBBcm91bmQgfHwgaXNXcmFwICkge1xuICAgIGluZGV4ID0gdXRpbHMubW9kdWxvKCBpbmRleCwgbGVuICk7XG4gIH1cblxuICBpZiAoIHRoaXMuY2VsbHNbIGluZGV4IF0gKSB7XG4gICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5zZXRTZWxlY3RlZENlbGwoKTtcbiAgICB0aGlzLnN0YXJ0QW5pbWF0aW9uKCk7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdjZWxsU2VsZWN0Jyk7XG4gIH1cbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5wcmV2aW91cyA9IGZ1bmN0aW9uKCBpc1dyYXAgKSB7XG4gIHRoaXMuc2VsZWN0KCB0aGlzLnNlbGVjdGVkSW5kZXggLSAxLCBpc1dyYXAgKTtcbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24oIGlzV3JhcCApIHtcbiAgdGhpcy5zZWxlY3QoIHRoaXMuc2VsZWN0ZWRJbmRleCArIDEsIGlzV3JhcCApO1xufTtcblxuRmxpY2tpdHkucHJvdG90eXBlLnNldFNlbGVjdGVkQ2VsbCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9yZW1vdmVTZWxlY3RlZENlbGxDbGFzcygpO1xuICB0aGlzLnNlbGVjdGVkQ2VsbCA9IHRoaXMuY2VsbHNbIHRoaXMuc2VsZWN0ZWRJbmRleCBdO1xuICB0aGlzLnNlbGVjdGVkRWxlbWVudCA9IHRoaXMuc2VsZWN0ZWRDZWxsLmVsZW1lbnQ7XG4gIGNsYXNzaWUuYWRkKCB0aGlzLnNlbGVjdGVkRWxlbWVudCwgJ2lzLXNlbGVjdGVkJyApO1xufTtcblxuRmxpY2tpdHkucHJvdG90eXBlLl9yZW1vdmVTZWxlY3RlZENlbGxDbGFzcyA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIHRoaXMuc2VsZWN0ZWRDZWxsICkge1xuICAgIGNsYXNzaWUucmVtb3ZlKCB0aGlzLnNlbGVjdGVkQ2VsbC5lbGVtZW50LCAnaXMtc2VsZWN0ZWQnICk7XG4gIH1cbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGdldCBjZWxscyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4vKipcbiAqIGdldCBGbGlja2l0eS5DZWxsLCBnaXZlbiBhbiBFbGVtZW50XG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1cbiAqIEByZXR1cm5zIHtGbGlja2l0eS5DZWxsfSBpdGVtXG4gKi9cbkZsaWNraXR5LnByb3RvdHlwZS5nZXRDZWxsID0gZnVuY3Rpb24oIGVsZW0gKSB7XG4gIC8vIGxvb3AgdGhyb3VnaCBjZWxscyB0byBnZXQgdGhlIG9uZSB0aGF0IG1hdGNoZXNcbiAgZm9yICggdmFyIGk9MCwgbGVuID0gdGhpcy5jZWxscy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICB2YXIgY2VsbCA9IHRoaXMuY2VsbHNbaV07XG4gICAgaWYgKCBjZWxsLmVsZW1lbnQgPT0gZWxlbSApIHtcbiAgICAgIHJldHVybiBjZWxsO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBnZXQgY29sbGVjdGlvbiBvZiBGbGlja2l0eS5DZWxscywgZ2l2ZW4gRWxlbWVudHNcbiAqIEBwYXJhbSB7RWxlbWVudCwgQXJyYXksIE5vZGVMaXN0fSBlbGVtc1xuICogQHJldHVybnMge0FycmF5fSBjZWxscyAtIEZsaWNraXR5LkNlbGxzXG4gKi9cbkZsaWNraXR5LnByb3RvdHlwZS5nZXRDZWxscyA9IGZ1bmN0aW9uKCBlbGVtcyApIHtcbiAgZWxlbXMgPSB1dGlscy5tYWtlQXJyYXkoIGVsZW1zICk7XG4gIHZhciBjZWxscyA9IFtdO1xuICBmb3IgKCB2YXIgaT0wLCBsZW4gPSBlbGVtcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICB2YXIgZWxlbSA9IGVsZW1zW2ldO1xuICAgIHZhciBjZWxsID0gdGhpcy5nZXRDZWxsKCBlbGVtICk7XG4gICAgaWYgKCBjZWxsICkge1xuICAgICAgY2VsbHMucHVzaCggY2VsbCApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gY2VsbHM7XG59O1xuXG4vKipcbiAqIGdldCBjZWxsIGVsZW1lbnRzXG4gKiBAcmV0dXJucyB7QXJyYXl9IGNlbGxFbGVtc1xuICovXG5GbGlja2l0eS5wcm90b3R5cGUuZ2V0Q2VsbEVsZW1lbnRzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjZWxsRWxlbXMgPSBbXTtcbiAgZm9yICggdmFyIGk9MCwgbGVuID0gdGhpcy5jZWxscy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICBjZWxsRWxlbXMucHVzaCggdGhpcy5jZWxsc1tpXS5lbGVtZW50ICk7XG4gIH1cbiAgcmV0dXJuIGNlbGxFbGVtcztcbn07XG5cbi8qKlxuICogZ2V0IHBhcmVudCBjZWxsIGZyb20gYW4gZWxlbWVudFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtXG4gKiBAcmV0dXJucyB7RmxpY2tpdC5DZWxsfSBjZWxsXG4gKi9cbkZsaWNraXR5LnByb3RvdHlwZS5nZXRQYXJlbnRDZWxsID0gZnVuY3Rpb24oIGVsZW0gKSB7XG4gIC8vIGZpcnN0IGNoZWNrIGlmIGVsZW0gaXMgY2VsbFxuICB2YXIgY2VsbCA9IHRoaXMuZ2V0Q2VsbCggZWxlbSApO1xuICBpZiAoIGNlbGwgKSB7XG4gICAgcmV0dXJuIGNlbGw7XG4gIH1cbiAgLy8gdHJ5IHRvIGdldCBwYXJlbnQgY2VsbCBlbGVtXG4gIGVsZW0gPSB1dGlscy5nZXRQYXJlbnQoIGVsZW0sICcuZmxpY2tpdHktc2xpZGVyID4gKicgKTtcbiAgcmV0dXJuIHRoaXMuZ2V0Q2VsbCggZWxlbSApO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZXZlbnRzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbkZsaWNraXR5LnByb3RvdHlwZS51aUNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmVtaXQoJ3VpQ2hhbmdlJyk7XG59O1xuXG5GbGlja2l0eS5wcm90b3R5cGUuY2hpbGRVSVBvaW50ZXJEb3duID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICB0aGlzLmVtaXRFdmVudCggJ2NoaWxkVUlQb2ludGVyRG93bicsIFsgZXZlbnQgXSApO1xufTtcblxuLy8gLS0tLS0gcmVzaXplIC0tLS0tIC8vXG5cbkZsaWNraXR5LnByb3RvdHlwZS5vbnJlc2l6ZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLndhdGNoQ1NTKCk7XG4gIHRoaXMucmVzaXplKCk7XG59O1xuXG51dGlscy5kZWJvdW5jZU1ldGhvZCggRmxpY2tpdHksICdvbnJlc2l6ZScsIDE1MCApO1xuXG5GbGlja2l0eS5wcm90b3R5cGUucmVzaXplID0gZnVuY3Rpb24oKSB7XG4gIGlmICggIXRoaXMuaXNBY3RpdmUgKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMuZ2V0U2l6ZSgpO1xuICAvLyB3cmFwIHZhbHVlc1xuICBpZiAoIHRoaXMub3B0aW9ucy53cmFwQXJvdW5kICkge1xuICAgIHRoaXMueCA9IHV0aWxzLm1vZHVsbyggdGhpcy54LCB0aGlzLnNsaWRlYWJsZVdpZHRoICk7XG4gIH1cbiAgdGhpcy5wb3NpdGlvbkNlbGxzKCk7XG4gIHRoaXMuX2dldFdyYXBTaGlmdENlbGxzKCk7XG4gIHRoaXMuc2V0R2FsbGVyeVNpemUoKTtcbiAgdGhpcy5wb3NpdGlvblNsaWRlckF0U2VsZWN0ZWQoKTtcbn07XG5cbnZhciBzdXBwb3J0c0NvbmRpdGlvbmFsQ1NTID0gRmxpY2tpdHkuc3VwcG9ydHNDb25kaXRpb25hbENTUyA9ICggZnVuY3Rpb24oKSB7XG4gIHZhciBzdXBwb3J0cztcbiAgcmV0dXJuIGZ1bmN0aW9uIGNoZWNrU3VwcG9ydCgpIHtcbiAgICBpZiAoIHN1cHBvcnRzICE9PSB1bmRlZmluZWQgKSB7XG4gICAgICByZXR1cm4gc3VwcG9ydHM7XG4gICAgfVxuICAgIGlmICggIWdldENvbXB1dGVkU3R5bGUgKSB7XG4gICAgICBzdXBwb3J0cyA9IGZhbHNlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBzdHlsZSBib2R5J3MgOmFmdGVyIGFuZCBjaGVjayB0aGF0XG4gICAgdmFyIHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICB2YXIgY3NzVGV4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCdib2R5OmFmdGVyIHsgY29udGVudDogXCJmb29cIjsgZGlzcGxheTogbm9uZTsgfScpO1xuICAgIHN0eWxlLmFwcGVuZENoaWxkKCBjc3NUZXh0ICk7XG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZCggc3R5bGUgKTtcbiAgICB2YXIgYWZ0ZXJDb250ZW50ID0gZ2V0Q29tcHV0ZWRTdHlsZSggZG9jdW1lbnQuYm9keSwgJzphZnRlcicgKS5jb250ZW50O1xuICAgIC8vIGNoZWNrIGlmIGFibGUgdG8gZ2V0IDphZnRlciBjb250ZW50XG4gICAgc3VwcG9ydHMgPSBhZnRlckNvbnRlbnQuaW5kZXhPZignZm9vJykgIT0gLTE7XG4gICAgZG9jdW1lbnQuaGVhZC5yZW1vdmVDaGlsZCggc3R5bGUgKTtcbiAgICByZXR1cm4gc3VwcG9ydHM7XG4gIH07XG59KSgpO1xuXG4vLyB3YXRjaGVzIHRoZSA6YWZ0ZXIgcHJvcGVydHksIGFjdGl2YXRlcy9kZWFjdGl2YXRlc1xuRmxpY2tpdHkucHJvdG90eXBlLndhdGNoQ1NTID0gZnVuY3Rpb24oKSB7XG4gIHZhciB3YXRjaE9wdGlvbiA9IHRoaXMub3B0aW9ucy53YXRjaENTUztcbiAgaWYgKCAhd2F0Y2hPcHRpb24gKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBzdXBwb3J0cyA9IHN1cHBvcnRzQ29uZGl0aW9uYWxDU1MoKTtcbiAgaWYgKCAhc3VwcG9ydHMgKSB7XG4gICAgLy8gYWN0aXZhdGUgaWYgd2F0Y2ggb3B0aW9uIGlzIGZhbGxiYWNrT25cbiAgICB2YXIgbWV0aG9kID0gd2F0Y2hPcHRpb24gPT0gJ2ZhbGxiYWNrT24nID8gJ2FjdGl2YXRlJyA6ICdkZWFjdGl2YXRlJztcbiAgICB0aGlzWyBtZXRob2QgXSgpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBhZnRlckNvbnRlbnQgPSBnZXRDb21wdXRlZFN0eWxlKCB0aGlzLmVsZW1lbnQsICc6YWZ0ZXInICkuY29udGVudDtcbiAgLy8gYWN0aXZhdGUgaWYgOmFmdGVyIHsgY29udGVudDogJ2ZsaWNraXR5JyB9XG4gIGlmICggYWZ0ZXJDb250ZW50LmluZGV4T2YoJ2ZsaWNraXR5JykgIT0gLTEgKSB7XG4gICAgdGhpcy5hY3RpdmF0ZSgpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuZGVhY3RpdmF0ZSgpO1xuICB9XG59O1xuXG4vLyAtLS0tLSBrZXlkb3duIC0tLS0tIC8vXG5cbi8vIGdvIHByZXZpb3VzL25leHQgaWYgbGVmdC9yaWdodCBrZXlzIHByZXNzZWRcbkZsaWNraXR5LnByb3RvdHlwZS5vbmtleWRvd24gPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gIC8vIG9ubHkgd29yayBpZiBlbGVtZW50IGlzIGluIGZvY3VzXG4gIGlmICggIXRoaXMub3B0aW9ucy5hY2Nlc3NpYmlsaXR5IHx8XG4gICAgKCBkb2N1bWVudC5hY3RpdmVFbGVtZW50ICYmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgIT0gdGhpcy5lbGVtZW50ICkgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKCBldmVudC5rZXlDb2RlID09IDM3ICkge1xuICAgIC8vIGdvIGxlZnRcbiAgICB2YXIgbGVmdE1ldGhvZCA9IHRoaXMub3B0aW9ucy5yaWdodFRvTGVmdCA/ICduZXh0JyA6ICdwcmV2aW91cyc7XG4gICAgdGhpcy51aUNoYW5nZSgpO1xuICAgIHRoaXNbIGxlZnRNZXRob2QgXSgpO1xuICB9IGVsc2UgaWYgKCBldmVudC5rZXlDb2RlID09IDM5ICkge1xuICAgIC8vIGdvIHJpZ2h0XG4gICAgdmFyIHJpZ2h0TWV0aG9kID0gdGhpcy5vcHRpb25zLnJpZ2h0VG9MZWZ0ID8gJ3ByZXZpb3VzJyA6ICduZXh0JztcbiAgICB0aGlzLnVpQ2hhbmdlKCk7XG4gICAgdGhpc1sgcmlnaHRNZXRob2QgXSgpO1xuICB9XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkZXN0cm95IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbi8vIGRlYWN0aXZhdGUgYWxsIEZsaWNraXR5IGZ1bmN0aW9uYWxpdHksIGJ1dCBrZWVwIHN0dWZmIGF2YWlsYWJsZVxuRmxpY2tpdHkucHJvdG90eXBlLmRlYWN0aXZhdGUgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCAhdGhpcy5pc0FjdGl2ZSApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY2xhc3NpZS5yZW1vdmUoIHRoaXMuZWxlbWVudCwgJ2ZsaWNraXR5LWVuYWJsZWQnICk7XG4gIGNsYXNzaWUucmVtb3ZlKCB0aGlzLmVsZW1lbnQsICdmbGlja2l0eS1ydGwnICk7XG4gIC8vIGRlc3Ryb3kgY2VsbHNcbiAgZm9yICggdmFyIGk9MCwgbGVuID0gdGhpcy5jZWxscy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICB2YXIgY2VsbCA9IHRoaXMuY2VsbHNbaV07XG4gICAgY2VsbC5kZXN0cm95KCk7XG4gIH1cbiAgdGhpcy5fcmVtb3ZlU2VsZWN0ZWRDZWxsQ2xhc3MoKTtcbiAgdGhpcy5lbGVtZW50LnJlbW92ZUNoaWxkKCB0aGlzLnZpZXdwb3J0ICk7XG4gIC8vIG1vdmUgY2hpbGQgZWxlbWVudHMgYmFjayBpbnRvIGVsZW1lbnRcbiAgbW92ZUVsZW1lbnRzKCB0aGlzLnNsaWRlci5jaGlsZHJlbiwgdGhpcy5lbGVtZW50ICk7XG4gIGlmICggdGhpcy5vcHRpb25zLmFjY2Vzc2liaWxpdHkgKSB7XG4gICAgdGhpcy5lbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgndGFiSW5kZXgnKTtcbiAgICBldmVudGllLnVuYmluZCggdGhpcy5lbGVtZW50LCAna2V5ZG93bicsIHRoaXMgKTtcbiAgfVxuICAvLyBzZXQgZmxhZ3NcbiAgdGhpcy5pc0FjdGl2ZSA9IGZhbHNlO1xuICB0aGlzLmVtaXQoJ2RlYWN0aXZhdGUnKTtcbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuZGVhY3RpdmF0ZSgpO1xuICBpZiAoIHRoaXMuaXNSZXNpemVCb3VuZCApIHtcbiAgICBldmVudGllLnVuYmluZCggd2luZG93LCAncmVzaXplJywgdGhpcyApO1xuICB9XG4gIHRoaXMuZW1pdCgnZGVzdHJveScpO1xuICBpZiAoIGpRdWVyeSAmJiB0aGlzLiRlbGVtZW50ICkge1xuICAgIGpRdWVyeS5yZW1vdmVEYXRhKCB0aGlzLmVsZW1lbnQsICdmbGlja2l0eScgKTtcbiAgfVxuICBkZWxldGUgdGhpcy5lbGVtZW50LmZsaWNraXR5R1VJRDtcbiAgZGVsZXRlIGluc3RhbmNlc1sgdGhpcy5ndWlkIF07XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBwcm90b3R5cGUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxudXRpbHMuZXh0ZW5kKCBGbGlja2l0eS5wcm90b3R5cGUsIGFuaW1hdGVQcm90b3R5cGUgKTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZXh0cmFzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbi8vIHF1aWNrIGNoZWNrIGZvciBJRThcbnZhciBpc0lFOCA9ICdhdHRhY2hFdmVudCcgaW4gd2luZG93O1xuXG5GbGlja2l0eS5zZXRVbnNlbGVjdGFibGUgPSBmdW5jdGlvbiggZWxlbSApIHtcbiAgaWYgKCAhaXNJRTggKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vIElFOCBwcmV2ZW50IGNoaWxkIGZyb20gY2hhbmdpbmcgZm9jdXMgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTc1MjUyMjMvMTgyMTgzXG4gIGVsZW0uc2V0QXR0cmlidXRlKCAndW5zZWxlY3RhYmxlJywgJ29uJyApO1xufTtcblxuLyoqXG4gKiBnZXQgRmxpY2tpdHkgaW5zdGFuY2UgZnJvbSBlbGVtZW50XG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1cbiAqIEByZXR1cm5zIHtGbGlja2l0eX1cbiAqL1xuRmxpY2tpdHkuZGF0YSA9IGZ1bmN0aW9uKCBlbGVtICkge1xuICBlbGVtID0gdXRpbHMuZ2V0UXVlcnlFbGVtZW50KCBlbGVtICk7XG4gIHZhciBpZCA9IGVsZW0gJiYgZWxlbS5mbGlja2l0eUdVSUQ7XG4gIHJldHVybiBpZCAmJiBpbnN0YW5jZXNbIGlkIF07XG59O1xuXG51dGlscy5odG1sSW5pdCggRmxpY2tpdHksICdmbGlja2l0eScgKTtcblxuaWYgKCBqUXVlcnkgJiYgalF1ZXJ5LmJyaWRnZXQgKSB7XG4gIGpRdWVyeS5icmlkZ2V0KCAnZmxpY2tpdHknLCBGbGlja2l0eSApO1xufVxuXG5GbGlja2l0eS5DZWxsID0gQ2VsbDtcblxucmV0dXJuIEZsaWNraXR5O1xuXG59KSk7XG4iLCIvKipcbiAqIEZsaWNraXR5IGluZGV4XG4gKiB1c2VkIGZvciBBTUQgYW5kIENvbW1vbkpTIGV4cG9ydHNcbiAqL1xuXG4oIGZ1bmN0aW9uKCB3aW5kb3csIGZhY3RvcnkgKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG5cbiAgaWYgKCB0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoIFtcbiAgICAgICcuL2ZsaWNraXR5JyxcbiAgICAgICcuL2RyYWcnLFxuICAgICAgJy4vcHJldi1uZXh0LWJ1dHRvbicsXG4gICAgICAnLi9wYWdlLWRvdHMnLFxuICAgICAgJy4vcGxheWVyJyxcbiAgICAgICcuL2FkZC1yZW1vdmUtY2VsbCdcbiAgICBdLCBmYWN0b3J5ICk7XG4gIH0gZWxzZSBpZiAoIHR5cGVvZiBleHBvcnRzID09ICdvYmplY3QnICkge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KFxuICAgICAgcmVxdWlyZSgnLi9mbGlja2l0eScpLFxuICAgICAgcmVxdWlyZSgnLi9kcmFnJyksXG4gICAgICByZXF1aXJlKCcuL3ByZXYtbmV4dC1idXR0b24nKSxcbiAgICAgIHJlcXVpcmUoJy4vcGFnZS1kb3RzJyksXG4gICAgICByZXF1aXJlKCcuL3BsYXllcicpLFxuICAgICAgcmVxdWlyZSgnLi9hZGQtcmVtb3ZlLWNlbGwnKVxuICAgICk7XG4gIH1cblxufSkoIHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSggRmxpY2tpdHkgKSB7XG4gIC8qanNoaW50IHN0cmljdDogZmFsc2UqL1xuICByZXR1cm4gRmxpY2tpdHk7XG59KTtcbiIsIiggZnVuY3Rpb24oIHdpbmRvdywgZmFjdG9yeSApIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICBpZiAoIHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSggW1xuICAgICAgJ2V2ZW50aWUvZXZlbnRpZScsXG4gICAgICAnLi9mbGlja2l0eScsXG4gICAgICAndGFwLWxpc3RlbmVyL3RhcC1saXN0ZW5lcicsXG4gICAgICAnZml6enktdWktdXRpbHMvdXRpbHMnXG4gICAgXSwgZnVuY3Rpb24oIGV2ZW50aWUsIEZsaWNraXR5LCBUYXBMaXN0ZW5lciwgdXRpbHMgKSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSggd2luZG93LCBldmVudGllLCBGbGlja2l0eSwgVGFwTGlzdGVuZXIsIHV0aWxzICk7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoIHR5cGVvZiBleHBvcnRzID09ICdvYmplY3QnICkge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LFxuICAgICAgcmVxdWlyZSgnZXZlbnRpZScpLFxuICAgICAgcmVxdWlyZSgnLi9mbGlja2l0eScpLFxuICAgICAgcmVxdWlyZSgndGFwLWxpc3RlbmVyJyksXG4gICAgICByZXF1aXJlKCdmaXp6eS11aS11dGlscycpXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5GbGlja2l0eSA9IHdpbmRvdy5GbGlja2l0eSB8fCB7fTtcbiAgICB3aW5kb3cuRmxpY2tpdHkuUGFnZURvdHMgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LFxuICAgICAgd2luZG93LmV2ZW50aWUsXG4gICAgICB3aW5kb3cuRmxpY2tpdHksXG4gICAgICB3aW5kb3cuVGFwTGlzdGVuZXIsXG4gICAgICB3aW5kb3cuZml6enlVSVV0aWxzXG4gICAgKTtcbiAgfVxuXG59KCB3aW5kb3csIGZ1bmN0aW9uIGZhY3RvcnkoIHdpbmRvdywgZXZlbnRpZSwgRmxpY2tpdHksIFRhcExpc3RlbmVyLCB1dGlscyApIHtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUGFnZURvdHMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBQYWdlRG90cyggcGFyZW50ICkge1xuICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgdGhpcy5fY3JlYXRlKCk7XG59XG5cblBhZ2VEb3RzLnByb3RvdHlwZSA9IG5ldyBUYXBMaXN0ZW5lcigpO1xuXG5QYWdlRG90cy5wcm90b3R5cGUuX2NyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAvLyBjcmVhdGUgaG9sZGVyIGVsZW1lbnRcbiAgdGhpcy5ob2xkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvbCcpO1xuICB0aGlzLmhvbGRlci5jbGFzc05hbWUgPSAnZmxpY2tpdHktcGFnZS1kb3RzJztcbiAgRmxpY2tpdHkuc2V0VW5zZWxlY3RhYmxlKCB0aGlzLmhvbGRlciApO1xuICAvLyBjcmVhdGUgZG90cywgYXJyYXkgb2YgZWxlbWVudHNcbiAgdGhpcy5kb3RzID0gW107XG4gIC8vIHVwZGF0ZSBvbiBzZWxlY3RcbiAgdmFyIF90aGlzID0gdGhpcztcbiAgdGhpcy5vbkNlbGxTZWxlY3QgPSBmdW5jdGlvbigpIHtcbiAgICBfdGhpcy51cGRhdGVTZWxlY3RlZCgpO1xuICB9O1xuICB0aGlzLnBhcmVudC5vbiggJ2NlbGxTZWxlY3QnLCB0aGlzLm9uQ2VsbFNlbGVjdCApO1xuICAvLyB0YXBcbiAgdGhpcy5vbiggJ3RhcCcsIHRoaXMub25UYXAgKTtcbiAgLy8gcG9pbnRlckRvd25cbiAgdGhpcy5vbiggJ3BvaW50ZXJEb3duJywgZnVuY3Rpb24gb25Qb2ludGVyRG93biggYnV0dG9uLCBldmVudCApIHtcbiAgICBfdGhpcy5wYXJlbnQuY2hpbGRVSVBvaW50ZXJEb3duKCBldmVudCApO1xuICB9KTtcbn07XG5cblBhZ2VEb3RzLnByb3RvdHlwZS5hY3RpdmF0ZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnNldERvdHMoKTtcbiAgdGhpcy51cGRhdGVTZWxlY3RlZCgpO1xuICB0aGlzLmJpbmRUYXAoIHRoaXMuaG9sZGVyICk7XG4gIC8vIGFkZCB0byBET01cbiAgdGhpcy5wYXJlbnQuZWxlbWVudC5hcHBlbmRDaGlsZCggdGhpcy5ob2xkZXIgKTtcbn07XG5cblBhZ2VEb3RzLnByb3RvdHlwZS5kZWFjdGl2YXRlID0gZnVuY3Rpb24oKSB7XG4gIC8vIHJlbW92ZSBmcm9tIERPTVxuICB0aGlzLnBhcmVudC5lbGVtZW50LnJlbW92ZUNoaWxkKCB0aGlzLmhvbGRlciApO1xuICBUYXBMaXN0ZW5lci5wcm90b3R5cGUuZGVzdHJveS5jYWxsKCB0aGlzICk7XG59O1xuXG5QYWdlRG90cy5wcm90b3R5cGUuc2V0RG90cyA9IGZ1bmN0aW9uKCkge1xuICAvLyBnZXQgZGlmZmVyZW5jZSBiZXR3ZWVuIG51bWJlciBvZiBjZWxscyBhbmQgbnVtYmVyIG9mIGRvdHNcbiAgdmFyIGRlbHRhID0gdGhpcy5wYXJlbnQuY2VsbHMubGVuZ3RoIC0gdGhpcy5kb3RzLmxlbmd0aDtcbiAgaWYgKCBkZWx0YSA+IDAgKSB7XG4gICAgdGhpcy5hZGREb3RzKCBkZWx0YSApO1xuICB9IGVsc2UgaWYgKCBkZWx0YSA8IDAgKSB7XG4gICAgdGhpcy5yZW1vdmVEb3RzKCAtZGVsdGEgKTtcbiAgfVxufTtcblxuUGFnZURvdHMucHJvdG90eXBlLmFkZERvdHMgPSBmdW5jdGlvbiggY291bnQgKSB7XG4gIHZhciBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgdmFyIG5ld0RvdHMgPSBbXTtcbiAgd2hpbGUgKCBjb3VudCApIHtcbiAgICB2YXIgZG90ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICBkb3QuY2xhc3NOYW1lID0gJ2RvdCc7XG4gICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQoIGRvdCApO1xuICAgIG5ld0RvdHMucHVzaCggZG90ICk7XG4gICAgY291bnQtLTtcbiAgfVxuICB0aGlzLmhvbGRlci5hcHBlbmRDaGlsZCggZnJhZ21lbnQgKTtcbiAgdGhpcy5kb3RzID0gdGhpcy5kb3RzLmNvbmNhdCggbmV3RG90cyApO1xufTtcblxuUGFnZURvdHMucHJvdG90eXBlLnJlbW92ZURvdHMgPSBmdW5jdGlvbiggY291bnQgKSB7XG4gIC8vIHJlbW92ZSBmcm9tIHRoaXMuZG90cyBjb2xsZWN0aW9uXG4gIHZhciByZW1vdmVEb3RzID0gdGhpcy5kb3RzLnNwbGljZSggdGhpcy5kb3RzLmxlbmd0aCAtIGNvdW50LCBjb3VudCApO1xuICAvLyByZW1vdmUgZnJvbSBET01cbiAgZm9yICggdmFyIGk9MCwgbGVuID0gcmVtb3ZlRG90cy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICB2YXIgZG90ID0gcmVtb3ZlRG90c1tpXTtcbiAgICB0aGlzLmhvbGRlci5yZW1vdmVDaGlsZCggZG90ICk7XG4gIH1cbn07XG5cblBhZ2VEb3RzLnByb3RvdHlwZS51cGRhdGVTZWxlY3RlZCA9IGZ1bmN0aW9uKCkge1xuICAvLyByZW1vdmUgc2VsZWN0ZWQgY2xhc3Mgb24gcHJldmlvdXNcbiAgaWYgKCB0aGlzLnNlbGVjdGVkRG90ICkge1xuICAgIHRoaXMuc2VsZWN0ZWREb3QuY2xhc3NOYW1lID0gJ2RvdCc7XG4gIH1cbiAgLy8gZG9uJ3QgcHJvY2VlZCBpZiBubyBkb3RzXG4gIGlmICggIXRoaXMuZG90cy5sZW5ndGggKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMuc2VsZWN0ZWREb3QgPSB0aGlzLmRvdHNbIHRoaXMucGFyZW50LnNlbGVjdGVkSW5kZXggXTtcbiAgdGhpcy5zZWxlY3RlZERvdC5jbGFzc05hbWUgPSAnZG90IGlzLXNlbGVjdGVkJztcbn07XG5cblBhZ2VEb3RzLnByb3RvdHlwZS5vblRhcCA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgdmFyIHRhcmdldCA9IGV2ZW50LnRhcmdldDtcbiAgLy8gb25seSBjYXJlIGFib3V0IGRvdCBjbGlja3NcbiAgaWYgKCB0YXJnZXQubm9kZU5hbWUgIT0gJ0xJJyApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLnBhcmVudC51aUNoYW5nZSgpO1xuICB2YXIgaW5kZXggPSB1dGlscy5pbmRleE9mKCB0aGlzLmRvdHMsIHRhcmdldCApO1xuICB0aGlzLnBhcmVudC5zZWxlY3QoIGluZGV4ICk7XG59O1xuXG5QYWdlRG90cy5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmRlYWN0aXZhdGUoKTtcbn07XG5cbkZsaWNraXR5LlBhZ2VEb3RzID0gUGFnZURvdHM7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEZsaWNraXR5IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbnV0aWxzLmV4dGVuZCggRmxpY2tpdHkuZGVmYXVsdHMsIHtcbiAgcGFnZURvdHM6IHRydWVcbn0pO1xuXG5GbGlja2l0eS5jcmVhdGVNZXRob2RzLnB1c2goJ19jcmVhdGVQYWdlRG90cycpO1xuXG5GbGlja2l0eS5wcm90b3R5cGUuX2NyZWF0ZVBhZ2VEb3RzID0gZnVuY3Rpb24oKSB7XG4gIGlmICggIXRoaXMub3B0aW9ucy5wYWdlRG90cyApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5wYWdlRG90cyA9IG5ldyBQYWdlRG90cyggdGhpcyApO1xuICB0aGlzLm9uKCAnYWN0aXZhdGUnLCB0aGlzLmFjdGl2YXRlUGFnZURvdHMgKTtcbiAgdGhpcy5vbiggJ2NlbGxBZGRlZFJlbW92ZWQnLCB0aGlzLm9uQ2VsbEFkZGVkUmVtb3ZlZFBhZ2VEb3RzICk7XG4gIHRoaXMub24oICdkZWFjdGl2YXRlJywgdGhpcy5kZWFjdGl2YXRlUGFnZURvdHMgKTtcbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5hY3RpdmF0ZVBhZ2VEb3RzID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucGFnZURvdHMuYWN0aXZhdGUoKTtcbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5vbkNlbGxBZGRlZFJlbW92ZWRQYWdlRG90cyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnBhZ2VEb3RzLnNldERvdHMoKTtcbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5kZWFjdGl2YXRlUGFnZURvdHMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wYWdlRG90cy5kZWFjdGl2YXRlKCk7XG59O1xuXG4vLyAtLS0tLSAgLS0tLS0gLy9cblxuRmxpY2tpdHkuUGFnZURvdHMgPSBQYWdlRG90cztcblxucmV0dXJuIFBhZ2VEb3RzO1xuXG59KSk7XG4iLCIoIGZ1bmN0aW9uKCB3aW5kb3csIGZhY3RvcnkgKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG5cbiAgaWYgKCB0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoIFtcbiAgICAgICdldmVudEVtaXR0ZXIvRXZlbnRFbWl0dGVyJyxcbiAgICAgICdldmVudGllL2V2ZW50aWUnLFxuICAgICAgJy4vZmxpY2tpdHknXG4gICAgXSwgZnVuY3Rpb24oIEV2ZW50RW1pdHRlciwgZXZlbnRpZSwgRmxpY2tpdHkgKSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSggRXZlbnRFbWl0dGVyLCBldmVudGllLCBGbGlja2l0eSApO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCB0eXBlb2YgZXhwb3J0cyA9PSAnb2JqZWN0JyApIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShcbiAgICAgIHJlcXVpcmUoJ3dvbGZ5ODctZXZlbnRlbWl0dGVyJyksXG4gICAgICByZXF1aXJlKCdldmVudGllJyksXG4gICAgICByZXF1aXJlKCcuL2ZsaWNraXR5JylcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93LkZsaWNraXR5ID0gd2luZG93LkZsaWNraXR5IHx8IHt9O1xuICAgIHdpbmRvdy5GbGlja2l0eS5QbGF5ZXIgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LkV2ZW50RW1pdHRlcixcbiAgICAgIHdpbmRvdy5ldmVudGllLFxuICAgICAgd2luZG93LkZsaWNraXR5XG4gICAgKTtcbiAgfVxuXG59KCB3aW5kb3csIGZ1bmN0aW9uIGZhY3RvcnkoIEV2ZW50RW1pdHRlciwgZXZlbnRpZSwgRmxpY2tpdHkgKSB7XG5cbid1c2Ugc3RyaWN0JztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUGFnZSBWaXNpYmlsaXR5IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9HdWlkZS9Vc2VyX2V4cGVyaWVuY2UvVXNpbmdfdGhlX1BhZ2VfVmlzaWJpbGl0eV9BUElcblxudmFyIGhpZGRlblByb3BlcnR5LCB2aXNpYmlsaXR5RXZlbnQ7XG5pZiAoICdoaWRkZW4nIGluIGRvY3VtZW50ICkge1xuICBoaWRkZW5Qcm9wZXJ0eSA9ICdoaWRkZW4nO1xuICB2aXNpYmlsaXR5RXZlbnQgPSAndmlzaWJpbGl0eWNoYW5nZSc7XG59IGVsc2UgaWYgKCAnd2Via2l0SGlkZGVuJyBpbiBkb2N1bWVudCApIHtcbiAgaGlkZGVuUHJvcGVydHkgPSAnd2Via2l0SGlkZGVuJztcbiAgdmlzaWJpbGl0eUV2ZW50ID0gJ3dlYmtpdHZpc2liaWxpdHljaGFuZ2UnO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQbGF5ZXIgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuZnVuY3Rpb24gUGxheWVyKCBwYXJlbnQgKSB7XG4gIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XG4gIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAvLyB2aXNpYmlsaXR5IGNoYW5nZSBldmVudCBoYW5kbGVyXG4gIGlmICggdmlzaWJpbGl0eUV2ZW50ICkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdGhpcy5vblZpc2liaWxpdHlDaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIF90aGlzLnZpc2liaWxpdHlDaGFuZ2UoKTtcbiAgICB9O1xuICB9XG59XG5cblBsYXllci5wcm90b3R5cGUgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbi8vIHN0YXJ0IHBsYXlcblBsYXllci5wcm90b3R5cGUucGxheSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmlzUGxheWluZyA9IHRydWU7XG4gIC8vIHBsYXlpbmcga2lsbHMgcGF1c2VzXG4gIGRlbGV0ZSB0aGlzLmlzUGF1c2VkO1xuICAvLyBsaXN0ZW4gdG8gdmlzaWJpbGl0eSBjaGFuZ2VcbiAgaWYgKCB2aXNpYmlsaXR5RXZlbnQgKSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggdmlzaWJpbGl0eUV2ZW50LCB0aGlzLm9uVmlzaWJpbGl0eUNoYW5nZSwgZmFsc2UgKTtcbiAgfVxuICAvLyBzdGFydCB0aWNraW5nXG4gIHRoaXMudGljaygpO1xufTtcblxuUGxheWVyLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oKSB7XG4gIC8vIGRvIG5vdCB0aWNrIGlmIHBhdXNlZCBvciBub3QgcGxheWluZ1xuICBpZiAoICF0aGlzLmlzUGxheWluZyB8fCB0aGlzLmlzUGF1c2VkICkge1xuICAgIHJldHVybjtcbiAgfVxuICAvLyBrZWVwIHRyYWNrIG9mIHdoZW4gLnRpY2soKVxuICB0aGlzLnRpY2tUaW1lID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSB0aGlzLnBhcmVudC5vcHRpb25zLmF1dG9QbGF5O1xuICAvLyBkZWZhdWx0IHRvIDMgc2Vjb25kc1xuICB0aW1lID0gdHlwZW9mIHRpbWUgPT0gJ251bWJlcicgPyB0aW1lIDogMzAwMDtcbiAgdmFyIF90aGlzID0gdGhpcztcbiAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG4gICAgX3RoaXMucGFyZW50Lm5leHQoIHRydWUgKTtcbiAgICBfdGhpcy50aWNrKCk7XG4gIH0sIHRpbWUgKTtcbn07XG5cblBsYXllci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xuICAvLyBzdG9wcGluZyBraWxscyBwYXVzZXNcbiAgZGVsZXRlIHRoaXMuaXNQYXVzZWQ7XG4gIHRoaXMuY2xlYXIoKTtcbiAgLy8gcmVtb3ZlIHZpc2liaWxpdHkgY2hhbmdlIGV2ZW50XG4gIGlmICggdmlzaWJpbGl0eUV2ZW50ICkge1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoIHZpc2liaWxpdHlFdmVudCwgdGhpcy5vblZpc2liaWxpdHlDaGFuZ2UsIGZhbHNlICk7XG4gIH1cbn07XG5cblBsYXllci5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgY2xlYXJUaW1lb3V0KCB0aGlzLnRpbWVvdXQgKTtcbn07XG5cblBsYXllci5wcm90b3R5cGUucGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCB0aGlzLmlzUGxheWluZyApIHtcbiAgICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcbiAgICB0aGlzLmNsZWFyKCk7XG4gIH1cbn07XG5cblBsYXllci5wcm90b3R5cGUudW5wYXVzZSA9IGZ1bmN0aW9uKCkge1xuICAvLyByZS1zdGFydCBwbGF5IGlmIGluIHVucGF1c2VkIHN0YXRlXG4gIGlmICggdGhpcy5pc1BhdXNlZCApIHtcbiAgICB0aGlzLnBsYXkoKTtcbiAgfVxufTtcblxuLy8gcGF1c2UgaWYgcGFnZSB2aXNpYmlsaXR5IGlzIGhpZGRlbiwgdW5wYXVzZSBpZiB2aXNpYmxlXG5QbGF5ZXIucHJvdG90eXBlLnZpc2liaWxpdHlDaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGlzSGlkZGVuID0gZG9jdW1lbnRbIGhpZGRlblByb3BlcnR5IF07XG4gIHRoaXNbIGlzSGlkZGVuID8gJ3BhdXNlJyA6ICd1bnBhdXNlJyBdKCk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBGbGlja2l0eSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4vLyB1dGlscy5leHRlbmQoIEZsaWNraXR5LmRlZmF1bHRzLCB7XG4vLyAgIGF1dG9QbGF5OiBmYWxzZVxuLy8gfSk7XG5cbkZsaWNraXR5LmNyZWF0ZU1ldGhvZHMucHVzaCgnX2NyZWF0ZVBsYXllcicpO1xuXG5GbGlja2l0eS5wcm90b3R5cGUuX2NyZWF0ZVBsYXllciA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnBsYXllciA9IG5ldyBQbGF5ZXIoIHRoaXMgKTtcblxuICB0aGlzLm9uKCAnYWN0aXZhdGUnLCB0aGlzLmFjdGl2YXRlUGxheWVyICk7XG4gIHRoaXMub24oICd1aUNoYW5nZScsIHRoaXMuc3RvcFBsYXllciApO1xuICB0aGlzLm9uKCAncG9pbnRlckRvd24nLCB0aGlzLnN0b3BQbGF5ZXIgKTtcbiAgdGhpcy5vbiggJ2RlYWN0aXZhdGUnLCB0aGlzLmRlYWN0aXZhdGVQbGF5ZXIgKTtcbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5hY3RpdmF0ZVBsYXllciA9IGZ1bmN0aW9uKCkge1xuICBpZiAoICF0aGlzLm9wdGlvbnMuYXV0b1BsYXkgKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMucGxheWVyLnBsYXkoKTtcbiAgZXZlbnRpZS5iaW5kKCB0aGlzLmVsZW1lbnQsICdtb3VzZWVudGVyJywgdGhpcyApO1xuICB0aGlzLmlzTW91c2VlbnRlckJvdW5kID0gdHJ1ZTtcbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5zdG9wUGxheWVyID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucGxheWVyLnN0b3AoKTtcbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5kZWFjdGl2YXRlUGxheWVyID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucGxheWVyLnN0b3AoKTtcbiAgaWYgKCB0aGlzLmlzTW91c2VlbnRlckJvdW5kICkge1xuICAgIGV2ZW50aWUudW5iaW5kKCB0aGlzLmVsZW1lbnQsICdtb3VzZWVudGVyJywgdGhpcyApO1xuICAgIGRlbGV0ZSB0aGlzLmlzTW91c2VlbnRlckJvdW5kO1xuICB9XG59O1xuXG4vLyAtLS0tLSBtb3VzZWVudGVyL2xlYXZlIC0tLS0tIC8vXG5cbi8vIHBhdXNlIGF1dG8tcGxheSBvbiBob3ZlclxuRmxpY2tpdHkucHJvdG90eXBlLm9ubW91c2VlbnRlciA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnBsYXllci5wYXVzZSgpO1xuICBldmVudGllLmJpbmQoIHRoaXMuZWxlbWVudCwgJ21vdXNlbGVhdmUnLCB0aGlzICk7XG59O1xuXG4vLyByZXN1bWUgYXV0by1wbGF5IG9uIGhvdmVyIG9mZlxuRmxpY2tpdHkucHJvdG90eXBlLm9ubW91c2VsZWF2ZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnBsYXllci51bnBhdXNlKCk7XG4gIGV2ZW50aWUudW5iaW5kKCB0aGlzLmVsZW1lbnQsICdtb3VzZWxlYXZlJywgdGhpcyApO1xufTtcblxuLy8gLS0tLS0gIC0tLS0tIC8vXG5cbkZsaWNraXR5LlBsYXllciA9IFBsYXllcjtcblxucmV0dXJuIFBsYXllcjtcblxufSkpO1xuIiwiLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gcHJldi9uZXh0IGJ1dHRvbiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4oIGZ1bmN0aW9uKCB3aW5kb3csIGZhY3RvcnkgKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG5cbiAgaWYgKCB0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoIFtcbiAgICAgICdldmVudGllL2V2ZW50aWUnLFxuICAgICAgJy4vZmxpY2tpdHknLFxuICAgICAgJ3RhcC1saXN0ZW5lci90YXAtbGlzdGVuZXInLFxuICAgICAgJ2Zpenp5LXVpLXV0aWxzL3V0aWxzJ1xuICAgIF0sIGZ1bmN0aW9uKCBldmVudGllLCBGbGlja2l0eSwgVGFwTGlzdGVuZXIsIHV0aWxzICkge1xuICAgICAgcmV0dXJuIGZhY3RvcnkoIHdpbmRvdywgZXZlbnRpZSwgRmxpY2tpdHksIFRhcExpc3RlbmVyLCB1dGlscyApO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCB0eXBlb2YgZXhwb3J0cyA9PSAnb2JqZWN0JyApIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHJlcXVpcmUoJ2V2ZW50aWUnKSxcbiAgICAgIHJlcXVpcmUoJy4vZmxpY2tpdHknKSxcbiAgICAgIHJlcXVpcmUoJ3RhcC1saXN0ZW5lcicpLFxuICAgICAgcmVxdWlyZSgnZml6enktdWktdXRpbHMnKVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cuRmxpY2tpdHkgPSB3aW5kb3cuRmxpY2tpdHkgfHwge307XG4gICAgd2luZG93LkZsaWNraXR5LlByZXZOZXh0QnV0dG9uID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHdpbmRvdy5ldmVudGllLFxuICAgICAgd2luZG93LkZsaWNraXR5LFxuICAgICAgd2luZG93LlRhcExpc3RlbmVyLFxuICAgICAgd2luZG93LmZpenp5VUlVdGlsc1xuICAgICk7XG4gIH1cblxufSggd2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KCB3aW5kb3csIGV2ZW50aWUsIEZsaWNraXR5LCBUYXBMaXN0ZW5lciwgdXRpbHMgKSB7XG5cbid1c2Ugc3RyaWN0JztcblxuLy8gLS0tLS0gaW5saW5lIFNWRyBzdXBwb3J0IC0tLS0tIC8vXG5cbnZhciBzdmdVUkkgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xuXG4vLyBvbmx5IGNoZWNrIG9uIGRlbWFuZCwgbm90IG9uIHNjcmlwdCBsb2FkXG52YXIgc3VwcG9ydHNJbmxpbmVTVkcgPSAoIGZ1bmN0aW9uKCkge1xuICB2YXIgc3VwcG9ydHM7XG4gIGZ1bmN0aW9uIGNoZWNrU3VwcG9ydCgpIHtcbiAgICBpZiAoIHN1cHBvcnRzICE9PSB1bmRlZmluZWQgKSB7XG4gICAgICByZXR1cm4gc3VwcG9ydHM7XG4gICAgfVxuICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBkaXYuaW5uZXJIVE1MID0gJzxzdmcvPic7XG4gICAgc3VwcG9ydHMgPSAoIGRpdi5maXJzdENoaWxkICYmIGRpdi5maXJzdENoaWxkLm5hbWVzcGFjZVVSSSApID09IHN2Z1VSSTtcbiAgICByZXR1cm4gc3VwcG9ydHM7XG4gIH1cbiAgcmV0dXJuIGNoZWNrU3VwcG9ydDtcbn0pKCk7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFByZXZOZXh0QnV0dG9uIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbmZ1bmN0aW9uIFByZXZOZXh0QnV0dG9uKCBkaXJlY3Rpb24sIHBhcmVudCApIHtcbiAgdGhpcy5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG4gIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICB0aGlzLl9jcmVhdGUoKTtcbn1cblxuUHJldk5leHRCdXR0b24ucHJvdG90eXBlID0gbmV3IFRhcExpc3RlbmVyKCk7XG5cblByZXZOZXh0QnV0dG9uLnByb3RvdHlwZS5fY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gIC8vIHByb3BlcnRpZXNcbiAgdGhpcy5pc0VuYWJsZWQgPSB0cnVlO1xuICB0aGlzLmlzUHJldmlvdXMgPSB0aGlzLmRpcmVjdGlvbiA9PSAtMTtcbiAgdmFyIGxlZnREaXJlY3Rpb24gPSB0aGlzLnBhcmVudC5vcHRpb25zLnJpZ2h0VG9MZWZ0ID8gMSA6IC0xO1xuICB0aGlzLmlzTGVmdCA9IHRoaXMuZGlyZWN0aW9uID09IGxlZnREaXJlY3Rpb247XG5cbiAgdmFyIGVsZW1lbnQgPSB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgZWxlbWVudC5jbGFzc05hbWUgPSAnZmxpY2tpdHktcHJldi1uZXh0LWJ1dHRvbic7XG4gIGVsZW1lbnQuY2xhc3NOYW1lICs9IHRoaXMuaXNQcmV2aW91cyA/ICcgcHJldmlvdXMnIDogJyBuZXh0JztcbiAgLy8gcHJldmVudCBidXR0b24gZnJvbSBzdWJtaXR0aW5nIGZvcm0gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTA4MzYwNzYvMTgyMTgzXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKCAndHlwZScsICdidXR0b24nICk7XG4gIEZsaWNraXR5LnNldFVuc2VsZWN0YWJsZSggZWxlbWVudCApO1xuICAvLyBjcmVhdGUgYXJyb3dcbiAgaWYgKCBzdXBwb3J0c0lubGluZVNWRygpICkge1xuICAgIHZhciBzdmcgPSB0aGlzLmNyZWF0ZVNWRygpO1xuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoIHN2ZyApO1xuICB9IGVsc2Uge1xuICAgIC8vIFNWRyBub3Qgc3VwcG9ydGVkLCBzZXQgYnV0dG9uIHRleHRcbiAgICB0aGlzLnNldEFycm93VGV4dCgpO1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lICs9ICcgbm8tc3ZnJztcbiAgfVxuICAvLyB1cGRhdGUgb24gc2VsZWN0XG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIHRoaXMub25DZWxsU2VsZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgX3RoaXMudXBkYXRlKCk7XG4gIH07XG4gIHRoaXMucGFyZW50Lm9uKCAnY2VsbFNlbGVjdCcsIHRoaXMub25DZWxsU2VsZWN0ICk7XG4gIC8vIHRhcFxuICB0aGlzLm9uKCAndGFwJywgdGhpcy5vblRhcCApO1xuICAvLyBwb2ludGVyRG93blxuICB0aGlzLm9uKCAncG9pbnRlckRvd24nLCBmdW5jdGlvbiBvblBvaW50ZXJEb3duKCBidXR0b24sIGV2ZW50ICkge1xuICAgIF90aGlzLnBhcmVudC5jaGlsZFVJUG9pbnRlckRvd24oIGV2ZW50ICk7XG4gIH0pO1xufTtcblxuUHJldk5leHRCdXR0b24ucHJvdG90eXBlLmFjdGl2YXRlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMudXBkYXRlKCk7XG4gIHRoaXMuYmluZFRhcCggdGhpcy5lbGVtZW50ICk7XG4gIC8vIGNsaWNrIGV2ZW50cyBmcm9tIGtleWJvYXJkXG4gIGV2ZW50aWUuYmluZCggdGhpcy5lbGVtZW50LCAnY2xpY2snLCB0aGlzICk7XG4gIC8vIGFkZCB0byBET01cbiAgdGhpcy5wYXJlbnQuZWxlbWVudC5hcHBlbmRDaGlsZCggdGhpcy5lbGVtZW50ICk7XG59O1xuXG5QcmV2TmV4dEJ1dHRvbi5wcm90b3R5cGUuZGVhY3RpdmF0ZSA9IGZ1bmN0aW9uKCkge1xuICAvLyByZW1vdmUgZnJvbSBET01cbiAgdGhpcy5wYXJlbnQuZWxlbWVudC5yZW1vdmVDaGlsZCggdGhpcy5lbGVtZW50ICk7XG4gIC8vIGRvIHJlZ3VsYXIgVGFwTGlzdGVuZXIgZGVzdHJveVxuICBUYXBMaXN0ZW5lci5wcm90b3R5cGUuZGVzdHJveS5jYWxsKCB0aGlzICk7XG4gIC8vIGNsaWNrIGV2ZW50cyBmcm9tIGtleWJvYXJkXG4gIGV2ZW50aWUudW5iaW5kKCB0aGlzLmVsZW1lbnQsICdjbGljaycsIHRoaXMgKTtcbn07XG5cblByZXZOZXh0QnV0dG9uLnByb3RvdHlwZS5jcmVhdGVTVkcgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHN2ZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyggc3ZnVVJJLCAnc3ZnJyk7XG4gIHN2Zy5zZXRBdHRyaWJ1dGUoICd2aWV3Qm94JywgJzAgMCAxMDAgMTAwJyApO1xuICB2YXIgcGF0aCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyggc3ZnVVJJLCAncGF0aCcpO1xuICBwYXRoLnNldEF0dHJpYnV0ZSggJ2QnLCAnTSA1MCwwIEwgNjAsMTAgTCAyMCw1MCBMIDYwLDkwIEwgNTAsMTAwIEwgMCw1MCBaJyApO1xuICBwYXRoLnNldEF0dHJpYnV0ZSggJ2NsYXNzJywgJ2Fycm93JyApO1xuICAvLyBhZGp1c3QgYXJyb3dcbiAgdmFyIGFycm93VHJhbnNmb3JtID0gdGhpcy5pc0xlZnQgPyAndHJhbnNsYXRlKDE1LDApJyA6XG4gICAgJ3RyYW5zbGF0ZSg4NSwxMDApIHJvdGF0ZSgxODApJztcbiAgcGF0aC5zZXRBdHRyaWJ1dGUoICd0cmFuc2Zvcm0nLCBhcnJvd1RyYW5zZm9ybSApO1xuICBzdmcuYXBwZW5kQ2hpbGQoIHBhdGggKTtcbiAgcmV0dXJuIHN2Zztcbn07XG5cblByZXZOZXh0QnV0dG9uLnByb3RvdHlwZS5zZXRBcnJvd1RleHQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBhcmVudE9wdGlvbnMgPSB0aGlzLnBhcmVudC5vcHRpb25zO1xuICB2YXIgYXJyb3dUZXh0ID0gdGhpcy5pc0xlZnQgPyBwYXJlbnRPcHRpb25zLmxlZnRBcnJvd1RleHQgOiBwYXJlbnRPcHRpb25zLnJpZ2h0QXJyb3dUZXh0O1xuICB1dGlscy5zZXRUZXh0KCB0aGlzLmVsZW1lbnQsIGFycm93VGV4dCApO1xufTtcblxuUHJldk5leHRCdXR0b24ucHJvdG90eXBlLm9uVGFwID0gZnVuY3Rpb24oKSB7XG4gIGlmICggIXRoaXMuaXNFbmFibGVkICkge1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLnBhcmVudC51aUNoYW5nZSgpO1xuICB2YXIgbWV0aG9kID0gdGhpcy5pc1ByZXZpb3VzID8gJ3ByZXZpb3VzJyA6ICduZXh0JztcbiAgdGhpcy5wYXJlbnRbIG1ldGhvZCBdKCk7XG59O1xuXG5QcmV2TmV4dEJ1dHRvbi5wcm90b3R5cGUuaGFuZGxlRXZlbnQgPSB1dGlscy5oYW5kbGVFdmVudDtcblxuUHJldk5leHRCdXR0b24ucHJvdG90eXBlLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcbiAgLy8gb25seSBhbGxvdyBjbGlja3MgZnJvbSBrZXlib2FyZFxuICB2YXIgZm9jdXNlZCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gIGlmICggZm9jdXNlZCAmJiBmb2N1c2VkID09IHRoaXMuZWxlbWVudCApIHtcbiAgICB0aGlzLm9uVGFwKCk7XG4gIH1cbn07XG5cbi8vIC0tLS0tICAtLS0tLSAvL1xuXG5QcmV2TmV4dEJ1dHRvbi5wcm90b3R5cGUuZW5hYmxlID0gZnVuY3Rpb24oKSB7XG4gIGlmICggdGhpcy5pc0VuYWJsZWQgKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMuZWxlbWVudC5kaXNhYmxlZCA9IGZhbHNlO1xuICB0aGlzLmlzRW5hYmxlZCA9IHRydWU7XG59O1xuXG5QcmV2TmV4dEJ1dHRvbi5wcm90b3R5cGUuZGlzYWJsZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAoICF0aGlzLmlzRW5hYmxlZCApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5lbGVtZW50LmRpc2FibGVkID0gdHJ1ZTtcbiAgdGhpcy5pc0VuYWJsZWQgPSBmYWxzZTtcbn07XG5cblByZXZOZXh0QnV0dG9uLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgLy8gaW5kZXggb2YgZmlyc3Qgb3IgbGFzdCBjZWxsLCBpZiBwcmV2aW91cyBvciBuZXh0XG4gIHZhciBjZWxscyA9IHRoaXMucGFyZW50LmNlbGxzO1xuICAvLyBlbmFibGUgaXMgd3JhcEFyb3VuZCBhbmQgYXQgbGVhc3QgMiBjZWxsc1xuICBpZiAoIHRoaXMucGFyZW50Lm9wdGlvbnMud3JhcEFyb3VuZCAmJiBjZWxscy5sZW5ndGggPiAxICkge1xuICAgIHRoaXMuZW5hYmxlKCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBsYXN0SW5kZXggPSBjZWxscy5sZW5ndGggPyBjZWxscy5sZW5ndGggLSAxIDogMDtcbiAgdmFyIGJvdW5kSW5kZXggPSB0aGlzLmlzUHJldmlvdXMgPyAwIDogbGFzdEluZGV4O1xuICB2YXIgbWV0aG9kID0gdGhpcy5wYXJlbnQuc2VsZWN0ZWRJbmRleCA9PSBib3VuZEluZGV4ID8gJ2Rpc2FibGUnIDogJ2VuYWJsZSc7XG4gIHRoaXNbIG1ldGhvZCBdKCk7XG59O1xuXG5QcmV2TmV4dEJ1dHRvbi5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmRlYWN0aXZhdGUoKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEZsaWNraXR5IHByb3RvdHlwZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG51dGlscy5leHRlbmQoIEZsaWNraXR5LmRlZmF1bHRzLCB7XG4gIHByZXZOZXh0QnV0dG9uczogdHJ1ZSxcbiAgbGVmdEFycm93VGV4dDogJ+KAuScsXG4gIHJpZ2h0QXJyb3dUZXh0OiAn4oC6J1xufSk7XG5cbkZsaWNraXR5LmNyZWF0ZU1ldGhvZHMucHVzaCgnX2NyZWF0ZVByZXZOZXh0QnV0dG9ucycpO1xuXG5GbGlja2l0eS5wcm90b3R5cGUuX2NyZWF0ZVByZXZOZXh0QnV0dG9ucyA9IGZ1bmN0aW9uKCkge1xuICBpZiAoICF0aGlzLm9wdGlvbnMucHJldk5leHRCdXR0b25zICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMucHJldkJ1dHRvbiA9IG5ldyBQcmV2TmV4dEJ1dHRvbiggLTEsIHRoaXMgKTtcbiAgdGhpcy5uZXh0QnV0dG9uID0gbmV3IFByZXZOZXh0QnV0dG9uKCAxLCB0aGlzICk7XG5cbiAgdGhpcy5vbiggJ2FjdGl2YXRlJywgdGhpcy5hY3RpdmF0ZVByZXZOZXh0QnV0dG9ucyApO1xufTtcblxuRmxpY2tpdHkucHJvdG90eXBlLmFjdGl2YXRlUHJldk5leHRCdXR0b25zID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucHJldkJ1dHRvbi5hY3RpdmF0ZSgpO1xuICB0aGlzLm5leHRCdXR0b24uYWN0aXZhdGUoKTtcbiAgdGhpcy5vbiggJ2RlYWN0aXZhdGUnLCB0aGlzLmRlYWN0aXZhdGVQcmV2TmV4dEJ1dHRvbnMgKTtcbn07XG5cbkZsaWNraXR5LnByb3RvdHlwZS5kZWFjdGl2YXRlUHJldk5leHRCdXR0b25zID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucHJldkJ1dHRvbi5kZWFjdGl2YXRlKCk7XG4gIHRoaXMubmV4dEJ1dHRvbi5kZWFjdGl2YXRlKCk7XG4gIHRoaXMub2ZmKCAnZGVhY3RpdmF0ZScsIHRoaXMuZGVhY3RpdmF0ZVByZXZOZXh0QnV0dG9ucyApO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbkZsaWNraXR5LlByZXZOZXh0QnV0dG9uID0gUHJldk5leHRCdXR0b247XG5cbnJldHVybiBQcmV2TmV4dEJ1dHRvbjtcblxufSkpO1xuIiwiLyohXG4gKiBjbGFzc2llIHYxLjAuMVxuICogY2xhc3MgaGVscGVyIGZ1bmN0aW9uc1xuICogZnJvbSBib256byBodHRwczovL2dpdGh1Yi5jb20vZGVkL2JvbnpvXG4gKiBNSVQgbGljZW5zZVxuICogXG4gKiBjbGFzc2llLmhhcyggZWxlbSwgJ215LWNsYXNzJyApIC0+IHRydWUvZmFsc2VcbiAqIGNsYXNzaWUuYWRkKCBlbGVtLCAnbXktbmV3LWNsYXNzJyApXG4gKiBjbGFzc2llLnJlbW92ZSggZWxlbSwgJ215LXVud2FudGVkLWNsYXNzJyApXG4gKiBjbGFzc2llLnRvZ2dsZSggZWxlbSwgJ215LWNsYXNzJyApXG4gKi9cblxuLypqc2hpbnQgYnJvd3NlcjogdHJ1ZSwgc3RyaWN0OiB0cnVlLCB1bmRlZjogdHJ1ZSwgdW51c2VkOiB0cnVlICovXG4vKmdsb2JhbCBkZWZpbmU6IGZhbHNlLCBtb2R1bGU6IGZhbHNlICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdyApIHtcblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBjbGFzcyBoZWxwZXIgZnVuY3Rpb25zIGZyb20gYm9uem8gaHR0cHM6Ly9naXRodWIuY29tL2RlZC9ib256b1xuXG5mdW5jdGlvbiBjbGFzc1JlZyggY2xhc3NOYW1lICkge1xuICByZXR1cm4gbmV3IFJlZ0V4cChcIihefFxcXFxzKylcIiArIGNsYXNzTmFtZSArIFwiKFxcXFxzK3wkKVwiKTtcbn1cblxuLy8gY2xhc3NMaXN0IHN1cHBvcnQgZm9yIGNsYXNzIG1hbmFnZW1lbnRcbi8vIGFsdGhvIHRvIGJlIGZhaXIsIHRoZSBhcGkgc3Vja3MgYmVjYXVzZSBpdCB3b24ndCBhY2NlcHQgbXVsdGlwbGUgY2xhc3NlcyBhdCBvbmNlXG52YXIgaGFzQ2xhc3MsIGFkZENsYXNzLCByZW1vdmVDbGFzcztcblxuaWYgKCAnY2xhc3NMaXN0JyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgKSB7XG4gIGhhc0NsYXNzID0gZnVuY3Rpb24oIGVsZW0sIGMgKSB7XG4gICAgcmV0dXJuIGVsZW0uY2xhc3NMaXN0LmNvbnRhaW5zKCBjICk7XG4gIH07XG4gIGFkZENsYXNzID0gZnVuY3Rpb24oIGVsZW0sIGMgKSB7XG4gICAgZWxlbS5jbGFzc0xpc3QuYWRkKCBjICk7XG4gIH07XG4gIHJlbW92ZUNsYXNzID0gZnVuY3Rpb24oIGVsZW0sIGMgKSB7XG4gICAgZWxlbS5jbGFzc0xpc3QucmVtb3ZlKCBjICk7XG4gIH07XG59XG5lbHNlIHtcbiAgaGFzQ2xhc3MgPSBmdW5jdGlvbiggZWxlbSwgYyApIHtcbiAgICByZXR1cm4gY2xhc3NSZWcoIGMgKS50ZXN0KCBlbGVtLmNsYXNzTmFtZSApO1xuICB9O1xuICBhZGRDbGFzcyA9IGZ1bmN0aW9uKCBlbGVtLCBjICkge1xuICAgIGlmICggIWhhc0NsYXNzKCBlbGVtLCBjICkgKSB7XG4gICAgICBlbGVtLmNsYXNzTmFtZSA9IGVsZW0uY2xhc3NOYW1lICsgJyAnICsgYztcbiAgICB9XG4gIH07XG4gIHJlbW92ZUNsYXNzID0gZnVuY3Rpb24oIGVsZW0sIGMgKSB7XG4gICAgZWxlbS5jbGFzc05hbWUgPSBlbGVtLmNsYXNzTmFtZS5yZXBsYWNlKCBjbGFzc1JlZyggYyApLCAnICcgKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gdG9nZ2xlQ2xhc3MoIGVsZW0sIGMgKSB7XG4gIHZhciBmbiA9IGhhc0NsYXNzKCBlbGVtLCBjICkgPyByZW1vdmVDbGFzcyA6IGFkZENsYXNzO1xuICBmbiggZWxlbSwgYyApO1xufVxuXG52YXIgY2xhc3NpZSA9IHtcbiAgLy8gZnVsbCBuYW1lc1xuICBoYXNDbGFzczogaGFzQ2xhc3MsXG4gIGFkZENsYXNzOiBhZGRDbGFzcyxcbiAgcmVtb3ZlQ2xhc3M6IHJlbW92ZUNsYXNzLFxuICB0b2dnbGVDbGFzczogdG9nZ2xlQ2xhc3MsXG4gIC8vIHNob3J0IG5hbWVzXG4gIGhhczogaGFzQ2xhc3MsXG4gIGFkZDogYWRkQ2xhc3MsXG4gIHJlbW92ZTogcmVtb3ZlQ2xhc3MsXG4gIHRvZ2dsZTogdG9nZ2xlQ2xhc3Ncbn07XG5cbi8vIHRyYW5zcG9ydFxuaWYgKCB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gIC8vIEFNRFxuICBkZWZpbmUoIGNsYXNzaWUgKTtcbn0gZWxzZSBpZiAoIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyApIHtcbiAgLy8gQ29tbW9uSlNcbiAgbW9kdWxlLmV4cG9ydHMgPSBjbGFzc2llO1xufSBlbHNlIHtcbiAgLy8gYnJvd3NlciBnbG9iYWxcbiAgd2luZG93LmNsYXNzaWUgPSBjbGFzc2llO1xufVxuXG59KSggd2luZG93ICk7XG4iLCIvKiFcbiAqIGdldFN0eWxlUHJvcGVydHkgdjEuMC40XG4gKiBvcmlnaW5hbCBieSBrYW5nYXhcbiAqIGh0dHA6Ly9wZXJmZWN0aW9ua2lsbHMuY29tL2ZlYXR1cmUtdGVzdGluZy1jc3MtcHJvcGVydGllcy9cbiAqIE1JVCBsaWNlbnNlXG4gKi9cblxuLypqc2hpbnQgYnJvd3NlcjogdHJ1ZSwgc3RyaWN0OiB0cnVlLCB1bmRlZjogdHJ1ZSAqL1xuLypnbG9iYWwgZGVmaW5lOiBmYWxzZSwgZXhwb3J0czogZmFsc2UsIG1vZHVsZTogZmFsc2UgKi9cblxuKCBmdW5jdGlvbiggd2luZG93ICkge1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBwcmVmaXhlcyA9ICdXZWJraXQgTW96IG1zIE1zIE8nLnNwbGl0KCcgJyk7XG52YXIgZG9jRWxlbVN0eWxlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlO1xuXG5mdW5jdGlvbiBnZXRTdHlsZVByb3BlcnR5KCBwcm9wTmFtZSApIHtcbiAgaWYgKCAhcHJvcE5hbWUgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gdGVzdCBzdGFuZGFyZCBwcm9wZXJ0eSBmaXJzdFxuICBpZiAoIHR5cGVvZiBkb2NFbGVtU3R5bGVbIHByb3BOYW1lIF0gPT09ICdzdHJpbmcnICkge1xuICAgIHJldHVybiBwcm9wTmFtZTtcbiAgfVxuXG4gIC8vIGNhcGl0YWxpemVcbiAgcHJvcE5hbWUgPSBwcm9wTmFtZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHByb3BOYW1lLnNsaWNlKDEpO1xuXG4gIC8vIHRlc3QgdmVuZG9yIHNwZWNpZmljIHByb3BlcnRpZXNcbiAgdmFyIHByZWZpeGVkO1xuICBmb3IgKCB2YXIgaT0wLCBsZW4gPSBwcmVmaXhlcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICBwcmVmaXhlZCA9IHByZWZpeGVzW2ldICsgcHJvcE5hbWU7XG4gICAgaWYgKCB0eXBlb2YgZG9jRWxlbVN0eWxlWyBwcmVmaXhlZCBdID09PSAnc3RyaW5nJyApIHtcbiAgICAgIHJldHVybiBwcmVmaXhlZDtcbiAgICB9XG4gIH1cbn1cblxuLy8gdHJhbnNwb3J0XG5pZiAoIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgLy8gQU1EXG4gIGRlZmluZSggZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGdldFN0eWxlUHJvcGVydHk7XG4gIH0pO1xufSBlbHNlIGlmICggdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICkge1xuICAvLyBDb21tb25KUyBmb3IgQ29tcG9uZW50XG4gIG1vZHVsZS5leHBvcnRzID0gZ2V0U3R5bGVQcm9wZXJ0eTtcbn0gZWxzZSB7XG4gIC8vIGJyb3dzZXIgZ2xvYmFsXG4gIHdpbmRvdy5nZXRTdHlsZVByb3BlcnR5ID0gZ2V0U3R5bGVQcm9wZXJ0eTtcbn1cblxufSkoIHdpbmRvdyApO1xuIiwiLyoqXG4gKiBtYXRjaGVzU2VsZWN0b3IgdjEuMC4zXG4gKiBtYXRjaGVzU2VsZWN0b3IoIGVsZW1lbnQsICcuc2VsZWN0b3InIClcbiAqIE1JVCBsaWNlbnNlXG4gKi9cblxuLypqc2hpbnQgYnJvd3NlcjogdHJ1ZSwgc3RyaWN0OiB0cnVlLCB1bmRlZjogdHJ1ZSwgdW51c2VkOiB0cnVlICovXG4vKmdsb2JhbCBkZWZpbmU6IGZhbHNlLCBtb2R1bGU6IGZhbHNlICovXG5cbiggZnVuY3Rpb24oIEVsZW1Qcm90byApIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIG1hdGNoZXNNZXRob2QgPSAoIGZ1bmN0aW9uKCkge1xuICAgIC8vIGNoZWNrIGZvciB0aGUgc3RhbmRhcmQgbWV0aG9kIG5hbWUgZmlyc3RcbiAgICBpZiAoIEVsZW1Qcm90by5tYXRjaGVzICkge1xuICAgICAgcmV0dXJuICdtYXRjaGVzJztcbiAgICB9XG4gICAgLy8gY2hlY2sgdW4tcHJlZml4ZWRcbiAgICBpZiAoIEVsZW1Qcm90by5tYXRjaGVzU2VsZWN0b3IgKSB7XG4gICAgICByZXR1cm4gJ21hdGNoZXNTZWxlY3Rvcic7XG4gICAgfVxuICAgIC8vIGNoZWNrIHZlbmRvciBwcmVmaXhlc1xuICAgIHZhciBwcmVmaXhlcyA9IFsgJ3dlYmtpdCcsICdtb3onLCAnbXMnLCAnbycgXTtcblxuICAgIGZvciAoIHZhciBpPTAsIGxlbiA9IHByZWZpeGVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgdmFyIHByZWZpeCA9IHByZWZpeGVzW2ldO1xuICAgICAgdmFyIG1ldGhvZCA9IHByZWZpeCArICdNYXRjaGVzU2VsZWN0b3InO1xuICAgICAgaWYgKCBFbGVtUHJvdG9bIG1ldGhvZCBdICkge1xuICAgICAgICByZXR1cm4gbWV0aG9kO1xuICAgICAgfVxuICAgIH1cbiAgfSkoKTtcblxuICAvLyAtLS0tLSBtYXRjaCAtLS0tLSAvL1xuXG4gIGZ1bmN0aW9uIG1hdGNoKCBlbGVtLCBzZWxlY3RvciApIHtcbiAgICByZXR1cm4gZWxlbVsgbWF0Y2hlc01ldGhvZCBdKCBzZWxlY3RvciApO1xuICB9XG5cbiAgLy8gLS0tLS0gYXBwZW5kVG9GcmFnbWVudCAtLS0tLSAvL1xuXG4gIGZ1bmN0aW9uIGNoZWNrUGFyZW50KCBlbGVtICkge1xuICAgIC8vIG5vdCBuZWVkZWQgaWYgYWxyZWFkeSBoYXMgcGFyZW50XG4gICAgaWYgKCBlbGVtLnBhcmVudE5vZGUgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICBmcmFnbWVudC5hcHBlbmRDaGlsZCggZWxlbSApO1xuICB9XG5cbiAgLy8gLS0tLS0gcXVlcnkgLS0tLS0gLy9cblxuICAvLyBmYWxsIGJhY2sgdG8gdXNpbmcgUVNBXG4gIC8vIHRoeCBAam9uYXRoYW50bmVhbCBodHRwczovL2dpc3QuZ2l0aHViLmNvbS8zMDYyOTU1XG4gIGZ1bmN0aW9uIHF1ZXJ5KCBlbGVtLCBzZWxlY3RvciApIHtcbiAgICAvLyBhcHBlbmQgdG8gZnJhZ21lbnQgaWYgbm8gcGFyZW50XG4gICAgY2hlY2tQYXJlbnQoIGVsZW0gKTtcblxuICAgIC8vIG1hdGNoIGVsZW0gd2l0aCBhbGwgc2VsZWN0ZWQgZWxlbXMgb2YgcGFyZW50XG4gICAgdmFyIGVsZW1zID0gZWxlbS5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoIHNlbGVjdG9yICk7XG4gICAgZm9yICggdmFyIGk9MCwgbGVuID0gZWxlbXMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICAvLyByZXR1cm4gdHJ1ZSBpZiBtYXRjaFxuICAgICAgaWYgKCBlbGVtc1tpXSA9PT0gZWxlbSApIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIG90aGVyd2lzZSByZXR1cm4gZmFsc2VcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyAtLS0tLSBtYXRjaENoaWxkIC0tLS0tIC8vXG5cbiAgZnVuY3Rpb24gbWF0Y2hDaGlsZCggZWxlbSwgc2VsZWN0b3IgKSB7XG4gICAgY2hlY2tQYXJlbnQoIGVsZW0gKTtcbiAgICByZXR1cm4gbWF0Y2goIGVsZW0sIHNlbGVjdG9yICk7XG4gIH1cblxuICAvLyAtLS0tLSBtYXRjaGVzU2VsZWN0b3IgLS0tLS0gLy9cblxuICB2YXIgbWF0Y2hlc1NlbGVjdG9yO1xuXG4gIGlmICggbWF0Y2hlc01ldGhvZCApIHtcbiAgICAvLyBJRTkgc3VwcG9ydHMgbWF0Y2hlc1NlbGVjdG9yLCBidXQgZG9lc24ndCB3b3JrIG9uIG9ycGhhbmVkIGVsZW1zXG4gICAgLy8gY2hlY2sgZm9yIHRoYXRcbiAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdmFyIHN1cHBvcnRzT3JwaGFucyA9IG1hdGNoKCBkaXYsICdkaXYnICk7XG4gICAgbWF0Y2hlc1NlbGVjdG9yID0gc3VwcG9ydHNPcnBoYW5zID8gbWF0Y2ggOiBtYXRjaENoaWxkO1xuICB9IGVsc2Uge1xuICAgIG1hdGNoZXNTZWxlY3RvciA9IHF1ZXJ5O1xuICB9XG5cbiAgLy8gdHJhbnNwb3J0XG4gIGlmICggdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSggZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbWF0Y2hlc1NlbGVjdG9yO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBtYXRjaGVzU2VsZWN0b3I7XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cubWF0Y2hlc1NlbGVjdG9yID0gbWF0Y2hlc1NlbGVjdG9yO1xuICB9XG5cbn0pKCBFbGVtZW50LnByb3RvdHlwZSApO1xuIiwiLyohXG4gKiBkb2NSZWFkeSB2MS4wLjNcbiAqIENyb3NzIGJyb3dzZXIgRE9NQ29udGVudExvYWRlZCBldmVudCBlbWl0dGVyXG4gKiBNSVQgbGljZW5zZVxuICovXG5cbi8qanNoaW50IGJyb3dzZXI6IHRydWUsIHN0cmljdDogdHJ1ZSwgdW5kZWY6IHRydWUsIHVudXNlZDogdHJ1ZSovXG4vKmdsb2JhbCBkZWZpbmU6IGZhbHNlLCByZXF1aXJlOiBmYWxzZSwgbW9kdWxlOiBmYWxzZSAqL1xuXG4oIGZ1bmN0aW9uKCB3aW5kb3cgKSB7XG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50O1xuLy8gY29sbGVjdGlvbiBvZiBmdW5jdGlvbnMgdG8gYmUgdHJpZ2dlcmVkIG9uIHJlYWR5XG52YXIgcXVldWUgPSBbXTtcblxuZnVuY3Rpb24gZG9jUmVhZHkoIGZuICkge1xuICAvLyB0aHJvdyBvdXQgbm9uLWZ1bmN0aW9uc1xuICBpZiAoIHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJyApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoIGRvY1JlYWR5LmlzUmVhZHkgKSB7XG4gICAgLy8gcmVhZHkgbm93LCBoaXQgaXRcbiAgICBmbigpO1xuICB9IGVsc2Uge1xuICAgIC8vIHF1ZXVlIGZ1bmN0aW9uIHdoZW4gcmVhZHlcbiAgICBxdWV1ZS5wdXNoKCBmbiApO1xuICB9XG59XG5cbmRvY1JlYWR5LmlzUmVhZHkgPSBmYWxzZTtcblxuLy8gdHJpZ2dlcmVkIG9uIHZhcmlvdXMgZG9jIHJlYWR5IGV2ZW50c1xuZnVuY3Rpb24gaW5pdCggZXZlbnQgKSB7XG4gIC8vIGJhaWwgaWYgSUU4IGRvY3VtZW50IGlzIG5vdCByZWFkeSBqdXN0IHlldFxuICB2YXIgaXNJRThOb3RSZWFkeSA9IGV2ZW50LnR5cGUgPT09ICdyZWFkeXN0YXRlY2hhbmdlJyAmJiBkb2N1bWVudC5yZWFkeVN0YXRlICE9PSAnY29tcGxldGUnO1xuICBpZiAoIGRvY1JlYWR5LmlzUmVhZHkgfHwgaXNJRThOb3RSZWFkeSApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZG9jUmVhZHkuaXNSZWFkeSA9IHRydWU7XG5cbiAgLy8gcHJvY2VzcyBxdWV1ZVxuICBmb3IgKCB2YXIgaT0wLCBsZW4gPSBxdWV1ZS5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICB2YXIgZm4gPSBxdWV1ZVtpXTtcbiAgICBmbigpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRlZmluZURvY1JlYWR5KCBldmVudGllICkge1xuICBldmVudGllLmJpbmQoIGRvY3VtZW50LCAnRE9NQ29udGVudExvYWRlZCcsIGluaXQgKTtcbiAgZXZlbnRpZS5iaW5kKCBkb2N1bWVudCwgJ3JlYWR5c3RhdGVjaGFuZ2UnLCBpbml0ICk7XG4gIGV2ZW50aWUuYmluZCggd2luZG93LCAnbG9hZCcsIGluaXQgKTtcblxuICByZXR1cm4gZG9jUmVhZHk7XG59XG5cbi8vIHRyYW5zcG9ydFxuaWYgKCB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gIC8vIEFNRFxuICAvLyBpZiBSZXF1aXJlSlMsIHRoZW4gZG9jIGlzIGFscmVhZHkgcmVhZHlcbiAgZG9jUmVhZHkuaXNSZWFkeSA9IHR5cGVvZiByZXF1aXJlanMgPT09ICdmdW5jdGlvbic7XG4gIGRlZmluZSggWyAnZXZlbnRpZS9ldmVudGllJyBdLCBkZWZpbmVEb2NSZWFkeSApO1xufSBlbHNlIGlmICggdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICkge1xuICBtb2R1bGUuZXhwb3J0cyA9IGRlZmluZURvY1JlYWR5KCByZXF1aXJlKCdldmVudGllJykgKTtcbn0gZWxzZSB7XG4gIC8vIGJyb3dzZXIgZ2xvYmFsXG4gIHdpbmRvdy5kb2NSZWFkeSA9IGRlZmluZURvY1JlYWR5KCB3aW5kb3cuZXZlbnRpZSApO1xufVxuXG59KSggd2luZG93ICk7XG4iLCIvKipcbiAqIEZpenp5IFVJIHV0aWxzIHYxLjAuMVxuICogTUlUIGxpY2Vuc2VcbiAqL1xuXG4vKmpzaGludCBicm93c2VyOiB0cnVlLCB1bmRlZjogdHJ1ZSwgdW51c2VkOiB0cnVlLCBzdHJpY3Q6IHRydWUgKi9cblxuKCBmdW5jdGlvbiggd2luZG93LCBmYWN0b3J5ICkge1xuICAvKmdsb2JhbCBkZWZpbmU6IGZhbHNlLCBtb2R1bGU6IGZhbHNlLCByZXF1aXJlOiBmYWxzZSAqL1xuICAndXNlIHN0cmljdCc7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIGlmICggdHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCBbXG4gICAgICAnZG9jLXJlYWR5L2RvYy1yZWFkeScsXG4gICAgICAnbWF0Y2hlcy1zZWxlY3Rvci9tYXRjaGVzLXNlbGVjdG9yJ1xuICAgIF0sIGZ1bmN0aW9uKCBkb2NSZWFkeSwgbWF0Y2hlc1NlbGVjdG9yICkge1xuICAgICAgcmV0dXJuIGZhY3RvcnkoIHdpbmRvdywgZG9jUmVhZHksIG1hdGNoZXNTZWxlY3RvciApO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCB0eXBlb2YgZXhwb3J0cyA9PSAnb2JqZWN0JyApIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHJlcXVpcmUoJ2RvYy1yZWFkeScpLFxuICAgICAgcmVxdWlyZSgnZGVzYW5kcm8tbWF0Y2hlcy1zZWxlY3RvcicpXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5maXp6eVVJVXRpbHMgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LFxuICAgICAgd2luZG93LmRvY1JlYWR5LFxuICAgICAgd2luZG93Lm1hdGNoZXNTZWxlY3RvclxuICAgICk7XG4gIH1cblxufSggd2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KCB3aW5kb3csIGRvY1JlYWR5LCBtYXRjaGVzU2VsZWN0b3IgKSB7XG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWxzID0ge307XG5cbi8vIC0tLS0tIGV4dGVuZCAtLS0tLSAvL1xuXG4vLyBleHRlbmRzIG9iamVjdHNcbnV0aWxzLmV4dGVuZCA9IGZ1bmN0aW9uKCBhLCBiICkge1xuICBmb3IgKCB2YXIgcHJvcCBpbiBiICkge1xuICAgIGFbIHByb3AgXSA9IGJbIHByb3AgXTtcbiAgfVxuICByZXR1cm4gYTtcbn07XG5cbi8vIC0tLS0tIG1vZHVsbyAtLS0tLSAvL1xuXG51dGlscy5tb2R1bG8gPSBmdW5jdGlvbiggbnVtLCBkaXYgKSB7XG4gIHJldHVybiAoICggbnVtICUgZGl2ICkgKyBkaXYgKSAlIGRpdjtcbn07XG5cbi8vIC0tLS0tIGlzQXJyYXkgLS0tLS0gLy9cbiAgXG52YXIgb2JqVG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xudXRpbHMuaXNBcnJheSA9IGZ1bmN0aW9uKCBvYmogKSB7XG4gIHJldHVybiBvYmpUb1N0cmluZy5jYWxsKCBvYmogKSA9PSAnW29iamVjdCBBcnJheV0nO1xufTtcblxuLy8gLS0tLS0gbWFrZUFycmF5IC0tLS0tIC8vXG5cbi8vIHR1cm4gZWxlbWVudCBvciBub2RlTGlzdCBpbnRvIGFuIGFycmF5XG51dGlscy5tYWtlQXJyYXkgPSBmdW5jdGlvbiggb2JqICkge1xuICB2YXIgYXJ5ID0gW107XG4gIGlmICggdXRpbHMuaXNBcnJheSggb2JqICkgKSB7XG4gICAgLy8gdXNlIG9iamVjdCBpZiBhbHJlYWR5IGFuIGFycmF5XG4gICAgYXJ5ID0gb2JqO1xuICB9IGVsc2UgaWYgKCBvYmogJiYgdHlwZW9mIG9iai5sZW5ndGggPT0gJ251bWJlcicgKSB7XG4gICAgLy8gY29udmVydCBub2RlTGlzdCB0byBhcnJheVxuICAgIGZvciAoIHZhciBpPTAsIGxlbiA9IG9iai5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgIGFyeS5wdXNoKCBvYmpbaV0gKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gYXJyYXkgb2Ygc2luZ2xlIGluZGV4XG4gICAgYXJ5LnB1c2goIG9iaiApO1xuICB9XG4gIHJldHVybiBhcnk7XG59O1xuXG4vLyAtLS0tLSBpbmRleE9mIC0tLS0tIC8vXG5cbi8vIGluZGV4IG9mIGhlbHBlciBjYXVzZSBJRThcbnV0aWxzLmluZGV4T2YgPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA/IGZ1bmN0aW9uKCBhcnksIG9iaiApIHtcbiAgICByZXR1cm4gYXJ5LmluZGV4T2YoIG9iaiApO1xuICB9IDogZnVuY3Rpb24oIGFyeSwgb2JqICkge1xuICAgIGZvciAoIHZhciBpPTAsIGxlbiA9IGFyeS5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgIGlmICggYXJ5W2ldID09PSBvYmogKSB7XG4gICAgICAgIHJldHVybiBpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbi8vIC0tLS0tIHJlbW92ZUZyb20gLS0tLS0gLy9cblxudXRpbHMucmVtb3ZlRnJvbSA9IGZ1bmN0aW9uKCBhcnksIG9iaiApIHtcbiAgdmFyIGluZGV4ID0gdXRpbHMuaW5kZXhPZiggYXJ5LCBvYmogKTtcbiAgaWYgKCBpbmRleCAhPSAtMSApIHtcbiAgICBhcnkuc3BsaWNlKCBpbmRleCwgMSApO1xuICB9XG59O1xuXG4vLyAtLS0tLSBpc0VsZW1lbnQgLS0tLS0gLy9cblxuLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMzg0MzgwLzE4MjE4M1xudXRpbHMuaXNFbGVtZW50ID0gKCB0eXBlb2YgSFRNTEVsZW1lbnQgPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgSFRNTEVsZW1lbnQgPT0gJ29iamVjdCcgKSA/XG4gIGZ1bmN0aW9uIGlzRWxlbWVudERPTTIoIG9iaiApIHtcbiAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQ7XG4gIH0gOlxuICBmdW5jdGlvbiBpc0VsZW1lbnRRdWlya3koIG9iaiApIHtcbiAgICByZXR1cm4gb2JqICYmIHR5cGVvZiBvYmogPT0gJ29iamVjdCcgJiZcbiAgICAgIG9iai5ub2RlVHlwZSA9PSAxICYmIHR5cGVvZiBvYmoubm9kZU5hbWUgPT0gJ3N0cmluZyc7XG4gIH07XG5cbi8vIC0tLS0tIHNldFRleHQgLS0tLS0gLy9cblxudXRpbHMuc2V0VGV4dCA9ICggZnVuY3Rpb24oKSB7XG4gIHZhciBzZXRUZXh0UHJvcGVydHk7XG4gIGZ1bmN0aW9uIHNldFRleHQoIGVsZW0sIHRleHQgKSB7XG4gICAgLy8gb25seSBjaGVjayBzZXRUZXh0UHJvcGVydHkgb25jZVxuICAgIHNldFRleHRQcm9wZXJ0eSA9IHNldFRleHRQcm9wZXJ0eSB8fCAoIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC50ZXh0Q29udGVudCAhPT0gdW5kZWZpbmVkID8gJ3RleHRDb250ZW50JyA6ICdpbm5lclRleHQnICk7XG4gICAgZWxlbVsgc2V0VGV4dFByb3BlcnR5IF0gPSB0ZXh0O1xuICB9XG4gIHJldHVybiBzZXRUZXh0O1xufSkoKTtcblxuLy8gLS0tLS0gZ2V0UGFyZW50IC0tLS0tIC8vXG5cbnV0aWxzLmdldFBhcmVudCA9IGZ1bmN0aW9uKCBlbGVtLCBzZWxlY3RvciApIHtcbiAgd2hpbGUgKCBlbGVtICE9IGRvY3VtZW50LmJvZHkgKSB7XG4gICAgZWxlbSA9IGVsZW0ucGFyZW50Tm9kZTtcbiAgICBpZiAoIG1hdGNoZXNTZWxlY3RvciggZWxlbSwgc2VsZWN0b3IgKSApIHtcbiAgICAgIHJldHVybiBlbGVtO1xuICAgIH1cbiAgfVxufTtcblxuLy8gLS0tLS0gZ2V0UXVlcnlFbGVtZW50IC0tLS0tIC8vXG5cbi8vIHVzZSBlbGVtZW50IGFzIHNlbGVjdG9yIHN0cmluZ1xudXRpbHMuZ2V0UXVlcnlFbGVtZW50ID0gZnVuY3Rpb24oIGVsZW0gKSB7XG4gIGlmICggdHlwZW9mIGVsZW0gPT0gJ3N0cmluZycgKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoIGVsZW0gKTtcbiAgfVxuICByZXR1cm4gZWxlbTtcbn07XG5cbi8vIC0tLS0tIGhhbmRsZUV2ZW50IC0tLS0tIC8vXG5cbi8vIGVuYWJsZSAub250eXBlIHRvIHRyaWdnZXIgZnJvbSAuYWRkRXZlbnRMaXN0ZW5lciggZWxlbSwgJ3R5cGUnIClcbnV0aWxzLmhhbmRsZUV2ZW50ID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICB2YXIgbWV0aG9kID0gJ29uJyArIGV2ZW50LnR5cGU7XG4gIGlmICggdGhpc1sgbWV0aG9kIF0gKSB7XG4gICAgdGhpc1sgbWV0aG9kIF0oIGV2ZW50ICk7XG4gIH1cbn07XG5cbi8vIC0tLS0tIGZpbHRlckZpbmRFbGVtZW50cyAtLS0tLSAvL1xuXG51dGlscy5maWx0ZXJGaW5kRWxlbWVudHMgPSBmdW5jdGlvbiggZWxlbXMsIHNlbGVjdG9yICkge1xuICAvLyBtYWtlIGFycmF5IG9mIGVsZW1zXG4gIGVsZW1zID0gdXRpbHMubWFrZUFycmF5KCBlbGVtcyApO1xuICB2YXIgZmZFbGVtcyA9IFtdO1xuXG4gIGZvciAoIHZhciBpPTAsIGxlbiA9IGVsZW1zLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgIHZhciBlbGVtID0gZWxlbXNbaV07XG4gICAgLy8gY2hlY2sgdGhhdCBlbGVtIGlzIGFuIGFjdHVhbCBlbGVtZW50XG4gICAgaWYgKCAhdXRpbHMuaXNFbGVtZW50KCBlbGVtICkgKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgLy8gZmlsdGVyICYgZmluZCBpdGVtcyBpZiB3ZSBoYXZlIGEgc2VsZWN0b3JcbiAgICBpZiAoIHNlbGVjdG9yICkge1xuICAgICAgLy8gZmlsdGVyIHNpYmxpbmdzXG4gICAgICBpZiAoIG1hdGNoZXNTZWxlY3RvciggZWxlbSwgc2VsZWN0b3IgKSApIHtcbiAgICAgICAgZmZFbGVtcy5wdXNoKCBlbGVtICk7XG4gICAgICB9XG4gICAgICAvLyBmaW5kIGNoaWxkcmVuXG4gICAgICB2YXIgY2hpbGRFbGVtcyA9IGVsZW0ucXVlcnlTZWxlY3RvckFsbCggc2VsZWN0b3IgKTtcbiAgICAgIC8vIGNvbmNhdCBjaGlsZEVsZW1zIHRvIGZpbHRlckZvdW5kIGFycmF5XG4gICAgICBmb3IgKCB2YXIgaj0wLCBqTGVuID0gY2hpbGRFbGVtcy5sZW5ndGg7IGogPCBqTGVuOyBqKysgKSB7XG4gICAgICAgIGZmRWxlbXMucHVzaCggY2hpbGRFbGVtc1tqXSApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmZkVsZW1zLnB1c2goIGVsZW0gKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmZFbGVtcztcbn07XG5cbi8vIC0tLS0tIGRlYm91bmNlTWV0aG9kIC0tLS0tIC8vXG5cbnV0aWxzLmRlYm91bmNlTWV0aG9kID0gZnVuY3Rpb24oIF9jbGFzcywgbWV0aG9kTmFtZSwgdGhyZXNob2xkICkge1xuICAvLyBvcmlnaW5hbCBtZXRob2RcbiAgdmFyIG1ldGhvZCA9IF9jbGFzcy5wcm90b3R5cGVbIG1ldGhvZE5hbWUgXTtcbiAgdmFyIHRpbWVvdXROYW1lID0gbWV0aG9kTmFtZSArICdUaW1lb3V0JztcblxuICBfY2xhc3MucHJvdG90eXBlWyBtZXRob2ROYW1lIF0gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGltZW91dCA9IHRoaXNbIHRpbWVvdXROYW1lIF07XG4gICAgaWYgKCB0aW1lb3V0ICkge1xuICAgICAgY2xlYXJUaW1lb3V0KCB0aW1lb3V0ICk7XG4gICAgfVxuICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuXG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB0aGlzWyB0aW1lb3V0TmFtZSBdID0gc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG4gICAgICBtZXRob2QuYXBwbHkoIF90aGlzLCBhcmdzICk7XG4gICAgICBkZWxldGUgX3RoaXNbIHRpbWVvdXROYW1lIF07XG4gICAgfSwgdGhyZXNob2xkIHx8IDEwMCApO1xuICB9O1xufTtcblxuLy8gLS0tLS0gaHRtbEluaXQgLS0tLS0gLy9cblxuLy8gaHR0cDovL2phbWVzcm9iZXJ0cy5uYW1lL2Jsb2cvMjAxMC8wMi8yMi9zdHJpbmctZnVuY3Rpb25zLWZvci1qYXZhc2NyaXB0LXRyaW0tdG8tY2FtZWwtY2FzZS10by1kYXNoZWQtYW5kLXRvLXVuZGVyc2NvcmUvXG51dGlscy50b0Rhc2hlZCA9IGZ1bmN0aW9uKCBzdHIgKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSggLyguKShbQS1aXSkvZywgZnVuY3Rpb24oIG1hdGNoLCAkMSwgJDIgKSB7XG4gICAgcmV0dXJuICQxICsgJy0nICsgJDI7XG4gIH0pLnRvTG93ZXJDYXNlKCk7XG59O1xuXG52YXIgY29uc29sZSA9IHdpbmRvdy5jb25zb2xlO1xuLyoqXG4gKiBhbGxvdyB1c2VyIHRvIGluaXRpYWxpemUgY2xhc3NlcyB2aWEgLmpzLW5hbWVzcGFjZSBjbGFzc1xuICogaHRtbEluaXQoIFdpZGdldCwgJ3dpZGdldE5hbWUnIClcbiAqIG9wdGlvbnMgYXJlIHBhcnNlZCBmcm9tIGRhdGEtbmFtZXNwYWNlLW9wdGlvbiBhdHRyaWJ1dGVcbiAqL1xudXRpbHMuaHRtbEluaXQgPSBmdW5jdGlvbiggV2lkZ2V0Q2xhc3MsIG5hbWVzcGFjZSApIHtcbiAgZG9jUmVhZHkoIGZ1bmN0aW9uKCkge1xuICAgIHZhciBkYXNoZWROYW1lc3BhY2UgPSB1dGlscy50b0Rhc2hlZCggbmFtZXNwYWNlICk7XG4gICAgdmFyIGVsZW1zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggJy5qcy0nICsgZGFzaGVkTmFtZXNwYWNlICk7XG4gICAgdmFyIGRhdGFBdHRyID0gJ2RhdGEtJyArIGRhc2hlZE5hbWVzcGFjZSArICctb3B0aW9ucyc7XG5cbiAgICBmb3IgKCB2YXIgaT0wLCBsZW4gPSBlbGVtcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgIHZhciBlbGVtID0gZWxlbXNbaV07XG4gICAgICB2YXIgYXR0ciA9IGVsZW0uZ2V0QXR0cmlidXRlKCBkYXRhQXR0ciApO1xuICAgICAgdmFyIG9wdGlvbnM7XG4gICAgICB0cnkge1xuICAgICAgICBvcHRpb25zID0gYXR0ciAmJiBKU09OLnBhcnNlKCBhdHRyICk7XG4gICAgICB9IGNhdGNoICggZXJyb3IgKSB7XG4gICAgICAgIC8vIGxvZyBlcnJvciwgZG8gbm90IGluaXRpYWxpemVcbiAgICAgICAgaWYgKCBjb25zb2xlICkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoICdFcnJvciBwYXJzaW5nICcgKyBkYXRhQXR0ciArICcgb24gJyArXG4gICAgICAgICAgICBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgKyAoIGVsZW0uaWQgPyAnIycgKyBlbGVtLmlkIDogJycgKSArICc6ICcgK1xuICAgICAgICAgICAgZXJyb3IgKTtcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8vIGluaXRpYWxpemVcbiAgICAgIHZhciBpbnN0YW5jZSA9IG5ldyBXaWRnZXRDbGFzcyggZWxlbSwgb3B0aW9ucyApO1xuICAgICAgLy8gbWFrZSBhdmFpbGFibGUgdmlhICQoKS5kYXRhKCdsYXlvdXRuYW1lJylcbiAgICAgIHZhciBqUXVlcnkgPSB3aW5kb3cualF1ZXJ5O1xuICAgICAgaWYgKCBqUXVlcnkgKSB7XG4gICAgICAgIGpRdWVyeS5kYXRhKCBlbGVtLCBuYW1lc3BhY2UsIGluc3RhbmNlICk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn07XG5cbi8vIC0tLS0tICAtLS0tLSAvL1xuXG5yZXR1cm4gdXRpbHM7XG5cbn0pKTtcbiIsIi8qIVxuICogZ2V0U2l6ZSB2MS4yLjJcbiAqIG1lYXN1cmUgc2l6ZSBvZiBlbGVtZW50c1xuICogTUlUIGxpY2Vuc2VcbiAqL1xuXG4vKmpzaGludCBicm93c2VyOiB0cnVlLCBzdHJpY3Q6IHRydWUsIHVuZGVmOiB0cnVlLCB1bnVzZWQ6IHRydWUgKi9cbi8qZ2xvYmFsIGRlZmluZTogZmFsc2UsIGV4cG9ydHM6IGZhbHNlLCByZXF1aXJlOiBmYWxzZSwgbW9kdWxlOiBmYWxzZSwgY29uc29sZTogZmFsc2UgKi9cblxuKCBmdW5jdGlvbiggd2luZG93LCB1bmRlZmluZWQgKSB7XG5cbid1c2Ugc3RyaWN0JztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGVscGVycyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4vLyBnZXQgYSBudW1iZXIgZnJvbSBhIHN0cmluZywgbm90IGEgcGVyY2VudGFnZVxuZnVuY3Rpb24gZ2V0U3R5bGVTaXplKCB2YWx1ZSApIHtcbiAgdmFyIG51bSA9IHBhcnNlRmxvYXQoIHZhbHVlICk7XG4gIC8vIG5vdCBhIHBlcmNlbnQgbGlrZSAnMTAwJScsIGFuZCBhIG51bWJlclxuICB2YXIgaXNWYWxpZCA9IHZhbHVlLmluZGV4T2YoJyUnKSA9PT0gLTEgJiYgIWlzTmFOKCBudW0gKTtcbiAgcmV0dXJuIGlzVmFsaWQgJiYgbnVtO1xufVxuXG5mdW5jdGlvbiBub29wKCkge31cblxudmFyIGxvZ0Vycm9yID0gdHlwZW9mIGNvbnNvbGUgPT09ICd1bmRlZmluZWQnID8gbm9vcCA6XG4gIGZ1bmN0aW9uKCBtZXNzYWdlICkge1xuICAgIGNvbnNvbGUuZXJyb3IoIG1lc3NhZ2UgKTtcbiAgfTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbWVhc3VyZW1lbnRzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbnZhciBtZWFzdXJlbWVudHMgPSBbXG4gICdwYWRkaW5nTGVmdCcsXG4gICdwYWRkaW5nUmlnaHQnLFxuICAncGFkZGluZ1RvcCcsXG4gICdwYWRkaW5nQm90dG9tJyxcbiAgJ21hcmdpbkxlZnQnLFxuICAnbWFyZ2luUmlnaHQnLFxuICAnbWFyZ2luVG9wJyxcbiAgJ21hcmdpbkJvdHRvbScsXG4gICdib3JkZXJMZWZ0V2lkdGgnLFxuICAnYm9yZGVyUmlnaHRXaWR0aCcsXG4gICdib3JkZXJUb3BXaWR0aCcsXG4gICdib3JkZXJCb3R0b21XaWR0aCdcbl07XG5cbmZ1bmN0aW9uIGdldFplcm9TaXplKCkge1xuICB2YXIgc2l6ZSA9IHtcbiAgICB3aWR0aDogMCxcbiAgICBoZWlnaHQ6IDAsXG4gICAgaW5uZXJXaWR0aDogMCxcbiAgICBpbm5lckhlaWdodDogMCxcbiAgICBvdXRlcldpZHRoOiAwLFxuICAgIG91dGVySGVpZ2h0OiAwXG4gIH07XG4gIGZvciAoIHZhciBpPTAsIGxlbiA9IG1lYXN1cmVtZW50cy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICB2YXIgbWVhc3VyZW1lbnQgPSBtZWFzdXJlbWVudHNbaV07XG4gICAgc2l6ZVsgbWVhc3VyZW1lbnQgXSA9IDA7XG4gIH1cbiAgcmV0dXJuIHNpemU7XG59XG5cblxuXG5mdW5jdGlvbiBkZWZpbmVHZXRTaXplKCBnZXRTdHlsZVByb3BlcnR5ICkge1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBzZXR1cCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG52YXIgaXNTZXR1cCA9IGZhbHNlO1xuXG52YXIgZ2V0U3R5bGUsIGJveFNpemluZ1Byb3AsIGlzQm94U2l6ZU91dGVyO1xuXG4vKipcbiAqIHNldHVwIHZhcnMgYW5kIGZ1bmN0aW9uc1xuICogZG8gaXQgb24gaW5pdGlhbCBnZXRTaXplKCksIHJhdGhlciB0aGFuIG9uIHNjcmlwdCBsb2FkXG4gKiBGb3IgRmlyZWZveCBidWcgaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NTQ4Mzk3XG4gKi9cbmZ1bmN0aW9uIHNldHVwKCkge1xuICAvLyBzZXR1cCBvbmNlXG4gIGlmICggaXNTZXR1cCApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaXNTZXR1cCA9IHRydWU7XG5cbiAgdmFyIGdldENvbXB1dGVkU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZTtcbiAgZ2V0U3R5bGUgPSAoIGZ1bmN0aW9uKCkge1xuICAgIHZhciBnZXRTdHlsZUZuID0gZ2V0Q29tcHV0ZWRTdHlsZSA/XG4gICAgICBmdW5jdGlvbiggZWxlbSApIHtcbiAgICAgICAgcmV0dXJuIGdldENvbXB1dGVkU3R5bGUoIGVsZW0sIG51bGwgKTtcbiAgICAgIH0gOlxuICAgICAgZnVuY3Rpb24oIGVsZW0gKSB7XG4gICAgICAgIHJldHVybiBlbGVtLmN1cnJlbnRTdHlsZTtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbiBnZXRTdHlsZSggZWxlbSApIHtcbiAgICAgICAgdmFyIHN0eWxlID0gZ2V0U3R5bGVGbiggZWxlbSApO1xuICAgICAgICBpZiAoICFzdHlsZSApIHtcbiAgICAgICAgICBsb2dFcnJvciggJ1N0eWxlIHJldHVybmVkICcgKyBzdHlsZSArXG4gICAgICAgICAgICAnLiBBcmUgeW91IHJ1bm5pbmcgdGhpcyBjb2RlIGluIGEgaGlkZGVuIGlmcmFtZSBvbiBGaXJlZm94PyAnICtcbiAgICAgICAgICAgICdTZWUgaHR0cDovL2JpdC5seS9nZXRzaXplYnVnMScgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3R5bGU7XG4gICAgICB9O1xuICB9KSgpO1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJveCBzaXppbmcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICBib3hTaXppbmdQcm9wID0gZ2V0U3R5bGVQcm9wZXJ0eSgnYm94U2l6aW5nJyk7XG5cbiAgLyoqXG4gICAqIFdlYktpdCBtZWFzdXJlcyB0aGUgb3V0ZXItd2lkdGggb24gc3R5bGUud2lkdGggb24gYm9yZGVyLWJveCBlbGVtc1xuICAgKiBJRSAmIEZpcmVmb3ggbWVhc3VyZXMgdGhlIGlubmVyLXdpZHRoXG4gICAqL1xuICBpZiAoIGJveFNpemluZ1Byb3AgKSB7XG4gICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGRpdi5zdHlsZS53aWR0aCA9ICcyMDBweCc7XG4gICAgZGl2LnN0eWxlLnBhZGRpbmcgPSAnMXB4IDJweCAzcHggNHB4JztcbiAgICBkaXYuc3R5bGUuYm9yZGVyU3R5bGUgPSAnc29saWQnO1xuICAgIGRpdi5zdHlsZS5ib3JkZXJXaWR0aCA9ICcxcHggMnB4IDNweCA0cHgnO1xuICAgIGRpdi5zdHlsZVsgYm94U2l6aW5nUHJvcCBdID0gJ2JvcmRlci1ib3gnO1xuXG4gICAgdmFyIGJvZHkgPSBkb2N1bWVudC5ib2R5IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgICBib2R5LmFwcGVuZENoaWxkKCBkaXYgKTtcbiAgICB2YXIgc3R5bGUgPSBnZXRTdHlsZSggZGl2ICk7XG5cbiAgICBpc0JveFNpemVPdXRlciA9IGdldFN0eWxlU2l6ZSggc3R5bGUud2lkdGggKSA9PT0gMjAwO1xuICAgIGJvZHkucmVtb3ZlQ2hpbGQoIGRpdiApO1xuICB9XG5cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZ2V0U2l6ZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5mdW5jdGlvbiBnZXRTaXplKCBlbGVtICkge1xuICBzZXR1cCgpO1xuXG4gIC8vIHVzZSBxdWVyeVNlbGV0b3IgaWYgZWxlbSBpcyBzdHJpbmdcbiAgaWYgKCB0eXBlb2YgZWxlbSA9PT0gJ3N0cmluZycgKSB7XG4gICAgZWxlbSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoIGVsZW0gKTtcbiAgfVxuXG4gIC8vIGRvIG5vdCBwcm9jZWVkIG9uIG5vbi1vYmplY3RzXG4gIGlmICggIWVsZW0gfHwgdHlwZW9mIGVsZW0gIT09ICdvYmplY3QnIHx8ICFlbGVtLm5vZGVUeXBlICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBzdHlsZSA9IGdldFN0eWxlKCBlbGVtICk7XG5cbiAgLy8gaWYgaGlkZGVuLCBldmVyeXRoaW5nIGlzIDBcbiAgaWYgKCBzdHlsZS5kaXNwbGF5ID09PSAnbm9uZScgKSB7XG4gICAgcmV0dXJuIGdldFplcm9TaXplKCk7XG4gIH1cblxuICB2YXIgc2l6ZSA9IHt9O1xuICBzaXplLndpZHRoID0gZWxlbS5vZmZzZXRXaWR0aDtcbiAgc2l6ZS5oZWlnaHQgPSBlbGVtLm9mZnNldEhlaWdodDtcblxuICB2YXIgaXNCb3JkZXJCb3ggPSBzaXplLmlzQm9yZGVyQm94ID0gISEoIGJveFNpemluZ1Byb3AgJiZcbiAgICBzdHlsZVsgYm94U2l6aW5nUHJvcCBdICYmIHN0eWxlWyBib3hTaXppbmdQcm9wIF0gPT09ICdib3JkZXItYm94JyApO1xuXG4gIC8vIGdldCBhbGwgbWVhc3VyZW1lbnRzXG4gIGZvciAoIHZhciBpPTAsIGxlbiA9IG1lYXN1cmVtZW50cy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICB2YXIgbWVhc3VyZW1lbnQgPSBtZWFzdXJlbWVudHNbaV07XG4gICAgdmFyIHZhbHVlID0gc3R5bGVbIG1lYXN1cmVtZW50IF07XG4gICAgdmFsdWUgPSBtdW5nZU5vblBpeGVsKCBlbGVtLCB2YWx1ZSApO1xuICAgIHZhciBudW0gPSBwYXJzZUZsb2F0KCB2YWx1ZSApO1xuICAgIC8vIGFueSAnYXV0bycsICdtZWRpdW0nIHZhbHVlIHdpbGwgYmUgMFxuICAgIHNpemVbIG1lYXN1cmVtZW50IF0gPSAhaXNOYU4oIG51bSApID8gbnVtIDogMDtcbiAgfVxuXG4gIHZhciBwYWRkaW5nV2lkdGggPSBzaXplLnBhZGRpbmdMZWZ0ICsgc2l6ZS5wYWRkaW5nUmlnaHQ7XG4gIHZhciBwYWRkaW5nSGVpZ2h0ID0gc2l6ZS5wYWRkaW5nVG9wICsgc2l6ZS5wYWRkaW5nQm90dG9tO1xuICB2YXIgbWFyZ2luV2lkdGggPSBzaXplLm1hcmdpbkxlZnQgKyBzaXplLm1hcmdpblJpZ2h0O1xuICB2YXIgbWFyZ2luSGVpZ2h0ID0gc2l6ZS5tYXJnaW5Ub3AgKyBzaXplLm1hcmdpbkJvdHRvbTtcbiAgdmFyIGJvcmRlcldpZHRoID0gc2l6ZS5ib3JkZXJMZWZ0V2lkdGggKyBzaXplLmJvcmRlclJpZ2h0V2lkdGg7XG4gIHZhciBib3JkZXJIZWlnaHQgPSBzaXplLmJvcmRlclRvcFdpZHRoICsgc2l6ZS5ib3JkZXJCb3R0b21XaWR0aDtcblxuICB2YXIgaXNCb3JkZXJCb3hTaXplT3V0ZXIgPSBpc0JvcmRlckJveCAmJiBpc0JveFNpemVPdXRlcjtcblxuICAvLyBvdmVyd3JpdGUgd2lkdGggYW5kIGhlaWdodCBpZiB3ZSBjYW4gZ2V0IGl0IGZyb20gc3R5bGVcbiAgdmFyIHN0eWxlV2lkdGggPSBnZXRTdHlsZVNpemUoIHN0eWxlLndpZHRoICk7XG4gIGlmICggc3R5bGVXaWR0aCAhPT0gZmFsc2UgKSB7XG4gICAgc2l6ZS53aWR0aCA9IHN0eWxlV2lkdGggK1xuICAgICAgLy8gYWRkIHBhZGRpbmcgYW5kIGJvcmRlciB1bmxlc3MgaXQncyBhbHJlYWR5IGluY2x1ZGluZyBpdFxuICAgICAgKCBpc0JvcmRlckJveFNpemVPdXRlciA/IDAgOiBwYWRkaW5nV2lkdGggKyBib3JkZXJXaWR0aCApO1xuICB9XG5cbiAgdmFyIHN0eWxlSGVpZ2h0ID0gZ2V0U3R5bGVTaXplKCBzdHlsZS5oZWlnaHQgKTtcbiAgaWYgKCBzdHlsZUhlaWdodCAhPT0gZmFsc2UgKSB7XG4gICAgc2l6ZS5oZWlnaHQgPSBzdHlsZUhlaWdodCArXG4gICAgICAvLyBhZGQgcGFkZGluZyBhbmQgYm9yZGVyIHVubGVzcyBpdCdzIGFscmVhZHkgaW5jbHVkaW5nIGl0XG4gICAgICAoIGlzQm9yZGVyQm94U2l6ZU91dGVyID8gMCA6IHBhZGRpbmdIZWlnaHQgKyBib3JkZXJIZWlnaHQgKTtcbiAgfVxuXG4gIHNpemUuaW5uZXJXaWR0aCA9IHNpemUud2lkdGggLSAoIHBhZGRpbmdXaWR0aCArIGJvcmRlcldpZHRoICk7XG4gIHNpemUuaW5uZXJIZWlnaHQgPSBzaXplLmhlaWdodCAtICggcGFkZGluZ0hlaWdodCArIGJvcmRlckhlaWdodCApO1xuXG4gIHNpemUub3V0ZXJXaWR0aCA9IHNpemUud2lkdGggKyBtYXJnaW5XaWR0aDtcbiAgc2l6ZS5vdXRlckhlaWdodCA9IHNpemUuaGVpZ2h0ICsgbWFyZ2luSGVpZ2h0O1xuXG4gIHJldHVybiBzaXplO1xufVxuXG4vLyBJRTggcmV0dXJucyBwZXJjZW50IHZhbHVlcywgbm90IHBpeGVsc1xuLy8gdGFrZW4gZnJvbSBqUXVlcnkncyBjdXJDU1NcbmZ1bmN0aW9uIG11bmdlTm9uUGl4ZWwoIGVsZW0sIHZhbHVlICkge1xuICAvLyBJRTggYW5kIGhhcyBwZXJjZW50IHZhbHVlXG4gIGlmICggd2luZG93LmdldENvbXB1dGVkU3R5bGUgfHwgdmFsdWUuaW5kZXhPZignJScpID09PSAtMSApIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgdmFyIHN0eWxlID0gZWxlbS5zdHlsZTtcbiAgLy8gUmVtZW1iZXIgdGhlIG9yaWdpbmFsIHZhbHVlc1xuICB2YXIgbGVmdCA9IHN0eWxlLmxlZnQ7XG4gIHZhciBycyA9IGVsZW0ucnVudGltZVN0eWxlO1xuICB2YXIgcnNMZWZ0ID0gcnMgJiYgcnMubGVmdDtcblxuICAvLyBQdXQgaW4gdGhlIG5ldyB2YWx1ZXMgdG8gZ2V0IGEgY29tcHV0ZWQgdmFsdWUgb3V0XG4gIGlmICggcnNMZWZ0ICkge1xuICAgIHJzLmxlZnQgPSBlbGVtLmN1cnJlbnRTdHlsZS5sZWZ0O1xuICB9XG4gIHN0eWxlLmxlZnQgPSB2YWx1ZTtcbiAgdmFsdWUgPSBzdHlsZS5waXhlbExlZnQ7XG5cbiAgLy8gUmV2ZXJ0IHRoZSBjaGFuZ2VkIHZhbHVlc1xuICBzdHlsZS5sZWZ0ID0gbGVmdDtcbiAgaWYgKCByc0xlZnQgKSB7XG4gICAgcnMubGVmdCA9IHJzTGVmdDtcbiAgfVxuXG4gIHJldHVybiB2YWx1ZTtcbn1cblxucmV0dXJuIGdldFNpemU7XG5cbn1cblxuLy8gdHJhbnNwb3J0XG5pZiAoIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgLy8gQU1EIGZvciBSZXF1aXJlSlNcbiAgZGVmaW5lKCBbICdnZXQtc3R5bGUtcHJvcGVydHkvZ2V0LXN0eWxlLXByb3BlcnR5JyBdLCBkZWZpbmVHZXRTaXplICk7XG59IGVsc2UgaWYgKCB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgKSB7XG4gIC8vIENvbW1vbkpTIGZvciBDb21wb25lbnRcbiAgbW9kdWxlLmV4cG9ydHMgPSBkZWZpbmVHZXRTaXplKCByZXF1aXJlKCdkZXNhbmRyby1nZXQtc3R5bGUtcHJvcGVydHknKSApO1xufSBlbHNlIHtcbiAgLy8gYnJvd3NlciBnbG9iYWxcbiAgd2luZG93LmdldFNpemUgPSBkZWZpbmVHZXRTaXplKCB3aW5kb3cuZ2V0U3R5bGVQcm9wZXJ0eSApO1xufVxuXG59KSggd2luZG93ICk7XG4iLCIvKiFcbiAqIFVuaXBvaW50ZXIgdjEuMS4wXG4gKiBiYXNlIGNsYXNzIGZvciBkb2luZyBvbmUgdGhpbmcgd2l0aCBwb2ludGVyIGV2ZW50XG4gKiBNSVQgbGljZW5zZVxuICovXG5cbi8qanNoaW50IGJyb3dzZXI6IHRydWUsIHVuZGVmOiB0cnVlLCB1bnVzZWQ6IHRydWUsIHN0cmljdDogdHJ1ZSAqL1xuLypnbG9iYWwgZGVmaW5lOiBmYWxzZSwgbW9kdWxlOiBmYWxzZSwgcmVxdWlyZTogZmFsc2UgKi9cblxuKCBmdW5jdGlvbiggd2luZG93LCBmYWN0b3J5ICkge1xuICAndXNlIHN0cmljdCc7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIGlmICggdHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCBbXG4gICAgICAnZXZlbnRFbWl0dGVyL0V2ZW50RW1pdHRlcicsXG4gICAgICAnZXZlbnRpZS9ldmVudGllJ1xuICAgIF0sIGZ1bmN0aW9uKCBFdmVudEVtaXR0ZXIsIGV2ZW50aWUgKSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSggd2luZG93LCBFdmVudEVtaXR0ZXIsIGV2ZW50aWUgKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIGV4cG9ydHMgPT0gJ29iamVjdCcgKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICByZXF1aXJlKCd3b2xmeTg3LWV2ZW50ZW1pdHRlcicpLFxuICAgICAgcmVxdWlyZSgnZXZlbnRpZScpXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5Vbmlwb2ludGVyID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHdpbmRvdy5FdmVudEVtaXR0ZXIsXG4gICAgICB3aW5kb3cuZXZlbnRpZVxuICAgICk7XG4gIH1cblxufSggd2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KCB3aW5kb3csIEV2ZW50RW1pdHRlciwgZXZlbnRpZSApIHtcblxuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxuZnVuY3Rpb24gVW5pcG9pbnRlcigpIHt9XG5cbi8vIGluaGVyaXQgRXZlbnRFbWl0dGVyXG5Vbmlwb2ludGVyLnByb3RvdHlwZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuVW5pcG9pbnRlci5wcm90b3R5cGUuYmluZFN0YXJ0RXZlbnQgPSBmdW5jdGlvbiggZWxlbSApIHtcbiAgdGhpcy5fYmluZFN0YXJ0RXZlbnQoIGVsZW0sIHRydWUgKTtcbn07XG5cblVuaXBvaW50ZXIucHJvdG90eXBlLnVuYmluZFN0YXJ0RXZlbnQgPSBmdW5jdGlvbiggZWxlbSApIHtcbiAgdGhpcy5fYmluZFN0YXJ0RXZlbnQoIGVsZW0sIGZhbHNlICk7XG59O1xuXG4vKipcbiAqIHdvcmtzIGFzIHVuYmluZGVyLCBhcyB5b3UgY2FuIC5fYmluZFN0YXJ0KCBmYWxzZSApIHRvIHVuYmluZFxuICogQHBhcmFtIHtCb29sZWFufSBpc0JpbmQgLSB3aWxsIHVuYmluZCBpZiBmYWxzZXlcbiAqL1xuVW5pcG9pbnRlci5wcm90b3R5cGUuX2JpbmRTdGFydEV2ZW50ID0gZnVuY3Rpb24oIGVsZW0sIGlzQmluZCApIHtcbiAgLy8gbXVuZ2UgaXNCaW5kLCBkZWZhdWx0IHRvIHRydWVcbiAgaXNCaW5kID0gaXNCaW5kID09PSB1bmRlZmluZWQgPyB0cnVlIDogISFpc0JpbmQ7XG4gIHZhciBiaW5kTWV0aG9kID0gaXNCaW5kID8gJ2JpbmQnIDogJ3VuYmluZCc7XG5cbiAgaWYgKCB3aW5kb3cubmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkICkge1xuICAgIC8vIFczQyBQb2ludGVyIEV2ZW50cywgSUUxMS4gU2VlIGh0dHBzOi8vY29kZXJ3YWxsLmNvbS9wL21mcmVjYVxuICAgIGV2ZW50aWVbIGJpbmRNZXRob2QgXSggZWxlbSwgJ3BvaW50ZXJkb3duJywgdGhpcyApO1xuICB9IGVsc2UgaWYgKCB3aW5kb3cubmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQgKSB7XG4gICAgLy8gSUUxMCBQb2ludGVyIEV2ZW50c1xuICAgIGV2ZW50aWVbIGJpbmRNZXRob2QgXSggZWxlbSwgJ01TUG9pbnRlckRvd24nLCB0aGlzICk7XG4gIH0gZWxzZSB7XG4gICAgLy8gbGlzdGVuIGZvciBib3RoLCBmb3IgZGV2aWNlcyBsaWtlIENocm9tZSBQaXhlbFxuICAgIGV2ZW50aWVbIGJpbmRNZXRob2QgXSggZWxlbSwgJ21vdXNlZG93bicsIHRoaXMgKTtcbiAgICBldmVudGllWyBiaW5kTWV0aG9kIF0oIGVsZW0sICd0b3VjaHN0YXJ0JywgdGhpcyApO1xuICB9XG59O1xuXG4vLyB0cmlnZ2VyIGhhbmRsZXIgbWV0aG9kcyBmb3IgZXZlbnRzXG5Vbmlwb2ludGVyLnByb3RvdHlwZS5oYW5kbGVFdmVudCA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgdmFyIG1ldGhvZCA9ICdvbicgKyBldmVudC50eXBlO1xuICBpZiAoIHRoaXNbIG1ldGhvZCBdICkge1xuICAgIHRoaXNbIG1ldGhvZCBdKCBldmVudCApO1xuICB9XG59O1xuXG4vLyByZXR1cm5zIHRoZSB0b3VjaCB0aGF0IHdlJ3JlIGtlZXBpbmcgdHJhY2sgb2ZcblVuaXBvaW50ZXIucHJvdG90eXBlLmdldFRvdWNoID0gZnVuY3Rpb24oIHRvdWNoZXMgKSB7XG4gIGZvciAoIHZhciBpPTAsIGxlbiA9IHRvdWNoZXMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgdmFyIHRvdWNoID0gdG91Y2hlc1tpXTtcbiAgICBpZiAoIHRvdWNoLmlkZW50aWZpZXIgPT0gdGhpcy5wb2ludGVySWRlbnRpZmllciApIHtcbiAgICAgIHJldHVybiB0b3VjaDtcbiAgICB9XG4gIH1cbn07XG5cbi8vIC0tLS0tIHN0YXJ0IGV2ZW50IC0tLS0tIC8vXG5cblVuaXBvaW50ZXIucHJvdG90eXBlLm9ubW91c2Vkb3duID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICAvLyBkaXNtaXNzIGNsaWNrcyBmcm9tIHJpZ2h0IG9yIG1pZGRsZSBidXR0b25zXG4gIHZhciBidXR0b24gPSBldmVudC5idXR0b247XG4gIGlmICggYnV0dG9uICYmICggYnV0dG9uICE9PSAwICYmIGJ1dHRvbiAhPT0gMSApICkge1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLl9wb2ludGVyRG93biggZXZlbnQsIGV2ZW50ICk7XG59O1xuXG5Vbmlwb2ludGVyLnByb3RvdHlwZS5vbnRvdWNoc3RhcnQgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gIHRoaXMuX3BvaW50ZXJEb3duKCBldmVudCwgZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0gKTtcbn07XG5cblVuaXBvaW50ZXIucHJvdG90eXBlLm9uTVNQb2ludGVyRG93biA9XG5Vbmlwb2ludGVyLnByb3RvdHlwZS5vbnBvaW50ZXJkb3duID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICB0aGlzLl9wb2ludGVyRG93biggZXZlbnQsIGV2ZW50ICk7XG59O1xuXG4vKipcbiAqIHBvaW50ZXIgc3RhcnRcbiAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gKiBAcGFyYW0ge0V2ZW50IG9yIFRvdWNofSBwb2ludGVyXG4gKi9cblVuaXBvaW50ZXIucHJvdG90eXBlLl9wb2ludGVyRG93biA9IGZ1bmN0aW9uKCBldmVudCwgcG9pbnRlciApIHtcbiAgLy8gZGlzbWlzcyBvdGhlciBwb2ludGVyc1xuICBpZiAoIHRoaXMuaXNQb2ludGVyRG93biApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLmlzUG9pbnRlckRvd24gPSB0cnVlO1xuICAvLyBzYXZlIHBvaW50ZXIgaWRlbnRpZmllciB0byBtYXRjaCB1cCB0b3VjaCBldmVudHNcbiAgdGhpcy5wb2ludGVySWRlbnRpZmllciA9IHBvaW50ZXIucG9pbnRlcklkICE9PSB1bmRlZmluZWQgP1xuICAgIC8vIHBvaW50ZXJJZCBmb3IgcG9pbnRlciBldmVudHMsIHRvdWNoLmluZGVudGlmaWVyIGZvciB0b3VjaCBldmVudHNcbiAgICBwb2ludGVyLnBvaW50ZXJJZCA6IHBvaW50ZXIuaWRlbnRpZmllcjtcblxuICB0aGlzLnBvaW50ZXJEb3duKCBldmVudCwgcG9pbnRlciApO1xufTtcblxuVW5pcG9pbnRlci5wcm90b3R5cGUucG9pbnRlckRvd24gPSBmdW5jdGlvbiggZXZlbnQsIHBvaW50ZXIgKSB7XG4gIHRoaXMuX2JpbmRQb3N0U3RhcnRFdmVudHMoIGV2ZW50ICk7XG4gIHRoaXMuZW1pdEV2ZW50KCAncG9pbnRlckRvd24nLCBbIGV2ZW50LCBwb2ludGVyIF0gKTtcbn07XG5cbi8vIGhhc2ggb2YgZXZlbnRzIHRvIGJlIGJvdW5kIGFmdGVyIHN0YXJ0IGV2ZW50XG52YXIgcG9zdFN0YXJ0RXZlbnRzID0ge1xuICBtb3VzZWRvd246IFsgJ21vdXNlbW92ZScsICdtb3VzZXVwJyBdLFxuICB0b3VjaHN0YXJ0OiBbICd0b3VjaG1vdmUnLCAndG91Y2hlbmQnLCAndG91Y2hjYW5jZWwnIF0sXG4gIHBvaW50ZXJkb3duOiBbICdwb2ludGVybW92ZScsICdwb2ludGVydXAnLCAncG9pbnRlcmNhbmNlbCcgXSxcbiAgTVNQb2ludGVyRG93bjogWyAnTVNQb2ludGVyTW92ZScsICdNU1BvaW50ZXJVcCcsICdNU1BvaW50ZXJDYW5jZWwnIF1cbn07XG5cblVuaXBvaW50ZXIucHJvdG90eXBlLl9iaW5kUG9zdFN0YXJ0RXZlbnRzID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICBpZiAoICFldmVudCApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gZ2V0IHByb3BlciBldmVudHMgdG8gbWF0Y2ggc3RhcnQgZXZlbnRcbiAgdmFyIGV2ZW50cyA9IHBvc3RTdGFydEV2ZW50c1sgZXZlbnQudHlwZSBdO1xuICAvLyBJRTggbmVlZHMgdG8gYmUgYm91bmQgdG8gZG9jdW1lbnRcbiAgdmFyIG5vZGUgPSBldmVudC5wcmV2ZW50RGVmYXVsdCA/IHdpbmRvdyA6IGRvY3VtZW50O1xuICAvLyBiaW5kIGV2ZW50cyB0byBub2RlXG4gIGZvciAoIHZhciBpPTAsIGxlbiA9IGV2ZW50cy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICB2YXIgZXZudCA9IGV2ZW50c1tpXTtcbiAgICBldmVudGllLmJpbmQoIG5vZGUsIGV2bnQsIHRoaXMgKTtcbiAgfVxuICAvLyBzYXZlIHRoZXNlIGFyZ3VtZW50c1xuICB0aGlzLl9ib3VuZFBvaW50ZXJFdmVudHMgPSB7XG4gICAgZXZlbnRzOiBldmVudHMsXG4gICAgbm9kZTogbm9kZVxuICB9O1xufTtcblxuVW5pcG9pbnRlci5wcm90b3R5cGUuX3VuYmluZFBvc3RTdGFydEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYXJncyA9IHRoaXMuX2JvdW5kUG9pbnRlckV2ZW50cztcbiAgLy8gSUU4IGNhbiB0cmlnZ2VyIGRyYWdFbmQgdHdpY2UsIGNoZWNrIGZvciBfYm91bmRFdmVudHNcbiAgaWYgKCAhYXJncyB8fCAhYXJncy5ldmVudHMgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgZm9yICggdmFyIGk9MCwgbGVuID0gYXJncy5ldmVudHMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgdmFyIGV2ZW50ID0gYXJncy5ldmVudHNbaV07XG4gICAgZXZlbnRpZS51bmJpbmQoIGFyZ3Mubm9kZSwgZXZlbnQsIHRoaXMgKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fYm91bmRQb2ludGVyRXZlbnRzO1xufTtcblxuLy8gLS0tLS0gbW92ZSBldmVudCAtLS0tLSAvL1xuXG5Vbmlwb2ludGVyLnByb3RvdHlwZS5vbm1vdXNlbW92ZSA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgdGhpcy5fcG9pbnRlck1vdmUoIGV2ZW50LCBldmVudCApO1xufTtcblxuVW5pcG9pbnRlci5wcm90b3R5cGUub25NU1BvaW50ZXJNb3ZlID1cblVuaXBvaW50ZXIucHJvdG90eXBlLm9ucG9pbnRlcm1vdmUgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gIGlmICggZXZlbnQucG9pbnRlcklkID09IHRoaXMucG9pbnRlcklkZW50aWZpZXIgKSB7XG4gICAgdGhpcy5fcG9pbnRlck1vdmUoIGV2ZW50LCBldmVudCApO1xuICB9XG59O1xuXG5Vbmlwb2ludGVyLnByb3RvdHlwZS5vbnRvdWNobW92ZSA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgdmFyIHRvdWNoID0gdGhpcy5nZXRUb3VjaCggZXZlbnQuY2hhbmdlZFRvdWNoZXMgKTtcbiAgaWYgKCB0b3VjaCApIHtcbiAgICB0aGlzLl9wb2ludGVyTW92ZSggZXZlbnQsIHRvdWNoICk7XG4gIH1cbn07XG5cbi8qKlxuICogcG9pbnRlciBtb3ZlXG4gKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICogQHBhcmFtIHtFdmVudCBvciBUb3VjaH0gcG9pbnRlclxuICogQHByaXZhdGVcbiAqL1xuVW5pcG9pbnRlci5wcm90b3R5cGUuX3BvaW50ZXJNb3ZlID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyICkge1xuICB0aGlzLnBvaW50ZXJNb3ZlKCBldmVudCwgcG9pbnRlciApO1xufTtcblxuLy8gcHVibGljXG5Vbmlwb2ludGVyLnByb3RvdHlwZS5wb2ludGVyTW92ZSA9IGZ1bmN0aW9uKCBldmVudCwgcG9pbnRlciApIHtcbiAgdGhpcy5lbWl0RXZlbnQoICdwb2ludGVyTW92ZScsIFsgZXZlbnQsIHBvaW50ZXIgXSApO1xufTtcblxuLy8gLS0tLS0gZW5kIGV2ZW50IC0tLS0tIC8vXG5cblxuVW5pcG9pbnRlci5wcm90b3R5cGUub25tb3VzZXVwID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICB0aGlzLl9wb2ludGVyVXAoIGV2ZW50LCBldmVudCApO1xufTtcblxuVW5pcG9pbnRlci5wcm90b3R5cGUub25NU1BvaW50ZXJVcCA9XG5Vbmlwb2ludGVyLnByb3RvdHlwZS5vbnBvaW50ZXJ1cCA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgaWYgKCBldmVudC5wb2ludGVySWQgPT0gdGhpcy5wb2ludGVySWRlbnRpZmllciApIHtcbiAgICB0aGlzLl9wb2ludGVyVXAoIGV2ZW50LCBldmVudCApO1xuICB9XG59O1xuXG5Vbmlwb2ludGVyLnByb3RvdHlwZS5vbnRvdWNoZW5kID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICB2YXIgdG91Y2ggPSB0aGlzLmdldFRvdWNoKCBldmVudC5jaGFuZ2VkVG91Y2hlcyApO1xuICBpZiAoIHRvdWNoICkge1xuICAgIHRoaXMuX3BvaW50ZXJVcCggZXZlbnQsIHRvdWNoICk7XG4gIH1cbn07XG5cbi8qKlxuICogcG9pbnRlciB1cFxuICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAqIEBwYXJhbSB7RXZlbnQgb3IgVG91Y2h9IHBvaW50ZXJcbiAqIEBwcml2YXRlXG4gKi9cblVuaXBvaW50ZXIucHJvdG90eXBlLl9wb2ludGVyVXAgPSBmdW5jdGlvbiggZXZlbnQsIHBvaW50ZXIgKSB7XG4gIHRoaXMuX3BvaW50ZXJEb25lKCk7XG4gIHRoaXMucG9pbnRlclVwKCBldmVudCwgcG9pbnRlciApO1xufTtcblxuLy8gcHVibGljXG5Vbmlwb2ludGVyLnByb3RvdHlwZS5wb2ludGVyVXAgPSBmdW5jdGlvbiggZXZlbnQsIHBvaW50ZXIgKSB7XG4gIHRoaXMuZW1pdEV2ZW50KCAncG9pbnRlclVwJywgWyBldmVudCwgcG9pbnRlciBdICk7XG59O1xuXG4vLyAtLS0tLSBwb2ludGVyIGRvbmUgLS0tLS0gLy9cblxuLy8gdHJpZ2dlcmVkIG9uIHBvaW50ZXIgdXAgJiBwb2ludGVyIGNhbmNlbFxuVW5pcG9pbnRlci5wcm90b3R5cGUuX3BvaW50ZXJEb25lID0gZnVuY3Rpb24oKSB7XG4gIC8vIHJlc2V0IHByb3BlcnRpZXNcbiAgdGhpcy5pc1BvaW50ZXJEb3duID0gZmFsc2U7XG4gIGRlbGV0ZSB0aGlzLnBvaW50ZXJJZGVudGlmaWVyO1xuICAvLyByZW1vdmUgZXZlbnRzXG4gIHRoaXMuX3VuYmluZFBvc3RTdGFydEV2ZW50cygpO1xuICB0aGlzLnBvaW50ZXJEb25lKCk7XG59O1xuXG5Vbmlwb2ludGVyLnByb3RvdHlwZS5wb2ludGVyRG9uZSA9IG5vb3A7XG5cbi8vIC0tLS0tIHBvaW50ZXIgY2FuY2VsIC0tLS0tIC8vXG5cblVuaXBvaW50ZXIucHJvdG90eXBlLm9uTVNQb2ludGVyQ2FuY2VsID1cblVuaXBvaW50ZXIucHJvdG90eXBlLm9ucG9pbnRlcmNhbmNlbCA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgaWYgKCBldmVudC5wb2ludGVySWQgPT0gdGhpcy5wb2ludGVySWRlbnRpZmllciApIHtcbiAgICB0aGlzLl9wb2ludGVyQ2FuY2VsKCBldmVudCwgZXZlbnQgKTtcbiAgfVxufTtcblxuVW5pcG9pbnRlci5wcm90b3R5cGUub250b3VjaGNhbmNlbCA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgdmFyIHRvdWNoID0gdGhpcy5nZXRUb3VjaCggZXZlbnQuY2hhbmdlZFRvdWNoZXMgKTtcbiAgaWYgKCB0b3VjaCApIHtcbiAgICB0aGlzLl9wb2ludGVyQ2FuY2VsKCBldmVudCwgdG91Y2ggKTtcbiAgfVxufTtcblxuLyoqXG4gKiBwb2ludGVyIGNhbmNlbFxuICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAqIEBwYXJhbSB7RXZlbnQgb3IgVG91Y2h9IHBvaW50ZXJcbiAqIEBwcml2YXRlXG4gKi9cblVuaXBvaW50ZXIucHJvdG90eXBlLl9wb2ludGVyQ2FuY2VsID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyICkge1xuICB0aGlzLl9wb2ludGVyRG9uZSgpO1xuICB0aGlzLnBvaW50ZXJDYW5jZWwoIGV2ZW50LCBwb2ludGVyICk7XG59O1xuXG4vLyBwdWJsaWNcblVuaXBvaW50ZXIucHJvdG90eXBlLnBvaW50ZXJDYW5jZWwgPSBmdW5jdGlvbiggZXZlbnQsIHBvaW50ZXIgKSB7XG4gIHRoaXMuZW1pdEV2ZW50KCAncG9pbnRlckNhbmNlbCcsIFsgZXZlbnQsIHBvaW50ZXIgXSApO1xufTtcblxuLy8gLS0tLS0gIC0tLS0tIC8vXG5cbi8vIHV0aWxpdHkgZnVuY3Rpb24gZm9yIGdldHRpbmcgeC95IGNvb3JpZGluYXRlcyBmcm9tIGV2ZW50LCBiZWNhdXNlIElFOFxuVW5pcG9pbnRlci5nZXRQb2ludGVyUG9pbnQgPSBmdW5jdGlvbiggcG9pbnRlciApIHtcbiAgcmV0dXJuIHtcbiAgICB4OiBwb2ludGVyLnBhZ2VYICE9PSB1bmRlZmluZWQgPyBwb2ludGVyLnBhZ2VYIDogcG9pbnRlci5jbGllbnRYLFxuICAgIHk6IHBvaW50ZXIucGFnZVkgIT09IHVuZGVmaW5lZCA/IHBvaW50ZXIucGFnZVkgOiBwb2ludGVyLmNsaWVudFlcbiAgfTtcbn07XG5cbi8vIC0tLS0tICAtLS0tLSAvL1xuXG5yZXR1cm4gVW5pcG9pbnRlcjtcblxufSkpO1xuIiwiLyohXG4gKiBUYXAgbGlzdGVuZXIgdjEuMS4xXG4gKiBsaXN0ZW5zIHRvIHRhcHNcbiAqIE1JVCBsaWNlbnNlXG4gKi9cblxuLypqc2hpbnQgYnJvd3NlcjogdHJ1ZSwgdW51c2VkOiB0cnVlLCB1bmRlZjogdHJ1ZSwgc3RyaWN0OiB0cnVlICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdywgZmFjdG9yeSApIHtcbiAgLypnbG9iYWwgZGVmaW5lOiBmYWxzZSwgbW9kdWxlOiBmYWxzZSwgcmVxdWlyZTogZmFsc2UgKi9cbiAgJ3VzZSBzdHJpY3QnO1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICBpZiAoIHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSggW1xuICAgICAgJ3VuaXBvaW50ZXIvdW5pcG9pbnRlcidcbiAgICBdLCBmdW5jdGlvbiggVW5pcG9pbnRlciApIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KCB3aW5kb3csIFVuaXBvaW50ZXIgKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIGV4cG9ydHMgPT0gJ29iamVjdCcgKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICByZXF1aXJlKCd1bmlwb2ludGVyJylcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93LlRhcExpc3RlbmVyID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHdpbmRvdy5Vbmlwb2ludGVyXG4gICAgKTtcbiAgfVxuXG59KCB3aW5kb3csIGZ1bmN0aW9uIGZhY3RvcnkoIHdpbmRvdywgVW5pcG9pbnRlciApIHtcblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBoYW5kbGUgSUU4IHByZXZlbnQgZGVmYXVsdFxuZnVuY3Rpb24gcHJldmVudERlZmF1bHRFdmVudCggZXZlbnQgKSB7XG4gIGlmICggZXZlbnQucHJldmVudERlZmF1bHQgKSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgfSBlbHNlIHtcbiAgICBldmVudC5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICBUYXBMaXN0ZW5lciAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5mdW5jdGlvbiBUYXBMaXN0ZW5lciggZWxlbSApIHtcbiAgdGhpcy5iaW5kVGFwKCBlbGVtICk7XG59XG5cbi8vIGluaGVyaXQgVW5pcG9pbnRlciAmIEV2ZW50RW1pdHRlclxuVGFwTGlzdGVuZXIucHJvdG90eXBlID0gbmV3IFVuaXBvaW50ZXIoKTtcblxuLyoqXG4gKiBiaW5kIHRhcCBldmVudCB0byBlbGVtZW50XG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1cbiAqL1xuVGFwTGlzdGVuZXIucHJvdG90eXBlLmJpbmRUYXAgPSBmdW5jdGlvbiggZWxlbSApIHtcbiAgaWYgKCAhZWxlbSApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy51bmJpbmRUYXAoKTtcbiAgdGhpcy50YXBFbGVtZW50ID0gZWxlbTtcbiAgdGhpcy5fYmluZFN0YXJ0RXZlbnQoIGVsZW0sIHRydWUgKTtcbn07XG5cblRhcExpc3RlbmVyLnByb3RvdHlwZS51bmJpbmRUYXAgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCAhdGhpcy50YXBFbGVtZW50ICkge1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLl9iaW5kU3RhcnRFdmVudCggdGhpcy50YXBFbGVtZW50LCB0cnVlICk7XG4gIGRlbGV0ZSB0aGlzLnRhcEVsZW1lbnQ7XG59O1xuXG52YXIgcG9pbnRlckRvd24gPSBUYXBMaXN0ZW5lci5wcm90b3R5cGUucG9pbnRlckRvd247XG5cblRhcExpc3RlbmVyLnByb3RvdHlwZS5wb2ludGVyRG93biA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgLy8gcHJldmVudCBkZWZhdWx0IGV2ZW50IGZvciB0b3VjaCwgZGlzYWJsZXMgdGFwIHRoZW4gY2xpY2tcbiAgaWYgKCBldmVudC50eXBlID09ICd0b3VjaHN0YXJ0JyApIHtcbiAgICBwcmV2ZW50RGVmYXVsdEV2ZW50KCBldmVudCApO1xuICB9XG4gIHBvaW50ZXJEb3duLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbn07XG5cbnZhciBpc1BhZ2VPZmZzZXQgPSB3aW5kb3cucGFnZVlPZmZzZXQgIT09IHVuZGVmaW5lZDtcbi8qKlxuICogcG9pbnRlciB1cFxuICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAqIEBwYXJhbSB7RXZlbnQgb3IgVG91Y2h9IHBvaW50ZXJcbiAqL1xuVGFwTGlzdGVuZXIucHJvdG90eXBlLnBvaW50ZXJVcCA9IGZ1bmN0aW9uKCBldmVudCwgcG9pbnRlciApIHtcbiAgdmFyIHBvaW50ZXJQb2ludCA9IFVuaXBvaW50ZXIuZ2V0UG9pbnRlclBvaW50KCBwb2ludGVyICk7XG4gIHZhciBib3VuZGluZ1JlY3QgPSB0aGlzLnRhcEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIC8vIHN0YW5kYXJkIG9yIElFOCBzY3JvbGwgcG9zaXRpb25zXG4gIHZhciBzY3JvbGxYID0gaXNQYWdlT2Zmc2V0ID8gd2luZG93LnBhZ2VYT2Zmc2V0IDogZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0O1xuICB2YXIgc2Nyb2xsWSA9IGlzUGFnZU9mZnNldCA/IHdpbmRvdy5wYWdlWU9mZnNldCA6IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wO1xuICAvLyBjYWxjdWxhdGUgaWYgcG9pbnRlciBpcyBpbnNpZGUgdGFwRWxlbWVudFxuICB2YXIgaXNJbnNpZGUgPSBwb2ludGVyUG9pbnQueCA+PSBib3VuZGluZ1JlY3QubGVmdCArIHNjcm9sbFggJiZcbiAgICBwb2ludGVyUG9pbnQueCA8PSBib3VuZGluZ1JlY3QucmlnaHQgKyBzY3JvbGxYICYmXG4gICAgcG9pbnRlclBvaW50LnkgPj0gYm91bmRpbmdSZWN0LnRvcCArIHNjcm9sbFkgJiZcbiAgICBwb2ludGVyUG9pbnQueSA8PSBib3VuZGluZ1JlY3QuYm90dG9tICsgc2Nyb2xsWTtcbiAgLy8gdHJpZ2dlciBjYWxsYmFjayBpZiBwb2ludGVyIGlzIGluc2lkZSBlbGVtZW50XG4gIGlmICggaXNJbnNpZGUgKSB7XG4gICAgdGhpcy5lbWl0RXZlbnQoICd0YXAnLCBbIGV2ZW50LCBwb2ludGVyIF0gKTtcbiAgfVxufTtcblxuVGFwTGlzdGVuZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wb2ludGVyRG9uZSgpO1xuICB0aGlzLnVuYmluZFRhcCgpO1xufTtcblxuLy8gLS0tLS0gIC0tLS0tIC8vXG5cbnJldHVybiBUYXBMaXN0ZW5lcjtcblxufSkpO1xuIiwiLyohXG4gKiBVbmlkcmFnZ2VyIHYxLjEuM1xuICogRHJhZ2dhYmxlIGJhc2UgY2xhc3NcbiAqIE1JVCBsaWNlbnNlXG4gKi9cblxuLypqc2hpbnQgYnJvd3NlcjogdHJ1ZSwgdW51c2VkOiB0cnVlLCB1bmRlZjogdHJ1ZSwgc3RyaWN0OiB0cnVlICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdywgZmFjdG9yeSApIHtcbiAgLypnbG9iYWwgZGVmaW5lOiBmYWxzZSwgbW9kdWxlOiBmYWxzZSwgcmVxdWlyZTogZmFsc2UgKi9cbiAgJ3VzZSBzdHJpY3QnO1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICBpZiAoIHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSggW1xuICAgICAgJ2V2ZW50aWUvZXZlbnRpZScsXG4gICAgICAndW5pcG9pbnRlci91bmlwb2ludGVyJ1xuICAgIF0sIGZ1bmN0aW9uKCBldmVudGllLCBVbmlwb2ludGVyICkge1xuICAgICAgcmV0dXJuIGZhY3RvcnkoIHdpbmRvdywgZXZlbnRpZSwgVW5pcG9pbnRlciApO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCB0eXBlb2YgZXhwb3J0cyA9PSAnb2JqZWN0JyApIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHJlcXVpcmUoJ2V2ZW50aWUnKSxcbiAgICAgIHJlcXVpcmUoJ3VuaXBvaW50ZXInKVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cuVW5pZHJhZ2dlciA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICB3aW5kb3cuZXZlbnRpZSxcbiAgICAgIHdpbmRvdy5Vbmlwb2ludGVyXG4gICAgKTtcbiAgfVxuXG59KCB3aW5kb3csIGZ1bmN0aW9uIGZhY3RvcnkoIHdpbmRvdywgZXZlbnRpZSwgVW5pcG9pbnRlciApIHtcblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyAtLS0tLSAgLS0tLS0gLy9cblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbi8vIGhhbmRsZSBJRTggcHJldmVudCBkZWZhdWx0XG5mdW5jdGlvbiBwcmV2ZW50RGVmYXVsdEV2ZW50KCBldmVudCApIHtcbiAgaWYgKCBldmVudC5wcmV2ZW50RGVmYXVsdCApIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICB9IGVsc2Uge1xuICAgIGV2ZW50LnJldHVyblZhbHVlID0gZmFsc2U7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gVW5pZHJhZ2dlciAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5mdW5jdGlvbiBVbmlkcmFnZ2VyKCkge31cblxuLy8gaW5oZXJpdCBVbmlwb2ludGVyICYgRXZlbnRFbWl0dGVyXG5VbmlkcmFnZ2VyLnByb3RvdHlwZSA9IG5ldyBVbmlwb2ludGVyKCk7XG5cbi8vIC0tLS0tIGJpbmQgc3RhcnQgLS0tLS0gLy9cblxuVW5pZHJhZ2dlci5wcm90b3R5cGUuYmluZEhhbmRsZXMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fYmluZEhhbmRsZXMoIHRydWUgKTtcbn07XG5cblVuaWRyYWdnZXIucHJvdG90eXBlLnVuYmluZEhhbmRsZXMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fYmluZEhhbmRsZXMoIGZhbHNlICk7XG59O1xuXG52YXIgbmF2aWdhdG9yID0gd2luZG93Lm5hdmlnYXRvcjtcbi8qKlxuICogd29ya3MgYXMgdW5iaW5kZXIsIGFzIHlvdSBjYW4gLmJpbmRIYW5kbGVzKCBmYWxzZSApIHRvIHVuYmluZFxuICogQHBhcmFtIHtCb29sZWFufSBpc0JpbmQgLSB3aWxsIHVuYmluZCBpZiBmYWxzZXlcbiAqL1xuVW5pZHJhZ2dlci5wcm90b3R5cGUuX2JpbmRIYW5kbGVzID0gZnVuY3Rpb24oIGlzQmluZCApIHtcbiAgLy8gbXVuZ2UgaXNCaW5kLCBkZWZhdWx0IHRvIHRydWVcbiAgaXNCaW5kID0gaXNCaW5kID09PSB1bmRlZmluZWQgPyB0cnVlIDogISFpc0JpbmQ7XG4gIC8vIGV4dHJhIGJpbmQgbG9naWNcbiAgdmFyIGJpbmRlckV4dHJhO1xuICBpZiAoIG5hdmlnYXRvci5wb2ludGVyRW5hYmxlZCApIHtcbiAgICBiaW5kZXJFeHRyYSA9IGZ1bmN0aW9uKCBoYW5kbGUgKSB7XG4gICAgICAvLyBkaXNhYmxlIHNjcm9sbGluZyBvbiB0aGUgZWxlbWVudFxuICAgICAgaGFuZGxlLnN0eWxlLnRvdWNoQWN0aW9uID0gaXNCaW5kID8gJ25vbmUnIDogJyc7XG4gICAgfTtcbiAgfSBlbHNlIGlmICggbmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQgKSB7XG4gICAgYmluZGVyRXh0cmEgPSBmdW5jdGlvbiggaGFuZGxlICkge1xuICAgICAgLy8gZGlzYWJsZSBzY3JvbGxpbmcgb24gdGhlIGVsZW1lbnRcbiAgICAgIGhhbmRsZS5zdHlsZS5tc1RvdWNoQWN0aW9uID0gaXNCaW5kID8gJ25vbmUnIDogJyc7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBiaW5kZXJFeHRyYSA9IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gVE9ETyByZS1lbmFibGUgaW1nLm9uZHJhZ3N0YXJ0IHdoZW4gdW5iaW5kaW5nXG4gICAgICBpZiAoIGlzQmluZCApIHtcbiAgICAgICAgZGlzYWJsZUltZ09uZHJhZ3N0YXJ0KCBoYW5kbGUgKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIC8vIGJpbmQgZWFjaCBoYW5kbGVcbiAgdmFyIGJpbmRNZXRob2QgPSBpc0JpbmQgPyAnYmluZCcgOiAndW5iaW5kJztcbiAgZm9yICggdmFyIGk9MCwgbGVuID0gdGhpcy5oYW5kbGVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgIHZhciBoYW5kbGUgPSB0aGlzLmhhbmRsZXNbaV07XG4gICAgdGhpcy5fYmluZFN0YXJ0RXZlbnQoIGhhbmRsZSwgaXNCaW5kICk7XG4gICAgYmluZGVyRXh0cmEoIGhhbmRsZSApO1xuICAgIGV2ZW50aWVbIGJpbmRNZXRob2QgXSggaGFuZGxlLCAnY2xpY2snLCB0aGlzICk7XG4gIH1cbn07XG5cbi8vIHJlbW92ZSBkZWZhdWx0IGRyYWdnaW5nIGludGVyYWN0aW9uIG9uIGFsbCBpbWFnZXMgaW4gSUU4XG4vLyBJRTggZG9lcyBpdHMgb3duIGRyYWcgdGhpbmcgb24gaW1hZ2VzLCB3aGljaCBtZXNzZXMgc3R1ZmYgdXBcblxuZnVuY3Rpb24gbm9EcmFnU3RhcnQoKSB7XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLy8gVE9ETyByZXBsYWNlIHRoaXMgd2l0aCBhIElFOCB0ZXN0XG52YXIgaXNJRTggPSAnYXR0YWNoRXZlbnQnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblxuLy8gSUU4IG9ubHlcbnZhciBkaXNhYmxlSW1nT25kcmFnc3RhcnQgPSAhaXNJRTggPyBub29wIDogZnVuY3Rpb24oIGhhbmRsZSApIHtcblxuICBpZiAoIGhhbmRsZS5ub2RlTmFtZSA9PSAnSU1HJyApIHtcbiAgICBoYW5kbGUub25kcmFnc3RhcnQgPSBub0RyYWdTdGFydDtcbiAgfVxuXG4gIHZhciBpbWFnZXMgPSBoYW5kbGUucXVlcnlTZWxlY3RvckFsbCgnaW1nJyk7XG4gIGZvciAoIHZhciBpPTAsIGxlbiA9IGltYWdlcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICB2YXIgaW1nID0gaW1hZ2VzW2ldO1xuICAgIGltZy5vbmRyYWdzdGFydCA9IG5vRHJhZ1N0YXJ0O1xuICB9XG59O1xuXG4vLyAtLS0tLSBzdGFydCBldmVudCAtLS0tLSAvL1xuXG4vKipcbiAqIHBvaW50ZXIgc3RhcnRcbiAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gKiBAcGFyYW0ge0V2ZW50IG9yIFRvdWNofSBwb2ludGVyXG4gKi9cblVuaWRyYWdnZXIucHJvdG90eXBlLnBvaW50ZXJEb3duID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyICkge1xuICB0aGlzLl9kcmFnUG9pbnRlckRvd24oIGV2ZW50LCBwb2ludGVyICk7XG4gIC8vIGtsdWRnZSB0byBibHVyIGZvY3VzZWQgaW5wdXRzIGluIGRyYWdnZXJcbiAgdmFyIGZvY3VzZWQgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICBpZiAoIGZvY3VzZWQgJiYgZm9jdXNlZC5ibHVyICkge1xuICAgIGZvY3VzZWQuYmx1cigpO1xuICB9XG4gIC8vIGJpbmQgbW92ZSBhbmQgZW5kIGV2ZW50c1xuICB0aGlzLl9iaW5kUG9zdFN0YXJ0RXZlbnRzKCBldmVudCApO1xuICB0aGlzLmVtaXRFdmVudCggJ3BvaW50ZXJEb3duJywgWyBldmVudCwgcG9pbnRlciBdICk7XG59O1xuXG4vLyBiYXNlIHBvaW50ZXIgZG93biBsb2dpY1xuVW5pZHJhZ2dlci5wcm90b3R5cGUuX2RyYWdQb2ludGVyRG93biA9IGZ1bmN0aW9uKCBldmVudCwgcG9pbnRlciApIHtcbiAgLy8gdHJhY2sgdG8gc2VlIHdoZW4gZHJhZ2dpbmcgc3RhcnRzXG4gIHRoaXMucG9pbnRlckRvd25Qb2ludCA9IFVuaXBvaW50ZXIuZ2V0UG9pbnRlclBvaW50KCBwb2ludGVyICk7XG5cbiAgLy8gcHJldmVudCBkZWZhdWx0LCB1bmxlc3MgdG91Y2hzdGFydCBvciA8c2VsZWN0PlxuICB2YXIgaXNUb3VjaHN0YXJ0ID0gZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCc7XG4gIHZhciB0YXJnZXROb2RlTmFtZSA9IGV2ZW50LnRhcmdldC5ub2RlTmFtZTtcbiAgaWYgKCAhaXNUb3VjaHN0YXJ0ICYmIHRhcmdldE5vZGVOYW1lICE9ICdTRUxFQ1QnICkge1xuICAgIHByZXZlbnREZWZhdWx0RXZlbnQoIGV2ZW50ICk7XG4gIH1cbn07XG5cbi8vIC0tLS0tIG1vdmUgZXZlbnQgLS0tLS0gLy9cblxuLyoqXG4gKiBkcmFnIG1vdmVcbiAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gKiBAcGFyYW0ge0V2ZW50IG9yIFRvdWNofSBwb2ludGVyXG4gKi9cblVuaWRyYWdnZXIucHJvdG90eXBlLnBvaW50ZXJNb3ZlID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyICkge1xuICB2YXIgbW92ZVZlY3RvciA9IHRoaXMuX2RyYWdQb2ludGVyTW92ZSggZXZlbnQsIHBvaW50ZXIgKTtcbiAgdGhpcy5lbWl0RXZlbnQoICdwb2ludGVyTW92ZScsIFsgZXZlbnQsIHBvaW50ZXIsIG1vdmVWZWN0b3IgXSApO1xuICB0aGlzLl9kcmFnTW92ZSggZXZlbnQsIHBvaW50ZXIsIG1vdmVWZWN0b3IgKTtcbn07XG5cbi8vIGJhc2UgcG9pbnRlciBtb3ZlIGxvZ2ljXG5VbmlkcmFnZ2VyLnByb3RvdHlwZS5fZHJhZ1BvaW50ZXJNb3ZlID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyICkge1xuICB2YXIgbW92ZVBvaW50ID0gVW5pcG9pbnRlci5nZXRQb2ludGVyUG9pbnQoIHBvaW50ZXIgKTtcbiAgdmFyIG1vdmVWZWN0b3IgPSB7XG4gICAgeDogbW92ZVBvaW50LnggLSB0aGlzLnBvaW50ZXJEb3duUG9pbnQueCxcbiAgICB5OiBtb3ZlUG9pbnQueSAtIHRoaXMucG9pbnRlckRvd25Qb2ludC55XG4gIH07XG4gIC8vIHN0YXJ0IGRyYWcgaWYgcG9pbnRlciBoYXMgbW92ZWQgZmFyIGVub3VnaCB0byBzdGFydCBkcmFnXG4gIGlmICggIXRoaXMuaXNEcmFnZ2luZyAmJiB0aGlzLmhhc0RyYWdTdGFydGVkKCBtb3ZlVmVjdG9yICkgKSB7XG4gICAgdGhpcy5fZHJhZ1N0YXJ0KCBldmVudCwgcG9pbnRlciApO1xuICB9XG4gIHJldHVybiBtb3ZlVmVjdG9yO1xufTtcblxuLy8gY29uZGl0aW9uIGlmIHBvaW50ZXIgaGFzIG1vdmVkIGZhciBlbm91Z2ggdG8gc3RhcnQgZHJhZ1xuVW5pZHJhZ2dlci5wcm90b3R5cGUuaGFzRHJhZ1N0YXJ0ZWQgPSBmdW5jdGlvbiggbW92ZVZlY3RvciApIHtcbiAgcmV0dXJuIE1hdGguYWJzKCBtb3ZlVmVjdG9yLnggKSA+IDMgfHwgTWF0aC5hYnMoIG1vdmVWZWN0b3IueSApID4gMztcbn07XG5cblxuLy8gLS0tLS0gZW5kIGV2ZW50IC0tLS0tIC8vXG5cbi8qKlxuICogcG9pbnRlciB1cFxuICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAqIEBwYXJhbSB7RXZlbnQgb3IgVG91Y2h9IHBvaW50ZXJcbiAqL1xuVW5pZHJhZ2dlci5wcm90b3R5cGUucG9pbnRlclVwID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyICkge1xuICB0aGlzLmVtaXRFdmVudCggJ3BvaW50ZXJVcCcsIFsgZXZlbnQsIHBvaW50ZXIgXSApO1xuICB0aGlzLl9kcmFnUG9pbnRlclVwKCBldmVudCwgcG9pbnRlciApO1xufTtcblxuVW5pZHJhZ2dlci5wcm90b3R5cGUuX2RyYWdQb2ludGVyVXAgPSBmdW5jdGlvbiggZXZlbnQsIHBvaW50ZXIgKSB7XG4gIGlmICggdGhpcy5pc0RyYWdnaW5nICkge1xuICAgIHRoaXMuX2RyYWdFbmQoIGV2ZW50LCBwb2ludGVyICk7XG4gIH0gZWxzZSB7XG4gICAgLy8gcG9pbnRlciBkaWRuJ3QgbW92ZSBlbm91Z2ggZm9yIGRyYWcgdG8gc3RhcnRcbiAgICB0aGlzLl9zdGF0aWNDbGljayggZXZlbnQsIHBvaW50ZXIgKTtcbiAgfVxufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZHJhZyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4vLyBkcmFnU3RhcnRcblVuaWRyYWdnZXIucHJvdG90eXBlLl9kcmFnU3RhcnQgPSBmdW5jdGlvbiggZXZlbnQsIHBvaW50ZXIgKSB7XG4gIHRoaXMuaXNEcmFnZ2luZyA9IHRydWU7XG4gIHRoaXMuZHJhZ1N0YXJ0UG9pbnQgPSBVbmlkcmFnZ2VyLmdldFBvaW50ZXJQb2ludCggcG9pbnRlciApO1xuICAvLyBwcmV2ZW50IGNsaWNrc1xuICB0aGlzLmlzUHJldmVudGluZ0NsaWNrcyA9IHRydWU7XG5cbiAgdGhpcy5kcmFnU3RhcnQoIGV2ZW50LCBwb2ludGVyICk7XG59O1xuXG5VbmlkcmFnZ2VyLnByb3RvdHlwZS5kcmFnU3RhcnQgPSBmdW5jdGlvbiggZXZlbnQsIHBvaW50ZXIgKSB7XG4gIHRoaXMuZW1pdEV2ZW50KCAnZHJhZ1N0YXJ0JywgWyBldmVudCwgcG9pbnRlciBdICk7XG59O1xuXG4vLyBkcmFnTW92ZVxuVW5pZHJhZ2dlci5wcm90b3R5cGUuX2RyYWdNb3ZlID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyLCBtb3ZlVmVjdG9yICkge1xuICAvLyBkbyBub3QgZHJhZyBpZiBub3QgZHJhZ2dpbmcgeWV0XG4gIGlmICggIXRoaXMuaXNEcmFnZ2luZyApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLmRyYWdNb3ZlKCBldmVudCwgcG9pbnRlciwgbW92ZVZlY3RvciApO1xufTtcblxuVW5pZHJhZ2dlci5wcm90b3R5cGUuZHJhZ01vdmUgPSBmdW5jdGlvbiggZXZlbnQsIHBvaW50ZXIsIG1vdmVWZWN0b3IgKSB7XG4gIHByZXZlbnREZWZhdWx0RXZlbnQoIGV2ZW50ICk7XG4gIHRoaXMuZW1pdEV2ZW50KCAnZHJhZ01vdmUnLCBbIGV2ZW50LCBwb2ludGVyLCBtb3ZlVmVjdG9yIF0gKTtcbn07XG5cbi8vIGRyYWdFbmRcblVuaWRyYWdnZXIucHJvdG90eXBlLl9kcmFnRW5kID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyICkge1xuICAvLyBzZXQgZmxhZ3NcbiAgdGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XG4gIC8vIHJlLWVuYWJsZSBjbGlja2luZyBhc3luY1xuICB2YXIgX3RoaXMgPSB0aGlzO1xuICBzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcbiAgICBkZWxldGUgX3RoaXMuaXNQcmV2ZW50aW5nQ2xpY2tzO1xuICB9KTtcblxuICB0aGlzLmRyYWdFbmQoIGV2ZW50LCBwb2ludGVyICk7XG59O1xuXG5VbmlkcmFnZ2VyLnByb3RvdHlwZS5kcmFnRW5kID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyICkge1xuICB0aGlzLmVtaXRFdmVudCggJ2RyYWdFbmQnLCBbIGV2ZW50LCBwb2ludGVyIF0gKTtcbn07XG5cbi8vIC0tLS0tIG9uY2xpY2sgLS0tLS0gLy9cblxuLy8gaGFuZGxlIGFsbCBjbGlja3MgYW5kIHByZXZlbnQgY2xpY2tzIHdoZW4gZHJhZ2dpbmdcblVuaWRyYWdnZXIucHJvdG90eXBlLm9uY2xpY2sgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gIGlmICggdGhpcy5pc1ByZXZlbnRpbmdDbGlja3MgKSB7XG4gICAgcHJldmVudERlZmF1bHRFdmVudCggZXZlbnQgKTtcbiAgfVxufTtcblxuLy8gLS0tLS0gc3RhdGljQ2xpY2sgLS0tLS0gLy9cblxuLy8gdHJpZ2dlcmVkIGFmdGVyIHBvaW50ZXIgZG93biAmIHVwIHdpdGggbm8vdGlueSBtb3ZlbWVudFxuVW5pZHJhZ2dlci5wcm90b3R5cGUuX3N0YXRpY0NsaWNrID0gZnVuY3Rpb24oIGV2ZW50LCBwb2ludGVyICkge1xuICAvLyBhbGxvdyBjbGljayBpbiA8aW5wdXQ+cyBhbmQgPHRleHRhcmVhPnNcbiAgdmFyIG5vZGVOYW1lID0gZXZlbnQudGFyZ2V0Lm5vZGVOYW1lO1xuICBpZiAoIG5vZGVOYW1lID09ICdJTlBVVCcgfHwgbm9kZU5hbWUgPT0gJ1RFWFRBUkVBJyApIHtcbiAgICBldmVudC50YXJnZXQuZm9jdXMoKTtcbiAgfVxuICB0aGlzLnN0YXRpY0NsaWNrKCBldmVudCwgcG9pbnRlciApO1xufTtcblxuVW5pZHJhZ2dlci5wcm90b3R5cGUuc3RhdGljQ2xpY2sgPSBmdW5jdGlvbiggZXZlbnQsIHBvaW50ZXIgKSB7XG4gIHRoaXMuZW1pdEV2ZW50KCAnc3RhdGljQ2xpY2snLCBbIGV2ZW50LCBwb2ludGVyIF0gKTtcbn07XG5cbi8vIC0tLS0tICAtLS0tLSAvL1xuXG5VbmlkcmFnZ2VyLmdldFBvaW50ZXJQb2ludCA9IGZ1bmN0aW9uKCBwb2ludGVyICkge1xuICByZXR1cm4ge1xuICAgIHg6IHBvaW50ZXIucGFnZVggIT09IHVuZGVmaW5lZCA/IHBvaW50ZXIucGFnZVggOiBwb2ludGVyLmNsaWVudFgsXG4gICAgeTogcG9pbnRlci5wYWdlWSAhPT0gdW5kZWZpbmVkID8gcG9pbnRlci5wYWdlWSA6IHBvaW50ZXIuY2xpZW50WVxuICB9O1xufTtcblxuLy8gLS0tLS0gIC0tLS0tIC8vXG5cblVuaWRyYWdnZXIuZ2V0UG9pbnRlclBvaW50ID0gVW5pcG9pbnRlci5nZXRQb2ludGVyUG9pbnQ7XG5cbnJldHVybiBVbmlkcmFnZ2VyO1xuXG59KSk7XG4iLCJ2YXIgJCA9ICh3aW5kb3cualF1ZXJ5KVxudmFyIEZsaWNraXR5ID0gcmVxdWlyZSgnZmxpY2tpdHknKVxucmVxdWlyZSgnZmxpY2tpdHktaW1hZ2VzbG9hZGVkJylcblxudmFyIFNjcm9sbE5hdiA9IHJlcXVpcmUoJy4vbGliL3Njcm9sbC1uYXYnKVxudmFyIFNjcm9sbFBob25lID0gcmVxdWlyZSgnLi9saWIvc2Nyb2xsLXBob25lJylcbnZhciBDeWNsZSA9IHJlcXVpcmUoJy4vbGliL2N5Y2xlJylcblxudmFyIFNpdGUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5sb2FkSW1hZ2VzKClcblxuICB0aGlzLiRib2R5ID0gJCgnYm9keScpXG4gIHRoaXMubmF2ID0gbmV3IFNjcm9sbE5hdigpXG4gIHRoaXMucGhvbmUgPSBuZXcgU2Nyb2xsUGhvbmUoKVxuXG4gICQod2luZG93KS5vbignc2Nyb2xsJywgdGhpcy5jaGVja0hlYWRlci5iaW5kKHRoaXMpKVxuXG4gIHZhciAkc2xpZGVySWNvbnMgPSAkKCcucHJvZmlsZS1zbGlkZXItaWNvbnMnKTtcblxuICB2YXIgYml0ZVNsaWRlciA9IG5ldyBGbGlja2l0eSgkc2xpZGVySWNvbnNbMF0sIHtcbiAgICBjZWxsU2VsZWN0b3I6ICcuc2xpZGVyLWl0ZW0nLFxuICAgIHBhZ2VEb3RzOiBmYWxzZSxcbiAgICB3cmFwQXJvdW5kOiB0cnVlLFxuICAgIGltYWdlc0xvYWRlZDogdHJ1ZVxuICB9KVxuXG4gICRzbGlkZXJJY29ucy5maW5kKCcuc2xpZGVyLWl0ZW0nKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICBiaXRlU2xpZGVyLnNlbGVjdCgkKHRoaXMpLmluZGV4KCkpXG4gIH0pXG5cbiAgdmFyICRiaXRlQ2FwdGlvbnMgPSAkc2xpZGVySWNvbnMubmV4dCgnLmN5Y2xlLWNhcHRpb25zJylcblxuICB2YXIgYml0ZUN5Y2xlID0gbmV3IEN5Y2xlKCRzbGlkZXJJY29ucy5uZXh0KCcuY3ljbGUtY2FwdGlvbnMnKSlcblxuICAkc2xpZGVySWNvbnMub24oJ2NlbGxTZWxlY3QnLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgaSA9IGJpdGVTbGlkZXIuc2VsZWN0ZWRJbmRleFxuXG4gICAgYml0ZUN5Y2xlLmdvKGkpXG4gIH0pXG5cbiAgdmFyICRzbGlkZXJQaG90b3MgPSAkKCcuZGlldGl0aWFuLXNsaWRlci1waG90b3MnKTtcblxuICB2YXIgZGlldGl0aWFuU2xpZGVyID0gbmV3IEZsaWNraXR5KCRzbGlkZXJQaG90b3NbMF0sIHtcbiAgICBjZWxsU2VsZWN0b3I6ICcuc2xpZGVyLWl0ZW0nLFxuICAgIHBhZ2VEb3RzOiBmYWxzZSxcbiAgICBwcmV2TmV4dEJ1dHRvbnM6IGZhbHNlLFxuICAgIGNvbnRhaW46IHRydWUsXG4gICAgZHJhZ2dhYmxlOiBmYWxzZSxcbiAgICBpbWFnZXNMb2FkZWQ6IHRydWVcbiAgfSlcblxuICB2YXIgZGlldGl0aWFuQ3ljbGUgPSBuZXcgQ3ljbGUoJHNsaWRlclBob3Rvcy5uZXh0KCcuY3ljbGUtY2FwdGlvbnMnKSk7XG5cbiAgJHNsaWRlclBob3Rvcy5maW5kKCcuc2xpZGVyLWl0ZW0nKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICBkaWV0aXRpYW5TbGlkZXIuc2VsZWN0KCQodGhpcykuaW5kZXgoKSlcbiAgfSlcblxuICAkc2xpZGVyUGhvdG9zLm9uKCdjZWxsU2VsZWN0JywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGkgPSBkaWV0aXRpYW5TbGlkZXIuc2VsZWN0ZWRJbmRleFxuXG4gICAgZGlldGl0aWFuQ3ljbGUuZ28oaSlcbiAgfSlcblxuICB2YXIgJGN5Y2xlU2h1ZmZsZSA9ICQoJy5jeWNsZS1zaHVmZmxlJylcblxuICB2YXIgc2h1ZmZsZUN5Y2xlID0gbmV3IEN5Y2xlKCRjeWNsZVNodWZmbGUpXG5cbiAgJGN5Y2xlU2h1ZmZsZS5uZXh0KCcuY3ljbGUtc2h1ZmZsZS1idXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgaSA9IHNodWZmbGVDeWNsZS5pbmRleCArIDFcblxuICAgIGkgPSBpID49IHNodWZmbGVDeWNsZS4kaXRlbXMubGVuZ3RoID8gMCA6IGlcblxuICAgIHNodWZmbGVDeWNsZS5nbyhpKVxuICB9KVxuXG4gIHZhciAkZmVhdHVyZUNvbnRlbnQgPSAkKCcuZmVhdHVyZXMtY29udGVudCcpXG4gIHZhciAkZmVhdHVyZUl0ZW1zID0gJCgnLmZlYXR1cmVzLWNvbnRlbnQtaXRlbScpXG4gIHZhciAkZmVhdHVyZUltYWdlcyA9ICQoJy5mZWF0dXJlcy1waG9uZS1zY3JlZW5zaG90JylcblxuICAkZmVhdHVyZUl0ZW1zLm9uKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgaWYodGhpcy5pc0JpZygpKSB7XG4gICAgICB2YXIgJGl0ZW0gPSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xuICAgICAgXG4gICAgICAkaXRlbS5hZGRDbGFzcygnYWN0aXZlJykuc2libGluZ3MoKS5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgICAgICRmZWF0dXJlSW1hZ2VzLmVxKCRpdGVtLmluZGV4KCkpLmFkZENsYXNzKCdhY3RpdmUnKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgIH1cbiAgfS5iaW5kKHRoaXMpKVxuXG4gIHZhciBmZWF0dXJlU2xpZGVyID0gbmV3IEZsaWNraXR5KCRmZWF0dXJlQ29udGVudFswXSwge1xuICAgIGNlbGxTZWxlY3RvcjogJy5mZWF0dXJlcy1jb250ZW50LWl0ZW0nLFxuICAgIHBhZ2VEb3RzOiBmYWxzZSxcbiAgICBwcmV2TmV4dEJ1dHRvbnM6IHRydWUsXG4gICAgd3JhcEFyb3VuZDogdHJ1ZSxcbiAgICB3YXRjaENTUzogdHJ1ZSxcbiAgICBpbWFnZXNMb2FkZWQ6IHRydWVcbiAgfSlcblxuICAkZmVhdHVyZUNvbnRlbnQub24oJ2NlbGxTZWxlY3QnLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgaSA9IGZlYXR1cmVTbGlkZXIuc2VsZWN0ZWRJbmRleFxuICAgIGNvbnNvbGUubG9nKGkpXG5cbiAgICAkZmVhdHVyZUl0ZW1zLmVxKGkpLmFkZENsYXNzKCdhY3RpdmUnKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICRmZWF0dXJlSW1hZ2VzLmVxKGkpLmFkZENsYXNzKCdhY3RpdmUnKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICB9KVxuXG4gICQod2luZG93KS5yZXNpemUoKVxufVxuXG5TaXRlLnByb3RvdHlwZSA9IHtcbiAgaXNTbWFsbDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHd3ID0gd2luZG93LmlubmVyV2lkdGhcbiAgICB2YXIgd2ggPSB3aW5kb3cuaW5uZXJIZWlnaHRcblxuICAgIHJldHVybiAod3cgPCA3MDAgfHwgd2ggPCA1MDApXG4gIH0sXG5cbiAgaXNCaWc6IGZ1bmN0aW9uKCkge1xuICAgIHZhciB3dyA9IHdpbmRvdy5pbm5lcldpZHRoXG4gICAgdmFyIHdoID0gd2luZG93LmlubmVySGVpZ2h0XG5cbiAgICByZXR1cm4gKHd3ID49IDcwMCAmJiB3aCA+PSA1MDApXG4gIH0sXG5cbiAgZ2V0U2l6ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNTbWFsbCA/ICdzbWFsbCcgOiAnYmlnJztcbiAgfSxcblxuICBjaGVja0hlYWRlcjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy4kYm9keS50b2dnbGVDbGFzcygnYXQtdG9wJywgd2luZG93LnNjcm9sbFkgPD0gNTApXG4gIH0sXG5cbiAgbG9hZEltYWdlczogZnVuY3Rpb24oKSB7XG4gICAgdmFyICRlbGVtZW50c1RvTG9hZCA9ICQoJ1tkYXRhLWJnLXNyY10nKS5ub3QoJy5iZy1sb2FkaW5nLCAuYmctbG9hZGVkJylcblxuICAgICRlbGVtZW50c1RvTG9hZC5lYWNoKGZ1bmN0aW9uKCkge1xuXG4gICAgICB2YXIgJGVsID0gJCh0aGlzKVxuXG4gICAgICB2YXIgc3JjID0gJGVsLmF0dHIoJ2RhdGEtYmctc3JjJylcblxuICAgICAgJGVsLmFkZENsYXNzKCdiZy1sb2FkaW5nJylcblxuICAgICAgdmFyIGltID0gbmV3IEltYWdlKClcblxuICAgICAgJChpbSkub24oJ2xvYWQnLCBmdW5jdGlvbigpIHtcblxuICAgICAgICAkZWwuY3NzKCdiYWNrZ3JvdW5kLWltYWdlJywgJ3VybCgnK3NyYysnKScpLnJlbW92ZUNsYXNzKCdiZy1sb2FkaW5nJykuYWRkQ2xhc3MoJ2JnLWxvYWRlZCcpXG5cbiAgICAgIH0pXG5cbiAgICAgIGltLnNyYyA9IHNyY1xuXG4gICAgICBpZihpbS5jb21wbGV0ZSkge1xuICAgICAgICAkKGltKS50cmlnZ2VyKCdsb2FkJylcbiAgICAgIH1cblxuICAgIH0pXG4gIH1cbn1cblxubmV3IFNpdGUoKVxuIiwidmFyICQgPSAod2luZG93LmpRdWVyeSlcbnZhciBWZWxvY2l0eSA9IHJlcXVpcmUoJ3ZlbG9jaXR5JylcblxudmFyIEN5Y2xlID0gZnVuY3Rpb24oZWwpIHtcbiAgdGhpcy4kZWwgPSAkKGVsKVxuICB0aGlzLiRpdGVtcyA9IHRoaXMuJGVsLmZpbmQoJy5jeWNsZS1pdGVtJylcblxuICB0aGlzLmluZGV4ID0gdGhpcy4kaXRlbXMuZmlsdGVyKCcuYWN0aXZlJykuaW5kZXgoKVxuXG4gIHRoaXMuZWFzaW5nID0gWy41NSwgLjEsIC4yNSwgLjk1XVxuXG4gICQod2luZG93KS5vbigncmVzaXplJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1heEggPSAwO1xuXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMuJGl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBtYXhIID0gTWF0aC5tYXgodGhpcy4kaXRlbXMuZXEoaSkuaGVpZ2h0KCksIG1heEgpXG4gICAgfVxuICAgIFxuICAgIHRoaXMuJGVsLmNzcygnbWluLWhlaWdodCcsIG1heEgpO1xuICB9LmJpbmQodGhpcykpXG59XG5cbkN5Y2xlLnByb3RvdHlwZSA9IHtcbiAgZ286IGZ1bmN0aW9uKGkpIHtcbiAgICB2YXIgJGFjdGl2ZSA9IHRoaXMuJGl0ZW1zLmZpbHRlcignLmFjdGl2ZScpXG4gICAgdmFyICRuZXh0ID0gdGhpcy4kaXRlbXMuZXEoaSlcblxuICAgICRuZXh0LmFkZENsYXNzKCdhY3RpdmUnKVxuICAgICRhY3RpdmUucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG5cbiAgICAvLyAkYWN0aXZlLmFkZENsYXNzKCdvdXQnKVxuICAgIC8vICRuZXh0LmFkZENsYXNzKCdpbicpXG5cbiAgICAvLyBWZWxvY2l0eSgkYWN0aXZlWzBdLCB7XG4gICAgLy8gICBvcGFjaXR5OiBbMCwgMV1cbiAgICAvLyB9LCB7XG4gICAgLy8gICBkaXNwbGF5OiAnbm9uZScsXG4gICAgLy8gICBkdXJhdGlvbjogMzAwLFxuICAgIC8vICAgY29tcGxldGU6IGZ1bmN0aW9uKGVsKSB7XG4gICAgLy8gICAgIHRoaXMuJGl0ZW1zLnJlbW92ZUNsYXNzKCdpbiBvdXQnKVxuXG4gICAgLy8gICAgICRuZXh0LmFkZENsYXNzKCdhY3RpdmUnKVxuICAgIC8vICAgICAkYWN0aXZlLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgIC8vICAgfS5iaW5kKHRoaXMpLFxuICAgIC8vICAgZWFzaW5nOiB0aGlzLmVhc2luZ1xuICAgIC8vIH0pXG5cbiAgICAvLyBWZWxvY2l0eSgkbmV4dFswXSwge1xuICAgIC8vICAgb3BhY2l0eTogWzEsIDBdXG4gICAgLy8gfSwge1xuICAgIC8vICAgZHVyYXRpb246IDMwMCxcbiAgICAvLyAgIGVhc2luZzogdGhpcy5lYXNpbmdcbiAgICAvLyB9KVxuXG4gICAgLy8gVmVsb2NpdHkodGhpcy4kZWxbMF0sIHtcbiAgICAvLyAgIGhlaWdodDogWyRuZXh0LmhlaWdodCgpLCAkYWN0aXZlLmhlaWdodCgpXVxuICAgIC8vIH0sIHtcbiAgICAvLyAgIGR1cmF0aW9uOiAzMDAsXG4gICAgLy8gICBlYXNpbmc6IHRoaXMuZWFzaW5nLFxuICAgIC8vICAgY29tcGxldGU6IGZ1bmN0aW9uKGVsKSB7XG4gICAgLy8gICAgICQoZWwpLmF0dHIoJ3N0eWxlJywgJycpXG4gICAgLy8gICB9XG4gICAgLy8gfSlcblxuICAgIHRoaXMuaW5kZXggPSBpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDeWNsZSIsInZhciAkID0gKHdpbmRvdy5qUXVlcnkpXG5yZXF1aXJlKCdqcXVlcnktbW91c2V3aGVlbCcpKCQpXG5cbnZhciBWZWxvY2l0eSA9IHJlcXVpcmUoJ3ZlbG9jaXR5JylcblxudmFyIFNjcm9sbE5hdiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmluZGljYXRvcnMnKVxuICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21haW4nKVxuICB0aGlzLmZvb3RlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2Zvb3Rlci5ib3R0b20nKVxuICBcbiAgdGhpcy51cGRhdGVJdGVtcygpXG4gIHRoaXMudXBkYXRlTWFwKClcbiAgdGhpcy51cGRhdGVBY3RpdmUoKVxuXG4gIHRoaXMuZWFzaW5nID0gWy41NSwgLjEsIC4yNSwgLjk1XVxuXG4gICQod2luZG93KVxuICAgIC5vbigncmVzaXplJywgZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnVwZGF0ZU1hcCgpXG4gICAgICB0aGlzLnVwZGF0ZUFjdGl2ZSgpXG4gICAgfS5iaW5kKHRoaXMpKVxuICAgIC5vbignc2Nyb2xsJywgdGhpcy51cGRhdGVBY3RpdmUuYmluZCh0aGlzKSlcblxuICB0aGlzLiRpdGVtcy5maW5kKCdhJykuYWRkKCcuaG9tZS1saW5rLCAuc2Nyb2xsLWxpbmssIC5zZWN0aW9uLWxpbmtzIGEnKVxuICAgIC5vbignY2xpY2snLCB0aGlzLmNsaWNrTmF2TGluay5iaW5kKHRoaXMpKVxuXG4gICQod2luZG93KS5vbigna2V5ZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgaWYodGhpcy5zbSkgeyByZXR1cm4gfVxuXG4gICAgaWYoZXZlbnQud2hpY2ggPT09IDQwKSB7XG4gICAgICB0aGlzLnBhZ2VEb3duKClcbiAgICB9IGVsc2UgaWYoZXZlbnQud2hpY2ggPT09IDM4KSB7XG4gICAgICB0aGlzLnBhZ2VVcCgpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgfS5iaW5kKHRoaXMpKVxufVxuXG5TY3JvbGxOYXYucHJvdG90eXBlID0ge1xuICB1cGRhdGVJdGVtczogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pdGVtcyA9IHt9XG4gICAgdGhpcy50YXJnZXRzID0ge31cblxuICAgIHZhciBpdGVtRWxlbWVudHMgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ2xpJylcbiAgICB2YXIgdGFyZ2V0RWxlbWVudHMgPSBbXVxuXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGl0ZW1FbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGl0ZW0gPSBpdGVtRWxlbWVudHNbaV1cbiAgICAgIHZhciBocmVmID0gaXRlbS5xdWVyeVNlbGVjdG9yKCdhJykuZ2V0QXR0cmlidXRlKCdocmVmJylcblxuICAgICAgaWYoaHJlZi5jaGFyQXQoMCkgIT09ICcjJykgeyBjb250aW51ZSB9XG5cbiAgICAgIHZhciB0YXJnZXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGhyZWYpXG4gICAgICB2YXIgaWQgPSBocmVmLnN1YnN0cigxKVxuXG4gICAgICB0aGlzLml0ZW1zW2lkXSA9IGl0ZW1cbiAgICAgIHRoaXMudGFyZ2V0c1tpZF0gPSB0YXJnZXRcblxuICAgICAgdGFyZ2V0RWxlbWVudHMucHVzaCh0YXJnZXQpXG4gICAgfVxuXG4gICAgdGhpcy4kaXRlbXMgPSAkKGl0ZW1FbGVtZW50cylcbiAgICB0aGlzLiR0YXJnZXRzID0gJCh0YXJnZXRFbGVtZW50cykuYWRkKHRoaXMuZm9vdGVyKVxuICB9LFxuXG4gIHVwZGF0ZU1hcDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1hcCA9IHt9XG4gICAgdmFyIHNjcm9sbFkgPSB3aW5kb3cuc2Nyb2xsWVxuXG4gICAgZm9yKHZhciB0IGluIHRoaXMudGFyZ2V0cykge1xuICAgICAgdmFyIGVsID0gdGhpcy50YXJnZXRzW3RdXG5cbiAgICAgIHZhciBvZmZzZXQgPSAkKGVsKS5vZmZzZXQoKVxuICAgICAgdmFyIHRvcCA9IG9mZnNldC50b3BcblxuICAgICAgbWFwW3RvcF0gPSBtYXBbdG9wXSB8fCBbXVxuXG4gICAgICBtYXBbdG9wXS5wdXNoKHtcbiAgICAgICAgaWQ6IHQsXG4gICAgICAgIGVsOiBlbCxcbiAgICAgICAgdG9wOiB0b3AsXG4gICAgICAgIGJvdHRvbTogdG9wICsgJChlbCkuaGVpZ2h0KClcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgdGhpcy5tYXAgPSBtYXBcblxuICAgIHRoaXMuc20gPSAod2luZG93LmlubmVySGVpZ2h0IDwgNTAwKSB8fCAod2luZG93LmlubmVyV2lkdGggPCA3MDApXG4gIH0sXG5cbiAgdXBkYXRlQWN0aXZlOiBmdW5jdGlvbihldmVudCkge1xuICAgIGlmKHRoaXMuc20pIHsgcmV0dXJuIH1cblxuICAgIHZhciBzY3JvbGxZID0gd2luZG93LnNjcm9sbFkgKyAod2luZG93LmlubmVySGVpZ2h0IC8gMilcbiAgICB2YXIgc2Nyb2xsQm90dG9tID0gc2Nyb2xsWVxuICAgIHZhciBhY3RpdmUgPSBbXVxuICAgIHZhciBhY3RpdmVJdGVtcyA9IFtdXG5cbiAgICBmb3IodmFyIHNlY3Rpb25ZIGluIHRoaXMubWFwKSB7XG5cbiAgICAgIGlmKHNlY3Rpb25ZIDwgc2Nyb2xsQm90dG9tKSB7XG4gICAgICAgIHZhciBzZWN0aW9ucyA9IHRoaXMubWFwW3NlY3Rpb25ZXVxuXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBzZWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBzZWN0aW9uID0gc2VjdGlvbnNbaV1cbiAgICAgICAgICB2YXIgaXRlbSA9IHRoaXMuaXRlbXNbc2VjdGlvbi5pZF1cblxuICAgICAgICAgIGlmKHNlY3Rpb24uYm90dG9tID4gc2Nyb2xsWSkge1xuICAgICAgICAgICAgYWN0aXZlLnB1c2goc2VjdGlvbi5lbClcbiAgICAgICAgICAgIGFjdGl2ZUl0ZW1zLnB1c2goaXRlbSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgIH1cblxuICAgIHZhciBhdEhvbWUgPSAod2luZG93LnNjcm9sbFkgPCB3aW5kb3cuaW5uZXJIZWlnaHQpXG5cbiAgICAkKCdib2R5JykudG9nZ2xlQ2xhc3MoJ2F0LWhvbWUnLCBhdEhvbWUpXG5cbiAgICAkKGFjdGl2ZSkuYWRkKGFjdGl2ZUl0ZW1zKS5hZGRDbGFzcygnYWN0aXZlJylcblxuICAgIHRoaXMuJHRhcmdldHMubm90KGFjdGl2ZSkucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgdGhpcy4kaXRlbXMubm90KGFjdGl2ZUl0ZW1zKS5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgfSxcblxuICBjbGlja05hdkxpbms6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuXG4gICAgdmFyIGl0ZW0gPSBldmVudC5jdXJyZW50VGFyZ2V0XG4gICAgdmFyIHRhcmdldElEID0gaXRlbS5nZXRBdHRyaWJ1dGUoJ2hyZWYnKS5zdWJzdHIoMSlcbiAgICB2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXRzW3RhcmdldElEXSB8fCAkKCcjJyt0YXJnZXRJRClbMF1cblxuICAgIHRoaXMuc2Nyb2xsVG8odGFyZ2V0KVxuICB9LFxuXG4gIHNjcm9sbFRvOiBmdW5jdGlvbihlbCkge1xuICAgIHRoaXMuJHRhcmdldHMudmVsb2NpdHkoJ3N0b3AnKVxuXG4gICAgVmVsb2NpdHkoZWwsICdzY3JvbGwnLCB7XG4gICAgICBkdXJhdGlvbjogNjAwLFxuICAgICAgZWFzaW5nOiB0aGlzLmVhc2luZyxcbiAgICAgIG9mZnNldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBvZmZzZXQgPSAod2luZG93LmlubmVySGVpZ2h0IC0gZWwub2Zmc2V0SGVpZ2h0KSAqIC0xXG5cbiAgICAgICAgaWYob2Zmc2V0ID49IHdpbmRvdy5pbm5lckhlaWdodCkge1xuICAgICAgICAgIHJldHVybiAwXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG9mZnNldFxuICAgICAgICB9XG4gICAgICB9KClcbiAgICB9KVxuICB9LFxuXG4gIHBhZ2VEb3duOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgJGFjdGl2ZUl0ZW0gPSB0aGlzLiRpdGVtcy5maWx0ZXIoJy5hY3RpdmUnKS5sYXN0KCk7XG4gICAgdmFyICRuZXh0ID0gJCgpO1xuXG4gICAgaWYoISRhY3RpdmVJdGVtLmxlbmd0aCkge1xuICAgICAgJG5leHQgPSB0aGlzLiRpdGVtcy5maXJzdCgpXG4gICAgfSBlbHNlIHtcbiAgICAgICRuZXh0ID0gJGFjdGl2ZUl0ZW0ubmV4dCgnbGknKVxuXG4gICAgICBpZighJG5leHQubGVuZ3RoKSB7XG4gICAgICAgICRuZXh0ID0gJGFjdGl2ZUl0ZW0ucGFyZW50cygnbGknKS5uZXh0KCdsaScpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYoJG5leHQubGVuZ3RoKSB7XG4gICAgICAkbmV4dC5maW5kKCdhJykuZmlyc3QoKS50cmlnZ2VyKCdjbGljaycpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2Nyb2xsVG8odGhpcy5mb290ZXIpXG4gICAgfVxuICB9LFxuXG4gIHBhZ2VVcDogZnVuY3Rpb24oKSB7XG4gICAgdmFyICRhY3RpdmVJdGVtID0gdGhpcy4kaXRlbXMuZmlsdGVyKCcuYWN0aXZlJykubGFzdCgpXG4gICAgdmFyICRwcmV2ID0gJCgpXG5cbiAgICBpZighJGFjdGl2ZUl0ZW0ubGVuZ3RoKSB7XG4gICAgICBpZih3aW5kb3cuc2Nyb2xsWSA+IHdpbmRvdy5pbm5lckhlaWdodCkge1xuICAgICAgICAkcHJldiA9IHRoaXMuJGl0ZW1zLmxhc3QoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICRwcmV2ID0gJGFjdGl2ZUl0ZW0ucHJldignbGknKVxuXG4gICAgICBpZighJHByZXYubGVuZ3RoKSB7XG4gICAgICAgICRwcmV2ID0gJGFjdGl2ZUl0ZW0ucGFyZW50cygnbGknKS5wcmV2KCdsaScpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYoJHByZXYuZmluZCgnbGknKS5sZW5ndGgpIHtcbiAgICAgICRwcmV2ID0gJHByZXYuZmluZCgnbGknKS5sYXN0KClcbiAgICB9XG5cbiAgICBpZigkcHJldi5sZW5ndGgpIHtcbiAgICAgICRwcmV2LmZpbmQoJ2EnKS5maXJzdCgpLnRyaWdnZXIoJ2NsaWNrJylcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTY3JvbGxOYXYiLCJ2YXIgJCA9ICh3aW5kb3cualF1ZXJ5KVxuXG52YXIgSG9uZXlQaG9uZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnN0YXJ0ID0gMFxuXG4gIHRoaXMuJGVsID0gJCgnLnBob25lLWZyYW1lLXdyYXBwZXIgLnBob25lLWZyYW1lJylcbiAgdGhpcy4kdGFyZ2V0ID0gJCgnLnNlY3Rpb24tc2NyZWVuc2hvdCAucGhvbmUtZnJhbWUnKS5maXJzdCgpXG5cbiAgJCh3aW5kb3cpLm9uKCdyZXNpemUnLCB0aGlzLnJlc2l6ZS5iaW5kKHRoaXMpKVxuICAkKHdpbmRvdykub24oJ3Njcm9sbCcsIHRoaXMuc2Nyb2xsLmJpbmQodGhpcykpXG59XG5cbkhvbmV5UGhvbmUucHJvdG90eXBlID0ge1xuICByZXNpemU6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2Nyb2xsRW5kID0gJCgnI2hvdy1pdC13b3JrcycpLm9mZnNldCgpLnRvcFxuICAgIHRoaXMuc2Nyb2xsKClcbiAgfSxcblxuICBzY3JvbGw6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBwcm9ncmVzcyA9IE1hdGgubWluKCh3aW5kb3cuc2Nyb2xsWSAvIHRoaXMuc2Nyb2xsRW5kKSwgMSlcbiAgICBwcm9ncmVzcyA9IE1hdGgubWF4KHByb2dyZXNzLCAwKVxuXG4gICAgdGhpcy5wcm9ncmVzcyA9IHByb2dyZXNzXG5cbiAgICB0aGlzLnVwZGF0ZSgpXG4gIH0sXG5cbiAgdXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3RhcnRZID0gLTE0MDtcbiAgICB2YXIgZW5kWSA9ICh3aW5kb3cuaW5uZXJIZWlnaHQgLSA2MCkgLyAtMlxuICAgIHZhciBkZWx0YVkgPSBlbmRZIC0gc3RhcnRZXG5cbiAgICB2YXIgZGlzdGFuY2VZID0gc3RhcnRZICsgKGRlbHRhWSAqIHRoaXMucHJvZ3Jlc3MpXG4gICAgdmFyIG9mZnNldFkgPSAtNTAgKiB0aGlzLnByb2dyZXNzXG5cbiAgICB2YXIgc3RhcnRYID0gdGhpcy4kZWwud2lkdGgoKSAvIDJcbiAgICB2YXIgZW5kWCA9ICh3aW5kb3cuaW5uZXJXaWR0aCAvIDIpIC0gKHdpbmRvdy5pbm5lcldpZHRoIC8gMylcblxuICAgIHZhciBkaXN0YW5jZVggPSBzdGFydFggKyAoZW5kWCAqIHRoaXMucHJvZ3Jlc3MpXG4gICAgXG4gICAgdmFyIGRlbHRhU2NhbGUgPSAxIC0gKDIwMCAvIDM1MClcbiAgICB2YXIgc2NhbGUgPSAxIC0gKGRlbHRhU2NhbGUgKiB0aGlzLnByb2dyZXNzKVxuXG4gICAgdGhpcy4kZWwuY3NzKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlWCgnK2Rpc3RhbmNlWCsncHgpIHRyYW5zbGF0ZVkoJytkaXN0YW5jZVkrJ3B4KSBzY2FsZSgnK3NjYWxlKycpIHRyYW5zbGF0ZVkoJytvZmZzZXRZKyclKScpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIb25leVBob25lIiwiLyohIENvcHlyaWdodCAoYykgMjAxMyBCcmFuZG9uIEFhcm9uIChodHRwOi8vYnJhbmRvbi5hYXJvbi5zaClcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZSAoTElDRU5TRS50eHQpLlxuICpcbiAqIFZlcnNpb246IDMuMS4xMlxuICpcbiAqIFJlcXVpcmVzOiBqUXVlcnkgMS4yLjIrXG4gKi9cblxuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKCB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gICAgICAgIC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZS5cbiAgICAgICAgZGVmaW5lKFsnanF1ZXJ5J10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIC8vIE5vZGUvQ29tbW9uSlMgc3R5bGUgZm9yIEJyb3dzZXJpZnlcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEJyb3dzZXIgZ2xvYmFsc1xuICAgICAgICBmYWN0b3J5KGpRdWVyeSk7XG4gICAgfVxufShmdW5jdGlvbiAoJCkge1xuXG4gICAgdmFyIHRvRml4ICA9IFsnd2hlZWwnLCAnbW91c2V3aGVlbCcsICdET01Nb3VzZVNjcm9sbCcsICdNb3pNb3VzZVBpeGVsU2Nyb2xsJ10sXG4gICAgICAgIHRvQmluZCA9ICggJ29ud2hlZWwnIGluIGRvY3VtZW50IHx8IGRvY3VtZW50LmRvY3VtZW50TW9kZSA+PSA5ICkgP1xuICAgICAgICAgICAgICAgICAgICBbJ3doZWVsJ10gOiBbJ21vdXNld2hlZWwnLCAnRG9tTW91c2VTY3JvbGwnLCAnTW96TW91c2VQaXhlbFNjcm9sbCddLFxuICAgICAgICBzbGljZSAgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UsXG4gICAgICAgIG51bGxMb3dlc3REZWx0YVRpbWVvdXQsIGxvd2VzdERlbHRhO1xuXG4gICAgaWYgKCAkLmV2ZW50LmZpeEhvb2tzICkge1xuICAgICAgICBmb3IgKCB2YXIgaSA9IHRvRml4Lmxlbmd0aDsgaTsgKSB7XG4gICAgICAgICAgICAkLmV2ZW50LmZpeEhvb2tzWyB0b0ZpeFstLWldIF0gPSAkLmV2ZW50Lm1vdXNlSG9va3M7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgc3BlY2lhbCA9ICQuZXZlbnQuc3BlY2lhbC5tb3VzZXdoZWVsID0ge1xuICAgICAgICB2ZXJzaW9uOiAnMy4xLjEyJyxcblxuICAgICAgICBzZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoIHRoaXMuYWRkRXZlbnRMaXN0ZW5lciApIHtcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IHRvQmluZC5sZW5ndGg7IGk7ICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoIHRvQmluZFstLWldLCBoYW5kbGVyLCBmYWxzZSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbm1vdXNld2hlZWwgPSBoYW5kbGVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gU3RvcmUgdGhlIGxpbmUgaGVpZ2h0IGFuZCBwYWdlIGhlaWdodCBmb3IgdGhpcyBwYXJ0aWN1bGFyIGVsZW1lbnRcbiAgICAgICAgICAgICQuZGF0YSh0aGlzLCAnbW91c2V3aGVlbC1saW5lLWhlaWdodCcsIHNwZWNpYWwuZ2V0TGluZUhlaWdodCh0aGlzKSk7XG4gICAgICAgICAgICAkLmRhdGEodGhpcywgJ21vdXNld2hlZWwtcGFnZS1oZWlnaHQnLCBzcGVjaWFsLmdldFBhZ2VIZWlnaHQodGhpcykpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICggdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyICkge1xuICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gdG9CaW5kLmxlbmd0aDsgaTsgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lciggdG9CaW5kWy0taV0sIGhhbmRsZXIsIGZhbHNlICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9ubW91c2V3aGVlbCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBDbGVhbiB1cCB0aGUgZGF0YSB3ZSBhZGRlZCB0byB0aGUgZWxlbWVudFxuICAgICAgICAgICAgJC5yZW1vdmVEYXRhKHRoaXMsICdtb3VzZXdoZWVsLWxpbmUtaGVpZ2h0Jyk7XG4gICAgICAgICAgICAkLnJlbW92ZURhdGEodGhpcywgJ21vdXNld2hlZWwtcGFnZS1oZWlnaHQnKTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRMaW5lSGVpZ2h0OiBmdW5jdGlvbihlbGVtKSB7XG4gICAgICAgICAgICB2YXIgJGVsZW0gPSAkKGVsZW0pLFxuICAgICAgICAgICAgICAgICRwYXJlbnQgPSAkZWxlbVsnb2Zmc2V0UGFyZW50JyBpbiAkLmZuID8gJ29mZnNldFBhcmVudCcgOiAncGFyZW50J10oKTtcbiAgICAgICAgICAgIGlmICghJHBhcmVudC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAkcGFyZW50ID0gJCgnYm9keScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KCRwYXJlbnQuY3NzKCdmb250U2l6ZScpLCAxMCkgfHwgcGFyc2VJbnQoJGVsZW0uY3NzKCdmb250U2l6ZScpLCAxMCkgfHwgMTY7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0UGFnZUhlaWdodDogZnVuY3Rpb24oZWxlbSkge1xuICAgICAgICAgICAgcmV0dXJuICQoZWxlbSkuaGVpZ2h0KCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICAgIGFkanVzdE9sZERlbHRhczogdHJ1ZSwgLy8gc2VlIHNob3VsZEFkanVzdE9sZERlbHRhcygpIGJlbG93XG4gICAgICAgICAgICBub3JtYWxpemVPZmZzZXQ6IHRydWUgIC8vIGNhbGxzIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBmb3IgZWFjaCBldmVudFxuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZm4uZXh0ZW5kKHtcbiAgICAgICAgbW91c2V3aGVlbDogZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgICAgIHJldHVybiBmbiA/IHRoaXMuYmluZCgnbW91c2V3aGVlbCcsIGZuKSA6IHRoaXMudHJpZ2dlcignbW91c2V3aGVlbCcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVubW91c2V3aGVlbDogZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnVuYmluZCgnbW91c2V3aGVlbCcsIGZuKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5cbiAgICBmdW5jdGlvbiBoYW5kbGVyKGV2ZW50KSB7XG4gICAgICAgIHZhciBvcmdFdmVudCAgID0gZXZlbnQgfHwgd2luZG93LmV2ZW50LFxuICAgICAgICAgICAgYXJncyAgICAgICA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSxcbiAgICAgICAgICAgIGRlbHRhICAgICAgPSAwLFxuICAgICAgICAgICAgZGVsdGFYICAgICA9IDAsXG4gICAgICAgICAgICBkZWx0YVkgICAgID0gMCxcbiAgICAgICAgICAgIGFic0RlbHRhICAgPSAwLFxuICAgICAgICAgICAgb2Zmc2V0WCAgICA9IDAsXG4gICAgICAgICAgICBvZmZzZXRZICAgID0gMDtcbiAgICAgICAgZXZlbnQgPSAkLmV2ZW50LmZpeChvcmdFdmVudCk7XG4gICAgICAgIGV2ZW50LnR5cGUgPSAnbW91c2V3aGVlbCc7XG5cbiAgICAgICAgLy8gT2xkIHNjaG9vbCBzY3JvbGx3aGVlbCBkZWx0YVxuICAgICAgICBpZiAoICdkZXRhaWwnICAgICAgaW4gb3JnRXZlbnQgKSB7IGRlbHRhWSA9IG9yZ0V2ZW50LmRldGFpbCAqIC0xOyAgICAgIH1cbiAgICAgICAgaWYgKCAnd2hlZWxEZWx0YScgIGluIG9yZ0V2ZW50ICkgeyBkZWx0YVkgPSBvcmdFdmVudC53aGVlbERlbHRhOyAgICAgICB9XG4gICAgICAgIGlmICggJ3doZWVsRGVsdGFZJyBpbiBvcmdFdmVudCApIHsgZGVsdGFZID0gb3JnRXZlbnQud2hlZWxEZWx0YVk7ICAgICAgfVxuICAgICAgICBpZiAoICd3aGVlbERlbHRhWCcgaW4gb3JnRXZlbnQgKSB7IGRlbHRhWCA9IG9yZ0V2ZW50LndoZWVsRGVsdGFYICogLTE7IH1cblxuICAgICAgICAvLyBGaXJlZm94IDwgMTcgaG9yaXpvbnRhbCBzY3JvbGxpbmcgcmVsYXRlZCB0byBET01Nb3VzZVNjcm9sbCBldmVudFxuICAgICAgICBpZiAoICdheGlzJyBpbiBvcmdFdmVudCAmJiBvcmdFdmVudC5heGlzID09PSBvcmdFdmVudC5IT1JJWk9OVEFMX0FYSVMgKSB7XG4gICAgICAgICAgICBkZWx0YVggPSBkZWx0YVkgKiAtMTtcbiAgICAgICAgICAgIGRlbHRhWSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZXQgZGVsdGEgdG8gYmUgZGVsdGFZIG9yIGRlbHRhWCBpZiBkZWx0YVkgaXMgMCBmb3IgYmFja3dhcmRzIGNvbXBhdGFiaWxpdGl5XG4gICAgICAgIGRlbHRhID0gZGVsdGFZID09PSAwID8gZGVsdGFYIDogZGVsdGFZO1xuXG4gICAgICAgIC8vIE5ldyBzY2hvb2wgd2hlZWwgZGVsdGEgKHdoZWVsIGV2ZW50KVxuICAgICAgICBpZiAoICdkZWx0YVknIGluIG9yZ0V2ZW50ICkge1xuICAgICAgICAgICAgZGVsdGFZID0gb3JnRXZlbnQuZGVsdGFZICogLTE7XG4gICAgICAgICAgICBkZWx0YSAgPSBkZWx0YVk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCAnZGVsdGFYJyBpbiBvcmdFdmVudCApIHtcbiAgICAgICAgICAgIGRlbHRhWCA9IG9yZ0V2ZW50LmRlbHRhWDtcbiAgICAgICAgICAgIGlmICggZGVsdGFZID09PSAwICkgeyBkZWx0YSAgPSBkZWx0YVggKiAtMTsgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gTm8gY2hhbmdlIGFjdHVhbGx5IGhhcHBlbmVkLCBubyByZWFzb24gdG8gZ28gYW55IGZ1cnRoZXJcbiAgICAgICAgaWYgKCBkZWx0YVkgPT09IDAgJiYgZGVsdGFYID09PSAwICkgeyByZXR1cm47IH1cblxuICAgICAgICAvLyBOZWVkIHRvIGNvbnZlcnQgbGluZXMgYW5kIHBhZ2VzIHRvIHBpeGVscyBpZiB3ZSBhcmVuJ3QgYWxyZWFkeSBpbiBwaXhlbHNcbiAgICAgICAgLy8gVGhlcmUgYXJlIHRocmVlIGRlbHRhIG1vZGVzOlxuICAgICAgICAvLyAgICogZGVsdGFNb2RlIDAgaXMgYnkgcGl4ZWxzLCBub3RoaW5nIHRvIGRvXG4gICAgICAgIC8vICAgKiBkZWx0YU1vZGUgMSBpcyBieSBsaW5lc1xuICAgICAgICAvLyAgICogZGVsdGFNb2RlIDIgaXMgYnkgcGFnZXNcbiAgICAgICAgaWYgKCBvcmdFdmVudC5kZWx0YU1vZGUgPT09IDEgKSB7XG4gICAgICAgICAgICB2YXIgbGluZUhlaWdodCA9ICQuZGF0YSh0aGlzLCAnbW91c2V3aGVlbC1saW5lLWhlaWdodCcpO1xuICAgICAgICAgICAgZGVsdGEgICo9IGxpbmVIZWlnaHQ7XG4gICAgICAgICAgICBkZWx0YVkgKj0gbGluZUhlaWdodDtcbiAgICAgICAgICAgIGRlbHRhWCAqPSBsaW5lSGVpZ2h0O1xuICAgICAgICB9IGVsc2UgaWYgKCBvcmdFdmVudC5kZWx0YU1vZGUgPT09IDIgKSB7XG4gICAgICAgICAgICB2YXIgcGFnZUhlaWdodCA9ICQuZGF0YSh0aGlzLCAnbW91c2V3aGVlbC1wYWdlLWhlaWdodCcpO1xuICAgICAgICAgICAgZGVsdGEgICo9IHBhZ2VIZWlnaHQ7XG4gICAgICAgICAgICBkZWx0YVkgKj0gcGFnZUhlaWdodDtcbiAgICAgICAgICAgIGRlbHRhWCAqPSBwYWdlSGVpZ2h0O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3RvcmUgbG93ZXN0IGFic29sdXRlIGRlbHRhIHRvIG5vcm1hbGl6ZSB0aGUgZGVsdGEgdmFsdWVzXG4gICAgICAgIGFic0RlbHRhID0gTWF0aC5tYXgoIE1hdGguYWJzKGRlbHRhWSksIE1hdGguYWJzKGRlbHRhWCkgKTtcblxuICAgICAgICBpZiAoICFsb3dlc3REZWx0YSB8fCBhYnNEZWx0YSA8IGxvd2VzdERlbHRhICkge1xuICAgICAgICAgICAgbG93ZXN0RGVsdGEgPSBhYnNEZWx0YTtcblxuICAgICAgICAgICAgLy8gQWRqdXN0IG9sZGVyIGRlbHRhcyBpZiBuZWNlc3NhcnlcbiAgICAgICAgICAgIGlmICggc2hvdWxkQWRqdXN0T2xkRGVsdGFzKG9yZ0V2ZW50LCBhYnNEZWx0YSkgKSB7XG4gICAgICAgICAgICAgICAgbG93ZXN0RGVsdGEgLz0gNDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGp1c3Qgb2xkZXIgZGVsdGFzIGlmIG5lY2Vzc2FyeVxuICAgICAgICBpZiAoIHNob3VsZEFkanVzdE9sZERlbHRhcyhvcmdFdmVudCwgYWJzRGVsdGEpICkge1xuICAgICAgICAgICAgLy8gRGl2aWRlIGFsbCB0aGUgdGhpbmdzIGJ5IDQwIVxuICAgICAgICAgICAgZGVsdGEgIC89IDQwO1xuICAgICAgICAgICAgZGVsdGFYIC89IDQwO1xuICAgICAgICAgICAgZGVsdGFZIC89IDQwO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2V0IGEgd2hvbGUsIG5vcm1hbGl6ZWQgdmFsdWUgZm9yIHRoZSBkZWx0YXNcbiAgICAgICAgZGVsdGEgID0gTWF0aFsgZGVsdGEgID49IDEgPyAnZmxvb3InIDogJ2NlaWwnIF0oZGVsdGEgIC8gbG93ZXN0RGVsdGEpO1xuICAgICAgICBkZWx0YVggPSBNYXRoWyBkZWx0YVggPj0gMSA/ICdmbG9vcicgOiAnY2VpbCcgXShkZWx0YVggLyBsb3dlc3REZWx0YSk7XG4gICAgICAgIGRlbHRhWSA9IE1hdGhbIGRlbHRhWSA+PSAxID8gJ2Zsb29yJyA6ICdjZWlsJyBdKGRlbHRhWSAvIGxvd2VzdERlbHRhKTtcblxuICAgICAgICAvLyBOb3JtYWxpc2Ugb2Zmc2V0WCBhbmQgb2Zmc2V0WSBwcm9wZXJ0aWVzXG4gICAgICAgIGlmICggc3BlY2lhbC5zZXR0aW5ncy5ub3JtYWxpemVPZmZzZXQgJiYgdGhpcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QgKSB7XG4gICAgICAgICAgICB2YXIgYm91bmRpbmdSZWN0ID0gdGhpcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIG9mZnNldFggPSBldmVudC5jbGllbnRYIC0gYm91bmRpbmdSZWN0LmxlZnQ7XG4gICAgICAgICAgICBvZmZzZXRZID0gZXZlbnQuY2xpZW50WSAtIGJvdW5kaW5nUmVjdC50b3A7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgaW5mb3JtYXRpb24gdG8gdGhlIGV2ZW50IG9iamVjdFxuICAgICAgICBldmVudC5kZWx0YVggPSBkZWx0YVg7XG4gICAgICAgIGV2ZW50LmRlbHRhWSA9IGRlbHRhWTtcbiAgICAgICAgZXZlbnQuZGVsdGFGYWN0b3IgPSBsb3dlc3REZWx0YTtcbiAgICAgICAgZXZlbnQub2Zmc2V0WCA9IG9mZnNldFg7XG4gICAgICAgIGV2ZW50Lm9mZnNldFkgPSBvZmZzZXRZO1xuICAgICAgICAvLyBHbyBhaGVhZCBhbmQgc2V0IGRlbHRhTW9kZSB0byAwIHNpbmNlIHdlIGNvbnZlcnRlZCB0byBwaXhlbHNcbiAgICAgICAgLy8gQWx0aG91Z2ggdGhpcyBpcyBhIGxpdHRsZSBvZGQgc2luY2Ugd2Ugb3ZlcndyaXRlIHRoZSBkZWx0YVgvWVxuICAgICAgICAvLyBwcm9wZXJ0aWVzIHdpdGggbm9ybWFsaXplZCBkZWx0YXMuXG4gICAgICAgIGV2ZW50LmRlbHRhTW9kZSA9IDA7XG5cbiAgICAgICAgLy8gQWRkIGV2ZW50IGFuZCBkZWx0YSB0byB0aGUgZnJvbnQgb2YgdGhlIGFyZ3VtZW50c1xuICAgICAgICBhcmdzLnVuc2hpZnQoZXZlbnQsIGRlbHRhLCBkZWx0YVgsIGRlbHRhWSk7XG5cbiAgICAgICAgLy8gQ2xlYXJvdXQgbG93ZXN0RGVsdGEgYWZ0ZXIgc29tZXRpbWUgdG8gYmV0dGVyXG4gICAgICAgIC8vIGhhbmRsZSBtdWx0aXBsZSBkZXZpY2UgdHlwZXMgdGhhdCBnaXZlIGRpZmZlcmVudFxuICAgICAgICAvLyBhIGRpZmZlcmVudCBsb3dlc3REZWx0YVxuICAgICAgICAvLyBFeDogdHJhY2twYWQgPSAzIGFuZCBtb3VzZSB3aGVlbCA9IDEyMFxuICAgICAgICBpZiAobnVsbExvd2VzdERlbHRhVGltZW91dCkgeyBjbGVhclRpbWVvdXQobnVsbExvd2VzdERlbHRhVGltZW91dCk7IH1cbiAgICAgICAgbnVsbExvd2VzdERlbHRhVGltZW91dCA9IHNldFRpbWVvdXQobnVsbExvd2VzdERlbHRhLCAyMDApO1xuXG4gICAgICAgIHJldHVybiAoJC5ldmVudC5kaXNwYXRjaCB8fCAkLmV2ZW50LmhhbmRsZSkuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbnVsbExvd2VzdERlbHRhKCkge1xuICAgICAgICBsb3dlc3REZWx0YSA9IG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvdWxkQWRqdXN0T2xkRGVsdGFzKG9yZ0V2ZW50LCBhYnNEZWx0YSkge1xuICAgICAgICAvLyBJZiB0aGlzIGlzIGFuIG9sZGVyIGV2ZW50IGFuZCB0aGUgZGVsdGEgaXMgZGl2aXNhYmxlIGJ5IDEyMCxcbiAgICAgICAgLy8gdGhlbiB3ZSBhcmUgYXNzdW1pbmcgdGhhdCB0aGUgYnJvd3NlciBpcyB0cmVhdGluZyB0aGlzIGFzIGFuXG4gICAgICAgIC8vIG9sZGVyIG1vdXNlIHdoZWVsIGV2ZW50IGFuZCB0aGF0IHdlIHNob3VsZCBkaXZpZGUgdGhlIGRlbHRhc1xuICAgICAgICAvLyBieSA0MCB0byB0cnkgYW5kIGdldCBhIG1vcmUgdXNhYmxlIGRlbHRhRmFjdG9yLlxuICAgICAgICAvLyBTaWRlIG5vdGUsIHRoaXMgYWN0dWFsbHkgaW1wYWN0cyB0aGUgcmVwb3J0ZWQgc2Nyb2xsIGRpc3RhbmNlXG4gICAgICAgIC8vIGluIG9sZGVyIGJyb3dzZXJzIGFuZCBjYW4gY2F1c2Ugc2Nyb2xsaW5nIHRvIGJlIHNsb3dlciB0aGFuIG5hdGl2ZS5cbiAgICAgICAgLy8gVHVybiB0aGlzIG9mZiBieSBzZXR0aW5nICQuZXZlbnQuc3BlY2lhbC5tb3VzZXdoZWVsLnNldHRpbmdzLmFkanVzdE9sZERlbHRhcyB0byBmYWxzZS5cbiAgICAgICAgcmV0dXJuIHNwZWNpYWwuc2V0dGluZ3MuYWRqdXN0T2xkRGVsdGFzICYmIG9yZ0V2ZW50LnR5cGUgPT09ICdtb3VzZXdoZWVsJyAmJiBhYnNEZWx0YSAlIDEyMCA9PT0gMDtcbiAgICB9XG5cbn0pKTtcbiIsIi8qISBWZWxvY2l0eUpTLm9yZyAoMS4yLjIpLiAoQykgMjAxNCBKdWxpYW4gU2hhcGlyby4gTUlUIEBsaWNlbnNlOiBlbi53aWtpcGVkaWEub3JnL3dpa2kvTUlUX0xpY2Vuc2UgKi9cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgVmVsb2NpdHkgalF1ZXJ5IFNoaW1cclxuKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbi8qISBWZWxvY2l0eUpTLm9yZyBqUXVlcnkgU2hpbSAoMS4wLjEpLiAoQykgMjAxNCBUaGUgalF1ZXJ5IEZvdW5kYXRpb24uIE1JVCBAbGljZW5zZTogZW4ud2lraXBlZGlhLm9yZy93aWtpL01JVF9MaWNlbnNlLiAqL1xyXG5cclxuLyogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBqUXVlcnkgZnVuY3Rpb25zIHRoYXQgVmVsb2NpdHkgcmVsaWVzIG9uLCB0aGVyZWJ5IHJlbW92aW5nIFZlbG9jaXR5J3MgZGVwZW5kZW5jeSBvbiBhIGZ1bGwgY29weSBvZiBqUXVlcnksIGFuZCBhbGxvd2luZyBpdCB0byB3b3JrIGluIGFueSBlbnZpcm9ubWVudC4gKi9cclxuLyogVGhlc2Ugc2hpbW1lZCBmdW5jdGlvbnMgYXJlIG9ubHkgdXNlZCBpZiBqUXVlcnkgaXNuJ3QgcHJlc2VudC4gSWYgYm90aCB0aGlzIHNoaW0gYW5kIGpRdWVyeSBhcmUgbG9hZGVkLCBWZWxvY2l0eSBkZWZhdWx0cyB0byBqUXVlcnkgcHJvcGVyLiAqL1xyXG4vKiBCcm93c2VyIHN1cHBvcnQ6IFVzaW5nIHRoaXMgc2hpbSBpbnN0ZWFkIG9mIGpRdWVyeSBwcm9wZXIgcmVtb3ZlcyBzdXBwb3J0IGZvciBJRTguICovXHJcblxyXG47KGZ1bmN0aW9uICh3aW5kb3cpIHtcclxuICAgIC8qKioqKioqKioqKioqKipcclxuICAgICAgICAgU2V0dXBcclxuICAgICoqKioqKioqKioqKioqKi9cclxuXHJcbiAgICAvKiBJZiBqUXVlcnkgaXMgYWxyZWFkeSBsb2FkZWQsIHRoZXJlJ3Mgbm8gcG9pbnQgaW4gbG9hZGluZyB0aGlzIHNoaW0uICovXHJcbiAgICBpZiAod2luZG93LmpRdWVyeSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvKiBqUXVlcnkgYmFzZS4gKi9cclxuICAgIHZhciAkID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBjb250ZXh0KSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyAkLmZuLmluaXQoc2VsZWN0b3IsIGNvbnRleHQpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgIFByaXZhdGUgTWV0aG9kc1xyXG4gICAgKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG4gICAgLyogalF1ZXJ5ICovXHJcbiAgICAkLmlzV2luZG93ID0gZnVuY3Rpb24gKG9iaikge1xyXG4gICAgICAgIC8qIGpzaGludCBlcWVxZXE6IGZhbHNlICovXHJcbiAgICAgICAgcmV0dXJuIG9iaiAhPSBudWxsICYmIG9iaiA9PSBvYmoud2luZG93O1xyXG4gICAgfTtcclxuXHJcbiAgICAvKiBqUXVlcnkgKi9cclxuICAgICQudHlwZSA9IGZ1bmN0aW9uIChvYmopIHtcclxuICAgICAgICBpZiAob2JqID09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG9iaiArIFwiXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2Ygb2JqID09PSBcImZ1bmN0aW9uXCIgP1xyXG4gICAgICAgICAgICBjbGFzczJ0eXBlW3RvU3RyaW5nLmNhbGwob2JqKV0gfHwgXCJvYmplY3RcIiA6XHJcbiAgICAgICAgICAgIHR5cGVvZiBvYmo7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qIGpRdWVyeSAqL1xyXG4gICAgJC5pc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuICQudHlwZShvYmopID09PSBcImFycmF5XCI7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qIGpRdWVyeSAqL1xyXG4gICAgZnVuY3Rpb24gaXNBcnJheWxpa2UgKG9iaikge1xyXG4gICAgICAgIHZhciBsZW5ndGggPSBvYmoubGVuZ3RoLFxyXG4gICAgICAgICAgICB0eXBlID0gJC50eXBlKG9iaik7XHJcblxyXG4gICAgICAgIGlmICh0eXBlID09PSBcImZ1bmN0aW9uXCIgfHwgJC5pc1dpbmRvdyhvYmopKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChvYmoubm9kZVR5cGUgPT09IDEgJiYgbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHR5cGUgPT09IFwiYXJyYXlcIiB8fCBsZW5ndGggPT09IDAgfHwgdHlwZW9mIGxlbmd0aCA9PT0gXCJudW1iZXJcIiAmJiBsZW5ndGggPiAwICYmIChsZW5ndGggLSAxKSBpbiBvYmo7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqKioqKioqKioqKioqKlxyXG4gICAgICAgJCBNZXRob2RzXHJcbiAgICAqKioqKioqKioqKioqKiovXHJcblxyXG4gICAgLyogalF1ZXJ5OiBTdXBwb3J0IHJlbW92ZWQgZm9yIElFPDkuICovXHJcbiAgICAkLmlzUGxhaW5PYmplY3QgPSBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgdmFyIGtleTtcclxuXHJcbiAgICAgICAgaWYgKCFvYmogfHwgJC50eXBlKG9iaikgIT09IFwib2JqZWN0XCIgfHwgb2JqLm5vZGVUeXBlIHx8ICQuaXNXaW5kb3cob2JqKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAob2JqLmNvbnN0cnVjdG9yICYmXHJcbiAgICAgICAgICAgICAgICAhaGFzT3duLmNhbGwob2JqLCBcImNvbnN0cnVjdG9yXCIpICYmXHJcbiAgICAgICAgICAgICAgICAhaGFzT3duLmNhbGwob2JqLmNvbnN0cnVjdG9yLnByb3RvdHlwZSwgXCJpc1Byb3RvdHlwZU9mXCIpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoa2V5IGluIG9iaikge31cclxuXHJcbiAgICAgICAgcmV0dXJuIGtleSA9PT0gdW5kZWZpbmVkIHx8IGhhc093bi5jYWxsKG9iaiwga2V5KTtcclxuICAgIH07XHJcblxyXG4gICAgLyogalF1ZXJ5ICovXHJcbiAgICAkLmVhY2ggPSBmdW5jdGlvbihvYmosIGNhbGxiYWNrLCBhcmdzKSB7XHJcbiAgICAgICAgdmFyIHZhbHVlLFxyXG4gICAgICAgICAgICBpID0gMCxcclxuICAgICAgICAgICAgbGVuZ3RoID0gb2JqLmxlbmd0aCxcclxuICAgICAgICAgICAgaXNBcnJheSA9IGlzQXJyYXlsaWtlKG9iaik7XHJcblxyXG4gICAgICAgIGlmIChhcmdzKSB7XHJcbiAgICAgICAgICAgIGlmIChpc0FycmF5KSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBjYWxsYmFjay5hcHBseShvYmpbaV0sIGFyZ3MpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGZvciAoaSBpbiBvYmopIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGNhbGxiYWNrLmFwcGx5KG9ialtpXSwgYXJncyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmIChpc0FycmF5KSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBjYWxsYmFjay5jYWxsKG9ialtpXSwgaSwgb2JqW2ldKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBjYWxsYmFjay5jYWxsKG9ialtpXSwgaSwgb2JqW2ldKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qIEN1c3RvbSAqL1xyXG4gICAgJC5kYXRhID0gZnVuY3Rpb24gKG5vZGUsIGtleSwgdmFsdWUpIHtcclxuICAgICAgICAvKiAkLmdldERhdGEoKSAqL1xyXG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHZhciBpZCA9IG5vZGVbJC5leHBhbmRvXSxcclxuICAgICAgICAgICAgICAgIHN0b3JlID0gaWQgJiYgY2FjaGVbaWRdO1xyXG5cclxuICAgICAgICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcmU7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RvcmUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChrZXkgaW4gc3RvcmUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RvcmVba2V5XTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIC8qICQuc2V0RGF0YSgpICovXHJcbiAgICAgICAgfSBlbHNlIGlmIChrZXkgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB2YXIgaWQgPSBub2RlWyQuZXhwYW5kb10gfHwgKG5vZGVbJC5leHBhbmRvXSA9ICsrJC51dWlkKTtcclxuXHJcbiAgICAgICAgICAgIGNhY2hlW2lkXSA9IGNhY2hlW2lkXSB8fCB7fTtcclxuICAgICAgICAgICAgY2FjaGVbaWRdW2tleV0gPSB2YWx1ZTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qIEN1c3RvbSAqL1xyXG4gICAgJC5yZW1vdmVEYXRhID0gZnVuY3Rpb24gKG5vZGUsIGtleXMpIHtcclxuICAgICAgICB2YXIgaWQgPSBub2RlWyQuZXhwYW5kb10sXHJcbiAgICAgICAgICAgIHN0b3JlID0gaWQgJiYgY2FjaGVbaWRdO1xyXG5cclxuICAgICAgICBpZiAoc3RvcmUpIHtcclxuICAgICAgICAgICAgJC5lYWNoKGtleXMsIGZ1bmN0aW9uKF8sIGtleSkge1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHN0b3JlW2tleV07XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyogalF1ZXJ5ICovXHJcbiAgICAkLmV4dGVuZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgc3JjLCBjb3B5SXNBcnJheSwgY29weSwgbmFtZSwgb3B0aW9ucywgY2xvbmUsXHJcbiAgICAgICAgICAgIHRhcmdldCA9IGFyZ3VtZW50c1swXSB8fCB7fSxcclxuICAgICAgICAgICAgaSA9IDEsXHJcbiAgICAgICAgICAgIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGRlZXAgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiB0YXJnZXQgPT09IFwiYm9vbGVhblwiKSB7XHJcbiAgICAgICAgICAgIGRlZXAgPSB0YXJnZXQ7XHJcblxyXG4gICAgICAgICAgICB0YXJnZXQgPSBhcmd1bWVudHNbaV0gfHwge307XHJcbiAgICAgICAgICAgIGkrKztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0ICE9PSBcIm9iamVjdFwiICYmICQudHlwZSh0YXJnZXQpICE9PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgdGFyZ2V0ID0ge307XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaSA9PT0gbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHRhcmdldCA9IHRoaXM7XHJcbiAgICAgICAgICAgIGktLTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKChvcHRpb25zID0gYXJndW1lbnRzW2ldKSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKG5hbWUgaW4gb3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgICAgIHNyYyA9IHRhcmdldFtuYW1lXTtcclxuICAgICAgICAgICAgICAgICAgICBjb3B5ID0gb3B0aW9uc1tuYW1lXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldCA9PT0gY29weSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWVwICYmIGNvcHkgJiYgKCQuaXNQbGFpbk9iamVjdChjb3B5KSB8fCAoY29weUlzQXJyYXkgPSAkLmlzQXJyYXkoY29weSkpKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29weUlzQXJyYXkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvcHlJc0FycmF5ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZSA9IHNyYyAmJiAkLmlzQXJyYXkoc3JjKSA/IHNyYyA6IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lID0gc3JjICYmICQuaXNQbGFpbk9iamVjdChzcmMpID8gc3JjIDoge307XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFtuYW1lXSA9ICQuZXh0ZW5kKGRlZXAsIGNsb25lLCBjb3B5KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjb3B5ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0W25hbWVdID0gY29weTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0YXJnZXQ7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qIGpRdWVyeSAxLjQuMyAqL1xyXG4gICAgJC5xdWV1ZSA9IGZ1bmN0aW9uIChlbGVtLCB0eXBlLCBkYXRhKSB7XHJcbiAgICAgICAgZnVuY3Rpb24gJG1ha2VBcnJheSAoYXJyLCByZXN1bHRzKSB7XHJcbiAgICAgICAgICAgIHZhciByZXQgPSByZXN1bHRzIHx8IFtdO1xyXG5cclxuICAgICAgICAgICAgaWYgKGFyciAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNBcnJheWxpa2UoT2JqZWN0KGFycikpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLyogJC5tZXJnZSAqL1xyXG4gICAgICAgICAgICAgICAgICAgIChmdW5jdGlvbihmaXJzdCwgc2Vjb25kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsZW4gPSArc2Vjb25kLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGogPSAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaSA9IGZpcnN0Lmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChqIDwgbGVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaXJzdFtpKytdID0gc2Vjb25kW2orK107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsZW4gIT09IGxlbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHNlY29uZFtqXSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3RbaSsrXSA9IHNlY29uZFtqKytdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJzdC5sZW5ndGggPSBpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpcnN0O1xyXG4gICAgICAgICAgICAgICAgICAgIH0pKHJldCwgdHlwZW9mIGFyciA9PT0gXCJzdHJpbmdcIiA/IFthcnJdIDogYXJyKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgW10ucHVzaC5jYWxsKHJldCwgYXJyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghZWxlbSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0eXBlID0gKHR5cGUgfHwgXCJmeFwiKSArIFwicXVldWVcIjtcclxuXHJcbiAgICAgICAgdmFyIHEgPSAkLmRhdGEoZWxlbSwgdHlwZSk7XHJcblxyXG4gICAgICAgIGlmICghZGF0YSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcSB8fCBbXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghcSB8fCAkLmlzQXJyYXkoZGF0YSkpIHtcclxuICAgICAgICAgICAgcSA9ICQuZGF0YShlbGVtLCB0eXBlLCAkbWFrZUFycmF5KGRhdGEpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBxLnB1c2goZGF0YSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcTtcclxuICAgIH07XHJcblxyXG4gICAgLyogalF1ZXJ5IDEuNC4zICovXHJcbiAgICAkLmRlcXVldWUgPSBmdW5jdGlvbiAoZWxlbXMsIHR5cGUpIHtcclxuICAgICAgICAvKiBDdXN0b206IEVtYmVkIGVsZW1lbnQgaXRlcmF0aW9uLiAqL1xyXG4gICAgICAgICQuZWFjaChlbGVtcy5ub2RlVHlwZSA/IFsgZWxlbXMgXSA6IGVsZW1zLCBmdW5jdGlvbihpLCBlbGVtKSB7XHJcbiAgICAgICAgICAgIHR5cGUgPSB0eXBlIHx8IFwiZnhcIjtcclxuXHJcbiAgICAgICAgICAgIHZhciBxdWV1ZSA9ICQucXVldWUoZWxlbSwgdHlwZSksXHJcbiAgICAgICAgICAgICAgICBmbiA9IHF1ZXVlLnNoaWZ0KCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZm4gPT09IFwiaW5wcm9ncmVzc1wiKSB7XHJcbiAgICAgICAgICAgICAgICBmbiA9IHF1ZXVlLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChmbikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT09IFwiZnhcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIHF1ZXVlLnVuc2hpZnQoXCJpbnByb2dyZXNzXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGZuLmNhbGwoZWxlbSwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJC5kZXF1ZXVlKGVsZW0sIHR5cGUpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgJC5mbiBNZXRob2RzXHJcbiAgICAqKioqKioqKioqKioqKioqKiovXHJcblxyXG4gICAgLyogalF1ZXJ5ICovXHJcbiAgICAkLmZuID0gJC5wcm90b3R5cGUgPSB7XHJcbiAgICAgICAgaW5pdDogZnVuY3Rpb24gKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIC8qIEp1c3QgcmV0dXJuIHRoZSBlbGVtZW50IHdyYXBwZWQgaW5zaWRlIGFuIGFycmF5OyBkb24ndCBwcm9jZWVkIHdpdGggdGhlIGFjdHVhbCBqUXVlcnkgbm9kZSB3cmFwcGluZyBwcm9jZXNzLiAqL1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3Iubm9kZVR5cGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXNbMF0gPSBzZWxlY3RvcjtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBhIERPTSBub2RlLlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIG9mZnNldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvKiBqUXVlcnkgYWx0ZXJlZCBjb2RlOiBEcm9wcGVkIGRpc2Nvbm5lY3RlZCBET00gbm9kZSBjaGVja2luZy4gKi9cclxuICAgICAgICAgICAgdmFyIGJveCA9IHRoaXNbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0ID8gdGhpc1swXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSA6IHsgdG9wOiAwLCBsZWZ0OiAwIH07XHJcblxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgdG9wOiBib3gudG9wICsgKHdpbmRvdy5wYWdlWU9mZnNldCB8fCBkb2N1bWVudC5zY3JvbGxUb3AgIHx8IDApICAtIChkb2N1bWVudC5jbGllbnRUb3AgIHx8IDApLFxyXG4gICAgICAgICAgICAgICAgbGVmdDogYm94LmxlZnQgKyAod2luZG93LnBhZ2VYT2Zmc2V0IHx8IGRvY3VtZW50LnNjcm9sbExlZnQgIHx8IDApIC0gKGRvY3VtZW50LmNsaWVudExlZnQgfHwgMClcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBwb3NpdGlvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvKiBqUXVlcnkgKi9cclxuICAgICAgICAgICAgZnVuY3Rpb24gb2Zmc2V0UGFyZW50KCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9mZnNldFBhcmVudCA9IHRoaXMub2Zmc2V0UGFyZW50IHx8IGRvY3VtZW50O1xyXG5cclxuICAgICAgICAgICAgICAgIHdoaWxlIChvZmZzZXRQYXJlbnQgJiYgKCFvZmZzZXRQYXJlbnQubm9kZVR5cGUudG9Mb3dlckNhc2UgPT09IFwiaHRtbFwiICYmIG9mZnNldFBhcmVudC5zdHlsZS5wb3NpdGlvbiA9PT0gXCJzdGF0aWNcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBvZmZzZXRQYXJlbnQgPSBvZmZzZXRQYXJlbnQub2Zmc2V0UGFyZW50O1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBvZmZzZXRQYXJlbnQgfHwgZG9jdW1lbnQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8qIFplcHRvICovXHJcbiAgICAgICAgICAgIHZhciBlbGVtID0gdGhpc1swXSxcclxuICAgICAgICAgICAgICAgIG9mZnNldFBhcmVudCA9IG9mZnNldFBhcmVudC5hcHBseShlbGVtKSxcclxuICAgICAgICAgICAgICAgIG9mZnNldCA9IHRoaXMub2Zmc2V0KCksXHJcbiAgICAgICAgICAgICAgICBwYXJlbnRPZmZzZXQgPSAvXig/OmJvZHl8aHRtbCkkL2kudGVzdChvZmZzZXRQYXJlbnQubm9kZU5hbWUpID8geyB0b3A6IDAsIGxlZnQ6IDAgfSA6ICQob2Zmc2V0UGFyZW50KS5vZmZzZXQoKVxyXG5cclxuICAgICAgICAgICAgb2Zmc2V0LnRvcCAtPSBwYXJzZUZsb2F0KGVsZW0uc3R5bGUubWFyZ2luVG9wKSB8fCAwO1xyXG4gICAgICAgICAgICBvZmZzZXQubGVmdCAtPSBwYXJzZUZsb2F0KGVsZW0uc3R5bGUubWFyZ2luTGVmdCkgfHwgMDtcclxuXHJcbiAgICAgICAgICAgIGlmIChvZmZzZXRQYXJlbnQuc3R5bGUpIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudE9mZnNldC50b3AgKz0gcGFyc2VGbG9hdChvZmZzZXRQYXJlbnQuc3R5bGUuYm9yZGVyVG9wV2lkdGgpIHx8IDBcclxuICAgICAgICAgICAgICAgIHBhcmVudE9mZnNldC5sZWZ0ICs9IHBhcnNlRmxvYXQob2Zmc2V0UGFyZW50LnN0eWxlLmJvcmRlckxlZnRXaWR0aCkgfHwgMFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgdG9wOiBvZmZzZXQudG9wIC0gcGFyZW50T2Zmc2V0LnRvcCxcclxuICAgICAgICAgICAgICAgIGxlZnQ6IG9mZnNldC5sZWZ0IC0gcGFyZW50T2Zmc2V0LmxlZnRcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgICBQcml2YXRlIFZhcmlhYmxlc1xyXG4gICAgKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbiAgICAvKiBGb3IgJC5kYXRhKCkgKi9cclxuICAgIHZhciBjYWNoZSA9IHt9O1xyXG4gICAgJC5leHBhbmRvID0gXCJ2ZWxvY2l0eVwiICsgKG5ldyBEYXRlKCkuZ2V0VGltZSgpKTtcclxuICAgICQudXVpZCA9IDA7XHJcblxyXG4gICAgLyogRm9yICQucXVldWUoKSAqL1xyXG4gICAgdmFyIGNsYXNzMnR5cGUgPSB7fSxcclxuICAgICAgICBoYXNPd24gPSBjbGFzczJ0eXBlLmhhc093blByb3BlcnR5LFxyXG4gICAgICAgIHRvU3RyaW5nID0gY2xhc3MydHlwZS50b1N0cmluZztcclxuXHJcbiAgICB2YXIgdHlwZXMgPSBcIkJvb2xlYW4gTnVtYmVyIFN0cmluZyBGdW5jdGlvbiBBcnJheSBEYXRlIFJlZ0V4cCBPYmplY3QgRXJyb3JcIi5zcGxpdChcIiBcIik7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHR5cGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgY2xhc3MydHlwZVtcIltvYmplY3QgXCIgKyB0eXBlc1tpXSArIFwiXVwiXSA9IHR5cGVzW2ldLnRvTG93ZXJDYXNlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyogTWFrZXMgJChub2RlKSBwb3NzaWJsZSwgd2l0aG91dCBoYXZpbmcgdG8gY2FsbCBpbml0LiAqL1xyXG4gICAgJC5mbi5pbml0LnByb3RvdHlwZSA9ICQuZm47XHJcblxyXG4gICAgLyogR2xvYmFsaXplIFZlbG9jaXR5IG9udG8gdGhlIHdpbmRvdywgYW5kIGFzc2lnbiBpdHMgVXRpbGl0aWVzIHByb3BlcnR5LiAqL1xyXG4gICAgd2luZG93LlZlbG9jaXR5ID0geyBVdGlsaXRpZXM6ICQgfTtcclxufSkod2luZG93KTtcblxuLyoqKioqKioqKioqKioqKioqKlxuICAgIFZlbG9jaXR5LmpzXG4qKioqKioqKioqKioqKioqKiovXG5cbjsoZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICAvKiBDb21tb25KUyBtb2R1bGUuICovXG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICAgIC8qIEFNRCBtb2R1bGUuICovXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoZmFjdG9yeSk7XG4gICAgLyogQnJvd3NlciBnbG9iYWxzLiAqL1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoKTtcbiAgICB9XG59KGZ1bmN0aW9uKCkge1xucmV0dXJuIGZ1bmN0aW9uIChnbG9iYWwsIHdpbmRvdywgZG9jdW1lbnQsIHVuZGVmaW5lZCkge1xuXG4gICAgLyoqKioqKioqKioqKioqKlxuICAgICAgICBTdW1tYXJ5XG4gICAgKioqKioqKioqKioqKioqL1xuXG4gICAgLypcbiAgICAtIENTUzogQ1NTIHN0YWNrIHRoYXQgd29ya3MgaW5kZXBlbmRlbnRseSBmcm9tIHRoZSByZXN0IG9mIFZlbG9jaXR5LlxuICAgIC0gYW5pbWF0ZSgpOiBDb3JlIGFuaW1hdGlvbiBtZXRob2QgdGhhdCBpdGVyYXRlcyBvdmVyIHRoZSB0YXJnZXRlZCBlbGVtZW50cyBhbmQgcXVldWVzIHRoZSBpbmNvbWluZyBjYWxsIG9udG8gZWFjaCBlbGVtZW50IGluZGl2aWR1YWxseS5cbiAgICAgIC0gUHJlLVF1ZXVlaW5nOiBQcmVwYXJlIHRoZSBlbGVtZW50IGZvciBhbmltYXRpb24gYnkgaW5zdGFudGlhdGluZyBpdHMgZGF0YSBjYWNoZSBhbmQgcHJvY2Vzc2luZyB0aGUgY2FsbCdzIG9wdGlvbnMuXG4gICAgICAtIFF1ZXVlaW5nOiBUaGUgbG9naWMgdGhhdCBydW5zIG9uY2UgdGhlIGNhbGwgaGFzIHJlYWNoZWQgaXRzIHBvaW50IG9mIGV4ZWN1dGlvbiBpbiB0aGUgZWxlbWVudCdzICQucXVldWUoKSBzdGFjay5cbiAgICAgICAgICAgICAgICAgIE1vc3QgbG9naWMgaXMgcGxhY2VkIGhlcmUgdG8gYXZvaWQgcmlza2luZyBpdCBiZWNvbWluZyBzdGFsZSAoaWYgdGhlIGVsZW1lbnQncyBwcm9wZXJ0aWVzIGhhdmUgY2hhbmdlZCkuXG4gICAgICAtIFB1c2hpbmc6IENvbnNvbGlkYXRpb24gb2YgdGhlIHR3ZWVuIGRhdGEgZm9sbG93ZWQgYnkgaXRzIHB1c2ggb250byB0aGUgZ2xvYmFsIGluLXByb2dyZXNzIGNhbGxzIGNvbnRhaW5lci5cbiAgICAtIHRpY2soKTogVGhlIHNpbmdsZSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgbG9vcCByZXNwb25zaWJsZSBmb3IgdHdlZW5pbmcgYWxsIGluLXByb2dyZXNzIGNhbGxzLlxuICAgIC0gY29tcGxldGVDYWxsKCk6IEhhbmRsZXMgdGhlIGNsZWFudXAgcHJvY2VzcyBmb3IgZWFjaCBWZWxvY2l0eSBjYWxsLlxuICAgICovXG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgSGVscGVyIEZ1bmN0aW9uc1xuICAgICoqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIC8qIElFIGRldGVjdGlvbi4gR2lzdDogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vanVsaWFuc2hhcGlyby85MDk4NjA5ICovXG4gICAgdmFyIElFID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoZG9jdW1lbnQuZG9jdW1lbnRNb2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuZG9jdW1lbnRNb2RlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDc7IGkgPiA0OyBpLS0pIHtcbiAgICAgICAgICAgICAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgICAgICAgICAgICAgIGRpdi5pbm5lckhUTUwgPSBcIjwhLS1baWYgSUUgXCIgKyBpICsgXCJdPjxzcGFuPjwvc3Bhbj48IVtlbmRpZl0tLT5cIjtcblxuICAgICAgICAgICAgICAgIGlmIChkaXYuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzcGFuXCIpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBkaXYgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSkoKTtcblxuICAgIC8qIHJBRiBzaGltLiBHaXN0OiBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9qdWxpYW5zaGFwaXJvLzk0OTc1MTMgKi9cbiAgICB2YXIgckFGU2hpbSA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRpbWVMYXN0ID0gMDtcblxuICAgICAgICByZXR1cm4gd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgdGltZUN1cnJlbnQgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpLFxuICAgICAgICAgICAgICAgIHRpbWVEZWx0YTtcblxuICAgICAgICAgICAgLyogRHluYW1pY2FsbHkgc2V0IGRlbGF5IG9uIGEgcGVyLXRpY2sgYmFzaXMgdG8gbWF0Y2ggNjBmcHMuICovXG4gICAgICAgICAgICAvKiBUZWNobmlxdWUgYnkgRXJpayBNb2xsZXIuIE1JVCBsaWNlbnNlOiBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9wYXVsaXJpc2gvMTU3OTY3MSAqL1xuICAgICAgICAgICAgdGltZURlbHRhID0gTWF0aC5tYXgoMCwgMTYgLSAodGltZUN1cnJlbnQgLSB0aW1lTGFzdCkpO1xuICAgICAgICAgICAgdGltZUxhc3QgPSB0aW1lQ3VycmVudCArIHRpbWVEZWx0YTtcblxuICAgICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKHRpbWVDdXJyZW50ICsgdGltZURlbHRhKTsgfSwgdGltZURlbHRhKTtcbiAgICAgICAgfTtcbiAgICB9KSgpO1xuXG4gICAgLyogQXJyYXkgY29tcGFjdGluZy4gQ29weXJpZ2h0IExvLURhc2guIE1JVCBMaWNlbnNlOiBodHRwczovL2dpdGh1Yi5jb20vbG9kYXNoL2xvZGFzaC9ibG9iL21hc3Rlci9MSUNFTlNFLnR4dCAqL1xuICAgIGZ1bmN0aW9uIGNvbXBhY3RTcGFyc2VBcnJheSAoYXJyYXkpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgICBsZW5ndGggPSBhcnJheSA/IGFycmF5Lmxlbmd0aCA6IDAsXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcblxuICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gYXJyYXlbaW5kZXhdO1xuXG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNhbml0aXplRWxlbWVudHMgKGVsZW1lbnRzKSB7XG4gICAgICAgIC8qIFVud3JhcCBqUXVlcnkvWmVwdG8gb2JqZWN0cy4gKi9cbiAgICAgICAgaWYgKFR5cGUuaXNXcmFwcGVkKGVsZW1lbnRzKSkge1xuICAgICAgICAgICAgZWxlbWVudHMgPSBbXS5zbGljZS5jYWxsKGVsZW1lbnRzKTtcbiAgICAgICAgLyogV3JhcCBhIHNpbmdsZSBlbGVtZW50IGluIGFuIGFycmF5IHNvIHRoYXQgJC5lYWNoKCkgY2FuIGl0ZXJhdGUgd2l0aCB0aGUgZWxlbWVudCBpbnN0ZWFkIG9mIGl0cyBub2RlJ3MgY2hpbGRyZW4uICovXG4gICAgICAgIH0gZWxzZSBpZiAoVHlwZS5pc05vZGUoZWxlbWVudHMpKSB7XG4gICAgICAgICAgICBlbGVtZW50cyA9IFsgZWxlbWVudHMgXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbGVtZW50cztcbiAgICB9XG5cbiAgICB2YXIgVHlwZSA9IHtcbiAgICAgICAgaXNTdHJpbmc6IGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuICh0eXBlb2YgdmFyaWFibGUgPT09IFwic3RyaW5nXCIpO1xuICAgICAgICB9LFxuICAgICAgICBpc0FycmF5OiBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YXJpYWJsZSkgPT09IFwiW29iamVjdCBBcnJheV1cIjtcbiAgICAgICAgfSxcbiAgICAgICAgaXNGdW5jdGlvbjogZnVuY3Rpb24gKHZhcmlhYmxlKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhcmlhYmxlKSA9PT0gXCJbb2JqZWN0IEZ1bmN0aW9uXVwiO1xuICAgICAgICB9LFxuICAgICAgICBpc05vZGU6IGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhcmlhYmxlICYmIHZhcmlhYmxlLm5vZGVUeXBlO1xuICAgICAgICB9LFxuICAgICAgICAvKiBDb3B5cmlnaHQgTWFydGluIEJvaG0uIE1JVCBMaWNlbnNlOiBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9Ub21hbGFrLzgxOGE3OGEyMjZhMDczOGVhYWRlICovXG4gICAgICAgIGlzTm9kZUxpc3Q6IGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB2YXJpYWJsZSA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICAgICAgICAgIC9eXFxbb2JqZWN0IChIVE1MQ29sbGVjdGlvbnxOb2RlTGlzdHxPYmplY3QpXFxdJC8udGVzdChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFyaWFibGUpKSAmJlxuICAgICAgICAgICAgICAgIHZhcmlhYmxlLmxlbmd0aCAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICAgICAgKHZhcmlhYmxlLmxlbmd0aCA9PT0gMCB8fCAodHlwZW9mIHZhcmlhYmxlWzBdID09PSBcIm9iamVjdFwiICYmIHZhcmlhYmxlWzBdLm5vZGVUeXBlID4gMCkpO1xuICAgICAgICB9LFxuICAgICAgICAvKiBEZXRlcm1pbmUgaWYgdmFyaWFibGUgaXMgYSB3cmFwcGVkIGpRdWVyeSBvciBaZXB0byBlbGVtZW50LiAqL1xuICAgICAgICBpc1dyYXBwZWQ6IGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhcmlhYmxlICYmICh2YXJpYWJsZS5qcXVlcnkgfHwgKHdpbmRvdy5aZXB0byAmJiB3aW5kb3cuWmVwdG8uemVwdG8uaXNaKHZhcmlhYmxlKSkpO1xuICAgICAgICB9LFxuICAgICAgICBpc1NWRzogZnVuY3Rpb24gKHZhcmlhYmxlKSB7XG4gICAgICAgICAgICByZXR1cm4gd2luZG93LlNWR0VsZW1lbnQgJiYgKHZhcmlhYmxlIGluc3RhbmNlb2Ygd2luZG93LlNWR0VsZW1lbnQpO1xuICAgICAgICB9LFxuICAgICAgICBpc0VtcHR5T2JqZWN0OiBmdW5jdGlvbiAodmFyaWFibGUpIHtcbiAgICAgICAgICAgIGZvciAodmFyIG5hbWUgaW4gdmFyaWFibGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKioqKioqKioqKioqKioqKlxuICAgICAgIERlcGVuZGVuY2llc1xuICAgICoqKioqKioqKioqKioqKioqL1xuXG4gICAgdmFyICQsXG4gICAgICAgIGlzSlF1ZXJ5ID0gZmFsc2U7XG5cbiAgICBpZiAoZ2xvYmFsLmZuICYmIGdsb2JhbC5mbi5qcXVlcnkpIHtcbiAgICAgICAgJCA9IGdsb2JhbDtcbiAgICAgICAgaXNKUXVlcnkgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICQgPSB3aW5kb3cuVmVsb2NpdHkuVXRpbGl0aWVzO1xuICAgIH1cblxuICAgIGlmIChJRSA8PSA4ICYmICFpc0pRdWVyeSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJWZWxvY2l0eTogSUU4IGFuZCBiZWxvdyByZXF1aXJlIGpRdWVyeSB0byBiZSBsb2FkZWQgYmVmb3JlIFZlbG9jaXR5LlwiKTtcbiAgICB9IGVsc2UgaWYgKElFIDw9IDcpIHtcbiAgICAgICAgLyogUmV2ZXJ0IHRvIGpRdWVyeSdzICQuYW5pbWF0ZSgpLCBhbmQgbG9zZSBWZWxvY2l0eSdzIGV4dHJhIGZlYXR1cmVzLiAqL1xuICAgICAgICBqUXVlcnkuZm4udmVsb2NpdHkgPSBqUXVlcnkuZm4uYW5pbWF0ZTtcblxuICAgICAgICAvKiBOb3cgdGhhdCAkLmZuLnZlbG9jaXR5IGlzIGFsaWFzZWQsIGFib3J0IHRoaXMgVmVsb2NpdHkgZGVjbGFyYXRpb24uICovXG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKipcbiAgICAgICAgQ29uc3RhbnRzXG4gICAgKioqKioqKioqKioqKioqKiovXG5cbiAgICB2YXIgRFVSQVRJT05fREVGQVVMVCA9IDQwMCxcbiAgICAgICAgRUFTSU5HX0RFRkFVTFQgPSBcInN3aW5nXCI7XG5cbiAgICAvKioqKioqKioqKioqKlxuICAgICAgICBTdGF0ZVxuICAgICoqKioqKioqKioqKiovXG5cbiAgICB2YXIgVmVsb2NpdHkgPSB7XG4gICAgICAgIC8qIENvbnRhaW5lciBmb3IgcGFnZS13aWRlIFZlbG9jaXR5IHN0YXRlIGRhdGEuICovXG4gICAgICAgIFN0YXRlOiB7XG4gICAgICAgICAgICAvKiBEZXRlY3QgbW9iaWxlIGRldmljZXMgdG8gZGV0ZXJtaW5lIGlmIG1vYmlsZUhBIHNob3VsZCBiZSB0dXJuZWQgb24uICovXG4gICAgICAgICAgICBpc01vYmlsZTogL0FuZHJvaWR8d2ViT1N8aVBob25lfGlQYWR8aVBvZHxCbGFja0JlcnJ5fElFTW9iaWxlfE9wZXJhIE1pbmkvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpLFxuICAgICAgICAgICAgLyogVGhlIG1vYmlsZUhBIG9wdGlvbidzIGJlaGF2aW9yIGNoYW5nZXMgb24gb2xkZXIgQW5kcm9pZCBkZXZpY2VzIChHaW5nZXJicmVhZCwgdmVyc2lvbnMgMi4zLjMtMi4zLjcpLiAqL1xuICAgICAgICAgICAgaXNBbmRyb2lkOiAvQW5kcm9pZC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCksXG4gICAgICAgICAgICBpc0dpbmdlcmJyZWFkOiAvQW5kcm9pZCAyXFwuM1xcLlszLTddL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSxcbiAgICAgICAgICAgIGlzQ2hyb21lOiB3aW5kb3cuY2hyb21lLFxuICAgICAgICAgICAgaXNGaXJlZm94OiAvRmlyZWZveC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCksXG4gICAgICAgICAgICAvKiBDcmVhdGUgYSBjYWNoZWQgZWxlbWVudCBmb3IgcmUtdXNlIHdoZW4gY2hlY2tpbmcgZm9yIENTUyBwcm9wZXJ0eSBwcmVmaXhlcy4gKi9cbiAgICAgICAgICAgIHByZWZpeEVsZW1lbnQ6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksXG4gICAgICAgICAgICAvKiBDYWNoZSBldmVyeSBwcmVmaXggbWF0Y2ggdG8gYXZvaWQgcmVwZWF0aW5nIGxvb2t1cHMuICovXG4gICAgICAgICAgICBwcmVmaXhNYXRjaGVzOiB7fSxcbiAgICAgICAgICAgIC8qIENhY2hlIHRoZSBhbmNob3IgdXNlZCBmb3IgYW5pbWF0aW5nIHdpbmRvdyBzY3JvbGxpbmcuICovXG4gICAgICAgICAgICBzY3JvbGxBbmNob3I6IG51bGwsXG4gICAgICAgICAgICAvKiBDYWNoZSB0aGUgYnJvd3Nlci1zcGVjaWZpYyBwcm9wZXJ0eSBuYW1lcyBhc3NvY2lhdGVkIHdpdGggdGhlIHNjcm9sbCBhbmNob3IuICovXG4gICAgICAgICAgICBzY3JvbGxQcm9wZXJ0eUxlZnQ6IG51bGwsXG4gICAgICAgICAgICBzY3JvbGxQcm9wZXJ0eVRvcDogbnVsbCxcbiAgICAgICAgICAgIC8qIEtlZXAgdHJhY2sgb2Ygd2hldGhlciBvdXIgUkFGIHRpY2sgaXMgcnVubmluZy4gKi9cbiAgICAgICAgICAgIGlzVGlja2luZzogZmFsc2UsXG4gICAgICAgICAgICAvKiBDb250YWluZXIgZm9yIGV2ZXJ5IGluLXByb2dyZXNzIGNhbGwgdG8gVmVsb2NpdHkuICovXG4gICAgICAgICAgICBjYWxsczogW11cbiAgICAgICAgfSxcbiAgICAgICAgLyogVmVsb2NpdHkncyBjdXN0b20gQ1NTIHN0YWNrLiBNYWRlIGdsb2JhbCBmb3IgdW5pdCB0ZXN0aW5nLiAqL1xuICAgICAgICBDU1M6IHsgLyogRGVmaW5lZCBiZWxvdy4gKi8gfSxcbiAgICAgICAgLyogQSBzaGltIG9mIHRoZSBqUXVlcnkgdXRpbGl0eSBmdW5jdGlvbnMgdXNlZCBieSBWZWxvY2l0eSAtLSBwcm92aWRlZCBieSBWZWxvY2l0eSdzIG9wdGlvbmFsIGpRdWVyeSBzaGltLiAqL1xuICAgICAgICBVdGlsaXRpZXM6ICQsXG4gICAgICAgIC8qIENvbnRhaW5lciBmb3IgdGhlIHVzZXIncyBjdXN0b20gYW5pbWF0aW9uIHJlZGlyZWN0cyB0aGF0IGFyZSByZWZlcmVuY2VkIGJ5IG5hbWUgaW4gcGxhY2Ugb2YgdGhlIHByb3BlcnRpZXMgbWFwIGFyZ3VtZW50LiAqL1xuICAgICAgICBSZWRpcmVjdHM6IHsgLyogTWFudWFsbHkgcmVnaXN0ZXJlZCBieSB0aGUgdXNlci4gKi8gfSxcbiAgICAgICAgRWFzaW5nczogeyAvKiBEZWZpbmVkIGJlbG93LiAqLyB9LFxuICAgICAgICAvKiBBdHRlbXB0IHRvIHVzZSBFUzYgUHJvbWlzZXMgYnkgZGVmYXVsdC4gVXNlcnMgY2FuIG92ZXJyaWRlIHRoaXMgd2l0aCBhIHRoaXJkLXBhcnR5IHByb21pc2VzIGxpYnJhcnkuICovXG4gICAgICAgIFByb21pc2U6IHdpbmRvdy5Qcm9taXNlLFxuICAgICAgICAvKiBWZWxvY2l0eSBvcHRpb24gZGVmYXVsdHMsIHdoaWNoIGNhbiBiZSBvdmVycmlkZW4gYnkgdGhlIHVzZXIuICovXG4gICAgICAgIGRlZmF1bHRzOiB7XG4gICAgICAgICAgICBxdWV1ZTogXCJcIixcbiAgICAgICAgICAgIGR1cmF0aW9uOiBEVVJBVElPTl9ERUZBVUxULFxuICAgICAgICAgICAgZWFzaW5nOiBFQVNJTkdfREVGQVVMVCxcbiAgICAgICAgICAgIGJlZ2luOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBjb21wbGV0ZTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgcHJvZ3Jlc3M6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGRpc3BsYXk6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHZpc2liaWxpdHk6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGxvb3A6IGZhbHNlLFxuICAgICAgICAgICAgZGVsYXk6IGZhbHNlLFxuICAgICAgICAgICAgbW9iaWxlSEE6IHRydWUsXG4gICAgICAgICAgICAvKiBBZHZhbmNlZDogU2V0IHRvIGZhbHNlIHRvIHByZXZlbnQgcHJvcGVydHkgdmFsdWVzIGZyb20gYmVpbmcgY2FjaGVkIGJldHdlZW4gY29uc2VjdXRpdmUgVmVsb2NpdHktaW5pdGlhdGVkIGNoYWluIGNhbGxzLiAqL1xuICAgICAgICAgICAgX2NhY2hlVmFsdWVzOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIC8qIEEgZGVzaWduIGdvYWwgb2YgVmVsb2NpdHkgaXMgdG8gY2FjaGUgZGF0YSB3aGVyZXZlciBwb3NzaWJsZSBpbiBvcmRlciB0byBhdm9pZCBET00gcmVxdWVyeWluZy4gQWNjb3JkaW5nbHksIGVhY2ggZWxlbWVudCBoYXMgYSBkYXRhIGNhY2hlLiAqL1xuICAgICAgICBpbml0OiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgJC5kYXRhKGVsZW1lbnQsIFwidmVsb2NpdHlcIiwge1xuICAgICAgICAgICAgICAgIC8qIFN0b3JlIHdoZXRoZXIgdGhpcyBpcyBhbiBTVkcgZWxlbWVudCwgc2luY2UgaXRzIHByb3BlcnRpZXMgYXJlIHJldHJpZXZlZCBhbmQgdXBkYXRlZCBkaWZmZXJlbnRseSB0aGFuIHN0YW5kYXJkIEhUTUwgZWxlbWVudHMuICovXG4gICAgICAgICAgICAgICAgaXNTVkc6IFR5cGUuaXNTVkcoZWxlbWVudCksXG4gICAgICAgICAgICAgICAgLyogS2VlcCB0cmFjayBvZiB3aGV0aGVyIHRoZSBlbGVtZW50IGlzIGN1cnJlbnRseSBiZWluZyBhbmltYXRlZCBieSBWZWxvY2l0eS5cbiAgICAgICAgICAgICAgICAgICBUaGlzIGlzIHVzZWQgdG8gZW5zdXJlIHRoYXQgcHJvcGVydHkgdmFsdWVzIGFyZSBub3QgdHJhbnNmZXJyZWQgYmV0d2VlbiBub24tY29uc2VjdXRpdmUgKHN0YWxlKSBjYWxscy4gKi9cbiAgICAgICAgICAgICAgICBpc0FuaW1hdGluZzogZmFsc2UsXG4gICAgICAgICAgICAgICAgLyogQSByZWZlcmVuY2UgdG8gdGhlIGVsZW1lbnQncyBsaXZlIGNvbXB1dGVkU3R5bGUgb2JqZWN0LiBMZWFybiBtb3JlIGhlcmU6IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL2RvY3MvV2ViL0FQSS93aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSAqL1xuICAgICAgICAgICAgICAgIGNvbXB1dGVkU3R5bGU6IG51bGwsXG4gICAgICAgICAgICAgICAgLyogVHdlZW4gZGF0YSBpcyBjYWNoZWQgZm9yIGVhY2ggYW5pbWF0aW9uIG9uIHRoZSBlbGVtZW50IHNvIHRoYXQgZGF0YSBjYW4gYmUgcGFzc2VkIGFjcm9zcyBjYWxscyAtLVxuICAgICAgICAgICAgICAgICAgIGluIHBhcnRpY3VsYXIsIGVuZCB2YWx1ZXMgYXJlIHVzZWQgYXMgc3Vic2VxdWVudCBzdGFydCB2YWx1ZXMgaW4gY29uc2VjdXRpdmUgVmVsb2NpdHkgY2FsbHMuICovXG4gICAgICAgICAgICAgICAgdHdlZW5zQ29udGFpbmVyOiBudWxsLFxuICAgICAgICAgICAgICAgIC8qIFRoZSBmdWxsIHJvb3QgcHJvcGVydHkgdmFsdWVzIG9mIGVhY2ggQ1NTIGhvb2sgYmVpbmcgYW5pbWF0ZWQgb24gdGhpcyBlbGVtZW50IGFyZSBjYWNoZWQgc28gdGhhdDpcbiAgICAgICAgICAgICAgICAgICAxKSBDb25jdXJyZW50bHktYW5pbWF0aW5nIGhvb2tzIHNoYXJpbmcgdGhlIHNhbWUgcm9vdCBjYW4gaGF2ZSB0aGVpciByb290IHZhbHVlcycgbWVyZ2VkIGludG8gb25lIHdoaWxlIHR3ZWVuaW5nLlxuICAgICAgICAgICAgICAgICAgIDIpIFBvc3QtaG9vay1pbmplY3Rpb24gcm9vdCB2YWx1ZXMgY2FuIGJlIHRyYW5zZmVycmVkIG92ZXIgdG8gY29uc2VjdXRpdmVseSBjaGFpbmVkIFZlbG9jaXR5IGNhbGxzIGFzIHN0YXJ0aW5nIHJvb3QgdmFsdWVzLiAqL1xuICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGU6IHt9LFxuICAgICAgICAgICAgICAgIC8qIEEgY2FjaGUgZm9yIHRyYW5zZm9ybSB1cGRhdGVzLCB3aGljaCBtdXN0IGJlIG1hbnVhbGx5IGZsdXNoZWQgdmlhIENTUy5mbHVzaFRyYW5zZm9ybUNhY2hlKCkuICovXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtQ2FjaGU6IHt9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLyogQSBwYXJhbGxlbCB0byBqUXVlcnkncyAkLmNzcygpLCB1c2VkIGZvciBnZXR0aW5nL3NldHRpbmcgVmVsb2NpdHkncyBob29rZWQgQ1NTIHByb3BlcnRpZXMuICovXG4gICAgICAgIGhvb2s6IG51bGwsIC8qIERlZmluZWQgYmVsb3cuICovXG4gICAgICAgIC8qIFZlbG9jaXR5LXdpZGUgYW5pbWF0aW9uIHRpbWUgcmVtYXBwaW5nIGZvciB0ZXN0aW5nIHB1cnBvc2VzLiAqL1xuICAgICAgICBtb2NrOiBmYWxzZSxcbiAgICAgICAgdmVyc2lvbjogeyBtYWpvcjogMSwgbWlub3I6IDIsIHBhdGNoOiAyIH0sXG4gICAgICAgIC8qIFNldCB0byAxIG9yIDIgKG1vc3QgdmVyYm9zZSkgdG8gb3V0cHV0IGRlYnVnIGluZm8gdG8gY29uc29sZS4gKi9cbiAgICAgICAgZGVidWc6IGZhbHNlXG4gICAgfTtcblxuICAgIC8qIFJldHJpZXZlIHRoZSBhcHByb3ByaWF0ZSBzY3JvbGwgYW5jaG9yIGFuZCBwcm9wZXJ0eSBuYW1lIGZvciB0aGUgYnJvd3NlcjogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dpbmRvdy5zY3JvbGxZICovXG4gICAgaWYgKHdpbmRvdy5wYWdlWU9mZnNldCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIFZlbG9jaXR5LlN0YXRlLnNjcm9sbEFuY2hvciA9IHdpbmRvdztcbiAgICAgICAgVmVsb2NpdHkuU3RhdGUuc2Nyb2xsUHJvcGVydHlMZWZ0ID0gXCJwYWdlWE9mZnNldFwiO1xuICAgICAgICBWZWxvY2l0eS5TdGF0ZS5zY3JvbGxQcm9wZXJ0eVRvcCA9IFwicGFnZVlPZmZzZXRcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgICBWZWxvY2l0eS5TdGF0ZS5zY3JvbGxBbmNob3IgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgfHwgZG9jdW1lbnQuYm9keS5wYXJlbnROb2RlIHx8IGRvY3VtZW50LmJvZHk7XG4gICAgICAgIFZlbG9jaXR5LlN0YXRlLnNjcm9sbFByb3BlcnR5TGVmdCA9IFwic2Nyb2xsTGVmdFwiO1xuICAgICAgICBWZWxvY2l0eS5TdGF0ZS5zY3JvbGxQcm9wZXJ0eVRvcCA9IFwic2Nyb2xsVG9wXCI7XG4gICAgfVxuXG4gICAgLyogU2hvcnRoYW5kIGFsaWFzIGZvciBqUXVlcnkncyAkLmRhdGEoKSB1dGlsaXR5LiAqL1xuICAgIGZ1bmN0aW9uIERhdGEgKGVsZW1lbnQpIHtcbiAgICAgICAgLyogSGFyZGNvZGUgYSByZWZlcmVuY2UgdG8gdGhlIHBsdWdpbiBuYW1lLiAqL1xuICAgICAgICB2YXIgcmVzcG9uc2UgPSAkLmRhdGEoZWxlbWVudCwgXCJ2ZWxvY2l0eVwiKTtcblxuICAgICAgICAvKiBqUXVlcnkgPD0xLjQuMiByZXR1cm5zIG51bGwgaW5zdGVhZCBvZiB1bmRlZmluZWQgd2hlbiBubyBtYXRjaCBpcyBmb3VuZC4gV2Ugbm9ybWFsaXplIHRoaXMgYmVoYXZpb3IuICovXG4gICAgICAgIHJldHVybiByZXNwb25zZSA9PT0gbnVsbCA/IHVuZGVmaW5lZCA6IHJlc3BvbnNlO1xuICAgIH07XG5cbiAgICAvKioqKioqKioqKioqKipcbiAgICAgICAgRWFzaW5nXG4gICAgKioqKioqKioqKioqKiovXG5cbiAgICAvKiBTdGVwIGVhc2luZyBnZW5lcmF0b3IuICovXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGVTdGVwIChzdGVwcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHApIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHAgKiBzdGVwcykgKiAoMSAvIHN0ZXBzKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKiBCZXppZXIgY3VydmUgZnVuY3Rpb24gZ2VuZXJhdG9yLiBDb3B5cmlnaHQgR2FldGFuIFJlbmF1ZGVhdS4gTUlUIExpY2Vuc2U6IGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTUlUX0xpY2Vuc2UgKi9cbiAgICBmdW5jdGlvbiBnZW5lcmF0ZUJlemllciAobVgxLCBtWTEsIG1YMiwgbVkyKSB7XG4gICAgICAgIHZhciBORVdUT05fSVRFUkFUSU9OUyA9IDQsXG4gICAgICAgICAgICBORVdUT05fTUlOX1NMT1BFID0gMC4wMDEsXG4gICAgICAgICAgICBTVUJESVZJU0lPTl9QUkVDSVNJT04gPSAwLjAwMDAwMDEsXG4gICAgICAgICAgICBTVUJESVZJU0lPTl9NQVhfSVRFUkFUSU9OUyA9IDEwLFxuICAgICAgICAgICAga1NwbGluZVRhYmxlU2l6ZSA9IDExLFxuICAgICAgICAgICAga1NhbXBsZVN0ZXBTaXplID0gMS4wIC8gKGtTcGxpbmVUYWJsZVNpemUgLSAxLjApLFxuICAgICAgICAgICAgZmxvYXQzMkFycmF5U3VwcG9ydGVkID0gXCJGbG9hdDMyQXJyYXlcIiBpbiB3aW5kb3c7XG5cbiAgICAgICAgLyogTXVzdCBjb250YWluIGZvdXIgYXJndW1lbnRzLiAqL1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCAhPT0gNCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogQXJndW1lbnRzIG11c3QgYmUgbnVtYmVycy4gKi9cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyArK2kpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYXJndW1lbnRzW2ldICE9PSBcIm51bWJlclwiIHx8IGlzTmFOKGFyZ3VtZW50c1tpXSkgfHwgIWlzRmluaXRlKGFyZ3VtZW50c1tpXSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKiBYIHZhbHVlcyBtdXN0IGJlIGluIHRoZSBbMCwgMV0gcmFuZ2UuICovXG4gICAgICAgIG1YMSA9IE1hdGgubWluKG1YMSwgMSk7XG4gICAgICAgIG1YMiA9IE1hdGgubWluKG1YMiwgMSk7XG4gICAgICAgIG1YMSA9IE1hdGgubWF4KG1YMSwgMCk7XG4gICAgICAgIG1YMiA9IE1hdGgubWF4KG1YMiwgMCk7XG5cbiAgICAgICAgdmFyIG1TYW1wbGVWYWx1ZXMgPSBmbG9hdDMyQXJyYXlTdXBwb3J0ZWQgPyBuZXcgRmxvYXQzMkFycmF5KGtTcGxpbmVUYWJsZVNpemUpIDogbmV3IEFycmF5KGtTcGxpbmVUYWJsZVNpemUpO1xuXG4gICAgICAgIGZ1bmN0aW9uIEEgKGFBMSwgYUEyKSB7IHJldHVybiAxLjAgLSAzLjAgKiBhQTIgKyAzLjAgKiBhQTE7IH1cbiAgICAgICAgZnVuY3Rpb24gQiAoYUExLCBhQTIpIHsgcmV0dXJuIDMuMCAqIGFBMiAtIDYuMCAqIGFBMTsgfVxuICAgICAgICBmdW5jdGlvbiBDIChhQTEpICAgICAgeyByZXR1cm4gMy4wICogYUExOyB9XG5cbiAgICAgICAgZnVuY3Rpb24gY2FsY0JlemllciAoYVQsIGFBMSwgYUEyKSB7XG4gICAgICAgICAgICByZXR1cm4gKChBKGFBMSwgYUEyKSphVCArIEIoYUExLCBhQTIpKSphVCArIEMoYUExKSkqYVQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXRTbG9wZSAoYVQsIGFBMSwgYUEyKSB7XG4gICAgICAgICAgICByZXR1cm4gMy4wICogQShhQTEsIGFBMikqYVQqYVQgKyAyLjAgKiBCKGFBMSwgYUEyKSAqIGFUICsgQyhhQTEpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gbmV3dG9uUmFwaHNvbkl0ZXJhdGUgKGFYLCBhR3Vlc3NUKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IE5FV1RPTl9JVEVSQVRJT05TOyArK2kpIHtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudFNsb3BlID0gZ2V0U2xvcGUoYUd1ZXNzVCwgbVgxLCBtWDIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRTbG9wZSA9PT0gMC4wKSByZXR1cm4gYUd1ZXNzVDtcblxuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50WCA9IGNhbGNCZXppZXIoYUd1ZXNzVCwgbVgxLCBtWDIpIC0gYVg7XG4gICAgICAgICAgICAgICAgYUd1ZXNzVCAtPSBjdXJyZW50WCAvIGN1cnJlbnRTbG9wZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGFHdWVzc1Q7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjYWxjU2FtcGxlVmFsdWVzICgpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga1NwbGluZVRhYmxlU2l6ZTsgKytpKSB7XG4gICAgICAgICAgICAgICAgbVNhbXBsZVZhbHVlc1tpXSA9IGNhbGNCZXppZXIoaSAqIGtTYW1wbGVTdGVwU2l6ZSwgbVgxLCBtWDIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gYmluYXJ5U3ViZGl2aWRlIChhWCwgYUEsIGFCKSB7XG4gICAgICAgICAgICB2YXIgY3VycmVudFgsIGN1cnJlbnRULCBpID0gMDtcblxuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRUID0gYUEgKyAoYUIgLSBhQSkgLyAyLjA7XG4gICAgICAgICAgICAgICAgY3VycmVudFggPSBjYWxjQmV6aWVyKGN1cnJlbnRULCBtWDEsIG1YMikgLSBhWDtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudFggPiAwLjApIHtcbiAgICAgICAgICAgICAgICAgIGFCID0gY3VycmVudFQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGFBID0gY3VycmVudFQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSB3aGlsZSAoTWF0aC5hYnMoY3VycmVudFgpID4gU1VCRElWSVNJT05fUFJFQ0lTSU9OICYmICsraSA8IFNVQkRJVklTSU9OX01BWF9JVEVSQVRJT05TKTtcblxuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRUO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0VEZvclggKGFYKSB7XG4gICAgICAgICAgICB2YXIgaW50ZXJ2YWxTdGFydCA9IDAuMCxcbiAgICAgICAgICAgICAgICBjdXJyZW50U2FtcGxlID0gMSxcbiAgICAgICAgICAgICAgICBsYXN0U2FtcGxlID0ga1NwbGluZVRhYmxlU2l6ZSAtIDE7XG5cbiAgICAgICAgICAgIGZvciAoOyBjdXJyZW50U2FtcGxlICE9IGxhc3RTYW1wbGUgJiYgbVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSA8PSBhWDsgKytjdXJyZW50U2FtcGxlKSB7XG4gICAgICAgICAgICAgICAgaW50ZXJ2YWxTdGFydCArPSBrU2FtcGxlU3RlcFNpemU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC0tY3VycmVudFNhbXBsZTtcblxuICAgICAgICAgICAgdmFyIGRpc3QgPSAoYVggLSBtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdKSAvIChtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGUrMV0gLSBtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdKSxcbiAgICAgICAgICAgICAgICBndWVzc0ZvclQgPSBpbnRlcnZhbFN0YXJ0ICsgZGlzdCAqIGtTYW1wbGVTdGVwU2l6ZSxcbiAgICAgICAgICAgICAgICBpbml0aWFsU2xvcGUgPSBnZXRTbG9wZShndWVzc0ZvclQsIG1YMSwgbVgyKTtcblxuICAgICAgICAgICAgaWYgKGluaXRpYWxTbG9wZSA+PSBORVdUT05fTUlOX1NMT1BFKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld3RvblJhcGhzb25JdGVyYXRlKGFYLCBndWVzc0ZvclQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpbml0aWFsU2xvcGUgPT0gMC4wKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGd1ZXNzRm9yVDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpbmFyeVN1YmRpdmlkZShhWCwgaW50ZXJ2YWxTdGFydCwgaW50ZXJ2YWxTdGFydCArIGtTYW1wbGVTdGVwU2l6ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgX3ByZWNvbXB1dGVkID0gZmFsc2U7XG5cbiAgICAgICAgZnVuY3Rpb24gcHJlY29tcHV0ZSgpIHtcbiAgICAgICAgICAgIF9wcmVjb21wdXRlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAobVgxICE9IG1ZMSB8fCBtWDIgIT0gbVkyKSBjYWxjU2FtcGxlVmFsdWVzKCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZiA9IGZ1bmN0aW9uIChhWCkge1xuICAgICAgICAgICAgaWYgKCFfcHJlY29tcHV0ZWQpIHByZWNvbXB1dGUoKTtcbiAgICAgICAgICAgIGlmIChtWDEgPT09IG1ZMSAmJiBtWDIgPT09IG1ZMikgcmV0dXJuIGFYO1xuICAgICAgICAgICAgaWYgKGFYID09PSAwKSByZXR1cm4gMDtcbiAgICAgICAgICAgIGlmIChhWCA9PT0gMSkgcmV0dXJuIDE7XG5cbiAgICAgICAgICAgIHJldHVybiBjYWxjQmV6aWVyKGdldFRGb3JYKGFYKSwgbVkxLCBtWTIpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGYuZ2V0Q29udHJvbFBvaW50cyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gW3sgeDogbVgxLCB5OiBtWTEgfSwgeyB4OiBtWDIsIHk6IG1ZMiB9XTsgfTtcblxuICAgICAgICB2YXIgc3RyID0gXCJnZW5lcmF0ZUJlemllcihcIiArIFttWDEsIG1ZMSwgbVgyLCBtWTJdICsgXCIpXCI7XG4gICAgICAgIGYudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBzdHI7IH07XG5cbiAgICAgICAgcmV0dXJuIGY7XG4gICAgfVxuXG4gICAgLyogUnVuZ2UtS3V0dGEgc3ByaW5nIHBoeXNpY3MgZnVuY3Rpb24gZ2VuZXJhdG9yLiBBZGFwdGVkIGZyb20gRnJhbWVyLmpzLCBjb3B5cmlnaHQgS29lbiBCb2suIE1JVCBMaWNlbnNlOiBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL01JVF9MaWNlbnNlICovXG4gICAgLyogR2l2ZW4gYSB0ZW5zaW9uLCBmcmljdGlvbiwgYW5kIGR1cmF0aW9uLCBhIHNpbXVsYXRpb24gYXQgNjBGUFMgd2lsbCBmaXJzdCBydW4gd2l0aG91dCBhIGRlZmluZWQgZHVyYXRpb24gaW4gb3JkZXIgdG8gY2FsY3VsYXRlIHRoZSBmdWxsIHBhdGguIEEgc2Vjb25kIHBhc3NcbiAgICAgICB0aGVuIGFkanVzdHMgdGhlIHRpbWUgZGVsdGEgLS0gdXNpbmcgdGhlIHJlbGF0aW9uIGJldHdlZW4gYWN0dWFsIHRpbWUgYW5kIGR1cmF0aW9uIC0tIHRvIGNhbGN1bGF0ZSB0aGUgcGF0aCBmb3IgdGhlIGR1cmF0aW9uLWNvbnN0cmFpbmVkIGFuaW1hdGlvbi4gKi9cbiAgICB2YXIgZ2VuZXJhdGVTcHJpbmdSSzQgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBzcHJpbmdBY2NlbGVyYXRpb25Gb3JTdGF0ZSAoc3RhdGUpIHtcbiAgICAgICAgICAgIHJldHVybiAoLXN0YXRlLnRlbnNpb24gKiBzdGF0ZS54KSAtIChzdGF0ZS5mcmljdGlvbiAqIHN0YXRlLnYpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc3ByaW5nRXZhbHVhdGVTdGF0ZVdpdGhEZXJpdmF0aXZlIChpbml0aWFsU3RhdGUsIGR0LCBkZXJpdmF0aXZlKSB7XG4gICAgICAgICAgICB2YXIgc3RhdGUgPSB7XG4gICAgICAgICAgICAgICAgeDogaW5pdGlhbFN0YXRlLnggKyBkZXJpdmF0aXZlLmR4ICogZHQsXG4gICAgICAgICAgICAgICAgdjogaW5pdGlhbFN0YXRlLnYgKyBkZXJpdmF0aXZlLmR2ICogZHQsXG4gICAgICAgICAgICAgICAgdGVuc2lvbjogaW5pdGlhbFN0YXRlLnRlbnNpb24sXG4gICAgICAgICAgICAgICAgZnJpY3Rpb246IGluaXRpYWxTdGF0ZS5mcmljdGlvblxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIHsgZHg6IHN0YXRlLnYsIGR2OiBzcHJpbmdBY2NlbGVyYXRpb25Gb3JTdGF0ZShzdGF0ZSkgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNwcmluZ0ludGVncmF0ZVN0YXRlIChzdGF0ZSwgZHQpIHtcbiAgICAgICAgICAgIHZhciBhID0ge1xuICAgICAgICAgICAgICAgICAgICBkeDogc3RhdGUudixcbiAgICAgICAgICAgICAgICAgICAgZHY6IHNwcmluZ0FjY2VsZXJhdGlvbkZvclN0YXRlKHN0YXRlKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYiA9IHNwcmluZ0V2YWx1YXRlU3RhdGVXaXRoRGVyaXZhdGl2ZShzdGF0ZSwgZHQgKiAwLjUsIGEpLFxuICAgICAgICAgICAgICAgIGMgPSBzcHJpbmdFdmFsdWF0ZVN0YXRlV2l0aERlcml2YXRpdmUoc3RhdGUsIGR0ICogMC41LCBiKSxcbiAgICAgICAgICAgICAgICBkID0gc3ByaW5nRXZhbHVhdGVTdGF0ZVdpdGhEZXJpdmF0aXZlKHN0YXRlLCBkdCwgYyksXG4gICAgICAgICAgICAgICAgZHhkdCA9IDEuMCAvIDYuMCAqIChhLmR4ICsgMi4wICogKGIuZHggKyBjLmR4KSArIGQuZHgpLFxuICAgICAgICAgICAgICAgIGR2ZHQgPSAxLjAgLyA2LjAgKiAoYS5kdiArIDIuMCAqIChiLmR2ICsgYy5kdikgKyBkLmR2KTtcblxuICAgICAgICAgICAgc3RhdGUueCA9IHN0YXRlLnggKyBkeGR0ICogZHQ7XG4gICAgICAgICAgICBzdGF0ZS52ID0gc3RhdGUudiArIGR2ZHQgKiBkdDtcblxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHNwcmluZ1JLNEZhY3RvcnkgKHRlbnNpb24sIGZyaWN0aW9uLCBkdXJhdGlvbikge1xuXG4gICAgICAgICAgICB2YXIgaW5pdFN0YXRlID0ge1xuICAgICAgICAgICAgICAgICAgICB4OiAtMSxcbiAgICAgICAgICAgICAgICAgICAgdjogMCxcbiAgICAgICAgICAgICAgICAgICAgdGVuc2lvbjogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgZnJpY3Rpb246IG51bGxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHBhdGggPSBbMF0sXG4gICAgICAgICAgICAgICAgdGltZV9sYXBzZWQgPSAwLFxuICAgICAgICAgICAgICAgIHRvbGVyYW5jZSA9IDEgLyAxMDAwMCxcbiAgICAgICAgICAgICAgICBEVCA9IDE2IC8gMTAwMCxcbiAgICAgICAgICAgICAgICBoYXZlX2R1cmF0aW9uLCBkdCwgbGFzdF9zdGF0ZTtcblxuICAgICAgICAgICAgdGVuc2lvbiA9IHBhcnNlRmxvYXQodGVuc2lvbikgfHwgNTAwO1xuICAgICAgICAgICAgZnJpY3Rpb24gPSBwYXJzZUZsb2F0KGZyaWN0aW9uKSB8fCAyMDtcbiAgICAgICAgICAgIGR1cmF0aW9uID0gZHVyYXRpb24gfHwgbnVsbDtcblxuICAgICAgICAgICAgaW5pdFN0YXRlLnRlbnNpb24gPSB0ZW5zaW9uO1xuICAgICAgICAgICAgaW5pdFN0YXRlLmZyaWN0aW9uID0gZnJpY3Rpb247XG5cbiAgICAgICAgICAgIGhhdmVfZHVyYXRpb24gPSBkdXJhdGlvbiAhPT0gbnVsbDtcblxuICAgICAgICAgICAgLyogQ2FsY3VsYXRlIHRoZSBhY3R1YWwgdGltZSBpdCB0YWtlcyBmb3IgdGhpcyBhbmltYXRpb24gdG8gY29tcGxldGUgd2l0aCB0aGUgcHJvdmlkZWQgY29uZGl0aW9ucy4gKi9cbiAgICAgICAgICAgIGlmIChoYXZlX2R1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgLyogUnVuIHRoZSBzaW11bGF0aW9uIHdpdGhvdXQgYSBkdXJhdGlvbi4gKi9cbiAgICAgICAgICAgICAgICB0aW1lX2xhcHNlZCA9IHNwcmluZ1JLNEZhY3RvcnkodGVuc2lvbiwgZnJpY3Rpb24pO1xuICAgICAgICAgICAgICAgIC8qIENvbXB1dGUgdGhlIGFkanVzdGVkIHRpbWUgZGVsdGEuICovXG4gICAgICAgICAgICAgICAgZHQgPSB0aW1lX2xhcHNlZCAvIGR1cmF0aW9uICogRFQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGR0ID0gRFQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICAgICAgLyogTmV4dC9zdGVwIGZ1bmN0aW9uIC4qL1xuICAgICAgICAgICAgICAgIGxhc3Rfc3RhdGUgPSBzcHJpbmdJbnRlZ3JhdGVTdGF0ZShsYXN0X3N0YXRlIHx8IGluaXRTdGF0ZSwgZHQpO1xuICAgICAgICAgICAgICAgIC8qIFN0b3JlIHRoZSBwb3NpdGlvbi4gKi9cbiAgICAgICAgICAgICAgICBwYXRoLnB1c2goMSArIGxhc3Rfc3RhdGUueCk7XG4gICAgICAgICAgICAgICAgdGltZV9sYXBzZWQgKz0gMTY7XG4gICAgICAgICAgICAgICAgLyogSWYgdGhlIGNoYW5nZSB0aHJlc2hvbGQgaXMgcmVhY2hlZCwgYnJlYWsuICovXG4gICAgICAgICAgICAgICAgaWYgKCEoTWF0aC5hYnMobGFzdF9zdGF0ZS54KSA+IHRvbGVyYW5jZSAmJiBNYXRoLmFicyhsYXN0X3N0YXRlLnYpID4gdG9sZXJhbmNlKSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIElmIGR1cmF0aW9uIGlzIG5vdCBkZWZpbmVkLCByZXR1cm4gdGhlIGFjdHVhbCB0aW1lIHJlcXVpcmVkIGZvciBjb21wbGV0aW5nIHRoaXMgYW5pbWF0aW9uLiBPdGhlcndpc2UsIHJldHVybiBhIGNsb3N1cmUgdGhhdCBob2xkcyB0aGVcbiAgICAgICAgICAgICAgIGNvbXB1dGVkIHBhdGggYW5kIHJldHVybnMgYSBzbmFwc2hvdCBvZiB0aGUgcG9zaXRpb24gYWNjb3JkaW5nIHRvIGEgZ2l2ZW4gcGVyY2VudENvbXBsZXRlLiAqL1xuICAgICAgICAgICAgcmV0dXJuICFoYXZlX2R1cmF0aW9uID8gdGltZV9sYXBzZWQgOiBmdW5jdGlvbihwZXJjZW50Q29tcGxldGUpIHsgcmV0dXJuIHBhdGhbIChwZXJjZW50Q29tcGxldGUgKiAocGF0aC5sZW5ndGggLSAxKSkgfCAwIF07IH07XG4gICAgICAgIH07XG4gICAgfSgpKTtcblxuICAgIC8qIGpRdWVyeSBlYXNpbmdzLiAqL1xuICAgIFZlbG9jaXR5LkVhc2luZ3MgPSB7XG4gICAgICAgIGxpbmVhcjogZnVuY3Rpb24ocCkgeyByZXR1cm4gcDsgfSxcbiAgICAgICAgc3dpbmc6IGZ1bmN0aW9uKHApIHsgcmV0dXJuIDAuNSAtIE1hdGguY29zKCBwICogTWF0aC5QSSApIC8gMiB9LFxuICAgICAgICAvKiBCb251cyBcInNwcmluZ1wiIGVhc2luZywgd2hpY2ggaXMgYSBsZXNzIGV4YWdnZXJhdGVkIHZlcnNpb24gb2YgZWFzZUluT3V0RWxhc3RpYy4gKi9cbiAgICAgICAgc3ByaW5nOiBmdW5jdGlvbihwKSB7IHJldHVybiAxIC0gKE1hdGguY29zKHAgKiA0LjUgKiBNYXRoLlBJKSAqIE1hdGguZXhwKC1wICogNikpOyB9XG4gICAgfTtcblxuICAgIC8qIENTUzMgYW5kIFJvYmVydCBQZW5uZXIgZWFzaW5ncy4gKi9cbiAgICAkLmVhY2goXG4gICAgICAgIFtcbiAgICAgICAgICAgIFsgXCJlYXNlXCIsIFsgMC4yNSwgMC4xLCAwLjI1LCAxLjAgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2UtaW5cIiwgWyAwLjQyLCAwLjAsIDEuMDAsIDEuMCBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZS1vdXRcIiwgWyAwLjAwLCAwLjAsIDAuNTgsIDEuMCBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZS1pbi1vdXRcIiwgWyAwLjQyLCAwLjAsIDAuNTgsIDEuMCBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZUluU2luZVwiLCBbIDAuNDcsIDAsIDAuNzQ1LCAwLjcxNSBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZU91dFNpbmVcIiwgWyAwLjM5LCAwLjU3NSwgMC41NjUsIDEgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2VJbk91dFNpbmVcIiwgWyAwLjQ0NSwgMC4wNSwgMC41NSwgMC45NSBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZUluUXVhZFwiLCBbIDAuNTUsIDAuMDg1LCAwLjY4LCAwLjUzIF0gXSxcbiAgICAgICAgICAgIFsgXCJlYXNlT3V0UXVhZFwiLCBbIDAuMjUsIDAuNDYsIDAuNDUsIDAuOTQgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2VJbk91dFF1YWRcIiwgWyAwLjQ1NSwgMC4wMywgMC41MTUsIDAuOTU1IF0gXSxcbiAgICAgICAgICAgIFsgXCJlYXNlSW5DdWJpY1wiLCBbIDAuNTUsIDAuMDU1LCAwLjY3NSwgMC4xOSBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZU91dEN1YmljXCIsIFsgMC4yMTUsIDAuNjEsIDAuMzU1LCAxIF0gXSxcbiAgICAgICAgICAgIFsgXCJlYXNlSW5PdXRDdWJpY1wiLCBbIDAuNjQ1LCAwLjA0NSwgMC4zNTUsIDEgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2VJblF1YXJ0XCIsIFsgMC44OTUsIDAuMDMsIDAuNjg1LCAwLjIyIF0gXSxcbiAgICAgICAgICAgIFsgXCJlYXNlT3V0UXVhcnRcIiwgWyAwLjE2NSwgMC44NCwgMC40NCwgMSBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZUluT3V0UXVhcnRcIiwgWyAwLjc3LCAwLCAwLjE3NSwgMSBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZUluUXVpbnRcIiwgWyAwLjc1NSwgMC4wNSwgMC44NTUsIDAuMDYgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2VPdXRRdWludFwiLCBbIDAuMjMsIDEsIDAuMzIsIDEgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2VJbk91dFF1aW50XCIsIFsgMC44NiwgMCwgMC4wNywgMSBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZUluRXhwb1wiLCBbIDAuOTUsIDAuMDUsIDAuNzk1LCAwLjAzNSBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZU91dEV4cG9cIiwgWyAwLjE5LCAxLCAwLjIyLCAxIF0gXSxcbiAgICAgICAgICAgIFsgXCJlYXNlSW5PdXRFeHBvXCIsIFsgMSwgMCwgMCwgMSBdIF0sXG4gICAgICAgICAgICBbIFwiZWFzZUluQ2lyY1wiLCBbIDAuNiwgMC4wNCwgMC45OCwgMC4zMzUgXSBdLFxuICAgICAgICAgICAgWyBcImVhc2VPdXRDaXJjXCIsIFsgMC4wNzUsIDAuODIsIDAuMTY1LCAxIF0gXSxcbiAgICAgICAgICAgIFsgXCJlYXNlSW5PdXRDaXJjXCIsIFsgMC43ODUsIDAuMTM1LCAwLjE1LCAwLjg2IF0gXVxuICAgICAgICBdLCBmdW5jdGlvbihpLCBlYXNpbmdBcnJheSkge1xuICAgICAgICAgICAgVmVsb2NpdHkuRWFzaW5nc1tlYXNpbmdBcnJheVswXV0gPSBnZW5lcmF0ZUJlemllci5hcHBseShudWxsLCBlYXNpbmdBcnJheVsxXSk7XG4gICAgICAgIH0pO1xuXG4gICAgLyogRGV0ZXJtaW5lIHRoZSBhcHByb3ByaWF0ZSBlYXNpbmcgdHlwZSBnaXZlbiBhbiBlYXNpbmcgaW5wdXQuICovXG4gICAgZnVuY3Rpb24gZ2V0RWFzaW5nKHZhbHVlLCBkdXJhdGlvbikge1xuICAgICAgICB2YXIgZWFzaW5nID0gdmFsdWU7XG5cbiAgICAgICAgLyogVGhlIGVhc2luZyBvcHRpb24gY2FuIGVpdGhlciBiZSBhIHN0cmluZyB0aGF0IHJlZmVyZW5jZXMgYSBwcmUtcmVnaXN0ZXJlZCBlYXNpbmcsXG4gICAgICAgICAgIG9yIGl0IGNhbiBiZSBhIHR3by0vZm91ci1pdGVtIGFycmF5IG9mIGludGVnZXJzIHRvIGJlIGNvbnZlcnRlZCBpbnRvIGEgYmV6aWVyL3NwcmluZyBmdW5jdGlvbi4gKi9cbiAgICAgICAgaWYgKFR5cGUuaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgICAgICAgICAvKiBFbnN1cmUgdGhhdCB0aGUgZWFzaW5nIGhhcyBiZWVuIGFzc2lnbmVkIHRvIGpRdWVyeSdzIFZlbG9jaXR5LkVhc2luZ3Mgb2JqZWN0LiAqL1xuICAgICAgICAgICAgaWYgKCFWZWxvY2l0eS5FYXNpbmdzW3ZhbHVlXSkge1xuICAgICAgICAgICAgICAgIGVhc2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKFR5cGUuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBlYXNpbmcgPSBnZW5lcmF0ZVN0ZXAuYXBwbHkobnVsbCwgdmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKFR5cGUuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICAvKiBzcHJpbmdSSzQgbXVzdCBiZSBwYXNzZWQgdGhlIGFuaW1hdGlvbidzIGR1cmF0aW9uLiAqL1xuICAgICAgICAgICAgLyogTm90ZTogSWYgdGhlIHNwcmluZ1JLNCBhcnJheSBjb250YWlucyBub24tbnVtYmVycywgZ2VuZXJhdGVTcHJpbmdSSzQoKSByZXR1cm5zIGFuIGVhc2luZ1xuICAgICAgICAgICAgICAgZnVuY3Rpb24gZ2VuZXJhdGVkIHdpdGggZGVmYXVsdCB0ZW5zaW9uIGFuZCBmcmljdGlvbiB2YWx1ZXMuICovXG4gICAgICAgICAgICBlYXNpbmcgPSBnZW5lcmF0ZVNwcmluZ1JLNC5hcHBseShudWxsLCB2YWx1ZS5jb25jYXQoWyBkdXJhdGlvbiBdKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoVHlwZS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPT09IDQpIHtcbiAgICAgICAgICAgIC8qIE5vdGU6IElmIHRoZSBiZXppZXIgYXJyYXkgY29udGFpbnMgbm9uLW51bWJlcnMsIGdlbmVyYXRlQmV6aWVyKCkgcmV0dXJucyBmYWxzZS4gKi9cbiAgICAgICAgICAgIGVhc2luZyA9IGdlbmVyYXRlQmV6aWVyLmFwcGx5KG51bGwsIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVhc2luZyA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogUmV2ZXJ0IHRvIHRoZSBWZWxvY2l0eS13aWRlIGRlZmF1bHQgZWFzaW5nIHR5cGUsIG9yIGZhbGwgYmFjayB0byBcInN3aW5nXCIgKHdoaWNoIGlzIGFsc28galF1ZXJ5J3MgZGVmYXVsdClcbiAgICAgICAgICAgaWYgdGhlIFZlbG9jaXR5LXdpZGUgZGVmYXVsdCBoYXMgYmVlbiBpbmNvcnJlY3RseSBtb2RpZmllZC4gKi9cbiAgICAgICAgaWYgKGVhc2luZyA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGlmIChWZWxvY2l0eS5FYXNpbmdzW1ZlbG9jaXR5LmRlZmF1bHRzLmVhc2luZ10pIHtcbiAgICAgICAgICAgICAgICBlYXNpbmcgPSBWZWxvY2l0eS5kZWZhdWx0cy5lYXNpbmc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVhc2luZyA9IEVBU0lOR19ERUZBVUxUO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVhc2luZztcbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKipcbiAgICAgICAgQ1NTIFN0YWNrXG4gICAgKioqKioqKioqKioqKioqKiovXG5cbiAgICAvKiBUaGUgQ1NTIG9iamVjdCBpcyBhIGhpZ2hseSBjb25kZW5zZWQgYW5kIHBlcmZvcm1hbnQgQ1NTIHN0YWNrIHRoYXQgZnVsbHkgcmVwbGFjZXMgalF1ZXJ5J3MuXG4gICAgICAgSXQgaGFuZGxlcyB0aGUgdmFsaWRhdGlvbiwgZ2V0dGluZywgYW5kIHNldHRpbmcgb2YgYm90aCBzdGFuZGFyZCBDU1MgcHJvcGVydGllcyBhbmQgQ1NTIHByb3BlcnR5IGhvb2tzLiAqL1xuICAgIC8qIE5vdGU6IEEgXCJDU1NcIiBzaG9ydGhhbmQgaXMgYWxpYXNlZCBzbyB0aGF0IG91ciBjb2RlIGlzIGVhc2llciB0byByZWFkLiAqL1xuICAgIHZhciBDU1MgPSBWZWxvY2l0eS5DU1MgPSB7XG5cbiAgICAgICAgLyoqKioqKioqKioqKipcbiAgICAgICAgICAgIFJlZ0V4XG4gICAgICAgICoqKioqKioqKioqKiovXG5cbiAgICAgICAgUmVnRXg6IHtcbiAgICAgICAgICAgIGlzSGV4OiAvXiMoW0EtZlxcZF17M30pezEsMn0kL2ksXG4gICAgICAgICAgICAvKiBVbndyYXAgYSBwcm9wZXJ0eSB2YWx1ZSdzIHN1cnJvdW5kaW5nIHRleHQsIGUuZy4gXCJyZ2JhKDQsIDMsIDIsIDEpXCIgPT0+IFwiNCwgMywgMiwgMVwiIGFuZCBcInJlY3QoNHB4IDNweCAycHggMXB4KVwiID09PiBcIjRweCAzcHggMnB4IDFweFwiLiAqL1xuICAgICAgICAgICAgdmFsdWVVbndyYXA6IC9eW0Etel0rXFwoKC4qKVxcKSQvaSxcbiAgICAgICAgICAgIHdyYXBwZWRWYWx1ZUFscmVhZHlFeHRyYWN0ZWQ6IC9bMC05Ll0rIFswLTkuXSsgWzAtOS5dKyggWzAtOS5dKyk/LyxcbiAgICAgICAgICAgIC8qIFNwbGl0IGEgbXVsdGktdmFsdWUgcHJvcGVydHkgaW50byBhbiBhcnJheSBvZiBzdWJ2YWx1ZXMsIGUuZy4gXCJyZ2JhKDQsIDMsIDIsIDEpIDRweCAzcHggMnB4IDFweFwiID09PiBbIFwicmdiYSg0LCAzLCAyLCAxKVwiLCBcIjRweFwiLCBcIjNweFwiLCBcIjJweFwiLCBcIjFweFwiIF0uICovXG4gICAgICAgICAgICB2YWx1ZVNwbGl0OiAvKFtBLXpdK1xcKC4rXFwpKXwoKFtBLXowLTkjLS5dKz8pKD89XFxzfCQpKS9pZ1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKioqKioqKioqKipcbiAgICAgICAgICAgIExpc3RzXG4gICAgICAgICoqKioqKioqKioqKi9cblxuICAgICAgICBMaXN0czoge1xuICAgICAgICAgICAgY29sb3JzOiBbIFwiZmlsbFwiLCBcInN0cm9rZVwiLCBcInN0b3BDb2xvclwiLCBcImNvbG9yXCIsIFwiYmFja2dyb3VuZENvbG9yXCIsIFwiYm9yZGVyQ29sb3JcIiwgXCJib3JkZXJUb3BDb2xvclwiLCBcImJvcmRlclJpZ2h0Q29sb3JcIiwgXCJib3JkZXJCb3R0b21Db2xvclwiLCBcImJvcmRlckxlZnRDb2xvclwiLCBcIm91dGxpbmVDb2xvclwiIF0sXG4gICAgICAgICAgICB0cmFuc2Zvcm1zQmFzZTogWyBcInRyYW5zbGF0ZVhcIiwgXCJ0cmFuc2xhdGVZXCIsIFwic2NhbGVcIiwgXCJzY2FsZVhcIiwgXCJzY2FsZVlcIiwgXCJza2V3WFwiLCBcInNrZXdZXCIsIFwicm90YXRlWlwiIF0sXG4gICAgICAgICAgICB0cmFuc2Zvcm1zM0Q6IFsgXCJ0cmFuc2Zvcm1QZXJzcGVjdGl2ZVwiLCBcInRyYW5zbGF0ZVpcIiwgXCJzY2FsZVpcIiwgXCJyb3RhdGVYXCIsIFwicm90YXRlWVwiIF1cbiAgICAgICAgfSxcblxuICAgICAgICAvKioqKioqKioqKioqXG4gICAgICAgICAgICBIb29rc1xuICAgICAgICAqKioqKioqKioqKiovXG5cbiAgICAgICAgLyogSG9va3MgYWxsb3cgYSBzdWJwcm9wZXJ0eSAoZS5nLiBcImJveFNoYWRvd0JsdXJcIikgb2YgYSBjb21wb3VuZC12YWx1ZSBDU1MgcHJvcGVydHlcbiAgICAgICAgICAgKGUuZy4gXCJib3hTaGFkb3c6IFggWSBCbHVyIFNwcmVhZCBDb2xvclwiKSB0byBiZSBhbmltYXRlZCBhcyBpZiBpdCB3ZXJlIGEgZGlzY3JldGUgcHJvcGVydHkuICovXG4gICAgICAgIC8qIE5vdGU6IEJleW9uZCBlbmFibGluZyBmaW5lLWdyYWluZWQgcHJvcGVydHkgYW5pbWF0aW9uLCBob29raW5nIGlzIG5lY2Vzc2FyeSBzaW5jZSBWZWxvY2l0eSBvbmx5XG4gICAgICAgICAgIHR3ZWVucyBwcm9wZXJ0aWVzIHdpdGggc2luZ2xlIG51bWVyaWMgdmFsdWVzOyB1bmxpa2UgQ1NTIHRyYW5zaXRpb25zLCBWZWxvY2l0eSBkb2VzIG5vdCBpbnRlcnBvbGF0ZSBjb21wb3VuZC12YWx1ZXMuICovXG4gICAgICAgIEhvb2tzOiB7XG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICBSZWdpc3RyYXRpb25cbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAvKiBUZW1wbGF0ZXMgYXJlIGEgY29uY2lzZSB3YXkgb2YgaW5kaWNhdGluZyB3aGljaCBzdWJwcm9wZXJ0aWVzIG11c3QgYmUgaW5kaXZpZHVhbGx5IHJlZ2lzdGVyZWQgZm9yIGVhY2ggY29tcG91bmQtdmFsdWUgQ1NTIHByb3BlcnR5LiAqL1xuICAgICAgICAgICAgLyogRWFjaCB0ZW1wbGF0ZSBjb25zaXN0cyBvZiB0aGUgY29tcG91bmQtdmFsdWUncyBiYXNlIG5hbWUsIGl0cyBjb25zdGl0dWVudCBzdWJwcm9wZXJ0eSBuYW1lcywgYW5kIHRob3NlIHN1YnByb3BlcnRpZXMnIGRlZmF1bHQgdmFsdWVzLiAqL1xuICAgICAgICAgICAgdGVtcGxhdGVzOiB7XG4gICAgICAgICAgICAgICAgXCJ0ZXh0U2hhZG93XCI6IFsgXCJDb2xvciBYIFkgQmx1clwiLCBcImJsYWNrIDBweCAwcHggMHB4XCIgXSxcbiAgICAgICAgICAgICAgICBcImJveFNoYWRvd1wiOiBbIFwiQ29sb3IgWCBZIEJsdXIgU3ByZWFkXCIsIFwiYmxhY2sgMHB4IDBweCAwcHggMHB4XCIgXSxcbiAgICAgICAgICAgICAgICBcImNsaXBcIjogWyBcIlRvcCBSaWdodCBCb3R0b20gTGVmdFwiLCBcIjBweCAwcHggMHB4IDBweFwiIF0sXG4gICAgICAgICAgICAgICAgXCJiYWNrZ3JvdW5kUG9zaXRpb25cIjogWyBcIlggWVwiLCBcIjAlIDAlXCIgXSxcbiAgICAgICAgICAgICAgICBcInRyYW5zZm9ybU9yaWdpblwiOiBbIFwiWCBZIFpcIiwgXCI1MCUgNTAlIDBweFwiIF0sXG4gICAgICAgICAgICAgICAgXCJwZXJzcGVjdGl2ZU9yaWdpblwiOiBbIFwiWCBZXCIsIFwiNTAlIDUwJVwiIF1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qIEEgXCJyZWdpc3RlcmVkXCIgaG9vayBpcyBvbmUgdGhhdCBoYXMgYmVlbiBjb252ZXJ0ZWQgZnJvbSBpdHMgdGVtcGxhdGUgZm9ybSBpbnRvIGEgbGl2ZSxcbiAgICAgICAgICAgICAgIHR3ZWVuYWJsZSBwcm9wZXJ0eS4gSXQgY29udGFpbnMgZGF0YSB0byBhc3NvY2lhdGUgaXQgd2l0aCBpdHMgcm9vdCBwcm9wZXJ0eS4gKi9cbiAgICAgICAgICAgIHJlZ2lzdGVyZWQ6IHtcbiAgICAgICAgICAgICAgICAvKiBOb3RlOiBBIHJlZ2lzdGVyZWQgaG9vayBsb29rcyBsaWtlIHRoaXMgPT0+IHRleHRTaGFkb3dCbHVyOiBbIFwidGV4dFNoYWRvd1wiLCAzIF0sXG4gICAgICAgICAgICAgICAgICAgd2hpY2ggY29uc2lzdHMgb2YgdGhlIHN1YnByb3BlcnR5J3MgbmFtZSwgdGhlIGFzc29jaWF0ZWQgcm9vdCBwcm9wZXJ0eSdzIG5hbWUsXG4gICAgICAgICAgICAgICAgICAgYW5kIHRoZSBzdWJwcm9wZXJ0eSdzIHBvc2l0aW9uIGluIHRoZSByb290J3MgdmFsdWUuICovXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyogQ29udmVydCB0aGUgdGVtcGxhdGVzIGludG8gaW5kaXZpZHVhbCBob29rcyB0aGVuIGFwcGVuZCB0aGVtIHRvIHRoZSByZWdpc3RlcmVkIG9iamVjdCBhYm92ZS4gKi9cbiAgICAgICAgICAgIHJlZ2lzdGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLyogQ29sb3IgaG9va3MgcmVnaXN0cmF0aW9uOiBDb2xvcnMgYXJlIGRlZmF1bHRlZCB0byB3aGl0ZSAtLSBhcyBvcHBvc2VkIHRvIGJsYWNrIC0tIHNpbmNlIGNvbG9ycyB0aGF0IGFyZVxuICAgICAgICAgICAgICAgICAgIGN1cnJlbnRseSBzZXQgdG8gXCJ0cmFuc3BhcmVudFwiIGRlZmF1bHQgdG8gdGhlaXIgcmVzcGVjdGl2ZSB0ZW1wbGF0ZSBiZWxvdyB3aGVuIGNvbG9yLWFuaW1hdGVkLFxuICAgICAgICAgICAgICAgICAgIGFuZCB3aGl0ZSBpcyB0eXBpY2FsbHkgYSBjbG9zZXIgbWF0Y2ggdG8gdHJhbnNwYXJlbnQgdGhhbiBibGFjayBpcy4gQW4gZXhjZXB0aW9uIGlzIG1hZGUgZm9yIHRleHQgKFwiY29sb3JcIiksXG4gICAgICAgICAgICAgICAgICAgd2hpY2ggaXMgYWxtb3N0IGFsd2F5cyBzZXQgY2xvc2VyIHRvIGJsYWNrIHRoYW4gd2hpdGUuICovXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBDU1MuTGlzdHMuY29sb3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZ2JDb21wb25lbnRzID0gKENTUy5MaXN0cy5jb2xvcnNbaV0gPT09IFwiY29sb3JcIikgPyBcIjAgMCAwIDFcIiA6IFwiMjU1IDI1NSAyNTUgMVwiO1xuICAgICAgICAgICAgICAgICAgICBDU1MuSG9va3MudGVtcGxhdGVzW0NTUy5MaXN0cy5jb2xvcnNbaV1dID0gWyBcIlJlZCBHcmVlbiBCbHVlIEFscGhhXCIsIHJnYkNvbXBvbmVudHMgXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgcm9vdFByb3BlcnR5LFxuICAgICAgICAgICAgICAgICAgICBob29rVGVtcGxhdGUsXG4gICAgICAgICAgICAgICAgICAgIGhvb2tOYW1lcztcblxuICAgICAgICAgICAgICAgIC8qIEluIElFLCBjb2xvciB2YWx1ZXMgaW5zaWRlIGNvbXBvdW5kLXZhbHVlIHByb3BlcnRpZXMgYXJlIHBvc2l0aW9uZWQgYXQgdGhlIGVuZCB0aGUgdmFsdWUgaW5zdGVhZCBvZiBhdCB0aGUgYmVnaW5uaW5nLlxuICAgICAgICAgICAgICAgICAgIFRodXMsIHdlIHJlLWFycmFuZ2UgdGhlIHRlbXBsYXRlcyBhY2NvcmRpbmdseS4gKi9cbiAgICAgICAgICAgICAgICBpZiAoSUUpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChyb290UHJvcGVydHkgaW4gQ1NTLkhvb2tzLnRlbXBsYXRlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaG9va1RlbXBsYXRlID0gQ1NTLkhvb2tzLnRlbXBsYXRlc1tyb290UHJvcGVydHldO1xuICAgICAgICAgICAgICAgICAgICAgICAgaG9va05hbWVzID0gaG9va1RlbXBsYXRlWzBdLnNwbGl0KFwiIFwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRlZmF1bHRWYWx1ZXMgPSBob29rVGVtcGxhdGVbMV0ubWF0Y2goQ1NTLlJlZ0V4LnZhbHVlU3BsaXQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaG9va05hbWVzWzBdID09PSBcIkNvbG9yXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBSZXBvc2l0aW9uIGJvdGggdGhlIGhvb2sncyBuYW1lIGFuZCBpdHMgZGVmYXVsdCB2YWx1ZSB0byB0aGUgZW5kIG9mIHRoZWlyIHJlc3BlY3RpdmUgc3RyaW5ncy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob29rTmFtZXMucHVzaChob29rTmFtZXMuc2hpZnQoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlcy5wdXNoKGRlZmF1bHRWYWx1ZXMuc2hpZnQoKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBSZXBsYWNlIHRoZSBleGlzdGluZyB0ZW1wbGF0ZSBmb3IgdGhlIGhvb2sncyByb290IHByb3BlcnR5LiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIENTUy5Ib29rcy50ZW1wbGF0ZXNbcm9vdFByb3BlcnR5XSA9IFsgaG9va05hbWVzLmpvaW4oXCIgXCIpLCBkZWZhdWx0VmFsdWVzLmpvaW4oXCIgXCIpIF07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKiBIb29rIHJlZ2lzdHJhdGlvbi4gKi9cbiAgICAgICAgICAgICAgICBmb3IgKHJvb3RQcm9wZXJ0eSBpbiBDU1MuSG9va3MudGVtcGxhdGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGhvb2tUZW1wbGF0ZSA9IENTUy5Ib29rcy50ZW1wbGF0ZXNbcm9vdFByb3BlcnR5XTtcbiAgICAgICAgICAgICAgICAgICAgaG9va05hbWVzID0gaG9va1RlbXBsYXRlWzBdLnNwbGl0KFwiIFwiKTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIGhvb2tOYW1lcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZ1bGxIb29rTmFtZSA9IHJvb3RQcm9wZXJ0eSArIGhvb2tOYW1lc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob29rUG9zaXRpb24gPSBpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBGb3IgZWFjaCBob29rLCByZWdpc3RlciBpdHMgZnVsbCBuYW1lIChlLmcuIHRleHRTaGFkb3dCbHVyKSB3aXRoIGl0cyByb290IHByb3BlcnR5IChlLmcuIHRleHRTaGFkb3cpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBhbmQgdGhlIGhvb2sncyBwb3NpdGlvbiBpbiBpdHMgdGVtcGxhdGUncyBkZWZhdWx0IHZhbHVlIHN0cmluZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIENTUy5Ib29rcy5yZWdpc3RlcmVkW2Z1bGxIb29rTmFtZV0gPSBbIHJvb3RQcm9wZXJ0eSwgaG9va1Bvc2l0aW9uIF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgIEluamVjdGlvbiBhbmQgRXh0cmFjdGlvblxuICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgIC8qIExvb2sgdXAgdGhlIHJvb3QgcHJvcGVydHkgYXNzb2NpYXRlZCB3aXRoIHRoZSBob29rIChlLmcuIHJldHVybiBcInRleHRTaGFkb3dcIiBmb3IgXCJ0ZXh0U2hhZG93Qmx1clwiKS4gKi9cbiAgICAgICAgICAgIC8qIFNpbmNlIGEgaG9vayBjYW5ub3QgYmUgc2V0IGRpcmVjdGx5ICh0aGUgYnJvd3NlciB3b24ndCByZWNvZ25pemUgaXQpLCBzdHlsZSB1cGRhdGluZyBmb3IgaG9va3MgaXMgcm91dGVkIHRocm91Z2ggdGhlIGhvb2sncyByb290IHByb3BlcnR5LiAqL1xuICAgICAgICAgICAgZ2V0Um9vdDogZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgdmFyIGhvb2tEYXRhID0gQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbcHJvcGVydHldO1xuXG4gICAgICAgICAgICAgICAgaWYgKGhvb2tEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBob29rRGF0YVswXTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGVyZSB3YXMgbm8gaG9vayBtYXRjaCwgcmV0dXJuIHRoZSBwcm9wZXJ0eSBuYW1lIHVudG91Y2hlZC4gKi9cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKiBDb252ZXJ0IGFueSByb290UHJvcGVydHlWYWx1ZSwgbnVsbCBvciBvdGhlcndpc2UsIGludG8gYSBzcGFjZS1kZWxpbWl0ZWQgbGlzdCBvZiBob29rIHZhbHVlcyBzbyB0aGF0XG4gICAgICAgICAgICAgICB0aGUgdGFyZ2V0ZWQgaG9vayBjYW4gYmUgaW5qZWN0ZWQgb3IgZXh0cmFjdGVkIGF0IGl0cyBzdGFuZGFyZCBwb3NpdGlvbi4gKi9cbiAgICAgICAgICAgIGNsZWFuUm9vdFByb3BlcnR5VmFsdWU6IGZ1bmN0aW9uKHJvb3RQcm9wZXJ0eSwgcm9vdFByb3BlcnR5VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAvKiBJZiB0aGUgcm9vdFByb3BlcnR5VmFsdWUgaXMgd3JhcHBlZCB3aXRoIFwicmdiKClcIiwgXCJjbGlwKClcIiwgZXRjLiwgcmVtb3ZlIHRoZSB3cmFwcGluZyB0byBub3JtYWxpemUgdGhlIHZhbHVlIGJlZm9yZSBtYW5pcHVsYXRpb24uICovXG4gICAgICAgICAgICAgICAgaWYgKENTUy5SZWdFeC52YWx1ZVVud3JhcC50ZXN0KHJvb3RQcm9wZXJ0eVZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSA9IHJvb3RQcm9wZXJ0eVZhbHVlLm1hdGNoKENTUy5SZWdFeC52YWx1ZVVud3JhcClbMV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyogSWYgcm9vdFByb3BlcnR5VmFsdWUgaXMgYSBDU1MgbnVsbC12YWx1ZSAoZnJvbSB3aGljaCB0aGVyZSdzIGluaGVyZW50bHkgbm8gaG9vayB2YWx1ZSB0byBleHRyYWN0KSxcbiAgICAgICAgICAgICAgICAgICBkZWZhdWx0IHRvIHRoZSByb290J3MgZGVmYXVsdCB2YWx1ZSBhcyBkZWZpbmVkIGluIENTUy5Ib29rcy50ZW1wbGF0ZXMuICovXG4gICAgICAgICAgICAgICAgLyogTm90ZTogQ1NTIG51bGwtdmFsdWVzIGluY2x1ZGUgXCJub25lXCIsIFwiYXV0b1wiLCBhbmQgXCJ0cmFuc3BhcmVudFwiLiBUaGV5IG11c3QgYmUgY29udmVydGVkIGludG8gdGhlaXJcbiAgICAgICAgICAgICAgICAgICB6ZXJvLXZhbHVlcyAoZS5nLiB0ZXh0U2hhZG93OiBcIm5vbmVcIiA9PT4gdGV4dFNoYWRvdzogXCIwcHggMHB4IDBweCBibGFja1wiKSBmb3IgaG9vayBtYW5pcHVsYXRpb24gdG8gcHJvY2VlZC4gKi9cbiAgICAgICAgICAgICAgICBpZiAoQ1NTLlZhbHVlcy5pc0NTU051bGxWYWx1ZShyb290UHJvcGVydHlWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSBDU1MuSG9va3MudGVtcGxhdGVzW3Jvb3RQcm9wZXJ0eV1bMV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJvb3RQcm9wZXJ0eVZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qIEV4dHJhY3RlZCB0aGUgaG9vaydzIHZhbHVlIGZyb20gaXRzIHJvb3QgcHJvcGVydHkncyB2YWx1ZS4gVGhpcyBpcyB1c2VkIHRvIGdldCB0aGUgc3RhcnRpbmcgdmFsdWUgb2YgYW4gYW5pbWF0aW5nIGhvb2suICovXG4gICAgICAgICAgICBleHRyYWN0VmFsdWU6IGZ1bmN0aW9uIChmdWxsSG9va05hbWUsIHJvb3RQcm9wZXJ0eVZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGhvb2tEYXRhID0gQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbZnVsbEhvb2tOYW1lXTtcblxuICAgICAgICAgICAgICAgIGlmIChob29rRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaG9va1Jvb3QgPSBob29rRGF0YVswXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvb2tQb3NpdGlvbiA9IGhvb2tEYXRhWzFdO1xuXG4gICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gQ1NTLkhvb2tzLmNsZWFuUm9vdFByb3BlcnR5VmFsdWUoaG9va1Jvb3QsIHJvb3RQcm9wZXJ0eVZhbHVlKTtcblxuICAgICAgICAgICAgICAgICAgICAvKiBTcGxpdCByb290UHJvcGVydHlWYWx1ZSBpbnRvIGl0cyBjb25zdGl0dWVudCBob29rIHZhbHVlcyB0aGVuIGdyYWIgdGhlIGRlc2lyZWQgaG9vayBhdCBpdHMgc3RhbmRhcmQgcG9zaXRpb24uICovXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByb290UHJvcGVydHlWYWx1ZS50b1N0cmluZygpLm1hdGNoKENTUy5SZWdFeC52YWx1ZVNwbGl0KVtob29rUG9zaXRpb25dO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBwcm92aWRlZCBmdWxsSG9va05hbWUgaXNuJ3QgYSByZWdpc3RlcmVkIGhvb2ssIHJldHVybiB0aGUgcm9vdFByb3BlcnR5VmFsdWUgdGhhdCB3YXMgcGFzc2VkIGluLiAqL1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcm9vdFByb3BlcnR5VmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qIEluamVjdCB0aGUgaG9vaydzIHZhbHVlIGludG8gaXRzIHJvb3QgcHJvcGVydHkncyB2YWx1ZS4gVGhpcyBpcyB1c2VkIHRvIHBpZWNlIGJhY2sgdG9nZXRoZXIgdGhlIHJvb3QgcHJvcGVydHlcbiAgICAgICAgICAgICAgIG9uY2UgVmVsb2NpdHkgaGFzIHVwZGF0ZWQgb25lIG9mIGl0cyBpbmRpdmlkdWFsbHkgaG9va2VkIHZhbHVlcyB0aHJvdWdoIHR3ZWVuaW5nLiAqL1xuICAgICAgICAgICAgaW5qZWN0VmFsdWU6IGZ1bmN0aW9uIChmdWxsSG9va05hbWUsIGhvb2tWYWx1ZSwgcm9vdFByb3BlcnR5VmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgaG9va0RhdGEgPSBDU1MuSG9va3MucmVnaXN0ZXJlZFtmdWxsSG9va05hbWVdO1xuXG4gICAgICAgICAgICAgICAgaWYgKGhvb2tEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBob29rUm9vdCA9IGhvb2tEYXRhWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgaG9va1Bvc2l0aW9uID0gaG9va0RhdGFbMV0sXG4gICAgICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZVBhcnRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWVVcGRhdGVkO1xuXG4gICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gQ1NTLkhvb2tzLmNsZWFuUm9vdFByb3BlcnR5VmFsdWUoaG9va1Jvb3QsIHJvb3RQcm9wZXJ0eVZhbHVlKTtcblxuICAgICAgICAgICAgICAgICAgICAvKiBTcGxpdCByb290UHJvcGVydHlWYWx1ZSBpbnRvIGl0cyBpbmRpdmlkdWFsIGhvb2sgdmFsdWVzLCByZXBsYWNlIHRoZSB0YXJnZXRlZCB2YWx1ZSB3aXRoIGhvb2tWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZWNvbnN0cnVjdCB0aGUgcm9vdFByb3BlcnR5VmFsdWUgc3RyaW5nLiAqL1xuICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZVBhcnRzID0gcm9vdFByb3BlcnR5VmFsdWUudG9TdHJpbmcoKS5tYXRjaChDU1MuUmVnRXgudmFsdWVTcGxpdCk7XG4gICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlUGFydHNbaG9va1Bvc2l0aW9uXSA9IGhvb2tWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWVVcGRhdGVkID0gcm9vdFByb3BlcnR5VmFsdWVQYXJ0cy5qb2luKFwiIFwiKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcm9vdFByb3BlcnR5VmFsdWVVcGRhdGVkO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBwcm92aWRlZCBmdWxsSG9va05hbWUgaXNuJ3QgYSByZWdpc3RlcmVkIGhvb2ssIHJldHVybiB0aGUgcm9vdFByb3BlcnR5VmFsdWUgdGhhdCB3YXMgcGFzc2VkIGluLiAqL1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcm9vdFByb3BlcnR5VmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgIE5vcm1hbGl6YXRpb25zXG4gICAgICAgICoqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgLyogTm9ybWFsaXphdGlvbnMgc3RhbmRhcmRpemUgQ1NTIHByb3BlcnR5IG1hbmlwdWxhdGlvbiBieSBwb2xseWZpbGxpbmcgYnJvd3Nlci1zcGVjaWZpYyBpbXBsZW1lbnRhdGlvbnMgKGUuZy4gb3BhY2l0eSlcbiAgICAgICAgICAgYW5kIHJlZm9ybWF0dGluZyBzcGVjaWFsIHByb3BlcnRpZXMgKGUuZy4gY2xpcCwgcmdiYSkgdG8gbG9vayBsaWtlIHN0YW5kYXJkIG9uZXMuICovXG4gICAgICAgIE5vcm1hbGl6YXRpb25zOiB7XG4gICAgICAgICAgICAvKiBOb3JtYWxpemF0aW9ucyBhcmUgcGFzc2VkIGEgbm9ybWFsaXphdGlvbiB0YXJnZXQgKGVpdGhlciB0aGUgcHJvcGVydHkncyBuYW1lLCBpdHMgZXh0cmFjdGVkIHZhbHVlLCBvciBpdHMgaW5qZWN0ZWQgdmFsdWUpLFxuICAgICAgICAgICAgICAgdGhlIHRhcmdldGVkIGVsZW1lbnQgKHdoaWNoIG1heSBuZWVkIHRvIGJlIHF1ZXJpZWQpLCBhbmQgdGhlIHRhcmdldGVkIHByb3BlcnR5IHZhbHVlLiAqL1xuICAgICAgICAgICAgcmVnaXN0ZXJlZDoge1xuICAgICAgICAgICAgICAgIGNsaXA6IGZ1bmN0aW9uICh0eXBlLCBlbGVtZW50LCBwcm9wZXJ0eVZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm5hbWVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJjbGlwXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBDbGlwIG5lZWRzIHRvIGJlIHVud3JhcHBlZCBhbmQgc3RyaXBwZWQgb2YgaXRzIGNvbW1hcyBkdXJpbmcgZXh0cmFjdGlvbi4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJleHRyYWN0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4dHJhY3RlZDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIFZlbG9jaXR5IGFsc28gZXh0cmFjdGVkIHRoaXMgdmFsdWUsIHNraXAgZXh0cmFjdGlvbi4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLlJlZ0V4LndyYXBwZWRWYWx1ZUFscmVhZHlFeHRyYWN0ZWQudGVzdChwcm9wZXJ0eVZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYWN0ZWQgPSBwcm9wZXJ0eVZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFJlbW92ZSB0aGUgXCJyZWN0KClcIiB3cmFwcGVyLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYWN0ZWQgPSBwcm9wZXJ0eVZhbHVlLnRvU3RyaW5nKCkubWF0Y2goQ1NTLlJlZ0V4LnZhbHVlVW53cmFwKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTdHJpcCBvZmYgY29tbWFzLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYWN0ZWQgPSBleHRyYWN0ZWQgPyBleHRyYWN0ZWRbMV0ucmVwbGFjZSgvLChcXHMrKT8vZywgXCIgXCIpIDogcHJvcGVydHlWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXh0cmFjdGVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogQ2xpcCBuZWVkcyB0byBiZSByZS13cmFwcGVkIGR1cmluZyBpbmplY3Rpb24uICovXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaW5qZWN0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwicmVjdChcIiArIHByb3BlcnR5VmFsdWUgKyBcIilcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBibHVyOiBmdW5jdGlvbih0eXBlLCBlbGVtZW50LCBwcm9wZXJ0eVZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm5hbWVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gVmVsb2NpdHkuU3RhdGUuaXNGaXJlZm94ID8gXCJmaWx0ZXJcIiA6IFwiLXdlYmtpdC1maWx0ZXJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJleHRyYWN0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4dHJhY3RlZCA9IHBhcnNlRmxvYXQocHJvcGVydHlWYWx1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBleHRyYWN0ZWQgaXMgTmFOLCBtZWFuaW5nIHRoZSB2YWx1ZSBpc24ndCBhbHJlYWR5IGV4dHJhY3RlZC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIShleHRyYWN0ZWQgfHwgZXh0cmFjdGVkID09PSAwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYmx1ckNvbXBvbmVudCA9IHByb3BlcnR5VmFsdWUudG9TdHJpbmcoKS5tYXRjaCgvYmx1clxcKChbMC05XStbQS16XSspXFwpL2kpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBmaWx0ZXIgc3RyaW5nIGhhZCBhIGJsdXIgY29tcG9uZW50LCByZXR1cm4ganVzdCB0aGUgYmx1ciB2YWx1ZSBhbmQgdW5pdCB0eXBlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYmx1ckNvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFjdGVkID0gYmx1ckNvbXBvbmVudFsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGNvbXBvbmVudCBkb2Vzbid0IGV4aXN0LCBkZWZhdWx0IGJsdXIgdG8gMC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhY3RlZCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXh0cmFjdGVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogQmx1ciBuZWVkcyB0byBiZSByZS13cmFwcGVkIGR1cmluZyBpbmplY3Rpb24uICovXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaW5qZWN0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRm9yIHRoZSBibHVyIGVmZmVjdCB0byBiZSBmdWxseSBkZS1hcHBsaWVkLCBpdCBuZWVkcyB0byBiZSBzZXQgdG8gXCJub25lXCIgaW5zdGVhZCBvZiAwLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcGFyc2VGbG9hdChwcm9wZXJ0eVZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiYmx1cihcIiArIHByb3BlcnR5VmFsdWUgKyBcIilcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgLyogPD1JRTggZG8gbm90IHN1cHBvcnQgdGhlIHN0YW5kYXJkIG9wYWNpdHkgcHJvcGVydHkuIFRoZXkgdXNlIGZpbHRlcjphbHBoYShvcGFjaXR5PUlOVCkgaW5zdGVhZC4gKi9cbiAgICAgICAgICAgICAgICBvcGFjaXR5OiBmdW5jdGlvbiAodHlwZSwgZWxlbWVudCwgcHJvcGVydHlWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoSUUgPD0gOCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm5hbWVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiZmlsdGVyXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImV4dHJhY3RcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogPD1JRTggcmV0dXJuIGEgXCJmaWx0ZXJcIiB2YWx1ZSBvZiBcImFscGhhKG9wYWNpdHk9XFxkezEsM30pXCIuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEV4dHJhY3QgdGhlIHZhbHVlIGFuZCBjb252ZXJ0IGl0IHRvIGEgZGVjaW1hbCB2YWx1ZSB0byBtYXRjaCB0aGUgc3RhbmRhcmQgQ1NTIG9wYWNpdHkgcHJvcGVydHkncyBmb3JtYXR0aW5nLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXh0cmFjdGVkID0gcHJvcGVydHlWYWx1ZS50b1N0cmluZygpLm1hdGNoKC9hbHBoYVxcKG9wYWNpdHk9KC4qKVxcKS9pKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXh0cmFjdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDb252ZXJ0IHRvIGRlY2ltYWwgdmFsdWUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gZXh0cmFjdGVkWzFdIC8gMTAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogV2hlbiBleHRyYWN0aW5nIG9wYWNpdHksIGRlZmF1bHQgdG8gMSBzaW5jZSBhIG51bGwgdmFsdWUgbWVhbnMgb3BhY2l0eSBoYXNuJ3QgYmVlbiBzZXQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eVZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpbmplY3RcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogT3BhY2lmaWVkIGVsZW1lbnRzIGFyZSByZXF1aXJlZCB0byBoYXZlIHRoZWlyIHpvb20gcHJvcGVydHkgc2V0IHRvIGEgbm9uLXplcm8gdmFsdWUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuem9vbSA9IDE7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU2V0dGluZyB0aGUgZmlsdGVyIHByb3BlcnR5IG9uIGVsZW1lbnRzIHdpdGggY2VydGFpbiBmb250IHByb3BlcnR5IGNvbWJpbmF0aW9ucyBjYW4gcmVzdWx0IGluIGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGx5IHVuYXBwZWFsaW5nIHVsdHJhLWJvbGRpbmcgZWZmZWN0LiBUaGVyZSdzIG5vIHdheSB0byByZW1lZHkgdGhpcyB0aHJvdWdob3V0IGEgdHdlZW4sIGJ1dCBkcm9wcGluZyB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgYWx0b2dldGhlciAod2hlbiBvcGFjaXR5IGhpdHMgMSkgYXQgbGVhc3RzIGVuc3VyZXMgdGhhdCB0aGUgZ2xpdGNoIGlzIGdvbmUgcG9zdC10d2VlbmluZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlRmxvYXQocHJvcGVydHlWYWx1ZSkgPj0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQXMgcGVyIHRoZSBmaWx0ZXIgcHJvcGVydHkncyBzcGVjLCBjb252ZXJ0IHRoZSBkZWNpbWFsIHZhbHVlIHRvIGEgd2hvbGUgbnVtYmVyIGFuZCB3cmFwIHRoZSB2YWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJhbHBoYShvcGFjaXR5PVwiICsgcGFyc2VJbnQocGFyc2VGbG9hdChwcm9wZXJ0eVZhbHVlKSAqIDEwMCwgMTApICsgXCIpXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLyogV2l0aCBhbGwgb3RoZXIgYnJvd3NlcnMsIG5vcm1hbGl6YXRpb24gaXMgbm90IHJlcXVpcmVkOyByZXR1cm4gdGhlIHNhbWUgdmFsdWVzIHRoYXQgd2VyZSBwYXNzZWQgaW4uICovXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwibmFtZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJvcGFjaXR5XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImV4dHJhY3RcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImluamVjdFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydHlWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgIEJhdGNoZWQgUmVnaXN0cmF0aW9uc1xuICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgIC8qIE5vdGU6IEJhdGNoZWQgbm9ybWFsaXphdGlvbnMgZXh0ZW5kIHRoZSBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZCBvYmplY3QuICovXG4gICAgICAgICAgICByZWdpc3RlcjogZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgIFRyYW5zZm9ybXNcbiAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgIC8qIFRyYW5zZm9ybXMgYXJlIHRoZSBzdWJwcm9wZXJ0aWVzIGNvbnRhaW5lZCBieSB0aGUgQ1NTIFwidHJhbnNmb3JtXCIgcHJvcGVydHkuIFRyYW5zZm9ybXMgbXVzdCB1bmRlcmdvIG5vcm1hbGl6YXRpb25cbiAgICAgICAgICAgICAgICAgICBzbyB0aGF0IHRoZXkgY2FuIGJlIHJlZmVyZW5jZWQgaW4gYSBwcm9wZXJ0aWVzIG1hcCBieSB0aGVpciBpbmRpdmlkdWFsIG5hbWVzLiAqL1xuICAgICAgICAgICAgICAgIC8qIE5vdGU6IFdoZW4gdHJhbnNmb3JtcyBhcmUgXCJzZXRcIiwgdGhleSBhcmUgYWN0dWFsbHkgYXNzaWduZWQgdG8gYSBwZXItZWxlbWVudCB0cmFuc2Zvcm1DYWNoZS4gV2hlbiBhbGwgdHJhbnNmb3JtXG4gICAgICAgICAgICAgICAgICAgc2V0dGluZyBpcyBjb21wbGV0ZSBjb21wbGV0ZSwgQ1NTLmZsdXNoVHJhbnNmb3JtQ2FjaGUoKSBtdXN0IGJlIG1hbnVhbGx5IGNhbGxlZCB0byBmbHVzaCB0aGUgdmFsdWVzIHRvIHRoZSBET00uXG4gICAgICAgICAgICAgICAgICAgVHJhbnNmb3JtIHNldHRpbmcgaXMgYmF0Y2hlZCBpbiB0aGlzIHdheSB0byBpbXByb3ZlIHBlcmZvcm1hbmNlOiB0aGUgdHJhbnNmb3JtIHN0eWxlIG9ubHkgbmVlZHMgdG8gYmUgdXBkYXRlZFxuICAgICAgICAgICAgICAgICAgIG9uY2Ugd2hlbiBtdWx0aXBsZSB0cmFuc2Zvcm0gc3VicHJvcGVydGllcyBhcmUgYmVpbmcgYW5pbWF0ZWQgc2ltdWx0YW5lb3VzbHkuICovXG4gICAgICAgICAgICAgICAgLyogTm90ZTogSUU5IGFuZCBBbmRyb2lkIEdpbmdlcmJyZWFkIGhhdmUgc3VwcG9ydCBmb3IgMkQgLS0gYnV0IG5vdCAzRCAtLSB0cmFuc2Zvcm1zLiBTaW5jZSBhbmltYXRpbmcgdW5zdXBwb3J0ZWRcbiAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm0gcHJvcGVydGllcyByZXN1bHRzIGluIHRoZSBicm93c2VyIGlnbm9yaW5nIHRoZSAqZW50aXJlKiB0cmFuc2Zvcm0gc3RyaW5nLCB3ZSBwcmV2ZW50IHRoZXNlIDNEIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgIGZyb20gYmVpbmcgbm9ybWFsaXplZCBmb3IgdGhlc2UgYnJvd3NlcnMgc28gdGhhdCB0d2VlbmluZyBza2lwcyB0aGVzZSBwcm9wZXJ0aWVzIGFsdG9nZXRoZXJcbiAgICAgICAgICAgICAgICAgICAoc2luY2UgaXQgd2lsbCBpZ25vcmUgdGhlbSBhcyBiZWluZyB1bnN1cHBvcnRlZCBieSB0aGUgYnJvd3Nlci4pICovXG4gICAgICAgICAgICAgICAgaWYgKCEoSUUgPD0gOSkgJiYgIVZlbG9jaXR5LlN0YXRlLmlzR2luZ2VyYnJlYWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogU2luY2UgdGhlIHN0YW5kYWxvbmUgQ1NTIFwicGVyc3BlY3RpdmVcIiBwcm9wZXJ0eSBhbmQgdGhlIENTUyB0cmFuc2Zvcm0gXCJwZXJzcGVjdGl2ZVwiIHN1YnByb3BlcnR5XG4gICAgICAgICAgICAgICAgICAgIHNoYXJlIHRoZSBzYW1lIG5hbWUsIHRoZSBsYXR0ZXIgaXMgZ2l2ZW4gYSB1bmlxdWUgdG9rZW4gd2l0aGluIFZlbG9jaXR5OiBcInRyYW5zZm9ybVBlcnNwZWN0aXZlXCIuICovXG4gICAgICAgICAgICAgICAgICAgIENTUy5MaXN0cy50cmFuc2Zvcm1zQmFzZSA9IENTUy5MaXN0cy50cmFuc2Zvcm1zQmFzZS5jb25jYXQoQ1NTLkxpc3RzLnRyYW5zZm9ybXMzRCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBDU1MuTGlzdHMudHJhbnNmb3Jtc0Jhc2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgLyogV3JhcCB0aGUgZHluYW1pY2FsbHkgZ2VuZXJhdGVkIG5vcm1hbGl6YXRpb24gZnVuY3Rpb24gaW4gYSBuZXcgc2NvcGUgc28gdGhhdCB0cmFuc2Zvcm1OYW1lJ3MgdmFsdWUgaXNcbiAgICAgICAgICAgICAgICAgICAgcGFpcmVkIHdpdGggaXRzIHJlc3BlY3RpdmUgZnVuY3Rpb24uIChPdGhlcndpc2UsIGFsbCBmdW5jdGlvbnMgd291bGQgdGFrZSB0aGUgZmluYWwgZm9yIGxvb3AncyB0cmFuc2Zvcm1OYW1lLikgKi9cbiAgICAgICAgICAgICAgICAgICAgKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRyYW5zZm9ybU5hbWUgPSBDU1MuTGlzdHMudHJhbnNmb3Jtc0Jhc2VbaV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3RyYW5zZm9ybU5hbWVdID0gZnVuY3Rpb24gKHR5cGUsIGVsZW1lbnQsIHByb3BlcnR5VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlIG5vcm1hbGl6ZWQgcHJvcGVydHkgbmFtZSBpcyB0aGUgcGFyZW50IFwidHJhbnNmb3JtXCIgcHJvcGVydHkgLS0gdGhlIHByb3BlcnR5IHRoYXQgaXMgYWN0dWFsbHkgc2V0IGluIENTUy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm5hbWVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcInRyYW5zZm9ybVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUcmFuc2Zvcm0gdmFsdWVzIGFyZSBjYWNoZWQgb250byBhIHBlci1lbGVtZW50IHRyYW5zZm9ybUNhY2hlIG9iamVjdC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImV4dHJhY3RcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoaXMgdHJhbnNmb3JtIGhhcyB5ZXQgdG8gYmUgYXNzaWduZWQgYSB2YWx1ZSwgcmV0dXJuIGl0cyBudWxsIHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkgPT09IHVuZGVmaW5lZCB8fCBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTY2FsZSBDU1MuTGlzdHMudHJhbnNmb3Jtc0Jhc2UgZGVmYXVsdCB0byAxIHdoZXJlYXMgYWxsIG90aGVyIHRyYW5zZm9ybSBwcm9wZXJ0aWVzIGRlZmF1bHQgdG8gMC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gL15zY2FsZS9pLnRlc3QodHJhbnNmb3JtTmFtZSkgPyAxIDogMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFdoZW4gdHJhbnNmb3JtIHZhbHVlcyBhcmUgc2V0LCB0aGV5IGFyZSB3cmFwcGVkIGluIHBhcmVudGhlc2VzIGFzIHBlciB0aGUgQ1NTIHNwZWMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUaHVzLCB3aGVuIGV4dHJhY3RpbmcgdGhlaXIgdmFsdWVzIChmb3IgdHdlZW4gY2FsY3VsYXRpb25zKSwgd2Ugc3RyaXAgb2ZmIHRoZSBwYXJlbnRoZXNlcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGVbdHJhbnNmb3JtTmFtZV0ucmVwbGFjZSgvWygpXS9nLCBcIlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImluamVjdFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGludmFsaWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgYW4gaW5kaXZpZHVhbCB0cmFuc2Zvcm0gcHJvcGVydHkgY29udGFpbnMgYW4gdW5zdXBwb3J0ZWQgdW5pdCB0eXBlLCB0aGUgYnJvd3NlciBpZ25vcmVzIHRoZSAqZW50aXJlKiB0cmFuc2Zvcm0gcHJvcGVydHkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUaHVzLCBwcm90ZWN0IHVzZXJzIGZyb20gdGhlbXNlbHZlcyBieSBza2lwcGluZyBzZXR0aW5nIGZvciB0cmFuc2Zvcm0gdmFsdWVzIHN1cHBsaWVkIHdpdGggaW52YWxpZCB1bml0IHR5cGVzLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU3dpdGNoIG9uIHRoZSBiYXNlIHRyYW5zZm9ybSB0eXBlOyBpZ25vcmUgdGhlIGF4aXMgYnkgcmVtb3ZpbmcgdGhlIGxhc3QgbGV0dGVyIGZyb20gdGhlIHRyYW5zZm9ybSdzIG5hbWUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHRyYW5zZm9ybU5hbWUuc3Vic3RyKDAsIHRyYW5zZm9ybU5hbWUubGVuZ3RoIC0gMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBXaGl0ZWxpc3QgdW5pdCB0eXBlcyBmb3IgZWFjaCB0cmFuc2Zvcm0uICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInRyYW5zbGF0ZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnZhbGlkID0gIS8oJXxweHxlbXxyZW18dnd8dmh8XFxkKSQvaS50ZXN0KHByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSBhbiBheGlzLWZyZWUgXCJzY2FsZVwiIHByb3BlcnR5IGlzIHN1cHBvcnRlZCBhcyB3ZWxsLCBhIGxpdHRsZSBoYWNrIGlzIHVzZWQgaGVyZSB0byBkZXRlY3QgaXQgYnkgY2hvcHBpbmcgb2ZmIGl0cyBsYXN0IGxldHRlci4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwic2NhbFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJzY2FsZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDaHJvbWUgb24gQW5kcm9pZCBoYXMgYSBidWcgaW4gd2hpY2ggc2NhbGVkIGVsZW1lbnRzIGJsdXIgaWYgdGhlaXIgaW5pdGlhbCBzY2FsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSBpcyBiZWxvdyAxICh3aGljaCBjYW4gaGFwcGVuIHdpdGggZm9yY2VmZWVkaW5nKS4gVGh1cywgd2UgZGV0ZWN0IGEgeWV0LXVuc2V0IHNjYWxlIHByb3BlcnR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZCBlbnN1cmUgdGhhdCBpdHMgZmlyc3QgdmFsdWUgaXMgYWx3YXlzIDEuIE1vcmUgaW5mbzogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDQxNzg5MC9jc3MzLWFuaW1hdGlvbnMtd2l0aC10cmFuc2Zvcm0tY2F1c2VzLWJsdXJyZWQtZWxlbWVudHMtb24td2Via2l0LzEwNDE3OTYyIzEwNDE3OTYyICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChWZWxvY2l0eS5TdGF0ZS5pc0FuZHJvaWQgJiYgRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXSA9PT0gdW5kZWZpbmVkICYmIHByb3BlcnR5VmFsdWUgPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludmFsaWQgPSAhLyhcXGQpJC9pLnRlc3QocHJvcGVydHlWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJza2V3XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludmFsaWQgPSAhLyhkZWd8XFxkKSQvaS50ZXN0KHByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwicm90YXRlXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludmFsaWQgPSAhLyhkZWd8XFxkKSQvaS50ZXN0KHByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpbnZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQXMgcGVyIHRoZSBDU1Mgc3BlYywgd3JhcCB0aGUgdmFsdWUgaW4gcGFyZW50aGVzZXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXSA9IFwiKFwiICsgcHJvcGVydHlWYWx1ZSArIFwiKVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBBbHRob3VnaCB0aGUgdmFsdWUgaXMgc2V0IG9uIHRoZSB0cmFuc2Zvcm1DYWNoZSBvYmplY3QsIHJldHVybiB0aGUgbmV3bHktdXBkYXRlZCB2YWx1ZSBmb3IgdGhlIGNhbGxpbmcgY29kZSB0byBwcm9jZXNzIGFzIG5vcm1hbC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH0pKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgQ29sb3JzXG4gICAgICAgICAgICAgICAgKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgIC8qIFNpbmNlIFZlbG9jaXR5IG9ubHkgYW5pbWF0ZXMgYSBzaW5nbGUgbnVtZXJpYyB2YWx1ZSBwZXIgcHJvcGVydHksIGNvbG9yIGFuaW1hdGlvbiBpcyBhY2hpZXZlZCBieSBob29raW5nIHRoZSBpbmRpdmlkdWFsIFJHQkEgY29tcG9uZW50cyBvZiBDU1MgY29sb3IgcHJvcGVydGllcy5cbiAgICAgICAgICAgICAgICAgICBBY2NvcmRpbmdseSwgY29sb3IgdmFsdWVzIG11c3QgYmUgbm9ybWFsaXplZCAoZS5nLiBcIiNmZjAwMDBcIiwgXCJyZWRcIiwgYW5kIFwicmdiKDI1NSwgMCwgMClcIiA9PT4gXCIyNTUgMCAwIDFcIikgc28gdGhhdCB0aGVpciBjb21wb25lbnRzIGNhbiBiZSBpbmplY3RlZC9leHRyYWN0ZWQgYnkgQ1NTLkhvb2tzIGxvZ2ljLiAqL1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgQ1NTLkxpc3RzLmNvbG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAvKiBXcmFwIHRoZSBkeW5hbWljYWxseSBnZW5lcmF0ZWQgbm9ybWFsaXphdGlvbiBmdW5jdGlvbiBpbiBhIG5ldyBzY29wZSBzbyB0aGF0IGNvbG9yTmFtZSdzIHZhbHVlIGlzIHBhaXJlZCB3aXRoIGl0cyByZXNwZWN0aXZlIGZ1bmN0aW9uLlxuICAgICAgICAgICAgICAgICAgICAgICAoT3RoZXJ3aXNlLCBhbGwgZnVuY3Rpb25zIHdvdWxkIHRha2UgdGhlIGZpbmFsIGZvciBsb29wJ3MgY29sb3JOYW1lLikgKi9cbiAgICAgICAgICAgICAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb2xvck5hbWUgPSBDU1MuTGlzdHMuY29sb3JzW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBJbiBJRTw9OCwgd2hpY2ggc3VwcG9ydCByZ2IgYnV0IG5vdCByZ2JhLCBjb2xvciBwcm9wZXJ0aWVzIGFyZSByZXZlcnRlZCB0byByZ2IgYnkgc3RyaXBwaW5nIG9mZiB0aGUgYWxwaGEgY29tcG9uZW50LiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbY29sb3JOYW1lXSA9IGZ1bmN0aW9uKHR5cGUsIGVsZW1lbnQsIHByb3BlcnR5VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm5hbWVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xvck5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENvbnZlcnQgYWxsIGNvbG9yIHZhbHVlcyBpbnRvIHRoZSByZ2IgZm9ybWF0LiAoT2xkIElFIGNhbiByZXR1cm4gaGV4IHZhbHVlcyBhbmQgY29sb3IgbmFtZXMgaW5zdGVhZCBvZiByZ2IvcmdiYS4pICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJleHRyYWN0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXh0cmFjdGVkO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgY29sb3IgaXMgYWxyZWFkeSBpbiBpdHMgaG9va2FibGUgZm9ybSAoZS5nLiBcIjI1NSAyNTUgMjU1IDFcIikgZHVlIHRvIGhhdmluZyBiZWVuIHByZXZpb3VzbHkgZXh0cmFjdGVkLCBza2lwIGV4dHJhY3Rpb24uICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLlJlZ0V4LndyYXBwZWRWYWx1ZUFscmVhZHlFeHRyYWN0ZWQudGVzdChwcm9wZXJ0eVZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhY3RlZCA9IHByb3BlcnR5VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb252ZXJ0ZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yTmFtZXMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBibGFjazogXCJyZ2IoMCwgMCwgMClcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsdWU6IFwicmdiKDAsIDAsIDI1NSlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyYXk6IFwicmdiKDEyOCwgMTI4LCAxMjgpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncmVlbjogXCJyZ2IoMCwgMTI4LCAwKVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVkOiBcInJnYigyNTUsIDAsIDApXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGl0ZTogXCJyZ2IoMjU1LCAyNTUsIDI1NSlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ29udmVydCBjb2xvciBuYW1lcyB0byByZ2IuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC9eW0Etel0rJC9pLnRlc3QocHJvcGVydHlWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbG9yTmFtZXNbcHJvcGVydHlWYWx1ZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udmVydGVkID0gY29sb3JOYW1lc1twcm9wZXJ0eVZhbHVlXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgYW4gdW5tYXRjaGVkIGNvbG9yIG5hbWUgaXMgcHJvdmlkZWQsIGRlZmF1bHQgdG8gYmxhY2suICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb252ZXJ0ZWQgPSBjb2xvck5hbWVzLmJsYWNrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ29udmVydCBoZXggdmFsdWVzIHRvIHJnYi4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKENTUy5SZWdFeC5pc0hleC50ZXN0KHByb3BlcnR5VmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnRlZCA9IFwicmdiKFwiICsgQ1NTLlZhbHVlcy5oZXhUb1JnYihwcm9wZXJ0eVZhbHVlKS5qb2luKFwiIFwiKSArIFwiKVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBwcm92aWRlZCBjb2xvciBkb2Vzbid0IG1hdGNoIGFueSBvZiB0aGUgYWNjZXB0ZWQgY29sb3IgZm9ybWF0cywgZGVmYXVsdCB0byBibGFjay4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCEoL15yZ2JhP1xcKC9pLnRlc3QocHJvcGVydHlWYWx1ZSkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnRlZCA9IGNvbG9yTmFtZXMuYmxhY2s7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogUmVtb3ZlIHRoZSBzdXJyb3VuZGluZyBcInJnYi9yZ2JhKClcIiBzdHJpbmcgdGhlbiByZXBsYWNlIGNvbW1hcyB3aXRoIHNwYWNlcyBhbmQgc3RyaXBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXBlYXRlZCBzcGFjZXMgKGluIGNhc2UgdGhlIHZhbHVlIGluY2x1ZGVkIHNwYWNlcyB0byBiZWdpbiB3aXRoKS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYWN0ZWQgPSAoY29udmVydGVkIHx8IHByb3BlcnR5VmFsdWUpLnRvU3RyaW5nKCkubWF0Y2goQ1NTLlJlZ0V4LnZhbHVlVW53cmFwKVsxXS5yZXBsYWNlKC8sKFxccyspPy9nLCBcIiBcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNvIGxvbmcgYXMgdGhpcyBpc24ndCA8PUlFOCwgYWRkIGEgZm91cnRoIChhbHBoYSkgY29tcG9uZW50IGlmIGl0J3MgbWlzc2luZyBhbmQgZGVmYXVsdCBpdCB0byAxICh2aXNpYmxlKS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKElFIDw9IDgpICYmIGV4dHJhY3RlZC5zcGxpdChcIiBcIikubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFjdGVkICs9IFwiIDFcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4dHJhY3RlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImluamVjdFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhpcyBpcyBJRTw9OCBhbmQgYW4gYWxwaGEgY29tcG9uZW50IGV4aXN0cywgc3RyaXAgaXQgb2ZmLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKElFIDw9IDgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHlWYWx1ZS5zcGxpdChcIiBcIikubGVuZ3RoID09PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBwcm9wZXJ0eVZhbHVlLnNwbGl0KC9cXHMrLykuc2xpY2UoMCwgMykuam9pbihcIiBcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogT3RoZXJ3aXNlLCBhZGQgYSBmb3VydGggKGFscGhhKSBjb21wb25lbnQgaWYgaXQncyBtaXNzaW5nIGFuZCBkZWZhdWx0IGl0IHRvIDEgKHZpc2libGUpLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eVZhbHVlLnNwbGl0KFwiIFwiKS5sZW5ndGggPT09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlICs9IFwiIDFcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogUmUtaW5zZXJ0IHRoZSBicm93c2VyLWFwcHJvcHJpYXRlIHdyYXBwZXIoXCJyZ2IvcmdiYSgpXCIpLCBpbnNlcnQgY29tbWFzLCBhbmQgc3RyaXAgb2ZmIGRlY2ltYWwgdW5pdHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uIGFsbCB2YWx1ZXMgYnV0IHRoZSBmb3VydGggKFIsIEcsIGFuZCBCIG9ubHkgYWNjZXB0IHdob2xlIG51bWJlcnMpLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChJRSA8PSA4ID8gXCJyZ2JcIiA6IFwicmdiYVwiKSArIFwiKFwiICsgcHJvcGVydHlWYWx1ZS5yZXBsYWNlKC9cXHMrL2csIFwiLFwiKS5yZXBsYWNlKC9cXC4oXFxkKSsoPz0sKS9nLCBcIlwiKSArIFwiKVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH0pKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgQ1NTIFByb3BlcnR5IE5hbWVzXG4gICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICBOYW1lczoge1xuICAgICAgICAgICAgLyogQ2FtZWxjYXNlIGEgcHJvcGVydHkgbmFtZSBpbnRvIGl0cyBKYXZhU2NyaXB0IG5vdGF0aW9uIChlLmcuIFwiYmFja2dyb3VuZC1jb2xvclwiID09PiBcImJhY2tncm91bmRDb2xvclwiKS5cbiAgICAgICAgICAgICAgIENhbWVsY2FzaW5nIGlzIHVzZWQgdG8gbm9ybWFsaXplIHByb3BlcnR5IG5hbWVzIGJldHdlZW4gYW5kIGFjcm9zcyBjYWxscy4gKi9cbiAgICAgICAgICAgIGNhbWVsQ2FzZTogZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5LnJlcGxhY2UoLy0oXFx3KS9nLCBmdW5jdGlvbiAobWF0Y2gsIHN1Yk1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdWJNYXRjaC50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyogRm9yIFNWRyBlbGVtZW50cywgc29tZSBwcm9wZXJ0aWVzIChuYW1lbHksIGRpbWVuc2lvbmFsIG9uZXMpIGFyZSBHRVQvU0VUIHZpYSB0aGUgZWxlbWVudCdzIEhUTUwgYXR0cmlidXRlcyAoaW5zdGVhZCBvZiB2aWEgQ1NTIHN0eWxlcykuICovXG4gICAgICAgICAgICBTVkdBdHRyaWJ1dGU6IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIHZhciBTVkdBdHRyaWJ1dGVzID0gXCJ3aWR0aHxoZWlnaHR8eHx5fGN4fGN5fHJ8cnh8cnl8eDF8eDJ8eTF8eTJcIjtcblxuICAgICAgICAgICAgICAgIC8qIENlcnRhaW4gYnJvd3NlcnMgcmVxdWlyZSBhbiBTVkcgdHJhbnNmb3JtIHRvIGJlIGFwcGxpZWQgYXMgYW4gYXR0cmlidXRlLiAoT3RoZXJ3aXNlLCBhcHBsaWNhdGlvbiB2aWEgQ1NTIGlzIHByZWZlcmFibGUgZHVlIHRvIDNEIHN1cHBvcnQuKSAqL1xuICAgICAgICAgICAgICAgIGlmIChJRSB8fCAoVmVsb2NpdHkuU3RhdGUuaXNBbmRyb2lkICYmICFWZWxvY2l0eS5TdGF0ZS5pc0Nocm9tZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgU1ZHQXR0cmlidXRlcyArPSBcInx0cmFuc2Zvcm1cIjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFJlZ0V4cChcIl4oXCIgKyBTVkdBdHRyaWJ1dGVzICsgXCIpJFwiLCBcImlcIikudGVzdChwcm9wZXJ0eSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKiBEZXRlcm1pbmUgd2hldGhlciBhIHByb3BlcnR5IHNob3VsZCBiZSBzZXQgd2l0aCBhIHZlbmRvciBwcmVmaXguICovXG4gICAgICAgICAgICAvKiBJZiBhIHByZWZpeGVkIHZlcnNpb24gb2YgdGhlIHByb3BlcnR5IGV4aXN0cywgcmV0dXJuIGl0LiBPdGhlcndpc2UsIHJldHVybiB0aGUgb3JpZ2luYWwgcHJvcGVydHkgbmFtZS5cbiAgICAgICAgICAgICAgIElmIHRoZSBwcm9wZXJ0eSBpcyBub3QgYXQgYWxsIHN1cHBvcnRlZCBieSB0aGUgYnJvd3NlciwgcmV0dXJuIGEgZmFsc2UgZmxhZy4gKi9cbiAgICAgICAgICAgIHByZWZpeENoZWNrOiBmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICAvKiBJZiB0aGlzIHByb3BlcnR5IGhhcyBhbHJlYWR5IGJlZW4gY2hlY2tlZCwgcmV0dXJuIHRoZSBjYWNoZWQgdmFsdWUuICovXG4gICAgICAgICAgICAgICAgaWYgKFZlbG9jaXR5LlN0YXRlLnByZWZpeE1hdGNoZXNbcHJvcGVydHldKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbIFZlbG9jaXR5LlN0YXRlLnByZWZpeE1hdGNoZXNbcHJvcGVydHldLCB0cnVlIF07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZlbmRvcnMgPSBbIFwiXCIsIFwiV2Via2l0XCIsIFwiTW96XCIsIFwibXNcIiwgXCJPXCIgXTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgdmVuZG9yc0xlbmd0aCA9IHZlbmRvcnMubGVuZ3RoOyBpIDwgdmVuZG9yc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHlQcmVmaXhlZDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVByZWZpeGVkID0gcHJvcGVydHk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENhcGl0YWxpemUgdGhlIGZpcnN0IGxldHRlciBvZiB0aGUgcHJvcGVydHkgdG8gY29uZm9ybSB0byBKYXZhU2NyaXB0IHZlbmRvciBwcmVmaXggbm90YXRpb24gKGUuZy4gd2Via2l0RmlsdGVyKS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVByZWZpeGVkID0gdmVuZG9yc1tpXSArIHByb3BlcnR5LnJlcGxhY2UoL15cXHcvLCBmdW5jdGlvbihtYXRjaCkgeyByZXR1cm4gbWF0Y2gudG9VcHBlckNhc2UoKTsgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIENoZWNrIGlmIHRoZSBicm93c2VyIHN1cHBvcnRzIHRoaXMgcHJvcGVydHkgYXMgcHJlZml4ZWQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoVHlwZS5pc1N0cmluZyhWZWxvY2l0eS5TdGF0ZS5wcmVmaXhFbGVtZW50LnN0eWxlW3Byb3BlcnR5UHJlZml4ZWRdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENhY2hlIHRoZSBtYXRjaC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5TdGF0ZS5wcmVmaXhNYXRjaGVzW3Byb3BlcnR5XSA9IHByb3BlcnR5UHJlZml4ZWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWyBwcm9wZXJ0eVByZWZpeGVkLCB0cnVlIF07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgYnJvd3NlciBkb2Vzbid0IHN1cHBvcnQgdGhpcyBwcm9wZXJ0eSBpbiBhbnkgZm9ybSwgaW5jbHVkZSBhIGZhbHNlIGZsYWcgc28gdGhhdCB0aGUgY2FsbGVyIGNhbiBkZWNpZGUgaG93IHRvIHByb2NlZWQuICovXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbIHByb3BlcnR5LCBmYWxzZSBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgIENTUyBQcm9wZXJ0eSBWYWx1ZXNcbiAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgIFZhbHVlczoge1xuICAgICAgICAgICAgLyogSGV4IHRvIFJHQiBjb252ZXJzaW9uLiBDb3B5cmlnaHQgVGltIERvd246IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNTYyMzgzOC9yZ2ItdG8taGV4LWFuZC1oZXgtdG8tcmdiICovXG4gICAgICAgICAgICBoZXhUb1JnYjogZnVuY3Rpb24gKGhleCkge1xuICAgICAgICAgICAgICAgIHZhciBzaG9ydGZvcm1SZWdleCA9IC9eIz8oW2EtZlxcZF0pKFthLWZcXGRdKShbYS1mXFxkXSkkL2ksXG4gICAgICAgICAgICAgICAgICAgIGxvbmdmb3JtUmVnZXggPSAvXiM/KFthLWZcXGRdezJ9KShbYS1mXFxkXXsyfSkoW2EtZlxcZF17Mn0pJC9pLFxuICAgICAgICAgICAgICAgICAgICByZ2JQYXJ0cztcblxuICAgICAgICAgICAgICAgIGhleCA9IGhleC5yZXBsYWNlKHNob3J0Zm9ybVJlZ2V4LCBmdW5jdGlvbiAobSwgciwgZywgYikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gciArIHIgKyBnICsgZyArIGIgKyBiO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmdiUGFydHMgPSBsb25nZm9ybVJlZ2V4LmV4ZWMoaGV4KTtcblxuICAgICAgICAgICAgICAgIHJldHVybiByZ2JQYXJ0cyA/IFsgcGFyc2VJbnQocmdiUGFydHNbMV0sIDE2KSwgcGFyc2VJbnQocmdiUGFydHNbMl0sIDE2KSwgcGFyc2VJbnQocmdiUGFydHNbM10sIDE2KSBdIDogWyAwLCAwLCAwIF07XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBpc0NTU051bGxWYWx1ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgLyogVGhlIGJyb3dzZXIgZGVmYXVsdHMgQ1NTIHZhbHVlcyB0aGF0IGhhdmUgbm90IGJlZW4gc2V0IHRvIGVpdGhlciAwIG9yIG9uZSBvZiBzZXZlcmFsIHBvc3NpYmxlIG51bGwtdmFsdWUgc3RyaW5ncy5cbiAgICAgICAgICAgICAgICAgICBUaHVzLCB3ZSBjaGVjayBmb3IgYm90aCBmYWxzaW5lc3MgYW5kIHRoZXNlIHNwZWNpYWwgc3RyaW5ncy4gKi9cbiAgICAgICAgICAgICAgICAvKiBOdWxsLXZhbHVlIGNoZWNraW5nIGlzIHBlcmZvcm1lZCB0byBkZWZhdWx0IHRoZSBzcGVjaWFsIHN0cmluZ3MgdG8gMCAoZm9yIHRoZSBzYWtlIG9mIHR3ZWVuaW5nKSBvciB0aGVpciBob29rXG4gICAgICAgICAgICAgICAgICAgdGVtcGxhdGVzIGFzIGRlZmluZWQgYXMgQ1NTLkhvb2tzIChmb3IgdGhlIHNha2Ugb2YgaG9vayBpbmplY3Rpb24vZXh0cmFjdGlvbikuICovXG4gICAgICAgICAgICAgICAgLyogTm90ZTogQ2hyb21lIHJldHVybnMgXCJyZ2JhKDAsIDAsIDAsIDApXCIgZm9yIGFuIHVuZGVmaW5lZCBjb2xvciB3aGVyZWFzIElFIHJldHVybnMgXCJ0cmFuc3BhcmVudFwiLiAqL1xuICAgICAgICAgICAgICAgIHJldHVybiAodmFsdWUgPT0gMCB8fCAvXihub25lfGF1dG98dHJhbnNwYXJlbnR8KHJnYmFcXCgwLCA/MCwgPzAsID8wXFwpKSkkL2kudGVzdCh2YWx1ZSkpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyogUmV0cmlldmUgYSBwcm9wZXJ0eSdzIGRlZmF1bHQgdW5pdCB0eXBlLiBVc2VkIGZvciBhc3NpZ25pbmcgYSB1bml0IHR5cGUgd2hlbiBvbmUgaXMgbm90IHN1cHBsaWVkIGJ5IHRoZSB1c2VyLiAqL1xuICAgICAgICAgICAgZ2V0VW5pdFR5cGU6IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIGlmICgvXihyb3RhdGV8c2tldykvaS50ZXN0KHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJkZWdcIjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC8oXihzY2FsZXxzY2FsZVh8c2NhbGVZfHNjYWxlWnxhbHBoYXxmbGV4R3Jvd3xmbGV4SGVpZ2h0fHpJbmRleHxmb250V2VpZ2h0KSQpfCgob3BhY2l0eXxyZWR8Z3JlZW58Ymx1ZXxhbHBoYSkkKS9pLnRlc3QocHJvcGVydHkpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIFRoZSBhYm92ZSBwcm9wZXJ0aWVzIGFyZSB1bml0bGVzcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLyogRGVmYXVsdCB0byBweCBmb3IgYWxsIG90aGVyIHByb3BlcnRpZXMuICovXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcInB4XCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyogSFRNTCBlbGVtZW50cyBkZWZhdWx0IHRvIGFuIGFzc29jaWF0ZWQgZGlzcGxheSB0eXBlIHdoZW4gdGhleSdyZSBub3Qgc2V0IHRvIGRpc3BsYXk6bm9uZS4gKi9cbiAgICAgICAgICAgIC8qIE5vdGU6IFRoaXMgZnVuY3Rpb24gaXMgdXNlZCBmb3IgY29ycmVjdGx5IHNldHRpbmcgdGhlIG5vbi1cIm5vbmVcIiBkaXNwbGF5IHZhbHVlIGluIGNlcnRhaW4gVmVsb2NpdHkgcmVkaXJlY3RzLCBzdWNoIGFzIGZhZGVJbi9PdXQuICovXG4gICAgICAgICAgICBnZXREaXNwbGF5VHlwZTogZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGFnTmFtZSA9IGVsZW1lbnQgJiYgZWxlbWVudC50YWdOYW1lLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgICAgIGlmICgvXihifGJpZ3xpfHNtYWxsfHR0fGFiYnJ8YWNyb255bXxjaXRlfGNvZGV8ZGZufGVtfGtiZHxzdHJvbmd8c2FtcHx2YXJ8YXxiZG98YnJ8aW1nfG1hcHxvYmplY3R8cXxzY3JpcHR8c3BhbnxzdWJ8c3VwfGJ1dHRvbnxpbnB1dHxsYWJlbHxzZWxlY3R8dGV4dGFyZWEpJC9pLnRlc3QodGFnTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiaW5saW5lXCI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvXihsaSkkL2kudGVzdCh0YWdOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJsaXN0LWl0ZW1cIjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9eKHRyKSQvaS50ZXN0KHRhZ05hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcInRhYmxlLXJvd1wiO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoL14odGFibGUpJC9pLnRlc3QodGFnTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwidGFibGVcIjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9eKHRib2R5KSQvaS50ZXN0KHRhZ05hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcInRhYmxlLXJvdy1ncm91cFwiO1xuICAgICAgICAgICAgICAgIC8qIERlZmF1bHQgdG8gXCJibG9ja1wiIHdoZW4gbm8gbWF0Y2ggaXMgZm91bmQuICovXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiYmxvY2tcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKiBUaGUgY2xhc3MgYWRkL3JlbW92ZSBmdW5jdGlvbnMgYXJlIHVzZWQgdG8gdGVtcG9yYXJpbHkgYXBwbHkgYSBcInZlbG9jaXR5LWFuaW1hdGluZ1wiIGNsYXNzIHRvIGVsZW1lbnRzIHdoaWxlIHRoZXkncmUgYW5pbWF0aW5nLiAqL1xuICAgICAgICAgICAgYWRkQ2xhc3M6IGZ1bmN0aW9uIChlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC5jbGFzc0xpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgKz0gKGVsZW1lbnQuY2xhc3NOYW1lLmxlbmd0aCA/IFwiIFwiIDogXCJcIikgKyBjbGFzc05hbWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uIChlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC5jbGFzc0xpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgPSBlbGVtZW50LmNsYXNzTmFtZS50b1N0cmluZygpLnJlcGxhY2UobmV3IFJlZ0V4cChcIihefFxcXFxzKVwiICsgY2xhc3NOYW1lLnNwbGl0KFwiIFwiKS5qb2luKFwifFwiKSArIFwiKFxcXFxzfCQpXCIsIFwiZ2lcIiksIFwiIFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgU3R5bGUgR2V0dGluZyAmIFNldHRpbmdcbiAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAvKiBUaGUgc2luZ3VsYXIgZ2V0UHJvcGVydHlWYWx1ZSwgd2hpY2ggcm91dGVzIHRoZSBsb2dpYyBmb3IgYWxsIG5vcm1hbGl6YXRpb25zLCBob29rcywgYW5kIHN0YW5kYXJkIENTUyBwcm9wZXJ0aWVzLiAqL1xuICAgICAgICBnZXRQcm9wZXJ0eVZhbHVlOiBmdW5jdGlvbiAoZWxlbWVudCwgcHJvcGVydHksIHJvb3RQcm9wZXJ0eVZhbHVlLCBmb3JjZVN0eWxlTG9va3VwKSB7XG4gICAgICAgICAgICAvKiBHZXQgYW4gZWxlbWVudCdzIGNvbXB1dGVkIHByb3BlcnR5IHZhbHVlLiAqL1xuICAgICAgICAgICAgLyogTm90ZTogUmV0cmlldmluZyB0aGUgdmFsdWUgb2YgYSBDU1MgcHJvcGVydHkgY2Fubm90IHNpbXBseSBiZSBwZXJmb3JtZWQgYnkgY2hlY2tpbmcgYW4gZWxlbWVudCdzXG4gICAgICAgICAgICAgICBzdHlsZSBhdHRyaWJ1dGUgKHdoaWNoIG9ubHkgcmVmbGVjdHMgdXNlci1kZWZpbmVkIHZhbHVlcykuIEluc3RlYWQsIHRoZSBicm93c2VyIG11c3QgYmUgcXVlcmllZCBmb3IgYSBwcm9wZXJ0eSdzXG4gICAgICAgICAgICAgICAqY29tcHV0ZWQqIHZhbHVlLiBZb3UgY2FuIHJlYWQgbW9yZSBhYm91dCBnZXRDb21wdXRlZFN0eWxlIGhlcmU6IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL2RvY3MvV2ViL0FQSS93aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSAqL1xuICAgICAgICAgICAgZnVuY3Rpb24gY29tcHV0ZVByb3BlcnR5VmFsdWUgKGVsZW1lbnQsIHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgLyogV2hlbiBib3gtc2l6aW5nIGlzbid0IHNldCB0byBib3JkZXItYm94LCBoZWlnaHQgYW5kIHdpZHRoIHN0eWxlIHZhbHVlcyBhcmUgaW5jb3JyZWN0bHkgY29tcHV0ZWQgd2hlbiBhblxuICAgICAgICAgICAgICAgICAgIGVsZW1lbnQncyBzY3JvbGxiYXJzIGFyZSB2aXNpYmxlICh3aGljaCBleHBhbmRzIHRoZSBlbGVtZW50J3MgZGltZW5zaW9ucykuIFRodXMsIHdlIGRlZmVyIHRvIHRoZSBtb3JlIGFjY3VyYXRlXG4gICAgICAgICAgICAgICAgICAgb2Zmc2V0SGVpZ2h0L1dpZHRoIHByb3BlcnR5LCB3aGljaCBpbmNsdWRlcyB0aGUgdG90YWwgZGltZW5zaW9ucyBmb3IgaW50ZXJpb3IsIGJvcmRlciwgcGFkZGluZywgYW5kIHNjcm9sbGJhci5cbiAgICAgICAgICAgICAgICAgICBXZSBzdWJ0cmFjdCBib3JkZXIgYW5kIHBhZGRpbmcgdG8gZ2V0IHRoZSBzdW0gb2YgaW50ZXJpb3IgKyBzY3JvbGxiYXIuICovXG4gICAgICAgICAgICAgICAgdmFyIGNvbXB1dGVkVmFsdWUgPSAwO1xuXG4gICAgICAgICAgICAgICAgLyogSUU8PTggZG9lc24ndCBzdXBwb3J0IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlLCB0aHVzIHdlIGRlZmVyIHRvIGpRdWVyeSwgd2hpY2ggaGFzIGFuIGV4dGVuc2l2ZSBhcnJheVxuICAgICAgICAgICAgICAgICAgIG9mIGhhY2tzIHRvIGFjY3VyYXRlbHkgcmV0cmlldmUgSUU4IHByb3BlcnR5IHZhbHVlcy4gUmUtaW1wbGVtZW50aW5nIHRoYXQgbG9naWMgaGVyZSBpcyBub3Qgd29ydGggYmxvYXRpbmcgdGhlXG4gICAgICAgICAgICAgICAgICAgY29kZWJhc2UgZm9yIGEgZHlpbmcgYnJvd3Nlci4gVGhlIHBlcmZvcm1hbmNlIHJlcGVyY3Vzc2lvbnMgb2YgdXNpbmcgalF1ZXJ5IGhlcmUgYXJlIG1pbmltYWwgc2luY2VcbiAgICAgICAgICAgICAgICAgICBWZWxvY2l0eSBpcyBvcHRpbWl6ZWQgdG8gcmFyZWx5IChhbmQgc29tZXRpbWVzIG5ldmVyKSBxdWVyeSB0aGUgRE9NLiBGdXJ0aGVyLCB0aGUgJC5jc3MoKSBjb2RlcGF0aCBpc24ndCB0aGF0IHNsb3cuICovXG4gICAgICAgICAgICAgICAgaWYgKElFIDw9IDgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRWYWx1ZSA9ICQuY3NzKGVsZW1lbnQsIHByb3BlcnR5KTsgLyogR0VUICovXG4gICAgICAgICAgICAgICAgLyogQWxsIG90aGVyIGJyb3dzZXJzIHN1cHBvcnQgZ2V0Q29tcHV0ZWRTdHlsZS4gVGhlIHJldHVybmVkIGxpdmUgb2JqZWN0IHJlZmVyZW5jZSBpcyBjYWNoZWQgb250byBpdHNcbiAgICAgICAgICAgICAgICAgICBhc3NvY2lhdGVkIGVsZW1lbnQgc28gdGhhdCBpdCBkb2VzIG5vdCBuZWVkIHRvIGJlIHJlZmV0Y2hlZCB1cG9uIGV2ZXJ5IEdFVC4gKi9cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvKiBCcm93c2VycyBkbyBub3QgcmV0dXJuIGhlaWdodCBhbmQgd2lkdGggdmFsdWVzIGZvciBlbGVtZW50cyB0aGF0IGFyZSBzZXQgdG8gZGlzcGxheTpcIm5vbmVcIi4gVGh1cywgd2UgdGVtcG9yYXJpbHlcbiAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlIGRpc3BsYXkgdG8gdGhlIGVsZW1lbnQgdHlwZSdzIGRlZmF1bHQgdmFsdWUuICovXG4gICAgICAgICAgICAgICAgICAgIHZhciB0b2dnbGVEaXNwbGF5ID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKC9eKHdpZHRofGhlaWdodCkkLy50ZXN0KHByb3BlcnR5KSAmJiBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImRpc3BsYXlcIikgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZURpc3BsYXkgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgQ1NTLnNldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJkaXNwbGF5XCIsIENTUy5WYWx1ZXMuZ2V0RGlzcGxheVR5cGUoZWxlbWVudCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gcmV2ZXJ0RGlzcGxheSAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodG9nZ2xlRGlzcGxheSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWZvcmNlU3R5bGVMb29rdXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eSA9PT0gXCJoZWlnaHRcIiAmJiBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImJveFNpemluZ1wiKS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgIT09IFwiYm9yZGVyLWJveFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRCb3hIZWlnaHQgPSBlbGVtZW50Lm9mZnNldEhlaWdodCAtIChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiYm9yZGVyVG9wV2lkdGhcIikpIHx8IDApIC0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJib3JkZXJCb3R0b21XaWR0aFwiKSkgfHwgMCkgLSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInBhZGRpbmdUb3BcIikpIHx8IDApIC0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJwYWRkaW5nQm90dG9tXCIpKSB8fCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXZlcnREaXNwbGF5KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudEJveEhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09IFwid2lkdGhcIiAmJiBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImJveFNpemluZ1wiKS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgIT09IFwiYm9yZGVyLWJveFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRCb3hXaWR0aCA9IGVsZW1lbnQub2Zmc2V0V2lkdGggLSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImJvcmRlckxlZnRXaWR0aFwiKSkgfHwgMCkgLSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImJvcmRlclJpZ2h0V2lkdGhcIikpIHx8IDApIC0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJwYWRkaW5nTGVmdFwiKSkgfHwgMCkgLSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInBhZGRpbmdSaWdodFwiKSkgfHwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV2ZXJ0RGlzcGxheSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnRCb3hXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb21wdXRlZFN0eWxlO1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIEZvciBlbGVtZW50cyB0aGF0IFZlbG9jaXR5IGhhc24ndCBiZWVuIGNhbGxlZCBvbiBkaXJlY3RseSAoZS5nLiB3aGVuIFZlbG9jaXR5IHF1ZXJpZXMgdGhlIERPTSBvbiBiZWhhbGZcbiAgICAgICAgICAgICAgICAgICAgICAgb2YgYSBwYXJlbnQgb2YgYW4gZWxlbWVudCBpdHMgYW5pbWF0aW5nKSwgcGVyZm9ybSBhIGRpcmVjdCBnZXRDb21wdXRlZFN0eWxlIGxvb2t1cCBzaW5jZSB0aGUgb2JqZWN0IGlzbid0IGNhY2hlZC4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQsIG51bGwpOyAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGNvbXB1dGVkU3R5bGUgb2JqZWN0IGhhcyB5ZXQgdG8gYmUgY2FjaGVkLCBkbyBzbyBub3cuICovXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIURhdGEoZWxlbWVudCkuY29tcHV0ZWRTdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRTdHlsZSA9IERhdGEoZWxlbWVudCkuY29tcHV0ZWRTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQsIG51bGwpOyAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgLyogSWYgY29tcHV0ZWRTdHlsZSBpcyBjYWNoZWQsIHVzZSBpdC4gKi9cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkU3R5bGUgPSBEYXRhKGVsZW1lbnQpLmNvbXB1dGVkU3R5bGU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBJRSBhbmQgRmlyZWZveCBkbyBub3QgcmV0dXJuIGEgdmFsdWUgZm9yIHRoZSBnZW5lcmljIGJvcmRlckNvbG9yIC0tIHRoZXkgb25seSByZXR1cm4gaW5kaXZpZHVhbCB2YWx1ZXMgZm9yIGVhY2ggYm9yZGVyIHNpZGUncyBjb2xvci5cbiAgICAgICAgICAgICAgICAgICAgICAgQWxzbywgaW4gYWxsIGJyb3dzZXJzLCB3aGVuIGJvcmRlciBjb2xvcnMgYXJlbid0IGFsbCB0aGUgc2FtZSwgYSBjb21wb3VuZCB2YWx1ZSBpcyByZXR1cm5lZCB0aGF0IFZlbG9jaXR5IGlzbid0IHNldHVwIHRvIHBhcnNlLlxuICAgICAgICAgICAgICAgICAgICAgICBTbywgYXMgYSBwb2x5ZmlsbCBmb3IgcXVlcnlpbmcgaW5kaXZpZHVhbCBib3JkZXIgc2lkZSBjb2xvcnMsIHdlIGp1c3QgcmV0dXJuIHRoZSB0b3AgYm9yZGVyJ3MgY29sb3IgYW5kIGFuaW1hdGUgYWxsIGJvcmRlcnMgZnJvbSB0aGF0IHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHkgPT09IFwiYm9yZGVyQ29sb3JcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHkgPSBcImJvcmRlclRvcENvbG9yXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBJRTkgaGFzIGEgYnVnIGluIHdoaWNoIHRoZSBcImZpbHRlclwiIHByb3BlcnR5IG11c3QgYmUgYWNjZXNzZWQgZnJvbSBjb21wdXRlZFN0eWxlIHVzaW5nIHRoZSBnZXRQcm9wZXJ0eVZhbHVlIG1ldGhvZFxuICAgICAgICAgICAgICAgICAgICAgICBpbnN0ZWFkIG9mIGEgZGlyZWN0IHByb3BlcnR5IGxvb2t1cC4gVGhlIGdldFByb3BlcnR5VmFsdWUgbWV0aG9kIGlzIHNsb3dlciB0aGFuIGEgZGlyZWN0IGxvb2t1cCwgd2hpY2ggaXMgd2h5IHdlIGF2b2lkIGl0IGJ5IGRlZmF1bHQuICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChJRSA9PT0gOSAmJiBwcm9wZXJ0eSA9PT0gXCJmaWx0ZXJcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRWYWx1ZSA9IGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZShwcm9wZXJ0eSk7IC8qIEdFVCAqL1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRWYWx1ZSA9IGNvbXB1dGVkU3R5bGVbcHJvcGVydHldO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLyogRmFsbCBiYWNrIHRvIHRoZSBwcm9wZXJ0eSdzIHN0eWxlIHZhbHVlIChpZiBkZWZpbmVkKSB3aGVuIGNvbXB1dGVkVmFsdWUgcmV0dXJucyBub3RoaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICB3aGljaCBjYW4gaGFwcGVuIHdoZW4gdGhlIGVsZW1lbnQgaGFzbid0IGJlZW4gcGFpbnRlZC4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXB1dGVkVmFsdWUgPT09IFwiXCIgfHwgY29tcHV0ZWRWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRWYWx1ZSA9IGVsZW1lbnQuc3R5bGVbcHJvcGVydHldO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV2ZXJ0RGlzcGxheSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qIEZvciB0b3AsIHJpZ2h0LCBib3R0b20sIGFuZCBsZWZ0IChUUkJMKSB2YWx1ZXMgdGhhdCBhcmUgc2V0IHRvIFwiYXV0b1wiIG9uIGVsZW1lbnRzIG9mIFwiZml4ZWRcIiBvciBcImFic29sdXRlXCIgcG9zaXRpb24sXG4gICAgICAgICAgICAgICAgICAgZGVmZXIgdG8galF1ZXJ5IGZvciBjb252ZXJ0aW5nIFwiYXV0b1wiIHRvIGEgbnVtZXJpYyB2YWx1ZS4gKEZvciBlbGVtZW50cyB3aXRoIGEgXCJzdGF0aWNcIiBvciBcInJlbGF0aXZlXCIgcG9zaXRpb24sIFwiYXV0b1wiIGhhcyB0aGUgc2FtZVxuICAgICAgICAgICAgICAgICAgIGVmZmVjdCBhcyBiZWluZyBzZXQgdG8gMCwgc28gbm8gY29udmVyc2lvbiBpcyBuZWNlc3NhcnkuKSAqL1xuICAgICAgICAgICAgICAgIC8qIEFuIGV4YW1wbGUgb2Ygd2h5IG51bWVyaWMgY29udmVyc2lvbiBpcyBuZWNlc3Nhcnk6IFdoZW4gYW4gZWxlbWVudCB3aXRoIFwicG9zaXRpb246YWJzb2x1dGVcIiBoYXMgYW4gdW50b3VjaGVkIFwibGVmdFwiXG4gICAgICAgICAgICAgICAgICAgcHJvcGVydHksIHdoaWNoIHJldmVydHMgdG8gXCJhdXRvXCIsIGxlZnQncyB2YWx1ZSBpcyAwIHJlbGF0aXZlIHRvIGl0cyBwYXJlbnQgZWxlbWVudCwgYnV0IGlzIG9mdGVuIG5vbi16ZXJvIHJlbGF0aXZlXG4gICAgICAgICAgICAgICAgICAgdG8gaXRzICpjb250YWluaW5nKiAobm90IHBhcmVudCkgZWxlbWVudCwgd2hpY2ggaXMgdGhlIG5lYXJlc3QgXCJwb3NpdGlvbjpyZWxhdGl2ZVwiIGFuY2VzdG9yIG9yIHRoZSB2aWV3cG9ydCAoYW5kIGFsd2F5cyB0aGUgdmlld3BvcnQgaW4gdGhlIGNhc2Ugb2YgXCJwb3NpdGlvbjpmaXhlZFwiKS4gKi9cbiAgICAgICAgICAgICAgICBpZiAoY29tcHV0ZWRWYWx1ZSA9PT0gXCJhdXRvXCIgJiYgL14odG9wfHJpZ2h0fGJvdHRvbXxsZWZ0KSQvaS50ZXN0KHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcG9zaXRpb24gPSBjb21wdXRlUHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInBvc2l0aW9uXCIpOyAvKiBHRVQgKi9cblxuICAgICAgICAgICAgICAgICAgICAvKiBGb3IgYWJzb2x1dGUgcG9zaXRpb25pbmcsIGpRdWVyeSdzICQucG9zaXRpb24oKSBvbmx5IHJldHVybnMgdmFsdWVzIGZvciB0b3AgYW5kIGxlZnQ7XG4gICAgICAgICAgICAgICAgICAgICAgIHJpZ2h0IGFuZCBib3R0b20gd2lsbCBoYXZlIHRoZWlyIFwiYXV0b1wiIHZhbHVlIHJldmVydGVkIHRvIDAuICovXG4gICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IEEgalF1ZXJ5IG9iamVjdCBtdXN0IGJlIGNyZWF0ZWQgaGVyZSBzaW5jZSBqUXVlcnkgZG9lc24ndCBoYXZlIGEgbG93LWxldmVsIGFsaWFzIGZvciAkLnBvc2l0aW9uKCkuXG4gICAgICAgICAgICAgICAgICAgICAgIE5vdCBhIGJpZyBkZWFsIHNpbmNlIHdlJ3JlIGN1cnJlbnRseSBpbiBhIEdFVCBiYXRjaCBhbnl3YXkuICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA9PT0gXCJmaXhlZFwiIHx8IChwb3NpdGlvbiA9PT0gXCJhYnNvbHV0ZVwiICYmIC90b3B8bGVmdC9pLnRlc3QocHJvcGVydHkpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogalF1ZXJ5IHN0cmlwcyB0aGUgcGl4ZWwgdW5pdCBmcm9tIGl0cyByZXR1cm5lZCB2YWx1ZXM7IHdlIHJlLWFkZCBpdCBoZXJlIHRvIGNvbmZvcm0gd2l0aCBjb21wdXRlUHJvcGVydHlWYWx1ZSdzIGJlaGF2aW9yLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRWYWx1ZSA9ICQoZWxlbWVudCkucG9zaXRpb24oKVtwcm9wZXJ0eV0gKyBcInB4XCI7IC8qIEdFVCAqL1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbXB1dGVkVmFsdWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBwcm9wZXJ0eVZhbHVlO1xuXG4gICAgICAgICAgICAvKiBJZiB0aGlzIGlzIGEgaG9va2VkIHByb3BlcnR5IChlLmcuIFwiY2xpcExlZnRcIiBpbnN0ZWFkIG9mIHRoZSByb290IHByb3BlcnR5IG9mIFwiY2xpcFwiKSxcbiAgICAgICAgICAgICAgIGV4dHJhY3QgdGhlIGhvb2sncyB2YWx1ZSBmcm9tIGEgbm9ybWFsaXplZCByb290UHJvcGVydHlWYWx1ZSB1c2luZyBDU1MuSG9va3MuZXh0cmFjdFZhbHVlKCkuICovXG4gICAgICAgICAgICBpZiAoQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbcHJvcGVydHldKSB7XG4gICAgICAgICAgICAgICAgdmFyIGhvb2sgPSBwcm9wZXJ0eSxcbiAgICAgICAgICAgICAgICAgICAgaG9va1Jvb3QgPSBDU1MuSG9va3MuZ2V0Um9vdChob29rKTtcblxuICAgICAgICAgICAgICAgIC8qIElmIGEgY2FjaGVkIHJvb3RQcm9wZXJ0eVZhbHVlIHdhc24ndCBwYXNzZWQgaW4gKHdoaWNoIFZlbG9jaXR5IGFsd2F5cyBhdHRlbXB0cyB0byBkbyBpbiBvcmRlciB0byBhdm9pZCByZXF1ZXJ5aW5nIHRoZSBET00pLFxuICAgICAgICAgICAgICAgICAgIHF1ZXJ5IHRoZSBET00gZm9yIHRoZSByb290IHByb3BlcnR5J3MgdmFsdWUuICovXG4gICAgICAgICAgICAgICAgaWYgKHJvb3RQcm9wZXJ0eVZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogU2luY2UgdGhlIGJyb3dzZXIgaXMgbm93IGJlaW5nIGRpcmVjdGx5IHF1ZXJpZWQsIHVzZSB0aGUgb2ZmaWNpYWwgcG9zdC1wcmVmaXhpbmcgcHJvcGVydHkgbmFtZSBmb3IgdGhpcyBsb29rdXAuICovXG4gICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgQ1NTLk5hbWVzLnByZWZpeENoZWNrKGhvb2tSb290KVswXSk7IC8qIEdFVCAqL1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qIElmIHRoaXMgcm9vdCBoYXMgYSBub3JtYWxpemF0aW9uIHJlZ2lzdGVyZWQsIHBlZm9ybSB0aGUgYXNzb2NpYXRlZCBub3JtYWxpemF0aW9uIGV4dHJhY3Rpb24uICovXG4gICAgICAgICAgICAgICAgaWYgKENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW2hvb2tSb290XSkge1xuICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSA9IENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW2hvb2tSb290XShcImV4dHJhY3RcIiwgZWxlbWVudCwgcm9vdFByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qIEV4dHJhY3QgdGhlIGhvb2sncyB2YWx1ZS4gKi9cbiAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gQ1NTLkhvb2tzLmV4dHJhY3RWYWx1ZShob29rLCByb290UHJvcGVydHlWYWx1ZSk7XG5cbiAgICAgICAgICAgIC8qIElmIHRoaXMgaXMgYSBub3JtYWxpemVkIHByb3BlcnR5IChlLmcuIFwib3BhY2l0eVwiIGJlY29tZXMgXCJmaWx0ZXJcIiBpbiA8PUlFOCkgb3IgXCJ0cmFuc2xhdGVYXCIgYmVjb21lcyBcInRyYW5zZm9ybVwiKSxcbiAgICAgICAgICAgICAgIG5vcm1hbGl6ZSB0aGUgcHJvcGVydHkncyBuYW1lIGFuZCB2YWx1ZSwgYW5kIGhhbmRsZSB0aGUgc3BlY2lhbCBjYXNlIG9mIHRyYW5zZm9ybXMuICovXG4gICAgICAgICAgICAvKiBOb3RlOiBOb3JtYWxpemluZyBhIHByb3BlcnR5IGlzIG11dHVhbGx5IGV4Y2x1c2l2ZSBmcm9tIGhvb2tpbmcgYSBwcm9wZXJ0eSBzaW5jZSBob29rLWV4dHJhY3RlZCB2YWx1ZXMgYXJlIHN0cmljdGx5XG4gICAgICAgICAgICAgICBudW1lcmljYWwgYW5kIHRoZXJlZm9yZSBkbyBub3QgcmVxdWlyZSBub3JtYWxpemF0aW9uIGV4dHJhY3Rpb24uICovXG4gICAgICAgICAgICB9IGVsc2UgaWYgKENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XSkge1xuICAgICAgICAgICAgICAgIHZhciBub3JtYWxpemVkUHJvcGVydHlOYW1lLFxuICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVkUHJvcGVydHlWYWx1ZTtcblxuICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRQcm9wZXJ0eU5hbWUgPSBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0oXCJuYW1lXCIsIGVsZW1lbnQpO1xuXG4gICAgICAgICAgICAgICAgLyogVHJhbnNmb3JtIHZhbHVlcyBhcmUgY2FsY3VsYXRlZCB2aWEgbm9ybWFsaXphdGlvbiBleHRyYWN0aW9uIChzZWUgYmVsb3cpLCB3aGljaCBjaGVja3MgYWdhaW5zdCB0aGUgZWxlbWVudCdzIHRyYW5zZm9ybUNhY2hlLlxuICAgICAgICAgICAgICAgICAgIEF0IG5vIHBvaW50IGRvIHRyYW5zZm9ybSBHRVRzIGV2ZXIgYWN0dWFsbHkgcXVlcnkgdGhlIERPTTsgaW5pdGlhbCBzdHlsZXNoZWV0IHZhbHVlcyBhcmUgbmV2ZXIgcHJvY2Vzc2VkLlxuICAgICAgICAgICAgICAgICAgIFRoaXMgaXMgYmVjYXVzZSBwYXJzaW5nIDNEIHRyYW5zZm9ybSBtYXRyaWNlcyBpcyBub3QgYWx3YXlzIGFjY3VyYXRlIGFuZCB3b3VsZCBibG9hdCBvdXIgY29kZWJhc2U7XG4gICAgICAgICAgICAgICAgICAgdGh1cywgbm9ybWFsaXphdGlvbiBleHRyYWN0aW9uIGRlZmF1bHRzIGluaXRpYWwgdHJhbnNmb3JtIHZhbHVlcyB0byB0aGVpciB6ZXJvLXZhbHVlcyAoZS5nLiAxIGZvciBzY2FsZVggYW5kIDAgZm9yIHRyYW5zbGF0ZVgpLiAqL1xuICAgICAgICAgICAgICAgIGlmIChub3JtYWxpemVkUHJvcGVydHlOYW1lICE9PSBcInRyYW5zZm9ybVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRQcm9wZXJ0eVZhbHVlID0gY29tcHV0ZVByb3BlcnR5VmFsdWUoZWxlbWVudCwgQ1NTLk5hbWVzLnByZWZpeENoZWNrKG5vcm1hbGl6ZWRQcm9wZXJ0eU5hbWUpWzBdKTsgLyogR0VUICovXG5cbiAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIHZhbHVlIGlzIGEgQ1NTIG51bGwtdmFsdWUgYW5kIHRoaXMgcHJvcGVydHkgaGFzIGEgaG9vayB0ZW1wbGF0ZSwgdXNlIHRoYXQgemVyby12YWx1ZSB0ZW1wbGF0ZSBzbyB0aGF0IGhvb2tzIGNhbiBiZSBleHRyYWN0ZWQgZnJvbSBpdC4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKENTUy5WYWx1ZXMuaXNDU1NOdWxsVmFsdWUobm9ybWFsaXplZFByb3BlcnR5VmFsdWUpICYmIENTUy5Ib29rcy50ZW1wbGF0ZXNbcHJvcGVydHldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVkUHJvcGVydHlWYWx1ZSA9IENTUy5Ib29rcy50ZW1wbGF0ZXNbcHJvcGVydHldWzFdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XShcImV4dHJhY3RcIiwgZWxlbWVudCwgbm9ybWFsaXplZFByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiBJZiBhIChudW1lcmljKSB2YWx1ZSB3YXNuJ3QgcHJvZHVjZWQgdmlhIGhvb2sgZXh0cmFjdGlvbiBvciBub3JtYWxpemF0aW9uLCBxdWVyeSB0aGUgRE9NLiAqL1xuICAgICAgICAgICAgaWYgKCEvXltcXGQtXS8udGVzdChwcm9wZXJ0eVZhbHVlKSkge1xuICAgICAgICAgICAgICAgIC8qIEZvciBTVkcgZWxlbWVudHMsIGRpbWVuc2lvbmFsIHByb3BlcnRpZXMgKHdoaWNoIFNWR0F0dHJpYnV0ZSgpIGRldGVjdHMpIGFyZSB0d2VlbmVkIHZpYVxuICAgICAgICAgICAgICAgICAgIHRoZWlyIEhUTUwgYXR0cmlidXRlIHZhbHVlcyBpbnN0ZWFkIG9mIHRoZWlyIENTUyBzdHlsZSB2YWx1ZXMuICovXG4gICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkgJiYgRGF0YShlbGVtZW50KS5pc1NWRyAmJiBDU1MuTmFtZXMuU1ZHQXR0cmlidXRlKHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSB0aGUgaGVpZ2h0L3dpZHRoIGF0dHJpYnV0ZSB2YWx1ZXMgbXVzdCBiZSBzZXQgbWFudWFsbHksIHRoZXkgZG9uJ3QgcmVmbGVjdCBjb21wdXRlZCB2YWx1ZXMuXG4gICAgICAgICAgICAgICAgICAgICAgIFRodXMsIHdlIHVzZSB1c2UgZ2V0QkJveCgpIHRvIGVuc3VyZSB3ZSBhbHdheXMgZ2V0IHZhbHVlcyBmb3IgZWxlbWVudHMgd2l0aCB1bmRlZmluZWQgaGVpZ2h0L3dpZHRoIGF0dHJpYnV0ZXMuICovXG4gICAgICAgICAgICAgICAgICAgIGlmICgvXihoZWlnaHR8d2lkdGgpJC9pLnRlc3QocHJvcGVydHkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBGaXJlZm94IHRocm93cyBhbiBlcnJvciBpZiAuZ2V0QkJveCgpIGlzIGNhbGxlZCBvbiBhbiBTVkcgdGhhdCBpc24ndCBhdHRhY2hlZCB0byB0aGUgRE9NLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gZWxlbWVudC5nZXRCQm94KClbcHJvcGVydHldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLyogT3RoZXJ3aXNlLCBhY2Nlc3MgdGhlIGF0dHJpYnV0ZSB2YWx1ZSBkaXJlY3RseS4gKi9cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShwcm9wZXJ0eSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gY29tcHV0ZVByb3BlcnR5VmFsdWUoZWxlbWVudCwgQ1NTLk5hbWVzLnByZWZpeENoZWNrKHByb3BlcnR5KVswXSk7IC8qIEdFVCAqL1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyogU2luY2UgcHJvcGVydHkgbG9va3VwcyBhcmUgZm9yIGFuaW1hdGlvbiBwdXJwb3NlcyAod2hpY2ggZW50YWlscyBjb21wdXRpbmcgdGhlIG51bWVyaWMgZGVsdGEgYmV0d2VlbiBzdGFydCBhbmQgZW5kIHZhbHVlcyksXG4gICAgICAgICAgICAgICBjb252ZXJ0IENTUyBudWxsLXZhbHVlcyB0byBhbiBpbnRlZ2VyIG9mIHZhbHVlIDAuICovXG4gICAgICAgICAgICBpZiAoQ1NTLlZhbHVlcy5pc0NTU051bGxWYWx1ZShwcm9wZXJ0eVZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoVmVsb2NpdHkuZGVidWcgPj0gMikgY29uc29sZS5sb2coXCJHZXQgXCIgKyBwcm9wZXJ0eSArIFwiOiBcIiArIHByb3BlcnR5VmFsdWUpO1xuXG4gICAgICAgICAgICByZXR1cm4gcHJvcGVydHlWYWx1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKiBUaGUgc2luZ3VsYXIgc2V0UHJvcGVydHlWYWx1ZSwgd2hpY2ggcm91dGVzIHRoZSBsb2dpYyBmb3IgYWxsIG5vcm1hbGl6YXRpb25zLCBob29rcywgYW5kIHN0YW5kYXJkIENTUyBwcm9wZXJ0aWVzLiAqL1xuICAgICAgICBzZXRQcm9wZXJ0eVZhbHVlOiBmdW5jdGlvbihlbGVtZW50LCBwcm9wZXJ0eSwgcHJvcGVydHlWYWx1ZSwgcm9vdFByb3BlcnR5VmFsdWUsIHNjcm9sbERhdGEpIHtcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0eU5hbWUgPSBwcm9wZXJ0eTtcblxuICAgICAgICAgICAgLyogSW4gb3JkZXIgdG8gYmUgc3ViamVjdGVkIHRvIGNhbGwgb3B0aW9ucyBhbmQgZWxlbWVudCBxdWV1ZWluZywgc2Nyb2xsIGFuaW1hdGlvbiBpcyByb3V0ZWQgdGhyb3VnaCBWZWxvY2l0eSBhcyBpZiBpdCB3ZXJlIGEgc3RhbmRhcmQgQ1NTIHByb3BlcnR5LiAqL1xuICAgICAgICAgICAgaWYgKHByb3BlcnR5ID09PSBcInNjcm9sbFwiKSB7XG4gICAgICAgICAgICAgICAgLyogSWYgYSBjb250YWluZXIgb3B0aW9uIGlzIHByZXNlbnQsIHNjcm9sbCB0aGUgY29udGFpbmVyIGluc3RlYWQgb2YgdGhlIGJyb3dzZXIgd2luZG93LiAqL1xuICAgICAgICAgICAgICAgIGlmIChzY3JvbGxEYXRhLmNvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgICAgICBzY3JvbGxEYXRhLmNvbnRhaW5lcltcInNjcm9sbFwiICsgc2Nyb2xsRGF0YS5kaXJlY3Rpb25dID0gcHJvcGVydHlWYWx1ZTtcbiAgICAgICAgICAgICAgICAvKiBPdGhlcndpc2UsIFZlbG9jaXR5IGRlZmF1bHRzIHRvIHNjcm9sbGluZyB0aGUgYnJvd3NlciB3aW5kb3cuICovXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjcm9sbERhdGEuZGlyZWN0aW9uID09PSBcIkxlZnRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnNjcm9sbFRvKHByb3BlcnR5VmFsdWUsIHNjcm9sbERhdGEuYWx0ZXJuYXRlVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnNjcm9sbFRvKHNjcm9sbERhdGEuYWx0ZXJuYXRlVmFsdWUsIHByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvKiBUcmFuc2Zvcm1zICh0cmFuc2xhdGVYLCByb3RhdGVaLCBldGMuKSBhcmUgYXBwbGllZCB0byBhIHBlci1lbGVtZW50IHRyYW5zZm9ybUNhY2hlIG9iamVjdCwgd2hpY2ggaXMgbWFudWFsbHkgZmx1c2hlZCB2aWEgZmx1c2hUcmFuc2Zvcm1DYWNoZSgpLlxuICAgICAgICAgICAgICAgICAgIFRodXMsIGZvciBub3csIHdlIG1lcmVseSBjYWNoZSB0cmFuc2Zvcm1zIGJlaW5nIFNFVC4gKi9cbiAgICAgICAgICAgICAgICBpZiAoQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbcHJvcGVydHldICYmIENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XShcIm5hbWVcIiwgZWxlbWVudCkgPT09IFwidHJhbnNmb3JtXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogUGVyZm9ybSBhIG5vcm1hbGl6YXRpb24gaW5qZWN0aW9uLiAqL1xuICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBUaGUgbm9ybWFsaXphdGlvbiBsb2dpYyBoYW5kbGVzIHRoZSB0cmFuc2Zvcm1DYWNoZSB1cGRhdGluZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbcHJvcGVydHldKFwiaW5qZWN0XCIsIGVsZW1lbnQsIHByb3BlcnR5VmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IFwidHJhbnNmb3JtXCI7XG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3Byb3BlcnR5XTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvKiBJbmplY3QgaG9va3MuICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChDU1MuSG9va3MucmVnaXN0ZXJlZFtwcm9wZXJ0eV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBob29rTmFtZSA9IHByb3BlcnR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvb2tSb290ID0gQ1NTLkhvb2tzLmdldFJvb3QocHJvcGVydHkpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBhIGNhY2hlZCByb290UHJvcGVydHlWYWx1ZSB3YXMgbm90IHByb3ZpZGVkLCBxdWVyeSB0aGUgRE9NIGZvciB0aGUgaG9va1Jvb3QncyBjdXJyZW50IHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSByb290UHJvcGVydHlWYWx1ZSB8fCBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBob29rUm9vdCk7IC8qIEdFVCAqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gQ1NTLkhvb2tzLmluamVjdFZhbHVlKGhvb2tOYW1lLCBwcm9wZXJ0eVZhbHVlLCByb290UHJvcGVydHlWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eSA9IGhvb2tSb290O1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLyogTm9ybWFsaXplIG5hbWVzIGFuZCB2YWx1ZXMuICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0oXCJpbmplY3RcIiwgZWxlbWVudCwgcHJvcGVydHlWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eSA9IENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XShcIm5hbWVcIiwgZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBBc3NpZ24gdGhlIGFwcHJvcHJpYXRlIHZlbmRvciBwcmVmaXggYmVmb3JlIHBlcmZvcm1pbmcgYW4gb2ZmaWNpYWwgc3R5bGUgdXBkYXRlLiAqL1xuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBDU1MuTmFtZXMucHJlZml4Q2hlY2socHJvcGVydHkpWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIEEgdHJ5L2NhdGNoIGlzIHVzZWQgZm9yIElFPD04LCB3aGljaCB0aHJvd3MgYW4gZXJyb3Igd2hlbiBcImludmFsaWRcIiBDU1MgdmFsdWVzIGFyZSBzZXQsIGUuZy4gYSBuZWdhdGl2ZSB3aWR0aC5cbiAgICAgICAgICAgICAgICAgICAgICAgVHJ5L2NhdGNoIGlzIGF2b2lkZWQgZm9yIG90aGVyIGJyb3dzZXJzIHNpbmNlIGl0IGluY3VycyBhIHBlcmZvcm1hbmNlIG92ZXJoZWFkLiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAoSUUgPD0gOCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlW3Byb3BlcnR5TmFtZV0gPSBwcm9wZXJ0eVZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHsgaWYgKFZlbG9jaXR5LmRlYnVnKSBjb25zb2xlLmxvZyhcIkJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBbXCIgKyBwcm9wZXJ0eVZhbHVlICsgXCJdIGZvciBbXCIgKyBwcm9wZXJ0eU5hbWUgKyBcIl1cIik7IH1cbiAgICAgICAgICAgICAgICAgICAgLyogU1ZHIGVsZW1lbnRzIGhhdmUgdGhlaXIgZGltZW5zaW9uYWwgcHJvcGVydGllcyAod2lkdGgsIGhlaWdodCwgeCwgeSwgY3gsIGV0Yy4pIGFwcGxpZWQgZGlyZWN0bHkgYXMgYXR0cmlidXRlcyBpbnN0ZWFkIG9mIGFzIHN0eWxlcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogSUU4IGRvZXMgbm90IHN1cHBvcnQgU1ZHIGVsZW1lbnRzLCBzbyBpdCdzIG9rYXkgdGhhdCB3ZSBza2lwIGl0IGZvciBTVkcgYW5pbWF0aW9uLiAqL1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKERhdGEoZWxlbWVudCkgJiYgRGF0YShlbGVtZW50KS5pc1NWRyAmJiBDU1MuTmFtZXMuU1ZHQXR0cmlidXRlKHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogRm9yIFNWRyBhdHRyaWJ1dGVzLCB2ZW5kb3ItcHJlZml4ZWQgcHJvcGVydHkgbmFtZXMgYXJlIG5ldmVyIHVzZWQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBOb3QgYWxsIENTUyBwcm9wZXJ0aWVzIGNhbiBiZSBhbmltYXRlZCB2aWEgYXR0cmlidXRlcywgYnV0IHRoZSBicm93c2VyIHdvbid0IHRocm93IGFuIGVycm9yIGZvciB1bnN1cHBvcnRlZCBwcm9wZXJ0aWVzLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUocHJvcGVydHksIHByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5zdHlsZVtwcm9wZXJ0eU5hbWVdID0gcHJvcGVydHlWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChWZWxvY2l0eS5kZWJ1ZyA+PSAyKSBjb25zb2xlLmxvZyhcIlNldCBcIiArIHByb3BlcnR5ICsgXCIgKFwiICsgcHJvcGVydHlOYW1lICsgXCIpOiBcIiArIHByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyogUmV0dXJuIHRoZSBub3JtYWxpemVkIHByb3BlcnR5IG5hbWUgYW5kIHZhbHVlIGluIGNhc2UgdGhlIGNhbGxlciB3YW50cyB0byBrbm93IGhvdyB0aGVzZSB2YWx1ZXMgd2VyZSBtb2RpZmllZCBiZWZvcmUgYmVpbmcgYXBwbGllZCB0byB0aGUgRE9NLiAqL1xuICAgICAgICAgICAgcmV0dXJuIFsgcHJvcGVydHlOYW1lLCBwcm9wZXJ0eVZhbHVlIF07XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyogVG8gaW5jcmVhc2UgcGVyZm9ybWFuY2UgYnkgYmF0Y2hpbmcgdHJhbnNmb3JtIHVwZGF0ZXMgaW50byBhIHNpbmdsZSBTRVQsIHRyYW5zZm9ybXMgYXJlIG5vdCBkaXJlY3RseSBhcHBsaWVkIHRvIGFuIGVsZW1lbnQgdW50aWwgZmx1c2hUcmFuc2Zvcm1DYWNoZSgpIGlzIGNhbGxlZC4gKi9cbiAgICAgICAgLyogTm90ZTogVmVsb2NpdHkgYXBwbGllcyB0cmFuc2Zvcm0gcHJvcGVydGllcyBpbiB0aGUgc2FtZSBvcmRlciB0aGF0IHRoZXkgYXJlIGNocm9ub2dpY2FsbHkgaW50cm9kdWNlZCB0byB0aGUgZWxlbWVudCdzIENTUyBzdHlsZXMuICovXG4gICAgICAgIGZsdXNoVHJhbnNmb3JtQ2FjaGU6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciB0cmFuc2Zvcm1TdHJpbmcgPSBcIlwiO1xuXG4gICAgICAgICAgICAvKiBDZXJ0YWluIGJyb3dzZXJzIHJlcXVpcmUgdGhhdCBTVkcgdHJhbnNmb3JtcyBiZSBhcHBsaWVkIGFzIGFuIGF0dHJpYnV0ZS4gSG93ZXZlciwgdGhlIFNWRyB0cmFuc2Zvcm0gYXR0cmlidXRlIHRha2VzIGEgbW9kaWZpZWQgdmVyc2lvbiBvZiBDU1MncyB0cmFuc2Zvcm0gc3RyaW5nXG4gICAgICAgICAgICAgICAodW5pdHMgYXJlIGRyb3BwZWQgYW5kLCBleGNlcHQgZm9yIHNrZXdYL1ksIHN1YnByb3BlcnRpZXMgYXJlIG1lcmdlZCBpbnRvIHRoZWlyIG1hc3RlciBwcm9wZXJ0eSAtLSBlLmcuIHNjYWxlWCBhbmQgc2NhbGVZIGFyZSBtZXJnZWQgaW50byBzY2FsZShYIFkpLiAqL1xuICAgICAgICAgICAgaWYgKChJRSB8fCAoVmVsb2NpdHkuU3RhdGUuaXNBbmRyb2lkICYmICFWZWxvY2l0eS5TdGF0ZS5pc0Nocm9tZSkpICYmIERhdGEoZWxlbWVudCkuaXNTVkcpIHtcbiAgICAgICAgICAgICAgICAvKiBTaW5jZSB0cmFuc2Zvcm0gdmFsdWVzIGFyZSBzdG9yZWQgaW4gdGhlaXIgcGFyZW50aGVzZXMtd3JhcHBlZCBmb3JtLCB3ZSB1c2UgYSBoZWxwZXIgZnVuY3Rpb24gdG8gc3RyaXAgb3V0IHRoZWlyIG51bWVyaWMgdmFsdWVzLlxuICAgICAgICAgICAgICAgICAgIEZ1cnRoZXIsIFNWRyB0cmFuc2Zvcm0gcHJvcGVydGllcyBvbmx5IHRha2UgdW5pdGxlc3MgKHJlcHJlc2VudGluZyBwaXhlbHMpIHZhbHVlcywgc28gaXQncyBva2F5IHRoYXQgcGFyc2VGbG9hdCgpIHN0cmlwcyB0aGUgdW5pdCBzdWZmaXhlZCB0byB0aGUgZmxvYXQgdmFsdWUuICovXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZ2V0VHJhbnNmb3JtRmxvYXQgKHRyYW5zZm9ybVByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIHRyYW5zZm9ybVByb3BlcnR5KSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyogQ3JlYXRlIGFuIG9iamVjdCB0byBvcmdhbml6ZSBhbGwgdGhlIHRyYW5zZm9ybXMgdGhhdCB3ZSdsbCBhcHBseSB0byB0aGUgU1ZHIGVsZW1lbnQuIFRvIGtlZXAgdGhlIGxvZ2ljIHNpbXBsZSxcbiAgICAgICAgICAgICAgICAgICB3ZSBwcm9jZXNzICphbGwqIHRyYW5zZm9ybSBwcm9wZXJ0aWVzIC0tIGV2ZW4gdGhvc2UgdGhhdCBtYXkgbm90IGJlIGV4cGxpY2l0bHkgYXBwbGllZCAoc2luY2UgdGhleSBkZWZhdWx0IHRvIHRoZWlyIHplcm8tdmFsdWVzIGFueXdheSkuICovXG4gICAgICAgICAgICAgICAgdmFyIFNWR1RyYW5zZm9ybXMgPSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zbGF0ZTogWyBnZXRUcmFuc2Zvcm1GbG9hdChcInRyYW5zbGF0ZVhcIiksIGdldFRyYW5zZm9ybUZsb2F0KFwidHJhbnNsYXRlWVwiKSBdLFxuICAgICAgICAgICAgICAgICAgICBza2V3WDogWyBnZXRUcmFuc2Zvcm1GbG9hdChcInNrZXdYXCIpIF0sIHNrZXdZOiBbIGdldFRyYW5zZm9ybUZsb2F0KFwic2tld1lcIikgXSxcbiAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIHNjYWxlIHByb3BlcnR5IGlzIHNldCAobm9uLTEpLCB1c2UgdGhhdCB2YWx1ZSBmb3IgdGhlIHNjYWxlWCBhbmQgc2NhbGVZIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICAgICAodGhpcyBiZWhhdmlvciBtaW1pY3MgdGhlIHJlc3VsdCBvZiBhbmltYXRpbmcgYWxsIHRoZXNlIHByb3BlcnRpZXMgYXQgb25jZSBvbiBIVE1MIGVsZW1lbnRzKS4gKi9cbiAgICAgICAgICAgICAgICAgICAgc2NhbGU6IGdldFRyYW5zZm9ybUZsb2F0KFwic2NhbGVcIikgIT09IDEgPyBbIGdldFRyYW5zZm9ybUZsb2F0KFwic2NhbGVcIiksIGdldFRyYW5zZm9ybUZsb2F0KFwic2NhbGVcIikgXSA6IFsgZ2V0VHJhbnNmb3JtRmxvYXQoXCJzY2FsZVhcIiksIGdldFRyYW5zZm9ybUZsb2F0KFwic2NhbGVZXCIpIF0sXG4gICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFNWRydzIHJvdGF0ZSB0cmFuc2Zvcm0gdGFrZXMgdGhyZWUgdmFsdWVzOiByb3RhdGlvbiBkZWdyZWVzIGZvbGxvd2VkIGJ5IHRoZSBYIGFuZCBZIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICAgICBkZWZpbmluZyB0aGUgcm90YXRpb24ncyBvcmlnaW4gcG9pbnQuIFdlIGlnbm9yZSB0aGUgb3JpZ2luIHZhbHVlcyAoZGVmYXVsdCB0aGVtIHRvIDApLiAqL1xuICAgICAgICAgICAgICAgICAgICByb3RhdGU6IFsgZ2V0VHJhbnNmb3JtRmxvYXQoXCJyb3RhdGVaXCIpLCAwLCAwIF1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLyogSXRlcmF0ZSB0aHJvdWdoIHRoZSB0cmFuc2Zvcm0gcHJvcGVydGllcyBpbiB0aGUgdXNlci1kZWZpbmVkIHByb3BlcnR5IG1hcCBvcmRlci5cbiAgICAgICAgICAgICAgICAgICAoVGhpcyBtaW1pY3MgdGhlIGJlaGF2aW9yIG9mIG5vbi1TVkcgdHJhbnNmb3JtIGFuaW1hdGlvbi4pICovXG4gICAgICAgICAgICAgICAgJC5lYWNoKERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGUsIGZ1bmN0aW9uKHRyYW5zZm9ybU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogRXhjZXB0IGZvciB3aXRoIHNrZXdYL1ksIHJldmVydCB0aGUgYXhpcy1zcGVjaWZpYyB0cmFuc2Zvcm0gc3VicHJvcGVydGllcyB0byB0aGVpciBheGlzLWZyZWUgbWFzdGVyXG4gICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXMgc28gdGhhdCB0aGV5IG1hdGNoIHVwIHdpdGggU1ZHJ3MgYWNjZXB0ZWQgdHJhbnNmb3JtIHByb3BlcnRpZXMuICovXG4gICAgICAgICAgICAgICAgICAgIGlmICgvXnRyYW5zbGF0ZS9pLnRlc3QodHJhbnNmb3JtTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybU5hbWUgPSBcInRyYW5zbGF0ZVwiO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9ec2NhbGUvaS50ZXN0KHRyYW5zZm9ybU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1OYW1lID0gXCJzY2FsZVwiO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9ecm90YXRlL2kudGVzdCh0cmFuc2Zvcm1OYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtTmFtZSA9IFwicm90YXRlXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBDaGVjayB0aGF0IHdlIGhhdmVuJ3QgeWV0IGRlbGV0ZWQgdGhlIHByb3BlcnR5IGZyb20gdGhlIFNWR1RyYW5zZm9ybXMgY29udGFpbmVyLiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAoU1ZHVHJhbnNmb3Jtc1t0cmFuc2Zvcm1OYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogQXBwZW5kIHRoZSB0cmFuc2Zvcm0gcHJvcGVydHkgaW4gdGhlIFNWRy1zdXBwb3J0ZWQgdHJhbnNmb3JtIGZvcm1hdC4gQXMgcGVyIHRoZSBzcGVjLCBzdXJyb3VuZCB0aGUgc3BhY2UtZGVsaW1pdGVkIHZhbHVlcyBpbiBwYXJlbnRoZXNlcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVN0cmluZyArPSB0cmFuc2Zvcm1OYW1lICsgXCIoXCIgKyBTVkdUcmFuc2Zvcm1zW3RyYW5zZm9ybU5hbWVdLmpvaW4oXCIgXCIpICsgXCIpXCIgKyBcIiBcIjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogQWZ0ZXIgcHJvY2Vzc2luZyBhbiBTVkcgdHJhbnNmb3JtIHByb3BlcnR5LCBkZWxldGUgaXQgZnJvbSB0aGUgU1ZHVHJhbnNmb3JtcyBjb250YWluZXIgc28gd2UgZG9uJ3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlLWluc2VydCB0aGUgc2FtZSBtYXN0ZXIgcHJvcGVydHkgaWYgd2UgZW5jb3VudGVyIGFub3RoZXIgb25lIG9mIGl0cyBheGlzLXNwZWNpZmljIHByb3BlcnRpZXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgU1ZHVHJhbnNmb3Jtc1t0cmFuc2Zvcm1OYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgdHJhbnNmb3JtVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIHBlcnNwZWN0aXZlO1xuXG4gICAgICAgICAgICAgICAgLyogVHJhbnNmb3JtIHByb3BlcnRpZXMgYXJlIHN0b3JlZCBhcyBtZW1iZXJzIG9mIHRoZSB0cmFuc2Zvcm1DYWNoZSBvYmplY3QuIENvbmNhdGVuYXRlIGFsbCB0aGUgbWVtYmVycyBpbnRvIGEgc3RyaW5nLiAqL1xuICAgICAgICAgICAgICAgICQuZWFjaChEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlLCBmdW5jdGlvbih0cmFuc2Zvcm1OYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVZhbHVlID0gRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXTtcblxuICAgICAgICAgICAgICAgICAgICAvKiBUcmFuc2Zvcm0ncyBwZXJzcGVjdGl2ZSBzdWJwcm9wZXJ0eSBtdXN0IGJlIHNldCBmaXJzdCBpbiBvcmRlciB0byB0YWtlIGVmZmVjdC4gU3RvcmUgaXQgdGVtcG9yYXJpbHkuICovXG4gICAgICAgICAgICAgICAgICAgIGlmICh0cmFuc2Zvcm1OYW1lID09PSBcInRyYW5zZm9ybVBlcnNwZWN0aXZlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlcnNwZWN0aXZlID0gdHJhbnNmb3JtVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8qIElFOSBvbmx5IHN1cHBvcnRzIG9uZSByb3RhdGlvbiB0eXBlLCByb3RhdGVaLCB3aGljaCBpdCByZWZlcnMgdG8gYXMgXCJyb3RhdGVcIi4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKElFID09PSA5ICYmIHRyYW5zZm9ybU5hbWUgPT09IFwicm90YXRlWlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1OYW1lID0gXCJyb3RhdGVcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVN0cmluZyArPSB0cmFuc2Zvcm1OYW1lICsgdHJhbnNmb3JtVmFsdWUgKyBcIiBcIjtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8qIElmIHByZXNlbnQsIHNldCB0aGUgcGVyc3BlY3RpdmUgc3VicHJvcGVydHkgZmlyc3QuICovXG4gICAgICAgICAgICAgICAgaWYgKHBlcnNwZWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVN0cmluZyA9IFwicGVyc3BlY3RpdmVcIiArIHBlcnNwZWN0aXZlICsgXCIgXCIgKyB0cmFuc2Zvcm1TdHJpbmc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInRyYW5zZm9ybVwiLCB0cmFuc2Zvcm1TdHJpbmcpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qIFJlZ2lzdGVyIGhvb2tzIGFuZCBub3JtYWxpemF0aW9ucy4gKi9cbiAgICBDU1MuSG9va3MucmVnaXN0ZXIoKTtcbiAgICBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXIoKTtcblxuICAgIC8qIEFsbG93IGhvb2sgc2V0dGluZyBpbiB0aGUgc2FtZSBmYXNoaW9uIGFzIGpRdWVyeSdzICQuY3NzKCkuICovXG4gICAgVmVsb2NpdHkuaG9vayA9IGZ1bmN0aW9uIChlbGVtZW50cywgYXJnMiwgYXJnMykge1xuICAgICAgICB2YXIgdmFsdWUgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgZWxlbWVudHMgPSBzYW5pdGl6ZUVsZW1lbnRzKGVsZW1lbnRzKTtcblxuICAgICAgICAkLmVhY2goZWxlbWVudHMsIGZ1bmN0aW9uKGksIGVsZW1lbnQpIHtcbiAgICAgICAgICAgIC8qIEluaXRpYWxpemUgVmVsb2NpdHkncyBwZXItZWxlbWVudCBkYXRhIGNhY2hlIGlmIHRoaXMgZWxlbWVudCBoYXNuJ3QgcHJldmlvdXNseSBiZWVuIGFuaW1hdGVkLiAqL1xuICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIFZlbG9jaXR5LmluaXQoZWxlbWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIEdldCBwcm9wZXJ0eSB2YWx1ZS4gSWYgYW4gZWxlbWVudCBzZXQgd2FzIHBhc3NlZCBpbiwgb25seSByZXR1cm4gdGhlIHZhbHVlIGZvciB0aGUgZmlyc3QgZWxlbWVudC4gKi9cbiAgICAgICAgICAgIGlmIChhcmczID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IFZlbG9jaXR5LkNTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIGFyZzIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIFNldCBwcm9wZXJ0eSB2YWx1ZS4gKi9cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLyogc1BWIHJldHVybnMgYW4gYXJyYXkgb2YgdGhlIG5vcm1hbGl6ZWQgcHJvcGVydHlOYW1lL3Byb3BlcnR5VmFsdWUgcGFpciB1c2VkIHRvIHVwZGF0ZSB0aGUgRE9NLiAqL1xuICAgICAgICAgICAgICAgIHZhciBhZGp1c3RlZFNldCA9IFZlbG9jaXR5LkNTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIGFyZzIsIGFyZzMpO1xuXG4gICAgICAgICAgICAgICAgLyogVHJhbnNmb3JtIHByb3BlcnRpZXMgZG9uJ3QgYXV0b21hdGljYWxseSBzZXQuIFRoZXkgaGF2ZSB0byBiZSBmbHVzaGVkIHRvIHRoZSBET00uICovXG4gICAgICAgICAgICAgICAgaWYgKGFkanVzdGVkU2V0WzBdID09PSBcInRyYW5zZm9ybVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LkNTUy5mbHVzaFRyYW5zZm9ybUNhY2hlKGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhbHVlID0gYWRqdXN0ZWRTZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuXG4gICAgLyoqKioqKioqKioqKioqKioqXG4gICAgICAgIEFuaW1hdGlvblxuICAgICoqKioqKioqKioqKioqKioqL1xuXG4gICAgdmFyIGFuaW1hdGUgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICAvKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICBDYWxsIENoYWluXG4gICAgICAgICoqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAvKiBMb2dpYyBmb3IgZGV0ZXJtaW5pbmcgd2hhdCB0byByZXR1cm4gdG8gdGhlIGNhbGwgc3RhY2sgd2hlbiBleGl0aW5nIG91dCBvZiBWZWxvY2l0eS4gKi9cbiAgICAgICAgZnVuY3Rpb24gZ2V0Q2hhaW4gKCkge1xuICAgICAgICAgICAgLyogSWYgd2UgYXJlIHVzaW5nIHRoZSB1dGlsaXR5IGZ1bmN0aW9uLCBhdHRlbXB0IHRvIHJldHVybiB0aGlzIGNhbGwncyBwcm9taXNlLiBJZiBubyBwcm9taXNlIGxpYnJhcnkgd2FzIGRldGVjdGVkLFxuICAgICAgICAgICAgICAgZGVmYXVsdCB0byBudWxsIGluc3RlYWQgb2YgcmV0dXJuaW5nIHRoZSB0YXJnZXRlZCBlbGVtZW50cyBzbyB0aGF0IHV0aWxpdHkgZnVuY3Rpb24ncyByZXR1cm4gdmFsdWUgaXMgc3RhbmRhcmRpemVkLiAqL1xuICAgICAgICAgICAgaWYgKGlzVXRpbGl0eSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlRGF0YS5wcm9taXNlIHx8IG51bGw7XG4gICAgICAgICAgICAvKiBPdGhlcndpc2UsIGlmIHdlJ3JlIHVzaW5nICQuZm4sIHJldHVybiB0aGUgalF1ZXJ5LS9aZXB0by13cmFwcGVkIGVsZW1lbnQgc2V0LiAqL1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudHNXcmFwcGVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgQXJndW1lbnRzIEFzc2lnbm1lbnRcbiAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAvKiBUbyBhbGxvdyBmb3IgZXhwcmVzc2l2ZSBDb2ZmZWVTY3JpcHQgY29kZSwgVmVsb2NpdHkgc3VwcG9ydHMgYW4gYWx0ZXJuYXRpdmUgc3ludGF4IGluIHdoaWNoIFwiZWxlbWVudHNcIiAob3IgXCJlXCIpLCBcInByb3BlcnRpZXNcIiAob3IgXCJwXCIpLCBhbmQgXCJvcHRpb25zXCIgKG9yIFwib1wiKVxuICAgICAgICAgICBvYmplY3RzIGFyZSBkZWZpbmVkIG9uIGEgY29udGFpbmVyIG9iamVjdCB0aGF0J3MgcGFzc2VkIGluIGFzIFZlbG9jaXR5J3Mgc29sZSBhcmd1bWVudC4gKi9cbiAgICAgICAgLyogTm90ZTogU29tZSBicm93c2VycyBhdXRvbWF0aWNhbGx5IHBvcHVsYXRlIGFyZ3VtZW50cyB3aXRoIGEgXCJwcm9wZXJ0aWVzXCIgb2JqZWN0LiBXZSBkZXRlY3QgaXQgYnkgY2hlY2tpbmcgZm9yIGl0cyBkZWZhdWx0IFwibmFtZXNcIiBwcm9wZXJ0eS4gKi9cbiAgICAgICAgdmFyIHN5bnRhY3RpY1N1Z2FyID0gKGFyZ3VtZW50c1swXSAmJiAoYXJndW1lbnRzWzBdLnAgfHwgKCgkLmlzUGxhaW5PYmplY3QoYXJndW1lbnRzWzBdLnByb3BlcnRpZXMpICYmICFhcmd1bWVudHNbMF0ucHJvcGVydGllcy5uYW1lcykgfHwgVHlwZS5pc1N0cmluZyhhcmd1bWVudHNbMF0ucHJvcGVydGllcykpKSksXG4gICAgICAgICAgICAvKiBXaGV0aGVyIFZlbG9jaXR5IHdhcyBjYWxsZWQgdmlhIHRoZSB1dGlsaXR5IGZ1bmN0aW9uIChhcyBvcHBvc2VkIHRvIG9uIGEgalF1ZXJ5L1plcHRvIG9iamVjdCkuICovXG4gICAgICAgICAgICBpc1V0aWxpdHksXG4gICAgICAgICAgICAvKiBXaGVuIFZlbG9jaXR5IGlzIGNhbGxlZCB2aWEgdGhlIHV0aWxpdHkgZnVuY3Rpb24gKCQuVmVsb2NpdHkoKS9WZWxvY2l0eSgpKSwgZWxlbWVudHMgYXJlIGV4cGxpY2l0bHlcbiAgICAgICAgICAgICAgIHBhc3NlZCBpbiBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyLiBUaHVzLCBhcmd1bWVudCBwb3NpdGlvbmluZyB2YXJpZXMuIFdlIG5vcm1hbGl6ZSB0aGVtIGhlcmUuICovXG4gICAgICAgICAgICBlbGVtZW50c1dyYXBwZWQsXG4gICAgICAgICAgICBhcmd1bWVudEluZGV4O1xuXG4gICAgICAgIHZhciBlbGVtZW50cyxcbiAgICAgICAgICAgIHByb3BlcnRpZXNNYXAsXG4gICAgICAgICAgICBvcHRpb25zO1xuXG4gICAgICAgIC8qIERldGVjdCBqUXVlcnkvWmVwdG8gZWxlbWVudHMgYmVpbmcgYW5pbWF0ZWQgdmlhIHRoZSAkLmZuIG1ldGhvZC4gKi9cbiAgICAgICAgaWYgKFR5cGUuaXNXcmFwcGVkKHRoaXMpKSB7XG4gICAgICAgICAgICBpc1V0aWxpdHkgPSBmYWxzZTtcblxuICAgICAgICAgICAgYXJndW1lbnRJbmRleCA9IDA7XG4gICAgICAgICAgICBlbGVtZW50cyA9IHRoaXM7XG4gICAgICAgICAgICBlbGVtZW50c1dyYXBwZWQgPSB0aGlzO1xuICAgICAgICAvKiBPdGhlcndpc2UsIHJhdyBlbGVtZW50cyBhcmUgYmVpbmcgYW5pbWF0ZWQgdmlhIHRoZSB1dGlsaXR5IGZ1bmN0aW9uLiAqL1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaXNVdGlsaXR5ID0gdHJ1ZTtcblxuICAgICAgICAgICAgYXJndW1lbnRJbmRleCA9IDE7XG4gICAgICAgICAgICBlbGVtZW50cyA9IHN5bnRhY3RpY1N1Z2FyID8gKGFyZ3VtZW50c1swXS5lbGVtZW50cyB8fCBhcmd1bWVudHNbMF0uZSkgOiBhcmd1bWVudHNbMF07XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50cyA9IHNhbml0aXplRWxlbWVudHMoZWxlbWVudHMpO1xuXG4gICAgICAgIGlmICghZWxlbWVudHMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzeW50YWN0aWNTdWdhcikge1xuICAgICAgICAgICAgcHJvcGVydGllc01hcCA9IGFyZ3VtZW50c1swXS5wcm9wZXJ0aWVzIHx8IGFyZ3VtZW50c1swXS5wO1xuICAgICAgICAgICAgb3B0aW9ucyA9IGFyZ3VtZW50c1swXS5vcHRpb25zIHx8IGFyZ3VtZW50c1swXS5vO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJvcGVydGllc01hcCA9IGFyZ3VtZW50c1thcmd1bWVudEluZGV4XTtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBhcmd1bWVudHNbYXJndW1lbnRJbmRleCArIDFdO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogVGhlIGxlbmd0aCBvZiB0aGUgZWxlbWVudCBzZXQgKGluIHRoZSBmb3JtIG9mIGEgbm9kZUxpc3Qgb3IgYW4gYXJyYXkgb2YgZWxlbWVudHMpIGlzIGRlZmF1bHRlZCB0byAxIGluIGNhc2UgYVxuICAgICAgICAgICBzaW5nbGUgcmF3IERPTSBlbGVtZW50IGlzIHBhc3NlZCBpbiAod2hpY2ggZG9lc24ndCBjb250YWluIGEgbGVuZ3RoIHByb3BlcnR5KS4gKi9cbiAgICAgICAgdmFyIGVsZW1lbnRzTGVuZ3RoID0gZWxlbWVudHMubGVuZ3RoLFxuICAgICAgICAgICAgZWxlbWVudHNJbmRleCA9IDA7XG5cbiAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgQXJndW1lbnQgT3ZlcmxvYWRpbmdcbiAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgIC8qIFN1cHBvcnQgaXMgaW5jbHVkZWQgZm9yIGpRdWVyeSdzIGFyZ3VtZW50IG92ZXJsb2FkaW5nOiAkLmFuaW1hdGUocHJvcGVydHlNYXAgWywgZHVyYXRpb25dIFssIGVhc2luZ10gWywgY29tcGxldGVdKS5cbiAgICAgICAgICAgT3ZlcmxvYWRpbmcgaXMgZGV0ZWN0ZWQgYnkgY2hlY2tpbmcgZm9yIHRoZSBhYnNlbmNlIG9mIGFuIG9iamVjdCBiZWluZyBwYXNzZWQgaW50byBvcHRpb25zLiAqL1xuICAgICAgICAvKiBOb3RlOiBUaGUgc3RvcCBhbmQgZmluaXNoIGFjdGlvbnMgZG8gbm90IGFjY2VwdCBhbmltYXRpb24gb3B0aW9ucywgYW5kIGFyZSB0aGVyZWZvcmUgZXhjbHVkZWQgZnJvbSB0aGlzIGNoZWNrLiAqL1xuICAgICAgICBpZiAoIS9eKHN0b3B8ZmluaXNoKSQvaS50ZXN0KHByb3BlcnRpZXNNYXApICYmICEkLmlzUGxhaW5PYmplY3Qob3B0aW9ucykpIHtcbiAgICAgICAgICAgIC8qIFRoZSB1dGlsaXR5IGZ1bmN0aW9uIHNoaWZ0cyBhbGwgYXJndW1lbnRzIG9uZSBwb3NpdGlvbiB0byB0aGUgcmlnaHQsIHNvIHdlIGFkanVzdCBmb3IgdGhhdCBvZmZzZXQuICovXG4gICAgICAgICAgICB2YXIgc3RhcnRpbmdBcmd1bWVudFBvc2l0aW9uID0gYXJndW1lbnRJbmRleCArIDE7XG5cbiAgICAgICAgICAgIG9wdGlvbnMgPSB7fTtcblxuICAgICAgICAgICAgLyogSXRlcmF0ZSB0aHJvdWdoIGFsbCBvcHRpb25zIGFyZ3VtZW50cyAqL1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHN0YXJ0aW5nQXJndW1lbnRQb3NpdGlvbjsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIC8qIFRyZWF0IGEgbnVtYmVyIGFzIGEgZHVyYXRpb24uIFBhcnNlIGl0IG91dC4gKi9cbiAgICAgICAgICAgICAgICAvKiBOb3RlOiBUaGUgZm9sbG93aW5nIFJlZ0V4IHdpbGwgcmV0dXJuIHRydWUgaWYgcGFzc2VkIGFuIGFycmF5IHdpdGggYSBudW1iZXIgYXMgaXRzIGZpcnN0IGl0ZW0uXG4gICAgICAgICAgICAgICAgICAgVGh1cywgYXJyYXlzIGFyZSBza2lwcGVkIGZyb20gdGhpcyBjaGVjay4gKi9cbiAgICAgICAgICAgICAgICBpZiAoIVR5cGUuaXNBcnJheShhcmd1bWVudHNbaV0pICYmICgvXihmYXN0fG5vcm1hbHxzbG93KSQvaS50ZXN0KGFyZ3VtZW50c1tpXSkgfHwgL15cXGQvLnRlc3QoYXJndW1lbnRzW2ldKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5kdXJhdGlvbiA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgICAgICAvKiBUcmVhdCBzdHJpbmdzIGFuZCBhcnJheXMgYXMgZWFzaW5ncy4gKi9cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFR5cGUuaXNTdHJpbmcoYXJndW1lbnRzW2ldKSB8fCBUeXBlLmlzQXJyYXkoYXJndW1lbnRzW2ldKSkge1xuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmVhc2luZyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgICAgICAvKiBUcmVhdCBhIGZ1bmN0aW9uIGFzIGEgY29tcGxldGUgY2FsbGJhY2suICovXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChUeXBlLmlzRnVuY3Rpb24oYXJndW1lbnRzW2ldKSkge1xuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmNvbXBsZXRlID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKioqKioqKioqKioqKipcbiAgICAgICAgICAgIFByb21pc2VzXG4gICAgICAgICoqKioqKioqKioqKioqKi9cblxuICAgICAgICB2YXIgcHJvbWlzZURhdGEgPSB7XG4gICAgICAgICAgICAgICAgcHJvbWlzZTogbnVsbCxcbiAgICAgICAgICAgICAgICByZXNvbHZlcjogbnVsbCxcbiAgICAgICAgICAgICAgICByZWplY3RlcjogbnVsbFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAvKiBJZiB0aGlzIGNhbGwgd2FzIG1hZGUgdmlhIHRoZSB1dGlsaXR5IGZ1bmN0aW9uICh3aGljaCBpcyB0aGUgZGVmYXVsdCBtZXRob2Qgb2YgaW52b2NhdGlvbiB3aGVuIGpRdWVyeS9aZXB0byBhcmUgbm90IGJlaW5nIHVzZWQpLCBhbmQgaWZcbiAgICAgICAgICAgcHJvbWlzZSBzdXBwb3J0IHdhcyBkZXRlY3RlZCwgY3JlYXRlIGEgcHJvbWlzZSBvYmplY3QgZm9yIHRoaXMgY2FsbCBhbmQgc3RvcmUgcmVmZXJlbmNlcyB0byBpdHMgcmVzb2x2ZXIgYW5kIHJlamVjdGVyIG1ldGhvZHMuIFRoZSByZXNvbHZlXG4gICAgICAgICAgIG1ldGhvZCBpcyB1c2VkIHdoZW4gYSBjYWxsIGNvbXBsZXRlcyBuYXR1cmFsbHkgb3IgaXMgcHJlbWF0dXJlbHkgc3RvcHBlZCBieSB0aGUgdXNlci4gSW4gYm90aCBjYXNlcywgY29tcGxldGVDYWxsKCkgaGFuZGxlcyB0aGUgYXNzb2NpYXRlZFxuICAgICAgICAgICBjYWxsIGNsZWFudXAgYW5kIHByb21pc2UgcmVzb2x2aW5nIGxvZ2ljLiBUaGUgcmVqZWN0IG1ldGhvZCBpcyB1c2VkIHdoZW4gYW4gaW52YWxpZCBzZXQgb2YgYXJndW1lbnRzIGlzIHBhc3NlZCBpbnRvIGEgVmVsb2NpdHkgY2FsbC4gKi9cbiAgICAgICAgLyogTm90ZTogVmVsb2NpdHkgZW1wbG95cyBhIGNhbGwtYmFzZWQgcXVldWVpbmcgYXJjaGl0ZWN0dXJlLCB3aGljaCBtZWFucyB0aGF0IHN0b3BwaW5nIGFuIGFuaW1hdGluZyBlbGVtZW50IGFjdHVhbGx5IHN0b3BzIHRoZSBmdWxsIGNhbGwgdGhhdFxuICAgICAgICAgICB0cmlnZ2VyZWQgaXQgLS0gbm90IHRoYXQgb25lIGVsZW1lbnQgZXhjbHVzaXZlbHkuIFNpbWlsYXJseSwgdGhlcmUgaXMgb25lIHByb21pc2UgcGVyIGNhbGwsIGFuZCBhbGwgZWxlbWVudHMgdGFyZ2V0ZWQgYnkgYSBWZWxvY2l0eSBjYWxsIGFyZVxuICAgICAgICAgICBncm91cGVkIHRvZ2V0aGVyIGZvciB0aGUgcHVycG9zZXMgb2YgcmVzb2x2aW5nIGFuZCByZWplY3RpbmcgYSBwcm9taXNlLiAqL1xuICAgICAgICBpZiAoaXNVdGlsaXR5ICYmIFZlbG9jaXR5LlByb21pc2UpIHtcbiAgICAgICAgICAgIHByb21pc2VEYXRhLnByb21pc2UgPSBuZXcgVmVsb2NpdHkuUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgcHJvbWlzZURhdGEucmVzb2x2ZXIgPSByZXNvbHZlO1xuICAgICAgICAgICAgICAgIHByb21pc2VEYXRhLnJlamVjdGVyID0gcmVqZWN0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgIEFjdGlvbiBEZXRlY3Rpb25cbiAgICAgICAgKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgIC8qIFZlbG9jaXR5J3MgYmVoYXZpb3IgaXMgY2F0ZWdvcml6ZWQgaW50byBcImFjdGlvbnNcIjogRWxlbWVudHMgY2FuIGVpdGhlciBiZSBzcGVjaWFsbHkgc2Nyb2xsZWQgaW50byB2aWV3LFxuICAgICAgICAgICBvciB0aGV5IGNhbiBiZSBzdGFydGVkLCBzdG9wcGVkLCBvciByZXZlcnNlZC4gSWYgYSBsaXRlcmFsIG9yIHJlZmVyZW5jZWQgcHJvcGVydGllcyBtYXAgaXMgcGFzc2VkIGluIGFzIFZlbG9jaXR5J3NcbiAgICAgICAgICAgZmlyc3QgYXJndW1lbnQsIHRoZSBhc3NvY2lhdGVkIGFjdGlvbiBpcyBcInN0YXJ0XCIuIEFsdGVybmF0aXZlbHksIFwic2Nyb2xsXCIsIFwicmV2ZXJzZVwiLCBvciBcInN0b3BcIiBjYW4gYmUgcGFzc2VkIGluIGluc3RlYWQgb2YgYSBwcm9wZXJ0aWVzIG1hcC4gKi9cbiAgICAgICAgdmFyIGFjdGlvbjtcblxuICAgICAgICBzd2l0Y2ggKHByb3BlcnRpZXNNYXApIHtcbiAgICAgICAgICAgIGNhc2UgXCJzY3JvbGxcIjpcbiAgICAgICAgICAgICAgICBhY3Rpb24gPSBcInNjcm9sbFwiO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIFwicmV2ZXJzZVwiOlxuICAgICAgICAgICAgICAgIGFjdGlvbiA9IFwicmV2ZXJzZVwiO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIFwiZmluaXNoXCI6XG4gICAgICAgICAgICBjYXNlIFwic3RvcFwiOlxuICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgIEFjdGlvbjogU3RvcFxuICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICAvKiBDbGVhciB0aGUgY3VycmVudGx5LWFjdGl2ZSBkZWxheSBvbiBlYWNoIHRhcmdldGVkIGVsZW1lbnQuICovXG4gICAgICAgICAgICAgICAgJC5lYWNoKGVsZW1lbnRzLCBmdW5jdGlvbihpLCBlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpICYmIERhdGEoZWxlbWVudCkuZGVsYXlUaW1lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogU3RvcCB0aGUgdGltZXIgZnJvbSB0cmlnZ2VyaW5nIGl0cyBjYWNoZWQgbmV4dCgpIGZ1bmN0aW9uLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KERhdGEoZWxlbWVudCkuZGVsYXlUaW1lci5zZXRUaW1lb3V0KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogTWFudWFsbHkgY2FsbCB0aGUgbmV4dCgpIGZ1bmN0aW9uIHNvIHRoYXQgdGhlIHN1YnNlcXVlbnQgcXVldWUgaXRlbXMgY2FuIHByb2dyZXNzLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkuZGVsYXlUaW1lci5uZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5kZWxheVRpbWVyLm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIERhdGEoZWxlbWVudCkuZGVsYXlUaW1lcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdmFyIGNhbGxzVG9TdG9wID0gW107XG5cbiAgICAgICAgICAgICAgICAvKiBXaGVuIHRoZSBzdG9wIGFjdGlvbiBpcyB0cmlnZ2VyZWQsIHRoZSBlbGVtZW50cycgY3VycmVudGx5IGFjdGl2ZSBjYWxsIGlzIGltbWVkaWF0ZWx5IHN0b3BwZWQuIFRoZSBhY3RpdmUgY2FsbCBtaWdodCBoYXZlXG4gICAgICAgICAgICAgICAgICAgYmVlbiBhcHBsaWVkIHRvIG11bHRpcGxlIGVsZW1lbnRzLCBpbiB3aGljaCBjYXNlIGFsbCBvZiB0aGUgY2FsbCdzIGVsZW1lbnRzIHdpbGwgYmUgc3RvcHBlZC4gV2hlbiBhbiBlbGVtZW50XG4gICAgICAgICAgICAgICAgICAgaXMgc3RvcHBlZCwgdGhlIG5leHQgaXRlbSBpbiBpdHMgYW5pbWF0aW9uIHF1ZXVlIGlzIGltbWVkaWF0ZWx5IHRyaWdnZXJlZC4gKi9cbiAgICAgICAgICAgICAgICAvKiBBbiBhZGRpdGlvbmFsIGFyZ3VtZW50IG1heSBiZSBwYXNzZWQgaW4gdG8gY2xlYXIgYW4gZWxlbWVudCdzIHJlbWFpbmluZyBxdWV1ZWQgY2FsbHMuIEVpdGhlciB0cnVlICh3aGljaCBkZWZhdWx0cyB0byB0aGUgXCJmeFwiIHF1ZXVlKVxuICAgICAgICAgICAgICAgICAgIG9yIGEgY3VzdG9tIHF1ZXVlIHN0cmluZyBjYW4gYmUgcGFzc2VkIGluLiAqL1xuICAgICAgICAgICAgICAgIC8qIE5vdGU6IFRoZSBzdG9wIGNvbW1hbmQgcnVucyBwcmlvciB0byBWZWxvY2l0eSdzIFF1ZXVlaW5nIHBoYXNlIHNpbmNlIGl0cyBiZWhhdmlvciBpcyBpbnRlbmRlZCB0byB0YWtlIGVmZmVjdCAqaW1tZWRpYXRlbHkqLFxuICAgICAgICAgICAgICAgICAgIHJlZ2FyZGxlc3Mgb2YgdGhlIGVsZW1lbnQncyBjdXJyZW50IHF1ZXVlIHN0YXRlLiAqL1xuXG4gICAgICAgICAgICAgICAgLyogSXRlcmF0ZSB0aHJvdWdoIGV2ZXJ5IGFjdGl2ZSBjYWxsLiAqL1xuICAgICAgICAgICAgICAgICQuZWFjaChWZWxvY2l0eS5TdGF0ZS5jYWxscywgZnVuY3Rpb24oaSwgYWN0aXZlQ2FsbCkge1xuICAgICAgICAgICAgICAgICAgICAvKiBJbmFjdGl2ZSBjYWxscyBhcmUgc2V0IHRvIGZhbHNlIGJ5IHRoZSBsb2dpYyBpbnNpZGUgY29tcGxldGVDYWxsKCkuIFNraXAgdGhlbS4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGl2ZUNhbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIEl0ZXJhdGUgdGhyb3VnaCB0aGUgYWN0aXZlIGNhbGwncyB0YXJnZXRlZCBlbGVtZW50cy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChhY3RpdmVDYWxsWzFdLCBmdW5jdGlvbihrLCBhY3RpdmVFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdHJ1ZSB3YXMgcGFzc2VkIGluIGFzIGEgc2Vjb25kYXJ5IGFyZ3VtZW50LCBjbGVhciBhYnNvbHV0ZWx5IGFsbCBjYWxscyBvbiB0aGlzIGVsZW1lbnQuIE90aGVyd2lzZSwgb25seVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyIGNhbGxzIGFzc29jaWF0ZWQgd2l0aCB0aGUgcmVsZXZhbnQgcXVldWUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ2FsbCBzdG9wcGluZyBsb2dpYyB3b3JrcyBhcyBmb2xsb3dzOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0gb3B0aW9ucyA9PT0gdHJ1ZSAtLT4gc3RvcCBjdXJyZW50IGRlZmF1bHQgcXVldWUgY2FsbHMgKGFuZCBxdWV1ZTpmYWxzZSBjYWxscyksIGluY2x1ZGluZyByZW1haW5pbmcgcXVldWVkIG9uZXMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLSBvcHRpb25zID09PSB1bmRlZmluZWQgLS0+IHN0b3AgY3VycmVudCBxdWV1ZTpcIlwiIGNhbGwgYW5kIGFsbCBxdWV1ZTpmYWxzZSBjYWxscy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIG9wdGlvbnMgPT09IGZhbHNlIC0tPiBzdG9wIG9ubHkgcXVldWU6ZmFsc2UgY2FsbHMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLSBvcHRpb25zID09PSBcImN1c3RvbVwiIC0tPiBzdG9wIGN1cnJlbnQgcXVldWU6XCJjdXN0b21cIiBjYWxsLCBpbmNsdWRpbmcgcmVtYWluaW5nIHF1ZXVlZCBvbmVzICh0aGVyZSBpcyBubyBmdW5jdGlvbmFsaXR5IHRvIG9ubHkgY2xlYXIgdGhlIGN1cnJlbnRseS1ydW5uaW5nIHF1ZXVlOlwiY3VzdG9tXCIgY2FsbCkuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHF1ZXVlTmFtZSA9IChvcHRpb25zID09PSB1bmRlZmluZWQpID8gXCJcIiA6IG9wdGlvbnM7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocXVldWVOYW1lICE9PSB0cnVlICYmIChhY3RpdmVDYWxsWzJdLnF1ZXVlICE9PSBxdWV1ZU5hbWUpICYmICEob3B0aW9ucyA9PT0gdW5kZWZpbmVkICYmIGFjdGl2ZUNhbGxbMl0ucXVldWUgPT09IGZhbHNlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJdGVyYXRlIHRocm91Z2ggdGhlIGNhbGxzIHRhcmdldGVkIGJ5IHRoZSBzdG9wIGNvbW1hbmQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGVsZW1lbnRzLCBmdW5jdGlvbihsLCBlbGVtZW50KSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ2hlY2sgdGhhdCB0aGlzIGNhbGwgd2FzIGFwcGxpZWQgdG8gdGhlIHRhcmdldCBlbGVtZW50LiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudCA9PT0gYWN0aXZlRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogT3B0aW9uYWxseSBjbGVhciB0aGUgcmVtYWluaW5nIHF1ZXVlZCBjYWxscy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zID09PSB0cnVlIHx8IFR5cGUuaXNTdHJpbmcob3B0aW9ucykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJdGVyYXRlIHRocm91Z2ggdGhlIGl0ZW1zIGluIHRoZSBlbGVtZW50J3MgcXVldWUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKCQucXVldWUoZWxlbWVudCwgVHlwZS5pc1N0cmluZyhvcHRpb25zKSA/IG9wdGlvbnMgOiBcIlwiKSwgZnVuY3Rpb24oXywgaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUaGUgcXVldWUgYXJyYXkgY2FuIGNvbnRhaW4gYW4gXCJpbnByb2dyZXNzXCIgc3RyaW5nLCB3aGljaCB3ZSBza2lwLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoVHlwZS5pc0Z1bmN0aW9uKGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBQYXNzIHRoZSBpdGVtJ3MgY2FsbGJhY2sgYSBmbGFnIGluZGljYXRpbmcgdGhhdCB3ZSB3YW50IHRvIGFib3J0IGZyb20gdGhlIHF1ZXVlIGNhbGwuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoU3BlY2lmaWNhbGx5LCB0aGUgcXVldWUgd2lsbCByZXNvbHZlIHRoZSBjYWxsJ3MgYXNzb2NpYXRlZCBwcm9taXNlIHRoZW4gYWJvcnQuKSAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0obnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENsZWFyaW5nIHRoZSAkLnF1ZXVlKCkgYXJyYXkgaXMgYWNoaWV2ZWQgYnkgcmVzZXR0aW5nIGl0IHRvIFtdLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQucXVldWUoZWxlbWVudCwgVHlwZS5pc1N0cmluZyhvcHRpb25zKSA/IG9wdGlvbnMgOiBcIlwiLCBbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzTWFwID09PSBcInN0b3BcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNpbmNlIFwicmV2ZXJzZVwiIHVzZXMgY2FjaGVkIHN0YXJ0IHZhbHVlcyAodGhlIHByZXZpb3VzIGNhbGwncyBlbmRWYWx1ZXMpLCB0aGVzZSB2YWx1ZXMgbXVzdCBiZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZWQgdG8gcmVmbGVjdCB0aGUgZmluYWwgdmFsdWUgdGhhdCB0aGUgZWxlbWVudHMgd2VyZSBhY3R1YWxseSB0d2VlbmVkIHRvLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IElmIG9ubHkgcXVldWU6ZmFsc2UgYW5pbWF0aW9ucyBhcmUgY3VycmVudGx5IHJ1bm5pbmcgb24gYW4gZWxlbWVudCwgaXQgd29uJ3QgaGF2ZSBhIHR3ZWVuc0NvbnRhaW5lclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdC4gQWxzbywgcXVldWU6ZmFsc2UgYW5pbWF0aW9ucyBjYW4ndCBiZSByZXZlcnNlZC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KSAmJiBEYXRhKGVsZW1lbnQpLnR3ZWVuc0NvbnRhaW5lciAmJiBxdWV1ZU5hbWUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChEYXRhKGVsZW1lbnQpLnR3ZWVuc0NvbnRhaW5lciwgZnVuY3Rpb24obSwgYWN0aXZlVHdlZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZVR3ZWVuLmVuZFZhbHVlID0gYWN0aXZlVHdlZW4uY3VycmVudFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsc1RvU3RvcC5wdXNoKGkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0aWVzTWFwID09PSBcImZpbmlzaFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVG8gZ2V0IGFjdGl2ZSB0d2VlbnMgdG8gZmluaXNoIGltbWVkaWF0ZWx5LCB3ZSBmb3JjZWZ1bGx5IHNob3J0ZW4gdGhlaXIgZHVyYXRpb25zIHRvIDFtcyBzbyB0aGF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhleSBmaW5pc2ggdXBvbiB0aGUgbmV4dCByQWYgdGljayB0aGVuIHByb2NlZWQgd2l0aCBub3JtYWwgY2FsbCBjb21wbGV0aW9uIGxvZ2ljLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZUNhbGxbMl0uZHVyYXRpb24gPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLyogUHJlbWF0dXJlbHkgY2FsbCBjb21wbGV0ZUNhbGwoKSBvbiBlYWNoIG1hdGNoZWQgYWN0aXZlIGNhbGwuIFBhc3MgYW4gYWRkaXRpb25hbCBmbGFnIGZvciBcInN0b3BcIiB0byBpbmRpY2F0ZVxuICAgICAgICAgICAgICAgICAgIHRoYXQgdGhlIGNvbXBsZXRlIGNhbGxiYWNrIGFuZCBkaXNwbGF5Om5vbmUgc2V0dGluZyBzaG91bGQgYmUgc2tpcHBlZCBzaW5jZSB3ZSdyZSBjb21wbGV0aW5nIHByZW1hdHVyZWx5LiAqL1xuICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzTWFwID09PSBcInN0b3BcIikge1xuICAgICAgICAgICAgICAgICAgICAkLmVhY2goY2FsbHNUb1N0b3AsIGZ1bmN0aW9uKGksIGopIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlQ2FsbChqLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb21pc2VEYXRhLnByb21pc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIEltbWVkaWF0ZWx5IHJlc29sdmUgdGhlIHByb21pc2UgYXNzb2NpYXRlZCB3aXRoIHRoaXMgc3RvcCBjYWxsIHNpbmNlIHN0b3AgcnVucyBzeW5jaHJvbm91c2x5LiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZURhdGEucmVzb2x2ZXIoZWxlbWVudHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyogU2luY2Ugd2UncmUgc3RvcHBpbmcsIGFuZCBub3QgcHJvY2VlZGluZyB3aXRoIHF1ZXVlaW5nLCBleGl0IG91dCBvZiBWZWxvY2l0eS4gKi9cbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0Q2hhaW4oKTtcblxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAvKiBUcmVhdCBhIG5vbi1lbXB0eSBwbGFpbiBvYmplY3QgYXMgYSBsaXRlcmFsIHByb3BlcnRpZXMgbWFwLiAqL1xuICAgICAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3QocHJvcGVydGllc01hcCkgJiYgIVR5cGUuaXNFbXB0eU9iamVjdChwcm9wZXJ0aWVzTWFwKSkge1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBcInN0YXJ0XCI7XG5cbiAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICBSZWRpcmVjdHNcbiAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgLyogQ2hlY2sgaWYgYSBzdHJpbmcgbWF0Y2hlcyBhIHJlZ2lzdGVyZWQgcmVkaXJlY3QgKHNlZSBSZWRpcmVjdHMgYWJvdmUpLiAqL1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoVHlwZS5pc1N0cmluZyhwcm9wZXJ0aWVzTWFwKSAmJiBWZWxvY2l0eS5SZWRpcmVjdHNbcHJvcGVydGllc01hcF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9wdHMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucyksXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbk9yaWdpbmFsID0gb3B0cy5kdXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGF5T3JpZ2luYWwgPSBvcHRzLmRlbGF5IHx8IDA7XG5cbiAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGJhY2t3YXJkcyBvcHRpb24gd2FzIHBhc3NlZCBpbiwgcmV2ZXJzZSB0aGUgZWxlbWVudCBzZXQgc28gdGhhdCBlbGVtZW50cyBhbmltYXRlIGZyb20gdGhlIGxhc3QgdG8gdGhlIGZpcnN0LiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5iYWNrd2FyZHMgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRzID0gJC5leHRlbmQodHJ1ZSwgW10sIGVsZW1lbnRzKS5yZXZlcnNlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBJbmRpdmlkdWFsbHkgdHJpZ2dlciB0aGUgcmVkaXJlY3QgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgc2V0IHRvIHByZXZlbnQgdXNlcnMgZnJvbSBoYXZpbmcgdG8gaGFuZGxlIGl0ZXJhdGlvbiBsb2dpYyBpbiB0aGVpciByZWRpcmVjdC4gKi9cbiAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGVsZW1lbnRzLCBmdW5jdGlvbihlbGVtZW50SW5kZXgsIGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBzdGFnZ2VyIG9wdGlvbiB3YXMgcGFzc2VkIGluLCBzdWNjZXNzaXZlbHkgZGVsYXkgZWFjaCBlbGVtZW50IGJ5IHRoZSBzdGFnZ2VyIHZhbHVlIChpbiBtcykuIFJldGFpbiB0aGUgb3JpZ2luYWwgZGVsYXkgdmFsdWUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyc2VGbG9hdChvcHRzLnN0YWdnZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0cy5kZWxheSA9IGRlbGF5T3JpZ2luYWwgKyAocGFyc2VGbG9hdChvcHRzLnN0YWdnZXIpICogZWxlbWVudEluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoVHlwZS5pc0Z1bmN0aW9uKG9wdHMuc3RhZ2dlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmRlbGF5ID0gZGVsYXlPcmlnaW5hbCArIG9wdHMuc3RhZ2dlci5jYWxsKGVsZW1lbnQsIGVsZW1lbnRJbmRleCwgZWxlbWVudHNMZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgZHJhZyBvcHRpb24gd2FzIHBhc3NlZCBpbiwgc3VjY2Vzc2l2ZWx5IGluY3JlYXNlL2RlY3JlYXNlIChkZXBlbmRpbmcgb24gdGhlIHByZXNlbnNlIG9mIG9wdHMuYmFja3dhcmRzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIGR1cmF0aW9uIG9mIGVhY2ggZWxlbWVudCdzIGFuaW1hdGlvbiwgdXNpbmcgZmxvb3JzIHRvIHByZXZlbnQgcHJvZHVjaW5nIHZlcnkgc2hvcnQgZHVyYXRpb25zLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMuZHJhZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIERlZmF1bHQgdGhlIGR1cmF0aW9uIG9mIFVJIHBhY2sgZWZmZWN0cyAoY2FsbG91dHMgYW5kIHRyYW5zaXRpb25zKSB0byAxMDAwbXMgaW5zdGVhZCBvZiB0aGUgdXN1YWwgZGVmYXVsdCBkdXJhdGlvbiBvZiA0MDBtcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmR1cmF0aW9uID0gcGFyc2VGbG9hdChkdXJhdGlvbk9yaWdpbmFsKSB8fCAoL14oY2FsbG91dHx0cmFuc2l0aW9uKS8udGVzdChwcm9wZXJ0aWVzTWFwKSA/IDEwMDAgOiBEVVJBVElPTl9ERUZBVUxUKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEZvciBlYWNoIGVsZW1lbnQsIHRha2UgdGhlIGdyZWF0ZXIgZHVyYXRpb24gb2Y6IEEpIGFuaW1hdGlvbiBjb21wbGV0aW9uIHBlcmNlbnRhZ2UgcmVsYXRpdmUgdG8gdGhlIG9yaWdpbmFsIGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEIpIDc1JSBvZiB0aGUgb3JpZ2luYWwgZHVyYXRpb24sIG9yIEMpIGEgMjAwbXMgZmFsbGJhY2sgKGluIGNhc2UgZHVyYXRpb24gaXMgYWxyZWFkeSBzZXQgdG8gYSBsb3cgdmFsdWUpLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBlbmQgcmVzdWx0IGlzIGEgYmFzZWxpbmUgb2YgNzUlIG9mIHRoZSByZWRpcmVjdCdzIGR1cmF0aW9uIHRoYXQgaW5jcmVhc2VzL2RlY3JlYXNlcyBhcyB0aGUgZW5kIG9mIHRoZSBlbGVtZW50IHNldCBpcyBhcHByb2FjaGVkLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMuZHVyYXRpb24gPSBNYXRoLm1heChvcHRzLmR1cmF0aW9uICogKG9wdHMuYmFja3dhcmRzID8gMSAtIGVsZW1lbnRJbmRleC9lbGVtZW50c0xlbmd0aCA6IChlbGVtZW50SW5kZXggKyAxKSAvIGVsZW1lbnRzTGVuZ3RoKSwgb3B0cy5kdXJhdGlvbiAqIDAuNzUsIDIwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFBhc3MgaW4gdGhlIGNhbGwncyBvcHRzIG9iamVjdCBzbyB0aGF0IHRoZSByZWRpcmVjdCBjYW4gb3B0aW9uYWxseSBleHRlbmQgaXQuIEl0IGRlZmF1bHRzIHRvIGFuIGVtcHR5IG9iamVjdCBpbnN0ZWFkIG9mIG51bGwgdG9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZHVjZSB0aGUgb3B0cyBjaGVja2luZyBsb2dpYyByZXF1aXJlZCBpbnNpZGUgdGhlIHJlZGlyZWN0LiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuUmVkaXJlY3RzW3Byb3BlcnRpZXNNYXBdLmNhbGwoZWxlbWVudCwgZWxlbWVudCwgb3B0cyB8fCB7fSwgZWxlbWVudEluZGV4LCBlbGVtZW50c0xlbmd0aCwgZWxlbWVudHMsIHByb21pc2VEYXRhLnByb21pc2UgPyBwcm9taXNlRGF0YSA6IHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIFNpbmNlIHRoZSBhbmltYXRpb24gbG9naWMgcmVzaWRlcyB3aXRoaW4gdGhlIHJlZGlyZWN0J3Mgb3duIGNvZGUsIGFib3J0IHRoZSByZW1haW5kZXIgb2YgdGhpcyBjYWxsLlxuICAgICAgICAgICAgICAgICAgICAgICAoVGhlIHBlcmZvcm1hbmNlIG92ZXJoZWFkIHVwIHRvIHRoaXMgcG9pbnQgaXMgdmlydHVhbGx5IG5vbi1leGlzdGFudC4pICovXG4gICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFRoZSBqUXVlcnkgY2FsbCBjaGFpbiBpcyBrZXB0IGludGFjdCBieSByZXR1cm5pbmcgdGhlIGNvbXBsZXRlIGVsZW1lbnQgc2V0LiAqL1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2V0Q2hhaW4oKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYWJvcnRFcnJvciA9IFwiVmVsb2NpdHk6IEZpcnN0IGFyZ3VtZW50IChcIiArIHByb3BlcnRpZXNNYXAgKyBcIikgd2FzIG5vdCBhIHByb3BlcnR5IG1hcCwgYSBrbm93biBhY3Rpb24sIG9yIGEgcmVnaXN0ZXJlZCByZWRpcmVjdC4gQWJvcnRpbmcuXCI7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb21pc2VEYXRhLnByb21pc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VEYXRhLnJlamVjdGVyKG5ldyBFcnJvcihhYm9ydEVycm9yKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhhYm9ydEVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXRDaGFpbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgQ2FsbC1XaWRlIFZhcmlhYmxlc1xuICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAvKiBBIGNvbnRhaW5lciBmb3IgQ1NTIHVuaXQgY29udmVyc2lvbiByYXRpb3MgKGUuZy4gJSwgcmVtLCBhbmQgZW0gPT0+IHB4KSB0aGF0IGlzIHVzZWQgdG8gY2FjaGUgcmF0aW9zIGFjcm9zcyBhbGwgZWxlbWVudHNcbiAgICAgICAgICAgYmVpbmcgYW5pbWF0ZWQgaW4gYSBzaW5nbGUgVmVsb2NpdHkgY2FsbC4gQ2FsY3VsYXRpbmcgdW5pdCByYXRpb3MgbmVjZXNzaXRhdGVzIERPTSBxdWVyeWluZyBhbmQgdXBkYXRpbmcsIGFuZCBpcyB0aGVyZWZvcmVcbiAgICAgICAgICAgYXZvaWRlZCAodmlhIGNhY2hpbmcpIHdoZXJldmVyIHBvc3NpYmxlLiBUaGlzIGNvbnRhaW5lciBpcyBjYWxsLXdpZGUgaW5zdGVhZCBvZiBwYWdlLXdpZGUgdG8gYXZvaWQgdGhlIHJpc2sgb2YgdXNpbmcgc3RhbGVcbiAgICAgICAgICAgY29udmVyc2lvbiBtZXRyaWNzIGFjcm9zcyBWZWxvY2l0eSBhbmltYXRpb25zIHRoYXQgYXJlIG5vdCBpbW1lZGlhdGVseSBjb25zZWN1dGl2ZWx5IGNoYWluZWQuICovXG4gICAgICAgIHZhciBjYWxsVW5pdENvbnZlcnNpb25EYXRhID0ge1xuICAgICAgICAgICAgICAgIGxhc3RQYXJlbnQ6IG51bGwsXG4gICAgICAgICAgICAgICAgbGFzdFBvc2l0aW9uOiBudWxsLFxuICAgICAgICAgICAgICAgIGxhc3RGb250U2l6ZTogbnVsbCxcbiAgICAgICAgICAgICAgICBsYXN0UGVyY2VudFRvUHhXaWR0aDogbnVsbCxcbiAgICAgICAgICAgICAgICBsYXN0UGVyY2VudFRvUHhIZWlnaHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgbGFzdEVtVG9QeDogbnVsbCxcbiAgICAgICAgICAgICAgICByZW1Ub1B4OiBudWxsLFxuICAgICAgICAgICAgICAgIHZ3VG9QeDogbnVsbCxcbiAgICAgICAgICAgICAgICB2aFRvUHg6IG51bGxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgLyogQSBjb250YWluZXIgZm9yIGFsbCB0aGUgZW5zdWluZyB0d2VlbiBkYXRhIGFuZCBtZXRhZGF0YSBhc3NvY2lhdGVkIHdpdGggdGhpcyBjYWxsLiBUaGlzIGNvbnRhaW5lciBnZXRzIHB1c2hlZCB0byB0aGUgcGFnZS13aWRlXG4gICAgICAgICAgIFZlbG9jaXR5LlN0YXRlLmNhbGxzIGFycmF5IHRoYXQgaXMgcHJvY2Vzc2VkIGR1cmluZyBhbmltYXRpb24gdGlja2luZy4gKi9cbiAgICAgICAgdmFyIGNhbGwgPSBbXTtcblxuICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgIEVsZW1lbnQgUHJvY2Vzc2luZ1xuICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgLyogRWxlbWVudCBwcm9jZXNzaW5nIGNvbnNpc3RzIG9mIHRocmVlIHBhcnRzIC0tIGRhdGEgcHJvY2Vzc2luZyB0aGF0IGNhbm5vdCBnbyBzdGFsZSBhbmQgZGF0YSBwcm9jZXNzaW5nIHRoYXQgKmNhbiogZ28gc3RhbGUgKGkuZS4gdGhpcmQtcGFydHkgc3R5bGUgbW9kaWZpY2F0aW9ucyk6XG4gICAgICAgICAgIDEpIFByZS1RdWV1ZWluZzogRWxlbWVudC13aWRlIHZhcmlhYmxlcywgaW5jbHVkaW5nIHRoZSBlbGVtZW50J3MgZGF0YSBzdG9yYWdlLCBhcmUgaW5zdGFudGlhdGVkLiBDYWxsIG9wdGlvbnMgYXJlIHByZXBhcmVkLiBJZiB0cmlnZ2VyZWQsIHRoZSBTdG9wIGFjdGlvbiBpcyBleGVjdXRlZC5cbiAgICAgICAgICAgMikgUXVldWVpbmc6IFRoZSBsb2dpYyB0aGF0IHJ1bnMgb25jZSB0aGlzIGNhbGwgaGFzIHJlYWNoZWQgaXRzIHBvaW50IG9mIGV4ZWN1dGlvbiBpbiB0aGUgZWxlbWVudCdzICQucXVldWUoKSBzdGFjay4gTW9zdCBsb2dpYyBpcyBwbGFjZWQgaGVyZSB0byBhdm9pZCByaXNraW5nIGl0IGJlY29taW5nIHN0YWxlLlxuICAgICAgICAgICAzKSBQdXNoaW5nOiBDb25zb2xpZGF0aW9uIG9mIHRoZSB0d2VlbiBkYXRhIGZvbGxvd2VkIGJ5IGl0cyBwdXNoIG9udG8gdGhlIGdsb2JhbCBpbi1wcm9ncmVzcyBjYWxscyBjb250YWluZXIuXG4gICAgICAgICovXG5cbiAgICAgICAgZnVuY3Rpb24gcHJvY2Vzc0VsZW1lbnQgKCkge1xuXG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgUGFydCBJOiBQcmUtUXVldWVpbmdcbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgIEVsZW1lbnQtV2lkZSBWYXJpYWJsZXNcbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzLFxuICAgICAgICAgICAgICAgIC8qIFRoZSBydW50aW1lIG9wdHMgb2JqZWN0IGlzIHRoZSBleHRlbnNpb24gb2YgdGhlIGN1cnJlbnQgY2FsbCdzIG9wdGlvbnMgYW5kIFZlbG9jaXR5J3MgcGFnZS13aWRlIG9wdGlvbiBkZWZhdWx0cy4gKi9cbiAgICAgICAgICAgICAgICBvcHRzID0gJC5leHRlbmQoe30sIFZlbG9jaXR5LmRlZmF1bHRzLCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICAvKiBBIGNvbnRhaW5lciBmb3IgdGhlIHByb2Nlc3NlZCBkYXRhIGFzc29jaWF0ZWQgd2l0aCBlYWNoIHByb3BlcnR5IGluIHRoZSBwcm9wZXJ0eU1hcC5cbiAgICAgICAgICAgICAgICAgICAoRWFjaCBwcm9wZXJ0eSBpbiB0aGUgbWFwIHByb2R1Y2VzIGl0cyBvd24gXCJ0d2VlblwiLikgKi9cbiAgICAgICAgICAgICAgICB0d2VlbnNDb250YWluZXIgPSB7fSxcbiAgICAgICAgICAgICAgICBlbGVtZW50VW5pdENvbnZlcnNpb25EYXRhO1xuXG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICBFbGVtZW50IEluaXRcbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIFZlbG9jaXR5LmluaXQoZWxlbWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgIE9wdGlvbjogRGVsYXlcbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgLyogU2luY2UgcXVldWU6ZmFsc2UgZG9lc24ndCByZXNwZWN0IHRoZSBpdGVtJ3MgZXhpc3RpbmcgcXVldWUsIHdlIGF2b2lkIGluamVjdGluZyBpdHMgZGVsYXkgaGVyZSAoaXQncyBzZXQgbGF0ZXIgb24pLiAqL1xuICAgICAgICAgICAgLyogTm90ZTogVmVsb2NpdHkgcm9sbHMgaXRzIG93biBkZWxheSBmdW5jdGlvbiBzaW5jZSBqUXVlcnkgZG9lc24ndCBoYXZlIGEgdXRpbGl0eSBhbGlhcyBmb3IgJC5mbi5kZWxheSgpXG4gICAgICAgICAgICAgICAoYW5kIHRodXMgcmVxdWlyZXMgalF1ZXJ5IGVsZW1lbnQgY3JlYXRpb24sIHdoaWNoIHdlIGF2b2lkIHNpbmNlIGl0cyBvdmVyaGVhZCBpbmNsdWRlcyBET00gcXVlcnlpbmcpLiAqL1xuICAgICAgICAgICAgaWYgKHBhcnNlRmxvYXQob3B0cy5kZWxheSkgJiYgb3B0cy5xdWV1ZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAkLnF1ZXVlKGVsZW1lbnQsIG9wdHMucXVldWUsIGZ1bmN0aW9uKG5leHQpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogVGhpcyBpcyBhIGZsYWcgdXNlZCB0byBpbmRpY2F0ZSB0byB0aGUgdXBjb21pbmcgY29tcGxldGVDYWxsKCkgZnVuY3Rpb24gdGhhdCB0aGlzIHF1ZXVlIGVudHJ5IHdhcyBpbml0aWF0ZWQgYnkgVmVsb2NpdHkuIFNlZSBjb21wbGV0ZUNhbGwoKSBmb3IgZnVydGhlciBkZXRhaWxzLiAqL1xuICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS52ZWxvY2l0eVF1ZXVlRW50cnlGbGFnID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICAvKiBUaGUgZW5zdWluZyBxdWV1ZSBpdGVtICh3aGljaCBpcyBhc3NpZ25lZCB0byB0aGUgXCJuZXh0XCIgYXJndW1lbnQgdGhhdCAkLnF1ZXVlKCkgYXV0b21hdGljYWxseSBwYXNzZXMgaW4pIHdpbGwgYmUgdHJpZ2dlcmVkIGFmdGVyIGEgc2V0VGltZW91dCBkZWxheS5cbiAgICAgICAgICAgICAgICAgICAgICAgVGhlIHNldFRpbWVvdXQgaXMgc3RvcmVkIHNvIHRoYXQgaXQgY2FuIGJlIHN1YmplY3RlZCB0byBjbGVhclRpbWVvdXQoKSBpZiB0aGlzIGFuaW1hdGlvbiBpcyBwcmVtYXR1cmVseSBzdG9wcGVkIHZpYSBWZWxvY2l0eSdzIFwic3RvcFwiIGNvbW1hbmQuICovXG4gICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkuZGVsYXlUaW1lciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQ6IHNldFRpbWVvdXQobmV4dCwgcGFyc2VGbG9hdChvcHRzLmRlbGF5KSksXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0OiBuZXh0XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgIE9wdGlvbjogRHVyYXRpb25cbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgLyogU3VwcG9ydCBmb3IgalF1ZXJ5J3MgbmFtZWQgZHVyYXRpb25zLiAqL1xuICAgICAgICAgICAgc3dpdGNoIChvcHRzLmR1cmF0aW9uLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJmYXN0XCI6XG4gICAgICAgICAgICAgICAgICAgIG9wdHMuZHVyYXRpb24gPSAyMDA7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBcIm5vcm1hbFwiOlxuICAgICAgICAgICAgICAgICAgICBvcHRzLmR1cmF0aW9uID0gRFVSQVRJT05fREVGQVVMVDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIFwic2xvd1wiOlxuICAgICAgICAgICAgICAgICAgICBvcHRzLmR1cmF0aW9uID0gNjAwO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIC8qIFJlbW92ZSB0aGUgcG90ZW50aWFsIFwibXNcIiBzdWZmaXggYW5kIGRlZmF1bHQgdG8gMSBpZiB0aGUgdXNlciBpcyBhdHRlbXB0aW5nIHRvIHNldCBhIGR1cmF0aW9uIG9mIDAgKGluIG9yZGVyIHRvIHByb2R1Y2UgYW4gaW1tZWRpYXRlIHN0eWxlIGNoYW5nZSkuICovXG4gICAgICAgICAgICAgICAgICAgIG9wdHMuZHVyYXRpb24gPSBwYXJzZUZsb2F0KG9wdHMuZHVyYXRpb24pIHx8IDE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgIEdsb2JhbCBPcHRpb246IE1vY2tcbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgaWYgKFZlbG9jaXR5Lm1vY2sgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgLyogSW4gbW9jayBtb2RlLCBhbGwgYW5pbWF0aW9ucyBhcmUgZm9yY2VkIHRvIDFtcyBzbyB0aGF0IHRoZXkgb2NjdXIgaW1tZWRpYXRlbHkgdXBvbiB0aGUgbmV4dCByQUYgdGljay5cbiAgICAgICAgICAgICAgICAgICBBbHRlcm5hdGl2ZWx5LCBhIG11bHRpcGxpZXIgY2FuIGJlIHBhc3NlZCBpbiB0byB0aW1lIHJlbWFwIGFsbCBkZWxheXMgYW5kIGR1cmF0aW9ucy4gKi9cbiAgICAgICAgICAgICAgICBpZiAoVmVsb2NpdHkubW9jayA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBvcHRzLmR1cmF0aW9uID0gb3B0cy5kZWxheSA9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0cy5kdXJhdGlvbiAqPSBwYXJzZUZsb2F0KFZlbG9jaXR5Lm1vY2spIHx8IDE7XG4gICAgICAgICAgICAgICAgICAgIG9wdHMuZGVsYXkgKj0gcGFyc2VGbG9hdChWZWxvY2l0eS5tb2NrKSB8fCAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgIE9wdGlvbjogRWFzaW5nXG4gICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICBvcHRzLmVhc2luZyA9IGdldEVhc2luZyhvcHRzLmVhc2luZywgb3B0cy5kdXJhdGlvbik7XG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICBPcHRpb246IENhbGxiYWNrc1xuICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgLyogQ2FsbGJhY2tzIG11c3QgZnVuY3Rpb25zLiBPdGhlcndpc2UsIGRlZmF1bHQgdG8gbnVsbC4gKi9cbiAgICAgICAgICAgIGlmIChvcHRzLmJlZ2luICYmICFUeXBlLmlzRnVuY3Rpb24ob3B0cy5iZWdpbikpIHtcbiAgICAgICAgICAgICAgICBvcHRzLmJlZ2luID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9wdHMucHJvZ3Jlc3MgJiYgIVR5cGUuaXNGdW5jdGlvbihvcHRzLnByb2dyZXNzKSkge1xuICAgICAgICAgICAgICAgIG9wdHMucHJvZ3Jlc3MgPSBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob3B0cy5jb21wbGV0ZSAmJiAhVHlwZS5pc0Z1bmN0aW9uKG9wdHMuY29tcGxldGUpKSB7XG4gICAgICAgICAgICAgICAgb3B0cy5jb21wbGV0ZSA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgIE9wdGlvbjogRGlzcGxheSAmIFZpc2liaWxpdHlcbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgLyogUmVmZXIgdG8gVmVsb2NpdHkncyBkb2N1bWVudGF0aW9uIChWZWxvY2l0eUpTLm9yZy8jZGlzcGxheUFuZFZpc2liaWxpdHkpIGZvciBhIGRlc2NyaXB0aW9uIG9mIHRoZSBkaXNwbGF5IGFuZCB2aXNpYmlsaXR5IG9wdGlvbnMnIGJlaGF2aW9yLiAqL1xuICAgICAgICAgICAgLyogTm90ZTogV2Ugc3RyaWN0bHkgY2hlY2sgZm9yIHVuZGVmaW5lZCBpbnN0ZWFkIG9mIGZhbHNpbmVzcyBiZWNhdXNlIGRpc3BsYXkgYWNjZXB0cyBhbiBlbXB0eSBzdHJpbmcgdmFsdWUuICovXG4gICAgICAgICAgICBpZiAob3B0cy5kaXNwbGF5ICE9PSB1bmRlZmluZWQgJiYgb3B0cy5kaXNwbGF5ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgb3B0cy5kaXNwbGF5ID0gb3B0cy5kaXNwbGF5LnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgICAgIC8qIFVzZXJzIGNhbiBwYXNzIGluIGEgc3BlY2lhbCBcImF1dG9cIiB2YWx1ZSB0byBpbnN0cnVjdCBWZWxvY2l0eSB0byBzZXQgdGhlIGVsZW1lbnQgdG8gaXRzIGRlZmF1bHQgZGlzcGxheSB2YWx1ZS4gKi9cbiAgICAgICAgICAgICAgICBpZiAob3B0cy5kaXNwbGF5ID09PSBcImF1dG9cIikge1xuICAgICAgICAgICAgICAgICAgICBvcHRzLmRpc3BsYXkgPSBWZWxvY2l0eS5DU1MuVmFsdWVzLmdldERpc3BsYXlUeXBlKGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9wdHMudmlzaWJpbGl0eSAhPT0gdW5kZWZpbmVkICYmIG9wdHMudmlzaWJpbGl0eSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG9wdHMudmlzaWJpbGl0eSA9IG9wdHMudmlzaWJpbGl0eS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICBPcHRpb246IG1vYmlsZUhBXG4gICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAvKiBXaGVuIHNldCB0byB0cnVlLCBhbmQgaWYgdGhpcyBpcyBhIG1vYmlsZSBkZXZpY2UsIG1vYmlsZUhBIGF1dG9tYXRpY2FsbHkgZW5hYmxlcyBoYXJkd2FyZSBhY2NlbGVyYXRpb24gKHZpYSBhIG51bGwgdHJhbnNmb3JtIGhhY2spXG4gICAgICAgICAgICAgICBvbiBhbmltYXRpbmcgZWxlbWVudHMuIEhBIGlzIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudCBhdCB0aGUgY29tcGxldGlvbiBvZiBpdHMgYW5pbWF0aW9uLiAqL1xuICAgICAgICAgICAgLyogTm90ZTogQW5kcm9pZCBHaW5nZXJicmVhZCBkb2Vzbid0IHN1cHBvcnQgSEEuIElmIGEgbnVsbCB0cmFuc2Zvcm0gaGFjayAobW9iaWxlSEEpIGlzIGluIGZhY3Qgc2V0LCBpdCB3aWxsIHByZXZlbnQgb3RoZXIgdHJhbmZvcm0gc3VicHJvcGVydGllcyBmcm9tIHRha2luZyBlZmZlY3QuICovXG4gICAgICAgICAgICAvKiBOb3RlOiBZb3UgY2FuIHJlYWQgbW9yZSBhYm91dCB0aGUgdXNlIG9mIG1vYmlsZUhBIGluIFZlbG9jaXR5J3MgZG9jdW1lbnRhdGlvbjogVmVsb2NpdHlKUy5vcmcvI21vYmlsZUhBLiAqL1xuICAgICAgICAgICAgb3B0cy5tb2JpbGVIQSA9IChvcHRzLm1vYmlsZUhBICYmIFZlbG9jaXR5LlN0YXRlLmlzTW9iaWxlICYmICFWZWxvY2l0eS5TdGF0ZS5pc0dpbmdlcmJyZWFkKTtcblxuICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICBQYXJ0IElJOiBRdWV1ZWluZ1xuICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgIC8qIFdoZW4gYSBzZXQgb2YgZWxlbWVudHMgaXMgdGFyZ2V0ZWQgYnkgYSBWZWxvY2l0eSBjYWxsLCB0aGUgc2V0IGlzIGJyb2tlbiB1cCBhbmQgZWFjaCBlbGVtZW50IGhhcyB0aGUgY3VycmVudCBWZWxvY2l0eSBjYWxsIGluZGl2aWR1YWxseSBxdWV1ZWQgb250byBpdC5cbiAgICAgICAgICAgICAgIEluIHRoaXMgd2F5LCBlYWNoIGVsZW1lbnQncyBleGlzdGluZyBxdWV1ZSBpcyByZXNwZWN0ZWQ7IHNvbWUgZWxlbWVudHMgbWF5IGFscmVhZHkgYmUgYW5pbWF0aW5nIGFuZCBhY2NvcmRpbmdseSBzaG91bGQgbm90IGhhdmUgdGhpcyBjdXJyZW50IFZlbG9jaXR5IGNhbGwgdHJpZ2dlcmVkIGltbWVkaWF0ZWx5LiAqL1xuICAgICAgICAgICAgLyogSW4gZWFjaCBxdWV1ZSwgdHdlZW4gZGF0YSBpcyBwcm9jZXNzZWQgZm9yIGVhY2ggYW5pbWF0aW5nIHByb3BlcnR5IHRoZW4gcHVzaGVkIG9udG8gdGhlIGNhbGwtd2lkZSBjYWxscyBhcnJheS4gV2hlbiB0aGUgbGFzdCBlbGVtZW50IGluIHRoZSBzZXQgaGFzIGhhZCBpdHMgdHdlZW5zIHByb2Nlc3NlZCxcbiAgICAgICAgICAgICAgIHRoZSBjYWxsIGFycmF5IGlzIHB1c2hlZCB0byBWZWxvY2l0eS5TdGF0ZS5jYWxscyBmb3IgbGl2ZSBwcm9jZXNzaW5nIGJ5IHRoZSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgdGljay4gKi9cbiAgICAgICAgICAgIGZ1bmN0aW9uIGJ1aWxkUXVldWUgKG5leHQpIHtcblxuICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgT3B0aW9uOiBCZWdpblxuICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICAvKiBUaGUgYmVnaW4gY2FsbGJhY2sgaXMgZmlyZWQgb25jZSBwZXIgY2FsbCAtLSBub3Qgb25jZSBwZXIgZWxlbWVuZXQgLS0gYW5kIGlzIHBhc3NlZCB0aGUgZnVsbCByYXcgRE9NIGVsZW1lbnQgc2V0IGFzIGJvdGggaXRzIGNvbnRleHQgYW5kIGl0cyBmaXJzdCBhcmd1bWVudC4gKi9cbiAgICAgICAgICAgICAgICBpZiAob3B0cy5iZWdpbiAmJiBlbGVtZW50c0luZGV4ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIFdlIHRocm93IGNhbGxiYWNrcyBpbiBhIHNldFRpbWVvdXQgc28gdGhhdCB0aHJvd24gZXJyb3JzIGRvbid0IGhhbHQgdGhlIGV4ZWN1dGlvbiBvZiBWZWxvY2l0eSBpdHNlbGYuICovXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmJlZ2luLmNhbGwoZWxlbWVudHMsIGVsZW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHRocm93IGVycm9yOyB9LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgIFR3ZWVuIERhdGEgQ29uc3RydWN0aW9uIChmb3IgU2Nyb2xsKVxuICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgLyogTm90ZTogSW4gb3JkZXIgdG8gYmUgc3ViamVjdGVkIHRvIGNoYWluaW5nIGFuZCBhbmltYXRpb24gb3B0aW9ucywgc2Nyb2xsJ3MgdHdlZW5pbmcgaXMgcm91dGVkIHRocm91Z2ggVmVsb2NpdHkgYXMgaWYgaXQgd2VyZSBhIHN0YW5kYXJkIENTUyBwcm9wZXJ0eSBhbmltYXRpb24uICovXG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbiA9PT0gXCJzY3JvbGxcIikge1xuICAgICAgICAgICAgICAgICAgICAvKiBUaGUgc2Nyb2xsIGFjdGlvbiB1bmlxdWVseSB0YWtlcyBhbiBvcHRpb25hbCBcIm9mZnNldFwiIG9wdGlvbiAtLSBzcGVjaWZpZWQgaW4gcGl4ZWxzIC0tIHRoYXQgb2Zmc2V0cyB0aGUgdGFyZ2V0ZWQgc2Nyb2xsIHBvc2l0aW9uLiAqL1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2Nyb2xsRGlyZWN0aW9uID0gKC9eeCQvaS50ZXN0KG9wdHMuYXhpcykgPyBcIkxlZnRcIiA6IFwiVG9wXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0ID0gcGFyc2VGbG9hdChvcHRzLm9mZnNldCkgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uQ3VycmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uQ3VycmVudEFsdGVybmF0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uRW5kO1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIFNjcm9sbCBhbHNvIHVuaXF1ZWx5IHRha2VzIGFuIG9wdGlvbmFsIFwiY29udGFpbmVyXCIgb3B0aW9uLCB3aGljaCBpbmRpY2F0ZXMgdGhlIHBhcmVudCBlbGVtZW50IHRoYXQgc2hvdWxkIGJlIHNjcm9sbGVkIC0tXG4gICAgICAgICAgICAgICAgICAgICAgIGFzIG9wcG9zZWQgdG8gdGhlIGJyb3dzZXIgd2luZG93IGl0c2VsZi4gVGhpcyBpcyB1c2VmdWwgZm9yIHNjcm9sbGluZyB0b3dhcmQgYW4gZWxlbWVudCB0aGF0J3MgaW5zaWRlIGFuIG92ZXJmbG93aW5nIHBhcmVudCBlbGVtZW50LiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5jb250YWluZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIEVuc3VyZSB0aGF0IGVpdGhlciBhIGpRdWVyeSBvYmplY3Qgb3IgYSByYXcgRE9NIGVsZW1lbnQgd2FzIHBhc3NlZCBpbi4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChUeXBlLmlzV3JhcHBlZChvcHRzLmNvbnRhaW5lcikgfHwgVHlwZS5pc05vZGUob3B0cy5jb250YWluZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRXh0cmFjdCB0aGUgcmF3IERPTSBlbGVtZW50IGZyb20gdGhlIGpRdWVyeSB3cmFwcGVyLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMuY29udGFpbmVyID0gb3B0cy5jb250YWluZXJbMF0gfHwgb3B0cy5jb250YWluZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogVW5saWtlIG90aGVyIHByb3BlcnRpZXMgaW4gVmVsb2NpdHksIHRoZSBicm93c2VyJ3Mgc2Nyb2xsIHBvc2l0aW9uIGlzIG5ldmVyIGNhY2hlZCBzaW5jZSBpdCBzbyBmcmVxdWVudGx5IGNoYW5nZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZHVlIHRvIHRoZSB1c2VyJ3MgbmF0dXJhbCBpbnRlcmFjdGlvbiB3aXRoIHRoZSBwYWdlKS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbkN1cnJlbnQgPSBvcHRzLmNvbnRhaW5lcltcInNjcm9sbFwiICsgc2Nyb2xsRGlyZWN0aW9uXTsgLyogR0VUICovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiAkLnBvc2l0aW9uKCkgdmFsdWVzIGFyZSByZWxhdGl2ZSB0byB0aGUgY29udGFpbmVyJ3MgY3VycmVudGx5IHZpZXdhYmxlIGFyZWEgKHdpdGhvdXQgdGFraW5nIGludG8gYWNjb3VudCB0aGUgY29udGFpbmVyJ3MgdHJ1ZSBkaW1lbnNpb25zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLS0gc2F5LCBmb3IgZXhhbXBsZSwgaWYgdGhlIGNvbnRhaW5lciB3YXMgbm90IG92ZXJmbG93aW5nKS4gVGh1cywgdGhlIHNjcm9sbCBlbmQgdmFsdWUgaXMgdGhlIHN1bSBvZiB0aGUgY2hpbGQgZWxlbWVudCdzIHBvc2l0aW9uICphbmQqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIHNjcm9sbCBjb250YWluZXIncyBjdXJyZW50IHNjcm9sbCBwb3NpdGlvbi4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbkVuZCA9IChzY3JvbGxQb3NpdGlvbkN1cnJlbnQgKyAkKGVsZW1lbnQpLnBvc2l0aW9uKClbc2Nyb2xsRGlyZWN0aW9uLnRvTG93ZXJDYXNlKCldKSArIHNjcm9sbE9mZnNldDsgLyogR0VUICovXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBhIHZhbHVlIG90aGVyIHRoYW4gYSBqUXVlcnkgb2JqZWN0IG9yIGEgcmF3IERPTSBlbGVtZW50IHdhcyBwYXNzZWQgaW4sIGRlZmF1bHQgdG8gbnVsbCBzbyB0aGF0IHRoaXMgb3B0aW9uIGlzIGlnbm9yZWQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMuY29udGFpbmVyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSB3aW5kb3cgaXRzZWxmIGlzIGJlaW5nIHNjcm9sbGVkIC0tIG5vdCBhIGNvbnRhaW5pbmcgZWxlbWVudCAtLSBwZXJmb3JtIGEgbGl2ZSBzY3JvbGwgcG9zaXRpb24gbG9va3VwIHVzaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgYXBwcm9wcmlhdGUgY2FjaGVkIHByb3BlcnR5IG5hbWVzICh3aGljaCBkaWZmZXIgYmFzZWQgb24gYnJvd3NlciB0eXBlKS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uQ3VycmVudCA9IFZlbG9jaXR5LlN0YXRlLnNjcm9sbEFuY2hvcltWZWxvY2l0eS5TdGF0ZVtcInNjcm9sbFByb3BlcnR5XCIgKyBzY3JvbGxEaXJlY3Rpb25dXTsgLyogR0VUICovXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBXaGVuIHNjcm9sbGluZyB0aGUgYnJvd3NlciB3aW5kb3csIGNhY2hlIHRoZSBhbHRlcm5hdGUgYXhpcydzIGN1cnJlbnQgdmFsdWUgc2luY2Ugd2luZG93LnNjcm9sbFRvKCkgZG9lc24ndCBsZXQgdXMgY2hhbmdlIG9ubHkgb25lIHZhbHVlIGF0IGEgdGltZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uQ3VycmVudEFsdGVybmF0ZSA9IFZlbG9jaXR5LlN0YXRlLnNjcm9sbEFuY2hvcltWZWxvY2l0eS5TdGF0ZVtcInNjcm9sbFByb3BlcnR5XCIgKyAoc2Nyb2xsRGlyZWN0aW9uID09PSBcIkxlZnRcIiA/IFwiVG9wXCIgOiBcIkxlZnRcIildXTsgLyogR0VUICovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFVubGlrZSAkLnBvc2l0aW9uKCksICQub2Zmc2V0KCkgdmFsdWVzIGFyZSByZWxhdGl2ZSB0byB0aGUgYnJvd3NlciB3aW5kb3cncyB0cnVlIGRpbWVuc2lvbnMgLS0gbm90IG1lcmVseSBpdHMgY3VycmVudGx5IHZpZXdhYmxlIGFyZWEgLS1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZCB0aGVyZWZvcmUgZW5kIHZhbHVlcyBkbyBub3QgbmVlZCB0byBiZSBjb21wb3VuZGVkIG9udG8gY3VycmVudCB2YWx1ZXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbkVuZCA9ICQoZWxlbWVudCkub2Zmc2V0KClbc2Nyb2xsRGlyZWN0aW9uLnRvTG93ZXJDYXNlKCldICsgc2Nyb2xsT2Zmc2V0OyAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8qIFNpbmNlIHRoZXJlJ3Mgb25seSBvbmUgZm9ybWF0IHRoYXQgc2Nyb2xsJ3MgYXNzb2NpYXRlZCB0d2VlbnNDb250YWluZXIgY2FuIHRha2UsIHdlIGNyZWF0ZSBpdCBtYW51YWxseS4gKi9cbiAgICAgICAgICAgICAgICAgICAgdHdlZW5zQ29udGFpbmVyID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWU6IHNjcm9sbFBvc2l0aW9uQ3VycmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWU6IHNjcm9sbFBvc2l0aW9uQ3VycmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZTogc2Nyb2xsUG9zaXRpb25FbmQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFR5cGU6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWFzaW5nOiBvcHRzLmVhc2luZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxEYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lcjogb3B0cy5jb250YWluZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogc2Nyb2xsRGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbHRlcm5hdGVWYWx1ZTogc2Nyb2xsUG9zaXRpb25DdXJyZW50QWx0ZXJuYXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6IGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoVmVsb2NpdHkuZGVidWcpIGNvbnNvbGUubG9nKFwidHdlZW5zQ29udGFpbmVyIChzY3JvbGwpOiBcIiwgdHdlZW5zQ29udGFpbmVyLnNjcm9sbCwgZWxlbWVudCk7XG5cbiAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgVHdlZW4gRGF0YSBDb25zdHJ1Y3Rpb24gKGZvciBSZXZlcnNlKVxuICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgIC8qIFJldmVyc2UgYWN0cyBsaWtlIGEgXCJzdGFydFwiIGFjdGlvbiBpbiB0aGF0IGEgcHJvcGVydHkgbWFwIGlzIGFuaW1hdGVkIHRvd2FyZC4gVGhlIG9ubHkgZGlmZmVyZW5jZSBpc1xuICAgICAgICAgICAgICAgICAgIHRoYXQgdGhlIHByb3BlcnR5IG1hcCB1c2VkIGZvciByZXZlcnNlIGlzIHRoZSBpbnZlcnNlIG9mIHRoZSBtYXAgdXNlZCBpbiB0aGUgcHJldmlvdXMgY2FsbC4gVGh1cywgd2UgbWFuaXB1bGF0ZVxuICAgICAgICAgICAgICAgICAgIHRoZSBwcmV2aW91cyBjYWxsIHRvIGNvbnN0cnVjdCBvdXIgbmV3IG1hcDogdXNlIHRoZSBwcmV2aW91cyBtYXAncyBlbmQgdmFsdWVzIGFzIG91ciBuZXcgbWFwJ3Mgc3RhcnQgdmFsdWVzLiBDb3B5IG92ZXIgYWxsIG90aGVyIGRhdGEuICovXG4gICAgICAgICAgICAgICAgLyogTm90ZTogUmV2ZXJzZSBjYW4gYmUgZGlyZWN0bHkgY2FsbGVkIHZpYSB0aGUgXCJyZXZlcnNlXCIgcGFyYW1ldGVyLCBvciBpdCBjYW4gYmUgaW5kaXJlY3RseSB0cmlnZ2VyZWQgdmlhIHRoZSBsb29wIG9wdGlvbi4gKExvb3BzIGFyZSBjb21wb3NlZCBvZiBtdWx0aXBsZSByZXZlcnNlcy4pICovXG4gICAgICAgICAgICAgICAgLyogTm90ZTogUmV2ZXJzZSBjYWxscyBkbyBub3QgbmVlZCB0byBiZSBjb25zZWN1dGl2ZWx5IGNoYWluZWQgb250byBhIGN1cnJlbnRseS1hbmltYXRpbmcgZWxlbWVudCBpbiBvcmRlciB0byBvcGVyYXRlIG9uIGNhY2hlZCB2YWx1ZXM7XG4gICAgICAgICAgICAgICAgICAgdGhlcmUgaXMgbm8gaGFybSB0byByZXZlcnNlIGJlaW5nIGNhbGxlZCBvbiBhIHBvdGVudGlhbGx5IHN0YWxlIGRhdGEgY2FjaGUgc2luY2UgcmV2ZXJzZSdzIGJlaGF2aW9yIGlzIHNpbXBseSBkZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgYXMgcmV2ZXJ0aW5nIHRvIHRoZSBlbGVtZW50J3MgdmFsdWVzIGFzIHRoZXkgd2VyZSBwcmlvciB0byB0aGUgcHJldmlvdXMgKlZlbG9jaXR5KiBjYWxsLiAqL1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBcInJldmVyc2VcIikge1xuICAgICAgICAgICAgICAgICAgICAvKiBBYm9ydCBpZiB0aGVyZSBpcyBubyBwcmlvciBhbmltYXRpb24gZGF0YSB0byByZXZlcnNlIHRvLiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAoIURhdGEoZWxlbWVudCkudHdlZW5zQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBEZXF1ZXVlIHRoZSBlbGVtZW50IHNvIHRoYXQgdGhpcyBxdWV1ZSBlbnRyeSByZWxlYXNlcyBpdHNlbGYgaW1tZWRpYXRlbHksIGFsbG93aW5nIHN1YnNlcXVlbnQgcXVldWUgZW50cmllcyB0byBydW4uICovXG4gICAgICAgICAgICAgICAgICAgICAgICAkLmRlcXVldWUoZWxlbWVudCwgb3B0cy5xdWV1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIE9wdGlvbnMgUGFyc2luZ1xuICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgZWxlbWVudCB3YXMgaGlkZGVuIHZpYSB0aGUgZGlzcGxheSBvcHRpb24gaW4gdGhlIHByZXZpb3VzIGNhbGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICByZXZlcnQgZGlzcGxheSB0byBcImF1dG9cIiBwcmlvciB0byByZXZlcnNhbCBzbyB0aGF0IHRoZSBlbGVtZW50IGlzIHZpc2libGUgYWdhaW4uICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KS5vcHRzLmRpc3BsYXkgPT09IFwibm9uZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5vcHRzLmRpc3BsYXkgPSBcImF1dG9cIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkub3B0cy52aXNpYmlsaXR5ID09PSBcImhpZGRlblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5vcHRzLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGxvb3Agb3B0aW9uIHdhcyBzZXQgaW4gdGhlIHByZXZpb3VzIGNhbGwsIGRpc2FibGUgaXQgc28gdGhhdCBcInJldmVyc2VcIiBjYWxscyBhcmVuJ3QgcmVjdXJzaXZlbHkgZ2VuZXJhdGVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgRnVydGhlciwgcmVtb3ZlIHRoZSBwcmV2aW91cyBjYWxsJ3MgY2FsbGJhY2sgb3B0aW9uczsgdHlwaWNhbGx5LCB1c2VycyBkbyBub3Qgd2FudCB0aGVzZSB0byBiZSByZWZpcmVkLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5vcHRzLmxvb3AgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkub3B0cy5iZWdpbiA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLm9wdHMuY29tcGxldGUgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSB3ZSdyZSBleHRlbmRpbmcgYW4gb3B0cyBvYmplY3QgdGhhdCBoYXMgYWxyZWFkeSBiZWVuIGV4dGVuZGVkIHdpdGggdGhlIGRlZmF1bHRzIG9wdGlvbnMgb2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgd2UgcmVtb3ZlIG5vbi1leHBsaWNpdGx5LWRlZmluZWQgcHJvcGVydGllcyB0aGF0IGFyZSBhdXRvLWFzc2lnbmVkIHZhbHVlcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5lYXNpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgb3B0cy5lYXNpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5kdXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBvcHRzLmR1cmF0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBUaGUgb3B0cyBvYmplY3QgdXNlZCBmb3IgcmV2ZXJzYWwgaXMgYW4gZXh0ZW5zaW9uIG9mIHRoZSBvcHRpb25zIG9iamVjdCBvcHRpb25hbGx5IHBhc3NlZCBpbnRvIHRoaXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldmVyc2UgY2FsbCBwbHVzIHRoZSBvcHRpb25zIHVzZWQgaW4gdGhlIHByZXZpb3VzIFZlbG9jaXR5IGNhbGwuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRzID0gJC5leHRlbmQoe30sIERhdGEoZWxlbWVudCkub3B0cywgb3B0cyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBUd2VlbnMgQ29udGFpbmVyIFJlY29uc3RydWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBDcmVhdGUgYSBkZWVweSBjb3B5IChpbmRpY2F0ZWQgdmlhIHRoZSB0cnVlIGZsYWcpIG9mIHRoZSBwcmV2aW91cyBjYWxsJ3MgdHdlZW5zQ29udGFpbmVyLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RUd2VlbnNDb250YWluZXIgPSAkLmV4dGVuZCh0cnVlLCB7fSwgRGF0YShlbGVtZW50KS50d2VlbnNDb250YWluZXIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBNYW5pcHVsYXRlIHRoZSBwcmV2aW91cyB0d2VlbnNDb250YWluZXIgYnkgcmVwbGFjaW5nIGl0cyBlbmQgdmFsdWVzIGFuZCBjdXJyZW50VmFsdWVzIHdpdGggaXRzIHN0YXJ0IHZhbHVlcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGxhc3RUd2VlbiBpbiBsYXN0VHdlZW5zQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSW4gYWRkaXRpb24gdG8gdHdlZW4gZGF0YSwgdHdlZW5zQ29udGFpbmVycyBjb250YWluIGFuIGVsZW1lbnQgcHJvcGVydHkgdGhhdCB3ZSBpZ25vcmUgaGVyZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobGFzdFR3ZWVuICE9PSBcImVsZW1lbnRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdFN0YXJ0VmFsdWUgPSBsYXN0VHdlZW5zQ29udGFpbmVyW2xhc3RUd2Vlbl0uc3RhcnRWYWx1ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0VHdlZW5zQ29udGFpbmVyW2xhc3RUd2Vlbl0uc3RhcnRWYWx1ZSA9IGxhc3RUd2VlbnNDb250YWluZXJbbGFzdFR3ZWVuXS5jdXJyZW50VmFsdWUgPSBsYXN0VHdlZW5zQ29udGFpbmVyW2xhc3RUd2Vlbl0uZW5kVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RUd2VlbnNDb250YWluZXJbbGFzdFR3ZWVuXS5lbmRWYWx1ZSA9IGxhc3RTdGFydFZhbHVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEVhc2luZyBpcyB0aGUgb25seSBvcHRpb24gdGhhdCBlbWJlZHMgaW50byB0aGUgaW5kaXZpZHVhbCB0d2VlbiBkYXRhIChzaW5jZSBpdCBjYW4gYmUgZGVmaW5lZCBvbiBhIHBlci1wcm9wZXJ0eSBiYXNpcykuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFjY29yZGluZ2x5LCBldmVyeSBwcm9wZXJ0eSdzIGVhc2luZyB2YWx1ZSBtdXN0IGJlIHVwZGF0ZWQgd2hlbiBhbiBvcHRpb25zIG9iamVjdCBpcyBwYXNzZWQgaW4gd2l0aCBhIHJldmVyc2UgY2FsbC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVGhlIHNpZGUgZWZmZWN0IG9mIHRoaXMgZXh0ZW5zaWJpbGl0eSBpcyB0aGF0IGFsbCBwZXItcHJvcGVydHkgZWFzaW5nIHZhbHVlcyBhcmUgZm9yY2VmdWxseSByZXNldCB0byB0aGUgbmV3IHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIVR5cGUuaXNFbXB0eU9iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFR3ZWVuc0NvbnRhaW5lcltsYXN0VHdlZW5dLmVhc2luZyA9IG9wdHMuZWFzaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFZlbG9jaXR5LmRlYnVnKSBjb25zb2xlLmxvZyhcInJldmVyc2UgdHdlZW5zQ29udGFpbmVyIChcIiArIGxhc3RUd2VlbiArIFwiKTogXCIgKyBKU09OLnN0cmluZ2lmeShsYXN0VHdlZW5zQ29udGFpbmVyW2xhc3RUd2Vlbl0pLCBlbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuc0NvbnRhaW5lciA9IGxhc3RUd2VlbnNDb250YWluZXI7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgIFR3ZWVuIERhdGEgQ29uc3RydWN0aW9uIChmb3IgU3RhcnQpXG4gICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJzdGFydFwiKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgIFZhbHVlIFRyYW5zZmVycmluZ1xuICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIElmIHRoaXMgcXVldWUgZW50cnkgZm9sbG93cyBhIHByZXZpb3VzIFZlbG9jaXR5LWluaXRpYXRlZCBxdWV1ZSBlbnRyeSAqYW5kKiBpZiB0aGlzIGVudHJ5IHdhcyBjcmVhdGVkXG4gICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIHRoZSBlbGVtZW50IHdhcyBpbiB0aGUgcHJvY2VzcyBvZiBiZWluZyBhbmltYXRlZCBieSBWZWxvY2l0eSwgdGhlbiB0aGlzIGN1cnJlbnQgY2FsbCBpcyBzYWZlIHRvIHVzZVxuICAgICAgICAgICAgICAgICAgICAgICB0aGUgZW5kIHZhbHVlcyBmcm9tIHRoZSBwcmlvciBjYWxsIGFzIGl0cyBzdGFydCB2YWx1ZXMuIFZlbG9jaXR5IGF0dGVtcHRzIHRvIHBlcmZvcm0gdGhpcyB2YWx1ZSB0cmFuc2ZlclxuICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzIHdoZW5ldmVyIHBvc3NpYmxlIGluIG9yZGVyIHRvIGF2b2lkIHJlcXVlcnlpbmcgdGhlIERPTS4gKi9cbiAgICAgICAgICAgICAgICAgICAgLyogSWYgdmFsdWVzIGFyZW4ndCB0cmFuc2ZlcnJlZCBmcm9tIGEgcHJpb3IgY2FsbCBhbmQgc3RhcnQgdmFsdWVzIHdlcmUgbm90IGZvcmNlZmVkIGJ5IHRoZSB1c2VyIChtb3JlIG9uIHRoaXMgYmVsb3cpLFxuICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHRoZSBET00gaXMgcXVlcmllZCBmb3IgdGhlIGVsZW1lbnQncyBjdXJyZW50IHZhbHVlcyBhcyBhIGxhc3QgcmVzb3J0LiAqL1xuICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBDb252ZXJzZWx5LCBhbmltYXRpb24gcmV2ZXJzYWwgKGFuZCBsb29waW5nKSAqYWx3YXlzKiBwZXJmb3JtIGludGVyLWNhbGwgdmFsdWUgdHJhbnNmZXJzOyB0aGV5IG5ldmVyIHJlcXVlcnkgdGhlIERPTS4gKi9cbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RUd2VlbnNDb250YWluZXI7XG5cbiAgICAgICAgICAgICAgICAgICAgLyogVGhlIHBlci1lbGVtZW50IGlzQW5pbWF0aW5nIGZsYWcgaXMgdXNlZCB0byBpbmRpY2F0ZSB3aGV0aGVyIGl0J3Mgc2FmZSAoaS5lLiB0aGUgZGF0YSBpc24ndCBzdGFsZSlcbiAgICAgICAgICAgICAgICAgICAgICAgdG8gdHJhbnNmZXIgb3ZlciBlbmQgdmFsdWVzIHRvIHVzZSBhcyBzdGFydCB2YWx1ZXMuIElmIGl0J3Mgc2V0IHRvIHRydWUgYW5kIHRoZXJlIGlzIGEgcHJldmlvdXNcbiAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkgY2FsbCB0byBwdWxsIHZhbHVlcyBmcm9tLCBkbyBzby4gKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkudHdlZW5zQ29udGFpbmVyICYmIERhdGEoZWxlbWVudCkuaXNBbmltYXRpbmcgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RUd2VlbnNDb250YWluZXIgPSBEYXRhKGVsZW1lbnQpLnR3ZWVuc0NvbnRhaW5lcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgVHdlZW4gRGF0YSBDYWxjdWxhdGlvblxuICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICAgICAgLyogVGhpcyBmdW5jdGlvbiBwYXJzZXMgcHJvcGVydHkgZGF0YSBhbmQgZGVmYXVsdHMgZW5kVmFsdWUsIGVhc2luZywgYW5kIHN0YXJ0VmFsdWUgYXMgYXBwcm9wcmlhdGUuICovXG4gICAgICAgICAgICAgICAgICAgIC8qIFByb3BlcnR5IG1hcCB2YWx1ZXMgY2FuIGVpdGhlciB0YWtlIHRoZSBmb3JtIG9mIDEpIGEgc2luZ2xlIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgZW5kIHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICBvciAyKSBhbiBhcnJheSBpbiB0aGUgZm9ybSBvZiBbIGVuZFZhbHVlLCBbLCBlYXNpbmddIFssIHN0YXJ0VmFsdWVdIF0uXG4gICAgICAgICAgICAgICAgICAgICAgIFRoZSBvcHRpb25hbCB0aGlyZCBwYXJhbWV0ZXIgaXMgYSBmb3JjZWZlZCBzdGFydFZhbHVlIHRvIGJlIHVzZWQgaW5zdGVhZCBvZiBxdWVyeWluZyB0aGUgRE9NIGZvclxuICAgICAgICAgICAgICAgICAgICAgICB0aGUgZWxlbWVudCdzIGN1cnJlbnQgdmFsdWUuIFJlYWQgVmVsb2NpdHkncyBkb2NtZW50YXRpb24gdG8gbGVhcm4gbW9yZSBhYm91dCBmb3JjZWZlZWRpbmc6IFZlbG9jaXR5SlMub3JnLyNmb3JjZWZlZWRpbmcgKi9cbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gcGFyc2VQcm9wZXJ0eVZhbHVlICh2YWx1ZURhdGEsIHNraXBSZXNvbHZpbmdFYXNpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbmRWYWx1ZSA9IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlYXNpbmcgPSB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogSGFuZGxlIHRoZSBhcnJheSBmb3JtYXQsIHdoaWNoIGNhbiBiZSBzdHJ1Y3R1cmVkIGFzIG9uZSBvZiB0aHJlZSBwb3RlbnRpYWwgb3ZlcmxvYWRzOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgQSkgWyBlbmRWYWx1ZSwgZWFzaW5nLCBzdGFydFZhbHVlIF0sIEIpIFsgZW5kVmFsdWUsIGVhc2luZyBdLCBvciBDKSBbIGVuZFZhbHVlLCBzdGFydFZhbHVlIF0gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChUeXBlLmlzQXJyYXkodmFsdWVEYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGVuZFZhbHVlIGlzIGFsd2F5cyB0aGUgZmlyc3QgaXRlbSBpbiB0aGUgYXJyYXkuIERvbid0IGJvdGhlciB2YWxpZGF0aW5nIGVuZFZhbHVlJ3MgdmFsdWUgbm93XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luY2UgdGhlIGVuc3VpbmcgcHJvcGVydHkgY3ljbGluZyBsb2dpYyBkb2VzIHRoYXQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSB2YWx1ZURhdGFbMF07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUd28taXRlbSBhcnJheSBmb3JtYXQ6IElmIHRoZSBzZWNvbmQgaXRlbSBpcyBhIG51bWJlciwgZnVuY3Rpb24sIG9yIGhleCBzdHJpbmcsIHRyZWF0IGl0IGFzIGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydCB2YWx1ZSBzaW5jZSBlYXNpbmdzIGNhbiBvbmx5IGJlIG5vbi1oZXggc3RyaW5ncyBvciBhcnJheXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCghVHlwZS5pc0FycmF5KHZhbHVlRGF0YVsxXSkgJiYgL15bXFxkLV0vLnRlc3QodmFsdWVEYXRhWzFdKSkgfHwgVHlwZS5pc0Z1bmN0aW9uKHZhbHVlRGF0YVsxXSkgfHwgQ1NTLlJlZ0V4LmlzSGV4LnRlc3QodmFsdWVEYXRhWzFdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gdmFsdWVEYXRhWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFR3byBvciB0aHJlZS1pdGVtIGFycmF5OiBJZiB0aGUgc2Vjb25kIGl0ZW0gaXMgYSBub24taGV4IHN0cmluZyBvciBhbiBhcnJheSwgdHJlYXQgaXQgYXMgYW4gZWFzaW5nLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoKFR5cGUuaXNTdHJpbmcodmFsdWVEYXRhWzFdKSAmJiAhQ1NTLlJlZ0V4LmlzSGV4LnRlc3QodmFsdWVEYXRhWzFdKSkgfHwgVHlwZS5pc0FycmF5KHZhbHVlRGF0YVsxXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWFzaW5nID0gc2tpcFJlc29sdmluZ0Vhc2luZyA/IHZhbHVlRGF0YVsxXSA6IGdldEVhc2luZyh2YWx1ZURhdGFbMV0sIG9wdHMuZHVyYXRpb24pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIERvbid0IGJvdGhlciB2YWxpZGF0aW5nIHN0YXJ0VmFsdWUncyB2YWx1ZSBub3cgc2luY2UgdGhlIGVuc3VpbmcgcHJvcGVydHkgY3ljbGluZyBsb2dpYyBpbmhlcmVudGx5IGRvZXMgdGhhdC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlRGF0YVsyXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gdmFsdWVEYXRhWzJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLyogSGFuZGxlIHRoZSBzaW5nbGUtdmFsdWUgZm9ybWF0LiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IHZhbHVlRGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogRGVmYXVsdCB0byB0aGUgY2FsbCdzIGVhc2luZyBpZiBhIHBlci1wcm9wZXJ0eSBlYXNpbmcgdHlwZSB3YXMgbm90IGRlZmluZWQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXNraXBSZXNvbHZpbmdFYXNpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlYXNpbmcgPSBlYXNpbmcgfHwgb3B0cy5lYXNpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIGZ1bmN0aW9ucyB3ZXJlIHBhc3NlZCBpbiBhcyB2YWx1ZXMsIHBhc3MgdGhlIGZ1bmN0aW9uIHRoZSBjdXJyZW50IGVsZW1lbnQgYXMgaXRzIGNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBwbHVzIHRoZSBlbGVtZW50J3MgaW5kZXggYW5kIHRoZSBlbGVtZW50IHNldCdzIHNpemUgYXMgYXJndW1lbnRzLiBUaGVuLCBhc3NpZ24gdGhlIHJldHVybmVkIHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFR5cGUuaXNGdW5jdGlvbihlbmRWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IGVuZFZhbHVlLmNhbGwoZWxlbWVudCwgZWxlbWVudHNJbmRleCwgZWxlbWVudHNMZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoVHlwZS5pc0Z1bmN0aW9uKHN0YXJ0VmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IHN0YXJ0VmFsdWUuY2FsbChlbGVtZW50LCBlbGVtZW50c0luZGV4LCBlbGVtZW50c0xlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIEFsbG93IHN0YXJ0VmFsdWUgdG8gYmUgbGVmdCBhcyB1bmRlZmluZWQgdG8gaW5kaWNhdGUgdG8gdGhlIGVuc3VpbmcgY29kZSB0aGF0IGl0cyB2YWx1ZSB3YXMgbm90IGZvcmNlZmVkLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsgZW5kVmFsdWUgfHwgMCwgZWFzaW5nLCBzdGFydFZhbHVlIF07XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBDeWNsZSB0aHJvdWdoIGVhY2ggcHJvcGVydHkgaW4gdGhlIG1hcCwgbG9va2luZyBmb3Igc2hvcnRoYW5kIGNvbG9yIHByb3BlcnRpZXMgKGUuZy4gXCJjb2xvclwiIGFzIG9wcG9zZWQgdG8gXCJjb2xvclJlZFwiKS4gSW5qZWN0IHRoZSBjb3JyZXNwb25kaW5nXG4gICAgICAgICAgICAgICAgICAgICAgIGNvbG9yUmVkLCBjb2xvckdyZWVuLCBhbmQgY29sb3JCbHVlIFJHQiBjb21wb25lbnQgdHdlZW5zIGludG8gdGhlIHByb3BlcnRpZXNNYXAgKHdoaWNoIFZlbG9jaXR5IHVuZGVyc3RhbmRzKSBhbmQgcmVtb3ZlIHRoZSBzaG9ydGhhbmQgcHJvcGVydHkuICovXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChwcm9wZXJ0aWVzTWFwLCBmdW5jdGlvbihwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIEZpbmQgc2hvcnRoYW5kIGNvbG9yIHByb3BlcnRpZXMgdGhhdCBoYXZlIGJlZW4gcGFzc2VkIGEgaGV4IHN0cmluZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChSZWdFeHAoXCJeXCIgKyBDU1MuTGlzdHMuY29sb3JzLmpvaW4oXCIkfF5cIikgKyBcIiRcIikudGVzdChwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBQYXJzZSB0aGUgdmFsdWUgZGF0YSBmb3IgZWFjaCBzaG9ydGhhbmQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlRGF0YSA9IHBhcnNlUHJvcGVydHlWYWx1ZSh2YWx1ZSwgdHJ1ZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gdmFsdWVEYXRhWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlYXNpbmcgPSB2YWx1ZURhdGFbMV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSB2YWx1ZURhdGFbMl07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLlJlZ0V4LmlzSGV4LnRlc3QoZW5kVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENvbnZlcnQgdGhlIGhleCBzdHJpbmdzIGludG8gdGhlaXIgUkdCIGNvbXBvbmVudCBhcnJheXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb2xvckNvbXBvbmVudHMgPSBbIFwiUmVkXCIsIFwiR3JlZW5cIiwgXCJCbHVlXCIgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlUkdCID0gQ1NTLlZhbHVlcy5oZXhUb1JnYihlbmRWYWx1ZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlUkdCID0gc3RhcnRWYWx1ZSA/IENTUy5WYWx1ZXMuaGV4VG9SZ2Ioc3RhcnRWYWx1ZSkgOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSW5qZWN0IHRoZSBSR0IgY29tcG9uZW50IHR3ZWVucyBpbnRvIHByb3BlcnRpZXNNYXAuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29sb3JDb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YUFycmF5ID0gWyBlbmRWYWx1ZVJHQltpXSBdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWFzaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YUFycmF5LnB1c2goZWFzaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXJ0VmFsdWVSR0IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFBcnJheS5wdXNoKHN0YXJ0VmFsdWVSR0JbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzTWFwW3Byb3BlcnR5ICsgY29sb3JDb21wb25lbnRzW2ldXSA9IGRhdGFBcnJheTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFJlbW92ZSB0aGUgaW50ZXJtZWRpYXJ5IHNob3J0aGFuZCBwcm9wZXJ0eSBlbnRyeSBub3cgdGhhdCB3ZSd2ZSBwcm9jZXNzZWQgaXQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBwcm9wZXJ0aWVzTWFwW3Byb3BlcnR5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIENyZWF0ZSBhIHR3ZWVuIG91dCBvZiBlYWNoIHByb3BlcnR5LCBhbmQgYXBwZW5kIGl0cyBhc3NvY2lhdGVkIGRhdGEgdG8gdHdlZW5zQ29udGFpbmVyLiAqL1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiBwcm9wZXJ0aWVzTWFwKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgU3RhcnQgVmFsdWUgU291cmNpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBQYXJzZSBvdXQgZW5kVmFsdWUsIGVhc2luZywgYW5kIHN0YXJ0VmFsdWUgZnJvbSB0aGUgcHJvcGVydHkncyBkYXRhLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlRGF0YSA9IHBhcnNlUHJvcGVydHlWYWx1ZShwcm9wZXJ0aWVzTWFwW3Byb3BlcnR5XSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSB2YWx1ZURhdGFbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWFzaW5nID0gdmFsdWVEYXRhWzFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSB2YWx1ZURhdGFbMl07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdyB0aGF0IHRoZSBvcmlnaW5hbCBwcm9wZXJ0eSBuYW1lJ3MgZm9ybWF0IGhhcyBiZWVuIHVzZWQgZm9yIHRoZSBwYXJzZVByb3BlcnR5VmFsdWUoKSBsb29rdXAgYWJvdmUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB3ZSBmb3JjZSB0aGUgcHJvcGVydHkgdG8gaXRzIGNhbWVsQ2FzZSBzdHlsaW5nIHRvIG5vcm1hbGl6ZSBpdCBmb3IgbWFuaXB1bGF0aW9uLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHkgPSBDU1MuTmFtZXMuY2FtZWxDYXNlKHByb3BlcnR5KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogSW4gY2FzZSB0aGlzIHByb3BlcnR5IGlzIGEgaG9vaywgdGhlcmUgYXJlIGNpcmN1bXN0YW5jZXMgd2hlcmUgd2Ugd2lsbCBpbnRlbmQgdG8gd29yayBvbiB0aGUgaG9vaydzIHJvb3QgcHJvcGVydHkgYW5kIG5vdCB0aGUgaG9va2VkIHN1YnByb3BlcnR5LiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJvb3RQcm9wZXJ0eSA9IENTUy5Ib29rcy5nZXRSb290KHByb3BlcnR5KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBPdGhlciB0aGFuIGZvciB0aGUgZHVtbXkgdHdlZW4gcHJvcGVydHksIHByb3BlcnRpZXMgdGhhdCBhcmUgbm90IHN1cHBvcnRlZCBieSB0aGUgYnJvd3NlciAoYW5kIGRvIG5vdCBoYXZlIGFuIGFzc29jaWF0ZWQgbm9ybWFsaXphdGlvbikgd2lsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5oZXJlbnRseSBwcm9kdWNlIG5vIHN0eWxlIGNoYW5nZXMgd2hlbiBzZXQsIHNvIHRoZXkgYXJlIHNraXBwZWQgaW4gb3JkZXIgdG8gZGVjcmVhc2UgYW5pbWF0aW9uIHRpY2sgb3ZlcmhlYWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBQcm9wZXJ0eSBzdXBwb3J0IGlzIGRldGVybWluZWQgdmlhIHByZWZpeENoZWNrKCksIHdoaWNoIHJldHVybnMgYSBmYWxzZSBmbGFnIHdoZW4gbm8gc3VwcG9ydGVkIGlzIGRldGVjdGVkLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogU2luY2UgU1ZHIGVsZW1lbnRzIGhhdmUgc29tZSBvZiB0aGVpciBwcm9wZXJ0aWVzIGRpcmVjdGx5IGFwcGxpZWQgYXMgSFRNTCBhdHRyaWJ1dGVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlcmUgaXMgbm8gd2F5IHRvIGNoZWNrIGZvciB0aGVpciBleHBsaWNpdCBicm93c2VyIHN1cHBvcnQsIGFuZCBzbyB3ZSBza2lwIHNraXAgdGhpcyBjaGVjayBmb3IgdGhlbS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghRGF0YShlbGVtZW50KS5pc1NWRyAmJiByb290UHJvcGVydHkgIT09IFwidHdlZW5cIiAmJiBDU1MuTmFtZXMucHJlZml4Q2hlY2socm9vdFByb3BlcnR5KVsxXSA9PT0gZmFsc2UgJiYgQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbcm9vdFByb3BlcnR5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFZlbG9jaXR5LmRlYnVnKSBjb25zb2xlLmxvZyhcIlNraXBwaW5nIFtcIiArIHJvb3RQcm9wZXJ0eSArIFwiXSBkdWUgdG8gYSBsYWNrIG9mIGJyb3dzZXIgc3VwcG9ydC5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGRpc3BsYXkgb3B0aW9uIGlzIGJlaW5nIHNldCB0byBhIG5vbi1cIm5vbmVcIiAoZS5nLiBcImJsb2NrXCIpIGFuZCBvcGFjaXR5IChmaWx0ZXIgb24gSUU8PTgpIGlzIGJlaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRlZCB0byBhbiBlbmRWYWx1ZSBvZiBub24temVybywgdGhlIHVzZXIncyBpbnRlbnRpb24gaXMgdG8gZmFkZSBpbiBmcm9tIGludmlzaWJsZSwgdGh1cyB3ZSBmb3JjZWZlZWQgb3BhY2l0eVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgYSBzdGFydFZhbHVlIG9mIDAgaWYgaXRzIHN0YXJ0VmFsdWUgaGFzbid0IGFscmVhZHkgYmVlbiBzb3VyY2VkIGJ5IHZhbHVlIHRyYW5zZmVycmluZyBvciBwcmlvciBmb3JjZWZlZWRpbmcuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKChvcHRzLmRpc3BsYXkgIT09IHVuZGVmaW5lZCAmJiBvcHRzLmRpc3BsYXkgIT09IG51bGwgJiYgb3B0cy5kaXNwbGF5ICE9PSBcIm5vbmVcIikgfHwgKG9wdHMudmlzaWJpbGl0eSAhPT0gdW5kZWZpbmVkICYmIG9wdHMudmlzaWJpbGl0eSAhPT0gXCJoaWRkZW5cIikpICYmIC9vcGFjaXR5fGZpbHRlci8udGVzdChwcm9wZXJ0eSkgJiYgIXN0YXJ0VmFsdWUgJiYgZW5kVmFsdWUgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdmFsdWVzIGhhdmUgYmVlbiB0cmFuc2ZlcnJlZCBmcm9tIHRoZSBwcmV2aW91cyBWZWxvY2l0eSBjYWxsLCBleHRyYWN0IHRoZSBlbmRWYWx1ZSBhbmQgcm9vdFByb3BlcnR5VmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciBhbGwgb2YgdGhlIGN1cnJlbnQgY2FsbCdzIHByb3BlcnRpZXMgdGhhdCB3ZXJlICphbHNvKiBhbmltYXRlZCBpbiB0aGUgcHJldmlvdXMgY2FsbC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFZhbHVlIHRyYW5zZmVycmluZyBjYW4gb3B0aW9uYWxseSBiZSBkaXNhYmxlZCBieSB0aGUgdXNlciB2aWEgdGhlIF9jYWNoZVZhbHVlcyBvcHRpb24uICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5fY2FjaGVWYWx1ZXMgJiYgbGFzdFR3ZWVuc0NvbnRhaW5lciAmJiBsYXN0VHdlZW5zQ29udGFpbmVyW3Byb3BlcnR5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGFydFZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IGxhc3RUd2VlbnNDb250YWluZXJbcHJvcGVydHldLmVuZFZhbHVlICsgbGFzdFR3ZWVuc0NvbnRhaW5lcltwcm9wZXJ0eV0udW5pdFR5cGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlIHByZXZpb3VzIGNhbGwncyByb290UHJvcGVydHlWYWx1ZSBpcyBleHRyYWN0ZWQgZnJvbSB0aGUgZWxlbWVudCdzIGRhdGEgY2FjaGUgc2luY2UgdGhhdCdzIHRoZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc3RhbmNlIG9mIHJvb3RQcm9wZXJ0eVZhbHVlIHRoYXQgZ2V0cyBmcmVzaGx5IHVwZGF0ZWQgYnkgdGhlIHR3ZWVuaW5nIHByb2Nlc3MsIHdoZXJlYXMgdGhlIHJvb3RQcm9wZXJ0eVZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0YWNoZWQgdG8gdGhlIGluY29taW5nIGxhc3RUd2VlbnNDb250YWluZXIgaXMgZXF1YWwgdG8gdGhlIHJvb3QgcHJvcGVydHkncyB2YWx1ZSBwcmlvciB0byBhbnkgdHdlZW5pbmcuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSBEYXRhKGVsZW1lbnQpLnJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGVbcm9vdFByb3BlcnR5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHZhbHVlcyB3ZXJlIG5vdCB0cmFuc2ZlcnJlZCBmcm9tIGEgcHJldmlvdXMgVmVsb2NpdHkgY2FsbCwgcXVlcnkgdGhlIERPTSBhcyBuZWVkZWQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEhhbmRsZSBob29rZWQgcHJvcGVydGllcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbcHJvcGVydHldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXJ0VmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCByb290UHJvcGVydHkpOyAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFRoZSBmb2xsb3dpbmcgZ2V0UHJvcGVydHlWYWx1ZSgpIGNhbGwgZG9lcyBub3QgYWN0dWFsbHkgdHJpZ2dlciBhIERPTSBxdWVyeTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldFByb3BlcnR5VmFsdWUoKSB3aWxsIGV4dHJhY3QgdGhlIGhvb2sgZnJvbSByb290UHJvcGVydHlWYWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBwcm9wZXJ0eSwgcm9vdFByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBzdGFydFZhbHVlIGlzIGFscmVhZHkgZGVmaW5lZCB2aWEgZm9yY2VmZWVkaW5nLCBkbyBub3QgcXVlcnkgdGhlIERPTSBmb3IgdGhlIHJvb3QgcHJvcGVydHkncyB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganVzdCBncmFiIHJvb3RQcm9wZXJ0eSdzIHplcm8tdmFsdWUgdGVtcGxhdGUgZnJvbSBDU1MuSG9va3MuIFRoaXMgb3ZlcndyaXRlcyB0aGUgZWxlbWVudCdzIGFjdHVhbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290IHByb3BlcnR5IHZhbHVlIChpZiBvbmUgaXMgc2V0KSwgYnV0IHRoaXMgaXMgYWNjZXB0YWJsZSBzaW5jZSB0aGUgcHJpbWFyeSByZWFzb24gdXNlcnMgZm9yY2VmZWVkIGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvIGF2b2lkIERPTSBxdWVyaWVzLCBhbmQgdGh1cyB3ZSBsaWtld2lzZSBhdm9pZCBxdWVyeWluZyB0aGUgRE9NIGZvciB0aGUgcm9vdCBwcm9wZXJ0eSdzIHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogR3JhYiB0aGlzIGhvb2sncyB6ZXJvLXZhbHVlIHRlbXBsYXRlLCBlLmcuIFwiMHB4IDBweCAwcHggYmxhY2tcIi4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gQ1NTLkhvb2tzLnRlbXBsYXRlc1tyb290UHJvcGVydHldWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSGFuZGxlIG5vbi1ob29rZWQgcHJvcGVydGllcyB0aGF0IGhhdmVuJ3QgYWxyZWFkeSBiZWVuIGRlZmluZWQgdmlhIGZvcmNlZmVlZGluZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHN0YXJ0VmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgcHJvcGVydHkpOyAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgVmFsdWUgRGF0YSBFeHRyYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNlcGFyYXRlZFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlVW5pdFR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZVVuaXRUeXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wZXJhdG9yID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNlcGFyYXRlcyBhIHByb3BlcnR5IHZhbHVlIGludG8gaXRzIG51bWVyaWMgdmFsdWUgYW5kIGl0cyB1bml0IHR5cGUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBzZXBhcmF0ZVZhbHVlIChwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdW5pdFR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bWVyaWNWYWx1ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bWVyaWNWYWx1ZSA9ICh2YWx1ZSB8fCBcIjBcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogTWF0Y2ggdGhlIHVuaXQgdHlwZSBhdCB0aGUgZW5kIG9mIHRoZSB2YWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1slQS16XSskLywgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEdyYWIgdGhlIHVuaXQgdHlwZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRUeXBlID0gbWF0Y2g7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFN0cmlwIHRoZSB1bml0IHR5cGUgb2ZmIG9mIHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgbm8gdW5pdCB0eXBlIHdhcyBzdXBwbGllZCwgYXNzaWduIG9uZSB0aGF0IGlzIGFwcHJvcHJpYXRlIGZvciB0aGlzIHByb3BlcnR5IChlLmcuIFwiZGVnXCIgZm9yIHJvdGF0ZVogb3IgXCJweFwiIGZvciB3aWR0aCkuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF1bml0VHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0VHlwZSA9IENTUy5WYWx1ZXMuZ2V0VW5pdFR5cGUocHJvcGVydHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbIG51bWVyaWNWYWx1ZSwgdW5pdFR5cGUgXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogU2VwYXJhdGUgc3RhcnRWYWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcGFyYXRlZFZhbHVlID0gc2VwYXJhdGVWYWx1ZShwcm9wZXJ0eSwgc3RhcnRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gc2VwYXJhdGVkVmFsdWVbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlVW5pdFR5cGUgPSBzZXBhcmF0ZWRWYWx1ZVsxXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogU2VwYXJhdGUgZW5kVmFsdWUsIGFuZCBleHRyYWN0IGEgdmFsdWUgb3BlcmF0b3IgKGUuZy4gXCIrPVwiLCBcIi09XCIpIGlmIG9uZSBleGlzdHMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXBhcmF0ZWRWYWx1ZSA9IHNlcGFyYXRlVmFsdWUocHJvcGVydHksIGVuZFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gc2VwYXJhdGVkVmFsdWVbMF0ucmVwbGFjZSgvXihbKy1cXC8qXSk9LywgZnVuY3Rpb24obWF0Y2gsIHN1Yk1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlcmF0b3IgPSBzdWJNYXRjaDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFN0cmlwIHRoZSBvcGVyYXRvciBvZmYgb2YgdGhlIHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZVVuaXRUeXBlID0gc2VwYXJhdGVkVmFsdWVbMV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFBhcnNlIGZsb2F0IHZhbHVlcyBmcm9tIGVuZFZhbHVlIGFuZCBzdGFydFZhbHVlLiBEZWZhdWx0IHRvIDAgaWYgTmFOIGlzIHJldHVybmVkLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IHBhcnNlRmxvYXQoc3RhcnRWYWx1ZSkgfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gcGFyc2VGbG9hdChlbmRWYWx1ZSkgfHwgMDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgUHJvcGVydHktU3BlY2lmaWMgVmFsdWUgQ29udmVyc2lvblxuICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBDdXN0b20gc3VwcG9ydCBmb3IgcHJvcGVydGllcyB0aGF0IGRvbid0IGFjdHVhbGx5IGFjY2VwdCB0aGUgJSB1bml0IHR5cGUsIGJ1dCB3aGVyZSBwb2xseWZpbGxpbmcgaXMgdHJpdmlhbCBhbmQgcmVsYXRpdmVseSBmb29scHJvb2YuICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW5kVmFsdWVVbml0VHlwZSA9PT0gXCIlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBBICUtdmFsdWUgZm9udFNpemUvbGluZUhlaWdodCBpcyByZWxhdGl2ZSB0byB0aGUgcGFyZW50J3MgZm9udFNpemUgKGFzIG9wcG9zZWQgdG8gdGhlIHBhcmVudCdzIGRpbWVuc2lvbnMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWNoIGlzIGlkZW50aWNhbCB0byB0aGUgZW0gdW5pdCdzIGJlaGF2aW9yLCBzbyB3ZSBwaWdneWJhY2sgb2ZmIG9mIHRoYXQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC9eKGZvbnRTaXplfGxpbmVIZWlnaHQpJC8udGVzdChwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ29udmVydCAlIGludG8gYW4gZW0gZGVjaW1hbCB2YWx1ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSBlbmRWYWx1ZSAvIDEwMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWVVbml0VHlwZSA9IFwiZW1cIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBGb3Igc2NhbGVYIGFuZCBzY2FsZVksIGNvbnZlcnQgdGhlIHZhbHVlIGludG8gaXRzIGRlY2ltYWwgZm9ybWF0IGFuZCBzdHJpcCBvZmYgdGhlIHVuaXQgdHlwZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9ec2NhbGUvLnRlc3QocHJvcGVydHkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gZW5kVmFsdWUgLyAxMDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlVW5pdFR5cGUgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEZvciBSR0IgY29tcG9uZW50cywgdGFrZSB0aGUgZGVmaW5lZCBwZXJjZW50YWdlIG9mIDI1NSBhbmQgc3RyaXAgb2ZmIHRoZSB1bml0IHR5cGUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvKFJlZHxHcmVlbnxCbHVlKSQvaS50ZXN0KHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IChlbmRWYWx1ZSAvIDEwMCkgKiAyNTU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlVW5pdFR5cGUgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgVW5pdCBSYXRpbyBDYWxjdWxhdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBXaGVuIHF1ZXJpZWQsIHRoZSBicm93c2VyIHJldHVybnMgKG1vc3QpIENTUyBwcm9wZXJ0eSB2YWx1ZXMgaW4gcGl4ZWxzLiBUaGVyZWZvcmUsIGlmIGFuIGVuZFZhbHVlIHdpdGggYSB1bml0IHR5cGUgb2ZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICUsIGVtLCBvciByZW0gaXMgYW5pbWF0ZWQgdG93YXJkLCBzdGFydFZhbHVlIG11c3QgYmUgY29udmVydGVkIGZyb20gcGl4ZWxzIGludG8gdGhlIHNhbWUgdW5pdCB0eXBlIGFzIGVuZFZhbHVlIGluIG9yZGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgdmFsdWUgbWFuaXB1bGF0aW9uIGxvZ2ljIChpbmNyZW1lbnQvZGVjcmVtZW50KSB0byBwcm9jZWVkLiBGdXJ0aGVyLCBpZiB0aGUgc3RhcnRWYWx1ZSB3YXMgZm9yY2VmZWQgb3IgdHJhbnNmZXJyZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb20gYSBwcmV2aW91cyBjYWxsLCBzdGFydFZhbHVlIG1heSBhbHNvIG5vdCBiZSBpbiBwaXhlbHMuIFVuaXQgY29udmVyc2lvbiBsb2dpYyB0aGVyZWZvcmUgY29uc2lzdHMgb2YgdHdvIHN0ZXBzOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgMSkgQ2FsY3VsYXRpbmcgdGhlIHJhdGlvIG9mICUvZW0vcmVtL3ZoL3Z3IHJlbGF0aXZlIHRvIHBpeGVsc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgMikgQ29udmVydGluZyBzdGFydFZhbHVlIGludG8gdGhlIHNhbWUgdW5pdCBvZiBtZWFzdXJlbWVudCBhcyBlbmRWYWx1ZSBiYXNlZCBvbiB0aGVzZSByYXRpb3MuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBVbml0IGNvbnZlcnNpb24gcmF0aW9zIGFyZSBjYWxjdWxhdGVkIGJ5IGluc2VydGluZyBhIHNpYmxpbmcgbm9kZSBuZXh0IHRvIHRoZSB0YXJnZXQgbm9kZSwgY29weWluZyBvdmVyIGl0cyBwb3NpdGlvbiBwcm9wZXJ0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldHRpbmcgdmFsdWVzIHdpdGggdGhlIHRhcmdldCB1bml0IHR5cGUgdGhlbiBjb21wYXJpbmcgdGhlIHJldHVybmVkIHBpeGVsIHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogRXZlbiBpZiBvbmx5IG9uZSBvZiB0aGVzZSB1bml0IHR5cGVzIGlzIGJlaW5nIGFuaW1hdGVkLCBhbGwgdW5pdCByYXRpb3MgYXJlIGNhbGN1bGF0ZWQgYXQgb25jZSBzaW5jZSB0aGUgb3ZlcmhlYWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mIGJhdGNoaW5nIHRoZSBTRVRzIGFuZCBHRVRzIHRvZ2V0aGVyIHVwZnJvbnQgb3V0d2VpZ2h0cyB0aGUgcG90ZW50aWFsIG92ZXJoZWFkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBvZiBsYXlvdXQgdGhyYXNoaW5nIGNhdXNlZCBieSByZS1xdWVyeWluZyBmb3IgdW5jYWxjdWxhdGVkIHJhdGlvcyBmb3Igc3Vic2VxdWVudGx5LXByb2Nlc3NlZCBwcm9wZXJ0aWVzLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogVG9kbzogU2hpZnQgdGhpcyBsb2dpYyBpbnRvIHRoZSBjYWxscycgZmlyc3QgdGljayBpbnN0YW5jZSBzbyB0aGF0IGl0J3Mgc3luY2VkIHdpdGggUkFGLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gY2FsY3VsYXRlVW5pdFJhdGlvcyAoKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNhbWUgUmF0aW8gQ2hlY2tzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlIHByb3BlcnRpZXMgYmVsb3cgYXJlIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhlIGVsZW1lbnQgZGlmZmVycyBzdWZmaWNpZW50bHkgZnJvbSB0aGlzIGNhbGwnc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpb3VzbHkgaXRlcmF0ZWQgZWxlbWVudCB0byBhbHNvIGRpZmZlciBpbiBpdHMgdW5pdCBjb252ZXJzaW9uIHJhdGlvcy4gSWYgdGhlIHByb3BlcnRpZXMgbWF0Y2ggdXAgd2l0aCB0aG9zZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mIHRoZSBwcmlvciBlbGVtZW50LCB0aGUgcHJpb3IgZWxlbWVudCdzIGNvbnZlcnNpb24gcmF0aW9zIGFyZSB1c2VkLiBMaWtlIG1vc3Qgb3B0aW1pemF0aW9ucyBpbiBWZWxvY2l0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzIGlzIGRvbmUgdG8gbWluaW1pemUgRE9NIHF1ZXJ5aW5nLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzYW1lUmF0aW9JbmRpY2F0b3JzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXlQYXJlbnQ6IGVsZW1lbnQucGFyZW50Tm9kZSB8fCBkb2N1bWVudC5ib2R5LCAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInBvc2l0aW9uXCIpLCAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImZvbnRTaXplXCIpIC8qIEdFVCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBEZXRlcm1pbmUgaWYgdGhlIHNhbWUgJSByYXRpbyBjYW4gYmUgdXNlZC4gJSBpcyBiYXNlZCBvbiB0aGUgZWxlbWVudCdzIHBvc2l0aW9uIHZhbHVlIGFuZCBpdHMgcGFyZW50J3Mgd2lkdGggYW5kIGhlaWdodCBkaW1lbnNpb25zLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYW1lUGVyY2VudFJhdGlvID0gKChzYW1lUmF0aW9JbmRpY2F0b3JzLnBvc2l0aW9uID09PSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RQb3NpdGlvbikgJiYgKHNhbWVSYXRpb0luZGljYXRvcnMubXlQYXJlbnQgPT09IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdFBhcmVudCkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBEZXRlcm1pbmUgaWYgdGhlIHNhbWUgZW0gcmF0aW8gY2FuIGJlIHVzZWQuIGVtIGlzIHJlbGF0aXZlIHRvIHRoZSBlbGVtZW50J3MgZm9udFNpemUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhbWVFbVJhdGlvID0gKHNhbWVSYXRpb0luZGljYXRvcnMuZm9udFNpemUgPT09IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdEZvbnRTaXplKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFN0b3JlIHRoZXNlIHJhdGlvIGluZGljYXRvcnMgY2FsbC13aWRlIGZvciB0aGUgbmV4dCBlbGVtZW50IHRvIGNvbXBhcmUgYWdhaW5zdC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RQYXJlbnQgPSBzYW1lUmF0aW9JbmRpY2F0b3JzLm15UGFyZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdFBvc2l0aW9uID0gc2FtZVJhdGlvSW5kaWNhdG9ycy5wb3NpdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RGb250U2l6ZSA9IHNhbWVSYXRpb0luZGljYXRvcnMuZm9udFNpemU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRWxlbWVudC1TcGVjaWZpYyBVbml0c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IElFOCByb3VuZHMgdG8gdGhlIG5lYXJlc3QgcGl4ZWwgd2hlbiByZXR1cm5pbmcgQ1NTIHZhbHVlcywgdGh1cyB3ZSBwZXJmb3JtIGNvbnZlcnNpb25zIHVzaW5nIGEgbWVhc3VyZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZiAxMDAgKGluc3RlYWQgb2YgMSkgdG8gZ2l2ZSBvdXIgcmF0aW9zIGEgcHJlY2lzaW9uIG9mIGF0IGxlYXN0IDIgZGVjaW1hbCB2YWx1ZXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1lYXN1cmVtZW50ID0gMTAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zID0ge307XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXNhbWVFbVJhdGlvIHx8ICFzYW1lUGVyY2VudFJhdGlvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkdW1teSA9IERhdGEoZWxlbWVudCkuaXNTVkcgPyBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInJlY3RcIikgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LmluaXQoZHVtbXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYW1lUmF0aW9JbmRpY2F0b3JzLm15UGFyZW50LmFwcGVuZENoaWxkKGR1bW15KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUbyBhY2N1cmF0ZWx5IGFuZCBjb25zaXN0ZW50bHkgY2FsY3VsYXRlIGNvbnZlcnNpb24gcmF0aW9zLCB0aGUgZWxlbWVudCdzIGNhc2NhZGVkIG92ZXJmbG93IGFuZCBib3gtc2l6aW5nIGFyZSBzdHJpcHBlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2ltaWxhcmx5LCBzaW5jZSB3aWR0aC9oZWlnaHQgY2FuIGJlIGFydGlmaWNpYWxseSBjb25zdHJhaW5lZCBieSB0aGVpciBtaW4tL21heC0gZXF1aXZhbGVudHMsIHRoZXNlIGFyZSBjb250cm9sbGVkIGZvciBhcyB3ZWxsLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBPdmVyZmxvdyBtdXN0IGJlIGFsc28gYmUgY29udHJvbGxlZCBmb3IgcGVyLWF4aXMgc2luY2UgdGhlIG92ZXJmbG93IHByb3BlcnR5IG92ZXJ3cml0ZXMgaXRzIHBlci1heGlzIHZhbHVlcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKFsgXCJvdmVyZmxvd1wiLCBcIm92ZXJmbG93WFwiLCBcIm92ZXJmbG93WVwiIF0sIGZ1bmN0aW9uKGksIHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5DU1Muc2V0UHJvcGVydHlWYWx1ZShkdW1teSwgcHJvcGVydHksIFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuQ1NTLnNldFByb3BlcnR5VmFsdWUoZHVtbXksIFwicG9zaXRpb25cIiwgc2FtZVJhdGlvSW5kaWNhdG9ycy5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LkNTUy5zZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBcImZvbnRTaXplXCIsIHNhbWVSYXRpb0luZGljYXRvcnMuZm9udFNpemUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5DU1Muc2V0UHJvcGVydHlWYWx1ZShkdW1teSwgXCJib3hTaXppbmdcIiwgXCJjb250ZW50LWJveFwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiB3aWR0aCBhbmQgaGVpZ2h0IGFjdCBhcyBvdXIgcHJveHkgcHJvcGVydGllcyBmb3IgbWVhc3VyaW5nIHRoZSBob3Jpem9udGFsIGFuZCB2ZXJ0aWNhbCAlIHJhdGlvcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKFsgXCJtaW5XaWR0aFwiLCBcIm1heFdpZHRoXCIsIFwid2lkdGhcIiwgXCJtaW5IZWlnaHRcIiwgXCJtYXhIZWlnaHRcIiwgXCJoZWlnaHRcIiBdLCBmdW5jdGlvbihpLCBwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuQ1NTLnNldFByb3BlcnR5VmFsdWUoZHVtbXksIHByb3BlcnR5LCBtZWFzdXJlbWVudCArIFwiJVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHBhZGRpbmdMZWZ0IGFyYml0cmFyaWx5IGFjdHMgYXMgb3VyIHByb3h5IHByb3BlcnR5IGZvciB0aGUgZW0gcmF0aW8uICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LkNTUy5zZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBcInBhZGRpbmdMZWZ0XCIsIG1lYXN1cmVtZW50ICsgXCJlbVwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBEaXZpZGUgdGhlIHJldHVybmVkIHZhbHVlIGJ5IHRoZSBtZWFzdXJlbWVudCB0byBnZXQgdGhlIHJhdGlvIGJldHdlZW4gMSUgYW5kIDFweC4gRGVmYXVsdCB0byAxIHNpbmNlIHdvcmtpbmcgd2l0aCAwIGNhbiBwcm9kdWNlIEluZmluaXRlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zLnBlcmNlbnRUb1B4V2lkdGggPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RQZXJjZW50VG9QeFdpZHRoID0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZHVtbXksIFwid2lkdGhcIiwgbnVsbCwgdHJ1ZSkpIHx8IDEpIC8gbWVhc3VyZW1lbnQ7IC8qIEdFVCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zLnBlcmNlbnRUb1B4SGVpZ2h0ID0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0UGVyY2VudFRvUHhIZWlnaHQgPSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShkdW1teSwgXCJoZWlnaHRcIiwgbnVsbCwgdHJ1ZSkpIHx8IDEpIC8gbWVhc3VyZW1lbnQ7IC8qIEdFVCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zLmVtVG9QeCA9IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdEVtVG9QeCA9IChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBcInBhZGRpbmdMZWZ0XCIpKSB8fCAxKSAvIG1lYXN1cmVtZW50OyAvKiBHRVQgKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYW1lUmF0aW9JbmRpY2F0b3JzLm15UGFyZW50LnJlbW92ZUNoaWxkKGR1bW15KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zLmVtVG9QeCA9IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdEVtVG9QeDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcy5wZXJjZW50VG9QeFdpZHRoID0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0UGVyY2VudFRvUHhXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcy5wZXJjZW50VG9QeEhlaWdodCA9IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdFBlcmNlbnRUb1B4SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFbGVtZW50LUFnbm9zdGljIFVuaXRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogV2hlcmVhcyAlIGFuZCBlbSByYXRpb3MgYXJlIGRldGVybWluZWQgb24gYSBwZXItZWxlbWVudCBiYXNpcywgdGhlIHJlbSB1bml0IG9ubHkgbmVlZHMgdG8gYmUgY2hlY2tlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uY2UgcGVyIGNhbGwgc2luY2UgaXQncyBleGNsdXNpdmVseSBkZXBlbmRhbnQgdXBvbiBkb2N1bWVudC5ib2R5J3MgZm9udFNpemUuIElmIHRoaXMgaXMgdGhlIGZpcnN0IHRpbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0IGNhbGN1bGF0ZVVuaXRSYXRpb3MoKSBpcyBiZWluZyBydW4gZHVyaW5nIHRoaXMgY2FsbCwgcmVtVG9QeCB3aWxsIHN0aWxsIGJlIHNldCB0byBpdHMgZGVmYXVsdCB2YWx1ZSBvZiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvIHdlIGNhbGN1bGF0ZSBpdCBub3cuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxVbml0Q29udmVyc2lvbkRhdGEucmVtVG9QeCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBEZWZhdWx0IHRvIGJyb3dzZXJzJyBkZWZhdWx0IGZvbnRTaXplIG9mIDE2cHggaW4gdGhlIGNhc2Ugb2YgMC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5yZW1Ub1B4ID0gcGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShkb2N1bWVudC5ib2R5LCBcImZvbnRTaXplXCIpKSB8fCAxNjsgLyogR0VUICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU2ltaWxhcmx5LCB2aWV3cG9ydCB1bml0cyBhcmUgJS1yZWxhdGl2ZSB0byB0aGUgd2luZG93J3MgaW5uZXIgZGltZW5zaW9ucy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbFVuaXRDb252ZXJzaW9uRGF0YS52d1RvUHggPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbFVuaXRDb252ZXJzaW9uRGF0YS52d1RvUHggPSBwYXJzZUZsb2F0KHdpbmRvdy5pbm5lcldpZHRoKSAvIDEwMDsgLyogR0VUICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxVbml0Q29udmVyc2lvbkRhdGEudmhUb1B4ID0gcGFyc2VGbG9hdCh3aW5kb3cuaW5uZXJIZWlnaHQpIC8gMTAwOyAvKiBHRVQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zLnJlbVRvUHggPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLnJlbVRvUHg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcy52d1RvUHggPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLnZ3VG9QeDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zLnZoVG9QeCA9IGNhbGxVbml0Q29udmVyc2lvbkRhdGEudmhUb1B4O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFZlbG9jaXR5LmRlYnVnID49IDEpIGNvbnNvbGUubG9nKFwiVW5pdCByYXRpb3M6IFwiICsgSlNPTi5zdHJpbmdpZnkodW5pdFJhdGlvcyksIGVsZW1lbnQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVuaXRSYXRpb3M7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgVW5pdCBDb252ZXJzaW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlICogYW5kIC8gb3BlcmF0b3JzLCB3aGljaCBhcmUgbm90IHBhc3NlZCBpbiB3aXRoIGFuIGFzc29jaWF0ZWQgdW5pdCwgaW5oZXJlbnRseSB1c2Ugc3RhcnRWYWx1ZSdzIHVuaXQuIFNraXAgdmFsdWUgYW5kIHVuaXQgY29udmVyc2lvbi4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgvW1xcLypdLy50ZXN0KG9wZXJhdG9yKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlVW5pdFR5cGUgPSBzdGFydFZhbHVlVW5pdFR5cGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBzdGFydFZhbHVlIGFuZCBlbmRWYWx1ZSBkaWZmZXIgaW4gdW5pdCB0eXBlLCBjb252ZXJ0IHN0YXJ0VmFsdWUgaW50byB0aGUgc2FtZSB1bml0IHR5cGUgYXMgZW5kVmFsdWUgc28gdGhhdCBpZiBlbmRWYWx1ZVVuaXRUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBpcyBhIHJlbGF0aXZlIHVuaXQgKCUsIGVtLCByZW0pLCB0aGUgdmFsdWVzIHNldCBkdXJpbmcgdHdlZW5pbmcgd2lsbCBjb250aW51ZSB0byBiZSBhY2N1cmF0ZWx5IHJlbGF0aXZlIGV2ZW4gaWYgdGhlIG1ldHJpY3MgdGhleSBkZXBlbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uIGFyZSBkeW5hbWljYWxseSBjaGFuZ2luZyBkdXJpbmcgdGhlIGNvdXJzZSBvZiB0aGUgYW5pbWF0aW9uLiBDb252ZXJzZWx5LCBpZiB3ZSBhbHdheXMgbm9ybWFsaXplZCBpbnRvIHB4IGFuZCB1c2VkIHB4IGZvciBzZXR0aW5nIHZhbHVlcywgdGhlIHB4IHJhdGlvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB3b3VsZCBiZWNvbWUgc3RhbGUgaWYgdGhlIG9yaWdpbmFsIHVuaXQgYmVpbmcgYW5pbWF0ZWQgdG93YXJkIHdhcyByZWxhdGl2ZSBhbmQgdGhlIHVuZGVybHlpbmcgbWV0cmljcyBjaGFuZ2UgZHVyaW5nIHRoZSBhbmltYXRpb24uICovXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSAwIGlzIDAgaW4gYW55IHVuaXQgdHlwZSwgbm8gY29udmVyc2lvbiBpcyBuZWNlc3Nhcnkgd2hlbiBzdGFydFZhbHVlIGlzIDAgLS0gd2UganVzdCBzdGFydCBhdCAwIHdpdGggZW5kVmFsdWVVbml0VHlwZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoKHN0YXJ0VmFsdWVVbml0VHlwZSAhPT0gZW5kVmFsdWVVbml0VHlwZSkgJiYgc3RhcnRWYWx1ZSAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFVuaXQgY29udmVyc2lvbiBpcyBhbHNvIHNraXBwZWQgd2hlbiBlbmRWYWx1ZSBpcyAwLCBidXQgKnN0YXJ0VmFsdWVVbml0VHlwZSogbXVzdCBiZSB1c2VkIGZvciB0d2VlbiB2YWx1ZXMgdG8gcmVtYWluIGFjY3VyYXRlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFNraXBwaW5nIHVuaXQgY29udmVyc2lvbiBoZXJlIG1lYW5zIHRoYXQgaWYgZW5kVmFsdWVVbml0VHlwZSB3YXMgb3JpZ2luYWxseSBhIHJlbGF0aXZlIHVuaXQsIHRoZSBhbmltYXRpb24gd29uJ3QgcmVsYXRpdmVseVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoIHRoZSB1bmRlcmx5aW5nIG1ldHJpY3MgaWYgdGhleSBjaGFuZ2UsIGJ1dCB0aGlzIGlzIGFjY2VwdGFibGUgc2luY2Ugd2UncmUgYW5pbWF0aW5nIHRvd2FyZCBpbnZpc2liaWxpdHkgaW5zdGVhZCBvZiB0b3dhcmQgdmlzaWJpbGl0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGljaCByZW1haW5zIHBhc3QgdGhlIHBvaW50IG9mIHRoZSBhbmltYXRpb24ncyBjb21wbGV0aW9uLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbmRWYWx1ZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZVVuaXRUeXBlID0gc3RhcnRWYWx1ZVVuaXRUeXBlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEJ5IHRoaXMgcG9pbnQsIHdlIGNhbm5vdCBhdm9pZCB1bml0IGNvbnZlcnNpb24gKGl0J3MgdW5kZXNpcmFibGUgc2luY2UgaXQgY2F1c2VzIGxheW91dCB0aHJhc2hpbmcpLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJZiB3ZSBoYXZlbid0IGFscmVhZHksIHdlIHRyaWdnZXIgY2FsY3VsYXRlVW5pdFJhdGlvcygpLCB3aGljaCBydW5zIG9uY2UgcGVyIGVsZW1lbnQgcGVyIGNhbGwuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGEgPSBlbGVtZW50VW5pdENvbnZlcnNpb25EYXRhIHx8IGNhbGN1bGF0ZVVuaXRSYXRpb3MoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUaGUgZm9sbG93aW5nIFJlZ0V4IG1hdGNoZXMgQ1NTIHByb3BlcnRpZXMgdGhhdCBoYXZlIHRoZWlyICUgdmFsdWVzIG1lYXN1cmVkIHJlbGF0aXZlIHRvIHRoZSB4LWF4aXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFczQyBzcGVjIG1hbmRhdGVzIHRoYXQgYWxsIG9mIG1hcmdpbiBhbmQgcGFkZGluZydzIHByb3BlcnRpZXMgKGV2ZW4gdG9wIGFuZCBib3R0b20pIGFyZSAlLXJlbGF0aXZlIHRvIHRoZSAqd2lkdGgqIG9mIHRoZSBwYXJlbnQgZWxlbWVudC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGF4aXMgPSAoL21hcmdpbnxwYWRkaW5nfGxlZnR8cmlnaHR8d2lkdGh8dGV4dHx3b3JkfGxldHRlci9pLnRlc3QocHJvcGVydHkpIHx8IC9YJC8udGVzdChwcm9wZXJ0eSkgfHwgcHJvcGVydHkgPT09IFwieFwiKSA/IFwieFwiIDogXCJ5XCI7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSW4gb3JkZXIgdG8gYXZvaWQgZ2VuZXJhdGluZyBuXjIgYmVzcG9rZSBjb252ZXJzaW9uIGZ1bmN0aW9ucywgdW5pdCBjb252ZXJzaW9uIGlzIGEgdHdvLXN0ZXAgcHJvY2VzczpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMSkgQ29udmVydCBzdGFydFZhbHVlIGludG8gcGl4ZWxzLiAyKSBDb252ZXJ0IHRoaXMgbmV3IHBpeGVsIHZhbHVlIGludG8gZW5kVmFsdWUncyB1bml0IHR5cGUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoc3RhcnRWYWx1ZVVuaXRUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiJVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IHRyYW5zbGF0ZVggYW5kIHRyYW5zbGF0ZVkgYXJlIHRoZSBvbmx5IHByb3BlcnRpZXMgdGhhdCBhcmUgJS1yZWxhdGl2ZSB0byBhbiBlbGVtZW50J3Mgb3duIGRpbWVuc2lvbnMgLS0gbm90IGl0cyBwYXJlbnQncyBkaW1lbnNpb25zLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5IGRvZXMgbm90IGluY2x1ZGUgYSBzcGVjaWFsIGNvbnZlcnNpb24gcHJvY2VzcyB0byBhY2NvdW50IGZvciB0aGlzIGJlaGF2aW9yLiBUaGVyZWZvcmUsIGFuaW1hdGluZyB0cmFuc2xhdGVYL1kgZnJvbSBhICUgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0byBhIG5vbi0lIHZhbHVlIHdpbGwgcHJvZHVjZSBhbiBpbmNvcnJlY3Qgc3RhcnQgdmFsdWUuIEZvcnR1bmF0ZWx5LCB0aGlzIHNvcnQgb2YgY3Jvc3MtdW5pdCBjb252ZXJzaW9uIGlzIHJhcmVseSBkb25lIGJ5IHVzZXJzIGluIHByYWN0aWNlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgKj0gKGF4aXMgPT09IFwieFwiID8gZWxlbWVudFVuaXRDb252ZXJzaW9uRGF0YS5wZXJjZW50VG9QeFdpZHRoIDogZWxlbWVudFVuaXRDb252ZXJzaW9uRGF0YS5wZXJjZW50VG9QeEhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJweFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHB4IGFjdHMgYXMgb3VyIG1pZHBvaW50IGluIHRoZSB1bml0IGNvbnZlcnNpb24gcHJvY2VzczsgZG8gbm90aGluZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlICo9IGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGFbc3RhcnRWYWx1ZVVuaXRUeXBlICsgXCJUb1B4XCJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSW52ZXJ0IHRoZSBweCByYXRpb3MgdG8gY29udmVydCBpbnRvIHRvIHRoZSB0YXJnZXQgdW5pdC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChlbmRWYWx1ZVVuaXRUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiJVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgKj0gMSAvIChheGlzID09PSBcInhcIiA/IGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGEucGVyY2VudFRvUHhXaWR0aCA6IGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGEucGVyY2VudFRvUHhIZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwicHhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBzdGFydFZhbHVlIGlzIGFscmVhZHkgaW4gcHgsIGRvIG5vdGhpbmc7IHdlJ3JlIGRvbmUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSAqPSAxIC8gZWxlbWVudFVuaXRDb252ZXJzaW9uRGF0YVtlbmRWYWx1ZVVuaXRUeXBlICsgXCJUb1B4XCJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBSZWxhdGl2ZSBWYWx1ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyogT3BlcmF0b3IgbG9naWMgbXVzdCBiZSBwZXJmb3JtZWQgbGFzdCBzaW5jZSBpdCByZXF1aXJlcyB1bml0LW5vcm1hbGl6ZWQgc3RhcnQgYW5kIGVuZCB2YWx1ZXMuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBSZWxhdGl2ZSAqcGVyY2VudCB2YWx1ZXMqIGRvIG5vdCBiZWhhdmUgaG93IG1vc3QgcGVvcGxlIHRoaW5rOyB3aGlsZSBvbmUgd291bGQgZXhwZWN0IFwiKz01MCVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdG8gaW5jcmVhc2UgdGhlIHByb3BlcnR5IDEuNXggaXRzIGN1cnJlbnQgdmFsdWUsIGl0IGluIGZhY3QgaW5jcmVhc2VzIHRoZSBwZXJjZW50IHVuaXRzIGluIGFic29sdXRlIHRlcm1zOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgNTAgcG9pbnRzIGlzIGFkZGVkIG9uIHRvcCBvZiB0aGUgY3VycmVudCAlIHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCIrXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gc3RhcnRWYWx1ZSArIGVuZFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCItXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gc3RhcnRWYWx1ZSAtIGVuZFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCIqXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gc3RhcnRWYWx1ZSAqIGVuZFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCIvXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gc3RhcnRWYWx1ZSAvIGVuZFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0d2VlbnNDb250YWluZXIgUHVzaFxuICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIENvbnN0cnVjdCB0aGUgcGVyLXByb3BlcnR5IHR3ZWVuIG9iamVjdCwgYW5kIHB1c2ggaXQgdG8gdGhlIGVsZW1lbnQncyB0d2VlbnNDb250YWluZXIuICovXG4gICAgICAgICAgICAgICAgICAgICAgICB0d2VlbnNDb250YWluZXJbcHJvcGVydHldID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlOiByb290UHJvcGVydHlWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlOiBzdGFydFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZTogc3RhcnRWYWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZTogZW5kVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFR5cGU6IGVuZFZhbHVlVW5pdFR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWFzaW5nOiBlYXNpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChWZWxvY2l0eS5kZWJ1ZykgY29uc29sZS5sb2coXCJ0d2VlbnNDb250YWluZXIgKFwiICsgcHJvcGVydHkgKyBcIik6IFwiICsgSlNPTi5zdHJpbmdpZnkodHdlZW5zQ29udGFpbmVyW3Byb3BlcnR5XSksIGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLyogQWxvbmcgd2l0aCBpdHMgcHJvcGVydHkgZGF0YSwgc3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIGVsZW1lbnQgaXRzZWxmIG9udG8gdHdlZW5zQ29udGFpbmVyLiAqL1xuICAgICAgICAgICAgICAgICAgICB0d2VlbnNDb250YWluZXIuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICAgICAgIENhbGwgUHVzaFxuICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgLyogTm90ZTogdHdlZW5zQ29udGFpbmVyIGNhbiBiZSBlbXB0eSBpZiBhbGwgb2YgdGhlIHByb3BlcnRpZXMgaW4gdGhpcyBjYWxsJ3MgcHJvcGVydHkgbWFwIHdlcmUgc2tpcHBlZCBkdWUgdG8gbm90XG4gICAgICAgICAgICAgICAgICAgYmVpbmcgc3VwcG9ydGVkIGJ5IHRoZSBicm93c2VyLiBUaGUgZWxlbWVudCBwcm9wZXJ0eSBpcyB1c2VkIGZvciBjaGVja2luZyB0aGF0IHRoZSB0d2VlbnNDb250YWluZXIgaGFzIGJlZW4gYXBwZW5kZWQgdG8uICovXG4gICAgICAgICAgICAgICAgaWYgKHR3ZWVuc0NvbnRhaW5lci5lbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIEFwcGx5IHRoZSBcInZlbG9jaXR5LWFuaW1hdGluZ1wiIGluZGljYXRvciBjbGFzcy4gKi9cbiAgICAgICAgICAgICAgICAgICAgQ1NTLlZhbHVlcy5hZGRDbGFzcyhlbGVtZW50LCBcInZlbG9jaXR5LWFuaW1hdGluZ1wiKTtcblxuICAgICAgICAgICAgICAgICAgICAvKiBUaGUgY2FsbCBhcnJheSBob3VzZXMgdGhlIHR3ZWVuc0NvbnRhaW5lcnMgZm9yIGVhY2ggZWxlbWVudCBiZWluZyBhbmltYXRlZCBpbiB0aGUgY3VycmVudCBjYWxsLiAqL1xuICAgICAgICAgICAgICAgICAgICBjYWxsLnB1c2godHdlZW5zQ29udGFpbmVyKTtcblxuICAgICAgICAgICAgICAgICAgICAvKiBTdG9yZSB0aGUgdHdlZW5zQ29udGFpbmVyIGFuZCBvcHRpb25zIGlmIHdlJ3JlIHdvcmtpbmcgb24gdGhlIGRlZmF1bHQgZWZmZWN0cyBxdWV1ZSwgc28gdGhhdCB0aGV5IGNhbiBiZSB1c2VkIGJ5IHRoZSByZXZlcnNlIGNvbW1hbmQuICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLnF1ZXVlID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLnR3ZWVuc0NvbnRhaW5lciA9IHR3ZWVuc0NvbnRhaW5lcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkub3B0cyA9IG9wdHM7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKiBTd2l0Y2ggb24gdGhlIGVsZW1lbnQncyBhbmltYXRpbmcgZmxhZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5pc0FuaW1hdGluZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgLyogT25jZSB0aGUgZmluYWwgZWxlbWVudCBpbiB0aGlzIGNhbGwncyBlbGVtZW50IHNldCBoYXMgYmVlbiBwcm9jZXNzZWQsIHB1c2ggdGhlIGNhbGwgYXJyYXkgb250b1xuICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5TdGF0ZS5jYWxscyBmb3IgdGhlIGFuaW1hdGlvbiB0aWNrIHRvIGltbWVkaWF0ZWx5IGJlZ2luIHByb2Nlc3NpbmcuICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtZW50c0luZGV4ID09PSBlbGVtZW50c0xlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIEFkZCB0aGUgY3VycmVudCBjYWxsIHBsdXMgaXRzIGFzc29jaWF0ZWQgbWV0YWRhdGEgKHRoZSBlbGVtZW50IHNldCBhbmQgdGhlIGNhbGwncyBvcHRpb25zKSBvbnRvIHRoZSBnbG9iYWwgY2FsbCBjb250YWluZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBBbnl0aGluZyBvbiB0aGlzIGNhbGwgY29udGFpbmVyIGlzIHN1YmplY3RlZCB0byB0aWNrKCkgcHJvY2Vzc2luZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LlN0YXRlLmNhbGxzLnB1c2goWyBjYWxsLCBlbGVtZW50cywgb3B0cywgbnVsbCwgcHJvbWlzZURhdGEucmVzb2x2ZXIgXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBhbmltYXRpb24gdGljayBpc24ndCBydW5uaW5nLCBzdGFydCBpdC4gKFZlbG9jaXR5IHNodXRzIGl0IG9mZiB3aGVuIHRoZXJlIGFyZSBubyBhY3RpdmUgY2FsbHMgdG8gcHJvY2Vzcy4pICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoVmVsb2NpdHkuU3RhdGUuaXNUaWNraW5nID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LlN0YXRlLmlzVGlja2luZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTdGFydCB0aGUgdGljayBsb29wLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRzSW5kZXgrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyogV2hlbiB0aGUgcXVldWUgb3B0aW9uIGlzIHNldCB0byBmYWxzZSwgdGhlIGNhbGwgc2tpcHMgdGhlIGVsZW1lbnQncyBxdWV1ZSBhbmQgZmlyZXMgaW1tZWRpYXRlbHkuICovXG4gICAgICAgICAgICBpZiAob3B0cy5xdWV1ZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAvKiBTaW5jZSB0aGlzIGJ1aWxkUXVldWUgY2FsbCBkb2Vzbid0IHJlc3BlY3QgdGhlIGVsZW1lbnQncyBleGlzdGluZyBxdWV1ZSAod2hpY2ggaXMgd2hlcmUgYSBkZWxheSBvcHRpb24gd291bGQgaGF2ZSBiZWVuIGFwcGVuZGVkKSxcbiAgICAgICAgICAgICAgICAgICB3ZSBtYW51YWxseSBpbmplY3QgdGhlIGRlbGF5IHByb3BlcnR5IGhlcmUgd2l0aCBhbiBleHBsaWNpdCBzZXRUaW1lb3V0LiAqL1xuICAgICAgICAgICAgICAgIGlmIChvcHRzLmRlbGF5KSB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoYnVpbGRRdWV1ZSwgb3B0cy5kZWxheSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYnVpbGRRdWV1ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIE90aGVyd2lzZSwgdGhlIGNhbGwgdW5kZXJnb2VzIGVsZW1lbnQgcXVldWVpbmcgYXMgbm9ybWFsLiAqL1xuICAgICAgICAgICAgLyogTm90ZTogVG8gaW50ZXJvcGVyYXRlIHdpdGggalF1ZXJ5LCBWZWxvY2l0eSB1c2VzIGpRdWVyeSdzIG93biAkLnF1ZXVlKCkgc3RhY2sgZm9yIHF1ZXVpbmcgbG9naWMuICovXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICQucXVldWUoZWxlbWVudCwgb3B0cy5xdWV1ZSwgZnVuY3Rpb24obmV4dCwgY2xlYXJRdWV1ZSkge1xuICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgY2xlYXJRdWV1ZSBmbGFnIHdhcyBwYXNzZWQgaW4gYnkgdGhlIHN0b3AgY29tbWFuZCwgcmVzb2x2ZSB0aGlzIGNhbGwncyBwcm9taXNlLiAoUHJvbWlzZXMgY2FuIG9ubHkgYmUgcmVzb2x2ZWQgb25jZSxcbiAgICAgICAgICAgICAgICAgICAgICAgc28gaXQncyBmaW5lIGlmIHRoaXMgaXMgcmVwZWF0ZWRseSB0cmlnZ2VyZWQgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgYXNzb2NpYXRlZCBjYWxsLikgKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNsZWFyUXVldWUgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9taXNlRGF0YS5wcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZURhdGEucmVzb2x2ZXIoZWxlbWVudHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBEbyBub3QgY29udGludWUgd2l0aCBhbmltYXRpb24gcXVldWVpbmcuICovXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8qIFRoaXMgZmxhZyBpbmRpY2F0ZXMgdG8gdGhlIHVwY29taW5nIGNvbXBsZXRlQ2FsbCgpIGZ1bmN0aW9uIHRoYXQgdGhpcyBxdWV1ZSBlbnRyeSB3YXMgaW5pdGlhdGVkIGJ5IFZlbG9jaXR5LlxuICAgICAgICAgICAgICAgICAgICAgICBTZWUgY29tcGxldGVDYWxsKCkgZm9yIGZ1cnRoZXIgZGV0YWlscy4gKi9cbiAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkudmVsb2NpdHlRdWV1ZUVudHJ5RmxhZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgYnVpbGRRdWV1ZShuZXh0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgIEF1dG8tRGVxdWV1aW5nXG4gICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgIC8qIEFzIHBlciBqUXVlcnkncyAkLnF1ZXVlKCkgYmVoYXZpb3IsIHRvIGZpcmUgdGhlIGZpcnN0IG5vbi1jdXN0b20tcXVldWUgZW50cnkgb24gYW4gZWxlbWVudCwgdGhlIGVsZW1lbnRcbiAgICAgICAgICAgICAgIG11c3QgYmUgZGVxdWV1ZWQgaWYgaXRzIHF1ZXVlIHN0YWNrIGNvbnNpc3RzICpzb2xlbHkqIG9mIHRoZSBjdXJyZW50IGNhbGwuIChUaGlzIGNhbiBiZSBkZXRlcm1pbmVkIGJ5IGNoZWNraW5nXG4gICAgICAgICAgICAgICBmb3IgdGhlIFwiaW5wcm9ncmVzc1wiIGl0ZW0gdGhhdCBqUXVlcnkgcHJlcGVuZHMgdG8gYWN0aXZlIHF1ZXVlIHN0YWNrIGFycmF5cy4pIFJlZ2FyZGxlc3MsIHdoZW5ldmVyIHRoZSBlbGVtZW50J3NcbiAgICAgICAgICAgICAgIHF1ZXVlIGlzIGZ1cnRoZXIgYXBwZW5kZWQgd2l0aCBhZGRpdGlvbmFsIGl0ZW1zIC0tIGluY2x1ZGluZyAkLmRlbGF5KCkncyBvciBldmVuICQuYW5pbWF0ZSgpIGNhbGxzLCB0aGUgcXVldWUnc1xuICAgICAgICAgICAgICAgZmlyc3QgZW50cnkgaXMgYXV0b21hdGljYWxseSBmaXJlZC4gVGhpcyBiZWhhdmlvciBjb250cmFzdHMgdGhhdCBvZiBjdXN0b20gcXVldWVzLCB3aGljaCBuZXZlciBhdXRvLWZpcmUuICovXG4gICAgICAgICAgICAvKiBOb3RlOiBXaGVuIGFuIGVsZW1lbnQgc2V0IGlzIGJlaW5nIHN1YmplY3RlZCB0byBhIG5vbi1wYXJhbGxlbCBWZWxvY2l0eSBjYWxsLCB0aGUgYW5pbWF0aW9uIHdpbGwgbm90IGJlZ2luIHVudGlsXG4gICAgICAgICAgICAgICBlYWNoIG9uZSBvZiB0aGUgZWxlbWVudHMgaW4gdGhlIHNldCBoYXMgcmVhY2hlZCB0aGUgZW5kIG9mIGl0cyBpbmRpdmlkdWFsbHkgcHJlLWV4aXN0aW5nIHF1ZXVlIGNoYWluLiAqL1xuICAgICAgICAgICAgLyogTm90ZTogVW5mb3J0dW5hdGVseSwgbW9zdCBwZW9wbGUgZG9uJ3QgZnVsbHkgZ3Jhc3AgalF1ZXJ5J3MgcG93ZXJmdWwsIHlldCBxdWlya3ksICQucXVldWUoKSBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgIExlYW4gbW9yZSBoZXJlOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNTgxNTgvY2FuLXNvbWVib2R5LWV4cGxhaW4tanF1ZXJ5LXF1ZXVlLXRvLW1lICovXG4gICAgICAgICAgICBpZiAoKG9wdHMucXVldWUgPT09IFwiXCIgfHwgb3B0cy5xdWV1ZSA9PT0gXCJmeFwiKSAmJiAkLnF1ZXVlKGVsZW1lbnQpWzBdICE9PSBcImlucHJvZ3Jlc3NcIikge1xuICAgICAgICAgICAgICAgICQuZGVxdWV1ZShlbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICBFbGVtZW50IFNldCBJdGVyYXRpb25cbiAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgLyogSWYgdGhlIFwibm9kZVR5cGVcIiBwcm9wZXJ0eSBleGlzdHMgb24gdGhlIGVsZW1lbnRzIHZhcmlhYmxlLCB3ZSdyZSBhbmltYXRpbmcgYSBzaW5nbGUgZWxlbWVudC5cbiAgICAgICAgICAgUGxhY2UgaXQgaW4gYW4gYXJyYXkgc28gdGhhdCAkLmVhY2goKSBjYW4gaXRlcmF0ZSBvdmVyIGl0LiAqL1xuICAgICAgICAkLmVhY2goZWxlbWVudHMsIGZ1bmN0aW9uKGksIGVsZW1lbnQpIHtcbiAgICAgICAgICAgIC8qIEVuc3VyZSBlYWNoIGVsZW1lbnQgaW4gYSBzZXQgaGFzIGEgbm9kZVR5cGUgKGlzIGEgcmVhbCBlbGVtZW50KSB0byBhdm9pZCB0aHJvd2luZyBlcnJvcnMuICovXG4gICAgICAgICAgICBpZiAoVHlwZS5pc05vZGUoZWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICBwcm9jZXNzRWxlbWVudC5jYWxsKGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgIE9wdGlvbjogTG9vcFxuICAgICAgICAqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgLyogVGhlIGxvb3Agb3B0aW9uIGFjY2VwdHMgYW4gaW50ZWdlciBpbmRpY2F0aW5nIGhvdyBtYW55IHRpbWVzIHRoZSBlbGVtZW50IHNob3VsZCBsb29wIGJldHdlZW4gdGhlIHZhbHVlcyBpbiB0aGVcbiAgICAgICAgICAgY3VycmVudCBjYWxsJ3MgcHJvcGVydGllcyBtYXAgYW5kIHRoZSBlbGVtZW50J3MgcHJvcGVydHkgdmFsdWVzIHByaW9yIHRvIHRoaXMgY2FsbC4gKi9cbiAgICAgICAgLyogTm90ZTogVGhlIGxvb3Agb3B0aW9uJ3MgbG9naWMgaXMgcGVyZm9ybWVkIGhlcmUgLS0gYWZ0ZXIgZWxlbWVudCBwcm9jZXNzaW5nIC0tIGJlY2F1c2UgdGhlIGN1cnJlbnQgY2FsbCBuZWVkc1xuICAgICAgICAgICB0byB1bmRlcmdvIGl0cyBxdWV1ZSBpbnNlcnRpb24gcHJpb3IgdG8gdGhlIGxvb3Agb3B0aW9uIGdlbmVyYXRpbmcgaXRzIHNlcmllcyBvZiBjb25zdGl0dWVudCBcInJldmVyc2VcIiBjYWxscyxcbiAgICAgICAgICAgd2hpY2ggY2hhaW4gYWZ0ZXIgdGhlIGN1cnJlbnQgY2FsbC4gVHdvIHJldmVyc2UgY2FsbHMgKHR3byBcImFsdGVybmF0aW9uc1wiKSBjb25zdGl0dXRlIG9uZSBsb29wLiAqL1xuICAgICAgICB2YXIgb3B0cyA9ICQuZXh0ZW5kKHt9LCBWZWxvY2l0eS5kZWZhdWx0cywgb3B0aW9ucyksXG4gICAgICAgICAgICByZXZlcnNlQ2FsbHNDb3VudDtcblxuICAgICAgICBvcHRzLmxvb3AgPSBwYXJzZUludChvcHRzLmxvb3ApO1xuICAgICAgICByZXZlcnNlQ2FsbHNDb3VudCA9IChvcHRzLmxvb3AgKiAyKSAtIDE7XG5cbiAgICAgICAgaWYgKG9wdHMubG9vcCkge1xuICAgICAgICAgICAgLyogRG91YmxlIHRoZSBsb29wIGNvdW50IHRvIGNvbnZlcnQgaXQgaW50byBpdHMgYXBwcm9wcmlhdGUgbnVtYmVyIG9mIFwicmV2ZXJzZVwiIGNhbGxzLlxuICAgICAgICAgICAgICAgU3VidHJhY3QgMSBmcm9tIHRoZSByZXN1bHRpbmcgdmFsdWUgc2luY2UgdGhlIGN1cnJlbnQgY2FsbCBpcyBpbmNsdWRlZCBpbiB0aGUgdG90YWwgYWx0ZXJuYXRpb24gY291bnQuICovXG4gICAgICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8IHJldmVyc2VDYWxsc0NvdW50OyB4KyspIHtcbiAgICAgICAgICAgICAgICAvKiBTaW5jZSB0aGUgbG9naWMgZm9yIHRoZSByZXZlcnNlIGFjdGlvbiBvY2N1cnMgaW5zaWRlIFF1ZXVlaW5nIGFuZCB0aGVyZWZvcmUgdGhpcyBjYWxsJ3Mgb3B0aW9ucyBvYmplY3RcbiAgICAgICAgICAgICAgICAgICBpc24ndCBwYXJzZWQgdW50aWwgdGhlbiBhcyB3ZWxsLCB0aGUgY3VycmVudCBjYWxsJ3MgZGVsYXkgb3B0aW9uIG11c3QgYmUgZXhwbGljaXRseSBwYXNzZWQgaW50byB0aGUgcmV2ZXJzZVxuICAgICAgICAgICAgICAgICAgIGNhbGwgc28gdGhhdCB0aGUgZGVsYXkgbG9naWMgdGhhdCBvY2N1cnMgaW5zaWRlICpQcmUtUXVldWVpbmcqIGNhbiBwcm9jZXNzIGl0LiAqL1xuICAgICAgICAgICAgICAgIHZhciByZXZlcnNlT3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgZGVsYXk6IG9wdHMuZGVsYXksXG4gICAgICAgICAgICAgICAgICAgIHByb2dyZXNzOiBvcHRzLnByb2dyZXNzXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qIElmIGEgY29tcGxldGUgY2FsbGJhY2sgd2FzIHBhc3NlZCBpbnRvIHRoaXMgY2FsbCwgdHJhbnNmZXIgaXQgdG8gdGhlIGxvb3AgcmVkaXJlY3QncyBmaW5hbCBcInJldmVyc2VcIiBjYWxsXG4gICAgICAgICAgICAgICAgICAgc28gdGhhdCBpdCdzIHRyaWdnZXJlZCB3aGVuIHRoZSBlbnRpcmUgcmVkaXJlY3QgaXMgY29tcGxldGUgKGFuZCBub3Qgd2hlbiB0aGUgdmVyeSBmaXJzdCBhbmltYXRpb24gaXMgY29tcGxldGUpLiAqL1xuICAgICAgICAgICAgICAgIGlmICh4ID09PSByZXZlcnNlQ2FsbHNDb3VudCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV2ZXJzZU9wdGlvbnMuZGlzcGxheSA9IG9wdHMuZGlzcGxheTtcbiAgICAgICAgICAgICAgICAgICAgcmV2ZXJzZU9wdGlvbnMudmlzaWJpbGl0eSA9IG9wdHMudmlzaWJpbGl0eTtcbiAgICAgICAgICAgICAgICAgICAgcmV2ZXJzZU9wdGlvbnMuY29tcGxldGUgPSBvcHRzLmNvbXBsZXRlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGFuaW1hdGUoZWxlbWVudHMsIFwicmV2ZXJzZVwiLCByZXZlcnNlT3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKioqKioqKioqKioqKioqXG4gICAgICAgICAgICBDaGFpbmluZ1xuICAgICAgICAqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgLyogUmV0dXJuIHRoZSBlbGVtZW50cyBiYWNrIHRvIHRoZSBjYWxsIGNoYWluLCB3aXRoIHdyYXBwZWQgZWxlbWVudHMgdGFraW5nIHByZWNlZGVuY2UgaW4gY2FzZSBWZWxvY2l0eSB3YXMgY2FsbGVkIHZpYSB0aGUgJC5mbi4gZXh0ZW5zaW9uLiAqL1xuICAgICAgICByZXR1cm4gZ2V0Q2hhaW4oKTtcbiAgICB9O1xuXG4gICAgLyogVHVybiBWZWxvY2l0eSBpbnRvIHRoZSBhbmltYXRpb24gZnVuY3Rpb24sIGV4dGVuZGVkIHdpdGggdGhlIHByZS1leGlzdGluZyBWZWxvY2l0eSBvYmplY3QuICovXG4gICAgVmVsb2NpdHkgPSAkLmV4dGVuZChhbmltYXRlLCBWZWxvY2l0eSk7XG4gICAgLyogRm9yIGxlZ2FjeSBzdXBwb3J0LCBhbHNvIGV4cG9zZSB0aGUgbGl0ZXJhbCBhbmltYXRlIG1ldGhvZC4gKi9cbiAgICBWZWxvY2l0eS5hbmltYXRlID0gYW5pbWF0ZTtcblxuICAgIC8qKioqKioqKioqKioqKlxuICAgICAgICBUaW1pbmdcbiAgICAqKioqKioqKioqKioqKi9cblxuICAgIC8qIFRpY2tlciBmdW5jdGlvbi4gKi9cbiAgICB2YXIgdGlja2VyID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCByQUZTaGltO1xuXG4gICAgLyogSW5hY3RpdmUgYnJvd3NlciB0YWJzIHBhdXNlIHJBRiwgd2hpY2ggcmVzdWx0cyBpbiBhbGwgYWN0aXZlIGFuaW1hdGlvbnMgaW1tZWRpYXRlbHkgc3ByaW50aW5nIHRvIHRoZWlyIGNvbXBsZXRpb24gc3RhdGVzIHdoZW4gdGhlIHRhYiByZWZvY3VzZXMuXG4gICAgICAgVG8gZ2V0IGFyb3VuZCB0aGlzLCB3ZSBkeW5hbWljYWxseSBzd2l0Y2ggckFGIHRvIHNldFRpbWVvdXQgKHdoaWNoIHRoZSBicm93c2VyICpkb2Vzbid0KiBwYXVzZSkgd2hlbiB0aGUgdGFiIGxvc2VzIGZvY3VzLiBXZSBza2lwIHRoaXMgZm9yIG1vYmlsZVxuICAgICAgIGRldmljZXMgdG8gYXZvaWQgd2FzdGluZyBiYXR0ZXJ5IHBvd2VyIG9uIGluYWN0aXZlIHRhYnMuICovXG4gICAgLyogTm90ZTogVGFiIGZvY3VzIGRldGVjdGlvbiBkb2Vzbid0IHdvcmsgb24gb2xkZXIgdmVyc2lvbnMgb2YgSUUsIGJ1dCB0aGF0J3Mgb2theSBzaW5jZSB0aGV5IGRvbid0IHN1cHBvcnQgckFGIHRvIGJlZ2luIHdpdGguICovXG4gICAgaWYgKCFWZWxvY2l0eS5TdGF0ZS5pc01vYmlsZSAmJiBkb2N1bWVudC5oaWRkZW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwidmlzaWJpbGl0eWNoYW5nZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8qIFJlYXNzaWduIHRoZSByQUYgZnVuY3Rpb24gKHdoaWNoIHRoZSBnbG9iYWwgdGljaygpIGZ1bmN0aW9uIHVzZXMpIGJhc2VkIG9uIHRoZSB0YWIncyBmb2N1cyBzdGF0ZS4gKi9cbiAgICAgICAgICAgIGlmIChkb2N1bWVudC5oaWRkZW4pIHtcbiAgICAgICAgICAgICAgICB0aWNrZXIgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAvKiBUaGUgdGljayBmdW5jdGlvbiBuZWVkcyBhIHRydXRoeSBmaXJzdCBhcmd1bWVudCBpbiBvcmRlciB0byBwYXNzIGl0cyBpbnRlcm5hbCB0aW1lc3RhbXAgY2hlY2suICovXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayh0cnVlKSB9LCAxNik7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8qIFRoZSByQUYgbG9vcCBoYXMgYmVlbiBwYXVzZWQgYnkgdGhlIGJyb3dzZXIsIHNvIHdlIG1hbnVhbGx5IHJlc3RhcnQgdGhlIHRpY2suICovXG4gICAgICAgICAgICAgICAgdGljaygpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aWNrZXIgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHJBRlNoaW07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKioqKioqKioqKipcbiAgICAgICAgVGlja1xuICAgICoqKioqKioqKioqKi9cblxuICAgIC8qIE5vdGU6IEFsbCBjYWxscyB0byBWZWxvY2l0eSBhcmUgcHVzaGVkIHRvIHRoZSBWZWxvY2l0eS5TdGF0ZS5jYWxscyBhcnJheSwgd2hpY2ggaXMgZnVsbHkgaXRlcmF0ZWQgdGhyb3VnaCB1cG9uIGVhY2ggdGljay4gKi9cbiAgICBmdW5jdGlvbiB0aWNrICh0aW1lc3RhbXApIHtcbiAgICAgICAgLyogQW4gZW1wdHkgdGltZXN0YW1wIGFyZ3VtZW50IGluZGljYXRlcyB0aGF0IHRoaXMgaXMgdGhlIGZpcnN0IHRpY2sgb2NjdXJlbmNlIHNpbmNlIHRpY2tpbmcgd2FzIHR1cm5lZCBvbi5cbiAgICAgICAgICAgV2UgbGV2ZXJhZ2UgdGhpcyBtZXRhZGF0YSB0byBmdWxseSBpZ25vcmUgdGhlIGZpcnN0IHRpY2sgcGFzcyBzaW5jZSBSQUYncyBpbml0aWFsIHBhc3MgaXMgZmlyZWQgd2hlbmV2ZXJcbiAgICAgICAgICAgdGhlIGJyb3dzZXIncyBuZXh0IHRpY2sgc3luYyB0aW1lIG9jY3Vycywgd2hpY2ggcmVzdWx0cyBpbiB0aGUgZmlyc3QgZWxlbWVudHMgc3ViamVjdGVkIHRvIFZlbG9jaXR5XG4gICAgICAgICAgIGNhbGxzIGJlaW5nIGFuaW1hdGVkIG91dCBvZiBzeW5jIHdpdGggYW55IGVsZW1lbnRzIGFuaW1hdGVkIGltbWVkaWF0ZWx5IHRoZXJlYWZ0ZXIuIEluIHNob3J0LCB3ZSBpZ25vcmVcbiAgICAgICAgICAgdGhlIGZpcnN0IFJBRiB0aWNrIHBhc3Mgc28gdGhhdCBlbGVtZW50cyBiZWluZyBpbW1lZGlhdGVseSBjb25zZWN1dGl2ZWx5IGFuaW1hdGVkIC0tIGluc3RlYWQgb2Ygc2ltdWx0YW5lb3VzbHkgYW5pbWF0ZWRcbiAgICAgICAgICAgYnkgdGhlIHNhbWUgVmVsb2NpdHkgY2FsbCAtLSBhcmUgcHJvcGVybHkgYmF0Y2hlZCBpbnRvIHRoZSBzYW1lIGluaXRpYWwgUkFGIHRpY2sgYW5kIGNvbnNlcXVlbnRseSByZW1haW4gaW4gc3luYyB0aGVyZWFmdGVyLiAqL1xuICAgICAgICBpZiAodGltZXN0YW1wKSB7XG4gICAgICAgICAgICAvKiBXZSBpZ25vcmUgUkFGJ3MgaGlnaCByZXNvbHV0aW9uIHRpbWVzdGFtcCBzaW5jZSBpdCBjYW4gYmUgc2lnbmlmaWNhbnRseSBvZmZzZXQgd2hlbiB0aGUgYnJvd3NlciBpc1xuICAgICAgICAgICAgICAgdW5kZXIgaGlnaCBzdHJlc3M7IHdlIG9wdCBmb3IgY2hvcHBpbmVzcyBvdmVyIGFsbG93aW5nIHRoZSBicm93c2VyIHRvIGRyb3AgaHVnZSBjaHVua3Mgb2YgZnJhbWVzLiAqL1xuICAgICAgICAgICAgdmFyIHRpbWVDdXJyZW50ID0gKG5ldyBEYXRlKS5nZXRUaW1lKCk7XG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgQ2FsbCBJdGVyYXRpb25cbiAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICB2YXIgY2FsbHNMZW5ndGggPSBWZWxvY2l0eS5TdGF0ZS5jYWxscy5sZW5ndGg7XG5cbiAgICAgICAgICAgIC8qIFRvIHNwZWVkIHVwIGl0ZXJhdGluZyBvdmVyIHRoaXMgYXJyYXksIGl0IGlzIGNvbXBhY3RlZCAoZmFsc2V5IGl0ZW1zIC0tIGNhbGxzIHRoYXQgaGF2ZSBjb21wbGV0ZWQgLS0gYXJlIHJlbW92ZWQpXG4gICAgICAgICAgICAgICB3aGVuIGl0cyBsZW5ndGggaGFzIGJhbGxvb25lZCB0byBhIHBvaW50IHRoYXQgY2FuIGltcGFjdCB0aWNrIHBlcmZvcm1hbmNlLiBUaGlzIG9ubHkgYmVjb21lcyBuZWNlc3Nhcnkgd2hlbiBhbmltYXRpb25cbiAgICAgICAgICAgICAgIGhhcyBiZWVuIGNvbnRpbnVvdXMgd2l0aCBtYW55IGVsZW1lbnRzIG92ZXIgYSBsb25nIHBlcmlvZCBvZiB0aW1lOyB3aGVuZXZlciBhbGwgYWN0aXZlIGNhbGxzIGFyZSBjb21wbGV0ZWQsIGNvbXBsZXRlQ2FsbCgpIGNsZWFycyBWZWxvY2l0eS5TdGF0ZS5jYWxscy4gKi9cbiAgICAgICAgICAgIGlmIChjYWxsc0xlbmd0aCA+IDEwMDAwKSB7XG4gICAgICAgICAgICAgICAgVmVsb2NpdHkuU3RhdGUuY2FsbHMgPSBjb21wYWN0U3BhcnNlQXJyYXkoVmVsb2NpdHkuU3RhdGUuY2FsbHMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiBJdGVyYXRlIHRocm91Z2ggZWFjaCBhY3RpdmUgY2FsbC4gKi9cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIC8qIFdoZW4gYSBWZWxvY2l0eSBjYWxsIGlzIGNvbXBsZXRlZCwgaXRzIFZlbG9jaXR5LlN0YXRlLmNhbGxzIGVudHJ5IGlzIHNldCB0byBmYWxzZS4gQ29udGludWUgb24gdG8gdGhlIG5leHQgY2FsbC4gKi9cbiAgICAgICAgICAgICAgICBpZiAoIVZlbG9jaXR5LlN0YXRlLmNhbGxzW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICBDYWxsLVdpZGUgVmFyaWFibGVzXG4gICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgdmFyIGNhbGxDb250YWluZXIgPSBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgY2FsbCA9IGNhbGxDb250YWluZXJbMF0sXG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSBjYWxsQ29udGFpbmVyWzJdLFxuICAgICAgICAgICAgICAgICAgICB0aW1lU3RhcnQgPSBjYWxsQ29udGFpbmVyWzNdLFxuICAgICAgICAgICAgICAgICAgICBmaXJzdFRpY2sgPSAhIXRpbWVTdGFydCxcbiAgICAgICAgICAgICAgICAgICAgdHdlZW5EdW1teVZhbHVlID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIC8qIElmIHRpbWVTdGFydCBpcyB1bmRlZmluZWQsIHRoZW4gdGhpcyBpcyB0aGUgZmlyc3QgdGltZSB0aGF0IHRoaXMgY2FsbCBoYXMgYmVlbiBwcm9jZXNzZWQgYnkgdGljaygpLlxuICAgICAgICAgICAgICAgICAgIFdlIGFzc2lnbiB0aW1lU3RhcnQgbm93IHNvIHRoYXQgaXRzIHZhbHVlIGlzIGFzIGNsb3NlIHRvIHRoZSByZWFsIGFuaW1hdGlvbiBzdGFydCB0aW1lIGFzIHBvc3NpYmxlLlxuICAgICAgICAgICAgICAgICAgIChDb252ZXJzZWx5LCBoYWQgdGltZVN0YXJ0IGJlZW4gZGVmaW5lZCB3aGVuIHRoaXMgY2FsbCB3YXMgYWRkZWQgdG8gVmVsb2NpdHkuU3RhdGUuY2FsbHMsIHRoZSBkZWxheVxuICAgICAgICAgICAgICAgICAgIGJldHdlZW4gdGhhdCB0aW1lIGFuZCBub3cgd291bGQgY2F1c2UgdGhlIGZpcnN0IGZldyBmcmFtZXMgb2YgdGhlIHR3ZWVuIHRvIGJlIHNraXBwZWQgc2luY2VcbiAgICAgICAgICAgICAgICAgICBwZXJjZW50Q29tcGxldGUgaXMgY2FsY3VsYXRlZCByZWxhdGl2ZSB0byB0aW1lU3RhcnQuKSAqL1xuICAgICAgICAgICAgICAgIC8qIEZ1cnRoZXIsIHN1YnRyYWN0IDE2bXMgKHRoZSBhcHByb3hpbWF0ZSByZXNvbHV0aW9uIG9mIFJBRikgZnJvbSB0aGUgY3VycmVudCB0aW1lIHZhbHVlIHNvIHRoYXQgdGhlXG4gICAgICAgICAgICAgICAgICAgZmlyc3QgdGljayBpdGVyYXRpb24gaXNuJ3Qgd2FzdGVkIGJ5IGFuaW1hdGluZyBhdCAwJSB0d2VlbiBjb21wbGV0aW9uLCB3aGljaCB3b3VsZCBwcm9kdWNlIHRoZVxuICAgICAgICAgICAgICAgICAgIHNhbWUgc3R5bGUgdmFsdWUgYXMgdGhlIGVsZW1lbnQncyBjdXJyZW50IHZhbHVlLiAqL1xuICAgICAgICAgICAgICAgIGlmICghdGltZVN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVTdGFydCA9IFZlbG9jaXR5LlN0YXRlLmNhbGxzW2ldWzNdID0gdGltZUN1cnJlbnQgLSAxNjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKiBUaGUgdHdlZW4ncyBjb21wbGV0aW9uIHBlcmNlbnRhZ2UgaXMgcmVsYXRpdmUgdG8gdGhlIHR3ZWVuJ3Mgc3RhcnQgdGltZSwgbm90IHRoZSB0d2VlbidzIHN0YXJ0IHZhbHVlXG4gICAgICAgICAgICAgICAgICAgKHdoaWNoIHdvdWxkIHJlc3VsdCBpbiB1bnByZWRpY3RhYmxlIHR3ZWVuIGR1cmF0aW9ucyBzaW5jZSBKYXZhU2NyaXB0J3MgdGltZXJzIGFyZSBub3QgcGFydGljdWxhcmx5IGFjY3VyYXRlKS5cbiAgICAgICAgICAgICAgICAgICBBY2NvcmRpbmdseSwgd2UgZW5zdXJlIHRoYXQgcGVyY2VudENvbXBsZXRlIGRvZXMgbm90IGV4Y2VlZCAxLiAqL1xuICAgICAgICAgICAgICAgIHZhciBwZXJjZW50Q29tcGxldGUgPSBNYXRoLm1pbigodGltZUN1cnJlbnQgLSB0aW1lU3RhcnQpIC8gb3B0cy5kdXJhdGlvbiwgMSk7XG5cbiAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgIEVsZW1lbnQgSXRlcmF0aW9uXG4gICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgIC8qIEZvciBldmVyeSBjYWxsLCBpdGVyYXRlIHRocm91Z2ggZWFjaCBvZiB0aGUgZWxlbWVudHMgaW4gaXRzIHNldC4gKi9cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMCwgY2FsbExlbmd0aCA9IGNhbGwubGVuZ3RoOyBqIDwgY2FsbExlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0d2VlbnNDb250YWluZXIgPSBjYWxsW2pdLFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudCA9IHR3ZWVuc0NvbnRhaW5lci5lbGVtZW50O1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIENoZWNrIHRvIHNlZSBpZiB0aGlzIGVsZW1lbnQgaGFzIGJlZW4gZGVsZXRlZCBtaWR3YXkgdGhyb3VnaCB0aGUgYW5pbWF0aW9uIGJ5IGNoZWNraW5nIGZvciB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAgY29udGludWVkIGV4aXN0ZW5jZSBvZiBpdHMgZGF0YSBjYWNoZS4gSWYgaXQncyBnb25lLCBza2lwIGFuaW1hdGluZyB0aGlzIGVsZW1lbnQuICovXG4gICAgICAgICAgICAgICAgICAgIGlmICghRGF0YShlbGVtZW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgdHJhbnNmb3JtUHJvcGVydHlFeGlzdHMgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICBEaXNwbGF5ICYgVmlzaWJpbGl0eSBUb2dnbGluZ1xuICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBkaXNwbGF5IG9wdGlvbiBpcyBzZXQgdG8gbm9uLVwibm9uZVwiLCBzZXQgaXQgdXBmcm9udCBzbyB0aGF0IHRoZSBlbGVtZW50IGNhbiBiZWNvbWUgdmlzaWJsZSBiZWZvcmUgdHdlZW5pbmcgYmVnaW5zLlxuICAgICAgICAgICAgICAgICAgICAgICAoT3RoZXJ3aXNlLCBkaXNwbGF5J3MgXCJub25lXCIgdmFsdWUgaXMgc2V0IGluIGNvbXBsZXRlQ2FsbCgpIG9uY2UgdGhlIGFuaW1hdGlvbiBoYXMgY29tcGxldGVkLikgKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMuZGlzcGxheSAhPT0gdW5kZWZpbmVkICYmIG9wdHMuZGlzcGxheSAhPT0gbnVsbCAmJiBvcHRzLmRpc3BsYXkgIT09IFwibm9uZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5kaXNwbGF5ID09PSBcImZsZXhcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmbGV4VmFsdWVzID0gWyBcIi13ZWJraXQtYm94XCIsIFwiLW1vei1ib3hcIiwgXCItbXMtZmxleGJveFwiLCBcIi13ZWJraXQtZmxleFwiIF07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goZmxleFZhbHVlcywgZnVuY3Rpb24oaSwgZmxleFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiZGlzcGxheVwiLCBmbGV4VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImRpc3BsYXlcIiwgb3B0cy5kaXNwbGF5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8qIFNhbWUgZ29lcyB3aXRoIHRoZSB2aXNpYmlsaXR5IG9wdGlvbiwgYnV0IGl0cyBcIm5vbmVcIiBlcXVpdmFsZW50IGlzIFwiaGlkZGVuXCIuICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLnZpc2liaWxpdHkgIT09IHVuZGVmaW5lZCAmJiBvcHRzLnZpc2liaWxpdHkgIT09IFwiaGlkZGVuXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwidmlzaWJpbGl0eVwiLCBvcHRzLnZpc2liaWxpdHkpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICBQcm9wZXJ0eSBJdGVyYXRpb25cbiAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIEZvciBldmVyeSBlbGVtZW50LCBpdGVyYXRlIHRocm91Z2ggZWFjaCBwcm9wZXJ0eS4gKi9cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcGVydHkgaW4gdHdlZW5zQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBJbiBhZGRpdGlvbiB0byBwcm9wZXJ0eSB0d2VlbiBkYXRhLCB0d2VlbnNDb250YWluZXIgY29udGFpbnMgYSByZWZlcmVuY2UgdG8gaXRzIGFzc29jaWF0ZWQgZWxlbWVudC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eSAhPT0gXCJlbGVtZW50XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdHdlZW4gPSB0d2VlbnNDb250YWluZXJbcHJvcGVydHldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEVhc2luZyBjYW4gZWl0aGVyIGJlIGEgcHJlLWdlbmVyZWF0ZWQgZnVuY3Rpb24gb3IgYSBzdHJpbmcgdGhhdCByZWZlcmVuY2VzIGEgcHJlLXJlZ2lzdGVyZWQgZWFzaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uIHRoZSBWZWxvY2l0eS5FYXNpbmdzIG9iamVjdC4gSW4gZWl0aGVyIGNhc2UsIHJldHVybiB0aGUgYXBwcm9wcmlhdGUgZWFzaW5nICpmdW5jdGlvbiouICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVhc2luZyA9IFR5cGUuaXNTdHJpbmcodHdlZW4uZWFzaW5nKSA/IFZlbG9jaXR5LkVhc2luZ3NbdHdlZW4uZWFzaW5nXSA6IHR3ZWVuLmVhc2luZztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDdXJyZW50IFZhbHVlIENhbGN1bGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhpcyBpcyB0aGUgbGFzdCB0aWNrIHBhc3MgKGlmIHdlJ3ZlIHJlYWNoZWQgMTAwJSBjb21wbGV0aW9uIGZvciB0aGlzIHR3ZWVuKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnN1cmUgdGhhdCBjdXJyZW50VmFsdWUgaXMgZXhwbGljaXRseSBzZXQgdG8gaXRzIHRhcmdldCBlbmRWYWx1ZSBzbyB0aGF0IGl0J3Mgbm90IHN1YmplY3RlZCB0byBhbnkgcm91bmRpbmcuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlcmNlbnRDb21wbGV0ZSA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWUgPSB0d2Vlbi5lbmRWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBPdGhlcndpc2UsIGNhbGN1bGF0ZSBjdXJyZW50VmFsdWUgYmFzZWQgb24gdGhlIGN1cnJlbnQgZGVsdGEgZnJvbSBzdGFydFZhbHVlLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0d2VlbkRlbHRhID0gdHdlZW4uZW5kVmFsdWUgLSB0d2Vlbi5zdGFydFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWUgPSB0d2Vlbi5zdGFydFZhbHVlICsgKHR3ZWVuRGVsdGEgKiBlYXNpbmcocGVyY2VudENvbXBsZXRlLCBvcHRzLCB0d2VlbkRlbHRhKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgbm8gdmFsdWUgY2hhbmdlIGlzIG9jY3VycmluZywgZG9uJ3QgcHJvY2VlZCB3aXRoIERPTSB1cGRhdGluZy4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmaXJzdFRpY2sgJiYgKGN1cnJlbnRWYWx1ZSA9PT0gdHdlZW4uY3VycmVudFZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0d2Vlbi5jdXJyZW50VmFsdWUgPSBjdXJyZW50VmFsdWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB3ZSdyZSB0d2VlbmluZyBhIGZha2UgJ3R3ZWVuJyBwcm9wZXJ0eSBpbiBvcmRlciB0byBsb2cgdHJhbnNpdGlvbiB2YWx1ZXMsIHVwZGF0ZSB0aGUgb25lLXBlci1jYWxsIHZhcmlhYmxlIHNvIHRoYXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdCBjYW4gYmUgcGFzc2VkIGludG8gdGhlIHByb2dyZXNzIGNhbGxiYWNrLiAqLyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHkgPT09IFwidHdlZW5cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0d2VlbkR1bW15VmFsdWUgPSBjdXJyZW50VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBIb29rczogUGFydCBJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBGb3IgaG9va2VkIHByb3BlcnRpZXMsIHRoZSBuZXdseS11cGRhdGVkIHJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGUgaXMgY2FjaGVkIG9udG8gdGhlIGVsZW1lbnQgc28gdGhhdCBpdCBjYW4gYmUgdXNlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3Igc3Vic2VxdWVudCBob29rcyBpbiB0aGlzIGNhbGwgdGhhdCBhcmUgYXNzb2NpYXRlZCB3aXRoIHRoZSBzYW1lIHJvb3QgcHJvcGVydHkuIElmIHdlIGRpZG4ndCBjYWNoZSB0aGUgdXBkYXRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSwgZWFjaCBzdWJzZXF1ZW50IHVwZGF0ZSB0byB0aGUgcm9vdCBwcm9wZXJ0eSBpbiB0aGlzIHRpY2sgcGFzcyB3b3VsZCByZXNldCB0aGUgcHJldmlvdXMgaG9vaydzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZXMgdG8gcm9vdFByb3BlcnR5VmFsdWUgcHJpb3IgdG8gaW5qZWN0aW9uLiBBIG5pY2UgcGVyZm9ybWFuY2UgYnlwcm9kdWN0IG9mIHJvb3RQcm9wZXJ0eVZhbHVlIGNhY2hpbmcgaXMgdGhhdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJzZXF1ZW50bHkgY2hhaW5lZCBhbmltYXRpb25zIHVzaW5nIHRoZSBzYW1lIGhvb2tSb290IGJ1dCBhIGRpZmZlcmVudCBob29rIGNhbiB1c2UgdGhpcyBjYWNoZWQgcm9vdFByb3BlcnR5VmFsdWUuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDU1MuSG9va3MucmVnaXN0ZXJlZFtwcm9wZXJ0eV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBob29rUm9vdCA9IENTUy5Ib29rcy5nZXRSb290KHByb3BlcnR5KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZUNhY2hlID0gRGF0YShlbGVtZW50KS5yb290UHJvcGVydHlWYWx1ZUNhY2hlW2hvb2tSb290XTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0d2Vlbi5yb290UHJvcGVydHlWYWx1ZSA9IHJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERPTSBVcGRhdGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogc2V0UHJvcGVydHlWYWx1ZSgpIHJldHVybnMgYW4gYXJyYXkgb2YgdGhlIHByb3BlcnR5IG5hbWUgYW5kIHByb3BlcnR5IHZhbHVlIHBvc3QgYW55IG5vcm1hbGl6YXRpb24gdGhhdCBtYXkgaGF2ZSBiZWVuIHBlcmZvcm1lZC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogVG8gc29sdmUgYW4gSUU8PTggcG9zaXRpb25pbmcgYnVnLCB0aGUgdW5pdCB0eXBlIGlzIGRyb3BwZWQgd2hlbiBzZXR0aW5nIGEgcHJvcGVydHkgdmFsdWUgb2YgMC4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFkanVzdGVkU2V0RGF0YSA9IENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIC8qIFNFVCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0d2Vlbi5jdXJyZW50VmFsdWUgKyAocGFyc2VGbG9hdChjdXJyZW50VmFsdWUpID09PSAwID8gXCJcIiA6IHR3ZWVuLnVuaXRUeXBlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuLnJvb3RQcm9wZXJ0eVZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW4uc2Nyb2xsRGF0YSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSG9va3M6IFBhcnQgSUlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3cgdGhhdCB3ZSBoYXZlIHRoZSBob29rJ3MgdXBkYXRlZCByb290UHJvcGVydHlWYWx1ZSAodGhlIHBvc3QtcHJvY2Vzc2VkIHZhbHVlIHByb3ZpZGVkIGJ5IGFkanVzdGVkU2V0RGF0YSksIGNhY2hlIGl0IG9udG8gdGhlIGVsZW1lbnQuICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDU1MuSG9va3MucmVnaXN0ZXJlZFtwcm9wZXJ0eV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNpbmNlIGFkanVzdGVkU2V0RGF0YSBjb250YWlucyBub3JtYWxpemVkIGRhdGEgcmVhZHkgZm9yIERPTSB1cGRhdGluZywgdGhlIHJvb3RQcm9wZXJ0eVZhbHVlIG5lZWRzIHRvIGJlIHJlLWV4dHJhY3RlZCBmcm9tIGl0cyBub3JtYWxpemVkIGZvcm0uID8/ICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbaG9va1Jvb3RdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5yb290UHJvcGVydHlWYWx1ZUNhY2hlW2hvb2tSb290XSA9IENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW2hvb2tSb290XShcImV4dHJhY3RcIiwgbnVsbCwgYWRqdXN0ZWRTZXREYXRhWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5yb290UHJvcGVydHlWYWx1ZUNhY2hlW2hvb2tSb290XSA9IGFkanVzdGVkU2V0RGF0YVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVHJhbnNmb3Jtc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRmxhZyB3aGV0aGVyIGEgdHJhbnNmb3JtIHByb3BlcnR5IGlzIGJlaW5nIGFuaW1hdGVkIHNvIHRoYXQgZmx1c2hUcmFuc2Zvcm1DYWNoZSgpIGNhbiBiZSB0cmlnZ2VyZWQgb25jZSB0aGlzIHRpY2sgcGFzcyBpcyBjb21wbGV0ZS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFkanVzdGVkU2V0RGF0YVswXSA9PT0gXCJ0cmFuc2Zvcm1cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUHJvcGVydHlFeGlzdHMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKlxuICAgICAgICAgICAgICAgICAgICAgICAgbW9iaWxlSEFcbiAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgICAgICAgICAvKiBJZiBtb2JpbGVIQSBpcyBlbmFibGVkLCBzZXQgdGhlIHRyYW5zbGF0ZTNkIHRyYW5zZm9ybSB0byBudWxsIHRvIGZvcmNlIGhhcmR3YXJlIGFjY2VsZXJhdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICAgSXQncyBzYWZlIHRvIG92ZXJyaWRlIHRoaXMgcHJvcGVydHkgc2luY2UgVmVsb2NpdHkgZG9lc24ndCBhY3R1YWxseSBzdXBwb3J0IGl0cyBhbmltYXRpb24gKGhvb2tzIGFyZSB1c2VkIGluIGl0cyBwbGFjZSkuICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLm1vYmlsZUhBKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBEb24ndCBzZXQgdGhlIG51bGwgdHJhbnNmb3JtIGhhY2sgaWYgd2UndmUgYWxyZWFkeSBkb25lIHNvLiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGUudHJhbnNsYXRlM2QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEFsbCBlbnRyaWVzIG9uIHRoZSB0cmFuc2Zvcm1DYWNoZSBvYmplY3QgYXJlIGxhdGVyIGNvbmNhdGVuYXRlZCBpbnRvIGEgc2luZ2xlIHRyYW5zZm9ybSBzdHJpbmcgdmlhIGZsdXNoVHJhbnNmb3JtQ2FjaGUoKS4gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlLnRyYW5zbGF0ZTNkID0gXCIoMHB4LCAwcHgsIDBweClcIjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVByb3BlcnR5RXhpc3RzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0cmFuc2Zvcm1Qcm9wZXJ0eUV4aXN0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgQ1NTLmZsdXNoVHJhbnNmb3JtQ2FjaGUoZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKiBUaGUgbm9uLVwibm9uZVwiIGRpc3BsYXkgdmFsdWUgaXMgb25seSBhcHBsaWVkIHRvIGFuIGVsZW1lbnQgb25jZSAtLSB3aGVuIGl0cyBhc3NvY2lhdGVkIGNhbGwgaXMgZmlyc3QgdGlja2VkIHRocm91Z2guXG4gICAgICAgICAgICAgICAgICAgQWNjb3JkaW5nbHksIGl0J3Mgc2V0IHRvIGZhbHNlIHNvIHRoYXQgaXQgaXNuJ3QgcmUtcHJvY2Vzc2VkIGJ5IHRoaXMgY2FsbCBpbiB0aGUgbmV4dCB0aWNrLiAqL1xuICAgICAgICAgICAgICAgIGlmIChvcHRzLmRpc3BsYXkgIT09IHVuZGVmaW5lZCAmJiBvcHRzLmRpc3BsYXkgIT09IFwibm9uZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LlN0YXRlLmNhbGxzW2ldWzJdLmRpc3BsYXkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG9wdHMudmlzaWJpbGl0eSAhPT0gdW5kZWZpbmVkICYmIG9wdHMudmlzaWJpbGl0eSAhPT0gXCJoaWRkZW5cIikge1xuICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tpXVsyXS52aXNpYmlsaXR5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyogUGFzcyB0aGUgZWxlbWVudHMgYW5kIHRoZSB0aW1pbmcgZGF0YSAocGVyY2VudENvbXBsZXRlLCBtc1JlbWFpbmluZywgdGltZVN0YXJ0LCB0d2VlbkR1bW15VmFsdWUpIGludG8gdGhlIHByb2dyZXNzIGNhbGxiYWNrLiAqL1xuICAgICAgICAgICAgICAgIGlmIChvcHRzLnByb2dyZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdHMucHJvZ3Jlc3MuY2FsbChjYWxsQ29udGFpbmVyWzFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbENvbnRhaW5lclsxXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlcmNlbnRDb21wbGV0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWF4KDAsICh0aW1lU3RhcnQgKyBvcHRzLmR1cmF0aW9uKSAtIHRpbWVDdXJyZW50KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVTdGFydCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuRHVtbXlWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyogSWYgdGhpcyBjYWxsIGhhcyBmaW5pc2hlZCB0d2VlbmluZywgcGFzcyBpdHMgaW5kZXggdG8gY29tcGxldGVDYWxsKCkgdG8gaGFuZGxlIGNhbGwgY2xlYW51cC4gKi9cbiAgICAgICAgICAgICAgICBpZiAocGVyY2VudENvbXBsZXRlID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlQ2FsbChpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKiBOb3RlOiBjb21wbGV0ZUNhbGwoKSBzZXRzIHRoZSBpc1RpY2tpbmcgZmxhZyB0byBmYWxzZSB3aGVuIHRoZSBsYXN0IGNhbGwgb24gVmVsb2NpdHkuU3RhdGUuY2FsbHMgaGFzIGNvbXBsZXRlZC4gKi9cbiAgICAgICAgaWYgKFZlbG9jaXR5LlN0YXRlLmlzVGlja2luZykge1xuICAgICAgICAgICAgdGlja2VyKHRpY2spO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgQ2FsbCBDb21wbGV0aW9uXG4gICAgKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIC8qIE5vdGU6IFVubGlrZSB0aWNrKCksIHdoaWNoIHByb2Nlc3NlcyBhbGwgYWN0aXZlIGNhbGxzIGF0IG9uY2UsIGNhbGwgY29tcGxldGlvbiBpcyBoYW5kbGVkIG9uIGEgcGVyLWNhbGwgYmFzaXMuICovXG4gICAgZnVuY3Rpb24gY29tcGxldGVDYWxsIChjYWxsSW5kZXgsIGlzU3RvcHBlZCkge1xuICAgICAgICAvKiBFbnN1cmUgdGhlIGNhbGwgZXhpc3RzLiAqL1xuICAgICAgICBpZiAoIVZlbG9jaXR5LlN0YXRlLmNhbGxzW2NhbGxJbmRleF0pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIFB1bGwgdGhlIG1ldGFkYXRhIGZyb20gdGhlIGNhbGwuICovXG4gICAgICAgIHZhciBjYWxsID0gVmVsb2NpdHkuU3RhdGUuY2FsbHNbY2FsbEluZGV4XVswXSxcbiAgICAgICAgICAgIGVsZW1lbnRzID0gVmVsb2NpdHkuU3RhdGUuY2FsbHNbY2FsbEluZGV4XVsxXSxcbiAgICAgICAgICAgIG9wdHMgPSBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tjYWxsSW5kZXhdWzJdLFxuICAgICAgICAgICAgcmVzb2x2ZXIgPSBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tjYWxsSW5kZXhdWzRdO1xuXG4gICAgICAgIHZhciByZW1haW5pbmdDYWxsc0V4aXN0ID0gZmFsc2U7XG5cbiAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgRWxlbWVudCBGaW5hbGl6YXRpb25cbiAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICBmb3IgKHZhciBpID0gMCwgY2FsbExlbmd0aCA9IGNhbGwubGVuZ3RoOyBpIDwgY2FsbExlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9IGNhbGxbaV0uZWxlbWVudDtcblxuICAgICAgICAgICAgLyogSWYgdGhlIHVzZXIgc2V0IGRpc3BsYXkgdG8gXCJub25lXCIgKGludGVuZGluZyB0byBoaWRlIHRoZSBlbGVtZW50KSwgc2V0IGl0IG5vdyB0aGF0IHRoZSBhbmltYXRpb24gaGFzIGNvbXBsZXRlZC4gKi9cbiAgICAgICAgICAgIC8qIE5vdGU6IGRpc3BsYXk6bm9uZSBpc24ndCBzZXQgd2hlbiBjYWxscyBhcmUgbWFudWFsbHkgc3RvcHBlZCAodmlhIFZlbG9jaXR5KFwic3RvcFwiKS4gKi9cbiAgICAgICAgICAgIC8qIE5vdGU6IERpc3BsYXkgZ2V0cyBpZ25vcmVkIHdpdGggXCJyZXZlcnNlXCIgY2FsbHMgYW5kIGluZmluaXRlIGxvb3BzLCBzaW5jZSB0aGlzIGJlaGF2aW9yIHdvdWxkIGJlIHVuZGVzaXJhYmxlLiAqL1xuICAgICAgICAgICAgaWYgKCFpc1N0b3BwZWQgJiYgIW9wdHMubG9vcCkge1xuICAgICAgICAgICAgICAgIGlmIChvcHRzLmRpc3BsYXkgPT09IFwibm9uZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiZGlzcGxheVwiLCBvcHRzLmRpc3BsYXkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChvcHRzLnZpc2liaWxpdHkgPT09IFwiaGlkZGVuXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgQ1NTLnNldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJ2aXNpYmlsaXR5XCIsIG9wdHMudmlzaWJpbGl0eSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiBJZiB0aGUgZWxlbWVudCdzIHF1ZXVlIGlzIGVtcHR5IChpZiBvbmx5IHRoZSBcImlucHJvZ3Jlc3NcIiBpdGVtIGlzIGxlZnQgYXQgcG9zaXRpb24gMCkgb3IgaWYgaXRzIHF1ZXVlIGlzIGFib3V0IHRvIHJ1blxuICAgICAgICAgICAgICAgYSBub24tVmVsb2NpdHktaW5pdGlhdGVkIGVudHJ5LCB0dXJuIG9mZiB0aGUgaXNBbmltYXRpbmcgZmxhZy4gQSBub24tVmVsb2NpdHktaW5pdGlhdGllZCBxdWV1ZSBlbnRyeSdzIGxvZ2ljIG1pZ2h0IGFsdGVyXG4gICAgICAgICAgICAgICBhbiBlbGVtZW50J3MgQ1NTIHZhbHVlcyBhbmQgdGhlcmVieSBjYXVzZSBWZWxvY2l0eSdzIGNhY2hlZCB2YWx1ZSBkYXRhIHRvIGdvIHN0YWxlLiBUbyBkZXRlY3QgaWYgYSBxdWV1ZSBlbnRyeSB3YXMgaW5pdGlhdGVkIGJ5IFZlbG9jaXR5LFxuICAgICAgICAgICAgICAgd2UgY2hlY2sgZm9yIHRoZSBleGlzdGVuY2Ugb2Ygb3VyIHNwZWNpYWwgVmVsb2NpdHkucXVldWVFbnRyeUZsYWcgZGVjbGFyYXRpb24sIHdoaWNoIG1pbmlmaWVycyB3b24ndCByZW5hbWUgc2luY2UgdGhlIGZsYWdcbiAgICAgICAgICAgICAgIGlzIGFzc2lnbmVkIHRvIGpRdWVyeSdzIGdsb2JhbCAkIG9iamVjdCBhbmQgdGh1cyBleGlzdHMgb3V0IG9mIFZlbG9jaXR5J3Mgb3duIHNjb3BlLiAqL1xuICAgICAgICAgICAgaWYgKG9wdHMubG9vcCAhPT0gdHJ1ZSAmJiAoJC5xdWV1ZShlbGVtZW50KVsxXSA9PT0gdW5kZWZpbmVkIHx8ICEvXFwudmVsb2NpdHlRdWV1ZUVudHJ5RmxhZy9pLnRlc3QoJC5xdWV1ZShlbGVtZW50KVsxXSkpKSB7XG4gICAgICAgICAgICAgICAgLyogVGhlIGVsZW1lbnQgbWF5IGhhdmUgYmVlbiBkZWxldGVkLiBFbnN1cmUgdGhhdCBpdHMgZGF0YSBjYWNoZSBzdGlsbCBleGlzdHMgYmVmb3JlIGFjdGluZyBvbiBpdC4gKi9cbiAgICAgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KSkge1xuICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLmlzQW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIC8qIENsZWFyIHRoZSBlbGVtZW50J3Mgcm9vdFByb3BlcnR5VmFsdWVDYWNoZSwgd2hpY2ggd2lsbCBiZWNvbWUgc3RhbGUuICovXG4gICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkucm9vdFByb3BlcnR5VmFsdWVDYWNoZSA9IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciB0cmFuc2Zvcm1IQVByb3BlcnR5RXhpc3RzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIC8qIElmIGFueSAzRCB0cmFuc2Zvcm0gc3VicHJvcGVydHkgaXMgYXQgaXRzIGRlZmF1bHQgdmFsdWUgKHJlZ2FyZGxlc3Mgb2YgdW5pdCB0eXBlKSwgcmVtb3ZlIGl0LiAqL1xuICAgICAgICAgICAgICAgICAgICAkLmVhY2goQ1NTLkxpc3RzLnRyYW5zZm9ybXMzRCwgZnVuY3Rpb24oaSwgdHJhbnNmb3JtTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRlZmF1bHRWYWx1ZSA9IC9ec2NhbGUvLnRlc3QodHJhbnNmb3JtTmFtZSkgPyAxIDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWUgPSBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXSAhPT0gdW5kZWZpbmVkICYmIG5ldyBSZWdFeHAoXCJeXFxcXChcIiArIGRlZmF1bHRWYWx1ZSArIFwiW14uXVwiKS50ZXN0KGN1cnJlbnRWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1IQVByb3BlcnR5RXhpc3RzID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAvKiBNb2JpbGUgZGV2aWNlcyBoYXZlIGhhcmR3YXJlIGFjY2VsZXJhdGlvbiByZW1vdmVkIGF0IHRoZSBlbmQgb2YgdGhlIGFuaW1hdGlvbiBpbiBvcmRlciB0byBhdm9pZCBob2dnaW5nIHRoZSBHUFUncyBtZW1vcnkuICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLm1vYmlsZUhBKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1IQVByb3BlcnR5RXhpc3RzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlLnRyYW5zbGF0ZTNkO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLyogRmx1c2ggdGhlIHN1YnByb3BlcnR5IHJlbW92YWxzIHRvIHRoZSBET00uICovXG4gICAgICAgICAgICAgICAgICAgIGlmICh0cmFuc2Zvcm1IQVByb3BlcnR5RXhpc3RzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBDU1MuZmx1c2hUcmFuc2Zvcm1DYWNoZShlbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8qIFJlbW92ZSB0aGUgXCJ2ZWxvY2l0eS1hbmltYXRpbmdcIiBpbmRpY2F0b3IgY2xhc3MuICovXG4gICAgICAgICAgICAgICAgICAgIENTUy5WYWx1ZXMucmVtb3ZlQ2xhc3MoZWxlbWVudCwgXCJ2ZWxvY2l0eS1hbmltYXRpbmdcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICBPcHRpb246IENvbXBsZXRlXG4gICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgIC8qIENvbXBsZXRlIGlzIGZpcmVkIG9uY2UgcGVyIGNhbGwgKG5vdCBvbmNlIHBlciBlbGVtZW50KSBhbmQgaXMgcGFzc2VkIHRoZSBmdWxsIHJhdyBET00gZWxlbWVudCBzZXQgYXMgYm90aCBpdHMgY29udGV4dCBhbmQgaXRzIGZpcnN0IGFyZ3VtZW50LiAqL1xuICAgICAgICAgICAgLyogTm90ZTogQ2FsbGJhY2tzIGFyZW4ndCBmaXJlZCB3aGVuIGNhbGxzIGFyZSBtYW51YWxseSBzdG9wcGVkICh2aWEgVmVsb2NpdHkoXCJzdG9wXCIpLiAqL1xuICAgICAgICAgICAgaWYgKCFpc1N0b3BwZWQgJiYgb3B0cy5jb21wbGV0ZSAmJiAhb3B0cy5sb29wICYmIChpID09PSBjYWxsTGVuZ3RoIC0gMSkpIHtcbiAgICAgICAgICAgICAgICAvKiBXZSB0aHJvdyBjYWxsYmFja3MgaW4gYSBzZXRUaW1lb3V0IHNvIHRoYXQgdGhyb3duIGVycm9ycyBkb24ndCBoYWx0IHRoZSBleGVjdXRpb24gb2YgVmVsb2NpdHkgaXRzZWxmLiAqL1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdHMuY29tcGxldGUuY2FsbChlbGVtZW50cywgZWxlbWVudHMpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHRocm93IGVycm9yOyB9LCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICBQcm9taXNlIFJlc29sdmluZ1xuICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICAgICAgLyogTm90ZTogSW5maW5pdGUgbG9vcHMgZG9uJ3QgcmV0dXJuIHByb21pc2VzLiAqL1xuICAgICAgICAgICAgaWYgKHJlc29sdmVyICYmIG9wdHMubG9vcCAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyKGVsZW1lbnRzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICAgICAgIE9wdGlvbjogTG9vcCAoSW5maW5pdGUpXG4gICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KSAmJiBvcHRzLmxvb3AgPT09IHRydWUgJiYgIWlzU3RvcHBlZCkge1xuICAgICAgICAgICAgICAgIC8qIElmIGEgcm90YXRlWC9ZL1ogcHJvcGVydHkgaXMgYmVpbmcgYW5pbWF0ZWQgdG8gMzYwIGRlZyB3aXRoIGxvb3A6dHJ1ZSwgc3dhcCB0d2VlbiBzdGFydC9lbmQgdmFsdWVzIHRvIGVuYWJsZVxuICAgICAgICAgICAgICAgICAgIGNvbnRpbnVvdXMgaXRlcmF0aXZlIHJvdGF0aW9uIGxvb3BpbmcuIChPdGhlcmlzZSwgdGhlIGVsZW1lbnQgd291bGQganVzdCByb3RhdGUgYmFjayBhbmQgZm9ydGguKSAqL1xuICAgICAgICAgICAgICAgICQuZWFjaChEYXRhKGVsZW1lbnQpLnR3ZWVuc0NvbnRhaW5lciwgZnVuY3Rpb24ocHJvcGVydHlOYW1lLCB0d2VlbkNvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoL15yb3RhdGUvLnRlc3QocHJvcGVydHlOYW1lKSAmJiBwYXJzZUZsb2F0KHR3ZWVuQ29udGFpbmVyLmVuZFZhbHVlKSA9PT0gMzYwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0d2VlbkNvbnRhaW5lci5lbmRWYWx1ZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB0d2VlbkNvbnRhaW5lci5zdGFydFZhbHVlID0gMzYwO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKC9eYmFja2dyb3VuZFBvc2l0aW9uLy50ZXN0KHByb3BlcnR5TmFtZSkgJiYgcGFyc2VGbG9hdCh0d2VlbkNvbnRhaW5lci5lbmRWYWx1ZSkgPT09IDEwMCAmJiB0d2VlbkNvbnRhaW5lci51bml0VHlwZSA9PT0gXCIlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuQ29udGFpbmVyLmVuZFZhbHVlID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuQ29udGFpbmVyLnN0YXJ0VmFsdWUgPSAxMDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIFZlbG9jaXR5KGVsZW1lbnQsIFwicmV2ZXJzZVwiLCB7IGxvb3A6IHRydWUsIGRlbGF5OiBvcHRzLmRlbGF5IH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqXG4gICAgICAgICAgICAgICBEZXF1ZXVlaW5nXG4gICAgICAgICAgICAqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgICAgIC8qIEZpcmUgdGhlIG5leHQgY2FsbCBpbiB0aGUgcXVldWUgc28gbG9uZyBhcyB0aGlzIGNhbGwncyBxdWV1ZSB3YXNuJ3Qgc2V0IHRvIGZhbHNlICh0byB0cmlnZ2VyIGEgcGFyYWxsZWwgYW5pbWF0aW9uKSxcbiAgICAgICAgICAgICAgIHdoaWNoIHdvdWxkIGhhdmUgYWxyZWFkeSBjYXVzZWQgdGhlIG5leHQgY2FsbCB0byBmaXJlLiBOb3RlOiBFdmVuIGlmIHRoZSBlbmQgb2YgdGhlIGFuaW1hdGlvbiBxdWV1ZSBoYXMgYmVlbiByZWFjaGVkLFxuICAgICAgICAgICAgICAgJC5kZXF1ZXVlKCkgbXVzdCBzdGlsbCBiZSBjYWxsZWQgaW4gb3JkZXIgdG8gY29tcGxldGVseSBjbGVhciBqUXVlcnkncyBhbmltYXRpb24gcXVldWUuICovXG4gICAgICAgICAgICBpZiAob3B0cy5xdWV1ZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAkLmRlcXVldWUoZWxlbWVudCwgb3B0cy5xdWV1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAgIENhbGxzIEFycmF5IENsZWFudXBcbiAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgICAgIC8qIFNpbmNlIHRoaXMgY2FsbCBpcyBjb21wbGV0ZSwgc2V0IGl0IHRvIGZhbHNlIHNvIHRoYXQgdGhlIHJBRiB0aWNrIHNraXBzIGl0LiBUaGlzIGFycmF5IGlzIGxhdGVyIGNvbXBhY3RlZCB2aWEgY29tcGFjdFNwYXJzZUFycmF5KCkuXG4gICAgICAgICAgKEZvciBwZXJmb3JtYW5jZSByZWFzb25zLCB0aGUgY2FsbCBpcyBzZXQgdG8gZmFsc2UgaW5zdGVhZCBvZiBiZWluZyBkZWxldGVkIGZyb20gdGhlIGFycmF5OiBodHRwOi8vd3d3Lmh0bWw1cm9ja3MuY29tL2VuL3R1dG9yaWFscy9zcGVlZC92OC8pICovXG4gICAgICAgIFZlbG9jaXR5LlN0YXRlLmNhbGxzW2NhbGxJbmRleF0gPSBmYWxzZTtcblxuICAgICAgICAvKiBJdGVyYXRlIHRocm91Z2ggdGhlIGNhbGxzIGFycmF5IHRvIGRldGVybWluZSBpZiB0aGlzIHdhcyB0aGUgZmluYWwgaW4tcHJvZ3Jlc3MgYW5pbWF0aW9uLlxuICAgICAgICAgICBJZiBzbywgc2V0IGEgZmxhZyB0byBlbmQgdGlja2luZyBhbmQgY2xlYXIgdGhlIGNhbGxzIGFycmF5LiAqL1xuICAgICAgICBmb3IgKHZhciBqID0gMCwgY2FsbHNMZW5ndGggPSBWZWxvY2l0eS5TdGF0ZS5jYWxscy5sZW5ndGg7IGogPCBjYWxsc0xlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpZiAoVmVsb2NpdHkuU3RhdGUuY2FsbHNbal0gIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgcmVtYWluaW5nQ2FsbHNFeGlzdCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZW1haW5pbmdDYWxsc0V4aXN0ID09PSBmYWxzZSkge1xuICAgICAgICAgICAgLyogdGljaygpIHdpbGwgZGV0ZWN0IHRoaXMgZmxhZyB1cG9uIGl0cyBuZXh0IGl0ZXJhdGlvbiBhbmQgc3Vic2VxdWVudGx5IHR1cm4gaXRzZWxmIG9mZi4gKi9cbiAgICAgICAgICAgIFZlbG9jaXR5LlN0YXRlLmlzVGlja2luZyA9IGZhbHNlO1xuXG4gICAgICAgICAgICAvKiBDbGVhciB0aGUgY2FsbHMgYXJyYXkgc28gdGhhdCBpdHMgbGVuZ3RoIGlzIHJlc2V0LiAqL1xuICAgICAgICAgICAgZGVsZXRlIFZlbG9jaXR5LlN0YXRlLmNhbGxzO1xuICAgICAgICAgICAgVmVsb2NpdHkuU3RhdGUuY2FsbHMgPSBbXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKipcbiAgICAgICAgRnJhbWV3b3Jrc1xuICAgICoqKioqKioqKioqKioqKioqKi9cblxuICAgIC8qIEJvdGggalF1ZXJ5IGFuZCBaZXB0byBhbGxvdyB0aGVpciAkLmZuIG9iamVjdCB0byBiZSBleHRlbmRlZCB0byBhbGxvdyB3cmFwcGVkIGVsZW1lbnRzIHRvIGJlIHN1YmplY3RlZCB0byBwbHVnaW4gY2FsbHMuXG4gICAgICAgSWYgZWl0aGVyIGZyYW1ld29yayBpcyBsb2FkZWQsIHJlZ2lzdGVyIGEgXCJ2ZWxvY2l0eVwiIGV4dGVuc2lvbiBwb2ludGluZyB0byBWZWxvY2l0eSdzIGNvcmUgYW5pbWF0ZSgpIG1ldGhvZC4gIFZlbG9jaXR5XG4gICAgICAgYWxzbyByZWdpc3RlcnMgaXRzZWxmIG9udG8gYSBnbG9iYWwgY29udGFpbmVyICh3aW5kb3cualF1ZXJ5IHx8IHdpbmRvdy5aZXB0byB8fCB3aW5kb3cpIHNvIHRoYXQgY2VydGFpbiBmZWF0dXJlcyBhcmVcbiAgICAgICBhY2Nlc3NpYmxlIGJleW9uZCBqdXN0IGEgcGVyLWVsZW1lbnQgc2NvcGUuIFRoaXMgbWFzdGVyIG9iamVjdCBjb250YWlucyBhbiAuYW5pbWF0ZSgpIG1ldGhvZCwgd2hpY2ggaXMgbGF0ZXIgYXNzaWduZWQgdG8gJC5mblxuICAgICAgIChpZiBqUXVlcnkgb3IgWmVwdG8gYXJlIHByZXNlbnQpLiBBY2NvcmRpbmdseSwgVmVsb2NpdHkgY2FuIGJvdGggYWN0IG9uIHdyYXBwZWQgRE9NIGVsZW1lbnRzIGFuZCBzdGFuZCBhbG9uZSBmb3IgdGFyZ2V0aW5nIHJhdyBET00gZWxlbWVudHMuICovXG4gICAgZ2xvYmFsLlZlbG9jaXR5ID0gVmVsb2NpdHk7XG5cbiAgICBpZiAoZ2xvYmFsICE9PSB3aW5kb3cpIHtcbiAgICAgICAgLyogQXNzaWduIHRoZSBlbGVtZW50IGZ1bmN0aW9uIHRvIFZlbG9jaXR5J3MgY29yZSBhbmltYXRlKCkgbWV0aG9kLiAqL1xuICAgICAgICBnbG9iYWwuZm4udmVsb2NpdHkgPSBhbmltYXRlO1xuICAgICAgICAvKiBBc3NpZ24gdGhlIG9iamVjdCBmdW5jdGlvbidzIGRlZmF1bHRzIHRvIFZlbG9jaXR5J3MgZ2xvYmFsIGRlZmF1bHRzIG9iamVjdC4gKi9cbiAgICAgICAgZ2xvYmFsLmZuLnZlbG9jaXR5LmRlZmF1bHRzID0gVmVsb2NpdHkuZGVmYXVsdHM7XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgUGFja2FnZWQgUmVkaXJlY3RzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAvKiBzbGlkZVVwLCBzbGlkZURvd24gKi9cbiAgICAkLmVhY2goWyBcIkRvd25cIiwgXCJVcFwiIF0sIGZ1bmN0aW9uKGksIGRpcmVjdGlvbikge1xuICAgICAgICBWZWxvY2l0eS5SZWRpcmVjdHNbXCJzbGlkZVwiICsgZGlyZWN0aW9uXSA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRpb25zLCBlbGVtZW50c0luZGV4LCBlbGVtZW50c1NpemUsIGVsZW1lbnRzLCBwcm9taXNlRGF0YSkge1xuICAgICAgICAgICAgdmFyIG9wdHMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucyksXG4gICAgICAgICAgICAgICAgYmVnaW4gPSBvcHRzLmJlZ2luLFxuICAgICAgICAgICAgICAgIGNvbXBsZXRlID0gb3B0cy5jb21wbGV0ZSxcbiAgICAgICAgICAgICAgICBjb21wdXRlZFZhbHVlcyA9IHsgaGVpZ2h0OiBcIlwiLCBtYXJnaW5Ub3A6IFwiXCIsIG1hcmdpbkJvdHRvbTogXCJcIiwgcGFkZGluZ1RvcDogXCJcIiwgcGFkZGluZ0JvdHRvbTogXCJcIiB9LFxuICAgICAgICAgICAgICAgIGlubGluZVZhbHVlcyA9IHt9O1xuXG4gICAgICAgICAgICBpZiAob3B0cy5kaXNwbGF5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAvKiBTaG93IHRoZSBlbGVtZW50IGJlZm9yZSBzbGlkZURvd24gYmVnaW5zIGFuZCBoaWRlIHRoZSBlbGVtZW50IGFmdGVyIHNsaWRlVXAgY29tcGxldGVzLiAqL1xuICAgICAgICAgICAgICAgIC8qIE5vdGU6IElubGluZSBlbGVtZW50cyBjYW5ub3QgaGF2ZSBkaW1lbnNpb25zIGFuaW1hdGVkLCBzbyB0aGV5J3JlIHJldmVydGVkIHRvIGlubGluZS1ibG9jay4gKi9cbiAgICAgICAgICAgICAgICBvcHRzLmRpc3BsYXkgPSAoZGlyZWN0aW9uID09PSBcIkRvd25cIiA/IChWZWxvY2l0eS5DU1MuVmFsdWVzLmdldERpc3BsYXlUeXBlKGVsZW1lbnQpID09PSBcImlubGluZVwiID8gXCJpbmxpbmUtYmxvY2tcIiA6IFwiYmxvY2tcIikgOiBcIm5vbmVcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9wdHMuYmVnaW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvKiBJZiB0aGUgdXNlciBwYXNzZWQgaW4gYSBiZWdpbiBjYWxsYmFjaywgZmlyZSBpdCBub3cuICovXG4gICAgICAgICAgICAgICAgYmVnaW4gJiYgYmVnaW4uY2FsbChlbGVtZW50cywgZWxlbWVudHMpO1xuXG4gICAgICAgICAgICAgICAgLyogQ2FjaGUgdGhlIGVsZW1lbnRzJyBvcmlnaW5hbCB2ZXJ0aWNhbCBkaW1lbnNpb25hbCBwcm9wZXJ0eSB2YWx1ZXMgc28gdGhhdCB3ZSBjYW4gYW5pbWF0ZSBiYWNrIHRvIHRoZW0uICovXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcGVydHkgaW4gY29tcHV0ZWRWYWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5saW5lVmFsdWVzW3Byb3BlcnR5XSA9IGVsZW1lbnQuc3R5bGVbcHJvcGVydHldO1xuXG4gICAgICAgICAgICAgICAgICAgIC8qIEZvciBzbGlkZURvd24sIHVzZSBmb3JjZWZlZWRpbmcgdG8gYW5pbWF0ZSBhbGwgdmVydGljYWwgcHJvcGVydGllcyBmcm9tIDAuIEZvciBzbGlkZVVwLFxuICAgICAgICAgICAgICAgICAgICAgICB1c2UgZm9yY2VmZWVkaW5nIHRvIHN0YXJ0IGZyb20gY29tcHV0ZWQgdmFsdWVzIGFuZCBhbmltYXRlIGRvd24gdG8gMC4gKi9cbiAgICAgICAgICAgICAgICAgICAgdmFyIHByb3BlcnR5VmFsdWUgPSBWZWxvY2l0eS5DU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBwcm9wZXJ0eSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkVmFsdWVzW3Byb3BlcnR5XSA9IChkaXJlY3Rpb24gPT09IFwiRG93blwiKSA/IFsgcHJvcGVydHlWYWx1ZSwgMCBdIDogWyAwLCBwcm9wZXJ0eVZhbHVlIF07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyogRm9yY2UgdmVydGljYWwgb3ZlcmZsb3cgY29udGVudCB0byBjbGlwIHNvIHRoYXQgc2xpZGluZyB3b3JrcyBhcyBleHBlY3RlZC4gKi9cbiAgICAgICAgICAgICAgICBpbmxpbmVWYWx1ZXMub3ZlcmZsb3cgPSBlbGVtZW50LnN0eWxlLm92ZXJmbG93O1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvcHRzLmNvbXBsZXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLyogUmVzZXQgZWxlbWVudCB0byBpdHMgcHJlLXNsaWRlIGlubGluZSB2YWx1ZXMgb25jZSBpdHMgc2xpZGUgYW5pbWF0aW9uIGlzIGNvbXBsZXRlLiAqL1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BlcnR5IGluIGlubGluZVZhbHVlcykge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlW3Byb3BlcnR5XSA9IGlubGluZVZhbHVlc1twcm9wZXJ0eV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyogSWYgdGhlIHVzZXIgcGFzc2VkIGluIGEgY29tcGxldGUgY2FsbGJhY2ssIGZpcmUgaXQgbm93LiAqL1xuICAgICAgICAgICAgICAgIGNvbXBsZXRlICYmIGNvbXBsZXRlLmNhbGwoZWxlbWVudHMsIGVsZW1lbnRzKTtcbiAgICAgICAgICAgICAgICBwcm9taXNlRGF0YSAmJiBwcm9taXNlRGF0YS5yZXNvbHZlcihlbGVtZW50cyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBWZWxvY2l0eShlbGVtZW50LCBjb21wdXRlZFZhbHVlcywgb3B0cyk7XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICAvKiBmYWRlSW4sIGZhZGVPdXQgKi9cbiAgICAkLmVhY2goWyBcIkluXCIsIFwiT3V0XCIgXSwgZnVuY3Rpb24oaSwgZGlyZWN0aW9uKSB7XG4gICAgICAgIFZlbG9jaXR5LlJlZGlyZWN0c1tcImZhZGVcIiArIGRpcmVjdGlvbl0gPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucywgZWxlbWVudHNJbmRleCwgZWxlbWVudHNTaXplLCBlbGVtZW50cywgcHJvbWlzZURhdGEpIHtcbiAgICAgICAgICAgIHZhciBvcHRzID0gJC5leHRlbmQoe30sIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXNNYXAgPSB7IG9wYWNpdHk6IChkaXJlY3Rpb24gPT09IFwiSW5cIikgPyAxIDogMCB9LFxuICAgICAgICAgICAgICAgIG9yaWdpbmFsQ29tcGxldGUgPSBvcHRzLmNvbXBsZXRlO1xuXG4gICAgICAgICAgICAvKiBTaW5jZSByZWRpcmVjdHMgYXJlIHRyaWdnZXJlZCBpbmRpdmlkdWFsbHkgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgYW5pbWF0ZWQgc2V0LCBhdm9pZCByZXBlYXRlZGx5IHRyaWdnZXJpbmdcbiAgICAgICAgICAgICAgIGNhbGxiYWNrcyBieSBmaXJpbmcgdGhlbSBvbmx5IHdoZW4gdGhlIGZpbmFsIGVsZW1lbnQgaGFzIGJlZW4gcmVhY2hlZC4gKi9cbiAgICAgICAgICAgIGlmIChlbGVtZW50c0luZGV4ICE9PSBlbGVtZW50c1NpemUgLSAxKSB7XG4gICAgICAgICAgICAgICAgb3B0cy5jb21wbGV0ZSA9IG9wdHMuYmVnaW4gPSBudWxsO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvcHRzLmNvbXBsZXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcmlnaW5hbENvbXBsZXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbENvbXBsZXRlLmNhbGwoZWxlbWVudHMsIGVsZW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2VEYXRhICYmIHByb21pc2VEYXRhLnJlc29sdmVyKGVsZW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIElmIGEgZGlzcGxheSB3YXMgcGFzc2VkIGluLCB1c2UgaXQuIE90aGVyd2lzZSwgZGVmYXVsdCB0byBcIm5vbmVcIiBmb3IgZmFkZU91dCBvciB0aGUgZWxlbWVudC1zcGVjaWZpYyBkZWZhdWx0IGZvciBmYWRlSW4uICovXG4gICAgICAgICAgICAvKiBOb3RlOiBXZSBhbGxvdyB1c2VycyB0byBwYXNzIGluIFwibnVsbFwiIHRvIHNraXAgZGlzcGxheSBzZXR0aW5nIGFsdG9nZXRoZXIuICovXG4gICAgICAgICAgICBpZiAob3B0cy5kaXNwbGF5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBvcHRzLmRpc3BsYXkgPSAoZGlyZWN0aW9uID09PSBcIkluXCIgPyBcImF1dG9cIiA6IFwibm9uZVwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgVmVsb2NpdHkodGhpcywgcHJvcGVydGllc01hcCwgb3B0cyk7XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICByZXR1cm4gVmVsb2NpdHk7XG59KCh3aW5kb3cualF1ZXJ5IHx8IHdpbmRvdy5aZXB0byB8fCB3aW5kb3cpLCB3aW5kb3csIGRvY3VtZW50KTtcbn0pKTtcblxuLyoqKioqKioqKioqKioqKioqKlxuICAgS25vd24gSXNzdWVzXG4qKioqKioqKioqKioqKioqKiovXG5cbi8qIFRoZSBDU1Mgc3BlYyBtYW5kYXRlcyB0aGF0IHRoZSB0cmFuc2xhdGVYL1kvWiB0cmFuc2Zvcm1zIGFyZSAlLXJlbGF0aXZlIHRvIHRoZSBlbGVtZW50IGl0c2VsZiAtLSBub3QgaXRzIHBhcmVudC5cblZlbG9jaXR5LCBob3dldmVyLCBkb2Vzbid0IG1ha2UgdGhpcyBkaXN0aW5jdGlvbi4gVGh1cywgY29udmVydGluZyB0byBvciBmcm9tIHRoZSAlIHVuaXQgd2l0aCB0aGVzZSBzdWJwcm9wZXJ0aWVzXG53aWxsIHByb2R1Y2UgYW4gaW5hY2N1cmF0ZSBjb252ZXJzaW9uIHZhbHVlLiBUaGUgc2FtZSBpc3N1ZSBleGlzdHMgd2l0aCB0aGUgY3gvY3kgYXR0cmlidXRlcyBvZiBTVkcgY2lyY2xlcyBhbmQgZWxsaXBzZXMuICovIl19
