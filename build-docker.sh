#!/bin/sh
arch="$(lscpu | awk '/Architecture:/{print $2}')"
case $arch in
  x86_64) arch="linux/amd64" ;;
  aarch64) arch="linux/arm64" ;;
esac
[[ -z $arch ]] && echo "Unkown architecture $arch" && exit
[[ -z $1 ]] && echo "Missing version. (like ./build-docker.sh 1.0.0)" && exit
echo "Building(arch: $arch, version: $1)"
sleep 3
docker buildx build --platform=$arch -t kelgors/gemweb:latest .
docker tag kelgors/gemweb:latest kelgors/gemweb:$1
docker push kelgors/gemweb:$1
docker push kelgors/gemweb:latest
