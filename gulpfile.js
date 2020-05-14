// Required modules
var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var minify = require('gulp-uglify');

// Style path and files
var stylePath = 'assets/css/';
var sassFile = 'app.scss';
var cssFile = 'app.css';

// Script path and file
var scriptPath = 'assets/js/';
var scriptFile = 'scripts.js';

// Scripts to distribute
var scripts = [
	'assets/js/modal.js',
	'assets/js/focus-tracker.js',
	'assets/js/icons.js',
	'assets/js/dropdown.js',
	'assets/js/slider.js',
	'assets/js/hover-animation.js',
	'assets/js/lazy-images.js',
	'assets/js/assistive-alert.js',
	'assets/js/app.js'
];

// Build style
gulp.task('build-style', function() {
	return gulp.src(stylePath + sassFile)
	.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
	.pipe(gulp.dest(stylePath));
});

// Build scripts
gulp.task('build-scripts', function() {
	return gulp.src(scripts)
	.pipe(concat(scriptFile))
	.pipe(minify())
	.pipe(gulp.dest(scriptPath));
});

// Watch files for changes
gulp.task('watch', function(done) {
	gulp.watch('assets/css/**/*.scss', gulp.series('build-style'));
	gulp.watch(scripts, gulp.series('build-scripts'));
	done();
});

// Default task -> Build style and scripts and watch files for changes
gulp.task('default', gulp.series('build-style', 'build-scripts', 'watch'));

// Build task -> Build style and scripts
gulp.task('build', gulp.series('build-style', 'build-scripts'));