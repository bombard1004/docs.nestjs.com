### 데이터베이스

Nest는 데이터베이스에 종속되지 않으므로, 모든 SQL 또는 NoSQL 데이터베이스와 쉽게 통합할 수 있습니다. 선호도에 따라 사용할 수 있는 여러 옵션이 있습니다. 가장 일반적인 수준에서, Nest를 데이터베이스에 연결하는 것은 [Express](https://expressjs.com/en/guide/database-integration.html) 또는 Fastify에서 하는 것과 마찬가지로 해당 데이터베이스에 적합한 Node.js 드라이버를 로드하는 것입니다.

또한 [MikroORM](https://mikro-orm.io/) ([MikroORM 레시피](/recipes/mikroorm) 참조), [Sequelize](https://sequelize.org/) ([Sequelize 통합](/techniques/database#sequelize-integration) 참조), [Knex.js](https://knexjs.org/) ([Knex.js 튜토리얼](https://dev.to/nestjs/build-a-nestjs-module-for-knex-js-or-other-resource-based-libraries-in-5-minutes-12an) 참조), [TypeORM](https://github.com/typeorm/typeorm), [Prisma](https://www.github.com/prisma/prisma) ([Prisma 레시피](/recipes/prisma) 참조)와 같은 모든 범용 Node.js 데이터베이스 통합 **라이브러리** 또는 ORM을 직접 사용하여 더 높은 추상화 수준에서 작업할 수도 있습니다.

편의를 위해 Nest는 `@nestjs/typeorm` 및 `@nestjs/sequelize` 패키지를 통해 TypeORM 및 Sequelize와 즉시(out-of-the-box) 긴밀하게 통합되어 있으며, 이는 현재 챕터에서 다룰 예정입니다. 또한 `@nestjs/mongoose`를 통한 Mongoose와의 통합은 [이 챕터](/techniques/mongodb)에서 다룹니다. 이러한 통합은 모델/리포지토리 주입, 테스트 용이성, 비동기 구성과 같은 추가적인 NestJS 특정 기능을 제공하여 선택한 데이터베이스에 더 쉽게 접근할 수 있도록 합니다.

### TypeORM 통합

SQL 및 NoSQL 데이터베이스와의 통합을 위해 Nest는 `@nestjs/typeorm` 패키지를 제공합니다. [TypeORM](https://github.com/typeorm/typeorm)은 TypeScript에서 사용할 수 있는 가장 성숙한 객체-관계 매퍼(ORM)입니다. TypeScript로 작성되었기 때문에 Nest 프레임워크와 잘 통합됩니다.

사용을 시작하려면 먼저 필요한 종속성을 설치해야 합니다. 이 챕터에서는 인기 있는 관계형 DBMS인 [MySQL](https://www.mysql.com/) 사용법을 시연하지만, TypeORM은 PostgreSQL, Oracle, Microsoft SQL Server, SQLite와 같은 많은 관계형 데이터베이스와 MongoDB와 같은 NoSQL 데이터베이스까지 지원합니다. 이 챕터에서 진행하는 절차는 TypeORM이 지원하는 모든 데이터베이스에 동일하게 적용됩니다. 선택한 데이터베이스에 대한 관련 클라이언트 API 라이브러리만 설치하면 됩니다.

```bash
$ npm install --save @nestjs/typeorm typeorm mysql2
```

설치 과정이 완료되면 `TypeOrmModule`을 루트 `AppModule`로 가져올 수 있습니다.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
```

> warning **경고** `synchronize: true` 설정은 프로덕션 환경에서 사용해서는 안 됩니다. 그렇지 않으면 프로덕션 데이터를 잃을 수 있습니다.

`forRoot()` 메서드는 [TypeORM](https://typeorm.io/data-source-options#common-data-source-options) 패키지의 `DataSource` 생성자가 노출하는 모든 구성 속성을 지원합니다. 또한 아래에 설명된 몇 가지 추가 구성 속성이 있습니다.

<table>
  <tr>
    <td><code>retryAttempts</code></td>
    <td>데이터베이스 연결 재시도 횟수 (기본값: <code>10</code>)</td>
  </tr>
  <tr>
    <td><code>retryDelay</code></td>
    <td>연결 재시도 간 지연 시간 (ms) (기본값: <code>3000</code>)</td>
  </tr>
  <tr>
    <td><code>autoLoadEntities</code></td>
    <td><code>true</code>이면 엔티티가 자동으로 로드됩니다 (기본값: <code>false</code>)</td>
  </tr>
</table>

> info **힌트** 데이터 소스 옵션에 대해 자세히 알아보려면 [여기](https://typeorm.io/data-source-options)를 참조하세요.

이 작업이 완료되면 TypeORM `DataSource` 및 `EntityManager` 객체를 전체 프로젝트에서 주입할 수 있습니다 (어떤 모듈도 가져올 필요 없음). 예를 들어:

```typescript
@@filename(app.module)
import { DataSource } from 'typeorm';

@Module({
  imports: [TypeOrmModule.forRoot(), UsersModule],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
@@switch
import { DataSource } from 'typeorm';

@Dependencies(DataSource)
@Module({
  imports: [TypeOrmModule.forRoot(), UsersModule],
})
export class AppModule {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }
}
```

#### 리포지토리 패턴

[TypeORM](https://github.com/typeorm/typeorm)은 **리포지토리 디자인 패턴**을 지원하므로 각 엔티티는 자체 리포지토리를 가집니다. 이러한 리포지토리는 데이터베이스 데이터 소스에서 얻을 수 있습니다.

예제를 계속하려면 최소한 하나의 엔티티가 필요합니다. `User` 엔티티를 정의해 보겠습니다.

```typescript
@@filename(user.entity)
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: true })
  isActive: boolean;
}
```

> info **힌트** TypeORM 문서에서 엔티티에 대해 더 자세히 알아보려면 [여기](https://typeorm.io/#/entities)를 참조하세요.

`User` 엔티티 파일은 `users` 디렉토리에 있습니다. 이 디렉토리에는 `UsersModule`과 관련된 모든 파일이 포함됩니다. 모델 파일을 어디에 보관할지는 스스로 결정할 수 있지만, 해당 **도메인** 근처인 해당 모듈 디렉토리에 만드는 것을 권장합니다.

`User` 엔티티 사용을 시작하려면 모듈 `forRoot()` 메서드 옵션의 `entities` 배열에 삽입하여 TypeORM에게 알려야 합니다 (정적 글로브 경로를 사용하지 않는 경우):

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [User],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
```

다음으로 `UsersModule`을 살펴보겠습니다.

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

이 모듈은 `forFeature()` 메서드를 사용하여 현재 스코프에 등록할 리포지토리를 정의합니다. 이 설정이 완료되면 `@InjectRepository()` 데코레이터를 사용하여 `UsersService`에 `UsersRepository`를 주입할 수 있습니다.

```typescript
@@filename(users.service)
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';

@Injectable()
@Dependencies(getRepositoryToken(User))
export class UsersService {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }

  findAll() {
    return this.usersRepository.find();
  }

  findOne(id) {
    return this.usersRepository.findOneBy({ id });
  }

  async remove(id) {
    await this.usersRepository.delete(id);
  }
}
```

> warning **주의** 루트 `AppModule`에 `UsersModule`을 가져오는 것을 잊지 마세요.

`TypeOrmModule.forFeature`를 가져온 모듈 외부에서 리포지토리를 사용하려면 해당 모듈이 생성한 프로바이더를 다시 내보내야 합니다.
다음과 같이 전체 모듈을 내보내면 됩니다.

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  exports: [TypeOrmModule]
})
export class UsersModule {}
```

이제 `UserHttpModule`에 `UsersModule`을 가져오면 해당 모듈의 프로바이더에서 `@InjectRepository(User)`를 사용할 수 있습니다.

```typescript
@@filename(users-http.module)
import { Module } from '@nestjs/common';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [UsersModule],
  providers: [UsersService],
  controllers: [UsersController]
})
export class UserHttpModule {}
```

#### 관계

관계는 두 개 이상의 테이블 간에 설정된 연관성입니다. 관계는 각 테이블의 공통 필드를 기반으로 하며, 종종 기본 키와 외래 키를 포함합니다.

관계의 종류는 세 가지입니다.

<table>
  <tr>
    <td><code>One-to-one</code></td>
    <td>주 테이블의 모든 행은 외래 테이블에 하나만 관련된 행을 가집니다. 이 타입의 관계를 정의하려면 <code>@OneToOne()</code> 데코레이터를 사용합니다.</td>
  </tr>
  <tr>
    <td><code>One-to-many / Many-to-one</code></td>
    <td>주 테이블의 모든 행은 외래 테이블에 하나 이상의 관련된 행을 가집니다. 이 타입의 관계를 정의하려면 <code>@OneToMany()</code> 및 <code>@ManyToOne()</code> 데코레이터를 사용합니다.</td>
  </tr>
  <tr>
    <td><code>Many-to-many</code></td>
    <td>주 테이블의 모든 행은 외래 테이블에 많은 관련된 행을 가지며, 외래 테이블의 모든 레코드는 주 테이블에 많은 관련된 행을 가집니다. 이 타입의 관계를 정의하려면 <code>@ManyToMany()</code> 데코레이터를 사용합니다.</td>
  </tr>
</table>

엔티티에 관계를 정의하려면 해당 **데코레이터**를 사용합니다. 예를 들어, 각 `User`가 여러 개의 사진을 가질 수 있다고 정의하려면 `@OneToMany()` 데코레이터를 사용합니다.

```typescript
@@filename(user.entity)
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Photo } from '../photos/photo.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(type => Photo, photo => photo.user)
  photos: Photo[];
}
```

> info **힌트** TypeORM의 관계에 대해 더 자세히 알아보려면 [TypeORM 문서](https://typeorm.io/#/relations)를 방문하세요.

#### 엔티티 자동 로드

데이터 소스 옵션의 `entities` 배열에 엔티티를 수동으로 추가하는 것은 번거로울 수 있습니다. 또한 루트 모듈에서 엔티티를 참조하는 것은 애플리케이션 도메인 경계를 깨뜨리고 다른 부분으로 구현 세부 정보가 유출되는 원인이 됩니다. 이 문제를 해결하기 위해 대안 솔루션이 제공됩니다. 엔티티를 자동으로 로드하려면 구성 객체 ( `forRoot()` 메서드에 전달됨)의 `autoLoadEntities` 속성을 아래와 같이 `true`로 설정합니다.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...
      autoLoadEntities: true,
    }),
  ],
})
export class AppModule {}
```

