### Necord

Necord는 [Discord](https://discord.com) 봇 생성을 간소화하고 NestJS 애플리케이션과 원활하게 통합할 수 있도록 하는 강력한 모듈입니다.

> info **참고** Necord는 서드파티 패키지이며 NestJS 핵심 팀에서 공식적으로 유지 관리하지 않습니다. 문제가 발생하면 [공식 리포지토리](https://github.com/necordjs/necord)에 보고해 주세요.

#### 설치

시작하려면 Necord와 해당 종속성인 [`Discord.js`](https://discord.js.org)를 함께 설치해야 합니다.

```bash
$ npm install necord discord.js
```

#### 사용법

프로젝트에서 Necord를 사용하려면 `NecordModule`을 가져와 필요한 옵션으로 구성하십시오.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { NecordModule } from 'necord';
import { IntentsBitField } from 'discord.js';
import { AppService } from './app.service';

@Module({
  imports: [
    NecordModule.forRoot({
      token: process.env.DISCORD_TOKEN,
      intents: [IntentsBitField.Flags.Guilds],
      development: [process.env.DISCORD_DEVELOPMENT_GUILD_ID],
    }),
  ],
  providers: [AppService],
})
export class AppModule {}
```

> info **팁** 사용 가능한 인텐트의 포괄적인 목록은 [여기](https://discord.com/developers/docs/topics/gateway#gateway-intents)에서 찾을 수 있습니다.

이 설정을 사용하면 `AppService`를 제공자에 주입하여 명령, 이벤트 등을 쉽게 등록할 수 있습니다.

```typescript
@@filename(app.service)
import { Injectable, Logger } from '@nestjs/common';
import { Context, On, Once, ContextOf } from 'necord';
import { Client } from 'discord.js';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  @Once('ready')
  public onReady(@Context() [client]: ContextOf<'ready'>) {
    this.logger.log(`Bot logged in as ${client.user.username}`);
  }

  @On('warn')
  public onWarn(@Context() [message]: ContextOf<'warn'>) {
    this.logger.warn(message);
  }
}
```

##### 컨텍스트 이해하기

위 예제에서 `@Context` 데코레이터를 눈치챘을 수 있습니다. 이 데코레이터는 이벤트 컨텍스트를 메소드에 주입하여 다양한 이벤트 관련 데이터에 접근할 수 있도록 합니다. 여러 유형의 이벤트가 있으므로 컨텍스트 유형은 `ContextOf<type: string>` 유형을 사용하여 추론됩니다. `@Context()` 데코레이터를 사용하면 이벤트와 관련된 인자 배열로 변수를 쉽게 채워 컨텍스트 변수에 접근할 수 있습니다.

#### 텍스트 명령어

> warning **주의** 텍스트 명령어는 메시지 내용에 의존하며, 이는 인증된 봇과 100개 이상의 서버를 가진 애플리케이션에서는 사용 중단될 예정입니다. 즉, 봇이 메시지 내용에 접근할 수 없는 경우 텍스트 명령어가 작동하지 않습니다. 이 변경 사항에 대한 자세한 내용은 [여기](https://support-dev.discord.com/hc/en-us/articles/4404772028055-Message-Content-Access-Deprecation-for-Verified-Bots)에서 확인하십시오.

`@TextCommand` 데코레이터를 사용하여 메시지에 대한 간단한 명령어 핸들러를 만드는 방법은 다음과 같습니다.

```typescript
@@filename(app.commands)
import { Injectable } from '@nestjs/common';
import { Context, TextCommand, TextCommandContext, Arguments } from 'necord';

@Injectable()
export class AppCommands {
  @TextCommand({
    name: 'ping',
    description: 'Responds with pong!',
  })
  public onPing(
    @Context() [message]: TextCommandContext,
    @Arguments() args: string[],
  ) {
    return message.reply('pong!');
  }
}
```

#### 애플리케이션 명령어

애플리케이션 명령어는 사용자가 Discord 클라이언트 내에서 앱과 상호작용하는 기본 방식을 제공합니다. 채팅 입력, 메시지 컨텍스트 메뉴(메시지를 오른쪽 클릭하여 접근), 사용자 컨텍스트 메뉴(사용자를 오른쪽 클릭하여 접근)의 세 가지 유형의 애플리케이션 명령어가 있으며 서로 다른 인터페이스를 통해 접근할 수 있습니다.

<figure><img class="illustrative-image" src="https://i.imgur.com/4EmG8G8.png" /></figure>

#### 슬래시 명령어

슬래시 명령어는 구조화된 방식으로 사용자와 상호작용하는 훌륭한 방법입니다. 정밀한 인자와 옵션을 사용하여 명령어를 생성할 수 있어 사용자 경험을 크게 향상시킵니다.

Necord를 사용하여 슬래시 명령어를 정의하려면 `SlashCommand` 데코레이터를 사용할 수 있습니다.

```typescript
@@filename(app.commands)
import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext } from 'necord';

@Injectable()
export class AppCommands {
  @SlashCommand({
    name: 'ping',
    description: 'Responds with pong!',
  })
  public async onPing(@Context() [interaction]: SlashCommandContext) {
    return interaction.reply({ content: 'Pong!' });
  }
}
```

> info **팁** 봇 클라이언트가 로그인하면 정의된 모든 명령어를 자동으로 등록합니다. 전역 명령어는 최대 1시간 동안 캐시된다는 점에 유의하세요. 전역 캐시 문제를 방지하려면 Necord 모듈의 `development` 인자를 사용하여 단일 길드에만 명령어 가시성을 제한하십시오.

##### 옵션

옵션 데코레이터를 사용하여 슬래시 명령어의 매개변수를 정의할 수 있습니다. 이를 위해 `TextDto` 클래스를 만들어 보겠습니다.

```typescript
@@filename(text.dto)
import { StringOption } from 'necord';

export class TextDto {
  @StringOption({
    name: 'text',
    description: 'Input your text here',
    required: true,
  })
  text: string;
}
```

그런 다음 `AppCommands` 클래스에서 이 DTO를 사용할 수 있습니다.

```typescript
@@filename(app.commands)
import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, Options, SlashCommandContext } from 'necord';
import { TextDto } from './length.dto';

