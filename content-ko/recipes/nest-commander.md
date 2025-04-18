### Nest Commander

[독립 실행형 애플리케이션](/standalone-applications) 문서에 이어 일반적인 Nest 애플리케이션과 유사한 구조로 명령줄 애플리케이션을 작성하기 위한 [nest-commander](https://jmcdo29.github.io/nest-commander) 패키지도 있습니다.

> info **info** `nest-commander`는 타사 패키지이며 NestJS 코어 팀 전체에서 관리하는 것이 아닙니다. 라이브러리에서 발견된 문제는 [해당 리포지토리](https://github.com/jmcdo29/nest-commander/issues/new/choose)에 보고해주세요.

#### 설치

다른 패키지와 마찬가지로 사용하기 전에 설치해야 합니다.

```bash
$ npm i nest-commander
```

#### 커맨드 파일

`nest-commander`는 클래스용 `@Command()` 데코레이터와 해당 클래스의 메서드용 `@Option()` 데코레이터를 통해 [데코레이터](https://www.typescriptlang.org/docs/handbook/decorators.html)를 사용하여 새로운 명령줄 애플리케이션을 쉽게 작성할 수 있도록 합니다. 모든 커맨드 파일은 `CommandRunner` 추상 클래스를 구현하고 `@Command()` 데코레이터로 장식되어야 합니다.

모든 커맨드는 Nest에 의해 `@Injectable()`로 간주되므로 일반적인 의존성 주입은 예상대로 작동합니다. 유일하게 주의해야 할 점은 각 커맨드가 구현해야 하는 추상 클래스 `CommandRunner`입니다. `CommandRunner` 추상 클래스는 모든 커맨드에 `Promise<void>`를 반환하고 매개변수 `string[], Record<string, any>`를 받는 `run` 메서드가 있음을 보장합니다. `run` 커맨드는 모든 로직을 시작할 수 있는 곳이며, 옵션 플래그와 일치하지 않는 모든 매개변수를 배열로 전달하여 여러 매개변수를 실제로 사용하려는 경우에 대비합니다. 옵션 `Record<string, any>`의 경우, 이러한 속성의 이름은 `@Option()` 데코레이터에 지정된 `name` 속성과 일치하며, 그 값은 옵션 핸들러의 반환 값과 일치합니다. 더 나은 타입 안정성을 원하시면 옵션에 대한 인터페이스를 생성하셔도 좋습니다.

#### 커맨드 실행

NestJS 애플리케이션에서 `NestFactory`를 사용하여 서버를 생성하고 `listen`을 사용하여 실행하는 것과 유사하게, `nest-commander` 패키지는 서버를 실행하는 간단한 API를 제공합니다. `CommandFactory`를 임포트하고 `static` 메서드 `run`을 사용하여 애플리케이션의 루트 모듈을 전달합니다. 이는 아래와 같을 것입니다.

```ts
import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';

async function bootstrap() {
  await CommandFactory.run(AppModule);
}

bootstrap();
```

기본적으로 `CommandFactory`를 사용할 때는 Nest의 로거가 비활성화됩니다. 하지만 `run` 함수의 두 번째 인수로 제공하는 것이 가능합니다. 커스텀 NestJS 로거를 제공하거나 유지하려는 로그 레벨 배열을 제공할 수 있습니다. Nest의 오류 로그만 출력하려는 경우 최소한 `['error']`를 제공하는 것이 유용할 수 있습니다.

```ts
import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';
import { LogService } './log.service';

async function bootstrap() {
  await CommandFactory.run(AppModule, new LogService());

  // or, if you only want to print Nest's warnings and errors
  await CommandFactory.run(AppModule, ['warn', 'error']);
}

bootstrap();
```

이것이 전부입니다. 내부적으로 `CommandFactory`는 `NestFactory`를 호출하고 필요할 때 `app.close()`를 호출하는 것을 처리하므로 메모리 누수에 대해 걱정할 필요가 없습니다. 일부 오류 처리를 추가해야 하는 경우 `run` 커맨드를 감싸는 `try/catch`가 항상 있거나 `bootstrap()` 호출에 `.catch()` 메서드를 연결할 수 있습니다.

#### 테스트

그렇다면 아주 쉽게 테스트할 수 없다면 멋진 명령줄 스크립트를 작성하는 데 무슨 소용이 있겠습니까? 다행히 `nest-commander`에는 NestJS 에코시스템과 완벽하게 맞아떨어지는 몇 가지 유용한 유틸리티가 있어 모든 Nest 사용자에게 익숙하게 느껴질 것입니다. 테스트 모드에서 커맨드를 빌드하기 위해 `CommandFactory`를 사용하는 대신, `@nestjs/testing`의 `Test.createTestingModule`이 작동하는 방식과 매우 유사하게 `CommandTestFactory`를 사용하고 메타데이터를 전달할 수 있습니다. 실제로 내부적으로 이 패키지를 사용합니다. 또한 `compile()`을 호출하기 전에 `overrideProvider` 메서드를 연결하여 테스트에서 바로 DI(의존성 주입) 부분을 교체할 수 있습니다.

#### 모두 합치기

다음 클래스는 서브커맨드 `basic`을 받거나 직접 호출할 수 있는 CLI 커맨드를 갖는 것과 동일하며, `-n`, `-s`, `-b`(롱 플래그와 함께)가 모두 지원되고 각 옵션에 대한 커스텀 파서가 있습니다. commander에서 관례적으로 `--help` 플래그도 지원됩니다.

```ts
import { Command, CommandRunner, Option } from 'nest-commander';
import { LogService } from './log.service';

interface BasicCommandOptions {
  string?: string;
  boolean?: boolean;
  number?: number;
}

@Command({ name: 'basic', description: 'A parameter parse' })
export class BasicCommand extends CommandRunner {
  constructor(private readonly logService: LogService) {
    super()
  }

  async run(
    passedParam: string[],
    options?: BasicCommandOptions,
  ): Promise<void> {
    if (options?.boolean !== undefined && options?.boolean !== null) {
      this.runWithBoolean(passedParam, options.boolean);
    } else if (options?.number) {
      this.runWithNumber(passedParam, options.number);
    } else if (options?.string) {
      this.runWithString(passedParam, options.string);
    } else {
      this.runWithNone(passedParam);
    }
  }

  @Option({
    flags: '-n, --number [number]',
    description: 'A basic number parser',
  })
  parseNumber(val: string): number {
    return Number(val);
  }

  @Option({
    flags: '-s, --string [string]',
    description: 'A string return',
  })
  parseString(val: string): string {
    return val;
  }

  @Option({
    flags: '-b, --boolean [boolean]',
    description: 'A boolean parser',
  })
  parseBoolean(val: string): boolean {
    return JSON.parse(val);
  }

  runWithString(param: string[], option: string): void {
    this.logService.log({ param, string: option });
  }

  runWithNumber(param: string[], option: number): void {
    this.logService.log({ param, number: option });
  }

  runWithBoolean(param: string[], option: boolean): void {
    this.logService.log({ param, boolean: option });
  }

  runWithNone(param: string[]): void {
    this.logService.log({ param });
  }
}
```

커맨드 클래스가 모듈에 추가되었는지 확인하세요.

```ts
@Module({
  providers: [LogService, BasicCommand],
})
export class AppModule {}
```

이제 main.ts에서 CLI를 실행하려면 다음과 같이 할 수 있습니다.

```ts
async function bootstrap() {
  await CommandFactory.run(AppModule);
}

bootstrap();
```

이처럼 간단하게 명령줄 애플리케이션을 만들 수 있습니다.

#### 추가 정보

더 많은 정보, 예제 및 API 문서는 [nest-commander 문서 사이트](https://jmcdo29.github.io/nest-commander)를 방문하세요.
