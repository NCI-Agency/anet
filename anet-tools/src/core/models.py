# coding: utf-8
from sqlalchemy import Boolean, Column, Computed, DateTime, Float, ForeignKey, Integer, LargeBinary, String, Table, Text, text
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()
metadata = Base.metadata


class Location(Base):
    __tablename__ = 'locations'

    name = Column(String(500), nullable=False, index=True)
    lat = Column(Float(53))
    lng = Column(Float(53))
    createdAt = Column(DateTime, index=True)
    updatedAt = Column(DateTime)
    status = Column(Integer, nullable=False, server_default=text("0"))
    uuid = Column(String(36), primary_key=True)
    full_text = Column(TSVECTOR, Computed('setweight((to_tsvector(\'anet\'::regconfig, (COALESCE(name, \'\'::character varying))::text) || to_tsvector(\'simple\'::regconfig, (COALESCE(name, \'\'::character varying))::text)), \'A\'::"char")', persisted=True))


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
    full_text = Column(TSVECTOR, Computed('((setweight(to_tsvector(\'simple\'::regconfig, (COALESCE("identificationCode", \'\'::character varying))::text), \'A\'::"char") || setweight(to_tsvector(\'simple\'::regconfig, (COALESCE("shortName", \'\'::character varying))::text), \'A\'::"char")) || setweight((to_tsvector(\'anet\'::regconfig, COALESCE("longName", \'\'::text)) || to_tsvector(\'simple\'::regconfig, COALESCE("longName", \'\'::text))), \'B\'::"char"))', persisted=True))

    parent = relationship('Organization', remote_side=[uuid])
    tasks = relationship('Task', secondary='taskTaskedOrganizations')


class Person(Base):
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
    full_text = Column(TSVECTOR, Computed('(((((setweight(to_tsvector(\'simple\'::regconfig, (COALESCE(name, \'\'::character varying))::text), \'A\'::"char") || setweight(to_tsvector(\'simple\'::regconfig, (COALESCE(code, \'\'::character varying))::text), \'A\'::"char")) || setweight(to_tsvector(\'simple\'::regconfig, (COALESCE("domainUsername", \'\'::character varying))::text), \'A\'::"char")) || setweight(to_tsvector(\'simple\'::regconfig, (COALESCE("emailAddress", \'\'::character varying))::text), \'A\'::"char")) || setweight(to_tsvector(\'simple\'::regconfig, (COALESCE("phoneNumber", \'\'::character varying))::text), \'A\'::"char")) || setweight((to_tsvector(\'anet\'::regconfig, COALESCE(biography, \'\'::text)) || to_tsvector(\'simple\'::regconfig, COALESCE(biography, \'\'::text))), \'B\'::"char"))', persisted=True))


class Task(Base):
    __tablename__ = 'tasks'

    shortName = Column(String(100), unique=True)
    longName = Column(String(255))
    category = Column(String(255), index=True)
    createdAt = Column(DateTime, index=True)
    updatedAt = Column(DateTime)
    status = Column(Integer, nullable=False, server_default=text("0"))
    projectedCompletion = Column(DateTime)
    plannedCompletion = Column(DateTime)
    customField = Column(Text)
    customFieldEnum1 = Column(Text)
    customFieldEnum2 = Column(Text)
    uuid = Column(String(36), primary_key=True)
    customFieldRef1Uuid = Column(ForeignKey('tasks.uuid'), index=True)
    customFields = Column(Text)
    full_text = Column(TSVECTOR, Computed('(setweight(to_tsvector(\'simple\'::regconfig, (COALESCE("shortName", \'\'::character varying))::text), \'A\'::"char") || setweight((to_tsvector(\'anet\'::regconfig, (COALESCE("longName", \'\'::character varying))::text) || to_tsvector(\'simple\'::regconfig, (COALESCE("longName", \'\'::character varying))::text)), \'A\'::"char"))', persisted=True))

    parent = relationship('Task', remote_side=[uuid])


class Position(Base):
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
    full_text = Column(TSVECTOR, Computed('(setweight(to_tsvector(\'simple\'::regconfig, (COALESCE(code, \'\'::character varying))::text), \'A\'::"char") || setweight((to_tsvector(\'anet\'::regconfig, (COALESCE(name, \'\'::character varying))::text) || to_tsvector(\'simple\'::regconfig, (COALESCE(name, \'\'::character varying))::text)), \'A\'::"char"))', persisted=True))

    person = relationship('Person')
    location = relationship('Location')
    organization = relationship('Organization')


t_taskTaskedOrganizations = Table(
    'taskTaskedOrganizations', metadata,
    Column('taskUuid', ForeignKey('tasks.uuid'), nullable=False, index=True),
    Column('organizationUuid', ForeignKey('organizations.uuid'), nullable=False, index=True)
)


t_peoplePositions = Table(
    'peoplePositions', metadata,
    Column('createdAt', DateTime),
    Column('personUuid', ForeignKey('people.uuid'), index=True),
    Column('positionUuid', ForeignKey('positions.uuid'), index=True),
    Column('endedAt', DateTime)
)
