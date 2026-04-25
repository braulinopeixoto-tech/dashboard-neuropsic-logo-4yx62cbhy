import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

export function FormSlider({ name, label }: { name: string; label: string }) {
  const { control } = useFormContext()
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="bg-slate-50/50 p-4 rounded-lg border border-slate-100">
          <div className="flex justify-between items-center mb-3">
            <FormLabel className="text-sm font-semibold text-slate-700">{label}</FormLabel>
            <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
              {field.value || 0} / 10
            </span>
          </div>
          <FormControl>
            <Slider
              min={0}
              max={10}
              step={1}
              value={[field.value || 0]}
              onValueChange={(val) => field.onChange(val[0])}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

export function FormRadio({
  name,
  label,
  options,
}: {
  name: string
  label: string
  options: string[]
}) {
  const { control } = useFormContext()
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-3 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
          <FormLabel className="text-sm font-semibold text-slate-700">{label}</FormLabel>
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
                  <FormLabel className="font-normal capitalize cursor-pointer">{opt}</FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function FormText({ name, label }: { name: string; label: string }) {
  const { control } = useFormContext()
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-semibold text-slate-700">{label}</FormLabel>
          <FormControl>
            <Textarea {...field} value={field.value || ''} className="resize-none h-24" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function FormChecklist({
  name,
  label,
  options,
}: {
  name: string
  label: string
  options: string[]
}) {
  const { control } = useFormContext()
  return (
    <FormField
      control={control}
      name={name}
      render={() => (
        <FormItem className="bg-slate-50/50 p-4 rounded-lg border border-slate-100">
          <div className="mb-4">
            <FormLabel className="text-sm font-semibold text-slate-700">{label}</FormLabel>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((item) => (
              <FormField
                key={item}
                control={control}
                name={name}
                render={({ field }) => {
                  return (
                    <FormItem key={item} className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(item) ?? false}
                          onCheckedChange={(checked) => {
                            const current = field.value || []
                            return checked
                              ? field.onChange([...current, item])
                              : field.onChange(current.filter((val: string) => val !== item))
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">{item}</FormLabel>
                    </FormItem>
                  )
                }}
              />
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
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
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-slate-100 p-4 shadow-sm bg-slate-50/50">
          <FormControl>
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="font-normal cursor-pointer">{label}</FormLabel>
            {description && <p className="text-sm text-slate-500">{description}</p>}
          </div>
        </FormItem>
      )}
    />
  )
}
