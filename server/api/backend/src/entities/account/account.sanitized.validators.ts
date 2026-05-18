import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import { Account } from './account.model';
import {
   assertString,
   assertStringArray,
   assertBoolean,
   assertNumber,
   assertUuid,
   assertDate,
   assertEnum,
   assertEnumArray,
   assertPlainObject,
   assertNested,
   assertNestedArray,
   optional,
} from 'src/shared/utils/sanitized.validators';

import { AccountStatus } from 'src/entities/enums/accountstatus';
import { MediaInfo } from '../mediainfo/mediainfo.model';
import '../mediainfo/mediainfo.sanitized.validators';


const accountValidators: SanitizedValidatorMap = {
_id: (v) => optional(assertUuid)(v, '_id'),
jurisdiction_id: (v) => assertString(v, 'jurisdiction_id'),
asset_id_avatar: (v) => optional(assertUuid)(v, 'asset_id_avatar'),
email: (v) => assertString(v, 'email'),
display_name: (v) => optional(assertString)(v, 'display_name'),
auth_identifier: (v) => assertString(v, 'auth_identifier'),
auth_provider: (v) => assertString(v, 'auth_provider'),
joined_utc: (v) => assertDate(v, 'joined_utc'),
account_status: (v) => assertEnum(AccountStatus)(v, 'account_status'),
roles: (v) => optional(assertStringArray)(v, 'roles'),

};

registerSanitizedValidators(Account, accountValidators);


const accountinternalValidators: SanitizedValidatorMap = {
_id: (v) => optional(assertUuid)(v, '_id'),
email: (v) => assertString(v, 'email'),

};

registerSanitizedValidators(Account.Internal, accountinternalValidators);


const accountpublicValidators: SanitizedValidatorMap = {
_id: (v) => optional(assertUuid)(v, '_id'),
jurisdiction_id: (v) => assertString(v, 'jurisdiction_id'),
display_name: (v) => optional(assertString)(v, 'display_name'),
avatar: (v) => optional(assertNested(MediaInfo))(v, 'avatar'),

};

registerSanitizedValidators(Account.Public, accountpublicValidators);


const accountconnectionValidators: SanitizedValidatorMap = {
_id: (v) => optional(assertUuid)(v, '_id'),
jurisdiction_id: (v) => assertString(v, 'jurisdiction_id'),
display_name: (v) => optional(assertString)(v, 'display_name'),
avatar: (v) => optional(assertNested(MediaInfo))(v, 'avatar'),

};

registerSanitizedValidators(Account.Connection, accountconnectionValidators);


const accountselfValidators: SanitizedValidatorMap = {
_id: (v) => optional(assertUuid)(v, '_id'),
email: (v) => assertString(v, 'email'),
joined_utc: (v) => assertDate(v, 'joined_utc'),
display_name: (v) => optional(assertString)(v, 'display_name'),
roles: (v) => optional(assertStringArray)(v, 'roles'),
account_status: (v) => assertEnum(AccountStatus)(v, 'account_status'),
avatar: (v) => optional(assertNested(MediaInfo))(v, 'avatar'),
jurisdiction_id: (v) => assertString(v, 'jurisdiction_id'),
auth_provider: (v) => assertString(v, 'auth_provider'),
token: (v) => assertString(v, 'token'),
impersonated: (v) => assertBoolean(v, 'impersonated'),

};

registerSanitizedValidators(Account.Self, accountselfValidators);


const accountidentityValidators: SanitizedValidatorMap = {
_id: (v) => optional(assertUuid)(v, '_id'),
auth_identifier: (v) => assertString(v, 'auth_identifier'),

};

registerSanitizedValidators(Account.Identity, accountidentityValidators);