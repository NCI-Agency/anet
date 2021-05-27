from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from src.core.utils.helper.method import helper_methods


class db:
    """ This class allows to connect db using sqlalchemy for framework development
    """

    def __init__(self, use_env=False, conn_json={}):
        self.dbConnString = helper_methods.generate_conn_str(use_env=use_env, conn_json=conn_json)
        print("DB object created")

    def print_db_connection_string(self):
        print(self.dbConnString)

    def create_engine(self):
        self.engine = create_engine(self.dbConnString)

    def connect(self):
        self.create_engine()
        self.session = Session(self.engine)
        self.conn = self.engine.connect()
        print(f"Successfully connected to the database with conn_str: {self.dbConnString}")
