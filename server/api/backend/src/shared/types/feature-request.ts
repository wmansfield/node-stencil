import { Account } from 'src/entities/account/account.model';
import { StencilJWTPayload } from './auth.types';

export interface FeatureAuth {
   payload: StencilJWTPayload;
}

/**
 * What a feature operation may read about its caller. HTTP passes the StencilRequest (which
 * satisfies this shape after AuthGuard); MCP builds it from the verified Forge identity and the
 * resolved account. Operations that need anything else from the HTTP request cannot be MCP tools.
 */
export interface FeatureRequest {
   auth?: FeatureAuth;
   account?: Account.Self;
}
