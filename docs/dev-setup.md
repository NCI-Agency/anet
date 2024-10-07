# Setting up your Developer Environment (gradle, node, Chrome/Firefox)
This section describes the recommended Developer Environment and how to set it up.  You are welcome to use any other tools you prefer.

## Download open source software
1. [JDK 15](https://openjdk.java.net/install/).  This can also be either installed, or downloaded as a .zip.  If you do not use the installer, be sure to set the `JAVA_HOME` environment variable to the location of the JDK.
1. [git](https://git-scm.com/).  While this is not required, it is highly recommended if you will be doing active development on ANET.

## Download ANET source code
1. Checkout the [source code](https://github.com/NCI-Agency/anet) from GitHub.
    ```shell
    git clone git@github.com:NCI-Agency/anet.git
    ```
1. Install the recommended git hooks
    ```shell
    cd anet
    git config core.hooksPath scripts/githooks
    ```

### Possible Problems
- **You cannot access [the source code repo](https://github.com/NCI-Agency/anet).** Solution: Get someone who does have admin access to add you as a collaborator. Ensure that you have the correct public key installed to GitHub. See [_Connecting to GitHub with SSH_](https://help.github.com/articles/connecting-to-github-with-ssh/) for more information on troubleshooting this step.
- **The git clone command takes a long time, then fails.** Solution: Some networks block ssh. Try using the `https` URL from GitHub to download the source code.

## Set Up Gradle
The frontend is run with [`yarn`](https://yarnpkg.com/).  We recommend running the backend [`gradle`](https://gradle.org/) if you are only doing frontend development.

1. Set up [Gradle](https://gradle.org/)
    1. This step is not needed unless want to use other settings and passwords than the default ones (see `build.gradle` for the defaults). You can define custom settings in a local settings file as follows:
    1. Open a command line in the `anet` directory that was retrieved from GitHub.
    1. Create a new empty file at `localSettings.gradle`. (`touch localSettings.gradle` on linux/mac).  This will be a file for all of your local settings and passwords that should not be checked into GitHub.
1. Update the settings in `anet.yml` for your environment.  See the [ANET Configuration documentation](INSTALL.md#anet-configuration) for more details on these configuration options. You are most likely to change:
    1. `emailFromAddr` - use your own email address for testing.


## Set Up Docker
Several of the components used by the back-end run as Docker containers. Make sure you have at least [Docker Engine](https://docs.docker.com/engine/install/) (a.k.a. Docker CE) installed.
Check that you can [manage Docker as a non-root user](https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user).

You may opt to manage containers using a GUI like Docker Desktop, Rancher Desktop or Podman Desktop. Be aware that
several of these use their own Docker context, which you can see with:
```shell
docker context ls
```
Output can be something like:
```
NAME              DESCRIPTION                               DOCKER ENDPOINT
default *         Current DOCKER_HOST based configuration   unix:///var/run/docker.sock
desktop-linux     Docker Desktop                            unix:///home/developer/.docker/desktop/docker.sock
rancher-desktop   Rancher Desktop moby context              unix:///home/developer/.rd/docker.sock
```
You can always switch contexts with:
```shell
docker context use NAME
```
e.g.
```shell
docker context use default
```
If your container management GUI uses a different endpoint, make sure that the Gradle build and your GUI agree.
You should add a small configuration section to your `localSettings.gradle` and `localTestSettings.gradle`:
```groovy
docker {
  url = 'unix:///home/developer/.docker/desktop/docker.sock' // Use Docker Desktop context
}
```
Copy the endpoint you want to use.

If you also want to be able to manage the containers from your IDE, make sure to configure the same there too.
E.g. for IntelliJ this would be under Services, then Docker, then Connections From Contexts, then double-click on the
context you want to connect to.

## Java Backend

### Development database backend configuration

1. Only [PostgreSQL](https://www.postgresql.org/) can be used for your database. You can run it entirely on your local machine and develop offline.
   1. PostgreSQL
        1. This is the default, so you don't need to do anything special
        1. If you want to change any of the default database settings (see `build.gradle` for the defaults), you can paste them as following in your `localSettings.gradle` file (do it for the ones you want to change and with the correct values):
            ```groovy
            run.environment("ANET_DB_USERNAME","username")
            run.environment("ANET_DB_PASSWORD", "password")
            run.environment("ANET_DB_SERVER", "db server hostname")
            run.environment("ANET_DB_NAME","database name")
            ```

### Setup development database

1. Create the DB Docker container and the initial database: `./gradlew dockerCreateDB`
1. Start the DB Docker container: `./gradlew dockerStartDB`
1. Wait until the container is fully started, then run `./gradlew dbMigrate` to build and migrate the database.
    1. The database schema is stored in [`src/main/resources/migrations.xml`](../src/main/resources/migrations.xml).
1. Seed the initial data:
    1. If you're using the Docker container for the database (and you should), you can load the data with: `./gradlew dbLoad`. Otherwise, you'll need to manually connect to the database instance and load the data.
1. Run `./gradlew run` to download all dependencies (including client dependencies like Node.js and Yarn) and build the project

_Note_: it will also start the back-end but at this step we are not interested in that.

### The Base Data Set
Provided with the ANET source code is the file `insertBaseData-psql.sql`.  This file contains a series of raw SQL commands that insert some sample data into the database that is both required in order to pass all the unit tests, and also helpful for quickly developing and testing new features.  The Base Data Set includes a set of fake users, organizations, locations, and reports.  Here are some of the accounts that you can use to log in and test with:

| User             | username | organization | position             | role                                                  |
|------------------|----------|--------------|----------------------|-------------------------------------------------------|
| Erin Erinson     | erin     | EF2.2        | EF2.2 Advisor D      | Regular person who can also approve their own reports |
| Rebecca Beccabon | rebecca  | EF2.2        | EF2.2 Final Reviewer | Superuser                                             |
| Arthur Dmin      | arthur   | ANET Admins  | ANET Administrator   | Administrator                                         |
| Jack Jackson     | jack     | EF2.1        | EF2.1 Advisor B      | Regular person                                        |
| Henry Henderson  | henry    | EF2.1        | EF2.1 Superuser      | Superuser                                             |
| Steve Steveson   | -        | MoD          | Cost Adder           | Regular person                                        |
| Ihave Noposition | nopos    | -            | -                    | Regular person                                        |

To log in as one of the base data users, when prompted for a username and password, enter their username as both the username and the password. See [Users defined locally in the realm](keycloak.md#dev-users) for other possible users.

### Developing
1. Run `./gradlew dbMigrate` whenever you pull new changes to migrate the database.
    For background info on some of these Liquibase commands, see: https://www.dropwizard.io/en/latest/manual/migrations.html
    1. Before applying migrations, you can try them out with a dry-run: `./gradlew dbMigrate -Pdry-run`; this shows you the SQL commands that would be executed without actually applying the migrations
    1. You can apply new migrations and test if they can be rolled back successfully with: `./gradlew dbTest`
    1. You can try out rolling back the very last one of the successfully applied migrations with a dry-run: `./gradlew dbRollback -Pdry-run`; this shows you the SQL commands that would be executed
    1. You can roll back the very last one of the applied migrations with: `./gradlew dbRollback`
    1. You may need to occasionally destroy, re-migrate, and re-seed your database if it has fallen too far out of sync; you can do this with `./gradlew dbDrop dbMigrate dbLoad` -- BE CAREFUL, this **will** drop and re-populate your database unconditionally!
1. Make sure the [Keycloak authentication server](keycloak.md#dev) is started (in a Docker container) in your local development environment: `./gradlew dockerConfigureKeycloak dockerStartKeycloak`
1. Run `./gradlew run` to run the server via Gradle
    1. If you have set **smtp: disabled** to **true** in `anet.yml`, you're good to go; otherwise, you can start an SMTP server (in a Docker container) in your local development environment: `./gradlew dockerCreateFakeSmtpServer dockerStartFakeSmtpServer`
    1. The following output indicates that the server is ready:
        ```
        INFO  [2017-02-10 16:44:59,902] org.eclipse.jetty.server.Server: Started @4098ms
        > Building 75% > :run
        ```
1. Go to [http://localhost:8080/](http://localhost:8080/) in your browser.
    1. When prompted for credentials:
        - **Username:** `erin`
        - **Password:** same as username
    1. You will get an error about a missing `index.ftl` file; this is expected and means the backend server is working. The error looks like:
        ```
        ERROR [2017-02-10 16:49:33,967] javax.ws.rs.ext.MessageBodyWriter: Template Error
        ! freemarker.template.TemplateNotFoundException: Template not found for name "/views/index.ftl".
        ```

    The web page will say ***Template Error***

1. If you want to see the app running, continue to the [React Frontend](#react-frontend) instructions.

## Testing
### Initial Setup Test Database
First [configure the database backend](#development-database-backend-configuration).
The following instructions initialize a database for testing purposes, within the database container.
Use the `-PtestEnv` property to access the test environment settings in `gradle`.
1. Create the PostgreSQL Docker container and test database `./gradlew -PtestEnv dockerCreateDB`
1. Start the PostgreSQL Docker container: `./gradlew -PtestEnv dockerStartDB`
1. Wait until the container is fully started (can be done automatically with `./gradlew -PtestEnv dbWait`), then run `./gradlew -PtestEnv dbMigrate`
1. Seed initial data - PostgreSQL: `./gradlew -PtestEnv dbLoad`.
1. Run `./gradlew -PtestEnv build` to download all dependencies and build the project.

#### Override Default Gradle Settings
Override the default gradle settings if you want to run your tests on a different database:
1. Open a command line in the `anet` directory that was retrieved from GitHub.
1. Create a new empty file at `localTestSettings.gradle`. (`touch localTestSettings.gradle` on linux/mac).  This will be a file for all of your local test settings and passwords that should not be checked into GitHub.

### Server side tests
1. Start with a clean test-database when running tests: `./gradlew -PtestEnv dbDrop dbMigrate dbLoad`
1. Make sure the Keycloak authentication server is started (in a Docker container) in your local development environment: `./gradlew dockerConfigureKeycloak dockerStartKeycloak`
1. Start a test SMTP server (in a Docker container) in your local development environment: `./gradlew -PtestEnv dockerCreateFakeSmtpServer dockerStartFakeSmtpServer`
1. Run the server side tests with a clean build: `./gradlew -PtestEnv cleanTest test`

Note that the server-side tests use the [GraphQL Java Generator](https://github.com/graphql-java-generator/graphql-gradle-plugin-project) to generate Java test classes from the GraphQL schema. If you have changed the schema, you need to update it before you can run the tests (especially if you want to test your schema changes). Since the schema is derived from the GraphQL service endpoint, you need to take the following steps for updating it:
1. Start the server: `./gradlew run`
1. Generate the schema: `./gradlew yarn_run_generate-graphql-schema`
1. Check the generated schema, e.g.: `git diff src/test/resources/anet.graphql`

If you have updated the generated schema and need to update the generated Java classes, you can run:
1. `./gradlew generateClientCode` to re-generate the Java sources
1. `./gradlew compileTestJava` to re-generate the Java sources *and* compile them into Java class files

### Client-side tests
#### How the client-side tests work
Our tests use selenium to simulate interacting with the app like a user. To do this, we need to connect a browser to the JavaScript tests. We do that via a driver.
This driver can either run the tests locally on your system, or remotely via [BrowserStack](https://www.browserstack.com/).

The tests are reliant on the data looking pretty similar to what you'd get after a fresh run of `insertBaseData-psql.sql`. If the tests crash and do not complete, they could leave the data set in a state which would cause future test runs to fail. Make sure you start with a clean test-database.

#### Prerequisites
1. Start with a clean test-database when running tests: `./gradlew -PtestEnv dbDrop dbMigrate dbLoad`
1. Start a test SMTP server (in a Docker container) in your local development environment: `./gradlew -PtestEnv dockerCreateFakeSmtpServer dockerStartFakeSmtpServer`
1. In order to run the client-side tests you must start a server using the test-database: `./gradlew -PtestEnv run`
1. Optionally, make sure you have the proper Node.js and Yarn in your path (see the [React Frontend](#react-frontend) instructions).

Run `./gradlew yarn_run_lint:fix` to automatically fix some kinds of lint errors.
Run `./gradlew yarn_run_prettier:format` to reformat the JavaScript code according to our style guide.

#### Client-side testing locally
To run the tests locally, make sure you have the server using the test-database running as above.
1. Run the client side E2E tests against the test database: `./gradlew yarn_run_test-e2e`
1. Run the client side wdio tests against the test database: `./gradlew yarn_run_test-wdio`
1. Run the client side jest tests against the test database: `./gradlew yarn_run_test-jest`
1. Or run all client side tests against the test database: `./gradlew yarn_run_test-all`

To run the tests locally, by having [`chromedriver`](https://www.npmjs.com/package/chromedriver) as an npm dependency, we automatically have access to run in Chrome. To use Firefox instead, see [`geckodriver`](https://www.npmjs.com/package/geckodriver).

When writing browser tests, remember that when you take an action, you need to give the browser time to update in response before you start making assertions. Use the `driver.wait` method to do this.

If the tests are failing, and you don't know why, run them with env var `DEBUG_LOG=true`:

```shell
DEBUG_LOG=true ./gradlew yarn_run_test-e2e
```

You can also insert the following into your code to make the browser pause, allowing you to investigate what is currently happening:

```javascript
await t.context.waitForever()
```

In rare circumstances, when using Chrome, the tests will hang on the `data:,` URL. I don't know why this is. If you re-run the test, you should not see the issue a second time.

#### Client-side testing remotely
To run the tests remotely, you need
a [username and access key](https://www.browserstack.com/accounts/settings) for BrowserStack.

Look up your settings and put them in `client/config/default.json`:
```json
{
  "browserstack_user": "myusername123",
  "browserstack_key": "mYbRoWsErStAcKkEy"
}
```
If you want step-by-step screenshots from your tests (_Visual Logs_ on BrowserStack) you can also add:
```json
  "browserstack_debug": "true"
```
to your `default.json`.

Note that both the E2E and the wdio tests will automatically start (and stop) BrowserStackLocal during the tests.

When all is set up, run the remote tests:
1. Configure scripts with `TEST_ENV` environment variable for remote testing:
    ```shell
    export TEST_ENV=remote
    ```
1. Run;
    1.  the client side E2E tests:
        ```shell
        ./gradlew yarn_run_test-e2e
        ```
    1. the client side wdio tests:
        ```shell
        ./gradlew yarn_run_test-wdio
        ```
    1. the client side wdio-ie tests:
        ```shell
        ./gradlew yarn_run_test-wdio-ie
        ```
       **About IE tests:** Internet Explorer is not fully supported by ANET and all features are **NOT** guaranteed to work with IE. For that reason, a warning banner is displayed when IE detected. `test-wdio-ie` runs tests for this scenario and these tests run only on remote testing. When testing locally, they gracefully abort.
    1. all client side tests:
        ```shell
        ./gradlew yarn_run_test-all
        ```
1. You can view the progress and results on [BrowserStack](https://www.browserstack.com/automate).

### Simulator
ANET has a simulator that can exercise of the functions. It is located in 'client/test/sim'. It works by interfacing with ANET through GraphQL queries. The simulator executes `stories` which are assigned to different user types and have different probabilities.

The simulator can be started by running './gradlew yarn_run_sim'.

## React Frontend
All the frontend code is in the `client/` directory.

### Initial Setup
1. You can run all client-side scripts via Yarn through Gradle. Otherwise, make sure you have the proper Node.js and Yarn in your path; example:
    ```shell
    export YARN_HOME=<anet_root_path>/.gradle/yarn/yarn-v1.22.15
    export NODEJS_HOME=<anet_root_path>/.gradle/nodejs/node-v14.18.1-linux-x64
    export PATH="$YARN_HOME/bin:$NODEJS_HOME/bin:$PATH"
    cd client/
    ```
    _Note_: Node.js and Yarn versions might have changed in the meanwhile, check inside `<anet_root_path>/.gradle/nodejs/` and `<anet_root_path>/.gradle/yarn/` for which versions are being used and change the path accordingly.
1. Run the server: `./gradlew yarn_run_start`
1. Go to [http://localhost:3000/](http://localhost:3000/) in your browser.
    1. When prompted for credentials:
        - **Username:** `erin`
        - **Password:** same as username

NB: You only need node.js and the npm dependencies for developing. When we deploy for production, everything is compiled to static files. No javascript dependencies are necessary on the server.

## Development Mode
In the `anet.yml` file there is a flag for `developmentMode`.  The only thing this flag currently does is:
1. Run the account deactivation worker once on startup.

To simulate a "new user" in development mode, create a new user in the Keycloak realm, then log on to ANET as that user. This will start the new user workflow (onboarding). Note: if you enter an unknown username, ANET will reject you.
