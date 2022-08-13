#!/bin/sh
# Setup:
# export DOCKER_CLI_EXPERIMENTAL=enabled
# docker run --rm --privileged docker/binfmt:a7996909642ee92942dcd6cff44b9b95f08dad64
# docker buildx create --use --name multi-arch-builder
# docker buildx inspect --bootstrap # check architectures
[[ -z $1 ]] && echo "Missing version. (like ./build-docker.sh 1.0.0)" && exit
echo "Building(version: $1)"
sleep 2
docker buildx build --platform=linux/amd64,linux/arm64,linux/arm/v7 -t kelgors/gemweb:$1 .
