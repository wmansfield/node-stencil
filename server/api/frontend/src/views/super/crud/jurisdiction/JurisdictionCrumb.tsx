import { ActionLink } from '@/components/shared';


export function navigationForJurisdiction(_id?: string) {
   return `/super/jurisdiction/${_id}`;
}

type JurisdictionCrumbProps = {
   as_root?:boolean;
   _id?: string;
   
}
function JurisdictionCrumb({_id, as_root = false}: JurisdictionCrumbProps) {
   return (
      <>
         <ActionLink to={`/super/jurisdiction`}>Jurisdictions</ActionLink>
         
         { 
            !as_root &&
            <>
            <span>&gt;</span>
            <ActionLink to={navigationForJurisdiction(_id)}>Jurisdiction</ActionLink>
            </>
         }
      </>
   );
}

export default JurisdictionCrumb;