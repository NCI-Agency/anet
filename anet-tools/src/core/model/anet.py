from sqlalchemy.orm import relationship

from src.core.mixin import anet_mixin
from src.core.model.association import BaseModel
from src.core.model.base import common_anet_obj_attr


class Positions(anet_mixin, common_anet_obj_attr):
    __tablename__ = 'positions'
    
    people = relationship("PeoplePositions", back_populates="position")


class People(anet_mixin, common_anet_obj_attr):
    __tablename__ = 'people'
    
    positions = relationship("PeoplePositions", back_populates="person")
    reports = relationship("ReportPeople", back_populates="person")


class Locations(anet_mixin, common_anet_obj_attr):
    __tablename__ = 'locations'


class Organizations(anet_mixin, common_anet_obj_attr):
    __tablename__ = 'organizations'


class Reports(anet_mixin, common_anet_obj_attr):
    __tablename__ = 'reports'

    people = relationship("ReportPeople", back_populates="report")