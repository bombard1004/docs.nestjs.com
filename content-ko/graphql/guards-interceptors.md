### 기타 기능

GraphQL 세계에서는 **인증**이나 작업의 **부수 효과**와 같은 문제를 처리하는 방법에 대해 많은 논쟁이 있습니다. 비즈니스 로직 내에서 이러한 것들을 처리해야 할까요? 권한 부여 로직으로 쿼리와 뮤테이션을 강화하기 위해 고차 함수를 사용해야 할까요? 아니면 [스키마 디렉티브](https://www.apollographql.com/docs/apollo-server/schema/directives/)를 사용해야 할까요? 이러한 질문에 대한 단 하나의 정답은 없습니다.

Nest는 [가드](/guards) 및 [인터셉터](/interceptors)와 같은 크로스 플랫폼 기능을 통해 이러한 문제를 해결하는 데 도움이 됩니다. 철학은 중복성을 줄이고 잘 구조화되고 읽기 쉬우며 일관된 애플리케이션을 만드는 데 도움이 되는 툴링을 제공하는 것입니다.

#### 개요

GraphQL에서도 RESTful 애플리케이션과 동일한 방식으로 표준 [가드](/guards), [인터셉터](/interceptors), [필터](/exception-filters) 및 [파이프](/pipes)를 사용할 수 있습니다. 또한 [커스텀 데코레이터](/custom-decorators) 기능을 활용하여 고유한 데코레이터를 쉽게 만들 수 있습니다. 샘플 GraphQL 쿼리 핸들러를 살펴보겠습니다.

```typescript
@Query('author')
@UseGuards(AuthGuard)
async getAuthor(@Args('id', ParseIntPipe) id: number) {
  return this.authorsService.findOneById(id);
}
```

보시다시피, GraphQL은 HTTP REST 핸들러와 동일한 방식으로 가드와 파이프 모두와 함께 작동합니다. 따라서 인증 로직을 가드로 이동할 수 있습니다. 심지어 REST 및 GraphQL API 인터페이스 모두에서 동일한 가드 클래스를 재사용할 수도 있습니다. 마찬가지로 인터셉터는 두 가지 유형의 애플리케이션에서 동일한 방식으로 작동합니다.

```typescript
@Mutation()
@UseInterceptors(EventsInterceptor)
async upvotePost(@Args('postId') postId: number) {
  return this.postsService.upvoteById({ id: postId });
}
```

#### 실행 컨텍스트

GraphQL은 수신되는 요청에서 다른 유형의 데이터를 받기 때문에 가드와 인터셉터가 받는 [실행 컨텍스트](https://nestjs.dokidocs.dev/fundamentals/execution-context)는 REST와 비교하여 GraphQL에서 다소 다릅니다. GraphQL 리졸버는 `root`, `args`, `context`, `info`라는 별개의 인자 집합을 가집니다. 따라서 가드와 인터셉터는 일반 `ExecutionContext`를 `GqlExecutionContext`로 변환해야 합니다. 이는 간단합니다.

```typescript
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    return true;
  }
}
```

`GqlExecutionContext.create()`가 반환하는 GraphQL 컨텍스트 객체는 각 GraphQL 리졸버 인자(예: `getArgs()`, `getContext()`, 등)에 대한 **get** 메서드를 노출합니다. 변환 후에는 현재 요청에 대한 모든 GraphQL 인자를 쉽게 가져올 수 있습니다.

#### 예외 필터

Nest 표준 [예외 필터](/exception-filters)는 GraphQL 애플리케이션과도 호환됩니다. `ExecutionContext`와 마찬가지로 GraphQL 애플리케이션은 `ArgumentsHost` 객체를 `GqlArgumentsHost` 객체로 변환해야 합니다.

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements GqlExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    return exception;
  }
}
```

> info **힌트** `GqlExceptionFilter`와 `GqlArgumentsHost`는 `@nestjs/graphql` 패키지에서 임포트됩니다.

REST의 경우와 달리, 응답을 생성하기 위해 기본 `response` 객체를 사용하지 않는다는 점에 유의하십시오.

#### 커스텀 데코레이터

앞서 언급했듯이, [커스텀 데코레이터](/custom-decorators) 기능은 GraphQL 리졸버에서도 예상대로 작동합니다.

```typescript
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) =>
    GqlExecutionContext.create(ctx).getContext().user,
);
```

다음과 같이 `@User()` 커스텀 데코레이터를 사용하십시오.

```typescript
@Mutation()
async upvotePost(
  @User() user: UserEntity,
  @Args('postId') postId: number,
) {}
```

> info **힌트** 위 예제에서는 `user` 객체가 GraphQL 애플리케이션의 컨텍스트에 할당되어 있다고 가정했습니다.

#### 필드 리졸버 레벨에서 인핸서 실행

GraphQL 컨텍스트에서 Nest는 필드 레벨에서 **인핸서**(인터셉터, 가드, 필터를 통칭하는 일반적인 이름)를 실행하지 않습니다([이 이슈 참조](https://github.com/nestjs/graphql/issues/320#issuecomment-511193229)): 이는 최상위 `@Query()`/`@Mutation()` 메서드에 대해서만 실행됩니다. `GqlModuleOptions`에서 `fieldResolverEnhancers` 옵션을 설정하여 `@ResolveField()`로 어노테이션된 메서드에 대해 인터셉터, 가드 또는 필터를 실행하도록 Nest에게 지시할 수 있습니다. 해당되는 경우 `'interceptors'`, `'guards'`, 및/또는 `'filters'` 목록을 전달하십시오.

```typescript
GraphQLModule.forRoot({
  fieldResolverEnhancers: ['interceptors']
}),
```

> **경고** 필드 리졸버에 대해 인핸서를 활성화하면 많은 레코드를 반환하고 필드 리졸버가 수천 번 실행될 때 성능 문제가 발생할 수 있습니다. 이러한 이유로 `fieldResolverEnhancers`를 활성화할 때 필드 리졸버에 엄격하게 필요하지 않은 인핸서의 실행을 건너뛰는 것이 좋습니다. 다음 헬퍼 함수를 사용하여 이를 수행할 수 있습니다.

```typescript
export function isResolvingGraphQLField(context: ExecutionContext): boolean {
  if (context.getType<GqlContextType>() === 'graphql') {
    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo();
    const parentType = info.parentType.name;
    return parentType !== 'Query' && parentType !== 'Mutation';
  }
  return false;
}
```

#### 커스텀 드라이버 생성

Nest는 두 개의 공식 드라이버인 `@nestjs/apollo` 및 `@nestjs/mercurius`를 기본으로 제공하며, 개발자가 새로운 **커스텀 드라이버**를 구축할 수 있는 API도 제공합니다. 커스텀 드라이버를 사용하면 모든 GraphQL 라이브러리를 통합하거나 기존 통합을 확장하여 추가 기능을 추가할 수 있습니다.

예를 들어, `express-graphql` 패키지를 통합하려면 다음과 같은 드라이버 클래스를 만들 수 있습니다.

```typescript
import { AbstractGraphQLDriver, GqlModuleOptions } from '@nestjs/graphql';
import { graphqlHTTP } from 'express-graphql';

class ExpressGraphQLDriver extends AbstractGraphQLDriver {
  async start(options: GqlModuleOptions<any>): Promise<void> {
    options = await this.graphQlFactory.mergeWithSchema(options);

    const { httpAdapter } = this.httpAdapterHost;
    httpAdapter.use(
      '/graphql',
      graphqlHTTP({
        schema: options.schema,
        graphiql: true,
      }),
    );
  }

  async stop() {}
}
```

그리고 다음과 같이 사용할 수 있습니다.

```typescript
GraphQLModule.forRoot({
  driver: ExpressGraphQLDriver,
});
```