package mil.dds.anet.utils;

import java.util.List;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.beans.PersonPositionHistory;

public class ResourceUtils {

  private static final String TIME_CONFLICT_ERROR_TEXT =
      "At least one of the positions in the history is occupied for the specified period.";

  public static void validateHistoryInput(final String uuid,
      final List<PersonPositionHistory> previousPositions, final boolean checkPerson,
      final boolean hasRelation, final String relationUuid) {
    // Check if uuid is null
    if (uuid == null) {
      throw new WebApplicationException("Uuid cannot be null.", Status.BAD_REQUEST);
    }

    boolean seenNullEndTime = false;
    for (final PersonPositionHistory pph : previousPositions) {
      // Check if start time is null
      if (pph.getStartTime() == null) {
        throw new WebApplicationException("Start time cannot be empty.", Status.BAD_REQUEST);
      }

      if (pph.getEndTime() == null) {
        // Check if end time is null more than once
        if (seenNullEndTime || !hasRelation) {
          throw new WebApplicationException(
              "There cannot be more than one history entry without an end time.",
              Status.BAD_REQUEST);
        }
        if (checkPerson) {
          if (!pph.getPosition().getUuid().equals(relationUuid)) {
            throw new WebApplicationException("History must be compatible with person's relation.",
                Status.BAD_REQUEST);
          }
        } else {
          if (!pph.getPerson().getUuid().equals(relationUuid)) {
            throw new WebApplicationException(
                "History must be compatible with positions's relation.", Status.BAD_REQUEST);
          }
        }
        seenNullEndTime = true;
      } else {
        // Check if end time is before start time
        if (pph.getEndTime().isBefore(pph.getStartTime())) {
          throw new WebApplicationException("End time cannot before start time.",
              Status.BAD_REQUEST);
        }
      }
    }
    // if has relation and there is no entry in pph
    if (hasRelation && !seenNullEndTime) {
      throw new WebApplicationException(
          "There cannot be more than one history entry without an end time.", Status.BAD_REQUEST);
    }

    // Check for conflicts
    final int historySize = previousPositions.size();
    for (int i = 0; i < historySize; i++) {
      final PersonPositionHistory pph = previousPositions.get(i);
      for (int j = i + 1; j < historySize; j++) {
        if (overlap(pph, previousPositions.get(j))) {
          throw new WebApplicationException(TIME_CONFLICT_ERROR_TEXT, Status.CONFLICT);
        }
      }
    }
  }

  private static boolean overlap(final PersonPositionHistory pph1,
      final PersonPositionHistory pph2) {
    if (pph1.getEndTime() == null) {
      return overlapNullEndTime(pph1, pph2);
    }
    if (pph2.getEndTime() == null) {
      return overlapNullEndTime(pph2, pph1);
    }
    return pph2.getStartTime().isBefore(pph1.getEndTime())
        && pph2.getEndTime().isAfter(pph1.getStartTime());
  }

  private static boolean overlapNullEndTime(final PersonPositionHistory pph1,
      final PersonPositionHistory pph2) {
    return pph1.getEndTime() == null
        && (pph2.getEndTime() == null || pph2.getEndTime().isAfter(pph1.getStartTime()));
  }
}
