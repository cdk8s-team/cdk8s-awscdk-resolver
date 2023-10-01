# AWS CDK Resolver

The `AwsCdkResolver` is able to resolve any [`CfnOutput`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.CfnOutput.html)
defined by your AWS CDK application. In this example, we create an S3 `Bucket` with the AWS CDK, and pass its (deploy time generated)
name as an environment variable to a Kubernetes `CronJob` resource.

```ts
import * as aws from 'aws-cdk-lib';
import * as k8s from 'cdk8s';
import * as kplus from 'cdk8s-plus-27';

import { AwsCdkResolver } from '@cdk8s/awscdk-resolver';

const awsApp = new aws.App();
const stack = new aws.Stack(awsApp, 'aws');

const k8sApp = new k8s.App({ resolvers: [new AwsCdkResolver()] });
const manifest = new k8s.Chart(k8sApp, 'Manifest');

const bucket = new aws.aws_s3.Bucket(stack, 'Bucket');
const bucketName = new aws.CfnOutput(stack, 'BucketName', {
  value: bucket.bucketName,
});

new kplus.CronJob(manifest, 'CronJob', {
  schedule: k8s.Cron.daily(),
  containers: [{
    image: 'job',
    envVariables: {
      // directly passing the value of the `CfnOutput` containing
      // the deploy time bucket name
      BUCKET_NAME: kplus.EnvValue.fromValue(bucketName.value),
    }
 }]
});

awsApp.synth();
k8sApp.synth();
```

During cdk8s synthesis, the custom resolver will detect that `bucketName.value` is not a concrete value,
but rather a value of a `CfnOutput`. It will then perform AWS service calls in order to fetch the
actual value from the deployed infrastructure in your account. This means that in order
for `cdk8s synth` to succeed, it must be executed *after* the AWS CDK resources
have been deployed. So your deployment workflow should (conceptually) be:

1. `cdk deploy`
2. `cdk8s synth`

> Note that the `AwsCdkResolver` is **only** able to fetch tokens that have a `CfnOutput` defined for them.

##### Permissions

Since running `cdk8s synth` will now require performing AWS service calls, it must have access
to a set of AWS credentials. Following are the set of actions the credentials must allow:

- `cloudformation:DescribeStacks`

Note that the actions cdk8s require are far more scoped down than those normally required for the
deployment of AWS CDK applications. It is therefore recommended to not reuse the same set of credentials,
and instead create a scoped down `ReadOnly` role dedicated for cdk8s resolvers.

## Cross Repository Workflow

As we've seen, your `cdk8s` application needs access to the objects defined in your cloud application. If both applications
are defined within the same file, this is trivial to achieve. If they are in different files, a simple `import` statement will suffice.
However, what if the applications are managed in two separate repositories? This makes it a little trickier, but still possible.

In this scenario, `cdk.ts` in the AWS CDK application, stored in a dedicated repository.

```ts
import * as aws from 'aws-cdk-lib';

const awsApp = new aws.App();
const stack = new aws.Stack(awsApp, 'aws');

const bucket = new aws.aws_s3.Bucket(stack, 'Bucket');
const bucketName = new aws.CfnOutput(stack, 'BucketName', {
  value: bucket.bucketName,
});

awsApp.synth();
```

In order for the `cdk8s` application to have cross repository access, the AWS CDK object instances that we want to expose need to be available
via a package repository. To do this, break up the AWS CDK application into the following files:

`app.ts`

```ts
import * as aws from 'aws-cdk-lib';

const awsApp = new aws.App();
const stack = new aws.Stack(awsApp, 'aws');

const bucket = new aws.aws_s3.Bucket(stack, 'Bucket');
// export the thing we want to have available for cdk8s applications
export const bucketName = new aws.CfnOutput(stack, 'BucketName', {
  value: bucket.bucketName,
});

// note that we don't call awsApp.synth here
```

`main.ts`

```ts
import { awsApp } from './app.ts'

awsApp.synth();
```

Now, publish the `app.ts` file to a package manager, so that your `cdk8s` application can install and import it.
This approach might be somewhat counter intuitive, because normally we only publish classes to the package manager,
not instances. Indeed, these types of applications introduce a new use-case that requires the sharing of instances.
Conceptually, this is no different than writing state<sup>*</sup> to an SSM parameter or an S3 bucket, and it allows us to remain
in the boundaries of our programming language, and the typing guarantees it provides.

> <sup>*</sup> Actually, we are only publishing instructions for fetching state, not the state itself.

Assuming `app.ts` was published as the `my-cdk-app` package, our `cdk8s` application will now look like so:

```ts
import * as k8s from 'cdk8s';
import * as kplus from 'cdk8s-plus-27';

// import the desired instance from the AWS CDK app.
import { bucketName } from 'my-cdk-app';

import { AwsCdkResolver } from '@cdk8s/awscdk-resolver';

const k8sApp = new k8s.App({ resolvers: [new AwsCdkResolver()] });
const manifest = new k8s.Chart(k8sApp, 'Manifest');

new kplus.CronJob(manifest, 'CronJob', {
  schedule: k8s.Cron.daily(),
  containers: [{
    image: 'job',
    envVariables: {
      // directly passing the value of the `CfnOutput` containing
      // the deploy time bucket name
      BUCKET_NAME: kplus.EnvValue.fromValue(bucketName.value),
    }
 }]
});

k8sApp.synth();
```
# API Reference <a name="API Reference" id="api-reference"></a>



## Classes <a name="Classes" id="Classes"></a>

### AwsCdkResolver <a name="AwsCdkResolver" id="@cdk8s/awscdk-resolver.AwsCdkResolver"></a>

- *Implements:* cdk8s.IResolver

#### Initializers <a name="Initializers" id="@cdk8s/awscdk-resolver.AwsCdkResolver.Initializer"></a>

```typescript
import { AwsCdkResolver } from '@cdk8s/awscdk-resolver'

new AwsCdkResolver()
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@cdk8s/awscdk-resolver.AwsCdkResolver.resolve">resolve</a></code> | This function is invoked on every property during cdk8s synthesis. |

---

##### `resolve` <a name="resolve" id="@cdk8s/awscdk-resolver.AwsCdkResolver.resolve"></a>

```typescript
public resolve(context: ResolutionContext): void
```

This function is invoked on every property during cdk8s synthesis.

To replace a value, implementations must invoke `context.replaceValue`.

###### `context`<sup>Required</sup> <a name="context" id="@cdk8s/awscdk-resolver.AwsCdkResolver.resolve.parameter.context"></a>

- *Type:* cdk8s.ResolutionContext

---





