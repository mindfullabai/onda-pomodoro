/**
 * Hello World — the smallest meaningful Onda plugin.
 *
 * Capabilities: commands, notifications
 */
self.__ondaPlugin = {
  async onActivate(onda) {
    console.log('[hello-world] Activated');

    onda.commands.register('example.hello-world.greet', {
      title: 'Hello World: Greet',
      category: 'Examples',
      handler: async () => {
        onda.notifications.show({
          type: 'success',
          title: 'Hello World',
          message: 'Greetings from your first Onda plugin!',
        });
      },
    });
  },
};
