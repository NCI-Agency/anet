from src.core.business_logic.base.base_mixin import base_mixin
from src.core.business_logic.base.base_methods import base_methods
from src.core.model.annotated.association import PeoplePositions, ReportPeople


class report_mixin(base_mixin):
    """ Inherits from base_mixin
        Overrides business logic methods for report objects
    """

    __abstract__ = True

    def update_entity(self, utc_now, session):
        """Update and flush an existing record
        """
        obj = session.query(type(self)).get(self.uuid)
        self.updatedAt = utc_now
        for attr, value in self.__dict__.items():
            if attr not in [
                "_sa_instance_state",
                "organization",
                "organization1",
                "approvalStep",
                "location",
                "people",
            ]:
                setattr(obj, attr, value)
        session.flush()
        return obj

    def associate_location(self, loc):
        self.location = loc

    def associate_organization(self, org):
        self.organization = org

    def get_fresh_one(self):
        """ Returns fresh person object which has not any relationship
        """
        new_obj = self.__class__()
        for key, value in self.__dict__.items():
            if key not in ["_sa_instance_state", "people", "organization", "location", "organization1"]:
                setattr(new_obj, key, value)
        return new_obj

    def associate_location_to_report(self, utc_now, session):
        # If report exists in ANET
        if self.is_update:
            rep = self.update_entity(utc_now, session)
        # If location exists in ANET
        if self.location.is_update:
            loc = self.location.update_entity(utc_now, session)
            if self.is_update:
                rep.associate_location(loc)
            else:
                self.associate_location(loc)
        else:
            if self.is_update:
                rep.associate_location(self.location)

    def associate_organization_to_report(self, utc_now, session):
        # If report exists in ANET
        if self.is_update:
            rep = self.update_entity(utc_now, session)
        # If organization exists in ANET
        if self.organization.is_update:
            org = self.organization.update_entity(utc_now, session)
            if self.is_update:
                rep.associate_organization(org)
            else:
                self.associate_organization(org)
        else:
            if self.is_update:
                rep.associate_organization(self.organization)

    def associate_people_to_report(self, utc_now, session):
        # Check if report (from user) exists in ANET
        if self.is_update:
            # Query existing report
            rep = self.update_entity(utc_now, session)
            # Loop through people of report (from user) (rp -> ReportPeople object)
            for rp in self.people:
                # Check if person is exists in ANET
                if rp.person.is_update:
                    # Query and associate existing person to report from db
                    upd_person = rp.person.update_entity(utc_now, session)
                    # Check updated person was in report before
                    if rp not in rep.people:
                        rep.people.append(
                            ReportPeople(
                                isPrimary=rp.isPrimary,
                                isAttendee=rp.isAttendee,
                                isAuthor=rp.isAuthor,
                                person=upd_person,
                            )
                        )
                else:
                    # Associate new person with report from db
                    fresh_person = rp.person.get_fresh_one()
                    fresh_person.positions.append(PeoplePositions(createdAt=utc_now))
                    rep.people.append(
                        ReportPeople(
                            isPrimary=rp.isPrimary, isAttendee=rp.isAttendee, isAuthor=rp.isAuthor, person=fresh_person
                        )
                    )
        else:
            # Loop through people of report (from user) (rp -> ReportPeople object)
            for rp in self.people:
                # Check if person is exists in ANET
                if rp.person.is_update:
                    # Query and associate existing person to report (from user)
                    upd_person = rp.person.update_entity(utc_now, session)
                    rp.person = None
                    rp.person = upd_person
                else:
                    # Create fresh person and associate with report (from user)
                    rp.person.positions.append(PeoplePositions(createdAt=utc_now))

    def insert_update_nested_entity(self, utc_now, update_rules, session):
        # Set is_update attr for report and relations
        self.is_update = base_methods.is_entity_update(self, update_rules, session)
        for rp in self.people:
            rp.person.is_update = base_methods.is_entity_update(rp.person, update_rules, session)
        if base_methods.has_entity_relation(self, "location"):
            self.location.is_update = base_methods.is_entity_update(self.location, update_rules, session)
        if base_methods.has_entity_relation(self, "organization"):
            self.organization.is_update = base_methods.is_entity_update(self.organization, update_rules, session)

        # Check if position (from user) has related person and associate
        if base_methods.has_entity_relation(self, "people"):
            self.associate_people_to_report(utc_now, session)
        # Check if position (from user) has related location and associate
        if base_methods.has_entity_relation(self, "location"):
            self.associate_location_to_report(utc_now, session)
        # Check if position (from user) has related organization and associate
        if base_methods.has_entity_relation(self, "organization"):
            self.associate_organization_to_report(utc_now, session)

        if not self.is_update:
            # Add report from user to session
            session.add(self)
        # Flush the session
        session.flush()
