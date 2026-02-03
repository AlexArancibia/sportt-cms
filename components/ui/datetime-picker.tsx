"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface DateTimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  label?: string
}

export function DateTimePicker({ date, setDate, label }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const [timeValue, setTimeValue] = React.useState<string>(
    date ? format(date, "HH:mm") : format(new Date(), "HH:mm")
  )

  React.useEffect(() => {
    if (date) {
      setSelectedDate(date)
      setTimeValue(format(date, "HH:mm"))
    }
  }, [date])

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      setSelectedDate(undefined)
      setDate(undefined)
      return
    }

    // Si ya hay una fecha seleccionada, mantener la hora
    const currentTime = selectedDate || new Date()
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()

    // Combinar la nueva fecha con la hora actual
    const newDateTime = new Date(newDate)
    newDateTime.setHours(hours, minutes, 0, 0)

    setSelectedDate(newDateTime)
    setDate(newDateTime)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value
    setTimeValue(time)

    if (!selectedDate) {
      // Si no hay fecha seleccionada, usar la fecha actual
      const now = new Date()
      const [hours, minutes] = time.split(":").map(Number)
      now.setHours(hours || 0, minutes || 0, 0, 0)
      setSelectedDate(now)
      setDate(now)
      return
    }

    // Actualizar la hora de la fecha seleccionada
    const [hours, minutes] = time.split(":").map(Number)
    const newDateTime = new Date(selectedDate)
    newDateTime.setHours(hours || 0, minutes || 0, 0, 0)

    setSelectedDate(newDateTime)
    setDate(newDateTime)
  }

  return (
    <div className="space-y-3">
      {label && (
        <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      )}
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "flex-1 justify-start text-left font-normal bg-background",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>Elige una fecha</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Input
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
            className="w-[120px] bg-background"
          />
        </div>
      </div>
      {selectedDate && (
        <p className="text-xs text-muted-foreground">
          Fecha seleccionada: {format(selectedDate, "PPP 'a las' HH:mm")}
        </p>
      )}
    </div>
  )
}



