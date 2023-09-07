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
    const outputValue = this.fetchOutput(output);
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

    // This can happen if either:
    // --------------------------
    //  1. User didn't define an output.
    //  2. Output was defined in a different stack than the tokens comprising its value.
    //  3. None of the tokens comprising the value are a Reference.
    throw new Error(`Unable to find output defined for ${value} (Inspected stacks: ${inspectedStacks.map(s => s.stackName).join(',')})`);

  }

  private fetchOutput(output: CfnOutput) {

    const script = path.join(__dirname, 'fetch-output.js');
    return execFileSync(process.execPath, [
      script,
      Stack.of(output).stackName,
      output.logicalId,
    ], { encoding: 'utf-8' }).toString().trim();

  }

}
