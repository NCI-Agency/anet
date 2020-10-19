from src.core.data import csv

# Define full path of csv file
csv_full_path = "../../datasamples/anet_import_data.csv"

# Create csv object
csv_obj = csv(csv_full_path)

# Read csv file
csv_obj.read_csv_file()

# Import libraries
import uuid
from src.core.anet_import import anet_import

# Create new db object
anet_import = anet_import()

# Update entity classes in models.py file
anet_import.generate_entity_classes(tables=["people","positions","peoplePositions", "tasks", "organizations", "taskTaskedOrganizations"], filename="models")

# Import Entity Classes
from src.core.models import Person, Position

# Create a list of erroneous and correct records object
erroneous_records, correct_records = list(), list()

# Create entity_list object
entity_list = list()

# Loop through dataframe
for index, row in csv_obj.df.iterrows():
    # Write your rules to check if record is valid or not
    if row["employee name"] == "Thiel":
        # Append erroneous record to erroneous_records list.
        erroneous_records.append(row)
        continue

    # Append correct record to correct_records list.
    correct_records.append(row)
    
    # Create and fill entity objects with correct record.
    person = Person()
    person.name = row["employee name"]
    person.rank = row["tashkil rank"]
    person.role = 1

    entity_list.append(person)

# Save log files
anet_import.save_log(list_row = correct_records, log_file_name = "correct_records")
anet_import.save_log(list_row = erroneous_records, log_file_name = "erroneous_records")

# Print update rule object
anet_import.print_update_rules()

# Add update rule method
# This method adds an update rule each time it is called.
# Multiple update rules can be added for multiple columns of many tables.
# The tablename property determines for which table the update rule will be added.
# The col_names property determines which columns of the specified table will be checked for updating. 
# For example, when tablename = people and col_name = ["name"], 
# a query is sent according to the name column in the people table in the database for each entity object,
# and if a record comes, that record is updated, if no record is returned, entity is inserted as new record.
anet_import.add_update_rule(tablename="people", col_names=["name"])

# Print update rule object to check difference
anet_import.print_update_rules()

# Clear update rule object
#anet_import.clear_update_rules()

# Write to DB
anet_import.save_data(entity_list)