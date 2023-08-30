# NodeJS Typescript Transformer Example Repository

This repository contains a simple example of a NodeJS Typescript Transformer.

## Entrypoint

The `server.ts` file is the entrypoint for the transformer. It contains the following endpoints:

### GET /health

This endpoint is used by the transformer shell to check if the transformer is healthy.

### POST /transform

This endpoint is used by the transformer shell to transform data.

## Installation

prerequisites:
- NodeJS
- Docker

install dependencies:
```bash
yarn install
```

run the transformer shell
```bash
docker-compose up -d
```

## Development

To start developing with tests and watch mode run:
```bash
yarn dev
```

In another terminal or tab, run:
```bash
yarn test:watch
```

When changes are made to the `server.ts` file the transformer will be reloaded and the tests will be run again.

## Deployment

The github action will automatically build and push the release artifact to the github release.

Pushes to the `main` branch will trigger a release pull request, that runs tests to validate the release. Once the pull request has been merged the release will be published, together with the artifact.

To use this transformer in the [Flowcore](https://flowcore.io) platform, create a new adapter and point it to the github release artifact.

The shell will then download the artifact, run it and for each data point post to the `transform` endpoint.