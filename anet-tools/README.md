# Data Import and Manipulation Framework

[What is Data Import and Manipulation Framework](#what_is_data_import_and_manipulation_framework) <br />
[How it works](#how_it_works) <br />
[Functionalities](#functionalities) <br />
[Installation](#installation) <br />
[Business Logic Rules](#business-logic-rules)<br />

## What is Data Import and Manipulation Framework
This framework allows you to import data into the ANET database by writing a single script from various sources(csv, xlsx, ad etc.).<br />

## How to use it?
- Parse your data to pandas dataframe object using classes inside src.core.utils.source.
- Create entity objects using classes in src/core/model/annotated.py.
- Make a list of objects.
- Write to the database using the save_data method of the data import framework with this list.

You can find examples for various scenarios in [examples](https://github.com/NCI-Agency/anet/tree/GH-2959-Data-import-and-manipulation-framework/anet-tools/src/examples).


## Functionalities

### Add update rule method
This method adds an update rule each time it is called. With the update rules defined by this method, it is determined whether the incoming entity objects and their associated objects will be inserted or updated. Multiple update rules can be added for multiple columns of many tables. The tablename property determines for which table the update rule will be added. The col_names property determines which columns of the specified table will be checked for updating. For example, when tablename = people and col_name = ["name", "rank"] a query is sent according to the name and rank column in the people table in the database for each entity object and if a single record returns, that record is updated, otherwise entity is inserted as new record.

### Remember hash of input
Data Import Framework can also remember a hash of the imported data to determine a change in the content. You need to set remember_hash variable of start_import method. You can get more detailed info in [examples](https://github.com/NCI-Agency/anet/tree/GH-2959-Data-import-and-manipulation-framework/anet-tools/src/examples).

### Log results to csv
Import framework logs objects in three category imported, not imported and previously processed. You need to set log variable of start_import method. You can get more detailed info in [examples](https://github.com/NCI-Agency/anet/tree/GH-2959-Data-import-and-manipulation-framework/anet-tools/src/examples).

## Installation
### Development Environment
#### Setting up Dev Environment
##### Changes in localSettings.gradle file
- If you want to use jupyter lab instead of jupyter notebook use following in your `localSettings.gradle` file (default jupyter notebook).
    ```
    run.environment("JUPYTER_ENABLE_LAB", "true")
    ```
- If you want to specify port you will use jupyter, use following in your `localSettings.gradle` file (default port is 5000).
    ```
    run.environment("ANET_JUPYTER_PORT", "<port_number>")
    ```
##### Start Dev Environment
- Pull the Jupyter Docker image: `./gradlew dockerPullJupyterDev`
- Create the Jupyter Docker container: `./gradlew dockerCreateJupyterDev`
- Start the Jupyter Docker container: `./gradlew dockerStartJupyterDev`
- Wait until the container is fully started, then run `./gradlew dockerInstallJupyterDevDependencies` to install dependencies by using pipfile.
- Open a browser and type the following to the addressbar: `localhost:<port_number>`
- Type `anet` in token area and press enter.

### Production Environment
You can use the import framework in a production environment using the [python executable (pex)](https://pypi.org/project/pex/) file which contains the framework and dependencies.

#### What are the system requirements
To use the import framework in a production environment, make sure you have [python3.6](https://www.python.org/) and [pex](https://pypi.org/project/pex/) installed on your system.

#### Create pex file manually
To create this file manually, you have to run `./gradlew dockerCreateJupyterTest dockerStartJupyterTest dockerPackJupyter` tasks.
##### Create pex file with distribution zip
When an ANET distribution is created using the `./gradlew build` task, the import framework pex file is automatically created and copied to the `lib/` directory inside the distribution zip file. Make sure that you started test container with `./gradlew dockerCreateJupyterTest dockerStartJupyterTest` command before build process.

#### How to use pex file
You can think of the resulting pex file as a python interpreter with dependencies embedded in it. To use it, you have to write a script [as in examples](https://github.com/NCI-Agency/anet/tree/GH-2959-Data-import-and-manipulation-framework/anet-tools/src/examples). Then you can start import by typing `~ /data_import_framework.<version>-<db_driver>.pex ~/your_import_script.py` in terminal.

## Business Logic Rules
You can use framework to import into people, positions, locations and organizations and reports tables. <br />