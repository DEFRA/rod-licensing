#!/bin/bash
###############################################################################
#  ECR deployment script
###############################################################################
set -e
trap 'exit 1' INT

TAG_NAME=$1
AWS_ECR_ENDPOINT=$2

echo "Authenticating with the remote repository: $(aws ecr get-login-password | docker login --username AWS --password-stdin "${AWS_ECR_ENDPOINT}")"
docker image list --format "{{.Repository}}" --filter=reference="rod_licensing/*:${TAG_NAME}" | {
    pids=()

    while read -r IMAGE_NAME
    do
        docker tag "${IMAGE_NAME}:${TAG_NAME}" "${AWS_ECR_ENDPOINT}/${IMAGE_NAME}:${TAG_NAME}"
        # Fork the push operations to allow them to run in parallel
        docker push "${AWS_ECR_ENDPOINT}/${IMAGE_NAME}:${TAG_NAME}" > /dev/null &
        pids+=($!)
        echo "$!: Pushing ${IMAGE_NAME}:${TAG_NAME} to ${AWS_ECR_ENDPOINT}/${IMAGE_NAME}:${TAG_NAME}"
    done
    echo "Waiting for all images to be pushed..."
    for pid in "${pids[@]}"; do
        echo "Waiting for process ${pid}"
        wait "${pid}" || (echo "${pid}: Failed to push an image to the remote repository" && exit 1)
    done
}
