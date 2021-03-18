import copy
import datetime

from sqlalchemy import and_, Boolean, Column, DateTime, ForeignKey, text
from sqlalchemy_mixins import ActiveRecordMixin
from sqlalchemy.orm import relationship

from src.core.models import Base
from src.core.base_methods import base_methods


class BaseModel(Base, ActiveRecordMixin):
    __abstract__ = True


class anet_logic_mixin(BaseModel):
    __abstract__ = True

    def insert_entity(self, utc_now):
        """Insert and flush a new record
        """
        self.createdAt = utc_now
        self.updatedAt = utc_now
        if self.__tablename__ == "people":
            # utc_now = datetime.datetime.now()
            PeoplePositions.create(createdAt=utc_now, person=self)
        else:
            BaseModel.session.add(self)
            BaseModel.session.flush()

    def update_entity(self, utc_now):
        """Update and flush an existing record
        """
        obj = type(self).find(self.uuid)
        self.updatedAt = utc_now
        for attr, value in self.__dict__.items():
            if attr != "_sa_instance_state":
                setattr(obj, attr, value)
        BaseModel.session.flush()

    def insert_update_nested_entity(self, utc_now, update_rules):
        if self.__tablename__ == "positions":
            self_c = copy.deepcopy(self)
            if base_methods.has_entity_relation(self, "person"):
                business_logic_methods.position_relation_process(self, "person", self_c, update_rules, PeoplePositions, utc_now)

            if base_methods.has_entity_relation(self, "location"):
                business_logic_methods.position_relation_process(self, "location", self_c, update_rules, PeoplePositions, utc_now)

            if base_methods.has_entity_relation(self, "organization"):
                business_logic_methods.position_relation_process(self, "organization", self_c, update_rules, PeoplePositions, utc_now)

            if base_methods.is_entity_update(self, update_rules):
                if base_methods.has_entity_relation(self, "person"):
                    business_logic_methods.remove_positions_association_with_person(self, PeoplePositions, utc_now)
                self_c.update_entity(utc_now)
            else:
                self_c.insert_entity(utc_now)

            if base_methods.has_entity_relation(self, "person"):
                business_logic_methods.add_new_association(self, PeoplePositions, utc_now)
        
        elif self.__tablename__ == "reports":
            
            if base_methods.is_entity_update(self, update_rules):
                for rp in self.people:
                    prs = rp.person
                    prs.set_session(self.session)
                    if base_methods.is_entity_update(prs, update_rules):
                        delattr(rp.person, "reports")
                        prs.updatedAt = utc_now
                        prs.update_entity(utc_now, update_rules)
                    else:
                        delattr(rp, "report")
                        rp.person.createdAt = utc_now
                        rp.person.updatedAt = utc_now
                        obj = type(self).find(self.uuid)
                        obj.people.append(rp)
                        BaseModel.session.flush()
                        PeoplePositions.create(createdAt = utc_now, person = rp.person)
                        BaseModel.session.flush()
                delattr(self, "people")
                self.update_entity(utc_now)
            
            else:
                self.insert_entity(utc_now)
                for rp in self.people:
                    PeoplePositions.create(createdAt=utc_now, person=rp.person)
                    BaseModel.session.flush()
        
        BaseModel.session.flush()

    @classmethod
    def commit(cls):
        cls.session.commit()


