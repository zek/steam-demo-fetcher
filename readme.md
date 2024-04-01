# Steam Demo Fetcher for CS2

## Overview

Steam Demo Fetcher for CS2 is a Node.js application designed to interact with Steam's Counter-Strike: Global Offensive (CS2) game servers. 
It provides functionalities to authenticate with Steam, retrieve match URLs using match tokens, and download CS2 match replays.

## Features

- Authentication with Steam using user credentials or a refresh token.
- Retrieval of CS2 match URLs via match tokens.
- Downloading and saving CS2 match replays to a specified directory.
- Express server endpoint for downloading match replays directly through a web interface.

## Quick Start with Docker

Pull and run the container directly from Docker Hub:
```shell
docker run -p 3000:3000 -e REFRESH_TOKEN=<your_steam_refresh_token> drtzack/steam-demo-fetcher
```

Replace `<your_steam_refresh_token>` with your actual Steam refresh token.

## Building

### Building Manually

1. Ensure Node.js is installed on your system.
2. Clone the repository to your local machine.
3. Navigate to the project directory and run `npm install` to fetch and install dependencies.

### Building with Docker

1. Build the Docker image:
```shell
docker build -t steam-demo-fetcher .
```
2. Run the container from the image:
```shell
docker run -d -p 3000:3000 -e REFRESH_TOKEN=<your_steam_refresh_token> steam-demo-fetcher
```

Replace `<your_steam_refresh_token>` with your actual Steam refresh token. This will start the Steam Demo Fetcher inside a Docker container, listening on the default port 3000.

## Usage

### Environment Setup

Create a `.env` file in the root directory of the project with the following contents if running locally:

1. Ensure that Node.js is installed on your system.
2. Clone the repository to your local machine.
3. Navigate to the project directory and run `npm install` to install the required dependencies.

## Usage

### Setting up the Environment

Create a `.env` file in the project root directory with the following content:

```
REFRESH_TOKEN=<your_steam_refresh_token>
PORT=3000
```

Replace `<your_steam_refresh_token>` with your actual Steam refresh token.

### Running the Server

Execute `node server.js` to start the moleculer service. By default, it listens on port 3000, but you can change this by setting the `PORT` environment variable in your `.env` file.

### Endpoints

- `GET /match/:matchToken/download`: Downloads the match replay file for the given `matchToken`.
- `GET /match/:matchToken`: Retrieves the download URL for the match replay corresponding to the `matchToken`.

## Contributing

Contributions are welcome. Please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

