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

# Loop through dataframe, generate list of entity objects
entity_list = list()

for index, row in csv_obj.df.iterrows():
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

# Write to DB
anet_import.save_new_data(entity_list)