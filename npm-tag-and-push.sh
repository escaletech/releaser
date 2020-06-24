#! /bin/bash

###########
#
# This script will also patch `package.json` file with the new version.
#
# ## Usage
#
# Add the following to your `package.json`:
# {
#   "scripts": {
#     "release": "bash -c \"$(curl -s https://raw.githubusercontent.com/escaletech/releaser/master/npm-tag-and-push.sh)\""
#   }
# }
#
###########

echo "❇️  Verifying dependencies"
test -d $(npm root -g)/conventional-changelog-angular \
    || npm i --silent -g conventional-changelog-angular

echo "☁️  Fetching repo..."
git fetch origin --quiet
echo ""

last_tag=$(git describe --abbrev=0 --tags) || exit 1
increment=$(npx -q conventional-recommended-bump --preset angular)
new_ver=$(npx -q semver -i $increment $last_tag)
tag="v$new_ver"
repo_url=$(git remote get-url origin | perl -pe "s/git\@github\.com:([\w._-]+)\/([\w._-]+)\.git/https:\/\/github.com\/\1\/\2/")

echo "👇  Considering these changes:"
git log --graph --oneline --decorate --abbrev-commit $last_tag..HEAD
echo ""

while true; do
    read -p "❓  Bump from $last_tag to $tag? [y/N] " yn
    case $yn in
        [Yy]* ) break;;
        * ) echo "🚨  Release process aborted"; exit;;
    esac
done

echo "✏️  Patching package.json"
npx -q dot-json package.json version $new_ver
test -f package-lock.json npx -q dot-json package-lock.json version $new_ver

echo "📝  Creating commit"
git commit "chore(release): $tag"

echo "🏷  Tagging $tag"
git tag $tag -a -m "Release $tag"

echo "🛫  Pushing changes to remote"
git push origin master $tag --quiet

echo "🎉  Release created: $repo_url/releases/tag/$tag"
