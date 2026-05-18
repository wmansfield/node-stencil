export type SignInResponse = {
   token: string;
   user: {
      userId: string;
      userName: string;
      authority: string[];
      avatar: string;
      email: string;
   };
};

export type SignUpResponse = SignInResponse;

export type AuthRequestStatus = 'success' | 'failed' | '';

export type AuthResult = Promise<{
   status: AuthRequestStatus;
   message: string;
}>;

export type User = {
   userId?: string | null;
   avatar?: string | null;
   userName?: string | null;
   email?: string | null;
   authority?: string[];
};

export type Token = {
   accessToken: string;
   refereshToken?: string;
};

export type OauthSignInCallbackPayload = {
   onSignIn: (tokens: Token, user?: User) => void;
   redirect: () => void;
};

export type OauthSignOutCallbackPayload = {
   onSignOut: (tokens: Token) => void;
   redirect: () => void;
};
