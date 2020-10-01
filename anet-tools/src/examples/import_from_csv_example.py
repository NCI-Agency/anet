from src.core.data import csv

# Define full path of csv file
csv_full_path = "../../datasamples/anet_import_data.csv"

# Create csv object
csv_obj = csv(csv_full_path)

# Read csv file
csv_obj.read_csv_file()

# Dataframe object is csv_obj.df