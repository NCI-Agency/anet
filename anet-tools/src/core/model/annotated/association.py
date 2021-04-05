from sqlalchemy import Boolean, Column, DateTime, ForeignKey, text
from sqlalchemy.orm import relationship
from src.core.model.base.base_model import BaseModel


class PeoplePositions(BaseModel):
    """ Association object holds many-to-many 
    relationship between people and position
    """
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


class ReportPeople(BaseModel):
    """ Association object holds many-to-many 
    relationship between people and report
    """
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

    def __eq__(self, other):
        # Check if two ReportPeople objects have same person uuid
        return self.person.uuid == other.person.uuid
