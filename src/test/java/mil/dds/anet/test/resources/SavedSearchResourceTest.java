package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.beans.search.SavedSearch;
import mil.dds.anet.beans.search.SavedSearch.SearchObjectType;
import mil.dds.anet.test.resources.utils.GraphQlResponse;
import org.junit.jupiter.api.Test;

public class SavedSearchResourceTest extends AbstractResourceTest {

  private static final String FIELDS = "uuid name objectType query owner { uuid }";

  @Test
  public void testSavedSearches() throws IOException {
    Person jack = getJackJackson();

    // Create a new saved search and save it.
    SavedSearch ss = new SavedSearch();
    ss.setName("Test Saved Search created by SavedSearchResourceTest");
    ss.setObjectType(SearchObjectType.REPORTS);
    ss.setQuery("{\"text\" : \"spreadsheets\"}");

    final String ssUuid = graphQLHelper.createObject(jack, "createSavedSearch", "savedSearch",
        "SavedSearchInput", ss, new TypeReference<GraphQlResponse<SavedSearch>>() {});
    assertThat(ssUuid).isNotNull();

    // Fetch a list of all of my saved searches
    List<SavedSearch> mine = graphQLHelper.getObjectList(jack, "mySearches", FIELDS,
        new TypeReference<GraphQlResponse<List<SavedSearch>>>() {});
    final Optional<SavedSearch> optional =
        mine.stream().filter(e -> e.getUuid().equals(ssUuid)).findFirst();
    assertThat(optional).get().isNotNull();
    SavedSearch created = optional.get();

    // Run a saved search and get results.
    ObjectMapper mapper = new ObjectMapper();

    ReportSearchQuery query = mapper.readValue(created.getQuery(), ReportSearchQuery.class);
    final AnetBeanList<Report> results = graphQLHelper.searchObjects(jack, "reportList", "query",
        "ReportSearchQueryInput", "uuid intent state", query,
        new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
    assertThat(results.getList()).isNotEmpty();

    // Delete it
    final Integer nrDeleted =
        graphQLHelper.deleteObject(jack, "deleteSavedSearch", created.getUuid());
    assertThat(nrDeleted).isEqualTo(1);

    mine = graphQLHelper.getObjectList(jack, "mySearches", FIELDS,
        new TypeReference<GraphQlResponse<List<SavedSearch>>>() {});
    assertThat(mine).doesNotContain(created);

  }

  @Test
  public void testSavedLocationSearch() throws IOException {
    Person jack = getJackJackson();

    // Create a new saved search and save it.
    SavedSearch ss = new SavedSearch();
    ss.setName("Test Saved Search created by SavedSearchResourceTest");
    ss.setObjectType(SearchObjectType.LOCATIONS);
    ss.setQuery("{\"text\" : \"kabul\"}");

    final String ssUuid = graphQLHelper.createObject(jack, "createSavedSearch", "savedSearch",
        "SavedSearchInput", ss, new TypeReference<GraphQlResponse<SavedSearch>>() {});
    assertThat(ssUuid).isNotNull();

    // Fetch a list of all of my saved searches
    List<SavedSearch> mine = graphQLHelper.getObjectList(jack, "mySearches", FIELDS,
        new TypeReference<GraphQlResponse<List<SavedSearch>>>() {});
    final Optional<SavedSearch> optional =
        mine.stream().filter(e -> e.getUuid().equals(ssUuid)).findFirst();
    assertThat(optional).get().isNotNull();
    SavedSearch created = optional.get();

    // Run a saved search and get results.
    ObjectMapper mapper = new ObjectMapper();

    LocationSearchQuery query = mapper.readValue(created.getQuery(), LocationSearchQuery.class);
    final AnetBeanList<Location> results = graphQLHelper.searchObjects(jack, "locationList",
        "query", "LocationSearchQueryInput", "uuid name status lat lng", query,
        new TypeReference<GraphQlResponse<AnetBeanList<Location>>>() {});
    assertThat(results.getList()).isNotEmpty();

    // Delete it
    final Integer nrDeleted =
        graphQLHelper.deleteObject(jack, "deleteSavedSearch", created.getUuid());
    assertThat(nrDeleted).isEqualTo(1);

    mine = graphQLHelper.getObjectList(jack, "mySearches", FIELDS,
        new TypeReference<GraphQlResponse<List<SavedSearch>>>() {});
    assertThat(mine).doesNotContain(created);
  }
}
