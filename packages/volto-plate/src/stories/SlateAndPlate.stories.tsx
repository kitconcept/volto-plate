import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { PlateEditor } from '@plone/plate/components/editor';

import plateBlockConfig from '@plone/plate/config/presets/block';
import { DetachedTextBlockEditor } from '@plone/volto-slate/blocks/Text/DetachedTextBlockEditor';
import { RealStoreWrapper as Wrapper } from '@plone/volto/storybook';
import config from '@plone/volto/registry';

const meta = {
  title: 'Slate & Plate',
  component: DetachedTextBlockEditor,

  args: {
    editorConfig: plateBlockConfig.editorConfig,
    onChange: () => {},
    value: [
      {
        type: 'paragraph',
        children: [{ text: 'A line of text in a paragraph.' }],
      },
    ],
  },
} satisfies Meta<typeof DetachedTextBlockEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const SlateAndPlateStory = (
  props: React.ComponentProps<typeof DetachedTextBlockEditor>,
) => {
  const [value, setValue] = useState(props.value);
  const [slateValue, setSlateValue] = useState();

  return (
    <Wrapper
      customStore={{
        slate_plugins: {
          'slate-detached-text-block': {
            show_sidebar_editor: true,
          },
        },
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="w-[600px] rounded-2xl border border-quanta-azure p-4">
          <PlateEditor
            {...props}
            value={value}
            onChange={(options) => setValue(options.value)}
          />
        </div>
        <div className="w-[600px] rounded-2xl border border-quanta-azure p-4">
          <DetachedTextBlockEditor
            {...props}
            block="slate-detached-text-block"
            value={slateValue}
            data={{}}
            onChangeBlock={(id, data) => setSlateValue(data)}
            slateSettings={config.settings.slate}
            selected={true}
          />
        </div>
      </div>
      <div className="editors-values">
        <div>
          <h2>Slate Value</h2>
          <pre>{JSON.stringify(slateValue?.value, null, 2)}</pre>
        </div>
        <div>
          <h2>Plate Value</h2>
          <pre>{JSON.stringify(value, null, 2)}</pre>
        </div>
      </div>
    </Wrapper>
  );
};

export const MultiEditorPlate: Story = {
  render: (args: any) => <SlateAndPlateStory {...args} />,
  args: {
    value: [
      {
        children: [
          {
            text: '',
          },
          {
            children: [
              {
                text: 'Plone community website',
              },
            ],
            type: 'link',
            data: { url: 'https://plone.org' },
          },
          {
            text: ' ',
          },
        ],
        type: 'p',
      },
    ],
  },
};
