export class LocalizableString {
   token: string;
   default_text: string;
   args?: any[];

   constructor(token: string, default_text: string, args?: any[]) {
      this.token = token;
      this.default_text = default_text;
      this.args = args;
   }

   /**
    * Returns the default text with positional placeholders ({0}, {1}, …)
    * replaced by their corresponding args values.
    *
    * When server-side translations are added, this method should first
    * resolve the translated template via `token`, then interpolate.
    */
   interpolate(): string {
      if (!this.args || this.args.length === 0) {
         return this.default_text;
      }
      return this.default_text.replace(/\{(\d+)\}/g, (match, index) => {
         const i = parseInt(index, 10);
         return i < this.args!.length ? String(this.args![i]) : match;
      });
   }

   static General_InvalidToken(): LocalizableString {
      return new LocalizableString('general.InvalidToken', 'Invalid or expired token provided.');
   }
   static General_ValidationError(): LocalizableString {
      return new LocalizableString('general.ValidationFailed', 'Validation Failed. Please check entity.');
   }
   static General_FieldRequired(fieldName: string): LocalizableString {
      return new LocalizableString('general.fieldRequired', 'A value must be provided for {0}.', [fieldName]);
   }
   static General_FieldMinLength(minLength: number, fieldName: string): LocalizableString {
      return new LocalizableString('general.fieldMinLength', 'The value for {0} must be at least {1} characters.', [fieldName, minLength]);
   }
   static General_FieldMaxLength(maxLength: number, fieldName: string): LocalizableString {
      return new LocalizableString('general.fieldMaxLength', 'The value for {0} cannot be more than {1} characters.', [fieldName, maxLength]);
   }
   static General_FieldMinValue(minValue: number, fieldName: string): LocalizableString {
      return new LocalizableString('general.fieldMinValue', 'The value for {0} cannot be less than {1}.', [fieldName, minValue]);
   }
   static General_FieldMaxValue(maxValue: number, fieldName: string): LocalizableString {
      return new LocalizableString('general.fieldMaxValue', 'The value for {0} cannot be more than {1}.', [fieldName, maxValue]);
   }
   static General_InvalidReference(entityName: string): LocalizableString {
      return new LocalizableString('general.invalidReference', 'The referenced {0} does not exist.', [entityName]);
   }
   static General_ReferenceInUse(entityName: string): LocalizableString {
      return new LocalizableString('general.referenceInUse', 'The item is currently in use by {0}.', [entityName]);
   }
   static General_NotYetSupported(): LocalizableString {
      return new LocalizableString('general.NotYetSupported', 'Validation Failed. The type of item you have requested is not yet supported.');
   }
   static General_ErrorProcessingRequest(): LocalizableString {
      return new LocalizableString('general.ErrorProcessingRequest', 'Error while processing request. Please check for success before trying again.');
   }
   static General_InvalidRoute(): LocalizableString {
      return new LocalizableString('general.invalidRoute', 'The routing does not match the provided document.');
   }
   static General_MissingForSave(): LocalizableString {
      return new LocalizableString('general.SaveMissing', 'Error saving data. Please refresh and try again.');
   }
   static General_AccessDenied_Operation(): LocalizableString {
      return new LocalizableString(
         'general.CRUD_AccessDenied_Operation',
         'Access Denied. Cannot perform requested operation. Please check security or contact an administrator.'
      );
   }
   static General_AccessDenied_Create(): LocalizableString {
      return new LocalizableString(
         'general.CRUD_AccessDenied_Create',
         'Access Denied. Cannot create requested item. Please check security or contact an administrator.'
      );
   }
   static General_AccessDenied_Retrieve(): LocalizableString {
      return new LocalizableString(
         'general.CRUD_AccessDenied_Retrieve',
         'Access Denied. Cannot retrieve requested item. Please check security or contact an administrator.'
      );
   }
   static General_AccessDenied_List(): LocalizableString {
      return new LocalizableString(
         'general.CRUD_AccessDenied_List',
         'Access Denied. Cannot list requested items. Please check security or contact an administrator.'
      );
   }
   static General_AccessDenied_Search(): LocalizableString {
      return new LocalizableString(
         'general.CRUD_AccessDenied_Search',
         'Access Denied. Cannot search requested items. Please check security or contact an administrator.'
      );
   }
   static General_AccessDenied_Update(): LocalizableString {
      return new LocalizableString(
         'general.CRUD_AccessDenied_Update',
         'Access Denied. Cannot updated requested item. Please check security or contact an administrator.'
      );
   }
   static General_AccessDenied_Delete(): LocalizableString {
      return new LocalizableString(
         'general.CRUD_AccessDenied_Delete',
         'Access Denied. Cannot delete requested item. Please check security or contact an administrator.'
      );
   }
}
