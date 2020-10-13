#!/bin/bash
###############################################################################
#  Docker build script
###############################################################################
set -e
trap 'exit 1' INT

TAG_ARGUMENT="${1:-latest}"
TAG=${TAG:-${TAG_ARGUMENT}}

echo "Building images for tag ${TAG} using $(docker --version)"
TAG=${TAG} docker-compose -f docker/infrastructure.yml build
TAG=${TAG} docker-compose -f docker/services.build.yml build
