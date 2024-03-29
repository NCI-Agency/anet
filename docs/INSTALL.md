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
      IE11 is no longer supported
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
  - if you have just created a fresh postgres database, apply the content of `/opt/anet/doc/prepare-psql.sql`
- **SMTP Server**
    - hostname
    - username / password (if necessary)
    - TLS settings (yes/no)
- **Fully Qualified Domain Name** of your server.
- **Information about who will Administer** your ANET instance.

## Server Installation Procedures
1. run `sudo yum localinstall anet-<version>.rpm`. This will create the following structure in `/opt/anet`:
    * _bin_: This contains the startup scripts to start/stop the ANET server.
    * _lib_: This contains all of the dependencies and compiled resources. All ANET specific files are bundled in `lib/anet.jar`.
    * _docs_: This is a copy of the [docs folder](../) from the git repository, so you'll have a copy of these documents during installation!
2. Add an anet.yml and anet-dictionary.yml file with appropriate settings to the application folder (i.e. `/opt/anet`). Descriptions of each of the settings in `anet.yml` can be found in the ANET Configuration section below. Templates of that file can be found in the docs directory. `anet.yml.productionTemplate` has been tested on a production set-up.
3. Modify anet.yml following the ANET Configuration section below. If SSL is required, follow the "How to enable SSL" section.
4. Verify that your configuration file is valid with ```bin/anet check anet.yml```
5. Install Database Schema: Run ```bin/anet db migrate anet.yml```
6. Seed the Database: Run ```bin/anet init anet.yml```. This will show you which options this command expects; there are four values you need to supply:
    * `--adminOrgName ADMINORGNAME` i.e. _Name of Administrator Organization_: This is the name of the Organization that will be created for the Administrator. We recommend using something like `ANET Administrators`.
    * `--adminPosName ADMINPOSNAME` i.e. _Name of Administrator Position_: This is the name of the position that will be created for the Administrator. We recommend `ANET Administrator`.
    * `--adminFullName ADMINFULLNAME` i.e. _Your Name_: This is the name that will be given to the ANET Administrator, who you presumably are; please use the canonical form of your name: LAST NAME, First name(s)
    * `--adminDomainUsername ADMINDOMAINUSERNAME` i.e. _Your Domain Username_: This is the domain username that will be set on the ANET Administrator (who you presumably are). For production situations this will be your windows domain username. If you get this wrong here, when you first log in to ANET it will create a new user for you. You can either run this database init command again, or do manual SQL commands to fix the `people` table.
7. If imagery/maps are needed, install them according to the "How to configure imagery" section
8. To verify that ANET is functioning, manually launch the ANET Server: ```"bin/anet" server anet.yml```
9. Visit `http://servername` or `https://servername` (depending on SSL configuration) and verify you can see a welcome screen. In case of a problem, please refer to [TROUBLESHOOT.md](TROUBLESHOOT.md)
10. If you have opted to install ANET as a service:
    * `sudo systemctl enable anet`
    * anet can be now started/stopped with `sudo systemctl start anet` and `sudo systemctl stop anet`

# ANET Upgrade Documentation
On the ANET server:
- Stop the anet with `sudo systemctl stop anet`.
- Take a complete backup of your SQL database
- install the new rpm with `sudo yum localinstall anet-<version>.rpm`
- Make any required changes or upgrades to your `anet.yml` file
- Run `bin/anet check anet.yml` to verify that anet is configured correctly
- Run `bin/anet db migrate anet.yml` to migrate your database
- Start the server, if it has been installed as a service, run `sudo systemctl start anet`
- Run through verification testing to ensure there are no issues

Alternatively, an experimental service update script is available in the `doc` folder.

