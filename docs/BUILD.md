# How to build ANET from Source

This document assumes you have a complete development environment set up and working.
You should always run all tests before generating a build!

To build an ANET RPM distribution for Red Hat 8:

```shell
./gradlew distInDocker
```

The resulting rpm can be found in `build/distributions/anet-<version>-0.x86_64.rpm`
(and it also builds a zip file in `build/distributions/anet-<version>.zip`).

The build process is performed in a container to create the required context for Red Hat compatibility.

Other, informal, distribution formats may be generated with the following Gradle tasks:

```shell
./gradlew -PtestEnv check    # Runs checkstyle test and unit tests
./gradlew jpackageImage      # Builds the client, server, and all dependencies including a jre into a single directory image
./gradlew distZip            # Builds the client, server, and all dependencies into a single .zip file
./gradlew distRpm            # Builds the client, server, and all dependencies including a jre into an .rpm file; note
                             # that this builds it on your own system, so it may not be fully Red Hat compatible
```

This will a.o. create zip or rpm distribution files in `build/distributions` which contain all the necessary files to
install ANET.
