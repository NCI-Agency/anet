#!/usr/bin/env bash
set -euo pipefail

if (( $# != 1 )) || [[ ! -f $1 ]]; then
  echo "Usage: scripts/test-rpm.sh path/to/anet.rpm" >&2
  exit 1
fi
rpm_path=$(realpath "$1")
repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
probe_dir=$(mktemp -d)
trap 'rm -rf "$probe_dir"' EXIT
"${JAVA_HOME:+$JAVA_HOME/bin/}javac" --release 21 -d "$probe_dir" "$repo_dir/scripts/RpmSmokeTest.java"

# This is an installation test, not a deployment image. Never use host repos
# or subscription mounts; all dependencies must come from public UBI repos.
docker run --rm -i --platform linux/amd64 \
  --mount "type=bind,src=$rpm_path,dst=/tmp/anet.rpm,readonly" \
  --mount "type=bind,src=$probe_dir,dst=/tmp/probe,readonly" \
  registry.access.redhat.com/ubi9/ubi-minimal:latest /bin/bash -s <<'EOF'
set -euo pipefail
repos=(--disablerepo='*' --enablerepo=ubi-9-baseos-rpms --enablerepo=ubi-9-appstream-rpms)
# microdnf does not install local RPM files. Get dnf and inspection tools
# from the same UBI repositories, then let dnf resolve the RPM dependencies.
microdnf "${repos[@]}" install -y dnf findutils
dnf "${repos[@]}" install -y /tmp/anet.rpm
rpm -q --requires anet
rpm -V anet
for path in bin/anet lib/app/anet.cfg logback-spring.xml \
    docs/application.yml.template docs/anet-dictionary.yml.template; do
  test -f "/opt/anet/$path"
done
test -r /etc/pki/java/cacerts
export LD_LIBRARY_PATH=/opt/anet/lib/runtime/lib:/opt/anet/lib/runtime/lib/server
while IFS= read -r native; do
  linked=$(ldd "$native" 2>&1) || { echo "$linked"; exit 1; }
  if [[ $linked == *"not found"* ]]; then
    echo "Unresolved native dependencies in $native: $linked" >&2
    exit 1
  fi
done < <(find /opt/anet -type f \( -name '*.so' -o -path '/opt/anet/bin/anet' -o -path '*/bin/java' \))
/opt/anet/lib/runtime/bin/java --list-modules
# Check the deployed entry point, then run the probe through the same launcher
# and classpath without starting a database-backed service.
grep -q 'app.mainclass=mil.dds.anet.AnetApplication' /opt/anet/lib/app/anet.cfg
cp -p /opt/anet/lib/app/anet.cfg /tmp/anet.cfg
sed -i 's/app.mainclass=mil.dds.anet.AnetApplication/app.mainclass=RpmSmokeTest/; /\[Application\]/a app.classpath=/tmp/probe' /opt/anet/lib/app/anet.cfg
JAVA_TOOL_OPTIONS=-Djava.awt.headless=true /opt/anet/bin/anet
cp -p /tmp/anet.cfg /opt/anet/lib/app/anet.cfg
rpm -V anet
echo "RPM installation and native compatibility checks passed in minimal UBI 9."
EOF
