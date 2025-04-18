### MikroORM

이 레시피는 Nest에서 MikroORM을 시작하는 데 도움이 되는 내용입니다. MikroORM은 데이터 매퍼, 작업 단위(Unit of Work) 및 ID 맵(Identity Map) 패턴을 기반으로 하는 Node.js용 TypeScript ORM입니다. TypeORM의 훌륭한 대안이며 TypeORM에서 마이그레이션하는 것은 상당히 쉽습니다. MikroORM에 대한 전체 문서는 [여기](https://mikro-orm.io/docs)에서 찾을 수 있습니다.

> info **정보** `@mikro-orm/nestjs`는 서드 파티 패키지이며 NestJS 코어 팀에서 관리하지 않습니다. 이 라이브러리에서 발견된 문제는 [해당 저장소](https://github.com/mikro-orm/nestjs)에 보고해 주세요.

#### 설치

MikroORM을 Nest에 통합하는 가장 쉬운 방법은 [`@mikro-orm/nestjs` 모듈](https://github.com/mikro-orm/nestjs)을 이용하는 것입니다.
Nest, MikroORM 및 기본 드라이버와 함께 간단히 설치합니다.

```bash
$ npm i @mikro-orm/core @mikro-orm/nestjs @mikro-orm/sqlite
```

MikroORM은 `postgres`, `sqlite`, `mongo`도 지원합니다. 모든 드라이버에 대한 자세한 내용은 [공식 문서](https://mikro-orm.io/docs/usage-with-sql/)를 참조하세요.

설치 과정이 완료되면 `MikroOrmModule`을 루트 `AppModule`로 가져올 수 있습니다.

```typescript
import { SqliteDriver } from '@mikro-orm/sqlite';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      entities: ['./dist/entities'],
      entitiesTs: ['./src/entities'],
      dbName: 'my-db-name.sqlite3',
      driver: SqliteDriver,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}
```

`forRoot()` 메서드는 MikroORM 패키지의 `init()`과 동일한 구성 객체를 받습니다. 전체 구성 문서는 [이 페이지](https://mikro-orm.io/docs/configuration)를 확인하세요.

또는 `mikro-orm.config.ts` 구성 파일을 생성하여 [CLI를 구성](https://mikro-orm.io/docs/installation#setting-up-the-commandline-tool)한 다음 인자 없이 `forRoot()`를 호출할 수 있습니다.

```typescript
@Module({
  imports: [
    MikroOrmModule.forRoot(),
  ],
  ...
})
export class AppModule {}
```

하지만 트리 쉐이킹을 사용하는 빌드 도구를 사용할 때는 작동하지 않으므로, 이 경우에는 구성을 명시적으로 제공하는 것이 좋습니다.

```typescript
import config from './mikro-orm.config'; // 여러분의 ORM 구성

@Module({
  imports: [
    MikroOrmModule.forRoot(config),
  ],
  ...
})
export class AppModule {}
```

이후에는 `EntityManager`를 전체 프로젝트에 걸쳐 주입할 수 있게 됩니다(다른 곳에서 어떤 모듈도 가져올 필요 없이).

```ts
// 사용 중인 드라이버 패키지 또는 `@mikro-orm/knex`에서 모든 것을 가져옵니다.
import { EntityManager, MikroORM } from '@mikro-orm/sqlite';

@Injectable()
export class MyService {
  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
  ) {}
}
```

> info **정보** `EntityManager`는 사용하는 드라이버(`mysql`, `sqlite`, `postgres` 등)에 해당하는 `@mikro-orm/driver` 패키지에서 가져온다는 점에 유의하세요. `@mikro-orm/knex`가 종속성으로 설치되어 있다면 거기서도 `EntityManager`를 가져올 수 있습니다.

#### 리포지토리

MikroORM은 리포지토리 디자인 패턴을 지원합니다. 모든 엔티티에 대해 리포지토리를 생성할 수 있습니다. 리포지토리에 대한 전체 문서는 [여기](https://mikro-orm.io/docs/repositories)에서 읽어보세요. 현재 범위에서 등록해야 할 리포지토리를 정의하려면 `forFeature()` 메서드를 사용할 수 있습니다. 예를 들어 다음과 같이 사용합니다.

> info **정보** 기본 엔티티는 `forFeature()`를 통해 등록해서는 **안 됩니다**. 이러한 엔티티에는 리포지토리가 없기 때문입니다. 반면에, 기본 엔티티는 `forRoot()`의 목록(또는 ORM 구성 전반)에 포함되어야 합니다.

```typescript
// photo.module.ts
@Module({
  imports: [MikroOrmModule.forFeature([Photo])],
  providers: [PhotoService],
  controllers: [PhotoController],
})
export class PhotoModule {}
```

그리고 루트 `AppModule`로 가져옵니다.

```typescript
// app.module.ts
@Module({
  imports: [MikroOrmModule.forRoot(...), PhotoModule],
})
export class AppModule {}
```

이렇게 하면 `@InjectRepository()` 데코레이터를 사용하여 `PhotoRepository`를 `PhotoService`에 주입할 수 있습니다.

```typescript
@Injectable()
export class PhotoService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: EntityRepository<Photo>,
  ) {}
}
```

#### 사용자 정의 리포지토리 사용하기

사용자 정의 리포지토리를 사용할 때는 더 이상 `@InjectRepository()`
데코레이터가 필요 없습니다. Nest DI는 클래스 참조를 기반으로 해결되기 때문입니다.

```ts
// `**./author.entity.ts**`
@Entity({ repository: () => AuthorRepository })
export class Author {
  // `em.getRepository()`에서의 추론을 위해
  [EntityRepositoryType]?: AuthorRepository;
}

// `**./author.repository.ts**`
export class AuthorRepository extends EntityRepository<Author> {
  // 여러분의 사용자 정의 메서드...
}
```

사용자 정의 리포지토리 이름이 `getRepositoryToken()`이 반환하는 이름과 동일하므로
더 이상 `@InjectRepository()` 데코레이터가 필요 없습니다.

```ts
@Injectable()
export class MyService {
  constructor(private readonly repo: AuthorRepository) {}
}
```

#### 엔티티 자동 로딩

연결 옵션의 엔티티 배열에 엔티티를 수동으로 추가하는 것은 지루할 수 있습니다. 또한, 루트 모듈에서 엔티티를 참조하면 애플리케이션의 도메인 경계를 깨뜨리고 구현 세부 정보가 애플리케이션의 다른 부분으로 누출됩니다. 이 문제를 해결하기 위해 정적 glob 경로를 사용할 수 있습니다.

하지만 glob 경로는 webpack에서 지원되지 않으므로, 모노레포 내에서 애플리케이션을 빌드하는 경우 사용할 수 없습니다. 이 문제를 해결하기 위해 대안적인 솔루션이 제공됩니다. 엔티티를 자동으로 로딩하려면 `forRoot()` 메서드에 전달되는 구성 객체의 `autoLoadEntities` 속성을 다음과 같이 `true`로 설정합니다.

```ts
@Module({
  imports: [
    MikroOrmModule.forRoot({
      ...
      autoLoadEntities: true,
    }),
  ],
})
export class AppModule {}
```

이 옵션을 지정하면 `forFeature()` 메서드를 통해 등록된 모든 엔티티가 구성 객체의 엔티티 배열에 자동으로 추가됩니다.

> info **정보** `forFeature()` 메서드를 통해 등록되지 않았지만 엔티티에서 참조되는(관계를 통해) 엔티티는 `autoLoadEntities` 설정에 의해 포함되지 않는다는 점에 유의하세요.

> info **정보** `autoLoadEntities`를 사용하는 것은 MikroORM CLI에는 영향을 미치지 않습니다. CLI의 경우 여전히 전체 엔티티 목록이 포함된 CLI 구성이 필요합니다. 반면에 CLI는 webpack을 거치지 않으므로 거기서는 globs를 사용할 수 있습니다.

#### 직렬화

> warning **참고** MikroORM은 더 나은 타입 안전성을 제공하기 위해 모든 엔티티 관계를 `Reference<T>` 또는 `Collection<T>` 객체로 래핑합니다. 이로 인해 [Nest의 내장 직렬 변환기](/techniques/serialization)는 래핑된 관계를 인식하지 못하게 됩니다. 즉, HTTP 또는 WebSocket 핸들러에서 MikroORM 엔티티를 반환하면 해당 관계는 직렬화되지 않습니다.

다행히 MikroORM은 `ClassSerializerInterceptor` 대신 사용할 수 있는 [직렬화 API](https://mikro-orm.io/docs/serializing)를 제공합니다.

```typescript
@Entity()
export class Book {
  @Property({ hidden: true }) // class-transformer의 `@Exclude`와 동일
  hiddenField = Date.now();

  @Property({ persist: false }) // class-transformer의 `@Expose()`와 유사합니다. 메모리에만 존재하며 직렬화됩니다.
  count?: number;

  @ManyToOne({
    serializer: (value) => value.name,
    serializedName: 'authorName',
  }) // class-transformer의 `@Transform()`과 동일
  author: Author;
}
```

#### 큐에서의 요청 범위 핸들러

[문서](https://mikro-orm.io/docs/identity-map)에 언급된 바와 같이, 각 요청에 대해 깨끗한 상태가 필요합니다. 이는 미들웨어를 통해 등록된 `RequestContext` 헬퍼 덕분에 자동으로 처리됩니다.

하지만 미들웨어는 일반적인 HTTP 요청 핸들러에 대해서만 실행됩니다. HTTP 핸들러 외부에서 요청 범위 메서드가 필요하면 어떻게 해야 할까요? 한 가지 예로는 큐 핸들러나 스케줄된 작업이 있습니다.

`@CreateRequestContext()` 데코레이터를 사용할 수 있습니다. 이를 사용하려면 먼저 현재 컨텍스트에 `MikroORM` 인스턴스를 주입해야 합니다. 그러면 해당 인스턴스가 컨텍스트를 생성하는 데 사용됩니다. 내부적으로 이 데코레이터는 여러분의 메서드를 위해 새로운 요청 컨텍스트를 등록하고 해당 컨텍스트 내에서 메서드를 실행합니다.

```ts
@Injectable()
export class MyService {
  constructor(private readonly orm: MikroORM) {}

  @CreateRequestContext()
  async doSomething() {
    // 이것은 별도의 컨텍스트에서 실행됩니다.
  }
}
```

> warning **참고** 이름에서 알 수 있듯이 이 데코레이터는 항상 새로운 컨텍스트를 생성합니다. 반면에 `@EnsureRequestContext`는 이미 다른 컨텍스트 내에 있지 않은 경우에만 생성합니다.

#### 테스트

`@mikro-orm/nestjs` 패키지는 주어진 엔티티를 기반으로 준비된 토큰을 반환하는 `getRepositoryToken()` 함수를 노출하여 리포지토리 모킹을 허용합니다.

```typescript
@Module({
  providers: [
    PhotoService,
    {
      // 또는 사용자 정의 리포지토리가 있는 경우: `provide: PhotoRepository`
      provide: getRepositoryToken(Photo),
      useValue: mockedRepository,
    },
  ],
})
export class PhotoModule {}
```

#### 예제

NestJS와 MikroORM의 실제 예제는 [여기](https://github.com/mikro-orm/nestjs-realworld-example-app)에서 찾을 수 있습니다.