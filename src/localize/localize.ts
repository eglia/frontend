import IntlMessageFormat from "intl-messageformat";
import { HacsLogger } from "../tools/hacs-logger";
import { languages } from "./generated";

const DEFAULT_LANGUAGE = "en";
const IGNORE_LANGUAGES = new Set(["en_GB"]);
const logger = new HacsLogger("localize");
const warnings: { language: string[]; sting: Record<string, Array<string>> } = {
  language: [],
  sting: {},
};

const _localizationCache = {};

export function localize(language: string, string: string, replace?: Record<string, any>): string {
  let lang = (language || localStorage.getItem("selectedLanguage") || DEFAULT_LANGUAGE)
    .replace(/['"]+/g, "")
    .replace("-", "_");

  if (IGNORE_LANGUAGES.has(lang) || !languages[lang]) {
    if (!IGNORE_LANGUAGES.has(lang) && !warnings.language?.includes(lang)) {
      warnings.language.push(lang);
      logger.warn(
        `Language '${lang.replace(
          "_",
          "-"
        )}' is not added to HACS, using '${DEFAULT_LANGUAGE}' instead. https://hacs.xyz/docs/developer/translation`
      );
    }
    lang = DEFAULT_LANGUAGE;
  }

  const translatedValue = languages[lang]?.[string] || languages[DEFAULT_LANGUAGE][string];

  if (!translatedValue) {
    logger.error(`Translation problem with '${string}' for '${lang}'`);
    return string;
  }

  const messageKey = string + translatedValue;

  let translatedMessage = _localizationCache[messageKey] as IntlMessageFormat | undefined;

  if (!translatedMessage) {
    try {
      translatedMessage = new IntlMessageFormat(translatedValue, language);
    } catch (err: any) {
      logger.error(`Translation problem with '${string}' for '${lang}'`);
      return string;
    }
    _localizationCache[messageKey] = translatedMessage;
  }

  try {
    return translatedMessage.format<string>(replace) as string;
  } catch (err: any) {
    logger.error(`Translation problem with '${string}' for '${lang}'`);
    return string;
  }
}
