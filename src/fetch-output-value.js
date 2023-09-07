const { CloudFormationClient, DescribeStacksCommand } = require('@aws-sdk/client-cloudformation');

async function fetchOutputValue(stackName, outputName) {

  const cloudformation = new CloudFormationClient();

  const response = await cloudformation.send(new DescribeStacksCommand({
    StackName: stackName,
  }));

  if (!response.Stacks) {
    throw new Error(`Unable to find stack ${stackName}`);
  }

  const outputs = response.Stacks[0].Outputs ?? [];
  const output = outputs.find(o => o.OutputKey === outputName)

  if (!output) {
    throw new Error(`Unable to find output ${outputName} in stack ${stackName}`);
  }

  return output.OutputValue;
}

fetchOutputValue(process.argv[2], process.argv[3])
  .then(d => {
    console.log(JSON.stringify(d));
  })
  .catch(e => {
    throw e;
  });
