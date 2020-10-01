from src.core.data import xlsx

# Define full path of xlsx file
xlsx_full_path = "../../datasamples/people.xlsx"

# Create xlsx object
xlsx_obj = xlsx(xlsx_full_path)

# Read xlsx file with specified excel spreadsheet.
xlsx_obj.read_xlsx_file(sheet_name="second_sheet")

# Dataframe object is xlsx_obj.df

# If you want to read all excel spreadsheet
# xlsx_obj.read_xlsx_file(sheet_name="all")
# xlsx_obj.df["first_sheet"]
# xlsx_obj.df["second_sheet"]