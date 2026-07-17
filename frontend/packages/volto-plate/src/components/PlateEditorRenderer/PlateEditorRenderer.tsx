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

type PlateEditorRendererProps = {
  content: Content;
};

const PlateEditorRenderer = ({ content }: PlateEditorRendererProps) => {
  const somersaultBlock = content.blocks?.[SOMERSAULT_KEY] as
    | {
        value?: Value;
        discussions?: Record<string, unknown>;
        users?: Record<
          string,
          { id: string; fullname?: string; portrait?: string }
        >;
      }
    | undefined;
  const initialDiscussions = normalizeDiscussions(somersaultBlock?.discussions);
  const initialUsers = normalizeUsers(somersaultBlock?.users);

  return somersaultBlock?.value ? (
    <PlateController>
      {/* View mode uses the same provider contract so persisted comment and
          suggestion metadata can be resolved while rendering. */}
      <PlatePluginsProvider
        initialDiscussions={initialDiscussions}
        initialUsers={initialUsers}
        readOnly
      >
        <PlateRenderer
          editorConfig={wikiEditorRenderer}
          value={somersaultBlock.value as Value}
        />
      </PlatePluginsProvider>
    </PlateController>
  ) : null;
};

export default PlateEditorRenderer;
