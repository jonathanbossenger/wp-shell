const path = require('path');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './renderer/src/index.js',
  output: {
    path: path.resolve(__dirname, 'renderer'),
    filename: 'index.js',
    publicPath: './',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react', '@babel/preset-env'],
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
          'postcss-loader',
        ],
      },
      {
        test: /\.ttf$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new MonacoWebpackPlugin({
      languages: ['php'],
      features: [
        'bracketMatching',
        'clipboard',
        'coreCommands',
        'cursorUndo',
        'find',
        'folding',
        'hover',
        'inPlaceReplace',
        'parameterHints',
        'smartSelect',
        'suggest',
        'wordHighlighter',
      ],
    }),
  ],
};
