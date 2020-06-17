import ast
import ldap

# LDAP_SERVER = 'ldap://<<serverurl>>:<<port>>'
# BASE_DN = 'dc=<<companyname>>,dc=com,dc=tr'  # base dn to search in
# LDAP_LOGIN = '<<ldapuser>>'
# LDAP_PASSWORD = '<<password>>'
# SEARCHFILTER = "objectCategory=Person"
# # Below searchattribute list can be customized according to your needs
# # All attributes list (See Ldap-Display-Name) : https://docs.microsoft.com/en-us/windows/win32/adschema/attributes-all
# SEARCHATTRIBUTE = ["mail", "sAMAccountName", "displayName"]
# connect = ldap.initialize(LDAP_SERVER)
# connect.set_option(ldap.OPT_REFERRALS, 0)  # to search the object and all its descendants
# connect.simple_bind_s(LDAP_LOGIN, LDAP_PASSWORD)
# result = connect.search_s(BASE_DN, ldap.SCOPE_SUBTREE, SEARCHFILTER, SEARCHATTRIBUTE)

# ldap response sample
f = open("ldap-response-sample.txt", "r")
result = f.read()

dictionary = ast.literal_eval(str(result))  # Convert data into dictionary format
for i in dictionary:
    rawDict = i[1]
    data = {k: v[0] for k, v in rawDict.iteritems()}
    if all(key in data for key in ('mail', 'displayName', 'sAMAccountName')):
        print data
