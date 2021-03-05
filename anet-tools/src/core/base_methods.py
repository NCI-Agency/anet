import datetime
import uuid

from sqlalchemy import and_


class base_methods:
    @staticmethod
    def has_entity_relation(entity, rel_attr):
        if not hasattr(entity, rel_attr):
            return False
        if getattr(entity, rel_attr) is None or getattr(entity, rel_attr) == []:
            return False
        else:
            return True

    @staticmethod
    def has_entity_uuid(entity):
        if getattr(entity, "uuid") is None:
            return False
        else:
            return True

    @staticmethod
    def get_new_uuid():
        return str(uuid.uuid4())

    @classmethod
    def add_new_uuid(cls, entity, relation="", both=False):
        if relation == "":
            entity.uuid = cls.get_new_uuid()
        else:
            if both:
                entity.uuid = cls.get_new_uuid()
            setattr(getattr(entity, relation), "uuid", cls.get_new_uuid())
        return entity

    @staticmethod
    def query_with_rules(entity, update_rules):
        query_result_list = list()
        for update_rule in update_rules["tables"]:
            if entity.__tablename__ == update_rule["name"]:
                query_result_list = entity.session \
                                        .query(entity.__class__) \
                                        .filter(and_(getattr(entity.__class__, attr_name) == getattr(entity, attr_name) for attr_name in tuple(update_rule["columns"]))) \
                                        .all()
                break
        return query_result_list

    @classmethod
    def is_entity_update(cls, entity, update_rules):
        if cls.has_entity_uuid(entity):
            query_result = type(entity).find(entity.uuid)
            if query_result is None:
                return False
            else:
                return True
        elif update_rules == {"tables": []}:
            entity.uuid = cls.get_new_uuid()
            return False
        else:
            query_result_list = cls.query_with_rules(entity, update_rules)
            if len(query_result_list) == 1:
                entity.uuid = query_result_list[0].uuid
                return True
            else:
                cls.add_new_uuid(entity)
                return False

    @staticmethod
    def is_entity_single(entity):
        if entity.__tablename__ not in ["positions", "reports"]:
            return True
        else:
            if base_methods.has_entity_relation(entity, "person") or \
                base_methods.has_entity_relation(entity, "location") or \
                base_methods.has_entity_relation(entity, "organization"):
                return False
            else:
                return True

    @staticmethod
    def position_relation_process(entity, relation_name, entity_c, update_rules, PeoplePositions, utc_now):
        if base_methods.is_entity_update(getattr(entity, relation_name), update_rules):
            if relation_name == "person":
                base_methods.remove_persons_association_with_position(entity, PeoplePositions, utc_now)
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
