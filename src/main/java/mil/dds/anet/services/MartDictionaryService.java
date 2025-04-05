package mil.dds.anet.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import graphql.GraphQLContext;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.search.ISearchQuery;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.beans.search.OrganizationSearchSortBy;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.beans.search.TaskSearchSortBy;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.TaskDao;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class MartDictionaryService implements IMartDictionaryService {

  private static final String MART_DICT_MUNICIPALITY_GROUP_ID_PATH =
      "martDictionaryExport.municipalityGroupUuid";
  private static final String MART_DICT_REGIONAL_COMMANDS =
      "martDictionaryExport.regionalCommands";
  private static final String MART_DICT_ROOT_DOMAIN_UUID = "martDictionaryExport.tasks.domainUuid";
  private static final String MART_DICT_ROOT_FACTOR_UUID = "martDictionaryExport.tasks.factorUuid";
  private static final String MART_DICT_ROOT_TOPIC_UUID = "martDictionaryExport.tasks.topicUuid";

  protected final Logger logger = LoggerFactory.getLogger(this.getClass());

  private final AnetDictionary dict;
  private final OrganizationDao organizationDao;
  private final TaskDao taskDao;
  private final LocationDao locationDao;

  public MartDictionaryService(AnetDictionary dict, OrganizationDao organizationDao,
      TaskDao taskDao, LocationDao locationDao) {
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
      Map<String, Object> dictionaryForMart = new LinkedHashMap<>();
      dictionaryForMart.put("domains", exportTasksToMartDictionary(rootDomain));
      dictionaryForMart.put("factors", exportTasksToMartDictionary(rootFactor));
      dictionaryForMart.put("topics", exportTasksToMartDictionary(rootTopic));
      dictionaryForMart.put("commands", exportCommandsToMartDictionary(regionalCommands));
      dictionaryForMart.put("municipalities",
          exportMunicipalitiesToMartDictionary(municipalityGroup));
      return dictionaryForMart;
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
          "Error producing Mart dictionary!" + e.getMessage());
    }
  }

  private Task getRootTaskFromAnetDictionary(String martDictRootDomainUuid) {
    // Get root domainUuid
    if (dict.getDictionaryEntry(martDictRootDomainUuid) == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          martDictRootDomainUuid + " is not defined in the dictionary!");
    }
    final String rootTaskUuid = (String) dict.getDictionaryEntry(martDictRootDomainUuid);
    final Task task = taskDao.getByUuid(rootTaskUuid);
    if (task == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Task defined in dictionary does not exist:" + rootTaskUuid);
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
    for (String regionalCommandUuid : regionalCommandsUuids) {
      Organization org = organizationDao.getByUuid(regionalCommandUuid);
      if (org == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "Regional command defined in dictionary does not exist: " + regionalCommandUuid);
      }
      regionalCommands.add(org);
    }
    return regionalCommands;
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
    final TaskSearchQuery searchQuery = new TaskSearchQuery();
    searchQuery.setParentTaskUuid(Collections.singletonList(rootTask.getUuid()));
    searchQuery.setSortBy(TaskSearchSortBy.NAME);
    searchQuery.setSortOrder(ISearchQuery.SortOrder.ASC);
    for (Task childTask : taskDao.search(searchQuery).getList()) {
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
    for (Organization org : regionalCommands) {
      final Map<String, Object> command = new LinkedHashMap<>();
      final List<Map<String, String>> reportingTeams = new ArrayList<>();
      command.put("guid", org.getUuid());
      command.put("name", org.getShortName());
      final OrganizationSearchQuery searchQuery = new OrganizationSearchQuery();
      searchQuery.setParentOrgUuid(Collections.singletonList(org.getUuid()));
      searchQuery.setSortBy(OrganizationSearchSortBy.NAME);
      searchQuery.setSortOrder(ISearchQuery.SortOrder.ASC);
      for (Organization childOrg : organizationDao.search(searchQuery).getList()) {
        final Map<String, String> reportingTeam = new LinkedHashMap<>();
        reportingTeam.put("guid", childOrg.getUuid());
        reportingTeam.put("name", childOrg.getShortName());
        reportingTeams.add(reportingTeam);
      }
      command.put("reportingTeams", reportingTeams);
      commands.add(command);
    }
    return commands;
  }

  private List<Map<String, Object>> exportMunicipalitiesToMartDictionary(Location municipalityGroup)
      throws JsonProcessingException {
    final List<Map<String, Object>> result = new ArrayList<>();
    GraphQLContext graphQLContext = ApplicationContextProvider.getEngine().getContext();

    List<Location> municipalities = municipalityGroup.loadChildrenLocations(graphQLContext).join();
    municipalities.sort(Comparator.comparing(Location::getName));
    for (Location m : municipalities) {
      final Map<String, Object> municipality = new LinkedHashMap<>();
      final List<Map<String, String>> locations = new ArrayList<>();

      // Municipality fields
      municipality.put("guid", m.getUuid());
      ObjectMapper objectMapper = new ObjectMapper();
      JsonNode jsonNode = objectMapper.readTree(m.getCustomFields());
      // TODO this custom fields names are very specific for K4, ideally this could be configured in
      // the dictionary on both ANET and MART side if we ever get more MART customers
      municipality.put("albanianName", jsonNode.get("municipalityAlbanian").asText());
      municipality.put("serbianName", jsonNode.get("municipalitySerbian").asText());
      List<Location> municipalityLocations = m.loadChildrenLocations(graphQLContext).join();
      municipalityLocations.sort(Comparator.comparing(Location::getName));
      for (Location l : municipalityLocations) {
        final Map<String, String> location = new LinkedHashMap<>();
        // Location fields
        location.put("guid", l.getUuid());
        jsonNode = objectMapper.readTree(l.getCustomFields());
        location.put("albanianName", jsonNode.get("townAlbanian").asText());
        location.put("serbianName", jsonNode.get("townSerbian").asText());
        location.put("mgrs", jsonNode.get("mgrs").asText());

        locations.add(location);
      }
      municipality.put("locations", locations);
      result.add(municipality);
    }
    return result;
  }
}
