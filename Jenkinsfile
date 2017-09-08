node('docker') {
    
    checkout scm
 
    try {

        stage('Init') {
            parallel(
                'frontend': {
                    sh 'docker build -t frontend:jenkins --cache-from armkung/frontend .'
                    sh 'COMPOSE_HTTP_TIMEOUT=500 docker-compose run -d -v /home/node/app/node_modules --name frontend frontend bash -c "tail -f /dev/null"'
                    sh 'docker cp . frontend:/home/node/app/'
                },
                'e2e': {
                    dir('e2e') {
                        sh 'docker build -t e2e:jenkins --cache-from armkung/e2e .'
                        sh 'docker-compose up -d selenium_node_chrome'
                        sh 'COMPOSE_HTTP_TIMEOUT=500 docker-compose run -d -v /home/node/app/node_modules --name e2e e2e sh -c "tail -f /dev/null"'
                        sh 'docker cp . e2e:/home/node/app/'
                    }
                }
            )
        }

        stage('Start frontend') {
            sh 'docker exec -d frontend bash -c "yarn start"'
            sh 'timeout 60 wget --retry-connrefused --tries=60 --waitretry=1 -q http://localhost:8000 -O /dev/null'
        }

        stage('Test') {
            parallel(
                'frontend': {
                     sh 'docker exec frontend bash -c "yarn test"'
                },
                'e2e': {
                    dir('e2e') {
                        sh 'docker exec e2e sh -c "yarn start"'
                    }
                }
            )
        }

    } catch(err) {
        throw(err)
    } finally {
        stage('Clean') {
            sh 'docker-compose down'
            dir('e2e') {
                sh 'docker-compose down'
            }
            sh 'docker rm --force frontend | exit 0'
            sh 'docker rm --force e2e | exit 0'
            sh 'docker rmi --force $(docker images -qf "dangling=true") | exit 0'
        }
    }
}