# ANET Configuration
ANET is configured primarily through the `anet.yml` file. This file follows the [Dropwizard configuration format](https://www.dropwizard.io/en/latest/manual/configuration.html#man-configuration). If you want to run ANET behind a reverse proxy, also read [Running ANET and Keycloak behind a reverse proxy](reverse-proxy.md). Here is a description of the configuration options custom to ANET:

- **developmentMode**: This flag controls several options on the server that are helpful when developing
    - account deactivation worker: When development mode is `true`, the account deactivation worker is run directly at start-up (as well as at the set interval).
- **redirectToHttps**: If true, ANET will redirect all HTTP traffic to HTTPS. You must also configure the application to listen on an HTTP connection (ie port 80).
- **smtp**: This section controls the configuration for how ANET sends emails.
    - **hostname**: The Fully Qualified Domain Name of your SMTP Server
    - **port**: The port to connect to your SMTP server on (default: 25)
    - **username**: If your SMTP server requires authentication, provide the username here. Otherwise leave blank.
    - **password**: Your password to your SMTP server.
    - **startTLS**: Set to true if your SMTP server requires or provides TLS (Transport Level Security) encryption.
    - **disabled**: Set to true to disable sending email completely; most useful in development context.
    - **nbOfHoursForStaleEmails**: When defined, the number of hours it takes for a pending email to be treated as stale and discarded. When not defined, emails are never discarded
- **emailFromAddr**: This is the email address that emails from ANET will be sent from.
- **serverUrl**: The URL for the ANET server, e.g.: `"https://anet.example.com"`.
- **keycloakConfiguration**: The configuration for [Keycloak](keycloak.md), i.e. the (federated) user authentication server for ANET.
- **database**: The configuration for your database. ANET only supports [PostgreSQL](https://www.postgresql.org/). Additional instructions can be found [here](https://www.dropwizard.io/en/latest/manual/configuration.html#database) for avaiable configuration options for the database connection.
    - **driverClass**: the java driver for the database. Use `org.postgresql.Driver` for PostgreSQL.
    - **user**: The username with access to the database. Not needed when using a local database.
    - **password**: The password to the database. Not needed when using a local database.
    - **url**: the url to the database in the following format: `jdbc:postgresql://[server hostname]:5432/[database name]`.

- **keycloakConfiguration**: ANET uses the open source Keycloak server to perform Authentication ( https://www.keycloak.org/ ). It can be configured to authenticate via Keycloak in the following manner:

```
keycloakConfiguration:
  realm: ANET-Realm
  auth-server-url: http://localhost:9080/auth  # for development; should point to the real Keycloak URL in production (can be relative if ANET and Keycloak and running on the same server, e.g. just /auth )
  ssl-required: none  # for development; should be all in production
  confidential-port: 443
  disable-trust-manager: false  # set to true if e.g. you're using self-signed certificates (which you obviously shouldn't do in production)
  register-node-at-startup: true
  register-node-period: 600
  resource: ANET-Client
  show-logout-link: true  # for development; should be false in production when using SSO
  enable-basic-auth: true  # for development; should be false in production
  credentials:
    secret: 12869b4c-74ac-43f9-b71e-ff74e07babf9
```

ANET needs *two* clients under the Keycloak realm with the name given under the **realm** property, a *confidential* one with the name given under the **resource** property (and you should copy the **secret** from the *Credentials* tab under the client in the Keycloak realm) and a *public* one with the `-public` added at the end of the name (so for the `ANET-Client` given in the example above, it would be `ANET-Client-public`). See [Keycloak authentication server](keycloak.md) for some guidance.

- **server**: See the Dropwizard documentation for all the details of how to use this section. This controls the protocols (http/https) and ports that ANET will use for client web traffic. Additionally if you configure SSL, you will provide the server private key in this section. The `adminConnector` section is used for performance checks and health testing, this endpoint does not need to be available to users.

- **logging**: See the Dropwizard documentation for all the details of how to use this section. This controls the classes that you want to collect logs from and where to send them. Set the `currentLogFilename` parameters to the location that you want the logs to appear.

Finally, you can define a deployment-specific dictionary inside the `anet-dictionary.yml` file.
Currently, the recognized entries in the dictionary (and suggested values for each of them) are available in the example dictionary:

[Example Dictionary](../anet-dictionary.yml)

As can be seen from the example above, some entries are lists of values and others are simple key/value pairs.

# How to enable SSL
Below is a subset from the complete Dropwizard Documentation that can be found here: https://www.dropwizard.io/en/latest/manual/configuration.html#https

SSL support is built into Dropwizard. You will need to provide your own Java keystore, which is outside the scope of this document (keytool is the command you need, and Jetty’s documentation can get you started). There is a test keystore you can use in the Dropwizard example project.

```
server:
  applicationConnectors:
    - type: https
      port: 443
      keyStorePath: PathToKeystore
      keyStorePassword: password
      trustStorePath: pathToCacerts
      validateCerts: false
```

Administrator should request certificates.

## Self signed certificates
If needed, self-signed certificates can be created and used as follows:

1. Open a command line in `/opt/anet`
2. run `/opt/anet/lib/runtime/bin/keytool -genkey -alias anetkey -keyalg RSA -keystore keystore.jks -keysize 2048`
3. run `/opt/anet/lib/runtime/bin/keytool -export -alias anetkey -file anetkey.crt -keystore keystore.jks`
4. cd to the directory with cacerts, usually `/opt/anet`
5. run `/opt/anet/lib/runtime/bin/keytool -import -trustcacerts -alias selfsigned -file /opt/anet/anetkey.crt -keystore cacerts`
6. update `anet.yml` with keyStore and trustStore information


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
Typically this is a choice between `EPSG3857` and `EPSG4326`. Please consult the specification of the maps you are about to consult. `homeView` defines the default starting location and zoom level of the map.
_hint:_ If you are planning to use a WMS service, in a browser you can inspect the results of `https://wmsURL?request=GetCapabilities&service=WMS` to determine the desired coordinate system

CRS Description (courtesy of https://leafletjs.com/reference-1.3.0.html#crs)

| CRS        |  Description|
| ---------: |-------------|
| EPSG3395   | Rarely used by some commercial tile providers. Uses Elliptical Mercator projection. |
| EPSG3857   | The most common [CRS](https://en.wikipedia.org/wiki/Spatial_reference_system) for online maps, used by almost all free and commercial tile providers. Uses Spherical Mercator projection. Set in by default in Map's crs option. |
| EPSG4326   | A common CRS among GIS enthusiasts. Uses simple [Equirectangular projection](https://en.wikipedia.org/wiki/Equirectangular_projection). Leaflet 1.0.x complies with the TMS coordinate scheme for [EPSG:4326](https://epsg.io/4326), which is a breaking change from 0.7.x behaviour. If you are using a TileLayer with this CRS, ensure that there are two 256x256 pixel tiles covering the whole earth at zoom level zero, and that the tile coordinate origin is (-180,+90), or (-180,-90) for TileLayers with the tms option set. |
| Earth      | Serves as the base for CRS that are global such that they cover the earth. Can only be used as the base for other CRS and cannot be used directly, since it does not have a code, projection or transformation. distance() returns meters. |
| Simple     | A simple CRS that maps longitude and latitude into x and y directly. May be used for maps of flat surfaces (e.g. game maps). Note that the y axis should still be inverted (going from bottom to top). distance() returns simple euclidean distance. |

You can configure ANET to use tiled or WMS maps by adding to the `baseLayers` under `imagery` portion of `anet.yml`

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
2. Copy your imagery set into the `imagery` directory. You should end up with a file structure that looks like `imagery/street/{0,1,2,...}/{0,1,2...}/{0,1,2,3...}.png`
3. To use this new tile source, add under `baseLayers`:
```yaml
      - name: OSM
        default: true
        type: tile
        url: "/imagery/street/{z}/{x}/{y}.png"
```

Maps should now magically work!  You can test this by going to the url `https://<your-anet-server>/imagery/street/0/0/0.png` and hopefully seeing a tile appear.

# How to configure KML and NVG support

Any system that can consume KML (Google Earth, Google Maps) through a service (a.k.a Network Link) can be configured to consume ANET data.

For example to consume all published reports, use the following endpoint:

```
http://<your-anet-server>/graphql?query=query{reportList(query:{state:PUBLISHED}){list{uuid,intent,attendees{rank,name,role},primaryAdvisor{name},primaryPrincipal{name,position{organization{longName}}},location{lat,lng}}}}&output=kml
```

For the same data in NVG format, you can use
```
http://<your-anet-server>/graphql?query=query{reportList(query:{state:PUBLISHED}){list{uuid,intent,attendees{rank,name,role},primaryAdvisor{name},primaryPrincipal{name,position{organization{longName}}},location{lat,lng}}}}&output=nvg
```

# How to configure dashboards

A system administrator can add an modify dashboards, by editing the following section in `anet.yml`

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

For each dashboard, a `label` must be provided which determines how the dashboard appears in the navigation structure, `type` determines the type of the dashboad (currently only `kanban` and `decisives` are supported as types).
The `data` property, points to a file containing the configuration of the dashboard. The location of this directory can be specified in the `assets` section of `anet.yml` - in the example below pointing to a directory named `data` relative to the anet working directory.

Changing the content of dashboard files does not require an application restart, reloading the page in the browser will be sufficient for the dashboards to update.

```yaml
assets:
  overrides:
    /data: data
```


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
