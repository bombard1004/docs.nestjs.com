### 프로바이더

프로바이더는 Nest의 핵심 개념입니다. 서비스, 리포지토리, 팩토리, 헬퍼 등 많은 기본 Nest 클래스는 프로바이더로 취급될 수 있습니다. 프로바이더의 핵심 아이디어는 의존성으로 **주입**될 수 있다는 것입니다. 이를 통해 객체는 서로 다양한 관계를 형성할 수 있습니다. 이러한 객체를 "연결"하는 책임은 대부분 Nest 런타임 시스템에 의해 처리됩니다.

<figure><img class="illustrative-image" src="/assets/Components_1.png" /></figure>

이전 챕터에서 간단한 `CatsController`를 만들었습니다. 컨트롤러는 HTTP 요청을 처리하고 더 복잡한 작업은 **프로바이더**에게 위임해야 합니다. 프로바이더는 NestJS 모듈에서 `providers`로 선언된 일반 JavaScript 클래스입니다. 자세한 내용은 "모듈" 챕터를 참조하세요.

> info **팁** Nest를 사용하면 객체 지향 방식으로 의존성을 설계하고 구성할 수 있으므로 [SOLID 원칙](https://en.wikipedia.org/wiki/SOLID)을 따르는 것을 강력히 권장합니다.

#### 서비스

간단한 `CatsService`를 만드는 것으로 시작해 보겠습니다. 이 서비스는 데이터 저장 및 검색을 처리하며, `CatsController`에서 사용될 것입니다. 애플리케이션의 로직을 관리하는 역할을 하기 때문에 프로바이더로 정의하기에 이상적인 후보입니다.

```typescript
@@filename(cats.service)
import { Injectable } from '@nestjs/common';
import { Cat } from './interfaces/cat.interface';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  create(cat: Cat) {
    this.cats.push(cat);
  }

  findAll(): Cat[] {
    return this.cats;
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class CatsService {
  constructor() {
    this.cats = [];
  }

  create(cat) {
    this.cats.push(cat);
  }

  findAll() {
    return this.cats;
  }
}
```

> info **팁** CLI를 사용하여 서비스를 생성하려면 단순히 `$ nest g service cats` 명령어를 실행하면 됩니다.

`CatsService`는 하나의 속성과 두 개의 메서드를 가진 기본 클래스입니다. 여기서 핵심적으로 추가된 것은 `@Injectable()` 데코레이터입니다. 이 데코레이터는 클래스에 메타데이터를 추가하여 `CatsService`가 Nest [IoC](https://en.wikipedia.org/wiki/Inversion_of_control) 컨테이너에 의해 관리될 수 있는 클래스임을 나타냅니다.

또한, 이 예제에서는 `Cat` 인터페이스를 사용하는데, 이 인터페이스는 아마 다음과 같이 생겼을 것입니다:

```typescript
@@filename(interfaces/cat.interface)
export interface Cat {
  name: string;
  age: number;
  breed: string;
}
```

이제 고양이를 검색하는 서비스 클래스를 만들었으니, `CatsController` 내부에서 사용해 봅시다:

```typescript
@@filename(cats.controller)
import { Controller, Get, Post, Body } from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto';
import { CatsService } from './cats.service';
import { Cat } from './interfaces/cat.interface';

@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @Post()
  async create(@Body() createCatDto: CreateCatDto) {
    this.catsService.create(createCatDto);
  }

  @Get()
  async findAll(): Promise<Cat[]> {
    return this.catsService.findAll();
  }
}
@@switch
import { Controller, Get, Post, Body, Bind, Dependencies } from '@nestjs/common';
import { CatsService } from './cats.service';

@Controller('cats')
@Dependencies(CatsService)
export class CatsController {
  constructor(catsService) {
    this.catsService = catsService;
  }

  @Post()
  @Bind(Body())
  async create(createCatDto) {
    this.catsService.create(createCatDto);
  }

  @Get()
  async findAll() {
    return this.catsService.findAll();
  }
}
```

`CatsService`는 클래스 생성자를 통해 **주입**됩니다. `private` 키워드의 사용에 주목하세요. 이 축약형은 `catsService` 멤버를 같은 줄에서 선언하고 초기화하는 것을 동시에 가능하게 하여 과정을 간소화합니다.

#### 의존성 주입

Nest는 **의존성 주입**이라고 알려진 강력한 디자인 패턴을 중심으로 구축됩니다. 공식 [Angular 문서](https://angular.dev/guide/di)에서 이 개념에 대한 훌륭한 글을 읽어보는 것을 강력히 권장합니다.

Nest에서는 TypeScript의 기능 덕분에 의존성을 타입에 기반하여 해결하므로 의존성을 관리하기가 매우 쉽습니다. 아래 예제에서 Nest는 `CatsService`의 인스턴스를 생성하고 반환함으로써 `catsService`를 해결합니다 (또는 싱글톤의 경우 이미 다른 곳에서 요청되었다면 기존 인스턴스를 반환합니다). 이 의존성은 컨트롤러의 생성자로 주입됩니다 (또는 지정된 속성에 할당됩니다).

```typescript
constructor(private catsService: CatsService) {}
```

#### 스코프

프로바이더는 일반적으로 애플리케이션 생명주기와 일치하는 생명주기("스코프")를 가집니다. 애플리케이션이 부트스트랩될 때, 각 의존성은 해결되어야 하며, 이는 모든 프로바이더가 인스턴스화된다는 것을 의미합니다. 마찬가지로, 애플리케이션이 종료될 때 모든 프로바이더는 파괴됩니다. 하지만 프로바이더를 **요청-스코프**로 만들 수도 있습니다. 이는 해당 프로바이더의 생명주기가 애플리케이션의 생명주기가 아닌 특정 요청에 연결된다는 것을 의미합니다. 이러한 기법에 대해 더 자세히 알고 싶으면 [인젝션 스코프](/fundamentals/injection-scopes) 챕터를 참조하세요.

<app-banner-courses></app-banner-courses>

#### 커스텀 프로바이더

Nest는 프로바이더 간의 관계를 관리하는 내장된 제어 역전("IoC") 컨테이너를 제공합니다. 이 기능은 의존성 주입의 기초이지만, 사실 지금까지 다룬 것보다 훨씬 강력합니다. 프로바이더를 정의하는 방법에는 여러 가지가 있습니다: 일반 값, 클래스, 비동기 또는 동기 팩토리를 사용할 수 있습니다. 프로바이더 정의에 대한 더 많은 예제는 [의존성 주입](/fundamentals/dependency-injection) 챕터를 참조하세요.

#### 선택적 프로바이더

때로는 항상 해결될 필요가 없는 의존성을 가질 수 있습니다. 예를 들어, 클래스가 **설정 객체**에 의존하지만, 제공되지 않으면 기본값이 사용되어야 하는 경우가 있습니다. 이러한 경우, 해당 의존성은 선택적인 것으로 간주되며 설정 프로바이더가 없더라도 오류가 발생하지 않아야 합니다.

프로바이더를 선택적으로 표시하려면 생성자의 시그니처에 `@Optional()` 데코레이터를 사용하세요.

```typescript
import { Injectable, Optional, Inject } from '@nestjs/common';

@Injectable()
export class HttpService<T> {
  constructor(@Optional() @Inject('HTTP_OPTIONS') private httpClient: T) {}
}
```

위 예제에서는 커스텀 프로바이더를 사용하고 있으며, 따라서 `HTTP_OPTIONS` 커스텀 **토큰**을 포함하고 있습니다. 이전 예제에서는 생성자의 클래스를 통해 의존성을 나타내는 생성자 기반 주입을 보여주었습니다. 커스텀 프로바이더와 관련 토큰의 작동 방식에 대한 자세한 내용은 [커스텀 프로바이더](/fundamentals/custom-providers) 챕터를 참조하세요.

#### 속성 기반 주입

지금까지 사용한 기법은 생성자 기반 주입이라고 하며, 프로바이더가 생성자 메서드를 통해 주입됩니다. 특정 상황에서는 **속성 기반 주입**이 유용할 수 있습니다. 예를 들어, 최상위 클래스가 하나 이상의 프로바이더에 의존하는 경우, 서브클래스에서 `super()`를 통해 이들을 모두 전달하는 것은 번거로울 수 있습니다. 이를 피하기 위해 속성 레벨에서 바로 `@Inject()` 데코레이터를 사용할 수 있습니다.

```typescript
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class HttpService<T> {
  @Inject('HTTP_OPTIONS')
  private readonly httpClient: T;
}
```

> warning **경고** 클래스가 다른 클래스를 확장하지 않는다면, 일반적으로 **생성자 기반** 주입을 사용하는 것이 더 좋습니다. 생성자는 어떤 의존성이 필요한지 명확하게 지정하여 가시성을 높이고, `@Inject`로 주석된 클래스 속성에 비해 코드를 이해하기 쉽게 만듭니다.

#### 프로바이더 등록

이제 프로바이더(`CatsService`)와 소비자(`CatsController`)를 정의했으므로, Nest가 주입을 처리할 수 있도록 서비스를 등록해야 합니다. 이는 모듈 파일(`app.module.ts`)을 편집하고 `@Module()` 데코레이터의 `providers` 배열에 서비스를 추가함으로써 수행됩니다.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats/cats.controller';
import { CatsService } from './cats/cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class AppModule {}
```

이제 Nest는 `CatsController` 클래스의 의존성을 해결할 수 있게 됩니다.

이 시점에서 우리 디렉토리 구조는 다음과 같이 보일 것입니다:

<div class="file-tree">
<div class="item">src</div>
<div class="children">
<div class="item">cats</div>
<div class="children">
<div class="item">dto</div>
<div class="children">
<div class="item">create-cat.dto.ts</div>
</div>
<div class="item">interfaces</div>
<div class="children">
<div class="item">cat.interface.ts</div>
</div>
<div class="item">cats.controller.ts</div>
<div class="item">cats.service.ts</div>
</div>
<div class="item">app.module.ts</div>
<div class="item">main.ts</div>
</div>
</div>

#### 수동 인스턴스화

지금까지 Nest가 의존성 해결의 대부분의 세부 사항을 어떻게 자동으로 처리하는지 살펴보았습니다. 하지만 어떤 경우에는 내장된 의존성 주입 시스템에서 벗어나 프로바이더를 수동으로 검색하거나 인스턴스화해야 할 수 있습니다. 이러한 두 가지 기법을 아래에서 간략하게 설명합니다.

- 기존 인스턴스를 검색하거나 프로바이더를 동적으로 인스턴스화하려면 [모듈 레퍼런스](https://nestjs.dokidocs.dev/fundamentals/module-ref)를 사용할 수 있습니다.
- `bootstrap()` 함수 내에서 프로바이더를 얻으려면 (예: 스탠드얼론 애플리케이션의 경우 또는 부트스트래핑 중에 설정 서비스를 사용하기 위해), [스탠드얼론 애플리케이션](https://nestjs.dokidocs.dev/standalone-applications)을 확인해 보세요.