이 옵션을 지정하면 `forFeature()` 메서드를 통해 등록된 모든 엔티티가 구성 객체의 `entities` 배열에 자동으로 추가됩니다.

> warning **경고** `forFeature()` 메서드를 통해 등록되지 않았지만 엔티티에서만 (관계를 통해) 참조되는 엔티티는 `autoLoadEntities` 설정에 의해 포함되지 않습니다.

#### 엔티티 정의 분리

모델에서 데코레이터를 사용하여 엔티티와 해당 컬럼을 직접 정의할 수 있습니다. 하지만 어떤 사람들은 ["엔티티 스키마"](https://typeorm.io/#/separating-entity-definition)를 사용하여 별도의 파일 내에 엔티티와 해당 컬럼을 정의하는 것을 선호합니다.

```typescript
import { EntitySchema } from 'typeorm';
import { User } from './user.entity';

export const UserSchema = new EntitySchema<User>({
  name: 'User',
  target: User,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  relations: {
    photos: {
      type: 'one-to-many',
      target: 'Photo', // PhotoSchema의 이름
    },
  },
});
```

> warning error **경고** `target` 옵션을 제공하는 경우, `name` 옵션 값은 대상 클래스의 이름과 동일해야 합니다.
> `target`를 제공하지 않는 경우, 어떤 이름이든 사용할 수 있습니다.

Nest는 `EntitySchema` 인스턴스를 엔티티가 예상되는 모든 곳에서 사용할 수 있도록 허용합니다. 예를 들어:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSchema } from './user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserSchema])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

