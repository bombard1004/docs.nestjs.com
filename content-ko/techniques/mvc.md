### Model-View-Controller

Nest는 기본적으로 내부적으로 [Express](https://github.com/expressjs/express) 라이브러리를 사용합니다. 따라서 Express에서 MVC(Model-View-Controller) 패턴을 사용하는 모든 기법은 Nest에도 적용됩니다.

먼저 [CLI](https://github.com/nestjs/nest-cli) 도구를 사용하여 간단한 Nest 애플리케이션을 스캐폴딩해 보겠습니다.

```bash
$ npm i -g @nestjs/cli
$ nest new project
```

MVC 앱을 만들기 위해서는 HTML 뷰를 렌더링하기 위한 [템플릿 엔진](https://expressjs.com/en/guide/using-template-engines.html)도 필요합니다.

```bash
$ npm install --save hbs
```

요구사항에 맞는 다른 엔진을 사용할 수도 있지만, 여기서는 `hbs` ([Handlebars](https://github.com/pillarjs/hbs#readme)) 엔진을 사용했습니다. 설치 과정이 완료되면 다음 코드를 사용하여 express 인스턴스를 설정해야 합니다.

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

[Express](https://github.com/expressjs/express)에게 `public` 디렉토리는 정적 자산 저장에 사용되고, `views` 디렉토리는 템플릿을 포함하며, HTML 출력을 렌더링하기 위해 `hbs` 템플릿 엔진을 사용해야 한다고 설정했습니다.

#### 템플릿 렌더링

이제 `views` 디렉토리와 그 안에 `index.hbs` 템플릿을 만들어 보겠습니다. 템플릿에서는 컨트롤러에서 전달된 `message`를 출력할 것입니다.

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>App</title>
  </head>
  <body>
    {{ "{{ message }\}" }}
  </body>
</html>
```

다음으로 `app.controller` 파일을 열고 `root()` 메서드를 다음 코드로 바꿉니다.

```typescript
@@filename(app.controller)
import { Get, Controller, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index')
  root() {
    return { message: 'Hello world!' };
  }
}
```

이 코드에서는 `@Render()` 데코레이터에서 사용할 템플릿을 지정하고 있으며, 라우트 핸들러 메서드의 반환 값은 렌더링을 위해 템플릿으로 전달됩니다. 반환 값이 템플릿에서 만든 `message` 플레이스홀더와 일치하는 `message` 속성을 가진 객체라는 점에 주목하세요.

애플리케이션이 실행 중일 때 브라우저를 열고 `http://localhost:3000`으로 이동하세요. `Hello world!` 메시지가 보일 것입니다.

#### 동적 템플릿 렌더링

애플리케이션 로직이 렌더링할 템플릿을 동적으로 결정해야 하는 경우, `@Render()` 데코레이터 대신 `@Res()` 데코레이터를 사용하고 라우트 핸들러에서 뷰 이름을 제공해야 합니다.

> info **힌트** Nest가 `@Res()` 데코레이터를 감지하면 라이브러리별 `response` 객체를 주입합니다. 이 객체를 사용하여 템플릿을 동적으로 렌더링할 수 있습니다. `response` 객체 API에 대해 더 자세히 알아보려면 [여기](https://expressjs.com/en/api.html)를 참조하세요.

```typescript
@@filename(app.controller)
import { Get, Controller, Res, Render } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @Get()
  root(@Res() res: Response) {
    return res.render(
      this.appService.getViewName(),
      { message: 'Hello world!' },
    );
  }
}
```

#### 예제

동작하는 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/15-mvc)에서 확인할 수 있습니다.

#### Fastify

이 [챕터](/techniques/performance)에서 언급했듯이, Nest와 함께 호환되는 어떤 HTTP 프로바이더든 사용할 수 있습니다. 그러한 라이브러리 중 하나는 [Fastify](https://github.com/fastify/fastify)입니다. Fastify로 MVC 애플리케이션을 만들기 위해서는 다음 패키지를 설치해야 합니다.

```bash
$ npm i --save @fastify/static @fastify/view handlebars
```

다음 단계는 플랫폼별 사소한 차이점을 제외하고 Express에서 사용된 과정과 거의 동일합니다. 설치 과정이 완료되면 `main.ts` 파일을 열고 내용을 업데이트합니다.

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.useStaticAssets({
    root: join(__dirname, '..', 'public'),
    prefix: '/public/',
  });
  app.setViewEngine({
    engine: {
      handlebars: require('handlebars'),
    },
    templates: join(__dirname, '..', 'views'),
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());
  app.useStaticAssets({
    root: join(__dirname, '..', 'public'),
    prefix: '/public/',
  });
  app.setViewEngine({
    engine: {
      handlebars: require('handlebars'),
    },
    templates: join(__dirname, '..', 'views'),
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

Fastify API에는 몇 가지 차이점이 있지만, 이 메서드 호출들의 최종 결과는 동일합니다. 주목할 만한 한 가지 차이점은 Fastify를 사용할 때는 `@Render()` 데코레이터에 전달하는 템플릿 이름에 파일 확장자를 포함해야 한다는 것입니다.

설정 방법은 다음과 같습니다.

```typescript
@@filename(app.controller)
import { Get, Controller, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index.hbs')
  root() {
    return { message: 'Hello world!' };
  }
}
```

또는 `@Res()` 데코레이터를 사용하여 응답 객체를 직접 주입하고 렌더링할 뷰를 지정할 수도 있습니다. 아래 코드를 참고하세요.

```typescript
import { Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Get()
root(@Res() res: FastifyReply) {
  return res.view('index.hbs', { title: 'Hello world!' });
}
```

애플리케이션이 실행 중일 때 브라우저를 열고 `http://localhost:3000`으로 이동하세요. `Hello world!` 메시지가 보일 것입니다.

#### 예제

동작하는 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/17-mvc-fastify)에서 확인할 수 있습니다.