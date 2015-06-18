// Based on: https://github.com/greypants/gulp-starter/blob/master/gulp/tasks/browserify.js

var gulp = require('gulp')
var livereload = require('gulp-livereload')

var browserify = require('browserify')
var shim = require('browserify-shim')
var bower = require('debowerify')
var watchify = require('watchify')

var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')
var mergeStream = require('merge-stream')
var _ = require('lodash')

var gutil = require('gulp-util')
var prettyHrtime = require('pretty-hrtime')

var config = {
  bundleConfigs: [
    {
      entries: './scripts/src/honey.js',
      dest: './scripts',
      outputName: 'honey.js',
      transform: [shim, bower],
      debug: true
    }
  ]
}

var handleErrors = function() {
  var args = Array.prototype.slice.call(arguments)

  args.forEach(function(err, i) {
    console.error(err.toString())
  })

  // Keep gulp from hanging on this task
  this.emit('end')
}

var startTime

var bundleLogger = {
  start: function(filepath) {
    startTime = process.hrtime()
    gutil.log('Bundling', gutil.colors.green(filepath) + '...')
  },

  watch: function(bundleName) {
    gutil.log('Watching files required by', gutil.colors.yellow(bundleName))
  },

  end: function(filepath) {
    var taskTime = process.hrtime(startTime)
    var prettyTime = prettyHrtime(taskTime)
    gutil.log('Bundled', gutil.colors.green(filepath), 'in', gutil.colors.magenta(prettyTime))
  }
}

var browserifyTask = function(devMode) {

  var browserifyThis = function(bundleConfig) {

    if(devMode) {
      // Add watchify args
      _.extend(bundleConfig, watchify.args)
    }
    
    var b = browserify(bundleConfig)

    var bundle = function() {
      // Log when bundling starts
      bundleLogger.start(bundleConfig.outputName)

      return b.bundle()
        .on('error', handleErrors)
        .pipe(source(bundleConfig.outputName))
        .pipe(gulp.dest(bundleConfig.dest))
        .pipe(livereload())
    }

    if(devMode) {
      // Wrap with watchify and rebundle on changes
      b = watchify(b)
      // Rebundle on update
      b.on('update', bundle)
      bundleLogger.watch(bundleConfig.outputName)
    }

    return bundle()
  }

  // Start bundling with Browserify for each bundleConfig specified
  return mergeStream.apply(gulp, _.map(config.bundleConfigs, browserifyThis))

}

gulp.task('browserify', function() {
  return browserifyTask()
})

gulp.task('watchify', function() {
  return browserifyTask(true)
})