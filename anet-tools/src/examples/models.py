# coding: utf-8
from sqlalchemy import Boolean, Column, Computed, DateTime, Float, ForeignKey, Integer, LargeBinary, String, Table, Text, UniqueConstraint, text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy_mixins import ActiveRecordMixin
import datetime
import uuid
Base = declarative_base()
metadata = Base.metadata

class BaseModel(Base, ActiveRecordMixin):
    __abstract__ = True
    pass
   
class anet_logic_mixin(BaseModel):
    __abstract__ = True

    def insert_single_entity(self):
        """Insert and commit a new record
        """
        if self.__tablename__ == "people":
            utc_now = datetime.datetime.now()
            peoplePositions = PeoplePositions.create(createdAt = utc_now, person = self)
            peoplePositions.commit()
        else:
            self.session.add(self)
            self.session.flush()
            self.commit()
    
    def update_single_entity(self):
        """Update and commit a existing record
        """
        
        obj = type(self).find(self.uuid)
        
        for attr, value in self.__dict__.items():
            if attr != "_sa_instance_state":
                setattr(obj, attr, value)
        self.session.flush()
        self.commit()
    
    # Implementing in two functions below,
    # to check if position has person or location or organization. if it has, they must be associated.
    # Old associations must be removed. For this reason, i will be check
    # if position has person, does the person have the old position
    # if position has person, does the position have the old person.
    # if position has location, does the position have the old location.
    # .
    # .
    # .    
    def insert_nested_entity(self):
        pass
    
    def update_nested_entity(self):
        pass
    
    @classmethod
    def commit(cls):
        cls.session.commit()

        
class PeoplePositions(anet_logic_mixin):
    __tablename__ = "peoplePositions"
    createdAt = Column('createdAt', DateTime, primary_key=True)
    personUuid = Column('personUuid', ForeignKey('people.uuid'), index=True)
    positionUuid = Column('positionUuid', ForeignKey('positions.uuid'), index=True)
    endedAt = Column('endedAt', DateTime)
    
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

    
class Location(Base):
    __tablename__ = 'locations'

    name = Column(String(500), nullable=False, index=True)
    lat = Column(Float(53))
    lng = Column(Float(53))
    createdAt = Column(DateTime, index=True)
    updatedAt = Column(DateTime)
    status = Column(Integer, nullable=False, server_default=text("0"))
    uuid = Column(String(36), primary_key=True)

    
class Organization(Base):
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