# How to build ANET from Source

This document assumes you have a complete development environment set up and working.  You should always run all tests before generating a build!

Linux/Mac:
```
./gradlew -PtestEnv check    # Runs checkstyle test and unit tests
./gradlew distZip            # Builds the client, server, and all dependencies into a single .zip file
```

Windows:
```
gradlew.bat -PtestEnv check    # Runs checkstyle test and unit tests
gradlew.bat distZip            # Builds the client, server, and all dependencies into a single .zip file
```

This will create a file in `build/distributions/anet-<version>.zip` which contains all the necessary files to install ANET.

