package mil.dds.anet.test.resources.insights;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import mil.dds.anet.test.client.AnetBeanList_Position;
import mil.dds.anet.test.client.PositionSearchQueryInput;
import mil.dds.anet.test.resources.AbstractResourceTest;
import mil.dds.anet.test.resources.PositionResourceTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

public class PendingAssessmentsByPositionTest extends AbstractResourceTest {

  @Nested
  class NoAssessmentsTest {
    private static final String FIELDS_TASK = "fields.task";
    private static final String FIELDS_REGULAR_PERSON = "fields.regular.person";
    private static final String ASSESSMENTS = "assessments";

    private Object taskAssessments;
    private Object regularPersonAssessments;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
      // Remove assessment definitions from dictionary
      final Map<String, Object> taskFields =
          (Map<String, Object>) dict.getDictionaryEntry(FIELDS_TASK);
      taskAssessments = taskFields.remove(ASSESSMENTS);
      final Map<String, Object> regularPersonFields =
          (Map<String, Object>) dict.getDictionaryEntry(FIELDS_REGULAR_PERSON);
      regularPersonAssessments = regularPersonFields.remove(ASSESSMENTS);
    }

    @AfterEach
    @SuppressWarnings("unchecked")
    void tearDown() {
      // Restore assessment definitions in dictionary
      final Map<String, Object> taskFields =
          (Map<String, Object>) dict.getDictionaryEntry(FIELDS_TASK);
      taskFields.put(ASSESSMENTS, taskAssessments);
      final Map<String, Object> regularPersonFields =
          (Map<String, Object>) dict.getDictionaryEntry(FIELDS_REGULAR_PERSON);
      regularPersonFields.put(ASSESSMENTS, regularPersonAssessments);
    }

    @Test
    void testWithNoPositions() {
      final PositionSearchQueryInput query =
          PositionSearchQueryInput.builder().withHasPendingAssessments(true).build();
      final AnetBeanList_Position result = withCredentials(adminUser,
          t -> queryExecutor.positionList(getListFields(PositionResourceTest.FIELDS), query));
      assertThat(result).isNotNull();
      // When there are no pending assessments the list should be empty
      assertThat(result.getList()).isEmpty();
    }
  }
}
