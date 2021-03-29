from sqlalchemy.orm import relationship

from src.core.model.base.common_attr import common_attr
from src.core.business_logic.overriden.location_mixin import location_mixin
from src.core.business_logic.overriden.organization_mixin import organization_mixin
from src.core.business_logic.overriden.people_mixin import people_mixin
from src.core.business_logic.overriden.position_mixin import position_mixin
from src.core.business_logic.overriden.report_mixin import report_mixin


class Positions(position_mixin, common_attr):
    """ Final Positions model for user
        Contains both all attributes and business logic methods
    """
    __tablename__ = 'positions'
    
    people = relationship("PeoplePositions", back_populates="position")


class People(people_mixin, common_attr):
    """ Final People model for user
        Contains both all attributes and business logic methods
    """
    __tablename__ = 'people'

    positions = relationship("PeoplePositions", back_populates="person")
    reports = relationship("ReportPeople", back_populates="person")
    

class Locations(location_mixin, common_attr):
    """ Final Locations model for user
        Contains both all attributes and business logic methods
    """    
    __tablename__ = 'locations'


class Organizations(organization_mixin, common_attr):
    """ Final Organizations model for user
        Contains both all attributes and business logic methods
    """    
    __tablename__ = 'organizations'


class Reports(report_mixin, common_attr):
    """ Final Reports model for user
        Contains both all attributes and business logic methods
    """    
    __tablename__ = 'reports'

    people = relationship("ReportPeople", back_populates="report")#, collection_class=set)