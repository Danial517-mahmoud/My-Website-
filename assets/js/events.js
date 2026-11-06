/**
 * Shared event catalogue.
 * Every page reads this same source of truth.
 *
 * Public globals (used by main.js):
 *   - CATEGORIES : { [categoryKey]: arabicLabel }
 *   - EVENTS     : readonly array of Event objects
 *
 * @typedef {Object} Event
 * @property {string}  id           Unique slug, used in the URL (?id=...)
 * @property {string}  title
 * @property {string}  category     A key of CATEGORIES
 * @property {string}  time         "HH:MM" (24h)
 * @property {string}  location     Place name, or "عن بُعد" for online events
 * @property {boolean} featured     Shown in the home page carousel
 * @property {string}  image        Path to the cover image
 * @property {string}  short        One-line summary (cards)
 * @property {string}  description  Full description (details page)
 * @property {string[]} gallery     Optional extra image paths
 * @property {Date}    date         Event day (computed, noon local time)
 */

const CATEGORIES = Object.freeze({
  culture: "ثقافة",
  sports: "رياضة",
  workshops: "ورش عمل",
  academic: "أكاديمي",
  family: "عائلي"
});

// The IIFE keeps helpers and raw data private: only CATEGORIES and EVENTS are global.
const EVENTS = (function () {
  "use strict";

  const ONLINE = "عن بُعد";
  const IMAGE_DIR = "assets/img/events/";
  const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

  // Raw data. `daysFromNow` keeps the demo dates always in the future.
  const definitions = [
    {
      id: "git-basics",
      title: "ورشة Git من الصفر",
      category: "workshops",
      daysFromNow: 1,
      time: "18:00",
      location: ONLINE,
      featured: true,
      image: "event-1.jpg",
      short: "تعلّم أساسيات إدارة الإصدارات من خلال تمارين عملية.",
      description: "ورشة تطبيقية مناسبة للمبتدئين، نتعرّف فيها إلى المستودعات وعمليات commit وbranch وmerge، ثم نطبّقها على مشروع جامعي صغير."
    },
    {
      id: "digital-innovation",
      title: "هاكاثون الابتكار الرقمي",
      category: "academic",
      daysFromNow: 3,
      time: "09:00",
      location: ONLINE,
      featured: true,
      image: "event-2.jpg",
      short: "48 ساعة لتطوير حلول رقمية لمشكلات واقعية.",
      description: "تحدٍّ جماعي يجمع الطلاب حول أفكار تقنية قابلة للتنفيذ، مع إرشاد من خبراء وتحكيم للمشاريع في ختام الهاكاثون."
    },
    {
      id: "github-teams",
      title: "ورشة GitHub والعمل الجماعي",
      category: "workshops",
      daysFromNow: 5,
      time: "18:00",
      location: ONLINE,
      image: "event-3.jpg",
      short: "إدارة مشروع جماعي ونشره على GitHub Pages.",
      description: "نتعلم إنشاء الفروع وطلبات الدمج وحل التعارضات وتوزيع المهام، مع تجربة كاملة لنشر موقع ثابت."
    },
    {
      id: "digital-art",
      title: "ورشة Docker ",
      category: "workshops",
      daysFromNow: 7,
      time: "19:30",
      location: "المركز الثقافي الافتراضي",
      featured: true,
      image: "event-4.jpg",
      short: "تعلم أساسيات الاحتراف وبات بإمكانك استخدامها بثقة في مشاريعك أو بيئة العمل.",
      description: "ملف docker-compose.yml لإدارة وتشغيل عدة حاويات معاً بـأمر واحد (docker-compose up -d)، وهو أمر أساسي لأي مطور لأن معظم التطبيقات تتكون من عدة خدمات تعمل معاً (مثل تطبيق + قاعدة بيانات + واجهة). "
    },
    {
      id: "career-webinar",
      title: "أيام الويبينار المهنية",
      category: "academic",
      daysFromNow: 9,
      time: "19:00",
      location: ONLINE,
      featured: true,
      image: "event-5.jpg",
      short: "لقاءات مع خبراء عن السيرة الذاتية والمقابلات.",
      description: "سلسلة لقاءات عملية تساعد الطلاب على فهم متطلبات سوق العمل وبناء ملف مهني واضح والاستعداد للمقابلات."
    },
    {
      id: "student-debates",
      title: "المناظرات الطلابية الافتراضية",
      category: "culture",
      daysFromNow: 11,
      time: "20:00",
      location: ONLINE,
      image: "event-6.jpg",
      short: "حوار منظم حول قضايا معاصرة لتعزيز الإقناع.",
      description: "تتنافس فرق مؤيدة ومعارضة في جولات قصيرة وفق قواعد واضحة، مع تعليقات بناءة من لجنة التحكيم."
    },
    {
      id: "graduation-projects",
      title: "المعرض الافتراضي لمشاريع التخرج",
      category: "academic",
      daysFromNow: 14,
      time: "16:00",
      location: "قاعة المعارض الافتراضية",
      image: "event-7.jpg",
      short: "استعراض مشاريع الطلاب المتميزة ومناقشتها.",
      description: "معرض تفاعلي يتيح للزوار التعرف إلى مشاريع التخرج ومناقشة أصحابها والتصويت على المشاريع المفضلة."
    },
    {
      id: "junior-marathon",
      title: "الماراثون البرمجي للصغار",
      category: "family",
      daysFromNow: 16,
      time: "10:00",
      location: "مراكز النفاذ",
      image: "event-8.jpg",
      short: "مسابقة لطيفة للأطفال واليافعين لتنمية التفكير المنطقي.",
      description: "فعالية عائلية مبسطة تقدم تحديات برمجية مناسبة للأعمار الصغيرة، مع أنشطة مرافقة للأهل."
    },
    {
      id: "science-forum",
      title: "الملتقى العلمي وأيام الابتكار",
      category: "academic",
      daysFromNow: 20,
      time: "10:00",
      location: "دمشق",
      featured: true,
      image: "event-9.jpg",
      short: "أبحاث وورش عمل ولقاءات مع المبتكرين.",
      description: "ملتقى سنوي يستعرض أبحاث الطلاب وأعضاء الهيئة التدريسية، ويتضمن جلسات نقاش وورشاً متخصصة."
    },
    {
      id: "campus-sports",
      title: "اليوم الرياضي الجامعي",
      category: "sports",
      daysFromNow: 23,
      time: "15:00",
      location: "المدينة الرياضية الجامعية",
      image: "event-1.jpg",
      short: "منافسات ودية وأنشطة حركية لجميع الطلاب.",
      description: "يوم رياضي مفتوح يضم كرة السلة والشطرنج والمشي الجماعي، ويشجع على التوازن بين الدراسة والنشاط."
    },
    {
      id: "family-open-day",
      title: "اليوم العائلي المفتوح",
      category: "family",
      daysFromNow: 27,
      time: "11:00",
      location: "حديقة الجامعة",
      image: "event-2.jpg",
      short: "أنشطة ترفيهية وتعليمية تجمع أفراد الأسرة.",
      description: "فعالية اجتماعية مناسبة لكل الأعمار تتضمن ألعاباً تعليمية وأركاناً للتعريف ببرامج الجامعة."
    },
    {
      id: "alumni-gathering",
      title: "حفل ومخيم الخريجين السنوي",
      category: "culture",
      daysFromNow: 32,
      time: "18:00",
      location: "دمشق",
      featured: true,
      image: "event-3.jpg",
      short: "لقاء تعارفي يجمع الخريجين بالكادر والطلاب.",
      description: "أمسية للاحتفاء بالإنجازات وتبادل الخبرات بين الخريجين والطلاب، مع فقرات فنية وشهادات تقدير."
    }
  ];

  /** Returns today + `days`, at 12:00 local time (a safe hour for date-only comparisons). */
  function dateFromToday(days) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date;
  }

  /** Fails early (with a clear message) when the data has a typo. */
  function validate(definition, usedIds) {
    const label = 'Event "' + definition.id + '"';

    if (!definition.id || usedIds.has(definition.id)) {
      throw new Error(label + ": id is missing or duplicated");
    }
    if (!Object.prototype.hasOwnProperty.call(CATEGORIES, definition.category)) {
      throw new Error(label + ': unknown category "' + definition.category + '"');
    }
    if (!TIME_PATTERN.test(definition.time)) {
      throw new Error(label + ': time must look like "HH:MM"');
    }
    if (!Number.isInteger(definition.daysFromNow)) {
      throw new Error(label + ": daysFromNow must be an integer");
    }
  }

  /** Turns a raw definition into the final, read-only Event object. */
  function createEvent(definition) {
    const { daysFromNow, image, featured, gallery, ...rest } = definition;

    return Object.freeze({
      ...rest,
      featured: Boolean(featured),
      image: IMAGE_DIR + image,
      gallery: Object.freeze((gallery || []).map(function (file) {
        return IMAGE_DIR + file;
      })),
      date: dateFromToday(daysFromNow)
    });
  }

  const usedIds = new Set();

  const events = definitions.map(function (definition) {
    validate(definition, usedIds);
    usedIds.add(definition.id);
    return createEvent(definition);
  });

  return Object.freeze(events);
})();
