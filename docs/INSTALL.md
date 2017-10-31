# ANET Installation Documentation

## Scope
This document covers the steps required to deploy ANET to a server environment.  

## Environment

- **Hardware**: ANET does not have specific required hardware. Hardware recommendations are:
	- 1x Windows Application Server (300GB HDD, 64 GB RAM, 8x CPU Cores)
	- 1x Microsoft SQL Server (2014 or greater) Database Server. 
- **Software**: Software requirements: 
	- Java JRE 1.8 installed on the Application Server
	- Administration Privileges to run processes on restricted ports (80/443)
	- Optional: A valid SSL certificate for the domain name of the application server. 
	- Microsoft SQL Server 2012 or greater. The MS SQL database should be configured to:
		- allow connections on a static TCP/IP port 1433	
		- fulltext module should be installed. This can be done by:
			1. Open the Programs and Features control panel.
			2. Select Microsoft SQL Server 2012 and click Change.
			3. When prompted to Add/Repair/Remove, select Add.
			4. Advance through the wizard until the Feature Selection screen. Then select Full-Text Search. 
	- Users are required to have a modern web browser (Mozilla Firefox, Google Chrome, or IE version 11 or greater)
- **Network Accessibility**
	- Users will acccess the Application Server over HTTP/HTTPS (80/443)
	- The Application Server will access the SQL Server over port 1433 (or whatever port you have SQL configured to)
	- The Application Server will need to access an Active Directory server for authentication
	- The Application Server will need to access an SMTP server for email sending. 
- **Service Accounts**
	- It is recommended to have a single service account with the following priviliges:
		- Administrator of the Application Server VMs. All scheduled tasks are to be performed under this account.
		- DB ownder of the ANET database. It is recommended to use Windows Authentication for this access.	

## Installation Prerequisites

There is no software to install on client computers, only a modern web browser (Mozilla Firefox, Google Chrome, or Microsoft IE Version 11 or greater) is required.

You should have the following information on hand for the installation:

- **A Build of ANET**. This comes in the form of a `.zip` file. See BUILD.md for details on how to create this file. 
- **Microsoft SQL Server**:  Your Database Administrator should be able to provide you with these settings.  Just ask for an empty database. If you have access to your SQL Server directly, the command to create an empty database is `CREATE DATABASE database_name_here`. Alternatively, a database can be created using the SQL Management tool. 300Mb can be used as an initial database and logs size
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
Create a folder for the application, for example: c:\anet. In that location: 

1. Unzip anet.zip. You'll find three folders directly under the application folder:
	* _bin_: This contains the startup scripts to start/stop the ANET server. 
	* _lib_: This contains all of the dependencies and compiled resources. All of the ANET specific files are bundled in `lib/anet.jar`.
	* _docs_: This is a copy of the docs folder from the git repository, so you'll have a copy of these docuemnts during installation!
2. Add an anet.yml file with appropiate settings to the application folder.  Descriptions of each of the settings in anet.yml can be found in the ANET Configuration section below.  Templates of that file can be found in the docs directory. anet.yml.productionTemplate has been tested on a production set-up.
3. Modify anet.yml following the ANET Configuration section below. If SSL is required, follow the "How to enable SSL" section
4. Verify that your configuration file is valid with `bin/anet.bat check anet.yml`
5. Install Database Schema: Run `bin/anet.bat db migrate anet.yml`
6. Seed the Database: Run `bin/anet.bat init anet.yml`.  This will ask you the following questions:
	* _Classification String_: This is the message that will appear in the top security banner on the screen. For demo instances you should use `FOR DEMO USE ONLY`.
	* _Classification Color_ : This is the color of the top security banner on the screen. For demo instances you should use `green`.
	* _Name of Administrator Organization_: This is the name of the Organization that will be created for the Administrator.  We recommend using something like `ANET Administrators`.
	* _Name of Administrator Position_: This is the name of the position that will be created for the Administrator.  We recommend `ANET Administrator`.
	* _Your Name_: This is the name that will be given to the ANET Administrator, who you presumably are; please use the canonical form of your name: LAST NAME, First name(s)
	* _Your Domain Username_: This is the domain username that will be set on the ANET Administrator (who you presumabely are).  For production situations this will be your windows domain username.   If you get this wrong here, when you first log in to ANET it will create a new user for you. You can either run this database init command again, or do manual SQL commands to fix the `people` table.
