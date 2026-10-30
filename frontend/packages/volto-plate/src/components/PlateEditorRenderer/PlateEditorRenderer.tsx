import * as React from 'react';

import type { Content } from '@plone/types';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import {
  PlateController,
  PlateRenderer,
  type Value,
} from '@plone/plate/components/editor';
import wikiEditorRenderer from '../../plate/presets/wiki-renderer';
import { SOMERSAULT_KEY } from '../../constants';
import {
  normalizeDiscussions,
  normalizeUsers,
} from '../../plate/discussion-data';
import { PlatePluginsProvider } from '../../plate/context/PlatePluginsProvider';
import { InlineCommentsProvider } from '../../plate/context/InlineCommentsProvider';
import MentionLinkTarget from './MentionLinkTarget';

type PlateEditorRendererProps = {
  content: Content;
};

type SomersaultBlock = {
  value?: Value;
  discussions?: Record<string, unknown>;
  users?: Record<string, { id: string; fullname?: string; portrait?: string }>;
};

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

const PlateEditorRenderer = ({ content }: PlateEditorRendererProps) => {
  const contentBlock = content.blocks?.[SOMERSAULT_KEY] as
    | SomersaultBlock
    | undefined;
  const [somersaultBlock, setSomersaultBlock] =
    React.useState<SomersaultBlock | null>(contentBlock ?? null);
  const [revision, setRevision] = React.useState(0);
  const renderedValue = React.useRef<Value | undefined>(contentBlock?.value);
  const pendingScrollPosition = React.useRef<{ x: number; y: number } | null>(
    null,
  );
  const lastContentBlock = React.useRef(contentBlock);

  React.useEffect(() => {
    // State is already initialized from the first content block. Re-keying
    // the controller here on mount would discard and rebuild the whole tree.
    if (lastContentBlock.current === contentBlock) return;
    lastContentBlock.current = contentBlock;
    setSomersaultBlock(contentBlock ?? null);
    renderedValue.current = contentBlock?.value;
    setRevision((current) => current + 1);
  }, [contentBlock]);

  const updateBlock = React.useCallback((block: Record<string, unknown>) => {
    const nextBlock = block as SomersaultBlock;
    const valueChanged =
      JSON.stringify(renderedValue.current) !== JSON.stringify(nextBlock.value);

    renderedValue.current = nextBlock.value;
    setSomersaultBlock(nextBlock);
    if (valueChanged) {
      pendingScrollPosition.current = { x: window.scrollX, y: window.scrollY };
      setRevision((current) => current + 1);
    }
  }, []);

  useIsomorphicLayoutEffect(() => {
    const position = pendingScrollPosition.current;
    if (!position) return;

    window.scrollTo(position.x, position.y);
    const animationFrame = requestAnimationFrame(() => {
      window.scrollTo(position.x, position.y);
      pendingScrollPosition.current = null;
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [revision]);

  if (!somersaultBlock?.value) return null;

  const initialDiscussions = normalizeDiscussions(somersaultBlock?.discussions);
  const initialUsers = normalizeUsers(somersaultBlock?.users);

  const contentPath = flattenToAppURL(content['@id']);

  return (
    <InlineCommentsProvider
      contentPath={contentPath}
      initiallyLocked={!!(content as any).lock?.locked}
      onBlockChange={updateBlock}
    >
      <PlateController key={revision}>
        <PlatePluginsProvider
          initialDiscussions={initialDiscussions}
          initialUsers={initialUsers}
          readOnly
        >
          <MentionLinkTarget />
          <PlateRenderer
            editorConfig={wikiEditorRenderer}
            value={somersaultBlock.value as Value}
            className="typeset"
          />
        </PlatePluginsProvider>
      </PlateController>
    </InlineCommentsProvider>
  );
};

export default PlateEditorRenderer;
