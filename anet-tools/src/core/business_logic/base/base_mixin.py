from src.core.model.base.base_model import BaseModel
from src.core.business_logic.base.base_methods import base_methods

class base_mixin(BaseModel):
    """ Includes common methods for all of the annotated ANET models.
        Base class for model mixins (e.g. people_mixin.py, report_mixin.py in src.core.business_logic.overriden)
    """
    __abstract__ = True
    
    def import_entity(self, utc_now, update_rules):
        """Starting point of mixins. Decide what will be next.
        """
        base_methods.check_if_entity_allowed(self)
        is_entity_update = base_methods.is_entity_update(self, update_rules)
        is_entity_single = base_methods.is_entity_single(self)
        if is_entity_single:
            if is_entity_update:
                self.update_entity(utc_now)
            else:
                self.insert_entity(utc_now)
        else:
            self.insert_update_nested_entity(utc_now, update_rules)

    def insert_entity(self, utc_now):
        """Insert and flush a new record
        """
        self.createdAt = utc_now
        self.updatedAt = utc_now
        self.session.add(self)
        self.session.flush()

    def update_entity(self, utc_now):
        """Update and flush an existing record
        """
        obj = type(self).find(self.uuid)
        self.updatedAt = utc_now
        for attr, value in self.__dict__.items():
            if attr != "_sa_instance_state":
                setattr(obj, attr, value)
        self.session.flush()