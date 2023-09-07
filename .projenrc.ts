import { Cdk8sTeamJsiiProject } from '@cdk8s/projen-common';
const project = new Cdk8sTeamJsiiProject({
  defaultReleaseBranch: 'main',
  name: 'cdk8s-awscdk-resolver',
  projenrcTs: true,
  release: true,
  devDeps: ['@cdk8s/projen-common', 'aws-cdk', 'cdk8s-cli'],
  deps: ['aws-cdk-lib', 'cdk8s', '@aws-sdk/client-cloudformation', 'constructs'],
});

// ignore integ tests because we will add a dedicated task
// for them that only run on main
project.jest?.addIgnorePattern('/test/integ/');

const integTask = project.addTask('integ');
integTask.exec(jest('integ/integ.test.ts'));

project.gitignore.exclude('test/integ/cdk.out', 'test/integ/dist');

project.synth();

function jest(args: string) {
  // we override 'testPathIgnorePatterns' and 'testMatch' so that it matches only integration tests
  // see https://github.com/jestjs/jest/issues/7914
  return `jest --testMatch "<rootDir>/test/integ/**/*.test.ts" --testPathIgnorePatterns "/node_modules/" --passWithNoTests --all --updateSnapshot --coverageProvider=v8 ${args}`;
};
