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
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.beans.Position;
import mil.dds.anet.test.SpringTestConfig;
import mil.dds.anet.utils.ResourceUtils;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest(classes = SpringTestConfig.class)
class ResourceUtilsTest {

  protected static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  @Test
  void testValidateHistoryInput() {
    // We test the following conditions:
    // - Uuid cannot be null.
    // - Start time cannot be empty.
    // - There cannot be more than one history entry without an end time.
    // - History entry must have an end time. (if there is no current relation)
    // - Last history entry must be identical to person's primary position. (checkPerson)
    // - Last history entry must be identical to position's current person. (not checkPerson)
    // - End time cannot before start time.
    // - There should be a history entry without an end time. (if there is a current relation)
    // - History entries should not overlap.
    final Object[][] testData = new Object[][] {
        // Each item has:
        // { label, isValidPerson, isValidPosition, uuid, relationUuid, (pphUuid, start time, end
        // time, primary)… }

        {"null uuid", false, false, null, null, "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-28T00:00:00.000Z", true},
        {"null uuid 2", false, false, null, "relUuid", "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-28T00:00:00.000Z", true},

        {"null startTime 1", false, false, "uuid", null, "pphUuid", null,
            "2004-02-28T00:00:00.000Z", true},
        {"null startTime 2", false, false, "uuid", "relUuid", "pphUuid", null,
            "2004-02-28T00:00:00.000Z", true},

        {"two null endTimes 1", false, false, "uuid", null, "pphUuid", "2004-02-27T00:00:00.000Z",
            null, true, "pphUuid", "2004-02-27T00:00:00.000Z", null, true},
        {"two null endTimes 2", false, false, "uuid", "relUuid", "relUuid",
            "2004-02-27T00:00:00.000Z", null, true, "relUuid", "2004-02-27T00:00:00.000Z", null,
            true},

        {"null endTime without current relation", false, false, "uuid", null, "pphUuid",
            "2004-02-27T00:00:00.000Z", null, true},

        {"null endTime with wrong relation", false, false, "uuid", "relUuid", "pphUuid",
            "2004-02-27T00:00:00.000Z", null, true},

        {"no null endTime with current relation", false, false, "uuid", "relUuid", "relUuid",
            "2004-02-27T01:00:00.000Z", "2004-02-27T03:00:00.000Z", true},

        {"endTime before startTime 1", false, false, "uuid", null, "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-26T23:59:59.999Z", true},
        {"endTime before startTime 2", false, false, "uuid", "relUuid", "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-26T23:59:59.999Z", true},

        {"no history but with relation", false, false, "uuid", "relUuid"},

        {"overlap 1", false, false, "uuid", null, "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T02:00:00.000Z", true, "pphUuid", "2004-02-27T01:00:00.000Z",
            "2004-02-27T03:00:00.000Z", true},
        {"overlap 2", false, false, "uuid", null, "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T02:00:00.000Z", true, "pphUuid", "2004-02-27T01:00:00.000Z",
            "2004-02-27T01:30:00.000Z", true},
        {"overlap 3", false, false, "uuid", null, "pphUuid", "2004-02-27T01:00:00.000Z",
            "2004-02-27T03:00:00.000Z", true, "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T02:00:00.000Z", true},
        {"overlap 4", false, false, "uuid", null, "pphUuid", "2004-02-27T01:00:00.000Z",
            "2004-02-27T03:00:00.000Z", true, "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T04:00:00.000Z", true},
        {"overlap 5", false, false, "uuid", "relUuid", "pphUuid", "2004-02-27T01:00:00.000Z",
            "2004-02-27T03:00:00.000Z", true, "relUuid", "2004-02-27T00:00:00.000Z", null, true},
        {"overlap 6", false, false, "uuid", "relUuid", "relUuid", "2004-02-27T00:00:00.000Z", null,
            true, "pphUuid", "2004-02-27T01:00:00.000Z", "2004-02-27T03:00:00.000Z", true},

        {"very long history with overlap", false, false, "uuid", "relUuid", "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", true, "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", true, "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", true, "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", true, "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", true, "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", true, "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", true, "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", true, "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.001Z", true, "relUuid",
            "2004-02-27T00:00:00.000Z", null, true},

        {"no history and without relation", true, true, "uuid", null},

        {"valid history 1", true, true, "uuid", null, "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", true},
        {"valid history 2", true, true, "uuid", "relUuid", "relUuid", "2004-02-27T00:00:00.000Z",
            null, true},
        {"valid history 3", true, true, "uuid", null, "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", true, "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", true},
        {"valid history 4", true, true, "uuid", "relUuid", "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", true, "relUuid", "2004-02-27T00:00:00.000Z", null, true},
        {"valid history 5", true, true, "uuid", null, "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T01:00:00.000Z", true, "pphUuid", "2004-02-27T01:00:00.000Z",
            "2004-02-27T02:00:00.000Z", true},
        {"valid history 6", true, true, "uuid", "relUuid", "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T01:00:00.000Z", true, "relUuid", "2004-02-27T01:00:00.000Z", null, true},
        // - very long history
        {"very long history 1", true, true, "uuid", null, "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", true, "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", true, "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", true, "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", true, "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", true, "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", true, "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", true, "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", true, "pphUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T01:00:00.000Z", true, "pphUuid", "2004-02-27T01:00:00.000Z",
            "2004-02-27T02:00:00.000Z", true, "pphUuid", "2004-02-27T03:00:00.000Z",
            "2004-02-27T04:00:00.000Z", true, "pphUuid", "2004-02-27T02:00:00.000Z",
            "2004-02-27T03:00:00.000Z", true},
        {"very long history 2", true, true, "uuid", "relUuid", "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", true, "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", true, "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", true, "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", true, "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", true, "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", true, "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", true, "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T00:00:00.000Z", true, "pphUuid",
            "2004-02-27T00:00:00.000Z", "2004-02-27T01:00:00.000Z", true, "pphUuid",
            "2004-02-27T01:00:00.000Z", "2004-02-27T02:00:00.000Z", true, "pphUuid",
            "2004-02-27T03:00:00.000Z", "2004-02-27T04:00:00.000Z", true, "pphUuid",
            "2004-02-27T02:00:00.000Z", "2004-02-27T03:00:00.000Z", true, "relUuid",
            "2004-02-27T04:00:00.000Z", null, true},
        {"history with overlap but ok for person because only one primary and different entities, not ok for position",
            true, false, "uuid", "relUuid", "pphUuid", "2004-01-01T00:00:00.000Z",
            "2004-01-29T00:00:00.000Z", false, "pphUuid2", "2004-01-15T00:00:00.000Z",
            "2004-01-17T00:00:00.000Z", false, "relUuid", "2004-02-27T00:00:00.000Z", null, true},
        {"history with overlap of non primary but same entity, not ok for both", false, false,
            "uuid", "relUuid", "pphUuid", "2004-01-01T00:00:00.000Z", "2004-01-29T00:00:00.000Z",
            true, "pphUuid", "2004-01-15T00:00:00.000Z", "2004-01-17T00:00:00.000Z", false,
            "relUuid", "2004-02-27T00:00:00.000Z", null, true},
        // end
    };

    validateHistory(testData, true);
    validateHistory(testData, false);
  }

