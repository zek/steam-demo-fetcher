const CSGOManager = require('../manager');

require('dotenv').config();

describe('CSGOManager Integration Tests', () => {
  let csgoManager;

  beforeAll(() => {
    csgoManager = new CSGOManager();
  });

  test('authenticate and get match URL', async () => {
    await csgoManager.authenticate();
    expect(csgoManager.steamUser.steamID).not.toBeNull();

    const matchToken = 'CSGO-kPVP7-HVZiS-e8bJv-vzOTv-fCsOH';
    const matchUrl = await csgoManager.getMatchURL(matchToken);
    expect(matchUrl).toContain('http');
  });

  afterAll(async () => {
    await csgoManager.logout();
  });
});
