# ANET Installation Documentation

## Scope
This document covers the steps required to deploy ANET to a server environment.

## Environment

- **Hardware**: ANET does not have specific required hardware. Hardware recommendations are:
	- 1x Windows Application Server (50GB HDD, 16 GB RAM, 4x CPU Cores)
	- 1x Microsoft SQL Server (2016 or greater) Database Server. 
- **Software**: Software requirements: 
	- Java JRE 1.8 installed on the Application Server
	- Administration Privileges to run processes on restricted ports (80/443)
	- Optional: A valid SSL certificate for the domain name of the application server.
	- Microsoft SQL Server 2016 or greater. The MS SQL database should be configured to:
		- allow connections on a static TCP/IP port `1433`
		- fulltext module should be installed. This can be done by:
			1. Open the Programs and Features control panel.
			2. Select `Microsoft SQL Server 2016` and click `Change`.
			3. When prompted to `Add/Repair/Remove`, select `Add` and provide intallation media.
			4. Advance through the wizard until the Feature Selection screen. Then select `Full-Text
and Semantic Extractions for Search`.
	- Users are required to have a modern web browser (Mozilla Firefox, Google Chrome, Microsoft Edge or other with good HTML5 support). IE11 is currently supported alhtough performance is degraded and support will be discontinued beyond Q3 2019
	- A service manager, such as https://nssm.cc/ , can be used to install ANET as a service on Windows
- **Network Accessibility**
	- Users will acccess the Application Server over HTTP/HTTPS (`80`/`443`)
	- The Application Server will access the SQL Server over port `1433` (or whatever port you have SQL configured to)
	- The Application Server will need to access an Active Directory server for authentication
	- The Application Server will need to access an SMTP server for email sending. 
- **Service Accounts**
	- It is recommended to have a single service account with the following priviliges:
		- Administrator of the Application Server VMs. All scheduled tasks are to be performed under this account.
		- DB ownder of the ANET database. It is recommended to use Windows Authentication for this access.

## Installation Prerequisites

There is no software to install on client computers, only a modern web browser (Mozilla Firefox, Google Chrome, or Microsoft Edge) is required.

You should have the following information on hand for the installation:

- **A Build of ANET**. This comes in the form of a `.zip` file. See BUILD.md for details on how to create this file. 
- **Microsoft SQL Server**: Your Database Administrator should be able to provide you with these settings. Just ask for an empty database. If you have access to your SQL Server directly, the command to create an empty database is `CREATE DATABASE database_name_here`. Alternatively, a database can be created using the SQL Management tool. 300Mb can be used as an initial database and logs size
	- hostname
	- username / password
	- database name
- **SMTP Server**
	- hostname
	- username / password (if necessary)
	- TLS settings (yes/no)
- **Fully Qualified Domain Name** of your server. 
- **Information about who will Administer** your ANET instance. 

## Server Installation Procedures
Create a folder for the application, for example: `c:\anet`. In that location: 

1. Unzip anet.zip. You'll find three folders directly under the application folder:
	* _bin_: This contains the startup scripts to start/stop the ANET server. 
	* _lib_: This contains all of the dependencies and compiled resources. All of the ANET specific files are bundled in `lib/anet.jar`.
	* _docs_: This is a copy of the docs folder from the git repository, so you'll have a copy of these docuemnts during installation!
2. Add an anet.yml file with appropiate settings to the application folder (i.e. `c:\anet`). Descriptions of each of the settings in `anet.yml` can be found in the ANET Configuration section below. Templates of that file can be found in the docs directory. `anet.yml.productionTemplate` has been tested on a production set-up.
3. Modify anet.yml following the ANET Configuration section below. If SSL is required, follow the "How to enable SSL" section
4. Verify that your configuration file is valid with ```"bin/anet.bat" check anet.yml```
5. Install Database Schema: Run ```"bin/anet.bat" db migrate anet.yml```
6. Seed the Database: Run ```"bin/anet.bat" init anet.yml```. This will ask you the following questions:
	* _Classification String_: This is the message that will appear in the top security banner on the screen. For demo instances you should use `FOR DEMO USE ONLY`.
	* _Classification Color_ : This is the color of the top security banner on the screen. For demo instances you should use `green`.
	* _Name of Administrator Organization_: This is the name of the Organization that will be created for the Administrator. We recommend using something like `ANET Administrators`.
	* _Name of Administrator Position_: This is the name of the position that will be created for the Administrator. We recommend `ANET Administrator`.
	* _Your Name_: This is the name that will be given to the ANET Administrator, who you presumably are; please use the canonical form of your name: LAST NAME, First name(s)
	* _Your Domain Username_: This is the domain username that will be set on the ANET Administrator (who you presumabely are). For production situations this will be your windows domain username. If you get this wrong here, when you first log in to ANET it will create a new user for you. You can either run this database init command again, or do manual SQL commands to fix the `people` table.
