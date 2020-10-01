from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, MetaData, Column, Integer, Table, DateTime
from sqlalchemy.sql.expression import Insert
import datetime
import os

class People(object):
    pass

class db:
    def __init__(self):
        self.dbConnString = os.environ["DB_DRIVER"] + "://" + \
                            os.environ["ANET_DB_USERNAME"] + ":" + os.environ["ANET_DB_PASSWORD"] + "@" + \
                            "localhost" + "/" + \
                            os.environ["ANET_DB_NAME"]
        print("db object created")
        
    
    def print_db_env_vars(self):
        # PRINT DB CONNECTION INFO FROM OS.ENVIRON
        print("ANET_DB_EXPOSED_PORT\t:", os.environ["ANET_DB_EXPOSED_PORT"], "\n"\
              "ANET_DB_PASSWORD\t:", os.environ["ANET_DB_PASSWORD"],"\n"\
              "ANET_DB_SERVER\t\t:", os.environ["ANET_DB_SERVER"],"\n"\
              "ANET_DB_NAME\t\t:", os.environ["ANET_DB_NAME"], "\n"\
              "ANET_DB_USERNAME\t:", os.environ["ANET_DB_USERNAME"], "\n"\
              "DB_DRIVER\t\t:", os.environ["DB_DRIVER"])
    
    def print_db_connection_string(self):
        print(self.dbConnString)

    def connect(self):
        try:
            self.Base = automap_base()
            self.metadata = MetaData()
            self.engine = create_engine(self.dbConnString)
            
            self.Base.prepare(self.engine, reflect=True)
            self.People = self.Base.classes.people
            self.Positions = self.Base.classes.positions
            self.session = Session(self.engine)
            
            self.PeoplePositions = Table('peoplePositions',self.metadata, Column('createdAt', DateTime, primary_key=True), autoload=True, autoload_with=self.engine)
            self.conn = self.engine.connect()
            print("Successfully connected to the database with conn_str: " + self.dbConnString)
        except Exception as e:
            print("EXCEPTION: ", str(e))
