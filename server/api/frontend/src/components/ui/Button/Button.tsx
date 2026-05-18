import classNames from '../utils/classNames';
import { useConfig } from '../ConfigProvider';
import { useForm } from '../Form/context';
import { useInputGroup } from '../InputGroup/context';
import { CONTROL_SIZES, SIZES } from '../utils/constants';
import { Spinner } from '../Spinner';
import type { CommonProps, TypeAttributes } from '../@types/common';
import type { ReactNode, ComponentPropsWithRef, MouseEvent, ElementType } from 'react';

export interface ButtonProps extends CommonProps, Omit<ComponentPropsWithRef<'button'>, 'onClick'> {
   asElement?: ElementType;
   active?: boolean;
   block?: boolean;
   clickFeedback?: boolean;
   color?: 'primary' | 'error' | 'success' | 'info' | 'warning' | 'default';
   customColorClass?: (state: { active: boolean; unclickable: boolean }) => string;
   disabled?: boolean;
   icon?: string | ReactNode;
   loading?: boolean;
   onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
   ref?: React.Ref<HTMLButtonElement>;
   shape?: TypeAttributes.Shape;
   size?: TypeAttributes.Size;
   variant?: 'solid' | 'plain' | 'default';
   iconAlignment?: 'start' | 'end';
}

type ButtonColor = {
   bgColor: string;
   hoverColor: string;
   activeColor: string;
   textColor: string;
};

const radiusShape: Record<TypeAttributes.Shape, string> = {
   round: 'rounded-xl',
   circle: 'rounded-full',
   none: 'rounded-none',
};

