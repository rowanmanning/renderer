
# Reusable Makefile
# ------------------------------------------------------------------------
# This section of the Makefile should not be modified, it includes
# commands from my reusable Makefile: https://github.com/rowanmanning/make
include node_modules/@rowanmanning/make/javascript/index.mk
# [edit below this line]
# ------------------------------------------------------------------------

ifeq ($(NPM_PUBLISH_TAG),)
NPM_PUBLISH_TAG = $(CIRCLE_TAG)
endif
ifeq ($(NPM_PUBLISH_TAG),)
NPM_PUBLISH_TAG = $(TRAVIS_TAG)
endif

publish-npm: npm-set-auth-token npm-set-package-version
	@npm publish --access public
	@$(TASK_DONE)

npm-set-package-version:
	@npm version --no-git-tag-version $(NPM_PUBLISH_TAG)
	@$(TASK_DONE)

npm-set-auth-token:
	@if [ ! -f $(HOME)/.npmrc ]; then \
		echo "//registry.npmjs.org/:_authToken=$(NPM_AUTH_TOKEN)" > $(HOME)/.npmrc; \
	fi
	@$(TASK_DONE)
