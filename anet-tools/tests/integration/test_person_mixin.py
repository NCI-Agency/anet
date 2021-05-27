import unittest

from tests.base import base_test_fixture


class TestPersonMixin(base_test_fixture.BaseTestFixture):
    def test_insert_person(self):
        print("Tests: Insert Person")

        person = self.Person(name="new person", role=1)

        person.import_entity(utc_now=self.utc_now, update_rules=self.update_rules, session=self.session)

        person_uuid = self.session.query(self.Person).filter(self.Person.name == person.name).all()[0].uuid

        pp = (
            self.session.query(self.PeoplePositions)
            .filter(self.PeoplePositions.personUuid == person_uuid, self.PeoplePositions.positionUuid == None)
            .all()
        )

        # generate result
        result = len(pp)
        # generate expected
        expected = 1
        self.assertEqual(result, expected)

    def test_update_person(self):
        print("Tests: Update Person")

        person = self.Person(name="JACKSON, Jack", emailAddress="newmail@mail.com", role=1)
        self.update_rules["tables"].append({"name": "people", "columns": ["name"]})

        person.import_entity(utc_now=self.utc_now, update_rules=self.update_rules, session=self.session)

        person_mail = self.session.query(self.Person).filter(self.Person.name == person.name).all()[0].emailAddress

        # generate result
        result = person_mail
        # generate expected
        expected = person.emailAddress
        self.assertEqual(result, expected)


if __name__ == "__main__":
    unittest.main(argv=["ignored", "-v"], exit=False)
