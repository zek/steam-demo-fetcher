require('dotenv').config();
const { ServiceBroker } = require('moleculer');
const ApiService = require('moleculer-web');
const stream = require('stream');
const CSGOManager = require('./manager');

const manager = new CSGOManager();

const broker = new ServiceBroker({
  logger: console,
});

broker.createService({
  name: 'steam-demo-fetcher',
  mixins: [ApiService],

  settings: {
    port: process.env.PORT || 3000,
    routes: [
      {
        path: '/match/:MATCH_TOKEN/download',
        aliases: {
          'GET /': 'steam-demo-fetcher.downloadMatch',
        },
      },
      {
        path: '/match/:MATCH_TOKEN',
        aliases: {
          'GET /': 'steam-demo-fetcher.getMatch',
        },
      },
    ],
  },

  actions: {
    async downloadMatch(ctx) {
      const { MATCH_TOKEN } = ctx.params;
      const remoteUrl = await manager.getMatchURL(MATCH_TOKEN);

      ctx.meta.$responseType = 'application/octet-stream';
      ctx.meta.$responseHeaders = {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename=${CSGOManager.generateDemoName(remoteUrl)}`,
      };

      const ws = new stream.PassThrough();

      CSGOManager.downloadStream(remoteUrl, ws).catch((error) => {
        this.logger.error('Error streaming file:', error.message);
        ctx.meta.$statusCode = 500;
        ctx.meta.$responseHeaders = {};
        return `Error streaming file: ${error.message}`;
      });

      return ws;
    },

    async getMatch(ctx) {
      const { MATCH_TOKEN } = ctx.params;
      try {
        const remoteUrl = await manager.getMatchURL(MATCH_TOKEN);
        return { url: remoteUrl };
      } catch (error) {
        this.logger.error('Error getting match:', error.message);
        this.logger.error(error);
        ctx.meta.$statusCode = 500;
        return `Error getting match: ${error.message}`;
      }
    },
  },
});

// Start server
broker.start();
