from enum import Enum

class person_status(Enum):
    ACTIVE = 0
    INACTIVE = 1

class person_role(Enum):
    ADVISOR = 0
    PRINCIPAL = 1

class position_type(Enum):
    ADVISOR = 0
    PRINCIPAL = 1
    SUPER_USER = 2
    ADMINISTRATOR = 3

class position_status(Enum):
    ACTIVE = 0
    INACTIVE = 1

class organization_type(Enum):
    ADVISOR_ORG = 0
    PRINCIPAL_ORG = 1

class organization_status(Enum):
    ACTIVE = 0
    INACTIVE = 1

class report_state(Enum):
    DRAFT = 0
    PENDING_APPROVAL = 1
    PUBLISHED = 2
    REJECTED = 3
    CANCELLED = 4

class report_atmosphere(Enum):
    POSITIVE = 0
    NEUTRAL = 1
    NEGATIVE = 2

class report_cancelled_reason(Enum):
    CANCELLED_BY_ADVISOR = 0
    CANCELLED_BY_PRINCIPAL = 1
    CANCELLED_DUE_TO_TRANSPORTATION = 2
    CANCELLED_DUE_TO_FORCE_PROTECTION = 3
    CANCELLED_DUE_TO_ROUTES = 4
    CANCELLED_DUE_TO_THREAT = 5
    NO_REASON_GIVEN = 6
    CANCELLED_DUE_TO_AVAILABILITY_OF_INTERPRETERS = 7
    CANCELLED_DUE_TO_NETWORK_ISSUES = 8

