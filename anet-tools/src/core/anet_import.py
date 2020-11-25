import os
import uuid
import json
import datetime
import pandas as pd
from pandas.util import hash_pandas_object
from sqlalchemy import and_
from src.core.db import db
from src.examples.models import BaseModel
from src.core.data import txt
from sqlalchemy import exc
from src.core.base_methods import base_methods

class anet_import(db):
    def __init__(self):
        super().__init__(use_env=True)
        self.path_root = "/".join(os.getcwd().split("/")[:4])
        self.path_log = os.path.join(self.path_root, "datasamples")
        self.path_hashfile = self.path_log
        self.update_rules = { "tables": [] }
    
    def initialize_successful_entity_list_json(self):
        self.successful_entity_list_json = list()
        
    def initialize_unsuccessful_entity_list_json(self):
        self.unsuccessful_entity_list_json = list()
    
    def append_successful_entity_list_json(self, entity_json):
        self.successful_entity_list_json.append(entity_json)

    def append_unsuccessful_entity_list_json(self, entity_json):
        self.unsuccessful_entity_list_json.append(entity_json)
    
    def set_base_session(self):
        BaseModel.set_session(self.session)

    def sqlalc_exc(self, e, entity_json, from_relation_table):
        if from_relation_table:
            exc_reason = e
        else:
            exc_reason = str(type(e)) + "-->" + str(e.args)
        print(exc_reason)
        entity_json["row"]["exception_reason"] = exc_reason
        self.append_unsuccessful_entity_list_json(entity_json)
        print("unsuccessfull: " + str(len(self.unsuccessful_entity_list_json)))
        #print(str(e))
        self.session.rollback()#######################################################################################################################################

    def write_data(self, entity_list_json):
        for entity_json in entity_list_json:
            utc_now = datetime.datetime.now()
            try:
                entity = entity_json["entity"]
                is_entity_update = base_methods.is_entity_update(entity, self.update_rules)
                if base_methods.is_entity_single(entity):
                    if is_entity_update:
                        entity.update_entity(utc_now)
                    else:
                        entity.insert_entity(utc_now)
                else:
                    entity.insert_update_nested_entity(self.update_rules, utc_now)
                self.append_successful_entity_list_json(entity_json)
                print("successfull: " + str(len(self.successful_entity_list_json)))
            except exc.SQLAlchemyError as e:
                self.sqlalc_exc(e=e, entity_json = entity_json, from_relation_table = False)
            except Exception as e:
                self.sqlalc_exc(e=e, entity_json = entity_json, from_relation_table = True)            
   
    def write_unsuccessful_records_to_csv(self):
        if len(self.unsuccessful_entity_list_json) == 0:
            print("all entities imported to db successfully")
        else:
            unsuccessful_entity_df = pd.DataFrame()
            for entity_json in self.unsuccessful_entity_list_json:
                unsuccessful_entity_df = pd.concat([unsuccessful_entity_df, pd.DataFrame(entity_json["row"]).T])
            filename = "unsuccessful_" + str(datetime.datetime.now()).replace(" ", "_")
            fullpath = os.path.join(self.path_log, filename + ".csv")
            unsuccessful_entity_df.to_csv(fullpath)
            print("importing " + str(len(self.unsuccessful_entity_list_json)) + " entities unsuccessful. written to log file named: " + "/".join(fullpath.split("/")[4:]))
    
    def read_from_hashlist_file(self, fullpath_hashfile):
        hash_txt_obj = txt(fullpath_hashfile)
        hash_txt_obj.read_txt_file()
        #hash_txt_obj.content
        print("Reading hash list successfull")
        return hash_txt_obj
    
    def write_hashlist_to_file(self, fullpath_hashfile):
        with open(fullpath_hashfile, "w") as h_f:
            h_f.write("\n".join(self.hash_list))
        print("Hash file updated with hash of successful entities")
        
    def update_hash_list_from_file(self):
        fullpath_hashfile = os.path.join(self.path_hashfile, "hashvalues.txt")
        hash_txt_obj = self.read_from_hashlist_file(fullpath_hashfile)
        self.hash_list = [h.replace(",", "").replace("\n", "") for h in hash_txt_obj.content]
        print("Hash list updated")
            
    def exclude_old_entity_compare_hashes(self, entity_list_json):
        self.update_hash_list_from_file()
        entity_list_json_old_excluded = list()
        count_old_record = 0
        for e in entity_list_json:
            if str(hash_pandas_object(e["row"]).sum()) not in self.hash_list:
                entity_list_json_old_excluded.append(e)
            else:
                count_old_record = count_old_record + 1
        if count_old_record != 0:
            print(str(count_old_record), " entity will not be processed again since they were processed in the past!")
        else:
            print("No entity excluded, all entities are new.")
        return entity_list_json_old_excluded
    
    def write_successful_entities_hashfile(self):
        # This line could be removed in future
        self.update_hash_list_from_file()
        for entity_json in self.successful_entity_list_json:
            self.hash_list.append(str(hash_pandas_object(entity_json["row"]).sum()))
        fullpath_hashfile = os.path.join(self.path_hashfile, "hashvalues.txt")
        self.write_hashlist_to_file(fullpath_hashfile)
        
    def save_data(self, entity_list_json):
        #{"entity": person, "row": row}
        self.connect()
        self.set_base_session()
        self.initialize_successful_entity_list_json()
        self.initialize_unsuccessful_entity_list_json()
        entity_list_json_old_excluded = self.exclude_old_entity_compare_hashes(entity_list_json)
        self.write_data(entity_list_json_old_excluded)
        #self.write_unsuccessful_records_to_csv()
        #self.write_successful_entities_hashfile()
           
    def save_log(self, list_row, log_file_name):
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
        self.update_rules["tables"].append({ "name":tablename, "columns":col_names})
        
    def print_update_rules(self):
        print(json.dumps(self.update_rules, indent = 4))

    def clear_update_rules(self):
        self.update_rules = { "tables": [] }