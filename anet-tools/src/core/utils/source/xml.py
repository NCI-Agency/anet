from xml.etree import ElementTree


class xml:
    """ Read and parse xml file """
    def __init__(self, file_path):
        self.file_path = file_path
        # Extension of file
        self.file_extension = file_path.split(".")[-1]

    def read_xml_file(self):
        if self.file_extension != "xml":
            raise Exception("File extension should be 'xml'")
        # read .xml file
        self.ElementTree = ElementTree.parse(self.file_path)