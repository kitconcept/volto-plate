/**
 * OVERRIDE RenderBlocks.jsx
 * REASON: Aurora pages authored with the Plate.js editor store their content
 *   under a single `somersault` block rather than the standard blocks/blocks_layout
 *   pair, so the stock renderer never sees Plate content. This shadow detects that
 *   case up front and hands rendering off to `PlateEditorRenderer` instead of
 *   falling through to the normal per-block loop.
 * FILE: https://github.com/kitconcept/volto-light-theme/blob/8.0.0a25/frontend/packages/volto-light-theme/src/components/Theme/RenderBlocks.jsx
 * FILE VERSION: @kitconcept/volto-light-theme 8.0.0-alpha.25
 * DATE: 2026-08-25
 * DEVELOPER: @sneridagh
 * CHANGELOG:
 *  - Add SOMERSAULT_KEY detection and PlateEditorRenderer branch @sneridagh
 *
 */
import React from 'react';
import loadable from '@loadable/component';
import { defineMessages, useIntl } from 'react-intl';
import { getBaseUrl } from '@plone/volto/helpers/Url/Url';
import {
  applyBlockDefaults,
  getBlocksFieldname,
  getBlocksLayoutFieldname,
  hasBlocksData,
} from '@plone/volto/helpers/Blocks/Blocks';
import StyleWrapper from '@plone/volto/components/manage/Blocks/Block/StyleWrapper';
import config from '@plone/volto/registry';
import ViewDefaultBlock from '@plone/volto/components/manage/Blocks/Block/DefaultView';
import MaybeWrap from '@plone/volto/components/manage/MaybeWrap/MaybeWrap';
import RenderEmptyBlock from '@plone/volto/components/theme/View/RenderEmptyBlock';
import ErrorBoundary from '@kitconcept/volto-light-theme/components/Blocks/Block/ErrorBoundary';

import StyleWrapperV3 from '@kitconcept/volto-light-theme/components/Theme/StyleWrapperV3';
import RenderBlocksV2 from '@kitconcept/volto-light-theme/components/Theme/RenderBlocksV2';
// === START CUSTOMIZATION ===
import { SOMERSAULT_KEY } from '../../../../../constants';
// === END CUSTOMIZATION ===

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

const PlateEditorRenderer = loadable(
  () =>
    import(
      /* webpackChunkName: "PlateEditorRenderer" */ '../../../../../components/PlateEditorRenderer/PlateEditorRenderer'
    ),
);

const RenderBlocks = (props) => {
  const { blockWrapperTag, content, location, isContainer, metadata } = props;
  const intl = useIntl();
  const blocksFieldname = getBlocksFieldname(content);
  const blocksLayoutFieldname = getBlocksLayoutFieldname(content);
  const blocksConfig = props.blocksConfig || config.blocks.blocksConfig;
  const CustomTag = props.as || React.Fragment;
  // === START CUSTOMIZATION ===
  const shouldRenderSomersault = Object.hasOwn(
    content?.[blocksFieldname] ?? {},
    SOMERSAULT_KEY,
  );

  if (shouldRenderSomersault) {
    return (
      <CustomTag>
        <PlateEditorRenderer content={content} />
      </CustomTag>
    );
  }
  // === END CUSTOMIZATION ===

  if (config.settings.blockModel !== 3) return <RenderBlocksV2 {...props} />;

  return hasBlocksData(content) ? (
    <CustomTag>
      {content[blocksLayoutFieldname].items.map((block) => {
        const currentBlockModel =
          blocksConfig[content[blocksFieldname]?.[block]?.['@type']]
            ?.blockModel;
        const Block =
          blocksConfig[content[blocksFieldname]?.[block]?.['@type']]?.view ||
          ViewDefaultBlock;

        const blockData = applyBlockDefaults({
          data: content[blocksFieldname][block],
          intl,
          metadata,
          properties: content,
        });

        if (content[blocksFieldname]?.[block]?.['@type'] === 'empty') {
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
            <ErrorBoundary
              key={`error-boundary-block-${block}`}
              name={`blockId-${block}-type-${content[blocksFieldname]?.[block]?.['@type']}`}
              block={block}
              type={content[blocksFieldname]?.[block]?.['@type']}
            >
              <MaybeWrap
                key={block}
                condition={blockWrapperTag}
                as={blockWrapperTag}
              >
                {currentBlockModel === 3 ? (
                  <StyleWrapperV3
                    block={block}
                    content={content}
                    data={blockData}
                    blocksConfig={blocksConfig}
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
                  </StyleWrapperV3>
                ) : (
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
                )}
              </MaybeWrap>
            </ErrorBoundary>
          );
        }

        if (blockData) {
          return (
            <div key={block}>
              {intl.formatMessage(messages.unknownBlock, {
                block: content[blocksFieldname]?.[block]?.['@type'],
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
