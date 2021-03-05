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