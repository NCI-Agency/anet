# coding: utf-8
from sqlalchemy import Boolean, Column, Computed, DateTime, Float, ForeignKey, Integer, LargeBinary, String, Table, Text, UniqueConstraint, text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy_mixins import ActiveRecordMixin
import datetime
import uuid
import copy
from src.core.base_methods import base_methods

Base = declarative_base()
metadata = Base.metadata

class BaseModel(Base, ActiveRecordMixin):
    __abstract__ = True

class anet_logic_mixin(BaseModel):
    __abstract__ = True

    def insert_entity(self, createdAt):
        """Insert and flush a new record
        """
        self.createdAt = createdAt
        self.updatedAt = createdAt
        if self.__tablename__ == "people":
            utc_now = datetime.datetime.now()
            PeoplePositions.create(createdAt = utc_now, person = self)
        else:
            BaseModel.session.add(self)
            BaseModel.session.flush()
    
    def update_entity(self, updatedAt):
        """Update and flush an existing record
        """
        obj = type(self).find(self.uuid)
        
        self.updatedAt = updatedAt
        for attr, value in self.__dict__.items():
            if attr != "_sa_instance_state":
                setattr(obj, attr, value)
        BaseModel.session.flush()

    def insert_update_nested_entity(self, update_rules, utc_now):
        self_c = copy.deepcopy(self)
        
        if base_methods.has_entity_relation(self, "person"):
            base_methods.relation_process(self, "person", self_c, update_rules, PeoplePositions, utc_now)

        if base_methods.has_entity_relation(self, "location"):
            base_methods.relation_process(self, "location", self_c, update_rules, PeoplePositions, utc_now)

        if base_methods.has_entity_relation(self, "organization"):
            base_methods.relation_process(self, "organization", self_c, update_rules, PeoplePositions, utc_now)
            
        if base_methods.is_entity_update(self, update_rules):
            if base_methods.has_entity_relation(self, "person"):
                base_methods.remove_positions_association_with_person(self, PeoplePositions, utc_now)
            self_c.update_entity(utc_now)
        else:
            self_c.insert_entity(utc_now)
        
        if base_methods.has_entity_relation(self, "person"):
            base_methods.add_new_association(self, PeoplePositions, utc_now)
        
        BaseModel.session.flush()
        
    @classmethod
    def commit(cls):
        cls.session.commit()

        
class PeoplePositions(anet_logic_mixin):
    __tablename__ = "peoplePositions"
    createdAt = Column('createdAt', DateTime)
    personUuid = Column('personUuid', ForeignKey('people.uuid'), index=True)
    positionUuid = Column('positionUuid', ForeignKey('positions.uuid'), index=True)
    endedAt = Column('endedAt', DateTime)
    __mapper_args__ = {
        "primary_key":[createdAt, personUuid, positionUuid]
    }

    person = relationship("Person", back_populates="positions")
    position = relationship("Position", back_populates="people")


class Position(anet_logic_mixin):
    __tablename__ = 'positions'

    code = Column(String(100), unique=True)
    name = Column(String(512), nullable=False, index=True)
    createdAt = Column(DateTime, index=True)
    updatedAt = Column(DateTime)
    type = Column(Integer, nullable=False)
    status = Column(Integer, nullable=False, server_default=text("0"))
    uuid = Column(String(36), primary_key=True)
    currentPersonUuid = Column(ForeignKey('people.uuid'), unique=True)
    locationUuid = Column(ForeignKey('locations.uuid'), index=True)
    organizationUuid = Column(ForeignKey('organizations.uuid'), index=True)
    
    person = relationship("Person")
    location = relationship('Location')
    organization = relationship('Organization')
    people = relationship("PeoplePositions", back_populates="position")
    
    
class Person(anet_logic_mixin):
    __tablename__ = 'people'

    name = Column(String(255), index=True)
    status = Column(Integer)
    emailAddress = Column(String(255))
    phoneNumber = Column(String(100))
    rank = Column(String(255), index=True)
    biography = Column(Text)
    createdAt = Column(DateTime, index=True)
    updatedAt = Column(DateTime)
    role = Column(Integer, nullable=False)
    pendingVerification = Column(Boolean, server_default=text("false"))
    domainUsername = Column(String(500))
    country = Column(String(500))
    gender = Column(String(64))
    endOfTourDate = Column(DateTime)
    uuid = Column(String(36), primary_key=True)
    code = Column(String(100))
    customFields = Column(Text)
    avatar = Column(LargeBinary)
    
    positions = relationship("PeoplePositions", back_populates="person")

    
class Location(anet_logic_mixin):
    __tablename__ = 'locations'

    name = Column(String(500), nullable=False, index=True)
    lat = Column(Float(53))
    lng = Column(Float(53))
    createdAt = Column(DateTime, index=True)
    updatedAt = Column(DateTime)
    status = Column(Integer, nullable=False, server_default=text("0"))
    uuid = Column(String(36), primary_key=True)

    
class Organization(anet_logic_mixin):
    __tablename__ = 'organizations'

    shortName = Column(String(255), index=True)
    createdAt = Column(DateTime, index=True)
    updatedAt = Column(DateTime)
    type = Column(Integer, nullable=False, index=True)
    longName = Column(Text, index=True)
    identificationCode = Column(String(100), unique=True)
    status = Column(Integer, nullable=False, server_default=text("0"))
    uuid = Column(String(36), primary_key=True)
    parentOrgUuid = Column(ForeignKey('organizations.uuid'), index=True)

    parent = relationship('Organization', remote_side=[uuid])