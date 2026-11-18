/* i18n.js: zero-dependency localization engine for pipOS.
   Supports English ('en') and Hindi ('hi').
   Hangs off window.PIP.i18n. */
(function () {
  'use strict';
  var hasWindow = typeof window !== 'undefined';
  var PIP = hasWindow ? (window.PIP = window.PIP || {}) : {};
  var store = PIP.store || { get: function (k, f) { return f; }, set: function () {} };

  var TRANSLATIONS = {
    en: {
      nav_pip: 'Pip',
      nav_work: 'Work',
      nav_story: 'Story',
      nav_wall: 'Wall',
      hero_title: 'I build the dreams you fall asleep inside.',
      hero_lede: 'Junior Dream Engineer at the Midnight Nursery. Lullabies, nightlights and rooftop deliveries, all finished before sunrise.',
      hero_say_hi: 'Say hi to Pip',
      hero_see_work: 'See what Pip made',
      hero_fine: "Pip's eyes follow you. Flip the sun and moon switch up top and see what happens.",
      hero_greeting: "Hi! I'm Pip.",
      work_title: 'Things Pip made',
      work_desc: 'Five projects from the Midnight Nursery workbench. Every one of them is playable.',
      lab_desc: 'A music box Pip wound the wrong way. Press a key, or use 1 to 8 on your keyboard.',
      lab_wind: 'Wind the box',
      lab_endless: 'Endless lullaby',
      lights_desc: 'Pick a lantern, then sweep it across the dark nursery. Five small dreams are hiding in there.',
      blocks_desc: "Stack the blocks as high as Pip's bedtime. Tap, click or press Space to drop.",
      blocks_btn: 'Drop block',
      route_desc: 'Scroll to fly Pip across the rooftops, or press the button and watch.',
      route_btn: 'Fly the route',
      story_h1: 'The hiccup',
      story_p1: 'Nobody knows exactly where Pip came from. The night nurse found a laundry basket on the nursery step, a nightcap two sizes too big, and one very loud hiccup. Inside the basket: Pip, giggling at the moon.',
      story_h2: 'No silence allowed',
      story_p2: 'The Midnight Nursery had one rule: every little ghost falls asleep to something. Humming, rain, a rusty fan. Pip took one look at all that waiting quiet and decided silence was a problem to be engineered.',
      story_h3: 'The first lullaby',
      story_p3: "Pip wound a dusty music box and turned the key the wrong way. Out came five notes, slightly crooked, just like Pip's smile. Eleven ghosts yawned at once. Nobody has stayed up past midnight since.",
      story_h4: 'The night shift',
      story_p4: "Now Pip is a Junior Dream Engineer: lullabies in the lab, nightlights on the shelf, dreams delivered by cloud before sunrise. Tonight's route has seven stops. Leave your window open a crack.",
      wall_title: 'The wish wall',
      wall_desc: 'Leave Pip a wish. Pip reads every one, usually while yawning.',
      wall_name_label: 'Your name',
      wall_wish_label: 'Your wish',
      wall_submit: 'Pin my wish',
      wall_fine: 'Wishes are saved on this device only.',
      odo_title: 'Dreams delivered tonight',
      odo_fine: "Pip's own tally, ticking up while you read.",
      Day: 'Day',
      Night: 'Night',
      'Sound on': 'Sound on',
      'Sound off': 'Sound off',
      'Turn sound on': 'Turn sound on',
      'Turn sound off': 'Turn sound off',
      dreams_count: '{count} dream delivered | {count} dreams delivered',
      stars_count: '{count} star caught | {count} stars caught',
      wishes_count: '{count} wish pinned | {count} wishes pinned',
      page_indicator: 'Page {current} of {total}'
    },
    hi: {
      nav_pip: 'पिप',
      nav_work: 'रचनाएं',
      nav_story: 'कहानी',
      nav_wall: 'विश वॉल',
      hero_title: 'मैं वो सपने बनाता हूँ जिनके अंदर आप सोते हैं।',
      hero_lede: 'मिडनाइट नर्सरी में जूनियर ड्रीम इंजीनियर। लोरियाँ, नाइटलाइट्स और छतों पर सपनों की डिलीवरी, सब सूर्योदय से पहले तैयार।',
      hero_say_hi: 'पिप को नमस्ते कहें',
      hero_see_work: 'पिप की रचनाएं देखें',
      hero_fine: 'पिप की आँखें आपके साथ घूमती हैं। ऊपर सूरज और चाँद का बटन दबाकर देखें।',
      hero_greeting: 'नमस्ते! मैं पिप हूँ।',
      work_title: 'पिप की बनाई चीजें',
      work_desc: 'मिडनाइट नर्सरी वर्कबेंच से पाँच खिलौने। हर एक के साथ आप खेल सकते हैं।',
      lab_desc: 'एक म्यूज़िक बॉक्स जिसे पिप ने उलटा घुमाया। कोई की दबाएं या कीबोर्ड पर 1 से 8 दबाएं।',
      lab_wind: 'बॉक्स घुमाएं',
      lab_endless: 'अनंत लोरी',
      lights_desc: 'एक लालटेन चुनें, फिर अँधेरी नर्सरी में घुमाएं। पाँच छोटे सपने वहाँ छिपे हैं।',
      blocks_desc: 'पिप के सोने के समय जितनी ऊँची मीनार बनाएं। गिराने के लिए टैप करें या स्पेस दबाएं।',
      blocks_btn: 'ब्लॉक गिराएं',
      route_desc: 'पिप को छतों पर उड़ाने के लिए स्क्रॉल करें, या बटन दबाकर देखें।',
      route_btn: 'सफर शुरू करें',
      story_h1: 'हिचकी',
      story_p1: 'किसी को नहीं पता कि पिप कहाँ से आया। नर्स को नर्सरी की सीढ़ी पर कपड़ों की टोकरी, बहुत बड़ी नाइट-कैप, और एक तेज़ हिचकी मिली। टोकरी के अंदर: पिप, चाँद को देखकर मुस्कुराता हुआ।',
      story_h2: 'सन्नाटा मना है',
      story_p2: 'मिडनाइट नर्सरी का एक ही नियम था: हर छोटे भूत को किसी आवाज़ के साथ सोना है। गुनगुनाहट, बारिश, या पंखा। पिप ने सन्नाटा देखा और तय किया कि इसे ठीक करना है।',
      story_h3: 'पहली लोरी',
      story_p3: 'पिप ने एक पुराना म्यूज़िक बॉक्स उठाया और चाबी उलटी घुमाई। निकले पाँच सुर, थोड़े टेढ़े, बिल्कुल पिप की मुस्कान जैसे। ग्यारह भूतों ने एक साथ उबासी ली। उसके बाद कोई नहीं जागा।',
      story_h4: 'नाइट शिफ्ट',
      story_p4: 'अब पिप एक जूनियर ड्रीम इंजीनियर है: लैब में लोरियाँ, शेल्फ पर लालटेन, बादलों से सपनों की डिलीवरी। आज सात घर जाना है। अपनी खिड़की थोड़ी खुली रखना।',
      wall_title: 'सपनों की दीवार',
      wall_desc: 'पिप के लिए एक ख्वाहिश छोड़ें। पिप हर ख्वाहिश पढ़ता है, उबासी लेते हुए।',
      wall_name_label: 'आपका नाम',
      wall_wish_label: 'आपकी ख्वाहिश',
      wall_submit: 'ख्वाहिश जोड़ें',
      wall_fine: 'ख्वाहिशें केवल इसी डिवाइस पर सुरक्षित हैं।',
      odo_title: 'आज रात पहुँचाए गए सपने',
      odo_fine: 'पिप की अपनी गिनती, जो पढ़ते-पढ़ते बढ़ती जाती है।',
      Day: 'दिन',
      Night: 'रात',
      'Sound on': 'ध्वनि चालू',
      'Sound off': 'ध्वनि बंद',
      'Turn sound on': 'ध्वनि चालू करें',
      'Turn sound off': 'ध्वनि बंद करें',
      dreams_count: '{count} सपना पहुँचाया गया | {count} सपने पहुँचाए गए',
      stars_count: '{count} तारा पकड़ा गया | {count} तारे पकड़े गए',
      wishes_count: '{count} ख्वाहिश जोड़ी गई | {count} ख्वाहिशें जोड़ी गईं',
      page_indicator: 'पृष्ठ {current} का {total}'
    }
  };

  function getStore() {
    if (typeof window !== 'undefined' && window.PIP && window.PIP.store) {
      return window.PIP.store;
    }
    return store;
  }

  function detectLocale(nav) {
    var n = nav !== undefined ? nav : (typeof navigator !== 'undefined' ? navigator : null);
    if (!n) return 'en';
    var langs = [];
    if (Array.isArray(n.languages) && n.languages.length > 0) {
      langs = n.languages;
    } else if (typeof n.language === 'string' && n.language) {
      langs = [n.language];
    } else if (typeof n.userLanguage === 'string' && n.userLanguage) {
      langs = [n.userLanguage];
    }

    for (var i = 0; i < langs.length; i++) {
      var raw = langs[i];
      if (typeof raw !== 'string') continue;
      var clean = raw.trim().toLowerCase();
      if (TRANSLATIONS[clean]) return clean;
      var primary = clean.split(/[-_]/)[0];
      if (TRANSLATIONS[primary]) return primary;
    }
    return 'en';
  }

  function getInitialLang(nav, customStore) {
    var s = customStore || getStore();
    var saved = (s && typeof s.get === 'function') ? s.get('lang', null) : null;
    if (saved && TRANSLATIONS[saved]) {
      return saved;
    }
    return detectLocale(nav);
  }

  var curLang = getInitialLang();
  if (curLang !== 'en' && curLang !== 'hi') curLang = 'en';

  function interpolate(str, params) {
    if (typeof str !== 'string' || !params) return str;
    return str.replace(/\{\s*([a-zA-Z0-9_]+)\s*\}/g, function (match, key) {
      if (params && params[key] !== undefined && params[key] !== null) {
        return String(params[key]);
      }
      return match;
    });
  }

  function getPluralCategory(count, lang) {
    var num = typeof count === 'number' ? count : Number(count);
    if (isNaN(num)) return 'other';

    var l = (lang || curLang || 'en').toLowerCase().split(/[-_]/)[0];

    if (typeof Intl !== 'undefined' && Intl.PluralRules) {
      try {
        return new Intl.PluralRules(l).select(num);
      } catch (e) {}
    }

    if (l === 'hi') {
      return (num === 0 || num === 1) ? 'one' : 'other';
    }
    return num === 1 ? 'one' : 'other';
  }

  function formatIcuPlural(template, count, lang) {
    if (typeof template !== 'string') return template;
    var marker = 'plural,';
    var maxLoops = 10;
    while (template.indexOf(marker) !== -1 && maxLoops-- > 0) {
      var idx = template.indexOf(marker);
      var openBrace = template.lastIndexOf('{', idx);
      if (openBrace === -1) break;

      var depth = 1;
      var closeBrace = -1;
      for (var i = openBrace + 1; i < template.length; i++) {
        if (template[i] === '{') depth++;
        else if (template[i] === '}') {
          depth--;
          if (depth === 0) {
            closeBrace = i;
            break;
          }
        }
      }
      if (closeBrace === -1) break;

      var content = template.slice(openBrace + 1, closeBrace);
      var parts = content.split(/,\s*plural\s*,\s*/);
      if (parts.length < 2) break;

      var varName = parts[0].trim();
      var body = parts.slice(1).join(', plural, ');
      var num = (varName === 'count' && count !== null) ? count : Number(count);
      if (isNaN(num)) num = 0;

      var branches = {};
      var bRegex = /(=?\w+)\s*\{([^{}]*)\}/g;
      var m;
      while ((m = bRegex.exec(body)) !== null) {
        branches[m[1]] = m[2];
      }

      var exact = '=' + num;
      var chosen = '';
      if (branches[exact] !== undefined) {
        chosen = branches[exact];
      } else if (num === 0 && branches.zero !== undefined) {
        chosen = branches.zero;
      } else {
        var cat = getPluralCategory(num, lang);
        chosen = branches[cat] || branches.other || branches.one || '';
      }

      var replacement = chosen.replace(/#/g, String(num));
      template = template.slice(0, openBrace) + replacement + template.slice(closeBrace + 1);
    }
    return template;
  }

  function apply(lang) {
    if (!TRANSLATIONS[lang]) lang = 'en';
    curLang = lang;
    getStore().set('lang', lang);

    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('lang', lang);

    var dict = TRANSLATIONS[lang];
    var elements = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var key = el.getAttribute('data-i18n');
      var countAttr = el.getAttribute('data-i18n-count');
      var params = null;
      if (countAttr !== null && !isNaN(Number(countAttr))) {
        params = { count: Number(countAttr) };
      }
      var res = t(key, params);
      if (res && res !== key) {
        el.textContent = res;
      } else if (dict[key]) {
        el.textContent = dict[key];
      }
    }

    var btn = document.getElementById('langBtn');
    var label = document.getElementById('langLabel');
    if (btn) {
      btn.setAttribute('aria-label', lang === 'hi' ? 'भाषा: हिन्दी, Switch to English' : 'Language: English, हिन्दी में बदलें');
    }
    if (label) {
      label.textContent = lang === 'hi' ? 'हिन्दी' : 'EN';
    }

    if (typeof document.dispatchEvent === 'function') {
      try {
        var ev = (typeof CustomEvent === 'function')
          ? new CustomEvent('pip-language-change', { detail: { lang: lang } })
          : (function () {
              var e = document.createEvent('CustomEvent');
              e.initCustomEvent('pip-language-change', true, true, { lang: lang });
              return e;
            })();
        document.dispatchEvent(ev);
      } catch (e) {
        try {
          var ev2 = document.createEvent('Event');
          ev2.initEvent('pip-language-change', true, true);
          document.dispatchEvent(ev2);
        } catch (err) {}
      }
    }
  }

  function t(key, params, extra) {
    if (!key) return '';
    var dict = TRANSLATIONS[curLang] || TRANSLATIONS.en || {};
    var entry = (typeof key === 'string') ? dict[key] : key;

    if (entry === undefined && typeof key === 'string') {
      if (TRANSLATIONS.en && TRANSLATIONS.en[key] !== undefined) {
        entry = TRANSLATIONS.en[key];
      } else {
        entry = key;
      }
    }

    // Determine count and param object
    var count = null;
    var paramObj = null;

    if (typeof params === 'number') {
      count = params;
      paramObj = { count: params };
      if (typeof extra === 'function') {
        paramObj.plural = extra;
      }
    } else if (typeof params === 'function') {
      paramObj = { plural: params };
    } else if (params && typeof params === 'object') {
      paramObj = Object.assign({}, params);
      if (typeof paramObj.count === 'number') count = paramObj.count;
      else if (typeof paramObj.n === 'number') count = paramObj.n;
      else if (typeof paramObj.num === 'number') count = paramObj.num;
      else if (typeof paramObj.count === 'string' && !isNaN(Number(paramObj.count))) {
        count = Number(paramObj.count);
      }
    } else if (typeof params === 'string') {
      paramObj = { count: params, value: params };
      if (!isNaN(Number(params))) count = Number(params);
    }

    if (typeof extra === 'function' && paramObj) {
      paramObj.plural = extra;
    }

    // If entry is a function
    if (typeof entry === 'function') {
      entry = entry(paramObj || count, curLang);
    }

    // If paramObj has custom plural function
    if (paramObj && typeof paramObj.plural === 'function' && count !== null) {
      var customRes = paramObj.plural(count, curLang);
      if (customRes !== undefined && customRes !== null) {
        entry = customRes;
      }
    }

    // If entry is an object of plural forms: { zero, one, other } or { singular, plural }
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      var num = count !== null ? count : 0;
      var cat = getPluralCategory(num, curLang);
      var chosen = null;
      if (num === 0 && entry.zero !== undefined) {
        chosen = entry.zero;
      } else if (entry[cat] !== undefined) {
        chosen = entry[cat];
      } else if (cat === 'one' && entry.singular !== undefined) {
        chosen = entry.singular;
      } else if (cat === 'other' && entry.plural !== undefined) {
        chosen = entry.plural;
      } else {
        chosen = entry.other !== undefined ? entry.other
          : (entry.one !== undefined ? entry.one
          : (entry.plural !== undefined ? entry.plural
          : (entry.singular !== undefined ? entry.singular
          : Object.values(entry)[0])));
      }
      entry = chosen !== undefined ? chosen : '';
    }

    if (typeof entry === 'string') {
      // Pipe-delimited plural forms: "singular | plural" or "zero | singular | plural"
      if (entry.indexOf('|') !== -1 && count !== null) {
        var parts = entry.split('|').map(function (s) { return s.trim(); });
        if (parts.length === 2) {
          entry = (count === 1) ? parts[0] : parts[1];
        } else if (parts.length >= 3) {
          entry = (count === 0) ? parts[0] : ((count === 1) ? parts[1] : parts[2]);
        }
      }

      // ICU plural format
      if (entry.indexOf('plural') !== -1 && entry.indexOf('{') !== -1) {
        entry = formatIcuPlural(entry, count, curLang);
      }

      // Parameter interpolation
      if (paramObj) {
        entry = interpolate(entry, paramObj);
      }
    }

    return entry;
  }

  function plural(count, forms, lang) {
    var num = typeof count === 'number' ? count : Number(count);
    if (isNaN(num)) num = 0;

    if (typeof forms === 'string' && arguments.length >= 3 && typeof arguments[2] === 'string') {
      var singular = forms;
      var pluralStr = arguments[2];
      var chosenStr = (num === 1) ? singular : pluralStr;
      if (chosenStr.indexOf('{count}') !== -1) {
        return interpolate(chosenStr, { count: num });
      }
      return num + ' ' + chosenStr;
    }

    var targetLang = (typeof lang === 'string' && lang) ? lang : curLang;
    var prevLang = curLang;
    if (targetLang !== curLang && TRANSLATIONS[targetLang]) {
      curLang = targetLang;
    }

    var res;
    if (typeof forms === 'object' && forms !== null) {
      res = t(forms, { count: num });
    } else if (typeof forms === 'string') {
      res = t(forms, { count: num });
    } else if (typeof forms === 'function') {
      res = forms(num, curLang);
    } else {
      res = String(num);
    }

    curLang = prevLang;
    return res;
  }

  function toggle() {
    apply(curLang === 'hi' ? 'en' : 'hi');
  }

  function init() {
    if (typeof document === 'undefined') return;
    curLang = getInitialLang();
    var btn = document.getElementById('langBtn');
    if (btn) {
      btn.addEventListener('click', toggle);
    }
    apply(curLang);
  }

  var i18nModule = {
    init: init,
    apply: apply,
    setLanguage: apply,
    toggle: toggle,
    t: t,
    interpolate: interpolate,
    detectLocale: detectLocale,
    getInitialLang: getInitialLang,
    getPluralRule: getPluralCategory,
    selectPlural: getPluralCategory,
    plural: plural,
    getLang: function () { return curLang; },
    TRANSLATIONS: TRANSLATIONS
  };

  if (hasWindow) {
    window.PIP = window.PIP || {};
    window.PIP.i18n = i18nModule;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = i18nModule;
  }
})();
