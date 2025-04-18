### Prisma

[Prisma](https://www.prisma.io)는 Node.js 및 TypeScript용 [오픈 소스](https://github.com/prisma/prisma) ORM입니다. 일반 SQL을 직접 작성하거나 SQL 쿼리 빌더([knex.js](https://knexjs.org/)와 같은) 또는 ORM([TypeORM](https://typeorm.io/) 및 [Sequelize](https://sequelize.org/)와 같은)과 같은 다른 데이터베이스 접근 도구를 사용하는 것의 **대안**으로 사용됩니다. Prisma는 현재 PostgreSQL, MySQL, SQL Server, SQLite, MongoDB 및 CockroachDB([프리뷰](https://www.prisma.io/docs/reference/database-reference/supported-databases))를 지원합니다.

Prisma는 일반 JavaScript와 함께 사용할 수 있지만, TypeScript를 지향하며 TypeScript 생태계의 다른 ORM의 보장 범위를 넘어서는 수준의 타입 안전성을 제공합니다. Prisma와 TypeORM의 타입 안전성 보장에 대한 심층 비교는 [여기](https://www.prisma.io/docs/concepts/more/comparisons/prisma-and-typeorm#type-safety)에서 확인할 수 있습니다.

> info **참고** Prisma 작동 방식에 대한 빠른 개요를 보려면 [빠른 시작](https://www.prisma.io/docs/getting-started/quickstart)을 따르거나 [문서](https://www.prisma.io/docs/)에서 [개요](https://www.prisma.io/docs/understand-prisma/introduction)를 읽어보세요. 또한 [`prisma-examples`](https://github.com/prisma/prisma-examples/) 저장소에는 [REST](https://github.com/prisma/prisma-examples/tree/b53fad046a6d55f0090ddce9fd17ec3f9b95cab3/orm/nest) 및 [GraphQL](https://github.com/prisma/prisma-examples/tree/b53fad046a6d55f0090ddce9fd17ec3f9b95cab3/orm/nest-graphql)에 대한 바로 실행 가능한 예제도 있습니다.

#### 시작하기

이 레시피에서는 NestJS와 Prisma를 처음부터 시작하는 방법을 배웁니다. 데이터베이스에서 데이터를 읽고 쓸 수 있는 REST API를 가진 샘플 NestJS 애플리케이션을 구축할 것입니다.

이 가이드의 목적을 위해 데이터베이스 서버 설정 오버헤드를 줄이기 위해 [SQLite](https://sqlite.org/) 데이터베이스를 사용할 것입니다. PostgreSQL 또는 MySQL을 사용하더라도 이 가이드를 따라갈 수 있으며, 필요한 곳에서 해당 데이터베이스 사용에 대한 추가 지침을 받을 것입니다.

> info **참고** 이미 기존 프로젝트가 있고 Prisma로 마이그레이션을 고려 중이라면, [기존 프로젝트에 Prisma 추가하기](https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project-typescript-postgres) 가이드를 따를 수 있습니다. TypeORM에서 마이그레이션하는 경우, [TypeORM에서 Prisma로 마이그레이션하기](https://www.prisma.io/docs/guides/migrate-to-prisma/migrate-from-typeorm) 가이드를 읽을 수 있습니다.

#### NestJS 프로젝트 생성하기

시작하려면 NestJS CLI를 설치하고 다음 명령으로 앱 스켈레톤을 생성합니다:

```bash
$ npm install -g @nestjs/cli
$ nest new hello-prisma
```

이 명령으로 생성되는 프로젝트 파일에 대해 자세히 알아보려면 [첫 단계](https://docs.nestjs.com/first-steps) 페이지를 참조하세요. 또한 이제 `npm start`를 실행하여 애플리케이션을 시작할 수 있습니다. `http://localhost:3000/`에서 실행되는 REST API는 현재 `src/app.controller.ts`에 구현된 단일 경로를 제공합니다. 이 가이드 과정에서 _사용자_ 및 _게시물_에 대한 데이터를 저장하고 검색하는 추가 경로를 구현할 것입니다.

#### Prisma 설정하기

먼저 프로젝트에서 Prisma CLI를 개발 종속성으로 설치합니다:

```bash
$ cd hello-prisma
$ npm install prisma --save-dev
```

다음 단계에서는 [Prisma CLI](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-cli)를 활용할 것입니다. 가장 좋은 방법은 `npx` 접두사를 붙여 로컬에서 CLI를 호출하는 것입니다:

```bash
$ npx prisma
```

<details><summary>Yarn을 사용하는 경우 확장</summary>

Yarn을 사용하는 경우 다음과 같이 Prisma CLI를 설치할 수 있습니다:

```bash
$ yarn add prisma --dev
```

설치 후에는 `yarn` 접두사를 붙여 호출할 수 있습니다:

```bash
$ yarn prisma
```

</details>

이제 Prisma CLI의 `init` 명령을 사용하여 초기 Prisma 설정을 생성합니다:

```bash
$ npx prisma init
```

이 명령은 다음 내용으로 새로운 `prisma` 디렉토리를 생성합니다:

- `schema.prisma`: 데이터베이스 연결을 지정하고 데이터베이스 스키마를 포함합니다.
- `.env`: 환경 변수 그룹에 데이터베이스 자격 증명을 저장하는 데 일반적으로 사용되는 [dotenv](https://github.com/motdotla/dotenv) 파일입니다.

#### 데이터베이스 연결 설정

데이터베이스 연결은 `schema.prisma` 파일의 `datasource` 블록에서 구성됩니다. 기본적으로 `postgresql`로 설정되어 있지만, 이 가이드에서는 SQLite 데이터베이스를 사용하므로 `datasource` 블록의 `provider` 필드를 `sqlite`로 조정해야 합니다:

```groovy
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

이제 `.env`를 열고 `DATABASE_URL` 환경 변수를 다음과 같이 조정합니다:

```bash
DATABASE_URL="file:./dev.db"
```

[ConfigModule](https://docs.nestjs.com/techniques/configuration)이 구성되어 있는지 확인하세요. 그렇지 않으면 `.env`에서 `DATABASE_URL` 변수가 선택되지 않습니다.

SQLite 데이터베이스는 단순한 파일입니다. SQLite 데이터베이스를 사용하기 위해 서버가 필요하지 않습니다. 따라서 _호스트_와 _포트_가 있는 연결 URL을 구성하는 대신, 이 경우 `dev.db`라는 로컬 파일을 가리키면 됩니다. 이 파일은 다음 단계에서 생성될 것입니다.

<details><summary>PostgreSQL, MySQL, MsSQL 또는 Azure SQL을 사용하는 경우 확장</summary>

PostgreSQL 및 MySQL을 사용하는 경우, _데이터베이스 서버_를 가리키도록 연결 URL을 구성해야 합니다. 필요한 연결 URL 형식에 대해 자세히 알아보려면 [여기](https://www.prisma.io/docs/reference/database-reference/connection-urls)를 참조하세요.

**PostgreSQL**

PostgreSQL을 사용하는 경우 `schema.prisma` 및 `.env` 파일을 다음과 같이 조정해야 합니다:

**`schema.prisma`**

```groovy
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**`.env`**

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA"
```

모두 대문자로 표기된 자리 표시자를 데이터베이스 자격 증명으로 바꿉니다. `SCHEMA` 자리 표시자에 무엇을 제공해야 할지 확실하지 않은 경우, 대부분 기본값인 `public`입니다:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

PostgreSQL 데이터베이스 설정 방법을 배우고 싶다면, [Heroku에서 무료 PostgreSQL 데이터베이스 설정하기](https://dev.to/prisma/how-to-setup-a-free-postgresql-database-on-heroku-1dc1)에 대한 이 가이드를 따를 수 있습니다.

**MySQL**

MySQL을 사용하는 경우 `schema.prisma` 및 `.env` 파일을 다음과 같이 조정해야 합니다:

**`schema.prisma`**

```groovy
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**`.env`**

```bash
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
```

모두 대문자로 표기된 자리 표시자를 데이터베이스 자격 증명으로 바꿉니다.

**Microsoft SQL Server / Azure SQL Server**

Microsoft SQL Server 또는 Azure SQL Server를 사용하는 경우 `schema.prisma` 및 `.env` 파일을 다음과 같이 조정해야 합니다:

**`schema.prisma`**

```groovy
datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**`.env`**

모두 대문자로 표기된 자리 표시자를 데이터베이스 자격 증명으로 바꿉니다. `encrypt` 자리 표시자에 무엇을 제공해야 할지 확실하지 않은 경우, 대부분 기본값인 `true`입니다:

```bash
DATABASE_URL="sqlserver://HOST:PORT;database=DATABASE;user=USER;password=PASSWORD;encrypt=true"
```

</details>

#### Prisma Migrate로 두 개의 데이터베이스 테이블 생성하기

이 섹션에서는 [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)를 사용하여 데이터베이스에 두 개의 새 테이블을 생성합니다. Prisma Migrate는 Prisma 스키마의 선언적 데이터 모델 정의에 대한 SQL 마이그레이션 파일을 생성합니다. 이 마이그레이션 파일은 기본 데이터베이스의 추가 기능을 구성하거나 시딩과 같은 추가 명령을 포함할 수 있도록 완벽하게 사용자 정의 가능합니다.

`schema.prisma` 파일에 다음 두 모델을 추가합니다:

```groovy
model User {
  id    Int     @default(autoincrement()) @id
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int      @default(autoincrement()) @id
  title     String
  content   String?
  published Boolean? @default(false)
  author    User?    @relation(fields: [authorId], references: [id])
  authorId  Int?
}
```

Prisma 모델이 준비되었으면 SQL 마이그레이션 파일을 생성하고 데이터베이스에 대해 실행할 수 있습니다. 터미널에서 다음 명령을 실행합니다:

```bash
$ npx prisma migrate dev --name init
```

이 `prisma migrate dev` 명령은 SQL 파일을 생성하고 데이터베이스에 직접 실행합니다. 이 경우 기존 `prisma` 디렉토리에 다음 마이그레이션 파일이 생성되었습니다:

```bash
$ tree prisma
prisma
├── dev.db
├── migrations
│   └── 20201207100915_init
│       └── migration.sql
└── schema.prisma
```

<details><summary>생성된 SQL 문 보기 위해 확장</summary>

SQLite 데이터베이스에 다음 테이블이 생성되었습니다:

```sql
-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT
);

-- CreateTable
CREATE TABLE "Post" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN DEFAULT false,
    "authorId" INTEGER,

    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User.email_unique" ON "User"("email");
```

</details>

#### Prisma Client 설치 및 생성

Prisma Client는 Prisma 모델 정의에서 _생성되는_ 타입 안전 데이터베이스 클라이언트입니다. 이러한 접근 방식 덕분에 Prisma Client는 모델에 _맞춤화된_ [CRUD](https://www.prisma.io/docs/concepts/components/prisma-client/crud) 작업을 노출할 수 있습니다.

프로젝트에 Prisma Client를 설치하려면 터미널에서 다음 명령을 실행합니다:

```bash
$ npm install @prisma/client
```

설치 중에 Prisma가 자동으로 `prisma generate` 명령을 실행한다는 점에 유의하세요. 앞으로는 Prisma 모델에 _변경_이 있을 때마다 이 명령을 실행하여 생성된 Prisma Client를 업데이트해야 합니다.

> info **참고** `prisma generate` 명령은 Prisma 스키마를 읽고 `node_modules/@prisma/client` 내부의 생성된 Prisma Client 라이브러리를 업데이트합니다.

#### NestJS 서비스에서 Prisma Client 사용하기

이제 Prisma Client로 데이터베이스 쿼리를 보낼 수 있습니다. Prisma Client로 쿼리를 구축하는 방법에 대해 더 자세히 알아보려면 [API 문서](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/crud)를 확인하세요.

NestJS 애플리케이션을 설정할 때 데이터베이스 쿼리를 위한 Prisma Client API를 서비스 내에서 추상화하고 싶을 것입니다. 시작하려면 `PrismaClient` 인스턴스화 및 데이터베이스 연결을 처리하는 새 `PrismaService`를 만들 수 있습니다.

`src` 디렉토리 내에 `prisma.service.ts`라는 새 파일을 만들고 다음 코드를 추가합니다:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

> info **참고** `onModuleInit`는 선택 사항입니다. 생략하면 Prisma는 데이터베이스에 대한 첫 번째 호출 시 지연 연결됩니다.

다음으로, Prisma 스키마의 `User` 및 `Post` 모델에 대한 데이터베이스 호출을 하는 데 사용할 수 있는 서비스를 작성할 수 있습니다.

여전히 `src` 디렉토리 내에 `user.service.ts`라는 새 파일을 만들고 다음 코드를 추가합니다:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async user(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }
}
```

서비스에 의해 노출되는 메서드가 적절하게 타입화되도록 Prisma Client가 생성한 타입을 사용하는 방법을 주목하세요. 따라서 모델의 타입을 지정하고 추가 인터페이스 또는 DTO 파일을 만드는 상용구를 절약할 수 있습니다.

이제 `Post` 모델에 대해서도 똑같이 합니다.

여전히 `src` 디렉토리 내에 `post.service.ts`라는 새 파일을 만들고 다음 코드를 추가합니다:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Post, Prisma } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async post(
    postWhereUniqueInput: Prisma.PostWhereUniqueInput,
  ): Promise<Post | null> {
    return this.prisma.post.findUnique({
      where: postWhereUniqueInput,
    });
  }

  async posts(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PostWhereUniqueInput;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
  }): Promise<Post[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.post.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createPost(data: Prisma.PostCreateInput): Promise<Post> {
    return this.prisma.post.create({
      data,
    });
  }

  async updatePost(params: {
    where: Prisma.PostWhereUniqueInput;
    data: Prisma.PostUpdateInput;
  }): Promise<Post> {
    const { data, where } = params;
    return this.prisma.post.update({
      data,
      where,
    });
  }

  async deletePost(where: Prisma.PostWhereUniqueInput): Promise<Post> {
    return this.prisma.post.delete({
      where,
    });
  }
}
```

`UsersService`와 `PostsService`는 현재 Prisma Client에서 사용 가능한 CRUD 쿼리를 래핑하고 있습니다. 실제 애플리케이션에서는 서비스가 애플리케이션에 비즈니스 로직을 추가하는 장소이기도 합니다. 예를 들어, `UsersService` 내에 사용자의 비밀번호를 업데이트하는 역할을 하는 `updatePassword` 메서드가 있을 수 있습니다.

새로운 서비스를 앱 모듈에 등록하는 것을 잊지 마세요.

##### 메인 앱 컨트롤러에 REST API 경로 구현하기

마지막으로, 이전 섹션에서 생성한 서비스를 사용하여 앱의 다양한 경로를 구현할 것입니다. 이 가이드의 목적을 위해 모든 경로를 이미 존재하는 `AppController` 클래스에 넣을 것입니다.

`app.controller.ts` 파일의 내용을 다음 코드로 바꿉니다:

```typescript
import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { PostsService } from './post.service';
import { User as UserModel, Post as PostModel } from '@prisma/client';

@Controller()
export class AppController {
  constructor(
    private readonly userService: UsersService,
    private readonly postService: PostsService,
  ) {}

  @Get('post/:id')
  async getPostById(@Param('id') id: string): Promise<PostModel> {
    return this.postService.post({ id: Number(id) });
  }

  @Get('feed')
  async getPublishedPosts(): Promise<PostModel[]> {
    return this.postService.posts({
      where: { published: true },
    });
  }

  @Get('filtered-posts/:searchString')
  async getFilteredPosts(
    @Param('searchString') searchString: string,
  ): Promise<PostModel[]> {
    return this.postService.posts({
      where: {
        OR: [
          {
            title: { contains: searchString },
          },
          {
            content: { contains: searchString },
          },
        ],
      },
    });
  }

  @Post('post')
  async createDraft(
    @Body() postData: { title: string; content?: string; authorEmail: string },
  ): Promise<PostModel> {
    const { title, content, authorEmail } = postData;
    return this.postService.createPost({
      title,
      content,
      author: {
        connect: { email: authorEmail },
      },
    });
  }

  @Post('user')
  async signupUser(
    @Body() userData: { name?: string; email: string },
  ): Promise<UserModel> {
    return this.userService.createUser(userData);
  }

  @Put('publish/:id')
  async publishPost(@Param('id') id: string): Promise<PostModel> {
    return this.postService.updatePost({
      where: { id: Number(id) },
      data: { published: true },
    });
  }

  @Delete('post/:id')
  async deletePost(@Param('id') id: string): Promise<PostModel> {
    return this.postService.deletePost({ id: Number(id) });
  }
}
```

이 컨트롤러는 다음 경로를 구현합니다:

###### `GET`

- `/post/:id`: `id`로 단일 게시물을 가져옵니다.
- `/feed`: 게시된 모든 게시물을 가져옵니다.
- `/filter-posts/:searchString`: `title` 또는 `content`로 게시물을 필터링합니다.

###### `POST`

- `/post`: 새 게시물을 생성합니다.
  - Body:
    - `title: String` (필수): 게시물 제목
    - `content: String` (선택 사항): 게시물 내용
    - `authorEmail: String` (필수): 게시물을 생성하는 사용자의 이메일
- `/user`: 새 사용자를 생성합니다.
  - Body:
    - `email: String` (필수): 사용자의 이메일 주소
    - `name: String` (선택 사항): 사용자 이름

###### `PUT`

- `/publish/:id`: `id`로 게시물을 게시합니다.

###### `DELETE`

- `/post/:id`: `id`로 게시물을 삭제합니다.

#### 요약

이 레시피에서는 NestJS와 함께 Prisma를 사용하여 REST API를 구현하는 방법을 배웠습니다. API의 경로를 구현하는 컨트롤러는 `PrismaService`를 호출하고, `PrismaService`는 Prisma Client를 사용하여 데이터베이스에 쿼리를 전송하여 수신 요청의 데이터 요구 사항을 충족합니다.

NestJS와 함께 Prisma를 사용하는 방법에 대해 더 자세히 알고 싶다면 다음 자료를 확인하십시오:

- [NestJS & Prisma](https://www.prisma.io/nestjs)
- [REST 및 GraphQL에 대한 바로 실행 가능한 예제 프로젝트](https://github.com/prisma/prisma-examples/)
- [프로덕션 준비 스타터 키트](https://github.com/notiz-dev/nestjs-prisma-starter#instructions)
- [영상: NestJS와 Prisma를 사용하여 데이터베이스 접근하기 (5분)](https://www.youtube.com/watch?v=UlVJ340UEuk&ab_channel=Prisma) 작성자: [Marc Stammerjohann](https://github.com/marcjulian)