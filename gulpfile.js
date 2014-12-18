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
var livereload = require('gulp-livereload');

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
        main: 'app/**/app.js',
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
        .pipe(livereload());
});

gulp.task('templates', function() {
    gulp.src(paths.app.templates, {base: paths.app.base.path})
        .pipe(gulp.dest(paths.build.base.path))
        .pipe(livereload());
});

gulp.task('js', function() {
    gulp.src(paths.app.js)
        .pipe(livereload());
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
        .pipe(livereload());
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
    gulp.watch([paths.app.main], livereload);
    gulp.watch([paths.app.templates], ['templates']);
    gulp.watch([paths.app.less], ['less']);
    gulp.watch([paths.app.js, paths.app.main], ['js']);
    gulp.watch([paths.app.pages], ['usemin']);
});

gulp.task('livereload', function() {
    livereload.listen();
});

var appListen = function(port) {
    app.listen(port, function() {
        console.log('App running on port ' + port);
    });
};

var app;
gulp.task('server', ['livereload'], function() {
    app = require('./app/app.js').app;
});

gulp.task('dev-server', ['server', 'watch'], function() {
    app.set('port', 8000);
    appListen(app.get('port'));
});

gulp.task('prod-server', ['server', 'watch'], function() {
    app.set('port', 80);
    appListen(app.get('port'));
});
