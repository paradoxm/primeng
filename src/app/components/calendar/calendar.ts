import {
    NgModule,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    Input,
    Output,
    SimpleChange,
    EventEmitter,
    forwardRef,
    Renderer2,
    ViewChild,
    ChangeDetectorRef,
    TemplateRef,
    ContentChildren,
    QueryList,
} from '@angular/core';
import { trigger, state, style, transition, animate, AnimationEvent } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { ButtonModule } from '../button/button';
import { DomHandler } from '../dom/domhandler';
import { SharedModule, PrimeTemplate } from '../common/shared';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule } from '@angular/forms';
import { DropdownModule } from '../dropdown/dropdown';

export const CALENDAR_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => Calendar),
    multi: true,
};

export interface LocaleSettings {
    firstDayOfWeek?: number;
    dayNames: string[];
    dayNamesShort: string[];
    dayNamesMin: string[];
    monthNames: string[];
    monthNamesShort: string[];
    today: string;
    apply: string;
    clearSingle: string;
    clearPlural: string;
    dateFormat?: string;
    weekHeader?: string;
    yearOptions?: any[];
    monthOptions?: any[];
}

@Component({
    selector: 'p-calendar',
    template: `
        <span
            [ngClass]="{'ui-calendar':true, 'ui-calendar-w-btn': showIcon, 'ui-calendar-timeonly': timeOnly}"
            [ngStyle]="style" [class]="styleClass">
            <ng-template [ngIf]="!inline">
                <input #inputfield type="text" [attr.id]="inputId" [attr.name]="name"
                       [attr.required]="required" [value]="inputFieldValue"
                       (focus)="onInputFocus($event)" (keydown)="onInputKeydown($event)"
                       (click)="onInputClick($event)" (blur)="onInputBlur($event)"
                       [readonly]="readonlyInput" (input)="onUserInput($event)"
                       [ngStyle]="inputStyle" [class]="inputStyleClass"
                       [placeholder]="placeholder||''" [disabled]="disabled"
                       [attr.tabindex]="tabindex"
                       [ngClass]="'ui-inputtext ui-widget ui-state-default ui-corner-all ui-calendar-input'"
                       autocomplete="off"
                >
                <div (click)="onInputClick($event)"
                     [ngStyle]="inputStyle"
                     [class]="inputStyleClass"
                     [ngClass]="'ui-calendar-value-container ui-widget ui-state-default ui-corner-all'"
                ><ng-content select="[inputSvgIcon]"></ng-content>{{inputFieldValue || placeholder || ''}}</div>
                <button type="button" [icon]="icon" pButton *ngIf="showIcon"
                         (click)="onButtonClick($event,inputfield)"
                         class="ui-datepicker-trigger ui-calendar-button"
                         [ngClass]="{'ui-state-disabled':disabled}" [disabled]="disabled"
                         tabindex="-1"></button>
            </ng-template>
            <div [class]="panelStyleClass" [ngStyle]="panelStyle" [ngClass]="{'ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all': true, 'ui-datepicker-inline':inline,'ui-shadow':!inline,
                'ui-state-disabled':disabled,'ui-datepicker-timeonly':timeOnly,'ui-datepicker-multiple-month': this.numberOfMonths > 1, 'ui-datepicker-monthpicker': (view === 'month'), 'ui-datepicker-touch-ui': touchUI}"
                 [@overlayAnimation]="touchUI ? {value: 'visibleTouchUI', params: {showTransitionParams: showTransitionOptions, hideTransitionParams: hideTransitionOptions}}:
                                            {value: 'visible', params: {showTransitionParams: showTransitionOptions, hideTransitionParams: hideTransitionOptions}}"
                 [@.disabled]="inline === true"
                 (@overlayAnimation.start)="onOverlayAnimationStart($event)"
                 (@overlayAnimation.done)="onOverlayAnimationDone($event)"
                 *ngIf="inline || overlayVisible">
                 <div class="ui-datepicker-arrow"></div>
                 <div class="ui-datepicker-line"></div>
                <ng-container *ngIf="!timeOnly">
                    <div class="ui-datepicker-group ui-widget-content"
                         *ngFor="let month of months; let i = index;">
                        <div
                            class="ui-datepicker-header ui-widget-header ui-helper-clearfix ui-corner-all">
                            <ng-content select="p-header"></ng-content>
                            <a class="ui-datepicker-prev ui-corner-all"
                               (click)="navBackward($event)" *ngIf="i === 0">
                                <span class="ui-datepicker-prev-icon pi pi-chevron-left"><ng-content select="[prevSvgIcon]"></ng-content></span>
                            </a>
                            <a class="ui-datepicker-next ui-corner-all" (click)="navForward($event)"
                               *ngIf="numberOfMonths === 1 ? true : (i === numberOfMonths -1)">
                                <span class="ui-datepicker-next-icon pi pi-chevron-right"><ng-content select="[nextSvgIcon]"></ng-content></span>
                            </a>
                            <div class="ui-datepicker-title">
                                <span class="ui-datepicker-month"
                                      *ngIf="!monthNavigator && (view !== 'month')">{{locale.monthNames[month.month]}}</span>
                                <span class="ui-datepicker-year"
                                      *ngIf="!yearNavigator">{{view === 'month' ? currentYear : month.year}}</span>

                                <div class="ui-datepicker-dropdowns">
                                    <p-dropdown class="ui-datepicker-month-dropdown"
                                                *ngIf="monthNavigator && (view !== 'month')"
                                                [(ngModel)]="months[i].month"
                                                dataKey="value"
                                                idKey="value"
                                                [options]="locale.monthOptions"
                                                (onChange)="onMonthDropdownChange($event.value, i)"
                                    >

                                        <ng-template let-template pTemplate="listWrapper"
                                                     *ngIf="monthListWrapperTemplate">
                                            <ng-container
                                                *ngTemplateOutlet="monthListWrapperTemplate; context: { $implicit: template }">
                                                <ng-container
                                                    *ngTemplateOutlet="template"></ng-container>
                                            </ng-container>
                                        </ng-template>

                                        <ng-template let-item pTemplate="selectedItem">
                                            <span
                                                class="ui-datepicker-month-item">{{item.label}}</span>
                                        </ng-template>
                                    </p-dropdown>
                                    <p-dropdown class="ui-datepicker-year-dropdown"
                                                *ngIf="yearNavigator"
                                                [(ngModel)]="months[i].year"
                                                dataKey="value"
                                                idKey="value"
                                                [options]="locale.yearOptions"
                                                (onChange)="onYearDropdownChange($event.value, i)"
                                    >
                                        <ng-template let-template pTemplate="listWrapper"
                                                     *ngIf="yearListWrapperTemplate">
                                            <ng-container
                                                *ngTemplateOutlet="yearListWrapperTemplate; context: { $implicit: template }">
                                                <ng-container
                                                    *ngTemplateOutlet="template"></ng-container>
                                            </ng-container>
                                        </ng-template>

                                        <ng-template let-item pTemplate="selectedItem">
                                            <span
                                                class="ui-datepicker-year-item">{{item.label}}</span>
                                        </ng-template>
                                    </p-dropdown>
                                </div>
                            </div>
                        </div>
                        <div class="ui-datepicker-calendar-container" *ngIf="view ==='date'">
                            <table class="ui-datepicker-calendar">
                                <thead>
                                    <tr>
                                        <th *ngIf="showWeek" class="ui-datepicker-weekheader">
                                            <span>{{locale['weekHeader']}}</span>
                                        </th>
                                        <th scope="col"
                                            *ngFor="let weekDay of weekDays;let begin = first; let end = last">
                                            <span>{{weekDay}}</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr *ngFor="let week of month.dates; let i = index;">
                                        <td *ngIf="showWeek"
                                            class="ui-datepicker-weeknumber ui-state-disabled">
                                            <span>
                                                {{month.weekNumbers[i]}}
                                            </span>
                                        </td>
                                        <td *ngFor="let date of week" [ngClass]="{
                                            'ui-datepicker-other-month': date.otherMonth,
                                            'ui-datepicker-current-day':isSelected(date),
                                            'ui-datepicker-range-day': inSelectedRange(date),
                                            'ui-datepicker-start-current-day':isStartSelected(date),
                                            'ui-datepicker-first-current-day':isFirstSelected(date),
                                            'ui-datepicker-last-current-day':isLastSelected(date),
                                            'ui-datepicker-today':date.today
                                            }">
                                            <ng-container
                                                *ngIf="date.otherMonth ? showOtherMonths : true">
                                                <a class="ui-state-default" *ngIf="date.selectable"
                                                   [ngClass]="{'ui-state-active':isSelected(date), 'ui-state-highlight':date.today}"
                                                   (click)="onDateSelect($event,date)"
                                                   draggable="false">
                                                    <ng-container
                                                        *ngIf="!dateTemplate">{{date.day}}</ng-container>
                                                    <ng-container
                                                        *ngTemplateOutlet="dateTemplate; context: {$implicit: date}"></ng-container>
                                                </a>
                                                <span class="ui-state-default ui-state-disabled"
                                                      [ngClass]="{'ui-state-active':isSelected(date), 'ui-state-highlight':date.today}"
                                                      *ngIf="!date.selectable">
                                                    {{date.day}}
                                                </span>
                                            </ng-container>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="ui-monthpicker" *ngIf="view === 'month'">
                        <a tabindex="0" *ngFor="let m of monthPickerValues; let i = index"
                           (click)="onMonthSelect($event, i)" class="ui-monthpicker-month"
                           [ngClass]="{'ui-state-active': isMonthSelected(i)}">
                            {{m}}
                        </a>
                    </div>
                </ng-container>
                <div class="ui-timepicker-group" *ngIf="showTime||timeOnly">
                    <div *ngIf="showTime" class="ui-timepicker-addtime">
                        <label>
                            <input type="checkbox" [(ngModel)]="showAddTime">
                            <span>Add time</span>
                        </label>
                    </div>
                    <div class="ui-timepicker ui-widget-header" *ngIf="showTime||timeOnly">
                    <div *ngIf="timeOnly || (showTime && showAddTime)">
                        <div class="ui-hour-picker">
                            <a tabindex="0" (mousedown)="onTimePickerElementMouseDown($event, 0, 1)"
                               (mouseup)="onTimePickerElementMouseUp($event)">
                                <span class="pi pi-chevron-up"></span>
                            </a>
                            <span
                                [ngStyle]="{'display': currentHour < 10 ? 'inline': 'none'}">0</span><span>{{currentHour}}</span>
                            <a tabindex="0"
                               (mousedown)="onTimePickerElementMouseDown($event, 0, -1)"
                               (mouseup)="onTimePickerElementMouseUp($event)">
                                <span class="pi pi-chevron-down"></span>
                            </a>
                        </div>
                        <div class="ui-separator">
                            <a tabindex="0">
                                <span class="pi pi-chevron-up"></span>
                            </a>
                            <span>{{timeSeparator}}</span>
                            <a tabindex="0">
                                <span class="pi pi-chevron-down"></span>
                            </a>
                        </div>
                        <div class="ui-minute-picker">
                            <a tabindex="0" (mousedown)="onTimePickerElementMouseDown($event, 1, 1)"
                               (mouseup)="onTimePickerElementMouseUp($event)">
                                <span class="pi pi-chevron-up"></span>
                            </a>
                            <span
                                [ngStyle]="{'display': currentMinute < 10 ? 'inline': 'none'}">0</span><span>{{currentMinute}}</span>
                            <a tabindex="0"
                               (mousedown)="onTimePickerElementMouseDown($event, 1, -1)"
                               (mouseup)="onTimePickerElementMouseUp($event)">
                                <span class="pi pi-chevron-down"></span>
                            </a>
                        </div>
                        <div class="ui-separator" *ngIf="showSeconds">
                            <a tabindex="0">
                                <span class="pi pi-chevron-up"></span>
                            </a>
                            <span>{{timeSeparator}}</span>
                            <a tabindex="0">
                                <span class="pi pi-chevron-down"></span>
                            </a>
                        </div>
                        <div class="ui-second-picker" *ngIf="showSeconds">
                            <a tabindex="0" (mousedown)="onTimePickerElementMouseDown($event, 2, 1)"
                               (mouseup)="onTimePickerElementMouseUp($event)">
                                <span class="pi pi-chevron-up"></span>
                            </a>
                            <span
                                [ngStyle]="{'display': currentSecond < 10 ? 'inline': 'none'}">0</span><span>{{currentSecond}}</span>
                            <a tabindex="0"
                               (mousedown)="onTimePickerElementMouseDown($event, 2, -1)"
                               (mouseup)="onTimePickerElementMouseUp($event)">
                                <span class="pi pi-chevron-down"></span>
                            </a>
                        </div>
                        <div class="ui-ampm-picker" *ngIf="hourFormat=='12'">
                            <a tabindex="0" (click)="toggleAMPM($event)">
                                <span class="pi pi-chevron-up"></span>
                            </a>
                            <span>{{pm ? 'PM' : 'AM'}}</span>
                            <a tabindex="0" (click)="toggleAMPM($event)">
                                <span class="pi pi-chevron-down"></span>
                            </a>
                        </div>
                    </div>
                </div>
                </div>
                <div class="ui-datepicker-buttonbar ui-widget-header" *ngIf="showButtonBar">
                    <div class="ui-g">
                        <div [ngClass]="{'ui-g-6': selectionMode !== 'range', 'ui-g-4': selectionMode === 'range' }">
                            <button type="button" class="ui-clear-button" [label]="localeClear"
                                    (click)="onClearButtonClick($event)" pButton
                                    [ngClass]="[clearButtonStyleClass]"></button>
                        </div>
                        <div [ngClass]="{'ui-g-6': selectionMode !== 'range', 'ui-g-4': selectionMode === 'range' }">
                            <button type="button" class="ui-today-button" [label]="_locale.today"
                                    (click)="onTodayButtonClick($event)" pButton
                                    [ngClass]="[todayButtonStyleClass]"></button>
                        </div>
                        <div *ngIf="selectionMode === 'range'" class="ui-g-4">
                            <button type="button" class="ui-apply-button" [label]="_locale.apply"
                                    (click)="onApplyButtonClick($event)" pButton
                                    [ngClass]="[todayButtonStyleClass]"></button>
                        </div>
                    </div>
                </div>
                <ng-content select="p-footer"></ng-content>
            </div>
        </span>

    `,
    animations: [
        trigger('overlayAnimation', [
            state('visible', style({
                transform: 'translateY(0)',
                opacity: 1,
            })),
            state('visibleTouchUI', style({
                transform: 'translate(-50%,-50%)',
                opacity: 1,
            })),
            transition('void => visible', [
                style({ transform: 'translateY(5%)', opacity: 0 }),
                animate('{{showTransitionParams}}'),
            ]),
            transition('visible => void', [
                animate(('{{hideTransitionParams}}'),
                    style({
                        opacity: 0,
                        transform: 'translateY(5%)',
                    })),
            ]),
            transition('void => visibleTouchUI', [
                style({ opacity: 0, transform: 'translate3d(-50%, -40%, 0) scale(0.9)' }),
                animate('{{showTransitionParams}}'),
            ]),
            transition('visibleTouchUI => void', [
                animate(('{{hideTransitionParams}}'),
                    style({
                        opacity: 0,
                        transform: 'translate3d(-50%, -40%, 0) scale(0.9)',
                    })),
            ]),
        ]),
    ],
    host: {
        '[class.ui-inputwrapper-filled]': 'filled',
        '[class.ui-inputwrapper-focus]': 'focus',
        '[class.ui-inputwrapper-opened]': 'overlayVisible',
    },
    providers: [CALENDAR_VALUE_ACCESSOR],
})
export class Calendar implements OnInit, OnDestroy, ControlValueAccessor {
    @Input() defaultDate: Date;

