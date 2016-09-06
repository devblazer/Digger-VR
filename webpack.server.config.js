var Webpack = require('webpack');
var path = require('path');
var appPath = path.resolve(__dirname, 'src','node');
var nodeModulesPath = path.resolve(__dirname, 'node_modules');
var buildPath = path.resolve(__dirname, 'serverDeploy');

var config = {
  context: __dirname,
  devtool: 'source-map',
  output: {
    path: buildPath,
    filename: 'bundle.js'
  },
  entry: [
    path.resolve(appPath, 'main.js')],
  resolve : {

  },
  module: {
    loaders: [

    // I highly recommend using the babel-loader as it gives you
    // ES6/7 syntax and JSX transpiling out of the box
    {
      test: /\.jsx?$/,
      loader: 'babel',
      exclude: [nodeModulesPath],
      query: {
        optional: ['runtime'],
        stage: 0
      }
    },

    // Let us also add the style-loader and css-loader, which you can
    // expand with less-loader etc.
    { test: /\.css/, loader: "style-loader!css-loader" },
    { test: /\.less$/, loader: "style-loader!css-loader!less-loader" },
    { test: /\.json/, loader: "json-loader" },
    { test: /\.png/, loader: "url-loader?limit=100000&mimetype=image/png" },
    { test: /\.gif/, loader: "url-loader?limit=100000&mimetype=image/gif" },
    { test: /\.jpg/, loader: "file-loader"} ,
    { test: /\.svg/, loader: "url-loader?limit=10000"},
    { test: /\.woff/, loader: "url-loader?limit=100000"},
    { test: /\.woff2/, loader: "url-loader?limit=100000"},
    { test: /\.ttf/, loader: "file-loader"},
    { test: /\.eot/, loader: "file-loader"},
    { test: /\.glsl$/, loader: 'webpack-glsl'}
    ]
  }
};

module.exports = config;