class business_logic_methods:
    @staticmethod
    def position_relation_process(entity, relation_name, entity_c, update_rules, PeoplePositions, utc_now):
        if base_methods.is_entity_update(getattr(entity, relation_name), update_rules):
            if relation_name == "person":
                business_logic_methods.remove_persons_association_with_position(entity, PeoplePositions, utc_now)
                entity_c.currentPersonUuid = getattr(entity, relation_name).uuid
            elif relation_name == "location":
                entity_c.locationUuid = getattr(entity, relation_name).uuid
            elif relation_name == "organization":
                entity_c.organizationUuid = getattr(entity, relation_name).uuid
            getattr(entity, relation_name).update_entity(utc_now)
            delattr(entity_c, relation_name)
        else:
            getattr(entity_c, relation_name).uuid = getattr(entity, relation_name).uuid
            getattr(entity_c, relation_name).createdAt = utc_now
            getattr(entity_c, relation_name).updatedAt = utc_now
            entity.session.add(getattr(entity_c, relation_name))
            entity.session.flush()
            if relation_name == "person":
                entity_c.currentPersonUuid = getattr(entity, relation_name).uuid
            elif relation_name == "location":
                entity_c.locationUuid = getattr(entity, relation_name).uuid
            elif relation_name == "organization":
                entity_c.organizationUuid = getattr(entity, relation_name).uuid

    @staticmethod
    def remove_persons_association_with_position(position, PeoplePositions, utc_now):
        pos = position.session \
            .query(position.__class__) \
            .filter(position.__class__.currentPersonUuid == position.person.uuid) \
            .all()
        if len(pos) == 0:
            return
        if pos[0].uuid == position.uuid:
            return
        position.session.flush()
        pp_list = position.session \
            .query(PeoplePositions) \
            .filter(and_(PeoplePositions.personUuid == position.person.uuid, PeoplePositions.positionUuid == pos[0].uuid)) \
            .all()

        if len(pp_list) == 0:
            raise("Association does not exist")

        for pp in pp_list:
            if pp.endedAt is None:
                # days, seconds, then other fields.
                pp.endedAt = utc_now - datetime.timedelta(0, 1)
                pp.position.currentPersonUuid = None
                PeoplePositions.create(
                    createdAt=utc_now, positionUuid=pp.positionUuid)
                pp.session.flush()
                break

    @staticmethod
    def remove_positions_association_with_person(position, PeoplePositions, utc_now):
        pos = position.session \
            .query(position.__class__) \
            .filter(position.__class__.uuid == position.uuid) \
            .all()[0]
        if pos.currentPersonUuid is None or pos.currentPersonUuid == position.person.uuid:
            return
        pp_list = position.session \
            .query(PeoplePositions) \
            .filter(and_(PeoplePositions.positionUuid == position.uuid, PeoplePositions.personUuid == pos.currentPersonUuid)) \
            .all()
        if len(pp_list) == 0:
            raise("Association does not exist")
        for pp in pp_list:
            if pp.endedAt is None:
                pp.endedAt = utc_now - datetime.timedelta(0, 1)
                pp.position.currentPersonUuid = None
                PeoplePositions.create(createdAt=utc_now, personUuid=pp.personUuid)
                pp.session.flush()
                break

    @staticmethod
    def add_new_association(position, PeoplePositions, utc_now):
        pp_list = position.session \
            .query(PeoplePositions) \
            .filter(and_(PeoplePositions.positionUuid == position.uuid, PeoplePositions.personUuid == position.person.uuid)) \
            .all()
        if len(pp_list) != 0:
            for pp in pp_list:
                if pp.endedAt is None and pp.personUuid == position.person.uuid and pp.positionUuid == position.uuid:
                    return
        PeoplePositions.create(createdAt=utc_now, positionUuid=position.uuid)
        PeoplePositions.create(createdAt=utc_now, personUuid=position.person.uuid, positionUuid=position.uuid)
        PeoplePositions.session.flush()

@property
def private(self):
    raise AttributeError

class PeoplePositions(anet_logic_mixin):
    __tablename__ = "peoplePositions"

    createdAt = Column('createdAt', DateTime)
    personUuid = Column('personUuid', ForeignKey('people.uuid'), index=True)
    positionUuid = Column('positionUuid', ForeignKey(
        'positions.uuid'), index=True)
    endedAt = Column('endedAt', DateTime)
    __mapper_args__ = {
        "primary_key": [createdAt, personUuid, positionUuid]
    }

    person = relationship("People", back_populates="positions")
    position = relationship("Positions", back_populates="people")


class Positions(anet_logic_mixin):
    __tablename__ = 'positions'
    __table_args__ = {'extend_existing': True}
    full_text = private
    people = relationship("PeoplePositions", back_populates="position")


class People(anet_logic_mixin):
    __tablename__ = 'people'
    __table_args__ = {'extend_existing': True}
    full_text = private

    positions = relationship("PeoplePositions", back_populates="person")
    reports = relationship("ReportPeople", back_populates="person")


class Locations(anet_logic_mixin):
    __tablename__ = 'locations'
    __table_args__ = {'extend_existing': True}
    full_text = private


class Organizations(anet_logic_mixin):
    __tablename__ = 'organizations'
    __table_args__ = {'extend_existing': True}
    full_text = private
    

class Reports(anet_logic_mixin):
    __tablename__ = 'reports'
    __table_args__ = {'extend_existing': True}
    full_text = private

    people = relationship("ReportPeople", back_populates="report")


class ReportPeople(anet_logic_mixin):
    __tablename__ = "reportPeople"

    isPrimary = Column('isPrimary', Boolean, server_default=text("false"))
    personUuid = Column('personUuid', ForeignKey('people.uuid'), index=True)
    reportUuid = Column('reportUuid', ForeignKey('reports.uuid'), index=True)
    isAttendee = Column('isAttendee', Boolean, server_default=text("true"))
    isAuthor = Column('isAuthor', Boolean, server_default=text("false"))

    __mapper_args__ = { 
        "primary_key": [personUuid, reportUuid]
    }

    person = relationship("People", back_populates="reports")
    report = relationship("Reports", back_populates="people")