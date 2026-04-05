/**
 * Returns the BCP-47 locale string for the given language code.
 * Centralises locale mapping to avoid duplication across components.
 * @param {string} language - Language code (e.g. 'pt', 'en', 'es')
 * @returns {string} BCP-47 locale string
 */
export const getActiveLocale = (language) => {
  const localeMap = { pt: 'pt-PT', en: 'en-US', es: 'es-ES' };
  return localeMap[language] || 'pt-PT';
};
