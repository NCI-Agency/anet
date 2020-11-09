import os
import uuid
import json
import datetime
import pathlib
import pandas as pd
from pandas.util import hash_pandas_object
from sqlalchemy import and_
from src.core.db import db
from src.core.models import Person, Position, t_taskTaskedOrganizations, t_approvers, t_authorizationGroupPositions, t_positionRelationships, t_taskResponsiblePositions, t_peoplePositions
from src.core.data import txt
from sqlalchemy import exc

class anet_import(db):
    def __init__(self):
        super().__init__(use_env=True)
        self.path_root = "/".join(os.getcwd().split("/")[:4])
        self.path_log = os.path.join(self.path_root, "datasamples")
        self.path_hashfile = self.path_log
        self.update_rules = { "tables": [] }  
        
    def initialize_business_logic_json(self):
        self.business_logic_json = { "business_logic": [ 
                                                { "name": "UpdatePosition", "entity_list": []},
                                                { "name": "UpdatePerson", "entity_list": []},

                                                { "name": "InsertPosition", "entity_list": []},
                                                { "name": "InsertPerson", "entity_list": []},
                    
                                                { "name": "UpdatePositionUpdatePerson", "entity_list": []},
                                                { "name": "InsertPositionInsertPerson", "entity_list": []} ]}
    
    def initialize_successful_entity_t_list(self):
        self.successful_entity_t_list = list()
        
    def initialize_unsuccessful_entity_t_list(self):
        self.unsuccessful_entity_t_list = list()
    
    def append_successful_entity_t_list(self, entity_t):
        self.successful_entity_t_list.append(entity_t)

    def append_unsuccessful_entity_t_list(self, entity_t):
        self.unsuccessful_entity_t_list.append(entity_t)
        
    def import_table_objects(self):
        try:
            from src.core.models import t_taskTaskedOrganizations, t_approvers, t_authorizationGroupPositions, t_peoplePositions, t_positionRelationships, t_taskResponsiblePositions
        except:
            raise Exception("Some table entities missing in /src/core/models.py, Please regenerate it by using anet_import.generate_entity_classes()")
        
    def check_data_type(self, variable, name, datatype):
        if type(variable) is not datatype:
            print("'" + name + "'", "is ", type(variable), ", however, it must be " , datatype)
            return False
        else:
            return True
        
    def add_new_uuid(self, entity, relation="", both=False):
        if relation == "":
            entity.uuid = str(uuid.uuid4())
        else:
            if both:
                entity.uuid = str(uuid.uuid4())
            setattr(getattr(entity, relation), "uuid", str(uuid.uuid4()))
        return entity
    
    def query_with_rules(self, entity):
        query_result_list = list()
        for update_rule in self.update_rules["tables"]:
            if entity.__tablename__ == update_rule["name"]:
                query_result_list = self.session.query(entity.__class__).filter(and_(getattr(entity.__class__, attr_name) == getattr(entity, attr_name) for attr_name in tuple(update_rule["columns"]))).all()
                break
        return query_result_list

    def is_entity_update(self, entity):
        if self.update_rules == { "tables": [] }:
            return False
        else:
            query_result_list = self.query_with_rules(entity)
            if len(query_result_list) == 1:
                return True
            else:
                return False
    
    def is_entity_tablename(self, entity, tablename):
        if entity.__tablename__ == tablename:
            return True
        else:
            return False
    
    def has_entity_relation(self, entity, rel_attr):
        if hasattr(getattr(entity, rel_attr), '__tablename__'):
            return True
        else:
            return False
    
    def has_entity_uuid(self, entity):
        if getattr(entity, "uuid") == None:
            return False
        else:
            return True
    
    def add_entity_t_to_business_logic_json(self, entity_t, name):
        if name == "":
            return False
        for l in self.business_logic_json["business_logic"]:
            if l["name"] == name:
                l["entity_list"].append(entity_t)
                return True
        return False
       
    def fill_business_logic_json(self, entity_t_list):
        for entity_t in entity_t_list:
            name = ""
            entity = entity_t[0]
            # Check if entity is update entity
            if self.is_entity_update(entity):
                print("***entity " + entity.__tablename__ + " is update***")
                # Check tablename of update entity is positions
                if self.is_entity_tablename(entity, "positions"):
                    # Check position has person
                    if self.has_entity_relation(entity, "person"):
                        # Check person is update or insert
                        if self.is_entity_update(getattr(entity, "person")):
                            name = "UpdatePositionUpdatePerson"
                        else:
                            name = "UpdatePositionInsertPerson"
                    else:
                        name = "UpdatePosition"
                # Check tablename of update entity is people
                elif self.is_entity_tablename(entity, "people"):
                    name = "UpdatePerson"
            # Entity is insert
            else:
                print("***entity " + entity.__tablename__ + " is insert***")
                # Check tablename of insert entity is positions
                if self.is_entity_tablename(entity, "positions"):
                    # Check position has person
                    if self.has_entity_relation(entity, "person"):
                        # Check person is update or insert
                        if self.is_entity_update(getattr(entity, "person")):
                            name = "InsertPositionUpdatePerson"
                        else:
                            name = "InsertPositionInsertPerson"
                    else:
                        name = "InsertPosition"
                # Check tablename of insert entity is people
                elif self.is_entity_tablename(entity, "people"):
                    name = "InsertPerson"
            print("Rule name: ", name)
            add = self.add_entity_t_to_business_logic_json(entity_t, name)
            if add is False:
                entity_t[1]["exception_reason"] = "The business logic name has not yet been implemented. Table: " + entity.__tablename__ 
                self.append_unsuccessful_entity_t_list(entity_t)
    
    def sqlalc_exc(self, e, entity_t, from_relation_table):
        if from_relation_table:
            exc_reason = e
        else:
            exc_reason = str(type(e)) + "-->" + str(e.args)
        print(exc_reason)
        entity_t[1]["exception_reason"] = exc_reason
        self.append_unsuccessful_entity_t_list(entity_t)
        print("unsuccessfull: " + str(len(self.unsuccessful_entity_t_list)))
        #print(str(e))
        self.session.rollback()       
    
    def update_entity(self, entity):
        query_result_list = self.query_with_rules(entity)
        r = query_result_list[0]
        for attr, value in entity.__dict__.items():
            if attr != "_sa_instance_state":
                setattr(r, attr, value)
            self.session.flush()
    
    def has_position_associated_person(self, entity):
        query_result = self.query_with_rules(entity)[0]
        if query_result.currentPersonUuid == None:
            return False
        else:
            return True
    
    def has_person_associated_position(self, entity):
        # get person record as entity
        query_result = self.query_with_rules(entity)[0]
        pos_list = self.session.query(Position).filter(Position.currentPersonUuid == query_result.uuid).all()
        if len(pos_list) == 1:
            return True
        else:
            return False
    
    def get_update_entity_uuid(self, entity):
        query_result = self.query_with_rules(entity)[0]
        entity_uuid = query_result.uuid
        return entity_uuid
    
    # Deletes currentPersonUuid field of position record associated with person.
    def delete_associated_person_from_position(self, curr_person_uuid):
        #curr_person_uuid = self.get_update_entity_uuid(self, person_entity)
        self.session.query(Position).filter(Position.currentPersonUuid == curr_person_uuid).update({Position.currentPersonUuid : None})
    
    def get_uuid_of_position_associated_with_person(self, curr_person_uuid):
        uuid = self.session.query(Position).filter(Position.currentPersonUuid == curr_person_uuid).all()[0].uuid
        return uuid
    
    def get_uuid_of_person_associated_with_position(self, position_uuid):
        currentPersonUuid = self.session.query(Position).filter(Position.uuid == position_uuid).all()[0].currentPersonUuid
        return currentPersonUuid
        
    def write_data(self):
        for logic in self.business_logic_json["business_logic"]:
            if logic["name"] == "UpdatePerson" or logic["name"] == "UpdatePosition":
                #logic["entity_list"] = [(self.add_new_uuid(e[0]), e[1]) for e in logic["entity_list"]]                
                for entity_t in logic["entity_list"]:
                    try:
                        self.update_entity(entity_t[0])
                        self.session.commit()
                        self.append_successful_entity_t_list(entity_t)
                    except exc.SQLAlchemyError as e:
                        self.sqlalc_exc(e=e, entity_t=entity_t, from_relation_table=False)
                    except Exception as e:
                        self.sqlalc_exc(e=e, entity_t=entity_t, from_relation_table=True)
            elif logic["name"] == "UpdatePositionUpdatePerson":
                for entity_t in logic["entity_list"]:
                    try:
                        utc_now = datetime.datetime.utcnow()
                        person_uuid = self.get_update_entity_uuid(entity_t[0].person)
                        position_uuid = self.get_update_entity_uuid(entity_t[0])
                        if (not self.has_position_associated_person(entity_t[0]) and not self.has_person_associated_position(entity_t[0].person)):
                            print("case1")
                            # Position has no person and person has no position
                            entity_t[0].currentPersonUuid = person_uuid
                            entity_t[0].updatedAt = utc_now
                            self.update_entity(entity_t[0])
                            self.conn.execute(t_peoplePositions.insert().values(createdAt = utc_now, positionUuid = position_uuid))
                            self.conn.execute(t_peoplePositions.insert().values(createdAt = utc_now, person = person_uuid, positionUuid = position_uuid))  
                        elif (not self.has_position_associated_person(entity_t[0]) and self.has_person_associated_position(entity_t[0].person)):
                            print("case2")
                            # Position has no person and person has position
                            old_pos_uuid = self.get_uuid_of_position_associated_with_person(person_uuid)
                            self.delete_associated_person_from_position(person_uuid)
                            entity_t[0].currentPersonUuid = person_uuid
                            entity_t[0].updatedAt = utc_now
                            self.update_entity(entity_t[0])
                            # Update record peoplePositions table
                            self.conn.execute(t_peoplePositions.update().where(and_(t_peoplePositions.c.personUuid == person_uuid, t_peoplePositions.c.positionUuid == old_pos_uuid)).values(endedAt = utc_now))
                            # Insert records to peoplePositions table
                            self.conn.execute(t_peoplePositions.insert().values(createdAt = utc_now, positionUuid = old_pos_uuid ))
                            self.conn.execute(t_peoplePositions.insert().values(createdAt = utc_now, positionUuid = position_uuid ))
                            self.conn.execute(t_peoplePositions.insert().values(createdAt = utc_now, personUuid = person_uuid, positionUuid = position_uuid ))
                            self.session.commit()
                            self.append_successful_entity_t_list(entity_t)
                        elif (self.has_position_associated_person(entity_t[0]) and not self.has_person_associated_position(entity_t[0].person)):
                            print("case3")
                            # Position has person and person has no position
                            old_person_uuid = get_uuid_of_person_associated_with_position(position_uuid)
                            entity_t[0].currentPersonUuid = person_uuid
                            entity_t[0].updatedAt = utc_now()
                            self.update_entity(entity_t[0])
                            # Insert records to peoplePositions table
                            self.conn.execute(t_peoplePositions.insert().values(createdAt = utc_now, personUuid = old_person_uuid ))
                            self.conn.execute(t_peoplePositions.insert().values(createdAt = utc_now, positionUuid = position_uuid ))
                            self.conn.execute(t_peoplePositions.insert().values(createdAt = utc_now, personUuid = person_uuid, positionUuid = position_uuid ))                            
                        elif (self.has_position_associated_person(entity_t[0]) and self.has_person_associated_position(entity_t[0].person)):
                            print("case4")
                            # Position has person and person has position
                            old_pos_uuid = self.get_uuid_of_position_associated_with_person(person_uuid)
                            old_person_uuid = get_uuid_of_person_associated_with_position(position_uuid)
                            self.delete_associated_person_from_position(person_uuid)
                            entity_t[0].currentPersonUuid = person_uuid
                            entity_t[0].updatedAt = utc_now
                            self.update_entity(entity_t[0])
                            # Insert records to peoplePositions table
                            self.conn.execute(t_peoplePositions.update().where(and_(t_peoplePositions.c.personUuid == person_uuid, t_peoplePositions.c.positionUuid == old_pos_uuid)).values(endedAt = utc_now))
                            self.conn.execute(t_peoplePositions.update().where(and_(t_peoplePositions.c.personUuid == old_person_uuid, t_peoplePositions.c.positionUuid == position_uuid)).values(endedAt = utc_now))
                            self.conn.execute(t_peoplePositions.insert().values(createdAt = utc_now, personUuid = old_person_uuid ))
                            self.conn.execute(t_peoplePositions.insert().values(createdAt = utc_now, positionUuid = position_uuid ))
                            self.conn.execute(t_peoplePositions.insert().values(createdAt = utc_now, positionUuid = old_pos_uuid ))
                            self.conn.execute(t_peoplePositions.insert().values(createdAt = utc_now, personUuid = person_uuid, positionUuid = position_uuid ))
                    except exc.SQLAlchemyError as e:
                        self.sqlalc_exc(e=e, entity_t=entity_t, from_relation_table=False)
                    except Exception as e:
                        self.sqlalc_exc(e=e, entity_t=entity_t, from_relation_table=True)
            elif logic["name"] == "InsertPositionInsertPerson":
                # Add uuid to entities and relations
                logic["entity_list"] = [(self.add_new_uuid(e[0], relation="person", both=True), e[1]) for e in logic["entity_list"]]
                for entity_t in logic["entity_list"]:
                    try:
                        # Add entities to session to write people and position tables
                        self.session.add(entity_t[0])
                        self.session.flush()
                        self.session.commit()
                        # Write to peoplePosition table                
                        self.conn.execute(t_peoplePositions.insert().values(createdAt = datetime.datetime.utcnow(), personUuid = entity_t[0].person.uuid, positionUuid = entity_t[0].uuid))
                        self.append_successful_entity_t_list(entity_t)
                    except exc.SQLAlchemyError as e:
                        self.sqlalc_exc(e=e, entity_t=entity_t, from_relation_table=False)
                    except Exception as e:
                        self.sqlalc_exc(e=e, entity_t=entity_t, from_relation_table=True)
            elif logic["name"] == "InsertPosition":
                # Add uuid to entities
                logic["entity_list"] = [(self.add_new_uuid(e[0]), e[1]) for e in logic["entity_list"]]                
                for entity_t in logic["entity_list"]:
                    try:
                        # Add entities to session to write position table
                        self.session.add(entity_t[0])
                        self.session.flush()
                        self.session.commit()
                        self.append_successful_entity_t_list(entity_t)
                    except exc.SQLAlchemyError as e:
                        self.sqlalc_exc(e=e, entity_t=entity_t, from_relation_table=False)
                    except Exception as e:
                        self.sqlalc_exc(e=e, entity_t=entity_t, from_relation_table=True)
            elif logic["name"] == "InsertPerson":
                # Add uuid to entities
                logic["entity_list"] = [(self.add_new_uuid(e[0]), e[1]) for e in logic["entity_list"]]                
                # Add entities to session to write people table
                for entity_t in logic["entity_list"]:
                    try:                
                        self.session.add(entity_t[0])
                        self.session.flush()
                        self.session.commit()
                        # Write to peoplePosition table
                        self.conn.execute(t_peoplePositions.insert().values(createdAt = datetime.datetime.utcnow(), personUuid = entity_t[0].uuid))
                        self.append_successful_entity_t_list(entity_t)
                    except exc.SQLAlchemyError as e:
                        self.sqlalc_exc(e=e, entity_t=entity_t, from_relation_table=False)
                    except Exception as e:
                        self.sqlalc_exc(e=e, entity_t=entity_t, from_relation_table=True)
    
    def write_unsuccessful_records_to_csv(self):
        if len(self.unsuccessful_entity_t_list) == 0:
            print("all entities imported to db successfully")
        else:
            unsuccessful_entity_df = pd.DataFrame()
            for entity_t in self.unsuccessful_entity_t_list:
                unsuccessful_entity_df = pd.concat([unsuccessful_entity_df, pd.DataFrame(entity_t[1]).T])
            filename = "unsuccessful_" + str(datetime.datetime.now()).replace(" ", "_")
            fullpath = os.path.join(self.path_log, filename + ".csv")
            unsuccessful_entity_df.to_csv(fullpath)
            print("importing " + str(len(self.unsuccessful_entity_t_list)) + " entities unsuccessful. written to log file named: " + "/".join(fullpath.split("/")[4:]))
    
    def read_from_hashlist_file(self, fullpath_hashfile):
        try:
            hash_txt_obj = txt(fullpath_hashfile)
            hash_txt_obj.read_txt_file()
            #hash_txt_obj.content
            print("Reading hash list successfull")
            return hash_txt_obj
        except Exception as e:
            print("EXCEPTION WHILE UPDATING HASH LIST: ", str(e))    
    
    def write_hashlist_to_file(self, fullpath_hashfile):
        with open(fullpath_hashfile, "w") as h_f:
            h_f.write("\n".join(self.hash_list))
        print("Hash file updated with hash of successful entities")    
        
    def update_hash_list_from_file(self):
        fullpath_hashfile = os.path.join(self.path_hashfile, "hashvalues.txt")
        fullpath_hashfile
        hash_txt_obj = self.read_from_hashlist_file(fullpath_hashfile)
        #print("hash_txt_obj.content", hash_txt_obj.content)
        self.hash_list = [h.replace(",", "").replace("\n", "") for h in hash_txt_obj.content]
        #print("self.hash_list", self.hash_list)
        print("Hash list updated")
            
    def exclude_old_entity_compare_hashes(self, entity_t_list):
        self.update_hash_list_from_file()
        entity_t_list_old_excluded = list()
        count_old_record = 0
        for e_t in entity_t_list:
            if str(hash_pandas_object(e_t[1]).sum()) not in self.hash_list:
                entity_t_list_old_excluded.append(e_t)
            else:
                count_old_record = count_old_record + 1
        if count_old_record != 0:
            print(str(count_old_record), " entity will not be processed again since they were processed in the past!")
        else:
            print("No entity excluded, all entities are new.")
        return entity_t_list_old_excluded
    
    def write_successful_entities_hashfile(self):
        # This line could be removed in future
        self.update_hash_list_from_file()
        for e_t in self.successful_entity_t_list:
            self.hash_list.append(str(hash_pandas_object(e_t[1]).sum()))
        fullpath_hashfile = os.path.join(self.path_hashfile, "hashvalues.txt")
        self.write_hashlist_to_file(fullpath_hashfile)
        
    def save_data(self, entity_t_list):
        self.connect()
        self.initialize_successful_entity_t_list()
        self.initialize_unsuccessful_entity_t_list()
        self.initialize_business_logic_json()
        entity_t_list_old_excluded = self.exclude_old_entity_compare_hashes(entity_t_list)
        self.fill_business_logic_json(entity_t_list_old_excluded)
        #print(self.business_logic_json)
        self.write_data()
        self.write_unsuccessful_records_to_csv()
        self.write_successful_entities_hashfile()
        
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