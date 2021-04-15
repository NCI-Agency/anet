from src.core.api.anet_import import anet_import
from src.core.model.annotated.anet import Reports, People
from src.core.model.annotated.association import ReportPeople

# Example conn json for ANET
conn_json = {
    "DB_DRIVER": "<DB_DRIVER>",
    "DB_USERNAME": "<DB_USERNAME>",
    "DB_PASSWORD": "<DB_PASSWORD>",
    "DB_SERVER": "<DB_SERVER>",
    "DB_PORT": "<DB_PORT>",
    "DB_NAME": "<DB_NAME>",
}
# Create new anet_import object with connection json.
anet_import_obj = anet_import(use_env=False, conn_json=conn_json, hash_path="./", log_path="/")

# Create object list
obj_list = list()

# Generate objects
report = Reports(intent="new report", state=0)
person = People(name="BOBTOWN, Bob", emailAddress="bobs_new_email_address@example.com", role=0)

report.people.append(ReportPeople(person=person, isAttendee=True))

# Add update rule method
anet_import_obj.add_update_rule(tablename="people", col_names=["name"])

# Append your object to list
obj_list.append(report)

# Start import process
anet_import_obj.start_import(obj_list, remember_hash=True, log=True)
