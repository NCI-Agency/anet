from src.core.business_logic.base.base_mixin import base_mixin

class organization_mixin(base_mixin):
    """ Inherits from base_mixin
        Overrides business logic methods for organization objects
    """
    __abstract__ = True
    
    def get_fresh_one(self):
        """ Returns fresh organization object which has not any relationship
        """
        new_obj = self.__class__()
        for key, value in self.__dict__.items():
            if key not in ["_sa_instance_state", "parent"]:
                setattr(new_obj, key, value)
        return new_obj