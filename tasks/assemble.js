var gulp = require('gulp')
var assemble = require('assemble')
var beautify = require('js-beautify').html
var ext = require('gulp-ext-replace')
var livereload = require('gulp-livereload')

var beautifyOpts = {
  indent_handlebars: true,
  indent_inner_html: true,
  preserve_newlines: false,
  max_preserve_newlines: 1,
  brace_style: 'expand',
  indent_char: ' ',
  indent_size: 2
}

gulp.task('assemble', function() {
  assemble.partials('./templates/partials/*.hbs')
  assemble.data('./package.json');
  
  assemble.postRender(/\.html/, function(file, next) {
    file.content = beautify(file.content, beautifyOpts)
    next()
  })

  assemble.src('./templates/*.hbs')
    .pipe(ext('.html'))
    .pipe(assemble.dest('./'))
    .pipe(livereload())
})