const SteamUser = require('steam-user');
const GlobalOffensive = require('globaloffensive');
const path = require('path');
const fs = require('fs');
const { pipeline } = require('node:stream/promises');
const { access, constants } = require('node:fs/promises');
const { ShareCode } = require('globaloffensive-sharecode');
const unbzip2 = require('unbzip2-stream');

class CSGOManager {
  constructor(details = undefined) {
    this.steamUser = new SteamUser();
    this.csgo = new GlobalOffensive(this.steamUser);
    this.matches = {};
    this.csgo.on('matchList', (matches) => {
      for (const match of matches) {
        if (this.matches[match.matchid]) {
          const url = match?.roundstatsall?.at(-1)?.map;
          for (const callback of this.matches[match.matchid]) {
            callback(url);
          }
          delete this.matches[match.matchid];
        } else {
          console.warn('Ignoring unknown match with id', match.matchid);
        }
      }
    });

    this.details = details || {
      refreshToken: process.env.REFRESH_TOKEN,
    };
  }

  async authenticate() {
    if (this.steamUser.steamID || this.steamUser._connecting) {
      return;
    }
    const waitForAuthentication = new Promise((resolve) => { this.steamUser.once('loggedOn', resolve); });
    this.steamUser.on('error', console.error);
    this.steamUser.logOn(this.details);
    await waitForAuthentication;

    const waitForGame = new Promise((resolve) => { this.steamUser.once('appLaunched', (id) => id === 730 && resolve()); });
    this.steamUser.gamesPlayed(730, true);
    await waitForGame;

    await new Promise((resolve) => { this.csgo.once('connectedToGC', () => resolve()); });
  }

  async logout() {
    const waitForQuit = new Promise((resolve) => { this.steamUser.once('appQuit', (id) => id === 730 && resolve()); });
    this.steamUser.gamesPlayed([], true);
    await waitForQuit;
    this.steamUser.logOff();

    await new Promise((resolve) => { this.steamUser.once('disconnected', () => resolve()); });
  }

  async getMatchURL(matchToken, timeoutMs = 5_000) {
    await this.authenticate();

    return new Promise((resolve, reject) => {
      try {
        const timeout = setTimeout(() => {
          reject(new Error('Timed out waiting for match URL'));
        }, timeoutMs);
        const shareCodeOrDetails = (new ShareCode(matchToken)).decode();

        if (!this.matches[shareCodeOrDetails.matchId]) {
          this.matches[shareCodeOrDetails.matchId] = [];
        }

        this.matches[shareCodeOrDetails.matchId].push((matchURL) => {
          resolve(matchURL);
          clearTimeout(timeout);
        });

        this.csgo.requestGame(shareCodeOrDetails);
      } catch (err) {
        reject(err);
      }
    });
  }

  static async downloadStream(remoteUrl, stream) {
    const response = await fetch(remoteUrl);

    if (!response.ok) {
      throw new Error('Remote file not found');
    }

    return pipeline(response.body, unbzip2(), stream);
  }

  static generateDemoName(url) {
    const matchGroups = url.match(/^https?:\/\/replay(\d+)\.valve\.net\/(\d+)\/(\d+_\d+)\.dem\.bz2$/);
    if (!matchGroups) throw new Error(`Invalid GCPD URL: ${url}`);

    const [, regionId, gameId, matchId] = matchGroups;
    return `match${gameId}_${matchId}_${regionId}.dem`;
  }

  async downloadMatch(matchToken, demoPath = '/tmp') {
    const url = await this.getMatchURL(matchToken);
    const filename = path.join(demoPath, CSGOManager.generateDemoName(url));
    if (await access(filename, constants.F_OK)) {
      console.log('Demo already exists.');
      return filename;
    }

    await CSGOManager.downloadStream(url, fs.createWriteStream(filename, 'binary'));

    return filename;
  }
}

module.exports = CSGOManager;
