import ast

import ldap


class ad:
    """ Read data from active directory
    """
    def __init__(self, ldap_config_json):
        self.ldap_config_json = ldap_config_json
        print("Active directory object is created")

    def connect(self):
        try:
            self.conn = ldap.initialize(self.ldap_config_json["LDAP_SERVER"])
            # to search the object and all its descendants
            self.conn.set_option(ldap.OPT_REFERRALS, 0)
            self.conn.simple_bind_s(self.ldap_config_json["LDAP_LOGIN"], self.ldap_config_json["LDAP_PASSWORD"])
            print("Successfully connected to active directory")
        except Exception as e:
            print("EXCEPTION: ", str(e))

    def search(self, search_filter, search_attribute):
        # ldap response sample
        result = self.conn.search_s(self.ldap_config_json["BASE_DN"], ldap.SCOPE_SUBTREE, search_filter, search_attribute)  
        self.data_list = ast.literal_eval(str(result))