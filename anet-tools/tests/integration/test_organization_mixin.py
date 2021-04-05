import unittest

from src.core.business_logic.base.base_methods import base_methods
from tests.base import base_test_fixture


class TestOrganizationMixin(base_test_fixture.BaseTestFixture):
    def test_insert_organization(self):
        print("Tests: Insert Organization")

        organization = self.Organization(shortName="new organization", status = 0, type = 0)

        organization.import_entity(utc_now=self.utc_now, update_rules = self.update_rules, session=self.session)

        organization_uuid = self.session.query(self.Organization) \
                        .filter(self.Organization.shortName == organization.shortName) \
                        .all()[0].uuid

        # generate result
        result = organization_uuid
        # generate expected
        expected = organization.uuid
        self.assertEqual(result, expected)

    def test_update_organization(self):
        print("Tests: Update Organization")

        organization = self.Organization(shortName="EF 1", status = 1, type = 0)
        self.update_rules["tables"].append({"name": "organizations", "columns": ["shortName"]})

        organization.import_entity(utc_now=self.utc_now, update_rules = self.update_rules, session=self.session)

        organization_status = self.session.query(self.Organization) \
                                .filter(self.Organization.shortName == organization.shortName) \
                                .all()[0].status
        # generate result
        result = organization_status
        # generate expected
        expected = organization.status
        self.assertEqual(result, expected)

if __name__ == "__main__":
    unittest.main(argv=['ignored', '-v'], exit=False)