@Injectable()
export class AppCommands {
  @SlashCommand({
    name: 'length',
    description: 'Calculate the length of your text',
  })
  public async onLength(
    @Context() [interaction]: SlashCommandContext,
    @Options() { text }: TextDto,
  ) {
    return interaction.reply({
      content: `The length of your text is: ${text.length}`,
    });
  }
}
```

내장된 옵션 데코레이터의 전체 목록은 [이 문서](https://necord.org/interactions/slash-commands#options)를 확인하세요.

##### 자동 완성

슬래시 명령어에 자동 완성 기능을 구현하려면 인터셉터를 만들어야 합니다. 이 인터셉터는 사용자가 자동 완성 필드에 입력할 때 요청을 처리합니다.

```typescript
@@filename(cats-autocomplete.interceptor)
import { Injectable } from '@nestjs/common';
import { AutocompleteInteraction } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';

@Injectable()
class CatsAutocompleteInterceptor extends AutocompleteInterceptor {
  public transformOptions(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);
    let choices: string[];

    if (focused.name === 'cat') {
      choices = ['Siamese', 'Persian', 'Maine Coon'];
    }

    return interaction.respond(
      choices
        .filter((choice) => choice.startsWith(focused.value.toString()))
        .map((choice) => ({ name: choice, value: choice })),
    );
  }
}
```

또한 옵션 클래스에 `autocomplete: true`로 표시해야 합니다.

```typescript
@@filename(cat.dto)
import { StringOption } from 'necord';

export class CatDto {
  @StringOption({
    name: 'cat',
    description: 'Choose a cat breed',
    autocomplete: true,
    required: true,
  })
  cat: string;
}
```

마지막으로 슬래시 명령어에 인터셉터를 적용합니다.

```typescript
@@filename(cats.commands)
import { Injectable, UseInterceptors } from '@nestjs/common';
import { Context, SlashCommand, Options, SlashCommandContext } from 'necord';
import { CatDto } from '/cat.dto';
import { CatsAutocompleteInterceptor } from './cats-autocomplete.interceptor';

