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
    return config;
  },
};
