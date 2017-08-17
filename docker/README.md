# ANET and Docker Containers

TODO: Make this better and integrate it in the main documentation

## Prerequisites

Content of localSettings.gradle
required:
  ```java
run.environment("DB_DRIVER", "sqlserver")
run.environment("ANET_DB_SERVER", "localhost")
run.environment("ANET_DB_NAME", "testAnet")
run.environment("ANET_DB_USERNAME", "anetUser")
run.environment("ANET_DB_PASSWORD", "P@ssw0rd")
run.environment("ANET_DB_PORT", 1433)
  ```

Optionally, if you wish to mount additional volumes in the container
(e.g. to persist the database outside the container), add a line:

  ```java
run.environment("DOCKER_MOUNTS", ["/files/mssql": "/var/opt/mssql", "/files/home": "/home"])
  ```

The value of the `DOCKER_MOUNTS` property is a key-value map: a comma-separated
list of colon-separated volume mounts `"/source": "/destination"`, with
`/source` a local directory on your system, and `/destination` the mount point
inside the container.
Note that these are only applied at container creation time!


## ANET app container manipulations


### Build ANET Application Server Docker image
  ```sh
./gradlew dockerBuildImage
  ```

## Composing containers

TBD

## DB container manipulations

### Pulling the db image

To pull the latest anet mssql db container:
  ```sh
./gradlew dockerPullDB
  ```

### Creating the db container

To create a db container from the latest mssql image:
  ```sh
./gradlew dockerCreateDB
  ```

### Start the db container

To start a db container

  ```sh
./gradlew dockerStartDB
  ```

### Stop the db container

To stop a db container

  ```sh
./gradlew dockerStopDB
  ```

### Remove the db container

To remove a db container

  ```sh
./gradlew dockerRemoveDB
  ```

