from src.core.api.anet_import import anet_import
from src.core.utils.source.csv import csv
from src.core.model.annotated.anet import People


# Define full path of csv file
csv_full_path = "/home/jovyan/work/datasamples/anet_import_sample_data.csv"

# Create csv object
csv_obj = csv(csv_full_path)

# Read csv file
csv_obj.read_csv_file()

# Create new anet_import object with env vars only in dev environment.
anet_import = anet_import(use_env=True,
                            conn_json={}, 
                            hash_path="/home/jovyan/work/datasamples/", 
                            log_path="/home/jovyan/work/datasamples/")

# Create entity_list object
obj_list = list()
anet_import.print_db_connection_string()
# Loop through dataframe
for index, row in csv_obj.df.iterrows():
    # Write your rules to check if record is valid or not
    if row["employee name"] == "Thiel":
        continue

    # Create and fill entity object.
    person = People()
    person.name = row["employee name"]
    person.rank = row["tashkil rank"]
    person.role = 1

    # Append object to list
    obj_list.append(person)

# Print update rule object
anet_import.print_update_rules()

# Add update rule method
anet_import.add_update_rule(tablename="people", col_names=["name"])

# Print update rule object to check difference
anet_import.print_update_rules()

# You can reset update rules
# anet_import.clear_update_rules()

# Start import
anet_import.start_import(obj_list, remember_hash = True, log = True)