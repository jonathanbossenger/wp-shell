const path = require('path');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './renderer/src/index.js',
  output: {
    path: path.resolve(__dirname, 'renderer'),
    filename: 'index.js',
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
  plugins: [
    new MonacoWebpackPlugin({
      languages: ['php', 'javascript', 'html', 'css', 'json'],
      features: [
        'coreCommands',
        'find',
        'suggest',
        'hover',
        'parameterHints',
        'contextmenu',
        'quickCommand',
        'snippet',
      ],
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};
