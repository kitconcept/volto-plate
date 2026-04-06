type KitPluginPatch = {
  options?: Record<string, unknown>;
} & Record<string, unknown>;

type ConfigurableKitPlugin = {
  key: string;
  options?: Record<string, unknown>;
  configure: (config: Record<string, unknown>) => unknown;
};

export function overrideKitPlugin<T extends ConfigurableKitPlugin>(
  kit: readonly T[],
  key: string,
  patch: KitPluginPatch,
): T[] {
  return kit.map((plugin) => {
    if (plugin.key !== key) {
      return plugin;
    }

    const nextConfig = {
      ...patch,
      options: {
        ...(plugin.options ?? {}),
        ...(patch.options ?? {}),
      },
    };

    return plugin.configure(nextConfig) as T;
  });
}
