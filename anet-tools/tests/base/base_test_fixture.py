import datetime

from sqlalchemy.orm import sessionmaker
import unittest

from src.core.database.db import db
from src.core.model.annotated.anet import People, Positions, Locations, Organizations, Reports
from src.core.model.annotated.association import PeoplePositions, ReportPeople

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
        # get utc_now
        self.utc_now = datetime.datetime.now()
        # initialize update rules
        self.update_rules = {"tables": []}
        # Set entity classes as class attribute and set the same session to all by BaseModel
        self.PeoplePositions = PeoplePositions
        self.ReportPeople = ReportPeople
        self.Position = Positions
        self.Person = People
        self.Location = Locations
        self.Organization = Organizations
        self.Report = Reports

    # tearDown method will work after each test method
    def tearDown(self):
        self.session.close()
        # rollback - everything that happened with the
        # Session above (including calls to commit())
        # is rolled back.
        self.trans.rollback()
        # return connection to the Engine
        self.connection.close()
