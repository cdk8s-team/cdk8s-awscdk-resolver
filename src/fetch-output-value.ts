import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';

async function fetchOutputValue(stackName: string, outputName: string) {

  const cloudformation = new CloudFormationClient();

  const response = await cloudformation.send(new DescribeStacksCommand({
    StackName: stackName,
  }));

  if (!response.Stacks) {
    throw new Error(`Unable to find stack ${stackName}`);
  }

  const outputs = response.Stacks[0].Outputs ?? {};
  const value = outputs[outputName];

  if (!value) {
    throw new Error(`Unable to find output ${outputName} in stack ${stackName}`);
  }

  return value;
}

fetchOutputValue(process.argv[2], process.argv[3])
  .then(d => {
    console.log(d);
  })
  .catch(e => {
    throw e;
  });
