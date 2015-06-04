var gulp = require('gulp');
var livereload = require('gulp-livereload');

require('./tasks/sass');
require('./tasks/browserify');
require('./tasks/assemble');

gulp.task('default', ['sass', 'watchify', 'assemble'], function() {
  livereload.listen();

  gulp.watch(['./**/*.hbs'], ['assemble']);
  gulp.watch(['./**/*.scss'], ['sass']);

  gulp.watch(['./styles/*.css'], function(event) {
    livereload.changed(event.path);
  });
});

gulp.task('build', ['sass', 'browserify', 'assemble']);