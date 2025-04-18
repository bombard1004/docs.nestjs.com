### 작업 스케줄링

작업 스케줄링을 사용하면 임의의 코드(메서드/함수)를 특정 날짜/시간에, 정기적인 간격으로, 또는 지정된 간격 후에 한 번 실행하도록 예약할 수 있습니다. 리눅스 환경에서는 종종 OS 수준에서 [cron](https://en.wikipedia.org/wiki/Cron)과 같은 패키지에 의해 처리됩니다. Node.js 앱의 경우, cron과 유사한 기능을 에뮬레이트하는 여러 패키지가 있습니다. Nest는 인기 있는 Node.js [cron](https://github.com/kelektiv/node-cron) 패키지와 통합되는 `@nestjs/schedule` 패키지를 제공합니다. 현재 챕터에서는 이 패키지에 대해 다룰 것입니다.

#### 설치

사용을 시작하기 위해 먼저 필요한 종속성을 설치합니다.

```bash
$ npm install --save @nestjs/schedule
```

작업 스케줄링을 활성화하려면 루트 `AppModule`에 `ScheduleModule`을 임포트하고 아래와 같이 `forRoot()` 정적 메서드를 실행합니다.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot()
  ],
})
export class AppModule {}
```

`.forRoot()` 호출은 스케줄러를 초기화하고 앱 내에 존재하는 선언적인 <a href="techniques/task-scheduling#declarative-cron-jobs">cron 작업</a>, <a href="techniques/task-scheduling#declarative-timeouts">timeouts</a> 및 <a href="techniques/task-scheduling#declarative-intervals">intervals</a>을 등록합니다. 등록은 `onApplicationBootstrap` 라이프사이클 훅이 발생할 때 이루어지며, 모든 모듈이 로드되고 예약된 작업을 선언했는지 확인합니다.

#### 선언적인 cron 작업

cron 작업은 임의의 함수(메서드 호출)가 자동으로 실행되도록 스케줄링합니다. cron 작업은 다음 경우에 실행될 수 있습니다:

- 지정된 날짜/시간에 한 번 실행.
- 정기적으로 실행; 정기적인 작업은 지정된 간격 내의 특정 시점에 실행될 수 있습니다 (예: 매 시간마다, 매주 한 번, 매 5분마다).

실행될 코드를 포함하는 메서드 정의 앞에 `@Cron()` 데코레이터를 사용하여 cron 작업을 선언합니다.

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron('45 * * * * *')
  handleCron() {
    this.logger.debug('Called when the current second is 45');
  }
}
```

이 예에서 `handleCron()` 메서드는 현재 초가 `45`가 될 때마다 호출됩니다. 즉, 메서드는 분당 한 번, 45초 시점에 실행됩니다.