7. If imagery/maps are needed, install them according to the "How to configure imagery" section 
8. To verify that ANET is functioning, manually launch the ANET Server: ```"bin/anet.bat" server anet.yml```
9. Visit `http://servername` or `https://servername` (depending on SSL configuration) and verify you can see a welcome screen. In case of a problem, please refer to [TROUBLESHOOT.md](TROUBLESHOOT.md)
10. You can either add a strart-up task for ANET, or skip to step 11 if you wish to install it as a service:
	* Open Task Scheduler
	* Create task
	* Name it "ANET"
	* Under Security Options, select the service account
	* Under Security Options, check "run when user is logged on or not"
	* Add a new trigger: "at startup"
	* Add a new "Start a Program" Action:
		* Start a program/script: `c:\anet\bin\anet.bat`
		* Add arguments: `server anet.yml`
		* Start in: `c:\anet`
11. If you have opted to install ANET as a service:
	* Install `nssm` or other service manager
	* Create a serive named `anet`, with:
    *  `c:\anet` as start-up directory 
    *  `c:\anet\bin\anet.bat` as application path
    *  and `server anet.yml` as arguments
    *  add the sql service as a dependency

# ANET Upgrade Documentation
On the ANET server: 
- Stop the `"bin/anet" server anet.yml` process. This is typically done by killing the java process from the task manager, or if a service is installed by running `net stop anet`
- Take a complete backup of your SQL Database
- Move the `bin`, `lib` and `doc` directory to a backup directory. Make sure that `anet.yml` remain intact
- Unzip the provided ANET distribution zip. Copy the `bin`, `lib` and `doc` from the distribution into the anet application folder, typically `c:\anet`
- Make any required changes or upgrades to your `anet.yml` file
- Run `bin/anet.bat check anet.yml` to verify that `anet.yml` is in the correct format
- Run `bin/anet.bat db migrate anet.yml` to migrate your database
- Start the server, if it has been installed as a service, run `net stop anet`
- Run through verification testing to ensure there are no issues

Alternatively, an experimental service update script is available in the `doc` folder. 