#### TypeORM 트랜잭션

데이터베이스 트랜잭션은 데이터베이스 관리 시스템 내에서 데이터베이스에 대해 수행되는 작업 단위를 상징하며, 다른 트랜잭션과 독립적으로 일관되고 안정적인 방식으로 처리됩니다. 트랜잭션은 일반적으로 데이터베이스의 모든 변경을 나타냅니다 ([자세히 알아보기](https://en.wikipedia.org/wiki/Database_transaction)).

[TypeORM 트랜잭션](https://typeorm.io/#/transactions)을 처리하는 다양한 전략이 있습니다. 트랜잭션을 완벽하게 제어할 수 있는 `QueryRunner` 클래스를 사용하는 것을 권장합니다.

먼저, 정상적인 방식으로 클래스에 `DataSource` 객체를 주입해야 합니다.

```typescript
@Injectable()
export class UsersService {
  constructor(private dataSource: DataSource) {}
}
```

> info **힌트** `DataSource` 클래스는 `typeorm` 패키지에서 가져옵니다.

이제 이 객체를 사용하여 트랜잭션을 생성할 수 있습니다.

```typescript
async createMany(users: User[]) {
  const queryRunner = this.dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    await queryRunner.manager.save(users[0]);
    await queryRunner.manager.save(users[1]);

    await queryRunner.commitTransaction();
  } catch (err) {
    // 오류가 발생했으므로 변경 사항을 롤백합니다.
    await queryRunner.rollbackTransaction();
  } finally {
    // 수동으로 인스턴스화된 queryRunner를 해제해야 합니다.
    await queryRunner.release();
  }
}
```

> info **힌트** `dataSource`는 `QueryRunner`를 생성하는 데만 사용됩니다. 그러나 이 클래스를 테스트하려면 전체 `DataSource` 객체 (여러 메서드를 노출함)를 모킹해야 합니다. 따라서 도우미 팩토리 클래스 (예: `QueryRunnerFactory`)를 사용하고 트랜잭션을 유지하는 데 필요한 제한된 메서드 집합을 가진 인터페이스를 정의하는 것을 권장합니다. 이 기법은 이러한 메서드를 모킹하는 것을 매우 간단하게 만듭니다.

<app-banner-devtools></app-banner-devtools>

대안으로, `DataSource` 객체의 `transaction` 메서드를 사용하여 콜백 스타일 접근 방식을 사용할 수 있습니다 ([자세히 읽기](https://typeorm.io/#/transactions/creating-and-using-transactions)).

```typescript
async createMany(users: User[]) {
  await this.dataSource.transaction(async manager => {
    await manager.save(users[0]);
    await manager.save(users[1]);
  });
}
```

#### 구독자

TypeORM [구독자](https://typeorm.io/#/listeners-and-subscribers/what-is-a-subscriber)를 사용하면 특정 엔티티 이벤트를 수신할 수 있습니다.

```typescript
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { User } from './user.entity';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  beforeInsert(event: InsertEvent<User>) {
    console.log(`BEFORE USER INSERTED: `, event.entity);
  }
}
```

> error **경고** 이벤트 구독자는 [요청 범위](/fundamentals/injection-scopes)일 수 없습니다.

이제 `UserSubscriber` 클래스를 `providers` 배열에 추가합니다.

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserSubscriber } from './user.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, UserSubscriber],
  controllers: [UsersController],
})
export class UsersModule {}
```

> info **힌트** 엔티티 구독자에 대해 자세히 알아보려면 [여기](https://typeorm.io/#/listeners-and-subscribers/what-is-a-subscriber)를 참조하세요.

#### 마이그레이션

[마이그레이션](https://typeorm.io/#/migrations)은 데이터베이스의 기존 데이터를 보존하면서 애플리케이션의 데이터 모델과 동기화되도록 데이터베이스 스키마를 점진적으로 업데이트하는 방법을 제공합니다. 마이그레이션을 생성, 실행 및 롤백하기 위해 TypeORM은 전용 [CLI](https://typeorm.io/#/migrations/creating-a-new-migration)를 제공합니다.

마이그레이션 클래스는 Nest 애플리케이션 소스 코드와 분리되어 있습니다. 해당 라이프사이클은 TypeORM CLI에서 관리됩니다. 따라서 마이그레이션과 함께 종속성 주입 및 기타 Nest 특정 기능을 활용할 수 없습니다. 마이그레이션에 대해 자세히 알아보려면 [TypeORM 문서](https://typeorm.io/#/migrations/creating-a-new-migration)의 가이드를 따르세요.

#### 다중 데이터베이스

일부 프로젝트는 여러 데이터베이스 연결을 필요로 합니다. 이는 이 모듈로도 달성할 수 있습니다. 여러 연결을 작업하려면 먼저 연결을 생성해야 합니다. 이 경우 데이터 소스 이름 지정이 **필수**가 됩니다.

자체 데이터베이스에 저장된 `Album` 엔티티가 있다고 가정합니다.

```typescript
const defaultOptions = {
  type: 'postgres',
  port: 5432,
  username: 'user',
  password: 'password',
  database: 'db',
  synchronize: true,
};

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...defaultOptions,
      host: 'user_db_host',
      entities: [User],
    }),
    TypeOrmModule.forRoot({
      ...defaultOptions,
      name: 'albumsConnection',
      host: 'album_db_host',
      entities: [Album],
    }),
  ],
})
export class AppModule {}
```

> warning **주의** 데이터 소스의 `name`을 설정하지 않으면 이름은 `default`로 설정됩니다. 이름이 없는 여러 연결 또는 이름이 같은 여러 연결은 재정의되므로 만들지 마세요.

> warning **주의** `TypeOrmModule.forRootAsync`를 사용하는 경우, `useFactory` 외부에서도 데이터 소스 이름을 **설정**해야 합니다. 예를 들어:
>
> ```typescript
> TypeOrmModule.forRootAsync({
>   name: 'albumsConnection',
>   useFactory: ...,
>   inject: ...,
> }),
> ```
>
> 자세한 내용은 [이 이슈](https://github.com/nestjs/typeorm/issues/86)를 참조하세요.

이 시점에서 `User` 및 `Album` 엔티티는 자체 데이터 소스에 등록되었습니다. 이 설정에서는 `TypeOrmModule.forFeature()` 메서드와 `@InjectRepository()` 데코레이터에 사용할 데이터 소스를 알려야 합니다. 데이터 소스 이름을 전달하지 않으면 `default` 데이터 소스가 사용됩니다.

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Album], 'albumsConnection'),
  ],
})
export class AppModule {}
```

