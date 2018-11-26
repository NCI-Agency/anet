# Java Application Server
This section will describe how the ANET Application Server works and the various components.  Two major frameworks that we use are:

- [**Dropwizard**](http://www.dropwizard.io/1.0.5/docs/) is a framework for developing java-based web applications.  It is a collection of other industry standard, open source, libraries to handle things like JSON parsing, HTTP multi-threading, Authentication, Authorization, Database access, etc.  We highly recommend you read the getting started guide and briefly scan the user manual.
- [**GraphQL**](http://graphql.org/) is a query language developed by Facebook to allow API consumers to explore a 'Graph' without requiring the server to have implemented every possible API call ahead of time.  The client developer can ask for what data they want, and the GraphQL layer will figure out what data it needs to fetch and then fetch specifcally that data.

Throughout the next several sections, we were refer to the *core ANET object types*. These are:

- People
- Positions
- Organizations
- Reports
- Tasks
- Locations

The Java Application Server is composed of 5 major pieces:

- **Beans**: Serializable Java objects that represent the major types in ANET (Person, Position, Organization, Report, Task, etc).  They are comprised of private fields typically representing the columns in the database, getters and setters for those fields, and `load*()` methods for the various relationships between object types (e.g. on the Person bean, there is a `loadPosition()` method).
- **DAOs** (Data Access Objects):  These objects are the relationship between the beans and the SQL database.  They contain all of the actual SQL statements to do the `INSERT`, `SELECT`, and `UPDATE` calls on a given object.  There is one DAO per Bean (e.g. `PersonDao`, `PositionDao`, `OrganizationDao`, etc), and that DAO returns objects (or Lists of Objects) of that particular type.  So if you are looking for a Database Query that returns Reports, look in `ReportDao`.
- **Mappers**:  These are classes that store the logic on how to take a `ResultSet` from a SQL query and turn it into a Bean.  They should be fairly straightforward and basic.  There is one per Bean type.
- **Resources**: These are classes that store all of the REST endpoints for a given object type.  These methods are expected to take in an HTTP call from a user, and provide the correct response.  In general, if you are trying to get an object of a particular type, you should be calling that Resource (e.g. `ReportResource` returns Reports, `PersonResource` returns People). These methods can also be called by the GraphQL API if they are appropiately annotated.
- **SearchQuery**:  These classes are JavaBeans that represent the advanced searches that can be run on a particular core object type.  There are then implementations for each object type's `SearchQuery` to actually perform the search.  More on this later.

Here's a quick rundown of where to find each of these pieces:

| Object Type | Bean | Dao | Mapper | Resource | SearchQuery |
| -----|-----|----|----|----|----|
| People | People.java  | PersonDao.java | PersonMapper.java | PersonResource.java | PersonSearchQuery.java |
| Positions | Positions.java | PositionDao.java | PositionMapper.java | PositionResource.java | PositionSearchQuery.java |
| Organizations | Organizations.java | OrganizationDao.java | OrganizationMapper.java | OrganizationResource.java | OrganizationSearchQuery.java |
| Reports | Reports.java | ReportDao.java | ReportMapper.java | ReportResource.java | ReportSearchQuery.java |
| Tasks | Tasks.java  | TaskDao.java | TaskMapper.java | TaskResource.java | TaskSearchQuery.java |
| Locations | Locations.java | LocationDao.java | LocationMapper.java | LocationResource.java | LocationSearchQuery.java |

# How the backend works
This is an attempt to describe the complete start to finish of how a request makes its way through the ANET stack.

1. When you boot up ANET, it will execute the `mil.dds.anet.AnetApplication class`.  All HTTP resources are initialized via the `run()` method here.
1. Each resource is annotated with a `@Path` annotation that will tell you the URL path that the class will serve.
1. On boot, the server will spit out all of the HTTP paths that it knows about in the form:
```
  GET     / (mil.dds.anet.resources.HomeResource)
  POST    /advisorOrganizations/new (mil.dds.anet.resources.AdvisorOrganizationResource)
  POST    /advisorOrganizations/update (mil.dds.anet.resources.AdvisorOrganizationResource)
  GET     /advisorOrganizations/{uuid} (mil.dds.anet.resources.AdvisorOrganizationResource)
  ..... (continued) ....
```

1. This tells you the URL, and then the class that will serve that URL.
1. Parameters into those methods are autowired in based on the HTTP request
  - `@PathParam` will pull a named parameter out of the `@Path` annotation on the method (e.g. `/api/people/{uuid}`)
  - `@QueryParam` will pull a named parameter out of the URL query string (e.g. `?foo=bar`)
  - Objects without annotations will be deserialized by Jackson from the HTTP entity
  - `@Auth` will pull the current logged in user
    - If Authentication is required, the Auth filter in `mil.dds.anet.AnetAuthenticator` will determine your user principal.
    - `@Produces` annotations describe which content type the method can produce. This is almost always going to be `application/json`.
    - `@GET`, `@POST`, and similar annotations describe which HTTP methods this method will respond to.
1. Within each Resource class, there is a `dao` (Database Access Object).  Each DAO contains all of the SQL logic for communicating with the database.
1. Each of the core ANET object types is represented by a bean that contains all of the properties and methods that that object can do. These are all in the `mil.dds.anet.beans` package.
  - These objects are deserialized from JSON when they are passed in the HTTP request body as part of a POST
  - These objects can be serialized back into JSON if they are returned by a method that is annotated with `@Produces(MediaType.APPLICATION_JSON)`

```java
	@GET
	@Timed
	@Path("/{uuid}")
	@GraphQLFetcher
	public Report getByUuid(@Auth Person user, @PathParam("uuid") String uuid) {
		final Report r = dao.getByUuid(uuid, user);
		if (r == null) { throw new WebApplicationException(Status.NOT_FOUND); }
		return r;
	}
```

# How the GraphQL API Works
GraphQL is the mechanism by which most data is fetched to be displayed in the web-frontend.  In ANET, we implemented GraphQL using the [graphql-java](https://github.com/graphql-java/graphql-java) implementation on top of our REST interface.  By using GraphQL we call the exact same functions that the REST API does, but we are able to be much more descriptive about what data we want back, and therefore reduce the number of round-trips between the client and the server.  Here is a brief run-through of how a graphql query gets executed:

1. All GraphQL queries go to the `GraphQLResource#graphql()` method.  This resource is initalized by being passed all of the other REST Resources within ANET.
1. The GraphQLResource will scan through all of the other REST Resources and look for methods that are annotated with the `@GraphQLFetcher` annotation. This annotation tells GraphQL that it can use this method as a "entry point" into the ANET Graph.
  - "The Anet Graph" is the term we'll use to describe all of the data within ANET and the relationships between the different object types. e.g.: A Person with uuid d95d8573-b45f-4eb6-ae30-e2299d3195bd has a Position which belongs to an Organization... and so on.
  - You can always pass the `f:` argument (f is for Function) to call a Resource method, this will use either the value passed to the `@GraphQLFetcher`, or the name of the method if no value is passed.
1. Once you have an object that was returned from a Resource (these are the Beans), you can call any of the 'get' methods on that object to fetch fields.  To put this all together, the query `person(uuid:"d95d8573-b45f-4eb6-ae30-e2299d3195bd") { uuid, name}` will look for a method on PersonResource that takes a parameter of name `uuid`, and then when it gets the `Person` object back, it will call the `getUuid()` and `getName()` methods on that Person object to fetch those fields.
1. Each of the primary objects within ANET (The Beans, or Person, Position, Organization, Report, Task), knows about its relationships to other objects.  Similar to the above example, if you query graphql with `person(uuid:"d95d8573-b45f-4eb6-ae30-e2299d3195bd") { postion {name }}` it will find the person with uuid d95d8573-b45f-4eb6-ae30-e2299d3195bd, and then call the `getPosition()` method on the Person object to fetch that relationship.
  - This is an example of how GraphQL saves us a round-trip to the server versus using a strict REST api, where the client would have to call '/people/d95d8573-b45f-4eb6-ae30-e2299d3195bd' and then '/positions/XXX'.
1. For any method where arguments are required, the GraphQLResource scans all of the methods in Resources and Bean classes to look for what arguments are required and then will look for those arguments passed via the GraphQL query.
  - In a REST Resource, we use the existing `@PathParam` and `@QueryParam` annotations to pull the name of the parameters.
  - In the Bean classes, we use `@GraphQLParam` to annotate the name of the parameters.

Here's a sample GraphQL query and how ANET processes it:
```
person(uuid:"d95d8573-b45f-4eb6-ae30-e2299d3195bd") {
  uuid,
  name,
  position {
    uuid,
    name,
  },
  authoredReports(pageNum:0, pageSize:10) {
    uuid,
    intent
  }
}
````

1. Because you POST'd this to `/graphql`, Dropwizard will take the JSON and deserialize it into a `Map<String, Object>` and pass it to the GraphQL method.
1. The `graphql-java` library will parse the structure and validate the input.
1. The `person` keyword will tell GraphQL that you want to access the `person` object type at the root level. This goes to the `PersonResource`.
1. The `AnetResourceDataFetcher` is the class that will get asked to load the person object. It looks at all of the methods on `PersonResource` that are annotated with `@GraphQLFetcher` and figures out which one has the right arguments to call. In this case it will be `getByUuid(String uuid)`.  That method is called and it will do a database load and return the person.
1. GraphQL next looks at the fields on the Person that we need to load, in this case `uuid, name, position, authoredReports`.  For each of these fields, they were defined on the person type by the `GraphQLResource.buildTypeFromBean` method, which scans a Bean class for getter methods and wires them up to be used later.  In this case it will look for methods called `getUuid()`, `getName()`.  For `authoredReports` and `positions` it will find the methods `loadAuthoredReports()` and `loadPosition` because they are annotated with `@GraphQLFetcher`.
  - As a convention, methods starting with `get` will never perform a database load and always return the value currently in memory.  `load` functions will execute a database query if necessary in order to return the correct value.
1. Each of these methods are called and the values returned.
1. For `getAuthoredReports`, when `buildTypeFromBean()` was scanning the Person Bean it noticed that this method required arguments, so it kept track of those.  When you try to call this method it will inspect the query to see if you passed the correct arguments. If so it will pass those arguments, and if not then it will throw an error.
  - Bottom line: All `get*()` methods on Beans are exposed. If they require arguments, you *MUST* annotate them with `@GraphQLParam`.
  - You can use `@GraphQLIgnore` to tell GraphQL to not expose a getter method.

* Note: GraphQL does _not_ use Jackson to serialize anything into JSON, it individually fetches the exact fields the client requests and transforms those into JSON using its own type system.
* Note: While GraphQL does technically support writing data to the server through mutations, we do not have any of that implemented.  You must still use the REST API to write any data to ANET.
