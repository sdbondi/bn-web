#!/usr/bin/env bash

set -e

if [[ -z "$CI" ]]; then
    echo "Script should be run in travis only"
    exit 1
fi

echo "+init-github-ssh.sh"
./scripts/init-github-ssh.sh
echo "+git checkout master"
git checkout master
echo "+git remote add sshremote git@github.com:big-neon/bn-web.git"
git remote add sshremote git@github.com:big-neon/bn-web.git
echo "+npm run release:patch"
TAG=`npm version patch -m "Version bump %s [skip ci]"`
git push sshremote ${TAG}
git push sshremote master