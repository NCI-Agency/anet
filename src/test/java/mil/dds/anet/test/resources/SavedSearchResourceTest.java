package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import com.graphql_java_generator.exception.GraphQLRequestExecutionException;
import com.graphql_java_generator.exception.GraphQLRequestPreparationException;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.test.client.AnetBeanList_Location;
import mil.dds.anet.test.client.AnetBeanList_Report;
import mil.dds.anet.test.client.LocationSearchQueryInput;
import mil.dds.anet.test.client.ReportSearchQueryInput;
import mil.dds.anet.test.client.SavedSearch;
import mil.dds.anet.test.client.SavedSearchInput;
import mil.dds.anet.test.client.SearchObjectType;
import org.junit.jupiter.api.Test;

public class SavedSearchResourceTest extends AbstractResourceTest {

  private static final String FIELDS = "{ uuid name objectType query owner { uuid } }";

  @Test
  public void testSavedSearches()
      throws IOException, GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create a new saved search and save it.
    final SavedSearchInput ssi =
        SavedSearchInput.builder().withName("Test Saved Search created by SavedSearchResourceTest")
            .withObjectType(SearchObjectType.REPORTS).withQuery("{\"text\" : \"spreadsheets\"}")
            .build();

    final SavedSearch ss = jackMutationExecutor.createSavedSearch(FIELDS, ssi);
    assertThat(ss).isNotNull();
    assertThat(ss.getUuid()).isNotNull();

    // Fetch a list of all of my saved searches
    List<SavedSearch> mine = jackQueryExecutor.mySearches(FIELDS);
    final Optional<SavedSearch> optional =
        mine.stream().filter(e -> e.getUuid().equals(ss.getUuid())).findFirst();
    assertThat(optional).get().isNotNull();
    SavedSearch created = optional.get();

    // Run a saved search and get results.
    final ReportSearchQueryInput query =
        MapperUtils.getDefaultMapper().readValue(created.getQuery(), ReportSearchQueryInput.class);
    final AnetBeanList_Report results =
        jackQueryExecutor.reportList(getListFields("{ uuid intent state }"), query);
    assertThat(results.getList()).isNotEmpty();

    // Delete it
    final Integer nrDeleted = jackMutationExecutor.deleteSavedSearch("", created.getUuid());
    assertThat(nrDeleted).isEqualTo(1);

    mine = jackQueryExecutor.mySearches(FIELDS);
    assertThat(mine).doesNotContain(created);
  }

  @Test
  public void testSavedLocationSearch()
      throws IOException, GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create a new saved search and save it.
    final SavedSearchInput ssi =
        SavedSearchInput.builder().withName("Test Saved Search created by SavedSearchResourceTest")
            .withObjectType(SearchObjectType.LOCATIONS).withQuery("{\"text\" : \"kabul\"}").build();

    final SavedSearch ss = jackMutationExecutor.createSavedSearch(FIELDS, ssi);
    assertThat(ss).isNotNull();
    assertThat(ss.getUuid()).isNotNull();

    // Fetch a list of all of my saved searches
    List<SavedSearch> mine = jackQueryExecutor.mySearches(FIELDS);
    final Optional<SavedSearch> optional =
        mine.stream().filter(e -> e.getUuid().equals(ss.getUuid())).findFirst();
    assertThat(optional).get().isNotNull();
    SavedSearch created = optional.get();

    // Run a saved search and get results.
    final LocationSearchQueryInput query = MapperUtils.getDefaultMapper()
        .readValue(created.getQuery(), LocationSearchQueryInput.class);
    final AnetBeanList_Location results =
        jackQueryExecutor.locationList(getListFields("{ uuid name status lat lng }"), query);
    assertThat(results.getList()).isNotEmpty();

    // Delete it
    final Integer nrDeleted = jackMutationExecutor.deleteSavedSearch("", created.getUuid());
    assertThat(nrDeleted).isEqualTo(1);

    mine = jackQueryExecutor.mySearches(FIELDS);
    assertThat(mine).doesNotContain(created);
  }
}