    @Input() style: any;

    @Input() styleClass: string;

    @Input() inputStyle: any;

    @Input() inputId: string;

    @Input() name: string;

    @Input() inputStyleClass: string;

    @Input() placeholder: string;

    @Input() disabled: any;

    @Input() dateFormat: string = 'mm/dd/yy';

    @Input() inline: boolean = false;

    @Input() showOtherMonths: boolean = true;

    @Input() selectOtherMonths: boolean;

    @Input() showIcon: boolean;

    @Input() icon: string = 'pi pi-calendar';

    @Input() appendTo: any;

    @Input() possitionElement: any;

    @Input() readonlyInput: boolean;

    @Input() shortYearCutoff: any = '+10';

    @Input() monthNavigator: boolean;

    @Input() yearNavigator: boolean;

    @Input() hourFormat: string = '24';

    @Input() timeOnly: boolean;

    @Input() stepHour: number = 1;

    @Input() stepMinute: number = 1;

    @Input() stepSecond: number = 1;

    @Input() showSeconds: boolean = false;

    @Input() required: boolean;

    @Input() showOnFocus: boolean = true;

    @Input() showWeek: boolean = false;

    @Input() dataType: string = 'date';

    @Input() selectionMode: string = 'single';

    @Input() maxDateCount: number;

    @Input() showButtonBar: boolean;

    @Input() todayButtonStyleClass: string = 'ui-button-secondary';

    @Input() clearButtonStyleClass: string = 'ui-button-secondary';

    @Input() autoZIndex: boolean = true;

    @Input() baseZIndex: number = 0;

    @Input() panelStyleClass: string;

    @Input() panelStyle: any;

    @Input() keepInvalid: boolean = false;

    @Input() hideOnDateTimeSelect: boolean = false;

    @Input() numberOfMonths: number = 1;

    @Input() view: string = 'date';

    @Input() touchUI: boolean;

    @Input() timeSeparator: string = ":";

    @Input() showTransitionOptions: string = '225ms ease-out';

    @Input() hideTransitionOptions: string = '195ms ease-in';

    @Output() onFocus: EventEmitter<any> = new EventEmitter();

    @Output() onBlur: EventEmitter<any> = new EventEmitter();

    @Output() onShow: EventEmitter<any> = new EventEmitter();

    @Output() onClose: EventEmitter<any> = new EventEmitter();