주어진 데이터 소스에 대한 `DataSource` 또는 `EntityManager`를 주입할 수도 있습니다.

```typescript
@Injectable()
export class AlbumsService {
  constructor(
    @InjectDataSource('albumsConnection')
    private dataSource: DataSource,
    @InjectEntityManager('albumsConnection')
    private entityManager: EntityManager,
  ) {}
}
```

프로바이더에 어떤 `DataSource`든 주입하는 것도 가능합니다.

```typescript
@Module({
  providers: [
    {
      provide: AlbumsService,
      useFactory: (albumsConnection: DataSource) => {
        return new AlbumsService(albumsConnection);
      },
      inject: [getDataSourceToken('albumsConnection')],
    },
  ],
})
export class AlbumsModule {}
```

#### 테스트

애플리케이션의 단위 테스트에 있어서는 일반적으로 데이터베이스 연결을 피하여 테스트 스위트가 독립적이고 실행 과정이 최대한 빠르게 유지되도록 하려고 합니다. 하지만 클래스는 데이터 소스(연결) 인스턴스에서 가져온 리포지토리에 의존할 수 있습니다. 이를 어떻게 처리할까요? 해결책은 모크 리포지토리를 생성하는 것입니다. 이를 위해 [커스텀 프로바이더](/fundamentals/custom-providers)를 설정합니다. 등록된 각 리포지토리는 자동으로 `<EntityName>Repository` 토큰으로 표현되며, 여기서 `EntityName`은 엔티티 클래스의 이름입니다.

`@nestjs/typeorm` 패키지는 주어진 엔티티를 기반으로 준비된 토큰을 반환하는 `getRepositoryToken()` 함수를 노출합니다.

```typescript
@Module({
  providers: [
    UsersService,
    {
      provide: getRepositoryToken(User),
      useValue: mockRepository,
    },
  ],
})
export class UsersModule {}
```

이제 대체 `mockRepository`가 `UsersRepository`로 사용됩니다. 어떤 클래스가 `@InjectRepository()` 데코레이터를 사용하여 `UsersRepository`를 요청하더라도 Nest는 등록된 `mockRepository` 객체를 사용합니다.

#### 비동기 구성

리포지토리 모듈 옵션을 정적으로 전달하는 대신 비동기적으로 전달하고 싶을 수 있습니다. 이 경우 비동기 구성을 다루는 여러 방법을 제공하는 `forRootAsync()` 메서드를 사용합니다.

한 가지 접근 방식은 팩토리 함수를 사용하는 것입니다.

```typescript
TypeOrmModule.forRootAsync({
  useFactory: () => ({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'test',
    entities: [],
    synchronize: true,
  }),
});
```

