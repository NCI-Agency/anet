package mil.dds.anet.test.beans;

import static io.dropwizard.testing.FixtureHelpers.fixture;
import static org.assertj.core.api.Assertions.assertThat;
import mil.dds.anet.database.mappers.MapperUtils;

import com.fasterxml.jackson.databind.ObjectMapper;

public abstract class BeanTester<T> {

	static final ObjectMapper MAPPER = MapperUtils.getDefaultMapper();

	/** 
	 * Tests that a given object, when serialized to JSON, matches the JSON In the specified file path.
	 * @argument obj the object to serialize
	 * @argument jsonPath relative path to file that contains the serialized object.  
	 */
	public void serializesToJson(T obj, String jsonPath) throws Exception {
		final String expected = MAPPER.writeValueAsString(MAPPER.readValue(fixture(jsonPath), obj.getClass()));

		assertThat(MAPPER.writeValueAsString(obj)).isEqualTo(expected);
	}
	
	public void deserializesFromJson(T obj, String jsonPath) throws Exception {	
		assertThat(MAPPER.readValue(fixture(jsonPath), obj.getClass())).isEqualTo(obj);
    }
	
}
