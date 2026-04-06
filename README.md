# [Project name]

[About the project]

## Developing

```sh
npm run dev        # runs GraphQL codegen, then starts vite dev server
npm run generate   # GraphQL codegen only (run after editing documents.ts)
```

## Building & Deploying

```sh
npm run build      # production vite build
npm run preview    # preview the production build locally
npm run b          # build + package into deploy.tar.gz for Docker/CapRover
```

## Testing

```sh
npm run test                # all unit + e2e tests
npm run test:unit           # vitest — Svelte component tests (browser/chromium)
npm run test:unit:server    # vitest — server-side/API tests (node)
npm run test:unit:ui        # vitest with interactive UI
npm run test:e2e            # Playwright headless
npm run test:e2e:ui         # Playwright interactive UI
npm run test:h              # Playwright headed, single worker (debug mode)
```

## Type Checking

```sh
npm run check        # full type-check
npm run check:watch  # type-check in watch mode
```

## Maintenance

```sh
npm run cu     # clean reinstall (Unix)
npm run cw     # clean reinstall (Windows)
npm run i-npm  # update npm globally to latest version
```

## Setting up Backend in Local

* Set up `.env` secrets with command `cp .env.example .env` and then open and edit the `.env` - set strong passwords there and for the `AUTH_SECRET` you need to generate a random 32bit hex eg. like this `openssl rand -hex 32` or [here](https://randomkeygen.com/laravel-key).
* Now go to `hasura` folder and set up secrets there, too:

    ```sh
    cd hasura
    cp .env.example .env
    cp config.example.yaml config.yaml
    ```
    And update now also here in `hasura` folder the `.env` and `config.yaml` files.

* Start your Colima (`colima start`) or run your Docker Desktop and then start the backend containers: `docker-compose up -d` and you shall see now:

[+] Running 2/2
✔ Container hasura-postgres-1 Healthy
✔ Container hasura-graphql-engine-1  Started