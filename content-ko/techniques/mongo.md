### Mongo

Nest는 [MongoDB](https://www.mongodb.com/) 데이터베이스와 통합하기 위한 두 가지 방법을 지원합니다. MongoDB 커넥터가 내장된 [여기](/techniques/database)에 설명된 내장 [TypeORM](https://github.com/typeorm/typeorm) 모듈을 사용하거나, 가장 인기 있는 MongoDB 객체 모델링 도구인 [Mongoose](https://mongoosejs.com)를 사용할 수 있습니다. 이 챕터에서는 전용 `@nestjs/mongoose` 패키지를 사용하여 후자의 방법을 설명할 것입니다.

먼저 [필수 종속성](https://github.com/Automattic/mongoose)을 설치합니다.

```bash
$ npm i @nestjs/mongoose mongoose
```

설치 과정이 완료되면, `MongooseModule`을 루트 `AppModule`로 가져올 수 있습니다.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost/nest')],
})
export class AppModule {}
```

`forRoot()` 메소드는 Mongoose 패키지의 `mongoose.connect()`와 동일한 구성 객체를 허용하며, 이는 [여기](https://mongoosejs.com/docs/connections.html)에 설명되어 있습니다.

#### 모델 주입

Mongoose를 사용하면 모든 것이 [Schema](http://mongoosejs.com/docs/guide.html)에서 파생됩니다. 각 스키마는 MongoDB 컬렉션에 매핑되며 해당 컬렉션 내의 문서 형태를 정의합니다. 스키마는 [모델](https://mongoosejs.com/docs/models.html)을 정의하는 데 사용됩니다. 모델은 기본 MongoDB 데이터베이스에서 문서를 생성하고 읽는 역할을 합니다.

스키마는 NestJS 데코레이터를 사용하거나 Mongoose 자체를 사용하여 수동으로 생성할 수 있습니다. 데코레이터를 사용하여 스키마를 생성하면 상용구 코드를 크게 줄이고 전반적인 코드 가독성을 향상시킬 수 있습니다.

`CatSchema`를 정의해 보겠습니다:

```typescript
@@filename(schemas/cat.schema)
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CatDocument = HydratedDocument<Cat>;

@Schema()
export class Cat {
  @Prop()
  name: string;

  @Prop()
  age: number;

  @Prop()
  breed: string;
}

export const CatSchema = SchemaFactory.createForClass(Cat);
```

> info **팁** `DefinitionsFactory` 클래스(`nestjs/mongoose`에서 가져옴)를 사용하여 원시 스키마 정의를 생성할 수도 있습니다. 이를 통해 제공된 메타데이터를 기반으로 생성된 스키마 정의를 수동으로 수정할 수 있습니다. 이는 데코레이터만으로는 모든 것을 표현하기 어려운 특정 예외적인 경우에 유용합니다.

`@Schema()` 데코레이터는 클래스를 스키마 정의로 표시합니다. 이는 `Cat` 클래스를 동일한 이름의 MongoDB 컬렉션에 매핑하지만 끝에 추가 "s"가 붙습니다. 따라서 최종 몽고 컬렉션 이름은 `cats`가 됩니다. 이 데코레이터는 단일 선택적 인수인 스키마 옵션 객체를 허용합니다. 이는 일반적으로 `mongoose.Schema` 클래스의 생성자에 두 번째 인수로 전달하는 객체라고 생각하면 됩니다(예: `new mongoose.Schema(_, options)`)). 사용 가능한 스키마 옵션에 대해 자세히 알아보려면 [이](https://mongoosejs.com/docs/guide.html#options) 챕터를 참조하십시오.

`@Prop()` 데코레이터는 문서 내 속성을 정의합니다. 예를 들어, 위 스키마 정의에서는 `name`, `age`, `breed`의 세 가지 속성을 정의했습니다. 이러한 속성의 [스키마 타입](https://mongoosejs.com/docs/schematypes.html)은 TypeScript 메타데이터(및 리플렉션) 기능 덕분에 자동으로 추론됩니다. 그러나 타입이 암시적으로 반영될 수 없는 더 복잡한 시나리오(예: 배열 또는 중첩 객체 구조)에서는 다음과 같이 타입을 명시적으로 나타내야 합니다:

```typescript
@Prop([String])
tags: string[];
```

또는 `@Prop()` 데코레이터는 옵션 객체 인수를 허용합니다([사용 가능한 옵션에 대해 더 자세히 읽어보기](https://mongoosejs.com/docs/schematypes.html#schematype-options)). 이를 통해 속성이 필수인지 아닌지, 기본값을 지정하거나, 변경 불가능으로 표시할 수 있습니다. 예를 들어:

```typescript
@Prop({ required: true })
name: string;
```

나중에 채우기 위해 다른 모델과의 관계를 지정하려면 `@Prop()` 데코레이터도 사용할 수 있습니다. 예를 들어, `Cat`이 `owners`라는 다른 컬렉션에 저장된 `Owner`를 가지고 있다면, 속성은 타입과 ref를 가져야 합니다. 예를 들어:

```typescript
import * as mongoose from 'mongoose';
import { Owner } from '../owners/schemas/owner.schema';

