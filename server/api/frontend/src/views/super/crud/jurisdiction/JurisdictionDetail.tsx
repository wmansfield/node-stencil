import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import classNames from '@/utils/classNames';
import { Meta } from '@/@types/routes';
import { ActionLink, AdaptiveCard } from '@/components/shared';
import { IJurisdiction } from '@/stencil/models/entities/jurisdiction';

import JurisdictionEditor from './JurisdictionEditor';
import { useGetJurisdictionQuery } from '@/stencil/endpoints/entities/jurisdictionApi';

import JurisdictionSettingList from '../jurisdictionsetting/JurisdictionSettingList';
import JurisdictionAssetList from '../jurisdictionasset/JurisdictionAssetList';
import AccountList from '../account/AccountList';
import WidgetList from '../widget/WidgetList';
import Loading from '@/components/shared/Loading';

import JurisdictionCrumb, { navigationForJurisdiction } from '../jurisdiction/JurisdictionCrumb';

type JurisdictionDetailProps = Meta & {
   className?: string;
};

function JurisdictionDetail(props: JurisdictionDetailProps) {
   const { className } = props;
   const { _id } = useParams();
   const navigate = useNavigate();
   const { t } = useTranslation();

   const jurisdictionQueryInput = _id!;

	let jurisdiction = useGetJurisdictionQuery(jurisdictionQueryInput, { refetchOnMountOrArgChange: true, skip: false });

   const onDelete = function (jurisdiction: IJurisdiction) {
      navigate(navigationForJurisdiction(''))
   };

   return (
      <div className={classNames('', className)}>
      
         <div className="flex flex-row gap-2 mb-4 ml-2">
            
            <JurisdictionCrumb as_root={true} _id={_id!} />
            
            <span >&gt;</span>
            Jurisdiction
         </div>
         <AdaptiveCard>
            <div className="flex flex-col gap-4">
               <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <h3 className="flex flex-row">Jurisdiction<Loading loading={jurisdiction.isLoading} type="inline" className="ml-4" /></h3>
                  
                  <JurisdictionEditor is_create={false} onDelete={onDelete} _id={_id!}  />
                  
               </div>
               <div className="flex flex-col gap-2" >
                  <div>Id: <b>{jurisdiction.data?.item?._id}</b></div>
                  
               </div>
            </div>
         </AdaptiveCard>

         <div className='my-8'>
            <JurisdictionSettingList expands={false} />
         </div>
         <div className='my-8'>
            <JurisdictionAssetList expands={false} />
         </div>
         <div className='my-8'>
            <AccountList expands={false} />
         </div>
         <div className='my-8'>
            <WidgetList expands={false} />
         </div>
         
      </div>
   );
}

export default JurisdictionDetail;