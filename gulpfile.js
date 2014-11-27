var gulp = require('gulp');
var spawn = require('child_process').spawn;

var less = require('gulp-less');
var rev = require('gulp-rev');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var minifyHTML = require('gulp-minify-html');
var minifyCss = require('gulp-minify-css');
var usemin = require('gulp-usemin');

var connect = require('gulp-connect');

var paths = {
    app: {
        base: {
            path: 'app',
        },
        less: [
            'app/less/**/*.less',
        ],
        libs: [
            'app/lib/**/*',
        ],
        js: [
            'app/js/**/*.js',
        ],
        pages: [
            'app/*.html',
        ],
        templates: [
            'app/templates/**/*.html',
        ],
    },
    build: {
        base: {
            path: 'build',
        },
        css: {
            path: 'css',
            name: 'style.css',
        },
    },
}


/*
    Build tasks
*/

gulp.task('less', function() {
    gulp.src(paths.app.less)
        .pipe(less())
        .pipe(gulp.dest('build/css'))
        .pipe(connect.reload());
});

gulp.task('templates', function() {
    gulp.src(paths.app.templates, {base: paths.app.base.path})
        .pipe(gulp.dest(paths.build.base.path))
        .pipe(connect.reload());
});

gulp.task('js', function() {
    gulp.src(paths.app.js)
        .pipe(connect.reload());
});

gulp.task('usemin', function() {
    gulp.src(paths.app.pages)
        .pipe(usemin({
            css: [minifyCss(), 'concat'],
            html: [],
            vendorjs: [uglify()],
            js: [jshint.reporter('default'), uglify(), rev()],
        }))
        .pipe(gulp.dest(paths.build.base.path))
        .pipe(connect.reload());
});

gulp.task('libcopy', function() {
    gulp.src(paths.app.libs, {base: paths.app.base.path})
        .pipe(gulp.dest(paths.build.base.path));
});

gulp.task('build', ['templates'], function() {
    gulp.start('less', 'templates', 'js', 'libcopy', 'usemin');
});


/*
    Testing and linting
*/

gulp.task('jshint', function (done) {
    gulp.src(paths.app.js)
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .on('end', done);
});

gulp.task('test', ['jshint'], function(){
  spawn('npm', ['run', 'test-single-run'], {stdio: 'inherit'});
  spawn('npm', ['run', 'protractor'], {stdio: 'inherit'});
});


/*
    Servers and watches
*/

gulp.task('watch', function () {
    gulp.watch([paths.app.templates], ['templates']);
    gulp.watch([paths.app.less], ['less']);
    gulp.watch([paths.app.js], ['js']);
    gulp.watch([paths.app.pages], ['usemin']);
});

gulp.task('server', function() {
    connect.server({
        root: paths.app.base.path,
        port: 8000,
        livereload: true,
    });
});

gulp.task('dev-server', ['server', 'watch']);

gulp.task('prod-server', function() {
    connect.server({
        root: paths.app.base.path,
        port: 80,
        livereload: true,
    });
});
