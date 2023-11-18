# Run Quest API

API for Run Quest, an application to schedule and log activities related to running.

## Installation

Requirements:
 - Node with npm
 - Docker with Compose

Install dependencies:
```bash
$ npm install
```

## Running the app

```bash
$ docker-compose up
```

While running, GraphQL documentation and Playground will be available at:

http://localhost:8080/graphql

## Running Tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e
```
