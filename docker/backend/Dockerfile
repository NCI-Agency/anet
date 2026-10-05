# syntax=docker/dockerfile:1
ARG BASE_IMAGE=registry.access.redhat.com/ubi9/ubi-minimal:latest
FROM ${BASE_IMAGE}

# The RPM supplies Java. Install its native runtime dependencies and the system
# Java trust store; a build mount avoids retaining the RPM archive in a layer.
RUN --mount=type=bind,source=anet.rpm,target=/tmp/anet.rpm \
    test "$(rpm -qp --queryformat '%{NAME}:%{RELEASE}:%{ARCH}' /tmp/anet.rpm)" = 'anet:0.el9:x86_64' \
    && microdnf install -y --setopt=install_weak_deps=0 \
        ca-certificates fontconfig freetype dejavu-sans-fonts \
        alsa-lib libX11 libXext libXi libXrender libXtst libstdc++ zlib \
    && microdnf clean all \
    && rpm -i /tmp/anet.rpm \
    && /opt/anet/lib/runtime/bin/java --list-modules \
    && test -r /etc/pki/java/cacerts

WORKDIR /opt/anet
COPY logback-spring.xml /opt/anet/logback-spring.xml

ENV SPRING_PROFILES_ACTIVE=prod \
    SPRING_CONFIG_ADDITIONAL_LOCATION=file:/config/application.yml \
    ANET_DICTIONARY_NAME=/config/anet-dictionary.yml \
    LOGGING_CONFIG=file:/opt/anet/logback-spring.xml

USER 65532:65532
EXPOSE 8080

ENTRYPOINT ["/opt/anet/lib/runtime/bin/java", "-Djava.library.path=/opt/anet/lib", "-Djavax.net.ssl.trustStore=/etc/pki/java/cacerts", "-Duser.timezone=UTC", "-cp", "/opt/anet/lib/app/*", "mil.dds.anet.AnetApplication"]
