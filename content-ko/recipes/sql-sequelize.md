### SQL (Sequelize)

##### 이 챕터는 TypeScript에만 적용됩니다.

> **경고** 이 문서에서는 커스텀 컴포넌트를 사용하여 **Sequelize** 패키지를 기반으로 `DatabaseModule`을 처음부터 만드는 방법을 배웁니다. 결과적으로 이 기술은 전용으로 제공되는 `@nestjs/sequelize` 패키지를 사용하면 피할 수 있는 많은 오버헤드를 포함하고 있습니다. 자세한 내용은 [여기](/techniques/database#sequelize-integration)를 참조하세요.

[Sequelize](https://github.com/sequelize/sequelize)는 바닐라 JavaScript로 작성된 인기 있는 ORM(Object Relational Mapper)이지만, 기본 Sequelize에 데코레이터 및 기타 추가 기능을 제공하는 [sequelize-typescript](https://github.com/RobinBuschmann/sequelize-typescript) TypeScript 래퍼가 있습니다.

#### 시작하기

이 라이브러리를 사용하기 위해 다음 종속성을 설치해야 합니다.

```bash
$ npm install --save sequelize sequelize-typescript mysql2
$ npm install --save-dev @types/sequelize
```

우리가 해야 할 첫 번째 단계는 생성자에 옵션 객체를 전달하여 **Sequelize** 인스턴스를 만드는 것입니다. 또한, 모든 모델을 추가하고(대안은 `modelPaths` 속성을 사용하는 것입니다) 데이터베이스 테이블을 `sync()`해야 합니다.

```typescript
@@filename(database.providers)
import { Sequelize } from 'sequelize-typescript';
import { Cat } from '../cats/cat.entity';

export const databaseProviders = [
  {
    provide: 'SEQUELIZE',
    useFactory: async () => {
      const sequelize = new Sequelize({
        dialect: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'password',
        database: 'nest',
      });
      sequelize.addModels([Cat]);
      await sequelize.sync();
      return sequelize;
    },
  },
];
```

> info **힌트** 모범 사례에 따라 커스텀 프로바이더는 `*.providers.ts` 접미사를 가지는 별도의 파일에 선언했습니다.

그런 다음 애플리케이션의 나머지 부분에서 이 프로바이더에 **접근**할 수 있도록 내보내야 합니다.

```typescript
import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';

@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
```

이제 `@Inject()` 데코레이터를 사용하여 `Sequelize` 객체를 주입할 수 있습니다. `Sequelize` 비동기 프로바이더에 의존하는 각 클래스는 `Promise`가 해결될 때까지 기다립니다.

#### 모델 주입

[Sequelize](https://github.com/sequelize/sequelize)에서 **Model**은 데이터베이스의 테이블을 정의합니다. 이 클래스의 인스턴스는 데이터베이스 행을 나타냅니다. 먼저 하나 이상의 엔티티가 필요합니다.

```typescript
@@filename(cat.entity)
import { Table, Column, Model } from 'sequelize-typescript';

@Table
export class Cat extends Model {
  @Column
  name: string;

  @Column
  age: number;

  @Column
  breed: string;
}
```

`Cat` 엔티티는 `cats` 디렉토리에 속합니다. 이 디렉토리는 `CatsModule`을 나타냅니다. 이제 **리포지토리(Repository)** 프로바이더를 만들 시간입니다.

```typescript
@@filename(cats.providers)
import { Cat } from './cat.entity';

export const catsProviders = [
  {
    provide: 'CATS_REPOSITORY',
    useValue: Cat,
  },
];
```

> warning **경고** 실제 애플리케이션에서는 **매직 문자열**을 피해야 합니다. `CATS_REPOSITORY`와 `SEQUELIZE`는 모두 별도의 `constants.ts` 파일에 보관해야 합니다.

Sequelize에서는 정적 메소드를 사용하여 데이터를 조작하므로 여기서 **별칭**을 만들었습니다.

이제 `@Inject()` 데코레이터를 사용하여 `CATS_REPOSITORY`를 `CatsService`에 주입할 수 있습니다.

```typescript
@@filename(cats.service)
import { Injectable, Inject } from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto';
import { Cat } from './cat.entity';

@Injectable()
export class CatsService {
  constructor(
    @Inject('CATS_REPOSITORY')
    private catsRepository: typeof Cat
  ) {}

  async findAll(): Promise<Cat[]> {
    return this.catsRepository.findAll<Cat>();
  }
}
```

데이터베이스 연결은 **비동기적**이지만, Nest는 이 프로세스를 최종 사용자에게 완전히 보이지 않게 만듭니다. `CATS_REPOSITORY` 프로바이더는 DB 연결을 기다리고, `CatsService`는 리포지토리를 사용할 준비가 될 때까지 지연됩니다. 각 클래스가 인스턴스화될 때 전체 애플리케이션이 시작될 수 있습니다.

마지막 `CatsModule`은 다음과 같습니다.

```typescript
@@filename(cats.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';
import { catsProviders } from './cats.providers';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CatsController],
  providers: [
    CatsService,
    ...catsProviders,
  ],
})
export class CatsModule {}
```

> info **힌트** 루트 `AppModule`에 `CatsModule`을 임포트하는 것을 잊지 마세요.