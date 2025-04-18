### Apollo와 함께하는 플러그인

플러그인을 사용하면 특정 이벤트에 대한 사용자 정의 작업을 수행하여 Apollo Server의 핵심 기능을 확장할 수 있습니다. 현재 이러한 이벤트는 GraphQL 요청 수명 주기의 개별 단계와 Apollo Server 자체의 시작에 해당합니다 (자세한 내용은 [여기](https://www.apollographql.com/docs/apollo-server/integrations/plugins/)에서 읽어보세요). 예를 들어 기본적인 로깅 플러그인은 Apollo Server로 전송되는 각 요청과 관련된 GraphQL 쿼리 문자열을 기록할 수 있습니다.

#### 사용자 정의 플러그인

플러그인을 생성하려면 `@nestjs/apollo` 패키지에서 내보낸 `@Plugin` 데코레이터로 주석이 달린 클래스를 선언하세요. 또한 더 나은 코드 자동 완성 기능을 위해 `@apollo/server` 패키지의 `ApolloServerPlugin` 인터페이스를 구현하세요.

```typescript
import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import { Plugin } from '@nestjs/apollo';

@Plugin()
export class LoggingPlugin implements ApolloServerPlugin {
  async requestDidStart(): Promise<GraphQLRequestListener<any>> {
    console.log('Request started');
    return {
      async willSendResponse() {
        console.log('Will send response');
      },
    };
  }
}
```

이를 설정한 후, `LoggingPlugin`을 프로바이더로 등록할 수 있습니다.

```typescript
@Module({
  providers: [LoggingPlugin],
})
export class CommonModule {}
```

Nest는 플러그인을 자동으로 인스턴스화하고 Apollo Server에 적용합니다.

#### 외부 플러그인 사용하기

기본적으로 제공되는 여러 플러그인이 있습니다. 기존 플러그인을 사용하려면 단순히 가져와서 `plugins` 배열에 추가하세요:

```typescript
GraphQLModule.forRoot({
  // ...
  plugins: [ApolloServerOperationRegistry({ /* options */})]
}),
```

> info **힌트** `ApolloServerOperationRegistry` 플러그인은 `@apollo/server-plugin-operation-registry` 패키지에서 내보내집니다.

#### Mercurius와 함께하는 플러그인

기존 Mercurius 전용 Fastify 플러그인 중 일부는 플러그인 트리에서 Mercurius 플러그인 이후에 로드되어야 합니다 (자세한 내용은 [여기](https://mercurius.dev/#/docs/plugins)에서 읽어보세요).

> warning **경고** [mercurius-upload](https://github.com/mercurius-js/mercurius-upload)는 예외이며 메인 파일에 등록되어야 합니다.

이를 위해 `MercuriusDriver`는 선택적 `plugins` 설정 옵션을 노출합니다. 이 옵션은 두 가지 속성으로 구성된 객체 배열을 나타냅니다: `plugin`과 그 `options`. 따라서 [캐시 플러그인](https://github.com/mercurius-js/cache)을 등록하는 것은 다음과 같습니다:

```typescript
GraphQLModule.forRoot({
  driver: MercuriusDriver,
  // ...
  plugins: [
    {
      plugin: cache,
      options: {
        ttl: 10,
        policy: {
          Query: {
            add: true
          }
        }
      },
    }
  ]
}),
```