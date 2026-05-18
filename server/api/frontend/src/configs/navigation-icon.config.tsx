import {
   PiHouseLineDuotone,
   PiArrowsInDuotone,
   PiBookOpenUserDuotone,
   PiBookBookmarkDuotone,
   PiAcornDuotone,
   PiBagSimpleDuotone,
   PiCodesandboxLogoDuotone,
   PiBandaidsDuotone,
   PiWrenchDuotone,
   PiBuildingsDuotone,
   PiDevToLogoBold,
   PiMegaphoneDuotone,
   PiFilesDuotone,
   PiBookOpenDuotone,
   PiAddressBookBold,
   PiAddressBookDuotone,
} from 'react-icons/pi';
import type { JSX } from 'react';

export type NavigationIcons = Record<string, JSX.Element>;

const navigationIcon: NavigationIcons = {
   home: <PiHouseLineDuotone />,
   singleMenu: <PiAcornDuotone />,
   collapseMenu: <PiArrowsInDuotone />,
   groupSingleMenu: <PiBookOpenUserDuotone />,
   groupCollapseMenu: <PiBookBookmarkDuotone />,
   groupMenu: <PiBagSimpleDuotone />,
   admin: <PiBandaidsDuotone />,
   super: <PiCodesandboxLogoDuotone />,
   tasks: <PiWrenchDuotone />,
   portal: <PiBuildingsDuotone />,
   spike: <PiDevToLogoBold />,
   announcements: <PiMegaphoneDuotone />,
   documents: <PiFilesDuotone />,
   portals: <PiBookOpenDuotone />,
   plans: <PiAddressBookDuotone />,
};

export default navigationIcon;
