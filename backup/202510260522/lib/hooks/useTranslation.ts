import { useAppStore } from '../stores/app-store';
import { translations, TranslationKey } from '../i18n/translations';

export function useTranslation() {
  const language = useAppStore((state) => state.language);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  return { t, language };
}
