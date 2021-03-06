'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');

var browserSync = require('browser-sync');
<% if (props.jsPreprocessor.srcExtension === 'es6' || props.jsPreprocessor.key === 'typescript') { -%>
var webpack = require('webpack-stream');
<% } -%>

var $ = require('gulp-load-plugins')();

<% if (props.jsPreprocessor.srcExtension !== 'es6' && props.jsPreprocessor.key !== 'typescript') { -%>
gulp.task('scripts', function () {
  return gulp.src(path.join(conf.paths.src, '/app/**/*.<%- props.jsPreprocessor.extension %>'))
<%   if (props.jsPreprocessor.extension === 'js') { -%>
    .pipe($.eslint())
    .pipe($.eslint.format())
<%   } if (props.jsPreprocessor.key !== 'none') { -%>
    .pipe($.sourcemaps.init())
<%   } if (props.jsPreprocessor.key === 'coffee') { -%>
    .pipe($.coffeelint())
    .pipe($.coffeelint.reporter())
    .pipe($.coffee()).on('error', conf.errorHandler('CoffeeScript'))
<%   } if (props.jsPreprocessor.key !== 'none') { -%>
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest(path.join(conf.paths.tmp, '/serve/app')))
<%   } -%>
    .pipe(browserSync.reload({ stream: true }))
    .pipe($.size())
});
<% } else { -%>
function webpackWrapper(watch, callback) {
  var webpackOptions = {
<%   if (props.jsPreprocessor.key === 'typescript') { -%>
    resolve: { extensions: ['', '.ts'] },
<%   } -%>
    watch: watch,
    module: {
<%   if (props.jsPreprocessor.extension === 'js') { -%>
      preLoaders: [{ test: /\.js$/, exclude: /node_modules/, loader: 'eslint-loader'}],
<%   } if (props.jsPreprocessor.key === 'typescript') { -%>
      preLoaders: [{ test: /\.ts$/, exclude: /node_modules/, loader: 'tslint-loader'}],
<%   } -%>
<%   if (props.jsPreprocessor.key === 'babel') { -%>
      loaders: [{ test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'}]
<%   } if (props.jsPreprocessor.key === 'traceur') { -%>
      loaders: [{ test: /\.js$/, exclude: /node_modules/, loader: 'traceur-loader'}]
<%   } if (props.jsPreprocessor.key === 'typescript') { -%>
      loaders: [{ test: /\.ts$/, exclude: /node_modules/, loader: 'awesome-typescript-loader'}]
<%   } -%>
    },
    output: { filename: 'index.module.js' }
  };

  if(watch) {
    webpackOptions.devtool = 'inline-source-map';
  }

  var webpackChangeHandler = function(err, stats) {
    if(err) {
      conf.errorHandler('Webpack')(err);
    }
    $.util.log(stats.toString({
      colors: $.util.colors.supportsColor,
      chunks: false,
      hash: false,
      version: false
    }));
    browserSync.reload();
    if(watch) {
      watch = false;
      callback();
    }
  };

  return gulp.src(path.join(conf.paths.src, '/app/index.module.<%- props.jsPreprocessor.extension %>'))
    .pipe(webpack(webpackOptions, null, webpackChangeHandler))
    .pipe(gulp.dest(path.join(conf.paths.tmp, '/serve/app')));
}

<%   if (props.jsPreprocessor.key === 'typescript') { -%>
gulp.task('scripts', ['tsd:install'], function () {
<%   } else { %>
gulp.task('scripts', function () {
<%   } %>
  return webpackWrapper(false);
});

gulp.task('scripts:watch', ['scripts'], function (callback) {
  return webpackWrapper(true, callback);
});
<% } -%>
