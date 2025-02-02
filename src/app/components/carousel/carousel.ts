import {
    NgModule,
    Component,
    ElementRef,
    AfterViewInit,
    AfterViewChecked,
    AfterContentInit,
    EventEmitter,
    OnDestroy,
    Input,
    Output,
    TemplateRef,
    ContentChildren,
    QueryList,
    Renderer2,
    ViewChild,
    ChangeDetectorRef,
    HostListener
} from "@angular/core";
import { DomHandler } from "../dom/domhandler";
import { SharedModule, PrimeTemplate } from "../common/shared";
import { CommonModule } from "@angular/common";

@Component({
    selector: "p-carousel",
    template: `
        <div
            #container
            [ngClass]="{
                'ui-carousel ui-widget ui-widget-content ui-corner-all': true
            }"
            [ngStyle]="style"
            [class]="styleClass"
        >
            <div class="ui-carousel-header ui-widget-header ui-corner-all">
                <span class="ui-carousel-header-title">{{ headerText }}</span>
                <span
                    class="ui-carousel-button ui-carousel-next-button pi pi-arrow-circle-right"
                    (click)="onNextNav()"
                    [ngClass]="{
                        'ui-state-disabled':
                            page === totalPages - 1 && !circular
                    }"
                    *ngIf="value && value.length"
                ></span>
                <span
                    class="ui-carousel-button ui-carousel-prev-button pi pi-arrow-circle-left"
                    (click)="onPrevNav()"
                    [ngClass]="{ 'ui-state-disabled': page === 0 && !circular }"
                    *ngIf="value && value.length"
                ></span>
                <div *ngIf="displayPageLinks" class="ui-carousel-page-links">
                    <a
                        tabindex="0"
                        (click)="setPageWithLink($event, i)"
                        class="ui-carousel-page-link pi"
                        *ngFor="let links of anchorPageLinks; let i = index"
                        [ngClass]="{
                            'pi-circle-on': page === i,
                            'pi-circle-off': page !== i
                        }"
                    ></a>
                </div>
                <select
                    *ngIf="displayPageDropdown"
                    class="ui-carousel-dropdown ui-widget ui-state-default ui-corner-left"
                    [value]="page"
                    (change)="onDropdownChange($event.target.value)"
                >
                    <option
                        *ngFor="let option of selectDropdownOptions"
                        [value]="option"
                        [selected]="value == option"
                        >{{ option + 1 }}</option
                    >
                </select>
                <select
                    *ngIf="responsive && value && value.length"
                    class="ui-carousel-mobiledropdown ui-widget ui-state-default ui-corner-left"
                    [value]="page"
                    (change)="onDropdownChange($event.target.value)"
                    [style.display]="shrinked ? 'block' : 'none'"
                >
                    <option
                        *ngFor="let option of mobileDropdownOptions"
                        [value]="option"
                        [selected]="value == option"
                        >{{ option + 1 }}</option
                    >
                </select>
            </div>
            <div
                #viewport
                class="ui-carousel-viewport"
                (mouseenter)="onViewportMouseEnter()"
                (mouseleave)="onViewportMouseLeave()"
            >
                <ul
                    #items
                    class="ui-carousel-items"
                    [style.left.px]="left"
                    [style.transitionProperty]="'left'"
                    [style.transitionDuration]="effectDuration"
                    [style.transitionTimingFunction]="easing"
                >
                    <li
                        *ngFor="let item of value"
                        class="ui-carousel-item ui-widget-content ui-corner-all"
                    >
                        <ng-container
                            *ngTemplateOutlet="
                                itemTemplate;
                                context: { $implicit: item }
                            "
                        ></ng-container>
                    </li>
                </ul>
            </div>
        </div>
    `
})
export class Carousel implements AfterViewChecked, AfterViewInit, OnDestroy {
    @Input() numVisible = 3;

    @Input() firstVisible = 0;

    @Input() headerText: string;

    @Input() circular = false;

    @Input() breakpoint = 560;

    @Input() responsive = true;

    @Input() autoplayOnHover = false;

    @Input() autoplayInterval = 0;

    @Input() effectDuration: any = "1s";

    @Input() easing = "ease-out";

    @Input() pageLinks = 3;

    @Input() style: any;

    @Input() styleClass: string;

    @Output() onPage: EventEmitter<any> = new EventEmitter();

    @ContentChildren(PrimeTemplate) templates: QueryList<any>;

    public _value: any[];

    public itemTemplate: TemplateRef<any>;

    public left: any = 0;

    public items: any;

    public columns = 0;

    public page: number;

    public valuesChanged: any;

    public interval: any;

    public anchorPageLinks: any[];

    public mobileDropdownOptions: any[];

    public selectDropdownOptions: any[];

    public shrinked: boolean;

    @ViewChild("container", { static: false }) containerViewChild: ElementRef;

    @ViewChild("viewport", { static: false }) viewportViewChild: ElementRef;

    @ViewChild("items", { static: false }) itemsViewChild: ElementRef;

    documentResponsiveListener: any;

    differ: any;

    constructor(
        public el: ElementRef,
        public renderer: Renderer2,
        public cd: ChangeDetectorRef
    ) {}

    ngAfterContentInit() {
        this.templates.forEach(item => {
            switch (item.getType()) {
                case "item":
                    this.itemTemplate = item.template;
                    break;

                default:
                    this.itemTemplate = item.template;
                    break;
            }
        });
    }

    @Input() get value(): any[] {
        return this._value;
    }

    set value(val: any[]) {
        this._value = val;
        this.handleDataChange();
    }

