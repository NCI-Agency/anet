package mil.dds.anet.utils;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Consumer;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import javax.annotation.Nullable;
import javax.imageio.ImageIO;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Task;
import mil.dds.anet.views.AbstractAnetBean;
import org.imgscalr.Scalr;
import org.imgscalr.Scalr.Method;
import org.imgscalr.Scalr.Mode;
import org.jsoup.Jsoup;
import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Utils {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

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

  public static final PolicyFactory POLICY_DEFINITION = new HtmlPolicyBuilder()
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
          "h5", "h6", "hr", "img")
      .toFactory();

  public static String sanitizeHtml(String input) {
    if (input == null) {
      return null;
    }
    return POLICY_DEFINITION.sanitize(input);
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
  public static boolean isEmailWhitelisted(String email, List<String> whitelistDomainNames) {
    if (isEmptyOrNull(email) || isEmptyOrNull(whitelistDomainNames)) {
      return false;
    }

    final String wildcard = "*";
    final String[] splittedEmail = email.split("@");
    final String from = splittedEmail[0].trim();
    final String domainName = splittedEmail[1].toLowerCase();

    final List<String> wildcardDomainNames = whitelistDomainNames.stream()
        .filter(domain -> String.valueOf(domain.charAt(0)).equals(wildcard))
        .collect((Collectors.toList()));

    final boolean isWhitelistedEmail =
        from.length() > 0 && whitelistDomainNames.indexOf(domainName) >= 0;
    final boolean isValidWildcardDomain =
        wildcardDomainNames.stream().anyMatch(wildcardDomain -> domainName.charAt(0) != '.'
            && domainName.endsWith(wildcardDomain.substring(1)));

    return isWhitelistedEmail || isValidWildcardDomain;
  }

  /**
   * Resizes an image.
   * 
   * @param imageBase64 The image as a Base64 string
   * @param width The desired output width
   * @param height The desired output height
   * @param imageFormatName The desired output format (png, jpg)
   * @return The resized image as a Base64 string
   * @throws Exception When the binary data cannot be converted to an image string representation
   */
  public static String resizeImageBase64(String imageBase64, int width, int height,
      String imageFormatName) throws Exception {

    // From Base64-string to BufferedImage
    final BufferedImage imageBinary = convert(imageBase64);

    if (imageBinary == null) {
      throw new Exception("Cannot interpret image binary data.");
    }

    // Resizing
    final BufferedImage thumbnail =
        Scalr.resize(imageBinary, Method.AUTOMATIC, Mode.AUTOMATIC, width, height);

    // From BufferedImage back to Base64-string
    return convert(thumbnail, imageFormatName);
  }

  /**
   * Converts an image represented as a Base64 string into a BufferedImage.
   * 
   * @param imageBase64 The image as a Base64 string
   * @return The BufferedImage object
   * @throws IOException When an error occurs while reading the string
   */
  public static BufferedImage convert(String imageBase64) throws IOException {
    final byte[] imageBytes = Base64.getDecoder().decode(imageBase64);
    final ByteArrayInputStream is = new ByteArrayInputStream(imageBytes);
    return ImageIO.read(is);
  }

  /**
   * Converts a BufferedImage representing an image into a Base64 string.
   * 
   * @param imageBytes The image as bytes
   * @param imageFormatName The desired output format
   * @return The image as Base64 string
   * @throws IOException When an error occurs while writing the string
   */
  public static String convert(BufferedImage imageBytes, String imageFormatName)
      throws IOException {
    final ByteArrayOutputStream os = new ByteArrayOutputStream();
    ImageIO.write(imageBytes, imageFormatName, os);
    return Base64.getEncoder().encodeToString(os.toByteArray());
  }
}
