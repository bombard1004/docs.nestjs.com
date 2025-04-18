### 복잡성

> warning **경고** 이 챕터는 코드 우선(code first) 방식에만 적용됩니다.

쿼리 복잡성을 사용하면 특정 필드가 얼마나 복잡한지 정의하고, **최대 복잡성**으로 쿼리를 제한할 수 있습니다. 아이디어는 간단한 숫자를 사용하여 각 필드가 얼마나 복잡한지 정의하는 것입니다. 일반적인 기본값은 각 필드에 `1`의 복잡성을 부여하는 것입니다. 또한 GraphQL 쿼리의 복잡성 계산은 소위 복잡성 평가기(complexity estimators)를 사용하여 사용자 정의할 수 있습니다. 복잡성 평가기는 필드의 복잡성을 계산하는 간단한 함수입니다. 원하는 만큼의 복잡성 평가기를 규칙에 추가할 수 있으며, 이 평가기들은 순서대로 실행됩니다. 숫자 복잡성 값을 반환하는 첫 번째 평가기가 해당 필드의 복잡성을 결정합니다.

`@nestjs/graphql` 패키지는 비용 분석 기반 솔루션을 제공하는 [graphql-query-complexity](https://github.com/slicknode/graphql-query-complexity)와 같은 도구와 잘 통합됩니다. 이 라이브러리를 사용하면 실행 비용이 너무 많이 드는 것으로 간주되는 GraphQL 서버에 대한 쿼리를 거부할 수 있습니다.

#### 설치

사용을 시작하려면 먼저 필요한 종속성을 설치합니다.

```bash
$ npm install --save graphql-query-complexity
```

#### 시작하기

설치 과정이 완료되면 `ComplexityPlugin` 클래스를 정의할 수 있습니다.

```typescript
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { Plugin } from '@nestjs/apollo';
import {
  ApolloServerPlugin,
  BaseContext,
  GraphQLRequestListener,
} from '@apollo/server';
import { GraphQLError } from 'graphql';
import {
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from 'graphql-query-complexity';

@Plugin()
export class ComplexityPlugin implements ApolloServerPlugin {
  constructor(private gqlSchemaHost: GraphQLSchemaHost) {}

  async requestDidStart(): Promise<GraphQLRequestListener<BaseContext>> {
    const maxComplexity = 20;
    const { schema } = this.gqlSchemaHost;

    return {
      async didResolveOperation({ request, document }) {
        const complexity = getComplexity({
          schema,
          operationName: request.operationName,
          query: document,
          variables: request.variables,
          estimators: [
            fieldExtensionsEstimator(),
            simpleEstimator({ defaultComplexity: 1 }),
          ],
        });
        if (complexity > maxComplexity) {
          throw new GraphQLError(
            `Query is too complex: ${complexity}. Maximum allowed complexity: ${maxComplexity}`,
          );
        }
        console.log('Query Complexity:', complexity);
      },
    };
  }
}
```

데모 목적으로 최대 허용 복잡성을 `20`으로 지정했습니다. 위의 예제에서는 `simpleEstimator`와 `fieldExtensionsEstimator` 두 가지 평가기를 사용했습니다.

- `simpleEstimator`: 각 필드에 대해 고정된 복잡성을 반환하는 간단한 평가기
- `fieldExtensionsEstimator`: 스키마의 각 필드에 대한 복잡성 값을 추출하는 필드 확장 평가기

> info **힌트** 어떤 모듈에서든 providers 배열에 이 클래스를 추가해야 합니다.

#### 필드 수준 복잡성

이 플러그인이 있으면 이제 다음과 같이 `@Field()` 데코레이터에 전달되는 옵션 객체에서 `complexity` 속성을 지정하여 모든 필드에 대한 복잡성을 정의할 수 있습니다.

```typescript
@Field({ complexity: 3 })
title: string;
```

또는 평가 함수를 정의할 수 있습니다.

```typescript
@Field({ complexity: (options: ComplexityEstimatorArgs) => ... })
title: string;
```

#### 쿼리/뮤테이션 수준 복잡성

또한 `@Query()` 및 `@Mutation()` 데코레이터는 다음과 같이 `complexity` 속성을 지정할 수 있습니다.

```typescript
@Query({ complexity: (options: ComplexityEstimatorArgs) => options.args.count * options.childComplexity })
items(@Args('count') count: number) {
  return this.itemsService.getItems({ count });
}
```