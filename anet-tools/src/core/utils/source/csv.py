import pandas as pd
import numpy as np


class csv:
    """ Read and parse csv file to pandas dataframe
    """

    def __init__(self, file_path):
        self.file_path = file_path
        # Extension of file
        self.file_extension = file_path.split(".")[-1]
        print("csv object created")

    def read_csv_file(self):
        try:
            if self.file_extension != "csv":
                raise Exception("File extension must be 'csv'")
            # read .csv file and generate pandas dataframe object
            self.df = pd.read_csv(filepath_or_buffer=self.file_path)
        except Exception as e:
            print(f"EXCEPTION: {str(e)}")

    def convert_nan_to_empty_string(self):
        self.df.replace(np.nan, "", regex=True, inplace=True)
