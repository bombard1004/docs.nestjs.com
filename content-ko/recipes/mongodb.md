### MongoDB (Mongoose)

> **경고** 이 글에서는 **Mongoose** 패키지를 기반으로 `DatabaseModule`을 처음부터 커스텀 컴포넌트를 사용하여 만드는 방법을 배웁니다. 결과적으로 이 솔루션에는 바로 사용 가능하고 별도의 설정 없이 제공되는 `@nestjs/mongoose` 전용 패키지를 사용하면 생략할 수 있는 많은 오버헤드가 포함되어 있습니다. 자세한 내용은 [여기](/techniques/mongodb)를 참조하세요.

[Mongoose](https://mongoosejs.com)는 가장 인기 있는 [MongoDB](https://www.mongodb.org/) 객체 모델링 도구입니다.

#### 시작하기

이 라이브러리로 모험을 시작하려면 필요한 모든 종속성을 설치해야 합니다.

```typescript
$ npm install --save mongoose
```

가장 먼저 해야 할 일은 `connect()` 함수를 사용하여 데이터베이스 연결을 설정하는 것입니다. `connect()` 함수는 `Promise`를 반환하므로 [비동기 프로바이더](/fundamentals/async-components)를 생성해야 합니다.

```typescript
@@filename(database.providers)
import * as mongoose from 'mongoose';

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: (): Promise<typeof mongoose> =>
      mongoose.connect('mongodb://localhost/nest'),
  },
];
@@switch
import * as mongoose from 'mongoose';

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: () => mongoose.connect('mongodb://localhost/nest'),
  },
];
```

> info **힌트** 모범 사례에 따라, 커스텀 프로바이더는 `*.providers.ts` 접미사가 붙은 분리된 파일에 선언했습니다.

그런 다음, 이 프로바이더를 애플리케이션의 나머지 부분에서 **접근 가능**하도록 내보내야 합니다.

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

이제 `@Inject()` 데코레이터를 사용하여 `Connection` 객체를 주입할 수 있습니다. `Connection` 비동기 프로바이더에 의존하는 각 클래스는 `Promise`가 해결될 때까지 기다릴 것입니다.

#### 모델 주입

Mongoose에서는 모든 것이 [스키마(Schema)](https://mongoosejs.com/docs/guide.html)에서 파생됩니다. `CatSchema`를 정의해 봅시다.

```typescript
@@filename(schemas/cat.schema)
import * as mongoose from 'mongoose';

export const CatSchema = new mongoose.Schema({
  name: String,
  age: Number,
  breed: String,
});
```

`CatsSchema`는 `cats` 디렉터리에 속합니다. 이 디렉터리는 `CatsModule`을 나타냅니다.

이제 **모델** 프로바이더를 만들 시간입니다.

```typescript
@@filename(cats.providers)
import { Connection } from 'mongoose';
import { CatSchema } from './schemas/cat.schema';

export const catsProviders = [
  {
    provide: 'CAT_MODEL',
    useFactory: (connection: Connection) => connection.model('Cat', CatSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
@@switch
import { CatSchema } from './schemas/cat.schema';

export const catsProviders = [
  {
    provide: 'CAT_MODEL',
    useFactory: (connection) => connection.model('Cat', CatSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
```

> warning **경고** 실제 애플리케이션에서는 **매직 스트링** 사용을 피해야 합니다. `CAT_MODEL`과 `DATABASE_CONNECTION` 모두 분리된 `constants.ts` 파일에 보관해야 합니다.

이제 `@Inject()` 데코레이터를 사용하여 `CAT_MODEL`을 `CatsService`에 주입할 수 있습니다.

```typescript
@@filename(cats.service)
import { Model } from 'mongoose';
import { Injectable, Inject } from '@nestjs/common';
import { Cat } from './interfaces/cat.interface';
import { CreateCatDto } from './dto/create-cat.dto';

@Injectable()
export class CatsService {
  constructor(
    @Inject('CAT_MODEL')
    private catModel: Model<Cat>,
  ) {}

  async create(createCatDto: CreateCatDto): Promise<Cat> {
    const createdCat = new this.catModel(createCatDto);
    return createdCat.save();
  }

  async findAll(): Promise<Cat[]> {
    return this.catModel.find().exec();
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';

@Injectable()
@Dependencies('CAT_MODEL')
export class CatsService {
  constructor(catModel) {
    this.catModel = catModel;
  }

  async create(createCatDto) {
    const createdCat = new this.catModel(createCatDto);
    return createdCat.save();
  }

  async findAll() {
    return this.catModel.find().exec();
  }
}
```

위 예제에서는 `Cat` 인터페이스를 사용했습니다. 이 인터페이스는 mongoose 패키지의 `Document`를 확장합니다.

```typescript
import { Document } from 'mongoose';

export interface Cat extends Document {
  readonly name: string;
  readonly age: number;
  readonly breed: string;
}
```

데이터베이스 연결은 **비동기적**이지만, Nest는 이 프로세스를 최종 사용자에게 완전히 보이지 않게 만듭니다. `CatModel` 클래스는 DB 연결을 기다리고, `CatsService`는 모델이 사용할 준비가 될 때까지 지연됩니다. 각 클래스가 인스턴스화되면 전체 애플리케이션이 시작될 수 있습니다.

다음은 최종 `CatsModule`입니다.

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

> info **힌트** `CatsModule`을 루트 `AppModule`로 임포트하는 것을 잊지 마세요.

#### 예제

실행 가능한 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/14-mongoose-base)에서 확인할 수 있습니다.