package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.util.List;

import javax.ws.rs.client.Entity;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;

import org.junit.Test;

import com.fasterxml.jackson.databind.ObjectMapper;

import io.dropwizard.client.JerseyClientBuilder;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.beans.search.SavedSearch;
import mil.dds.anet.beans.search.SavedSearch.SearchObjectType;

public class SavedSearchResourceTest extends AbstractResourceTest {

	public SavedSearchResourceTest() { 
		if (client == null) { 
			client = new JerseyClientBuilder(RULE.getEnvironment()).using(config).build("test client");
		}
	}
	
	@Test
	public void testSavedSearches() throws IOException { 
		Person jack = getJackJackson();
		
		//Create a new saved search and save it.
		SavedSearch ss = new SavedSearch();
		ss.setName("Test Saved Search created by SavedSearchResourceTest");
		ss.setObjectType(SearchObjectType.REPORTS);
		ss.setQuery("{\"text\" : \"spreadsheets\"}");
		
		SavedSearch created = httpQuery("/api/savedSearches/new", jack).post(Entity.json(ss), SavedSearch.class);
		assertThat(created.getId()).isNotNull();
		assertThat(created.getQuery()).isEqualTo(ss.getQuery());
		
		//Fetch a list of all of my saved searches
		List<SavedSearch> mine = httpQuery("/api/savedSearches/mine", jack).get(new GenericType<List<SavedSearch>>() {});
		assertThat(mine).contains(created);
		
		//Run a saved search and get results.
		ObjectMapper mapper = new ObjectMapper();

		ReportSearchQuery query = mapper.readValue(created.getQuery(), ReportSearchQuery.class);
		AnetBeanList<Report> results = httpQuery("/api/reports/search", jack).post(Entity.json(query), new GenericType<AnetBeanList<Report>>(){});
		assertThat(results.getList()).isNotEmpty();
		
		//Delete it
		Response resp = httpQuery("/api/savedSearches/" + created.getId(), jack).delete();
		assertThat(resp.getStatus()).isEqualTo(200);
		
		mine = httpQuery("/api/savedSearches/mine", jack).get(new GenericType<List<SavedSearch>>() {});
		assertThat(mine).doesNotContain(created);
		
	}

	@Test
	public void testSavedLocationSearch() throws IOException {
		Person jack = getJackJackson();

		//Create a new saved search and save it.
		SavedSearch ss = new SavedSearch();
		ss.setName("Test Saved Search created by SavedSearchResourceTest");
		ss.setObjectType(SearchObjectType.LOCATIONS);
		ss.setQuery("{\"text\" : \"kabul\"}");

		SavedSearch created = httpQuery("/api/savedSearches/new", jack).post(Entity.json(ss), SavedSearch.class);
		assertThat(created.getId()).isNotNull();
		assertThat(created.getQuery()).isEqualTo(ss.getQuery());

		//Fetch a list of all of my saved searches
		List<SavedSearch> mine = httpQuery("/api/savedSearches/mine", jack).get(new GenericType<List<SavedSearch>>() {});
		assertThat(mine).contains(created);

		//Run a saved search and get results.
		ObjectMapper mapper = new ObjectMapper();

		LocationSearchQuery query = mapper.readValue(created.getQuery(), LocationSearchQuery.class);
		AnetBeanList<Location> results = httpQuery("/api/locations/search", jack).post(Entity.json(query), new GenericType<AnetBeanList<Location>>(){});
		assertThat(results.getList()).isNotEmpty();

		//Delete it
		Response resp = httpQuery("/api/savedSearches/" + created.getId(), jack).delete();
		assertThat(resp.getStatus()).isEqualTo(200);

		mine = httpQuery("/api/savedSearches/mine", jack).get(new GenericType<List<SavedSearch>>() {});
		assertThat(mine).doesNotContain(created);
	}
}
