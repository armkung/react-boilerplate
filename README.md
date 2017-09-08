## Frontend
- Start dev server
  ```
    yarn start
    yarn start:dashboard
  ```
- Run unit test
  ```
    yarn test
    yarn test --watch
    yarn test --watch ./src/index.js
  ```
- Build
  ```
    yarn build
  ```

## Codemod
- Install
  ```
    cd codemod && yarn install
  ```
- Fix code
  ```
    make fix
    make fix path=./src/core exclude=**/libs/**
  ```

## Docker

### Prerequisites
Docker

https://www.docker.com/community-edition#/download

Docker compose

https://docs.docker.com/compose/install/#install-compose

---

- Start service
  ```
    make start
  ```
- Development
  ```
    make run
  ```
- Run E2E test
  ```
    make run-e2e
  ```
- Stop all docker
  ```
    make docker-down
  ```
- Clear cache
  ```
    make docker-clean
  ```
- Download project from docker image
  ```
    docker run -d --name frontend armkung/frontend && docker cp frontend:/app frontend && docker rm -f frontend
  ```

## E2E
- Install
  ```
    cd e2e && yarn install
  ```
- Run test
  ```
    cd e2e && yarn start
  ```

