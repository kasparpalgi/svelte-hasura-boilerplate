# Hasura Backend

## Quick start back-end once all setup

`sh .db.sh`

## Prerequisites — Docker

A Docker runtime must be running before starting the backend.

**macOS** — use [Colima](https://github.com/abiosoft/colima) (lightweight, no Docker Desktop license needed):

```sh
brew install colima docker docker-compose
colima start
```

**Windows** — use [Rancher Desktop](https://rancherdesktop.io/) (free, lightweight alternative to Docker Desktop):
Download and install from [rancherdesktop.io](https://rancherdesktop.io/), then start it. Set container engine to `dockerd (moby)` in preferences.

**Linux** — install Docker Engine directly (no Docker Desktop needed):

```sh
# Ubuntu/Debian
sudo apt install docker.io docker-compose-plugin
sudo systemctl start docker
```

---

## Setup

```sh
cp .env.example .env        # then edit .env — set strong passwords
cp config.example.yaml config.yaml  # then edit config.yaml with your admin secret
```

## Start / Stop

```sh
docker-compose up -d        # start Postgres + Hasura in background
docker-compose down         # stop containers (data persisted in volume)
docker-compose down -v      # stop and wipe all data (database tables, relations and test data in the DB or whatever you have added there)
```

Hasura GraphQL engine will be available at `http://localhost:3001/v1/graphql`.

> The frontend's `npm run dev` runs GraphQL codegen first, which connects to this endpoint. The backend **must be running** before you run `npm run dev`.

## Hasura CLI

```sh
cd hasura
hasura migrate apply --all-databases  # run pending migrations
hasura metadata apply       # apply tracked tables, relationships, permissions
hasura seed apply --all-databases   # adds test user for automated tests
hasura console              # opens console at http://localhost:9695
```
