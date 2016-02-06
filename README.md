# ez-changelog
A simple and easy way to generate a CHANGELOG.md based on 
[Angular's changelog.js](https://github.com/angular/angular.js/blob/master/changelog.js)

[![travis build](https://img.shields.io/travis/dougiefresh49/ez-changelog.svg?style=flat-square)](https://travis-ci.org/dougiefresh49/ez-changelog)
[![codecov coverage](https://img.shields.io/codecov/c/github/dougiefresh49/ez-changelog.svg?style=flat-square)](https://codecov.io/github/dougiefresh49/ez-changelog)
[![version](https://img.shields.io/npm/v/ez-changelog.svg?style=flat-square)](http://npm.im/ez-changelog)
[![downloads](https://img.shields.io/npm/dm/ez-changelog.svg?style=flat-square)](http://npm-stat.com/charts.html?package=ez-changelog&from=2016-23-01)
[![MIT License](https://img.shields.io/npm/l/ez-changelog.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli/)


## Table of Contents

  1. [How It Works](#how-it-works)
  1. [Setup](#setup)
  1. [Usage](#usage)
  1. [Example](#example)

## How It Works
`ez-changelog`, simply put, is a tool that generates (or adds to an existing) release changelog based on 
[commitizen](https://github.com/commitizen/cz-cli) style commits. 

It takes every commit in the git log since the last version tag, sorts those commits by their type, 
and then builds a markdown file with the commits properly organized. 


## Setup 

`npm install --save-dev ez-changelog`


## Usage
Building the changelog is easy and painless

* Add the following script to your `package.json`

  `"changelog": "ez-changelog"`

  ```js
  // package.json
  {
    "name": "ez-changelog",
    "version": "1.0.0",
    ...
    "scripts": [
      "changelog": "ez-changelog"
    ]     
    ...
  }  
  ```

* Run the script

  `npm run changelog <version-and-title> <changelog-file>`


 
## Example
Below is a simple walk through of how the tool can be used from scratch, including [tagging](#tagging), 
[committing](#commiting-changes), and [building the changelog](#build-the-changelog).

### Tagging
Creating git tags for versions is very common practice in the software community and is quite simple. For a 
more detailed explanation, check out the [git tagging docs](https://git-scm.com/book/en/v2/Git-Basics-Tagging).

For simplicities sake, we will create a tag for version 1.0.0 and give it a description

`git tag -a v1.0.0 -m "chore(tag): create tag for v1.0.0"`

### Committing
`ez-changelog` works under the assumption that [commitizen]([commitizen](https://github.com/commitizen/cz-cli) 
style commits are being used. For more info about commitizen and proper commits, read 
Angular's [git commit guidelines](https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md#commit) and
how to [make your repo commitizen friendly](https://github.com/commitizen/cz-cli#making-your-repo-commitizen-friendly).

Lets assume you have edited a several files and have some commits with messages such as the following:

```js
commit 44a2afff4039137d7c20e5aa3f0ceafabb87dfd8 
feat(changelog): add script and tests for generating the changelog

commit af5b7c42def90a536356cf4340bd38df6bd6f928
feat(changelog): add exports for higher testability

commit a30491debb187f406218edab0480996d5d09bcde
chore(package.json): add scripts and configs for testing, reporting and pre-commit

commit 992faac888d81a8f18c8646be2a2b07eb36feed7
feat(super changelog): add support for super changelog
```

### Build the Changelog
This is the easiest step!

`npm run changelog "v1.0.0 My First Release" CHANGELOG.md`

Now we would have a `CHANGELOG.md` in the root of your project with 2 features: "changelog" and 
"super changelog", the first with 2 commits listed below and the second with 1.