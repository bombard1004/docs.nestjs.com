### 필드 미들웨어

> warning **경고** 이 장은 코드 우선(code first) 방식에만 적용됩니다.

필드 미들웨어를 사용하면 필드가 리졸브되기 **전이나 후에** 임의의 코드를 실행할 수 있습니다. 필드 미들웨어는 필드의 결과를 변환하거나, 필드의 인수를 검증하거나, 필드 수준의 역할을 확인하는 데 사용할 수 있습니다 (예: 미들웨어 함수가 실행되는 대상 필드에 액세스하는 데 필요함).

하나의 필드에 여러 미들웨어 함수를 연결할 수 있습니다. 이 경우, 이전 미들웨어가 다음 미들웨어를 호출하도록 결정하는 체인을 따라 순차적으로 호출됩니다. `middleware` 배열에 있는 미들웨어 함수의 순서는 중요합니다. 첫 번째 리졸버는 "가장 바깥쪽" 레이어이므로 가장 먼저 실행되고 가장 마지막에 실행됩니다 (`graphql-middleware` 패키지와 유사). 두 번째 리졸버는 "두 번째 바깥쪽" 레이어이므로 두 번째로 실행되고 두 번째로 마지막에 실행됩니다.

#### 시작하기

클라이언트로 보내기 전에 필드 값을 로깅하는 간단한 미들웨어를 만드는 것부터 시작하겠습니다.

```typescript
import { FieldMiddleware, MiddlewareContext, NextFn } from '@nestjs/graphql';

const loggerMiddleware: FieldMiddleware = async (
  ctx: MiddlewareContext,
  next: NextFn,
) => {
  const value = await next();
  console.log(value);
  return value;
};
```

> info **힌트** `MiddlewareContext`는 GraphQL 리졸버 함수가 일반적으로 받는 동일한 인수(`{{ '{' }} source, args, context, info {{ '}' }}`)로 구성된 객체이며, `NextFn`은 스택(이 필드에 바인딩된)의 다음 미들웨어 또는 실제 필드 리졸버를 실행할 수 있게 해주는 함수입니다.

> warning **경고** 필드 미들웨어 함수는 종속성을 주입하거나 Nest의 DI 컨테이너에 액세스할 수 없습니다. 이는 매우 경량으로 설계되었으며 잠재적으로 시간이 오래 걸리는 작업(예: 데이터베이스에서 데이터 검색)을 수행해서는 안 되기 때문입니다. 외부 서비스를 호출하거나 데이터 소스에서 데이터를 쿼리해야 하는 경우, 루트 쿼리/뮤테이션 핸들러에 바인딩된 가드/인터셉터에서 수행하고, 필드 미들웨어 내에서 (특히 `MiddlewareContext` 객체에서) 액세스할 수 있는 `context` 객체에 할당해야 합니다.

필드 미들웨어는 `FieldMiddleware` 인터페이스와 일치해야 합니다. 위 예제에서는 먼저 `next()` 함수를 실행한 다음 (실제 필드 리졸버를 실행하고 필드 값을 반환함), 이 값을 터미널에 로깅합니다. 또한, 미들웨어 함수에서 반환된 값은 이전 값을 완전히 덮어쓰므로, 변경 사항을 적용하지 않으려면 단순히 원래 값을 반환합니다.

이렇게 설정하면, `@Field()` 데코레이터에서 직접 미들웨어를 등록할 수 있습니다.

```typescript
@ObjectType()
export class Recipe {
  @Field({ middleware: [loggerMiddleware] })
  title: string;
}
```

이제 `Recipe` 객체 타입의 `title` 필드를 요청할 때마다 원래 필드의 값이 콘솔에 로깅됩니다.

> info **힌트** [확장](/graphql/extensions) 기능을 사용하여 필드 수준 권한 시스템을 구현하는 방법을 알아보려면 이 [섹션](/graphql/extensions#using-custom-metadata)을 확인하세요.

> warning **경고** 필드 미들웨어는 `ObjectType` 클래스에만 적용할 수 있습니다. 자세한 내용은 이 [이슈](https://github.com/nestjs/graphql/issues/2446)를 확인하세요.

또한 위에서 언급했듯이, 미들웨어 함수 내에서 필드의 값을 제어할 수 있습니다. 시연 목적으로, 레시피의 제목을 대문자로 변환해 보겠습니다 (있는 경우):

```typescript
const value = await next();
return value?.toUpperCase();
```

이 경우, 요청될 때마다 모든 제목이 자동으로 대문자로 변환됩니다.

마찬가지로, `@ResolveField()` 데코레이터로 주석 처리된 사용자 정의 필드 리졸버(메서드)에 필드 미들웨어를 바인딩할 수 있습니다.

```typescript
@ResolveField(() => String, { middleware: [loggerMiddleware] })
title() {
  return 'Placeholder';
}
```

> warning **경고** 필드 리졸버 수준에서 인핸서가 활성화된 경우 ([자세히 읽기](/graphql/other-features#execute-enhancers-at-the-field-resolver-level)), 필드 미들웨어 함수는 **메서드에 바인딩된** 인터셉터, 가드 등보다 먼저 실행됩니다 (하지만 쿼리 또는 뮤테이션 핸들러에 등록된 루트 수준 인핸서 다음).

#### 전역 필드 미들웨어

특정 필드에 직접 미들웨어를 바인딩하는 것 외에도, 하나 이상의 미들웨어 함수를 전역적으로 등록할 수 있습니다. 이 경우, 모든 객체 타입의 모든 필드에 자동으로 연결됩니다.

```typescript
GraphQLModule.forRoot({
  autoSchemaFile: 'schema.gql',
  buildSchemaOptions: {
    fieldMiddleware: [loggerMiddleware],
  },
}),
```

> info **힌트** 전역적으로 등록된 필드 미들웨어 함수는 로컬로 등록된 함수(특정 필드에 직접 바인딩된 함수)보다 **먼저** 실행됩니다.