package mil.dds.anet.utils;

import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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

  public static void validateHistoryInput(final String entityUuid,
      final List<PersonPositionHistory> personPositionHistory,
      final boolean isCheckingPersonHistory, final String currentEntityInHistoryUuid) {

    // There has to be either a personUuid or positionUuid
    if (entityUuid == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Person/Position Uuid cannot be null.");
    }
    // If there is a current entity there has to be history
    if (Utils.isEmptyOrNull(personPositionHistory)) {
      if (currentEntityInHistoryUuid != null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "History should not be empty.");
      }
    } else {
      // Check history
      validateHistory(personPositionHistory, currentEntityInHistoryUuid, isCheckingPersonHistory);
    }
  }

  private static void validateHistory(List<PersonPositionHistory> personPositionHistory,
      String currentEntityInHistoryUuid, boolean isCheckingPersonHistory) {
    // Sort by start time
    personPositionHistory.sort(Comparator.comparing(PersonPositionHistory::getStartTime,
        Comparator.nullsFirst(Comparator.naturalOrder())));
    int countCurrentPrimaryPositions = 0;
    String latestEntityInHistoryUuid = null;
    for (int i = 0; i < personPositionHistory.size(); i++) {
      PersonPositionHistory current = personPositionHistory.get(i);
      Instant start = current.getStartTime();
      Instant end = current.getEndTime();

      // Check start not null
      if (start == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start time cannot be empty.");
      }

      // Check start <= end
      if (end != null && start.isAfter(end)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date range in entry.");
      }

      for (int j = 0; j < i; j++) {
        PersonPositionHistory other = personPositionHistory.get(j);

        if (!isOverlapAllowed(isCheckingPersonHistory, current, other) && overlap(current, other)) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
              "History entries should not overlap.");
        }
      }
      // Update counters
      if (Boolean.TRUE.equals(current.getPrimary()) && current.getEndTime() == null) {
        countCurrentPrimaryPositions++;
      }
      if (isCheckingPersonHistory && Boolean.TRUE.equals(current.getPrimary())) {
        latestEntityInHistoryUuid = current.getPositionUuid();
      } else {
        latestEntityInHistoryUuid = current.getPersonUuid();
      }
    }

    // Specific checks for person history
    if (isCheckingPersonHistory && countCurrentPrimaryPositions == 0
        && currentEntityInHistoryUuid != null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "There should be a primary position history entry without an end time.");
    }
    if (isCheckingPersonHistory && countCurrentPrimaryPositions > 1) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "There cannot be more than one primary position history entry without an end time.");
    }

    // Check for both person and position history
    if (latestEntityInHistoryUuid != null && currentEntityInHistoryUuid != null
        && !latestEntityInHistoryUuid.equals(currentEntityInHistoryUuid)) {
      final String message = isCheckingPersonHistory
          ? "Last primary position history entry must be identical to person's current primary position."
          : "Last primary position history entry must be identical to position's current person.";
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
  }

  private static boolean isOverlapAllowed(boolean isCheckingPersonHistory, PersonPositionHistory a,
      PersonPositionHistory b) {
    if (!isCheckingPersonHistory) {
      // Now overlaps allowed if checking position history
      return false;
    }
    boolean bothPrimary =
        Boolean.TRUE.equals(a.getPrimary()) && Boolean.TRUE.equals(b.getPrimary());
    boolean samePosition = Objects.equals(a.getPositionUuid(), b.getPositionUuid());

    return !(bothPrimary || samePosition);
  }

  private static boolean overlap(final PersonPositionHistory pph1,
      final PersonPositionHistory pph2) {
    Instant aStart = pph1.getStartTime();
    Instant bStart = pph2.getStartTime();

    Instant aEnd = pph1.getEndTime() != null ? pph1.getEndTime() : Instant.MAX;
    Instant bEnd = pph2.getEndTime() != null ? pph2.getEndTime() : Instant.MAX;

    return aStart.isBefore(bEnd) && bStart.isBefore(aEnd);
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
