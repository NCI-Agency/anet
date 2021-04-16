import datetime
import json
import os

import pandas as pd

from src.core.database.db import db


class anet_import(db):
    """ User interface of import framework.
    """

    def __init__(self, hash_path, log_path, use_env=False, conn_json={}):
        super().__init__(use_env=use_env, conn_json=conn_json)
        self.log_path = log_path
        self.hash_full_path = os.path.join(hash_path, "hashvalues.txt")
        self.update_rules = {"tables": []}
        self.utc_now = datetime.datetime.now()
        self.utc_now_str = str(self.utc_now).replace("-", "_").replace(" ", "_")

    def import_objects(self):
        if len(self.new_objects) == 0:
            print("There is not any entity to import!")
        else:
            for ind, obj in enumerate(self.new_objects):
                obj_c = obj.get_fresh_one()
                try:
                    self.session.begin_nested()
                    obj.import_entity(self.utc_now, self.update_rules, self.session)
                    self.session.commit()
                    self.imported_objects.append(obj_c)
                except Exception as e:
                    self.session.rollback()
                    obj_c.exc_reason = e
                    self.not_imported_objects.append(obj_c)
                if ind % 10 == 0:
                    print(f"Import {ind}/{len(self.new_objects)} passed", end="\r")
            self.session.commit()
            print(f"Import {len(self.new_objects)}/{len(self.new_objects)} passed")
            print(f"Import is complete!")

    def add_update_rule(self, tablename, col_names):
        self.update_rules["tables"].append({"name": tablename, "columns": col_names})

    def print_update_rules(self):
        print(json.dumps(self.update_rules, indent=4))

    def clear_update_rules(self):
        self.update_rules = {"tables": []}

    def generate_new_hash_file(self):
        # If hashfile does not exists, generate new one
        if not os.path.isfile(self.hash_full_path):
            with open(self.hash_full_path, "w+") as t:
                pass

    def read_hash(self):
        self.generate_new_hash_file()
        with open(self.hash_full_path, "r") as hash_file:
            hash_values = hash_file.read()
        self.hash_list = hash_values.split(", ")
        print("Read hashes from file!")

    def remember_with_hash(self):
        if not self.remember_hash:
            self.new_objects = self.objects_from_user
        else:
            self.read_hash()
            hashes = self.hashes_from_obj_list(self.objects_from_user)
            for index, value in hashes.items():
                if str(value) in self.hash_list:
                    self.previous_objects.append(self.objects_from_user[index])
                else:
                    self.new_objects.append(self.objects_from_user[index])

    def update_parameters(self, **kwargs):
        # Update api parameters comes from user
        for key, value in kwargs.items():
            setattr(self, key, value)
        # Update internal api parameters
        setattr(self, "imported_objects", list())
        setattr(self, "not_imported_objects", list())
        setattr(self, "previous_objects", list())
        setattr(self, "new_objects", list())

    def write_objects_to_csv(self, obj_list, name):
        if obj_list:
            pd.DataFrame([vars(obj) for obj in obj_list]).drop(columns=["_sa_instance_state"], errors="ignore").to_csv(
                os.path.join(self.log_path, name + self.utc_now_str + ".csv")
            )

    def log_result(self):
        if self.log:
            self.write_objects_to_csv(self.imported_objects, "imported")
            self.write_objects_to_csv(self.not_imported_objects, "not_imported")
            self.write_objects_to_csv(self.previous_objects, "previous")
            print()
            print(f"Imported: {len(self.imported_objects)}")
            print(f"Not_imported: {len(self.not_imported_objects)}")
            print(f"Previous: {len(self.previous_objects)}")

    def hashes_from_obj_list(self, obj_list):
        if obj_list:
            list_of_drop_cols = [
                "_sa_instance_state",
                "person",
                "people",
                "organization",
                "location",
                "organization1",
                "positions",
                "reports",
                "parent",
                "uuid"
            ]
            models_df = pd.DataFrame([vars(obj) for obj in obj_list]).drop(columns=list_of_drop_cols, errors="ignore")
            hashes = pd.util.hash_pandas_object(models_df, index=False)
            return hashes

    def write_hash(self):
        if self.imported_objects and self.remember_hash:
            hashes = self.hashes_from_obj_list(self.imported_objects)
            for index, value in hashes.items():
                self.hash_list.append(str(value))
            with open(self.hash_full_path, "w") as output:
                output.write(", ".join(self.hash_list))

    def check_parameters(self):
        if not self.objects_from_user:
            raise Exception("There is no object to import!")

    def start_import(self, objects, remember_hash=False, log=True):
        # Framework is started
        print("\n*** DATA IMPORT AND MANIPULATION FRAMEWORK ***\n")
        # Update api parameters
        self.update_parameters(objects_from_user=objects, remember_hash=remember_hash, log=log)
        self.check_parameters()
        # Exclude previously processed models
        self.remember_with_hash()
        # Connect to db and initializa a session
        self.connect()
        # Import objects
        self.import_objects()
        # Write hash of imported ones
        self.write_hash()
        # Export result as log files
        self.log_result()
