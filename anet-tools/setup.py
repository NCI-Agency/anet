import os
from setuptools import setup, find_packages

setup(name = "data_import_framework", version = os.environ["IMPORT_FRAMEWORK_VERSION"], packages = find_packages())
