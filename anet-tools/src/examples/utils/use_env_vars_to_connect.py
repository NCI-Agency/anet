from src.core.api.anet_import import anet_import
from src.core.model.annotated.anet import Locations

# Create new anet_import object with env vars only in dev environment.
anet_import_obj = anet_import(use_env=True, conn_json={}, hash_path="./", log_path="/")

# Create object list
obj_list = list()

# Generate new location object
location = Locations(name="new location", status=0)

# Append your object to list
obj_list.append(location)

# Start import process
anet_import_obj.start_import(obj_list, remember_hash=True, log=True)
