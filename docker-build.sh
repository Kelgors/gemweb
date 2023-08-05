#!/bin/bash -e
# Setup (host with qemu installed)
# docker run --privileged --rm tonistiigi/binfmt --install all
# docker buildx create --use --name multi-arch-builder
# Check architectures
# docker buildx inspect --bootstrap
[[ -z $1 ]] && echo "Missing version. (like ./build-docker.sh 1.0.0)" && exit
echo "Building(version: $1)"
sleep 2
docker buildx build --platform=linux/amd64,linux/arm/v7,linux/arm64/v8 -t kelgors/gemweb:$1 --push .
