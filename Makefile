ifeq ($(OS),Windows_NT)
	PWD = /$(subst :,,$(CURDIR))
else
	PWD = $(CURDIR)
endif

path = src
exclude = __testfixtures__

fix:
	cd codemod && make fix path=$(abspath $(path)) exclude=$(exclude)

run:
	docker-compose run --rm -e E2E_PATH=$(PWD)/e2e frontend zsh

start:
	docker-compose up

run-e2e:
	cd e2e && docker-compose up e2e

docker-clean-image:
	docker rmi --force $(docker images -qf "dangling=true") | exit 0

docker-clean-container:
	docker rm $(docker ps -q -f status=exited) | exit 0

docker-clean:
	docker image prune -f && docker container prune -f

docker-down:
	docker-compose down && (cd e2e && docker-compose down)

git-push:
	git add --all && git commit --amend --no-edit && git push -f

docker-build-frontend:
	docker-compose build && make docker-clean

docker-push-frontend:
	docker push armkung/frontend

docker-build-e2e:
	(cd e2e && docker-compose build) && make docker-clean

docker-push-e2e:
	docker push armkung/e2e

docker-build-codemod:
	docker build ./codemod -t armkung/codemod --cache-from armkung/codemod && make docker-clean

docker-push-codemod:
	docker push armkung/codemod

publish:
	make git-push && \
	make docker-build-frontend && \
	make docker-build-e2e && \
	make docker-build-codemod && \
	make docker-push-frontend &&\
	make docker-push-e2e && \
	make docker-push-codemod

