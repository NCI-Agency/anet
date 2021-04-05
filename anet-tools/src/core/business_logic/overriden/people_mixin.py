from src.core.business_logic.base.base_mixin import base_mixin
from src.core.model.annotated.association import PeoplePositions

class people_mixin(base_mixin):
    """ Inherits from base_mixin
        Overrides business logic methods for people objects
    """
    __abstract__ = True

    def insert_entity(self, utc_now, session):
        """Insert and flush a new person
        """
        self.createdAt = utc_now
        self.updatedAt = utc_now
        session.add(PeoplePositions(createdAt=utc_now, person=self))
        session.flush()
        # PeoplePositions.create(createdAt=utc_now, person=self)

    def update_entity(self, utc_now, session):
        """Update and flush an existing record
        """
        obj = session.query(type(self)).get(self.uuid)
        self.updatedAt = utc_now
        for attr, value in self.__dict__.items():
            if attr not in ["_sa_instance_state", "reports"]:
                setattr(obj, attr, value)
        session.flush()
        return obj

    def get_fresh_one(self):
        """ Returns fresh person object which has not any relationship
        """
        new_obj = self.__class__()
        for key, value in self.__dict__.items():
            if key not in ["_sa_instance_state", "reports", "positions"]:
                setattr(new_obj, key, value)
        return new_obj

    def __eq__(self, other_person):
        return self.uuid == other_person.uuid

