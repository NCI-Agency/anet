# Setting up your Developer Environment (Eclipse, gradle, node, Chrome/Firefox)
This section describes the recommended Developer Environment and how to set it up.  You are welcome to use any other tools you prefer.

## Download open source software
- [JDK 8](http://www.oracle.com/technetwork/java/javase/downloads/index.html).  This can also be either installed, or downloaded as a .zip.  If you do not use the installer, be sure to set the `JAVA_HOME` environment variable to the location of the JDK.
- [Eclipse](http://www.eclipse.org/downloads/).  Eclipse is a Java IDE.  It can be downloaded as an installer or as a .zip file that does not require installation.
  - When the installer asks which version you'd like to install, choose "Eclipse IDE for Java Developers".
- [node.js 10.x LTS](https://nodejs.org/en/).
- [git](https://git-scm.com/).  While this is not required, it is highly recommended if you will be doing active development on ANET.

## Download ANET source code
- Checkout the [source code](https://github.com/deptofdefense/anet) from github.
   ```
   git clone git@github.com:deptofdefense/anet.git
   ```
- Install the recommended git hooks
   ```
   cd anet
   git config core.hooksPath scripts/githooks
   ```

### Possible Problems
- **You cannot access [the source code repo](https://github.com/deptofdefense/anet).** Solution: Get someone who does have admin access to add you as a collaborator. Ensure that you have the correct public key installed to github. See https://help.github.com/articles/connecting-to-github-with-ssh/ for more information on troubleshooting this step. 
- **The git clone command takes a long time, then fails.** Solution: Some networks block ssh. Try using the `https` URL from github to download the source code. 

## Set Up Gradle, Eclipse and NPM
The frontend is run with `yarn`.  We recommend running the backend via `eclipse` if you are doing any backend development, and `gradle` if you are only doing frontend development.

1. Set up Gradle
   1. Open a command line in the `anet` directory that was retrieved from github.
   1. Create a new empty file at `localSettings.gradle`. (`touch localSettings.gradle` on linux/mac).  This will be a file for all of your local settings and passwords that should not be checked into GitHub.
   1. Run `./gradlew eclipse` (linux/mac) or `./gradlew.bat eclipse` (windows) to download all the java dependencies.  This can take several minutes depending on your internet connection.
1. Set up npm
   1. Change Directories into the `client/` directory
   1. Run `yarn install`  to download all the javascript dependencies.  This can take several minutes depending on your internet connection. If the command hangs, it may be because your network blocks ssh. Try the command again on a different network.
1. Set up Eclipse
   1. Eclipse will ask you for a `workspace` directory. You can choose any empty directory.
   1. Import the `anet/` directory into eclipse as an existing project.
   1. Run the project as a Java Application.  Open the Run Configuration and make sure:
      1. The main method is `mil.dds.anet.AnetApplication`
      1. Arguments includes `server anet.yml`
      1. Environment variables include anything set in build.gradle or localSettings.gradle.
   1. Ensure there are no compile errors. If there are, you are probably missing dependencies or forgot to set environment variables in Eclipse. Try re-running `./gradlew eclipse` or checking the Eclipse run configuration vs gradle configs.
1. Update the settings in `anet.yml` for your environment.  See the [ANET Configuration documentation](https://github.com/deptofdefense/anet/blob/master/DOCUMENTATION.md#anet-configuration) for more details on these configuration options. You are most likely to change:
   1. `emailFromAddr` - use your own email address for testing.

## Java Backend

### Initial Setup
1. You can either use PostgreSQL or Microsoft SQL Server for your database. Both allow you to run entirely on your local machine and develop offline.
   - MSSQL
     - This is currently the default, so you don't need to do anything special
     - Paste the following in your `localSettings.gradle` file (with the correct values):

      ```java
      run.environment("DB_DRIVER", "sqlserver")
      run.environment("ANET_DB_USERNAME","username")
      run.environment("ANET_DB_PASSWORD", "password")
      run.environment("ANET_DB_SERVER", "db server hostname")
      run.environment("ANET_DB_NAME","database name")
      ```
   - PostgreSQL
     - To re-force gradle to use PostgreSQL you can set the `DB_DRIVER` environment variable to `postgresql` (e.g. `export DB_DRIVER=postgresql`), or you can paste the following in your `localSettings.gradle` file:

      ```java
      run.environment("DB_DRIVER", "postgresql")
      ```
1. Pull the MSSQL Docker image: `./gradlew dockerPullDB`
1. Create the MSSQL Docker container and the initial database: `./gradlew dockerCreateDB`
1. Start the MSSQL Docker container: `./gradlew dockerStartDB`
1. Wait until the container is fully started, then run `./gradlew dbMigrate` to build and migrate the database.
   - The database schema is stored in `src/main/resources/migrations.xml`.
1. Seed the initial data:
   - If you're using the Docker container for the database (and you should), you can load the data with: `./gradlew dbLoad`. Otherwise, you'll need to manually connect to your sqlserver instance and load the data.
1. Run `./gradlew build` to download all dependencies and build the project.

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

To log in as one of the base data users, when prompted for a username and password, just enter their name as the username and leave the password blank.

### Developing
1. Run `./gradlew dbMigrate` whenever you pull new changes to migrate the database.
   For background info on some of these Liquibase commands, see: https://dropwizard.readthedocs.io/en/latest/manual/migrations.html
   - Before applying migrations, you can try them out with a dry-run: `./gradlew dbMigrate -Pdry-run`; this shows you the SQL commands that would be executed without actually applying the migrations
   - You can apply new migrations and test if they can be rolled back successfully with: `./gradlew dbTest`
   - You can try out rolling back the very last one of the successfully applied migrations with a dry-run: `./gradlew dbRollback -Pdry-run`; this shows you the SQL commands that would be executed
   - You can roll back the very last one of the applied migrations with: `./gradlew dbRollback`
   - You may need to occasionally destroy, re-migrate, and re-seed your database if it has fallen too far out of sync with master; you can do this with `./gradlew dbDrop dbMigrate dbLoad` -- BE CAREFUL, this **will** drop and re-populate your database unconditionally!
1. Run `./gradlew run` to run the server via Gradle, or hit Run in Eclipse
   - If you have set **smtp: disabled** to **true** in `anet.yml`, you're good to go; otherwise, you can ignore exceptions like the following, because the SMTP server is not necessary for local development:
    ```
    ERROR [2017-02-10 16:39:38,044] mil.dds.anet.AnetEmailWorker: Sending email to [hunter+liz@dds.mil] re: ANET Report Approved
    javax.mail.MessagingException: Unknown SMTP host: ${ANET_SMTP_SERVER};
    ```
   - The following output indicates that the server is ready:
    ```
    INFO  [2017-02-10 16:44:59,902] org.eclipse.jetty.server.Server: Started @4098ms
    > Building 75% > :run
    ```
1. Go to [http://localhost:8080/](http://localhost:8080/) in your browser.
   - When prompted for credentials:
     - **Username:** `erin`
     - **Password:** Leave it blank
   - You will get an error about a missing `index.ftl` file; this is expected and means the backend server is working. The error looks like:
    ```
    ERROR [2017-02-10 16:49:33,967] javax.ws.rs.ext.MessageBodyWriter: Template Error
    ! freemarker.template.TemplateNotFoundException: Template not found for name "/views/index.ftl".
    ```

    The web page will say ***Template Error***

1. If you want to see the app running, continue to the [React Frontend](#react-frontend) instructions.

## Testing
### Initial Setup Test Database
After successfully creating and building the MSSQL Docker container it is posisble to create a dedicated container for testing. Use the `-PtestEnv` property to access the test environment settings in `gradle`.
1. Create the MSSQL Docker container and test database `./gradlew -PtestEnv dockerCreateDB`
1. Start the MSSQL Docker container: `./gradlew -PtestEnv dockerStartDB`
1. Wait until the container is fully started, then run `./gradlew -PtestEnv dbMigrate`
1. Seed initial data - MSSQL: `./gradlew -PtestEnv dbLoad`.
1. Run `./gradlew -PtestEnv build` to download all dependencies and build the project.

#### Override Default Gradle Settings
Override the default gradle settings if you want to run your tests on a different database:
   1. Open a command line in the `anet` directory that was retrieved from github.
   1. Create a new empty file at `localTestSettings.gradle`. (`touch localTestSettings.gradle` on linux/mac).  This will be a file for all of your local test settings and passwords that should not be checked into GitHub.

_Note_: You can run the backend with either `gradle` or with Eclipse. Eclipse does not use gradle's configurations, so you'll have to set them up yourself.  You'll want to create a run configuration with:
   - Main Class: `mil.dds.anet.AnetApplication`
   - Program Arguments: `server anet.yml`
   - Environment Variables: These values are used in anet.yml. We set them through environment variables rather than checking them into the git repository to allow each developer to use different settings.
     - MSSQL:
       - `ANET_DB_URL` : `jdbc:sqlserver://[sqlserver hostname]:1433;databaseName=[dbName]`
       - `ANET_DB_USERNAME` : username to your db
       - `ANET_DB_PASSWORD` : password to your db
       - `ANET_DB_DRIVER` : `com.microsoft.sqlserver.jdbc.SQLServerDriver`
     - PostgreSQL:
       - `ANET_DB_URL` : `jdbc:postgresql://[psqlserver hostname]:5432/[dbName]`
       - `ANET_DB_USERNAME` : username to your db
       - `ANET_DB_PASSWORD` : password to your db
       - `ANET_DB_DRIVER` : `org.postgresql.Driver`

### Server side tests
1. Start with a clean test-database when running tests: `/gradlew -PtestEnv dbDrop dbMigrate dbLoad`
1. Run the server side tests with a clean build: `./gradlew -PtestEnv cleanTest test`

### Client-side tests
#### How the client-side tests work
Our tests use selenium to simulate interacting with the app like a user. To do this, we need to connect a browser to the JavaScript tests. We do that via a driver.
This driver can either run the tests locally on your system, or remotely via [BrowserStack](https://www.browserstack.com/).

The tests are reliant on the data looking pretty similar to what you'd get after a fresh run of `insertBaseData-mssql.sql`. If the tests crash and do not complete, they could leave the data set in a state which would cause future test runs to fail. Make sure you start with a clean test-database.

#### Prerequisites
1. Start with a clean test-database when running tests: `/gradlew -PtestEnv dbDrop dbMigrate dbLoad`
1. In order to run the client-side tests you must start a server using the test-database: `./gradlew -PtestEnv run`

Run `yarn run lint-fix` to automatically fix some kinds of lint errors.

#### Client-side testing locally
To run the tests locally, make sure you have the server using the test-database running as above.
1. Run the client side E2E tests against the test database: yarn run test-e2e
1. Run the client side wdio tests against the test database: yarn run test-wdio
1. Run the client side jest tests against the test database: yarn run test-jest
1. Or run all client side tests against the test database: yarn run test-all

To run the tests locally, by having [`chromedriver`](https://www.npmjs.com/package/chromedriver) as an npm dependency, we automatically have access to run in Chrome. To use Firefox instead, see [`geckodriver`](https://www.npmjs.com/package/geckodriver).

When writing browser tests, remember that when you take an action, you need to give the browser time to update in response before you start making assertions. Use the `driver.wait` method to do this.

If the tests are failing and you don't know why, run them with env var `DEBUG_LOG=true`:

```
$ DEBUG_LOG=true yarn run test-e2e
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

Then download the appropriate `BrowserStackLocal`, unpack it.

When all is set up, run the remote tests:
1. Run `BrowserStackLocal` with your key: ./BrowserStackLocal --key mYbRoWsErStAcKkEy
1. Run the tests: ```
$ export TEST_ENV=remote
$ yarn run test-e2e
```
1. You can view the progress and results on [BrowserStack](https://www.browserstack.com/automate).

### Simulator
ANET has a simulator that can exercise of the functions. It is located in 'client/test/sim'. It works by interfacing with ANET through GraphQL queries. The simulator executes `stories` which are assigned to different user types and have different probabilities.   

The simulator can be started by running 'yarn run sim' in 'client'.

## React Frontend
### Initial Setup
1. Make sure you have node.js v10.x LTS installed: ( http://nodejs.org )
1. `cd client/`
    - All of the frontend code is in the `client/` directory.
1. Install the development dependencies: `yarn install`
1. Run the server: `yarn run start`
1. Go to [http://localhost:3000/](http://localhost:3000/) in your browser.
   - When prompted for credentials:
     - **Username:** `erin`
     - **Password:** Leave it blank

NB: You only need node.js and the npm dependencies for developing. When we deploy for production, everything is compiled to static files. No javascript dependencies are necessary on the server.

## Development Mode
In the `anet.yml` file there is a flag for `developmentMode`.  This flag does several valuable things::
1. On every graphql query, the entire graphql graph is reloaded and re-parsed.  This helps in backend evelopment by allowing you to make quick changes without having to restart the server.  (Note: this only helps if you're running ANET out of eclipse in debug mode). 
1. ANET will use AuthType Basic rather than windows authentication.  This allows you to develop on non-windows computers and also quickly impersonate other accounts for testing.  To log in with an account, enter the `domainUsername` value for that user in the 'Username' field when prompted by your browser.  Leave the password field blank. 
1. You can easily simulate a "new user" in development mode by entering a new username into both the username and password field.  This will activate the same code path as if a user came to the production system with a valid Windows Authentication Principal but we don't find them in the `people` table.  If you enter an unknown username and no password, ANET will reject you. If you enter an unknown username and the same unknown username into the password field, it will create that account and drop you into the new user workflow. 