`@Cron()` 데코레이터는 다음 표준 [cron 패턴](http://crontab.org/)을 지원합니다:

- 별표 (예: `*`)
- 범위 (예: `1-3,5`)
- 단계 (예: `*/2`)

위 예에서는 데코레이터에 `45 * * * * *`를 전달했습니다. 다음 키는 cron 패턴 문자열의 각 위치가 어떻게 해석되는지 보여줍니다:

<pre class="language-javascript"><code class="language-javascript">
* * * * * *
| | | | | |
| | | | | 요일
| | | | 월
| | | 일
| | 시간
| 분
초 (선택 사항)
</code></pre>

몇 가지 예시 cron 패턴은 다음과 같습니다:

<table>
  <tbody>
    <tr>
      <td><code>* * * * * *</code></td>
      <td>매 초마다</td>
    </tr>
    <tr>
      <td><code>45 * * * * *</code></td>
      <td>매 분마다, 45초에</td>
    </tr>
    <tr>
      <td><code>0 10 * * * *</code></td>
      <td>매 시간마다, 10분 시작 시점에</td>
    </tr>
    <tr>
      <td><code>0 */30 9-17 * * *</code></td>
      <td>오전 9시부터 오후 5시 사이에 30분마다</td>
    </tr>
   <tr>
      <td><code>0 30 11 * * 1-5</code></td>
      <td>월요일부터 금요일까지 오전 11시 30분에</td>
    </tr>
  </tbody>
</table>

`@nestjs/schedule` 패키지는 일반적으로 사용되는 cron 패턴을 포함하는 편리한 Enum을 제공합니다. 이 Enum은 다음과 같이 사용할 수 있습니다:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron(CronExpression.EVERY_30_SECONDS)
  handleCron() {
    this.logger.debug('Called every 30 seconds');
  }
}
```

이 예에서 `handleCron()` 메서드는 매 `30`초마다 호출됩니다. 예외가 발생하면 콘솔에 기록되는데, 이는 `@Cron()`으로 어노테이션된 모든 메서드가 자동으로 `try-catch` 블록으로 감싸지기 때문입니다.

대안으로, `@Cron()` 데코레이터에 JavaScript `Date` 객체를 제공할 수 있습니다. 이렇게 하면 해당 날짜에 정확히 한 번 작업이 실행됩니다.

> info **팁** JavaScript 날짜 연산을 사용하여 현재 날짜를 기준으로 작업을 예약하세요. 예를 들어, 앱 시작 후 10초 뒤에 실행될 작업을 예약하려면 `@Cron(new Date(Date.now() + 10 * 1000))`을 사용하세요.

또한 `@Cron()` 데코레이터의 두 번째 매개변수로 추가 옵션을 제공할 수 있습니다.

<table>
  <tbody>
    <tr>
      <td><code>name</code></td>
      <td>
        선언된 cron 작업에 액세스하고 제어하는 데 유용합니다.
      </td>
    </tr>
    <tr>
      <td><code>timeZone</code></td>
      <td>
        실행을 위한 시간대를 지정합니다. 이는 실제 시간을 사용자의 시간대에 상대적으로 수정합니다. 시간대가 유효하지 않으면 오류가 발생합니다. <a href="http://momentjs.com/timezone/">Moment Timezone</a> 웹사이트에서 사용 가능한 모든 시간대를 확인할 수 있습니다.
      </td>
    </tr>
    <tr>
      <td><code>utcOffset</code></td>
      <td>
        <code>timeZone</code> 매개변수를 사용하는 대신 시간대의 오프셋을 지정할 수 있습니다.
      </td>
    </tr>
    <tr>
      <td><code>waitForCompletion</code></td>
      <td>
        <code>true</code>인 경우, 현재 onTick 콜백이 완료될 때까지 추가적인 cron 작업 인스턴스가 실행되지 않습니다. 현재 cron 작업이 실행되는 동안 발생하는 새로운 예약된 실행은 완전히 건너뛰게 됩니다.
      </td>
    </tr>
    <tr>
      <td><code>disabled</code></td>
      <td>
       작업이 전혀 실행될지 여부를 나타냅니다.
      </td>
    </tr>
  </tbody>
</table>

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationService {
  @Cron('* * 0 * * *', {
    name: 'notifications',
    timeZone: 'Europe/Paris',
  })
  triggerNotifications() {}
}
```

선언된 cron 작업에 액세스하고 제어하거나, <a href="/techniques/task-scheduling#dynamic-schedule-module-api">동적 API</a>를 사용하여 동적으로 cron 작업(cron 패턴이 런타임에 정의됨)을 생성할 수 있습니다. API를 통해 선언적인 cron 작업에 액세스하려면, 데코레이터의 두 번째 인수로 선택적 옵션 객체에 `name` 속성을 전달하여 작업에 이름을 연결해야 합니다.

#### 선언적인 intervals

메서드가 지정된 간격(정기적으로)으로 실행되어야 함을 선언하려면 메서드 정의 앞에 `@Interval()` 데코레이터를 붙입니다. 아래와 같이 밀리초 단위의 간격 값을 데코레이터에 전달합니다.

```typescript
@Interval(10000)
handleInterval() {
  this.logger.debug('Called every 10 seconds');
}
```

> info **팁** 이 메커니즘은 내부적으로 JavaScript의 `setInterval()` 함수를 사용합니다. 정기적인 작업을 스케줄링하기 위해 cron 작업도 활용할 수 있습니다.

<a href="/techniques/task-scheduling#dynamic-schedule-module-api">동적 API</a>를 통해 선언적인 interval을 선언 클래스 외부에서 제어하려면, 다음 구문을 사용하여 interval에 이름을 연결하세요.

```typescript
@Interval('notifications', 2500)
handleInterval() {}
```

예외가 발생하면 콘솔에 기록되는데, 이는 `@Interval()`로 어노테이션된 모든 메서드가 자동으로 `try-catch` 블록으로 감싸지기 때문입니다.

<a href="techniques/task-scheduling#dynamic-intervals">동적 API</a>는 interval의 속성이 런타임에 정의되는 동적 interval을 **생성**하는 것과 이를 **나열 및 삭제**하는 것도 가능하게 합니다.

<app-banner-enterprise></app-banner-enterprise>

#### 선언적인 timeouts

메서드가 지정된 timeout에 (한 번) 실행되어야 함을 선언하려면 메서드 정의 앞에 `@Timeout()` 데코레이터를 붙입니다. 아래와 같이 애플리케이션 시작으로부터의 상대 시간 오프셋(밀리초 단위)을 데코레이터에 전달합니다.

```typescript
@Timeout(5000)
handleTimeout() {
  this.logger.debug('Called once after 5 seconds');
}
```

> info **팁** 이 메커니즘은 내부적으로 JavaScript의 `setTimeout()` 함수를 사용합니다.

