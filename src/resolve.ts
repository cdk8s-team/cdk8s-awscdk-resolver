import { execFileSync } from 'child_process';
import * as path from 'path';
import { Token, Stack, Tokenization, Reference, CfnOutput } from 'aws-cdk-lib';
import { IResolver, ResolutionContext } from 'cdk8s';


export class AwsCdkResolver implements IResolver {

  public resolve(context: ResolutionContext) {

    if (!Token.isUnresolved(context.value)) {
      return;
    }

    if (typeof context.value !== 'string') {
      // should be ok because we only resolve CfnOutput values, which
      // must be strings.
      throw new Error(`Invalid value type: ${typeof(context.value)} (Expected 'string')`);
    }

    const output = this.findOutput(context.value);
    try {
      const outputValue = this.fetchOutputValue(output);
      context.replaceValue(outputValue);
    } catch (err) {
      // if both cdk8s and AWS CDK applications are defined within the same file,
      // a cdk8s synth is going to happen before the AWS CDK deployment.
      // in this case we must swallow the error, otherwise the AWS CDK deployment
      // won't be able to go through. we replace the value with something to indicate
      // that a fetching attempt was made and failed.
      context.replaceValue(`Failed fetching value for output ${output.node.path}: ${err}`);
    }

  }

  private findOutput(value: string) {

    const inspectedStacks: Stack[] = [];

    for (const token of Tokenization.reverseString(value).tokens) {
      if (Reference.isReference(token)) {
        const stack = Stack.of(token.target);
        inspectedStacks.push(stack);
        const output = stack.node.findAll().filter(c => c instanceof CfnOutput && c.value === value)[0] as CfnOutput;
        // we don't really care if there are more outputs (possible from different stacks)
        // that point to the same value. the first will suffice.
        if (output) return output;
      }
    }

    // This can happen if either:
    // --------------------------
    //  1. User didn't define an output.
    //  2. Output was defined in a different stack than the tokens comprising its value.
    //  3. None of the tokens comprising the value are a Reference.
    throw new Error(`Unable to find output defined for ${value} (Inspected stacks: ${inspectedStacks.map(s => s.stackName).join(',')})`);

  }

  private fetchOutputValue(output: CfnOutput) {

    const script = path.join(__dirname, '..', 'lib', 'fetch-output-value.js');
    return JSON.parse(execFileSync(process.execPath, [
      script,
      Stack.of(output).stackName,
      output.node.id,
    ], { encoding: 'utf-8', stdio: ['pipe'] }).toString().trim());

  }

}
