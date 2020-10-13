pipeline {
    agent any
    stages {
        stage('Prepare') {
            steps {
                withFolderProperties {
                    script {
                        SETTINGS = [:]
                        SETTINGS.TAG_NAME = env.TAG_NAME
                        SETTINGS.PROVISION_CREDENTIALS_ID = env.PROVISION_CREDENTIALS_ID
                        SETTINGS.AWS_REGION = env.AWS_DEFAULT_REGION ?: env.AWS_REGION
                        SETTINGS.ECR_REGISTRY_ID = env.ECR_REGISTRY_ID
                        SETTINGS.ECR_ENDPOINT = "${SETTINGS.ECR_REGISTRY_ID}.dkr.ecr.${SETTINGS.AWS_REGION}.amazonaws.com"
                        echo "Running with settings: ${SETTINGS}"
                    }
                }
            }
        }
        stage('Build') {
            steps {
                script {
                    sh  """
                        ./scripts/docker/build.sh "${SETTINGS.TAG_NAME}"
                    """
                }
            }
        }
        stage('Deploy images to ECR') {
            steps {
                script {
                    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: SETTINGS.PROVISION_CREDENTIALS_ID]]) {
                        sh """
                            ./scripts/docker/push_to_ecr.sh "${SETTINGS.TAG_NAME}" "${SETTINGS.ECR_ENDPOINT}"
                        """
                    }
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
