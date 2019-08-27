import {
    animate,
    AnimationEvent,
    state,
    style,
    transition,
    trigger
} from "@angular/animations";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { CommonModule } from "@angular/common";
import {
    AfterContentInit,
    AfterViewChecked,
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ContentChildren,
    ElementRef,
    EventEmitter,
    forwardRef,
    Input,
    NgModule,
    NgZone,
    OnDestroy,
    OnInit,
    Output,
    QueryList,
    Renderer2,
    TemplateRef,
    ViewChild
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { NgScrollbarModule } from "ngx-scrollbar";
import { SelectItem } from "../common/selectitem";
import { PrimeTemplate, SharedModule } from "../common/shared";
import { DomHandler } from "../dom/domhandler";
import { ObjectUtils } from "../utils/objectutils";

export const DROPDOWN_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => Dropdown),
    multi: true
};

@Component({
    selector: "p-dropdownItem",
    template: `
        <li
            role="option"
            [attr.aria-label]="option[optionLabel]"
            [ngStyle]="{ height: itemSize + 'px' }"
            [ngClass]="{
                'ui-dropdown-item ui-corner-all': true,
                'ui-state-highlight': selected,
                'ui-state-disabled': option.disabled,
                'ui-dropdown-item-empty':
                    !option[optionLabel] || option[optionLabel].length === 0
            }"
        >
            <div class="ui-dropdown-option" (click)="onOptionClick($event)">
                <span *ngIf="!template">
                    {{ option[optionLabel] || "empty" }}
                </span>
                <ng-container
                    *ngTemplateOutlet="template; context: { $implicit: option }"
                ></ng-container>
            </div>

            <ul
                class="ui-group-items"
                *ngIf="option[optionChildrenName]?.length"
            >
                <ng-content></ng-content>
            </ul>
        </li>
    `
})
export class DropdownItem {
    @Input() option: SelectItem;
    @Input() optionLabel = "label";
    @Input() optionChildrenName: string;

    @Input() selected: boolean;

    @Input() disabled: boolean;

    @Input() visible: boolean;

    @Input() itemSize: number;

    @Input() template: TemplateRef<any>;

    @Output() onClick: EventEmitter<any> = new EventEmitter();

    onOptionClick(event: Event) {
        if (!this.disabled) {
            this.onClick.emit({
                originalEvent: event,
                option: this.option
            });
        }
    }
}

