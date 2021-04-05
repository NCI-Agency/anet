import unittest

from src.core.business_logic.base.base_methods import base_methods
from tests.base import base_test_fixture


class TestReportMixin(base_test_fixture.BaseTestFixture):
    def test_associate_with_new_report(self):
        print("Tests: Associate new person, existing person and new location with new report")

        report = self.Report(intent = "new report", state = 0)

        person_1 = self.Person(name = "new_person", emailAddress = "new_person@example.com", role = 0)
        person_2 = self.Person(name = "BOBTOWN, Bob", emailAddress = "bobs_new_email_address@example.com", role = 0)
        location = self.Location(name = "new location", status = 0)

        report.people.append(self.ReportPeople(person = person_1, isPrimary = True, isAttendee = True))
        report.people.append(self.ReportPeople(person = person_2, isAttendee = True))
        report.location = location

        self.update_rules["tables"].append({'name': 'people', 'columns': ['name']})

        report.import_entity(utc_now = self.utc_now, update_rules = self.update_rules, session = self.session)

        rp = self.session.query(self.ReportPeople) \
                        .filter(self.ReportPeople.personUuid == person_1.uuid,
                                self.ReportPeople.reportUuid == report.uuid) \
                        .all()

        result = len(rp)
        expected = 1
        self.assertEqual(result, expected)

        rp = self.session.query(self.ReportPeople) \
                        .filter(self.ReportPeople.personUuid == person_2.uuid,
                                self.ReportPeople.reportUuid == report.uuid) \
                        .all()

        result = len(rp)
        expected = 1
        self.assertEqual(result, expected)

        location_uuid = self.session.query(self.Report) \
                        .filter(self.Report.intent == report.intent) \
                        .all()[0].locationUuid

        result = location_uuid
        expected = location.uuid
        self.assertEqual(result, expected)

    def test_associate_with_existing_report(self):
        print("Tests: Associate new person, existing person and new organization with existing report")

        report = self.Report(intent = "Looked at Hospital usage of Drugs", state = 0)

        person_1 = self.Person(name = "new_person", emailAddress = "new_person@example.com", role = 0)
        person_2 = self.Person(name = "TOPFERNESS, Christopf", emailAddress = "christopf_new_email_address@example.com", role = 0)
        organization = self.Organization(shortName = "new organization", status = 0, type = 0)

        report.people.append(self.ReportPeople(person = person_1, isPrimary = True, isAttendee = True))
        report.people.append(self.ReportPeople(person = person_2, isAttendee = True))
        report.organization = organization

        self.update_rules["tables"].append({'name': 'people', 'columns': ['name']})
        self.update_rules["tables"].append({'name': 'reports', 'columns': ['intent']})

        report.import_entity(utc_now = self.utc_now, update_rules = self.update_rules, session = self.session)

        rp = self.session.query(self.ReportPeople) \
                        .filter(self.ReportPeople.personUuid == person_1.uuid,
                                self.ReportPeople.reportUuid == report.uuid) \
                        .all()

        result = len(rp)
        expected = 1
        self.assertEqual(result, expected)

        rp = self.session.query(self.ReportPeople) \
                        .filter(self.ReportPeople.personUuid == person_2.uuid,
                                self.ReportPeople.reportUuid == report.uuid) \
                        .all()

        result = len(rp)
        expected = 1
        self.assertEqual(result, expected)

        organization_uuid = self.session.query(self.Report) \
                        .filter(self.Report.intent == report.intent) \
                        .all()[0].advisorOrganizationUuid

        result = organization_uuid
        expected = organization.uuid
        self.assertEqual(result, expected)

if __name__ == "__main__":
    unittest.main(argv=['ignored', '-v'], exit=False)
