package mil.dds.anet.utils;

import java.lang.invoke.MethodHandles;
import java.util.List;
import java.util.Map;
import java.util.Set;
import mil.dds.anet.beans.Assessment;
import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.config.ApplicationContextProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.JacksonException;

public class ResourceUtils {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  public static void validateHistoryInput(final String personUuid,
      final List<PersonPositionHistory> previousPositions, final boolean checkPerson,
      final String personCurrentPrimaryPositionUUid) {
    // Check if personUuid is null
    if (personUuid == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Person Uuid cannot be null.");
    }
    // If there is a current primary position for this person there has to be history
    if (Utils.isEmptyOrNull(previousPositions)) {
      if (personCurrentPrimaryPositionUUid != null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "History should not be empty.");
      }
      // No previous positions do nothing
      return;
    }

    boolean seenPrimaryPositionNullEndTime = false;
    for (final PersonPositionHistory pph : previousPositions) {
      // Check if start time is null
      if (pph.getStartTime() == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start time cannot be empty.");
      }

      // Check start time and end time make sense
      if (pph.getEndTime() != null && pph.getEndTime().isBefore(pph.getStartTime())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "End time cannot before start time.");
      }

      // These checks apply for primary positions
      if (Boolean.TRUE.equals(pph.getPrimary()) && pph.getEndTime() == null) {

        // Check if end time is null more than once
        if (seenPrimaryPositionNullEndTime) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
              "There cannot be more than one primary position history entry without an end time.");
        }

        if (personCurrentPrimaryPositionUUid == null) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
              "Based on history there must be a current primary position");
        } else {
          final String uuidToCheck =
              DaoUtils.getUuid(checkPerson ? pph.getPosition() : pph.getPerson());
          final String message = checkPerson
              ? "Last primary position history entry must be identical to person's current primary position."
              : "Last primary position history entry must be identical to position's current person.";
          if (!personCurrentPrimaryPositionUUid.equals(uuidToCheck)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
          }
        }

        seenPrimaryPositionNullEndTime = true;
      }
    }

    // If has relation and there is no last entry in history
    if (personCurrentPrimaryPositionUUid != null && !seenPrimaryPositionNullEndTime) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "There should be a primary position history entry without an end time.");
    }

    // Check for conflicts in primary positions
    final List<PersonPositionHistory> primaryPositions =
        previousPositions.stream().filter(pp -> Boolean.TRUE.equals(pp.getPrimary())).toList();
    final int historySize = primaryPositions.size();
    for (int i = 0; i < historySize; i++) {
      final PersonPositionHistory pph = primaryPositions.get(i);
      for (int j = i + 1; j < historySize; j++) {
        if (overlap(pph, primaryPositions.get(j))) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
              "Primary Positions History entries should not overlap.");
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

  public static void checkAndFixAssessment(final Assessment a) {
    checkAndFixText(a);
    checkAssessmentRelatedObjects(a);
  }

  private static void checkAndFixText(final Assessment a) {
    if (a.getAssessmentValues() == null || a.getAssessmentValues().trim().isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Assessment values must not be empty");
    }

    try {
      a.setAssessmentValues(
          Utils.sanitizeJson(a.getAssessmentKey(), a.getAssessmentValues(), true));
    } catch (JacksonException e) {
      a.setAssessmentValues(null);
      logger.error("Unable to process Json, payload discarded", e);
    }
  }

  private static void checkAssessmentRelatedObjects(final Assessment a) {
    if (Utils.isEmptyOrNull(a.getAssessmentRelatedObjects())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Assessment must have related objects");
    }
  }

  public static void checkAndFixNote(final Note n) {
    checkAndFixText(n);
    checkNoteRelatedObjects(n);
  }

  private static void checkAndFixText(final Note n) {
    if (n.getText() == null || n.getText().trim().isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Note text must not be empty");
    }

    n.setText(Utils.isEmptyHtml(n.getText()) ? null : Utils.sanitizeHtml(n.getText()));
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
