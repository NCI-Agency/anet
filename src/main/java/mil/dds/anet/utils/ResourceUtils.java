package mil.dds.anet.utils;

import java.time.Instant;
import java.util.List;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.beans.PersonPositionHistory;

public class ResourceUtils {
  private static final String TIME_CONFLICT_ERROR_TEXT =
      "At least one of the positions in the history is occupied for the specified period.";

  public static void validateHistoryInput(String uuid,
      List<PersonPositionHistory> previousPositions) {
    // Control if uuid is null
    if (uuid == null) {
      throw new WebApplicationException("Uuid of person cannot be null.", Status.BAD_REQUEST);
    }

    int nullCounterForEndTime = 0;
    final int historySize = previousPositions.size();
    for (int i = 0; i < historySize; i++) {
      final PersonPositionHistory hist = previousPositions.get(i);
      if (hist.getStartTime() == null) {
        throw new WebApplicationException("Start time cannot be null.", Status.BAD_REQUEST);
      }

      /*
       * Control if end time is null more then once or not And Control for conflicts if end time is
       * regularly null
       */
      if (hist.getEndTime() == null) {
        if (nullCounterForEndTime > 0) {
          throw new WebApplicationException("There cannot be two value of null for end time.",
              Status.BAD_REQUEST);
        }
        for (int j = i + 1; j < historySize - 1; j++) {
          PersonPositionHistory innerPositionHistory = previousPositions.get(j);
          if (innerPositionHistory.getEndTime() == null) {
            throw new WebApplicationException(TIME_CONFLICT_ERROR_TEXT, Status.CONFLICT);
          } else if (hist.getStartTime().isBefore(innerPositionHistory.getEndTime())) {
            throw new WebApplicationException(TIME_CONFLICT_ERROR_TEXT, Status.CONFLICT);
          }
        }
        nullCounterForEndTime++;
      } else {
        // Control if start time is after end time or not
        if (hist.getEndTime().isBefore(hist.getStartTime())) {
          throw new WebApplicationException("End time cannot before start time.",
              Status.BAD_REQUEST);
        }
        // Control time intervals for conflicts
        for (int k = i + 1; k < historySize - 1; k++) {
          final PersonPositionHistory innerPositionHistory = previousPositions.get(k);
          if (innerPositionHistory.getEndTime() == null) {
            if (innerPositionHistory.getStartTime().isBefore(hist.getEndTime())) {
              throw new WebApplicationException(TIME_CONFLICT_ERROR_TEXT, Status.CONFLICT);
            }
          } else if (haveInstantsConflict(hist.getStartTime(), hist.getEndTime(),
              innerPositionHistory.getStartTime(), innerPositionHistory.getEndTime())) {
            throw new WebApplicationException(TIME_CONFLICT_ERROR_TEXT, Status.CONFLICT);
          }
        }

      }
    }
  }

  public static boolean haveInstantsConflict(Instant start1, Instant end1, Instant start2,
      Instant end2) {
    return isInstantBetween(start1, start2, end2) || isInstantBetween(end1, start2, end2)
        || isInstantBetween(start2, start1, end1) || isInstantBetween(end2, start1, end1);
  }

  public static boolean isInstantBetween(Instant dateTime, Instant startTime, Instant endTime) {
    return dateTime.isBefore(endTime) && dateTime.isAfter(startTime);
  }
}
