from src.core.business_logic.base.base_mixin import base_mixin
from src.core.business_logic.base.base_methods import base_methods

class report_mixin(base_mixin):
    """ Inherits from base_mixin
        Overrides business logic methods for report objects
    """
    __abstract__ = True

    def update_entity(self, utc_now):
        """Update and flush an existing record
        """
        obj = type(self).find(self.uuid)
        self.updatedAt = utc_now
        for attr, value in self.__dict__.items():
            if attr not in ["_sa_instance_state", 
                            "organization", 
                            "organization1", 
                            "approvalStep", 
                            "location", 
                            "people"]:
                setattr(obj, attr, value)
        self.session.flush()
        return obj

    def insert_update_nested_entity(self, utc_now, update_rules):
        for rp in self.people:
            base_methods.set_uuid(rp.person, update_rules)
        if base_methods.is_entity_update(self, update_rules):
            rep = self.update_entity(utc_now)
        else:
            rep = self
            self.session.add(rep)

        for rp in self.people:
            if base_methods.is_entity_update(rp.person, update_rules):
                rp.person.update_entity(utc_now)
            else:
                delattr(rp, "report")
                rp.person.insert_entity(utc_now)
                rep.people.append(rp)
        rep.session.flush()