from src.core.api.anet_import import anet_import
from src.core.model.annotated.anet import People
from src.core.model.annotated.enums.enums import person_status

# Create new anet_import object with env vars only in dev environment.
anet_import_obj = anet_import(use_env=True, conn_json={}, hash_path="./", log_path="/")

# Create object list
obj_list = list()

# Create and fill entity object.
person = People()
person.name = "new name"
# Set status using enum
person.status = person_status.ACTIVE

# Append your object to list
obj_list.append(person)

# Start import process
anet_import_obj.start_import(obj_list, remember_hash=True, log=True)