    handleDataChange() {
        if (this.value && this.value.length) {
            if (this.value.length && this.firstVisible >= this.value.length) {
                this.setPage(this.totalPages - 1);
            }
        } else {
            this.setPage(0);
        }

        this.valuesChanged = true;
    }

    ngAfterViewChecked() {
        if (
            this.valuesChanged &&
            this.containerViewChild &&
            this.containerViewChild.nativeElement.offsetParent
        ) {
            this.render();
            this.valuesChanged = false;
        }
    }

    ngAfterViewInit() {
        if (this.responsive) {
            this.documentResponsiveListener = this.renderer.listen(
                "window",
                "resize",
                event => {
                    this.updateState();
                }
            );
        }
    }

    updateLinks() {
        this.anchorPageLinks = [];
        for (let i = 0; i < this.totalPages; i++) {
            this.anchorPageLinks.push(i);
        }
    }

    updateDropdown() {
        this.selectDropdownOptions = [];
        for (let i = 0; i < this.totalPages; i++) {
            this.selectDropdownOptions.push(i);
        }
    }

    updateMobileDropdown() {
        this.mobileDropdownOptions = [];
        if (this.value && this.value.length) {
            for (let i = 0; i < this.value.length; i++) {
                this.mobileDropdownOptions.push(i);
            }
        }
    }

    onViewportMouseEnter() {
        if (this.autoplayOnHover) {
            this.startAutoplay();
        }
    }

    onViewportMouseLeave() {
        if (this.autoplayOnHover) {
            this.stopAutoplay();
        }
    }

    render() {
        this.stopAutoplay();

        this.items = DomHandler.find(this.itemsViewChild.nativeElement, "li");
        this.calculateColumns();
        this.calculateItemWidths();

        this.setPage(Math.floor(this.firstVisible / this.columns), true);

        if (!this.responsive) {
            this.containerViewChild.nativeElement.style.width =
                DomHandler.width(this.containerViewChild.nativeElement) + "px";
        }

        if (!this.autoplayOnHover) {
            this.startAutoplay();
        }

        this.updateMobileDropdown();
        this.updateLinks();
        this.updateDropdown();
        this.cd.detectChanges();
    }

    calculateItemWidths() {
        const firstItem =
            this.items && this.items.length ? this.items[0] : null;
        if (firstItem) {
            for (let i = 0; i < this.items.length; i++) {
                this.items[i].style.width =
                    (DomHandler.innerWidth(
                        this.viewportViewChild.nativeElement
                    ) -
                        DomHandler.getHorizontalMargin(firstItem) *
                            this.columns) /
                        this.columns +
                    "px";
            }
        }
    }

    calculateColumns() {
        if (window.innerWidth <= this.breakpoint) {
            this.shrinked = true;
            this.columns = 1;
        } else {
            this.shrinked = false;
            this.columns = this.numVisible;
        }
        this.page = Math.floor(this.firstVisible / this.columns);
    }

    onNextNav() {
        const lastPage = this.page === this.totalPages - 1;

        if (!lastPage) {
            this.setPage(this.page + 1);
        } else if (this.circular) {
            this.setPage(0);
        }
    }

    onPrevNav() {
        if (this.page !== 0) {
            this.setPage(this.page - 1);
        } else if (this.circular) {
            this.setPage(this.totalPages - 1);
        }
    }

    setPageWithLink(event, p: number) {
        this.setPage(p);
        event.preventDefault();
    }

    setPage(p, enforce?: boolean) {
        if (p !== this.page || enforce) {
            this.page = p;
            this.left =
                -1 *
                (DomHandler.innerWidth(this.viewportViewChild.nativeElement) *
                    this.page);
            this.firstVisible = this.page * this.columns;
            this.cd.detectChanges();
            this.onPage.emit({
                page: this.page
            });
        }
    }

    onDropdownChange(val: string) {
        this.setPage(parseInt(val));
    }

    get displayPageLinks(): boolean {
        return this.totalPages <= this.pageLinks && !this.shrinked;
    }

    get displayPageDropdown(): boolean {
        return this.totalPages > this.pageLinks && !this.shrinked;
    }

    get totalPages(): number {
        return this.value && this.value.length
            ? Math.ceil(this.value.length / this.columns)
            : 0;
    }

    routerDisplay() {
        const win = window;
        if (win.innerWidth <= this.breakpoint) {
            return true;
        } else {
            return false;
        }
    }

    updateState() {
        const win = window;
        if (win.innerWidth <= this.breakpoint) {
            this.shrinked = true;
            this.columns = 1;
        } else if (this.shrinked) {
            this.shrinked = false;
            this.columns = this.numVisible;
            this.updateLinks();
            this.updateDropdown();
        }

        this.calculateItemWidths();
        this.setPage(Math.floor(this.firstVisible / this.columns), true);
    }

    startAutoplay() {
        if (this.autoplayInterval) {
            this.interval = setInterval(() => {
                if (this.page === this.totalPages - 1) {
                    this.setPage(0);
                } else {
                    this.setPage(this.page + 1);
                }
            }, this.autoplayInterval);
        }
    }

    stopAutoplay() {
        if (this.autoplayInterval && this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
    }

    ngOnDestroy() {
        if (this.documentResponsiveListener) {
            this.documentResponsiveListener();
        }

        if (this.autoplayInterval) {
            this.stopAutoplay();
        }
    }
}

@NgModule({
    imports: [CommonModule, SharedModule],
    exports: [Carousel, SharedModule],
    declarations: [Carousel]
})
export class CarouselModule {}
