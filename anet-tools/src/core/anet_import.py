import os
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

class anet_import:
    def __init__(self):
        self.dbConnString = os.environ["DB_DRIVER"] + "://" + \
                            os.environ["ANET_DB_USERNAME"] + ":" + os.environ["ANET_DB_PASSWORD"] + "@" + \
                            "192.168.10.164" + "/" + \
                            os.environ["ANET_DB_NAME"]
        print("db object created")
    
    def print_db_env_vars(self):
        # Print db connection info from os.environ
        print("ANET_DB_EXPOSED_PORT\t:", os.environ["ANET_DB_EXPOSED_PORT"], "\n"\
              "ANET_DB_PASSWORD\t:", os.environ["ANET_DB_PASSWORD"],"\n"\
              "ANET_DB_SERVER\t\t:", os.environ["ANET_DB_SERVER"],"\n"\
              "ANET_DB_NAME\t\t:", os.environ["ANET_DB_NAME"], "\n"\
              "ANET_DB_USERNAME\t:", os.environ["ANET_DB_USERNAME"], "\n"\
              "DB_DRIVER\t\t:", os.environ["DB_DRIVER"])
    
    def print_db_connection_string(self):
        # Print db connection string
        print(self.dbConnString)
    
    def connect(self):
        try:
            self.engine = create_engine(self.dbConnString)
            #print("db engine created")
            self.session = Session(self.engine)
            #print("db session created")
            print("Successfully connected to the database with conn_str: " + self.dbConnString)
        except Exception as e:
            print("EXCEPTION WHILE CONNECTING TO DATABASE: ", str(e))
    
    def save_new_data(self, content):
        self.connect()
        try:
            if type(content) is list:
                self.session.add_all(content)
            else:
                self.session.add(content)
            self.session.commit()
            print("Writing to DB is Successful")
        except Exception as e:
            print("EXCEPTION WHILE WRITING TO DATABASE: ", str(e))
    
    def generate_entity_classes(self,tables, name):
        path_out_file = "/".join(os.getcwd().split("/")[:-1]) + "/core/" + name + ".py "
        generate_command = "sqlacodegen " + self.dbConnString + " --outfile " + path_out_file
        if len(tables) != 0:
            generate_command += "--tables " + "'" + ",".join(tables) + "'"
        try:
            os.system(generate_command)
            print("Entity classes generated inside " + "/".join(path_out_file.split("/")[4:]))
        except Exception as e:
            print("EXCEPTION WHILE GENERATING ENTITY CLASSES: ", str(e))