7. If imagery/maps are needed, install them according to the "How to configure imagery" section 
8. Launch the ANET Server: `bin/anet.bat server anet.yml`
9. Add a strart-up task for ANET:
	* Open Task Scheduler
	* Create task
	* Name it "ANET"
	* Under Security Options, select the service account
	* Under Security Options, check "run when user is logged on or not"
	* Add a new trigger: "at startup"
	* Add a new "Start a Program" Action:
		* Start a program/script: "c:\anet\bin\anet.bat'
		* Add arguments: "server anet.yml"
		* Start in: "c:\anet"


# ANET Upgrade Documentation
The steps to upgrade ANET across a minor version change are much simpler: 
To build the new anet.jar: 
- In the `client` directory run `npm run build` to build the ANET client package. 
- run `./gradlew.bat jar` to build the ANET server
- Find `anet.jar` in the `build/libs/` directory. 

On the ANET server: 
- Stop the `anet.bat server` process. 
- Take a complete backup of your SQL Database
- Backup the `anet.jar` file from the libs/ directory. 
- Copy the new `anet.jar` file into the libs/ directory. 
- Make any required changes or upgrades to your `anet.yml` file. 
- If Database Migrations are required, run `bin/anet.bat db migrate anet.yml` to migrate your database. 
- Start the server with `anet.bat server anet.yml`
- Run through verification testing to ensure there are no issues. 

# How to Rollback an ANET Upgrade. 


