import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { TComboboxInputElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { getMentionOnSelectItem } from '@platejs/mention';
import { PlateElement } from 'platejs/react';
import { listUsers } from '@plone/volto/actions/users/users';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxInput,
  InlineComboboxItem,
} from '@plone/plate/components/ui/inline-combobox';

type PloneUser = {
  id: string;
  username?: string;
  fullname?: string;
};

const onSelectItem = getMentionOnSelectItem();

export function WikiMentionInputElement(
  props: PlateElementProps<TComboboxInputElement>,
) {
  const { editor, element } = props;
  const [search, setSearch] = React.useState('');
  const dispatch = useDispatch<any>();
  const users = useSelector((state: any) => state.users.users as PloneUser[]);
  const loading = useSelector((state: any) => state.users.list.loading);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      dispatch(listUsers({ search }));
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [dispatch, search]);

  const items = React.useMemo(
    () =>
      users.map((user) => ({
        key: user.id,
        text: user.fullname || user.username || user.id,
      })),
    [users],
  );

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox
        value={search}
        element={element}
        setValue={setSearch}
        showTrigger={false}
        trigger="@"
        filter={false}
      >
        <span
          className={`
            inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm ring-ring
            focus-within:ring-2
          `}
        >
          <InlineComboboxInput />
        </span>

        <InlineComboboxContent className="my-1.5">
          <InlineComboboxEmpty>
            {loading ? 'Searching…' : 'No results'}
          </InlineComboboxEmpty>

          <InlineComboboxGroup>
            {items.map((item) => (
              <InlineComboboxItem
                key={item.key}
                value={item.text}
                onClick={() => onSelectItem(editor, item, search)}
              >
                {item.text}
              </InlineComboboxItem>
            ))}
          </InlineComboboxGroup>
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
