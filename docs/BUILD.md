# How to build ANET from Source

This document assumes you have a complete development environment set up and working.
You should always run all tests before generating a build!

## RPM packaging

This resolves [AB#1685](https://dev.azure.com/ncia-anet/2aa083a5-af3d-44e1-8c7b-6e9e6b124d91/_workitems/edit/1685).

The RPM specification is maintained in the `distRpm` task in `build.gradle`.
Build directly from this repository; ANET-distribution and Ansible are not
needed at build time. The package preserves the existing `/opt/anet` layout,
bundled Java runtime, configuration templates, and launcher. Ansible continues
to supply site configuration and the systemd service.

On an x86_64 Linux host, install binutils and a UBI 9 compatible JDK 21
(for example Eclipse Temurin 21), then run:

```shell
JAVA_HOME=/path/to/jdk-21 ./scripts/build-rpm.sh
./scripts/test-rpm.sh build/distributions/*.el9.x86_64.rpm
```

The version comes from the same `git describe` value used for ANET's application
version. Release builds can override it with `-PdistributionVersion=<version>`.
The RPM is written to `build/distributions/anet-<version>-0.el9.x86_64.rpm`.
`-PrpmDist` labels the target; it does not make an incompatible host JDK compatible.
Use a compatible JDK even when building on a newer Linux distribution.

The validation script requires a host JDK to compile its smoke test and uses Docker to install the RPM in a fresh minimal UBI 9
container with only standard UBI 9 repositories enabled. It checks package
contents, native library resolution, the bundled JVM, and the ANET launcher.
It does not configure a database, Keycloak, or a deployed service.

The GitHub Actions `package-rpm` job builds on the runner after the existing
tests succeed, validates installation in minimal UBI 9, and uploads the
`anet-rpm-el9-x86_64` workflow artifact.

## Other build formats

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
