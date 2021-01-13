import datetime
import json
import os

import pandas as pd
from sqlalchemy import exc

from src.core.base_methods import base_methods
from src.core.data import txt
from src.core.db import db
from src.examples.models import BaseModel


class anet_import(db):
    def __init__(self, hashfile_fullpath, logfile_fullpath, use_env=False, conn_json={}):
        super().__init__(use_env=use_env, conn_json=conn_json)
        self.path_log = logfile_fullpath
        self.path_hashfile = hashfile_fullpath
        self.update_rules = {"tables": []}

    def print_info(self, content):
        if self.verbose:
            print(str(content))

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
        self.print_info(exc_reason)
        entity_json["row"]["exception_reason"] = exc_reason
        self.append_unsuccessful_entity_list_json(entity_json)
        self.print_info("Unsuccessfull: " +
                        str(len(self.unsuccessful_entity_list_json)))

    def write_data(self, entity_list_json):
        counter = 0
        for entity_json in entity_list_json:
            utc_now = datetime.datetime.now()
            try:
                entity = entity_json["entity"]
                if entity.__tablename__ not in ["positions", "people", "locations", "organizations", "reports"]:
                    raise Exception("Business logic for table " +
                                    entity.__tablename__ + " is not implemented!")
                is_entity_update = base_methods.is_entity_update(
                    entity, self.update_rules)
                if base_methods.is_entity_single(entity):
                    if is_entity_update:
                        entity.update_entity(utc_now)
                    else:
                        entity.insert_entity(utc_now)
                else:
                    entity.insert_update_nested_entity(
                        self.update_rules, utc_now)
                entity.commit()
                self.append_successful_entity_list_json(entity_json)
                self.print_info("Successfull: " +
                                str(len(self.successful_entity_list_json)))
            except exc.SQLAlchemyError as e:
                entity.session.rollback()
                self.sqlalc_exc(e=e, entity_json=entity_json,
                                from_relation_table=False)
            except Exception as e:
                entity.session.rollback()
                self.sqlalc_exc(e=e, entity_json=entity_json,
                                from_relation_table=True)
            counter = counter + 1
            if not self.verbose:
                print(str(counter) + "/" +
                      str(len(entity_list_json)) + " passed", end="\r")
        print(str(counter) + "/" + str(len(entity_list_json)) + " passed")
        print("Import is complete for entities whose table name is",
              entity_json["entity"].__tablename__)

    def write_unsuccessful_records_to_csv(self):
        if len(self.unsuccessful_entity_list_json) == 0:
            print("all entities imported to db successfully")
            print("\n")
        else:
            unsuccessful_entity_df = pd.DataFrame()
            for entity_json in self.unsuccessful_entity_list_json:
                unsuccessful_entity_df = pd.concat(
                    [unsuccessful_entity_df, pd.DataFrame(entity_json["row"]).T])
            filename = "unsuccessful_" + \
                str(datetime.datetime.now()).replace(" ", "_")
            fullpath = os.path.join(self.path_log, filename + ".csv")
            unsuccessful_entity_df.to_csv(fullpath)
            print("importing " + str(len(self.unsuccessful_entity_list_json)) +
                  " entities unsuccessful. It is written to log file named: " + filename)
            print("\n")

    def generate_new_empty_file_if_not_exists(self, path):
        if not os.path.isfile(path):
            print("Generating new file: " + "/".join(path.split("/")[4:]))
            print("\n")
            # this call requires root privileges on OSX
            print(path)
            os.mknod(path)

    def read_from_hashlist_file(self, fullpath_hashfile):
        self.generate_new_empty_file_if_not_exists(fullpath_hashfile)
        hash_txt_obj = txt(fullpath_hashfile)
        hash_txt_obj.read_txt_file()
        print("Reading hash list from file successfull")
        print("\n")
        return hash_txt_obj

    def write_hashlist_to_file(self, fullpath_hashfile):
        with open(fullpath_hashfile, "w+") as h_f:
            h_f.write("\n".join(self.hash_list))
        print("Hash file updated with hash of successful entities")
        print("\n")

    def update_hash_list_from_file(self):
        fullpath_hashfile = os.path.join(self.path_hashfile, "hashvalues.txt")
        hash_txt_obj = self.read_from_hashlist_file(fullpath_hashfile)
        self.hash_list = [h.replace(",", "").replace("\n", "")
                          for h in hash_txt_obj.content]

    def exclude_old_entity_compare_hashes(self, entity_list_json):
        self.update_hash_list_from_file()
        entity_list_json_old_excluded = list()
        count_old_record = 0
        for e in entity_list_json:
            if str(pd.util.hash_pandas_object(e["row"]).sum()) not in self.hash_list:
                entity_list_json_old_excluded.append(e)
            else:
                count_old_record = count_old_record + 1
        if count_old_record != 0:
            print(str(count_old_record),
                  " entity will not be processed again since they were processed in the past!")
            print("\n")
        else:
            print("No entity excluded, all entities are new.")
            print("\n")
        return entity_list_json_old_excluded

    def exclude_incorrect_entity(self, entity_list_json):
        entity_list_json_incorrect_excluded = list()
        for e in entity_list_json:
            if type(e["row"]) == pd.core.series.Series:
                entity_list_json_incorrect_excluded.append(e)
        return entity_list_json_incorrect_excluded

    def write_successful_entities_hashfile(self):
        # This line could be removed in future
        self.update_hash_list_from_file()
        for entity_json in self.successful_entity_list_json:
            self.hash_list.append(str(pd.util.hash_pandas_object(entity_json["row"]).sum()))
        fullpath_hashfile = os.path.join(self.path_hashfile, "hashvalues.txt")
        self.write_hashlist_to_file(fullpath_hashfile)

    def save_data(self, entity_list_json, verbose=True, remember_with_hash=True, write_unsuccessful=True):
        print("***DATA IMPORT AND MANIPULATION FRAMEWORK***")
        self.verbose = verbose
        self.connect()
        self.set_base_session()
        self.initialize_successful_entity_list_json()
        self.initialize_unsuccessful_entity_list_json()
        entity_list_json_incorrect_excluded = self.exclude_incorrect_entity(
            entity_list_json)
        if remember_with_hash:
            entity_list_json_old_excluded = self.exclude_old_entity_compare_hashes(
                entity_list_json_incorrect_excluded)
            self.write_data(entity_list_json_old_excluded)
        else:
            self.write_data(entity_list_json_incorrect_excluded)
        if write_unsuccessful:
            self.write_unsuccessful_records_to_csv()
        if remember_with_hash:
            self.write_successful_entities_hashfile()
        print()

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
        print("\n")

    def add_update_rule(self, tablename, col_names):
        self.update_rules["tables"].append(
            {"name": tablename, "columns": col_names})

    def print_update_rules(self):
        print(json.dumps(self.update_rules, indent=4))

    def clear_update_rules(self):
        self.update_rules = {"tables": []}
