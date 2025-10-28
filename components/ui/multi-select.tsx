import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export interface Option {
  label: string
  value: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[] | undefined
  onChange: (selected: string[]) => void
  className?: string
}

export function MultiSelect({ options, selected = [], onChange, className }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between bg-gray-50 dark:bg-gray-800 shadow-none text-primary min-h-[40px] h-auto", className)}
        >
          <div className="flex flex-wrap gap-1 items-center flex-1">
            {selected.length > 0 ? (
              selected.map((selectedValue) => {
                const option = options.find(opt => opt.value === selectedValue)
                return (
                  <Badge
                    key={selectedValue}
                    className="text-xs px-2 py-0.5 font-medium flex items-center gap-1 bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      onChange(selected.filter(item => item !== selectedValue))
                    }}
                  >
                    {option?.label || selectedValue}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" />
                  </Badge>
                )
              })
            ) : (
              <span className="text-muted-foreground">Selecciona...</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar..." />
          <CommandList>
            <CommandEmpty>Item no encontrado.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    onChange(
                      selected.includes(option.value)
                        ? selected.filter((item) => item !== option.value)
                        : [...selected, option.value],
                    )
                    setOpen(true)
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", selected.includes(option.value) ? "opacity-100" : "opacity-0")}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

