from src.tests.base import base_test_fixture
import unittest

class UpdateEntityTest(base_test_fixture.BaseTestFixture):
    def test_update_entity(self):
        print("Tests: Update Person - Update Organization - Update Location")
        # generate expected
        person = self.session.query(self.Person).filter(self.Person.name == "JACKSON, Jack").all()[0]
        person.name = "updated_name"
        person.update_entity(updatedAt = self.utc_now)
        expected = person

        # generate result
        person_from_query = self.session.query(self.Person).filter(self.Person.uuid == person.uuid).all()[0]
        result = person_from_query

        self.assertEqual(result, expected)

if __name__ == "__main__":
    unittest.main(argv=['ignored', '-v'], exit=False)