// 클래스 정의 내부
@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' })
owner: Owner;
```

여러 명의 소유자가 있는 경우, 속성 구성은 다음과 같아야 합니다:

```typescript
@Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' }] })
owners: Owner[];
```

다른 컬렉션에 대한 참조를 항상 채우지 않으려면 대신 `mongoose.Types.ObjectId`를 타입으로 사용하는 것을 고려하세요:

```typescript
@Prop({ type: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' } })
// 이 필드가 채워진 참조와 혼동되지 않도록 합니다.
owner: mongoose.Types.ObjectId;
```

그런 다음 나중에 선택적으로 채워야 할 때, 올바른 타입을 지정하는 리포지토리 함수를 사용할 수 있습니다:

```typescript
import { Owner } from './schemas/owner.schema';

// 예: 서비스 또는 리포지토리 내부
async findAllPopulated() {
  return this.catModel.find().populate<{ owner: Owner }>("owner");
}
```

> info **팁** 채워야 할 외래 문서가 없는 경우, 타입은 [Mongoose 구성](https://mongoosejs.com/docs/populate.html#doc-not-found)에 따라 `Owner | null`일 수 있습니다. 또는 오류를 발생시킬 수 있으며, 이 경우 타입은 `Owner`가 됩니다.

마지막으로 **원시** 스키마 정의도 데코레이터에 전달될 수 있습니다. 이는 예를 들어, 속성이 클래스로 정의되지 않은 중첩 객체를 나타낼 때 유용합니다. 이를 위해 `@nestjs/mongoose` 패키지의 `raw()` 함수를 다음과 같이 사용합니다:

```typescript
@Prop(raw({
  firstName: { type: String },
  lastName: { type: String }
}))
details: Record<string, any>;
```

또는 **데코레이터를 사용하지 않는 것**을 선호한다면 스키마를 수동으로 정의할 수 있습니다. 예를 들어:

```typescript
export const CatSchema = new mongoose.Schema({
  name: String,
  age: Number,
  breed: String,
});
```

`cat.schema` 파일은 `cats` 디렉토리의 폴더에 있으며, 이곳에 `CatsModule`도 정의합니다. 스키마 파일을 원하는 곳에 저장할 수 있지만, 관련 **도메인** 객체 근처의 해당 모듈 디렉토리에 저장하는 것을 권장합니다.

`CatsModule`을 살펴보겠습니다:

```typescript
@@filename(cats.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';
import { Cat, CatSchema } from './schemas/cat.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }])],
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

`MongooseModule`은 현재 범위에 어떤 모델을 등록해야 하는지 정의하는 것을 포함하여 모듈을 구성하기 위한 `forFeature()` 메소드를 제공합니다. 다른 모듈에서도 모델을 사용하려면 `CatsModule`의 `exports` 섹션에 `MongooseModule`을 추가하고 다른 모듈에서 `CatsModule`을 가져옵니다.

스키마를 등록했으면 `@InjectModel()` 데코레이터를 사용하여 `CatsService`에 `Cat` 모델을 주입할 수 있습니다:

```typescript
@@filename(cats.service)
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cat } from './schemas/cat.schema';
import { CreateCatDto } from './dto/create-cat.dto';

@Injectable()
export class CatsService {
  constructor(@InjectModel(Cat.name) private catModel: Model<Cat>) {}

  async create(createCatDto: CreateCatDto): Promise<Cat> {
    const createdCat = new this.catModel(createCatDto);
    return createdCat.save();
  }

  async findAll(): Promise<Cat[]> {
    return this.catModel.find().exec();
  }
}
@@switch
import { Model } from 'mongoose';
import { Injectable, Dependencies } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Cat } from './schemas/cat.schema';

@Injectable()
@Dependencies(getModelToken(Cat.name))
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

#### 연결

때로는 네이티브 [Mongoose Connection](https://mongoosejs.com/docs/api.html#Connection) 객체에 액세스해야 할 수 있습니다. 예를 들어, 연결 객체에 대해 네이티브 API 호출을 수행하고 싶을 수 있습니다. 다음과 같이 `@InjectConnection()` 데코레이터를 사용하여 Mongoose Connection을 주입할 수 있습니다:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class CatsService {
  constructor(@InjectConnection() private connection: Connection) {}
}
```

#### 세션

Mongoose로 세션을 시작하려면 `mongoose.startSession()`을 직접 호출하는 대신 `@InjectConnection`을 사용하여 데이터베이스 연결을 주입하는 것이 좋습니다. 이 접근 방식은 NestJS 종속성 주입 시스템과의 더 나은 통합을 허용하여 적절한 연결 관리를 보장합니다.

세션을 시작하는 방법의 예는 다음과 같습니다:

```typescript
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class CatsService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async startTransaction() {
    const session = await this.connection.startSession();
    session.startTransaction();
    // 여기에 트랜잭션 로직 작성
  }
}
```

이 예에서는 `@InjectConnection()`을 사용하여 Mongoose 연결을 서비스에 주입합니다. 연결이 주입되면 `connection.startSession()`을 사용하여 새 세션을 시작할 수 있습니다. 이 세션은 데이터베이스 트랜잭션을 관리하는 데 사용하여 여러 쿼리 간에 원자적 작업을 보장할 수 있습니다. 세션을 시작한 후에는 로직에 따라 트랜잭션을 커밋하거나 중단해야 합니다.

#### 다중 데이터베이스

일부 프로젝트에서는 여러 데이터베이스 연결이 필요합니다. 이 모듈로도 이를 달성할 수 있습니다. 여러 연결을 사용하려면 먼저 연결을 생성합니다. 이 경우 연결 이름 지정이 **필수**가 됩니다.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/test', {
      connectionName: 'cats',
    }),
    MongooseModule.forRoot('mongodb://localhost/users', {
      connectionName: 'users',
    }),
  ],
})
export class AppModule {}
```

> warning **주의** 이름 없이 또는 동일한 이름으로 여러 연결을 설정하면 재정의되므로 주의하십시오.

이 설정에서는 `MongooseModule.forFeature()` 함수에 어떤 연결을 사용해야 하는지 알려줘야 합니다.

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }], 'cats'),
  ],
})
export class CatsModule {}
```

