import datetime

from sqlalchemy import and_
from src.core.business_logic.base.base_methods import base_methods

class logic_methods:
    @staticmethod
    def position_relation_process(entity, relation_name, entity_c, update_rules, PeoplePositions, utc_now):
        if base_methods.is_entity_update(getattr(entity, relation_name), update_rules):
            if relation_name == "person":
                logic_methods.remove_persons_association_with_position(entity, PeoplePositions, utc_now)
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
