import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { BasePageComponent } from './pages/page/page.component';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomepageComponent implements OnInit, OnDestroy, AfterViewInit {
  isSidebarOpened = true;
  previousWidth: number;
  contentRef: HTMLElement;
  isMarkupReady: boolean;

  constructor(
    private readonly cd: ChangeDetectorRef,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter((ev) => ev instanceof NavigationEnd))
      .subscribe(() => {
        if (window.innerWidth > 768) {
          return false;
        }
        this.isSidebarOpened = false;
        this.cd.detectChanges();
      });
  }

  ngAfterViewInit() {
    this.checkWindowWidth(window.innerWidth);
    if (this.contentRef) {
      this.contentRef.appendChild(this.createDocSearchScriptTag());
    }
  }

  ngOnDestroy() {
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.checkWindowWidth(event.target.innerWidth);
  }

  toggleSidebar() {
    this.isSidebarOpened = !this.isSidebarOpened;
  }

  checkWindowWidth(innerWidth?: number) {
    innerWidth = innerWidth ? innerWidth : window.innerWidth;
    if (this.previousWidth !== innerWidth && innerWidth <= 768) {
      this.previousWidth = innerWidth;
      this.isSidebarOpened = false;
      this.cd.detectChanges();
    }
  }

  onRouteActivate(component: BasePageComponent) {
    if (!component) {
      return;
    }
    const nativeElement = component.nativeElement;
    if (!nativeElement) {
      return;
    }

    this.contentRef = nativeElement.querySelector('.content');

    this.cd.markForCheck();
  }

  createDocSearchScriptTag(): HTMLScriptElement {
    const scriptTag = document.createElement('script');
    scriptTag.type = 'text/javascript';
    scriptTag.src = 'https://cdn.jsdelivr.net/npm/@docsearch/js@3';
    scriptTag.async = true;
    scriptTag.onload = () => {
      (window as any).docsearch({
        apiKey: environment.algoliaApiKey,
        indexName: 'nestjs',
        container: '#search',
        appId: 'SDCBYAN96J',
        debug: false,
      });
    };
    return scriptTag;
  }
}