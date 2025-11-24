import React from 'react';

import type { BlockEditProps } from '@plone/types';

type BlocksApiValue = Pick<
  BlockEditProps,
  'id' | 'data' | 'type' | 'onChangeBlock' | 'onInsertBlock' | 'onSelectBlock'
>;

const BlocksApiContext = React.createContext<BlocksApiValue | null>(null);

export const BlocksApiProvider = ({
  value,
  children,
}: React.PropsWithChildren<{ value: BlocksApiValue }>) => {
  return (
    <BlocksApiContext.Provider value={value}>
      {children}
    </BlocksApiContext.Provider>
  );
};

export const useBlocksApi = () => {
  const context = React.useContext(BlocksApiContext);

  if (!context) {
    throw new Error('BlocksApiContext is missing');
  }

  return context;
};
