import os

from sqlalchemy import create_engine
from sqlalchemy.orm import Session


class db:
    def __init__(self, use_env=False, conn_json={}):
        if use_env:
            if os.environ["DB_DRIVER"] == "sqlserver":
                os.environ["DB_DRIVER"] = "mssql+pyodbc"

            if os.environ["ANET_DB_SERVER"] == "localhost":
                os.environ["ANET_DB_SERVER"] = os.environ["LOCAL_IP"]

            self.dbConnString = os.environ["DB_DRIVER"] + "://" + \
                os.environ["ANET_DB_USERNAME"] + ":" + \
                os.environ["ANET_DB_PASSWORD"] + "@" + \
                os.environ["ANET_DB_SERVER"] + ":" + os.environ["ANET_DB_EXPOSED_PORT"] + "/" + \
                os.environ["ANET_DB_NAME"]
            if os.environ["DB_DRIVER"] == "mssql+pyodbc":
                self.dbConnString += "?" + "driver=ODBC+Driver+17+for+SQL+Server"

        else:
            if conn_json == {}:
                raise Exception("Connection json is empty")
            else:
                if conn_json["DB_DRIVER"] == "sqlserver":
                    conn_json["DB_DRIVER"] = "mssql+pyodbc"
                self.dbConnString = conn_json["DB_DRIVER"] + "://" + \
                    conn_json["DB_USERNAME"] + ":" +  \
                    conn_json["DB_PASSWORD"] + "@" + \
                    conn_json["DB_SERVER"] + ":" + conn_json["DB_PORT"] + "/" + \
                    conn_json["DB_NAME"]
                if conn_json["DB_DRIVER"] == "mssql+pyodbc":
                    self.dbConnString += "?" + "driver=ODBC+Driver+17+for+SQL+Server"

        print("db object created")

    def print_db_env_vars(self):
        # Print db connection info from os.environ
        print("ANET_DB_EXPOSED_PORT\t:", os.environ["ANET_DB_EXPOSED_PORT"], "\n"
              "ANET_DB_PASSWORD\t:", os.environ["ANET_DB_PASSWORD"], "\n"
              "ANET_DB_SERVER\t\t:", os.environ["ANET_DB_SERVER"], "\n"
              "ANET_DB_NAME\t\t:", os.environ["ANET_DB_NAME"], "\n"
              "ANET_DB_USERNAME\t:", os.environ["ANET_DB_USERNAME"], "\n"
              "DB_DRIVER\t\t:", os.environ["DB_DRIVER"])

    def print_db_connection_string(self):
        # Print db connection string
        print(self.dbConnString)

    def create_engine(self):
        self.engine = create_engine(self.dbConnString)

    def connect(self):
        self.create_engine()
        self.session = Session(self.engine)
        self.conn = self.engine.connect()
        print("Successfully connected to the database with conn_str: " +
              self.dbConnString)
