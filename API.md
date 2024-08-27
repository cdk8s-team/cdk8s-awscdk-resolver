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





