import React from 'react';
import loadable from '@loadable/component';
import { getBaseUrl } from '@plone/volto/helpers/Url/Url';
import { defineMessages, useIntl } from 'react-intl';
import map from 'lodash/map';
import MaybeWrap from '@plone/volto/components/manage/MaybeWrap/MaybeWrap';
import {
  applyBlockDefaults,
  getBlocks,
  hasBlocksData,
} from '@plone/volto/helpers/Blocks/Blocks';
import StyleWrapper from '@plone/volto/components/manage/Blocks/Block/StyleWrapper';
import config from '@plone/volto/registry';
import ViewDefaultBlock from '@plone/volto/components/manage/Blocks/Block/DefaultView';
import RenderEmptyBlock from '@plone/volto/components/theme/View/RenderEmptyBlock';

const messages = defineMessages({
  unknownBlock: {
    id: 'Unknown Block',
    defaultMessage: 'Unknown Block {block}',
  },
  invalidBlock: {
    id: 'Invalid Block',
    defaultMessage: 'Invalid block - Will be removed on saving',
  },
});

const SOMERSAULT_KEY = '__somersault__';
const PlateEditorRenderer = loadable(
  () =>
    import(
      /* webpackChunkName: "PlateEditorRenderer" */ '../../../../../components/PlateEditorRenderer/PlateEditorRenderer'
    ),
);

const RenderBlocks = (props) => {
  const { blockWrapperTag, content, location, isContainer, metadata } = props;
  const intl = useIntl();
  const blocksConfig = props.blocksConfig || config.blocks.blocksConfig;
  const CustomTag = props.as || React.Fragment;

  const blockList = getBlocks(content);
  const shouldRenderSomersault = Object.hasOwn(
    content.blocks ?? {},
    SOMERSAULT_KEY,
  );

  if (shouldRenderSomersault) {
    return (
      <CustomTag>
        <PlateEditorRenderer content={content} />
      </CustomTag>
    );
  }

  return hasBlocksData(content) ? (
    <CustomTag>
      {map(blockList, ([block, rawBlockData]) => {
        const Block =
          blocksConfig[rawBlockData?.['@type']]?.view || ViewDefaultBlock;

        const blockData = applyBlockDefaults({
          data: rawBlockData,
          intl,
          metadata,
          properties: content,
        });

        if (rawBlockData?.['@type'] === 'empty') {
          return (
            <MaybeWrap
              key={block}
              condition={blockWrapperTag}
              as={blockWrapperTag}
            >
              <RenderEmptyBlock />
            </MaybeWrap>
          );
        }

        if (Block) {
          return (
            <MaybeWrap
              key={block}
              condition={blockWrapperTag}
              as={blockWrapperTag}
            >
              <StyleWrapper
                key={block}
                {...props}
                id={block}
                block={block}
                data={blockData}
                isContainer={isContainer}
              >
                <Block
                  id={block}
                  metadata={metadata}
                  properties={content}
                  data={blockData}
                  path={getBaseUrl(location?.pathname || '')}
                  blocksConfig={blocksConfig}
                />
              </StyleWrapper>
            </MaybeWrap>
          );
        }

        if (blockData) {
          return (
            <div key={block}>
              {intl.formatMessage(messages.unknownBlock, {
                block: rawBlockData?.['@type'],
              })}
            </div>
          );
        }

        return (
          <div key={block}>{intl.formatMessage(messages.invalidBlock)}</div>
        );
      })}
    </CustomTag>
  ) : (
    ''
  );
};

export default RenderBlocks;
