package mil.dds.anet.test.utils;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.stream.Stream;
import mil.dds.anet.utils.JsonUtils;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class JsonUtilsTest {

  @ParameterizedTest
  @MethodSource("equalJsonValues")
  void equalValuesHaveEqualHashCodes(String left, String right) {
    assertThat(JsonUtils.equals(left, right)).isTrue();
    assertThat(JsonUtils.equals(right, left)).isTrue();
    assertThat(JsonUtils.hashCode(left)).isEqualTo(JsonUtils.hashCode(right));
  }

  private static Stream<Arguments> equalJsonValues() {
    return Stream.of(Arguments.of(null, null), Arguments.of("null", " null "),
        Arguments.of("{\"b\":true,\"a\":1}", "{ \"a\": 1, \"b\": true }"),
        Arguments.of("{\"nested\":[{\"b\":2,\"a\":1},null]}",
            "{ \"nested\": [{\"a\": 1, \"b\": 2}, null] }"),
        Arguments.of("\"\\u0061\"", "\"a\""), Arguments.of("1", "1.00"),
        Arguments.of("1e3", "1000"), Arguments.of("-0.0", "0"),
        Arguments.of("{\"n\":12345678901234567890}", "{\"n\":12345678901234567890.00}"),
        Arguments.of("[1.000000000000000000001]", "[1.0000000000000000000010]"),
        Arguments.of("{\"a\":0,\"a\":1}", "{\"a\":1}"),
        Arguments.of("invalid JSON", "invalid JSON"), Arguments.of("", ""));
  }

  @ParameterizedTest
  @MethodSource("unequalJsonValues")
  void differentValuesAreNotEqual(String left, String right) {
    assertThat(JsonUtils.equals(left, right)).isFalse();
    assertThat(JsonUtils.equals(right, left)).isFalse();
  }

  private static Stream<Arguments> unequalJsonValues() {
    return Stream.of(Arguments.of(null, "null"), Arguments.of(null, ""), Arguments.of("{}", "[]"),
        Arguments.of("{\"a\":null}", "{}"), Arguments.of("[1,2]", "[2,1]"),
        Arguments.of("{\"a\":1}", "{\"a\":2}"), Arguments.of("1", "\"1\""),
        Arguments.of("1", "true"),
        Arguments.of("1.000000000000000000001", "1.000000000000000000002"),
        Arguments.of("invalid JSON", "\"invalid JSON\""),
        Arguments.of("invalid JSON", "other invalid JSON"), Arguments.of("", "\"\""),
        Arguments.of("{} trailing garbage", "{}"));
  }
}
