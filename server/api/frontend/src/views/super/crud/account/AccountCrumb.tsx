import { ActionLink } from '@/components/shared';
import JurisdictionCrumb from '../jurisdiction/JurisdictionCrumb';

export function navigationForAccount(jurisdiction_id?: string, _id?: string) {
   return `/super/jurisdiction/${jurisdiction_id}/account/${_id}`;
}

type AccountCrumbProps = {
   as_root?:boolean;
   _id?: string;
   jurisdiction_id: string;
}
function AccountCrumb({_id, as_root = false, jurisdiction_id}: AccountCrumbProps) {
   return (
      <>{/* //TODO:SHOULD:WILL:Crud Crumbs */}
         <JurisdictionCrumb  />
         
         { 
            !as_root &&
            <>
            <span>&gt;</span>
            <ActionLink to={navigationForAccount(jurisdiction_id, _id)}>Account</ActionLink>
            </>
         }
      </>
   );
}

export default AccountCrumb;