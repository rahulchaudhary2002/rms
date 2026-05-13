import { format, isValid, parse } from 'date-fns';
import * as React from 'react';
import DatePicker from 'react-datepicker';
import { createPortal } from 'react-dom';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

type DateInputProps = Omit<React.ComponentProps<'input'>, 'type' | 'value' | 'onChange'> & {
    value?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    portalTarget?: HTMLElement | null;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDateValue(value: string): Date | null {
    if (!DATE_PATTERN.test(value)) {
        return null;
    }

    const parsed = parse(value, 'yyyy-MM-dd', new Date());

    return isValid(parsed) ? parsed : null;
}

function formatDateValue(value: Date | null): string {
    return value ? format(value, 'yyyy-MM-dd') : '';
}

export function DateInput({
    value = '',
    onChange,
    className,
    placeholder = 'YYYY-MM-DD',
    portalTarget,
    onFocus,
    onBlur,
    ...props
}: DateInputProps) {
    const isMobile = useIsMobile();
    const selectedDate = React.useMemo(() => parseDateValue(value), [value]);
    const minDate = React.useMemo(() => {
        return typeof props.min === 'string' ? parseDateValue(props.min) ?? undefined : undefined;
    }, [props.min]);
    const maxDate = React.useMemo(() => {
        return typeof props.max === 'string' ? parseDateValue(props.max) ?? undefined : undefined;
    }, [props.max]);

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

    const PopperContainer = React.useCallback(
        ({ children }: { children?: React.ReactNode }) => {
            if (typeof document === 'undefined') return null;

            return createPortal(children, portalTarget ?? document.body);
        },
        [portalTarget],
    );

    return (
        <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => {
                emitChange(formatDateValue(date));
            }}
            dateFormat="yyyy-MM-dd"
            placeholderText={placeholder}
            disabled={props.disabled}
            readOnly={props.readOnly}
            minDate={minDate}
            maxDate={maxDate}
            withPortal={isMobile}
            portalId={isMobile ? 'app-datepicker-portal' : undefined}
            popperContainer={PopperContainer}
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
