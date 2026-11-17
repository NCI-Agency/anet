package mil.dds.anet.utils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

/** Value equality for JSON that remains serialized at the API boundary. */
public final class JsonUtils {

  private static final ObjectMapper mapper =
      JsonMapper.builder().enable(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS,
          DeserializationFeature.FAIL_ON_TRAILING_TOKENS).build();

  private JsonUtils() {}

  public static boolean equals(String left, String right) {
    return Objects.equals(left, right)
        || Objects.equals(comparisonValue(left), comparisonValue(right));
  }

  public static int hashCode(String json) {
    return Objects.hashCode(comparisonValue(json));
  }

  private static Object comparisonValue(String json) {
    if (json == null) {
      // SQL NULL must remain distinct from the JSON literal null.
      return null;
    }
    try {
      final JsonNode node = mapper.readTree(json);
      if (node != null && !node.isMissingNode()) {
        return comparisonValue(node);
      }
    } catch (JacksonException e) {
      // Bean equality can run before input validation. Preserve text equality for invalid JSON.
    }
    return json;
  }

  private static Object comparisonValue(JsonNode node) {
    if (node.isNumber()) {
      // jsonb equates numeric values regardless of scale, exponent or integer/decimal notation.
      return node.decimalValue().stripTrailingZeros();
    }
    if (node.isObject()) {
      final Map<String, Object> values = new HashMap<>();
      node.properties()
          .forEach(entry -> values.put(entry.getKey(), comparisonValue(entry.getValue())));
      return values;
    }
    if (node.isArray()) {
      final List<Object> values = new ArrayList<>();
      node.forEach(value -> values.add(comparisonValue(value)));
      return values;
    }
    return node;
  }
}
