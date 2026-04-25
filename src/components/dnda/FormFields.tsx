import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FormSlider({
  name,
  label,
  required = true,
}: {
  name: string
  label: string
  required?: boolean
}) {
  const { control } = useFormContext()
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const isValid = field.value !== undefined && field.value !== null && field.value !== ''
        return (
          <FormItem className="bg-white p-[20px] rounded-xl border border-slate-200 hover:border-primary transition-colors duration-200 shadow-sm flex flex-col space-y-[16px]">
            <div className="flex justify-between items-center">
              <FormLabel className="text-[14px] font-semibold text-slate-700 flex items-center gap-2">
                {label} {required && <span className="text-red-500">*</span>}
                {isValid && (
                  <CheckCircle2 className="w-4 h-4 text-success animate-in fade-in zoom-in duration-300" />
                )}
              </FormLabel>
              <span className="text-[14px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md transition-all duration-200">
                {isValid ? field.value : '-'} / 10
              </span>
            </div>
            <FormControl>
              <Slider
                min={0}
                max={10}
                step={1}
                value={[isValid ? field.value : 0]}
                onValueChange={(val) => field.onChange(val[0])}
                className="py-2"
              />
            </FormControl>
          </FormItem>
        )
      }}
    />
  )
}

export function FormRadio({
  name,
  label,
  options,
  required = true,
}: {
  name: string
  label: string
  options: string[]
  required?: boolean
}) {
  const { control } = useFormContext()
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const isValid = field.value !== undefined && field.value !== null && field.value !== ''
        return (
          <FormItem className="bg-white p-[20px] rounded-xl border border-slate-200 hover:border-primary transition-colors duration-200 shadow-sm space-y-[16px]">
            <FormLabel className="text-[14px] font-semibold text-slate-700 flex items-center gap-2">
              {label} {required && <span className="text-red-500">*</span>}
              {isValid && (
                <CheckCircle2 className="w-4 h-4 text-success animate-in fade-in zoom-in duration-300" />
              )}
            </FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
                className="flex flex-col space-y-2"
              >
                {options.map((opt) => (
                  <FormItem key={opt} className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value={opt} />
                    </FormControl>
                    <FormLabel className="text-[14px] font-normal capitalize cursor-pointer">
                      {opt}
                    </FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

export function FormText({
  name,
  label,
  required = true,
}: {
  name: string
  label: string
  required?: boolean
}) {
  const { control } = useFormContext()
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const isValid = field.value !== undefined && field.value !== null && field.value !== ''
        return (
          <FormItem className="bg-white p-[20px] rounded-xl border border-slate-200 hover:border-primary transition-colors duration-200 shadow-sm space-y-[16px]">
            <FormLabel className="text-[14px] font-semibold text-slate-700 flex items-center gap-2">
              {label} {required && <span className="text-red-500">*</span>}
              {isValid && (
                <CheckCircle2 className="w-4 h-4 text-success animate-in fade-in zoom-in duration-300" />
              )}
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value || ''}
                className="resize-none h-24 text-[14px] font-normal transition-all duration-200"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

export function FormChecklist({
  name,
  label,
  options,
  required = false,
}: {
  name: string
  label: string
  options: string[]
  required?: boolean
}) {
  const { control } = useFormContext()
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const isValid = field.value !== undefined && field.value !== null && field.value.length > 0
        return (
          <FormItem className="bg-white p-[20px] rounded-xl border border-slate-200 hover:border-primary transition-colors duration-200 shadow-sm space-y-[16px]">
            <FormLabel className="text-[14px] font-semibold text-slate-700 flex items-center gap-2">
              {label} {required && <span className="text-red-500">*</span>}
              {isValid && (
                <CheckCircle2 className="w-4 h-4 text-success animate-in fade-in zoom-in duration-300" />
              )}
            </FormLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {options.map((item) => (
                <FormField
                  key={item}
                  control={control}
                  name={name}
                  render={({ field: subField }) => {
                    return (
                      <FormItem
                        key={item}
                        className="flex flex-row items-center space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={subField.value?.includes(item) ?? false}
                            onCheckedChange={(checked) => {
                              const current = subField.value || []
                              return checked
                                ? subField.onChange([...current, item])
                                : subField.onChange(current.filter((val: string) => val !== item))
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-[14px] font-normal cursor-pointer">
                          {item}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

export function FormCheckboxBoolean({
  name,
  label,
  description,
}: {
  name: string
  label: string
  description?: string
}) {
  const { control } = useFormContext()
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-slate-200 p-[20px] shadow-sm bg-white hover:border-primary transition-colors duration-200">
          <FormControl>
            <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
          </FormControl>
          <div className="space-y-1 leading-none flex-1">
            <FormLabel className="text-[14px] font-normal cursor-pointer flex items-center gap-2">
              {label}
              {field.value && (
                <CheckCircle2 className="w-4 h-4 text-success animate-in fade-in zoom-in duration-300" />
              )}
            </FormLabel>
            {description && <p className="text-[12px] text-slate-500 mt-1">{description}</p>}
          </div>
        </FormItem>
      )}
    />
  )
}
