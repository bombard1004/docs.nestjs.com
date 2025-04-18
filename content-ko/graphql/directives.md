### 지시어 (Directives)

지시어는 필드 또는 프래그먼트 포함(fragment inclusion)에 연결될 수 있으며, 서버가 원하는 어떤 방식으로든 쿼리 실행에 영향을 줄 수 있습니다 ([자세한 내용은 여기](https://graphql.org/learn/queries/#directives)에서 읽어보세요). GraphQL 사양은 몇 가지 기본 지시어를 제공합니다:

- `@include(if: Boolean)` - 인수가 true인 경우에만 이 필드를 결과에 포함합니다.
- `@skip(if: Boolean)` - 인수가 true인 경우 이 필드를 건너뜁니다.
- `@deprecated(reason: String)` - 메시지와 함께 필드가 더 이상 사용되지 않음을 표시합니다.

지시어는 `@` 문자가 앞에 붙는 식별자이며, 선택적으로 이름이 지정된 인수의 목록이 뒤따를 수 있습니다. 이는 GraphQL 쿼리 및 스키마 언어에서 거의 모든 요소 뒤에 나타날 수 있습니다.

#### 사용자 지정 지시어 (Custom directives)

Apollo/Mercurius가 사용자 지정 지시어를 만났을 때 무엇을 해야 할지 지시하려면 변환 함수를 만들 수 있습니다. 이 함수는 `mapSchema` 함수를 사용하여 스키마 내의 위치(필드 정의, 타입 정의 등)를 반복하고 해당 변환을 수행합니다.

```typescript
import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';
import { defaultFieldResolver, GraphQLSchema } from 'graphql';

export function upperDirectiveTransformer(
  schema: GraphQLSchema,
  directiveName: string,
) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const upperDirective = getDirective(
        schema,
        fieldConfig,
        directiveName,
      )?.[0];

      if (upperDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;

        // Replace the original resolver with a function that *first* calls
        // the original resolver, then converts its result to upper case
        fieldConfig.resolve = async function (source, args, context, info) {
          const result = await resolve(source, args, context, info);
          if (typeof result === 'string') {
            return result.toUpperCase();
          }
          return result;
        };
        return fieldConfig;
      }
    },
  });
}
```

이제 `upperDirectiveTransformer` 변환 함수를 `GraphQLModule#forRoot` 메서드 내에서 `transformSchema` 함수를 사용하여 적용합니다:

```typescript
GraphQLModule.forRoot({
  // ...
  transformSchema: (schema) => upperDirectiveTransformer(schema, 'upper'),
});
```

등록되면 `@upper` 지시어를 스키마에서 사용할 수 있습니다. 그러나 지시어를 적용하는 방법은 사용하는 접근 방식(코드 우선 또는 스키마 우선)에 따라 다릅니다.

#### 코드 우선 (Code first)

코드 우선 접근 방식에서는 `@Directive()` 데코레이터를 사용하여 지시어를 적용합니다.

```typescript
@Directive('@upper')
@Field()
title: string;
```

> info **힌트** `@Directive()` 데코레이터는 `@nestjs/graphql` 패키지에서 내보냅니다.

지시어는 필드, 필드 리졸버, 입력 및 객체 타입은 물론 쿼리, 뮤테이션, 서브스크립션에도 적용할 수 있습니다. 다음은 쿼리 핸들러 레벨에 지시어를 적용한 예입니다:

```typescript
@Directive('@deprecated(reason: "This query will be removed in the next version")')
@Query(() => Author, { name: 'author' })
async getAuthor(@Args({ name: 'id', type: () => Int }) id: number) {
  return this.authorsService.findOneById(id);
}
```

> warn **경고** `@Directive()` 데코레이터를 통해 적용된 지시어는 생성된 스키마 정의 파일에 반영되지 않습니다.

마지막으로, 다음과 같이 `GraphQLModule`에 지시어를 선언해야 합니다:

```typescript
GraphQLModule.forRoot({
  // ...,
  transformSchema: schema => upperDirectiveTransformer(schema, 'upper'),
  buildSchemaOptions: {
    directives: [
      new GraphQLDirective({
        name: 'upper',
        locations: [DirectiveLocation.FIELD_DEFINITION],
      }),
    ],
  },
}),
```

> info **힌트** `GraphQLDirective`와 `DirectiveLocation` 모두 `graphql` 패키지에서 내보냅니다.

#### 스키마 우선 (Schema first)

스키마 우선 접근 방식에서는 SDL에 직접 지시어를 적용합니다.

```graphql
directive @upper on FIELD_DEFINITION

type Post {
  id: Int!
  title: String! @upper
  votes: Int
}
```