## ANET Configuration
ANET is configured primarily through the `anet.yml` file.  This file follows the Dropwizard configuration format ( http://www.dropwizard.io/1.0.6/docs/manual/core.html#configuration ).  Here is a description of the configuration options custom to ANET:

- **developmentMode**: This flag controls several options on the server that are helpful when developing
	- Authentication: When development mode is `true`, ANET will use basic Authentication checking only that the username provided is equal to the `domainUsername` column of a valid user in the database.  In the event that there is not a matching user, but the provided password is equal to the username, ANET will simulate the first-time log in of a new user (ie a user who passes windows authentication but has never logged into ANET before).
		- ex: To Log in as `Jack Jackson` from the development data set, just type in a username of `jack` when prompted.
		- ex: To simulate a new user type in the same name for both the username and password when prompted (ie un: `hunter`, pw: `hunter` will create a new user with Domain Username of `hunter`).
	- GraphQL: When development mode is `true`, ANET will re-compute the GraphQL graph on every API call, this allows you to rapidly develop on changes without restarting the server.
- **redirectToHttps**: If true, ANET will redirect all HTTP traffic to HTTPS.  You must also configure the application to listen on an HTTP connection (ie port 80). 
- **smtp**: This section controls the configuration for how ANET sends emails.
	- **hostname**: The Fully Qualified Domain Name of your SMTP Server
	- **port**: The port to connect to your SMTP server on (default: 25)
	- **username**: If your SMTP server requires authentication, provide the username here. Otherwise leave blank.
	- **password**: Your password to your SMTP server.
	- **startTLS**: Set to true if your SMTP server requires or provides TLS (Transport Level Security) encryption.
	- **disabled**: Set to true to disable sending email completely; most useful in development context.
- **emailFromAddr**: This is the email address that emails from ANET will be sent from.
- **serverUrl**: The URL for the ANET server, ie: `"https://anet.dds.mil"`.
- **database**: The configuration for your database. ANET supports either sqlite for development, or Microsoft SQL Server for production.  Additonal Instructions can be found here instructions here: http://www.dropwizard.io/1.0.6/docs/manual/jdbi.html for avaiable configuration options for the database connection. 
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
```
dictionary:
  PRINCIPAL_PERSON_TITLE: Afghan Partner
  ADVISOR_PERSON_TITLE: NATO Member
  PRINCIPAL_POSITION_NAME: Afghan Tashkil
  ADVISOR_POSITION_NAME: NATO Billet
  ADVISOR_POSITION_TYPE_TITLE: NATO Advisor
  SUPER_USER_POSITION_TYPE_TITLE: ANET Super User
  ADMINISTRATOR_POSITION_TYPE_TITLE: ANET Administrator
  PRINCIPAL_ORG_NAME: Afghan Government Organization
  ADVISOR_ORG_NAME: Advisor Organization
  POAM_LONG_NAME: Plan of Action and Milestones / Pillars
  POAM_SHORT_NAME: PoAM
  NAV_BAR_ALL_ADVISOR_ORGS: All EFs / AOs
  pinned_ORGs:
    - Key Leader Engagement
  non_reporting_ORGs:
    - ANET Administrators
  countries:
    - Afghanistan
    - Albania
    - Armenia
    - Australia
    - Austria
    - Azerbaijan
    - Belgium
    - Bosnia-Herzegovina
    - Bulgaria
    - Croatia
    - Czech Republic
    - Denmark
    - Estonia
    - Finland
    - Georgia
    - Germany
    - Greece
    - Hungary
    - Iceland
    - Italy
    - Latvia
    - Lithuania
    - Luxembourg
    - Macedonia
    - Mongolia
    - Montenegro
    - Netherlands
    - New Zealand
    - Norway
    - Poland
    - Portugal
    - Romania
    - Slovakia
    - Slovenia
    - Spain
    - Sweden
    - Turkey
    - Ukraine
    - United Kingdom
    - United States of America
  ranks:
    - CIV
    - CTR
    - OR-1
    - OR-2
    - OR-3
    - OR-4
    - OR-5
    - OR-6
    - OR-7
    - OR-8
    - OR-9
    - WO-1
    - WO-2
    - WO-3
    - WO-4
    - WO-5
    - OF-1
    - OF-2
    - OF-3
    - OF-4
    - OF-5
    - OF-6
    - OF-7
    - OF-8
    - OF-9
    - OF-10
```
As can be seen from the example above, the entries `pinned_ORGs`, `non_reporting_ORGs`, `countries` and `ranks` are lists of values; the others are simple key/value pairs. The values in the `pinned_ORGs` and `non_reporting_ORGs` lists should match the shortName field of organizations in the database. The key/value pairs are mostly used as deployment-specific labels for fields in the user interface.

# How to enable SSL
Below is a subset from the complete Dropwizard Documentation that can be found here: http://www.dropwizard.io/1.0.5/docs/manual/core.html#ssl

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

Administrator should request certificates. If needed, self-signed certificates can be created and used as follows:

1. Open a command line in c:\anet
2. run "c:\Program Files\Java\jre1.8.0_121\bin\"keytool.exe -genkey -alias anetkey -keyalg RSA -keystore keystore.jks -keysize 2048.
3. run "c:\Program Files\Java\jre1.8.0_121\bin\"keytool.exe -export -alias anetkey -file anetkey.crt -keystore keystore.jks
4. cd to the directory with cacerts, usually "c:\Program Files\Java\jre1.8.0_121\lib\security"
5. run "c:\Program Files\Java\jre1.8.0_121\bin\"keytool.exe -import -trustcacerts -alias selfsigned -file c:\anet\anetkey.crt -keystore cacerts
6. updte anet.yml with keyStore and trustStore information
 

# How to configure imagery.

ANET uses Leaflet as a map viewer.  You can use any tile sources that work with Leaflet in ANET. In a development environment, or anywhere with access to the internet, you can configure ANET to use OSM tiles by setting the `MAP_LAYERS` Admin Setting to 

```
[{"name":"OSM","default" : true, "url":"http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", "type":"osm"}]
```

For offline deployments of ANET, you can configure a local imagery cache with a downloaded tile set.  Your offline imagery set should be in the form of `{z}/{x}/{y}.png` or similar.  If you download tiles from OpenStreetMaps, this is the format you'll get them in. 

1. In the ANET home directory (the same directory as `bin`, `lib` and `docs`) create a directory called `maps`. Inside that, create a directory called `imagery`. 
1. Copy your imagery set into the `imagery` directory.  You should end up with a file structure that looks like `maps/imagery/{0,1,2,...}/{0,1,2...}/{0,1,2,3...}.png`
1. Edit the `bin/anet.bat` (Windows), or `bin/anet` (Linux/Mac) file. Find the line that sets the `CLASSPATH` variable. (It's really long and lists a bunch of .jar files).  Right after that line, add the line: 

Windows (bin/anet.bat):
```
set CLASSPATH=%APP_HOME%\maps\;%CLASSPATH%

```
Linux/Mac (bin/anet): 
```
CLASSPATH=$APP_HOME/maps/:$CLASSPATH
```

This will put the imagery folder on the server's classpath.  ANET looks for a folder called imagery and will serve those tiles up on the `/imagery` path. 
1. To use this new tile source, set the `MAP_LAYERS` admin setting to 
```
[{"name":"OSM","default" : true, "url":"http://<your-anet-server-url>/imagery/{z}/{x}/{y}.png", "type":"osm"}]
```

Maps should now magically work!  You can test this by going to the url `http://<your-anet-server>/imagery/0/0/0.png` and hopefully seeing a tile appear. 
