package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.InvocationTargetException;

import javax.ws.rs.core.GenericType;

import org.junit.Test;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.resources.utils.GraphQLResponse;

public class LocationResourceTest extends AbstractResourceTest {

	private static final String FIELDS = "id name status lat lng";

	@Test
	public void locationTestGraphQL()
			throws IllegalAccessException, InvocationTargetException, InstantiationException {
		//Create
		final Location l = TestData.createLocation("The Boat Dock", 43.21, -87.65);
		final Integer lId = graphQLHelper.createObject(admin, "createLocation", "location", "LocationInput", l, new GenericType<GraphQLResponse<Location>>() {});
		assertThat(lId).isNotNull();
		final Location created = graphQLHelper.getObjectById(admin, "location", FIELDS, lId, new GenericType<GraphQLResponse<Location>>() {});
		assertThat(created.getName()).isEqualTo(l.getName());
		assertThat(created).isNotEqualTo(l);

		//Search
		//You cannot search for the Boat Dock location, because full-text indexing
		// is done in asynchronously and is not guaranteed to be done
		// so we search for a record in the base data set. 
		final LocationSearchQuery query = new LocationSearchQuery();
		query.setText("Police");
		final AnetBeanList<Location> searchObjects = graphQLHelper.searchObjects(admin, "locationList", "query", "LocationSearchQueryInput",
				"id name lat lng", query, new GenericType<GraphQLResponse<AnetBeanList<Location>>>() {});
		assertThat(searchObjects).isNotNull();
		assertThat(searchObjects.getList()).isNotEmpty();

		//Update
		created.setName("Down by the Bay");
		final Integer nrUpdated = graphQLHelper.updateObject(admin, "updateLocation", "location", "LocationInput", created);
		assertThat(nrUpdated).isEqualTo(1);
		final Location updated = graphQLHelper.getObjectById(admin, "location", FIELDS, lId, new GenericType<GraphQLResponse<Location>>() {});
		assertThat(updated).isEqualTo(created);
	}

}
