### 작업 영역

Nest는 코드를 구성하기 위한 두 가지 모드를 제공합니다:

-   **표준 모드**: 자체 종속성 및 설정을 가지며, 모듈 공유 또는 복잡한 빌드 최적화가 필요하지 않은 개별 프로젝트 중심 애플리케이션을 빌드하는 데 유용합니다. 이는 기본 모드입니다.
-   **모노레포 모드**: 이 모드는 코드 아티팩트를 경량 **모노레포**의 일부로 취급하며, 개발자 팀 및/또는 다중 프로젝트 환경에 더 적합할 수 있습니다. 모듈식 컴포넌트를 쉽게 생성하고 구성할 수 있도록 빌드 프로세스의 일부를 자동화하고, 코드 재사용을 촉진하며, 통합 테스트를 쉽게 만들고, `eslint` 규칙 및 기타 구성 정책과 같은 프로젝트 전체의 아티팩트를 쉽게 공유할 수 있게 하며, github 서브모듈과 같은 대안보다 사용하기 쉽습니다. 모노레포 모드는 모노레포의 컴포넌트 간의 관계를 조정하기 위해 `nest-cli.json` 파일에 표현된 **작업 영역** 개념을 사용합니다.

Nest의 거의 모든 기능은 코드 구성 모드와 독립적이라는 점을 아는 것이 중요합니다. 이 선택의 **유일한** 영향은 프로젝트가 구성되는 방식과 빌드 아티팩트가 생성되는 방식입니다. CLI에서 코어 모듈, 애드온 모듈에 이르기까지 다른 모든 기능은 두 모드에서 동일하게 작동합니다.

또한, **표준 모드**에서 **모노레포 모드**로 언제든지 쉽게 전환할 수 있으므로, 어느 한 접근 방식의 이점이 더 명확해질 때까지 이 결정을 미룰 수 있습니다.

#### 표준 모드

`nest new`를 실행하면 내장 스키마틱을 사용하여 새로운 **프로젝트**가 생성됩니다. Nest는 다음을 수행합니다:

