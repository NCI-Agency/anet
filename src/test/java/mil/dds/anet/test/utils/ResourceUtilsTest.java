package mil.dds.anet.test.utils;

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
import mil.dds.anet.utils.ResourceUtils;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ResourceUtilsTest {

  protected static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  @Test
  public void testValidateHistoryInput() {
    final Object[][] testData = new Object[][] {
        // Each item has:
        // { isValid, checkPerson, hasRelation, relationUuid, uuid, start time, end time, … }
        // - null uuid
        {false, true, false, null, null, "personel", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-28T00:00:00.000Z"},
        // - null startTime
        {false, true, true, "relPosUuid", "uuid", "uuid", "relPosUuid", null,
            "2004-02-28T00:00:00.000Z"},
        // - two null endTime's
        {false, true, true, "relPosUuid", "uuid", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            null, "uuid", "relPosUuid", "2004-02-27T00:00:00.000Z", null},
        // - endTime before startTime
        {false, true, true, "relPosUuid", "uuid", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-26T23:59:59.999Z"},
        // - overlap
        {false, true, false, null, "uuid", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T02:00:00.000Z", "uuid", "posUuid", "2004-02-27T01:00:00.000Z",
            "2004-02-27T03:00:00.000Z"},
        {false, true, true, "relPosUuid", "uuid", "uuid", "relPosUuid", "2004-02-27T00:00:00.000Z",
            null, "persUuid", "posUuid", "2004-02-27T01:00:00.000Z", "2004-02-27T03:00:00.000Z"},
        // - very long history with overlap
        {false, true, true, "relPosUuid", "uuid", "persUuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.001Z", "uuid", "relPosUuid", "2004-02-27T00:00:00.000Z", null},
        // - no history at all
        {true, true, false, null, "uuid"},
        // - valid history
        {true, true, true, "relPosUuid", "uuid", "uuid", "relPosUuid", "2004-02-27T00:00:00.000Z",
            null},
        {true, true, false, null, "uuid", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z"},
        {true, true, false, null, "uuid", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T01:00:00.000Z"},
        {true, true, false, null, "uuid", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z"},
        {true, true, false, null, "uuid", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T01:00:00.000Z", "uuid", "posUuid", "2004-02-27T01:00:00.000Z",
            "2004-02-27T02:00:00.000Z"},
        // - very long history
        {true, true, true, "relPosUuid", "uuid", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "posUuid", "2004-02-27T00:00:00.000Z",
            "2004-02-27T00:00:00.000Z", "uuid", "relPosUuid", "2004-02-27T00:00:00.000Z", null},
        // end
    };

    for (final Object[] testItem : testData) {
      int i = 0;
      final boolean isValid = (boolean) testItem[i++];
      final boolean checkPerson = (boolean) testItem[i++];
      final boolean hasRelation = (boolean) testItem[i++];
      final String relationUuid = (String) testItem[i++];
      final String uuid = (String) testItem[i++];
      final List<PersonPositionHistory> hist = new ArrayList<>();
      while (i < testItem.length) {
        final PersonPositionHistory pph = new PersonPositionHistory();
        final Person person = new Person();
        person.setUuid((String) testItem[i++]);
        pph.setPerson(person);

        final Position position = new Position();
        position.setUuid((String) testItem[i++]);
        pph.setPosition(position);
        pph.setStartTime(toInstant(testItem[i++]));
        pph.setEndTime(toInstant(testItem[i++]));
        hist.add(pph);
      }
      logger.debug("checking {}", Arrays.toString(testItem));
      try {
        ResourceUtils.validateHistoryInput(uuid, hist, checkPerson, hasRelation, relationUuid);
        if (!isValid) {
          fail("Expected a WebApplicationException");
        }
      } catch (WebApplicationException e) {
        if (isValid) {
          fail("Unexpected WebApplicationException");
        }
      }
    }
  }

  private Instant toInstant(final Object testDate) {
    return testDate == null ? null : Instant.parse((String) testDate);
  }
}
