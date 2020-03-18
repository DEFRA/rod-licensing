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
const merge = require('gulp-merge')
const path = require('path')

// const base = path.join(__dirname, '..')

const paths = {
  assets: path.join('..' , 'assets/'),
  public: path.join('..', 'public/'),
  govUk: path.join('..', 'node_modules/govuk-frontend/govuk/')
}

Object.assign(paths, {
  govUkAssets: path.join(paths.govUk, '/assets/{images/**/*.*,fonts/**/*.*}')
})

console.log(`Building gafl-webapp-service. Paths: ${JSON.stringify(paths, null, 4)}`)

const clean = () => {
  return del(paths.public, { force: true })
}

const copyAssets = () => {
  return gulp.src(paths.govUkAssets)
    .pipe(gulp.dest(paths.public))
}

const copyJs = () => {
  return merge(
    gulp.src(`${paths.govUk}all.js`),
    gulp.src(`${paths.assets}javascript/**/*.*`)
  ).pipe(minify({ noSource: true })).pipe(gulp.dest(`${paths.public}javascript`))
}

// Build the sass
const buildSass = () => {
  return gulp.src(`${paths.assets}sass/*.scss`)
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'compressed',
      includePaths: path.join('../node_modules')
    }).on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(`${paths.public}stylesheets/`))
}

// The default Gulp task builds the resources
gulp.task('default', gulp.series(
  clean,
  copyAssets,
  copyJs,
  buildSass
))

