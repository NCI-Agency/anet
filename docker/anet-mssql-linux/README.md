# anet-mssql-linux

Docker image for running a mssql database for [anet](https://github.com/nci-agency/anet)

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

This will start a mssql server 14.0.600.250-2 on ubuntu:16.04 with full text search enabled, and it will create an empty db (dbName) with a sysadmin (DB_USER/DB_USER_PASSWORD)

After the image is lancuhed, you may want to execute sql statements

```sh
docker exec -ti mssql-server /opt/mssql-tools/bin/sqlcmd ....
```

If you neet to ensure that the dastabase is already created and running, use the following first:

```sh
docker exec -ti \
      -e "DB_NAME=dbName" \
      -e "DB_USER=dbUserName" \
      -e "DB_USER_PASSWORD=password" \
      mssql-server /opt/waitTillServiceStarted.sh
```



