from src.core.db import db
import datetime
import uuid


# Create new db object
db_obj = db()

# Connect to db by using env vars.
db_obj.connect()

# Entity object of people table
People = db_obj.Base.classes.people

# Entity object of positions table 
Positions = db_obj.Base.classes.positions

# Entity object of peoplePositions table. It is mapped without Base.classes since peoplePositions table has no PK.
PeoplePositions = db_obj.PeoplePositions

# Generate dummy data for people and positions table
i = 1
person_name = "person_name_"+str(i)
person_emailAddress = "person_emailAddress_"+str(i)
person_uuid = str(uuid.uuid4())
position_name = "position_name_"+str(i)
position_uuid = str(uuid.uuid4())

# Insert row to people and positions table
db_obj.session.add(Positions(name = position_name, type = 1, uuid = position_uuid, people = People(name = person_name, role = 1, emailAddress = person_emailAddress, uuid = person_uuid)))
db_obj.session.commit()
print("Insertion to people and position tables successful")

# dummy datetime data that will be inserted peoplePositions table
utc_now = datetime.datetime.utcnow()

# Insert into peoplePositions table
ins = PeoplePositions.insert().values(createdAt=utc_now, personUuid = person_uuid, positionUuid = position_uuid, endedAt=utc_now)
db_obj.conn.execute(ins)
print("Insertion to peoplePositions table successful")
