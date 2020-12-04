import time
import uuid
import datetime
import unittest
from src.core.db import db
from sqlalchemy.orm import sessionmaker
from src.examples.models import PeoplePositions, Position, Person, Location, Organization, BaseModel

# new db instance to get new engine using env vars
db_obj = db(use_env=True)
db_obj.create_engine()
Session = sessionmaker()

class BaseTestFixture(unittest.TestCase):
    # setUp method will work before each test method
    def setUp(self):
        # connect to the database
        self.connection = db_obj.engine.connect()
        # begin a non-ORM transaction
        self.trans = self.connection.begin()
        # bind an individual Session to the connection
        self.session = Session(bind=self.connection)
        # get new uuid
        self.new_uuid = str(uuid.uuid4())
        # get utc_now
        self.utc_now = datetime.datetime.now()        
        # initialize update rules
        self.update_rules = { "tables": [] }
        # Set entity classes as class attribute and set the same session to all by BaseModel
        self.PeoplePositions = PeoplePositions
        self.Position = Position
        self.Person = Person
        self.Location = Location
        self.Organization = Organization
        self.BaseModel = BaseModel
        self.BaseModel.set_session(self.session)
    # tearDown method will work after each test method
    def tearDown(self):
        self.session.close()
        # rollback - everything that happened with the
        # Session above (including calls to commit())
        # is rolled back.
        self.trans.rollback()
        # return connection to the Engine
        self.connection.close()