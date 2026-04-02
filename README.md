# [Project name]

[About the project]

## Developing

```sh
npm run dev
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Setting up Backend in Local

* Set up `.env` secrets with command `cp .env.example .env` and then open and edit the `.env`
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