package mil.dds.anet.utils;

import static mil.dds.anet.AnetApplication.FREEMARKER_VERSION;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.json.JsonSanitizer;
import freemarker.template.Configuration;
import freemarker.template.DefaultObjectWrapperBuilder;
import io.leangen.graphql.execution.ResolutionEnvironment;
import jakarta.annotation.Nullable;
import java.lang.invoke.MethodHandles;
import java.nio.charset.StandardCharsets;
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
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.ApprovalStep.ApprovalStepType;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Task;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.ApprovalStepDao;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.views.AbstractAnetBean;
import org.jsoup.Jsoup;
import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

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

  public static <T extends AbstractAnetBean> T getByUuid(List<T> list, String uuid) {
    return list.stream().filter(el -> Objects.equals(uuid, el.getUuid())).findFirst().orElse(null);
  }

  /*
   * Performs a diff of the two lists of elements. For each element that is in newElements but is
   * not in oldElements it will call addFunc. For each element that is in oldElements but is not in
   * newElements, it will call removeFunc. For each element that is in both oldElements and
   * newElements, it will call updateFunc (if set).
   */
  public static <T extends AbstractAnetBean> void updateElementsByKey(List<T> oldElements,
      List<T> newElements, Function<T, String> getKey, Consumer<T> addFunc, Consumer<T> removeFunc,
      Consumer<T> updateFunc) {
    final Map<String, T> existingElementsByKey =
        oldElements.stream().collect(Collectors.toMap(getKey, Function.identity()));
    for (final T newElement : newElements) {
      if (existingElementsByKey.remove(getKey.apply(newElement)) != null) {
        // Update existing element (optional)
        if (updateFunc != null) {
          updateFunc.accept(newElement);
        }
      } else {
        // Add this new element
        addFunc.accept(newElement);
      }
    }

    // Finally remove all items remaining in existingUuids
    for (final T oldElement : existingElementsByKey.values()) {
      removeFunc.accept(oldElement);
    }
  }

  public static <T extends AbstractAnetBean> void updateElementsByUuid(List<T> oldElements,
      List<T> newElements, Consumer<T> addFunc, Consumer<T> removeFunc, Consumer<T> updateFunc) {
    updateElementsByKey(oldElements, newElements, T::getUuid, addFunc, removeFunc, updateFunc);
  }

  public static <T extends AbstractAnetBean> void addRemoveElementsByUuid(List<T> oldElements,
      List<T> newElements, Consumer<T> addFunc, Consumer<T> removeFunc) {
    updateElementsByUuid(oldElements, newElements, addFunc, removeFunc, null);
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
  public static Map<String, String> buildParentOrgMapping(List<Organization> orgs,
      @Nullable String topParentUuid) {
    // Can't use Collectors.toMap as parent may be null
    final Map<String, String> orgMap = orgs.stream().collect(HashMap::new,
        (m, v) -> m.put(v.getUuid(), v.getParentOrgUuid()), HashMap::putAll);
    return buildParentMapping(orgMap, topParentUuid);
  }

  public static Map<String, Organization> buildOrgToParentOrgMapping(List<Organization> orgs,
      @Nullable String topParentUuid) {
    final Map<String, Organization> orgToOrgMap =
        orgs.stream().collect(Collectors.toMap(Organization::getUuid, Function.identity()));
    // Can't use Collectors.toMap as parent may be null
    final Map<String, String> orgMap = orgs.stream().collect(HashMap::new,
        (m, v) -> m.put(v.getUuid(), v.getParentOrgUuid()), HashMap::putAll);
    final Map<String, String> orgParentMap = buildParentMapping(orgMap, topParentUuid);
    // Can't use Collectors.toMap as parent may be null
    return orgs.stream().collect(HashMap::new,
        (m, v) -> m.put(v.getUuid(), orgToOrgMap.get(orgParentMap.get(v.getUuid()))),
        HashMap::putAll);
  }

  /**
   * Given a list of tasks and a topParentUuid, this function maps all of the tasks to their highest
   * parent within this list excluding the topParent. This can be used to check for loops.
   */
  public static Map<String, String> buildParentTaskMapping(List<Task> tasks,
      @Nullable String topParentUuid) {
    // Can't use Collectors.toMap as parent may be null
    final Map<String, String> taskMap = tasks.stream().collect(HashMap::new,
        (m, v) -> m.put(v.getUuid(), v.getParentTaskUuid()), HashMap::putAll);
    return buildParentMapping(taskMap, topParentUuid);
  }

  private static Map<String, String> buildParentMapping(Map<String, String> uuidToParentUuidMap,
      @Nullable String topParentUuid) {
    final Map<String, String> result = new HashMap<>();

    for (final Map.Entry<String, String> e : uuidToParentUuidMap.entrySet()) {
      final Set<String> seenUuids = new HashSet<>();
      seenUuids.add(e.getKey());
      final String topLevelParent =
          uuidToParentUuidMap.get(recursivelyDetermineParent(uuidToParentUuidMap, topParentUuid,
              e.getKey(), e.getValue(), seenUuids));
      result.put(e.getKey(), topLevelParent);
    }

    return result;
  }

  private static String recursivelyDetermineParent(Map<String, String> uuidToParentUuidMap,
      @Nullable String topParentUuid, String uuid, String parentUuid, Set<String> seenUuids) {
    if (!Objects.equals(parentUuid, topParentUuid) && uuidToParentUuidMap.containsKey(parentUuid)) {
      if (seenUuids.contains(parentUuid)) {
        final String errorMsg = String
            .format("Loop detected in hierarchy: %1$s is its own (grand…)parent!", parentUuid);
        logger.error(errorMsg);
        throw new IllegalArgumentException(errorMsg);
      }
      seenUuids.add(parentUuid);
      return recursivelyDetermineParent(uuidToParentUuidMap, topParentUuid, parentUuid,
          uuidToParentUuidMap.get(parentUuid), seenUuids);
    }
    return uuid;
  }

  /**
   * Given a list of locations and a topParentUuid, this function maps all of the locations to their
   * highest parent within this list excluding the topParent. This can be used to check for loops.
   */
  public static Map<String, Set<String>> buildParentLocationMapping(List<Location> locations,
      @Nullable String topParentUuid) {
    // Can't use Collectors.toMap as parents may be null
    final Map<String, Set<String>> locationMap =
        locations.stream().collect(HashMap::new, (m, v) -> {
          if (Utils.isEmptyOrNull(v.getParentLocations())) {
            m.put(v.getUuid(), null);
          } else {
            m.put(v.getUuid(),
                v.getParentLocations().stream().map(Location::getUuid).collect(Collectors.toSet()));
          }
        }, HashMap::putAll);
    return buildParentsMapping(locationMap, topParentUuid);
  }

  private static Map<String, Set<String>> buildParentsMapping(
      Map<String, Set<String>> uuidToParentUuidsMap, @Nullable String topParentUuid) {
    final Map<String, Set<String>> result = new HashMap<>();

    for (final Map.Entry<String, Set<String>> e : uuidToParentUuidsMap.entrySet()) {
      final Set<String> seenUuids = new HashSet<>();
      seenUuids.add(e.getKey());
      final Set<String> topLevelParents = recursivelyDetermineParentsFromSet(uuidToParentUuidsMap,
          topParentUuid, e.getKey(), e.getValue(), seenUuids).stream()
          .map(uuidToParentUuidsMap::get).flatMap(Collection::stream).collect(Collectors.toSet());
      result.put(e.getKey(), topLevelParents);
    }

    return result;
  }

  private static Set<String> recursivelyDetermineParentsFromSet(
      Map<String, Set<String>> uuidToParentUuidsMap, @Nullable String topParentUuid, String uuid,
      Set<String> parentUuids, Set<String> seenUuids) {
    if (Utils.isEmptyOrNull(parentUuids)) {
      return Set.of();
    } else {
      return parentUuids.stream()
          .map(parentUuid -> recursivelyDetermineParentsFromUuid(uuidToParentUuidsMap,
              topParentUuid, uuid, parentUuid, seenUuids))
          .flatMap(Collection::stream).collect(Collectors.toSet());
    }
  }

  private static Set<String> recursivelyDetermineParentsFromUuid(
      Map<String, Set<String>> uuidToParentUuidsMap, @Nullable String topParentUuid, String uuid,
      String parentUuid, Set<String> seenUuids) {
    if (!Objects.equals(parentUuid, topParentUuid)
        && uuidToParentUuidsMap.containsKey(parentUuid)) {
      if (seenUuids.contains(parentUuid)) {
        final String errorMsg = String
            .format("Loop detected in hierarchy: %1$s is its own (grand…)parent!", parentUuid);
        logger.error(errorMsg);
        throw new IllegalArgumentException(errorMsg);
      }
      seenUuids.add(parentUuid);
      return recursivelyDetermineParentsFromSet(uuidToParentUuidsMap, topParentUuid, parentUuid,
          uuidToParentUuidsMap.get(parentUuid), seenUuids);
    }
    return Set.of(uuid);
  }

  public static final PolicyFactory HTML_POLICY_DEFINITION = new HtmlPolicyBuilder()
      .allowStandardUrlProtocols()
      // Allow ANET links like "urn:anet:people:uuid"
      .allowUrlProtocols("urn")
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

  public static JsonNode parseJsonSafe(String inputJson) throws JsonProcessingException {
    final String sanitizedJson = Utils.sanitizeJson(inputJson);
    return sanitizedJson == null ? null : mapper.readTree(sanitizedJson);
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
   * Checks whether an email address is allowed according to a list of allowed domains.
   * 
   * @param email The email address to check
   * @param allowedDomainNames The list of allowed domain names (wildcards allowed)
   * @return Whether the email is allowed
   */
  public static boolean isEmailAllowed(final String email, final List<String> allowedDomainNames) {
    try {
      return isEmailDomainInList(email, allowedDomainNames);
    } catch (IllegalArgumentException e) {
      logger.error("Failed to process email: {}", email);
      return false;
    }
  }

  /**
   * Checks whether an email address is ignored according to a list of ignored domains.
   * 
   * @param email The email address to check
   * @param ignoredDomainNames The list of ignored domain names (wildcards allowed)
   * @return Whether the email is ignored
   */
  public static boolean isEmailIgnored(final String email, final List<String> ignoredDomainNames) {
    try {
      return isEmailDomainInList(email, ignoredDomainNames);
    } catch (IllegalArgumentException e) {
      logger.error("Failed to process email: {}", email);
      return true;
    }
  }

  private static boolean isEmailDomainInList(final String email, final List<String> list)
      throws IllegalArgumentException {
    if (isEmptyOrNull(email) || isEmptyOrNull(list)) {
      return false;
    }

    final String domainSeparator = "@";
    if (!email.contains(domainSeparator)) {
      // Email has no domain
      return false;
    }

    final String[] splittedEmail = email.trim().split(domainSeparator);
    if (splittedEmail.length != 2) {
      // Email is expected to have two parts: username@domain
      throw new IllegalArgumentException("Malformed email: " + email);
    }

    // Find the domain name
    final String domainName = splittedEmail[1].toLowerCase();

    // Compile a list of regex patterns we want to use to filter and then find any match
    final String wildcard = "*";
    return list.stream().map(domain -> domainToRegexPattern(domain, wildcard))
        .anyMatch(domainPattern -> domainPattern.matcher(domainName).matches());
  }

  private static Pattern domainToRegexPattern(final String domain, final String wildcard) {
    final String regex = domain.replace(".", "[.]") // replace dots
        .replace(wildcard, ".*?"); // replace wildcards
    return Pattern.compile("^" + regex + "$");
  }

  public static void updateApprovalSteps(AbstractAnetBean entity,
      List<ApprovalStep> planningApprovalSteps, List<ApprovalStep> existingPlanningApprovalSteps,
      List<ApprovalStep> approvalSteps, List<ApprovalStep> existingApprovalSteps) {
    final AnetObjectEngine engine = ApplicationContextProvider.getEngine();

    if (planningApprovalSteps != null) {
      logger.debug("Editing planning approval steps for {}", entity);
      for (ApprovalStep step : planningApprovalSteps) {
        Utils.validateApprovalStep(step);
        step.setType(ApprovalStepType.PLANNING_APPROVAL);
        step.setRelatedObjectUuid(entity.getUuid());
      }

      Utils.addRemoveElementsByUuid(existingPlanningApprovalSteps, planningApprovalSteps,
          newStep -> engine.getApprovalStepDao().insert(newStep),
          oldStep -> engine.getApprovalStepDao().delete(DaoUtils.getUuid(oldStep)));

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
          oldStep -> engine.getApprovalStepDao().delete(DaoUtils.getUuid(oldStep)));

      Utils.updateSteps(approvalSteps, existingApprovalSteps);
    }
  }

  // Helper method that diffs the name/members of an approvalStep
  private static void updateStep(ApprovalStep newStep, ApprovalStep oldStep) {
    final AnetObjectEngine engine = ApplicationContextProvider.getEngine();
    final ApprovalStepDao approvalStepDao = engine.getApprovalStepDao();
    newStep.setUuid(oldStep.getUuid()); // Always want to make changes to the existing step
    approvalStepDao.update(newStep);

    if (newStep.getApprovers() != null) {
      Utils.addRemoveElementsByUuid(oldStep.loadApprovers(engine.getContext()).join(),
          newStep.getApprovers(),
          newPosition -> approvalStepDao.addApprover(newStep, DaoUtils.getUuid(newPosition)),
          oldPosition -> approvalStepDao.removeApprover(newStep, DaoUtils.getUuid(oldPosition)));
    }
  }

  // Helper method that updates a list of approval steps
  private static void updateSteps(List<ApprovalStep> steps, List<ApprovalStep> existingSteps) {
    final AnetObjectEngine engine = ApplicationContextProvider.getEngine();
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
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "A name is required for every approval step");
    }
    if (Utils.isEmptyOrNull(step.getApprovers())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "An approver is required for every approval step");
    }
  }

  public static Configuration getFreemarkerConfig(Class<?> clazz) {
    final Configuration freemarkerConfig = new Configuration(FREEMARKER_VERSION);
    // auto-escape HTML in our .ftlh templates
    freemarkerConfig.setRecognizeStandardFileExtensions(true);
    freemarkerConfig.setObjectWrapper(new DefaultObjectWrapperBuilder(FREEMARKER_VERSION).build());
    freemarkerConfig.loadBuiltInEncodingMap();
    freemarkerConfig.setDefaultEncoding(StandardCharsets.UTF_8.name());
    freemarkerConfig.setClassForTemplateLoading(clazz, "/");
    freemarkerConfig.setAPIBuiltinEnabled(true);
    return freemarkerConfig;
  }

  public static Set<String> getSubFields(ResolutionEnvironment env) {
    return env.dataFetchingEnvironment.getSelectionSet().getFields().stream()
        .map(sf -> sf.getQualifiedName()).collect(Collectors.toSet());
  }

  public static String getEmailNetworkForNotifications() {
    return (String) ApplicationContextProvider.getDictionary()
        .getDictionaryEntry("emailNetworkForNotifications");
  }
}
