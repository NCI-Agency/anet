# How the frontend works
React structures the application into components instead of technologies. This means that everything that gets rendered on the page has its own file based on its functionality instead of regular HTML, CSS, and JS files. For example, the new report form lives in `client/src/pages/reports/New.js` and contains everything needed to render that form (all the CSS, HTML, and JS). It comprises a number of other components, for example the `Form` and `FormField` components which live in `client/src/components/Form.js` and `client/src/components/FormField.js`, which likewise contains everything needed to render a form field to the screen. This makes it very easy to figure out where any given element on screen comes from; it's either in `client/src/pages` or `client/src/components`. Pages are just compositions of components written in HTML syntax, and components can also compose other components for reusability.

# How to pull down new changes and update your local server
1. Close any servers you have running (the `./gradlew` or `yarn` commands)
1. Pull down any updates `git pull`
1. If you see any changes to `src/main/resources/migrations.xml` this means there are updates to the database schema.  Run `./gradlew dbMigrate` to update your database schema.
  - If you are using sqlserver then you need to run `export DB_DRIVER='sqlserver'` to tell gradle to use your sqlserver configuration
1. If you see any changes to `insertBaseData.sql` then there are updates to the base data set.
  - If you are using sqlite, then run `cat insertBaseData.sql | ./mssql2sqlite.sh | sqlite3 development.db`
  - If you are using sqlserver, then use your favorite SQL connector to run the insertBaseData.sql file.
1. Re launch the backend server with `./gradlew run`
1. Re launch the frontend server with `./yarn start`

# How to run tests
Run `yarn test` to run the linter and tests; see the next subsections for details on testing locally or remotely. Obviously, this assumes you have started both the backend and the frontend servers before starting the tests.

Run `yarn lint-fix` to automatically fix some kinds of lint errors.

## How the tests work
Our tests use selenium to simulate interacting with the app like a user. To do this, we need to connect a browser to the JavaScript tests. We do that via a driver.
This driver can either run the tests locally on your system, or remotely via [BrowserStack](https://www.browserstack.com/).

### Prerequisites
The tests are reliant on the data looking pretty similar to what you'd get after a fresh run of `insertBaseData.sql`. If the tests crash and do not complete, they could leave the data set in a state which would cause future test runs to fail. To get out of this situation, run `insertBaseData.sql` again.

### Testing locally
To run the tests locally, by having [`chromedriver`](https://www.npmjs.com/package/chromedriver) as an npm dependency, we automatically have access to run in Chrome. To use Firefox instead, see [`geckodriver`](https://www.npmjs.com/package/geckodriver).

When writing browser tests, remember that when you take an action, you need to give the browser time to update in response before you start making assertions. Use the `driver.wait` method to do this.

If the tests are failing and you don't know why, run them with env var `DEBUG_LOG=true`:

```
$ DEBUG_LOG=true yarn test
```

You can also insert the following into your code to make the browser pause, allowing you to investigate what is currently happening:

```js
await t.context.waitForever()
```

In rare circumstances, when using Chrome, the tests will hang on the `data:,` URL. I don't know why this is. If you re-run the test, you should not see the issue a second time.

### Testing remotely
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

Then download the appropriate `BrowserStackLocal`, unpack it, and run it with your key.
When all is set up, run the remote tests with:
```
$ export TEST_ENV=remote yarn test
```
You can view the progress and results on [BrowserStack](https://www.browserstack.com/automate).

# Random Documentation!!

## How to add a new field to an object

1. Create a migration to add it to the database tables
1. Edit the bean object to add the field and getter/setters
1. Edit the Mapper class to map the field when it comes out of the database
1. Edit the Dao class to:
  a. add it to the list of Columns in the *_FIELDS variable for the class. ( ie PersonDao.PERSON_FIELDS)
  b. update any SQL to ensure the value gets INSERTed and UPDATEd correctly.
1. update the bean tests to include having this property and update the src/test/resources/testJson to include the property.
1. Update the resource unit tests to try setting, fetching, and updating the property.
