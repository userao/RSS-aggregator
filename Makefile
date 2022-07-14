install-packages:
	npm ci

lint:
	npx eslint .

publish:
	npm publish
	
test:
	NODE_OPTIONS=--experimental-vm-modules npx jest

test-coverage:
	NODE_OPTIONS=--experimental-vm-modules npx jest --coverage

develop:
	npx webpack serve

build:
	rm -rf dist
	NODE_ENV=production npx webpack

.PHONY: test