const Button = (props: ButtonProps) => {
   const {
      asElement: Component = 'button',
      active = false,
      block = false,
      children,
      className,
      clickFeedback = true,
      color = 'primary',
      customColorClass,
      disabled,
      icon,
      loading = false,
      ref,
      shape = 'round',
      size,
      variant = 'default',
      iconAlignment = 'start',
      ...rest
   } = props;
   const { controlSize, ui } = useConfig();
   const formControlSize = useForm()?.size;
   const inputGroupSize = useInputGroup()?.size;
   const defaultClass = 'button';
   const sizeIconClass = 'inline-flex items-center justify-center';

   const buttonSize = size || inputGroupSize || formControlSize || controlSize;
   const feedback = !ui?.button?.disableClickFeedback || clickFeedback;
   const unclickable = disabled || loading;

   const getButtonSize = () => {
      let sizeClass = '';
      switch (buttonSize) {
         case SIZES.LG:
            sizeClass = classNames(
               CONTROL_SIZES.lg.h,
               radiusShape[shape],
               icon && !children ? `${CONTROL_SIZES.lg.w} ${sizeIconClass} text-2xl` : 'px-8 py-2 text-base'
            );
            break;
         case SIZES.SM:
            sizeClass = classNames(
               CONTROL_SIZES.sm.h,
               shape === 'round' ? 'rounded-xl' : radiusShape[shape],
               icon && !children ? `${CONTROL_SIZES.sm.w} ${sizeIconClass} text-lg` : 'px-3 py-2 text-sm'
            );
            break;
         case SIZES.XS:
            sizeClass = classNames(
               CONTROL_SIZES.xs.h,
               shape === 'round' ? 'rounded-lg' : radiusShape[shape],
               icon && !children ? `${CONTROL_SIZES.xs.w} ${sizeIconClass} text-base` : 'px-3 py-1 text-xs'
            );
            break;
         default:
            sizeClass = classNames(
               CONTROL_SIZES.md.h,
               radiusShape[shape],
               icon && !children ? `${CONTROL_SIZES.md.w} ${sizeIconClass} text-xl` : 'px-5 py-2'
            );
            break;
      }
      return sizeClass;
   };

   const disabledClass = 'opacity-50 cursor-not-allowed';

   const solidColor = () => {
      let btn: ButtonColor;

      switch (color) {
         case 'error':
            btn = {
               bgColor: active ? `bg-error` : `bg-error`,
               textColor: 'text-neutral',
               hoverColor: active ? '' : `hover:bg-error/80`,
               activeColor: ``,
            };
            break;
         case 'success':
            btn = {
               bgColor: active ? `bg-success` : `bg-success`,
               textColor: 'text-neutral',
               hoverColor: active ? '' : `hover:bg-success/80`,
               activeColor: ``,
            };
            break;
         case 'info':
            btn = {
               bgColor: active ? `bg-info` : `bg-info`,
               textColor: 'text-neutral',
               hoverColor: active ? '' : `hover:bg-info/80`,
               activeColor: ``,
            };
            break;
         case 'warning':
            btn = {
               bgColor: active ? `bg-warning` : `bg-warning`,
               textColor: 'text-neutral',
               hoverColor: active ? '' : `hover:bg-warning/80`,
               activeColor: ``,
            };
            break;
         case 'primary':
         default:
            btn = {
               bgColor: active ? `bg-primary-deep` : `bg-primary`,
               textColor: 'text-neutral',
               hoverColor: active ? '' : `hover:bg-primary-mild`,
               activeColor: ``,
            };
            break;
      }

      return getBtnColor(btn);
   };

   const plainColor = () => {
      let btn: ButtonColor;

      switch (color) {
         case 'error':
            btn = {
               bgColor: active ? `` : `border border-transparent`,
               textColor: `text-error`,
               hoverColor: active ? '' : `hover:text-error/80 hover:border-error/80`,
               activeColor: `active:text-error`,
            };
            break;
         case 'success':
            btn = {
               bgColor: active ? `` : `border border-transparent`,
               textColor: `text-success`,
               hoverColor: active ? '' : `hover:text-success/80 hover:border-success/80`,
               activeColor: `active:text-success`,
            };
            break;
         case 'info':
            btn = {
               bgColor: active ? `` : `border border-transparent`,
               textColor: `text-info`,
               hoverColor: active ? '' : `hover:text-info/80 hover:border-info/80`,
               activeColor: `active:text-info`,
            };
            break;
         case 'warning':
            btn = {
               bgColor: active ? `` : `border border-transparent`,
               textColor: `text-warning`,
               hoverColor: active ? '' : `hover:text-warning/80 hover:border-warning/80`,
               activeColor: `active:text-warning`,
            };
            break;
         case 'primary':
         default:
            btn = {
               bgColor: active ? `` : `border border-transparent`,
               textColor: `text-primary`,
               hoverColor: active ? '' : `hover:text-primary-mild hover:border-primary-mild`,
               activeColor: `active:text-primary`,
            };
            break;
      }

      return getBtnColor(btn);
   };

   const defaultColor = () => {
      let btn: ButtonColor;

      switch (color) {
         case 'error':
            btn = {
               bgColor: active
                  ? `bg-error-subtle border border-error dark:bg-error-subtle dark:border-error`
                  : `bg-white border border-error dark:bg-gray-700 dark:border-error`,
               textColor: `text-error dark:text-error`,
               hoverColor: active
                  ? ''
                  : `ring-error hover:border-error hover:ring-1 hover:text-error dark:hover:text-error dark:hover:bg-transparent`,
               activeColor: ``,
            };
            break;
         case 'success':
            btn = {
               bgColor: active
                  ? `bg-success-subtle border border-success dark:bg-success-subtle dark:border-success`
                  : `bg-white border border-success dark:bg-gray-700 dark:border-success`,
               textColor: `text-success dark:text-success`,
               hoverColor: active
                  ? ''
                  : `ring-success hover:border-success hover:ring-1 hover:text-success dark:hover:text-success dark:hover:bg-transparent`,
               activeColor: ``,
            };
            break;
         case 'info':
            btn = {
               bgColor: active
                  ? `bg-info-subtle border border-info dark:bg-info-subtle dark:border-info`
                  : `bg-white border border-info dark:bg-gray-700 dark:border-info`,
               textColor: `text-info dark:text-info`,
               hoverColor: active ? '' : `ring-info hover:border-info hover:ring-1 hover:text-info dark:hover:text-info dark:hover:bg-transparent`,
               activeColor: ``,
            };
            break;
         case 'warning':
            btn = {
               bgColor: active
                  ? `bg-warning-subtle border border-warning dark:bg-warning-subtle dark:border-warning`
                  : `bg-white border border-warning dark:bg-gray-700 dark:border-warning`,
               textColor: `text-warning dark:text-warning`,
               hoverColor: active
                  ? ''
                  : `ring-warning hover:border-warning hover:ring-1 hover:text-warning dark:hover:text-warning dark:hover:bg-transparent`,
               activeColor: ``,
            };
            break;
         case 'primary':
         default:
            btn = {
               bgColor: active
                  ? `bg-gray-100 border border-gray-300 dark:bg-gray-600 dark:border-gray-500`
                  : `bg-white border border-gray-300 dark:bg-gray-700 dark:border-gray-500`,
               textColor: `text-gray-700 dark:text-gray-200`,
               hoverColor: active
                  ? ''
                  : `ring-primary hover:border-primary hover:ring-1 hover:text-primary dark:hover:text-gray-100 dark:hover:bg-gray-600 dark:ring-gray-500 dark:hover:border-gray-400`,
               activeColor: ``,
            };
            break;
      }

      return getBtnColor(btn);
   };

   const getBtnColor = ({ bgColor, hoverColor, activeColor, textColor }: ButtonColor) => {
      return `${bgColor} ${unclickable ? disabledClass : hoverColor + ' ' + activeColor} ${textColor}`;
   };

   const btnColor = () => {
      switch (variant) {
         case 'solid':
            return solidColor();
         case 'plain':
            return plainColor();
         case 'default':
            return defaultColor();
         default:
            return defaultColor();
      }
   };

   const classes = classNames(
      defaultClass,
      btnColor(),
      getButtonSize(),
      className,
      block ? 'w-full' : '',
      feedback && !unclickable && 'button-press-feedback',
      customColorClass?.({
         active,
         unclickable,
      })
   );

   const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      const { onClick } = props;
      if (unclickable) {
         e.preventDefault();
         return;
      }
      onClick?.(e);
   };

   const renderChildren = () => {
      if (loading && children) {
         return (
            <span className="flex items-center justify-center">
               <Spinner enableTheme={false} className="mr-1" />
               {children}
            </span>
         );
      }

      if (icon && !children && loading) {
         return <Spinner enableTheme={false} />;
      }

      if (icon && !children && !loading) {
         return <>{icon}</>;
      }

      if (icon && children && !loading) {
         return (
            <span className="flex gap-1 items-center justify-center">
               {iconAlignment === 'start' && <span className="text-lg">{icon}</span>}
               <span>{children}</span>
               {iconAlignment === 'end' && <span className="text-lg">{icon}</span>}
            </span>
         );
      }

      return <>{children}</>;
   };

   return (
      <Component ref={ref} className={classes} {...rest} onClick={handleClick}>
         {renderChildren()}
      </Component>
   );
};

export default Button;
