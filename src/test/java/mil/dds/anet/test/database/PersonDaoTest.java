package mil.dds.anet.test.database;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.test.SpringTestConfig;
import mil.dds.anet.utils.ResourceUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest(classes = SpringTestConfig.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class PersonDaoTest {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  // Dvisor, A
  private static final String DVISOR_UUID = "39d02d26-49eb-43b5-9cec-344777213a67";
  // Solenoid, Selena
  private static final String SELENA_UUID = "00b19ebf-0d4d-4b0f-93c8-9023ccb59c49";
  // Steveson, Steve for loser person
  private static final String STEVESON_STEVE = "90fa5784-9e63-4353-8119-357bcd88e287";
  // EF 2.2 Advisor Sewing Facilities
  private static final String EF22_ASF_UUID = "2b7d86a9-3ed4-4843-ab4e-136c3ab109bf";
  // EF 1.2 Advisor
  private static final String EF12_A_UUID = "525d6c4b-deaa-4218-b8fd-abfb7c81a4c2";
  // EF 1.1 Advisor G for loser position
  private static final String EF11_G_UUID = "888d6c4b-deaa-4218-b8fd-abfb7c81a4c6";
  // Each test data item has: { hasConflict, start time, end time, … }
  // History tests for Dvisor and Dvisor's own position, and Dvisor's own position and Dvisor:
  private final Object[][] testData1 = new Object[][] {
      // - no history at all
      {false},
      // - valid history
      {false, "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z"},
      {false, "2004-02-27T00:00:00.000Z", "2004-02-27T01:00:00.000Z"},
      {false, "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z"},
      {false, "2004-02-27T00:00:00.000Z", "2004-02-27T01:00:00.000Z", "2004-02-27T01:00:00.000Z",
          "2004-02-27T02:00:00.000Z"},
      // - very long history
      {false, "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z"},
      // - overlap
      {true, "2004-02-27T00:00:00.000Z", "2104-02-27T00:00:00.000Z"},
      {true, "2004-02-27T00:00:00.000Z", null},
      // - very long history with overlap
      {true, "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2104-02-27T00:00:00.000Z"},
      {true, "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", null},
      // end
  };
  // History tests for Selena and Dvisor's position, and Selena's position and Dvisor:
  private final Object[][] testData2 = new Object[][] {
      // - valid history
      {false, "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z"},
      {false, "2004-02-27T00:00:00.000Z", "2004-02-27T01:00:00.000Z"},
      {false, "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z"},
      {false, "2004-02-27T00:00:00.000Z", "2004-02-27T01:00:00.000Z", "2004-02-27T01:00:00.000Z",
          "2004-02-27T02:00:00.000Z"},
      // - very long history
      {false, "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z"},
      // - overlap
      {true, "2004-02-27T00:00:00.000Z", "2104-02-27T00:00:00.000Z"},
      {true, "2004-02-27T00:00:00.000Z", null},
      // - very long history with overlap
      {true, "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2104-02-27T00:00:00.000Z"},
      {true, "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
          "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", null},
      // end
  };

  @Autowired
  private PersonDao personDao;

  @Test
  void hasHistoryConflictForPersonTest() {
    // History tests for Dvisor and Dvisor's own position
    checkHistoryConflict(DVISOR_UUID, null, true, testData1);
    // History tests for Selena and Dvisor's position
    checkHistoryConflict(SELENA_UUID, null, true, testData2);
  }

  @Test
  void hasHistoryConflictForPositionTest() {
    // History tests for Dvisor's own position and Dvisor
    checkHistoryConflict(DVISOR_UUID, null, false, testData1);
    // History tests for Selena's position and Dvisor:
    checkHistoryConflict(DVISOR_UUID, null, false, testData2);
  }

  @Test
  void hasHistoryConflictForMergingPersonTest() {
    // History tests for merging positions if DVISOR_UUID is winner
    checkHistoryConflict(DVISOR_UUID, STEVESON_STEVE, true, testData1);
    // History tests for merging positions if DVISOR_UUID is winner
    checkHistoryConflict(DVISOR_UUID, STEVESON_STEVE, true, testData2);
  }

  @Test
  void hasHistoryConflictForMergingPositionTest() {
    // History tests for merging positions if EF22_ASF_UUID is winner
    checkHistoryConflict(DVISOR_UUID, EF11_G_UUID, false, testData1);
    // History tests for merging positions if EF12_A_UUID is winner
    checkHistoryConflict(DVISOR_UUID, EF11_G_UUID, false, testData2);
  }

  private void checkHistoryConflict(final String personUuid, final String positionUuid,
      final boolean checkPerson, final Object[][] testData) {
    for (final Object[] testItem : testData) {
      int i = 0;
      final boolean hasConflict = (boolean) testItem[i++];
      final List<PersonPositionHistory> hist = new ArrayList<>();
      while (i < testItem.length) {
        final PersonPositionHistory pph = new PersonPositionHistory();
        pph.setPersonUuid(personUuid);
        pph.setPositionUuid(positionUuid);
        pph.setStartTime(toInstant(testItem[i++]));
        pph.setEndTime(toInstant(testItem[i++]));
        hist.add(pph);
      }
      logger.debug("checking {}", Arrays.toString(testItem));
      if (!hasConflict) {
        ResourceUtils.validateHistoryInput(personUuid, hist, checkPerson, null);
      } else {
        assertThrows(ResponseStatusException.class, () -> {
          ResourceUtils.validateHistoryInput(personUuid, hist, checkPerson, null);
        });
      }
    }
  }

  private Instant toInstant(final Object testDate) {
    return testDate == null ? null : Instant.parse((String) testDate);
  }
}
