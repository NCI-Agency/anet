import pandas as pd

from src.core.database.db import db


class db_dataframe(db):
    """ Read table from database as pandas dataframe object
    """
    def __init__(self, use_env, conn_json):
        super().__init__(use_env=use_env, conn_json=conn_json)

    def read_table(self, table_name):
        self.connect()
        attr_name = table_name.lower().replace(" ", "").replace("-", "_")
        setattr(self, attr_name, pd.read_sql_table(table_name, con=self.engine))
        print(f"table {table_name} imported to <obj.{attr_name}>")
