package mil.dds.anet.services;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Location.LocationType;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.WithStatus;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.utils.Utils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
public class MartDictionaryService implements IMartDictionaryService {

  private static final String DICT_DELIMITER = ".";
  private static final String MART_DICT_EXPORT_KEY = "martDictionaryExport";
  private static final String MART_DICT_TASKS_KEY = "tasks";

  private static final String MART_DICT_MUNICIPALITY_GROUP_ID_PATH =
      String.join(DICT_DELIMITER, MART_DICT_EXPORT_KEY, "municipalityGroupUuid");
  private static final String MART_DICT_REGIONAL_COMMANDS =
      String.join(DICT_DELIMITER, MART_DICT_EXPORT_KEY, "regionalCommands");
  private static final String MART_DICT_ROOT_DOMAIN_UUID =
      String.join(DICT_DELIMITER, MART_DICT_EXPORT_KEY, MART_DICT_TASKS_KEY, "domainUuid");
  private static final String MART_DICT_ROOT_FACTOR_UUID =
      String.join(DICT_DELIMITER, MART_DICT_EXPORT_KEY, MART_DICT_TASKS_KEY, "factorUuid");
  private static final String MART_DICT_ROOT_TOPIC_UUID =
      String.join(DICT_DELIMITER, MART_DICT_EXPORT_KEY, MART_DICT_TASKS_KEY, "topicUuid");
  private static final String MART_DICT_MUNICIPALITY_CUSTOM_FIELDS =
      String.join(DICT_DELIMITER, MART_DICT_EXPORT_KEY, "municipalityCustomFields");
  private static final String MART_DICT_LOCATION_CUSTOM_FIELDS =
      String.join(DICT_DELIMITER, MART_DICT_EXPORT_KEY, "locationCustomFields");

  protected final Logger logger = LoggerFactory.getLogger(this.getClass());

  private final AnetObjectEngine engine;
  private final AnetDictionary dict;
  private final OrganizationDao organizationDao;
  private final TaskDao taskDao;
  private final LocationDao locationDao;

  public MartDictionaryService(AnetObjectEngine engine, AnetDictionary dict,
      OrganizationDao organizationDao, TaskDao taskDao, LocationDao locationDao) {
    this.engine = engine;
    this.dict = dict;
    this.organizationDao = organizationDao;
    this.taskDao = taskDao;
    this.locationDao = locationDao;
  }

