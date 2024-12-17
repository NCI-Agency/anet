package mil.dds.anet.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import java.lang.invoke.MethodHandles;
import java.util.List;
import java.util.Map;
import java.util.Set;
import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.Note.NoteType;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.config.ApplicationContextProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class ResourceUtils {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  public static void validateHistoryInput(final String uuid,
      final List<PersonPositionHistory> previousPositions, final boolean checkPerson,
      final String relationUuid) {
    // Check if uuid is null
    if (uuid == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uuid cannot be null.");
    }

    if (Utils.isEmptyOrNull(previousPositions)) {
      if (relationUuid != null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "History should not be empty.");
      }
      return;
    }

    boolean seenNullEndTime = false;
    for (final PersonPositionHistory pph : previousPositions) {
      // Check if start time is null
      if (pph.getStartTime() == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start time cannot be empty.");
      }

      if (pph.getEndTime() == null) {
        // Check if end time is null more than once
        if (seenNullEndTime) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
              "There cannot be more than one history entry without an end time.");
        }
        if (relationUuid == null) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
              "History entry must have an end time.");
        } else {
          final String uuidToCheck =
              DaoUtils.getUuid(checkPerson ? pph.getPosition() : pph.getPerson());
          final String message =
              checkPerson ? "Last history entry must be identical to person's current position."
                  : "Last history entry must be identical to position's current person.";
          if (!relationUuid.equals(uuidToCheck)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
          }
        }
        seenNullEndTime = true;
      } else {
        // Check if end time is before start time
        if (pph.getEndTime().isBefore(pph.getStartTime())) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
              "End time cannot before start time.");
        }
      }
    }

    // If has relation and there is no last entry in history
    if (relationUuid != null && !seenNullEndTime) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "There should be a history entry without an end time.");
    }

    // Check for conflicts
    final int historySize = previousPositions.size();
    for (int i = 0; i < historySize; i++) {
      final PersonPositionHistory pph = previousPositions.get(i);
      for (int j = i + 1; j < historySize; j++) {
        if (overlap(pph, previousPositions.get(j))) {
          throw new ResponseStatusException(HttpStatus.CONFLICT,
              "History entries should not overlap.");
        }
      }
    }
  }

  private static boolean overlap(final PersonPositionHistory pph1,
      final PersonPositionHistory pph2) {
    if (pph1.getEndTime() == null) {
      return pph2.getEndTime().isAfter(pph1.getStartTime());
    }
    if (pph2.getEndTime() == null) {
      return pph1.getEndTime().isAfter(pph2.getStartTime());
    }
    return pph2.getStartTime().isBefore(pph1.getEndTime())
        && pph2.getEndTime().isAfter(pph1.getStartTime());
  }

  public static void checkAndFixNote(final Note n) {
    checkAndFixText(n);
    checkNoteRelatedObjects(n);
  }

  private static void checkAndFixText(final Note n) {
    if (n.getText() == null || n.getText().trim().isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Note text must not be empty");
    }
    sanitizeText(n);
  }

  private static void sanitizeText(final Note n) {
    if (NoteType.FREE_TEXT.equals(n.getType())) {
      n.setText(Utils.isEmptyHtml(n.getText()) ? null : Utils.sanitizeHtml(n.getText()));
    } else {
      try {
        n.setText(Utils.sanitizeJson(n.getText()));
      } catch (JsonProcessingException e) {
        n.setText(null);
        logger.error("Unable to process Json, payload discarded", e);
      }
    }
  }

  private static void checkNoteRelatedObjects(final Note n) {
    if (Utils.isEmptyOrNull(n.getNoteRelatedObjects())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Note must have related objects");
    }
  }

  @SuppressWarnings("unchecked")
  public static Set<String> getAllowedClassifications() {
    return ((Map<String, Object>) ApplicationContextProvider.getDictionary()
        .getDictionaryEntry("confidentialityLabel.choices")).keySet();
  }

  public static void assertAllowedClassification(final String classificationKey) {
    if (classificationKey != null) {
      // if the classification is set, check if it is valid
      final var allowedClassifications = getAllowedClassifications();
      if (!allowedClassifications.contains(classificationKey)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Classification is not allowed");
      }
    }
  }
}
