### SQL (TypeORM)

##### 이 장은 TypeScript에만 해당됩니다

> **경고** 이 글에서는 사용자 정의 프로바이더 메커니즘을 사용하여 **TypeORM** 패키지를 기반으로 `DatabaseModule`을 처음부터 만드는 방법을 배웁니다. 결과적으로, 이 해결책은 바로 사용할 수 있고 기본으로 제공되는 전용 `@nestjs/typeorm` 패키지를 사용하여 생략할 수 있는 많은 오버헤드를 포함합니다. 자세한 내용은 [여기](/techniques/sql)를 참조하세요.

[TypeORM](https://github.com/typeorm/typeorm)은 node.js 세계에서 사용할 수 있는 가장 성숙한 객체 관계형 매퍼(ORM)입니다. TypeScript로 작성되었기 때문에 Nest 프레임워크와 매우 잘 작동합니다.

#### 시작하기

이 라이브러리를 사용하기 시작하려면 필요한 모든 의존성을 설치해야 합니다:

```bash
$ npm install --save typeorm mysql2
```

첫 번째 단계는 `typeorm` 패키지에서 임포트된 `new DataSource().initialize()` 클래스를 사용하여 데이터베이스와의 연결을 설정하는 것입니다. `initialize()` 함수는 `Promise`를 반환하므로 [비동기 프로바이더](/fundamentals/async-components)를 생성해야 합니다.

```typescript
@@filename(database.providers)
import { DataSource } from 'typeorm';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'root',
        database: 'test',
        entities: [
            __dirname + '/../**/*.entity{.ts,.js}',
        ],
        synchronize: true,
      });

      return dataSource.initialize();
    },
  },
];
```

> warning **경고** `synchronize: true` 설정은 프로덕션 환경에서 사용해서는 안 됩니다. 그렇지 않으면 프로덕션 데이터가 손실될 수 있습니다.

> info **팁** 모범 사례에 따라 사용자 정의 프로바이더를 `*.providers.ts` 접미사를 갖는 별도의 파일에 선언했습니다.

그런 다음 애플리케이션의 나머지 부분에서 이 프로바이더에 **접근**할 수 있도록 내보내야 합니다.

```typescript
@@filename(database.module)
import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';

@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
```

이제 `@Inject()` 데코레이터를 사용하여 `DATA_SOURCE` 객체를 주입할 수 있습니다. `DATA_SOURCE` 비동기 프로바이더에 의존하는 각 클래스는 `Promise`가 해결될 때까지 기다립니다.

#### 리포지토리 패턴

[TypeORM](https://github.com/typeorm/typeorm)은 리포지토리 디자인 패턴을 지원하므로 각 엔티티는 자체 리포지토리를 가집니다. 이 리포지토리는 데이터베이스 연결로부터 얻을 수 있습니다.

하지만 먼저 적어도 하나의 엔티티가 필요합니다. 공식 문서의 `Photo` 엔티티를 재사용할 것입니다.

```typescript
@@filename(photo.entity)
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  name: string;

  @Column('text')
  description: string;

  @Column()
  filename: string;

  @Column('int')
  views: number;

  @Column()
  isPublished: boolean;
}
```

`Photo` 엔티티는 `photo` 디렉토리에 속합니다. 이 디렉토리는 `PhotoModule`을 나타냅니다. 이제 **리포지토리** 프로바이더를 생성해 봅시다:

```typescript
@@filename(photo.providers)
import { DataSource } from 'typeorm';
import { Photo } from './photo.entity';

export const photoProviders = [
  {
    provide: 'PHOTO_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Photo),
    inject: ['DATA_SOURCE'],
  },
];
```

> warning **경고** 실제 애플리케이션에서는 **매직 스트링**을 피해야 합니다. `PHOTO_REPOSITORY`와 `DATA_SOURCE` 모두 별도의 `constants.ts` 파일에 보관해야 합니다.

이제 `@Inject()` 데코레이터를 사용하여 `Repository<Photo>`를 `PhotoService`에 주입할 수 있습니다:

```typescript
@@filename(photo.service)
import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Photo } from './photo.entity';

@Injectable()
export class PhotoService {
  constructor(
    @Inject('PHOTO_REPOSITORY')
    private photoRepository: Repository<Photo>,
  ) {}

  async findAll(): Promise<Photo[]> {
    return this.photoRepository.find();
  }
}
```

데이터베이스 연결은 **비동기적**이지만 Nest는 이 과정을 최종 사용자에게 완전히 보이지 않게 만듭니다. `PhotoRepository`는 DB 연결을 기다리고, `PhotoService`는 리포지토리가 사용할 준비가 될 때까지 지연됩니다. 각 클래스가 인스턴스화되면 전체 애플리케이션이 시작될 수 있습니다.

최종 `PhotoModule`은 다음과 같습니다:

```typescript
@@filename(photo.module)
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { photoProviders } from './photo.providers';
import { PhotoService } from './photo.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    ...photoProviders,
    PhotoService,
  ],
})
export class PhotoModule {}
```

> info **팁** 루트 `AppModule`에 `PhotoModule`을 임포트하는 것을 잊지 마세요.
