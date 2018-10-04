package mil.dds.anet.test.resources;

import java.lang.invoke.MethodHandles;
import java.util.HashMap;
import java.util.Map;

import javax.ws.rs.client.Client;
import javax.ws.rs.core.GenericType;

import org.junit.ClassRule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.dropwizard.client.JerseyClientBuilder;
import io.dropwizard.client.JerseyClientConfiguration;
import io.dropwizard.testing.junit.DropwizardAppRule;
import io.dropwizard.util.Duration;
import mil.dds.anet.AnetApplication;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.test.beans.PersonTest;
import mil.dds.anet.test.resources.utils.GraphQLHelper;
import mil.dds.anet.test.resources.utils.GraphQLResponse;
import mil.dds.anet.utils.BatchingUtils;

public abstract class AbstractResourceTest {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	@ClassRule
	public static final DropwizardAppRule<AnetConfiguration> RULE =
		new DropwizardAppRule<AnetConfiguration>(AnetApplication.class, "anet.yml");
	
	private static JerseyClientConfiguration config = new JerseyClientConfiguration();
	static {
		config.setTimeout(Duration.seconds(60L));
		config.setConnectionTimeout(Duration.seconds(30L));
		config.setConnectionRequestTimeout(Duration.seconds(30L));
	}

	protected static Client client;
	protected static GraphQLHelper graphQLHelper;

	protected final Person admin;
	protected final Map<String, Object> context;

	public AbstractResourceTest() {
		if (client == null) {
			client = new JerseyClientBuilder(RULE.getEnvironment()).using(config).build("test client");
		}
		if (graphQLHelper == null) {
			graphQLHelper = new GraphQLHelper(client, RULE.getLocalPort());
		}
		admin = findOrPutPersonInDb(PersonTest.getArthurDmin());
		context = new HashMap<>();
		context.put("dataLoaderRegistry", BatchingUtils.registerDataLoaders(AnetObjectEngine.getInstance(), false, false));
	}
	
	/*
	 * Finds the specified person in the database. 
	 * If missing, creates them. 
	 */
	public Person findOrPutPersonInDb(Person stub) {
		final String fields = "id name domainUsername role emailAddress rank status phoneNumber biography pendingVerification createdAt updatedAt"
				+ " position {"
				+ "   id name type status "
				+ "   organization { id shortName }"
				+ " }";
		if (stub.getDomainUsername() != null) { 
			try { 
				final Person user = graphQLHelper.getObject(stub, "me", fields, new GenericType<GraphQLResponse<Person>>() {});
				if (user != null) { return user; }
			} catch (Exception e) {
				logger.error("error getting user", e);
			}
		} else { 
			PersonSearchQuery query = new PersonSearchQuery();
			query.setText(stub.getName());
			final AnetBeanList<Person> searchObjects = graphQLHelper.searchObjects(
					PersonTest.getJackJacksonStub(), "personList", "query", "PersonSearchQueryInput", fields, query,
					new GenericType<GraphQLResponse<AnetBeanList<Person>>>() {});
			for (Person p : searchObjects.getList()) {
				if (p.getEmailAddress().equals(stub.getEmailAddress())) { return p; } 
			}
		}

		//Create insert into DB
		final Integer newPersonId = graphQLHelper.createObject(admin, "createPerson", "person", "PersonInput", stub, new GenericType<GraphQLResponse<Person>>() {});
		return graphQLHelper.getObjectById(admin, "person", fields, newPersonId, new GenericType<GraphQLResponse<Person>>() {});
	}
	
	public Person getJackJackson() { 
		return findOrPutPersonInDb(PersonTest.getJackJacksonStub());
	}
	
	public Person getSteveSteveson() { 
		return findOrPutPersonInDb(PersonTest.getSteveStevesonStub());
	}
	
	public Person getRogerRogwell() { 
		return findOrPutPersonInDb(PersonTest.getRogerRogwell());
	}
	
	public Person getElizabethElizawell() { 
		return findOrPutPersonInDb(PersonTest.getElizabethElizawell());
	}
	
	public Person getNickNicholson() { 
		return findOrPutPersonInDb(PersonTest.getNickNicholson());
	}
	
	public Person getBobBobtown() { 
		return findOrPutPersonInDb(PersonTest.getBobBobtown());
	}

}
