import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import classNames from '@/utils/classNames';
import { Meta } from '@/@types/routes';
import { ActionLink, AdaptiveCard } from '@/components/shared';
import { IWidget } from '@/stencil/models/entities/widget';

import WidgetEditor from './WidgetEditor';
import { useGetWidgetQuery } from '@/stencil/endpoints/entities/widgetApi';

import Loading from '@/components/shared/Loading';
import JurisdictionCrumb, { navigationForJurisdiction } from '../jurisdiction/JurisdictionCrumb';

type WidgetDetailProps = Meta & {
   className?: string;
};

function WidgetDetail(props: WidgetDetailProps) {
   const { className } = props;
   const { _id, jurisdiction_id } = useParams();
   const navigate = useNavigate();
   const { t } = useTranslation();

   const widgetQueryInput = {
         jurisdiction_id: jurisdiction_id!,
         input: _id!
      };

	let widget = useGetWidgetQuery(widgetQueryInput, { refetchOnMountOrArgChange: true, skip: false });

   const onDelete = function (widget: IWidget) {
      navigate(navigationForJurisdiction(widget.jurisdiction_id));
   };

   return (
      <div className={classNames('', className)}>
      
         <div className="flex flex-row gap-2 mb-4 ml-2">
            <JurisdictionCrumb _id={widget.data?.item?.jurisdiction_id} />
            <span >&gt;</span>
            Widget
         </div>
         <AdaptiveCard>
            <div className="flex flex-col gap-4">
               <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <h3 className="flex flex-row">Widget<Loading loading={widget.isLoading} type="inline" className="ml-4" /></h3>
                  
                  <WidgetEditor is_create={false} onDelete={onDelete} _id={_id!} jurisdiction_id={jurisdiction_id!} />
                  
               </div>
               <div className="flex flex-col gap-2" >
                  <div>
                     Name: <b>{widget.data?.item?.title}</b></div>
                  
               </div>
            </div>
         </AdaptiveCard>

         
      </div>
   );
}

export default WidgetDetail;