from sqlalchemy_mixins import ActiveRecordMixin
from src.core.model.core import Base

@property
def private(self):
    raise AttributeError

class common_anet_obj_attr:
    full_text = private

class BaseModel(Base, ActiveRecordMixin):
    __abstract__ = True
