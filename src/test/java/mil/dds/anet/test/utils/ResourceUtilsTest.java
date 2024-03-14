package mil.dds.anet.test.utils;

import static mil.dds.anet.utils.ResourceUtils.assertAllowedClassification;
import static mil.dds.anet.utils.ResourceUtils.getAllowedClassifications;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.fail;

import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import javax.ws.rs.WebApplicationException;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.beans.Position;
import mil.dds.anet.test.integration.utils.TestApp;
import mil.dds.anet.utils.ResourceUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@ExtendWith(TestApp.class)
public class ResourceUtilsTest {

  protected static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  @Test
  public void testValidateHistoryInput() {
    // We test the following conditions:
    // - Uuid cannot be null.
    // - Start time cannot be empty.
    // - There cannot be more than one history entry without an end time.
    // - History entry must have an end time. (if there is no current relation)
    // - Last history entry must be identical to person's current position. (checkPerson)
    // - Last history entry must be identical to position's current person. (not checkPerson)
    // - End time cannot before start time.
    // - There should be a history entry without an end time. (if there is a current relation)
    // - History entries should not overlap.
    final Object[][] testData = new Object[][] {
        // Each item has:
        // { isValid, uuid, relationUuid, (pphUuid, start time, end time,)… }
        // - null uuid
        {false, null, null, "pphUuid", "2004-02-27T00:00:00.000Z", "2004-02-28T00:00:00.000Z"},
        {false, null, "relUuid", "pphUuid", "2004-02-27T00:00:00.000Z", "2004-02-28T00:00:00.000Z"},
        // - null startTime
        {false, "uuid", null, "pphUuid", null, "2004-02-28T00:00:00.000Z"},
        {false, "uuid", "relUuid", "pphUuid", null, "2004-02-28T00:00:00.000Z"},
        // - two null endTime's
        {false, "uuid", null, "pphUuid", "2004-02-27T00:00:00.000Z", null, "pphUuid",
            "2004-02-27T00:00:00.000Z", null},
        {false, "uuid", "relUuid", "relUuid", "2004-02-27T00:00:00.000Z", null, "relUuid",
            "2004-02-27T00:00:00.000Z", null},
        // - null endTime without current relation
        {false, "uuid", null, "pphUuid", "2004-02-27T00:00:00.000Z", null},
        // - null endTime with wrong relation
        {false, "uuid", "relUuid", "pphUuid", "2004-02-27T00:00:00.000Z", null},
        // - no null endTime with current relation
        {false, "uuid", "relUuid", "relUuid", "2004-02-27T01:00:00.000Z",
            "2004-02-27T03:00:00.000Z"},
        // - endTime before startTime
        {false, "uuid", null, "pphUuid", "2004-02-27T00:00:00.000Z", "2004-02-26T23:59:59.999Z"},
        {false, "uuid", "relUuid", "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-26T23:59:59.999Z"},
        // - no history but with relation
        {false, "uuid", "relUuid"},
        // - overlap
        {false, "uuid", null, "pphUuid", "2004-02-27T00:00:00.000Z", "2004-02-27T02:00:00.000Z",
            "pphUuid", "2004-02-27T01:00:00.000Z", "2004-02-27T03:00:00.000Z"},
        {false, "uuid", null, "pphUuid", "2004-02-27T00:00:00.000Z", "2004-02-27T02:00:00.000Z",
            "pphUuid", "2004-02-27T01:00:00.000Z", "2004-02-27T01:30:00.000Z"},
        {false, "uuid", null, "pphUuid", "2004-02-27T01:00:00.000Z", "2004-02-27T03:00:00.000Z",
            "pphUuid", "2004-02-27T00:00:00.000Z", "2004-02-27T02:00:00.000Z"},
        {false, "uuid", null, "pphUuid", "2004-02-27T01:00:00.000Z", "2004-02-27T03:00:00.000Z",
            "pphUuid", "2004-02-27T00:00:00.000Z", "2004-02-27T04:00:00.000Z"},
        {false, "uuid", "relUuid", "pphUuid", "2004-02-27T01:00:00.000Z",
            "2004-02-27T03:00:00.000Z", "relUuid", "2004-02-27T00:00:00.000Z", null},
        {false, "uuid", "relUuid", "relUuid", "2004-02-27T00:00:00.000Z", null, "pphUuid",
            "2004-02-27T01:00:00.000Z", "2004-02-27T03:00:00.000Z"},
        // - very long history with overlap
        {false, "uuid", "relUuid", "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.001Z", "relUuid", "2004-02-27T00:00:00.000Z", null},
        // - no history and without relation
        {true, "uuid", null},
        // - valid history
        {true, "uuid", null, "pphUuid", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z"},
        {true, "uuid", "relUuid", "relUuid", "2004-02-27T00:00:00.000Z", null},
        {true, "uuid", null, "pphUuid", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
            "pphUuid", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z"},
        {true, "uuid", "relUuid", "pphUuid", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
            "relUuid", "2004-02-27T00:00:00.000Z", null},
        {true, "uuid", null, "pphUuid", "2004-02-27T00:00:00.000Z", "2004-02-27T01:00:00.000Z",
            "pphUuid", "2004-02-27T01:00:00.000Z", "2004-02-27T02:00:00.000Z"},
        {true, "uuid", "relUuid", "pphUuid", "2004-02-27T00:00:00.000Z", "2004-02-27T01:00:00.000Z",
            "relUuid", "2004-02-27T01:00:00.000Z", null},
        // - very long history
        {true, "uuid", null, "pphUuid", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
            "pphUuid", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T01:00:00.000Z", "pphUuid",
            "2004-02-27T01:00:00.000Z", "2004-02-27T02:00:00.000Z", "pphUuid",
            "2004-02-27T03:00:00.000Z", "2004-02-27T04:00:00.000Z", "pphUuid",
            "2004-02-27T02:00:00.000Z", "2004-02-27T03:00:00.000Z"},
        {true, "uuid", "relUuid", "pphUuid", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z",
            "pphUuid", "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T01:00:00.000Z", "pphUuid",
            "2004-02-27T01:00:00.000Z", "2004-02-27T02:00:00.000Z", "pphUuid",
            "2004-02-27T03:00:00.000Z", "2004-02-27T04:00:00.000Z", "pphUuid",
            "2004-02-27T02:00:00.000Z", "2004-02-27T03:00:00.000Z", "relUuid",
            "2004-02-27T04:00:00.000Z", null},
        // end
    };

    validateHistory(testData, true);
    validateHistory(testData, false);
  }

  private void validateHistory(final Object[][] testData, final boolean checkPerson) {
    for (final Object[] testItem : testData) {
      int i = 0;
      final boolean isValid = (boolean) testItem[i++];
      final String uuid = (String) testItem[i++];
      final String relationUuid = (String) testItem[i++];
      final List<PersonPositionHistory> hist = new ArrayList<>();
      while (i < testItem.length) {
        final PersonPositionHistory pph = new PersonPositionHistory();
        final Person person = new Person();
        pph.setPerson(person);

        final Position position = new Position();
        pph.setPosition(position);

        final String pphUuid = (String) testItem[i++];
        if (checkPerson) {
          position.setUuid(pphUuid);
        } else {
          person.setUuid(pphUuid);
        }

        pph.setStartTime(toInstant(testItem[i++]));
        pph.setEndTime(toInstant(testItem[i++]));
        hist.add(pph);
      }
      logger.debug("checking {} with checkPerson={}", Arrays.toString(testItem), checkPerson);
      try {
        ResourceUtils.validateHistoryInput(uuid, hist, checkPerson, relationUuid);
        if (!isValid) {
          fail("Expected a WebApplicationException");
        }
      } catch (WebApplicationException e) {
        if (isValid) {
          fail("Unexpected WebApplicationException: " + e);
        }
      }
    }
  }

  private Instant toInstant(final Object testDate) {
    return testDate == null ? null : Instant.parse((String) testDate);
  }

  @Test
  void shouldContainClassificationEntries() {
    assertThat(getAllowedClassifications()).isNotNull().isNotEmpty();
  }

  @Test
  void shouldPassWithoutExceptionForExistingClassification() {
    assertThatNoException().isThrownBy(() -> assertAllowedClassification("undefined"));
  }

  @Test
  void shouldThrowWebApplicationExceptionForUnknownClassification() {
    assertThatThrownBy(() -> assertAllowedClassification("Totally public"))
        .isInstanceOf(WebApplicationException.class).hasMessage("Classification is not allowed");
  }
}