우리의 팩토리는 다른 [비동기 프로바이더](https://docs.nestjs.com/fundamentals/async-providers)처럼 동작합니다 (예: `async`일 수 있고 `inject`를 통해 종속성을 주입할 수 있습니다).

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.get('HOST'),
    port: +configService.get('PORT'),
    username: configService.get('USERNAME'),
    password: configService.get('PASSWORD'),
    database: configService.get('DATABASE'),
    entities: [],
    synchronize: true,
  }),
  inject: [ConfigService],
});
```

대안으로 `useClass` 구문을 사용할 수 있습니다.

```typescript
TypeOrmModule.forRootAsync({
  useClass: TypeOrmConfigService,
});
```

위 구성은 `TypeOrmModule` 내부에 `TypeOrmConfigService`를 인스턴스화하고 이를 사용하여 `createTypeOrmOptions()`를 호출하여 옵션 객체를 제공합니다. 이는 `TypeOrmConfigService`가 아래와 같이 `TypeOrmOptionsFactory` 인터페이스를 구현해야 함을 의미합니다.

```typescript
@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [],
      synchronize: true,
    };
  }
}
```

`TypeOrmModule` 내부에 `TypeOrmConfigService`가 생성되는 것을 방지하고 다른 모듈에서 가져온 프로바이더를 사용하려면 `useExisting` 구문을 사용할 수 있습니다.

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

이 구성은 `useClass`와 동일하게 작동하지만 중요한 차이점이 있습니다. `TypeOrmModule`은 가져온 모듈을 찾아 기존 `ConfigService`를 재사용하는 대신 새 인스턴스를 생성하지 않습니다.

> info **힌트** `name` 속성이 `useFactory`, `useClass` 또는 `useValue` 속성과 동일한 수준에 정의되어 있는지 확인하십시오. 이렇게 하면 Nest가 적절한 주입 토큰 아래에 데이터 소스를 올바르게 등록할 수 있습니다.

#### 커스텀 데이터 소스 팩토리

`useFactory`, `useClass` 또는 `useExisting`을 사용하는 비동기 구성과 함께, TypeOrmModule이 데이터 소스를 생성하는 대신 자체 TypeORM 데이터 소스를 제공할 수 있도록 `dataSourceFactory` 함수를 선택적으로 지정할 수 있습니다.

`dataSourceFactory`는 `useFactory`, `useClass` 또는 `useExisting`을 사용하여 비동기 구성 중에 구성된 TypeORM `DataSourceOptions`를 수신하고 TypeORM `DataSource`를 해결하는 `Promise`를 반환합니다.

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  // useFactory, useClass, 또는 useExisting을 사용하여
  // DataSourceOptions를 구성합니다.
  useFactory: (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.get('HOST'),
    port: +configService.get('PORT'),
    username: configService.get('USERNAME'),
    password: configService.get('PASSWORD'),
    database: configService.get('DATABASE'),
    entities: [],
    synchronize: true,
  }),
  // dataSource는 구성된 DataSourceOptions를 수신하고
  // Promise<DataSource>를 반환합니다.
  dataSourceFactory: async (options) => {
    const dataSource = await new DataSource(options).initialize();
    return dataSource;
  },
});
```

> info **힌트** `DataSource` 클래스는 `typeorm` 패키지에서 가져옵니다.

#### 예제

작동 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/05-sql-typeorm)에서 확인할 수 있습니다.

<app-banner-enterprise></app-banner-enterprise>

### Sequelize 통합

TypeORM을 사용하는 대안으로 `@nestjs/sequelize` 패키지와 함께 [Sequelize](https://sequelize.org/) ORM을 사용할 수 있습니다. 또한 선언적으로 엔티티를 정의하기 위한 추가 데코레이터 집합을 제공하는 [sequelize-typescript](https://github.com/RobinBuschmann/sequelize-typescript) 패키지를 활용합니다.

사용을 시작하려면 먼저 필요한 종속성을 설치해야 합니다. 이 챕터에서는 인기 있는 관계형 DBMS인 [MySQL](https://www.mysql.com/) 사용법을 시연하지만, Sequelize는 PostgreSQL, MySQL, Microsoft SQL Server, SQLite, MariaDB와 같은 많은 관계형 데이터베이스를 지원합니다. 이 챕터에서 진행하는 절차는 Sequelize가 지원하는 모든 데이터베이스에 동일하게 적용됩니다. 선택한 데이터베이스에 대한 관련 클라이언트 API 라이브러리만 설치하면 됩니다.

```bash
$ npm install --save @nestjs/sequelize sequelize sequelize-typescript mysql2
$ npm install --save-dev @types/sequelize
```

설치 과정이 완료되면 `SequelizeModule`을 루트 `AppModule`로 가져올 수 있습니다.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      models: [],
    }),
  ],
})
export class AppModule {}
```

`forRoot()` 메서드는 Sequelize 생성자가 노출하는 모든 구성 속성을 지원합니다 ([자세히 읽기](https://sequelize.org/docs/v6/getting-started/#connecting-to-a-database)). 또한 아래에 설명된 몇 가지 추가 구성 속성이 있습니다.

<table>
  <tr>
    <td><code>retryAttempts</code></td>
    <td>데이터베이스 연결 재시도 횟수 (기본값: <code>10</code>)</td>
  </tr>
  <tr>
    <td><code>retryDelay</code></td>
    <td>연결 재시도 간 지연 시간 (ms) (기본값: <code>3000</code>)</td>
  </tr>
  <tr>
    <td><code>autoLoadModels</code></td>
    <td><code>true</code>이면 모델이 자동으로 로드됩니다 (기본값: <code>false</code>)</td>
  </tr>
  <tr>
    <td><code>keepConnectionAlive</code></td>
    <td><code>true</code>이면 애플리케이션 종료 시 연결이 닫히지 않습니다 (기본값: <code>false</code>)</td>
  </tr>
  <tr>
    <td><code>synchronize</code></td>
    <td><code>true</code>이면 자동으로 로드된 모델이 동기화됩니다 (기본값: <code>true</code>)</td>
  </tr>
</table>

이 작업이 완료되면 `Sequelize` 객체를 전체 프로젝트에서 주입할 수 있습니다 (어떤 모듈도 가져올 필요 없음). 예를 들어:

```typescript
@@filename(app.service)
import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class AppService {
  constructor(private sequelize: Sequelize) {}
}
@@switch
import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

