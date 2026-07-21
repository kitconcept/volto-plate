import type { Content } from '@plone/types';
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
import MentionLinkTarget from './MentionLinkTarget';

type PlateEditorRendererProps = {
  content: Content;
};

type SomersaultBlock = {
  value?: Value;
  discussions?: Record<string, unknown>;
  users?: Record<string, { id: string; fullname?: string; portrait?: string }>;
};

const PlateEditorRenderer = ({ content }: PlateEditorRendererProps) => {
  const somersaultBlock = content.blocks?.[SOMERSAULT_KEY] as
    | SomersaultBlock
    | undefined;

  if (!somersaultBlock?.value) return null;

  const initialDiscussions = normalizeDiscussions(somersaultBlock?.discussions);
  const initialUsers = normalizeUsers(somersaultBlock?.users);

  return (
    <PlateController>
      <PlatePluginsProvider
        initialDiscussions={initialDiscussions}
        initialUsers={initialUsers}
        readOnly
      >
        <MentionLinkTarget />
        <PlateRenderer
          editorConfig={wikiEditorRenderer}
          value={somersaultBlock.value as Value}
        />
      </PlatePluginsProvider>
    </PlateController>
  );
};

export default PlateEditorRenderer;
