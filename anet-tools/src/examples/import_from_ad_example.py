from src.core.ad import ad

# Generate ldap config json
ldap_config =  {
    "LDAP_SERVER" : "<LDAP_SERVER>",
    "BASE_DN" : "<BASE_DN>",  # base dn to search in
    "LDAP_LOGIN" : "<LDAP_LOGIN>",
    "LDAP_PASSWORD" : "<LDAP_PASSWORD>"
}

# Generate ldap object
ldap_obj = ad(ldap_config)
ldap_obj.connect()

# Define filter
search_filter = "objectCategory=Person"
search_attribute = ["mail", "sAMAccountName", "displayName"]

# Search in ad
ldap_obj.search(search_filter, search_attribute)

# loop through dictionary and print values
for i in ldap_obj.data_list:
    rawDict = i[1]
    data = {k: v[0] for k, v in rawDict.items()}
    if all(key in data for key in ('mail', 'displayName', 'sAMAccountName')):
        print(data)