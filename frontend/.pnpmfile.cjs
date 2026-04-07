/* eslint-disable */
const fs = require('fs');
const path = require('path');

function loadCatalog(relativePath) {
  const catalogPath = path.resolve(__dirname, relativePath);

  if (!fs.existsSync(catalogPath)) {
    console.error('Catalog file does not exist at:', catalogPath);
    return {};
  }

  const catalogData = fs.readFileSync(catalogPath, 'utf-8');
  return JSON.parse(catalogData);
}

const coreCatalog = loadCatalog('./core/catalog.json');
const sevenCatalog = loadCatalog('./seven/catalog.json');
const mergedCatalog = {
  ...coreCatalog,
  ...sevenCatalog,
};

module.exports = {
  hooks: {
    updateConfig(config) {
      config.catalogs ??= {};
      config.catalogs.default = {
        ...(config.catalogs.default ?? {}),
        ...mergedCatalog,
      };

      return config;
    },
  },
};
