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
