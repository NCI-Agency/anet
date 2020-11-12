# How to build ANET from Source

This document assumes you have a complete development environment set up and working.  You should always run all tests before generating a build!

Linux/Mac:
```
./gradlew -PtestEnv check    # Runs checkstyle test and unit tests
./gradlew distZip            # Builds the client, server, and all dependencies into a single .zip file
./gradlew jpackageImage      # Builds the client, server, and all dependencies including a jre into a single directory image
./gradlew distDeb distRpm    # Builds the client, server, and all dependencies including a jre into a .deb and an .rpm file
```

This will create zip, deb or rpm distribution files in `build/distributions` which contains all the necessary files to install ANET.
