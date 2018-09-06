package mil.dds.anet.test.resources;

import java.io.InputStream;
import java.lang.invoke.MethodHandles;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.ws.rs.client.Client;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.Invocation.Builder;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.commons.io.IOUtils;
import org.junit.Before;
import org.junit.ClassRule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
import mil.dds.anet.utils.BatchingUtils;

public abstract class AbstractResourceTest {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	@ClassRule
	public static final DropwizardAppRule<AnetConfiguration> RULE =
		new DropwizardAppRule<AnetConfiguration>(AnetApplication.class, "anet.yml");
	
	public static Client client;
	public static JerseyClientConfiguration config = new JerseyClientConfiguration();
	
	static { 
		config.setTimeout(Duration.seconds(30L));
		config.setConnectionTimeout(Duration.seconds(10));
	}

	protected Person admin;
	protected Map<String, Object> context;

	@Before
	public void setUp() {
		admin = findOrPutPersonInDb(PersonTest.getArthurDmin());
		context = new HashMap<>();
		context.put("dataLoaderRegistry", BatchingUtils.registerDataLoaders(AnetObjectEngine.getInstance(), false, false));
	}

	/* 
	 * Constructs a httpQuery to the localhost server for the specified path. 
	 */
	public Builder httpQuery(String path) { 
		if (path.startsWith("/") == false) { path = "/" + path; } 
		return client.target(String.format("http://localhost:%d%s", RULE.getLocalPort(), path))
			.request();
	}
	
	/*
	 * Helper method to build httpQuery with authentication and Accept headers. 
	 */
	public Builder httpQuery(String path, Person authUser, MediaType acceptType) { 
		String authString = Base64.getEncoder().encodeToString(
				(authUser.getDomainUsername() + ":").getBytes());
		return httpQuery(path)
				.header("Authorization", "Basic " + authString)
				.header("Accept", acceptType.toString());
	}
	
	public Builder httpQuery(String path, Person authUser) { 
		return httpQuery(path, authUser, MediaType.APPLICATION_JSON_TYPE);
	}
	
	/*
	 * Finds the specified person in the database. 
	 * If missing, creates them. 
	 */
	public Person findOrPutPersonInDb(Person stub) {
		if (stub.getDomainUsername() != null) { 
			try { 
				Person user = httpQuery("/api/people/me", stub).get(Person.class);
				if (user != null) { return user; }
			} catch (Exception ignore) { /* ignore */ } 
		} else { 
			PersonSearchQuery query = new PersonSearchQuery();
			query.setText(stub.getName());
			List<Person> ret = httpQuery("/api/people/search",PersonTest.getJackJacksonStub()).post(Entity.json(query), new GenericType<AnetBeanList<Person>>(){}).getList();
			for (Person p : ret) { 
				if (p.getEmailAddress().equals(stub.getEmailAddress())) { return p; } 
			}
		}

		//Create insert into DB
		Person newPerson = httpQuery("/api/people/new", admin).post(Entity.json(stub), Person.class);
		return newPerson;
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
	
	/**
	 * Reads the entire Entity off the HTTP Response. 
	 */
	public String getResponseBody(Response resp) {
		try { 
			InputStream is = (InputStream) resp.getEntity();
			return IOUtils.toString(is);
		} catch (Exception e) {
			logger.error("Exception getting response entity", e);
			return null;
		}
	}

}
