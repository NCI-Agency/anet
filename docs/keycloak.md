# Setting up Keycloak (user authentication)
This document describes how to configure Keycloak, for [development](#dev), [production](#rh) on a Red Hat platform, and [production with federated users from a Windows Active Directory](#ad).
On development, Keycloak runs in a Docker container, see [build.gradle](../build.gradle) for the available commands. For production, the directory [scripts](../scripts/) contains some convenient scripts for starting Keycloak.

## <a name="dev"></a>Setting up Keycloak for development
The Keycloak container for development has the following set-up (as loaded upon creation of the Keycloak Docker container by loading [ANET-Realm-export.json](../keycloak/import/ANET-realm.json)):

To access the container

### Access Keycloak container

|          |                        |
|----------|------------------------|
| URL      | http://localhost:9080/ |
| username | `admin`                |
| password | `admin`                |

### Realm definition
![Realm definition](images/keycloak-dev-realm.png)

### Confidential client definition (used by the server-side)
![Confidential client definition](images/keycloak-dev-client.png)

The credentials (to be used in [anet.yml](../anet.yml)):
![Confidential client credentials](images/keycloak-dev-client-creds.png)

### Public client definition (used by the client-side)
![Public client definition](images/keycloak-dev-client-public.png)

### Authentication settings of the realm
![Realm definition](images/keycloak-dev-authentication.png)

### <a name="dev-users"></a>Users defined locally in the realm
![Realm definition](images/keycloak-dev-users.png)


## <a name="rh"></a>Setting up Keycloak for production on Red Hat
A Keycloak container running on e.g. a Red Hat platform (where you would define the users locally in Keycloak) can use the following set-up:

### Realm definition
![Realm definition](images/keycloak-rh-realm.png)

### Confidential client definition (used by the server-side)
![Confidential client definition](images/keycloak-rh-client.png)

The credentials to be used in `anet.yml` can be found under the **Credentials** tab.

### Public client definition (used by the client-side)
![Public client definition](images/keycloak-rh-client-public.png)

### Authentication settings of the realm
![Realm definition](images/keycloak-rh-authentication.png)

### Users defined locally in the realm
Define your users under the **Users** section of the realm.


## <a name="ad"></a>Setting up Keycloak for with federated users from a Windows Active Directory
See [Kerberos set-up](kerberos.md) on how to integrate the Keycloak server with the AD.

A Keycloak container running on e.g. a Red Hat platform that gets its users from a Windows Active Directory (and can support SSO/Single Sign-On) can use the following set-up:

### Realm definition
![Realm definition](images/keycloak-ad-realm.png)

### Mapping first name from AD to the realm
To get newly on-boarded user's first names correctly mapped from AD to the realm, you may want to add a mapper **first name** to the realm:
![Realm mappers](images/keycloak-ad-realm-mappers.png)
![Realm first name mapper](images/keycloak-ad-realm-first-name-mapper.png)

### Confidential client definition (used by the server-side)
![Confidential client definition](images/keycloak-ad-client.png)

The credentials to be used in `anet.yml` can be found under the **Credentials** tab.

### Public client definition (used by the client-side)
![Public client definition](images/keycloak-ad-client-public.png)

### User federation settings of the realm
This is an example configuration to connect to an Active Directory; see [Keycloak documentation](https://www.keycloak.org/docs/latest/server_admin/index.html#_ldap) for additional hints on how to configure it:
![Federation definition](images/keycloak-ad-federation.png)

### Authentication settings of the realm
Take note of the *Kerberos* setting here (necessary if you want to support SSO):
![Realm definition](images/keycloak-ad-authentication.png)
