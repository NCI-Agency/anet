import datetime

from src.core.business_logic.base.base_mixin import base_mixin
from src.core.business_logic.base.base_methods import base_methods
from src.core.model.annotated.association import PeoplePositions


class position_mixin(base_mixin):
    """ Inherits from base_mixin
        Overrides business logic methods for position objects
    """

    __abstract__ = True

    def update_entity(self, utc_now, session):
        """Update and flush an existing record
        """
        obj = session.query(type(self)).get(self.uuid)
        self.updatedAt = utc_now
        for attr, value in self.__dict__.items():
            if attr not in ["_sa_instance_state", "people", "person", "location", "organization"]:
                setattr(obj, attr, value)
        session.flush()
        return obj

    def deassociate_current_person(self, utc_now):
        # Deassociate position's current person
        for pp in self.people:
            if pp.endedAt is None and pp.person is self.person:
                pp.endedAt = utc_now - datetime.timedelta(0, 2)
        self.people.append(PeoplePositions(createdAt=utc_now - datetime.timedelta(0, 1)))
        self.person.positions.append(PeoplePositions(createdAt=utc_now - datetime.timedelta(0, 1)))
        self.person = None

    def associate_new_person(self, person, utc_now):
        # Insert to peoplePositions
        self.people.append(PeoplePositions(createdAt=utc_now))
        self.people.append(PeoplePositions(createdAt=utc_now, person=person))
        # Update currentPersonUuid
        self.person = person

    def associate_location(self, loc):
        self.location = loc

    def associate_organization(self, org):
        self.organization = org

    def __eq__(self, other_pos):
        # Check if two position objects have same uuid
        return self.uuid == other_pos.uuid

    def get_fresh_one(self):
        """ Returns fresh position object which has not any relationship
        """
        new_obj = self.__class__()
        for key, value in self.__dict__.items():
            if key not in ["_sa_instance_state", "people", "person", "location", "organization"]:
                setattr(new_obj, key, value)
        return new_obj

    def associate_person_to_position(self, utc_now, session):
        # If position (from user) exists in ANET
        if self.is_update:
            # Query position from ANET
            pos = self.update_entity(utc_now, session)
        # If person exists in ANET
        if self.person.is_update:
            # Query person from ANET
            per = self.person.update_entity(utc_now, session)
            former_pos = session.query(type(self)).filter(type(self).currentPersonUuid == per.uuid).first()
            if self.is_update:
                # If person's former position exists
                if former_pos:
                    # If person's former position is not same with new one
                    if former_pos is not pos:
                        # Deassociate if related person has different former position in ANET
                        former_pos.deassociate_current_person(utc_now)
                if pos.person:
                    # If position (from user) has different former person
                    if pos.person is not per:
                        # Deassociate positions current person
                        pos.deassociate_current_person(utc_now)
                if pos.person is not per:
                    pos.associate_new_person(per, utc_now)
            else:
                if former_pos:
                    former_pos.deassociate_current_person(utc_now)
                self.person = None
                self.associate_new_person(per, utc_now)
        else:
            if self.is_update:
                if pos.person:
                    # Associate new person to existing position
                    pos.deassociate_current_person(utc_now)
                pos.associate_new_person(self.person, utc_now)
                pos.person.positions.append(PeoplePositions(createdAt=utc_now))
            else:
                self.person.positions.append(PeoplePositions(createdAt=utc_now))
                self.people.append(PeoplePositions(createdAt=utc_now))
                self.people.append(PeoplePositions(createdAt=utc_now, person=self.person))

    def associate_location_to_position(self, utc_now, session):
        # If position exists in ANET
        if self.is_update:
            pos = self.update_entity(utc_now, session)
        # If location exists in ANET
        if self.location.is_update:
            loc = self.location.update_entity(utc_now, session)
            if self.is_update:
                pos.associate_location(loc)
            else:
                self.associate_location(loc)
        else:
            if self.is_update:
                pos.associate_location(self.location)

    def associate_organization_to_position(self, utc_now, session):
        # If position exists in ANET
        if self.is_update:
            pos = self.update_entity(utc_now, session)
        # If organization exists in ANET
        if self.organization.is_update:
            org = self.organization.update_entity(utc_now, session)
            if self.is_update:
                pos.associate_organization(org)
            else:
                self.associate_organization(org)
        else:
            if self.is_update:
                pos.associate_organization(self.organization)

    def insert_update_nested_entity(self, utc_now, update_rules, session):
        # Set is_update attr for position and relations
        self.is_update = base_methods.is_entity_update(self, update_rules, session)
        if base_methods.has_entity_relation(self, "person"):
            self.person.is_update = base_methods.is_entity_update(self.person, update_rules, session)
        if base_methods.has_entity_relation(self, "location"):
            self.location.is_update = base_methods.is_entity_update(self.location, update_rules, session)
        if base_methods.has_entity_relation(self, "organization"):
            self.organization.is_update = base_methods.is_entity_update(self.organization, update_rules, session)

        self.initialize_times(utc_now)
        # Check if position (from user) has related person and associate
        if base_methods.has_entity_relation(self, "person"):
            self.person.initialize_times(utc_now)
            self.associate_person_to_position(utc_now, session)
        # Check if position (from user) has related location and associate
        if base_methods.has_entity_relation(self, "location"):
            self.location.initialize_times(utc_now)
            self.associate_location_to_position(utc_now, session)
        # Check if position (from user) has related organization and associate
        if base_methods.has_entity_relation(self, "organization"):
            self.organization.initialize_times(utc_now)
            self.associate_organization_to_position(utc_now, session)
        if not self.is_update:
            session.add(self)
        session.flush()
