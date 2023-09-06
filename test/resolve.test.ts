import { CfnOutput, Stack } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { ApiObject, Testing, Chart } from 'cdk8s';
import * as resolve from '../src/resolve';

function fetchOutput(stackName: string, outputId: string) {
  return JSON.stringify(`${stackName}:${outputId}`);
}

const resolver = new resolve.AwsCdkResolver();
(resolver as any).fetchOutput = fetchOutput;

test('cannot resolve value that doesnt have an output defined for it', () => {

  const stack = new Stack();
  const chart = new Chart(Testing.app({ resolvers: [resolver] }), 'Chart');

  const bucket = new Bucket(stack, 'Bucket');

  const obj = new ApiObject(chart, 'ApiObject', {
    apiVersion: 'v1',
    kind: 'Struct',
    spec: {
      prop1: bucket.bucketName,
    },
  });

  expect(() => obj.toJson()).toThrowError(`Unable to find output defined for ${bucket.bucketName} (Inspected stacks: Default)`);

});

test('cannot resolve output value defined in a different stack than the output itself', () => {

  const stack1 = new Stack(undefined, 'Stack1');
  const stack2 = new Stack(undefined, 'Stack2');
  const chart = new Chart(Testing.app({ resolvers: [resolver] }), 'Chart');

  const bucket = new Bucket(stack1, 'Bucket');
  const output = new CfnOutput(stack2, 'Output', {
    value: bucket.bucketName,
  });

  const obj = new ApiObject(chart, 'ApiObject', {
    apiVersion: 'v1',
    kind: 'Struct',
    spec: {
      prop1: output.value,
    },
  });

  expect(() => obj.toJson()).toThrowError(`Unable to find output defined for ${bucket.bucketName} (Inspected stacks: Stack1)`);

});

test('can resolve direct output value', () => {

  const stack = new Stack();
  const chart = new Chart(Testing.app({ resolvers: [resolver] }), 'Chart');

  const bucket = new Bucket(stack, 'Bucket');
  const output = new CfnOutput(stack, 'Output', {
    value: bucket.bucketName,
  });

  const obj = new ApiObject(chart, 'ApiObject', {
    apiVersion: 'v1',
    kind: 'Struct',
    spec: {
      prop1: output.value,
    },
  });

  expect(obj.toJson()).toMatchInlineSnapshot(`
Object {
  "apiVersion": "v1",
  "kind": "Struct",
  "metadata": Object {
    "name": "chart-apiobject-c830d7bd",
  },
  "spec": Object {
    "prop1": "Default:Output",
  },
}
`);

});

test('can resolve indirect output value', () => {

  const stack = new Stack();
  const chart = new Chart(Testing.app({ resolvers: [resolver] }), 'Chart');

  const bucket = new Bucket(stack, 'Bucket');
  new CfnOutput(stack, 'Output', {
    value: bucket.bucketName,
  });

  const obj = new ApiObject(chart, 'ApiObject', {
    apiVersion: 'v1',
    kind: 'Struct',
    spec: {
      prop1: bucket.bucketName,
    },
  });

  expect(obj.toJson()).toMatchInlineSnapshot(`
Object {
  "apiVersion": "v1",
  "kind": "Struct",
  "metadata": Object {
    "name": "chart-apiobject-c830d7bd",
  },
  "spec": Object {
    "prop1": "Default:Output",
  },
}
`);

});

test('can resolve concatenation of two output values', () => {

  const stack = new Stack();
  const chart = new Chart(Testing.app({ resolvers: [resolver] }), 'Chart');

  const bucket = new Bucket(stack, 'Bucket');
  const topic = new Topic(stack, 'Topic');

  const output = new CfnOutput(stack, 'Output', {
    value: `${bucket.bucketName}${topic.topicName}`,
  });

  const obj = new ApiObject(chart, 'ApiObject', {
    apiVersion: 'v1',
    kind: 'Struct',
    spec: {
      prop1: output.value,
    },
  });

  expect(obj.toJson()).toMatchInlineSnapshot(`
Object {
  "apiVersion": "v1",
  "kind": "Struct",
  "metadata": Object {
    "name": "chart-apiobject-c830d7bd",
  },
  "spec": Object {
    "prop1": "Default:Output",
  },
}
`);

});
test('can resolve concatenation of literal value and token', () => {

  const stack = new Stack();
  const chart = new Chart(Testing.app({ resolvers: [resolver] }), 'Chart');

  const bucket = new Bucket(stack, 'Bucket');

  const output = new CfnOutput(stack, 'Output', {
    value: `s3://${bucket.bucketName}`,
  });

  const obj = new ApiObject(chart, 'ApiObject', {
    apiVersion: 'v1',
    kind: 'Struct',
    spec: {
      prop1: output.value,
    },
  });

  expect(obj.toJson()).toMatchInlineSnapshot(`
Object {
  "apiVersion": "v1",
  "kind": "Struct",
  "metadata": Object {
    "name": "chart-apiobject-c830d7bd",
  },
  "spec": Object {
    "prop1": "Default:Output",
  },
}
`);

});