주어진 연결에 대한 `Connection`을 주입할 수도 있습니다:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class CatsService {
  constructor(@InjectConnection('cats') private connection: Connection) {}
}
```

주어진 `Connection`을 사용자 정의 프로바이더(예: 팩토리 프로바이더)에 주입하려면 연결 이름을 인수로 전달하여 `getConnectionToken()` 함수를 사용하십시오.

```typescript
{
  provide: CatsService,
  useFactory: (catsConnection: Connection) => {
    return new CatsService(catsConnection);
  },
  inject: [getConnectionToken('cats')],
}
```

명명된 데이터베이스에서 모델을 주입하려는 경우, `@InjectModel()` 데코레이터의 두 번째 매개변수로 연결 이름을 사용할 수 있습니다.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(@InjectModel(Cat.name, 'cats') private catModel: Model<Cat>) {}
}
@@switch
@Injectable()
@Dependencies(getModelToken(Cat.name, 'cats'))
export class CatsService {
  constructor(catModel) {
    this.catModel = catModel;
  }
}
```

#### 훅 (미들웨어)

미들웨어(pre 및 post 훅이라고도 함)는 비동기 함수 실행 중에 제어가 전달되는 함수입니다. 미들웨어는 스키마 수준에서 지정되며 플러그인 작성에 유용합니다([출처](https://mongoosejs.com/docs/middleware.html)). Mongoose에서 모델 컴파일 후에 `pre()` 또는 `post()`를 호출하는 것은 작동하지 않습니다. 모델 등록 **전에** 훅을 등록하려면 `MongooseModule`의 `forFeatureAsync()` 메소드와 팩토리 프로바이더(예: `useFactory`)를 함께 사용하십시오. 이 기술을 사용하면 스키마 객체에 액세스한 후 `pre()` 또는 `post()` 메소드를 사용하여 해당 스키마에 훅을 등록할 수 있습니다. 아래 예시를 참조하십시오:

```typescript
@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Cat.name,
        useFactory: () => {
          const schema = CatsSchema;
          schema.pre('save', function () {
            console.log('Hello from pre save');
          });
          return schema;
        },
      },
    ]),
  ],
})
export class AppModule {}
```

다른 [팩토리 프로바이더](https://nestjs.dokidocs.dev/fundamentals/custom-providers#factory-providers-usefactory)와 마찬가지로, 팩토리 함수는 `async`일 수 있으며 `inject`를 통해 종속성을 주입할 수 있습니다.

```typescript
@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Cat.name,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const schema = CatsSchema;
          schema.pre('save', function() {
            console.log(
              `${configService.get('APP_NAME')}: Hello from pre save`,
            ),
          });
          return schema;
        },
        inject: [ConfigService],
      },
    ]),
  ],
})
export class AppModule {}
```

#### 플러그인

주어진 스키마에 [플러그인](https://mongoosejs.com/docs/plugins.html)을 등록하려면 `forFeatureAsync()` 메소드를 사용하십시오.

```typescript
@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Cat.name,
        useFactory: () => {
          const schema = CatsSchema;
          schema.plugin(require('mongoose-autopopulate'));
          return schema;
        },
      },
    ]),
  ],
})
export class AppModule {}
```

모든 스키마에 플러그인을 한 번에 등록하려면 `Connection` 객체의 `.plugin()` 메소드를 호출하십시오. 모델이 생성되기 전에 연결에 액세스해야 합니다. 이를 위해 `connectionFactory`를 사용하십시오:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/test', {
      connectionFactory: (connection) => {
        connection.plugin(require('mongoose-autopopulate'));
        return connection;
      }
    }),
  ],
})
export class AppModule {}
```

#### 디스크리미네이터

[디스크리미네이터(Discriminators)](https://mongoosejs.com/docs/discriminators.html)는 스키마 상속 메커니즘입니다. 이를 통해 동일한 기본 MongoDB 컬렉션 위에 겹치는 스키마를 가진 여러 모델을 가질 수 있습니다.

단일 컬렉션에서 다른 유형의 이벤트를 추적하고 싶다고 가정해 봅시다. 모든 이벤트는 타임스탬프를 가집니다.

```typescript
@@filename(event.schema)
@Schema({ discriminatorKey: 'kind' })
export class Event {
  @Prop({
    type: String,
    required: true,
    enum: [ClickedLinkEvent.name, SignUpEvent.name],
  })
  kind: string;

