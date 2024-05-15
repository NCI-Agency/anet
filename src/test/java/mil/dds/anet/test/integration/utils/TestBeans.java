package mil.dds.anet.test.integration.utils;

import com.google.common.collect.ImmutableList;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.List;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.ApprovalStep.ApprovalStepType;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.Atmosphere;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.utils.DaoUtils;

public class TestBeans {

  public static Person getTestPerson() {
    Person p = new Person();
    p.setName("TEST, Test");
    p.setPhoneNumber("+0-00000");
    p.setRank("CIV");
    p.setStatus(Person.Status.ACTIVE);
    p.setBiography("");
    p.setDomainUsername("test");
    p.setGender("Male");
    p.setEndOfTourDate(
        ZonedDateTime.of(2036, 8, 1, 0, 0, 0, 0, DaoUtils.getServerNativeZoneId()).toInstant());
    return p;
  }

  public static Organization getTestOrganization() {
    Organization o = new Organization();
    o.setShortName("test_organization");
    o.setLongName("test_organization");
    o.setStatus(Organization.Status.ACTIVE);
    return o;
  }

  public static ApprovalStep getTestApprovalStep(Organization organization) {
    ApprovalStep as = new ApprovalStep();
    as.setRelatedObjectUuid(organization.getUuid());
    as.setApprovers(ImmutableList.of());
    as.setType(ApprovalStepType.REPORT_APPROVAL);
    return as;
  }

  public static Report getTestReport(String reportText, Instant engagementDate,
      ApprovalStep approvalStep, List<ReportPerson> reportPeople) {
    final String s = "test_dummy: " + reportText;
    final Report r = new Report();
    r.setState(ReportState.DRAFT);
    r.setIntent(s);
    r.setAtmosphere(Atmosphere.NEUTRAL);
    r.setApprovalStep(approvalStep);
    if (approvalStep != null) {
      r.setAdvisorOrgUuid(approvalStep.getRelatedObjectUuid());
    }
    r.setReportPeople(reportPeople);
    r.setReportText(s);
    r.setNextSteps(s);
    r.setEngagementDate(engagementDate == null ? Instant.now() : engagementDate);
    r.setDuration(60);
    return r;
  }
}
