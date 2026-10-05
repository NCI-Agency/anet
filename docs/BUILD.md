# How to build ANET from Source

This document assumes you have a complete development environment set up and working.
You should always run all tests before generating a build!

## Container build (Docker or Podman)

The container builder uses Red Hat UBI 9 and OpenJDK 21 to build the trimmed
Java runtime, application image, and RPM. The host only needs Git, tar, and a
working Docker or Podman installation; Java, Node, Yarn, and Gradle run inside
the builder.

```shell
./scripts/build-rpm.sh
# Or select Podman explicitly:
CONTAINER_ENGINE=podman ./scripts/build-rpm.sh
```

Outputs are exported to:

- `build/container/jre/`: trimmed Java runtime
- `build/container/jpackage/`: application image including the runtime
- `build/container/distributions/anet-<version>-0.el9.x86_64.rpm`: installable RPM

The `.el9` release suffix identifies the RHEL 9 target, including when the
container runs on Fedora. The RPM metadata contains the same release suffix.

Pass an output directory as the first argument to export elsewhere. The
builder uses the current contents of Git-tracked files, including uncommitted
edits, and gets the version from `git describe`. Add new source files to Git
before building. Local settings, host build outputs, and dependency caches
are excluded, and the container engine caches image layers between builds.
The base image and Java packages receive updates; this does not pin every
dependency for byte-for-byte reproducibility.

The build targets `linux/amd64`, matching the RPM's existing `x86_64`
architecture. ARM hosts need container emulation configured. Check the
resulting package on the target RHEL 9 system before release. Packaging does
not run the test suite; run tests separately as described below.

### GitHub Actions

The `package-rpm` job runs after the existing build and test jobs succeed.
It uses the same `packaging/Containerfile` with Docker Buildx on an Ubuntu
runner, without requiring a Red Hat runner. Docker layers are cached using
the GitHub Actions cache backend; source or version changes still rebuild
the application layer. The packaging job has its own container caches and
does not reuse the host Gradle/Yarn caches used by the test jobs.

Download the RPM from the workflow run's `anet-rpm-el9-x86_64` artifact.
This stores a workflow artifact; it does not publish a GitHub release or
push a container image to a registry.

## Build on the host

Building an RPM directly should be done on a Red Hat 9 system, with:

```shell
./gradlew -PrpmDist=el9 distRpm
```

The resulting rpm can be found in `build/distributions/anet-<version>-0.el9.x86_64.rpm`.
For a native Fedora 44 build, use `-PrpmDist=fc44` instead. This property labels
the build target; it does not change the build environment. Without it, direct
Gradle builds keep the unsuffixed release `0`.

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
