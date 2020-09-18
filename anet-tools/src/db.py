from sqlalchemy import create_engine, MetaData, Table
from sqlalchemy.orm import mapper, sessionmaker, clear_mappers
import os
import pandas as pd
import json

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
        self.people = People
        try:
            self.engine = create_engine(self.dbConnString)

            metadata = MetaData(self.engine)
            moz_people = Table('people', metadata, autoload=True)
            mapper(self.people, moz_people)

            Session = sessionmaker(bind=self.engine)
            self.session = Session()
            print("Successfully connected to the database with conn_str: " + self.dbConnString)
        except Exception as e:
            print("EXCEPTION: ", str(e))
    
    def clear_all_mappings(self):
        clear_mappers()
    
    #def get_all_people(self):
    #    people_all = db_obj.session.query(self.people).all()
    #    return people_all
        
    def get_all_people_as_df(self):
        self.people_df = pd.read_sql_table("people", con=self.engine)
        del self.people_df["full_text"]
        print("object.people_df created")
    
    def update_db(self):
        #self.people_df.to_sql(name="people",con=self.engine, if_exists='replace', index=False, chunksize=500)
        
        df_json = self.people_df.to_json(orient="records", date_format='iso')
        self.session.bulk_update_mappings(self.people, json.loads(df_json))
        self.session.commit()
        
        #self.session.add(new_instance)
        #self.session.commit()
    
    def insert_db(self, insert_df):
        df_json = insert_df.to_json(orient="records", date_format='iso')
        self.session.bulk_insert_mappings(self.people, json.loads(df_json))
        self.session.commit()
        
if __name__ == "__main__":
    db_obj = db()
    db_obj.connect()
    db_obj.get_all_people_as_df()
    db_obj.people_df