import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import classNames from '@/utils/classNames';
import { Meta } from '@/@types/routes';
import { ActionLink, AdaptiveCard } from '@/components/shared';
import { IAccount } from '@/stencil/models/entities/account';

import AccountEditor from './AccountEditor';
import { useGetAccountQuery } from '@/stencil/endpoints/entities/accountApi';

import Loading from '@/components/shared/Loading';
import JurisdictionCrumb, { navigationForJurisdiction } from '../jurisdiction/JurisdictionCrumb';

type AccountDetailProps = Meta & {
   className?: string;
};

function AccountDetail(props: AccountDetailProps) {
   const { className } = props;
   const { _id, jurisdiction_id } = useParams();
   const navigate = useNavigate();
   const { t } = useTranslation();

   const accountQueryInput = {
         jurisdiction_id: jurisdiction_id!,
         input: _id!
      };

	let account = useGetAccountQuery(accountQueryInput, { refetchOnMountOrArgChange: true, skip: false });

   const onDelete = function (account: IAccount) {
      navigate(navigationForJurisdiction(account.jurisdiction_id));
   };

   return (
      <div className={classNames('', className)}>
      
         <div className="flex flex-row gap-2 mb-4 ml-2">
            <JurisdictionCrumb _id={account.data?.item?.jurisdiction_id} />
            <span >&gt;</span>
            Account
         </div>
         <AdaptiveCard>
            <div className="flex flex-col gap-4">
               <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <h3 className="flex flex-row">Account<Loading loading={account.isLoading} type="inline" className="ml-4" /></h3>
                  
                  <AccountEditor is_create={false} onDelete={onDelete} _id={_id!} jurisdiction_id={jurisdiction_id!} />
                  
               </div>
               <div className="flex flex-col gap-2" >
                  <div>
                     Name: <b>{account.data?.item?.display_name}</b></div>
                  
               </div>
            </div>
         </AdaptiveCard>

         
      </div>
   );
}

export default AccountDetail;