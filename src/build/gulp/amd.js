
console.log('jeanyves');

var gulp = require('gulp');
var concat = require('gulp-concat');

gulp.task('datalogjs-dist', function(){
  gulp.src('src/main/js/*.js')
      .pipe(concat('datalog.js'))
      .pipe(gulp.dest('gen/'));
});
