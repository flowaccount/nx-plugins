#!/usr/bin/env bash
rm -rf build

mkdir build
mkdir build/packages

echo "Compiling Typescript..."
./node_modules/.bin/tsc
echo "Compiled Typescript"

rsync -a --exclude=*.ts,node_modules/* packages/ build/packages