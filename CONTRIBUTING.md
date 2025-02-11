# Contributing to torq

**\o/ -o- \o/** Thanks for considering to contribute to torq **\o/ -o- \o/**

You already discovered our code repository hosted in the [LN.capital Organization](https://github.com/lncapital) on GitHub. The described guidelines are not set in stone. As the project grows so will this document. Feel free to propose changes to this document by opening a pull request

## How Can I Contribute?

### Reporting Bugs

**Note:** If you find a **Closed** issue that seems like it is the same thing that you're experiencing, open a new issue and include a link to the original issue in the body of your new one.

### Suggesting Enhancements

Let us know what you are missing so we can improve the software for everybody!

### Your First Code Contribution

Unsure where to begin contributing to torq? You can start by looking through these `Good first issue` and `Help wanted` issues:

- [Good first issue][good first issue] - issues which should only require a few lines of code, and a test or two.
- [Help wanted issues][help wanted] - issues which should be a bit more involved than `Good first issue` issues.

[good first issue]: https://github.com/lncapital/torq/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22
[help wanted]: https://github.com/lncapital/torq/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22

### Code style guides

We are aware we are currently violating some of the style guides but we are working our way through the codebase to address this.

#### Filename and variable casing

| Item                                                                                                                           | Case       |
| ------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| Database columns and tables<br>go folder and file names                                                                        | snake_case |
| Javascript folder names<br>Sass file names **\*.scss**<br>Typescript file names **\*.ts**<br>JSON Keys<br>JavaScript variables | camelCase  |
| Typescript file names using JSX **\*.tsx**                                                                                     | PascalCase |
| MARKDOWN.md file names                                                                                                         | UPPERCASE  |

#### Channel ID naming convention

Internally we prefer to use the core lightning short channel id format (`777777x666x1`) for representing channel ids. Naming of channel id variables and keys should be as follows:

| Name              | Refers to                                                 |
| ----------------- | --------------------------------------------------------- |
| shortChannelId    | Core lightning format short channel id (preferred format) |
| lndShortChannelId | LND's uint64 format                                       |
| lndChannelPoint   | LND's channel point format                                |

In the serverside code there are helper functions for converting between core lightning short channel ids and lnd short channel ids.

#### Automated Formatters

For the frontend code we use Prettier and for the backend code we use gofmt. We recommend installing plugins to your editor to run both of these formatters on save. We also have an .editorconfig file to specify tabbing and spacing and depending on editor you may need to install an editor config plugin to read it. VS Code for example doesn't automatically parse .editorconfig files without a plugin.

#### Linters

Frontend: eslint
Backend: golangci-lint

Editor plugins are available for both. Linting problems will fail the build.

### Development guides

#### All OS types

The required software is:

- git
- docker
- go
- node + npm
- make

#### Windows extras

**git bash** installed with the unix tools is a usefull tool to run our end-to-end tests on Windows.

**Docker Desktop** is also compatible with torq. Please also activate WSL2 in Docker desktop.

### Running torq

Create a virtual **btcd**, **lnd** and **database** as development environment\*\* for Alice, Carol and Bob: `go build ./virtual_network/torq_vn && go run ./virtual_network/torq_vn create --db true`

If you get an error regarding timescaledb please run the command: `docker pull timescale/timescaledb:latest-pg14`

Once the command successfully finished the command to start torq will be visible and will look something like `go run ./cmd/torq/torq.go --torq.password password --db.name torq --db.port 5432 --db.password password start`.

Some files are generated by the script and are available in virtual_network/generated_files (`admin.macaroon` and `tls.cert`).

When torq started should run the frontend in order to add Bob's node.
Go on the folder web `cd /web` and install the dependencies with the command `npm install --legacy-peer-deps`. Once this is done run the frontend with `npm start`.

You will be able to access torq on `localhost:3000`. Login with password: `password` and update the Settings section to add Bob's node with the following:

- GRPC Address (IP or Tor): `localhost:10009`
- TLS Certificate: `tls.cert`
- Macaroon: `admin.macaroon`

Once the virtual environment is created:

- to stop run: `go build ./virtual_network/torq_vn && go run ./virtual_network/torq_vn stop --db true`
- to start run: `go build ./virtual_network/torq_vn && go run ./virtual_network/torq_vn start --db true`
- to purge/delete run: `go build ./virtual_network/torq_vn && go run ./virtual_network/torq_vn purge --db true`

#### Running torq compartments in isolation

To run the database `docker run -d --name torqdb -p ${dbPort}:5432 -e POSTGRES_PASSWORD=${dbPassword} timescale/timescaledb:latest-pg14`

To run the backend without LND/CLN event subscription on port 8080 `go run ./cmd/torq/torq.go --db.name ${dbName} --db.password ${dbPassword} --db.port ${dbPort} --torq.password ${torqPassword} --torq.no-sub start`

To run the frontend in dev mode on port 3000 you can use `cd web && npm start`

When your code requires a database change  you can create a migration file with `migrate create -seq -ext psql -dir database/migrations add_enabled_deleted_to_local_node`
Make sure to have [golang-migrate](https://github.com/golang-migrate/migrate/tree/v4.15.2/cmd/migrate) CLI installed
You should not bother creating a rollback migration file. We will not be supporting that in this project. The migration itself will run once torq get booted.

### Testing torq

To test the frontend with npm is `cd web && npm test` or via make `make test-frontend`

To test the backend `make start-dev-db && make wait-db && make test-backend && make stop-dev-db`

To run a specific backend test with verbose logging `make start-dev-db && make wait-db && go test -v -count=1 ./pkg/lnd -run TestSubscribeForwardingEvents && make stop-dev-db`

To run our full end-to-end tests similar to our github actions pipeline the command (in git bash on Windows\*) is `make test && make test-e2e-debug`

When running `make test` fails potentially the dev database was still running so a consecutive run should work if that was the case.

### Creating a pull request

When you reached a point where you want feedback. Then it's time to create your pull request. Make sure you pull request references a GitHub issue! When an issue does not exist then it's required for you to create one so it can be referenced.
