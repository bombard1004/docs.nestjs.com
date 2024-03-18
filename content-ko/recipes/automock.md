### Automock

Automock은 유닛 테스트를 위해 설계된 강력한 독립형 라이브러리입니다. 내부적으로 TypeScript Reflection API를 활용하여 모의 객체를 생성하므로, 클래스의 외부 의존성을 자동으로 모의화함으로써 테스트 프로세스를 단순화합니다. Automock을 사용하면 테스트 개발 프로세스를 간소화하고 효율적으로 만들 수 있어, 견고하고 효율적인 단위 테스트 작성에 집중할 수 있습니다.

> info **정보** `Automock`는 서드 파티 패키지이며 NestJS 코어 팀에서 관리하지 않습니다.
> 라이브러리에서 발견된 문제는 [해당 레포지토리](https://github.com/automock/automock)에 보고해 주세요.

#### Introduction

의존성 주입(DI) 컨테이너는 Nest 모듈 시스템의 근간이 되는 요소로, 애플리케이션 런타임 및 테스트 단계에 모두 중요합니다. 유닛 테스트에서는 특정 컴포넌트의 동작을 분리하고 평가하기 위해 모의 의존성이 필수적입니다. 그러나 이런 모의 객체를 수동으로 구성하고 관리하는 것은 복잡하고 에러가 발생하기 쉽습니다.

Automock는 간소화된 솔루션을 제공합니다. 실제 Nest DI 컨테이너와 상호작용하는 대신, Automock는 가상 컨테이너를 도입하여 의존성을 자동으로 모의화합니다. 이 접근 방식을 통해 DI 컨테이너의 각 프로바이더를 모의 구현으로 수동 대체하는 작업을 우회할 수 있습니다. Automock를 사용하면 모든 의존성에 대한 모의 객체 생성이 자동화되어 유닛 테스트 설정 프로세스가 단순화됩니다.

#### Installation

Automock는 Jest와 Sinon 모두를 지원합니다. 선호하는 테스트 프레임워크 패키지를 설치하세요. 또한 `@automock/adapters.nestjs`를 설치해야 합니다(Automock는 다른 어댑터도 지원합니다).

```bash
$ npm i -D @automock/jest @automock/adapters.nestjs
```

또는 Sinon의 경우:

```bash
$ npm i -D @automock/sinon @automock/adapters.nestjs
```

#### Example

여기에 제공된 예제는 Jest와 Automock 통합을 보여줍니다. 그러나 동일한 원리와 기능이 Sinon에도 적용됩니다.

`Database` 클래스에 의존하여 고양이를 가져오는 `CatService` 클래스를 고려해 봅시다. `CatsService` 클래스를 독립적으로 테스트하기 위해 `Database` 클래스를 모의화할 것입니다.

```typescript
@Injectable()
export class Database {
  getCats(): Promise<Cat[]> { ... }
}

@Injectable()
class CatsService {
  constructor(private database: Database) {}

  async getAllCats(): Promise<Cat[]> {
    return this.database.getCats();
  }
}
```

`CatsService` 클래스에 대한 단위 테스트를 설정해 봅시다.

`@automock/jest` 패키지의 `TestBed`를 사용하여 테스트 환경을 만들겠습니다.

```typescript
import { TestBed } from '@automock/jest';

describe('Cats Service Unit Test', () => {
  let catsService: CatsService;
  let database: jest.Mocked<Database>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(CatsService).compile();

    catsService = unit;
    database = unitRef.get(Database);
  });

  it('should retrieve cats from the database', async () => {
    const mockCats: Cat[] = [{ id: 1, name: 'Catty' }, { id: 2, name: 'Mitzy' }];
    database.getCats.mockResolvedValue(mockCats);

    const cats = await catsService.getAllCats();

    expect(database.getCats).toHaveBeenCalled();
    expect(cats).toEqual(mockCats);
  });
});
```

테스트 설정에서:

1. `TestBed.create(CatsService).compile()`를 사용하여 `CatsService`에 대한 테스트 환경을 만듭니다.
2. `unit`와 `unitRef.get(Database)`를 사용하여 `CatsService`의 실제 인스턴스와 `Database`의 모의 인스턴스를 각각 가져옵니다.
3. `Database` 클래스의 `getCats` 메서드를 모의화하여 미리 정의된 고양이 목록을 반환하도록 합니다.
4. 그런 다음 `CatsService`의 `getAllCats` 메서드를 호출하고 `Database`와 올바르게 상호작용하며 예상대로 고양이를 반환하는지 확인합니다.

**Adding a Logger**

이제 `Logger` 인터페이스를 추가하고 `CatsService` 클래스에 통합해 보겠습니다.

```typescript
@Injectable()
class Logger {
  log(message: string): void { ... }
}

@Injectable()
class CatsService {
  constructor(private database: Database, private logger: Logger) {}

  async getAllCats(): Promise<Cat[]> {
    this.logger.log('Fetching all cats..');
    return this.database.getCats();
  }
}
```

이제 테스트를 설정할 때 `Logger` 의존성도 모의화해야 합니다.

```typescript
beforeAll(() => {
  let logger: jest.Mocked<Logger>;
  const { unit, unitRef } = TestBed.create(CatsService).compile();

  catsService = unit;
  database = unitRef.get(Database);
  logger = unitRef.get(Logger);
});

it('should log a message and retrieve cats from the database', async () => {
  const mockCats: Cat[] = [{ id: 1, name: 'Catty' }, { id: 2, name: 'Mitzy' }];
  database.getCats.mockResolvedValue(mockCats);

  const cats = await catsService.getAllCats();

  expect(logger.log).toHaveBeenCalledWith('Fetching all cats..');
  expect(database.getCats).toHaveBeenCalled();
  expect(cats).toEqual(mockCats);
});
```

**Using `.mock().using()` for Mock Implementation**

Automock는 `.mock().using()` 메서드 체인을 사용하여 모의 구현을 더 명시적으로 지정할 수 있는 방법을 제공합니다. 이를 통해 `TestBed` 설정 시 모의 동작을 직접 정의할 수 있습니다.

이 접근 방식을 사용하도록 테스트 설정을 수정하는 방법은 다음과 같습니다.

```typescript
beforeAll(() => {
  const mockCats: Cat[] = [{ id: 1, name: 'Catty' }, { id: 2, name: 'Mitzy' }];

  const { unit, unitRef } = TestBed.create(CatsService)
    .mock(Database)
    .using({ getCats: async () => mockCats })
    .compile();

  catsService = unit;
  database = unitRef.get(Database);
});
```

이 접근 방식에서는 테스트 바디에서 `getCats` 메서드를 수동으로 모의화할 필요가 없습니다. 대신 `.mock().using()`을 사용하여 테스트 설정에서 직접 모의 동작을 정의합니다.

#### Dependency References and Instance Access

`TestBed`를 활용할 때, `compile()` 메서드는 `unit`과 `unitRef` 두 가지 중요한 프로퍼티를 가진 객체를 반환합니다. 이 프로퍼티들은 각각 테스트 중인 클래스의 인스턴스와 그 의존성 참조에 접근할 수 있게 해줍니다.

`unit` - unit 프로퍼티는 테스트 중인 클래스의 실제 인스턴스를 나타냅니다. 예제에서는 `CatsService` 클래스 인스턴스가 이에 해당합니다. 이를 통해 클래스와 직접 상호 작용하고 테스트 시나리오 중에 메서드를 호출할 수 있습니다.

`unitRef` - unitRef 프로퍼티는 테스트 중인 클래스의 의존성에 대한 참조입니다. 예제에서는 `CatsService`에서 사용하는 `Logger` 의존성을 참조합니다. `unitRef`에 액세스하여 의존성에 대해 자동 생성된 모의 객체를 가져올 수 있습니다. 이를 통해 모의 객체의 메서드를 스터빙하고, 동작을 정의하며, 메서드 호출을 확인할 수 있습니다.

#### Working with Different Providers

프로바이더는 Nest의 가장 중요한 요소 중 하나입니다. 서비스, 레포지토리, 팩토리, 헬퍼 등 많은 기본 Nest 클래스를 프로바이더로 볼 수 있습니다. 프로바이더의 주요 기능은 `Injectable` 의존성의 형태를 취하는 것입니다.

다음 `CatsService`는 하나의 매개변수를 갖는데 이는 `Logger` 인터페이스의 인스턴스입니다.

```typescript
export interface Logger {
  log(message: string): void;
}

@Injectable()
export class CatsService {
  constructor(private logger: Logger) {}
}
```

TypeScript의 Reflection API는 아직 인터페이스 리플렉션을 지원하지 않습니다. Nest는 문자열/심볼 기반 주입 토큰으로 이 문제를 해결합니다([Custom Providers](https://docs.nestjs.com/fundamentals/custom-providers) 참조):

```typescript
export const MyLoggerProvider = {
  provide: 'LOGGER_TOKEN',
  useValue: { ... },
}

@Injectable()
export class CatsService {
  constructor(@Inject('LOGGER_TOKEN') readonly logger: Logger) {}
}
```

Automock도 이 방식을 따르며 `unitRef.get()` 메서드에 실제 클래스 대신 문자열 기반(또는 심볼 기반) 토큰을 제공할 수 있습니다.

```typescript
const { unit, unitRef } = TestBed.create(CatsService).compile();

let loggerMock: jest.Mocked<Logger> = unitRef.get('LOGGER_TOKEN');
```

#### More Information

더 자세한 내용은 [Automock GitHub 레포지토리](https://github.com/automock/automock) 또는 [Automock 웹사이트](https://automock.dev)를 방문하세요.