@Component({
    selector: "p-dropdown",
    template: `
        <div
            #container
            [ngClass]="{
                'ui-dropdown ui-widget ui-state-default ui-corner-all ui-helper-clearfix': true,
                'ui-state-disabled': disabled,
                'ui-dropdown-open': overlayVisible,
                'ui-state-focus': focused,
                'ui-dropdown-clearable': showClear && !disabled
            }"
            (click)="onMouseclick($event)"
            [ngStyle]="style"
            [class]="styleClass"
        >
            <div class="ui-helper-hidden-accessible">
                <input
                    #in
                    [attr.id]="inputId"
                    type="text"
                    [attr.aria-label]="
                        selectedOption ? selectedOption[optionLabel] : ' '
                    "
                    readonly
                    (focus)="onInputFocus($event)"
                    aria-haspopup="listbox"
                    (blur)="onInputBlur($event)"
                    (keydown)="onKeydown($event, true)"
                    [disabled]="disabled"
                    [attr.tabindex]="tabindex"
                    [attr.autofocus]="autofocus"
                />
            </div>
            <label
                [ngClass]="{
                    'ui-dropdown-label ui-inputtext ui-corner-all': true,
                    'ui-dropdown-label-empty':
                        label == null || label.length === 0
                }"
                *ngIf="!editable && label != null"
            >
                <ng-container *ngIf="!selectedItemTemplate">{{
                    label || "empty"
                }}</ng-container>
                <ng-container
                    *ngTemplateOutlet="
                        selectedItemTemplate;
                        context: { $implicit: selectedOption }
                    "
                ></ng-container>
            </label>
            <label
                [ngClass]="{
                    'ui-dropdown-label ui-inputtext ui-corner-all ui-placeholder': true,
                    'ui-dropdown-label-empty':
                        placeholder == null || placeholder.length === 0
                }"
                *ngIf="!editable && label == null"
                >{{ placeholder || "empty" }}</label
            >
            <input
                #editableInput
                type="text"
                [attr.aria-label]="
                    selectedOption ? selectedOption[optionLabel] : ' '
                "
                class="ui-dropdown-label ui-inputtext ui-corner-all"
                *ngIf="editable"
                [disabled]="disabled"
                [attr.placeholder]="placeholder"
                (click)="onEditableInputClick($event)"
                (input)="onEditableInputChange($event)"
                (focus)="onEditableInputFocus($event)"
                (blur)="onInputBlur($event)"
            />
            <i
                class="ui-dropdown-clear-icon pi pi-times"
                (click)="clear($event)"
                *ngIf="value != null && showClear && !disabled"
            ></i>
            <div class="ui-dropdown-trigger ui-state-default ui-corner-right">
                <span
                    class="ui-dropdown-trigger-icon ui-clickable"
                    [ngClass]="dropdownIcon"
                ></span>
            </div>
            <div
                *ngIf="overlayVisible"
                [ngClass]="
                    'ui-dropdown-panel  ui-widget ui-widget-content ui-corner-all ui-shadow'
                "
                [@overlayAnimation]="{
                    value: 'visible',
                    params: {
                        showTransitionParams: showTransitionOptions,
                        hideTransitionParams: hideTransitionOptions
                    }
                }"
                (@overlayAnimation.start)="onOverlayAnimationStart($event)"
                [ngStyle]="panelStyle"
                [class]="panelStyleClass"
            >
                <div
                    *ngIf="filter"
                    class="ui-dropdown-filter-container"
                    (click)="$event.stopPropagation()"
                >
                    <input
                        #filter
                        type="text"
                        autocomplete="off"
                        [value]="filterValue || ''"
                        class="ui-dropdown-filter ui-inputtext ui-widget ui-state-default ui-corner-all"
                        [attr.placeholder]="filterPlaceholder"
                        (keydown.enter)="$event.preventDefault()"
                        (keydown)="onKeydown($event, false)"
                        (input)="onFilter($event)"
                        [attr.aria-label]="ariaFilterLabel"
                    />
                    <span class="ui-dropdown-filter-icon pi pi-search"></span>
                </div>

                <div
                    class="ui-dropdown-items-wrapper"
                    [style.max-height]="scrollHeight"
                >
                        <ul
                            class="ui-dropdown-items ui-dropdown-list ui-widget-content ui-widget ui-corner-all ui-helper-reset"
                            role="listbox"
                        >
                            <ng-container
                                *ngTemplateOutlet="
                                    virtualScroll
                                        ? virtualScrollList
                                        : itemslist;
                                    context: {
                                        $implicit: optionsToDisplay,
                                        selectedOption: selectedOption,
                                        template: groupTemplate || itemTemplate
                                    }
                                "
                            ></ng-container>

                            <ng-template
                                #itemslist
                                let-options
                                let-selectedOption="selectedOption"
                                let-template="template"
                            >
                                <p-dropdownItem
                                    *ngFor="let option of options"
                                    [option]="option"
                                    [disabled]="option.disabled"
                                    [optionLabel]="optionLabel"
                                    [optionChildrenName]="optionChildrenName"
                                    [selected]="
                                        compareOptions(selectedOption, option)
                                    "
                                    (onClick)="onItemClick($event)"
                                    [template]="template"
                                >
                                    <ng-container
                                        *ngTemplateOutlet="
                                            itemslist;
                                            context: {
                                                $implicit: children(option),
                                                selectedOption: selectedOption,
                                                template: itemTemplate
                                            }
                                        "
                                    ></ng-container>
                                </p-dropdownItem>
                            </ng-template>

                            <ng-template
                                #virtualScrollList
                                let-options
                                let-selectedOption="selectedOption"
                            >
                                <cdk-virtual-scroll-viewport
                                    ngScrollbarView
                                    smoothScroll
                                    [ngStyle]="{ height: scrollHeight }"
                                    [itemSize]="itemSize"
                                >
                                    <ng-container
                                        *cdkVirtualFor="let option of options"
                                    >
                                        <p-dropdownItem
                                            [option]="option"
                                            [disabled]="option.disabled"
                                            [optionLabel]="optionLabel"
                                            [optionChildrenName]="
                                                optionChildrenName
                                            "
                                            [selected]="
                                                compareOptions(
                                                    selectedOption,
                                                    option
                                                )
                                            "
                                            (onClick)="onItemClick($event)"
                                            [template]="itemTemplate"
                                        >
                                        </p-dropdownItem>
                                    </ng-container>
                                </cdk-virtual-scroll-viewport>
                            </ng-template>

                            <li
                                *ngIf="
                                    filter &&
                                    optionsToDisplay &&
                                    optionsToDisplay.length === 0
                                "
                                class="ui-dropdown-empty-message"
                            >
                                {{ emptyFilterMessage }}
                            </li>
                        </ul>
                </div>
            </div>
        </div>
    `,
    animations: [
        trigger("overlayAnimation", [
            state(
                "void",
                style({
                    transform: "translateY(5%)",
                    opacity: 0
                })
            ),
            state(
                "visible",
                style({
                    transform: "translateY(0)",
                    opacity: 1
                })
            ),
            transition("void => visible", animate("{{showTransitionParams}}")),
            transition("visible => void", animate("{{hideTransitionParams}}"))
        ])
    ],
    host: {
        "[class.ui-inputwrapper-filled]": "filled",
        "[class.ui-inputwrapper-focus]": "focused"
    },
    providers: [DROPDOWN_VALUE_ACCESSOR]
})
export class Dropdown
    implements
        OnInit,
        AfterViewInit,
        AfterContentInit,
        AfterViewChecked,
        OnDestroy,
        ControlValueAccessor {
    @Input() get autoWidth(): boolean {
        return this._autoWidth;
    }
    set autoWidth(_autoWidth: boolean) {
        this._autoWidth = _autoWidth;
        console.log(
            "Setting autoWidth has no effect as automatic width calculation is removed for better perfomance."
        );
    }

    @Input() get disabled(): boolean {
        return this._disabled;
    }

    set disabled(_disabled: boolean) {
        if (_disabled) {
            this.focused = false;
        }

        this._disabled = _disabled;
        this.cd.detectChanges();
    }

    constructor(
        public el: ElementRef,
        public renderer: Renderer2,
        private cd: ChangeDetectorRef,
        public zone: NgZone
    ) {}

    @Input() get options(): any[] {
        return this._options;
    }

    set options(val: any[]) {
        this._options = [...val];
        this.optionsToDisplay = this._options;
        this.updateSelectedOption(this.value);
        this.optionsChanged = true;

        if (this.filterValue && this.filterValue.length) {
            this.activateFilter();
        }
    }

    get label(): string {
        return this.selectedOption
            ? this.selectedOption[this.optionLabel]
            : null;
    }
    @Input() scrollHeight = "200px";

    @Input() filter: boolean;

    @Input() name: string;

    @Input() style: any;

    @Input() panelStyle: any;

    @Input() styleClass: string;

    @Input() panelStyleClass: string;

    @Input() readonly: boolean;

    @Input() required: boolean;

    @Input() editable: boolean;

    @Input() appendTo: any;

    @Input() tabindex: number;

    @Input() placeholder: string;

    @Input() filterPlaceholder: string;

    @Input() inputId: string;

    @Input() selectId: string;

    @Input() dataKey: string;

    @Input() idKey: string;

    @Input() filterBy = "label";

    @Input() autofocus: boolean;

    @Input() resetFilterOnHide = false;

    @Input() dropdownIcon = "pi pi-chevron-down";

    @Input() optionLabel = "label";

    @Input() autoDisplayFirst = true;

    @Input() optionChildrenName = "items";

    @Input() showClear: boolean;

    @Input() emptyFilterMessage = "No results found";

    @Input() virtualScroll: boolean;

    @Input() itemSize: number;

    @Input() autoZIndex = true;

    @Input() baseZIndex = 0;

    @Input() showTransitionOptions = "225ms ease-out";

    @Input() hideTransitionOptions = "195ms ease-in";

    @Input() ariaFilterLabel: string;

    @Output() onChange: EventEmitter<any> = new EventEmitter();

    @Output() onFilterChange: EventEmitter<string> = new EventEmitter();

    @Output() onFocus: EventEmitter<any> = new EventEmitter();

    @Output() onBlur: EventEmitter<any> = new EventEmitter();

    @Output() onClick: EventEmitter<any> = new EventEmitter();

    @Output() onShow: EventEmitter<any> = new EventEmitter();

    @Output() onHide: EventEmitter<any> = new EventEmitter();

    @ViewChild("container", { static: false }) containerViewChild: ElementRef;

    @ViewChild("filter", { static: false }) filterViewChild: ElementRef;

    @ViewChild("in", { static: false }) focusViewChild: ElementRef;

    @ViewChild("editableInput", { static: false })
    editableInputViewChild: ElementRef;

    @ContentChildren(PrimeTemplate) templates: QueryList<any>;

    group = true;

    private _autoWidth: boolean;

    private _disabled: boolean;

    overlay: HTMLDivElement;

    itemsWrapper: HTMLDivElement;

    itemTemplate: TemplateRef<any>;

    groupTemplate: TemplateRef<any>;

    selectedItemTemplate: TemplateRef<any>;

    selectedOption: any;

    _options: any[];

    value: any;

    optionsToDisplay: any[];

    hover: boolean;

    focused: boolean;

    filled: boolean;

    overlayVisible: boolean;

    documentClickListener: any;

    optionsChanged: boolean;

    panel: HTMLDivElement;

    dimensionsUpdated: boolean;

    selfClick: boolean;

    itemClick: boolean;

    clearClick: boolean;

    hoveredItem: any;

    selectedOptionUpdated: boolean;

    filterValue: string;

    searchValue: string;

    searchIndex: number;

    searchTimeout: any;

    previousSearchChar: string;

    currentSearchChar: string;

    documentResizeListener: any;

    onModelChange: Function = () => {};

    onModelTouched: Function = () => {};

    ngAfterContentInit() {
        this.templates.forEach(item => {
            switch (item.getType()) {
                case "item":
                    this.itemTemplate = item.template;
                    break;

                case "selectedItem":
                    this.selectedItemTemplate = item.template;
                    break;

                case "group":
                    this.groupTemplate = item.template;
                    break;

                default:
                    this.itemTemplate = item.template;
                    break;
            }
        });
    }

    ngOnInit() {
        this.optionsToDisplay = this.options;
        this.updateSelectedOption(null);
    }

    ngAfterViewInit() {
        if (this.editable) {
            this.updateEditableLabel();
        }
    }

    updateEditableLabel(): void {
        if (
            this.editableInputViewChild &&
            this.editableInputViewChild.nativeElement
        ) {
            this.editableInputViewChild.nativeElement.value = this
                .selectedOption
                ? this.selectedOption[this.optionLabel]
                : this.value || "";
        }
    }

    children(option): any[] {
        return (option && option[this.optionChildrenName]) || [];
    }

    compareOptions(option1, option2): boolean {
        return ObjectUtils.equals(
            this.getOptionId(option1),
            this.getOptionId(option2)
        );
    }

    getOptionId(option): any[] {
        return this.idKey
            ? ObjectUtils.resolveFieldData(option, this.idKey)
            : option;
    }

    getOptionValue(option): any[] {
        return this.dataKey
            ? ObjectUtils.resolveFieldData(option, this.dataKey)
            : option;
    }

    onItemClick(event) {
        const option = event.option;
        this.itemClick = true;

        if (!option.disabled) {
            this.selectItem(event, option);
            this.focusViewChild.nativeElement.focus();
            this.filled = true;
        }

        setTimeout(() => {
            this.hide();
        }, 150);
    }

    selectItem(event, option) {
        if (!this.compareOptions(this.selectedOption, option)) {
            this.selectedOption = option;
            this.value = this.getOptionValue(option);

            this.onModelChange(this.value);
            this.updateEditableLabel();
            this.onChange.emit({
                originalEvent: event.originalEvent,
                value: this.value
            });
        }
    }

    ngAfterViewChecked() {
        if (this.optionsChanged && this.overlayVisible) {
            this.optionsChanged = false;

            this.zone.runOutsideAngular(() => {
                setTimeout(() => {
                    this.alignOverlay();
                }, 1);
            });
        }

        if (this.selectedOptionUpdated && this.itemsWrapper) {
            const selectedItem = DomHandler.findSingle(
                this.overlay,
                "li.ui-state-highlight"
            );
            if (selectedItem) {
                DomHandler.scrollInView(
                    this.itemsWrapper,
                    DomHandler.findSingle(this.overlay, "li.ui-state-highlight")
                );
            }
            this.selectedOptionUpdated = false;
        }
    }

    writeValue(value: any): void {
        if (this.filter) {
            this.resetFilter();
        }

        this.value = value;
        this.updateSelectedOption(value);
        this.updateEditableLabel();
        this.updateFilledState();
        this.cd.markForCheck();
    }

    resetFilter(): void {
        if (this.filterViewChild && this.filterViewChild.nativeElement) {
            this.filterValue = null;
            this.filterViewChild.nativeElement.value = "";
        }

        this.optionsToDisplay = this.options;
    }

    updateSelectedOption(val: any): void {
        this.selectedOption = this.findOption(val, this.optionsToDisplay);
        if (
            this.autoDisplayFirst &&
            !this.placeholder &&
            !this.selectedOption &&
            this.optionsToDisplay &&
            this.optionsToDisplay.length &&
            !this.editable
        ) {
            this.selectedOption = this.optionsToDisplay[0];
        }
        this.selectedOptionUpdated = true;
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

    onMouseclick(event) {
        if (this.disabled || this.readonly) {
            return;
        }

        this.onClick.emit(event);

        this.selfClick = true;
        this.clearClick = DomHandler.hasClass(
            event.target,
            "ui-dropdown-clear-icon"
        );
        const dropdownPanelClick = event.target.closest(".ui-dropdown-panel");

        if (!this.itemClick && !this.clearClick && !dropdownPanelClick) {
            this.focusViewChild.nativeElement.focus();

            if (this.overlayVisible) {
                this.hide();
            } else {
                this.show();
            }
        }
    }

    onEditableInputClick(event) {
        this.itemClick = true;
        this.bindDocumentClickListener();
    }

    onEditableInputFocus(event) {
        this.focused = true;
        this.hide();
        this.onFocus.emit(event);
    }

    onEditableInputChange(event) {
        this.value = event.target.value;
        this.updateSelectedOption(this.value);
        this.onModelChange(this.value);
        this.onChange.emit({
            originalEvent: event,
            value: this.value
        });
    }

    show() {
        this.overlayVisible = true;
    }

    onOverlayAnimationStart(event: AnimationEvent) {
        switch (event.toState) {
            case "visible":
                this.overlay = event.element;
                this.itemsWrapper = DomHandler.findSingle(
                    this.overlay,
                    ".ui-dropdown-items-wrapper"
                );
                this.appendOverlay();
                if (this.autoZIndex) {
                    this.overlay.style.zIndex = String(
                        this.baseZIndex + ++DomHandler.zindex
                    );
                }
                this.alignOverlay();
                this.bindDocumentClickListener();
                this.bindDocumentResizeListener();

                if (this.options && this.options.length) {
                    const selectedListItem = DomHandler.findSingle(
                        this.itemsWrapper,
                        ".ui-dropdown-item.ui-state-highlight"
                    );
                    if (selectedListItem) {
                        DomHandler.scrollInView(
                            this.itemsWrapper,
                            selectedListItem
                        );
                    }
                }

                if (
                    this.filterViewChild &&
                    this.filterViewChild.nativeElement
                ) {
                    this.filterViewChild.nativeElement.focus();
                }

                this.onShow.emit(event);
                break;

            case "void":
                this.onHide.emit(event);
                this.onOverlayHide();
                break;
        }
    }

    appendOverlay() {
        if (this.appendTo) {
            if (this.appendTo === "body") {
                document.body.appendChild(this.overlay);
            } else {
                DomHandler.appendChild(this.overlay, this.appendTo);
            }

            this.overlay.style.minWidth =
                DomHandler.getWidth(this.containerViewChild.nativeElement) +
                "px";
        }
    }

    restoreOverlayAppend() {
        if (this.overlay && this.appendTo) {
            this.el.nativeElement.appendChild(this.overlay);
        }
    }

    hide() {
        this.overlayVisible = false;

        if (this.filter && this.resetFilterOnHide) {
            this.resetFilter();
        }

        this.cd.markForCheck();
    }

    alignOverlay() {
        if (this.overlay) {
            if (this.appendTo) {
                DomHandler.absolutePosition(
                    this.overlay,
                    this.containerViewChild.nativeElement
                );
            } else {
                DomHandler.relativePosition(
                    this.overlay,
                    this.containerViewChild.nativeElement
                );
            }
        }
    }

    onInputFocus(event) {
        this.focused = true;
        this.onFocus.emit(event);
    }

    onInputBlur(event) {
        this.focused = false;
        this.onModelTouched();
        this.onBlur.emit(event);
    }

    findPrevEnabledOption(index) {
        let prevEnabledOption;

        if (this.optionsToDisplay && this.optionsToDisplay.length) {
            for (let i = index - 1; 0 <= i; i--) {
                const option = this.optionsToDisplay[i];
                if (option.disabled) {
                    continue;
                } else {
                    prevEnabledOption = option;
                    break;
                }
            }

            if (!prevEnabledOption) {
                for (
                    let i = this.optionsToDisplay.length - 1;
                    i >= index;
                    i--
                ) {
                    const option = this.optionsToDisplay[i];
                    if (option.disabled) {
                        continue;
                    } else {
                        prevEnabledOption = option;
                        break;
                    }
                }
            }
        }

        return prevEnabledOption;
    }

    findNextEnabledOption(index) {
        let nextEnabledOption;

        if (this.optionsToDisplay && this.optionsToDisplay.length) {
            for (
                let i = index + 1;
                index < this.optionsToDisplay.length - 1;
                i++
            ) {
                const option = this.optionsToDisplay[i];
                if (option.disabled) {
                    continue;
                } else {
                    nextEnabledOption = option;
                    break;
                }
            }

            if (!nextEnabledOption) {
                for (let i = 0; i < index; i++) {
                    const option = this.optionsToDisplay[i];
                    if (option.disabled) {
                        continue;
                    } else {
                        nextEnabledOption = option;
                        break;
                    }
                }
            }
        }

        return nextEnabledOption;
    }

    onKeydown(event: KeyboardEvent, search: boolean) {
        if (
            this.readonly ||
            !this.optionsToDisplay ||
            this.optionsToDisplay.length === null
        ) {
            return;
        }

        switch (event.which) {
            // down
            case 40:
                if (!this.overlayVisible && event.altKey) {
                    this.show();
                } else {
                    if (this.group) {
                        const selectedItemIndex = this.selectedOption
                            ? this.findOptionGroupIndex(
                                  this.getOptionId(this.selectedOption),
                                  this.optionsToDisplay
                              )
                            : -1;

                        if (selectedItemIndex !== -1) {
                            const nextItemIndex =
                                selectedItemIndex.itemIndex + 1;
                            if (
                                nextItemIndex <
                                this.children(
                                    this.optionsToDisplay[
                                        selectedItemIndex.groupIndex
                                    ]
                                ).length
                            ) {
                                this.selectItem(
                                    event,
                                    this.children(
                                        this.optionsToDisplay[
                                            selectedItemIndex.groupIndex
                                        ]
                                    )[nextItemIndex]
                                );
                                this.selectedOptionUpdated = true;
                            } else if (
                                this.optionsToDisplay[
                                    selectedItemIndex.groupIndex + 1
                                ]
                            ) {
                                this.selectItem(
                                    event,
                                    this.children(
                                        this.optionsToDisplay[
                                            selectedItemIndex.groupIndex + 1
                                        ]
                                    )[0]
                                );
                                this.selectedOptionUpdated = true;
                            }
                        } else {
                            this.selectItem(
                                event,
                                this.children(this.optionsToDisplay[0])[0]
                            );
                        }
                    } else {
                        const selectedItemIndex = this.selectedOption
                            ? this.findOptionIndex(
                                  this.getOptionId(this.selectedOption),
                                  this.optionsToDisplay
                              )
                            : -1;
                        const nextEnabledOption = this.findNextEnabledOption(
                            selectedItemIndex
                        );
                        if (nextEnabledOption) {
                            this.selectItem(event, nextEnabledOption);
                            this.selectedOptionUpdated = true;
                        }
                    }
                }

                event.preventDefault();

                break;

            // up
            case 38:
                if (this.group) {
                    const selectedItemIndex = this.selectedOption
                        ? this.findOptionGroupIndex(
                              this.getOptionId(this.selectedOption),
                              this.optionsToDisplay
                          )
                        : -1;
                    if (selectedItemIndex !== -1) {
                        const prevItemIndex = selectedItemIndex.itemIndex - 1;
                        if (prevItemIndex >= 0) {
                            this.selectItem(
                                event,
                                this.children(
                                    this.optionsToDisplay[
                                        selectedItemIndex.groupIndex
                                    ]
                                )[prevItemIndex]
                            );
                            this.selectedOptionUpdated = true;
                        } else if (prevItemIndex < 0) {
                            const prevGroup = this.optionsToDisplay[
                                selectedItemIndex.groupIndex - 1
                            ];
                            if (prevGroup) {
                                this.selectItem(
                                    event,
                                    this.children(prevGroup)[
                                        this.children(prevGroup).length - 1
                                    ]
                                );
                                this.selectedOptionUpdated = true;
                            }
                        }
                    }
                } else {
                    const selectedItemIndex = this.selectedOption
                        ? this.findOptionIndex(
                              this.getOptionId(this.selectedOption),
                              this.optionsToDisplay
                          )
                        : -1;
                    const prevEnabledOption = this.findPrevEnabledOption(
                        selectedItemIndex
                    );
                    if (prevEnabledOption) {
                        this.selectItem(event, prevEnabledOption);
                        this.selectedOptionUpdated = true;
                    }
                }

                event.preventDefault();
                break;

            // space
            case 32:
            case 32:
                if (!this.overlayVisible) {
                    this.show();
                    event.preventDefault();
                }
                break;

            // enter
            case 13:
                if (
                    !this.filter ||
                    (this.optionsToDisplay && this.optionsToDisplay.length > 0)
                ) {
                    this.hide();
                }

                event.preventDefault();
                break;

            // escape and tab
            case 27:
            case 9:
                this.hide();
                break;

            // search item based on keyboard input
            default:
                if (search) {
                    this.search(event);
                }
                break;
        }
    }

    search(event) {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        const char = String.fromCharCode(event.keyCode);
        this.previousSearchChar = this.currentSearchChar;
        this.currentSearchChar = char;

        if (this.previousSearchChar === this.currentSearchChar) {
            this.searchValue = this.currentSearchChar;
        } else {
            this.searchValue = this.searchValue
                ? this.searchValue + char
                : char;
        }

        let newOption;
        if (this.group) {
            const searchIndex = this.selectedOption
                ? this.findOptionGroupIndex(
                      this.getOptionId(this.selectedOption),
                      this.optionsToDisplay
                  )
                : { groupIndex: 0, itemIndex: 0 };
            newOption =
                searchIndex.groupIndex >= 0
                    ? this.searchOptionWithinGroup(searchIndex)
                    : this.searchOption(searchIndex.itemIndex);
        } else {
            let searchIndex = this.selectedOption
                ? this.findOptionIndex(
                      this.getOptionId(this.selectedOption),
                      this.optionsToDisplay
                  )
                : -1;
            newOption = this.searchOption(++searchIndex);
        }

        if (newOption) {
            this.selectItem(event, newOption);
            this.selectedOptionUpdated = true;
        }

        this.searchTimeout = setTimeout(() => {
            this.searchValue = null;
        }, 250);
    }

    searchOption(index) {
        let option;

        if (this.searchValue) {
            option = this.searchOptionInRange(
                index,
                this.optionsToDisplay.length
            );

            if (!option) {
                option = this.searchOptionInRange(0, index);
            }
        }

        return option;
    }

    searchOptionInRange(start, end) {
        for (let i = start; i < end; i++) {
            const opt = this.optionsToDisplay[i];
            if (
                opt[this.optionLabel]
                    .toLowerCase()
                    .startsWith(this.searchValue.toLowerCase())
            ) {
                return opt;
            }
        }

        return null;
    }

    searchOptionWithinGroup(index) {
        let option;

        if (this.searchValue) {
            for (
                let i = index.groupIndex;
                i < this.optionsToDisplay.length;
                i++
            ) {
                for (
                    let j = index.groupIndex === i ? index.itemIndex + 1 : 0;
                    j < this.children(this.optionsToDisplay[i]).length;
                    j++
                ) {
                    const opt = this.children(this.optionsToDisplay[i])[j];
                    if (
                        opt[this.optionLabel]
                            .toLowerCase()
                            .startsWith(this.searchValue.toLowerCase())
                    ) {
                        return opt;
                    }
                }
            }

            if (!option) {
                for (let i = 0; i <= index.groupIndex; i++) {
                    for (
                        let j = 0;
                        j <
                        (index.groupIndex === i
                            ? index.itemIndex
                            : this.children(this.optionsToDisplay[i]).length);
                        j++
                    ) {
                        const opt = this.children(this.optionsToDisplay[i])[j];
                        if (
                            opt[this.optionLabel]
                                .toLowerCase()
                                .startsWith(this.searchValue.toLowerCase())
                        ) {
                            return opt;
                        }
                    }
                }
            }
        }

        return null;
    }

    findOptionIndex(val: any, opts: any[]): number {
        let index = -1;
        if (opts) {
            for (let i = 0; i < opts.length; i++) {
                if (
                    (val == null && this.getOptionId(opts[i]) == null) ||
                    this.getOptionValue(opts[i]) === val ||
                    ObjectUtils.equals(val, opts[i], this.idKey)
                ) {
                    index = i;
                    break;
                }
            }
        }

        return index;
    }

    findOptionGroupIndex(val: any, opts: any[]): any {
        let groupIndex;
        let itemIndex: number = this.findOptionIndex(val, opts);

        if (opts && itemIndex === -1) {
            for (let i = 0; i < opts.length; i++) {
                groupIndex = i;
                itemIndex = this.findOptionIndex(val, this.children(opts[i]));

                if (itemIndex > -1) {
                    break;
                }
            }
        }

        return itemIndex > -1 ? { groupIndex, itemIndex } : -1;
    }

    findOption(val: any, opts: any[], inGroup?: boolean): SelectItem {
        const index: number = this.findOptionIndex(val, opts);
        let opt: SelectItem = index > -1 ? opts[index] : null;

        if (this.group && !inGroup && !opt) {
            if (opts && opts.length) {
                for (const optgroup of opts) {
                    opt = this.findOption(val, this.children(optgroup), true);
                    if (opt) {
                        break;
                    }
                }
            }
        }

        return opt;
    }

    onFilter(event): void {
        const inputValue = event.target.value;

        if (inputValue && inputValue.length) {
            this.filterValue = inputValue;
            this.activateFilter();
        } else {
            this.filterValue = null;
            this.optionsToDisplay = this.options;
        }

        this.optionsChanged = true;
        this.onFilterChange.emit(inputValue);
    }

    activateFilter() {
        const searchFields: string[] = this.filterBy.split(",");

        if (this.options && this.options.length) {
            this.optionsToDisplay = this.options.map(option => {
                return {
                    ...option,
                    [this.optionChildrenName]: ObjectUtils.filter(
                        this.children(option),
                        searchFields,
                        this.filterValue
                    )
                };
            });

            this.optionsToDisplay = ObjectUtils.filter(
                this.optionsToDisplay,
                searchFields,
                this.filterValue,
                option =>
                    option[this.optionChildrenName] &&
                    option[this.optionChildrenName].length
            );

            this.optionsChanged = true;
        }
    }

    applyFocus(): void {
        if (this.editable) {
            DomHandler.findSingle(
                this.el.nativeElement,
                ".ui-dropdown-label.ui-inputtext"
            ).focus();
        } else {
            DomHandler.findSingle(
                this.el.nativeElement,
                "input[readonly]"
            ).focus();
        }
    }

    focus(): void {
        this.applyFocus();
    }

    bindDocumentClickListener() {
        if (!this.documentClickListener) {
            this.documentClickListener = this.renderer.listen(
                "document",
                "click",
                () => {
                    if (!this.selfClick && !this.itemClick) {
                        this.hide();
                        this.unbindDocumentClickListener();
                    }

                    this.clearClickState();
                    this.cd.markForCheck();
                }
            );
        }
    }

    clearClickState() {
        this.selfClick = false;
        this.itemClick = false;
    }

    unbindDocumentClickListener() {
        if (this.documentClickListener) {
            this.documentClickListener();
            this.documentClickListener = null;
        }
    }

    bindDocumentResizeListener() {
        this.documentResizeListener = this.onWindowResize.bind(this);
        window.addEventListener("resize", this.documentResizeListener);
    }

    unbindDocumentResizeListener() {
        if (this.documentResizeListener) {
            window.removeEventListener("resize", this.documentResizeListener);
            this.documentResizeListener = null;
        }
    }

    onWindowResize() {
        if (!DomHandler.isAndroid()) {
            this.hide();
        }
    }

    updateFilledState() {
        this.filled = this.selectedOption != null;
    }

    clear(event: Event) {
        this.clearClick = true;
        this.value = null;
        this.onModelChange(this.value);
        this.onChange.emit({
            originalEvent: event,
            value: this.value
        });
        this.updateSelectedOption(this.value);
        this.updateEditableLabel();
        this.updateFilledState();
    }

    onOverlayHide() {
        this.unbindDocumentClickListener();
        this.unbindDocumentResizeListener();
        this.overlay = null;
        this.itemsWrapper = null;
    }

    ngOnDestroy() {
        this.restoreOverlayAppend();
        this.onOverlayHide();
    }
}

@NgModule({
    imports: [CommonModule, SharedModule, ScrollingModule, NgScrollbarModule],
    exports: [Dropdown, SharedModule, ScrollingModule],
    declarations: [Dropdown, DropdownItem]
})
export class DropdownModule {}
