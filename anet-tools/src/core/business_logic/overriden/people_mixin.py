from src.core.business_logic.base.base_mixin import base_mixin
from src.core.model.annotated.association import PeoplePositions

class people_mixin(base_mixin):
    """ Inherits from base_mixin
        Overrides business logic methods for people objects
    """
    __abstract__ = True

    def insert_entity(self, utc_now):
        """Insert and flush a new person
        """
        self.createdAt = utc_now
        self.updatedAt = utc_now
        PeoplePositions.create(createdAt=utc_now, person=self)
    
    def update_entity(self, utc_now):
        """Update and flush an existing record
        """
        obj = type(self).find(self.uuid)
        self.updatedAt = utc_now
        for attr, value in self.__dict__.items():
            if attr not in ["_sa_instance_state", "reports"]:
                setattr(obj, attr, value)
        self.session.flush()
        return obj
