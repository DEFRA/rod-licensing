pipeline {
    agent any
    stages {
        stage('Prepare') {
            steps {
                script {
                    sh  """
                        printenv
                    """
                }
            }
        }
        stage('Build') {
            steps {
                script {
                    sh  """
                        # Deploy docker images
                        echo "Building docker images:  $(docker --version)"
                        # Authenticate Docker with AWS ECR
                        echo "Authenticating with the remote repository: $(aws ecr get-login-password | docker login --username AWS --password-stdin "${AWS_ECR_ENDPOINT}")"

                        # Build all images
                        echo "Building images for tag ${TAG_NAME}"
                        TAG=${TAG_NAME} PROJECT_DOCKERFILE=Dockerfile docker-compose -f docker/services.build.yml build
                    """
                }
            }
        }
        stage('Deploy images to ECR') {
            steps {
                script {
                    sh  """
                        # Get list of rod_licensing images and push to the remote ECR repository
                        docker image list --format "{{.Repository}}" --filter=reference="rod_licensing/*:${TAG_NAME}" | {
                            while read -r IMAGE_NAME
                            do
                                echo "Pushing ${IMAGE_NAME}:${TAG_NAME} to ${AWS_ECR_ENDPOINT}/${IMAGE_NAME}:${TAG_NAME}"
                                docker tag "${IMAGE_NAME}:${TAG_NAME}" "${AWS_ECR_ENDPOINT}/${IMAGE_NAME}:${TAG_NAME}"

                                # Fork the push operations to allow them to run in parallel
                                docker push "${AWS_ECR_ENDPOINT}/${IMAGE_NAME}:${TAG_NAME}" > /dev/null &
                            done
                            echo "Waiting for all images to be pushed..."
                            wait || exit 1
                        }
                    """
                }
            }
        }
    }
    post {
        cleanup {
            cleanWs cleanWhenFailure: false
        }
    }
}
