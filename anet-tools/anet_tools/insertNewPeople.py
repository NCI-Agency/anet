import ast
import ldap
import psycopg2
import uuid

# # If you want to connect and read data through LDAP, uncomment below code block
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

# Before testing to connect LDAP , may be you want to try
# this sample data to insert into db which is in a LDAP response format
# !!! If you want to read data from LDAP ,uncomment above code block and comment below 2 rows !!!
f = open("ldap-response-sample.txt", "r")
result = f.read()

dictionary = ast.literal_eval(str(result))  # Convert data into dictionary format
print("Data is ready to import")

# Connect to PostgreSQL DB
connection = psycopg2.connect(database="<<dbname>>", user="<<user>>", password="<<password>>", host="127.0.0.1",
                              port="5433")
print("Connected DB successfully")
cursor = connection.cursor()
sql_insert_query = "INSERT INTO public.people (\"name\", \"emailAddress\",\"role\",\"uuid\", \"domainUsername\") " \
                   "VALUES (%s,%s,%s,%s,%s) "
# Parse data and insert new person into people table
count = 0
for i in dictionary:
    rawDict = i[1]
    data = {k: v[0] for k, v in rawDict.iteritems()}
    if all(key in data for key in ('mail', 'displayName', 'sAMAccountName')):
        insert_tuple = (data['displayName'], data['mail'], 0, str(uuid.uuid1()), data['sAMAccountName'],)
        cursor.execute(sql_insert_query, insert_tuple)
        count += 1
connection.commit()
print(str(count) + " new people inserted successfully")
cursor.close()
connection.close()
print("Connection closed")
