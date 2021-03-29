from src.core.utils.source.ad import ad

# Define your ldap config json
ldap_config = {
    "LDAP_SERVER": "<LDAP_SERVER>",
    "BASE_DN": "<BASE_DN>",
    "LDAP_LOGIN": "<LDAP_LOGIN>",
    "LDAP_PASSWORD": "<LDAP_PASSWORD>"
}
ldap_obj = ad(ldap_config)
ldap_obj.connect()

search_filter = "objectCategory=Person"
search_attribute = ["mail", "sAMAccountName", "displayName"]
ldap_obj.search(search_filter, search_attribute)

# LOOP THROUGH THE DICTIONARY AND PRINT VALUES
for i in ldap_obj.data_list:
    rawDict = i[1]
    data = {k: v[0] for k, v in rawDict.items()}
    if all(key in data for key in ('mail', 'displayName', 'sAMAccountName')):
        print(data)
