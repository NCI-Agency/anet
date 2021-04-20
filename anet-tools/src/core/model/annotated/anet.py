from sqlalchemy.orm import relationship

from src.core.business_logic.overridden.location_mixin import location_mixin
from src.core.business_logic.overridden.organization_mixin import organization_mixin
from src.core.business_logic.overridden.people_mixin import people_mixin
from src.core.business_logic.overridden.position_mixin import position_mixin
from src.core.business_logic.overridden.report_mixin import report_mixin


class Positions(position_mixin):
    """ Final Positions model for user
        Contains both all attributes and business logic methods
    """

    __tablename__ = "positions"

    people = relationship("PeoplePositions", back_populates="position", lazy="select")
    person = relationship("People")
    location = relationship("Locations")
    organization = relationship("Organizations")


class People(people_mixin):
    """ Final People model for user
        Contains both all attributes and business logic methods
    """

    __tablename__ = "people"

    positions = relationship("PeoplePositions", back_populates="person", lazy="select")
    reports = relationship("ReportPeople", back_populates="person", lazy="select")


class Locations(location_mixin):
    """ Final Locations model for user
        Contains both all attributes and business logic methods
    """

    __tablename__ = "locations"


class Organizations(organization_mixin):
    """ Final Organizations model for user
        Contains both all attributes and business logic methods
    """

    __tablename__ = "organizations"


class Reports(report_mixin):
    """ Final Reports model for user
        Contains both all attributes and business logic methods
    """

    __tablename__ = "reports"

    people = relationship("ReportPeople", back_populates="report", lazy="select")  # , collection_class=set)
    organization = relationship("Organizations", primaryjoin="Reports.advisorOrganizationUuid == Organizations.uuid")
    location = relationship("Locations")
    organization1 = relationship("Organizations", primaryjoin="Reports.principalOrganizationUuid == Organizations.uuid")
