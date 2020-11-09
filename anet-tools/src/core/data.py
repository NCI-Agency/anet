import pandas as pd
from xml.etree import ElementTree
import numpy as np

class data():
    def __init__(self, file_path):
        # Full path of file
        self.file_path = file_path

class csv(data):
    def __init__(self, file_path = "",):
        super().__init__(file_path)
        # Extension of file
        self.file_extension = file_path.split(".")[-1]
        print("csv object created\n")
    def read_csv_file(self):
        try:
            if self.file_extension != "csv":
                raise Exception("File extension must be 'csv'")
            # read .csv file and generate pandas dataframe object
            self.df = pd.read_csv(filepath_or_buffer=self.file_path)
        except Exception as e:
            print("EXCEPTION: ", str(e))
    def convert_nan_to_empty_string(self):
        self.df.replace(np.nan, '', regex = True, inplace = True)
    
class xlsx(data):
    def __init__(self, file_path):
        super().__init__(file_path)
        # Extension of file
        self.file_extension = file_path.split(".")[-1]

    def read_xlsx_file(self, sheet_name):
        try:
            if self.file_extension != "xlsx":
                raise Exception("File extension should be 'xlsx'")
            if sheet_name == "all":
                df_dict = pd.read_excel(self.file_path, sheet_name=None)
                self.df_dict = df_dict
            else:
                df = pd.read_excel(self.file_path, sheet_name=sheet_name)
                self.df = df
        except Exception as e:
            print("EXCEPTION: ", str(e))

class xml(data):
    def __init__(self, file_path):
        super().__init__(file_path)
        # Extension of file
        self.file_extension = file_path.split(".")[-1]
    def read_xml_file(self):
        if self.file_extension != "xml":
            raise Exception("File extension should be 'xml'")
        # read .xml file
        self.ElementTree  = ElementTree.parse(self.file_path)

class txt(data):
    def __init__(self, file_path):
        super().__init__(file_path)
        # Extension of file
        self.file_extension = file_path.split(".")[-1]
    def read_txt_file(self):
        if self.file_extension != "txt":
            raise Exception("File extension should be 'txt'")
        # read .txt file
        with open(self.file_path, "w+") as f:
            self.content = f.readlines()