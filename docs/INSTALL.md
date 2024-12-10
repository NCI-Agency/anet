# ANET Installation Documentation

## Scope
This document covers the steps required to deploy ANET to a server environment.

## Environment

- **Hardware**: ANET does not have specific required hardware. Hardware recommendations are:
    - 1x RHEL (8 or newer) Application Server (50 GB HDD, 16 GB RAM, 4x CPU Cores)
    - 1x Postgres (12 or greater) Database Server
- **Software**: Software requirements:
    - Administration Privileges
    - Optional: A valid SSL certificate for the domain name of the application server
    - Users are required to have a modern web browser (Mozilla Firefox, Google Chrome, Microsoft Edge or other with good HTML5 support);
      IE11 is not supported
- **Network Accessibility**
    - Users will access the Application Server over HTTPS (`443`)
    - The Application Server will access the PostgreSQL server over port `5432` (or whatever port you have it configured to)
    - The Application Server will need to access an Active Directory server for authentication
    - The Application Server will need to access an SMTP server for email sending

## Installation Prerequisites

There is no software to install on client computers, only a modern web browser (Mozilla Firefox, Google Chrome, or Microsoft Edge) is required.

You should have the following information on hand for the installation:

- **A Build of ANET**. This comes in the form of a `anet-<version>.rpm` file. See [BUILD.md](BUILD.md) for details on how to create this file.
- **PostgreSQL**:
  - if you have just created a fresh postgres database, the migrations that are automatically run when starting the
    server will also prepare the database
- **SMTP Server**
    - hostname
    - username / password (if necessary)
    - TLS settings (yes/no)
- **Fully Qualified Domain Name** of your server.
- **Information about who will Administer** your ANET instance.

## Server Installation Procedures
1. run `sudo yum localinstall anet-<version>.rpm`. This will create the following structure in `/opt/anet`:
    * _bin_: This contains the startup scripts to start/stop the ANET server.
    * _lib_: This contains all dependencies and compiled resources. All ANET specific files are bundled in `lib/anet.jar`.
1. Add an application.yml and anet-dictionary.yml file with appropriate settings to the application folder (i.e. `/opt/anet`). Descriptions of each of the settings in `application.yml` can be found in the ANET Configuration section below.
1. Modify application.yml following the ANET Configuration section below.
1. Verify that your configuration file is valid with ```bin/anet check```
1. Seed the Database: Run ```bin/anet init```. This will show you which options this command expects; there are four values you need to supply:
    * `--adminOrgName ADMINORGNAME` i.e. _Name of Administrator Organization_: This is the name of the Organization that will be created for the Administrator. We recommend using something like `ANET Administrators`.
    * `--adminPosName ADMINPOSNAME` i.e. _Name of Administrator Position_: This is the name of the position that will be created for the Administrator. We recommend `ANET Administrator`.
    * `--adminFullName ADMINFULLNAME` i.e. _Your Name_: This is the name that will be given to the ANET Administrator, who you presumably are; please use the canonical form of your name: Last name, First name(s)
    * `--adminDomainUsername ADMINDOMAINUSERNAME` i.e. _Your Domain Username_: This is the domain username that will be set on the ANET Administrator (who you presumably are). For production situations this will be your windows domain username. If you get this wrong here, when you first log in to ANET it will create a new user for you. You can either run this database init command again, or do manual SQL commands to fix the `people` table.
1. If imagery/maps are needed, install them according to the "How to configure imagery" section
1. To verify that ANET is functioning, manually launch the ANET Server: ```bin/anet```
1. Visit `http://servername` or `https://servername` (depending on SSL configuration) and verify you can see a welcome screen. In case of a problem, please refer to [TROUBLESHOOT.md](TROUBLESHOOT.md)
1. If you have opted to install ANET as a service:
    * `sudo systemctl enable anet`
    * anet can be now started/stopped with `sudo systemctl start anet` and `sudo systemctl stop anet`

# ANET Upgrade Documentation
On the ANET server:
- Stop the anet with `sudo systemctl stop anet`.
- Take a complete backup of your SQL database
- install the new rpm with `sudo yum localinstall anet-<version>.rpm`
- Make any required changes or upgrades to your `application.yml` file
- Run `bin/anet check` to verify that anet is configured correctly
- Start the server, which will automatically run any pending database migrations; if it has been installed as a service, run `sudo systemctl start anet`
- Run through verification testing to ensure there are no issues