# ANET Configuration
ANET is configured primarily through the `anet.yml` file. This file follows the Dropwizard configuration format ( https://www.dropwizard.io/1.3.5/docs/manual/core.html#configuration ). Here is a description of the configuration options custom to ANET:

- **developmentMode**: This flag controls several options on the server that are helpful when developing
	- Authentication: When development mode is `true`, ANET will use basic Authentication checking only that the username provided is equal to the `domainUsername` column of a valid user in the database. In the event that there is not a matching user, but the provided password is equal to the username, ANET will simulate the first-time log in of a new user (ie a user who passes windows authentication but has never logged into ANET before).
		- ex: To Log in as `Jack Jackson` from the development data set, just type in a username of `jack` when prompted.
		- ex: To simulate a new user type in the same name for both the username and password when prompted (ie un: `hunter`, pw: `hunter` will create a new user with Domain Username of `hunter`).
	- GraphQL: When development mode is `true`, ANET will re-compute the GraphQL graph on every API call, this allows you to rapidly develop on changes without restarting the server.
- **redirectToHttps**: If true, ANET will redirect all HTTP traffic to HTTPS. You must also configure the application to listen on an HTTP connection (ie port 80). 
- **smtp**: This section controls the configuration for how ANET sends emails.
	- **hostname**: The Fully Qualified Domain Name of your SMTP Server
	- **port**: The port to connect to your SMTP server on (default: 25)
	- **username**: If your SMTP server requires authentication, provide the username here. Otherwise leave blank.
	- **password**: Your password to your SMTP server.
	- **startTLS**: Set to true if your SMTP server requires or provides TLS (Transport Level Security) encryption.
	- **disabled**: Set to true to disable sending email completely; most useful in development context.
	- **nbOfHoursForStaleEmails**: When defined, the number of hours it takes for a pending email to be treatead as stale and discarded. When not defined, emails are never discarded
- **emailFromAddr**: This is the email address that emails from ANET will be sent from.
- **serverUrl**: The URL for the ANET server, ie: `"https://anet.dds.mil"`.
- **database**: The configuration for your database. ANET supports either PostgreSQL or Microsoft SQL Server.  Additonal Instructions can be found here instructions here: https://www.dropwizard.io/1.3.5/docs/manual/jdbi.html for avaiable configuration options for the database connection.
	- **driverClass**: the java driver for the database. Use com.microsoft.sqlserver.jdbc.SQLServerDriver for MS SQL
	- **user**: The username with access to the database. Not needed when Windows Authentication is used.
	- **password**: The password to the database. Not needed when Windows Authentication is used.
	- **url**: the url to the database in the following format: jdbc:sqlserver://[sqlserver hostname]:1433;databaseName=[dbName]. When Windows Authentication is used, the following parameters can be appended: integratedSecurity=true;authenticationScheme=nativeAuthentication
	
The following configuration can be used for MS SQL databases:
```
database:
  driverClass: com.microsoft.sqlserver.jdbc.SQLServerDriver
  user: [ANET_DB_USERNAME]
  password: [ANET_DB_PASSWORD]
  url: jdbc:sqlserver://[sqlserver hostname]:1433;databaseName=[dbName]
#  properties:
#   date_string_format: 
#   date_class:
```
- **timeWaffleRequests**: set to `true` to report timings of Waffle request methods:
```
timeWaffleRequests: false
```

- **waffleConfig**: ANET uses the open source `waffle` library to perform Windows Authentication ( https://github.com/Waffle/waffle ). It can be configured to authenticate via AD in the following manner:

```
waffleConfig:
  principalFormat: fqn
  roleFormat: both
  allowGuestLogin: false
  impersonate: false
  securityFilterProviders: "waffle.servlet.spi.BasicSecurityFilterProvider waffle.servlet.spi.NegotiateSecurityFilterProvider"
  "waffle.servlet.spi.NegotiateSecurityFilterProvider/protocols": NTLM
  "waffle.servlet.spi.BasicSecurityFilterProvider/realm": ANET
```

If needed, see https://github.com/Waffle/waffle/blob/master/Docs/ServletSingleSignOnSecurityFilter.md for documentation on the available configuration options.

- **server**: See the Dropwizard documentation for all the details of how to use this section.  This controls ths protocols (http/https) and ports that ANET will use for client web traffic.  Additionally if you configure SSL, you will provide the server private key in this section. The `adminConnector` section is used for performance checks and health testing, this endpoint does not need to be available to users.  

- **logging**: See the Dropwizard documentation for all the details of how to use this section.  This controls the classes that you want to collect logs from and where to send them.  Set the `currentLogFilename` paramters to the location that you want the logs to appear.  

Finally, you can define a deployment-specific dictionary inside the `anet.yml` file.
Currently, the recognized entries in the dictionary (and suggested values for each of them) are:
```yaml
dictionary:
  SUPPORT_EMAIL_ADDR: support@example.com

  engagementsIncludeTimeAndDuration: true

  dateFormats:
    email:
      date: d MMMM yyyy
      withTime: d MMMM yyyy @ HH:mm
    excel: d MMMM yyyy
    forms:
      input:
        date: [DD-MM-YYYY, DD-MM-YY, DD/MM/YYYY, DD/MM/YY, DD MM YYYY, DD MM YY,
               DD.MM.YYYY, DD.MM.YY, DDMMYYYY, DDMMYY, D MMMM YYYY]
        withTime: [DD-MM-YYYY HH:mm, DD-MM-YY HH:mm, DD/MM/YYYY HH:mm, DD/MM/YY HH:mm, DD MM YYYY HH:mm, DD MM YY HH:mm,
                   DD.MM.YYYY HH:mm, DD.MM.YY HH:mm, DDMMYYYY HH:mm, DDMMYY HH:mm, D MMMM YYYY HH:mm]
      displayShort:
        date: D MMMM YYYY
        withTime: D MMMM YYYY @ HH:mm
      displayLong:
        date: dddd, D MMMM YYYY
        withTime: dddd, D MMMM YYYY @ HH:mm

  reportWorkflow:
    nbOfHoursQuarantineApproved: 24

  maxTextFieldLength: 250

  fields:

    task:
      shortLabel: Task
      shortName:
        label: Task number
        placeholder: Enter an effort name, example....
      longLabel: Tasks and Milestones
      longName:
        label: Task description
        placeholder: Enter an effort description, example ....
        componentClass: textarea
      projectedCompletion:
        label: Projected Completion
      plannedCompletion:
        label: Planned Completion
      customFieldRef1:
        label: Parent task
        placeholder: Start typing to search for a higher level task
      customField:
        label: Custom field
        placeholder: Fill in the custom field
      customFieldEnum1:
        label: Project status
        enum:
          GREEN:
            label: Green
            color: '#c2ffb3'
          AMBER:
            label: Amber
            color: '#ffe396'
          RED:
            label: Red
            color: '#ff8279'
      customFieldEnum2:
        label: Custom field enum 2
        enum:
          CUSTOMVALUE1:
            label: Custom value 1
          CUSTOMVALUE2:
            label: Custom value 2
      responsibleOrg: Responsible organization
      responsiblePositions:
        label: Responsible positions
        placeholder: Search for a position...

    report:
      intent: Meeting goal (purpose)
      atmosphere: Atmospherics
      atmosphereDetails: Atmospherics details
      cancelled: ''
      reportTags: Tags
      nextSteps: Next steps
      keyOutcomes: Key outcomes
      reportText: Engagement details

    person:
      firstName: First name
      lastName: Last name
      domainUsername: Domain username
      emailAddress: Email
      phoneNumber: Phone
      country: Nationality
      rank: Rank
      ranks:
        - value: CIV
          description: the rank of CIV
        - value: CTR
          description: the rank of CTR
        - value: OR-1
          description: the rank of OR-1
        - value: OR-2
          description: the rank of OR-2
        - value: OR-3
          description: the rank of OR-3
        - value: OR-4
          description: the rank of OR-4
        - value: OR-5
          description: the rank of OR-5
        - value: OR-6
          description: the rank of OR-6
        - value: OR-7
          description: the rank of OR-7
        - value: OR-8
          description: the rank of OR-8
        - value: OR-9
          description: the rank of OR-9
        - value: WO-1
          description: the rank of WO-1
        - value: WO-2
          description: the rank of WO-2
        - value: WO-3
          description: the rank of WO-3
        - value: WO-4
          description: the rank of WO-4
        - value: WO-5
          description: the rank of WO-5
        - value: OF-1
          description: the rank of OF-1
        - value: OF-2
          description: the rank of OF-2
        - value: OF-3
          description: the rank of OF-3
        - value: OF-4
          description: the rank of OF-4
        - value: OF-5
          description: the rank of OF-5
        - value: OF-6
          description: the rank of OF-6
        - value: OF-7
          description: the rank of OF-7
        - value: OF-8
          description: the rank of OF-8
        - value: OF-9
          description: the rank of OF-9
      gender: Gender
      endOfTourDate: End of tour

    position:
      name: 'Position Name'

    organization:
      shortName: Name
      parentOrg: Parent Organization

    advisor:

      person:
        name: NATO Member
        countries: [Albania , Armenia, Australia, Austria, Azerbaijan, Belgium, Bosnia-Herzegovina, Bulgaria, Croatia, Czech Republic, Denmark, Estonia, Finland,
                    Georgia, Germany, Greece, Hungary, Iceland, Italy, Latvia, Lithuania, Luxembourg, Macedonia, Mongolia, Montenegro, Netherlands, New Zealand,
                    Norway, Poland, Portugal, Romania, Slovakia, Slovenia, Spain, Sweden, Turkey, Ukraine, United Kingdom, United States of America]

      position:
        name: NATO Billet
        type: ANET User
        code:
          label: CE Post Number
          placeholder: the CE post number for this position

      org:
        name: Advisor Organization
        allOrgName: Advisor Organizations
        longName:
          label: Description
          placeholder: e.g. Force Sustainment
        identificationCode:
          label: UIC
          placeholder: the six character code

    principal:

      person:
        name: Afghan Partner
        countries: [Afghanistan]

      position:
        name: Afghan Tashkil
        type: Afghan Partner
        code:
          label: Tashkil
          placeholder: the Afghan taskhil ID for this position

      org:
        name: Afghan Government Organization
        longName:
          label: Official Organization Name
          placeholder: e.g. Afghan Ministry of Defense
        identificationCode:
          label: UIC
          placeholder: the six character code

    superUser:

      position:
        type: ANET Super User

    administrator:

      position:
        type: ANET Administrator

  pinned_ORGs: [Key Leader Engagement]
  non_reporting_ORGs: [ANET Administrators]
  tasking_ORGs: [EF 2.2]
  domainNames: [cmil.mil, mission.ita, nato.int, dds.mil, "*.isaf.nato.int"]
  activeDomainNames: [cmil.mil, mission.ita, nato.int, "*.isaf.nato.int"]
  imagery:
    mapOptions:
      crs: EPSG3857
      homeView:
        location: [34.52, 69.16]
        zoomLevel: 10
      leafletOptions:
        attributionControl: false
    geoSearcher:
      provider: ESRI
      url: "geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find"
    baseLayers:
      - name: OSM
        default: true
        type: tile
        url: "https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png"
      - name: World Imagery Tiles
        default: false
        type: tile
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        options:
          tms: false
      - name: World WMS
        default: false
        type: wms
        url: "https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv"
        options:
          layers: GEBCO_LATEST
          format: "image/png"

  automaticallyInactivateUsers:
    emailRemindersDaysPrior: [15, 30, 45]
    ignoredDomainNames: []
    checkIntervalInSecs: 3600  # 60 * 60

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
As can be seen from the example above, the entries `pinned_ORGs`, `non_reporting_ORGs`, `countries`, `principa_countries`, `ranks` and `domainNames` are lists of values; the others are simple key/value pairs. The values in the `pinned_ORGs` and `non_reporting_ORGs` lists should match the shortName field of organizations in the database. The key/value pairs are mostly used as deployment-specific labels for fields in the user interface.

# How to enable SSL
Below is a subset from the complete Dropwizard Documentation that can be found here: https://www.dropwizard.io/1.3.5/docs/manual/core.html#ssl

SSL support is built into Dropwizard. You will need to provide your own java keystore, which is outside the scope of this document (keytool is the command you need, and Jetty’s documentation can get you started). There is a test keystore you can use in the Dropwizard example project.

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

## 

## Self signed certificates
If needed, self-signed certificates can be created and used as follows:

1. Open a command line in c:\anet
2. run "c:\Program Files\Java\jre1.8.0_121\bin\"keytool.exe -genkey -alias anetkey -keyalg RSA -keystore keystore.jks -keysize 2048.
3. run "c:\Program Files\Java\jre1.8.0_121\bin\"keytool.exe -export -alias anetkey -file anetkey.crt -keystore keystore.jks
4. cd to the directory with cacerts, usually "c:\Program Files\Java\jre1.8.0_121\lib\security"
5. run "c:\Program Files\Java\jre1.8.0_121\bin\"keytool.exe -import -trustcacerts -alias selfsigned -file c:\anet\anetkey.crt -keystore cacerts
6. updte anet.yml with keyStore and trustStore information
 

# How to configure imagery.

ANET uses Leaflet as a map viewer.  You can use any map sources that work with Leaflet in ANET. You can start by specifying the coordinate system to use in the `crs` option below:
```yaml
  imagery:
    mapOptions:
      crs: EPSG3857
      homeView:
        location: [34.52, 69.16]
        zoomLevel: 10

```      
Typically this is a choice between `EPSG3857` and `EPSG4326`. Please consult the specification of the maps you are about to consult. `homeView` defines the default starting location and zoom level of the map.
_hint:_ If you are planning to use a WMS service, in a browser you can inspect the results of https://wmsURL?request=GetCapabilities&service=WMS to determine the desired coordinate system

CRS	Description (courtesy of https://leafletjs.com/reference-1.3.0.html#crs)

| CRS        |  Description|
| ---------: |-------------|
| EPSG3395   | Rarely used by some commercial tile providers. Uses Elliptical Mercator projection. |
| EPSG3857   | The most common CRS for online maps, used by almost all free and commercial tile providers. Uses Spherical Mercator projection. Set in by default in Map's crs option. |
| EPSG4326   | A common CRS among GIS enthusiasts. Uses simple Equirectangular projection. Leaflet 1.0.x complies with the TMS coordinate scheme for EPSG:4326, which is a breaking change from 0.7.x behaviour. If you are using a TileLayer with this CRS, ensure that there are two 256x256 pixel tiles covering the whole earth at zoom level zero, and that the tile coordinate origin is (-180,+90), or (-180,-90) for TileLayers with the tms option set. |
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
_hint:_ In a browser you can inspect the results of https://wmsURL?request=GetCapabilities&service=WMS to determine the desired format and layerName

and for WMTS-type providers:
```yaml
      - name: World Imagery Tiles
        default: false
        type: tile
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        options:
          tms: false
```

If desired, you can alse configure a local tiled imagery cache with a downloaded tile set.  Your offline imagery set should be in the form of `{z}/{x}/{y}.png` or similar.  If you download tiles from OpenStreetMaps, this is the format you'll get them in. 

1. In the ANET home directory (the same directory as `bin`, `lib` and `docs`) create a directory called `imagery`. 
```yaml
assets:
  overrides:
    /imagery: imagery
```
1. Copy your imagery set into the `imagery` directory.  You should end up with a file structure that looks like `imagery/street/{0,1,2,...}/{0,1,2...}/{0,1,2,3...}.png`
1. To use this new tile source, add under `baseLayers`:
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
