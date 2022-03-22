const path = require('path');

module.exports = {
  entry: './index.js',
  output: {
    filename: 'worker.js',
    path: path.join(__dirname, 'dist')
  },
  target: 'webworker',
  devtool: 'source-map',
  mode: 'production',
  resolve: {
    extensions: ['.js']
  },
  module: {
    rules: []
  },
  optimization: {
    usedExports: true
  }
}
