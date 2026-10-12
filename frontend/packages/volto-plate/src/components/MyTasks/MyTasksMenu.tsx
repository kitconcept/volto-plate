import React from 'react';
import { ArrowRight } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Plug } from '@plone/volto/components/manage/Pluggable';

/** Add personal navigation through Volto's existing slot, without a toolbar shadow. */
export default function MyTasksMenu() {
  return (
    <Plug pluggable="toolbar-user-menu" id="volto-plate-my-tasks">
      <li>
        <Link to="/my-tasks">
          <FormattedMessage id="My tasks" defaultMessage="My tasks" />
          <ArrowRight size={24} aria-hidden="true" />
        </Link>
      </li>
    </Plug>
  );
}
