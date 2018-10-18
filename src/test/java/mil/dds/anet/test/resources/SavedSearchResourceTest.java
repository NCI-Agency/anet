package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import javax.ws.rs.core.GenericType;

import org.junit.Test;

import com.fasterxml.jackson.databind.ObjectMapper;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.beans.search.SavedSearch;
import mil.dds.anet.beans.search.SavedSearch.SearchObjectType;
import mil.dds.anet.test.resources.utils.GraphQLResponse;

public class SavedSearchResourceTest extends AbstractResourceTest {

	private static final String FIELDS = "id name objectType query owner { id }";

	@Test
	public void testSavedSearches() throws IOException { 
		Person jack = getJackJackson();
		
		//Create a new saved search and save it.
		SavedSearch ss = new SavedSearch();
		ss.setName("Test Saved Search created by SavedSearchResourceTest");
		ss.setObjectType(SearchObjectType.REPORTS);
		ss.setQuery("{\"text\" : \"spreadsheets\"}");
		
		final Integer ssId = graphQLHelper.createObject(jack, "createSavedSearch", "savedSearch", "SavedSearchInput",
				ss, new GenericType<GraphQLResponse<SavedSearch>>() {});
		assertThat(ssId).isNotNull();
		
		//Fetch a list of all of my saved searches
		List<SavedSearch> mine = graphQLHelper.getObjectList(jack, "mySearches", FIELDS, new GenericType<GraphQLResponse<List<SavedSearch>>>() {});
		final Optional<SavedSearch> optional = mine.stream().filter(e -> e.getId().equals(ssId)).findFirst();
		assertThat(optional).get().isNotNull();
		SavedSearch created = optional.get();
		
		//Run a saved search and get results.
		ObjectMapper mapper = new ObjectMapper();

		ReportSearchQuery query = mapper.readValue(created.getQuery(), ReportSearchQuery.class);
		final AnetBeanList<Report> results = graphQLHelper.searchObjects(jack, "reportList", "query", "ReportSearchQueryInput",
				"id intent state", query, new GenericType<GraphQLResponse<AnetBeanList<Report>>>() {});
		assertThat(results.getList()).isNotEmpty();
		
		//Delete it
		final Integer nrDeleted = graphQLHelper.deleteObject(jack, "deleteSavedSearch", created.getId());
		assertThat(nrDeleted).isEqualTo(1);
		
		mine = graphQLHelper.getObjectList(jack, "mySearches", FIELDS, new GenericType<GraphQLResponse<List<SavedSearch>>>() {});
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

		final Integer ssId = graphQLHelper.createObject(jack, "createSavedSearch", "savedSearch", "SavedSearchInput",
				ss, new GenericType<GraphQLResponse<SavedSearch>>() {});
		assertThat(ssId).isNotNull();

		//Fetch a list of all of my saved searches
		List<SavedSearch> mine = graphQLHelper.getObjectList(jack, "mySearches", FIELDS, new GenericType<GraphQLResponse<List<SavedSearch>>>() {});
		final Optional<SavedSearch> optional = mine.stream().filter(e -> e.getId().equals(ssId)).findFirst();
		assertThat(optional).get().isNotNull();
		SavedSearch created = optional.get();

		//Run a saved search and get results.
		ObjectMapper mapper = new ObjectMapper();

		LocationSearchQuery query = mapper.readValue(created.getQuery(), LocationSearchQuery.class);
		final AnetBeanList<Location> results = graphQLHelper.searchObjects(jack, "locationList", "query", "LocationSearchQueryInput",
				"id name status lat lng", query, new GenericType<GraphQLResponse<AnetBeanList<Location>>>() {});
		assertThat(results.getList()).isNotEmpty();

		//Delete it
		final Integer nrDeleted = graphQLHelper.deleteObject(jack, "deleteSavedSearch", created.getId());
		assertThat(nrDeleted).isEqualTo(1);

		mine = graphQLHelper.getObjectList(jack, "mySearches", FIELDS, new GenericType<GraphQLResponse<List<SavedSearch>>>() {});
		assertThat(mine).doesNotContain(created);
	}
}