1.  `nest new`에 제공하는 `name` 인수에 해당하는 새 폴더를 생성합니다.
2.  해당 폴더를 최소 기준 레벨 Nest 애플리케이션에 해당하는 기본 파일로 채웁니다. 이 파일들은 [typescript-starter](https://github.com/nestjs/typescript-starter) 저장소에서 확인할 수 있습니다.
3.  애플리케이션 컴파일, 테스트 및 서빙을 위한 다양한 도구를 구성하고 활성화하는 `nest-cli.json`, `package.json`, `tsconfig.json`과 같은 추가 파일을 제공합니다.

여기서부터 스타터 파일을 수정하고, 새 컴포넌트를 추가하고, 종속성을 추가하고(예: `npm install`), 이 문서의 나머지 부분에서 다루는 대로 애플리케이션을 개발할 수 있습니다.

#### 모노레포 모드

모노레포 모드를 사용하려면 _표준 모드_ 구조로 시작하여 **프로젝트**를 추가합니다. 프로젝트는 전체 **애플리케이션**(`nest generate app` 명령으로 작업 영역에 추가) 또는 **라이브러리**(`nest generate library` 명령으로 작업 영역에 추가)일 수 있습니다. 아래에서 이러한 특정 유형의 프로젝트 컴포넌트에 대한 세부 정보를 논의하겠습니다. 지금 주목해야 할 핵심은 기존 표준 모드 구조에 **프로젝트를 추가하는 행위**가 **모노레포 모드로 전환**한다는 것입니다. 예를 살펴보겠습니다.

다음 명령을 실행하면:

```bash
$ nest new my-project
```

다음과 같은 폴더 구조를 가진 _표준 모드_ 구조를 구성했습니다:

<div class="file-tree">
  <div class="item">node_modules</div>
  <div class="item">src</div>
  <div class="children">
    <div class="item">app.controller.ts</div>
    <div class="item">app.module.ts</div>
    <div class="item">app.service.ts</div>
    <div class="item">main.ts</div>
  </div>
  <div class="item">nest-cli.json</div>
  <div class="item">package.json</div>
  <div class="item">tsconfig.json</div>
  <div class="item">eslint.config.mjs</div>
</div>

이것을 다음과 같이 모노레포 모드 구조로 변환할 수 있습니다:

```bash
$ cd my-project
$ nest generate app my-app
```

이 시점에서 `nest`는 기존 구조를 **모노레포 모드** 구조로 변환합니다. 이로 인해 몇 가지 중요한 변경 사항이 발생합니다. 이제 폴더 구조는 다음과 같습니다:

<div class="file-tree">
  <div class="item">apps</div>
    <div class="children">
      <div class="item">my-app</div>
      <div class="children">
        <div class="item">src</div>
        <div class="children">
          <div class="item">app.controller.ts</div>
          <div class="item">app.module.ts</div>
          <div class="item">app.service.ts</div>
          <div class="item">main.ts</div>
        </div>
        <div class="item">tsconfig.app.json</div>
      </div>
      <div class="item">my-project</div>
      <div class="children">
        <div class="item">src</div>
        <div class="children">
          <div class="item">app.controller.ts</div>
          <div class="item">app.module.ts</div>
          <div class="item">app.service.ts</div>
          <div class="item">main.ts</div>
        </div>
        <div class="item">tsconfig.app.json</div>
      </div>
    </div>
  <div class="item">nest-cli.json</div>
  <div class="item">package.json</div>
  <div class="item">tsconfig.json</div>
  <div class="item">eslint.config.mjs</div>
</div>

`generate app` 스키마틱은 코드를 재구성하여 각 **애플리케이션** 프로젝트를 `apps` 폴더 아래로 옮기고, 각 프로젝트의 루트 폴더에 프로젝트별 `tsconfig.app.json` 파일을 추가했습니다. 원래 `my-project` 앱은 모노레포의 **기본 프로젝트**가 되었고, 이제 `apps` 폴더 아래에 있는 방금 추가된 `my-app`와 동일한 레벨에 위치합니다. 기본 프로젝트에 대해서는 아래에서 다루겠습니다.

> error **경고** 표준 모드 구조를 모노레포로 변환하는 것은 표준 Nest 프로젝트 구조를 따르는 프로젝트에만 적용됩니다. 특히, 변환 중에 스키마틱은 프로젝트의 `src` 및 `test` 폴더를 루트의 `apps` 폴더 아래에 있는 프로젝트 폴더로 재배치하려고 시도합니다. 프로젝트가 이 구조를 사용하지 않으면 변환이 실패하거나 신뢰할 수 없는 결과를 생성할 수 있습니다.

#### 작업 영역 프로젝트

모노레포는 작업 영역 개념을 사용하여 구성원 엔터티를 관리합니다. 작업 영역은 **프로젝트**로 구성됩니다. 프로젝트는 다음 중 하나일 수 있습니다:

-   **애플리케이션**: 애플리케이션 부트스트랩을 위한 `main.ts` 파일을 포함하는 전체 Nest 애플리케이션입니다. 컴파일 및 빌드 고려 사항을 제외하고, 작업 영역 내의 애플리케이션 타입 프로젝트는 _표준 모드_ 구조 내의 애플리케이션과 기능적으로 동일합니다.
-   **라이브러리**: 라이브러리는 다른 프로젝트에서 사용할 수 있는 일반적인 기능 세트(모듈, 프로바이더, 컨트롤러 등)를 패키징하는 방법입니다. 라이브러리는 자체적으로 실행될 수 없으며 `main.ts` 파일이 없습니다. 라이브러리에 대해 자세히 알아보려면 [여기](/cli/libraries)를 참조하십시오.

모든 작업 영역에는 **기본 프로젝트**가 있습니다 (이는 애플리케이션 타입 프로젝트여야 합니다). 이는 `nest-cli.json` 파일의 최상위 `"root"` 속성으로 정의되며, 기본 프로젝트의 루트를 가리킵니다 (자세한 내용은 아래 [CLI 속성](/cli/monorepo#cli-properties) 참조). 일반적으로 이는 처음에 시작했던 **표준 모드** 애플리케이션이며, 나중에 `nest generate app`를 사용하여 모노레포로 변환한 것입니다. 이 단계를 따르면 이 속성이 자동으로 채워집니다.

기본 프로젝트는 프로젝트 이름이 제공되지 않은 경우 `nest build` 및 `nest start`와 같은 `nest` 명령에서 사용됩니다.

예를 들어, 위 모노레포 구조에서 다음 명령을 실행하면

```bash
$ nest start
```

`my-project` 앱이 시작됩니다. `my-app`을 시작하려면 다음을 사용합니다:

```bash
$ nest start my-app
```

#### 애플리케이션

애플리케이션 타입 프로젝트 또는 비공식적으로 "애플리케이션"이라고 부르는 것은 실행 및 배포할 수 있는 완전한 Nest 애플리케이션입니다. `nest generate app`를 사용하여 애플리케이션 타입 프로젝트를 생성합니다.

이 명령어는 [typescript starter](https://github.com/nestjs/typescript-starter)의 표준 `src` 및 `test` 폴더를 포함한 프로젝트 스켈레톤을 자동으로 생성합니다. 표준 모드와 달리, 모노레포의 애플리케이션 프로젝트는 패키지 종속성(`package.json`) 또는 `.prettierrc`, `eslint.config.mjs`와 같은 다른 프로젝트 구성 아티팩트를 가지지 않습니다. 대신, 모노레포 전체의 종속성 및 구성 파일이 사용됩니다.

그러나 스키마틱은 프로젝트의 루트 폴더에 프로젝트별 `tsconfig.app.json` 파일을 생성합니다. 이 구성 파일은 컴파일 출력 폴더를 적절하게 설정하는 것을 포함하여 적절한 빌드 옵션을 자동으로 설정합니다. 이 파일은 최상위 (모노레포) `tsconfig.json` 파일을 확장하므로, 전역 설정을 모노레포 전체에서 관리할 수 있지만 필요한 경우 프로젝트 수준에서 재정의할 수 있습니다.

#### 라이브러리

언급했듯이, 라이브러리 타입 프로젝트 또는 단순히 "라이브러리"는 실행을 위해 애플리케이션으로 구성되어야 하는 Nest 컴포넌트의 패키지입니다. `nest generate library`를 사용하여 라이브러리 타입 프로젝트를 생성합니다. 라이브러리에 무엇이 속해야 하는지를 결정하는 것은 아키텍처 설계 결정입니다. 라이브러리에 대한 자세한 내용은 [라이브러리](/cli/libraries) 장에서 자세히 설명합니다.

#### CLI 속성

Nest는 `nest-cli.json` 파일에 표준 및 모노레포 구조 프로젝트를 구성, 빌드 및 배포하는 데 필요한 메타데이터를 유지합니다. Nest는 프로젝트를 추가할 때 이 파일을 자동으로 추가 및 업데이트하므로 일반적으로 이 파일에 대해 생각하거나 내용을 편집할 필요가 없습니다. 그러나 수동으로 변경하려는 몇 가지 설정이 있을 수 있으므로 파일에 대한 개요를 이해하는 것이 도움이 됩니다.

위에서 모노레포를 생성하기 위한 단계를 실행한 후 `nest-cli.json` 파일은 다음과 같습니다:

```javascript
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "apps/my-project/src",
  "monorepo": true,
  "root": "apps/my-project",
  "compilerOptions": {
    "webpack": true,
    "tsConfigPath": "apps/my-project/tsconfig.app.json"
  },
  "projects": {
    "my-project": {
      "type": "application",
      "root": "apps/my-project",
      "entryFile": "main",
      "sourceRoot": "apps/my-project/src",
      "compilerOptions": {
        "tsConfigPath": "apps/my-project/tsconfig.app.json"
      }
    },
    "my-app": {
      "type": "application",
      "root": "apps/my-app",
      "entryFile": "main",
      "sourceRoot": "apps/my-app/src",
      "compilerOptions": {
        "tsConfigPath": "apps/my-app/tsconfig.app.json"
      }
    }
  }
}
```

파일은 다음 섹션으로 나뉩니다:

-   표준 및 모노레포 전체 설정을 제어하는 최상위 속성이 있는 전역 섹션
-   각 프로젝트에 대한 메타데이터가 있는 최상위 속성 (`"projects"`) 이 섹션은 모노레포 모드 구조에만 존재합니다.

최상위 속성은 다음과 같습니다:

-   `"collection"`: 컴포넌트를 생성하는 데 사용되는 스키마틱 컬렉션을 가리킵니다; 일반적으로 이 값을 변경해서는 안 됩니다.
-   `"sourceRoot"`: 표준 모드 구조에서 단일 프로젝트의 소스 코드 루트를 가리키거나, 모노레포 모드 구조에서 _기본 프로젝트_의 소스 코드 루트를 가리킵니다.
-   `"compilerOptions"`: 컴파일러 옵션을 지정하는 키와 옵션 설정을 지정하는 값으로 구성된 맵입니다; 아래에서 자세한 내용을 참조하십시오.
-   `"generateOptions"`: 전역 생성 옵션을 지정하는 키와 옵션 설정을 지정하는 값으로 구성된 맵입니다; 아래에서 자세한 내용을 참조하십시오.
-   `"monorepo"`: (모노레포 전용) 모노레포 모드 구조의 경우 이 값은 항상 `true`입니다.
-   `"root"`: (모노레포 전용) _기본 프로젝트_의 프로젝트 루트를 가리킵니다.

#### 전역 컴파일러 옵션

이 속성들은 사용할 컴파일러와 `nest build` 또는 `nest start`의 일부로, 그리고 `tsc` 또는 webpack 중 어떤 컴파일러를 사용하든 상관없이 **모든** 컴파일 단계에 영향을 미치는 다양한 옵션을 지정합니다.

| 속성 이름         | 속성 값 타입   | 설명                                                                                                                                                                                                                                                                                 |
| :---------------- | :------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `webpack`         | boolean        | `true`이면 [webpack 컴파일러](https://webpack.js.org/)를 사용합니다. `false`이거나 없으면 `tsc`를 사용합니다. 모노레포 모드에서는 기본값이 `true`(webpack 사용)이고, 표준 모드에서는 기본값이 `false`(`tsc` 사용)입니다. 자세한 내용은 아래를 참조하십시오. (더 이상 사용되지 않음: 대신 `builder` 사용) |
| `tsConfigPath`    | string         | (**모노레포 전용**) `project` 옵션 없이 `nest build` 또는 `nest start`가 호출될 때 사용될 `tsconfig.json` 설정 파일의 경로를 가리킵니다 (예: 기본 프로젝트가 빌드되거나 시작될 때).                                                                                                       |
| `webpackConfigPath` | string         | webpack 옵션 파일을 가리킵니다. 지정되지 않으면 Nest는 `webpack.config.js` 파일을 찾습니다. 자세한 내용은 아래를 참조하십시오.                                                                                                                                                           |
| `deleteOutDir`    | boolean        | `true`이면 컴파일러가 호출될 때마다 컴파일 출력 디렉토리(기본값은 `./dist`인 `tsconfig.json`에 구성됨)를 먼저 제거합니다.                                                                                                                                                               |
| `assets`          | array          | 컴파일 단계가 시작될 때마다 비-TypeScript 자산을 자동으로 배포할 수 있습니다 (자산 배포는 `--watch` 모드의 증분 컴파일에서는 발생하지 않습니다). 자세한 내용은 아래를 참조하십시오.                                                                                                       |
| `watchAssets`     | boolean        | `true`이면 **모든** 비-TypeScript 자산을 감시하는 watch 모드로 실행합니다. (감시할 자산에 대한 보다 세분화된 제어를 위해서는 아래 [자산](cli/monorepo#assets) 섹션을 참조하십시오).                                                                                                   |
| `manualRestart`   | boolean        | `true`이면 수동으로 서버를 다시 시작하는 `rs` 단축키를 활성화합니다. 기본값은 `false`입니다.                                                                                                                                                                                             |
| `builder`         | string/object  | 프로젝트를 컴파일하는 데 사용할 `builder`를 CLI에 지시합니다 (`tsc`, `swc`, 또는 `webpack`). 빌더의 동작을 사용자 정의하려면 `type` (`tsc`, `swc`, 또는 `webpack`) 및 `options` 두 가지 속성을 포함하는 객체를 전달할 수 있습니다.                                                          |
| `typeCheck`       | boolean        | `true`이면 SWC 기반 프로젝트(빌더가 `swc`일 때)에 대한 타입 검사를 활성화합니다. 기본값은 `false`입니다.                                                                                                                                                                                 |

#### 전역 생성 옵션

이 속성들은 `nest generate` 명령어에 의해 사용될 기본 생성 옵션을 지정합니다.

| 속성 이름     | 속성 값 타입   | 설명                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| :------------ | :------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spec`        | boolean _또는_ object | 값이 boolean이면 `true`는 기본적으로 `spec` 생성을 활성화하고 `false`는 비활성화합니다. CLI 명령 줄에 전달된 플래그는 이 설정을 재정의하며, 프로젝트별 `generateOptions` 설정도 재정의합니다 (자세한 내용은 아래 참조). 값이 객체인 경우 각 키는 스키마틱 이름을 나타내며, boolean 값은 해당 특정 스키마틱에 대해 기본 spec 생성을 활성화/비활성화할지 여부를 결정합니다.                                                                                                                                                                                                                                                                                                              |
| `flat`        | boolean        | true이면 모든 generate 명령이 flat 구조를 생성합니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

다음 예제는 spec 파일 생성을 기본적으로 모든 프로젝트에 대해 비활성화하도록 boolean 값을 사용합니다:

```javascript
{
  "generateOptions": {
    "spec": false
  },
  ...
}
```

다음 예제는 flat 파일 생성을 기본적으로 모든 프로젝트에 대해 활성화하도록 boolean 값을 사용합니다:

```javascript
{
  "generateOptions": {
    "flat": true
  },
  ...
}
```

다음 예제에서는 `service` 스키마틱에 대해서만 `spec` 파일 생성이 비활성화됩니다 (예: `nest generate service...`):

```javascript
{
  "generateOptions": {
    "spec": {
      "service": false
    }
  },
  ...
}
```

> warning **경고** `spec`을 객체로 지정할 때, 생성 스키마틱의 키는 현재 자동 별칭 처리를 지원하지 않습니다. 이는 예를 들어 `service: false`로 키를 지정하고 별칭 `s`를 통해 서비스를 생성하려고 하면 spec이 여전히 생성된다는 의미입니다. 일반 스키마틱 이름과 별칭 모두 의도대로 작동하도록 하려면 아래에 보이는 것처럼 일반 명령 이름과 별칭을 모두 지정하십시오.
>
> ```javascript
> {
>   "generateOptions": {
>     "spec": {
>       "service": false,
>       "s": false
>     }
>   },
>   ...
> }
> ```

#### 프로젝트별 생성 옵션

전역 생성 옵션을 제공하는 것 외에도 프로젝트별 생성 옵션을 지정할 수 있습니다. 프로젝트별 생성 옵션은 전역 생성 옵션과 정확히 동일한 형식을 따르지만, 각 프로젝트에 직접 지정됩니다.

프로젝트별 생성 옵션은 전역 생성 옵션을 재정의합니다.

```javascript
{
  "projects": {
    "cats-project": {
      "generateOptions": {
        "spec": {
          "service": false
        }
      },
      ...
    }
  },
  ...
}
```

> warning **경고** 생성 옵션의 우선순위는 다음과 같습니다. CLI 명령 줄에 지정된 옵션이 프로젝트별 옵션보다 우선합니다. 프로젝트별 옵션은 전역 옵션을 재정의합니다.

#### 지정된 컴파일러

다른 기본 컴파일러를 사용하는 이유는 더 큰 프로젝트(예: 모노레포에서 더 일반적)의 경우 webpack이 빌드 시간 및 모든 프로젝트 컴포넌트를 하나의 파일로 묶는 데 상당한 이점이 있기 때문입니다. 개별 파일을 생성하려면 `"webpack"`을 `false`로 설정하십시오. 이렇게 하면 빌드 프로세스에서 `tsc`(또는 `swc`)가 사용됩니다.

#### Webpack 옵션

webpack 옵션 파일에는 표준 [webpack 구성 옵션](https://webpack.js.org/configuration/)이 포함될 수 있습니다. 예를 들어, webpack에게 `node_modules`(기본적으로 제외됨)를 번들링하도록 지시하려면 `webpack.config.js`에 다음을 추가하십시오:

```javascript
module.exports = {
  externals: [],
};
```

webpack 구성 파일은 JavaScript 파일이므로, 기본 옵션을 받아 수정된 객체를 반환하는 함수를 노출할 수도 있습니다:

```javascript
module.exports = function (options) {
  return {
    ...options,
    externals: [],
  };
};
```

#### 자산

TypeScript 컴파일은 컴파일러 출력(`.js` 및 `.d.ts` 파일)을 지정된 출력 디렉토리로 자동으로 배포합니다. `.graphql` 파일, 이미지, `.html` 파일 및 기타 자산과 같은 비-TypeScript 파일을 배포하는 것도 편리할 수 있습니다. 이를 통해 `nest build`(및 모든 초기 컴파일 단계)를 경량 **개발 빌드** 단계로 취급할 수 있으며, 이 단계에서 비-TypeScript 파일을 편집하고 반복적으로 컴파일 및 테스트할 수 있습니다.
자산은 `src` 폴더에 있어야 하며 그렇지 않으면 복사되지 않습니다.

`assets` 키의 값은 배포할 파일을 지정하는 요소의 배열이어야 합니다. 요소는 `glob`와 유사한 파일 사양을 가진 간단한 문자열일 수 있습니다. 예를 들면 다음과 같습니다:

```typescript
"assets": ["**/*.graphql"],
"watchAssets": true,
```

더 세부적인 제어를 위해 요소는 다음 키를 가진 객체일 수 있습니다:

-   `"include"`: 배포할 자산에 대한 `glob`와 유사한 파일 사양
-   `"exclude"`: `include` 목록에서 **제외**할 자산에 대한 `glob`와 유사한 파일 사양
-   `"outDir"`: 자산이 배포될 경로(루트 폴더 기준)를 지정하는 문자열입니다. 컴파일러 출력에 대해 구성된 동일한 출력 디렉토리가 기본값입니다.
-   `"watchAssets"`: boolean; `true`이면 지정된 자산을 감시하는 watch 모드로 실행합니다.

예를 들면 다음과 같습니다:

```typescript
"assets": [
  { "include": "**/*.graphql", "exclude": "**/omitted.graphql", "watchAssets": true },
]
```

> warning **경고** 최상위 `compilerOptions` 속성에 `watchAssets`를 설정하면 `assets` 속성 내의 모든 `watchAssets` 설정이 재정의됩니다.

#### 프로젝트 속성

이 요소는 모노레포 모드 구조에만 존재합니다. Nest는 모노레포 내에서 프로젝트와 해당 구성 옵션을 찾기 위해 이 속성을 사용하므로 일반적으로 이 속성을 편집해서는 안 됩니다.