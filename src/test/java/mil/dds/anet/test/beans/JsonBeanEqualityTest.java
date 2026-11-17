package mil.dds.anet.test.beans;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.function.Supplier;
import java.util.stream.Stream;
import mil.dds.anet.beans.Assessment;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Task;
import mil.dds.anet.views.AbstractCustomizableAnetBean;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

class JsonBeanEqualityTest {

  private static final String COMPACT_JSON = "{\"b\":[1e3,null],\"a\":true}";
  private static final String DATABASE_JSON = "{\"a\": true, \"b\": [1000, null]}";

  @Test
  void assessmentEqualityIgnoresJsonRepresentation() {
    final Assessment left = new Assessment();
    final Assessment right = new Assessment();
    left.setAssessmentValues(COMPACT_JSON);
    right.setAssessmentValues(DATABASE_JSON);
    assertEqualBeans(left, right);

    right.setAssessmentValues("{\"a\":false,\"b\":[1000,null]}");
    assertThat(left).isNotEqualTo(right);

    left.setAssessmentValues(null);
    right.setAssessmentValues("null");
    assertThat(left).isNotEqualTo(right);
  }

  @ParameterizedTest
  @MethodSource("customizableBeans")
  void customFieldsEqualityIgnoresJsonRepresentation(
      Supplier<AbstractCustomizableAnetBean> factory) {
    final AbstractCustomizableAnetBean left = factory.get();
    final AbstractCustomizableAnetBean right = factory.get();
    left.setCustomFields(COMPACT_JSON);
    right.setCustomFields(DATABASE_JSON);
    assertEqualBeans(left, right);

    right.setCustomFields("{\"a\":false,\"b\":[1000,null]}");
    assertThat(left).isNotEqualTo(right);

    left.setCustomFields(null);
    right.setCustomFields("null");
    assertThat(left).isNotEqualTo(right);
  }

  private static Stream<Supplier<AbstractCustomizableAnetBean>> customizableBeans() {
    return Stream.of(Location::new, Organization::new, Person::new, Position::new, Report::new,
        Task::new);
  }

  private static void assertEqualBeans(Object left, Object right) {
    assertThat(left).isEqualTo(right);
    assertThat(right).isEqualTo(left);
    assertThat(left.hashCode()).isEqualTo(right.hashCode());
  }
}
