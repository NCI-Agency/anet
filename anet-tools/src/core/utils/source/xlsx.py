import pandas as pd


class xlsx:
    """ Read and parse xlsx file to pandas dataframe
    by specifying sheet name
    """

    def __init__(self, file_path):
        self.file_path = file_path
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
            print(f"EXCEPTION: {str(e)}")
