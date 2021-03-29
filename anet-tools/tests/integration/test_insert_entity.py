import unittest

from tests.base import base_test_fixture


class InsertEntityTest(base_test_fixture.BaseTestFixture):

    def test_insert_entity_person(self):
        print("Tests: Insert Person")
        # generate expected
        person = self.Person(name="newperson1", role=1, uuid=self.new_uuid)
        person.import_entity(utc_now=self.utc_now, update_rules = self.update_rules)
        expected = person

        # generate result
        pp_from_query = self.session.query(self.PeoplePositions) \
                        .filter(self.PeoplePositions.personUuid == self.new_uuid) \
                        .all()[0]
        result = pp_from_query.person

        self.assertEqual(result, expected)

        result = pp_from_query.personUuid
        expected = self.new_uuid
        self.assertEqual(result, expected)

    def test_insert_entity_pos_loc_org(self):
        print("Tests: Insert Position - Insert Organization - Insert Location")
        # generate expected
        location = self.Location(name="newlocation1", uuid=self.new_uuid)
        location.import_entity(utc_now=self.utc_now, update_rules = self.update_rules)
        expected = location

        # generate result
        location_from_query = self.session.query(self.Location) \
                                .filter(self.Location.uuid == self.new_uuid) \
                                .all()[0]
        result = location_from_query

        self.assertEqual(result, expected)

    def test_update_entity(self):
        print("Tests: Update Person - Update Organization - Update Location")
        # generate expected
        person = self.session.query(self.Person).filter(
            self.Person.name == "JACKSON, Jack").all()[0]
        person.name = "updated_name"
        person.import_entity(utc_now=self.utc_now, update_rules = self.update_rules)
        expected = person

        # generate result
        person_from_query = self.session.query(self.Person) \
                            .filter(self.Person.uuid == person.uuid) \
                            .all()[0]
        result = person_from_query

        self.assertEqual(result, expected)


if __name__ == "__main__":
    unittest.main(argv=['ignored', '-v'], exit=False)
