#!/bin/bash

if [ "$ACCEPT_EULA" != "y" ] && [ "$ACCEPT_EULA" != "Y" ]; then
    echo "Need to accept MS SQL's EULA and set ACCEPT_EULA to Y"
    exit 1
fi  

if [ -z "$SA_PASSWORD" ]; then
    echo "Need to set SA_PASSWORD"
    exit 1
fi  

mkdir -p /var/opt/mssql
/opt/mssql/bin/sqlservr &

for i in {60..0}; do
  if /opt/mssql-tools/bin/sqlcmd -U SA -P "$SA_PASSWORD" -Q 'SELECT 1;' &> /dev/null; then
    break
  fi
  sleep 1
done

if [ -z "$DB_NAME" ]; then
    echo "Need to set DB_NAME"
    exit 1
fi  

if [ -z "$DB_USER" ]; then
    echo "Need to set DB_USER"
    exit 1
fi  

if [ -z "$DB_USER_PASSWORD" ]; then
    echo "Need to set DB_USER_PASSWORD"
    exit 1
fi  

cat <<-EOSQL > /var/mssql-init.sql
CREATE DATABASE $DB_NAME;
GO
USE $DB_NAME;
GO
CREATE LOGIN $DB_USER WITH PASSWORD = '$DB_USER_PASSWORD';
GO
CREATE USER $DB_USER FOR LOGIN $DB_USER;
GO
ALTER SERVER ROLE sysadmin ADD MEMBER $DB_USER;
GO
EOSQL

/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -t 30 -i /var/mssql-init.sql

#trap 
while [ "$END" == '' ]; do
    sleep 1
    trap "/opt/mssql/bin/sqlservr stop && END=1" INT TERM
done
