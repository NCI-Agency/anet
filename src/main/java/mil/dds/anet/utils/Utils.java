package mil.dds.anet.utils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Consumer;
import java.util.stream.Collectors;

import javax.annotation.Nullable;

import org.joda.time.DateTime;
import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;

import mil.dds.anet.beans.Organization;
import mil.dds.anet.views.AbstractAnetBean;

public class Utils {

	public static boolean idEqual(AbstractAnetBean a, AbstractAnetBean b) { 
		if (a == null && b == null) { return true; } 
		if (a == null || b == null) { return false; } 
		return Objects.equals(a.getId(), b.getId());
	}
	
	public static boolean containsById(List<AbstractAnetBean> list, int id) { 
		for (AbstractAnetBean el : list) { 
			if (el.getId().equals(id)) { return true; } 
		}
		return false; 
	}
	
	public static <T extends AbstractAnetBean> T getById(List<T> list, Integer id) { 
		return list.stream().filter(el -> Objects.equals(id, el.getId())).findFirst().orElse(null);
	}
	
	/*
	 * Performs a diff of the two lists of elements
	 * For each element that is in newElements but is not in oldElements it will call addFunc
	 * For each element that is in oldElements but is not in newElements, it will call removeFunc
	 */
	public static <T extends AbstractAnetBean> void addRemoveElementsById(List<T> oldElements, List<T> newElements,
			Consumer<T> addFunc, Consumer<Integer> removeFunc) { 
		List<Integer> existingIds = oldElements.stream().map(p -> p.getId()).collect(Collectors.toList());			
		for (T newEl : newElements) { 
			if (existingIds.remove(newEl.getId()) == false) { 
				//Add this element
				addFunc.accept(newEl);
			}
		}
		
		//Now remove all items in existingIds. 
		for (Integer id : existingIds) {
			removeFunc.accept(id);
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
	 * Converts a text search query into a SQL Server Full Text query. 
	 * If the text ends with a * then we do a prefix match on the string
	 * else we do an inflectional match. 
	 */
	public static String getSqlServerFullTextQuery(String text) {
		String cleanText = text.trim().replaceAll("[\"*]", "");
		if (text.endsWith("*")) { 
			cleanText = "\"" + cleanText + "*\"";
		} else { 
			cleanText = "FORMSOF(INFLECTIONAL, \"" + cleanText + "\")";
		}
		return cleanText;
	}
	
	
	/**
	 * Just remove the * at the end. 
	 */
	public static String getSqliteFullTextQuery(String text) { 
		return text.trim().replaceAll("[\"*]", "");
	}

	/** 
	 * Prepares text to be used in a LIKE query in SQL. 
	 * Removes the * at the end. 
	 */
	public static String prepForLikeQuery(String text) {
		return text.trim().replaceAll("[\"*]", "");
	}

	/**
	 * Given a list of organizations and a topParentId, this function maps all of the organizations to their highest parent
	 * within this list excluding the topParent.  This is used to generate graphs/tables that bubble things up to their highest parent
	 * This is used in the daily rollup graphs. 
	 */
	public static Map<Integer, Organization> buildParentOrgMapping(List<Organization> orgs, @Nullable Integer topParentId) {
		Map<Integer,Organization> result = new HashMap<Integer,Organization>();
		Map<Integer,Organization> orgMap = new HashMap<Integer,Organization>();

		for (Organization o : orgs) {
			orgMap.put(o.getId(), o);
		}

		for (Organization o : orgs) {
			int curr = o.getId();
			Integer parentId = DaoUtils.getId(o.getParentOrg());
			while (Objects.equals(parentId,topParentId) == false && orgMap.containsKey(parentId)) {
				curr = parentId;
				parentId = DaoUtils.getId(orgMap.get(parentId).getParentOrg());
			}
			result.put(o.getId(), orgMap.get(curr));
		}

		return result;
	}
	
	public static final PolicyFactory POLICY_DEFINITION = new HtmlPolicyBuilder()
			.allowStandardUrlProtocols()
			// Allow title="..." on any element.
			.allowAttributes("title").globally()
			// Allow href="..." on <a> elements.
			.allowAttributes("href").onElements("a")
			// Defeat link spammers.
			.requireRelNofollowOnLinks()
			// The align attribute on <p> elements can have any value below.
			.allowAttributes("align").matching(true, "center", "left", "right", "justify", "char").onElements("p")
			.allowAttributes("border","cellpadding","cellspacing").onElements("table")
			.allowAttributes("colspan","rowspan").onElements("td","th")
			.allowStyling()
			// These elements are allowed.
			.allowElements("a", "p", "div", "i", "b", "u", "em", "blockquote", "tt", "strong", "br", 
					"ul", "ol", "li","table","tr","td","thead","tbody","th","span","h1","h2","h3",
					"h4","h5","h6","hr")
			.toFactory();
	
	public static String sanitizeHtml(String input) {
		if (input == null) { return null; } 
		return POLICY_DEFINITION.sanitize(input);
	}
	
	/* For all search interfaces we accept either specific dates 
	 * as number of milliseconds since the Unix Epoch, OR a number of milliseconds
	 * relative to today's date.  
	 * Relative times should be milliseconds less than one year.  Since it doesn't 
	 * make sense to look for any data between 1968 and 1971. 
	 */
	public static final long MILLIS_IN_YEAR = 1000 * 60 * 60 * 24 * 365;
	
	public static DateTime handleRelativeDate(DateTime input) { 
		Long millis = input.getMillis();
		if (millis < MILLIS_IN_YEAR)  { 
			long now = System.currentTimeMillis();
			return new DateTime(now + millis);
		}
		return input;
	}
	
  public static String trimStringReturnNull(String input) {
		if (input == null) { return null; }
		return input.trim();
	}

	/**
	 * Transform a result list from a database query by grouping. For example,
	 * given a result list:
	 * <code>
	 * [{"id": 3, "name": "alice", "someprop": "x", "week": 39, "nrdone": 2, "nrtodo": 0},
	 *  {"id": 3, "name": "alice", "someprop": "x", "week": 40, "nrdone": 1, "nrtodo": 3},
	 *  {"id": 3, "name": "alice", "someprop": "x", "week": 41, "nrdone": 0, "nrtodo": 5},
	 *  {"id": 5, "name": "bob",   "someprop": "y", "week": 39, "nrdone": 8, "nrtodo": 2},
	 *  {"id": 5, "name": "bob",   "someprop": "y", "week": 41, "nrdone": 3, "nrtodo": 0},
	 *  {"id": 6, "name": "eve",   "someprop": "z", "week": 39, "nrdone": 6, "nrtodo": 1}]
	 * </code>
	 * then transforming it like so:
	 * <code>
	 * final Set<String> tlf = Stream.of("name", "someprop").collect(Collectors.toSet());
	 * return resultGrouper(list, "stats", "id", tlf);
	 * </code>
	 * will return the list:
	 * <code>
	 * [{"id": 3, "name": "alice", "someprop": "x",
	 *    "stats": [{"week": 39, "nrdone": 2, "nrtodo": 0},
	 *                    {"week": 40, "nrdone": 1, "nrtodo": 3},
	 *                    {"week": 41, "nrdone": 0, "nrtodo": 5}]},
	 *  {"id": 5, "name": "bob",   "someprop": "y",
	 *    "stats": [{"week": 39, "nrdone": 8, "nrtodo": 2},
	 *                    {"week": 41, "nrdone": 3, "nrtodo": 0}]},
	 *  {"id": 6, "name": "eve",   "someprop": "z",
	 *     "stats": [{"week": 39, "nrdone": 6, "nrtodo": 1}]}]
	 * </code>
	 *
	 * @param results a result list from a database query
	 * @param groupName the name of the group in the resulting list elements
	 * @param groupingField the key field on which to group
	 * @param topLevelFields the fields to appear in the top-level object (i.e. not in the group)
	 * @return the grouped results from the query
	 */
	public static List<Map<String, Object>> resultGrouper(
			List<Map<String, Object>> results, String groupName,
			String groupingField, Set<String> topLevelFields) {
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
			final List<Map<String, Object>> groupList = (List<Map<String, Object>>) topLevelObject.get(groupName);
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
}
