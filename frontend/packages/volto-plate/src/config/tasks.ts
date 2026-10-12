import type { ConfigType } from '@plone/registry';
import MyTasks from '../components/MyTasks/MyTasks';
import MyTasksMenu from '../components/MyTasks/MyTasksMenu';

/** Register the application route outside content traversal and mount its menu plug. */
export default function installTasks(config: ConfigType) {
  config.addonRoutes = [
    ...(config.addonRoutes || []),
    { path: '/my-tasks', exact: true, component: MyTasks },
  ];
  config.settings.nonContentRoutes = [
    ...config.settings.nonContentRoutes,
    '/my-tasks',
  ];
  config.settings.appExtras = [
    ...(config.settings.appExtras || []),
    { match: { path: '/' }, component: MyTasksMenu },
  ];
  return config;
}
