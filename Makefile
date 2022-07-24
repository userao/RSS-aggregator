install-packages:
	npm ci

lint:
	npx eslint .

test:
	NODE_OPTIONS=--experimental-vm-modules npx jest

test-coverage:
	NODE_OPTIONS=--experimental-vm-modules npx jest --coverage

start:
	npm run start

build:
	rm -rf dist
	npm run build