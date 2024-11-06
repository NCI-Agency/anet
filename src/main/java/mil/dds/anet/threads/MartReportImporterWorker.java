package mil.dds.anet.threads;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import graphql.GraphQLContext;
import mil.dds.anet.beans.*;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.AdminDao;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.mappers.MapperUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
@ConditionalOnExpression("not ${anet.no-workers:false}")
public class MartReportImporterWorker extends AbstractWorker {

  ObjectMapper ignoringMapper = MapperUtils.getDefaultMapper()
          .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

  static public class MartReportContact  {
    @JsonProperty("firstName")
    private String firstName;
    @JsonProperty("lastName")
    private String lastName;
    @JsonProperty("nationality")
    private String nationality;
    @JsonProperty("position")
    private String position;
    @JsonProperty("organisation")
    private String organisation;

    public String getFirstName() {
      return firstName;
    }

    public void setFirstName(String firstName) {
      this.firstName = firstName;
    }

    public String getLastName() {
      return lastName;
    }

    public void setLastName(String lastName) {
      this.lastName = lastName;
    }

    public String getNationality() {
      return nationality;
    }

    public void setNationality(String nationality) {
      this.nationality = nationality;
    }

    public String getPosition() {
      return position;
    }

    public void setPosition(String position) {
      this.position = position;
    }

    public String getOrganisation() {
      return organisation;
    }

    public void setOrganisation(String organisation) {
      this.organisation = organisation;
    }
  }

  static public class MartReport  {
    @JsonProperty("uuid")
    private String uuid;
    @JsonProperty("sender")
    private String sender;
    @JsonProperty("eventHeadline")
    private String eventHeadline;
    @JsonProperty("description")
    private String description;
    @JsonProperty("eventDate")
    private Date eventDate;
    @JsonProperty("attitude")
    private String attitude;
    @JsonProperty("contacts")
    private List<MartReportContact> contacts;
    @JsonProperty("recommendations")
    private String recommendations;
    @JsonProperty("topics")
    private List<String> topics;
    @JsonProperty("submittedTime")
    private Date submittedTime;
    @JsonProperty("grid")
    private String grid;
    @JsonProperty("location")
    private String location;
    @JsonProperty("municipality")
    private String municipality;
    @JsonProperty("reportingTeam")
    private String reportingTeam;
    @JsonProperty("command")
    private String command;
    @JsonProperty("lastModificationTime")
    private Date lastModificationTime;
    @JsonProperty("eventEndDate")
    private Date eventEndDate;
    @JsonProperty("factors")
    private List<String> factors;
    @JsonProperty("domains")
    private List<String> domains;
    @JsonProperty("extraInformation")
    private String extraInformation;
    @JsonProperty("comments")
    private String comments;

    public String getRecommendations() {
      return recommendations;
    }

    public void setRecommendations(String recommendations) {
      this.recommendations = recommendations;
    }

    public String getComments() {
      return comments;
    }

    public void setComments(String comments) {
      this.comments = comments;
    }

    public String getAttitude() {
      return attitude;
    }

    public void setAttitude(String attitude) {
      this.attitude = attitude;
    }

    public String getDescription() {
      return description;
    }

    public void setDescription(String description) {
      this.description = description;
    }

    public List<MartReportContact> getContacts() {
      return contacts;
    }

    public void setContacts(List<MartReportContact> contacts) {
      this.contacts = contacts;
    }

    public List<String> getTopics() {
      return topics;
    }

    public void setTopics(List<String> topics) {
      this.topics = topics;
    }

    public Date getSubmittedTime() {
      return submittedTime;
    }

    public void setSubmittedTime(Date submittedTime) {
      this.submittedTime = submittedTime;
    }

    public String getGrid() {
      return grid;
    }

    public void setGrid(String grid) {
      this.grid = grid;
    }

    public String getLocation() {
      return location;
    }

    public void setLocation(String location) {
      this.location = location;
    }

    public String getMunicipality() {
      return municipality;
    }

    public void setMunicipality(String municipality) {
      this.municipality = municipality;
    }

    public String getReportingTeam() {
      return reportingTeam;
    }

    public void setReportingTeam(String reportingTeam) {
      this.reportingTeam = reportingTeam;
    }

    public String getCommand() {
      return command;
    }

    public void setCommand(String command) {
      this.command = command;
    }

    public String getUuid() {
      return uuid;
    }

    public void setUuid(String uuid) {
      this.uuid = uuid;
    }

    public Date getLastModificationTime() {
      return lastModificationTime;
    }

    public void setLastModificationTime(Date lastModificationTime) {
      this.lastModificationTime = lastModificationTime;
    }

    public Date getEventDate() {
      return eventDate;
    }

    public void setEventDate(Date eventDate) {
      this.eventDate = eventDate;
    }

    public Date getEventEndDate() {
      return eventEndDate;
    }

    public void setEventEndDate(Date eventEndDate) {
      this.eventEndDate = eventEndDate;
    }

    public String getSender() {
      return sender;
    }

    public void setSender(String sender) {
      this.sender = sender;
    }

