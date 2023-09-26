import * as aws from 'aws-cdk-lib';
import * as k8s from 'cdk8s';
import * as resolver from '../../src';

const cdkOutDir = process.env.CDK_OUT_DIR;
const cdk8sOutDir = process.env.CDK8S_OUT_DIR;
const stackName = process.env.STACK_NAME!;
const chartName = process.env.CHART_NAME!;

const awsApp = new aws.App({ outdir: cdkOutDir });
const k8sApp = new k8s.App({ outdir: cdk8sOutDir, resolvers: [new resolver.AwsCdkResolver()] });

const stack = new aws.Stack(awsApp, stackName);
const chart = new k8s.Chart(k8sApp, chartName);

const topic1 = new aws.aws_sns.Topic(stack, 'Topic1');
const topic2 = new aws.aws_sns.Topic(stack, 'Topic2');

const simpleOutput = new aws.CfnOutput(stack, 'Simple', {
  value: topic1.topicName,
});

const concatWithLiteralOutput = new aws.CfnOutput(stack, 'ConcatWithLiteral', {
  value: `prefix:${topic1.topicName}`,
});

const concatTwoTokensOutput = new aws.CfnOutput(stack, 'ConcatTwoTokens', {
  value: `${topic1.topicName}${topic2.topicName}`,
});

new k8s.ApiObject(chart, 'ConfigMap', {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  data: {
    Outputs: {
      [stackName]: buildOutputsData(simpleOutput, concatWithLiteralOutput, concatTwoTokensOutput),
    },
  },
});

function buildOutputsData(...outputs: aws.CfnOutput[]) {

  const outputsData: any = {};

  for (const output of outputs) {
    outputsData[output.node.id] = output.value;
  }

  return outputsData;
}

awsApp.synth();
k8sApp.synth();