@Injectable()
export class CatsCommands {
  @UseInterceptors(CatsAutocompleteInterceptor)
  @SlashCommand({
    name: 'cat',
    description: 'Retrieve information about a specific cat breed',
  })
  public async onSearch(
    @Context() [interaction]: SlashCommandContext,
    @Options() { cat }: CatDto,
  ) {
    return interaction.reply({
      content: `I found information on the breed of ${cat} cat!`,
    });
  }
}
```

#### 사용자 컨텍스트 메뉴

사용자 명령어는 사용자를 오른쪽 클릭(또는 탭)할 때 나타나는 컨텍스트 메뉴에 표시됩니다. 이 명령어는 사용자를 직접 대상으로 하는 빠른 작업을 제공합니다.

```typescript
@@filename(app.commands)
import { Injectable } from '@nestjs/common';
import { Context, UserCommand, UserCommandContext, TargetUser } from 'necord';
import { User } from 'discord.js';

@Injectable()
export class AppCommands {
  @UserCommand({ name: 'Get avatar' })
  public async getUserAvatar(
    @Context() [interaction]: UserCommandContext,
    @TargetUser() user: User,
  ) {
    return interaction.reply({
      embeds: [
        new MessageEmbed()
          .setTitle(`Avatar of ${user.username}`)
          .setImage(user.displayAvatarURL({ size: 4096, dynamic: true })),
      ],
    });
  }
}
```

#### 메시지 컨텍스트 메뉴

메시지 명령어는 메시지를 오른쪽 클릭할 때 컨텍스트 메뉴에 나타나 해당 메시지와 관련된 빠른 작업을 수행할 수 있도록 합니다.

```typescript
@@filename(app.commands)
import { Injectable } from '@nestjs/common';
import { Context, MessageCommand, MessageCommandContext, TargetMessage } from 'necord';
import { Message } from 'discord.js';

@Injectable()
export class AppCommands {
  @MessageCommand({ name: 'Copy Message' })
  public async copyMessage(
    @Context() [interaction]: MessageCommandContext,
    @TargetMessage() message: Message,
  ) {
    return interaction.reply({ content: message.content });
  }
}
```

#### 버튼

[버튼](https://discord.com/developers/docs/interactions/message-components#buttons)은 메시지에 포함할 수 있는 상호 작용 요소입니다. 클릭하면 애플리케이션으로 [상호 작용](https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object)을 보냅니다.

```typescript
@@filename(app.components)
import { Injectable } from '@nestjs/common';
import { Context, Button, ButtonContext } from 'necord';

@Injectable()
export class AppComponents {
  @Button('BUTTON')
  public onButtonClick(@Context() [interaction]: ButtonContext) {
    return interaction.reply({ content: 'Button clicked!' });
  }
}
```

#### 선택 메뉴

[선택 메뉴](https://discord.com/developers/docs/interactions/message-components#select-menus)는 메시지에 나타나는 또 다른 유형의 상호 작용 컴포넌트입니다. 사용자가 옵션을 선택할 수 있는 드롭다운과 유사한 UI를 제공합니다.

```typescript
@@filename(app.components)
import { Injectable } from '@nestjs/common';
import { Context, StringSelect, StringSelectContext, SelectedStrings } from 'necord';

@Injectable()
export class AppComponents {
  @StringSelect('SELECT_MENU')
  public onSelectMenu(
    @Context() [interaction]: StringSelectContext,
    @SelectedStrings() values: string[],
  ) {
    return interaction.reply({ content: `You selected: ${values.join(', ')}` });
  }
}
```

내장된 선택 메뉴 컴포넌트의 전체 목록은 [이 링크](https://necord.org/interactions/message-components#select-menu)를 방문하세요.

#### 모달

모달은 사용자가 서식 있는 입력을 제출할 수 있는 팝업 양식입니다. Necord를 사용하여 모달을 생성하고 처리하는 방법은 다음과 같습니다.

```typescript
@@filename(app.modals)
import { Injectable } from '@nestjs/common';
import { Context, Modal, ModalContext } from 'necord';

@Injectable()
export class AppModals {
  @Modal('pizza')
  public onModal(@Context() [interaction]: ModalContext) {
    return interaction.reply({
      content: `Your fav pizza : ${interaction.fields.getTextInputValue('pizza')}`
    });
  }
}
```

#### 더 많은 정보

자세한 내용은 [Necord 웹사이트](https://necord.org)를 방문하십시오.