예외가 발생하면 콘솔에 기록되는데, 이는 `@Timeout()`으로 어노테이션된 모든 메서드가 자동으로 `try-catch` 블록으로 감싸지기 때문입니다.

<a href="/techniques/task-scheduling#dynamic-schedule-module-api">동적 API</a>를 통해 선언적인 timeout을 선언 클래스 외부에서 제어하려면, 다음 구문을 사용하여 timeout에 이름을 연결하세요.

```typescript
@Timeout('notifications', 2500)
handleTimeout() {}
```

<a href="techniques/task-scheduling#dynamic-timeouts">동적 API</a>는 timeout의 속성이 런타임에 정의되는 동적 timeout을 **생성**하는 것과 이를 **나열 및 삭제**하는 것도 가능하게 합니다.

#### 동적 스케줄 모듈 API

`@nestjs/schedule` 모듈은 선언적인 <a href="techniques/task-scheduling#declarative-cron-jobs">cron 작업</a>, <a href="techniques/task-scheduling#declarative-timeouts">timeouts</a> 및 <a href="techniques/task-scheduling#declarative-intervals">intervals</a>를 관리할 수 있는 동적 API를 제공합니다. 이 API는 또한 속성이 런타임에 정의되는 **동적** cron 작업, timeouts 및 intervals을 생성하고 관리할 수 있도록 합니다.

#### 동적 cron 작업

`SchedulerRegistry` API를 사용하여 코드의 어느 곳에서든 이름으로 `CronJob` 인스턴스의 참조를 얻을 수 있습니다. 먼저 표준 생성자 주입을 사용하여 `SchedulerRegistry`를 주입합니다.

```typescript
constructor(private schedulerRegistry: SchedulerRegistry) {}
```

> info **팁** `@nestjs/schedule` 패키지에서 `SchedulerRegistry`를 임포트합니다.

그런 다음 다음과 같이 클래스에서 사용합니다. 다음 선언으로 cron 작업이 생성되었다고 가정해 보겠습니다.

```typescript
@Cron('* * 8 * * *', {
  name: 'notifications',
})
triggerNotifications() {}
```

다음 코드를 사용하여 이 작업에 액세스합니다.

```typescript
const job = this.schedulerRegistry.getCronJob('notifications');

job.stop();
console.log(job.lastDate());
```

`getCronJob()` 메서드는 이름으로 지정된 cron 작업을 반환합니다. 반환된 `CronJob` 객체는 다음 메서드를 가집니다:

- `stop()` - 실행 예정인 작업을 중지합니다.
- `start()` - 중지된 작업을 다시 시작합니다.
- `setTime(time: CronTime)` - 작업을 중지하고 새로운 시간을 설정한 다음 다시 시작합니다.
- `lastDate()` - 작업의 마지막 실행이 발생한 날짜의 `DateTime` 표현을 반환합니다.
- `nextDate()` - 작업의 다음 실행이 예약된 날짜의 `DateTime` 표현을 반환합니다.
- `nextDates(count: number)` - 작업 실행을 트리거할 다음 날짜 집합에 대한 `DateTime` 표현 배열(`count` 크기)을 제공합니다. `count`는 기본값 0이며 빈 배열을 반환합니다.

> info **팁** `DateTime` 객체를 JavaScript Date에 해당하는 형태로 렌더링하려면 `toJSDate()`를 사용하세요.

`SchedulerRegistry#addCronJob` 메서드를 사용하여 새 cron 작업을 동적으로 **생성**하는 방법은 다음과 같습니다.

```typescript
addCronJob(name: string, seconds: string) {
  const job = new CronJob(`${seconds} * * * * *`, () => {
    this.logger.warn(`time (${seconds}) for job ${name} to run!`);
  });

  this.schedulerRegistry.addCronJob(name, job);
  job.start();

  this.logger.warn(
    `job ${name} added for each minute at ${seconds} seconds!`,
  );
}
```

이 코드에서는 `cron` 패키지의 `CronJob` 객체를 사용하여 cron 작업을 생성합니다. `CronJob` 생성자는 첫 번째 인수로 cron 패턴(데코레이터 `<a href="techniques/task-scheduling#declarative-cron-jobs">@Cron()</a>`과 동일)을 받고, 두 번째 인수로 cron 타이머가 발생할 때 실행될 콜백 함수를 받습니다. `SchedulerRegistry#addCronJob` 메서드는 두 개의 인수를 받습니다: `CronJob`의 이름과 `CronJob` 객체 자체입니다.

> warning **경고** `SchedulerRegistry`에 액세스하기 전에 주입하는 것을 잊지 마세요. `cron` 패키지에서 `CronJob`을 임포트하세요.

`SchedulerRegistry#deleteCronJob` 메서드를 사용하여 이름이 지정된 cron 작업을 **삭제**하는 방법은 다음과 같습니다.

