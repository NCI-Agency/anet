# Setting up your Developer Environment (Eclipse, gradle, node, Chrome/Firefox)
This section describes the recommended Developer Environment and how to set it up.  You are welcome to use any other tools you prefer.

## Download open source software
- [JDK 8](http://www.oracle.com/technetwork/java/javase/downloads/index.html).  This can also be either installed, or downloaded as a .zip.  If you do not use the installer, be sure to set the `JAVA_HOME` environment variable to the location of the JDK.
- [Eclipse](http://www.eclipse.org/downloads/).  Eclipse is a Java IDE.  It can be downloaded as an installer or as a .zip file that does not require installation.
  - When the installer asks which version you'd like to install, choose "Eclipse IDE for Java Developers".
- [node.js 8.x](https://nodejs.org/en/).
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
      1. Environment variables include anything set in build.gradle or localSettings.gradle.  If you are using sqlite as your database, this will include: `ANET_DB_DRIVER=org.sqlite.JDBC`, `ANET_DB_URL=jdbc:sqlite:development.db`, `ANET_DB_DATE_STRING_FORMAT=yyyy-MM-dd hh:mm:ss.SSS Z"`, `ANET_DB_DATE_CLASS=text`
   1. Ensure there are no compile errors. If there are, you are probably missing dependencies or forgot to set environment variables in Eclipse. Try re-running `./gradlew eclipse` or checking the Eclipse run configuration vs gradle configs.
1. Update the settings in `anet.yml` for your environment.  See the [ANET Configuration documentation](https://github.com/deptofdefense/anet/blob/master/DOCUMENTATION.md#anet-configuration) for more details on these configuration options. You are most likely to change:
   1. `emailFromAddr` - use your own email address for testing.

## Java Backend

### Initial Setup
1. You can either use SQLite or Microsoft SQL Server for your database. The former allows you to run entirely on your local machine and develop offline. The latter allows you to test on the same database and feature set that production will use. We do our best to support both but cannot guarantee that the SQLite code will exactly match the SQL Server.
   - SQLite
     - This is currently the default, so you don't need to do anything special
     - To re-force gradle to use SQLite you can set the `DB_DRIVER` environment variable to `sqlite` (e.g. `export DB_DRIVER=sqlite`), or you can paste the following in your `localSettings.gradle` file:

      ```java
      run.environment("DB_DRIVER", "sqlite")
      ```
   - MSSQL
     - Paste the following in your `localSettings.gradle` file (with the correct values):

      ```java
      run.environment("DB_DRIVER", "sqlserver")
      run.environment("ANET_DB_USERNAME","username")
      run.environment("ANET_DB_PASSWORD", "password")
      run.environment("ANET_DB_SERVER", "db server hostname")
      run.environment("ANET_DB_NAME","database name")
      ```
1. Pull the MSSQL Docker image: `./gradlew dockerPullDB`
1. Create the MSSQL Docker container and the initial database: `./gradlew dockerCreateDB`
1. Start the MSSQL Docker container: `./gradlew dockerStartDB`
1. Wait until the container is fully started, then run `./gradlew dbMigrate` to build and migrate the database.
   - The database schema is stored in `src/main/resources/migrations.xml`.
1. Seed the initial data:
   - SQLite: `cat insertBaseData.sql | ./mssql2sqlite.sh | sqlite3 development.db`
   - MSSQL: If you're using the Docker container for the database (and you should), you can load the data with: `./gradlew dbLoad`. Otherwise, you'll need to manually connect to your sqlserver instance and run `insertBaseData.sql` through the GUI or run 'sqlcmd -S <servername> -U <username> -P <password> -d <database name> -i insertBaseData.sql'
1. Run `./gradlew build` to download all dependencies and build the project.
   - Some tests will fail if you are using SQLite, because it has a bad implementation of some timezone stuff. You'll need to use MSSQL to see all the tests passing.

#### Initial Setup Test Database
After successfully creating and building the MSSQL Docker container it is posisble to create a dedicated container for testing. Use the `-PtestEnv` property to access the test environment settings in `gradle`.
1. Create the MSSQL Docker container and test database `./gradlew -PtestEnv dockerCreateDB`
1. Start the MSSQL Docker container: `./gradlew -PtestEnv dockerStartDB`
1. Wait until the container is fully started, then run `./gradlew -PtestEnv dbMigrate`
1. Seed initial data - MSSQL: `./gradlew -PtestEnv dbLoad`.
1. Run `./gradlew -PtestEnv build` to download all dependencies and build the project.

##### Override Default Gradle Settings
Override the default gradle settings if you want to run your tests on a different database:
   1. Open a command line in the `anet` directory that was retrieved from github.
   1. Create a new empty file at `localTestSettings.gradle`. (`touch localTestSettings.gradle` on linux/mac).  This will be a file for all of your local test settings and passwords that should not be checked into GitHub.

_Note_: You can run the backend with either `gradle` or with Eclipse. Eclipse does not use gradle's configurations, so you'll have to set them up yourself.  You'll want to create a run configuration with:
   - Main Class: `mil.dds.anet.AnetApplication`
   - Program Arguments: `server anet.yml`
   - Environment Variables: These values are used in anet.yml. We set them through environment variables rather than checking them into the git repository to allow each developer to use different settings. 
     - SQLite: 
       - `ANET_DB_DATE_CLASS` : `text`
       - `ANET_DB_DATE_STRING_FORMAT` : `yyyy-MM-dd hh:mm:ss`
       - `ANET_DB_URL` : `jdbc:sqlite:development.db`
       - `ANET_DB_DRIVER` : `org.sqlite.JDBC`
     - MSSQL: 
       - `ANET_DB_URL` : `jdbc:sqlserver://[sqlserver hostname]:1433;databaseName=[dbName]`
       - `ANET_DB_USERNAME` : username to your db
       - `ANET_DB_PASSWORD` : password to your db
       - `ANET_DB_DRIVER` : `com.microsoft.sqlserver.jdbc.SQLServerDriver`

### The Base Data Set
Provided with the ANET source code is the file `insertBaseData.sql`.  This file contains a series of raw SQL commands that insert some sample data into the database that is both required in order to pass all the unit tests, and also helpful for quickly developing and testing new features.  The Base Data Set includes a set of fake users, organizations, locations, and reports.  Here are some of the accounts that you can use to log in and test with:

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

### Testing
1. Start with a clean database when running tests: `/gradlew -PtestEnv dbDrop dbMigrate dbLoad`
1. Run tests with a clean build: `./gradlew -Ptest cleanTest test`
1. For client side E2E tests run the server against the test database: `./gradlew -PtestEnv run`

## React Frontend
### Initial Setup
1. Make sure you have node.js v8.x installed: ( http://nodejs.org )
1. `cd client/`
    - All of the frontend code is in the `client/` directory.
1. Install the development dependencies: `yarn install`
1. Run the server: `yarn start`
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
