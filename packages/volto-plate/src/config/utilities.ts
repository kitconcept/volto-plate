import type { ConfigType } from '@plone/registry';

import { useBlocksApi } from '../plate/context/BlocksApiContext';

export default function installUtilities(config: ConfigType) {
  config.registerUtility({
    name: 'useBlocksApi',
    type: 'blocksApiContext',
    method: useBlocksApi,
  });
}
