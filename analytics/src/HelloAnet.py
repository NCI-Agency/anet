from gql import gql, Client
from gql.transport.requests import RequestsHTTPTransport
import pprint

transport = RequestsHTTPTransport("http://localhost:8080/graphql?user=erin&pass=erin", use_json=True)
client = Client(transport=transport)
query = gql('''
{
  reports(pageNum: 0, pageSize: 1000) {
    list {
      uuid
      intent
      engagementDate
      author {
        uuid
        name
      }
      attendees {
        uuid
        name
      }
    }
  }
}
''')

printer = pprint.PrettyPrinter(indent=4)
resultJSON = client.execute(query)

printer.pprint(resultJSON["reports"]["list"])
