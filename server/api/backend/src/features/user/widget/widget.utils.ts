import { ContentSection } from 'src/entities/contentsection/contentsection.model';
import { Widget } from 'src/entities/widget/widget.model';

interface WidgetLanguageCopy {
   title?: string;
   description?: ContentSection[];
}

/**
 * Copies one language onto the widget's default fields.
 * `title` keeps the stored string unless `title_localized` has that language.
 * `description` keeps the stored sections unless `description_localized` has that language.
 * The caller passes a copy; this does not save.
 */
export class WidgetUtils {
   static prepareForLanguage(widget: Widget, language_code: string): void {
      const translations: Record<string, WidgetLanguageCopy> = {};
      if (widget.title_localized) {
         for (const item of widget.title_localized) {
            if (item.language_code) {
               if (!(item.language_code in translations)) {
                  translations[item.language_code] = {};
               }
               translations[item.language_code].title = item.text;
            }
         }
      }
      if (widget.description_localized) {
         for (const item of widget.description_localized) {
            if (item.language_code) {
               if (!(item.language_code in translations)) {
                  translations[item.language_code] = {};
               }
               translations[item.language_code].description = item.contents;
            }
         }
      }
      if (language_code in translations) {
         const translation = translations[language_code];
         if (translation.title) {
            widget.title = translation.title;
         }
         if (translation.description) {
            widget.description = translation.description;
         }
      }
   }
}
