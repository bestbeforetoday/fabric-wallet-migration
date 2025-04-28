#!/bin/bash

set -eu -o pipefail
shopt -s extglob

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )

createPackFile() {
    local packFile targetFile
    packFile="$( npm pack )"
    targetFile="${packFile/%*([^-]).tgz/dev.tgz}"
    mv "${packFile}" "${targetFile}"
}

scenarioTest() {
    npm install
    npm run lint
    npm run format
    npm test
}

( cd "${DIR}" && createPackFile )
( cd "${DIR}/scenario" && scenarioTest )
