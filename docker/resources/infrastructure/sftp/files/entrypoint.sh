#!/bin/bash
###############################################################################
#  SFTP Initialisation script
###############################################################################
set -e
trap 'exit 1' INT

ED25519_KEY_PATH="/etc/ssh/ssh_host_ed25519_key"
RSA_KEY_PATH="/etc/ssh/ssh_host_rsa_key"
SFTP_USER=${SFTP_USER:=test}
SFTP_FOLDERS=${SFTP_FOLDERS:=share}

AWS_CLI_ARGS=()
if [ -n "${AWS_SECRETSMANAGER_ENDPOINT}" ]; then
  AWS_CLI_ARGS+=('--endpoint' "${AWS_SECRETSMANAGER_ENDPOINT}")
fi

#########################
# Create SSH keys
#########################
if [ -n "${SSH_HOST_ED25519_SECRET_ID}" ]; then
  echo "Retrieving SSH_HOST_ED25519_KEY from aws secrets manager"
  aws "${AWS_CLI_ARGS[@]}" secretsmanager get-secret-value --secret-id "${SSH_HOST_ED25519_SECRET_ID}" --query SecretString --output text | (umask 177; cat > "${ED25519_KEY_PATH}")
elif [ -n "${SSH_HOST_ED25519_KEY}" ]; then
  echo "Using SSH_HOST_ED25519_KEY defined in environment"
  echo "${SSH_HOST_ED25519_KEY}" | (umask 177; cat > "${ED25519_KEY_PATH}")
else
  echo "Generating new SSH_HOST_ED25519_KEY"
  ssh-keygen -t ed25519 -f "${ED25519_KEY_PATH}" -N ''
  cat "${ED25519_KEY_PATH}"
fi
ssh-keygen -y -f "${ED25519_KEY_PATH}" > "${ED25519_KEY_PATH}.pub"
ssh-keygen -lvf "${ED25519_KEY_PATH}"

if [ -n "${SSH_HOST_RSA_SECRET_ID}" ]; then
  echo "Retrieving SSH_HOST_RSA_SECRET_ID from aws secrets manager"
  aws "${AWS_CLI_ARGS[@]}" secretsmanager get-secret-value --secret-id "${SSH_HOST_RSA_SECRET_ID}" --query SecretString --output text | (umask 177; cat > "${RSA_KEY_PATH}")
elif [ -n "${SSH_HOST_RSA_KEY}" ]; then
  echo "Using SSH_HOST_RSA_KEY defined in environment"
  echo "${SSH_HOST_RSA_KEY}" | (umask 177; cat > "${RSA_KEY_PATH}")
else
  echo "Generating new SSH_HOST_RSA_KEY"
  ssh-keygen -t rsa -b 4096 -f "${RSA_KEY_PATH}" -N ''
  cat "${RSA_KEY_PATH}"
fi
ssh-keygen -y -f "${RSA_KEY_PATH}" > "${RSA_KEY_PATH}.pub"
ssh-keygen -lvf "${RSA_KEY_PATH}"

#########################
# Create test user
#########################
echo "Creating user ${SFTP_USER} with random password"
adduser "${SFTP_USER}" > /dev/null 2>&1 || true
echo "${SFTP_USER}:$(base64 /dev/urandom | tr -d '/+' | fold -w 32 | head -n1)" | chpasswd -e > /dev/null 2>&1

#########################
# Add authorised keys
#########################
echo "Adding authorised keys"
mkdir -p "/home/${SFTP_USER}/.ssh/keys/"
cp "${ED25519_KEY_PATH}.pub" "/home/${SFTP_USER}/.ssh/keys/id_ed25519.pub"
cp "${RSA_KEY_PATH}.pub" "/home/${SFTP_USER}/.ssh/keys/id_rsa.pub"
for publickey in "/home/${SFTP_USER}/.ssh/keys"/*; do
    cat "${publickey}" >> "/home/${SFTP_USER}/.ssh/authorized_keys"
done


#########################
# Create default folders
#########################
IFS=';'
read -ra FOLDERS <<< "${SFTP_FOLDERS}"
for folder in "${FOLDERS[@]}"; do
    echo "Creating folder /home/${SFTP_USER}/${folder}"
    mkdir -p "/home/${SFTP_USER}/${folder}"
done

#########################
# Set permissions
#########################
chown -R "${SFTP_USER}" "/home/${SFTP_USER}/"
chown root:root "/home/${SFTP_USER}"
chmod 755 "/home/${SFTP_USER}"

exec /usr/sbin/sshd -D -e
