import os
import uuid
import json
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, and_

class anet_import:
    def __init__(self):
        self.dbConnString = os.environ["DB_DRIVER"] + "://" + \
                            os.environ["ANET_DB_USERNAME"] + ":" + os.environ["ANET_DB_PASSWORD"] + "@" + \
                            "192.168.10.164" + "/" + \
                            os.environ["ANET_DB_NAME"]
        self.path_root = "/".join(os.getcwd().split("/")[:4])
        self.path_log = os.path.join(self.path_root, "datasamples")
        self.update_rules = { "tables": [] }
        
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
    
    def check_data_type(self, variable, name, datatype):
        if type(variable) is not datatype:
            print("'" + name + "'", "is ", type(variable), ", however, it must be " , datatype)
            return False
        else:
            return True
    
    def connect(self):
        try:
            self.engine = create_engine(self.dbConnString)
            #print("db engine created")
            self.session = Session(self.engine)
            #print("db session created")
            print("Successfully connected to the database with conn_str: " + self.dbConnString)
        except Exception as e:
            print("EXCEPTION WHILE CONNECTING TO DATABASE: ", str(e))
    
    def update_data(self, entity_list):
        entity_list_insert = list()
        for entity in entity_list:
            returned_data_list = list()
            for update_rule in self.update_rules["tables"]:
                if entity.__tablename__ == update_rule["name"]:
                    returned_data_list = self.session.query(entity.__class__).filter(and_(getattr(entity.__class__, attr_name) == getattr(entity, attr_name) for attr_name in tuple(update_rule["columns"]))).all()
                    break
            if len(returned_data_list) == 1:
                r = returned_data_list[0]
                for attr, value in entity.__dict__.items():
                    if attr != "_sa_instance_state":
                        setattr(r, attr, value)
                self.session.commit()
            else:
                entity.uuid = str(uuid.uuid4())
                entity_list_insert.append(entity)
        return entity_list_insert

    
    def save_data(self, entity_list):
        self.connect()       
        entity_list_insert = self.update_data(entity_list)
        try:
            self.session.add_all(entity_list_insert)
            self.session.commit()
            print("Writing to DB is Successful")
        except Exception as e:
            print("EXCEPTION WHILE WRITING TO DATABASE: ", str(e))
    
    def generate_entity_classes(self, tables, filename):
        path_out_file = "/".join(os.getcwd().split("/")[:-1]) + "/core/" + filename + ".py "
        generate_command = "sqlacodegen " + self.dbConnString + " --outfile " + path_out_file
        if len(tables) != 0:
            generate_command += "--tables " + "'" + ",".join(tables) + "'"
        try:
            os.system(generate_command)
            print("Entity classes generated inside " + "/".join(path_out_file.split("/")[4:]))
        except Exception as e:
            print("EXCEPTION WHILE GENERATING ENTITY CLASSES: ", str(e))
    
    def save_log(self, list_row, log_file_name):
        if not self.check_data_type(list_row, "list_row", list):
            return False
        if not self.check_data_type(log_file_name, "log_file_name", str):
            return False
        path_file = os.path.join(self.path_log, log_file_name + ".csv")
        df_of_row = pd.DataFrame(list_row)
        if os.path.exists(path_file):
            log_file = pd.read_csv(path_file)
            log_file = pd.concat([log_file, df_of_row])
        else:
            log_file = df_of_row
        log_file.to_csv(path_file, index=False)
        print("Log saving successful")
    
    def add_update_rule(self, tablename, col_names):
        if not self.check_data_type(tablename, "tablename", str):
            return False
        if not self.check_data_type(col_names, "col_names", list):
            return False
        if False in [self.check_data_type(col_name, "elements of col_names", str) for col_name in col_names]:
            return False
        self.update_rules["tables"].append({ "name":tablename, "columns":col_names})
        
    def print_update_rules(self):
        print(json.dumps(self.update_rules, indent = 4))

    def clear_update_rules(self):
        self.update_rules = { "tables": [] }
        