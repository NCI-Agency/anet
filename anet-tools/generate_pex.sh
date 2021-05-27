#!/bin/bash

PEXFILENAME="$1"
if [ -z "$PEXFILENAME" ]
then
  echo "Usage: $0 <pexfilename>"
  exit 1
fi

TMPDIR=`mktemp -d`
virtualenv "$TMPDIR"
source "$TMPDIR/bin/activate"
export LC_ALL=C.UTF-8
export LANG=C.UTF-8
pipenv install --skip-lock
pex $(pip freeze) . -o "./pex/$PEXFILENAME" --disable-cache
deactivate
rm -r "$TMPDIR"