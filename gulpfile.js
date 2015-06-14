var gulp = require('gulp');
var livereload = require('gulp-livereload');
var connect = require('gulp-connect');

require('./tasks/sass');
require('./tasks/browserify');
require('./tasks/assemble');

gulp.task('build', ['sass', 'browserify', 'assemble']);

gulp.task('default', ['sass', 'watchify', 'assemble'], function() {
  livereload.listen();

  gulp.watch(['./**/*.hbs'], ['assemble']);
  gulp.watch(['./**/*.scss'], ['sass']);
  // Watchify handles the JavaScript

  gulp.watch(['./styles/*.css'], function(event) {
    livereload.changed(event.path);
  });
});

gulp.task('server', ['sass', 'watchify', 'assemble'], function() {
  livereload.listen();
  
  connect.server({
    root: './'
  });

  gulp.watch(['./**/*.hbs'], ['assemble']);
  gulp.watch(['./**/*.scss'], ['sass']);

  gulp.watch(['./styles/*.css'], function(event) {
    livereload.changed(event.path);
  });
});