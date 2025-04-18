### 라이브러리

많은 애플리케이션은 동일한 일반적인 문제를 해결하거나 여러 다른 맥락에서 모듈화된 컴포넌트를 재사용해야 합니다. Nest는 이를 해결하기 위한 몇 가지 방법을 제공하지만, 각 방법은 서로 다른 수준에서 작동하며 다양한 아키텍처 및 조직적 목표를 달성하는 데 도움이 되는 방식으로 문제를 해결합니다.

Nest [모듈](/modules)은 단일 애플리케이션 내에서 컴포넌트를 공유할 수 있도록 실행 컨텍스트를 제공하는 데 유용합니다. 모듈은 또한 [npm](https://npmjs.com)을 사용하여 패키징하여 다른 프로젝트에 설치할 수 있는 재사용 가능한 라이브러리를 만들 수도 있습니다. 이는 서로 느슨하게 연결되거나 관련 없는 조직(예: 서드파티 라이브러리 배포/설치)에서 사용할 수 있는 구성 가능한 재사용 라이브러리를 배포하는 효과적인 방법이 될 수 있습니다.

긴밀하게 조직된 그룹(예: 회사/프로젝트 경계 내) 내에서 코드를 공유하려면 컴포넌트 공유에 대한 보다 가벼운 접근 방식이 유용할 수 있습니다. 모노레포는 이를 가능하게 하는 구성체로 등장했으며, 모노레포 내에서 **라이브러리**는 코드를 쉽고 가벼운 방식으로 공유하는 방법을 제공합니다. Nest 모노레포에서 라이브러리를 사용하면 컴포넌트를 공유하는 애플리케이션을 쉽게 조립할 수 있습니다. 실제로 이는 모놀리식 애플리케이션 및 개발 프로세스를 분해하여 모듈식 컴포넌트 구축 및 구성에 집중하도록 장려합니다.

#### Nest 라이브러리

Nest 라이브러리는 자체적으로 실행될 수 없다는 점에서 애플리케이션과 다른 Nest 프로젝트입니다. 라이브러리는 코드를 실행하기 위해 포함하는 애플리케이션으로 가져와야 합니다. 이 섹션에서 설명하는 라이브러리에 대한 내장 지원은 **모노레포**에서만 사용할 수 있습니다(표준 모드 프로젝트는 npm 패키지를 사용하여 유사한 기능을 구현할 수 있습니다).

예를 들어, 어떤 조직은 모든 내부 애플리케이션을 관리하는 회사 정책을 구현하여 인증을 관리하는 `AuthModule`을 개발할 수 있습니다. 각 애플리케이션마다 별도로 모듈을 구축하거나, npm으로 코드를 물리적으로 패키징하여 각 프로젝트가 설치하도록 요구하는 대신, 모노레포는 이 모듈을 라이브러리로 정의할 수 있습니다. 이런 방식으로 구성하면 라이브러리 모듈의 모든 소비자는 커밋될 때마다 최신 버전의 `AuthModule`을 확인할 수 있습니다. 이는 컴포넌트 개발 및 조립을 조율하고 엔드 투 엔드 테스트를 간소화하는 데 상당한 이점을 가져올 수 있습니다.

#### 라이브러리 생성

재사용에 적합한 모든 기능은 라이브러리로 관리될 수 있습니다. 무엇이 라이브러리가 되어야 하고 무엇이 애플리케이션의 일부가 되어야 하는지를 결정하는 것은 아키텍처 설계 결정입니다. 라이브러리를 생성하는 것은 단순히 기존 애플리케이션에서 새 라이브러리로 코드를 복사하는 것 이상을 포함합니다. 라이브러리로 패키징될 때, 라이브러리 코드는 애플리케이션에서 분리되어야 합니다. 이는 초기에 **더 많은** 시간을 요구할 수 있으며, 더 긴밀하게 결합된 코드에서는 직면하지 않을 수도 있는 일부 설계 결정을 강요할 수 있습니다. 그러나 이 추가적인 노력은 여러 애플리케이션에 걸쳐 더 빠른 애플리케이션 조립을 가능하게 할 때 보상을 받을 수 있습니다.

라이브러리 생성을 시작하려면 다음 명령을 실행합니다.

```bash
$ nest g library my-library
```

명령을 실행하면 `library` 스키매틱이 라이브러리의 접두사(별칭이라고도 함)를 입력하라는 메시지를 표시합니다.

```bash
What prefix would you like to use for the library (default: @app)?
```

이렇게 하면 워크스페이스에 `my-library`라는 새 프로젝트가 생성됩니다.
애플리케이션 유형 프로젝트와 마찬가지로, 라이브러리 유형 프로젝트도 스키매틱을 사용하여 명명된 폴더로 생성됩니다. 라이브러리는 모노레포 루트의 `libs` 폴더 아래에서 관리됩니다. Nest는 라이브러리가 처음 생성될 때 `libs` 폴더를 생성합니다.

라이브러리에 대해 생성된 파일은 애플리케이션에 대해 생성된 파일과 약간 다릅니다. 위 명령을 실행한 후의 `libs` 폴더 내용은 다음과 같습니다.

<div class="file-tree">
  <div class="item">libs</div>
  <div class="children">
    <div class="item">my-library</div>
    <div class="children">
      <div class="item">src</div>
      <div class="children">
        <div class="item">index.ts</div>
        <div class="item">my-library.module.ts</div>
        <div class="item">my-library.service.ts</div>
      </div>
      <div class="item">tsconfig.lib.json</div>
    </div>
  </div>
</div>

`nest-cli.json` 파일에는 `"projects"` 키 아래에 라이브러리에 대한 새 항목이 추가됩니다.

```javascript
...
{
    "my-library": {
      "type": "library",
      "root": "libs/my-library",
      "entryFile": "index",
      "sourceRoot": "libs/my-library/src",
      "compilerOptions": {
        "tsConfigPath": "libs/my-library/tsconfig.lib.json"
      }
}
...
```

`nest-cli.json` 메타데이터에서 라이브러리와 애플리케이션 간에는 두 가지 차이점이 있습니다.

- `"type"` 속성이 `"application"` 대신 `"library"`로 설정됩니다.
- `"entryFile"` 속성이 `"main"` 대신 `"index"`로 설정됩니다.

이러한 차이점은 빌드 프로세스가 라이브러리를 적절하게 처리하도록 하는 핵심입니다. 예를 들어, 라이브러리는 `index.js` 파일을 통해 함수를 내보냅니다.

애플리케이션 유형 프로젝트와 마찬가지로, 각 라이브러리는 루트(모노레포 전체) `tsconfig.json` 파일을 확장하는 자체 `tsconfig.lib.json` 파일을 가집니다. 필요한 경우 이 파일을 수정하여 라이브러리별 컴파일러 옵션을 제공할 수 있습니다.

CLI 명령으로 라이브러리를 빌드할 수 있습니다.

```bash
$ nest build my-library
```

#### 라이브러리 사용

자동으로 생성된 구성 파일이 준비되면 라이브러리 사용은 간단합니다. `my-library` 라이브러리에서 `MyLibraryService`를 `my-project` 애플리케이션으로 어떻게 가져올까요?

먼저, 라이브러리 모듈을 사용하는 것은 다른 Nest 모듈을 사용하는 것과 같다는 점에 유의하세요. 모노레포가 하는 일은 라이브러리를 가져오고 빌드를 생성하는 방식을 투명하게 경로를 관리하는 것입니다. `MyLibraryService`를 사용하려면 해당 선언 모듈을 가져와야 합니다. `my-project/src/app.module.ts`를 다음과 같이 수정하여 `MyLibraryModule`을 가져올 수 있습니다.

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MyLibraryModule } from '@app/my-library';