@Dependencies(Sequelize)
@Injectable()
export class AppService {
  constructor(sequelize) {
    this.sequelize = sequelize;
  }
}
```

#### 모델

Sequelize는 액티브 레코드 패턴을 구현합니다. 이 패턴에서는 모델 클래스를 직접 사용하여 데이터베이스와 상호 작용합니다. 예제를 계속하려면 최소한 하나의 모델이 필요합니다. `User` 모델을 정의해 보겠습니다.

```typescript
@@filename(user.model)
import { Column, Model, Table } from 'sequelize-typescript';

@Table
export class User extends Model {
  @Column
  firstName: string;

  @Column
  lastName: string;

  @Column({ defaultValue: true })
  isActive: boolean;
}
```

> info **힌트** 사용 가능한 데코레이터에 대해 더 자세히 알아보려면 [여기](https://github.com/RobinBuschmann/sequelize-typescript#column)를 참조하세요.

`User` 모델 파일은 `users` 디렉토리에 있습니다. 이 디렉토리에는 `UsersModule`과 관련된 모든 파일이 포함됩니다. 모델 파일을 어디에 보관할지는 스스로 결정할 수 있지만, 해당 **도메인** 근처인 해당 모듈 디렉토리에 만드는 것을 권장합니다.

`User` 모델 사용을 시작하려면 모듈 `forRoot()` 메서드 옵션의 `models` 배열에 삽입하여 Sequelize에게 알려야 합니다.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './users/user.model';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      models: [User],
    }),
  ],
})
export class AppModule {}
```

다음으로 `UsersModule`을 살펴보겠습니다.

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.model';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

이 모듈은 `forFeature()` 메서드를 사용하여 현재 스코프에 등록할 모델을 정의합니다. 이 설정이 완료되면 `@InjectModel()` 데코레이터를 사용하여 `UsersService`에 `UserModel`을 주입할 수 있습니다.

```typescript
@@filename(users.service)
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel.findAll();
  }

  findOne(id: string): Promise<User> {
    return this.userModel.findOne({
      where: {
        id,
      },
    });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await user.destroy();
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { User } from './user.model';

@Injectable()
@Dependencies(getModelToken(User))
export class UsersService {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }

  async findAll() {
    return this.userModel.findAll();
  }

  findOne(id) {
    return this.userModel.findOne({
      where: {
        id,
      },
    });
  }

  async remove(id) {
    const user = await this.findOne(id);
    await user.destroy();
  }
}
```

> warning **주의** 루트 `AppModule`에 `UsersModule`을 가져오는 것을 잊지 마세요.

`SequelizeModule.forFeature`를 가져온 모듈 외부에서 리포지토리를 사용하려면 해당 모듈이 생성한 프로바이더를 다시 내보내야 합니다.
다음과 같이 전체 모듈을 내보내면 됩니다.

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.entity';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  exports: [SequelizeModule]
})
export class UsersModule {}
```

이제 `UserHttpModule`에 `UsersModule`을 가져오면 해당 모듈의 프로바이더에서 `@InjectModel(User)`를 사용할 수 있습니다.

```typescript
@@filename(users-http.module)
import { Module } from '@nestjs/common';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [UsersModule],
  providers: [UsersService],
  controllers: [UsersController]
})
export class UserHttpModule {}
```

#### 관계

관계는 두 개 이상의 테이블 간에 설정된 연관성입니다. 관계는 각 테이블의 공통 필드를 기반으로 하며, 종종 기본 키와 외래 키를 포함합니다.

관계의 종류는 세 가지입니다.

<table>
  <tr>
    <td><code>One-to-one</code></td>
    <td>주 테이블의 모든 행은 외래 테이블에 하나만 관련된 행을 가집니다.</td>
  </tr>
  <tr>
    <td><code>One-to-many / Many-to-one</code></td>
    <td>주 테이블의 모든 행은 외래 테이블에 하나 이상의 관련된 행을 가집니다.</td>
  </tr>
  <tr>
    <td><code>Many-to-many</code></td>
    <td>주 테이블의 모든 행은 외래 테이블에 많은 관련된 행을 가지며, 외래 테이블의 모든 레코드는 주 테이블에 많은 관련된 행을 가집니다.</td>
  </tr>
</table>

모델에 관계를 정의하려면 해당 **데코레이터**를 사용합니다. 예를 들어, 각 `User`가 여러 개의 사진을 가질 수 있다고 정의하려면 `@HasMany()` 데코레이터를 사용합니다.

```typescript
@@filename(user.model)
import { Column, Model, Table, HasMany } from 'sequelize-typescript';
import { Photo } from '../photos/photo.model';

@Table
export class User extends Model {
  @Column
  firstName: string;