  @Prop({ type: Date, required: true })
  time: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
```

> info **팁** Mongoose가 다른 디스크리미네이터 모델을 구분하는 방법은 "디스크리미네이터 키"에 따라 다르며, 기본값은 `__t`입니다. Mongoose는 문서가 어떤 디스크리미네이터 인스턴스인지 추적하는 데 사용하는 `__t`라는 문자열 경로를 스키마에 추가합니다.
> `discriminatorKey` 옵션을 사용하여 구분할 경로를 정의할 수도 있습니다.

`SignedUpEvent` 및 `ClickedLinkEvent` 인스턴스는 일반 이벤트와 동일한 컬렉션에 저장됩니다.

이제 `ClickedLinkEvent` 클래스를 다음과 같이 정의해 보겠습니다:

```typescript
@@filename(click-link-event.schema)
@Schema()
export class ClickedLinkEvent {
  kind: string;
  time: Date;

  @Prop({ type: String, required: true })
  url: string;
}

export const ClickedLinkEventSchema = SchemaFactory.createForClass(ClickedLinkEvent);
```

그리고 `SignUpEvent` 클래스:

```typescript
@@filename(sign-up-event.schema)
@Schema()
export class SignUpEvent {
  kind: string;
  time: Date;

  @Prop({ type: String, required: true })
  user: string;
}

export const SignUpEventSchema = SchemaFactory.createForClass(SignUpEvent);
```

이것이 준비되었으면 `discriminators` 옵션을 사용하여 주어진 스키마에 대해 디스크리미네이터를 등록합니다. 이는 `MongooseModule.forFeature` 및 `MongooseModule.forFeatureAsync` 모두에서 작동합니다:

```typescript
@@filename(event.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Event.name,
        schema: EventSchema,
        discriminators: [
          { name: ClickedLinkEvent.name, schema: ClickedLinkEventSchema },
          { name: SignUpEvent.name, schema: SignUpEventSchema },
        ],
      },
    ]),
  ]
})
export class EventsModule {}
```

#### 테스트

단위 테스트 시에는 일반적으로 데이터베이스 연결을 피하여 테스트 스위트 설정을 단순화하고 실행 속도를 높입니다. 그러나 클래스는 연결 인스턴스에서 가져온 모델에 의존할 수 있습니다. 이러한 클래스를 어떻게 해결할까요? 해결책은 모의(mock) 모델을 만드는 것입니다.

이를 쉽게 하기 위해 `@nestjs/mongoose` 패키지는 토큰 이름을 기반으로 준비된 [주입 토큰](https://nestjs.dokidocs.dev/fundamentals/custom-providers#di-fundamentals)을 반환하는 `getModelToken()` 함수를 노출합니다. 이 토큰을 사용하여 `useClass`, `useValue`, `useFactory`를 포함한 표준 [사용자 정의 프로바이더](/fundamentals/custom-providers) 기술을 사용하여 모의 구현을 쉽게 제공할 수 있습니다. 예를 들어:

```typescript
@Module({
  providers: [
    CatsService,
    {
      provide: getModelToken(Cat.name),
      useValue: catModel,
    },
  ],
})
export class CatsModule {}
```

이 예에서는 모든 소비자가 `@InjectModel()` 데코레이터를 사용하여 `Model<Cat>`을 주입할 때 하드코딩된 `catModel` (객체 인스턴스)이 제공됩니다.

<app-banner-courses></app-banner-courses>

#### 비동기 구성

모듈 옵션을 정적으로 전달하는 대신 비동기적으로 전달해야 할 때 `forRootAsync()` 메소드를 사용하십시오. 대부분의 동적 모듈과 마찬가지로 Nest는 비동기 구성을 처리하기 위한 여러 기술을 제공합니다.

한 가지 기술은 팩토리 함수를 사용하는 것입니다:

```typescript
MongooseModule.forRootAsync({
  useFactory: () => ({
    uri: 'mongodb://localhost/nest',
  }),
});
```

다른 [팩토리 프로바이더](https://nestjs.dokidocs.dev/fundamentals/custom-providers#factory-providers-usefactory)와 마찬가지로, 팩토리 함수는 `async`일 수 있으며 `inject`를 통해 종속성을 주입할 수 있습니다.

```typescript
MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    uri: configService.get<string>('MONGODB_URI'),
  }),
  inject: [ConfigService],
});
```

또는 다음과 같이 팩토리 대신 클래스를 사용하여 `MongooseModule`을 구성할 수 있습니다:

```typescript
MongooseModule.forRootAsync({
  useClass: MongooseConfigService,
});
```

위의 구성은 `MongooseModule` 내부에 `MongooseConfigService`를 인스턴스화하고, 이를 사용하여 필요한 옵션 객체를 생성합니다. 이 예에서 `MongooseConfigService`는 아래와 같이 `MongooseOptionsFactory` 인터페이스를 구현해야 합니다. `MongooseModule`은 제공된 클래스의 인스턴스화된 객체에 대해 `createMongooseOptions()` 메소드를 호출합니다.

```typescript
@Injectable()
export class MongooseConfigService implements MongooseOptionsFactory {
  createMongooseOptions(): MongooseModuleOptions {
    return {
      uri: 'mongodb://localhost/nest',
    };
  }
}
```

`MongooseModule` 내부에 개인 복사본을 만드는 대신 기존 옵션 프로바이더를 재사용하고 싶다면 `useExisting` 구문을 사용하십시오.

```typescript
MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

