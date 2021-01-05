# Data Import and Manipulation Framework

[What is Data Import and Manipulation Framework](#what_is_data_import_and_manipulation_framework) <br />
[How it works](#how_it_works) <br />
[Functionalities](#functionalities) <br />
[Installation](#installation) <br />
[Business Logic Rules](#business-logic-rules)<br />

## What is Data Import and Manipulation Framework
This framework allows you to import data into the anet database by writing a single script from various sources (csv, xlsx, ad etc.), taking into account the anet business rules.<br />

## How it works
Create entity objects using classes in src/core/models.py. Make a list of objects. Write to the database using the save_data method of the data import framework with this list. The data import framework decides the business logic rule to be applied for each entity object and its associated objects, according to the update rules added with the add_update_rule method. Necessary transactions are performed for each entity according to the determined business logic rules.


## Functionalities

### Add update rule method
This method adds an update rule each time it is called. With the update rules defined by this method, it is determined whether the incoming entity objects and their associated objects will be inserted or updated. Multiple update rules can be added for multiple columns of many tables. The tablename property determines for which table the update rule will be added. The col_names property determines which columns of the specified table will be checked for updating. For example, when tablename = people and col_name = ["name", "rank"] a query is sent according to the name and rank column in the people table in the database for each entity object and if a single record returns, that record is updated, if no record is returned, entity is inserted as new record.

### Remember hash of input
Data Import Framework can also remember a hash of the imported data to determine a change in the content. It stores and checks hashes from /datasamples/hashvalues.txt file.

### Save errorneous records to csv
The framework saves the data samples encountered with errors during import into a csv file named errorneous_recors_<timestamp>.csv with a message for each data instance containing the cause of the error. In this way, it allows the user to correct the data and send it again.

## Installation
### Development Environment
#### Changes in localSettings.gradle file
- If you want to use jupyter lab instead of jupyter notebook use following in your `localSettings.gradle` file (default jupyter notebook).
    ```
    run.environment("JUPYTER_ENABLE_LAB", "yes")
    ```
- If you want to specify port you will use jupyter, use following in your `localSettings.gradle` file (default port is 5000).
    ```
    run.environment("ANET_JUPYTER_PORT", "<port_number>")
    ```

#### Setting up Environment
- Pull the Jupyter Docker image: `./gradlew dockerPullJupyter`
- Create the Jupyter Docker container: `./gradlew dockerCreateJupyter`
- Start the Jupyter Docker container: `./gradlew dockerStartJupyter`
- Wait until the container is fully started, then run `./gradlew dockerInstallJupyterDependencies` to install dependencies by using pipfile.
- Open browser and type following to addressbar `localhost:<port_number>`
- Type `anet` in token area and press enter.

### Production Environment
You can use the import framework in a production environment using the [python executable (pex)](https://pypi.org/project/pex/) file which contains the framework and dependencies.

#### What are the system requirements
To use the import framework in a production environment, make sure you have [python3.6](https://www.python.org/) and [pex](https://pypi.org/project/pex/) installed on your system.

#### How to create pex file
To create this file, you must first run the `./gradlew dockerCreateJupyter` and `./gradle dockerStartJupyter` tasks respectively. Subsequently, when an ANET distribution is created using the `./gradlew build` task, the import framework pex file is automatically created and copied to the `lib/` directory inside the distribution zip file.

#### How to use pex file
You can think of the resulting pex file as a python interpreter with dependencies embedded in it. To use it, you have to write a script [like the example](https://github.com/NCI-Agency/anet/blob/GH-2959-Data-import-and-manipulation-framework/anet-tools/src/examples/read_parse_import_example.py) with your own mapping. Then you can use by typing `~ /data_import_framework.<majorver>.<minorver>.<patch>.pex ~/your_import_script.py` via terminal.

## Business Logic Rules
You can use the import framework to import into people, positions, locations and organizations tables. 6 main business logic rules(10 in total) related to People, Positions and peoplePositions tables were implemented in framework. <br />

These are,

- UpdatePosition -> Update record in positions table. <br />
- UpdatePerson -> Update record in people table. <br />

- InsertPosition -> Insert record to positions table. <br />
- InsertPerson -> Insert record to people and peoplePositions tables. <br />

- UpdatePositionUpdatePerson -> Insert and update records to people and peoplePositions tables.
  - Position has no person and person has no position.
  - Position has person and person has no position.
  - Position has no person and person has position.
  - Position has person and person has position.

- InsertPositionInsertPerson -> Insert records to people positions and peoplePositions table.
