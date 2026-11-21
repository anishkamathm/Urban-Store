export function extractLanguage(req, res, next) {
  // 1. URL Query parameter ?lang=kn
  if (req.query.lang && (req.query.lang === 'kn' || req.query.lang === 'en')) {
    req.lang = req.query.lang;
    return next();
  }

  // 2. User profile preferred_language if authenticated
  if (req.user && req.user.preferred_language) {
    req.lang = req.user.preferred_language;
    return next();
  }

  // 3. Accept-Language header
  const acceptLang = req.headers['accept-language'];
  if (acceptLang && acceptLang.toLowerCase().includes('kn')) {
    req.lang = 'kn';
  } else {
    req.lang = 'en';
  }

  next();
}
