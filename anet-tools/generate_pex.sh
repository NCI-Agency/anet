#!/bin/bash

PEXFILENAME="$1"
if [ -z "$PEXFILENAME" ]
then
  echo "Usage: $0 <pexfilename>"
  exit 1
fi

TMPDIR=`mktemp -d`
pip install virtualenv pipenv
virtualenv "$TMPDIR"
source "$TMPDIR/bin/activate"
pipenv install --skip-lock
pex $(pip freeze) . -o "./pex/$PEXFILENAME" --disable-cache
deactivate
rm -r "$TMPDIR"
