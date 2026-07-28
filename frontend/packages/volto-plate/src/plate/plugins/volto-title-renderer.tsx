import { createSlatePlugin } from 'platejs';
import { toPlatePlugin, type PlateElementProps } from 'platejs/react';
import { useSelector, shallowEqual } from 'react-redux';
import { BlockInnerContainer } from '@plone/plate/components/ui/block-inner-container';
import SlotRenderer from '@plone/volto/components/theme/SlotRenderer/SlotRenderer';

export const TITLE_BLOCK_TYPE = 'title';

function TitleRendererElement(props: PlateElementProps) {
  const content = useSelector((state: any) => state.content.data, shallowEqual);
  return (
    <>
      <h1
        {...props.attributes}
        className="documentFirstHeading font-heading mt-[1.6em] pb-1 text-4xl font-bold"
      >
        <BlockInnerContainer>{props.children}</BlockInnerContainer>
      </h1>
      <SlotRenderer name="belowContentTitle" content={content} />
    </>
  );
}

export const BaseTitleRendererBlockPlugin = createSlatePlugin({
  key: TITLE_BLOCK_TYPE,
  node: {
    component: TitleRendererElement,
    isElement: true,
    type: TITLE_BLOCK_TYPE,
  },
});

export const TitleRendererBlock = toPlatePlugin(BaseTitleRendererBlockPlugin);
