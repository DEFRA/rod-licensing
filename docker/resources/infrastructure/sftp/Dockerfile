FROM alpine:latest

RUN apk --no-cache -U -v upgrade \
    && apk --no-cache -U -v add bash openssh openssh-sftp-server aws-cli \
    && mkdir -p /var/run/sshd \
    && rm -f /etc/ssh/ssh_host_*key*

COPY ./files/sshd_config /etc/ssh/sshd_config
COPY ./files/entrypoint.sh /
EXPOSE 22
ENTRYPOINT ["/entrypoint.sh"]
