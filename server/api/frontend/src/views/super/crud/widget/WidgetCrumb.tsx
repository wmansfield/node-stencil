import { ActionLink } from '@/components/shared';
import JurisdictionCrumb from '../jurisdiction/JurisdictionCrumb';

export function navigationForWidget(jurisdiction_id?: string, _id?: string) {
   return `/super/jurisdiction/${jurisdiction_id}/widget/${_id}`;
}

type WidgetCrumbProps = {
   as_root?:boolean;
   _id?: string;
   jurisdiction_id: string;
}
function WidgetCrumb({_id, as_root = false, jurisdiction_id}: WidgetCrumbProps) {
   return (
      <>{/* //TODO:SHOULD:WILL:Crud Crumbs */}
         <JurisdictionCrumb  />
         
         { 
            !as_root &&
            <>
            <span>&gt;</span>
            <ActionLink to={navigationForWidget(jurisdiction_id, _id)}>Widget</ActionLink>
            </>
         }
      </>
   );
}

export default WidgetCrumb;