  @Column
  lastName: string;

  @Column({ defaultValue: true })
  isActive: boolean;

  @HasMany(() => Photo)
  photos: Photo[];
}
```

> info **힌트** Sequelize의 연관성에 대해 더 자세히 알아보려면 [이 챕터](https://github.com/RobinBuschmann/sequelize-typescript#model-association)를 읽어보세요.

#### 모델 자동 로드

연결 옵션의 `models` 배열에 모델을 수동으로 추가하는 것은 번거로울 수 있습니다. 또한 루트 모듈에서 모델을 참조하는 것은 애플리케이션 도메인 경계를 깨뜨리고 다른 부분으로 구현 세부 정보가 유출되는 원인이 됩니다. 이 문제를 해결하기 위해 구성 객체 (`forRoot()` 메서드에 전달됨)의 `autoLoadModels`와 `synchronize` 속성을 모두 `true`로 설정하여 모델을 자동으로 로드합니다. 아래와 같습니다.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRoot({
      ...
      autoLoadModels: true,
      synchronize: true,
    }),
  ],
})
export class AppModule {}
```

이 옵션을 지정하면 `forFeature()` 메서드를 통해 등록된 모든 모델이 구성 객체의 `models` 배열에 자동으로 추가됩니다.

> warning **경고** `forFeature()` 메서드를 통해 등록되지 않았지만 모델에서만 (연관 관계를 통해) 참조되는 모델은 포함되지 않습니다.

#### Sequelize 트랜잭션

