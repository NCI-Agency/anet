# ANET Troubleshooting Guide

This document covers commonly experienced problems when administrating ANET.

## Installation issues

### Database connection fails

_Symptoms_ Getting database connection issues when running ```"bin/anet.bat" db migrate anet.yml```, ```"bin/anet.bat" init anet.yml``` or ```"bin/anet.bat" server anet.yml```

_Possible Causes_
1. If using integrated authentication for database authentication, the command should be executed by an allow user. To fix, either execute the scripts from a service account, or add the current user to the SQL SERVER authorized users
1. If using username/password for database authentication, verify the username and password
1. SQL Server is not configured on the specified port. Verify that SQL Server is configured to listen to TCP on the port specified in `anet.yml` (typically `1433`)

## Authentication issues

### Integrated Windows Authentication does not work

_Symptoms_ When a user is accessing ANET, she/he is presented with an username/password prompt instead of seamless access to ANET

_Possible Causes_
1. ANET is running in development mode. To resolve, please make sure that `anet.yml` has `developmentMode: false`
1. ANET is not configured to support the Negotiate and NTLM protocols. To resolve, please update the `waffleConfig` section of `anet.yml`
1. The server running ANET server does not have `allowed to authenticate` enabled in its object in Active Directory
1. There is no trust relationship with authentication established between the domain of the ANET server and the domain of the user experiencing the issue

## Database issues

### No admin access

_Symptoms_ The ANET administrator is unable to gain `admin` status. Typically happens after importing a complete database from a different domain

To resolve this, you will need to nominate the administrator (who should have a valid username) to occupy an exisiting admin position. To do so:
1. Make sure the administrator logs in ANET and has created an account
1. The administrator should identify his/her domain username by executing `whoami` in a console
1. In the SQL Server managmeent tools, locate the uuid of the user by executing `select uuid from people where domainUsername = 'domain\username'`, where `'domain\username'` is substituted with the value from the step above
1. Identify a exisiting admin position that you want the administrator to occupy. You can list all admin positions with `select * from positions where type=3`. Note the uuid of the desired position
1. Make the administrator occupy that position by running `update positions set currentPersonUuid=personUuid where uuid=positionUuid` after you substitute personUuid with the uuid from step 3. and position uuid with the uuid from step 4.
1. the administrator should now have admin access 
