## TypeScript 및 GraphQL 활용하기

[GraphQL](https://graphql.org/)은 API를 위한 강력한 쿼리 언어이며 기존 데이터로 해당 쿼리를 처리하기 위한 런타임입니다. 이는 REST API에서 일반적으로 발생하는 많은 문제를 해결하는 우아한 접근 방식입니다. 배경 정보로, GraphQL과 REST 간의 [비교](https://www.apollographql.com/blog/graphql-vs-rest)를 읽어보시는 것을 추천합니다. GraphQL과 [TypeScript](https://www.typescriptlang.org/)를 결합하면 GraphQL 쿼리에서 더 나은 타입 안전성을 확보하여 종단 간 타이핑을 제공합니다.

이 챕터에서는 GraphQL에 대한 기본적인 이해를 가정하고, 내장된 `@nestjs/graphql` 모듈 작업 방법에 초점을 맞춥니다. `GraphQLModule`은 [Apollo](https://www.apollographql.com/) 서버(with the `@nestjs/apollo` driver) 및 [Mercurius](https://github.com/mercurius-js/mercurius)(with the `@nestjs/mercurius`)를 사용하도록 구성할 수 있습니다. Nest와 함께 GraphQL을 사용하는 간단한 방법을 제공하기 위해 검증된 GraphQL 패키지에 대한 공식 통합을 제공합니다([여기](https://docs.nestjs.com/graphql/quick-start#third-party-integrations)에서 더 많은 통합 정보를 확인하세요).

자신만의 전용 드라이버를 구축할 수도 있습니다([여기](/graphql/other-features#creating-a-custom-driver)에서 자세한 내용을 읽어보세요).

#### 설치

필요한 패키지를 설치하는 것부터 시작합니다:

```bash
# For Express and Apollo (default)
$ npm i @nestjs/graphql @nestjs/apollo @apollo/server graphql

# For Fastify and Apollo
# npm i @nestjs/graphql @nestjs/apollo @apollo/server @as-integrations/fastify graphql

# For Fastify and Mercurius
# npm i @nestjs/graphql @nestjs/mercurius graphql mercurius
```

> warning **경고** `@nestjs/graphql@>=9` 및 `@nestjs/apollo^10` 패키지는 **Apollo v3**와 호환되며(자세한 내용은 Apollo Server 3 [마이그레이션 가이드](https://www.apollographql.com/docs/apollo-server/migration/)를 확인하세요), `@nestjs/graphql@^8`은 **Apollo v2**만 지원합니다(예: `apollo-server-express@2.x.x` 패키지).

#### 개요

Nest는 GraphQL 애플리케이션을 구축하는 두 가지 방법인 **코드 우선** 및 **스키마 우선** 방식을 제공합니다. 자신에게 가장 적합한 방식을 선택해야 합니다. 이 GraphQL 섹션의 대부분의 챕터는 두 가지 주요 부분으로 나뉩니다: **코드 우선**을 채택하는 경우 따라야 하는 부분과 **스키마 우선**을 채택하는 경우 사용해야 하는 부분입니다.

**코드 우선** 방식에서는 데코레이터와 TypeScript 클래스를 사용하여 해당 GraphQL 스키마를 생성합니다. 이 방식은 TypeScript만 사용하여 언어 구문 간의 컨텍스트 전환을 피하고 싶은 경우에 유용합니다.

**스키마 우선** 방식에서는 GraphQL SDL(Schema Definition Language) 파일이 진리의 원천입니다. SDL은 다른 플랫폼 간에 스키마 파일을 공유하기 위한 언어에 독립적인 방식입니다. Nest는 GraphQL 스키마를 기반으로 TypeScript 정의(클래스 또는 인터페이스 사용)를 자동으로 생성하여 불필요한 반복적인 코드 작성을 줄여줍니다.

<app-banner-courses-graphql-cf></app-banner-courses-graphql-cf>

#### GraphQL 및 TypeScript 시작하기

> info **팁** 다음 챕터에서는 `@nestjs/apollo` 패키지를 통합할 것입니다. 대신 `mercurius` 패키지를 사용하고 싶다면 [이 섹션](/graphql/quick-start#mercurius-integration)으로 이동하세요.

패키지가 설치되면 `GraphQLModule`을 가져와 `forRoot()` 정적 메소드로 구성할 수 있습니다.

```typescript
@@filename()
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
    }),
  ],
})
export class AppModule {}
```

> info **팁** `mercurius` 통합의 경우, 대신 `MercuriusDriver`와 `MercuriusDriverConfig`를 사용해야 합니다. 둘 다 `@nestjs/mercurius` 패키지에서 내보냅니다.

`forRoot()` 메소드는 옵션 객체를 인수로 받습니다. 이 옵션은 기본 드라이버 인스턴스에 전달됩니다(사용 가능한 설정에 대한 자세한 내용은 [Apollo](https://www.apollographql.com/docs/apollo-server/api/apollo-server) 및 [Mercurius](https://github.com/mercurius-js/mercurius/blob/master/docs/api/options.md#plugin-options)에서 읽어보세요). 예를 들어, `playground`를 비활성화하고 `debug` 모드를 끄려면(Apollo의 경우), 다음 옵션을 전달합니다:

```typescript
@@filename()
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: false,
    }),
  ],
})
export class AppModule {}
```

이 경우, 이 옵션은 `ApolloServer` 생성자로 전달됩니다.

#### GraphQL playground

playground는 그래픽적이고 대화형인 브라우저 내 GraphQL IDE이며, 기본적으로 GraphQL 서버 자체와 동일한 URL에서 사용할 수 있습니다. playground에 액세스하려면 기본적인 GraphQL 서버가 구성 및 실행 중이어야 합니다. 지금 확인하려면 [여기에서 작동하는 예제](https://github.com/nestjs/nest/tree/master/sample/23-graphql-code-first)를 설치하고 빌드할 수 있습니다. 또는 이 코드 샘플을 따라하고 있다면 [리졸버 챕터](/graphql/resolvers-map)의 단계를 완료한 후 playground에 액세스할 수 있습니다.

준비가 완료되고 애플리케이션이 백그라운드에서 실행 중이면 웹 브라우저를 열고 `http://localhost:3000/graphql`로 이동할 수 있습니다(호스트와 포트는 구성에 따라 다를 수 있습니다). 그러면 아래와 같이 GraphQL playground가 표시됩니다.

<figure>
  <img src="/assets/playground.png" alt="" />
</figure>

> info **참고** `@nestjs/mercurius` 통합은 내장된 GraphQL Playground 통합을 제공하지 않습니다. 대신 [GraphiQL](https://github.com/graphql/graphiql)을 사용할 수 있습니다(`graphiql: true` 설정).

> warning **경고** 업데이트 (2025년 4월 14일): 기본 Apollo playground는 더 이상 사용되지 않으며 다음 주요 릴리스에서 제거될 예정입니다. 대신 아래와 같이 `GraphQLModule` 설정에서 `graphiql: true`로 설정하여 [GraphiQL](https://github.com/graphql/graphiql)을 사용할 수 있습니다.
>
> ```typescript
> GraphQLModule.forRoot<ApolloDriverConfig>({
>   driver: ApolloDriver,
>   graphiql: true,
> }),
> ```
>
> 애플리케이션이 [구독](/graphql/subscriptions)을 사용하는 경우, `subscriptions-transport-ws`는 GraphiQL에서 지원되지 않으므로 `graphql-ws`를 사용해야 합니다.

#### 코드 우선

**코드 우선** 방식에서는 데코레이터와 TypeScript 클래스를 사용하여 해당 GraphQL 스키마를 생성합니다.

코드 우선 방식을 사용하려면 옵션 객체에 `autoSchemaFile` 속성을 추가하는 것부터 시작합니다.

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
}),
```

`autoSchemaFile` 속성 값은 자동으로 생성될 스키마 파일의 경로입니다. 또는 스키마를 메모리에서 즉시(on-the-fly) 생성할 수 있습니다. 이를 활성화하려면 `autoSchemaFile` 속성을 `true`로 설정합니다.

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: true,
}),
```

기본적으로 생성된 스키마의 타입은 포함된 모듈에서 정의된 순서대로 정렬됩니다. 스키마를 사전순으로 정렬하려면 `sortSchema` 속성을 `true`로 설정합니다.

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  sortSchema: true,
}),
```

#### 예제

완전히 작동하는 코드 우선 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/23-graphql-code-first)에서 사용할 수 있습니다.

#### 스키마 우선

스키마 우선 방식을 사용하려면 옵션 객체에 `typePaths` 속성을 추가하는 것부터 시작합니다. `typePaths` 속성은 `GraphQLModule`이 작성할 GraphQL SDL 스키마 정의 파일을 찾을 위치를 나타냅니다. 이 파일들은 메모리에서 결합됩니다; 이를 통해 스키마를 여러 파일로 분할하고 해당 리졸버 근처에 배치할 수 있습니다.

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  typePaths: ['./**/*.graphql'],
}),
```

일반적으로 GraphQL SDL 타입에 해당하는 TypeScript 정의(클래스 및 인터페이스)도 필요합니다. 해당 TypeScript 정의를 수동으로 만드는 것은 불필요하고 번거롭습니다. 이는 진리의 단일 원천이 없게 만듭니다 -- SDL 내에서 변경할 때마다 TypeScript 정의도 조정해야 합니다. 이를 해결하기 위해 `@nestjs/graphql` 패키지는 추상 구문 트리([AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree))에서 TypeScript 정의를 **자동으로 생성**할 수 있습니다. 이 기능을 활성화하려면 `GraphQLModule`을 구성할 때 `definitions` 옵션 속성을 추가합니다.

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  typePaths: ['./**/*.graphql'],
  definitions: {
    path: join(process.cwd(), 'src/graphql.ts'),
  },
}),
```

`definitions` 객체의 `path` 속성은 생성된 TypeScript 출력을 저장할 위치를 나타냅니다. 기본적으로 모든 생성된 TypeScript 타입은 인터페이스로 생성됩니다. 대신 클래스를 생성하려면 `outputAs` 속성을 `'class'` 값으로 지정합니다.

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  typePaths: ['./**/*.graphql'],
  definitions: {
    path: join(process.cwd(), 'src/graphql.ts'),
    outputAs: 'class',
  },
}),
```

위의 방식은 애플리케이션이 시작될 때마다 TypeScript 정의를 동적으로 생성합니다. 또는 간단한 스크립트를 빌드하여 필요에 따라(on demand) 생성하는 것이 더 좋을 수 있습니다. 예를 들어, `generate-typings.ts`로 다음 스크립트를 생성했다고 가정해 보겠습니다:

```typescript
import { GraphQLDefinitionsFactory } from '@nestjs/graphql';
import { join } from 'path';

const definitionsFactory = new GraphQLDefinitionsFactory();
definitionsFactory.generate({
  typePaths: ['./src/**/*.graphql'],
  path: join(process.cwd(), 'src/graphql.ts'),
  outputAs: 'class',
});
```

이제 필요에 따라 이 스크립트를 실행할 수 있습니다:

```bash
$ ts-node generate-typings
```

> info **팁** 스크립트를 미리 컴파일한 다음(예: `tsc` 사용) `node`를 사용하여 실행할 수 있습니다.

스크립트에 대한 watch 모드를 활성화하려면(`.graphql` 파일이 변경될 때마다 자동으로 타이핑을 생성), `generate()` 메소드에 `watch` 옵션을 전달합니다.

```typescript
definitionsFactory.generate({
  typePaths: ['./src/**/*.graphql'],
  path: join(process.cwd(), 'src/graphql.ts'),
  outputAs: 'class',
  watch: true,
});
```

모든 객체 타입에 대한 추가 `__typename` 필드를 자동으로 생성하려면 `emitTypenameField` 옵션을 활성화합니다:

```typescript
definitionsFactory.generate({
  // ...
  emitTypenameField: true,
});
```

리졸버(쿼리, 뮤테이션, 구독)를 인수가 없는 일반 필드로 생성하려면 `skipResolverArgs` 옵션을 활성화합니다:

```typescript
definitionsFactory.generate({
  // ...
  skipResolverArgs: true,
});
```

열거형(enums)을 일반 TypeScript 열거형 대신 TypeScript 유니온 타입으로 생성하려면 `enumsAsTypes` 옵션을 `true`로 설정합니다:

```typescript
definitionsFactory.generate({
  // ...
  enumsAsTypes: true,
});
```

#### Apollo Sandbox

로컬 개발을 위한 GraphQL IDE로 `graphql-playground` 대신 [Apollo Sandbox](https://www.apollographql.com/blog/announcement/platform/apollo-sandbox-an-open-graphql-ide-for-local-development/)를 사용하려면 다음 구성을 사용하십시오:

```typescript
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),
  ],
})
export class AppModule {}
```

#### 예제

완전히 작동하는 스키마 우선 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/12-graphql-schema-first)에서 사용할 수 있습니다.

#### 생성된 스키마 접근하기

어떤 경우(예: 종단 간 테스트)에는 생성된 스키마 객체에 대한 참조를 얻고 싶을 수 있습니다. 종단 간 테스트에서는 HTTP 리스너를 사용하지 않고 `graphql` 객체를 사용하여 쿼리를 실행할 수 있습니다.

`GraphQLSchemaHost` 클래스를 사용하여 생성된 스키마에 접근할 수 있습니다(코드 우선 또는 스키마 우선 방식 모두):

```typescript
const { schema } = app.get(GraphQLSchemaHost);
```

> info **팁** 애플리케이션이 초기화된 후(`app.listen()` 또는 `app.init()` 메소드에 의해 `onModuleInit` 훅이 트리거된 후)에 `GraphQLSchemaHost#schema` getter를 호출해야 합니다.

#### 비동기 구성

모듈 옵션을 정적으로 전달하는 대신 비동기적으로 전달해야 하는 경우 `forRootAsync()` 메소드를 사용합니다. 대부분의 동적 모듈과 마찬가지로 Nest는 비동기 구성을 처리하기 위한 여러 기법을 제공합니다.

한 가지 기법은 팩토리 함수를 사용하는 것입니다:

```typescript
 GraphQLModule.forRootAsync<ApolloDriverConfig>({
  driver: ApolloDriver,
  useFactory: () => ({
    typePaths: ['./**/*.graphql'],
  }),
}),
```

다른 팩토리 프로바이더와 마찬가지로, 우리의 팩토리 함수는 <a href="https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory">비동기</a>일 수 있으며 `inject`를 통해 의존성을 주입할 수 있습니다.

```typescript
GraphQLModule.forRootAsync<ApolloDriverConfig>({
  driver: ApolloDriver,
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    typePaths: configService.get<string>('GRAPHQL_TYPE_PATHS'),
  }),
  inject: [ConfigService],
}),
```

또는 아래와 같이 팩토리 대신 클래스를 사용하여 `GraphQLModule`을 구성할 수 있습니다:

```typescript
GraphQLModule.forRootAsync<ApolloDriverConfig>({
  driver: ApolloDriver,
  useClass: GqlConfigService,
}),
```

위 구성은 `GraphQLModule` 내에서 `GqlConfigService`를 인스턴스화하고, 이를 사용하여 옵션 객체를 생성합니다. 이 예에서 `GqlConfigService`는 아래와 같이 `GqlOptionsFactory` 인터페이스를 구현해야 합니다. `GraphQLModule`은 제공된 클래스의 인스턴스화된 객체에서 `createGqlOptions()` 메소드를 호출합니다.

```typescript
@Injectable()
class GqlConfigService implements GqlOptionsFactory {
  createGqlOptions(): ApolloDriverConfig {
    return {
      typePaths: ['./**/*.graphql'],
    };
  }
}
```

`GraphQLModule` 내부에 개인 복사본을 만드는 대신 기존 옵션 프로바이더를 재사용하고 싶다면 `useExisting` 구문을 사용합니다.

```typescript
GraphQLModule.forRootAsync<ApolloDriverConfig>({
  imports: [ConfigModule],
  useExisting: ConfigService,
}),
```

#### Mercurius 통합

Apollo 대신 Fastify 사용자([여기](/techniques/performance)에서 자세한 내용 읽기)는 대안으로 `@nestjs/mercurius` 드라이버를 사용할 수 있습니다.

```typescript
@@filename()
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver, MercuriusDriverConfig } from '@nestjs/mercurius';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      graphiql: true,
    }),
  ],
})
export class AppModule {}
```

> info **팁** 애플리케이션이 실행되면 브라우저를 열고 `http://localhost:3000/graphiql`로 이동합니다. [GraphQL IDE](https://github.com/graphql/graphiql)가 표시될 것입니다.

`forRoot()` 메소드는 옵션 객체를 인수로 받습니다. 이 옵션은 기본 드라이버 인스턴스에 전달됩니다. 사용 가능한 설정에 대한 자세한 내용은 [여기](https://github.com/mercurius-js/mercurius/blob/master/docs/api/options.md#plugin-options)에서 읽어보세요.

#### 다중 엔드포인트

`@nestjs/graphql` 모듈의 또 다른 유용한 기능은 여러 엔드포인트를 한 번에 서비스하는 기능입니다. 이를 통해 어떤 모듈을 어떤 엔드포인트에 포함할지 결정할 수 있습니다. 기본적으로 `GraphQL`은 전체 앱에서 리졸버를 검색합니다. 이 스캔을 모듈의 하위 집합으로만 제한하려면 `include` 속성을 사용합니다.

```typescript
GraphQLModule.forRoot({
  include: [CatsModule],
}),
```

> warning **경고** 단일 애플리케이션에서 여러 GraphQL 엔드포인트를 사용하여 `@apollo/server` 및 `@as-integrations/fastify` 패키지를 사용하는 경우, `GraphQLModule` 구성에서 `disableHealthCheck` 설정을 활성화해야 합니다.

#### 서드파티 통합

- [GraphQL Yoga](https://github.com/dotansimha/graphql-yoga)

#### 예제

작동하는 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/33-graphql-mercurius)에서 사용할 수 있습니다.