  private void validateHistory(final Object[][] testData, final boolean checkPerson) {
    for (final Object[] testItem : testData) {
      final boolean isValid = checkPerson ? (boolean) testItem[1] : (boolean) testItem[2];
      final String uuid = (String) testItem[3];
      final String relationUuid = (String) testItem[4];
      final List<PersonPositionHistory> hist = new ArrayList<>();
      int i = 5;
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
        pph.setPrimary((boolean) testItem[i++]);
        hist.add(pph);
      }
      logger.debug("checking {} with checkPerson={}", Arrays.toString(testItem), checkPerson);
      try {
        ResourceUtils.validateHistoryInput(uuid, hist, checkPerson, relationUuid);
        if (!isValid) {
          fail("Expected a ResponseStatusException");
        }
      } catch (ResponseStatusException e) {
        if (isValid) {
          fail("Unexpected ResponseStatusException: " + e);
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
    assertThatNoException().isThrownBy(() -> assertAllowedClassification("public"));
  }

  @Test
  void shouldThrowResponseStatusExceptionForUnknownClassification() {
    assertThatThrownBy(() -> assertAllowedClassification("Totally public"))
        .isInstanceOf(ResponseStatusException.class)
        .hasMessage("400 BAD_REQUEST \"Classification is not allowed\"");
  }
}
