#!/bin/bash

set -eu -o pipefail

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )

createPackFile() {
    local packFile targetFile
    packFile=$( npm pack )
    targetFile=$( echo "${packFile}" | sed -e 's/[^-]*\.tgz$/dev.tgz/' )
    mv "${packFile}" "${targetFile}"
}

scenarioTest() {
    rm -rf package-lock.json node_modules
    npm install
    npm run lint
    npm test
}

( cd "${DIR}" && createPackFile )
( cd "${DIR}/scenario" && scenarioTest )
