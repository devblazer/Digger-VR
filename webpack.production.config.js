var Webpack = require('webpack');
var path = require('path');
var webpackConfig = require("./webpack.config.js");
var nodeModulesPath = path.resolve(__dirname, 'node_modules');
var buildPath = path.resolve(__dirname, 'public', 'build');
var mainPath = path.resolve(__dirname, 'app', 'main.js');



var config = {

  // We change to normal source mapping, if you need them
  devtool: 'source-map',
  entry: mainPath,
  output: {
    path: buildPath,
    filename: 'bundle.js'
  },
  resolve : webpackConfig.module.resolve,
  module: {
    loaders: webpackConfig.module.loaders
  }
};

module.exports = config;
