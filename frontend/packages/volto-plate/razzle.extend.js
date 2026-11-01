module.exports = {
  plugins(defaultPlugins) {
    return [
      ...defaultPlugins,
      {
        name: 'tailwind-v4',
        object: {
          modifyWebpackOptions({ options }) {
            const webpackOptions = { ...options.webpackOptions };
            webpackOptions.postCssOptions = {
              ident: 'postcss',
              plugins: [
                [require('@tailwindcss/postcss'), {}],
                // optional if you want to keep explicit autoprefixer behavior:
                // [require('autoprefixer'), {}],
              ],
            };
            return webpackOptions;
          },
        },
      },
    ];
  },
  modify(config) {
    // @platejs/code-drawing falls back to `import('viz.js/full.render')`,
    // which webpack cannot resolve (viz.js has no `exports` map) and reports
    // as a build error. Point it at the real file.
    config.resolve.alias = {
      ...config.resolve.alias,
      'viz.js/full.render$': 'viz.js/full.render.js',
    };
    return config;
  },
};
