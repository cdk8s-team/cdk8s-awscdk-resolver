import { Cdk8sTeamJsiiProject } from '@cdk8s/projen-common';
const project = new Cdk8sTeamJsiiProject({
  defaultReleaseBranch: 'main',
  name: 'cdk8s-awscdk-resolver',
  projenrcTs: true,
  release: false,
  devDeps: ['@cdk8s/projen-common'],
  deps: ['aws-cdk-lib', 'cdk8s', '@aws-sdk/client-cloudformation', 'constructs'],
});
project.synth();