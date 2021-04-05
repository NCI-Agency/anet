import unittest

from src.core.business_logic.base.base_methods import base_methods
from tests.base import base_test_fixture


class TestLocationMixin(base_test_fixture.BaseTestFixture):

    def test_insert_location(self):
        print("Tests: Insert Location")

        location = self.Location(name="new location", status=0)

        location.import_entity(utc_now=self.utc_now, update_rules = self.update_rules, session=self.session)

        location_uuid = self.session.query(self.Location) \
                        .filter(self.Location.name == location.name) \
                        .all()[0].uuid

        # generate result
        result = location_uuid
        # generate expected
        expected = location.uuid
        self.assertEqual(result, expected)

    def test_update_location(self):
        print("Tests: Update Location")

        location = self.Location(name="Cabot Tower", status = 1)
        self.update_rules["tables"].append({"name": "locations", "columns": ["name"]})

        location.import_entity(utc_now=self.utc_now, update_rules = self.update_rules, session=self.session)

        location_status = self.session.query(self.Location) \
                                .filter(self.Location.name == location.name) \
                                .all()[0].status
        # generate result
        result = location_status
        # generate expected
        expected = location.status
        self.assertEqual(result, expected)

if __name__ == "__main__":
    unittest.main(argv=['ignored', '-v'], exit=False)
