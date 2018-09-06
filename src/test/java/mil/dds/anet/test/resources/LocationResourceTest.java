package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.List;

import javax.ws.rs.client.Entity;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;

import org.junit.Test;

import io.dropwizard.client.JerseyClientBuilder;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.test.TestData;

public class LocationResourceTest extends AbstractResourceTest {

	public LocationResourceTest() {
		if (client == null) { 
			client = new JerseyClientBuilder(RULE.getEnvironment()).using(config).build("test client");
		}
	}
	
	
	@Test
	public void locationTest() throws UnsupportedEncodingException {
		Location l = TestData.createLocation("The Boat Dock", 12.34,-56.78);
		
		Location created = httpQuery("/api/locations/new", admin)
				.post(Entity.json(l), Location.class);
		assertThat(created.getName()).isEqualTo(l.getName());
		assertThat(created).isNotEqualTo(l);
		
		//Search
		//You cannot search for the Boat Dock location, because full-text indexing
		// is done in asynchronously and is not guaranteed to be done
		// so we search for a record in the base data set. 
		List<Location> results = httpQuery(String.format("/api/locations/search?text=%s", 
				URLEncoder.encode("Police", "UTF-8")),admin)
				.get(new GenericType<AnetBeanList<Location>>(){}).getList();
		assertThat(results.size()).isGreaterThan(0);
		//assertThat(results).contains(created);
		
		//TODO: fuzzy searching
		
		//Update
		created.setName("Down by the Bay");
		Response resp = httpQuery("/api/locations/update", admin).post(Entity.json(created));
		assertThat(resp.getStatus()).isEqualTo(200);
		
		Location returned = httpQuery(String.format("/api/locations/%d", created.getId()), admin).get(Location.class);
		assertThat(returned.getName()).isEqualTo(created.getName());
	}
	
}
