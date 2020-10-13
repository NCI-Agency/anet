from src.core.data import csv

# Define full path of csv file
csv_full_path = "../../datasamples/anet_import_data.csv"

# Create csv object
csv_obj = csv(csv_full_path)

# Read csv file
csv_obj.read_csv_file()

import uuid
from src.core.anet_import import anet_import

# Create new db object
anet_import = anet_import()

# Update entity classes in models.py file
anet_import.generate_entity_classes(tables=["people","positions","peoplePositions", "tasks", "organizations", "taskTaskedOrganizations"], name="models")

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
    person.uuid = str(uuid.uuid4())
    person.role = 1
    
    position = Position() 
    position.name = "position of " + row["employee name"]
    position.uuid = str(uuid.uuid4())
    position.type = 1
    position.status = 1
    
    position.person = person
    
    entity_list.append(position)

# Save log files
anet_import.save_log(list_row = correct_records, log_file_name = "correct_records")
anet_import.save_log(list_row = erroneous_records, log_file_name = "erroneous_records")

# Write to DB
anet_import.save_new_data(entity_list)