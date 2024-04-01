require('dotenv').config();
const express = require('express');
const CSGOManager = require('./manager');

const app = express();

const PORT = process.env.PORT || 3000;

const manager = new CSGOManager();

app.get('/match/:MATCH_TOKEN/download', async (req, res) => {
  const { MATCH_TOKEN } = req.params;

  try {
    const remoteUrl = await manager.getMatchURL(MATCH_TOKEN);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename=${CSGOManager.generateDemoName(remoteUrl)}`);

    await CSGOManager.downloadStream(remoteUrl, res);
  } catch (error) {
    console.error('Error streaming file:', error.message);
    console.error(error);
    if (!res.headersSent) {
      res.status(500).send(`Error streaming file: ${error.message}`);
    }
  }
});

app.get('/match/:MATCH_TOKEN', async (req, res) => {
  const { MATCH_TOKEN } = req.params;

  try {
    const remoteUrl = await manager.getMatchURL(MATCH_TOKEN);
    res.status(200).json({ url: remoteUrl });
  } catch (error) {
    console.error('Error getting match:', error.message);
    console.error(error);
    res.status(500).send(`Error getting match: ${error.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