    @Output() onSelect: EventEmitter<any> = new EventEmitter();

    @Output() onInput: EventEmitter<any> = new EventEmitter();

    @Output() onTodayClick: EventEmitter<any> = new EventEmitter();

    @Output() onClearClick: EventEmitter<any> = new EventEmitter();

    @Output() onMonthChange: EventEmitter<any> = new EventEmitter();

    @Output() onYearChange: EventEmitter<any> = new EventEmitter();

    @ContentChildren(PrimeTemplate) templates: QueryList<any>;

    monthListWrapperTemplate: TemplateRef<any>;
    yearListWrapperTemplate: TemplateRef<any>;

    availableRange: Date[] = [null, null];

    _locale: LocaleSettings = {
        firstDayOfWeek: 0,
        dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        dayNamesMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
        monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        today: 'Select Today',
        apply: 'Apply',
        clearSingle: 'Clear Date',
        clearPlural: 'Clear Dates',
        dateFormat: 'mm/dd/yy',
        weekHeader: 'Wk',
        monthOptions: [
            { label: "January", value: 0 },
            { label: "February", value: 1 },
            { label: "March", value: 2 },
            { label: "April", value: 3 },
            { label: "May", value: 4 },
            { label: "June", value: 5 },
            { label: "July", value: 6 },
            { label: "August", value: 7 },
            { label: "September", value: 8 },
            { label: "October", value: 9 },
            { label: "November", value: 10 },
            { label: "December", value: 11 },
        ],
        yearOptions: [],
    };

    get localeClear(): string {
        return (!!this.value &&
            ((this.isMultipleSelection() && this.value.length > 1) ||
                (this.isRangeSelection() && this.value[0] < this.value[1])))
            ? this._locale.clearPlural
            : this._locale.clearSingle;
    }

    @Input() tabindex: number;

    @ViewChild('inputfield', { static: false }) inputfieldViewChild: ElementRef;

    private _utc: boolean;

    @Input() get utc(): boolean {
        return this._utc;
    }

    set utc(_utc: boolean) {
        this._utc = _utc;
    }

    value: any;

    dates: any[];

    months: any[];

    monthPickerValues: any[];

    weekDays: string[];

    currentMonth: number;

    currentYear: number;

    currentHour: number;

    currentMinute: number;

    currentSecond: number;

    pm: boolean;

    mask: HTMLDivElement;

    maskClickListener: Function;

    overlay: HTMLDivElement;

    arrow: HTMLDivElement;

    overlayVisible: boolean;

    onModelChange: Function = () => {
    };

    onModelTouched: Function = () => {
    };

    calendarElement: any;

    timePickerTimer: any;

    documentClickListener: any;

    ticksTo1970: number;

    yearOptions: number[];

    focus: boolean;

    isKeydown: boolean;

    filled: boolean;

    inputFieldValue: string = null;

    _minDate: Date;

    _maxDate: Date;

    _showTime: boolean;

    _showAddTime: boolean;

    _yearRange: string;

    preventDocumentListener: boolean;

    dateTemplate: TemplateRef<any>;

    _disabledDates: Array<Date>;

    _disabledDays: Array<number>;

    selectElement: any;

    todayElement: any;

    focusElement: any;

    documentResizeListener: any;

    @Input() get minDate(): Date {
        return this._minDate;
    }

    set minDate(date: Date) {
        this._minDate = date;

        if (this.currentMonth != undefined && this.currentMonth != null && this.currentYear) {
            this.createMonths(this.currentMonth, this.currentYear);
        }
    }

    @Input() get maxDate(): Date {
        return this._maxDate;
    }

    set maxDate(date: Date) {
        this._maxDate = date;

        if (this.currentMonth != undefined && this.currentMonth != null && this.currentYear) {
            this.createMonths(this.currentMonth, this.currentYear);
        }
    }

    @Input() get disabledDates(): Date[] {
        return this._disabledDates;
    }

    set disabledDates(disabledDates: Date[]) {
        if (disabledDates) {
            disabledDates.sort(function (a: Date, b: Date) {
                return a.getTime() - b.getTime();
            });
        }

        this._disabledDates = disabledDates;
        if (this.currentMonth != undefined && this.currentMonth != null && this.currentYear) {

            this.createMonths(this.currentMonth, this.currentYear);
        }
    }

    @Input() get disabledDays(): number[] {
        return this._disabledDays;
    }

    set disabledDays(disabledDays: number[]) {
        this._disabledDays = disabledDays;

        if (this.currentMonth != undefined && this.currentMonth != null && this.currentYear) {
            this.createMonths(this.currentMonth, this.currentYear);
        }
    }

    @Input() get yearRange(): string {
        return this._yearRange;
    }

    set yearRange(yearRange: string) {
        if (this.yearNavigator && yearRange) {
            const years = yearRange.split(':');
            const yearStart = parseInt(years[0]);
            const yearEnd = parseInt(years[1]);

            this.populateYearOptions(yearStart, yearEnd);
        }
    }

    @Input() get showAddTime(): boolean {
        return this._showAddTime;
    }

    set showAddTime(showAddTime: boolean) {
        this._showAddTime = showAddTime;
        if (this.value) {
            this.updateTime();
        }
    }

    @Input() get showTime(): boolean {
        return this._showTime;
    }

    set showTime(showTime: boolean) {
        this._showTime = showTime;

        if (this.currentHour === undefined) {
            this.initTime(this.value || new Date());
        }
        this.updateInputfield();
    }

    get locale() {
        return this._locale;
    }

    @Input()
    set locale(newLocale: LocaleSettings) {
        this._locale = newLocale;

        const months = [];
        const years = [];

        this._locale.monthNames.forEach((item, index) => {
            months.push({ value: index, label: item })
        });

        this._locale.yearOptions.forEach((item) => {
            years.push({ value: item, label: item })
        });


        this._locale.monthOptions = months;
        this._locale.yearOptions = years;
        this.yearRange = this._yearRange;

        if (this.view === 'date') {
            this.createWeekDays();
            this.createMonths(this.currentMonth, this.currentYear);
        } else if (this.view === 'month') {
            this.createMonthPickerValues();
        }
    }

    constructor(public el: ElementRef, public renderer: Renderer2, public cd: ChangeDetectorRef) {
    }

    ngOnInit() {
        const date = this.defaultDate || new Date();
        this.currentMonth = date.getMonth();
        this.currentYear = date.getFullYear();

        if (this.view === 'date') {
            this.createWeekDays();
            this.initTime(date);
            this.createMonths(this.currentMonth, this.currentYear);
            this.ticksTo1970 = (((1970 - 1) * 365 + Math.floor(1970 / 4) - Math.floor(1970 / 100) + Math.floor(1970 / 400)) * 24 * 60 * 60 * 10000000);
        } else if (this.view === 'month') {
            this.createMonthPickerValues();
        }
    }

    ngAfterContentInit() {
        this.templates.forEach((item) => {
            switch (item.getType()) {
                case 'date':
                    this.dateTemplate = item.template;
                    break;

                case 'monthListWrapper':
                    this.monthListWrapperTemplate = item.template;
                    break;

                case 'yearListWrapper':
                    this.yearListWrapperTemplate = item.template;
                    break;

                default:
                    this.dateTemplate = item.template;
                    break;
            }
        });
    }

    populateYearOptions(start, end) {
        this.yearOptions = [];
        const years = [];


        for (let i = start; i <= end; i++) {
            this.yearOptions.push(i);
            years.push({ value: i, label: i })
        }

        this._locale.yearOptions = years;
    }

    createWeekDays() {
        this.weekDays = [];
        let dayIndex = this.locale.firstDayOfWeek;
        for (let i = 0; i < 7; i++) {
            this.weekDays.push(this.locale.dayNamesMin[dayIndex]);
            dayIndex = (dayIndex == 6) ? 0 : ++dayIndex;
        }
    }

    createMonthPickerValues() {
        this.monthPickerValues = [];
        for (let i = 0; i <= 11; i++) {
            this.monthPickerValues.push(this.locale.monthNamesShort[i]);
        }
    }

    createMonths(month: number, year: number) {
        this.prepareAvailableRange();
        this.months = this.months = [];
        for (let i = 0; i < this.numberOfMonths; i++) {
            let m = month + i;
            let y = year;
            if (m > 11) {
                m = m % 11 - 1;
                y = year + 1;
            }

            this.months.push(this.createMonth(m, y));
        }
    }

