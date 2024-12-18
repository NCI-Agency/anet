package mil.dds.anet.beans;

import java.util.List;
import java.util.Map;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.utils.Utils;

public record ConfidentialityRecord(
    String policy, String classification, List<String> releasableTo) {

  public static ConfidentialityRecord create(AnetDictionary dict, String choice) {
    final var classificationChoice = getConfidentialityLabelForChoice(dict, choice);
    return (classificationChoice == null)
        ? null
        : ConfidentialityRecord.create(classificationChoice);
  }

  public static ConfidentialityRecord create(
      AnetDictionary dict, ConfidentialityRecord defaultConfidentiality, Report report) {
    final var reportClassification = create(dict, report.getClassification());
    return reportClassification == null ? defaultConfidentiality : reportClassification;
  }

  public static ConfidentialityRecord create(Map<String, Object> classificationChoice) {
    final var policy = (String) classificationChoice.get("policy");
    final var classification = (String) classificationChoice.get("classification");
    @SuppressWarnings("unchecked")
    final var releasableTo = (List<String>) classificationChoice.get("releasableTo");
    return new ConfidentialityRecord(
        toUpper(policy), toUpper(classification), toUpper(releasableTo));
  }

  public static Map<String, Object> getConfidentialityLabelForChoice(
      AnetDictionary dict, String choice) {
    @SuppressWarnings("unchecked")
    final Map<String, Map<String, Object>> classificationChoices =
        (Map<String, Map<String, Object>>) dict.getDictionaryEntry("confidentialityLabel.choices");
    return classificationChoices.get(choice);
  }

  private static String toUpper(String s) {
    return s == null ? null : s.toUpperCase();
  }

  private static List<String> toUpper(List<String> s) {
    return s == null ? null : s.stream().map(String::toUpperCase).toList();
  }

  @Override
  public String toString() {
    final var sb = new StringBuilder();
    if (policy != null) {
      sb.append(policy);
      if (classification != null) {
        sb.append(" ").append(classification);
      }
      if (!Utils.isEmptyOrNull(releasableTo)) {
        sb.append(" Releasable to ").append(String.join(", ", releasableTo));
      }
    }
    return sb.toString();
  }

}
