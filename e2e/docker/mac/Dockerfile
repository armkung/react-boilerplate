FROM kroniak/ssh-client:3.6

WORKDIR /home/app

COPY docker/mac/setup.sh .

ENTRYPOINT ["/bin/bash", "-c", "ssh -o 'StrictHostKeyChecking no' $USER_NAME@host.docker.internal 'bash -s' < ./setup.sh"]