#### 연결 이벤트

`onConnectionCreate` 구성 옵션을 사용하여 Mongoose [연결 이벤트](https://mongoosejs.com/docs/connections.html#connection-events)를 수신할 수 있습니다. 이를 통해 연결이 설정될 때마다 사용자 정의 로직을 구현할 수 있습니다. 예를 들어, 아래에 시연된 것처럼 `connected`, `open`, `disconnected`, `reconnected`, `disconnecting` 이벤트에 대한 이벤트 리스너를 등록할 수 있습니다:

```typescript
MongooseModule.forRoot('mongodb://localhost/test', {
  onConnectionCreate: (connection: Connection) => {
    connection.on('connected', () => console.log('connected'));
    connection.on('open', () => console.log('open'));
    connection.on('disconnected', () => console.log('disconnected'));
    connection.on('reconnected', () => console.log('reconnected'));
    connection.on('disconnecting', () => console.log('disconnecting'));

    return connection;
  },
}),
```

이 코드 스니펫에서는 `mongodb://localhost/test`의 MongoDB 데이터베이스에 연결을 설정하고 있습니다. `onConnectionCreate` 옵션을 사용하면 연결 상태 모니터링을 위한 특정 이벤트 리스너를 설정할 수 있습니다:

- `connected`: 연결이 성공적으로 설정될 때 트리거됩니다.
- `open`: 연결이 완전히 열리고 작업 준비가 완료될 때 발생합니다.
- `disconnected`: 연결이 끊겼을 때 호출됩니다.
- `reconnected`: 연결이 끊긴 후 다시 설정되었을 때 호출됩니다.
- `disconnecting`: 연결이 닫히는 과정 중에 발생합니다.

`onConnectionCreate` 속성을 `MongooseModule.forRootAsync()`로 생성된 비동기 구성에도 포함시킬 수 있습니다:

```typescript
MongooseModule.forRootAsync({
  useFactory: () => ({
    uri: 'mongodb://localhost/test',
    onConnectionCreate: (connection: Connection) => {
      // 여기에 이벤트 리스너 등록
      return connection;
    },
  }),
}),
```

이는 연결 이벤트 관리에 유연한 방법을 제공하여 연결 상태의 변경 사항을 효과적으로 처리할 수 있도록 합니다.

#### 서브도큐먼트

부모 도큐먼트 안에 서브도큐먼트를 중첩하려면 스키마를 다음과 같이 정의할 수 있습니다:

```typescript
@@filename(name.schema)
@Schema()
export class Name {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;
}

export const NameSchema = SchemaFactory.createForClass(Name);
```

그런 다음 부모 스키마에서 서브도큐먼트를 참조합니다:

```typescript
@@filename(person.schema)
@Schema()
export class Person {
  @Prop(NameSchema)
  name: Name;
}

export const PersonSchema = SchemaFactory.createForClass(Person);

export type PersonDocumentOverride = {
  name: Types.Subdocument<Types.ObjectId> & Name;
};

export type PersonDocument = HydratedDocument<Person, PersonDocumentOverride>;
```

여러 개의 서브도큐먼트를 포함시키려면 서브도큐먼트 배열을 사용할 수 있습니다. 해당 속성의 타입을 그에 맞게 오버라이드하는 것이 중요합니다:

```typescript
@@filename(name.schema)
@Schema()
export class Person {
  @Prop([NameSchema])
  name: Name[];
}

export const PersonSchema = SchemaFactory.createForClass(Person);

export type PersonDocumentOverride = {
  name: Types.DocumentArray<Name>;
};

export type PersonDocument = HydratedDocument<Person, PersonDocumentOverride>;
```

#### 가상(Virtuals)

Mongoose에서 **가상(virtual)**이란 도큐먼트에 존재하지만 MongoDB에 저장되지 않는 속성입니다. 데이터베이스에 저장되지 않지만 액세스할 때마다 동적으로 계산됩니다. 가상은 일반적으로 파생되거나 계산된 값(예: `firstName`과 `lastName`을 연결하여 `fullName` 속성 생성)이나 도큐먼트의 기존 데이터에 의존하는 속성을 생성하는 데 사용됩니다.

```ts
class Person {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Virtual({
    get: function (this: Person) {
      return `${this.firstName} ${this.lastName}`;
    },
  })
  fullName: string;
}
```

> info **팁** `@Virtual()` 데코레이터는 `@nestjs/mongoose` 패키지에서 가져옵니다.

이 예에서 `fullName` 가상은 `firstName`과 `lastName`에서 파생됩니다. 액세스할 때 일반 속성처럼 작동하지만, MongoDB 도큐먼트에 저장되지는 않습니다:

#### 예시

작동하는 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/06-mongoose)에서 사용할 수 있습니다.