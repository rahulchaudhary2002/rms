import {
    endOfMonth,
    format,
    isValid,
    parse,
    startOfMonth,
    startOfToday,
    subDays,
    subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import DatePicker from 'react-datepicker';
import { createPortal } from 'react-dom';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

type DateRangeInputProps = Omit<React.ComponentProps<'input'>, 'type' | 'value' | 'onChange' | 'name'> & {
    startValue?: string;
    endValue?: string;
    startName?: string;
    endName?: string;
    onChange?: (range: { startValue: string; endValue: string }) => void;
    placeholder?: string;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CUSTOM_PRESET = 'custom';
const TODAY_PRESET = 'today';
const YESTERDAY_PRESET = 'yesterday';
const LAST_7_DAYS_PRESET = 'last_7_days';
const LAST_30_DAYS_PRESET = 'last_30_days';
const THIS_MONTH_PRESET = 'this_month';
const LAST_MONTH_PRESET = 'last_month';

type PresetValue =
    | typeof CUSTOM_PRESET
    | typeof TODAY_PRESET
    | typeof YESTERDAY_PRESET
    | typeof LAST_7_DAYS_PRESET
    | typeof LAST_30_DAYS_PRESET
    | typeof THIS_MONTH_PRESET
    | typeof LAST_MONTH_PRESET;

function parseDateValue(value: string): Date | null {
    if (!DATE_PATTERN.test(value)) return null;

    const parsed = parse(value, 'yyyy-MM-dd', new Date());

    return isValid(parsed) ? parsed : null;
}

function formatDateValue(value: Date | null): string {
    return value ? format(value, 'yyyy-MM-dd') : '';
}

function presetRange(preset: PresetValue): { startValue: string; endValue: string } {
    const today = startOfToday();

    switch (preset) {
        case TODAY_PRESET:
            return { startValue: formatDateValue(today), endValue: formatDateValue(today) };
        case YESTERDAY_PRESET: {
            const yesterday = subDays(today, 1);
            return { startValue: formatDateValue(yesterday), endValue: formatDateValue(yesterday) };
        }
        case LAST_7_DAYS_PRESET:
            return { startValue: formatDateValue(subDays(today, 6)), endValue: formatDateValue(today) };
        case LAST_30_DAYS_PRESET:
            return { startValue: formatDateValue(subDays(today, 29)), endValue: formatDateValue(today) };
        case THIS_MONTH_PRESET:
            return { startValue: formatDateValue(startOfMonth(today)), endValue: formatDateValue(endOfMonth(today)) };
        case LAST_MONTH_PRESET: {
            const lastMonth = subMonths(today, 1);
            return { startValue: formatDateValue(startOfMonth(lastMonth)), endValue: formatDateValue(endOfMonth(lastMonth)) };
        }
        default:
            return { startValue: '', endValue: '' };
    }
}

function detectPreset(startValue: string, endValue: string): PresetValue {
    const presets: PresetValue[] = [
        TODAY_PRESET,
        YESTERDAY_PRESET,
        LAST_7_DAYS_PRESET,
        LAST_30_DAYS_PRESET,
        THIS_MONTH_PRESET,
        LAST_MONTH_PRESET,
    ];

    for (const preset of presets) {
        const range = presetRange(preset);
        if (range.startValue === startValue && range.endValue === endValue) return preset;
    }

    return CUSTOM_PRESET;
}

function DatePickerPopperContainer({ children }: { children?: React.ReactNode }) {
    if (typeof document === 'undefined') return null;

    return createPortal(children, document.body);
}

function isSameDayValue(date: Date, value: string): boolean {
    return formatDateValue(date) === value;
}

function isBetweenRange(date: Date, startValue: string, endValue: string): boolean {
    if (!startValue || !endValue) return false;

    const start = parseDateValue(startValue);
    const end = parseDateValue(endValue);

    if (start === null || end === null) return false;

    const current = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const from = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const to = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

    return current > from && current < to;
}

export function DateRangeInput({
    startValue = '',
    endValue = '',
    startName,
    endName,
    onChange,
    className,
    placeholder = 'Select date range',
    onFocus,
    onBlur,
    ...props
}: DateRangeInputProps) {
    const isMobile = useIsMobile();
    const { resolvedAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';
    const startDate = React.useMemo(() => parseDateValue(startValue), [startValue]);
    const endDate = React.useMemo(() => parseDateValue(endValue), [endValue]);
    const minDate = React.useMemo(() => {
        return typeof props.min === 'string' ? (parseDateValue(props.min) ?? undefined) : undefined;
    }, [props.min]);
    const maxDate = React.useMemo(() => {
        return typeof props.max === 'string' ? (parseDateValue(props.max) ?? undefined) : undefined;
    }, [props.max]);
    const selectedPreset = React.useMemo(() => detectPreset(startValue, endValue), [startValue, endValue]);

    const emitChange = React.useCallback(
        (nextStart: Date | null, nextEnd: Date | null) => {
            if (!onChange) return;
            onChange({ startValue: formatDateValue(nextStart), endValue: formatDateValue(nextEnd) });
        },
        [onChange],
    );

    const applyPreset = React.useCallback(
        (preset: PresetValue) => {
            onChange?.(presetRange(preset));
        },
        [onChange],
    );

    return (
        <>
            {startName ? <input type="hidden" name={startName} value={startValue} /> : null}
            {endName ? <input type="hidden" name={endName} value={endValue} /> : null}

            <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={(dates: [Date | null, Date | null]) => {
                    const [nextStart, nextEnd] = dates;
                    emitChange(nextStart, nextEnd);
                }}
                dateFormat="yyyy-MM-dd"
                placeholderText={placeholder}
                disabled={props.disabled}
                readOnly={props.readOnly}
                minDate={minDate}
                maxDate={maxDate}
                withPortal={isMobile}
                portalId={isMobile ? 'app-datepicker-portal' : undefined}
                popperContainer={DatePickerPopperContainer}
                popperPlacement="bottom-start"
                popperProps={{ strategy: 'fixed' }}
                calendarClassName={cn(
                    'app-datepicker !w-full !rounded-none !border-0 !bg-transparent !shadow-none',
                    '[&_.react-datepicker__month-container]:!float-none [&_.react-datepicker__month-container]:!w-full',
                    '[&_.react-datepicker__month-container]:!bg-transparent [&_.react-datepicker__month-container]:text-foreground',
                    '[&_.react-datepicker__day-names]:!flex [&_.react-datepicker__day-names]:!justify-center',
                    '[&_.react-datepicker__day-names]:!bg-transparent [&_.react-datepicker__day-names]:!pt-2',
                    '[&_.react-datepicker__week]:!flex [&_.react-datepicker__week]:!justify-center',
                    '[&_.react-datepicker__month]:!bg-transparent',
                    '[&_.react-datepicker__day-name]:!m-0.5 [&_.react-datepicker__day-name]:!h-8 [&_.react-datepicker__day-name]:!w-8 [&_.react-datepicker__day-name]:!leading-8',
                    '[&_.react-datepicker__day]:!m-0.5 [&_.react-datepicker__day]:!h-8 [&_.react-datepicker__day]:!w-8 [&_.react-datepicker__day]:!leading-8',
                    '[&_.react-datepicker__header]:!rounded-none [&_.react-datepicker__header]:!border-b-0 [&_.react-datepicker__header]:!bg-transparent [&_.react-datepicker__header]:!p-0',
                    '[&_.react-datepicker__day--in-range]:!bg-transparent [&_.react-datepicker__day--in-range]:text-foreground',
                    '[&_.react-datepicker__day--in-selecting-range]:!bg-transparent [&_.react-datepicker__day--in-selecting-range]:text-foreground',
                    '[&_.react-datepicker__day--keyboard-selected]:!bg-transparent [&_.react-datepicker__day--keyboard-selected]:text-foreground',
                    isDark &&
                        '[&_.react-datepicker__day-names]:!bg-popover [&_.react-datepicker__header]:!bg-popover [&_.react-datepicker__month]:!bg-popover [&_.react-datepicker__month-container]:!bg-popover',
                    isDark &&
                        '[&_.react-datepicker__day--in-range]:!text-foreground [&_.react-datepicker__day--in-selecting-range]:!text-foreground [&_.react-datepicker__day--keyboard-selected]:!text-foreground [&_.react-datepicker__day-name]:!text-muted-foreground [&_.react-datepicker__month-container]:!text-foreground',
                )}
                popperClassName="app-datepicker-popper"
                wrapperClassName="w-full"
                showPopperArrow={false}
                monthsShown={1}
                dayClassName={(date) => {
                    const selected =
                        (startValue !== '' && isSameDayValue(date, startValue)) ||
                        (endValue !== '' && isSameDayValue(date, endValue));

                    return cn(
                        '!rounded-full text-foreground transition-colors hover:!bg-accent',
                        'dark:!text-foreground',
                        selected && 'bg-primary !font-bold !text-primary-foreground hover:bg-primary',
                        !selected &&
                            isBetweenRange(date, startValue, endValue) &&
                            '!bg-primary/10 text-primary dark:bg-primary/10 dark:!text-primary',
                    );
                }}
                renderCustomHeader={({ date, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
                    <div className={cn('flex h-[46px] items-center bg-transparent px-3 text-foreground', isDark && '!bg-popover text-foreground')}>
                        <div className="relative flex w-full items-center justify-center">
                            <button
                                type="button"
                                onClick={decreaseMonth}
                                disabled={prevMonthButtonDisabled}
                                className={cn(
                                    'absolute left-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-primary transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40',
                                    isDark && 'text-primary',
                                )}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="font-headline text-[1.05rem] font-extrabold text-inherit">
                                {format(date, 'MMMM yyyy')}
                            </span>
                            <button
                                type="button"
                                onClick={increaseMonth}
                                disabled={nextMonthButtonDisabled}
                                className={cn(
                                    'absolute right-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-primary transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40',
                                    isDark && 'text-primary',
                                )}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
                calendarContainer={({ children }) => (
                    <div className={cn('overflow-hidden rounded-2xl border border-border bg-popover shadow-lg', isDark && 'bg-popover')}>
                        <div className="flex flex-col md:flex-row">
                            <aside
                                className={cn(
                                    'border-b border-border bg-popover md:w-[168px] md:min-w-[168px] md:border-r md:border-b-0',
                                    isDark && 'bg-popover',
                                )}
                            >
                                <div className="flex flex-wrap gap-0 px-0 py-2 md:flex-col">
                                    {[
                                        { value: TODAY_PRESET, label: 'Today' },
                                        { value: YESTERDAY_PRESET, label: 'Yesterday' },
                                        { value: LAST_7_DAYS_PRESET, label: 'Last 7 Days' },
                                        { value: LAST_30_DAYS_PRESET, label: 'Last 30 Days' },
                                        { value: THIS_MONTH_PRESET, label: 'This Month' },
                                        { value: LAST_MONTH_PRESET, label: 'Last Month' },
                                        { value: CUSTOM_PRESET, label: 'Custom Range' },
                                    ].map((preset) => (
                                        <button
                                            key={preset.value}
                                            type="button"
                                            className={cn(
                                                'w-full px-5 py-2.5 text-left text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-primary dark:hover:text-primary',
                                                selectedPreset === preset.value
                                                    ? cn('rounded-xl border border-primary/30 bg-card text-primary shadow-sm', isDark && 'text-primary')
                                                    : '',
                                            )}
                                            onMouseDown={(event) => {
                                                event.preventDefault();
                                                if (preset.value !== CUSTOM_PRESET) {
                                                    applyPreset(preset.value as PresetValue);
                                                }
                                            }}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </aside>
                            <div className="min-w-0 bg-popover">{children}</div>
                        </div>
                    </div>
                )}
                customInput={
                    <Input
                        {...props}
                        type="text"
                        autoComplete="off"
                        className={cn(className, 'cursor-pointer')}
                        onFocus={onFocus}
                        onBlur={onBlur}
                    />
                }
            />
        </>
    );
}
