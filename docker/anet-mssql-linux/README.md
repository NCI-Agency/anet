# anet-mssql-linux

Docker image for running an mssql database for [anet](https://github.com/nci-agency/anet)

# usage

* run the image:
  ```sh
  docker run -d \
      -e "ACCEPT_EULA=Y" \
      -e "SA_PASSWORD=password" \
      -e "DB_NAME=dbName" \
      -e "DB_USER=dbUserName" \
      -e "DB_USER_PASSWORD=password" \ 
      -p 1433:1433 \
      ncia/anet-mssql-linux
  ```

This will start an mssql server 14.0.3238.1-19 on ubuntu:16.04 with full text search enabled, and it will create an empty db (DB_NAME) with a sysadmin (DB_USER/DB_USER_PASSWORD)

After the image is launched, you may want to execute sql statements:

```sh
docker exec -ti mssql-server /opt/mssql-tools/bin/sqlcmd ....
```

If you need to ensure that the database is already created and running, use the following first:

```sh
docker exec -ti \
      -e "DB_NAME=dbName" \
      -e "DB_USER=dbUserName" \
      -e "DB_USER_PASSWORD=password" \
      mssql-server /opt/waitTillServiceStarted.sh
```

