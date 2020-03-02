#!/bin/bash

set -eu -o pipefail

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )

createPackFile() {
    local packFile
    packFile=$( npm pack )
    targetFile=$( echo "${packFile}" | sed -e 's/[^-]*\.tgz$/dev.tgz/' )
    mv "${packFile}" "${targetFile}"
}

scenarioTest() {
    npm install
    npm test
}

( cd "${DIR}" && createPackFile )
( cd "${DIR}/scenario" && scenarioTest )