    getWeekNumber(date: Date) {
        let checkDate = new Date(date.getTime());
        checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7));
        let time = checkDate.getTime();
        checkDate.setMonth(0);
        checkDate.setDate(1);
        return Math.floor(Math.round((time - checkDate.getTime()) / 86400000) / 7) + 1;
    }

    createMonth(month: number, year: number) {
        let dates = [];
        let firstDay = this.getFirstDayOfMonthIndex(month, year);
        let daysLength = this.getDaysCountInMonth(month, year);
        let prevMonthDaysLength = this.getDaysCountInPrevMonth(month, year);
        let dayNo = 1;
        let today = new Date();
        let weekNumbers = [];

        for (let i = 0; i < 6; i++) {
            let week = [];

            if (i == 0) {
                for (let j = (prevMonthDaysLength - firstDay + 1); j <= prevMonthDaysLength; j++) {
                    let prev = this.getPreviousMonthAndYear(month, year);
                    week.push({
                        day: j,
                        month: prev.month,
                        year: prev.year,
                        otherMonth: true,
                        today: this.isToday(today, j, prev.month, prev.year),
                        selectable: this.isSelectable(j, prev.month, prev.year, true),
                    });
                }

                let remainingDaysLength = 7 - week.length;
                for (let j = 0; j < remainingDaysLength; j++) {
                    week.push({
                        day: dayNo,
                        month: month,
                        year: year,
                        today: this.isToday(today, dayNo, month, year),
                        selectable: this.isSelectable(dayNo, month, year, false),
                    });
                    dayNo++;
                }
            } else {
                for (let j = 0; j < 7; j++) {
                    if (dayNo > daysLength) {
                        let next = this.getNextMonthAndYear(month, year);
                        week.push({
                            day: dayNo - daysLength,
                            month: next.month,
                            year: next.year,
                            otherMonth: true,
                            today: this.isToday(today, dayNo - daysLength, next.month, next.year),
                            selectable: this.isSelectable((dayNo - daysLength), next.month, next.year, true),
                        });
                    } else {
                        week.push({
                            day: dayNo,
                            month: month,
                            year: year,
                            today: this.isToday(today, dayNo, month, year),
                            selectable: this.isSelectable(dayNo, month, year, false),
                        });
                    }

                    dayNo++;
                }
            }

            if (this.showWeek) {
                weekNumbers.push(this.getWeekNumber(new Date(week[0].year, week[0].month, week[0].day)));
            }

            dates.push(week);
        }

        return {
            month: month,
            year: year,
            dates: dates,
            weekNumbers: weekNumbers,
        };
    }

    initTime(date: Date) {
        this.pm = date.getHours() > 11;

        if (this.showTime && this.showAddTime) {
            this.currentMinute = date.getMinutes();
            this.currentSecond = date.getSeconds();

            if (this.hourFormat == '12')
                this.currentHour = date.getHours() == 0 ? 12 : date.getHours() % 12;
            else
                this.currentHour = date.getHours();
        } else if (this.timeOnly) {
            this.currentMinute = 0;
            this.currentHour = 0;
            this.currentSecond = 0;
        }
    }

    navBackward(event) {
        if (this.disabled) {
            event.preventDefault();
            return;
        }

        if (this.view === 'month') {
            this.decrementYear();
        } else {
            if (this.currentMonth === 0) {
                this.currentMonth = 11;
                this.decrementYear();
            } else {
                this.currentMonth--;
            }

            this.onMonthChange.emit({ month: this.currentMonth + 1, year: this.currentYear });
            this.createMonths(this.currentMonth, this.currentYear);
        }
    }

    navForward(event) {
        if (this.disabled) {
            event.preventDefault();
            return;
        }

        if (this.view === 'month') {
            this.incrementYear();
        } else {
            if (this.currentMonth === 11) {
                this.currentMonth = 0;
                this.incrementYear();
            } else {
                this.currentMonth++;
            }

            this.onMonthChange.emit({ month: this.currentMonth + 1, year: this.currentYear });
            this.createMonths(this.currentMonth, this.currentYear);
        }
    }

    decrementYear() {
        this.currentYear--;

        if (this.yearNavigator && this.currentYear < this.yearOptions[0]) {
            let difference = this.yearOptions[this.yearOptions.length - 1] - this.yearOptions[0];
            this.populateYearOptions(this.yearOptions[0] - difference, this.yearOptions[this.yearOptions.length - 1] - difference);
        }
    }

    incrementYear() {
        this.currentYear++;

        if (this.yearNavigator && this.currentYear > this.yearOptions[this.yearOptions.length - 1]) {
            let difference = this.yearOptions[this.yearOptions.length - 1] - this.yearOptions[0];
            this.populateYearOptions(this.yearOptions[0] + difference, this.yearOptions[this.yearOptions.length - 1] + difference);
        }
    }

    onDateSelect(event, dateMeta) {
        if (this.disabled || !dateMeta.selectable) {
            event.preventDefault();
            return;
        }

        if (this.isMultipleSelection() && this.isSelected(dateMeta)) {
            this.value = this.value.filter((date, i) => {
                return !this.isDateEquals(date, dateMeta);
            });
            this.updateModel(this.value);
        } else {
            if (this.shouldSelectDate(dateMeta)) {
                if (dateMeta.otherMonth) {
                    this.currentMonth = dateMeta.month;
                    this.currentYear = dateMeta.year;
                    this.createMonths(this.currentMonth, this.currentYear);
                    this.selectDate(dateMeta);
                } else {
                    this.selectDate(dateMeta);
                }
            }
        }

        if (this.isSingleSelection() && (!this.showTime || this.hideOnDateTimeSelect)) {
            setTimeout(() => {
                event.preventDefault();
                this.hideOverlay();

                if (this.mask) {
                    this.disableModality();
                }

                this.cd.markForCheck();
            }, 150);
        }

        this.updateInputfield();
        setTimeout(() => {
            this.updateArrowPosition();
        }, 0);
        event.preventDefault();
    }

    shouldSelectDate(dateMeta) {
        if (this.isMultipleSelection())
            return this.maxDateCount != null ? this.maxDateCount > (this.value ? this.value.length : 0) : true;
        else
            return true;
    }

    onMonthSelect(event, index) {
        this.onDateSelect(event, {
            year: this.currentYear,
            month: index,
            day: 1,
            selectable: true,
        });
    }

    updateInputfield() {
        let formattedValue = '';

        if (this.value) {
            if (this.isSingleSelection()) {
                formattedValue = this.formatDateTime(this.value);
            } else if (this.isMultipleSelection()) {
                for (let i = 0; i < this.value.length; i++) {
                    let dateAsString = this.formatDateTime(this.value[i]);
                    formattedValue += dateAsString;
                    if (i !== (this.value.length - 1)) {
                        formattedValue += ', ';
                    }
                }
            } else if (this.isRangeSelection()) {
                if (this.value && this.value.length) {
                    let startDate = this.value[0];
                    let endDate = this.value[1];

                    formattedValue = this.formatDateTime(startDate);
                    if (endDate
                        && !(startDate.getDate() === endDate.getDate()
                             && startDate.getFullYear() === endDate.getFullYear()
                             && startDate.getMonth() === endDate.getMonth())) {
                        formattedValue += ' - ' + this.formatDateTime(endDate);
                    }
                }
            }
        }

        this.inputFieldValue = formattedValue;
        this.updateFilledState();
        if (this.inputfieldViewChild && this.inputfieldViewChild.nativeElement) {
            this.inputfieldViewChild.nativeElement.value = this.inputFieldValue;
        }
    }

    formatDateTime(date) {
        let formattedValue = null;
        if (date) {
            if (this.timeOnly) {
                formattedValue = this.formatTime(date);
            } else {
                formattedValue = this.formatDate(date, this.getDateFormat());
                if (this.showTime) {
                    formattedValue += ' ' + this.formatTime(date);
                }
            }
        }

        return formattedValue;
    }

    selectDate(dateMeta) {
        let date = new Date(dateMeta.year, dateMeta.month, dateMeta.day, 0, 0, 0);

        if (this.showTime && (this.timeOnly || (this.showAddTime && this.showTime))) {
            if (this.currentHour === 12)
                date.setHours(this.pm ? 12 : 0);
            else
                date.setHours(this.pm && this.currentHour <= 12 ? this.currentHour + 12 : this.currentHour);

            date.setMinutes(this.currentMinute);
            date.setSeconds(this.currentSecond);
        }

        if (this.minDate && this.minDate > date && (this.timeOnly || (this.showAddTime && this.showTime))) {
            date = this.minDate;
            this.currentHour = date.getHours();
            this.currentMinute = date.getMinutes();
            this.currentSecond = date.getSeconds();
        }

        if (this.maxDate && this.maxDate < date && (this.timeOnly || (this.showAddTime && this.showTime))) {
            date = this.maxDate;
            this.currentHour = date.getHours();
            this.currentMinute = date.getMinutes();
            this.currentSecond = date.getSeconds();
        }

        if (this.isSingleSelection()) {
            this.updateModel(date);
        } else if (this.isMultipleSelection()) {
            this.updateModel(this.value ? [...this.value, date] : [date]);
        } else if (this.isRangeSelection()) {
            if (this.value && this.value.length) {
                let startDate = this.value[0];
                let endDate = this.value[1];

                if (!endDate && date.getTime() >= startDate.getTime()) {
                    endDate = date;
                } else {
                    startDate = date;
                    endDate = null;
                }

                this.updateModel([startDate, endDate]);
            } else {
                this.updateModel([date, null]);
            }
        }

        this.onSelect.emit(date);
    }

    updateModel(value) {
        this.value = value;

        this.createMonths(this.currentMonth, this.currentYear);

        if (this.dataType == 'date') {
            this.onModelChange(this.value);
        } else if (this.dataType == 'string') {
            if (this.isSingleSelection()) {
                this.onModelChange(this.formatDateTime(this.value));
            } else {
                let stringArrValue = null;
                if (this.value) {
                    stringArrValue = this.value.map(date => this.formatDateTime(date));
                }
                this.onModelChange(stringArrValue);
            }
        }
    }

    getFirstDayOfMonthIndex(month: number, year: number) {
        let day = new Date();
        day.setDate(1);
        day.setMonth(month);
        day.setFullYear(year);

        let dayIndex = day.getDay() + this.getSundayIndex();
        return dayIndex >= 7 ? dayIndex - 7 : dayIndex;
    }

    getDaysCountInMonth(month: number, year: number) {
        return 32 - this.daylightSavingAdjust(new Date(year, month, 32)).getDate();
    }

    getDaysCountInPrevMonth(month: number, year: number) {
        let prev = this.getPreviousMonthAndYear(month, year);
        return this.getDaysCountInMonth(prev.month, prev.year);
    }

    getPreviousMonthAndYear(month: number, year: number) {
        let m, y;

        if (month === 0) {
            m = 11;
            y = year - 1;
        } else {
            m = month - 1;
            y = year;
        }

        return { 'month': m, 'year': y };
    }

    getNextMonthAndYear(month: number, year: number) {
        let m, y;

        if (month === 11) {
            m = 0;
            y = year + 1;
        } else {
            m = month + 1;
            y = year;
        }

        return { 'month': m, 'year': y };
    }

    getSundayIndex() {
        return this.locale.firstDayOfWeek > 0 ? 7 - this.locale.firstDayOfWeek : 0;
    }

    isSelected(dateMeta): boolean {
        if (this.value) {
            if (this.isSingleSelection()) {
                return this.isDateEquals(this.value, dateMeta);
            } else if (this.isMultipleSelection()) {
                let selected = false;
                for (let date of this.value) {
                    selected = this.isDateEquals(date, dateMeta);
                    if (selected) {
                        break;
                    }
                }

                return selected;
            } else if (this.isRangeSelection()) {
                if (this.value[1])
                    return this.isDateEquals(this.value[0], dateMeta) || this.isDateEquals(this.value[1], dateMeta) || this.isDateBetween(this.value[0], this.value[1], dateMeta);
                else
                    return this.isDateEquals(this.value[0], dateMeta)
            }
        } else {
            return false;
        }
    }

    inSelectedRange(dateMeta): boolean {
        return this.value && this.isRangeSelection() && this.value[0] && this.value[1] ? this.isDateInRange(this.value[0], this.value[1], dateMeta) : false;
    }

    isStartSelected(dateMeta): boolean {
        return this.value
        && this.isRangeSelection()
        && this.value[0]
        && (!this.value[1] || this.isDatesEquals(this.value[0], this.value[1])) ? this.isDateEquals(this.value[0], dateMeta) : false;
    }

    isFirstSelected(dateMeta): boolean {
        return this.value
        && this.isRangeSelection()
        && this.value[0]
        && this.value[1]
        && !this.isDatesEquals(this.value[0], this.value[1]) ? this.isDateEquals(this.value[0], dateMeta) : false;
    }

    isLastSelected(dateMeta): boolean {
        return this.value
        && this.isRangeSelection()
        && this.value[0]
        && this.value[1]
        && !this.isDatesEquals(this.value[0], this.value[1]) ? this.isDateEquals(this.value[1], dateMeta) : false;
    }

    isMonthSelected(month: number): boolean {
        return this.value ? (this.value.getMonth() === month && this.value.getFullYear() === this.currentYear) : false;
    }

    isDateEquals(value, dateMeta) {
        if (value)
            return value.getDate() === dateMeta.day && value.getMonth() === dateMeta.month && value.getFullYear() === dateMeta.year;
        else
            return false;
    }

    isDatesEquals(date1, date2) {
        if (date1 && date2)
            return date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
        else
            return false;
    }

    isDateInRange(start, end, dateMeta) {
        let between: boolean = false;
        if (start && end) {
            let date: Date = new Date(dateMeta.year, dateMeta.month, dateMeta.day);
            return start.getTime() < date.getTime() && end.getTime() > date.getTime();
        }

        return between;
    }

    isDateBetween(start, end, dateMeta) {
        let between: boolean = false;
        if (start && end) {
            let date: Date = new Date(dateMeta.year, dateMeta.month, dateMeta.day);
            return start.getTime() <= date.getTime() && end.getTime() >= date.getTime();
        }

        return between;
    }

    isSingleSelection(): boolean {
        return this.selectionMode === 'single';
    }

    isRangeSelection(): boolean {
        return this.selectionMode === 'range';
    }

    isMultipleSelection(): boolean {
        return this.selectionMode === 'multiple';
    }

    isToday(today, day, month, year): boolean {
        return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    }

    isSelectable(day, month, year, otherMonth): boolean {
        let validMin = true;
        let validMax = true;
        let validDate = true;
        let validDay = true;

        if (otherMonth && !this.selectOtherMonths) {
            return false;
        }

        if (this.minDate) {
            if (this.minDate.getFullYear() > year) {
                validMin = false;
            } else if (this.minDate.getFullYear() === year) {
                if (this.minDate.getMonth() > month) {
                    validMin = false;
                } else if (this.minDate.getMonth() === month) {
                    if (this.minDate.getDate() > day) {
                        validMin = false;
                    }
                }
            }
        }

        if (this.maxDate) {
            if (this.maxDate.getFullYear() < year) {
                validMax = false;
            } else if (this.maxDate.getFullYear() === year) {
                if (this.maxDate.getMonth() < month) {
                    validMax = false;
                } else if (this.maxDate.getMonth() === month) {
                    if (this.maxDate.getDate() < day) {
                        validMax = false;
                    }
                }
            }
        }

        if (this.disabledDates) {
            validDate = !this.isDateDisabled(day, month, year);
        }

        if (this.disabledDays) {
            validDay = !this.isDayDisabled(day, month, year)
        }

        return validMin && validMax && validDate && validDay;
    }

    prepareAvailableRange() {
        this.availableRange = [null, null];

        if (!this.disabledDates || this.selectionMode !== 'range' || !this.value || !this.value[0]) {
            return
        }

        for (let disabledDate of this.disabledDates) {
            if (disabledDate < this.value[0]) {
                this.availableRange[0] = disabledDate;
                this.availableRange[0].setHours(0);
                this.availableRange[0].setMinutes(0);
                this.availableRange[0].setSeconds(0);
                this.availableRange[0].setMilliseconds(0);
            }

            if (disabledDate > this.value[0]) {
                this.availableRange[1] = disabledDate;
                this.availableRange[1].setHours(0);
                this.availableRange[1].setMinutes(0);
                this.availableRange[1].setSeconds(0);
                this.availableRange[1].setMilliseconds(0);
                break;
            }
        }
    }

    isDateDisabled(day: number, month: number, year: number): boolean {
        if (!this.disabledDates) {
            return false;
        }

        if (this.selectionMode !== 'range' || !(this.availableRange[0] || this.availableRange[1])) {
            for (let disabledDate of this.disabledDates) {
                if (disabledDate.getFullYear() === year && disabledDate.getMonth() === month && disabledDate.getDate() === day) {
                    return true;
                }
            }
        } else {
            const date = new Date(year, month, day, 0, 0, 0);
            return (this.availableRange[0] && this.availableRange[0] >= date) || (this.availableRange[1] && this.availableRange[1] <= date)
        }

        return false;
    }

    isDayDisabled(day: number, month: number, year: number): boolean {
        if (this.disabledDays) {
            let weekday = new Date(year, month, day);
            let weekdayNumber = weekday.getDay();
            return this.disabledDays.indexOf(weekdayNumber) !== -1;
        }
        return false;
    }

    onInputFocus(event: Event) {
        this.focus = true;
        if (this.showOnFocus) {
            this.showOverlay();
        }
        this.onFocus.emit(event);
    }

    onInputClick(event: Event) {
        if (this.overlay && this.autoZIndex) {
            this.overlay.style.zIndex = String(this.baseZIndex + (++DomHandler.zindex));
        }
        if (this.showOnFocus && !this.overlayVisible) {
            this.showOverlay();
        }
    }

    onInputBlur(event: Event) {
        this.focus = false;
        this.onBlur.emit(event);
        if (!this.keepInvalid) {
            this.updateInputfield();
        }
        this.onModelTouched();
    }

    onButtonClick(event, inputfield) {
        if (!this.overlayVisible) {
            inputfield.focus();
            this.showOverlay();
        } else {
            this.hideOverlay();
        }
    }

    onInputKeydown(event) {
        this.isKeydown = true;
        if (event.keyCode === 9) {
            if (this.touchUI)
                this.disableModality();
            else
                this.hideOverlay();
        }
    }

    onMonthDropdownChange(m: string, i: number) {
        const currentMonth = parseInt(m) - i;
        if (currentMonth >= 0) {
            if (this.currentMonth + i > 11 && currentMonth + i <= 11) {
                this.currentYear += 1;
            }

            this.currentMonth = currentMonth;
        } else {
            if (this.currentMonth + i <= 11 && 12 + currentMonth + i > 11) {
                this.currentYear -= 1;
            }

            this.currentMonth = 12 + currentMonth;
        }

        this.onMonthChange.emit({ month: this.currentMonth + 1, year: this.currentYear });
        this.createMonths(this.currentMonth, this.currentYear);
    }

    onYearDropdownChange(y: string, i: number) {
        let currentYear = parseInt(y);
        const currentMonth = this.months[i].month;
        if (currentMonth - i < 0) {
            currentYear -= 1;
        }

        this.currentYear = currentYear;

        this.onYearChange.emit({ month: this.currentMonth + 1, year: this.currentYear });
        this.createMonths(this.currentMonth, this.currentYear);
    }


    incrementHour(event) {
        const prevHour = this.currentHour;
        const newHour = this.currentHour + this.stepHour;

        if (this.validateHour(newHour)) {
            if (this.hourFormat == '24')
                this.currentHour = (newHour >= 24) ? (newHour - 24) : newHour;
            else if (this.hourFormat == '12') {
                // Before the AM/PM break, now after
                if (prevHour < 12 && newHour > 11) {
                    this.pm = !this.pm;
                }

                this.currentHour = (newHour >= 13) ? (newHour - 12) : newHour;
            }
        }
        event.preventDefault();
    }

    onTimePickerElementMouseDown(event: Event, type: number, direction: number) {
        if (!this.disabled) {
            this.repeat(event, null, type, direction);
            event.preventDefault();
        }
    }

    onTimePickerElementMouseUp(event: Event) {
        if (!this.disabled) {
            this.clearTimePickerTimer();
            this.updateTime();
        }
    }

    repeat(event: Event, interval: number, type: number, direction: number) {
        let i = interval || 500;

        this.clearTimePickerTimer();
        this.timePickerTimer = setTimeout(() => {
            this.repeat(event, 100, type, direction);
        }, i);

        switch (type) {
            case 0:
                if (direction === 1)
                    this.incrementHour(event);
                else
                    this.decrementHour(event);
                break;

            case 1:
                if (direction === 1)
                    this.incrementMinute(event);
                else
                    this.decrementMinute(event);
                break;

            case 2:
                if (direction === 1)
                    this.incrementSecond(event);
                else
                    this.decrementSecond(event);
                break;
        }

        this.updateInputfield();
    }

    clearTimePickerTimer() {
        if (this.timePickerTimer) {
            clearInterval(this.timePickerTimer);
        }
    }

    decrementHour(event) {
        const newHour = this.currentHour - this.stepHour;

        if (this.validateHour(newHour)) {
            if (this.hourFormat == '24')
                this.currentHour = (newHour < 0) ? (24 + newHour) : newHour;
            else if (this.hourFormat == '12') {
                // If we were at noon/midnight, then switch
                if (this.currentHour === 12) {
                    this.pm = !this.pm;
                }
                this.currentHour = (newHour <= 0) ? (12 + newHour) : newHour;
            }
        }

        event.preventDefault();
    }

    validateHour(hour): boolean {
        let valid: boolean = true;
        let value = this.value;
        if (this.isRangeSelection()) {
            value = this.value[1] || this.value[0];
        }
        if (this.isMultipleSelection()) {
            value = this.value[this.value.length - 1];
        }
        let valueDateString = value ? value.toDateString() : null;

        if (this.minDate && valueDateString && this.minDate.toDateString() === valueDateString) {
            if (this.minDate.getHours() > hour) {
                valid = false;
            }
        }

        if (this.maxDate && valueDateString && this.maxDate.toDateString() === valueDateString) {
            if (this.maxDate.getHours() < hour) {
                valid = false;
            }
        }

        return valid;
    }

    incrementMinute(event) {
        let newMinute = this.currentMinute + this.stepMinute;
        if (this.validateMinute(newMinute)) {
            this.currentMinute = (newMinute > 59) ? newMinute - 60 : newMinute;
        }

        event.preventDefault();
    }

    decrementMinute(event) {
        let newMinute = this.currentMinute - this.stepMinute;
        newMinute = (newMinute < 0) ? 60 + newMinute : newMinute;
        if (this.validateMinute(newMinute)) {
            this.currentMinute = newMinute;
        }

        event.preventDefault();
    }

    validateMinute(minute): boolean {
        let valid: boolean = true;
        let value = this.value;
        if (this.isRangeSelection()) {
            value = this.value[1] || this.value[0];
        }
        if (this.isMultipleSelection()) {
            value = this.value[this.value.length - 1];
        }
        let valueDateString = value ? value.toDateString() : null;
        if (this.minDate && valueDateString && this.minDate.toDateString() === valueDateString) {
            if (value.getHours() == this.minDate.getHours()) {
                if (this.minDate.getMinutes() > minute) {
                    valid = false;
                }
            }
        }

        if (this.maxDate && valueDateString && this.maxDate.toDateString() === valueDateString) {
            if (value.getHours() == this.maxDate.getHours()) {
                if (this.maxDate.getMinutes() < minute) {
                    valid = false;
                }
            }
        }

        return valid;
    }

    incrementSecond(event) {
        let newSecond = this.currentSecond + this.stepSecond;
        if (this.validateSecond(newSecond)) {
            this.currentSecond = (newSecond > 59) ? newSecond - 60 : newSecond;
        }

        event.preventDefault();
    }

    decrementSecond(event) {
        let newSecond = this.currentSecond - this.stepSecond;
        newSecond = (newSecond < 0) ? 60 + newSecond : newSecond;
        if (this.validateSecond(newSecond)) {
            this.currentSecond = newSecond;
        }

        event.preventDefault();
    }

    validateSecond(second): boolean {
        let valid: boolean = true;
        let value = this.value;
        if (this.isRangeSelection()) {
            value = this.value[1] || this.value[0];
        }
        if (this.isMultipleSelection()) {
            value = this.value[this.value.length - 1];
        }
        let valueDateString = value ? value.toDateString() : null;

        if (this.minDate && valueDateString && this.minDate.toDateString() === valueDateString) {
            if (this.minDate.getSeconds() > second) {
                valid = false;
            }
        }

        if (this.maxDate && valueDateString && this.maxDate.toDateString() === valueDateString) {
            if (this.maxDate.getSeconds() < second) {
                valid = false;
            }
        }

        return valid;
    }

    updateTime() {
        let value = this.value;
        if (this.isRangeSelection()) {
            value = this.value[1] || this.value[0];
        }
        if (this.isMultipleSelection()) {
            value = this.value[this.value.length - 1];
        }
        value = value ? new Date(value.getTime()) : new Date();

        if (this.timeOnly || (this.showTime && this.showAddTime)) {
            if (this.hourFormat == '12') {
                if (this.currentHour === 12)
                    value.setHours(this.pm ? 12 : 0);
                else
                    value.setHours(this.pm && this.currentHour <= 12 ? this.currentHour + 12 : this.currentHour);
            } else {
                value.setHours(this.currentHour);
            }

            value.setMinutes(this.currentMinute);
            value.setSeconds(this.currentSecond);
        } else {
            value.setHours(0);
            value.setMinutes(0);
            value.setSeconds(0);
        }

        if (this.isRangeSelection()) {
            if (this.value[1])
                value = [this.value[0], value];
            else
                value = [value, null];
        }

        if (this.isMultipleSelection()) {
            value = [...this.value.slice(0, -1), value];
        }

        this.updateModel(value);
        this.onSelect.emit(value);
        this.updateInputfield();
    }

    toggleAMPM(event) {
        this.pm = !this.pm;
        this.updateTime();
        event.preventDefault();
    }

    onUserInput(event) {
        // IE 11 Workaround for input placeholder : https://github.com/primefaces/primeng/issues/2026
        if (!this.isKeydown) {
            return;
        }
        this.isKeydown = false;

        let val = event.target.value;
        try {
            let value = this.parseValueFromString(val);
            if (this.isValidSelection(value)) {
                this.updateModel(value);
                this.updateUI();
            }
        } catch (err) {
            //invalid date
        }

        this.filled = val != null && val.length;
        this.onInput.emit(event);
    }

    isValidSelection(value): boolean {
        let isValid = true;
        if (this.isSingleSelection()) {
            if (!this.isSelectable(value.getDate(), value.getMonth(), value.getFullYear(), false)) {
                isValid = false;
            }
        } else if (value.every(v => this.isSelectable(v.getDate(), v.getMonth(), v.getFullYear(), false))) {
            if (this.isRangeSelection()) {
                isValid = value.length > 1 && value[1] > value[0] ? true : false;
            }
        }
        return isValid;
    }

    parseValueFromString(text: string): Date | Date[] {
        if (!text || text.trim().length === 0) {
            return null;
        }

        let value: any;

        if (this.isSingleSelection()) {
            value = this.parseDateTime(text);
        } else if (this.isMultipleSelection()) {
            let tokens = text.split(',');
            value = [];
            for (let token of tokens) {
                value.push(this.parseDateTime(token.trim()));
            }
        } else if (this.isRangeSelection()) {
            let tokens = text.split(' - ');
            value = [];
            for (let i = 0; i < tokens.length; i++) {
                value[i] = this.parseDateTime(tokens[i].trim());
            }
        }

        return value;
    }

    parseDateTime(text): Date {
        let date: Date;
        let parts: string[] = text.split(' ');

        if (this.timeOnly) {
            date = new Date();
            this.populateTime(date, parts[0], parts[1]);
        } else {
            const dateFormat = this.getDateFormat();
            if (this.showTime) {
                date = this.parseDate(parts[0], dateFormat);
                this.populateTime(date, parts[1], parts[2]);
            } else {
                date = this.parseDate(text, dateFormat);
            }
        }

        return date;
    }

    populateTime(value, timeString, ampm) {
        if (this.hourFormat == '12' && !ampm) {
            throw 'Invalid Time';
        }

        this.pm = (ampm === 'PM' || ampm === 'pm');
        let time = this.parseTime(timeString);
        value.setHours(time.hour);
        value.setMinutes(time.minute);
        value.setSeconds(time.second);
    }

    updateUI() {
        let val = this.value || this.defaultDate || new Date();
        if (Array.isArray(val)) {
            val = val[0];
        }

        this.currentMonth = val.getMonth();
        this.currentYear = val.getFullYear();
        this.createMonths(this.currentMonth, this.currentYear);

        if (this.showTime || this.timeOnly) {
            let hours = val.getHours();

            if (this.hourFormat == '12') {
                this.pm = hours > 11;

                if (hours >= 12) {
                    this.currentHour = (hours == 12) ? 12 : hours - 12;
                } else {
                    this.currentHour = (hours == 0) ? 12 : hours;
                }
            } else {
                this.currentHour = val.getHours();
            }

            this.currentMinute = val.getMinutes();
            this.currentSecond = val.getSeconds();
        }
    }

    updateArrowPosition() {
        if (this.inline) {
            return;
        }

        let targetToAttach = this.inputfieldViewChild.nativeElement
        let parentElement = this.inputfieldViewChild.nativeElement.parentElement;

        // distance from right side of input to calendar icon
        let iconPosition = 18;

        if (this.possitionElement) {
            targetToAttach = this.possitionElement;
            parentElement = this.possitionElement;
        }

        DomHandler.absolutePosition(this.overlay, targetToAttach);

        let parentElementCoords = parentElement.getBoundingClientRect();
        let overlayCoords = this.overlay.getBoundingClientRect()

        let arrowLeftOffset = parentElementCoords.width
        if (this.overlay.classList.contains('ui-position-left')) {
            arrowLeftOffset = parentElementCoords.width - (parentElementCoords.width - overlayCoords.width)
        }

        // input wider than calendar width
        if (parentElementCoords.width > overlayCoords.width) {
            this.overlay.style.left = overlayCoords.left + (parentElementCoords.width - overlayCoords.width) + 'px'
            arrowLeftOffset = parentElementCoords.width - (parentElementCoords.width - overlayCoords.width)
        }

        this.arrow.style.left =
            arrowLeftOffset -
                this.arrow.getBoundingClientRect().width / 2 -
                iconPosition +
                'px';
    }

    showOverlay() {
        if (!this.overlayVisible) {
            this.updateUI();
            this.overlayVisible = true;
            this.onShow.emit(event);
        }
    }

    hideOverlay() {
        this.overlayVisible = false;

        if (this.touchUI) {
            this.disableModality();
        }
        this.onClose.emit(event);
    }

    onOverlayAnimationStart(event: AnimationEvent) {
        switch (event.toState) {
            case 'visible':
            case 'visibleTouchUI':
                if (!this.inline) {
                    this.overlay = event.element;
                    this.arrow = event.element.querySelector('.ui-datepicker-arrow')
                    this.appendOverlay();
                    if (this.autoZIndex) {
                        this.overlay.style.zIndex = String(this.baseZIndex + (++DomHandler.zindex));
                    }
                    this.alignOverlay();

                }
                break;

            case 'void':
                this.onOverlayHide();
                break;
        }
    }

    onOverlayAnimationDone(event: AnimationEvent) {
        switch (event.toState) {
            case 'visible':
            case 'visibleTouchUI':
                if (!this.inline) {
                    this.bindDocumentClickListener();
                    this.bindDocumentResizeListener();
                }
                break;
        }
    }

    appendOverlay() {
        if (this.appendTo) {
            if (this.appendTo === 'body')
                document.body.appendChild(this.overlay);
            else
                DomHandler.appendChild(this.overlay, this.appendTo);
        }
    }

    restoreOverlayAppend() {
        if (this.overlay && this.appendTo) {
            this.el.nativeElement.appendChild(this.overlay);
        }
    }

    alignOverlay() {
        if (this.touchUI) {
            this.enableModality(this.overlay);
        } else {
            if (this.appendTo){
                this.updateArrowPosition();
            } else {
                DomHandler.relativePosition(this.overlay, this.inputfieldViewChild.nativeElement);
            }
        }
    }

    enableModality(element) {
        if (!this.mask) {
            this.mask = document.createElement('div');
            this.mask.style.zIndex = String(parseInt(element.style.zIndex) - 1);
            let maskStyleClass = 'ui-widget-overlay ui-datepicker-mask ui-datepicker-mask-scrollblocker';
            DomHandler.addMultipleClasses(this.mask, maskStyleClass);

            this.maskClickListener = this.renderer.listen(this.mask, 'click', (event: any) => {
                this.disableModality();
            });
            document.body.appendChild(this.mask);
            DomHandler.addClass(document.body, 'ui-overflow-hidden');
        }
    }

    disableModality() {
        if (this.mask) {
            document.body.removeChild(this.mask);
            let bodyChildren = document.body.children;
            let hasBlockerMasks: boolean;
            for (let i = 0; i < bodyChildren.length; i++) {
                let bodyChild = bodyChildren[i];
                if (DomHandler.hasClass(bodyChild, 'ui-datepicker-mask-scrollblocker')) {
                    hasBlockerMasks = true;
                    break;
                }
            }

            if (!hasBlockerMasks) {
                DomHandler.removeClass(document.body, 'ui-overflow-hidden');
            }

            this.unbindMaskClickListener();

            this.mask = null;
        }
    }

    unbindMaskClickListener() {
        if (this.maskClickListener) {
            this.maskClickListener();
            this.maskClickListener = null;
        }
    }

    writeValue(value: any): void {
        this.value = value;
        if (this.value && typeof this.value === 'string') {
            this.value = this.parseValueFromString(this.value);
        }

        this.updateInputfield();
        this.updateUI();
    }

    registerOnChange(fn: Function): void {
        this.onModelChange = fn;
    }

    registerOnTouched(fn: Function): void {
        this.onModelTouched = fn;
    }

    setDisabledState(val: boolean): void {
        this.disabled = val;
    }

    getDateFormat() {
        return this.dateFormat || this.locale.dateFormat;
    }

    // Ported from jquery-ui datepicker formatDate
    formatDate(date, format) {
        if (!date) {
            return '';
        }

        let iFormat;
        const lookAhead = (match) => {
                const matches = (iFormat + 1 < format.length && format.charAt(iFormat + 1) === match);
                if (matches) {
                    iFormat++;
                }
                return matches;
            },
            formatNumber = (match, value, len) => {
                let num = '' + value;
                if (lookAhead(match)) {
                    while (num.length < len) {
                        num = '0' + num;
                    }
                }
                return num;
            },
            formatName = (match, value, shortNames, longNames) => {
                return (lookAhead(match) ? longNames[value] : shortNames[value]);
            };
        let output = '';
        let literal = false;

        if (date) {
            for (iFormat = 0; iFormat < format.length; iFormat++) {
                if (literal) {
                    if (format.charAt(iFormat) === '\'' && !lookAhead('\'')) {
                        literal = false;
                    } else {
                        output += format.charAt(iFormat);
                    }
                } else {
                    switch (format.charAt(iFormat)) {
                        case 'd':
                            output += formatNumber('d', date.getDate(), 2);
                            break;
                        case 'D':
                            output += formatName('D', date.getDay(), this.locale.dayNamesShort, this.locale.dayNames);
                            break;
                        case 'o':
                            output += formatNumber('o',
                                Math.round((
                                    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() -
                                    new Date(date.getFullYear(), 0, 0).getTime()) / 86400000), 3);
                            break;
                        case 'm':
                            output += formatNumber('m', date.getMonth() + 1, 2);
                            break;
                        case 'M':
                            output += formatName('M', date.getMonth(), this.locale.monthNamesShort, this.locale.monthNames);
                            break;
                        case 'y':
                            output += lookAhead('y') ? date.getFullYear() : (date.getFullYear() % 100 < 10 ? '0' : '') + (date.getFullYear() % 100);
                            break;
                        case '@':
                            output += date.getTime();
                            break;
                        case '!':
                            output += date.getTime() * 10000 + this.ticksTo1970;
                            break;
                        case '\'':
                            if (lookAhead('\'')) {
                                output += '\'';
                            } else {
                                literal = true;
                            }
                            break;
                        default:
                            output += format.charAt(iFormat);
                    }
                }
            }
        }
        return output;
    }

    formatTime(date) {
        if (!date) {
            return '';
        }

        let output = '';
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let seconds = date.getSeconds();

        if (this.hourFormat == '12' && hours > 11 && hours != 12) {
            hours -= 12;
        }

        if (this.hourFormat == '12') {
            output += hours === 0 ? 12 : (hours < 10) ? '0' + hours : hours;
        } else {
            output += (hours < 10) ? '0' + hours : hours;
        }
        output += ':';
        output += (minutes < 10) ? '0' + minutes : minutes;

        if (this.showSeconds) {
            output += ':';
            output += (seconds < 10) ? '0' + seconds : seconds;
        }

        if (this.hourFormat == '12') {
            output += date.getHours() > 11 ? ' PM' : ' AM';
        }

        return output;
    }

    parseTime(value) {
        let tokens: string[] = value.split(':');
        let validTokenLength = this.showSeconds ? 3 : 2;

        if (tokens.length !== validTokenLength) {
            throw "Invalid time";
        }

        let h = parseInt(tokens[0]);
        let m = parseInt(tokens[1]);
        let s = this.showSeconds ? parseInt(tokens[2]) : null;

        if (isNaN(h) || isNaN(m) || h > 23 || m > 59 || (this.hourFormat == '12' && h > 12) || (this.showSeconds && (isNaN(s) || s > 59))) {
            throw "Invalid time";
        } else {
            if (this.hourFormat == '12' && h !== 12 && this.pm) {
                h += 12;
            }

            return { hour: h, minute: m, second: s };
        }
    }

    // Ported from jquery-ui datepicker parseDate
    parseDate(value, format) {
        if (format == null || value == null) {
            throw "Invalid arguments";
        }

        value = (typeof value === "object" ? value.toString() : value + "");
        if (value === "") {
            return null;
        }

        let iFormat, dim, extra,
            iValue = 0,
            shortYearCutoff = (typeof this.shortYearCutoff !== "string" ? this.shortYearCutoff : new Date().getFullYear() % 100 + parseInt(this.shortYearCutoff, 10)),
            year = -1,
            month = -1,
            day = -1,
            doy = -1,
            literal = false,
            date,
            lookAhead = (match) => {
                let matches = (iFormat + 1 < format.length && format.charAt(iFormat + 1) === match);
                if (matches) {
                    iFormat++;
                }
                return matches;
            },
            getNumber = (match) => {
                let isDoubled = lookAhead(match),
                    size = (match === "@" ? 14 : (match === "!" ? 20 :
                        (match === "y" && isDoubled ? 4 : (match === "o" ? 3 : 2)))),
                    minSize = (match === "y" ? size : 1),
                    digits = new RegExp("^\\d{" + minSize + "," + size + "}"),
                    num = value.substring(iValue).match(digits);
                if (!num) {
                    throw "Missing number at position " + iValue;
                }
                iValue += num[0].length;
                return parseInt(num[0], 10);
            },
            getName = (match, shortNames, longNames) => {
                let index = -1;
                let arr = lookAhead(match) ? longNames : shortNames;
                let names = [];

                for (let i = 0; i < arr.length; i++) {
                    names.push([i, arr[i]]);
                }
                names.sort((a, b) => {
                    return -(a[1].length - b[1].length);
                });

                for (let i = 0; i < names.length; i++) {
                    let name = names[i][1];
                    if (value.substr(iValue, name.length).toLowerCase() === name.toLowerCase()) {
                        index = names[i][0];
                        iValue += name.length;
                        break;
                    }
                }

                if (index !== -1) {
                    return index + 1;
                } else {
                    throw "Unknown name at position " + iValue;
                }
            },
            checkLiteral = () => {
                if (value.charAt(iValue) !== format.charAt(iFormat)) {
                    throw "Unexpected literal at position " + iValue;
                }
                iValue++;
            };

        if (this.view === 'month') {
            day = 1;
        }

        for (iFormat = 0; iFormat < format.length; iFormat++) {
            if (literal) {
                if (format.charAt(iFormat) === "'" && !lookAhead("'")) {
                    literal = false;
                } else {
                    checkLiteral();
                }
            } else {
                switch (format.charAt(iFormat)) {
                    case "d":
                        day = getNumber("d");
                        break;
                    case "D":
                        getName("D", this.locale.dayNamesShort, this.locale.dayNames);
                        break;
                    case "o":
                        doy = getNumber("o");
                        break;
                    case "m":
                        month = getNumber("m");
                        break;
                    case "M":
                        month = getName("M", this.locale.monthNamesShort, this.locale.monthNames);
                        break;
                    case "y":
                        year = getNumber("y");
                        break;
                    case "@":
                        date = new Date(getNumber("@"));
                        year = date.getFullYear();
                        month = date.getMonth() + 1;
                        day = date.getDate();
                        break;
                    case "!":
                        date = new Date((getNumber("!") - this.ticksTo1970) / 10000);
                        year = date.getFullYear();
                        month = date.getMonth() + 1;
                        day = date.getDate();
                        break;
                    case "'":
                        if (lookAhead("'")) {
                            checkLiteral();
                        } else {
                            literal = true;
                        }
                        break;
                    default:
                        checkLiteral();
                }
            }
        }

        if (iValue < value.length) {
            extra = value.substr(iValue);
            if (!/^\s+/.test(extra)) {
                throw "Extra/unparsed characters found in date: " + extra;
            }
        }

        if (year === -1) {
            year = new Date().getFullYear();
        } else if (year < 100) {
            year += new Date().getFullYear() - new Date().getFullYear() % 100 +
                (year <= shortYearCutoff ? 0 : -100);
        }

        if (doy > -1) {
            month = 1;
            day = doy;
            do {
                dim = this.getDaysCountInMonth(year, month - 1);
                if (day <= dim) {
                    break;
                }
                month++;
                day -= dim;
            } while (true);
        }

        date = this.daylightSavingAdjust(new Date(year, month - 1, day));
        if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
            throw "Invalid date"; // E.g. 31/02/00
        }

        return date;
    }

    daylightSavingAdjust(date) {
        if (!date) {
            return null;
        }

        date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0);

        return date;
    }

    updateFilledState() {
        this.filled = this.inputFieldValue && this.inputFieldValue != '';
    }

    onTodayButtonClick(event) {
        let date: Date = new Date();
        let dateMeta = {
            day: date.getDate(),
            month: date.getMonth(),
            year: date.getFullYear(),
            otherMonth: date.getMonth() !== this.currentMonth || date.getFullYear() !== this.currentYear,
            today: true,
            selectable: true,
        };

        this.onDateSelect(event, dateMeta);
        this.onTodayClick.emit(event);
    }

    onApplyButtonClick(event) {
        this.hideOverlay();
    }

    onClearButtonClick(event) {
        this.updateModel(null);
        this.updateInputfield();

        this.onClearClick.emit(event);
    }

    bindDocumentClickListener() {
        if (!this.documentClickListener) {
            this.documentClickListener = this.renderer.listen('document', 'click', (event) => {
                if (this.isOutsideClicked(event) && this.overlayVisible) {
                    this.hideOverlay();
                }

                this.cd.detectChanges();
            });
        }
    }

    unbindDocumentClickListener() {
        if (this.documentClickListener) {
            this.documentClickListener();
            this.documentClickListener = null;
        }
    }

    bindDocumentResizeListener() {
        if (!this.documentResizeListener && !this.touchUI) {
            this.documentResizeListener = this.onWindowResize.bind(this);
            window.addEventListener('resize', this.documentResizeListener);
        }
    }

    unbindDocumentResizeListener() {
        if (this.documentResizeListener) {
            window.removeEventListener('resize', this.documentResizeListener);
            this.documentResizeListener = null;
        }
    }

    isOutsideClicked(event) {
        return !(this.el.nativeElement.isSameNode(event.target) || this.isNavIconClicked(event) ||
            !(!this.el.nativeElement.contains(event.target) && document.body.contains(<Node>event.target)) ||
            (this.overlay && this.overlay.contains(<Node>event.target)));
    }

    isNavIconClicked(event: Event) {
        return (DomHandler.hasClass(event.target, 'ui-datepicker-prev') || DomHandler.hasClass(event.target, 'ui-datepicker-prev-icon')
            || DomHandler.hasClass(event.target, 'ui-datepicker-next') || DomHandler.hasClass(event.target, 'ui-datepicker-next-icon'));
    }

    onWindowResize() {
        if (this.overlayVisible && !DomHandler.isAndroid()) {
            this.hideOverlay();
        }
    }

    onOverlayHide() {
        this.unbindDocumentClickListener();
        this.unbindMaskClickListener();
        this.unbindDocumentResizeListener();
        this.overlay = null;
    }

    ngOnDestroy() {
        this.restoreOverlayAppend();
        this.onOverlayHide();
    }
}

@NgModule({
    imports: [CommonModule, ButtonModule, SharedModule, DropdownModule, FormsModule],
    exports: [Calendar, ButtonModule, SharedModule],
    declarations: [Calendar],
})
export class CalendarModule {
}
