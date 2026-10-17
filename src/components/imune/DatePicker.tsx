import { useEffect, useRef, useState } from "react";
import { format, isAfter, isBefore, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { IMaskMixin } from "react-imask";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const DISPLAY_DATE_FORMAT = "dd/MM/yyyy";
const DISPLAY_DATE_PARSE_FORMAT = "d/M/yyyy";
const ISO_DATE_FORMAT = "yyyy-MM-dd";

const MaskedDateInput = IMaskMixin<HTMLInputElement>(({ inputRef, ...props }) => (
  <Input {...props} ref={inputRef} />
));

interface DatePickerProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onValidationError?: (message?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  "aria-invalid"?: boolean | undefined;
  "aria-describedby"?: string | undefined;
}

function parseDisplayDate(value: string): Date | undefined {
  const trimmed = value.trim();
  const separatedDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  const digitsOnlyDate = /^(\d{2})(\d{2})(\d{4})$/.exec(trimmed);
  const match = separatedDate ?? digitsOnlyDate;

  if (!match) return undefined;

  const [, day, month, year] = match;
  const normalizedDate = `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  const parsed = parse(normalizedDate, DISPLAY_DATE_PARSE_FORMAT, new Date());

  if (!isValid(parsed) || format(parsed, DISPLAY_DATE_FORMAT) !== normalizedDate) {
    return undefined;
  }

  return parsed;
}

function parseIsoDate(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, ISO_DATE_FORMAT, new Date());
  return isValid(parsed) ? parsed : undefined;
}

export function DatePicker({
  id,
  value,
  onChange,
  onValidationError,
  placeholder = "DD/MM/AAAA",
  disabled,
  minDate,
  maxDate,
  ...aria
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseIsoDate(value);
  const [inputValue, setInputValue] = useState(() =>
    selected ? format(selected, DISPLAY_DATE_FORMAT) : "",
  );
  const previousValue = useRef(value);
  const editing = useRef(false);
  const today = new Date();
  const minSelectableDate = minDate
    ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
    : undefined;
  const maxSelectableDate = maxDate
    ? new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())
    : undefined;
  const draftDate = parseDisplayDate(inputValue);
  const draftIsSelectable =
    draftDate &&
    (!minSelectableDate || !isBefore(draftDate, minSelectableDate)) &&
    (!maxSelectableDate || !isAfter(draftDate, maxSelectableDate))
      ? draftDate
      : undefined;
  const selectedIsSelectable =
    selected &&
    (!minSelectableDate || !isBefore(selected, minSelectableDate)) &&
    (!maxSelectableDate || !isAfter(selected, maxSelectableDate))
      ? selected
      : undefined;
  const todayInRange =
    minSelectableDate && isBefore(today, minSelectableDate)
      ? minSelectableDate
      : maxSelectableDate && isAfter(today, maxSelectableDate)
        ? maxSelectableDate
        : today;
  const calendarMonth = selectedIsSelectable ?? draftIsSelectable ?? todayInRange;
  const startMonth =
    minSelectableDate ??
    new Date(Math.min(today.getFullYear() - 100, calendarMonth.getFullYear()), 0, 1);
  const endMonth = maxSelectableDate
    ? maxSelectableDate
    : new Date(Math.max(today.getFullYear() + 50, calendarMonth.getFullYear()), 11, 31);
  const disabledDates = [
    ...(minSelectableDate ? [{ before: minSelectableDate }] : []),
    ...(maxSelectableDate ? [{ after: maxSelectableDate }] : []),
  ];

  useEffect(() => {
    if (previousValue.current === value) return;
    previousValue.current = value;

    if (editing.current && !value) return;

    editing.current = false;
    const nextDate = parseIsoDate(value);
    setInputValue(nextDate ? format(nextDate, DISPLAY_DATE_FORMAT) : "");
  }, [value]);

  function handleInputChange(maskedValue: string) {
    editing.current = true;
    setInputValue(maskedValue);
    onValidationError?.();

    const selectedDisplayValue = selected ? format(selected, DISPLAY_DATE_FORMAT) : "";
    if (value && maskedValue !== selectedDisplayValue) {
      onChange("");
    }
  }

  function handleBlur() {
    const trimmedValue = inputValue.trim();
    editing.current = false;

    if (!trimmedValue) {
      onChange("");
      onValidationError?.();
      return;
    }

    const parsed = parseDisplayDate(trimmedValue);
    if (!parsed) {
      onChange("");
      onValidationError?.("Digite uma data válida no formato DD/MM/AAAA.");
      return;
    }

    if (minSelectableDate && isBefore(parsed, minSelectableDate)) {
      onChange("");
      onValidationError?.(
        `A data não pode ser anterior a ${format(minSelectableDate, DISPLAY_DATE_FORMAT)}.`,
      );
      return;
    }

    if (maxSelectableDate && isAfter(parsed, maxSelectableDate)) {
      onChange("");
      onValidationError?.(
        `A data não pode ser posterior a ${format(maxSelectableDate, DISPLAY_DATE_FORMAT)}.`,
      );
      return;
    }

    setInputValue(format(parsed, DISPLAY_DATE_FORMAT));
    onChange(format(parsed, ISO_DATE_FORMAT));
    onValidationError?.();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative w-full">
          <MaskedDateInput
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            mask="00/00/0000"
            eager="append"
            disabled={disabled}
            placeholder={placeholder}
            value={inputValue}
            onAccept={(maskedValue) => handleInputChange(String(maskedValue))}
            onBlur={handleBlur}
            aria-invalid={aria["aria-invalid"]}
            aria-describedby={aria["aria-describedby"]}
            className="pr-12"
          />
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              aria-label="Abrir calendário"
              className="absolute right-1 top-1 h-10 w-10"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedIsSelectable}
          defaultMonth={calendarMonth}
          startMonth={startMonth}
          endMonth={endMonth}
          captionLayout="dropdown-years"
          navLayout="after"
          reverseYears
          onSelect={(date) => {
            editing.current = false;
            setInputValue(date ? format(date, DISPLAY_DATE_FORMAT) : "");
            onChange(date ? format(date, ISO_DATE_FORMAT) : "");
            onValidationError?.();
            setOpen(false);
          }}
          disabled={disabledDates.length ? disabledDates : undefined}
          locale={ptBR}
          initialFocus
          className="pointer-events-auto p-3"
        />
      </PopoverContent>
    </Popover>
  );
}