  @Override
  public Map<String, Object> createDictionaryForMart() {
    try {
      // Get needed entities from ANET dictionary, throw error is something missing
      final Task rootDomain = getRootTaskFromAnetDictionary(MART_DICT_ROOT_DOMAIN_UUID);
      final Task rootFactor = getRootTaskFromAnetDictionary(MART_DICT_ROOT_FACTOR_UUID);
      final Task rootTopic = getRootTaskFromAnetDictionary(MART_DICT_ROOT_TOPIC_UUID);
      final List<Organization> regionalCommands = getRegionalCommandsFromAnetDictionary();
      final Location municipalityGroup = getMunicipalityGroupLocationFromAnetDictionary();

      // All valid, produce the dictionary
      final Map<String, Object> dictionaryForMart = new LinkedHashMap<>();
      dictionaryForMart.put("domains", exportTasksToMartDictionary(rootDomain));
      dictionaryForMart.put("factors", exportTasksToMartDictionary(rootFactor));
      dictionaryForMart.put("topics", exportTasksToMartDictionary(rootTopic));
      dictionaryForMart.put("commands", exportCommandsToMartDictionary(regionalCommands));
      dictionaryForMart.put("municipalities",
          exportMunicipalitiesToMartDictionary(municipalityGroup));

      return dictionaryForMart;
    } catch (Exception e) {
      logger.error("Error producing MART dictionary", e);
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
          "Error producing MART dictionary: " + e.getMessage());
    }
  }

  private Task getRootTaskFromAnetDictionary(String martDictRootTaskUuid) {
    // Get root taskUuid
    if (dict.getDictionaryEntry(martDictRootTaskUuid) == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          martDictRootTaskUuid + " is not defined in the dictionary!");
    }
    final String rootTaskUuid = (String) dict.getDictionaryEntry(martDictRootTaskUuid);
    final Task task = taskDao.getByUuid(rootTaskUuid);
    if (task == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Task defined in dictionary does not exist: " + rootTaskUuid);
    }
    return task;
  }

  private List<Organization> getRegionalCommandsFromAnetDictionary() {
    // Get regionalCommands
    if (dict.getDictionaryEntry(MART_DICT_REGIONAL_COMMANDS) == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Regional commands not defined in the dictionary!");
    }
    @SuppressWarnings("unchecked")
    final List<String> regionalCommandsUuids =
        (List<String>) dict.getDictionaryEntry(MART_DICT_REGIONAL_COMMANDS);
    final List<Organization> regionalCommands = new ArrayList<>();
    for (final String regionalCommandUuid : regionalCommandsUuids) {
      final Organization org = organizationDao.getByUuid(regionalCommandUuid);
      if (org == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "Regional command defined in dictionary does not exist: " + regionalCommandUuid);
      }
      regionalCommands.add(org);
    }
    return regionalCommands;
  }

  @SuppressWarnings("unchecked")
  private List<String> getCustomFieldsFromDictionary(String dictionaryEntry) {
    if (dict.getDictionaryEntry(dictionaryEntry) == null) {
      return new ArrayList<>();
    }
    return (List<String>) dict.getDictionaryEntry(dictionaryEntry);
  }

  private Location getMunicipalityGroupLocationFromAnetDictionary() {
    // Get municipalityGroupUuid
    if (dict.getDictionaryEntry(MART_DICT_MUNICIPALITY_GROUP_ID_PATH) == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Municipality Group location is not defined in the dictionary!");
    }
    final String municipalityGroupUuid =
        (String) dict.getDictionaryEntry(MART_DICT_MUNICIPALITY_GROUP_ID_PATH);
    final Location municipalityGroup = locationDao.getByUuid(municipalityGroupUuid);
    if (municipalityGroup == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Municipality Group location defined in the dictionary does not exist: "
              + municipalityGroupUuid);
    }
    return municipalityGroup;
  }

  private List<Map<String, String>> exportTasksToMartDictionary(Task rootTask) {
    final List<Map<String, String>> tasks = new ArrayList<>();
    final TaskSearchQuery taskSearchQuery = new TaskSearchQuery();
    taskSearchQuery.setStatus(WithStatus.Status.ACTIVE);
    taskSearchQuery.setPageSize(0); // export all!
    final List<Task> childrenTasks =
        rootTask.loadChildrenTasks(engine.getContext(), taskSearchQuery).join();
    childrenTasks.sort(Comparator.comparing(Task::getShortName));
    for (final Task childTask : childrenTasks) {
      final Map<String, String> task = new LinkedHashMap<>();
      task.put("guid", childTask.getUuid());
      task.put("name", childTask.getShortName());
      tasks.add(task);
    }
    return tasks;
  }

  private List<Map<String, Object>> exportCommandsToMartDictionary(
      List<Organization> regionalCommands) {
    final List<Map<String, Object>> commands = new ArrayList<>();
    regionalCommands.sort(Comparator.comparing(Organization::getShortName));
    for (final Organization org : regionalCommands) {
      final Map<String, Object> command = new LinkedHashMap<>();
      final List<Map<String, String>> reportingTeams = new ArrayList<>();
      command.put("guid", org.getUuid());
      command.put("name", org.getShortName());
      final List<Organization> rts = org.loadChildrenOrgs(engine.getContext(), null).join();
      rts.sort(Comparator.comparing(Organization::getShortName));
      for (final Organization rt : rts) {
        final Map<String, String> reportingTeam = new LinkedHashMap<>();
        reportingTeam.put("guid", rt.getUuid());
        reportingTeam.put("name", rt.getShortName());
        reportingTeams.add(reportingTeam);
      }
      command.put("reportingTeams", reportingTeams);
      commands.add(command);
    }
    return commands;
  }

  private List<Map<String, Object>> exportMunicipalitiesToMartDictionary(Location municipalityGroup)
      throws JacksonException {
    final List<Map<String, Object>> result = new ArrayList<>();
    final LocationSearchQuery query = new LocationSearchQuery();
    query.setType(LocationType.MUNICIPALITY);
    query.setStatus(WithStatus.Status.ACTIVE);
    query.setPageSize(0);

    final List<Location> municipalities =
        new ArrayList<>(municipalityGroup.loadChildrenLocations(engine.getContext(), query).join());

    municipalities.sort(Comparator.comparing(Location::getName));
    for (final Location m : municipalities) {
      final Map<String, Object> municipality = new LinkedHashMap<>();
      final List<Map<String, Object>> locations = new ArrayList<>();

      // Municipality fields
      municipality.put("guid", m.getUuid());
      addCustomFields(MART_DICT_MUNICIPALITY_CUSTOM_FIELDS, municipality, m);
      final LocationSearchQuery childQuery = new LocationSearchQuery();
      childQuery.setType(LocationType.TOWN);
      childQuery.setStatus(WithStatus.Status.ACTIVE);
      childQuery.setPageSize(0);

      final List<Location> municipalityLocations =
          new ArrayList<>(m.loadChildrenLocations(engine.getContext(), childQuery).join());

      municipalityLocations.sort(Comparator.comparing(Location::getName));
      for (final Location l : municipalityLocations) {
        final Map<String, Object> location = new LinkedHashMap<>();
        // Location fields
        location.put("guid", l.getUuid());
        addCustomFields(MART_DICT_LOCATION_CUSTOM_FIELDS, location, l);
        locations.add(location);
      }
      municipality.put("locations", locations);
      result.add(municipality);
    }
    return result;
  }

  private void addCustomFields(String dictionaryEntry, Map<String, Object> location,
      Location anetLocation) throws JacksonException {
    final ObjectMapper objectMapper = new ObjectMapper();
    final String customFields = anetLocation.getCustomFields();
    if (!Utils.isEmptyOrNull(customFields)) {
      final JsonNode jsonNode = objectMapper.readTree(customFields);
      for (final String customField : getCustomFieldsFromDictionary(dictionaryEntry)) {
        final JsonNode customFieldNode = jsonNode.get(customField);
        if (customFieldNode != null) {
          location.put(customField, customFieldNode.asString());
        }
      }
    }
  }
}
