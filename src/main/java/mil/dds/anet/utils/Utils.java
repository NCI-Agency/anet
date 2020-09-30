package mil.dds.anet.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.json.JsonSanitizer;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Consumer;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import javax.annotation.Nullable;
import javax.imageio.ImageIO;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.ApprovalStep.ApprovalStepType;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Task;
import mil.dds.anet.database.ApprovalStepDao;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.views.AbstractAnetBean;
import net.coobird.thumbnailator.Thumbnails;
import org.jsoup.Jsoup;
import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Utils {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
  private static final ObjectMapper mapper = MapperUtils.getDefaultMapper();

  /**
   * Crude method to check whether a uuid is purely integer, in which case it is probably a legacy
   * id; used for backwards-compatibility only.
   * 
   * @param uuid the uuid to check
   * @return the integer value of the uuid, or null if it isn't
   */
  public static Integer getInteger(String uuid) {
    try {
      return Integer.parseInt(uuid);
    } catch (NumberFormatException ignored) {
      return null;
    }
  }

  public static boolean uuidEqual(AbstractAnetBean a, AbstractAnetBean b) {
    if (a == null && b == null) {
      return true;
    }
    if (a == null || b == null) {
      return false;
    }
    return Objects.equals(a.getUuid(), b.getUuid());
  }

  public static boolean containsByUuid(List<AbstractAnetBean> list, String uuid) {
    for (AbstractAnetBean el : list) {
      if (el.getUuid().equals(uuid)) {
        return true;
      }
    }
    return false;
  }

  public static <T extends AbstractAnetBean> T getByUuid(List<T> list, String uuid) {
    return list.stream().filter(el -> Objects.equals(uuid, el.getUuid())).findFirst().orElse(null);
  }

  /*
   * Performs a diff of the two lists of elements For each element that is in newElements but is not
   * in oldElements it will call addFunc For each element that is in oldElements but is not in
   * newElements, it will call removeFunc
   */
  public static <T extends AbstractAnetBean> void addRemoveElementsByUuid(List<T> oldElements,
      List<T> newElements, Consumer<T> addFunc, Consumer<String> removeFunc) {
    List<String> existingUuids =
        oldElements.stream().map(p -> p.getUuid()).collect(Collectors.toList());
    for (T newEl : newElements) {
      if (existingUuids.remove(newEl.getUuid()) == false) {
        // Add this element
        addFunc.accept(newEl);
      }
    }

    // Now remove all items in existingUuids.
    for (String uuid : existingUuids) {
      removeFunc.accept(uuid);
    }
  }

  public static <T> T orIfNull(T value, T ifNull) {
    if (value == null) {
      return ifNull;
    } else {
      return value;
    }
  }

  /**
   * Given a list of organizations and a topParentUuid, this function maps all of the organizations
   * to their highest parent within this list excluding the topParent. This can be used to check for
   * loops, or to generate graphs/tables that bubble things up to their highest parent. This is used
   * in the daily rollup graphs.
   */
  public static Map<String, Organization> buildParentOrgMapping(List<Organization> orgs,
      @Nullable String topParentUuid) {
    final Map<String, Organization> result = new HashMap<>();
    final Map<String, Organization> orgMap = new HashMap<>();

    for (final Organization o : orgs) {
      orgMap.put(o.getUuid(), o);
    }

    for (final Organization o : orgs) {
      final Set<String> seenUuids = new HashSet<>();
      String curr = o.getUuid();
      seenUuids.add(curr);
      String parentUuid = o.getParentOrgUuid();
      while (!Objects.equals(parentUuid, topParentUuid) && orgMap.containsKey(parentUuid)) {
        curr = parentUuid;
        if (seenUuids.contains(curr)) {
          final String errorMsg = String.format(
              "Loop detected in organization hierarchy: %1$s is its own (grand…)parent!", curr);
          logger.error(errorMsg);
          throw new IllegalArgumentException(errorMsg);
        }
        seenUuids.add(curr);
        parentUuid = orgMap.get(parentUuid).getParentOrgUuid();
      }
      result.put(o.getUuid(), orgMap.get(curr));
    }

    return result;
  }

  /**
   * Given a list of tasks and a topParentUuid, this function maps all of the tasks to their highest
   * parent within this list excluding the topParent. This can be used to check for loops.
   */
  public static Map<String, Task> buildParentTaskMapping(List<Task> tasks,
      @Nullable String topParentUuid) {
    final Map<String, Task> result = new HashMap<>();
    final Map<String, Task> taskMap = new HashMap<>();

    for (final Task t : tasks) {
      taskMap.put(t.getUuid(), t);
    }

    for (final Task t : tasks) {
      final Set<String> seenUuids = new HashSet<>();
      String curr = t.getUuid();
      seenUuids.add(curr);
      String parentUuid = t.getCustomFieldRef1Uuid();
      while (!Objects.equals(parentUuid, topParentUuid) && taskMap.containsKey(parentUuid)) {
        curr = parentUuid;
        if (seenUuids.contains(curr)) {
          final String errorMsg = String
              .format("Loop detected in task hierarchy: %1$s is its own (grand…)parent!", curr);
          logger.error(errorMsg);
          throw new IllegalArgumentException(errorMsg);
        }
        seenUuids.add(curr);
        parentUuid = taskMap.get(parentUuid).getCustomFieldRef1Uuid();
      }
      result.put(t.getUuid(), taskMap.get(curr));
    }

    return result;
  }

  public static final PolicyFactory HTML_POLICY_DEFINITION = new HtmlPolicyBuilder()
      .allowStandardUrlProtocols()
      // Allow in-line image data
      .allowUrlProtocols("data").allowAttributes("src").matching(Pattern.compile("^data:image/.*$"))
      .onElements("img")
      // Allow some image attributes
      .allowAttributes("align", "alt", "border", "name", "height", "width", "hspace", "vspace")
      .onElements("img")
      // Allow title="..." on any element.
      .allowAttributes("title").globally()
      // Allow href="..." on <a> elements (but not the 'data:' protocol!).
      .allowAttributes("href").matching(Pattern.compile("^(?!data:).*$")).onElements("a")
      // Defeat link spammers.
      .requireRelNofollowOnLinks()
      // The align attribute on <p> elements can have any value below.
      .allowAttributes("align").matching(true, "center", "left", "right", "justify", "char")
      .onElements("p").allowAttributes("border", "cellpadding", "cellspacing").onElements("table")
      .allowAttributes("colspan", "rowspan").onElements("td", "th").allowStyling()
      // These elements are allowed.
      .allowElements("a", "p", "div", "i", "b", "u", "em", "blockquote", "tt", "strong", "br", "ul",
          "ol", "li", "table", "tr", "td", "thead", "tbody", "th", "span", "h1", "h2", "h3", "h4",
          "h5", "h6", "hr", "img", "strike", "mark")
      .toFactory();

  public static String sanitizeHtml(String input) {
    if (input == null) {
      return null;
    }
    return HTML_POLICY_DEFINITION.sanitize(input);
  }

  public static String sanitizeJson(String inputJson) throws JsonProcessingException {
    if (inputJson == null) {
      // `JsonSanitizer.sanitize(null)` would return `"null"` in this case,
      // but we prefer plain `null`
      return null;
    }
    final String sanitizedJson = JsonSanitizer.sanitize(inputJson);
    final JsonNode jsonTree = mapper.readTree(sanitizedJson);
    internalSanitizeJsonForHtml(jsonTree);
    return mapper.writeValueAsString(jsonTree);
  }

  private static void internalSanitizeJsonForHtml(JsonNode jsonNode) {
    if (jsonNode.isObject()) {
      final ObjectNode objectNode = (ObjectNode) jsonNode;
      for (final Iterator<Map.Entry<String, JsonNode>> entryIter = objectNode.fields(); entryIter
          .hasNext();) {
        final Map.Entry<String, JsonNode> entry = entryIter.next();
        final JsonNode newValue = entry.getValue().isTextual()
            ? objectNode.textNode(sanitizeHtml(entry.getValue().asText()))
            : entry.getValue();
        final String sanitizedKey = sanitizeHtml(entry.getKey());
        if (!entry.getKey().equals(sanitizedKey)) {
          objectNode.remove(entry.getKey());
        }
        objectNode.set(sanitizedKey, newValue);
        internalSanitizeJsonForHtml(entry.getValue());
      }
    } else if (jsonNode.isArray()) {
      final ArrayNode arrayNode = (ArrayNode) jsonNode;
      for (int i = 0; i < arrayNode.size(); i++) {
        if (arrayNode.get(i).isTextual()) {
          arrayNode.set(i, arrayNode.textNode(sanitizeHtml(arrayNode.get(i).asText())));
        } else {
          internalSanitizeJsonForHtml(arrayNode.get(i));
        }
      }
    }
  }

  public static String trimStringReturnNull(String input) {
    if (input == null) {
      return null;
    }
    return input.trim();
  }

  /**
   * Check for empty HTML.
   * 
   * @param s string
   * @return true if string renders to 'empty' HTML, i.e. just whitespace
   */
  public static boolean isEmptyHtml(String s) {
    return isEmptyOrNull(trimStringReturnNull(s))
        || isEmptyOrNull(trimStringReturnNull(htmlToText(s)));
  }

  private static String htmlToText(String s) {
    return Jsoup.parse(s).text();
  }

  /**
   * Check for empty or null string.
   * 
   * @param s string
   * @return true if string is null or empty
   */
  public static boolean isEmptyOrNull(String s) {
    return s == null || s.isEmpty();
  }

  /**
   * Check for empty or null collection.
   * 
   * @param c collection
   * @return true if collection is null or empty
   */
  public static boolean isEmptyOrNull(Collection<?> c) {
    return c == null || c.isEmpty();
  }

  /**
   * Transform a result list from a database query by grouping. For example, given a result list:
   * <code>
   * [{"uuid": 3, "name": "alice", "someprop": "x", "week": 39, "nrdone": 2, "nrtodo": 0},
   *  {"uuid": 3, "name": "alice", "someprop": "x", "week": 40, "nrdone": 1, "nrtodo": 3},
   *  {"uuid": 3, "name": "alice", "someprop": "x", "week": 41, "nrdone": 0, "nrtodo": 5},
   *  {"uuid": 5, "name": "bob",   "someprop": "y", "week": 39, "nrdone": 8, "nrtodo": 2},
   *  {"uuid": 5, "name": "bob",   "someprop": "y", "week": 41, "nrdone": 3, "nrtodo": 0},
   *  {"uuid": 6, "name": "eve",   "someprop": "z", "week": 39, "nrdone": 6, "nrtodo": 1}]
   * </code> then transforming it like so: <code>
   * final Set&lt;String&gt; tlf = Stream.of("name", "someprop").collect(Collectors.toSet());
   * return resultGrouper(list, "stats", "uuid", tlf);
   * </code> will return the list: <code>
   * [{"uuid": 3, "name": "alice", "someprop": "x",
   *    "stats": [{"week": 39, "nrdone": 2, "nrtodo": 0},
   *                    {"week": 40, "nrdone": 1, "nrtodo": 3},
   *                    {"week": 41, "nrdone": 0, "nrtodo": 5}]},
   *  {"uuid": 5, "name": "bob",   "someprop": "y",
   *    "stats": [{"week": 39, "nrdone": 8, "nrtodo": 2},
   *                    {"week": 41, "nrdone": 3, "nrtodo": 0}]},
   *  {"uuid": 6, "name": "eve",   "someprop": "z",
   *     "stats": [{"week": 39, "nrdone": 6, "nrtodo": 1}]}]
   * </code>
   *
   * @param results a result list from a database query
   * @param groupName the name of the group in the resulting list elements
   * @param groupingField the key field on which to group
   * @param topLevelFields the fields to appear in the top-level object (i.e. not in the group)
   * @return the grouped results from the query
   */
  public static List<Map<String, Object>> resultGrouper(List<Map<String, Object>> results,
      String groupName, String groupingField, Set<String> topLevelFields) {
    final List<Map<String, Object>> groupedResults = new ArrayList<>();
    final Map<Object, Map<String, Object>> seenResults = new HashMap<>();
    for (final Map<String, Object> result : results) {
      final Map<String, Object> topLevelObject;
      final Object groupingKey = result.get(groupingField);
      if (seenResults.containsKey(groupingKey)) {
        topLevelObject = seenResults.get(groupingKey);
      } else {
        topLevelObject = new HashMap<>();
        topLevelObject.put(groupingField, groupingKey);
        topLevelObject.put(groupName, new ArrayList<>());
        groupedResults.add(topLevelObject);
        seenResults.put(groupingKey, topLevelObject);
      }

      @SuppressWarnings("unchecked")
      final List<Map<String, Object>> groupList =
          (List<Map<String, Object>>) topLevelObject.get(groupName);
      final Map<String, Object> group = new HashMap<>();
      groupList.add(group);

      for (final Map.Entry<String, Object> entry : result.entrySet()) {
        if (groupingField.equals(entry.getKey())) {
          // already present
        } else if (topLevelFields.contains(entry.getKey())) {
          topLevelObject.put(entry.getKey(), entry.getValue());
        } else {
          group.put(entry.getKey(), entry.getValue());
        }
      }
    }
    return groupedResults;
  }

  /**
   * Checks whether an email address is allowed according to a list of whitelisted domains.
   * 
   * @param email The email address to check
   * @param whitelistDomainNames The list of whitelisted domain names (wildcards allowed)
   * @return Whether the email is whitelisted
   */
  public static boolean isEmailWhitelisted(final String email,
      final List<String> whitelistDomainNames) {
    try {
      return isLogonDomainInList(email, whitelistDomainNames);
    } catch (IllegalArgumentException e) {
      logger.error("Failed to process email: {}", email);
      return false;
    }
  }

  /**
   * Checks whether a domain user name is allowed according to a list of whitelisted domains.
   * 
   * More info: https://docs.microsoft.com/en-us/windows/win32/secauthn/user-name-formats
   * 
   * @param domainUserName The domain user name to check
   * @param ignoredDomainNames The list of ignored domain user names (wildcards allowed)
   * @return Whether the domain user name is ignored
   */
  public static boolean isDomainUserNameIgnored(final String domainUserName,
      final List<String> ignoredDomainNames) {
    try {
      return isLogonDomainInList(domainUserName, ignoredDomainNames);
    } catch (IllegalArgumentException e) {
      logger.error("Failed to process domain user name: {}", domainUserName);
      return true;
    }
  }

  private static boolean isLogonDomainInList(final String logon, final List<String> list)
      throws IllegalArgumentException {

    final String wildcard = "*";

    // Separator for 'User Principal Name' format
    final String upnSeparator = "@";

    // Separator for 'Down-Level Logon Name' format
    final String dlSeparator = "\\";

    if (isEmptyOrNull(logon) || isEmptyOrNull(list)) {
      return false;
    }

    // Logon has no domain
    if (!logon.contains(upnSeparator) && !logon.contains(dlSeparator)) {
      return false;
    }

    // Find out the format
    boolean isDownLevelFormat = logon.contains(dlSeparator);

    final String[] splittedLogon =
        logon.trim().split(isDownLevelFormat ? dlSeparator + "\\" : upnSeparator);

    // A logon (domain user name or email) is expected to have two parts: username<separator>domain
    if (splittedLogon.length != 2) {
      throw new IllegalArgumentException("Malformed logon: " + logon);
    }

    // Find the domain name depending on the format
    final String domainName =
        (isDownLevelFormat ? splittedLogon[0] : splittedLogon[1]).toLowerCase();

    // Compile a list of regex patterns we want to use to filter and then find any match
    return list.stream().map(domain -> domainToRegexPattern(domain, wildcard))
        .anyMatch(domainPattern -> domainPattern.matcher(domainName).matches());
  }

  private static Pattern domainToRegexPattern(final String domain, final String wildcard) {
    final String regex = domain.replace(".", "[.]") // replace dots
        .replace(wildcard, ".*?"); // replace wildcards
    return Pattern.compile("^" + regex + "$");
  }

  /**
   * Resizes an image.
   * 
   * @param imageBytes The image as a byte-array
   * @param width The desired output width
   * @param height The desired output height
   * @param imageFormatName The desired output format (png, jpg)
   * @return The resized image as a byte-array
   * @throws Exception When the binary data cannot be converted to an image string representation
   */
  public static byte[] resizeImage(byte[] imageBytes, int width, int height, String imageFormatName)
      throws Exception {
    if (imageBytes == null) {
      return null;
    }
    // From byte-array to BufferedImage
    final BufferedImage imageBinary = convert(imageBytes);

    if (imageBinary == null) {
      throw new Exception("Cannot interpret image binary data.");
    }

    // Resizing
    final ByteArrayOutputStream os = new ByteArrayOutputStream();
    Thumbnails.of(imageBinary).size(width, height).outputFormat(imageFormatName).outputQuality(1.0f)
        .toOutputStream(os);
    return os.toByteArray();
  }

  /**
   * Converts an image represented as a byte-array into a BufferedImage.
   * 
   * @param imageBytes The image as a byte-array
   * @return The BufferedImage object
   * @throws IOException When an error occurs while reading the string
   */
  public static BufferedImage convert(byte[] imageBytes) throws IOException {
    final ByteArrayInputStream is = new ByteArrayInputStream(imageBytes);
    return ImageIO.read(is);
  }

  /**
   * Converts a BufferedImage representing an image into a byte-array.
   * 
   * @param imageBytes The image as bytes
   * @param imageFormatName The desired output format
   * @return The image as byte-array
   * @throws IOException When an error occurs while writing the string
   */
  public static byte[] convert(BufferedImage imageBytes, String imageFormatName)
      throws IOException {
    final ByteArrayOutputStream os = new ByteArrayOutputStream();
    ImageIO.write(imageBytes, imageFormatName, os);
    return os.toByteArray();
  }

  public static void updateApprovalSteps(AbstractAnetBean entity,
      List<ApprovalStep> planningApprovalSteps, List<ApprovalStep> existingPlanningApprovalSteps,
      List<ApprovalStep> approvalSteps, List<ApprovalStep> existingApprovalSteps) {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();

    if (planningApprovalSteps != null) {
      logger.debug("Editing planning approval steps for {}", entity);
      for (ApprovalStep step : planningApprovalSteps) {
        Utils.validateApprovalStep(step);
        step.setType(ApprovalStepType.PLANNING_APPROVAL);
        step.setRelatedObjectUuid(entity.getUuid());
      }

      Utils.addRemoveElementsByUuid(existingPlanningApprovalSteps, planningApprovalSteps,
          newStep -> engine.getApprovalStepDao().insert(newStep),
          oldStepUuid -> engine.getApprovalStepDao().delete(oldStepUuid));

      Utils.updateSteps(planningApprovalSteps, existingPlanningApprovalSteps);
    }

    if (approvalSteps != null) {
      logger.debug("Editing approval steps for {}", entity);
      for (ApprovalStep step : approvalSteps) {
        Utils.validateApprovalStep(step);
        step.setType(ApprovalStepType.REPORT_APPROVAL);
        step.setRelatedObjectUuid(entity.getUuid());
      }

      Utils.addRemoveElementsByUuid(existingApprovalSteps, approvalSteps,
          newStep -> engine.getApprovalStepDao().insert(newStep),
          oldStepUuid -> engine.getApprovalStepDao().delete(oldStepUuid));

      Utils.updateSteps(approvalSteps, existingApprovalSteps);
    }
  }

  // Helper method that diffs the name/members of an approvalStep
  private static void updateStep(ApprovalStep newStep, ApprovalStep oldStep) {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final ApprovalStepDao approvalStepDao = engine.getApprovalStepDao();
    newStep.setUuid(oldStep.getUuid()); // Always want to make changes to the existing step
    approvalStepDao.update(newStep);

    if (newStep.getApprovers() != null) {
      Utils.addRemoveElementsByUuid(oldStep.loadApprovers(engine.getContext()).join(),
          newStep.getApprovers(),
          newPosition -> approvalStepDao.addApprover(newStep, DaoUtils.getUuid(newPosition)),
          oldPositionUuid -> approvalStepDao.removeApprover(newStep, oldPositionUuid));
    }
  }

  // Helper method that updates a list of approval steps
  private static void updateSteps(List<ApprovalStep> steps, List<ApprovalStep> existingSteps) {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final ApprovalStepDao approvalStepDao = engine.getApprovalStepDao();
    for (int i = 0; i < steps.size(); i++) {
      ApprovalStep curr = steps.get(i);
      ApprovalStep next = (i == (steps.size() - 1)) ? null : steps.get(i + 1);
      curr.setNextStepUuid(DaoUtils.getUuid(next));
      ApprovalStep existingStep = Utils.getByUuid(existingSteps, curr.getUuid());
      // If this step didn't exist before, we still need to set the nextStepUuid on it, but
      // don't need to do a deep update.
      if (existingStep == null) {
        approvalStepDao.update(curr);
      } else {
        // Check for updates to name, nextStepUuid and approvers.
        Utils.updateStep(curr, existingStep);
      }
    }
  }

  public static void validateApprovalStep(ApprovalStep step) {
    if (Utils.isEmptyOrNull(step.getName())) {
      throw new WebApplicationException("A name is required for every approval step",
          Status.BAD_REQUEST);
    }
    if (Utils.isEmptyOrNull(step.getApprovers())) {
      throw new WebApplicationException("An approver is required for every approval step",
          Status.BAD_REQUEST);
    }
  }

}
