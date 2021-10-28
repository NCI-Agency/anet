#!/bin/bash

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
STORY_DIR="$(realpath -s $SCRIPT_DIR/../../client/stories)"
OUTPUT_DIR="$(realpath -s $SCRIPT_DIR/../../build/documentation)"
SUM_PATH="$OUTPUT_DIR/SUM.odt"

cd "$STORY_DIR"
echo "Generating SUM..."
sed -f "$SCRIPT_DIR/replace.re" `find . -name "*.mdx" | sort` | pandoc -f markdown -o "$SUM_PATH"
echo "Generated SUM: \"$SUM_PATH\""
