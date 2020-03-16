'use strict'

/**
 * The gulp build file. Run after install npm
 * It copies the GOV design system assets into the public folder
 * and builds the main.css file from the SASS
 *
 */
const gulp = require('gulp')
const sass = require('gulp-sass')
const sourcemaps = require('gulp-sourcemaps')
const del = require('del')
const minify = require('gulp-minify')
const merge = require('merge-stream')

const paths = {
  assets: 'src/assets/',
  public: 'public/'
}

const clean = () => {
  return del(paths.public)
}

const copyAssets = () => {
  return gulp.src('node_modules/govuk-frontend/govuk/assets/{images/**/*.*,fonts/**/*.*}')
    .pipe(gulp.dest(paths.public))
}

const copyJs = () => {
  return merge(
    gulp.src('node_modules/govuk-frontend/govuk/all.js'),
    gulp.src('src/assets/javascript/**/*.*')
  ).pipe(minify({ noSource: true })).pipe(gulp.dest(paths.public + '/javascript'))
}

// Build the sass
const buildSass = () => {
  return gulp.src(paths.assets + 'sass/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'compressed',
      includePaths: 'node_modules'
    }).on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.public + 'stylesheets/'))
}

// The default Gulp task builds the resources
gulp.task('default', gulp.series(
  clean,
  copyAssets,
  copyJs,
  buildSass
))

/*
 * The Gulp v4 cli must be installed globally to run the watch
 * npm rm -g gulp
 * npm install -g gulp-cli
 */
gulp.task('watch', gulp.series(() => {
  gulp.watch(paths.assets + 'sass/**/*.scss', gulp.series(buildSass))
}))
