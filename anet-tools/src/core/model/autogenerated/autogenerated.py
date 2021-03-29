# coding: utf-8
from sqlalchemy import Boolean, Column, Computed, DateTime, Float, ForeignKey, Integer, LargeBinary, String, Text, text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()
metadata = Base.metadata


class ApprovalStep(Base):
    __tablename__ = 'approvalSteps'

    name = Column(String(255))
    uuid = Column(String(36), primary_key=True)
    relatedObjectUuid = Column(String(36), nullable=False, index=True)
    nextStepUuid = Column(ForeignKey('approvalSteps.uuid'), index=True)
    type = Column(Integer, nullable=False)
    restrictedApproval = Column(Boolean, server_default=text("false"))

    parent = relationship('ApprovalStep', remote_side=[uuid])


class Location(Base):
    __tablename__ = 'locations'

    name = Column(String(512), nullable=False, index=True)
    lat = Column(Float(53))
    lng = Column(Float(53))
    createdAt = Column(DateTime, index=True)
    updatedAt = Column(DateTime)
    status = Column(Integer, nullable=False, server_default=text("0"))
    uuid = Column(String(36), primary_key=True)
    customFields = Column(Text)
    full_text = Column(TSVECTOR, Computed('setweight((to_tsvector(\'anet\'::regconfig, (COALESCE(name, \'\'::character varying))::text) || to_tsvector(\'simple\'::regconfig, (COALESCE(name, \'\'::character varying))::text)), \'A\'::"char")', persisted=True))


class Organization(Base):
    __tablename__ = 'organizations'

    shortName = Column(String(255), index=True)
    createdAt = Column(DateTime, index=True)
    updatedAt = Column(DateTime)
    type = Column(Integer, nullable=False, index=True)
    longName = Column(String(255), index=True)
    identificationCode = Column(String(100), unique=True)
    status = Column(Integer, nullable=False, server_default=text("0"))
    uuid = Column(String(36), primary_key=True)
    parentOrgUuid = Column(ForeignKey('organizations.uuid'), index=True)
    customFields = Column(Text)
    full_text = Column(TSVECTOR, Computed('((setweight(to_tsvector(\'simple\'::regconfig, (COALESCE("identificationCode", \'\'::character varying))::text), \'A\'::"char") || setweight(to_tsvector(\'simple\'::regconfig, (COALESCE("shortName", \'\'::character varying))::text), \'A\'::"char")) || setweight((to_tsvector(\'anet\'::regconfig, (COALESCE("longName", \'\'::character varying))::text) || to_tsvector(\'simple\'::regconfig, (COALESCE("longName", \'\'::character varying))::text)), \'B\'::"char"))', persisted=True))

    parent = relationship('Organization', remote_side=[uuid])


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
    domainUsername = Column(String(512))
    country = Column(String(500))
    gender = Column(String(64))
    endOfTourDate = Column(DateTime)
    uuid = Column(String(36), primary_key=True)
    code = Column(String(100))
    customFields = Column(Text)
    avatar = Column(LargeBinary)
    full_text = Column(TSVECTOR, Computed('(((((setweight(to_tsvector(\'simple\'::regconfig, (COALESCE(name, \'\'::character varying))::text), \'A\'::"char") || setweight(to_tsvector(\'simple\'::regconfig, (COALESCE(code, \'\'::character varying))::text), \'A\'::"char")) || setweight(to_tsvector(\'simple\'::regconfig, (COALESCE("domainUsername", \'\'::character varying))::text), \'A\'::"char")) || setweight(to_tsvector(\'simple\'::regconfig, (COALESCE("emailAddress", \'\'::character varying))::text), \'A\'::"char")) || setweight(to_tsvector(\'simple\'::regconfig, (COALESCE("phoneNumber", \'\'::character varying))::text), \'A\'::"char")) || setweight((to_tsvector(\'anet\'::regconfig, COALESCE(biography, \'\'::text)) || to_tsvector(\'simple\'::regconfig, COALESCE(biography, \'\'::text))), \'B\'::"char"))', persisted=True))


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
    customFields = Column(Text)

    person = relationship('Person')
    location = relationship('Location')
    organization = relationship('Organization')


class Report(Base):
    __tablename__ = 'reports'

    createdAt = Column(DateTime, index=True)
    updatedAt = Column(DateTime, index=True)
    intent = Column(Text)
    exsum = Column(Text)
    text = Column(Text)
    nextSteps = Column(Text)
    state = Column(Integer, nullable=False)
    engagementDate = Column(DateTime, index=True)
    atmosphere = Column(Integer)
    atmosphereDetails = Column(Text)
    keyOutcomes = Column(Text)
    cancelledReason = Column(Integer)
    releasedAt = Column(DateTime, index=True)
    uuid = Column(String(36), primary_key=True)
    advisorOrganizationUuid = Column(ForeignKey('organizations.uuid'), index=True)
    approvalStepUuid = Column(ForeignKey('approvalSteps.uuid'), index=True)
    locationUuid = Column(ForeignKey('locations.uuid'), index=True)
    principalOrganizationUuid = Column(ForeignKey('organizations.uuid'), index=True)
    legacyId = Column(Integer)
    duration = Column(Integer)
    customFields = Column(Text)
    full_text = Column(TSVECTOR, Computed('(((setweight((to_tsvector(\'anet\'::regconfig, COALESCE(intent, \'\'::text)) || to_tsvector(\'simple\'::regconfig, COALESCE(intent, \'\'::text))), \'A\'::"char") || setweight((to_tsvector(\'anet\'::regconfig, COALESCE("keyOutcomes", \'\'::text)) || to_tsvector(\'simple\'::regconfig, COALESCE("keyOutcomes", \'\'::text))), \'A\'::"char")) || setweight((to_tsvector(\'anet\'::regconfig, COALESCE("nextSteps", \'\'::text)) || to_tsvector(\'simple\'::regconfig, COALESCE("nextSteps", \'\'::text))), \'A\'::"char")) || setweight((to_tsvector(\'anet\'::regconfig, COALESCE(text, \'\'::text)) || to_tsvector(\'simple\'::regconfig, COALESCE(text, \'\'::text))), \'B\'::"char"))', persisted=True))

    organization = relationship('Organization', primaryjoin='Report.advisorOrganizationUuid == Organization.uuid')
    approvalStep = relationship('ApprovalStep')
    location = relationship('Location')
    organization1 = relationship('Organization', primaryjoin='Report.principalOrganizationUuid == Organization.uuid')
