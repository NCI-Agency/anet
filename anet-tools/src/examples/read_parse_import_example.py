from src.core.anet_import import anet_import
from src.core.data import csv
from src.examples.models import Person


# Define full path of csv file
csv_full_path = "/home/jovyan/work/datasamples/anet_import_data.csv"

# Create csv object
csv_obj = csv(csv_full_path)

# Read csv file
csv_obj.read_csv_file()

# Create new anet_import object with env vars only in dev environment.
anet_import = anet_import(use_env=True, conn_json={
}, hashfile_fullpath="/home/jovyan/work/datasamples/", logfile_fullpath="/home/jovyan/work/datasamples/")
# You could also use your own connection json instead of env var in both dev and prod environments.
# Example conn_json objects
# POSTGRES
#     conn_json = {
#         "DB_DRIVER":"postgresql",
#         "DB_USERNAME":"anetDevUser",
#         "DB_PASSWORD":"Dev-P@ssw0rd",
#         "DB_SERVER":"<ip_address>",
#         "DB_PORT":"5432",
#         "DB_NAME":"devAnet",
#     }

# MSSQL
#     conn_json = {
#         "DB_DRIVER":"mssql+pyodbc",
#         "DB_USERNAME":"sa",
#         "DB_PASSWORD":"<your_db_password>",
#         "DB_SERVER":"<ip_address>",
#         "DB_PORT":"1433",
#         "DB_NAME":"master",
#         "DRIVER":"driver=ODBC+Driver+17+for+SQL+Server"
#     }
# anet_import = anet_import(use_env = False, conn_json = conn_json, hashfile_fullpath = "./", logfile_fullpath = "./")

# Create entity_list object
entity_json_list = list()
anet_import.print_db_connection_string()
# Loop through dataframe
for index, row in csv_obj.df.iterrows():
    # Write your rules to check if record is valid or not
    if row["employee name"] == "Thiel":
        continue

    # Create and fill entity objects with correct record.
    person = Person()
    person.name = row["employee name"]
    person.rank = row["tashkil rank"]
    person.role = 1

    # In the way above only transactions will be performed with people tables

    # In such a case like importing person and position and associating with them framework acts as follows.
    # Firstly, if the person will be updated, the former position relation of the person is deleted
    # likewise, if the position will be updated, the former person relation of the position is deleted
    # Finally, the position and person you sent are associated
    # with each other (by using currentPersonUuid field and peoplePositions table) and imported to the database
    # If you want do such a case explained above, you need to write something like below Example 1
    # There are two ways for the import framework to consider an entity as an update.
    # In example below we use add_update_rule method.
    # For more information on this topic, please review the readme file in anet-tools folder.
    # (*) update_rules should be outside of loop and logic of add_update_rule method is explained below

    # Example 1
    # position = Position(name = "EF 2.1 Advisor B", type = 0, status = 0)
    # person = Person(name = "HENDERSON, Henry", role = 1)
    # position.person = person
    # entity_json_list.append({"entity": position, "row": row})
    # (*) anet_import.add_update_rule(tablename="positions", col_names=["name"])
    # (*) anet_import.add_update_rule(tablename="people", col_names=["name"])

    # Similarly if you want to import person and location both formerly associated with
    # position, you need to write something like below Example 2
    # (*) update_rules should be outside of loop and logic of add_update_rule method is explained below

    # Example 2
    # position = Position(name = "EF 2.1 Advisor B", type = 0, status = 0)
    # person = Person(name = "HENDERSON, Henry", role = 1)
    # location = Location(name = "Wishingwells Park", status = 1)
    # position.person = person
    # position.location = location
    # (*) anet_import.add_update_rule(tablename="positions", col_names=["name"])
    # (*) anet_import.add_update_rule(tablename="people", col_names=["name"])
    # (*) anet_import.add_update_rule(tablename="locations", col_names=["name"])
    # entity_json_list.append({"entity": position, "row": row})

    # You have to provide row of pandas dataframe which you use to fill entities
    # otherwise entity will not be imported
    entity_json_list.append({"entity": person, "row": row})

# Print update rule object
anet_import.print_update_rules()

# Add update rule method
# This method adds an update rule each time it is called.
# Multiple update rules can be added for multiple columns of many tables.
# The tablename property determines for which table the update rule will be added.
# The col_names property determines which columns of the specified table will be checked for updating.
# For example, when tablename = people and col_name = ["name"],
# a query is sent according to the name column in the people table in the database for each entity object,
# and if a record returns, that entity is considered as update,
# if no record is returned, entity is considered as insert.
anet_import.add_update_rule(tablename="people", col_names=["name"])

# Print update rule object to check difference
anet_import.print_update_rules()

# Clear update rule object
# anet_import.clear_update_rules()

# Write to DB
# verbose is True default but setting it False causes see less log
anet_import.save_data(entity_json_list, verbose=False,
                      remember_with_hash=True, write_unsuccessful=True)
