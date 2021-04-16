import unittest

from tests.base import base_test_fixture


class TestPositionMixin(base_test_fixture.BaseTestFixture):
    def test_associate_existing_person_to_existing_position_case1(self):
        print("Tests: Associate existing person (has no former position) with existing position (has no former person)")

        position = self.Position(name="EF 1.1 Advisor C", type=0, status=0)
        person = self.Person(name="DVISOR, A", role=1)
        location = self.Location(name="Wishingwells Park", status=1)

        position.person = person
        position.location = location

        self.update_rules["tables"].append({"name": "positions", "columns": ["name"]})
        self.update_rules["tables"].append({"name": "people", "columns": ["name"]})
        self.update_rules["tables"].append({"name": "locations", "columns": ["name"]})

        position.import_entity(utc_now=self.utc_now, update_rules=self.update_rules, session=self.session)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(self.PeoplePositions.personUuid == person.uuid, self.PeoplePositions.positionUuid == position.uuid)
            .all()
        )

        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

        result = pp[0].position.currentPersonUuid
        expected = person.uuid
        self.assertEqual(result, expected)

        result = pp[0].position.locationUuid
        expected = location.uuid
        self.assertEqual(result, expected)

    def test_associate_existing_person_to_existing_position_case2(self):
        print("Tests: Associate existing person (has former position) with existing position (has no former person)")

        position = self.Position(name="EF 1.1 Old Inactive Advisor", type=0, status=0)
        person = self.Person(name="HENDERSON, Henry", role=1)
        location = self.Location(name="Wishingwells Park", status=1)

        position.person = person
        position.location = location

        self.update_rules["tables"].append({"name": "positions", "columns": ["name"]})
        self.update_rules["tables"].append({"name": "people", "columns": ["name"]})
        self.update_rules["tables"].append({"name": "locations", "columns": ["name"]})

        position.import_entity(utc_now=self.utc_now, update_rules=self.update_rules, session=self.session)

        former_pos_uuid = (
            self.session.query(self.Position).filter(self.Position.currentPersonUuid == person.uuid).all()[0].uuid
        )

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(self.PeoplePositions.personUuid == person.uuid, self.PeoplePositions.positionUuid == position.uuid)
            .all()
        )

        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

        result = pp[0].position.currentPersonUuid
        expected = person.uuid
        self.assertEqual(result, expected)

        result = pp[0].position.locationUuid
        expected = location.uuid
        self.assertEqual(result, expected)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(
                self.PeoplePositions.personUuid == None,
                self.PeoplePositions.positionUuid == former_pos_uuid,
                self.PeoplePositions.endedAt == None,
            )
            .all()
        )
        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(
                self.PeoplePositions.personUuid == None,
                self.PeoplePositions.positionUuid == position.uuid,
                self.PeoplePositions.endedAt == None,
            )
            .all()
        )
        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(
                self.PeoplePositions.personUuid == person.uuid,
                self.PeoplePositions.positionUuid == position.uuid,
                self.PeoplePositions.endedAt == None,
            )
            .all()
        )
        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

    def test_associate_existing_person_to_existing_position_case3(self):
        print("Tests: Associate existing person (has no former position) with existing position (has former person)")

        position = self.Position(name="EF 2.1 SuperUser", type=0, status=0)
        person = self.Person(name="DVISOR, A", role=1)
        organization = self.Organization(shortName="organization1", type=1, status=1)

        position.person = person
        position.organization = organization

        self.update_rules["tables"].append({"name": "positions", "columns": ["name"]})
        self.update_rules["tables"].append({"name": "people", "columns": ["name"]})
        self.update_rules["tables"].append({"name": "organizations", "columns": ["shortName"]})

        former_person_uuid = (
            self.session.query(self.Position).filter(self.Position.name == position.name).all()[0].currentPersonUuid
        )

        position.import_entity(utc_now=self.utc_now, update_rules=self.update_rules, session=self.session)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(self.PeoplePositions.personUuid == person.uuid, self.PeoplePositions.positionUuid == position.uuid)
            .all()
        )

        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

        result = pp[0].position.currentPersonUuid
        expected = person.uuid
        self.assertEqual(result, expected)

        result = pp[0].position.organizationUuid
        expected = organization.uuid
        self.assertEqual(result, expected)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(
                self.PeoplePositions.personUuid == former_person_uuid,
                self.PeoplePositions.positionUuid == None,
                self.PeoplePositions.endedAt == None,
            )
            .all()
        )
        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(
                self.PeoplePositions.personUuid == None,
                self.PeoplePositions.positionUuid == position.uuid,
                self.PeoplePositions.endedAt == None,
            )
            .all()
        )
        result = len(pp)
        expected = 2
        self.assertEqual(result, expected)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(
                self.PeoplePositions.personUuid == person.uuid,
                self.PeoplePositions.positionUuid == position.uuid,
                self.PeoplePositions.endedAt == None,
            )
            .all()
        )
        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

    def test_associate_existing_person_to_existing_position_case4(self):
        print("Tests: Associate existing person (has former position) with existing position (has former person)")

        position = self.Position(name="EF 2.1 Advisor B", type=0, status=0)
        person = self.Person(name="HENDERSON, Henry", role=1)
        location = self.Location(name="Wishingwells Park", status=1)

        position.person = person
        position.location = location

        self.update_rules["tables"].append({"name": "positions", "columns": ["name"]})
        self.update_rules["tables"].append({"name": "people", "columns": ["name"]})
        self.update_rules["tables"].append({"name": "locations", "columns": ["name"]})

        person_uuid = self.session.query(self.Person).filter(self.Person.name == person.name).all()[0].uuid

        pos_uuid = self.session.query(self.Position).filter(self.Position.name == position.name).all()[0].uuid

        former_pos_uuid = (
            self.session.query(self.Position).filter(self.Position.currentPersonUuid == person_uuid).all()[0].uuid
        )

        former_person_uuid = (
            self.session.query(self.Position).filter(self.Position.uuid == pos_uuid).all()[0].currentPersonUuid
        )

        position.import_entity(utc_now=self.utc_now, update_rules=self.update_rules, session=self.session)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(self.PeoplePositions.personUuid == person.uuid, self.PeoplePositions.positionUuid == position.uuid)
            .all()
        )

        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

        result = pp[0].position.currentPersonUuid
        expected = person.uuid
        self.assertEqual(result, expected)

        result = pp[0].position.locationUuid
        expected = location.uuid
        self.assertEqual(result, expected)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(
                self.PeoplePositions.personUuid == former_person_uuid,
                self.PeoplePositions.positionUuid == None,
                self.PeoplePositions.endedAt == None,
            )
            .all()
        )
        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(
                self.PeoplePositions.personUuid == None,
                self.PeoplePositions.positionUuid == former_pos_uuid,
                self.PeoplePositions.endedAt == None,
            )
            .all()
        )
        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(
                self.PeoplePositions.personUuid == None,
                self.PeoplePositions.positionUuid == position.uuid,
                self.PeoplePositions.endedAt == None,
            )
            .all()
        )
        result = len(pp)
        expected = 2
        self.assertEqual(result, expected)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(
                self.PeoplePositions.personUuid == person.uuid,
                self.PeoplePositions.positionUuid == position.uuid,
                self.PeoplePositions.endedAt == None,
            )
            .all()
        )
        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

    def test_associate_existing_person_to_new_position_case1(self):
        print("Tests: Associate existing person (has no former position) with new position")

        position = self.Position(name="new_position", type=0, status=0)
        person = self.Person(name="DVISOR, A", role=1)
        organization = self.Organization(shortName="organization1", type=1, status=1)

        position.person = person
        position.organization = organization

        self.update_rules["tables"].append({"name": "positions", "columns": ["name"]})
        self.update_rules["tables"].append({"name": "people", "columns": ["name"]})
        self.update_rules["tables"].append({"name": "organizations", "columns": ["shortName"]})

        position.import_entity(utc_now=self.utc_now, update_rules=self.update_rules, session=self.session)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(self.PeoplePositions.personUuid == person.uuid, self.PeoplePositions.positionUuid == position.uuid)
            .all()
        )

        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

        result = pp[0].position.currentPersonUuid
        expected = person.uuid
        self.assertEqual(result, expected)

        result = pp[0].position.organizationUuid
        expected = organization.uuid
        self.assertEqual(result, expected)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(
                self.PeoplePositions.personUuid == None,
                self.PeoplePositions.positionUuid == position.uuid,
                self.PeoplePositions.endedAt == None,
            )
            .all()
        )
        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

    def test_associate_existing_person_to_new_position_case2(self):
        print("Tests: Associate existing person (has former position) with new position")

        position = self.Position(name="new position", type=0, status=0)
        person = self.Person(name="ERINSON, Erin", role=1)
        location = self.Location(name="new location", status=1)

        position.person = person
        position.location = location

        self.update_rules["tables"].append({"name": "positions", "columns": ["name"]})
        self.update_rules["tables"].append({"name": "people", "columns": ["name"]})
        self.update_rules["tables"].append({"name": "location", "columns": ["name"]})

        person_uuid = self.session.query(self.Person).filter(self.Person.name == person.name).all()[0].uuid

        former_pos_uuid = (
            self.session.query(self.Position).filter(self.Position.currentPersonUuid == person_uuid).all()[0].uuid
        )

        position.import_entity(utc_now=self.utc_now, update_rules=self.update_rules, session=self.session)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(self.PeoplePositions.personUuid == None, self.PeoplePositions.positionUuid == former_pos_uuid)
            .all()
        )

        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(self.PeoplePositions.personUuid == None, self.PeoplePositions.positionUuid == position.uuid)
            .all()
        )

        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(self.PeoplePositions.personUuid == person.uuid, self.PeoplePositions.positionUuid == position.uuid)
            .all()
        )

        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

        loc_uuid = self.session.query(self.Position).get(position.uuid).locationUuid

        result = loc_uuid
        expected = location.uuid
        self.assertEqual(result, expected)

    def test_associate_new_person_to_existing_position_case1(self):
        print("Tests: Associate new person with existing position (has no former person)")

        position = self.Position(name="EF 1.1 Advisor C", type=0, status=0)
        person = self.Person(name="new person", role=0)
        location = self.Location(name="new location", status=1)

        position.person = person
        position.location = location

        self.update_rules["tables"].append({"name": "positions", "columns": ["name"]})

        position.import_entity(utc_now=self.utc_now, update_rules=self.update_rules, session=self.session)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(self.PeoplePositions.personUuid == None, self.PeoplePositions.positionUuid == position.uuid)
            .all()
        )

        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(self.PeoplePositions.personUuid == person.uuid, self.PeoplePositions.positionUuid == None)
            .all()
        )

        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(self.PeoplePositions.personUuid == person.uuid, self.PeoplePositions.positionUuid == position.uuid)
            .all()
        )

        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

        location_uuid = (
            self.session.query(self.Position).filter(self.Position.name == position.name).all()[0].locationUuid
        )

        result = location_uuid
        expected = location.uuid
        self.assertEqual(result, expected)

    def test_associate_new_person_to_existing_position_case2(self):
        print("Tests: Associate new person with existing position (has former person)")

        position = self.Position(name="EF 1.2 Advisor", type=0, status=0)
        person = self.Person(name="new person", role=0)
        location = self.Location(name="new location", status=1)

        position.person = person
        position.location = location

        self.update_rules["tables"].append({"name": "positions", "columns": ["name"]})

        former_person_uuid = (
            self.session.query(self.Position).filter(self.Position.name == position.name).all()[0].currentPersonUuid
        )

        position.import_entity(utc_now=self.utc_now, update_rules=self.update_rules, session=self.session)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(
                self.PeoplePositions.personUuid == former_person_uuid,
                self.PeoplePositions.positionUuid == position.uuid,
                self.PeoplePositions.endedAt != None,
            )
            .all()
        )

        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(self.PeoplePositions.personUuid == None, self.PeoplePositions.positionUuid == position.uuid)
            .all()
        )

        result = len(pp)
        expected = 2
        self.assertEqual(result, expected)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(self.PeoplePositions.personUuid == former_person_uuid, self.PeoplePositions.positionUuid == None)
            .all()
        )

        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(self.PeoplePositions.personUuid == person.uuid, self.PeoplePositions.positionUuid == None)
            .all()
        )

        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(self.PeoplePositions.personUuid == person.uuid, self.PeoplePositions.positionUuid == position.uuid)
            .all()
        )

        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

    def test_associate_new_person_to_new_position(self):
        print("Tests: Associate new person with new position")

        position = self.Position(name="new position", type=0, status=0)
        person = self.Person(name="new person", role=0, status=0)
        location = self.Location(name="new location", status=1)

        position.person = person
        position.location = location

        position.import_entity(utc_now=self.utc_now, update_rules=self.update_rules, session=self.session)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(self.PeoplePositions.personUuid == person.uuid, self.PeoplePositions.positionUuid == None)
            .all()
        )

        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(self.PeoplePositions.personUuid == None, self.PeoplePositions.positionUuid == position.uuid)
            .all()
        )

        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(self.PeoplePositions.personUuid == person.uuid, self.PeoplePositions.positionUuid == position.uuid)
            .all()
        )

        result = len(pp)
        expected = 1
        self.assertEqual(result, expected)


if __name__ == "__main__":
    unittest.main(argv=["ignored", "-v"], exit=False)
