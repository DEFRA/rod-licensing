'use strict'

/**
 * The gulp build file. Run after install npm
 * It copies the GOV design system assets into the public folder
 * and builds the main.css file from the SASS
 *
 */
const gulp = require('gulp')
const sass = require('gulp-sass')(require('sass'))
const sourcemaps = require('gulp-sourcemaps')
const del = require('del')
const minify = require('gulp-minify')
const path = require('path')
const concat = require('gulp-concat')

const paths = {
  assets: path.join('..', 'assets/'),
  public: path.join('..', 'public/'),
  govUk: path.join('..', 'node_modules', 'govuk-frontend', 'dist', 'govuk/'),
  flatpickr: path.join('..', 'node_modules/flatpickr/dist/')
}

Object.assign(paths, {
  govUkAssets: path.join(paths.govUk, '/assets/{images/**/*.*,fonts/**/*.*}')
})

Object.assign(paths, {
  otherAssets: path.join(paths.assets, '{images/**/*.*,fonts/**/*.*}')
})

console.log(`Building gafl-webapp-service. Paths: ${JSON.stringify(paths, null, 4)}`)

const clean = () => {
  return del(paths.public, { force: true })
}

const copyAssets = () => {
  return gulp.src([paths.govUkAssets, paths.otherAssets]).pipe(gulp.dest(paths.public))
}

const copyRobots = () => {
  return gulp.src(`${paths.assets}robots.txt`).pipe(gulp.dest(paths.public))
}

const copyFrontendJs = () => {
  return gulp
    .src(`${paths.govUk}govuk-frontend.min.js`)
    .pipe(concat('govuk-frontend.js'))
    .pipe(minify({ noSource: true }))
    .pipe(gulp.dest(`${paths.public}javascript`))
}

// Build the sass
const buildSass = () => {
  return gulp
    .src(`${paths.assets}sass/*.scss`)
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        outputStyle: 'compressed',
        includePaths: path.join('..', 'node_modules')
      }).on('error', sass.logError)
    )
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(`${paths.public}stylesheets/`))
}

// The default Gulp task builds the resources
gulp.task('default', gulp.series(clean, copyAssets, copyFrontendJs, copyRobots, buildSass))
