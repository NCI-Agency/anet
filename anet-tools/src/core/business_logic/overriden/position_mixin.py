import copy

from src.core.business_logic.base.base_mixin import base_mixin
from src.core.business_logic.base.base_methods import base_methods
from src.core.business_logic.overriden.logic_methods import logic_methods
from src.core.model.annotated.association import PeoplePositions

class position_mixin(base_mixin):
    """ Inherits from base_mixin
        Overrides business logic methods for position objects
    """
    __abstract__ = True

    def insert_update_nested_entity(self, utc_now, update_rules):
        self_c = copy.deepcopy(self)
        if base_methods.has_entity_relation(self, "person"):
            logic_methods.position_relation_process(self, "person", self_c, update_rules, PeoplePositions, utc_now)

        if base_methods.has_entity_relation(self, "location"):
            logic_methods.position_relation_process(self, "location", self_c, update_rules, PeoplePositions, utc_now)

        if base_methods.has_entity_relation(self, "organization"):
            logic_methods.position_relation_process(self, "organization", self_c, update_rules, PeoplePositions, utc_now)

        if base_methods.is_entity_update(self, update_rules):
            if base_methods.has_entity_relation(self, "person"):
                logic_methods.remove_positions_association_with_person(self, PeoplePositions, utc_now)
            self_c.update_entity(utc_now)
        else:
            self_c.insert_entity(utc_now)

        if base_methods.has_entity_relation(self, "person"):
            logic_methods.add_new_association(self, PeoplePositions, utc_now)
        self.session.flush()
        
