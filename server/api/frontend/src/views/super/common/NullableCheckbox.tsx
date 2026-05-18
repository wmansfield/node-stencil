import { Checkbox, CheckboxProps, CheckboxValue, Switcher } from '@/components/ui';
import { ChangeEvent, useCallback, useMemo, useState } from 'react';

type NullableCheckboxProps = {
   onChange: (checked?: boolean) => void;
   name?: string;
   readOnly?: boolean;
   value?: boolean;
};

function NullableCheckbox(props: NullableCheckboxProps) {
   const [provideValue, setProvideValue] = useState<boolean>(() => props.value !== undefined);

   const handleProvideValue = useCallback((checked: boolean) => {
      setProvideValue(checked);
      if (props.onChange) {
         if (!checked) {
            props.onChange(undefined);
         } else {
            props.onChange(props.value);
         }
      }
   }, []);

   const handleChange = useCallback(
      (checked: boolean, e: ChangeEvent<HTMLInputElement>) => {
         if (provideValue) {
            if (props.onChange) {
               props.onChange(checked === true);
            }
         }
      },
      [provideValue, props.value]
   );
   return (
      <div className="flex flex-row items-center gap-2">
         <div>
            <Checkbox onChange={handleProvideValue} readOnly={props.readOnly} checked={provideValue} />
         </div>
         {provideValue ? (
            <div>
               <Switcher
                  onChange={handleChange}
                  name={props.name}
                  readOnly={props.readOnly}
                  checkedContent="On"
                  unCheckedContent="Off"
                  className={`transition-colors ${props.value == true ? 'bg-emerald-500 py-4 px-2' : 'bg-gray-400 py-4 px-2'}`}
                  checked={props.value}
               />
            </div>
         ) : (
            <div>Not Configured</div>
         )}
      </div>
   );
}

export default NullableCheckbox;
