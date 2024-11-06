package mil.dds.anet.beans.mart;

import java.time.Instant;
import java.util.*;


public class ReportDto {

  // User Info
  private String email;
  private String firstName;
  private String lastName;
  private String organizationUuid;
  private String organizationName;
  private String positionName;
  private String country;
  private String rank;

  // Report info
  private String uuid;
  private Instant createdAt;
  private Instant lastModifiedAt;
  private Instant submittedAt;
  private Instant engagementDate;
  private String intent;
  private String locationUuid;
  private String reportText;

  private String customFields;
  private Map<String, String> tasks = new HashMap<>();

  public ReportDto() {}

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

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

  public String getOrganizationUuid() {
    return organizationUuid;
  }

  public void setOrganizationUuid(String organizationUuid) {
    this.organizationUuid = organizationUuid;
  }

  public String getOrganizationName() {
    return organizationName;
  }

  public void setOrganizationName(String organizationName) {
    this.organizationName = organizationName;
  }

  public String getPositionName() {
    return positionName;
  }

  public void setPositionName(String positionName) {
    this.positionName = positionName;
  }

  public String getUuid() {
    return uuid;
  }

  public void setUuid(String uuid) {
    this.uuid = uuid;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getLastModifiedAt() {
    return lastModifiedAt;
  }

  public Instant getSubmittedAt() {
    return submittedAt;
  }

  public void setSubmittedAt(Instant submittedAt) {
    this.submittedAt = submittedAt;
  }

  public void setLastModifiedAt(Instant lastModifiedAt) {
    this.lastModifiedAt = lastModifiedAt;
  }

  public Instant getEngagementDate() {
    return engagementDate;
  }

  public void setEngagementDate(Instant engagementDate) {
    this.engagementDate = engagementDate;
  }

  public String getIntent() {
    return intent;
  }

  public void setIntent(String intent) {
    this.intent = intent;
  }

  public String getLocationUuid() {
    return locationUuid;
  }

  public void setLocationUuid(String locationUuid) {
    this.locationUuid = locationUuid;
  }

  public String getReportText() {
    return reportText;
  }

  public void setReportText(String reportText) {
    this.reportText = reportText;
  }

  public Map<String, String> getTasks() {
    return tasks;
  }

  public void setTasks(Map<String, String> tasks) {
    this.tasks = tasks;
  }

  public String getCustomFields() {
    return customFields;
  }

  public void setCustomFields(String customFields) {
    this.customFields = customFields;
  }

  public String getCountry() {
    return country;
  }

  public void setCountry(String country) {
    this.country = country;
  }

  public String getRank() {
    return rank;
  }

  public void setRank(String rank) {
    this.rank = rank;
  }
}
