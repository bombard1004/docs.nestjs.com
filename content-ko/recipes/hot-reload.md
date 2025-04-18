### 핫 리로드

애플리케이션의 부트스트래핑 프로세스에 가장 큰 영향을 미치는 것은 **TypeScript 컴파일**입니다. 다행히 [webpack](https://github.com/webpack/webpack) HMR(Hot-Module Replacement)을 사용하면 변경 사항이 발생할 때마다 전체 프로젝트를 다시 컴파일할 필요가 없습니다. 이는 애플리케이션을 인스턴스화하는 데 필요한 시간을 크게 줄이고 반복적인 개발을 훨씬 쉽게 만듭니다.

> warning **경고** `webpack`은 자산(예: `graphql` 파일)을 `dist` 폴더에 자동으로 복사하지 않는다는 점에 유의하십시오. 마찬가지로 `webpack`은 glob 정적 경로(예: `TypeOrmModule`의 `entities` 속성)와 호환되지 않습니다.

### CLI 사용

[Nest CLI](https://nestjs.dokidocs.dev/cli/overview)를 사용하는 경우, 설정 프로세스는 매우 간단합니다. CLI는 `webpack`을 래핑하여 `HotModuleReplacementPlugin`을 사용할 수 있도록 합니다.

#### 설치

먼저 필요한 패키지를 설치합니다:

```bash
$ npm i --save-dev webpack-node-externals run-script-webpack-plugin webpack
```

> info **팁** **Yarn Berry**(기존 Yarn 아님)를 사용하는 경우, `webpack-node-externals` 대신 `webpack-pnp-externals` 패키지를 설치하십시오.

#### 설정

설치가 완료되면 애플리케이션의 루트 디렉토리에 `webpack-hmr.config.js` 파일을 생성합니다.

```typescript
const nodeExternals = require('webpack-node-externals');
const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');

module.exports = function (options, webpack) {
  return {
    ...options,
    entry: ['webpack/hot/poll?100', options.entry],
    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100'],
      }),
    ],
    plugins: [
      ...options.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/],
      }),
      new RunScriptWebpackPlugin({ name: options.output.filename, autoRestart: false }),
    ],
  };
};
```

> info **팁** **Yarn Berry**(기존 Yarn 아님)를 사용하는 경우, `externals` 설정 속성에서 `nodeExternals`를 사용하는 대신, `webpack-pnp-externals` 패키지의 `WebpackPnpExternals`를 사용하십시오: `WebpackPnpExternals({{ '{' }} exclude: ['webpack/hot/poll?100'] {{ '}' }})\`.

이 함수는 기본 webpack 설정을 포함하는 원래 객체를 첫 번째 인자로 받고, Nest CLI가 사용하는 내부 `webpack` 패키지에 대한 참조를 두 번째 인자로 받습니다. 또한 `HotModuleReplacementPlugin`, `WatchIgnorePlugin`, `RunScriptWebpackPlugin` 플러그인이 포함된 수정된 webpack 설정을 반환합니다.

#### 핫-모듈 교체 (Hot-Module Replacement)

**HMR**을 활성화하려면 애플리케이션 진입 파일(`main.ts`)을 열고 다음 webpack 관련 지침을 추가합니다:

```typescript
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
```

실행 프로세스를 간소화하기 위해 `package.json` 파일에 스크립트를 추가합니다.

```json
"start:dev": "nest build --webpack --webpackPath webpack-hmr.config.js --watch"
```

이제 명령 프롬프트를 열고 다음 명령을 실행합니다:

```bash
$ npm run start:dev
```

### CLI 없이

[Nest CLI](https://nestjs.dokidocs.dev/cli/overview)를 사용하지 않는 경우, 설정은 약간 더 복잡해집니다(더 많은 수동 단계가 필요합니다).

#### 설치

먼저 필요한 패키지를 설치합니다:

```bash
$ npm i --save-dev webpack webpack-cli webpack-node-externals ts-loader run-script-webpack-plugin
```

> info **팁** **Yarn Berry**(기존 Yarn 아님)를 사용하는 경우, `webpack-node-externals` 대신 `webpack-pnp-externals` 패키지를 설치하십시오.

#### 설정

설치가 완료되면 애플리케이션의 루트 디렉토리에 `webpack.config.js` 파일을 생성합니다.

```typescript
const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');

module.exports = {
  entry: ['webpack/hot/poll?100', './src/main.ts'],
  target: 'node',
  externals: [
    nodeExternals({
      allowlist: ['webpack/hot/poll?100'],
    }),
  ],
  module: {
    rules: [
      {
        test: /.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  mode: 'development',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [new webpack.HotModuleReplacementPlugin(), new RunScriptWebpackPlugin({ name: 'server.js', autoRestart: false })],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'server.js',
  },
};
```

> info **팁** **Yarn Berry**(기존 Yarn 아님)를 사용하는 경우, `externals` 설정 속성에서 `nodeExternals`를 사용하는 대신, `webpack-pnp-externals` 패키지의 `WebpackPnpExternals`를 사용하십시오: `WebpackPnpExternals({{ '{' }} exclude: ['webpack/hot/poll?100'] {{ '}' }})\`.

이 설정은 애플리케이션에 대한 몇 가지 필수 정보, 즉 진입 파일의 위치, **컴파일된** 파일을 보관하는 데 사용될 디렉토리, 그리고 소스 파일을 컴파일하는 데 사용할 로더 종류를 webpack에게 알려줍니다. 일반적으로 모든 옵션을 완전히 이해하지 못하더라도 이 파일을 그대로 사용할 수 있습니다.

#### 핫-모듈 교체 (Hot-Module Replacement)

**HMR**을 활성화하려면 애플리케이션 진입 파일(`main.ts`)을 열고 다음 webpack 관련 지침을 추가합니다:

```typescript
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
```

실행 프로세스를 간소화하기 위해 `package.json` 파일에 스크립트를 추가합니다.

```json
"start:dev": "webpack --config webpack.config.js --watch"
```

이제 명령 프롬프트를 열고 다음 명령을 실행합니다:

```bash
$ npm run start:dev
```

#### 예제

동작하는 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/08-webpack)에서 확인할 수 있습니다.