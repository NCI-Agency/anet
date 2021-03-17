import unittest

from src.core.base_methods import base_methods
from tests.base import base_test_fixture


class InsertUpdateNestedEntityTest(base_test_fixture.BaseTestFixture):

    def test_insert_update_nested_entity_people_update_pos_update_case1(self):
        print("Tests: Update Position (has no former person association) Update Person (has no former position association)")

        position = self.Position(name="EF 1.1 Advisor C", type=0, status=0)
        person = self.Person(name="DVISOR, A", role=1)
        location = self.Location(name="Wishingwells Park", status=1)

        position.person = person
        position.location = location

        self.update_rules["tables"].append({"name": "positions", "columns": ["name"]})
        self.update_rules["tables"].append({"name": "people", "columns": ["name"]})
        self.update_rules["tables"].append({"name": "locations", "columns": ["name"]})
        base_methods.is_entity_update(position, self.update_rules)
        base_methods.is_entity_update(person, self.update_rules)
        base_methods.is_entity_update(location, self.update_rules)

        position.insert_update_nested_entity(self.utc_now, self.update_rules)

        pp_q = self.session.query(self.PeoplePositions) \
                    .filter(self.PeoplePositions.personUuid == person.uuid, 
                            self.PeoplePositions.positionUuid == position.uuid) \
                    .all()

        result = len(pp_q)
        expected = 1
        self.assertEqual(result, expected)

        result = pp_q[0].position.currentPersonUuid
        expected = person.uuid
        self.assertEqual(result, expected)

        result = pp_q[0].position.locationUuid
        expected = location.uuid
        self.assertEqual(result, expected)

    def test_insert_update_nested_entity_people_update_pos_update_case2(self):
        print("Tests: Update Position (has no former person association) Update Person (has former position association)")

        position = self.Position(
            name="EF 1.1 Old Inactive Advisor", type=0, status=0)
        person = self.Person(name="HENDERSON, Henry", role=1)
        location = self.Location(name="Wishingwells Park", status=1)

        position.person = person
        position.location = location

        self.update_rules["tables"].append(
            {"name": "positions", "columns": ["name"]})
        self.update_rules["tables"].append(
            {"name": "people", "columns": ["name"]})
        self.update_rules["tables"].append(
            {"name": "locations", "columns": ["name"]})
        base_methods.is_entity_update(position, self.update_rules)
        base_methods.is_entity_update(person, self.update_rules)
        base_methods.is_entity_update(location, self.update_rules)

        formerPosUuid = self.session.query(self.Position).filter(
            self.Position.currentPersonUuid == person.uuid).all()[0].uuid

        position.insert_update_nested_entity(self.utc_now, self.update_rules)

        pp_q = self.session.query(self.PeoplePositions) \
                    .filter(self.PeoplePositions.personUuid == person.uuid, 
                            self.PeoplePositions.positionUuid == position.uuid) \
                    .all()

        result = len(pp_q)
        expected = 1
        self.assertEqual(result, expected)

        result = pp_q[0].position.currentPersonUuid
        expected = person.uuid
        self.assertEqual(result, expected)

        result = pp_q[0].position.locationUuid
        expected = location.uuid
        self.assertEqual(result, expected)

        pp_q = self.session.query(self.PeoplePositions) \
                    .filter(self.PeoplePositions.personUuid == None,
                            self.PeoplePositions.positionUuid == formerPosUuid, 
                            self.PeoplePositions.endedAt == None) \
                    .all()
        result = len(pp_q)
        expected = 1
        self.assertEqual(result, expected)

        pp_q = self.session.query(self.PeoplePositions) \
                    .filter(self.PeoplePositions.personUuid == None,
                        self.PeoplePositions.positionUuid == position.uuid,
                        self.PeoplePositions.endedAt == None) \
                    .all()
        result = len(pp_q)
        expected = 1
        self.assertEqual(result, expected)

        pp_q = self.session.query(self.PeoplePositions) \
                    .filter(self.PeoplePositions.personUuid == person.uuid,
                        self.PeoplePositions.positionUuid == position.uuid,
                        self.PeoplePositions.endedAt == None) \
                    .all()
        result = len(pp_q)
        expected = 1
        self.assertEqual(result, expected)

    def test_insert_update_nested_entity_people_update_pos_update_case3(self):
        print("Tests: Update Position (has former person association) Update Person (has no former position association)")

        position = self.Position(name="EF 2.1 SuperUser", type=0, status=0)
        person = self.Person(name="DVISOR, A", role=1)
        organization = self.Organization(
            shortName="organization1", type=1, status=1)

        position.person = person
        position.organization = organization

        self.update_rules["tables"].append(
            {"name": "positions", "columns": ["name"]})
        self.update_rules["tables"].append(
            {"name": "people", "columns": ["name"]})
        self.update_rules["tables"].append(
            {"name": "organizations", "columns": ["shortName"]})
        base_methods.is_entity_update(position, self.update_rules)
        base_methods.is_entity_update(person, self.update_rules)
        base_methods.is_entity_update(organization, self.update_rules)

        formerPersonUuid = self.session.query(self.Position) \
                            .filter(self.Position.uuid == position.uuid).all()[0].currentPersonUuid

        position.insert_update_nested_entity(self.utc_now, self.update_rules)

        pp_q = self.session.query(self.PeoplePositions).filter(
            self.PeoplePositions.personUuid == person.uuid, self.PeoplePositions.positionUuid == position.uuid).all()

        result = len(pp_q)
        expected = 1
        self.assertEqual(result, expected)

        result = pp_q[0].position.currentPersonUuid
        expected = person.uuid
        self.assertEqual(result, expected)

        result = pp_q[0].position.organizationUuid
        expected = organization.uuid
        self.assertEqual(result, expected)

        pp_q = self.session.query(self.PeoplePositions) \
                    .filter(self.PeoplePositions.personUuid == formerPersonUuid,
                            self.PeoplePositions.positionUuid == None,
                            self.PeoplePositions.endedAt == None) \
                    .all()
        result = len(pp_q)
        expected = 1
        self.assertEqual(result, expected)

        pp_q = self.session.query(self.PeoplePositions) \
                    .filter(self.PeoplePositions.personUuid == None,
                            self.PeoplePositions.positionUuid == position.uuid, 
                            self.PeoplePositions.endedAt == None) \
                    .all()
        result = len(pp_q)
        expected = 1
        self.assertEqual(result, expected)

        pp_q = self.session.query(self.PeoplePositions) \
                    .filter(self.PeoplePositions.personUuid == person.uuid,
                            self.PeoplePositions.positionUuid == position.uuid,
                            self.PeoplePositions.endedAt == None) \
                    .all()
        result = len(pp_q)
        expected = 1
        self.assertEqual(result, expected)

    def test_insert_update_nested_entity_people_update_pos_update_case4(self):
        print("Tests: Update Position (has former person association) Update Person (has former position association)")

        position = self.Position(name="EF 2.1 Advisor B", type=0, status=0)
        person = self.Person(name="HENDERSON, Henry", role=1)
        location = self.Location(name="Wishingwells Park", status=1)

        position.person = person
        position.location = location

        self.update_rules["tables"].append(
            {"name": "positions", "columns": ["name"]})
        self.update_rules["tables"].append(
            {"name": "people", "columns": ["name"]})
        self.update_rules["tables"].append(
            {"name": "locations", "columns": ["name"]})
        base_methods.is_entity_update(position, self.update_rules)
        base_methods.is_entity_update(person, self.update_rules)
        base_methods.is_entity_update(location, self.update_rules)

        formerPosUuid = self.session.query(self.Position) \
                        .filter(self.Position.currentPersonUuid == person.uuid) \
                        .all()[0].uuid
        formerPersonUuid = self.session.query(self.Position) \
                            .filter(self.Position.uuid == position.uuid) \
                            .all()[0].currentPersonUuid

        position.insert_update_nested_entity(self.utc_now, self.update_rules)

        pp_q = self.session.query(self.PeoplePositions) \
                .filter(self.PeoplePositions.personUuid == person.uuid,
                        self.PeoplePositions.positionUuid == position.uuid) \
                        .all()

        result = len(pp_q)
        expected = 1
        self.assertEqual(result, expected)

        result = pp_q[0].position.currentPersonUuid
        expected = person.uuid
        self.assertEqual(result, expected)

        result = pp_q[0].position.locationUuid
        expected = location.uuid
        self.assertEqual(result, expected)

        pp_q = self.session.query(self.PeoplePositions) \
                .filter(self.PeoplePositions.personUuid == formerPersonUuid,
                        self.PeoplePositions.positionUuid == None,
                        self.PeoplePositions.endedAt == None) \
                        .all()
        result = len(pp_q)
        expected = 1
        self.assertEqual(result, expected)

        pp_q = self.session.query(self.PeoplePositions) \
                .filter(self.PeoplePositions.personUuid == None,
                        self.PeoplePositions.positionUuid == formerPosUuid,
                        self.PeoplePositions.endedAt == None) \
                        .all()
        result = len(pp_q)
        expected = 1
        self.assertEqual(result, expected)

        pp_q = self.session.query(self.PeoplePositions) \
                .filter(self.PeoplePositions.personUuid == None,
                        self.PeoplePositions.positionUuid == position.uuid, 
                        self.PeoplePositions.endedAt == None) \
                        .all()
        result = len(pp_q)
        expected = 1
        self.assertEqual(result, expected)

        pp_q = self.session.query(self.PeoplePositions) \
                .filter(self.PeoplePositions.personUuid == person.uuid,
                        self.PeoplePositions.positionUuid == position.uuid, 
                        self.PeoplePositions.endedAt == None) \
                        .all()
        result = len(pp_q)
        expected = 1
        self.assertEqual(result, expected)


if __name__ == "__main__":
    unittest.main(argv=['ignored', '-v'], exit=False)
