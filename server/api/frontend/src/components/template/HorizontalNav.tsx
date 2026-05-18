import HorizontalMenuContent from './HorizontalMenuContent';
import { useRouteKeyStore } from '@/store/routeKeyStore';
import { useAuth } from '@/auth';
import appConfig from '@/configs/app.config';
import navigationConfig from '@/configs/navigation.config';

const HorizontalNav = ({ translationSetup = appConfig.activeNavTranslation }: { translationSetup?: boolean }) => {
   const currentRouteKey = useRouteKeyStore(state => state.currentRouteKey);

   const { user } = useAuth();
   const userAuthority = user.authority || [];

   return (
      <HorizontalMenuContent
         navigationTree={navigationConfig}
         routeKey={currentRouteKey}
         userAuthority={userAuthority}
         translationSetup={translationSetup}
      />
   );
};

export default HorizontalNav;
