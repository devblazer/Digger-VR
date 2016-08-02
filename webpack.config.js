var Webpack = require('webpack');
var path = require('path');
var appPath = path.resolve(__dirname, 'src','app');
var nodeModulesPath = path.resolve(__dirname, 'node_modules');
var buildPath = path.resolve(__dirname, 'public', 'build');

var config = {
  context: __dirname,
  devtool: 'eval-source-map',
  entry: [
    'webpack-dev-server/client?http://localhost:3000/',
    'webpack/hot/dev-server',
    path.resolve(appPath, 'main.js')],
  output: {
    path: buildPath,
    filename: 'bundle.js',
    publicPath: '/build/'
  },
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
      },
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
  },
  plugins: [new Webpack.HotModuleReplacementPlugin()]
};

module.exports = config;
