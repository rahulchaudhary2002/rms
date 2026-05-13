import { format, isValid, parse } from 'date-fns';
import * as React from 'react';
import DatePicker from 'react-datepicker';
import { createPortal } from 'react-dom';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

type DateTimeInputProps = Omit<React.ComponentProps<'input'>, 'type' | 'value' | 'onChange'> & {
    value?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
};

const DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function parseDateTimeValue(value: string): Date | null {
    if (!value) return null;

    const normalized = value.replace(' ', 'T').slice(0, 16);

    if (!DATETIME_PATTERN.test(normalized)) return null;

    const parsed = parse(normalized, "yyyy-MM-dd'T'HH:mm", new Date());

    return isValid(parsed) ? parsed : null;
}

function formatDateTimeValue(value: Date | null): string {
    return value ? format(value, 'yyyy-MM-dd HH:mm') : '';
}

function DatePickerPopperContainer({ children }: { children?: React.ReactNode }) {
    if (typeof document === 'undefined') return null;

    return createPortal(children, document.body);
}

export function DateTimeInput({
    value = '',
    onChange,
    className,
    placeholder = 'YYYY-MM-DD HH:mm',
    onFocus,
    onBlur,
    ...props
}: DateTimeInputProps) {
    const isMobile = useIsMobile();
    const selectedDateTime = React.useMemo(() => parseDateTimeValue(value), [value]);
    const minDateTime = React.useMemo(() => {
        return typeof props.min === 'string' ? parseDateTimeValue(props.min) ?? undefined : undefined;
    }, [props.min]);
    const maxDateTime = React.useMemo(() => {
        return typeof props.max === 'string' ? parseDateTimeValue(props.max) ?? undefined : undefined;
    }, [props.max]);
    const timeIntervals =
        typeof props.step === 'number' && props.step >= 60 ? Math.round(props.step / 60) : 1;

    const emitChange = React.useCallback(
        (nextValue: string) => {
            if (!onChange) return;

            const syntheticEvent = {
                target: { value: nextValue, name: props.name },
                currentTarget: { value: nextValue, name: props.name },
            } as unknown as React.ChangeEvent<HTMLInputElement>;

            onChange(syntheticEvent);
        },
        [onChange, props.name],
    );

    return (
        <DatePicker
            selected={selectedDateTime}
            onChange={(date: Date | null) => {
                emitChange(formatDateTimeValue(date));
            }}
            showTimeSelect
            timeIntervals={timeIntervals}
            timeCaption="Time"
            dateFormat="yyyy-MM-dd HH:mm"
            placeholderText={placeholder}
            disabled={props.disabled}
            readOnly={props.readOnly}
            minDate={minDateTime}
            maxDate={maxDateTime}
            withPortal={isMobile}
            portalId={isMobile ? 'app-datepicker-portal' : undefined}
            popperContainer={DatePickerPopperContainer}
            popperPlacement="bottom-start"
            popperProps={{ strategy: 'fixed' }}
            calendarClassName="app-datepicker"
            popperClassName="app-datepicker-popper"
            wrapperClassName="w-full"
            showPopperArrow={false}
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
    );
}
