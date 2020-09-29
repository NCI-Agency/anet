# Setting up your Developer Environment (gradle, node, Chrome/Firefox)
This section describes the recommended Developer Environment and how to set it up.  You are welcome to use any other tools you prefer.

## Download open source software
1. [JDK 8](http://www.oracle.com/technetwork/java/javase/downloads/index.html).  This can also be either installed, or downloaded as a .zip.  If you do not use the installer, be sure to set the `JAVA_HOME` environment variable to the location of the JDK.
1. [git](https://git-scm.com/).  While this is not required, it is highly recommended if you will be doing active development on ANET.

## Download ANET source code
1. Checkout the [source code](https://github.com/NCI-Agency/anet) from github.
    ```
    git clone git@github.com:NCI-Agency/anet.git
    ```
1. Install the recommended git hooks
    ```
    cd anet
    git config core.hooksPath scripts/githooks
    ```

### Possible Problems
- **You cannot access [the source code repo](https://github.com/NCI-Agency/anet).** Solution: Get someone who does have admin access to add you as a collaborator. Ensure that you have the correct public key installed to github. See [_Connecting to GitHub with SSH_](https://help.github.com/articles/connecting-to-github-with-ssh/) for more information on troubleshooting this step. 
- **The git clone command takes a long time, then fails.** Solution: Some networks block ssh. Try using the `https` URL from github to download the source code. 

## Set Up Gradle
The frontend is run with [`yarn`](https://yarnpkg.com/).  We recommend running the backend [`gradle`](https://gradle.org/) if you are only doing frontend development.

1. Set up [Gradle](https://gradle.org/)
    1. This step is not needed unless want to use other settings and passwords than the default ones (see `build.gradle` for the defaults). You can define custom settings in a local settings file as follows:
    1. Open a command line in the `anet` directory that was retrieved from github.
    1. Create a new empty file at `localSettings.gradle`. (`touch localSettings.gradle` on linux/mac).  This will be a file for all of your local settings and passwords that should not be checked into GitHub.
1. Update the settings in `anet.yml` for your environment.  See the [ANET Configuration documentation](INSTALL.md#anet-configuration) for more details on these configuration options. You are most likely to change:
    1. `emailFromAddr` - use your own email address for testing.

## Java Backend

### Prerequisites
1. Make sure you can [manage Docker as a non-root user](https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user).

### Initial Setup

1. You can either use [PostgreSQL](https://www.postgresql.org/) or [Microsoft SQL Server](https://en.wikipedia.org/wiki/Microsoft_SQL_Server) for your database. Both allow you to run entirely on your local machine and develop offline.
    1. MSSQL
        1. This is currently the default, so you don't need to do anything special
        1. If you want to change any of the default database settings (see `build.gradle` for the defaults), you can paste them as following in your `localSettings.gradle` file (do it for the ones you want to change and with the correct values):
            ```java
            run.environment("DB_DRIVER", "sqlserver")
            run.environment("ANET_DB_USERNAME","username")
            run.environment("ANET_DB_PASSWORD", "password")
            run.environment("ANET_DB_SERVER", "db server hostname")
            run.environment("ANET_DB_NAME","database name")
            ```
   1. PostgreSQL
        1. To re-force gradle to use [PostgreSQL](https://www.postgresql.org/) you can set the `DB_DRIVER` environment variable to `postgresql` (e.g. `export DB_DRIVER=postgresql`), or you can paste the following in your `localSettings.gradle` file:
            ```java
            run.environment("DB_DRIVER", "postgresql")
            ```
1. Pull the DB Docker image: `./gradlew dockerPullDB`
1. Create the DB Docker container and the initial database: `./gradlew dockerCreateDB`
1. Start the DB Docker container: `./gradlew dockerStartDB`
1. Wait until the container is fully started, then run `./gradlew dbMigrate` to build and migrate the database.
    1. The database schema is stored in [`src/main/resources/migrations.xml`](../src/main/resources/migrations.xml).
1. Seed the initial data:
    1. If you're using the Docker container for the database (and you should), you can load the data with: `./gradlew dbLoad`. Otherwise, you'll need to manually connect to your sqlserver instance and load the data.
1. Run `./gradlew run` to download all dependencies (including client dependencies like nodejs and yarn) and build the project

_Note_: it will also start the back-end but at this step we are not interested in that.

### The Base Data Set
Provided with the ANET source code is the file `insertBaseData-mssql.sql`.  This file contains a series of raw SQL commands that insert some sample data into the database that is both required in order to pass all the unit tests, and also helpful for quickly developing and testing new features.  The Base Data Set includes a set of fake users, organizations, locations, and reports.  Here are some of the accounts that you can use to log in and test with:

| User | username | organization | position | role |
|------|----------|--------------|----------|------|
| Erin Erinson | erin | EF2.2 | EF2.2 Advisor D | Advisor who can also approve their own reports
| Rebecca Beccabon | rebecca | EF2.2 | EF2.2 Final Reviewer | Super User
| Arthur Dmin | arthur | ANET Admins | ANET Administrator | Administrator
| Jack Jackson | jack | EF2.1 | EF2.1 Advisor B | Advisor
| Henry Henderson | henry | EF2.1 | EF2.1 SuperUser | Super User
| Steve Steveson | | MoD | Cost Adder | Principal

To log in as one of the base data users, when prompted for a username and password, enter their username as both the username and the password. See [Users defined locally in the realm](keycloak.md#dev-users) for other possible users.

### Developing
1. Run `./gradlew dbMigrate` whenever you pull new changes to migrate the database.
    For background info on some of these Liquibase commands, see: https://www.dropwizard.io/en/latest/manual/migrations.html
    1. Before applying migrations, you can try them out with a dry-run: `./gradlew dbMigrate -Pdry-run`; this shows you the SQL commands that would be executed without actually applying the migrations
    1. You can apply new migrations and test if they can be rolled back successfully with: `./gradlew dbTest`
    1. You can try out rolling back the very last one of the successfully applied migrations with a dry-run: `./gradlew dbRollback -Pdry-run`; this shows you the SQL commands that would be executed
    1. You can roll back the very last one of the applied migrations with: `./gradlew dbRollback`
    1. You may need to occasionally destroy, re-migrate, and re-seed your database if it has fallen too far out of sync with master; you can do this with `./gradlew dbDrop dbMigrate dbLoad` -- BE CAREFUL, this **will** drop and re-populate your database unconditionally!
1. Make sure the [Keycloak authentication server](keycloak.md#dev) is started (in a Docker container) in your local development environment: `./gradlew dockerCreateKeycloak dockerStartKeycloak`
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
After successfully creating and building the MSSQL Docker container it is possible to create a dedicated container for testing. Use the `-PtestEnv` property to access the test environment settings in `gradle`.
1. Create the MSSQL Docker container and test database `./gradlew -PtestEnv dockerCreateDB`
1. Start the MSSQL Docker container: `./gradlew -PtestEnv dockerStartDB`
1. Wait until the container is fully started (can be done automatically with `./gradlew -PtestEnv dbWait`), then run `./gradlew -PtestEnv dbMigrate`
1. Seed initial data - MSSQL: `./gradlew -PtestEnv dbLoad`.
1. Run `./gradlew -PtestEnv build` to download all dependencies and build the project.

#### Override Default Gradle Settings
Override the default gradle settings if you want to run your tests on a different database:
1. Open a command line in the `anet` directory that was retrieved from github.
1. Create a new empty file at `localTestSettings.gradle`. (`touch localTestSettings.gradle` on linux/mac).  This will be a file for all of your local test settings and passwords that should not be checked into GitHub.

### Server side tests
1. Start with a clean test-database when running tests: `./gradlew -PtestEnv dbDrop dbMigrate dbLoad`
1. Make sure the Keycloak authentication server is started (in a Docker container) in your local development environment: `./gradlew dockerCreateKeycloak dockerStartKeycloak`
1. Start a test SMTP server (in a Docker container) in your local development environment: `./gradlew -PtestEnv dockerCreateFakeSmtpServer dockerStartFakeSmtpServer`
1. Run the server side tests with a clean build: `./gradlew -PtestEnv cleanTest test`

### Client-side tests
#### How the client-side tests work
Our tests use selenium to simulate interacting with the app like a user. To do this, we need to connect a browser to the JavaScript tests. We do that via a driver.
This driver can either run the tests locally on your system, or remotely via [BrowserStack](https://www.browserstack.com/).

The tests are reliant on the data looking pretty similar to what you'd get after a fresh run of `insertBaseData-mssql.sql`. If the tests crash and do not complete, they could leave the data set in a state which would cause future test runs to fail. Make sure you start with a clean test-database.

#### Prerequisites
1. Start with a clean test-database when running tests: `./gradlew -PtestEnv dbDrop dbMigrate dbLoad`
1. Start a test SMTP server (in a Docker container) in your local development environment: `./gradlew -PtestEnv dockerCreateFakeSmtpServer dockerStartFakeSmtpServer`
1. In order to run the client-side tests you must start a server using the test-database: `./gradlew -PtestEnv run`
1. Optionally, make sure you have the proper nodejs and yarn in your path (see the [React Frontend](#react-frontend) instructions).

Run `./gradlew yarn_run_lint-fix` to automatically fix some kinds of lint errors.

#### Client-side testing locally
To run the tests locally, make sure you have the server using the test-database running as above.
1. Run the client side E2E tests against the test database: `./gradlew yarn_run_test-e2e`
1. Run the client side wdio tests against the test database: `./gradlew yarn_run_test-wdio`
1. Run the client side jest tests against the test database: `./gradlew yarn_run_test-jest`
1. Or run all client side tests against the test database: `./gradlew yarn_run_test-all`

To run the tests locally, by having [`chromedriver`](https://www.npmjs.com/package/chromedriver) as an npm dependency, we automatically have access to run in Chrome. To use Firefox instead, see [`geckodriver`](https://www.npmjs.com/package/geckodriver).

When writing browser tests, remember that when you take an action, you need to give the browser time to update in response before you start making assertions. Use the `driver.wait` method to do this.

If the tests are failing and you don't know why, run them with env var `DEBUG_LOG=true`:

```
$ DEBUG_LOG=true ./gradlew yarn_run_test-e2e
```

You can also insert the following into your code to make the browser pause, allowing you to investigate what is currently happening:

```js
await t.context.waitForever()
```

In rare circumstances, when using Chrome, the tests will hang on the `data:,` URL. I don't know why this is. If you re-run the test, you should not see the issue a second time.

#### Client-side testing remotely
To run the tests remotely, two things are needed:
1. a [username and access key](https://www.browserstack.com/accounts/settings) for BrowserStack
1. a [Local Testing connection](https://www.browserstack.com/local-testing#command-line) to BrowserStack

Look up your settings and put them in `client/config/default.json`:
```json
{
  "browserstack_user": "myusername123",
  "browserstack_key": "mYbRoWsErStAcKkEy"
}
```
If you want step-by-step screenshots from your tests (_Visual Logs_ on BrowserStack) you can also add:
```
  "browserstack_debug": "true"
```
to your `default.json`.

Then [download](https://www.browserstack.com/local-testing/releases) the appropriate `BrowserStackLocal`, unpack it.

When all is set up, run the remote tests:
1. Run `BrowserStackLocal` with your key:
    ```
    $ ./BrowserStackLocal --key mYbRoWsErStAcKkEy
   ```
1. Configure scripts with `TEST_ENV` envrironment variable for remote testing: 
    ```
    $ export TEST_ENV=remote
    ```
1. Run;
    1.  the client side E2E tests:
        ```
        $ ./gradlew yarn_run_test-e2e
        ```
    1. the client side wdio tests:
        ```
        $ ./gradlew yarn_run_test-wdio
        ```
    1. the client side wdio-ie tests:
        ```
        $ ./gradlew yarn_run_test-wdio-ie
        ```
       **About IE tests:** Internet Explorer is not fully supported by ANET and all features are **NOT** guaranteed to work with IE. For that reason, a warning banner is displayed when IE detected. `test-wdio-ie` runs tests for this scenario and these tests run only on remote testing. When testing locally, they gracefully abort.
    1. all client side tests:
        ```
        $ ./gradlew yarn_run_test-all
        ```
1. You can view the progress and results on [BrowserStack](https://www.browserstack.com/automate).

### Simulator
ANET has a simulator that can exercise of the functions. It is located in 'client/test/sim'. It works by interfacing with ANET through GraphQL queries. The simulator executes `stories` which are assigned to different user types and have different probabilities.   

The simulator can be started by running './gradlew yarn_run_sim'.

## React Frontend
All of the frontend code is in the `client/` directory.

### Initial Setup
1. You can run all client-side scripts via Yarn through Gradle. Otherwise, make sure you have the proper nodejs and yarn in your path; example:
    ```
    export YARN_HOME=<anet_root_path>/.gradle/yarn/yarn-v1.22.10
    export NODEJS_HOME=<anet_root_path>/.gradle/nodejs/node-v12.14.1-linux-x64
    export PATH="$YARN_HOME/bin:$NODEJS_HOME/bin:$PATH"
    cd client/
    ```
    _Note_: nodejs and yarn versions might have changed in the meanwhile, check inside `<anet_root_path>/.gradle/nodejs/` and `<anet_root_path>/.gradle/yarn/` for which versions are being used and change the path accordingly.
1. Run the server: `./gradlew yarn_run_start`
1. Go to [http://localhost:3000/](http://localhost:3000/) in your browser.
    1. When prompted for credentials:
        - **Username:** `erin`
        - **Password:** same as username

NB: You only need node.js and the npm dependencies for developing. When we deploy for production, everything is compiled to static files. No javascript dependencies are necessary on the server.

## Development Mode
In the `anet.yml` file there is a flag for `developmentMode`.  The only thing this flag currently does is:
1. Run the account deactivation worker once on startup.

To simulate a "new user" in development mode, create a new user in the Keycloak realm, then log on to ANET as that user.  This will activate the same code path as if a user came to the production system with a valid Windows Authentication Principal but we don't find them in the `people` table. This will start the new user workflow (onboarding). Note: if you enter an unknown username, ANET will reject you.