데이터베이스 트랜잭션은 데이터베이스 관리 시스템 내에서 데이터베이스에 대해 수행되는 작업 단위를 상징하며, 다른 트랜잭션과 독립적으로 일관되고 안정적인 방식으로 처리됩니다. 트랜잭션은 일반적으로 데이터베이스의 모든 변경을 나타냅니다 ([자세히 알아보기](https://en.wikipedia.org/wiki/Database_transaction)).

[Sequelize 트랜잭션](https://sequelize.org/docs/v6/other-topics/transactions/)을 처리하는 다양한 전략이 있습니다. 아래는 관리형 트랜잭션(자동 콜백)의 샘플 구현입니다.

먼저, 정상적인 방식으로 클래스에 `Sequelize` 객체를 주입해야 합니다.

```typescript
@Injectable()
export class UsersService {
  constructor(private sequelize: Sequelize) {}
}
```

> info **힌트** `Sequelize` 클래스는 `sequelize-typescript` 패키지에서 가져옵니다.

이제 이 객체를 사용하여 트랜잭션을 생성할 수 있습니다.

```typescript
async createMany() {
  try {
    await this.sequelize.transaction(async t => {
      const transactionHost = { transaction: t };

      await this.userModel.create(
          { firstName: 'Abraham', lastName: 'Lincoln' },
          transactionHost,
      );
      await this.userModel.create(
          { firstName: 'John', lastName: 'Boothe' },
          transactionHost,
      );
    });
  } catch (err) {
    // 트랜잭션이 롤백되었습니다.
    // err는 트랜잭션 콜백으로 반환된 프로미스 체인을 거부한 것입니다.
  }
}
```

> info **힌트** `Sequelize` 인스턴스는 트랜잭션을 시작하는 데만 사용됩니다. 그러나 이 클래스를 테스트하려면 전체 `Sequelize` 객체(여러 메서드를 노출함)를 모킹해야 합니다. 따라서 도우미 팩토리 클래스(예: `TransactionRunner`)를 사용하고 트랜잭션을 유지하는 데 필요한 제한된 메서드 집합을 가진 인터페이스를 정의하는 것을 권장합니다. 이 기법은 이러한 메서드를 모킹하는 것을 매우 간단하게 만듭니다.

#### 마이그레이션

[마이그레이션](https://sequelize.org/docs/v6/other-topics/migrations/)은 데이터베이스의 기존 데이터를 보존하면서 애플리케이션의 데이터 모델과 동기화되도록 데이터베이스 스키마를 점진적으로 업데이트하는 방법을 제공합니다. 마이그레이션을 생성, 실행 및 롤백하기 위해 Sequelize는 전용 [CLI](https://sequelize.org/docs/v6/other-topics/migrations/#installing-the-cli)를 제공합니다.

마이그레이션 클래스는 Nest 애플리케이션 소스 코드와 분리되어 있습니다. 해당 라이프사이클은 Sequelize CLI에서 관리됩니다. 따라서 마이그레이션과 함께 종속성 주입 및 기타 Nest 특정 기능을 활용할 수 없습니다. 마이그레이션에 대해 자세히 알아보려면 [Sequelize 문서](https://sequelize.org/docs/v6/other-topics/migrations/#installing-the-cli)의 가이드를 따르세요.

<app-banner-courses></app-banner-courses>

#### 다중 데이터베이스

일부 프로젝트는 여러 데이터베이스 연결을 필요로 합니다. 이는 이 모듈로도 달성할 수 있습니다. 여러 연결을 작업하려면 먼저 연결을 생성해야 합니다. 이 경우 연결 이름 지정이 **필수**가 됩니다.

자체 데이터베이스에 저장된 `Album` 엔티티가 있다고 가정합니다.

```typescript
const defaultOptions = {
  dialect: 'postgres',
  port: 5432,
  username: 'user',
  password: 'password',
  database: 'db',
  synchronize: true,
};

@Module({
  imports: [
    SequelizeModule.forRoot({
      ...defaultOptions,
      host: 'user_db_host',
      models: [User],
    }),
    SequelizeModule.forRoot({
      ...defaultOptions,
      name: 'albumsConnection',
      host: 'album_db_host',
      models: [Album],
    }),
  ],
})
export class AppModule {}
```

> warning **주의** 연결의 `name`을 설정하지 않으면 이름은 `default`로 설정됩니다. 이름이 없는 여러 연결 또는 이름이 같은 여러 연결은 재정의되므로 만들지 마세요.

이 시점에서 `User` 및 `Album` 모델은 자체 연결에 등록되었습니다. 이 설정에서는 `SequelizeModule.forFeature()` 메서드와 `@InjectModel()` 데코레이터에 사용할 연결을 알려야 합니다. 연결 이름을 전달하지 않으면 `default` 연결이 사용됩니다.

```typescript
@Module({
  imports: [
    SequelizeModule.forFeature([User]),
    SequelizeModule.forFeature([Album], 'albumsConnection'),
  ],
})
export class AppModule {}
```

주어진 연결에 대한 `Sequelize` 인스턴스를 주입할 수도 있습니다.

```typescript
@Injectable()
export class AlbumsService {
  constructor(
    @InjectConnection('albumsConnection')
    private sequelize: Sequelize,
  ) {}
}
```

프로바이더에 어떤 `Sequelize` 인스턴스든 주입하는 것도 가능합니다.

```typescript
@Module({
  providers: [
    {
      provide: AlbumsService,
      useFactory: (albumsSequelize: Sequelize) => {
        return new AlbumsService(albumsSequelize);
      },
      inject: [getDataSourceToken('albumsConnection')],
    },
  ],
})
export class AlbumsModule {}
```

#### 테스트

애플리케이션의 단위 테스트에 있어서는 일반적으로 데이터베이스 연결을 피하여 테스트 스위트가 독립적이고 실행 과정이 최대한 빠르게 유지되도록 하려고 합니다. 하지만 클래스는 연결 인스턴스에서 가져온 모델에 의존할 수 있습니다. 이를 어떻게 처리할까요? 해결책은 모크 모델을 생성하는 것입니다. 이를 위해 [커스텀 프로바이더](/fundamentals/custom-providers)를 설정합니다. 등록된 각 모델은 자동으로 `<ModelName>Model` 토큰으로 표현되며, 여기서 `ModelName`은 모델 클래스의 이름입니다.

`@nestjs/sequelize` 패키지는 주어진 모델을 기반으로 준비된 토큰을 반환하는 `getModelToken()` 함수를 노출합니다.

```typescript
@Module({
  providers: [
    UsersService,
    {
      provide: getModelToken(User),
      useValue: mockModel,
    },
  ],
})
export class UsersModule {}
```

이제 대체 `mockModel`이 `UserModel`로 사용됩니다. 어떤 클래스가 `@InjectModel()` 데코레이터를 사용하여 `UserModel`을 요청하더라도 Nest는 등록된 `mockModel` 객체를 사용합니다.

#### 비동기 구성

`SequelizeModule` 옵션을 정적으로 전달하는 대신 비동기적으로 전달하고 싶을 수 있습니다. 이 경우 비동기 구성을 다루는 여러 방법을 제공하는 `forRootAsync()` 메서드를 사용합니다.

한 가지 접근 방식은 팩토리 함수를 사용하는 것입니다.

```typescript
SequelizeModule.forRootAsync({
  useFactory: () => ({
    dialect: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'test',
    models: [],
  }),
});
```

우리의 팩토리는 다른 [비동기 프로바이더](https://docs.nestjs.com/fundamentals/async-providers)처럼 동작합니다 (예: `async`일 수 있고 `inject`를 통해 종속성을 주입할 수 있습니다).

```typescript
SequelizeModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    dialect: 'mysql',
    host: configService.get('HOST'),
    port: +configService.get('PORT'),
    username: configService.get('USERNAME'),
    password: configService.get('PASSWORD'),
    database: configService.get('DATABASE'),
    models: [],
  }),
  inject: [ConfigService],
});
```

대안으로 `useClass` 구문을 사용할 수 있습니다.

```typescript
SequelizeModule.forRootAsync({
  useClass: SequelizeConfigService,
});
```

위 구성은 `SequelizeModule` 내부에 `SequelizeConfigService`를 인스턴스화하고 이를 사용하여 `createSequelizeOptions()`를 호출하여 옵션 객체를 제공합니다. 이는 `SequelizeConfigService`가 아래와 같이 `SequelizeOptionsFactory` 인터페이스를 구현해야 함을 의미합니다.

```typescript
@Injectable()
class SequelizeConfigService implements SequelizeOptionsFactory {
  createSequelizeOptions(): SequelizeModuleOptions {
    return {
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      models: [],
    };
  }
}
```

`SequelizeModule` 내부에 `SequelizeConfigService`가 생성되는 것을 방지하고 다른 모듈에서 가져온 프로바이더를 사용하려면 `useExisting` 구문을 사용할 수 있습니다.

```typescript
SequelizeModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

이 구성은 `useClass`와 동일하게 작동하지만 중요한 차이점이 있습니다. `SequelizeModule`은 가져온 모듈을 찾아 기존 `ConfigService`를 재사용하는 대신 새 인스턴스를 생성하지 않습니다.

#### 예제

작동 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/07-sequelize)에서 확인할 수 있습니다.