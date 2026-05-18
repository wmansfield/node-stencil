import { HttpException, HttpStatus } from '@nestjs/common';
import { LocalizableString } from '../types/i18n/localizable-string';

export class UIException extends HttpException {
   localizableString: LocalizableString;

   constructor(message: LocalizableString) {
      super(message.interpolate(), HttpStatus.ACCEPTED);

      this.localizableString = message;
   }
}
