import Spinner from '@/components/ui/Spinner';
import classNames from 'classnames';
import type { CommonProps } from '@/@types/common';
import type { ElementType, ReactNode } from 'react';
import { TbRefresh } from 'react-icons/tb';

interface BaseLoadingProps extends CommonProps {
   asElement?: ElementType;
   customLoader?: ReactNode;
   loading: boolean;
   spinnerClass?: string;
   customColorClass?: string;
}

interface LoadingProps extends BaseLoadingProps {
   type?: 'default' | 'cover' | 'inline' | 'refreshing';
}

const RefreshLoading = (props: BaseLoadingProps) => {
   const { loading, children, customColorClass, spinnerClass, className, asElement: Component = 'div', customLoader } = props;

   return loading ? (
      <Component className={classNames(!customLoader && 'flex flex-row items-center', className)}>
         {customLoader ? (
            <>{customLoader}</>
         ) : (
            <Spinner className={spinnerClass} size={20} indicator={TbRefresh} customColorClass={customColorClass} />
         )}
      </Component>
   ) : (
      <>
         {children || (
            <Spinner
               className={spinnerClass}
               customColorClass={customColorClass || 'text-inherit'}
               size={20}
               indicator={TbRefresh}
               isSpining={false}
            />
         )}
      </>
   );
};
const InlineLoading = (props: BaseLoadingProps) => {
   const { loading, children, customColorClass, spinnerClass, className, asElement: Component = 'div', customLoader } = props;

   return loading ? (
      <Component className={classNames(!customLoader && 'flex flex-row items-center', className)}>
         {customLoader ? <>{customLoader}</> : <Spinner className={spinnerClass} size={20} customColorClass={customColorClass} />}
      </Component>
   ) : (
      <>{children}</>
   );
};

const DefaultLoading = (props: BaseLoadingProps) => {
   const { loading, children, customColorClass, spinnerClass, className, asElement: Component = 'div', customLoader } = props;

   return loading ? (
      <Component className={classNames(!customLoader && 'flex items-center justify-center h-full', className)}>
         {customLoader ? <>{customLoader}</> : <Spinner className={spinnerClass} size={40} customColorClass={customColorClass} />}
      </Component>
   ) : (
      <>{children}</>
   );
};

const CoveredLoading = (props: BaseLoadingProps) => {
   const { loading, children, customColorClass, spinnerClass, className, asElement: Component = 'div', customLoader } = props;

   return (
      <Component className={classNames(loading ? 'relative' : '', className)}>
         {children}
         {loading && <div className="w-full h-full bg-white/50 dark:bg-gray-800/60 absolute inset-0" />}
         {loading && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
               {customLoader ? <>{customLoader}</> : <Spinner className={spinnerClass} size={20} customColorClass={customColorClass} />}
            </div>
         )}
      </Component>
   );
};

const Loading = ({ type = 'default', loading = false, asElement = 'div', ...rest }: LoadingProps) => {
   switch (type) {
      case 'default':
         return <DefaultLoading loading={loading} asElement={asElement} {...rest} />;
      case 'cover':
         return <CoveredLoading loading={loading} asElement={asElement} {...rest} />;
      case 'inline':
         return <InlineLoading loading={loading} asElement={asElement} {...rest} />;
      case 'refreshing':
         return <RefreshLoading loading={loading} asElement={asElement} {...rest} />;
      default:
         return <DefaultLoading loading={loading} asElement={asElement} {...rest} />;
   }
};

export default Loading;
