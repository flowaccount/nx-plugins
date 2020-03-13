# Contributing to the @flowaccount/nx-plugins

We would love for you to contribute to the plugins! Read this document to see how to do it.

## Project Structure

Source code is written on top of nx workspace. We utilizes their `@nrwl/nx-plugin` to make it easier for us to develop these cool plugins and publish it with ease!

We try to keep updated and have some few more steps to get into like adding these items to the repository

- `docs` - Markdown and configuration files for documentation including tutorials, guides for each supported platform, and API docs.
- `apps` - Example apps to run on and see how things works
- `e2e` - We yet have to write the e2e tests for the plugins
- `tests`- We have written several unit tests but it still has to cover more portion of the code!

## Found an Issue?

If you find a bug in the source code or a mistake in the documentation, you can help by [submitting an issue](https://github.com/flowaccount/nx-plugins/blob/master/CONTRIBUTING.md#submit-issue) to [our GitHub Repository](https://github.com/flowaccount/nx-plugins). Even better, you can [submit a Pull Request](https://github.com/flowaccount/nx-plugins/blob/master/CONTRIBUTING.md#submit-pr) with a fix.

## Building the Project

After cloning the project to your machine, to install the dependencies, run:

```bash
yarn
```

To build the plugins, run:

```bash
yarn nx affected:build # for all builds
yarn nx build nx-serverless # or other plugin to build
```

### Running Unit Tests

To make sure your changes do not break any unit tests, run the following:

```bash
yarn nx affected:test # for all tests
yarn nx test nx-serverless # or other plugin to tests
```

### Developing on Windows

To build the plugins and test it without failures on Windows, you need to use WSL.

- Run `yarn install` in WSL. Yarn will compile several dependencies. If you don't run `install` in WSL, they will be compiled for Windows.
- Run `yarn nx test` and other commands in WSL.

## Submission Guidelines

### <a name="submit-issue"></a> Submitting an Issue

Before you submit an issue, please search the issue tracker. An issue for your problem may already exist and has been resolved, or the discussion might inform you of workarounds readily available.

We want to fix all the issues as soon as possible, but before fixing a bug we need to reproduce and confirm it. Having a reproducible scenario gives us wealth of important information without going back and forth with you requiring additional information, such as:

- the output of `nx report`
- `yarn.lock` or `package-lock.json`
- and most importantly - a use-case that fails

A minimal reproduction allows us to quickly confirm a bug (or point out coding problem) as well as confirm that we are fixing the right problem.

We will be insisting on a minimal reproduction in order to save maintainers time and ultimately be able to fix more bugs. Interestingly, from our experience, users often find coding problems themselves while preparing a minimal repository. We understand that sometimes it might be hard to extract essentials bits of code from a larger code-base but we really need to isolate the problem before we can fix it.

You can file new issues by filling out our [issue form](https://github.com/flowaccount/nx-plugins/issues/new/choose).

### <a name="submit-pr"></a> Submitting a PR

Please follow the following guidelines:

- Make sure unit tests pass (`yarn nx affected:test`)
- Make sure you run `yarn format`
- Update your commit message to follow the guidelines below (use `yarn commit` to automate compliance)
  - `yarn checkcommit` will check to make sure your commit messages are formatted correctly

#### Commit Message Guidelines

The commit message should follow the following format:

```
type(scope): subject
BLANK LINE
body
```

##### Type

The type must be one of the following:

- chore
- feat
- fix
- cleanup
- docs

##### Scope

The scope must be one of the following:

- nx-serverless - anything serverless specific
- nx-aws-cdk - anything aws-cdk specific
- core - anything infrastructure as a code core specific
- docs - anything related to docs infrastructure
- angular - anything angular specific
- node - anything Node specific
- linter - anything Linter specific
- testing - anything testing specific (e.g., jest or cypress)
- repo - anything related to managing the repo itself
- misc - misc stuff

##### Subject and Body

The subject must contain a description of the change, and the body of the message contains any additional details to provide more context about the change.

Including the issue number that the PR relates to also helps with tracking.

#### Example

```
feat(nx-severless): add an option to make lambda deploy works for angular-scully

`nx generate @flowaccount/nx-serverless mynest` bootstraps the mynest application in workspace

Closes #999
```

#### Commitizen

To simplify and automate the process of committing with this format,
**@flowaccount/nx-plugins is a [Commitizen](https://github.com/commitizen/cz-cli) friendly repository**, just do `git add` and execute `yarn commit`.
