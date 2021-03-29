class txt:
    """ Read from txt with readlines method
    """     
    def __init__(self, file_path):
        self.file_path = file_path
        # Extension of file
        self.file_extension = file_path.split(".")[-1]

    def read_txt_file(self):
        if self.file_extension != "txt":
            raise Exception("File extension should be 'txt'")
        # read .txt file
        with open(self.file_path, "r") as f:
            self.content = f.readlines()