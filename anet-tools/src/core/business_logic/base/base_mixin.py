from src.core.model.base.base_model import BaseModel
from src.core.business_logic.base.base_methods import base_methods


class base_mixin(BaseModel):
    """ Includes common methods for all of the annotated ANET models.
        Base class for model mixins (e.g. people_mixin.py, report_mixin.py in src.core.business_logic.overriden)
    """
    __abstract__ = True
    
    def import_entity(self, utc_now, update_rules, session):
        """Starting point of mixins. Decide what will be next.
        """
        base_methods.check_if_entity_allowed(self)
        is_update = base_methods.is_entity_update(self, update_rules, session)
        is_entity_single = base_methods.is_entity_single(self)
        if is_entity_single:
            if is_update:
                self.update_entity(utc_now, session)
            else:
                self.insert_entity(utc_now, session)
        else:
            self.insert_update_nested_entity(utc_now, update_rules, session)
        session.flush()

    def insert_entity(self, utc_now, session):
        """Insert and flush a new record
        """
        self.createdAt = utc_now
        self.updatedAt = utc_now
        session.add(self)
        session.flush()

    def update_entity(self, utc_now, session):
        """Update and flush an existing record
        """
        obj = session.query(type(self)).get(self.uuid)
        self.updatedAt = utc_now
        for attr, value in self.__dict__.items():
            if attr != "_sa_instance_state":
                setattr(obj, attr, value)
        session.flush()
        return obj