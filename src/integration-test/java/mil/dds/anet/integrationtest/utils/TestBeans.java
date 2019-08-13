package mil.dds.anet.integrationtest.utils;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.List;
import com.google.common.collect.ImmutableList;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.beans.ApprovalStep.ApprovalStepType;
import mil.dds.anet.beans.Organization.OrganizationStatus;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.Person.PersonStatus;
import mil.dds.anet.beans.Person.Role;
import mil.dds.anet.beans.Report.Atmosphere;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.utils.DaoUtils;

public class TestBeans {
    public static Person getTestPerson() {
        Person p = new Person();
        p.setName("TEST, Test");
        p.setEmailAddress("test_person@test.anet");
        p.setPhoneNumber("+0-00000");
        p.setRank("CIV");
        p.setStatus(PersonStatus.ACTIVE);
        p.setRole(Role.ADVISOR);
        p.setBiography("");
        p.setDomainUsername("test");
        p.setGender("Male");
        p.setCountry("United States of America");
        p.setEndOfTourDate(
            ZonedDateTime.of(2017, 8, 1, 0, 0, 0, 0, DaoUtils.getDefaultZoneId()).toInstant());
        return p;
      }

    public static Organization getTestOrganization() {
        Organization o = new Organization();
        o.setShortName("test_organization");
        o.setLongName("test_organization");
        o.setStatus(OrganizationStatus.ACTIVE);
        o.setType(OrganizationType.ADVISOR_ORG);
        return o;
      }

    public static ApprovalStep getTestApprovalStep(Organization organization) {
        ApprovalStep as = new ApprovalStep();
        as.setAdvisorOrganizationUuid(organization.getUuid());
        as.setApprovers(ImmutableList.of());
        as.setType(ApprovalStepType.REPORT_APPROVAL);
        return as;
    }

    public static Report getTestReport(Person author, ApprovalStep approvalStep,
            List<ReportPerson> attendees) {
        Report r = new Report();
        r.setState(ReportState.APPROVED);
        r.setAuthor(author);
        r.setIntent("test_dummy");
        r.setAtmosphere(Atmosphere.NEUTRAL);
        r.setApprovalStep(approvalStep);
        r.setAttendees(attendees);
        r.setReportText("test_dummy");
        r.setNextSteps("test_dummy");
        r.setEngagementDate(Instant.now());
        r.setDuration(60);
        return r;
    }
}