    public List<String> getFactors() {
      return factors;
    }

    public void setFactors(List<String> factors) {
      this.factors = factors;
    }

    public List<String> getDomains() {
      return domains;
    }

    public void setDomains(List<String> domains) {
      this.domains = domains;
    }

    public String getExtraInformation() {
      return extraInformation;
    }

    public void setExtraInformation(String extraInformation) {
      this.extraInformation = extraInformation;
    }

    public String getEventHeadline() {
      return eventHeadline;
    }

    public void setEventHeadline(String eventHeadline) {
      this.eventHeadline = eventHeadline;
    }
  }
  private static MartReportImporterWorker instance;

  private final ReportDao reportDao;
  private final AdminDao adminDao;
  private final PersonDao personDao;
  private final ObjectMapper mapper;

  public MartReportImporterWorker(AnetDictionary dict, JobHistoryDao jobHistoryDao,
                                  ReportDao reportDao, PersonDao personDao, AdminDao adminDao) {
    super(dict, jobHistoryDao, "AnetMartImporter waking up to get MART reports!");
    this.personDao = personDao;
    this.reportDao = reportDao;
    this.adminDao = adminDao;
    this.mapper = MapperUtils.getDefaultMapper();

    setInstance(this);
  }

  public static void setInstance(MartReportImporterWorker instance) {
    MartReportImporterWorker.instance = instance;
  }

  @Scheduled(initialDelay = 10, fixedRate = 300, timeUnit = TimeUnit.SECONDS)
  @Override
  public void run() {
    String jsonMessage = "{\"recommendations\":\"Do not visit again\",\"comments\":\"This visit did not work out very well\",\"attitude\":\"Really bad\",\"description\":\"Visiting a village\"," +
            "\"contacts\":[{\"firstName\":\"John\",\"lastName\":\"Smith\",\"nationality\":\"Denmark\",\"position\":\"POS\",\"organisation\":\"ORG\"," +
            "\"extraInformation\":\"Extra info for the guy\"}],\"topics\":[\"Crime\",\"Decentralisation\"],\"eventHeadline\":\"Visiting a village\"," +
            "\"submittedTime\":\"2024-11-05T12:36:45.021325440Z\",\"grid\":\"34TEN33360518\",\"location\":\"6d90aacb-0108-4c0e-b6d8-079c808d4857\"," +
            "\"municipality\":\"Gnjilane/Gjilan\",\"reportingTeam\":\"E3\",\"command\":\"JRD(E)\",\"uuid\":\"c9ed9d24-a16b-491d-86a3-99c1f32098f4\"," +
            "\"lastModificationTime\":\"2024-11-05T12:36:33.141447Z\",\"eventDate\":\"2024-11-05T23:00:00Z\",\"eventEndDate\":null," +
            "\"sender\":\"authorized@test.com\",\"factors\":[\"Radicalism\",\"Unilateralism\"],\"domains\":[\"Economy\",\"Social\"],\"images\":[]}";
    super.run();
    try {
      MartReport martReport = ignoringMapper.readValue(jsonMessage, MartReport.class);
      // Create ANET report from MART report

      // Author
      Person person;
      List<Person> matchingPersons = personDao.findByDomainUsername(martReport.getSender());
      if (matchingPersons.isEmpty()){
        // Create a new person
        person = new Person();
        person.setDomainUsername(martReport.getSender());
        person.setName("MART TEST");
        person = personDao.insert(person);
      } else  {
        person = matchingPersons.get(0);
      }

      Report anetReport = new Report();
      anetReport.setCreatedAt(martReport.getSubmittedTime().toInstant());

      // Add MART person as author
      ReportPerson rp = new ReportPerson();
      rp.setAuthor(true);
      rp.setUser(true);
      rp.setAttendee(true);
      rp.setPrimary(true);
      rp.setInterlocutor(false);
      BeanUtils.copyProperties(person, rp);
      anetReport.setReportPeople(List.of(rp));

      // Report known details
      anetReport.setIntent(martReport.getEventHeadline());
      anetReport.setEngagementDate(martReport.getEventDate().toInstant());
      anetReport.setAtmosphereDetails(martReport.getAttitude());
      anetReport.setReportText(martReport.getDescription());
      anetReport.setKeyOutcomes(martReport.getRecommendations());

      // Status of the report
      anetReport.setState(Report.ReportState.APPROVED);

      anetReport = reportDao.insert(anetReport);

      // Comment
      Comment comment = new Comment();
      comment.setAuthor(person);
      comment.setAuthorUuid(person.getUuid());
      comment.setCreatedAt(Instant.now());
      comment.setText(martReport.getComments());
      comment.setReportUuid(anetReport.getUuid());
      anetReport.setComments(List.of(comment));

      reportDao.insert(anetReport);

      // TODO unmatched MART fields left (custom fields?)
      //  contacts, topics, grid, location, municipality, reportingTeam, command, uuid, lastModificationTime, eventEndDate, factors, domains

    } catch (JsonProcessingException e) {
        logger.error("Could not parse a MART report {}", jsonMessage);
    }
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory, GraphQLContext context) {
  }
}
