(function () {
  const dictionaries = { hi: {
    'Skip to content': 'सामग्री पर जाएँ',
    'Sections': 'अनुभाग',
    'Work': 'काम',
    'Story': 'कहानी',
    'Wall': 'दीवार',
    'Turn sound on': 'आवाज़ चालू करें',
    'Turn sound off': 'आवाज़ बंद करें',
    'Switch to night': 'रात पर जाएँ',
    'Switch to day': 'दिन पर जाएँ',
    'Sound off': 'आवाज़ बंद',
    'Sound on': 'आवाज़ चालू',
    'Day': 'दिन',
    'Night': 'रात',
    'Language': 'भाषा',
    'English': 'अंग्रेज़ी',
    'Hindi': 'हिन्दी',
    'My Toys': 'मेरे खिलौने',
    'Nightmares': 'बुरे सपने',
    'I build the dreams you fall asleep inside.': 'मैं वे सपने बनाता हूँ जिनमें आप सो जाते हैं।',
    'Junior Dream Engineer at the Midnight Nursery. Lullabies, nightlights and rooftop deliveries, all finished before sunrise.': 'मिडनाइट नर्सरी में जूनियर ड्रीम इंजीनियर। लोरियाँ, रात की रोशनियाँ और छतों तक डिलीवरी, सब सूर्योदय से पहले।',
    'Say hi to Pip': 'पिप को नमस्ते कहें',
    'See what Pip made': 'देखें पिप ने क्या बनाया',
    "Pip's eyes follow you. Flip the sun and moon switch up top and see what happens.": 'पिप की आँखें आपका पीछा करती हैं। ऊपर सूरज-चाँद का स्विच बदलकर देखें।',
    "Hi! I'm Pip.": 'नमस्ते! मैं पिप हूँ।',
    'Midnight Nursery is open all night': 'मिडनाइट नर्सरी पूरी रात खुली है',
    'Please do not feed the nightlights': 'कृपया रात की रोशनियों को खाना न खिलाएँ',
    'Quiet hours are for humming': 'शांत समय गुनगुनाने के लिए है',
    'Lost one sock? Ask the cloud desk': 'एक मोज़ा खो गया? बादल डेस्क से पूछें',
    'What Pip is': 'पिप कैसा है',
    'Personality': 'व्यक्तित्व',
    'Quirks': 'खास आदतें',
    'Voice': 'आवाज़',
    'Giggles at everything': 'हर बात पर खिलखिलाता है',
    'Hates silence': 'खामोशी पसंद नहीं',
    'Naps mid-sentence': 'वाक्य के बीच में झपकी लेता है',
    'Collects spare stars': 'बचे हुए तारे जमा करता है',
    "Things Pip made": 'पिप ने जो बनाया',
    'Four projects from the Midnight Nursery workbench. Every one of them is playable.': 'मिडनाइट नर्सरी की कार्यशाला से चार प्रोजेक्ट। हर एक खेला जा सकता है।',
    'Wind the box': 'डिब्बा घुमाएँ',
    'Endless lullaby': 'अनंत लोरी',
    'Choose a lantern': 'लालटेन चुनें',
    'Moon': 'चाँद',
    'Honey': 'शहद',
    'Rose': 'गुलाब',
    'Mint': 'पुदीना',
    'dreams found': 'सपने मिले',
    'Drop block': 'ब्लॉक गिराएँ',
    'Fly the route': 'मार्ग पर उड़ें',
    'Pip\'s story': 'पिप की कहानी',
    'Jump to a scene': 'दृश्य पर जाएँ',
    'The wish wall': 'इच्छाओं की दीवार',
    'Leave Pip a wish. Pip reads every one, usually while yawning.': 'पिप के लिए एक इच्छा लिखें। पिप हर इच्छा पढ़ता है, अक्सर जम्हाई लेते हुए।',
    'Your name (optional)': 'आपका नाम (वैकल्पिक)',
    'Your wish': 'आपकी इच्छा',
    'Pin my wish': 'मेरी इच्छा लगाएँ',
    'Wishes are saved on this device only.': 'इच्छाएँ केवल इसी डिवाइस पर सेव होती हैं।',
    'Dreams delivered tonight': 'आज रात पहुँचाए गए सपने',
    "Pip's own tally, ticking up while you read.": 'पिप की गिनती, आपके पढ़ते समय बढ़ती रहती है।',
    'Credits': 'श्रेय',
    'Plain HTML, CSS, JS': 'सादा HTML, CSS, JS',
    'Best viewed at any size': 'हर आकार पर बेहतर दृश्य',
    'Made in 48 hours': '48 घंटे में बनाया गया'
  }, pa: {
    'Skip to content': 'ਸਮੱਗਰੀ ਤੇ ਜਾਓ', 'Sections': 'ਭਾਗ', 'Work': 'ਕੰਮ', 'Story': 'ਕਹਾਣੀ', 'Wall': 'ਦੀਵਾਰ',
    'Language': 'ਭਾਸ਼ਾ', 'English': 'ਅੰਗਰੇਜ਼ੀ', 'Hindi': 'ਹਿੰਦੀ', 'Say hi to Pip': 'ਪਿਪ ਨੂੰ ਸਤ ਸ੍ਰੀ ਅਕਾਲ ਕਹੋ',
    'I build the dreams you fall asleep inside.': 'ਮੈਂ ਉਹ ਸੁਪਨੇ ਬਣਾਉਂਦਾ ਹਾਂ ਜਿਨ੍ਹਾਂ ਵਿੱਚ ਤੁਸੀਂ ਸੌਂ ਜਾਂਦੇ ਹੋ।',
    'Junior Dream Engineer at the Midnight Nursery. Lullabies, nightlights and rooftop deliveries, all finished before sunrise.': 'ਮਿਡਨਾਈਟ ਨਰਸਰੀ ਵਿੱਚ ਜੂਨੀਅਰ ਡ੍ਰੀਮ ਇੰਜੀਨੀਅਰ। ਲੋਰੀਆਂ, ਰਾਤ ਦੀਆਂ ਰੌਸ਼ਨੀਆਂ ਅਤੇ ਛੱਤਾਂ ਤੱਕ ਡਿਲੀਵਰੀ, ਸਭ ਸੂਰਜ ਚੜ੍ਹਨ ਤੋਂ ਪਹਿਲਾਂ।',
    'See what Pip made': 'ਦੇਖੋ ਪਿਪ ਨੇ ਕੀ ਬਣਾਇਆ', 'Things Pip made': 'ਪਿਪ ਨੇ ਬਣਾਈਆਂ ਚੀਜ਼ਾਂ',
    'Choose a lantern': 'ਲਾਲਟੈਨ ਚੁਣੋ', 'Moon': 'ਚੰਦ', 'Honey': 'ਸ਼ਹਿਦ', 'Rose': 'ਗੁਲਾਬ', 'Mint': 'ਪੁਦੀਨਾ',
    'Drop block': 'ਬਲਾਕ ਸੁੱਟੋ', 'Fly the route': 'ਰਸਤੇ ਤੇ ਉੱਡੋ', "Pip's story": 'ਪਿਪ ਦੀ ਕਹਾਣੀ',
    'The wish wall': 'ਇੱਛਾਵਾਂ ਦੀ ਦੀਵਾਰ', 'Your name (optional)': 'ਤੁਹਾਡਾ ਨਾਮ (ਵਿਕਲਪਿਕ)',
    'Your wish': 'ਤੁਹਾਡੀ ਇੱਛਾ', 'Pin my wish': 'ਮੇਰੀ ਇੱਛਾ ਲਗਾਓ', 'Credits': 'ਸਿਹਰਾ',
    'Plain HTML, CSS, JS': 'ਸਾਦਾ HTML, CSS, JS'
  }, kn: {
    'Skip to content': 'ವಿಷಯಕ್ಕೆ ಹೋಗಿ', 'Sections': 'ವಿಭಾಗಗಳು', 'Work': 'ಕೆಲಸ', 'Story': 'ಕಥೆ', 'Wall': 'ಗೋಡೆ',
    'Language': 'ಭಾಷೆ', 'English': 'ಇಂಗ್ಲಿಷ್', 'Hindi': 'ಹಿಂದಿ', 'Say hi to Pip': 'ಪಿಪ್‌ಗೆ ನಮಸ್ಕಾರ ಹೇಳಿ',
    'I build the dreams you fall asleep inside.': 'ನೀವು ನಿದ್ರಿಸುವ ಕನಸುಗಳನ್ನು ನಾನು ನಿರ್ಮಿಸುತ್ತೇನೆ.',
    'Junior Dream Engineer at the Midnight Nursery. Lullabies, nightlights and rooftop deliveries, all finished before sunrise.': 'ಮಿಡ್‌ನೈಟ್ ನರ್ಸರಿಯ ಜೂನಿಯರ್ ಡ್ರೀಮ್ ಎಂಜಿನಿಯರ್. ಲಾಲಿಹಾಡುಗಳು, ರಾತ್ರಿ ದೀಪಗಳು ಮತ್ತು ಛಾವಣಿ ವಿತರಣೆಗಳು ಸೂರ್ಯೋದಯದ ಮೊದಲು ಮುಗಿಯುತ್ತವೆ.',
    'See what Pip made': 'ಪಿಪ್ ಮಾಡಿದ್ದನ್ನು ನೋಡಿ', 'Things Pip made': 'ಪಿಪ್ ಮಾಡಿದ ವಸ್ತುಗಳು',
    'Choose a lantern': 'ಲ್ಯಾಂಟರ್ನ್ ಆಯ್ಕೆಮಾಡಿ', 'Moon': 'ಚಂದ್ರ', 'Honey': 'ಜೇನು', 'Rose': 'ಗುಲಾಬಿ', 'Mint': 'ಪುದೀನಾ',
    'Drop block': 'ಬ್ಲಾಕ್ ಬಿಡಿ', 'Fly the route': 'ಮಾರ್ಗದಲ್ಲಿ ಹಾರಿ', "Pip's story": 'ಪಿಪ್‌ನ ಕಥೆ',
    'The wish wall': 'ಇಷ್ಟಗಳ ಗೋಡೆ', 'Your name (optional)': 'ನಿಮ್ಮ ಹೆಸರು (ಐಚ್ಛಿಕ)',
    'Your wish': 'ನಿಮ್ಮ ಇಚ್ಛೆ', 'Pin my wish': 'ನನ್ನ ಇಚ್ಛೆಯನ್ನು ಅಂಟಿಸಿ', 'Credits': 'ಕೀರ್ತಿ',
    'Plain HTML, CSS, JS': 'ಸರಳ HTML, CSS, JS'
  }, mr: {
    'Skip to content': 'सामग्रीकडे जा', 'Sections': 'विभाग', 'Work': 'काम', 'Story': 'कथा', 'Wall': 'भिंत',
    'Language': 'भाषा', 'English': 'इंग्रजी', 'Hindi': 'हिंदी', 'Say hi to Pip': 'पिपला नमस्कार करा',
    'I build the dreams you fall asleep inside.': 'तुम्ही ज्या स्वप्नांत झोपी जाता ती स्वप्ने मी बनवतो.',
    'Junior Dream Engineer at the Midnight Nursery. Lullabies, nightlights and rooftop deliveries, all finished before sunrise.': 'मिडनाईट नर्सरीमधील कनिष्ठ स्वप्न अभियंता. अंगाईगीते, रात्रीचे दिवे आणि छतावरील वितरणे सूर्योदयापूर्वी पूर्ण.',
    'See what Pip made': 'पिपने काय बनवले ते पहा', 'Things Pip made': 'पिपने बनवलेल्या गोष्टी',
    'Choose a lantern': 'कंदील निवडा', 'Moon': 'चंद्र', 'Honey': 'मध', 'Rose': 'गुलाब', 'Mint': 'पुदिना',
    'Drop block': 'ब्लॉक सोडा', 'Fly the route': 'मार्गावर उडा', "Pip's story": 'पिपची कथा',
    'The wish wall': 'इच्छांची भिंत', 'Your name (optional)': 'तुमचे नाव (ऐच्छिक)',
    'Your wish': 'तुमची इच्छा', 'Pin my wish': 'माझी इच्छा लावा', 'Credits': 'श्रेय',
    'Plain HTML, CSS, JS': 'साधे HTML, CSS, JS'
  }, ta: {
    'Skip to content': 'உள்ளடக்கத்திற்குச் செல்லவும்', 'Sections': 'பிரிவுகள்', 'Work': 'வேலை', 'Story': 'கதை', 'Wall': 'சுவர்',
    'Language': 'மொழி', 'English': 'ஆங்கிலம்', 'Hindi': 'இந்தி', 'Say hi to Pip': 'பிப்பை வரவேற்கவும்',
    'I build the dreams you fall asleep inside.': 'நீங்கள் தூங்கும் கனவுகளை நான் உருவாக்குகிறேன்.',
    'Junior Dream Engineer at the Midnight Nursery. Lullabies, nightlights and rooftop deliveries, all finished before sunrise.': 'மிட்நைட் நர்சரியின் இளநிலை கனவு பொறியாளர். தாலாட்டுகள், இரவு விளக்குகள் மற்றும் கூரை விநியோகங்கள் சூரிய உதயத்திற்கு முன் முடிக்கப்படும்.',
    'See what Pip made': 'பிப் உருவாக்கியதைப் பார்க்கவும்', 'Things Pip made': 'பிப் உருவாக்கியவை',
    'Choose a lantern': 'விளக்கைத் தேர்ந்தெடுக்கவும்', 'Moon': 'நிலா', 'Honey': 'தேன்', 'Rose': 'ரோஜா', 'Mint': 'புதினா',
    'Drop block': 'தொகுதியை விடவும்', 'Fly the route': 'வழியில் பறக்கவும்', "Pip's story": 'பிப்பின் கதை',
    'The wish wall': 'விருப்பச் சுவர்', 'Your name (optional)': 'உங்கள் பெயர் (விருப்பம்)',
    'Your wish': 'உங்கள் விருப்பம்', 'Pin my wish': 'என் விருப்பத்தைப் பதிக்கவும்', 'Credits': 'நன்றிகள்',
    'Plain HTML, CSS, JS': 'எளிய HTML, CSS, JS'
  }};

  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();
  const languageNames = { en: 'English', hi: 'हिन्दी', pa: 'ਪੰਜਾਬੀ', kn: 'ಕನ್ನಡ', mr: 'मराठी', ta: 'தமிழ்' };

  function translateText(root, language) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (!originalText.has(node)) originalText.set(node, node.nodeValue);
      const source = originalText.get(node);
      node.nodeValue = language === 'en' ? source : ((dictionaries[language] || {})[source] || source);
    });
  }

  function translateAttributes(root, language) {
    root.querySelectorAll('[aria-label], [placeholder], [title]').forEach((element) => {
      if (!originalAttributes.has(element)) {
        originalAttributes.set(element, {
          'aria-label': element.getAttribute('aria-label'),
          placeholder: element.getAttribute('placeholder'),
          title: element.getAttribute('title')
        });
      }
      const source = originalAttributes.get(element);
      ['aria-label', 'placeholder', 'title'].forEach((attribute) => {
        if (source[attribute]) {
          element.setAttribute(attribute, language === 'en'
            ? source[attribute]
            : ((dictionaries[language] || {})[source[attribute]] || source[attribute]));
        }
      });
    });
  }

  function applyLanguage(language) {
    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;
    translateText(document.body, language);
    translateAttributes(document.body, language);
    document.querySelectorAll('[data-language-label]').forEach((element) => {
      element.textContent = languageNames[language];
    });
    localStorage.setItem('pip-language', language);
  }

  function init() {
    const selector = document.createElement('button');
    selector.type = 'button';
    selector.className = 'tb-btn language-btn';
    selector.setAttribute('aria-label', 'Language');
    selector.innerHTML = '<span aria-hidden="true">अ / A</span> <span class="language-name">Language: <span data-language-label>English</span></span>';
    selector.addEventListener('click', () => {
      const languages = ['en', 'hi', 'pa', 'kn', 'mr', 'ta'];
      const current = languages.indexOf(document.documentElement.lang);
      applyLanguage(languages[(current + 1) % languages.length]);
    });
    selector.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selector.click();
      }
    });
    document.querySelector('.task-right').prepend(selector);

    const observer = new MutationObserver((records) => {
      const language = document.documentElement.lang;
      if (language === 'en') return;
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          translateText(node, language);
          translateAttributes(node, language);
        }
      }));
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const saved = localStorage.getItem('pip-language');
    applyLanguage(['en', 'hi', 'pa', 'kn', 'mr', 'ta'].includes(saved) ? saved : 'en');
  }

  document.addEventListener('DOMContentLoaded', init);
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
    },
    es: {
      nav_pip: 'Pip',
      nav_work: 'Proyectos',
      nav_story: 'Historia',
      nav_wall: 'Muro',
      hero_title: 'Construyo los sueños en los que te quedas dormido.',
      hero_lede: 'Ingeniero de Sueños Junior en la Guardería de Medianoche. Canciones de cuna, luces nocturnas y entregas en tejados antes del amanecer.',
      hero_say_hi: 'Saluda a Pip',
      hero_see_work: 'Mira lo que hizo Pip',
      hero_fine: 'Los ojos de Pip te siguen. Activa el interruptor de sol y luna para ver la magia.',
      hero_greeting: '¡Hola! Soy Pip.',
      work_title: 'Cosas que hizo Pip',
      work_desc: 'Cinco juguetes del banco de trabajo de Medianoche. Todos son jugables.',
      lab_desc: 'Una caja de música a la que Pip dio cuerda al revés. Toca las teclas del 1 al 8.',
      lab_wind: 'Dar cuerda a la caja',
      lab_endless: 'Canción infinita',
      lights_desc: 'Elige una linterna y barre la oscura guardería. Cinco pequeños sueños se esconden allí.',
      blocks_desc: 'Apila los bloques tan alto como la hora de dormir. Toca o presiona Espacio.',
      blocks_btn: 'Soltar bloque',
      route_desc: 'Haz scroll para volar sobre los tejados o pulsa el botón.',
      route_btn: 'Volar la ruta',
      story_h1: 'El hipo',
      story_p1: 'Nadie sabe de dónde vino Pip. La enfermera encontró una cesta de ropa, un gorro de dormir gigante y un hipo muy ruidoso. Dentro: Pip sonriendo a la luna.',
      story_h2: 'Silencio prohibido',
      story_p2: 'La Guardería de Medianoche tenía una regla: cada fantasma debe dormirse con sonido. Pip vio el silencio y decidió solucionarlo.',
      story_h3: 'La primera canción',
      story_p3: 'Pip dio cuerda a una caja vieja al revés. Salieron cinco notas torpes. Once fantasmas bostezaron juntos. Nadie volvió a desvelarse.',
      story_h4: 'El turno de noche',
      story_p4: 'Ahora Pip es Ingeniero de Sueños: canciones en el laboratorio, luces en la repisa y sueños entregados por las nubes. Deja la ventana entreabierta.',
      wall_title: 'El muro de los deseos',
      wall_desc: 'Deja un deseo a Pip. Pip los lee todos bostezando.',
      wall_name_label: 'Tu nombre',
      wall_wish_label: 'Tu deseo',
      wall_submit: 'Fijar mi deseo',
      wall_fine: 'Los deseos se guardan únicamente en este dispositivo.',
      odo_title: 'Sueños entregados esta noche',
      odo_fine: 'La cuenta propia de Pip, aumentando mientras lees.',
      Day: 'Día',
      Night: 'Noche',
      'Sound on': 'Sonido activado',
      'Sound off': 'Sonido desactivado',
      'Turn sound on': 'Activar sonido',
      'Turn sound off': 'Desactivar sonido',
      dreams_count: '{count} sueño entregado | {count} sueños entregados',
      stars_count: '{count} estrella atrapada | {count} estrellas atrapadas',
      wishes_count: '{count} deseo añadido | {count} deseos añadidos',
      page_indicator: 'Página {current} de {total}'
    },
    fr: {
      nav_pip: 'Pip',
      nav_work: 'Projets',
      nav_story: 'Histoire',
      nav_wall: 'Mur',
      hero_title: 'Je construis les rêves dans lesquels vous vous endormez.',
      hero_lede: 'Ingénieur de Rêves Junior à la Pouponnière de Minuit. Berceuses, veilleuses et livraisons sur les toits avant l’aube.',
      hero_say_hi: 'Dis bonjour à Pip',
      hero_see_work: 'Voir les créations de Pip',
      hero_fine: 'Les yeux de Pip vous suivent. Basculez l’interrupteur soleil et lune pour voir.',
      hero_greeting: 'Salut ! Je suis Pip.',
      work_title: 'Choses faites par Pip',
      work_desc: 'Cinq projets de l’établi de Minuit. Chacun est entièrement jouable.',
      lab_desc: 'Une boîte à musique remontée à l’envers. Appuyez sur une touche ou les chiffres 1 à 8.',
      lab_wind: 'Remonter la boîte',
      lab_endless: 'Berceuse infinie',
      lights_desc: 'Prenez une lanterne et éclairez la chambre. Cinq petits rêves y sont cachés.',
      blocks_desc: 'Empilez les blocs aussi haut que l’heure du coucher. Touchez ou appuyez sur Espace.',
      blocks_btn: 'Lâcher le bloc',
      route_desc: 'Faites défiler pour faire voler Pip au-dessus des toits, ou cliquez sur le bouton.',
      route_btn: 'Lancer le vol',
      story_h1: 'Le hoquet',
      story_p1: 'Personne ne sait d’où vient Pip. L’infirmière a trouvé un panier à linge, un bonnet deux fois trop grand et un gros hoquet. Dans le panier : Pip souriant à la lune.',
      story_h2: 'Silence interdit',
      story_p2: 'La Pouponnière avait une règle : chaque petit fantôme s’endort avec un son. Pip a vu le silence et a décidé d’y remédier.',
      story_h3: 'La première berceuse',
      story_p3: 'Pip a remonté une boîte poussiéreuse à l’envers. Cinq notes un peu bancales en sont sorties. Onze fantômes ont bâillé ensemble.',
      story_h4: 'L’équipe de nuit',
      story_p4: 'Désormais Pip est Ingénieur de Rêves : berceuses au labo, veilleuses sur l’étagère et rêves livrés par nuage. Laissez votre fenêtre entrouverte.',
      wall_title: 'Le mur des souhaits',
      wall_desc: 'Laissez un souhait à Pip. Pip les lit tous en bâillant.',
      wall_name_label: 'Votre nom',
      wall_wish_label: 'Votre souhait',
      wall_submit: 'Épingler mon souhait',
      wall_fine: 'Les souhaits sont conservés sur cet appareil uniquement.',
      odo_title: 'Rêves livrés cette nuit',
      odo_fine: 'Le compteur de Pip qui augmente pendant votre lecture.',
      Day: 'Jour',
      Night: 'Nuit',
      'Sound on': 'Son activé',
      'Sound off': 'Son désactivé',
      'Turn sound on': 'Activer le son',
      'Turn sound off': 'Couper le son',
      dreams_count: '{count} rêve livré | {count} rêves livrés',
      stars_count: '{count} étoile attrapée | {count} étoiles attrapées',
      wishes_count: '{count} vœu ajouté | {count} vœux ajoutés',
      page_indicator: 'Page {current} sur {total}'
    },
    ja: {
      nav_pip: 'ピップ',
      nav_work: '作品',
      nav_story: '物語',
      nav_wall: '願いの壁',
      hero_title: 'あなたが眠りに落ちる夢を作っています。',
      hero_lede: '真夜中の保育園の見習い夢エンジニア。夜明け前に届ける子守唄、常夜灯、そして屋根の上の配達。',
      hero_say_hi: 'ピップにあいさつ',
      hero_see_work: 'ピップの作品を見る',
      hero_fine: 'ピップの瞳があなたを見つめます。太陽と月のスイッチを切り替えてみてください。',
      hero_greeting: 'やあ！ぼくはピップだよ。',
      work_title: 'ピップが作ったもの',
      work_desc: '真夜中の作業台から生まれた5つのおもちゃ。すべて遊べます。',
      lab_desc: 'ピップが逆に巻いてしまったオルゴール。キーを押すか、1〜8を押してね。',
      lab_wind: 'オルゴールを巻く',
      lab_endless: '終わらない子守唄',
      lights_desc: 'ランタンを選んで暗い部屋を照らそう。5つの小さな夢が隠れているよ。',
      blocks_desc: 'おやすみの時間まで高くブロックを積もう。タップまたはスペースキーで落とします。',
      blocks_btn: 'ブロックを落とす',
      route_desc: 'スクロールして屋根の上を飛ぶか、ボタンを押して眺めよう。',
      route_btn: 'ルートを飛ぶ',
      story_h1: 'しゃっくり',
      story_p1: 'ピップがどこから来たのか誰も知りません。看護師が見つけたのは洗濯カゴ、大きすぎるナイトキャップ、そして大きなしゃっくりでした。カゴの中には月に笑いかけるピップがいました。',
      story_h2: '静寂は禁止',
      story_p2: '真夜中の保育園にはルールがありました。みんな何か音を聞きながら眠ること。ピップは静けさを問題だと考え、エンジニアリングすることにしました。',
      story_h3: '最初の子守唄',
      story_p3: 'ピップは古いオルゴールのネジを逆に回しました。流れた5つの音に、11人のおばけが一斉にあくびをしました。それ以来、夜更かしする者はいません。',
      story_h4: '夜勤シフト',
      story_p4: 'いまピップは見習い夢エンジニア。ラボの子守唄、棚のランタン、雲による夢の配達。今夜は窓を少し開けておいてね。',
      wall_title: '願いの壁',
      wall_desc: 'ピップに願いを残してね。あくびをしながら全部読んでいます。',
      wall_name_label: 'お名前',
      wall_wish_label: 'あなたの願い',
      wall_submit: '願いをピン留めする',
      wall_fine: '願いごとはこの端末にのみ保存されます。',
      odo_title: '今夜届けられた夢',
      odo_fine: 'あなたが読んでいる間にも増えていくピップの記録。',
      Day: '昼',
      Night: '夜',
      'Sound on': 'サウンドON',
      'Sound off': 'サウンドOFF',
      'Turn sound on': 'サウンドを鳴らす',
      'Turn sound off': 'サウンドを消す',
      dreams_count: '{count}件の夢を配達 | {count}件の夢を配達',
      stars_count: '{count}個の星をキャッチ | {count}個の星をキャッチ',
      wishes_count: '{count}個の願いを追加 | {count}個の願いを追加',
      page_indicator: '{total}ページ中{current}ページ'
    }
  };

  var SUPPORTED = ['en', 'hi', 'es', 'fr', 'ja'];

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
      var primary = clean.split(/[-_]/)[0];
      if (primary === 'hi' || clean === 'hi') return 'hi';
      if (primary === 'en' || clean === 'en') return 'en';
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
    var nextIdx = (SUPPORTED.indexOf(curLang) + 1) % SUPPORTED.length;
    apply(SUPPORTED[nextIdx]);
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
    SUPPORTED: SUPPORTED,
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
