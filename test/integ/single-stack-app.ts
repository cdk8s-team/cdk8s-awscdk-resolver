import * as aws from 'aws-cdk-lib';
import * as k8s from 'cdk8s';
import * as resolver from '../../src';

const awsApp = new aws.App();
const k8sApp = new k8s.App({ resolvers: [new resolver.AwsCdkResolver()] });

const stack = new aws.Stack(awsApp, 'stack');
const chart = new k8s.Chart(k8sApp, 'chart');

const topic = new aws.aws_sns.Topic(stack, 'Topic');

const topicNameOutput = new aws.CfnOutput(stack, 'TopicName', {
  value: topic.topicName,
});

new k8s.ApiObject(chart, 'ConfigMap', {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  data: {
    propr1: topicNameOutput.value,
  },
});

awsApp.synth();
k8sApp.synth();