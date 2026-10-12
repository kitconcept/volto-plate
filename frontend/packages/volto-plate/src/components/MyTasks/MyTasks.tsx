import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, RotateCw } from 'lucide-react';
import Api from '@plone/volto/helpers/Api/Api';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';

import {
  dueState,
  formatDue,
  taskDueDate,
  taskSourceUrl,
  taskQuery,
  TASK_BATCH_SIZE,
  type Task,
} from './tasks';
import './MyTasks.scss';

type Results = { items: Task[]; items_total: number };

const messages = defineMessages({
  overdue: { id: 'Overdue', defaultMessage: 'Overdue' },
  tomorrow: { id: 'Tomorrow', defaultMessage: 'Tomorrow' },
  noDueDate: { id: 'No due date', defaultMessage: 'No due date' },
  taskPages: { id: 'Task pages', defaultMessage: 'Task pages' },
  previousPage: { id: 'Previous page', defaultMessage: 'Previous page' },
  nextPage: { id: 'Next page', defaultMessage: 'Next page' },
});

/** Authenticated, read-only task list backed by the standard querystring-search API. */
export default function MyTasks() {
  const intl = useIntl();
  const token = useSelector((state: any) => state.userSession?.token);
  const [start, setStart] = React.useState(0);
  const [retry, setRetry] = React.useState(0);
  const [results, setResults] = React.useState<Results | null>(null);
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!token) return;
    // Ignore responses from an obsolete page request or an unmounted view.
    let active = true;
    setLoading(true);
    setError(false);
    (new Api() as any)
      .post('/@querystring-search', { data: taskQuery(start) })
      .then((response: Results) => {
        if (active) setResults(response);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, start, retry]);

  if (!token) return <Redirect to="/login?return_url=%2Fmy-tasks" />;

  return (
    <section className="my-tasks" aria-labelledby="my-tasks-title">
      <h1 id="my-tasks-title">
        <FormattedMessage id="My tasks" defaultMessage="My tasks" />
      </h1>
      {loading ? (
        <p role="status">
          <FormattedMessage
            id="Loading tasks"
            defaultMessage="Loading tasks..."
          />
        </p>
      ) : error ? (
        <div role="alert" className="my-tasks-error">
          <FormattedMessage
            id="Unable to load tasks"
            defaultMessage="Unable to load tasks."
          />
          <button type="button" onClick={() => setRetry((value) => value + 1)}>
            <RotateCw size={16} aria-hidden="true" />
            <FormattedMessage id="Retry" defaultMessage="Retry" />
          </button>
        </div>
      ) : !results?.items_total ? (
        <p>
          <FormattedMessage
            id="You have no open tasks."
            defaultMessage="You have no open tasks."
          />
        </p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th scope="col">
                  <FormattedMessage id="Task" defaultMessage="Task" />
                </th>
                <th scope="col">
                  <FormattedMessage id="Source" defaultMessage="Source" />
                </th>
                <th scope="col">
                  <FormattedMessage id="Due" defaultMessage="Due" />
                </th>
              </tr>
            </thead>
            <tbody>
              {results.items.map((task) => {
                const dueDate = taskDueDate(task);
                const state = dueDate ? dueState(dueDate) : null;
                const overdueLabel = intl.formatMessage(messages.overdue);
                return (
                  <tr key={task.UID}>
                    <td className="my-tasks-text">{task.title}</td>
                    <td className="my-tasks-source">
                      <Link to={flattenToAppURL(taskSourceUrl(task))}>
                        {task.task_source_title}
                      </Link>
                    </td>
                    <td
                      className={
                        state?.overdue ? 'my-tasks-due overdue' : 'my-tasks-due'
                      }
                    >
                      {state?.overdue && (
                        <span
                          title={overdueLabel}
                          role="img"
                          aria-label={overdueLabel}
                        >
                          <AlertCircle size={14} aria-hidden="true" />
                        </span>
                      )}
                      {dueDate ? (
                        <time dateTime={dueDate}>
                          {state?.tomorrow
                            ? intl.formatMessage(messages.tomorrow)
                            : formatDue(dueDate, intl.locale)}
                        </time>
                      ) : (
                        <span
                          aria-label={intl.formatMessage(messages.noDueDate)}
                        >
                          -
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {results.items_total > TASK_BATCH_SIZE && (
            <nav
              className="my-tasks-pagination"
              aria-label={intl.formatMessage(messages.taskPages)}
            >
              <button
                type="button"
                disabled={start === 0}
                onClick={() => setStart(start - TASK_BATCH_SIZE)}
                aria-label={intl.formatMessage(messages.previousPage)}
              >
                <ArrowLeft size={18} aria-hidden="true" />
              </button>
              <span>
                {start + 1}-
                {Math.min(start + TASK_BATCH_SIZE, results.items_total)} /{' '}
                {results.items_total}
              </span>
              <button
                type="button"
                disabled={start + TASK_BATCH_SIZE >= results.items_total}
                onClick={() => setStart(start + TASK_BATCH_SIZE)}
                aria-label={intl.formatMessage(messages.nextPage)}
              >
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