Alternatively, an experimental service update script is available in the `doc` folder.

# ANET Configuration
ANET is configured primarily through the `application.yml` file. This is a Spring Boot configuration file. If you want to run ANET behind a reverse proxy, also read [Running ANET and Keycloak behind a reverse proxy](reverse-proxy.md). Here is a description of the configuration options custom to ANET:

- **server**:
    - **port**: The port at which the ANET server will listen.

- **spring**:
    - **datasource**:
        - **url**:  The ANET database URL, e.g. `jdbc:postgresql://localhost:5432/anetdb`
        - **username**: The username with which to connect to the database, e.g. `anetuser`
        - **password**: The password with which to connect to the database, e.g. `anetpassword`
        - **driver-class-name**: The database driver to use, should be: `org.postgresql.Driver`, as ANET only supports [PostgreSQL](https://www.postgresql.org/)
        - **hikari**: You can tweak the database connection pool settings for your deployment environment:
            - **minimum-idle**: 10
            - **maximum-pool-size**: 80
            - **connection-timeout**: 5000

  - **security**: Security configuration through Keycloak
      - **oauth2**:
          - **resourceserver**:
              - **jwt**:
                  - **jwk-set-uri**: Where to get the JWK certificates, e.g. `http://localhost:9080/realms/ANET/protocol/openid-connect/certs`
      - **client**:
          - **registration**:
              - **keycloak**:
                  - **client-id**: The confidential ANET client as defined in Keycloak
                  - **client-secret**: The secret set in Keycloak for this client
        - **provider**:
            - **keycloak**:
                - **issuer-uri**: Where to get the certificate issuer, e.g. `http://localhost:9080/realms/ANET`

- **anet**:
    - **redirect-to-https**: If true, ANET will redirect all HTTP traffic to HTTPS. You must also configure the application to listen on an HTTP connection (ie port 80).

    - **graphql-request-timeout-ms**: Execution time limit for GraphQL requests in milliseconds; if you comment it out, there is *no* limit!

    - **automatically-inactivate-users**: Whether to periodically run the task that automatically inactivates users; further configuration for this is in the dictionary.

    - **smtp**: This section controls the configuration for how ANET sends emails.
        - **hostname**: The Fully Qualified Domain Name of your SMTP Server
        - **port**: The port to connect to your SMTP server on (default: `25`)
        - **username**: If your SMTP server requires authentication, provide the username here; otherwise leave blank.
        - **password**: Your password to your SMTP server.
        - **ssl-trust**: If set to `"*"`, all hosts are trusted. If set to a whitespace separated list of hosts, those hosts are trusted. Otherwise, trust depends on the certificate the server presents.
        - **start-tls**: Set to true if your SMTP server requires or provides TLS (Transport Level Security) encryption.
        - **disabled**: Set to true to disable sending email completely; most useful in development context.
        - **nb-of-hours-for-stale-emails**: When defined, the number of hours it takes for a pending email to be treated as stale and discarded. When not defined, emails are never discarded

    - **email-from-addr**: This is the email address that emails from ANET will be sent from.

    - **server-url**: The URL that should be used for links in emails, e.g. `"https://anet.example.com"`; should not include an ending slash!

    - **keycloak-configuration**:
        - **realm**: ANET realm as defined in Keycloak
        - **auth-server-url**: Base URL of Keycloak server
        - **resource**: Public ANET client as defined in Keycloak
        - **show-logout-link**: Whether to show a Logout link in ANET

    - **anet-dictionary-name**: Path of dictionary to be loaded

    - **imagery-path**: Path to (optional) local map imagery in the dictionary which is served via `/imagery/**`
    - **dashboards-path**: Path to dashboards in the dictionary which are served via `/data/**`

ANET uses the open source Keycloak server to perform Authentication ( https://www.keycloak.org/ ). It needs *two* clients under the Keycloak realm with the name given under the `anet.keycloak-configuration.realm` property, a *confidential* one with the name given under the `spring.security.client.registration.keycloak.client-id` property (and you should copy the `spring.security.client.registration.keycloak.client-secret` from the *Credentials* tab under the client in the Keycloak realm) and a *public* one under `anet.keycloak-configuration.resource`. See [Keycloak authentication server](keycloak.md) for some guidance.

Finally, you can define a deployment-specific dictionary inside the `anet-dictionary.yml` file.
Currently, the recognized entries in the dictionary (and suggested values for each of them) are available in the example dictionary:

[Example Dictionary](../anet-dictionary.yml)

As can be seen from the example above, some entries are lists of values and others are simple key/value pairs.


# Self-signed certificates for SSL
If needed, self-signed certificates can be created and used as follows:

1. Open a command line in `/opt/anet`
2. run `/opt/anet/lib/runtime/bin/keytool -genkey -alias anetkey -keyalg RSA -keystore keystore.jks -keysize 2048`
3. run `/opt/anet/lib/runtime/bin/keytool -export -alias anetkey -file anetkey.crt -keystore keystore.jks`
4. cd to the directory with cacerts, usually `/opt/anet`
5. run `/opt/anet/lib/runtime/bin/keytool -import -trustcacerts -alias selfsigned -file /opt/anet/anetkey.crt -keystore cacerts`
6. update `application.yml` with keyStore and trustStore information


# How to configure imagery.

ANET uses [Leaflet](https://leafletjs.com/) as a map viewer. You can use any map sources that work with Leaflet in ANET. You can start by specifying the coordinate system to use in the `crs` option below:
```yaml
  imagery:
    mapOptions:
      crs: EPSG3857
      homeView:
        location: [34.52, 69.16]
        zoomLevel: 10

```     
Typically, this is a choice between `EPSG3857` and `EPSG4326`. Please consult the specification of the maps you are about to consult. `homeView` defines the default starting location and zoom level of the map.
_hint:_ If you are planning to use a WMS service, in a browser you can inspect the results of `https://wmsURL?request=GetCapabilities&service=WMS` to determine the desired coordinate system

CRS Description (courtesy of https://leafletjs.com/reference-1.3.0.html#crs)

| CRS        |  Description|
| ---------: |-------------|
| EPSG3395   | Rarely used by some commercial tile providers. Uses Elliptical Mercator projection. |
| EPSG3857   | The most common [CRS](https://en.wikipedia.org/wiki/Spatial_reference_system) for online maps, used by almost all free and commercial tile providers. Uses Spherical Mercator projection. Set in by default in Map's crs option. |
| EPSG4326   | A common CRS among GIS enthusiasts. Uses simple [Equirectangular projection](https://en.wikipedia.org/wiki/Equirectangular_projection). Leaflet 1.0.x complies with the TMS coordinate scheme for [EPSG:4326](https://epsg.io/4326), which is a breaking change from 0.7.x behaviour. If you are using a TileLayer with this CRS, ensure that there are two 256x256 pixel tiles covering the whole earth at zoom level zero, and that the tile coordinate origin is (-180,+90), or (-180,-90) for TileLayers with the tms option set. |
| Earth      | Serves as the base for CRS that are global such that they cover the earth. Can only be used as the base for other CRS and cannot be used directly, since it does not have a code, projection or transformation. distance() returns meters. |
| Simple     | A simple CRS that maps longitude and latitude into x and y directly. May be used for maps of flat surfaces (e.g. game maps). Note that the y axis should still be inverted (going from bottom to top). distance() returns simple euclidean distance. |

You can configure ANET to use tiled or WMS maps by adding to the `baseLayers` under `imagery` portion of `anet-dictionary.yml`

for OSM-type providers:
```yaml
      - name: OSM
        default: true
        type: tile
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
```

for WMS-type providers:
```yaml
      - name: World WMS
        default: false
        type: wms
        url: "https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv"
        options:
          layers: GEBCO_LATEST
          format: "image/png"
```
_hint:_ In a browser you can inspect the results of `https://wmsURL?request=GetCapabilities&service=WMS` to determine the desired format and layerName

and for WMTS-type providers:
```yaml
      - name: World Imagery Tiles
        default: false
        type: tile
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        options:
          tms: false
```

If desired, you can also configure a local tiled imagery cache with a downloaded tile set. Your offline imagery set should be in the form of `{z}/{x}/{y}.png` or similar. If you download tiles from OpenStreetMaps, this is the format you'll get them in.

1. In the ANET home directory (the same directory as `bin`, `lib` and `docs`) create a directory called `imagery`.
    ```yaml
    assets:
      overrides:
        /imagery: imagery
    ```
1. Copy your imagery set into the `imagery` directory. You should end up with a file structure that looks like `imagery/street/{0,1,2,...}/{0,1,2...}/{0,1,2,3...}.png`
1. To use this new tile source, add under `baseLayers`:
    ```yaml
          - name: OSM
            default: true
            type: tile
            url: "/imagery/street/{z}/{x}/{y}.png"
    ```

Maps should now magically work!  You can test this by going to the url `https://<your-anet-server>/imagery/street/0/0/0.png` and hopefully seeing a tile appear.

# How to configure KML and NVG support

Any system that can consume KML (Google Earth, Google Maps) through a service (a.k.a. Network Link) can be configured to consume ANET data.

For example to consume all published reports, use the following endpoint:

```
http://<your-anet-server>/graphql?query=query{reportList(query:{state:PUBLISHED}){list{uuid,intent,attendees{rank,name,role},primaryAdvisor{name},primaryPrincipal{name,position{organization{longName}}},location{lat,lng}}}}&output=kml
```

For the same data in NVG format, you can use
```
http://<your-anet-server>/graphql?query=query{reportList(query:{state:PUBLISHED}){list{uuid,intent,attendees{rank,name,role},primaryAdvisor{name},primaryPrincipal{name,position{organization{longName}}},location{lat,lng}}}}&output=nvg
```

# How to configure dashboards

A system administrator can add and modify dashboards, by editing the following section in `anet-dictionary.yml`

```yaml
  dashboards:
    - label: dashboard0
      data: /data/dashboards/dashboard0.json
      type: kanban
    - label: dashboard1
      data: /data/dashboards/dashboard1.json
      type: kanban
    - label: decisives
      data: /data/dashboards/decisives.json
      type: decisives
```

For each dashboard, a `label` must be provided which determines how the dashboard appears in the navigation structure, `type` determines the type of the dashboard (currently only `kanban` and `decisives` are supported as types).
The `data` property, points to a file containing the configuration of the dashboard. The location of this directory can be specified in the `assets` section of `application.yml` - in the example below pointing to a directory named `data` relative to the anet working directory.

Changing the content of dashboard files does not require an application restart, reloading the page in the browser will be sufficient for the dashboards to update.

## Kanban dashboards data file

```json
{
  "title": "Dashboard 0",
  "columns": [
    {
      "name": "Priority 1",
      "tasks": [
        "1145e584-4485-4ce0-89c4-2fa2e1fe846a",
        "fdf107e7-a88a-4dc4-b744-748e9aaffabc"
      ]
    },
    {
      "name": "Priority 2",
      "tasks": [
        "df920c99-10ea-44e8-940f-cb1d1cbd22da",
        "cd35abe7-a5c9-4b3e-885b-4c72bf564ed7",
        "75d4009d-7c79-42e0-aa2f-d79d158ec8d6",
        "2200a820-c4c7-4c9c-946c-f0c9c9e045c5"
      ]
    }
  ]
}
```

## Decisives dashboards data file

```json
[
  {
    "label": "Decisives 1",
    "tasks": [
      "1b5eb36b-456c-46b7-ae9e-1c89e9075292",
      "7fdef880-1bf3-4e56-8476-79166324023f"
    ],
    "positions": [
      "879121d2-d265-4d26-8a2b-bd073caa474e",
      "1a45ccd6-40e3-4c51-baf5-15e7e9b8f03d"
  ],
    "locations": [
      "cc49bb27-4d8f-47a8-a9ee-af2b68b992ac",
      "8c138750-91ce-41bf-9b4c-9f0ddc73608b"
    ]
  },
  {
    "label": "Decisives 2",
    "tasks": [
      "df920c99-10ea-44e8-940f-cb1d1cbd22da",
      "cd35abe7-a5c9-4b3e-885b-4c72bf564ed7"
      ],
    "positions": [
      "61371573-eefc-4b85-81a0-27d6c0b78c58"
    ],
    "locations": [
      "5046a870-6c2a-40a7-9681-61a1d6eeaa07",
      "9f364c59-953e-4c17-919c-648ea3a74e36"
    ]
  }
]
```
