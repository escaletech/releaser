# Releaser
Release scripts for all of Escale's workflows

- [Releaser](#releaser)
  - [What it does](#what-it-does)
  - [Usage](#usage)
    - [General](#general)
    - [Node.js](#nodejs)
    - [Makefile](#makefile)
  - [What it doesn't do](#what-it-doesnt-do)

## What it does

1. Fetches your repo from origin, to make sure that it is updated
2. Prints the commits that are being considered for the version bump
3. Uses `conventional-recommended-bump` and `semver` to figure out the next version
4. Asks for your approval
5. Creates the new tag on the current commit
6. Pushes the tag


## Usage

Requirements:
* `npm`
* `git`

### General

Using the release script consists of running `tag-and-push.sh`, which can be done anytime with:
```sh
bash -c "$(curl -s https://raw.githubusercontent.com/escaletech/releaser/master/tag-and-push.sh)"
```

### Node.js

Add the following to your `package.json`:
```json
{
  "scripts": {
    "release": "bash -c \"$(curl -s https://raw.githubusercontent.com/escaletech/releaser/master/tag-and-push.sh)\""
  }
}
```

Then you can `npm run release`.


### Makefile

Add the following to your `Makefile`:
```makefile
release:
	@bash -c "$$(curl -s https://raw.githubusercontent.com/escaletech/releaser/master/tag-and-push.sh)"
```

Then you can run `make release`.


## What it doesn't do

* It doesn't update any changelog file. To do so, we recommend using [`conventional-changelog`](https://github.com/conventional-changelog/conventional-changelog).
* It doesn't patch `package.json` or any other file. For this, we recommend using [`standard-version`](https://github.com/conventional-changelog/standard-version).
* It doesn't change any file or create any commit.
