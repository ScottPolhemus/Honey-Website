var gulp = require('gulp')
var assemble = require('assemble')
var beautify = require('js-beautify').html
var ext = require('gulp-ext-replace')
var livereload = require('gulp-livereload')

gulp.task('assemble', function() {
  assemble.partials('./templates/partials/*.hbs')

  assemble.postRender(/\.html/, function(file, next) {
    file.content = beautify(file.content, {
      indent_handlebars: true,
      indent_inner_html: true,
      preserve_newlines: false,
      max_preserve_newlines: 1,
      brace_style: 'expand',
      indent_char: ' ',
      indent_size: 2
    })

    next()
  })

  assemble.src('./templates/*.hbs')
    .pipe(ext('.html'))
    .pipe(assemble.dest('./'))
    .pipe(livereload())
})