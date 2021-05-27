import uuid

from sqlalchemy import and_


class base_methods:
    """ Base methods used in src.core.business_logic package
    """

    @staticmethod
    def check_if_entity_allowed(entity):
        if entity.__tablename__ not in ["positions", "people", "locations", "organizations", "reports"]:
            raise Exception(f"You can not import to {entity.__tablename__} table!")

    @staticmethod
    def has_entity_relation(entity, rel_attr):
        if getattr(entity, rel_attr):
            return True
        else:
            return False

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
    def set_new_uuid(cls, entity, relation="", both=False):
        if relation == "":
            entity.uuid = cls.get_new_uuid()
        else:
            if both:
                entity.uuid = cls.get_new_uuid()
            setattr(getattr(entity, relation), "uuid", cls.get_new_uuid())
        return entity

    @staticmethod
    def query_with_rules(entity, update_rules, session):
        query_result_list = list()
        for update_rule in update_rules["tables"]:
            if entity.__tablename__ == update_rule["name"]:
                query_result_list = (
                    session.query(entity.__class__)
                    .filter(
                        and_(
                            getattr(entity.__class__, attr_name) == getattr(entity, attr_name)
                            for attr_name in tuple(update_rule["columns"])
                        )
                    )
                    .all()
                )
                break
        return query_result_list

    @classmethod
    def is_entity_update(cls, entity, update_rules, session):
        if cls.has_entity_uuid(entity):
            query_result = session.query(type(entity)).get(entity.uuid)
            if query_result is None:
                return False
            else:
                return True
        elif update_rules == {"tables": []}:
            entity.uuid = cls.get_new_uuid()
            return False
        else:
            query_result_list = cls.query_with_rules(entity, update_rules, session)
            if len(query_result_list) == 1:
                entity.uuid = query_result_list[0].uuid
                return True
            else:
                cls.set_new_uuid(entity)
                return False

    @staticmethod
    def is_entity_single(entity):
        if entity.__tablename__ not in ["positions", "reports"]:
            return True
        else:
            if entity.__tablename__ == "positions":
                if (
                    base_methods.has_entity_relation(entity, "person")
                    or base_methods.has_entity_relation(entity, "location")
                    or base_methods.has_entity_relation(entity, "organization")
                ):
                    return False
                else:
                    return True
            elif entity.__tablename__ == "reports":
                if len(entity.people) == 0:
                    return True
                else:
                    return False
            else:
                raise Exception(f"Logic is not implemented for {entity.__tablename__} table!")
