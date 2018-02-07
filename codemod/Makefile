path = ../src
exclude = __testfixtures__

remove-semi:
	yarn eslint $(path) --quiet --fix --ignore-pattern $(exclude) \
		--no-eslintrc \
	 	--parser 'babel-eslint' \
		--parser-options 'ecmaVersion: 6' \
		--parser-options 'sourceType: module' \
	 	--plugin 'react' \
		--rule 'no-extra-semi: error' \
		--rule 'semi: [error, never]'

eslint:
	yarn eslint $(path) $(options) --ignore-pattern $(exclude) \
		--no-eslintrc \
	 	--parser 'babel-eslint' \
		--parser-options 'ecmaVersion: 6' \
		--parser-options 'sourceType: module' \
	 	--plugin 'react' \
		--rule 'quotes: [error, single]' \
		--rule 'no-extra-semi: error' \
		--rule 'no-trailing-spaces: [error, { skipBlankLines: true }]' \
		--rule 'semi: [error, never]' \
		--rule 'comma-dangle: [error, never]'

eslint-fix:
	make eslint options='--quiet --no-eslintrc --fix' path=$(path) exclude=$(exclude)

codemod:
	yarn jscodeshift -t $(transform) --ignore-pattern=$(exclude) --ignore-config=.transformIgnore $(path)

rename-property:
	yarn jscodeshift -t ./transforms/rename-property.js --ignore-pattern=$(exclude) --ignore-config=.transformIgnore $(path) --old=$(old) --new=$(new)

fix:
	make codemod transform=./transforms/no-vars.js path=$(path) exclude=$(exclude) && \
	make codemod transform=./transforms/remove-unused-imports.js path=$(path) exclude=$(exclude) && \
	make codemod transform=./transforms/remove-unused-assignments.js path=$(path) exclude=$(exclude) && \
	make codemod transform=./transforms/remove-unused-assignments.js path=$(path) exclude=$(exclude) && \
	make codemod transform=./transforms/no-console.js path=$(path) exclude=$(exclude) && \
	make codemod transform=./transforms/prettier-compose.js path=$(path) exclude=$(exclude) && \
	make eslint-fix



