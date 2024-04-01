require('dotenv').config();
const { ServiceBroker } = require('moleculer');
const ApiService = require('moleculer-web');
const stream = require('stream');
const CSGOManager = require('./manager');

const transporter = process.env.BROKER_TRANSPORTER;
const namespace = process.env.BROKER_NAMESPACE;
const discoverer = process.env.BROKER_DISCOVERER;

const broker = new ServiceBroker({
  logger: console,
  namespace,
  transporter,
  registry: {
    discoverer,
  },
});

broker.createService({
  name: 'steam-demo-fetcher',
  mixins: [ApiService],

  settings: {
    port: process.env.PORT || 3000,
    routes: [
      {
        path: '/match/:matchToken/download',
        aliases: {
          'GET /': 'steam-demo-fetcher.downloadMatch',
        },
      },
      {
        path: '/match/:matchToken',
        aliases: {
          'GET /': 'steam-demo-fetcher.getMatch',
        },
      },
    ],
  },

  actions: {

    downloadMatch: {
      params: {
        matchToken: { type: 'string' },
      },
      async handler(ctx) {
        const { matchToken } = ctx.params;
        const remoteUrl = await this.client.getMatchURL(matchToken);

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
    },

    getMatch: {
      params: {
        matchToken: { type: 'string' },
      },
      async handler(ctx) {
        const { matchToken } = ctx.params;
        try {
          const remoteUrl = await this.client.getMatchURL(matchToken);
          return { url: remoteUrl };
        } catch (error) {
          this.logger.error('Error getting match:', error.message);
          this.logger.error(error);
          ctx.meta.$statusCode = 500;
          return `Error getting match: ${error.message}`;
        }
      },
    },
  },
  created() {
    this.client = new CSGOManager();
  },
  started() {
    return this.client.authenticate();
  },
  stopped() {
    return this.client.logout();
  },

});

// Start server
broker.start();