@Module({
  imports: [MyLibraryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

위에서 ES 모듈 `import` 줄에 `@app` 경로 별칭을 사용한 것에 주목하세요. 이는 위에서 `nest g library` 명령에 제공한 `prefix`였습니다. 내부적으로 Nest는 tsconfig 경로 매핑을 통해 이를 처리합니다. 라이브러리를 추가할 때 Nest는 전역(모노레포) `tsconfig.json` 파일의 `"paths"` 키를 다음과 같이 업데이트합니다.

```javascript
"paths": {
    "@app/my-library": [
        "libs/my-library/src"
    ],
    "@app/my-library/*": [
        "libs/my-library/src/*"
    ]
}
```

요컨대, 모노레포와 라이브러리 기능의 조합은 라이브러리 모듈을 애플리케이션에 포함시키는 것을 쉽고 직관적으로 만들었습니다.

이 동일한 메커니즘은 라이브러리를 구성하는 애플리케이션을 빌드하고 배포할 수 있게 합니다. `MyLibraryModule`을 가져온 후 `nest build`를 실행하면 모든 모듈 해결이 자동으로 처리되고, 배포를 위해 앱을 모든 라이브러리 종속성과 함께 번들링합니다. 모노레포의 기본 컴파일러는 **webpack**이므로, 결과 배포 파일은 변환된 모든 JavaScript 파일을 단일 파일로 묶은 단일 파일입니다. <a href="https://nestjs.dokidocs.dev/cli/monorepo#global-compiler-options">여기</a>에서 설명된 대로 `tsc`로 전환할 수도 있습니다.