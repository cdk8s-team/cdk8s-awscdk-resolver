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
      throw new Error(`Invalid token type: ${typeof(context.value)}. Expected 'string'.`);
    }

    const output = this.findOutput(context.value);
    const stack = Stack.of(output);

    const outputValue = this.fetchOutput(stack.stackName, stack.resolve(output.logicalId));
    context.replaceValue(JSON.parse(outputValue));

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

    // this can happen if the user didn't define an output or
    // if the output was defined in a different stack than the tokens comprising its value.
    throw new Error(`Unable to find output defined for ${value} (Inspected stacks: ${inspectedStacks.map(s => s.stackName).join(',')})`);

  }

  private fetchOutput(stackName: string, outputId: string) {

    const script = path.join(__dirname, 'fetch-output.js');
    return execFileSync(process.execPath, [
      script,
      stackName,
      outputId,
    ], { encoding: 'utf-8' }).toString().trim();

  }

}
