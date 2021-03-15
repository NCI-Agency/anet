import os


class helper_methods:

    @staticmethod
    def generate_custom_field(configuration_list_json, row):
        # configuration_list_json template
        # configuration_list_json = [
        #   {
        #       "source_field_name" : source_field_name,
        #       "target_field_name" : target_field_name,
        #       "data_type"         : data_type_str,
        #   }, 
        #   .
        #   .
        #   .
        #   {
        #       "source_field_name" : source_field_name,
        #       "target_field_name" : target_field_name,
        #       "data_type"         : data_type_str,
        #   }
        # ]
        custom_field = {}
        for configuration in configuration_list_json:
            if not type(row[configuration["source_field_name"]]) is configuration["data_type"]:
                raise Exception("Datatype exception while generating customField with configuration -> ", configuration)
            custom_field[configuration["target_field_name"]] = row[configuration["source_field_name"]]
        custom_field_str = str(custom_field).replace("'", "\"")
        return custom_field_str
    
    @staticmethod
    def generate_conn_str(use_env=True, conn_json={}):
        if not use_env and conn_json == {}:
            raise Exception("Connection json is empty")
        if conn_json != {}:
            use_env = False
        source = os.environ if use_env else conn_json
        db_driver = ("mssql+pyodbc" if source["DB_DRIVER"] == "sqlserver"
                                    else source["DB_DRIVER"])
        if use_env:
            db_server = (source["LOCAL_IP"] if source["ANET_DB_SERVER"] == "localhost"
                                            else source["ANET_DB_SERVER"])
            db_username = source["ANET_DB_USERNAME"]
            db_password = source["ANET_DB_PASSWORD"]
            db_exposed_port = source["ANET_DB_EXPOSED_PORT"]
            db_name = source["ANET_DB_NAME"]
        else:
            db_server = source["DB_SERVER"]
            db_username = source["DB_USERNAME"]
            db_password = source["DB_PASSWORD"]
            db_exposed_port = source["DB_PORT"]
            db_name = source["DB_NAME"]
        
        db_conn_str = f"{db_driver}://{db_username}:{db_password}@{db_server}:{db_exposed_port}/{db_name}"

        if db_driver == "mssql+pyodbc":
            db_conn_str += "?driver=ODBC+Driver+17+for+SQL+Server"
        
        return db_conn_str
    
    @staticmethod
    def update_anet_models(tables, conn_str):
        path = "/home/jovyan/work/src/core/models.py"
        generate_command = "sqlacodegen " + conn_str + " --outfile " + path
        if len(tables) != 0:
            generate_command += " --tables " + "'" + ",".join(tables) + "'"
        try:
            print(generate_command)
            os.system(generate_command)
            print("Entity classes generated inside " + path)
        except Exception as e:
            print("EXCEPTION WHILE GENERATING ENTITY CLASSES: ", str(e))