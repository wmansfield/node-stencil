import classNames from '@/utils/classNames';
import { Link } from 'react-router';
import type { CommonProps } from '@/@types/common';
import type { ComponentPropsWithoutRef } from 'react';

interface IActionLink extends CommonProps, ComponentPropsWithoutRef<'a'> {
   themeColor?: boolean;
   to?: string;
   href?: string;
   reloadDocument?: boolean;
}

const ActionLink = (props: IActionLink) => {
   const { children, className, themeColor = true, to, reloadDocument, href = '', ...rest } = props;

   const classNameProps = {
      className: classNames(themeColor && 'text-primary', 'hover:underline', className),
   };

   return to ? (
      <Link to={to} reloadDocument={reloadDocument} {...classNameProps} {...rest}>
         {children}
      </Link>
   ) : (
      <a href={href} {...classNameProps} {...rest}>
         {children}
      </a>
   );
};

export default ActionLink;
