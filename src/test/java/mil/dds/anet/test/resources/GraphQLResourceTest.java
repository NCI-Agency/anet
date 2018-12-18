package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.net.URLEncoder;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import javax.ws.rs.client.Entity;
import javax.ws.rs.client.Invocation.Builder;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.MediaType;

import org.apache.commons.io.IOUtils;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.collect.ImmutableMap;

import mil.dds.anet.beans.Person;

public class GraphQLResourceTest extends AbstractResourceTest {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	@Test
	public void test()
		throws ExecutionException, InterruptedException {
		final Person jack = getJackJackson();
		final Person steve = getSteveSteveson();
		File testDir = new File("src/test/resources/graphQLTests/");
		assertThat(testDir.getAbsolutePath()).isNotNull();
		assertThat(testDir.isDirectory()).isTrue();
		
		Map<String,Object> variables = new HashMap<String,Object>();
		variables.put("personUuid", jack.getUuid());
		variables.put("positionUuid", steve.loadPosition().getUuid());
		variables.put("orgUuid", steve.getPosition().getOrganizationUuid());
		variables.put("searchQuery", "hospital");
		variables.put("reportUuid", jack.loadAttendedReports(0, 1).getList().get(0).getUuid());
		variables.put("pageNum", 0);
		variables.put("pageSize", 10);
		variables.put("maxResults", 6);
		logger.info("Using variables {}", variables);
		
		final File[] fileList = testDir.listFiles();
		assertThat(fileList).isNotNull();
		for (File f : fileList) {
			if (f.isFile()) {
				try { 
					final FileInputStream  input = new FileInputStream(f);
					String raw = IOUtils.toString(input);
					Map<String,Object> query = new HashMap<String,Object>();
					for (Map.Entry<String, Object> entry : variables.entrySet()) { 
						raw = raw.replace("${" + entry.getKey() + "}", entry.getValue().toString());
					}
					query.put("query", "query { " + raw + "}");
					query.put("variables", ImmutableMap.of());
					logger.info("Processing file {}", f);

					// Test POST request
					Map<String,Object> respPost = httpQuery("/graphql", admin)
							.post(Entity.json(query), new GenericType<Map<String,Object>>() {});
					doAsserts(f, respPost);

					// Test GET request
					Map<String,Object> respGet = httpQuery("/graphql?query=" + URLEncoder.encode("{" + raw + "}", "UTF-8"), admin)
							.get(new GenericType<Map<String,Object>>() {});
					doAsserts(f, respGet);

					// POST and GET responses should be equal
					assertThat(respPost.get("data")).isEqualTo(respGet.get("data"));

					// Test GET request over XML
					String respGetXml = httpQuery("/graphql?output=xml&query=" + URLEncoder.encode("{" + raw + "}", "UTF-8"), admin)
							.get(new GenericType<String>() {});
					assertThat(respGetXml).isNotNull();
					int len = respGetXml.length();
					assertThat(len).isGreaterThan(0);
					assertThat(respGetXml.substring(0, 1)).isEqualTo("<");
					String xmlHeader = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>";
					assertThat(respGetXml.substring(0, xmlHeader.length())).isEqualTo(xmlHeader);
					assertThat(respGetXml.substring(len - 2 , len)).isEqualTo(">\n");

					// Test POST request over XML
					query.put("output", "xml");
					final String respPostXml = httpQuery("/graphql", admin)
							.post(Entity.json(query), new GenericType<String>() {});

					// POST and GET responses over XML should be equal
					assertThat(respPostXml).isEqualTo(respGetXml);

					// Test GET request over XLSX
					// Note: getting the resulting XLSX as String is a quick & easy hack
					final String respGetXlsx = httpQuery("/graphql?output=xlsx&query=" + URLEncoder.encode("{" + raw + "}", "UTF-8"), admin)
							.get(new GenericType<String>() {});
					assertThat(respGetXlsx).isNotNull();
					assertThat(respGetXlsx.length()).isGreaterThan(0);

					// Test POST request over XLSX
					query.put("output", "xlsx");
					final String respPostXlsx = httpQuery("/graphql", admin)
							.post(Entity.json(query), new GenericType<String>() {});
					assertThat(respPostXlsx).isNotNull();
					assertThat(respPostXlsx.length()).isGreaterThan(0);
					// Note: can't compare respGetXlsx and respPostXlsx directly, as they will be different, unfortunately

					input.close();
				} catch (IOException e) { 
					fail("Unable to read file ", e);
				}
			}
		}
	}

	private void doAsserts(File f, Map<String, Object> resp) {
		assertThat(resp).isNotNull();
		assertThat(resp.containsKey("errors"))
			.as("Has Errors on %s : %s, %s",f.getName(),resp.get("errors"), resp.values().toString())
			.isFalse();
		assertThat(resp.containsKey("data")).as("Missing Data on " + f.getName(), resp).isTrue();
	}

	/*
	 * Helper method to build httpQuery with authentication and Accept headers.
	 */
	private Builder httpQuery(String path, Person authUser) {
		final String authString = Base64.getEncoder()
				.encodeToString((authUser.getDomainUsername() + ":").getBytes());
		return client
				.target(String.format("http://localhost:%d%s", RULE.getLocalPort(), path))
				.request()
				.header("Authorization", "Basic " + authString)
				.header("Accept", MediaType.APPLICATION_JSON_TYPE.toString());
	}

}