```typescript
deleteCron(name: string) {
  this.schedulerRegistry.deleteCronJob(name);
  this.logger.warn(`job ${name} deleted!`);
}
```

`SchedulerRegistry#getCronJobs` 메서드를 사용하여 모든 cron 작업을 **나열**하는 방법은 다음과 같습니다.

```typescript
getCrons() {
  const jobs = this.schedulerRegistry.getCronJobs();
  jobs.forEach((value, key, map) => {
    let next;
    try {
      next = value.nextDate().toJSDate();
    } catch (e) {
      next = 'error: next fire date is in the past!';
    }
    this.logger.log(`job: ${key} -> next: ${next}`);
  });
}
```

`getCronJobs()` 메서드는 `map`을 반환합니다. 이 코드에서 우리는 맵을 순회하며 각 `CronJob`의 `nextDate()` 메서드에 액세스하려고 시도합니다. `CronJob` API에서는 작업이 이미 실행되었고 미래에 실행될 날짜가 없으면 예외를 던집니다.

#### 동적 intervals

`SchedulerRegistry#getInterval` 메서드를 사용하여 interval의 참조를 얻습니다. 위와 마찬가지로 표준 생성자 주입을 사용하여 `SchedulerRegistry`를 주입합니다.

```typescript
constructor(private schedulerRegistry: SchedulerRegistry) {}
```

그리고 다음과 같이 사용합니다.

```typescript
const interval = this.schedulerRegistry.getInterval('notifications');
clearInterval(interval);
```

`SchedulerRegistry#addInterval` 메서드를 사용하여 새 interval을 동적으로 **생성**하는 방법은 다음과 같습니다.

```typescript
addInterval(name: string, milliseconds: number) {
  const callback = () => {
    this.logger.warn(`Interval ${name} executing at time (${milliseconds})!`);
  };

  const interval = setInterval(callback, milliseconds);
  this.schedulerRegistry.addInterval(name, interval);
}
```

이 코드에서 우리는 표준 JavaScript interval을 생성한 다음 `SchedulerRegistry#addInterval` 메서드에 전달합니다.
이 메서드는 두 개의 인수를 받습니다: interval의 이름과 interval 자체입니다.

`SchedulerRegistry#deleteInterval` 메서드를 사용하여 이름이 지정된 interval을 **삭제**하는 방법은 다음과 같습니다.

```typescript
deleteInterval(name: string) {
  this.schedulerRegistry.deleteInterval(name);
  this.logger.warn(`Interval ${name} deleted!`);
}
```

`SchedulerRegistry#getIntervals` 메서드를 사용하여 모든 interval을 **나열**하는 방법은 다음과 같습니다.

```typescript
getIntervals() {
  const intervals = this.schedulerRegistry.getIntervals();
  intervals.forEach(key => this.logger.log(`Interval: ${key}`));
}
}
```

#### 동적 timeouts

`SchedulerRegistry#getTimeout` 메서드를 사용하여 timeout의 참조를 얻습니다. 위와 마찬가지로 표준 생성자 주입을 사용하여 `SchedulerRegistry`를 주입합니다.

```typescript
constructor(private readonly schedulerRegistry: SchedulerRegistry) {}
```

그리고 다음과 같이 사용합니다.

```typescript
const timeout = this.schedulerRegistry.getTimeout('notifications');
clearTimeout(timeout);
```

`SchedulerRegistry#addTimeout` 메서드를 사용하여 새 timeout을 동적으로 **생성**하는 방법은 다음과 같습니다.

```typescript
addTimeout(name: string, milliseconds: number) {
  const callback = () => {
    this.logger.warn(`Timeout ${name} executing after (${milliseconds})!`);
  };

  const timeout = setTimeout(callback, milliseconds);
  this.schedulerRegistry.addTimeout(name, timeout);
}
```

이 코드에서 우리는 표준 JavaScript timeout을 생성한 다음 `SchedulerRegistry#addTimeout` 메서드에 전달합니다.
이 메서드는 두 개의 인수를 받습니다: timeout의 이름과 timeout 자체입니다.

`SchedulerRegistry#deleteTimeout` 메서드를 사용하여 이름이 지정된 timeout을 **삭제**하는 방법은 다음과 같습니다.

```typescript
deleteTimeout(name: string) {
  this.schedulerRegistry.deleteTimeout(name);
  this.logger.warn(`Timeout ${name} deleted!`);
}
```

`SchedulerRegistry#getTimeouts` 메서드를 사용하여 모든 timeout을 **나열**하는 방법은 다음과 같습니다.

```typescript
getTimeouts() {
  const timeouts = this.schedulerRegistry.getTimeouts();
  timeouts.forEach(key => this.logger.log(`Timeout: ${key}`));
}
```

#### 예제

작동하는 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/27-scheduling)에서 확인할 수 있습니다.