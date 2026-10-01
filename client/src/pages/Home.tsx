import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Droplets,
  Instagram,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ content */

/* ----------------------------------------------------------------- motion */

/**
 * Reveals `.reveal` elements once they scroll into view.
 *
 * One shared IntersectionObserver for the whole page rather than one per
 * element: a single callback is far cheaper than 40 of them, and `unobserve`
 * keeps it from firing again for settled elements.
 *
 * The revealed flag goes on `data-shown`, NOT on a class. React owns the
 * `className` attribute: it rewrites the whole string on re-render, so a class
 * added here imperatively would be wiped the moment the user opens a service
 * card and React re-renders it — the card would drop back to opacity 0 and
 * look empty. An attribute React never renders is left alone.
 */
function useRevealOnScroll() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not([data-shown])"));
    if (!nodes.length) return;

    // No observer support (or reduced motion): show everything, never hide it.
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((n) => n.setAttribute("data-shown", ""));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-shown", "");
          io.unobserve(entry.target);
        }
      },
      // Start the motion a little before the element reaches the edge, and
      // require a sliver to be visible so tall cards still fire.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.04 },
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
}

/** Dot-matrix spinner: 16 dots on a fixed grid, only transform/opacity move. */
function DotMatrix({ label = "Отправляем" }: { label?: string }) {
  return (
    <span className="dm-wrap" role="status" aria-live="polite">
      <span className="dm" aria-hidden="true">
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i} />
        ))}
      </span>
      <span className="dm-label">{label}</span>
    </span>
  );
}

/** Hand-drawn wobble, borrowed from the doodle-icons "boil" idea. */
function BoilIcon({ children }: { children: ReactNode }) {
  return <span className="doodle-boil">{children}</span>;
}

/* ------------------------------------------------------------- content */

/* ЦЕНЫ — ДЕМО-ЗНАЧЕНИЯ.
   В карточке KN Detailing Studio на 2ГИС прайс не опубликован, поэтому здесь
   стоят ориентировочные суммы, чтобы в форме записи работал расчёт.
   Заменить на реальный прайс-лист студии перед публикацией. */
const services = [
  {
    no: "01",
    title: "Оклейка",
    note: "Бронеплёнка и PPF",
    price: "от 450 000 ₸",
    media: "wrap",
    detail: "Бронеплёнка на кузов, бамперы, фары и зоны риска. Американские материалы, завороты под кромку, гарантия 12 лет.",
  },
  {
    no: "02",
    title: "Керамика",
    note: "Покрытие и гидрофоб",
    price: "от 90 000 ₸",
    media: "ceramic",
    detail: "Керамическое покрытие поверх ЛКП или плёнки: вода скатывается, грязь прилипает меньше, мыть машину нужно реже.",
  },
  {
    no: "03",
    title: "Тонировка",
    note: "Стёкла и оптика",
    price: "от 25 000 ₸",
    media: "tint",
    detail: "Тонировка по кругу с допустимой светопропускаемостью: салон не выгорает, в машине прохладнее, обзор без искажений.",
  },
  {
    no: "04",
    title: "Полировка",
    note: "Блеск и глубина цвета",
    price: "от 40 000 ₸",
    media: "polish",
    detail: "Убираем риски, голограммы и следы автомойки. Перед оклейкой готовим кузов, чтобы дефекты не «запечатались» под плёнкой.",
  },
  {
    no: "05",
    title: "Шумоизоляция",
    note: "Тишина в салоне",
    price: "от 150 000 ₸",
    media: "sound",
    detail: "Двери, арки, пол и багажник: снижаем шум колёс и дороги, кузов начинает звучать плотнее, музыка — чище.",
  },
  {
    no: "06",
    title: "Салон",
    note: "Ремонт и пошив",
    price: "от 80 000 ₸",
    media: "salon",
    detail: "Ремонт и перетяжка салона, пошив по лекалам, химчистка кожи и текстиля, устранение заломов и запахов.",
  },
];

/* Слайдер «процесс → результат».
   В галерее 2ГИС у студии нет парных кадров «до/после» одного и того же
   автомобиля, поэтому слайдер показывает процесс работы и готовую машину —
   без подписи с конкретной маркой, которой на фото нет. */
const cases = [
  {
    label: "Оклейка бронеплёнкой",
    note: "Плёнка уходит под кромку, без пузырей и подрезов",
    beforeMobile: "craft-tall",
    beforeDesktop: "craft-wide",
    afterMobile: "hero-mobile",
    afterDesktop: "hero-wide",
  },
  {
    label: "Полировка и керамика",
    note: "Готовим ЛКП и закрываем защитным составом",
    beforeMobile: "polish-tall",
    beforeDesktop: "polish-wide",
    afterMobile: "ready-b-tall",
    afterDesktop: "ready-b-wide",
  },
  {
    label: "Тонировка и шумоизоляция",
    note: "Разбираем двери, клеим плёнку и шумку",
    beforeMobile: "sound-tall",
    beforeDesktop: "sound-wide",
    afterMobile: "ready-c-tall",
    afterDesktop: "ready-c-wide",
  },
  {
    label: "Работа с элементами кузова",
    note: "Аккуратно снимаем и ставим детали обратно",
    beforeMobile: "salon-tall",
    beforeDesktop: "salon-wide",
    afterMobile: "fleet-mobile",
    afterDesktop: "fleet-wide",
  },
];

/* Свои фото для блока «Наши работы» — иначе карточки дублировали бы карточки
   услуг, которые стоят выше на том же экране. */
const portfolio = [
  { label: "Оклейка", service: "Бронеплёнка на кузов", result: "Завороты под кромку", mobile: "work-a-tall", desktop: "work-a-portrait", variant: "lead" },
  { label: "Полировка", service: "Керамика поверх ЛКП", result: "Блеск без голограмм", mobile: "work-b-tall", desktop: "work-b-portrait", variant: "wide" },
  { label: "Шумоизоляция", service: "Двери и арки", result: "Тише в салоне", mobile: "work-c-tall", desktop: "work-c-portrait", variant: "tall" },
  { label: "Тонировка", service: "Стёкла по кругу", result: "Прохладнее в салоне", mobile: "work-d-tall", desktop: "work-d-portrait", variant: "std" },
];

const packages = [
  {
    name: "GLAZE",
    title: "Глянцевая оклейка",
    price: "от 450 000 ₸",
    items: ["Бронеплёнка на кузов", "Американская плёнка", "Завороты под кромку", "Гарантия 12 лет"],
    cta: "Записаться",
  },
  {
    name: "LUX",
    title: "Люкс-пакет",
    price: "от 750 000 ₸",
    items: ["Всё из GLAZE", "Керамика поверх плёнки", "Тонировка стёкол", "Шумоизоляция дверей", "Подменное авто на время работ"],
    cta: "Записаться",
  },
  {
    name: "COMFORT",
    title: "Комфорт и тишина",
    price: "от 180 000 ₸",
    items: ["Шумоизоляция салона", "Тонировка стёкол", "Антидождь на стёкла", "Химчистка салона"],
    cta: "Рассчитать стоимость",
  },
];

const reviews = [
  {
    name: "Отзыв с 2ГИС",
    car: "Бронеплёнка · Lexus",
    text: "Бронировал здесь свою новую машину глянцевой плёнкой. Сразу видно, что используют только качественные материалы. Дали гарантию на 12 лет, это внушает доверие. Теперь за ЛКП не переживаю совсем.",
  },
  {
    name: "Отзыв с 2ГИС",
    car: "Оклейка · Toyota",
    text: "Качество плёнки американского производства ощущается сразу, да и цена порадовала. Завороты настолько аккуратные, что плёнку вообще не видно.",
  },
  {
    name: "Отзыв с 2ГИС",
    car: "Люкс-пакет · Zeekr",
    text: "Никогда не думал, что бронеплёнка может так преобразить автомобиль. Взял люкс пакет и не пожалел. Все завороты выполнены настолько аккуратно, что выглядит как заводская покраска.",
  },
];

const process = [
  { title: "Диагностика", note: "Осматриваем ЛКП под лампой, фиксируем сколы и потёртости до начала работ." },
  { title: "Подбор плёнки", note: "Показываем образцы — глянец, мат, сатин. Считаем точную стоимость и сроки." },
  { title: "Подготовка", note: "Мойка, обезжиривание и разбор съёмных элементов кузова." },
  { title: "Оклейка в боксе", note: "Завороты под кромку, без пыли и пузырей. На сложные зоны — лекала." },
  { title: "Контроль качества", note: "Проверяем результат при разном свете, делаем фотоотчёт до и после." },
  { title: "Выдача и гарантия", note: "Отдаём автомобиль с гарантийным талоном на 12 лет и советами по уходу." },
];

const brands = ["Lexus", "Toyota", "Hyundai", "Lixiang", "Zeekr", "BMW", "Mercedes-Benz", "Audi", "Porsche", "Kia", "Volkswagen", "Land Rover"];

/* ------------------------------------------------------------------ контакты */

/* Данные взяты из карточки «Kn Detailing Studio» в 2ГИС (Алматы, филиал
   70000001099671293) и профиля Instagram @kn_detailing_almaty.
   Телефон и WhatsApp совпадают с 2ГИС. */
const PHONE_DISPLAY = "+7 706 608 08 01";
const PHONE_HREF = "tel:+77066080801";
const CITY = "Алматы";
const ADDRESS = "Центральная, 27а/1 · Таусамалы";
const HOURS = "Ежедневно 11:00–22:00";

/* Координаты входа из карточки 2ГИС (Наурызбайский район, мкр Таусамалы). */
const MAP_POINT = { lat: 43.19982, lon: 76.844972 };

/* 2GIS key.
    2GIS does not offer an embed that works anonymously: their map widget is
    issued per organisation from the personal account (widgets.2gis.com), so an
    iframe here is useless without a key. Paste the key from that page and the
    map switches to 2GIS. While it is empty the block shows a styled placeholder
    with a working link, so the site is never broken — it just has no iframe yet. */
const TWOGIS_KEY = "";

/** Карточка студии в 2ГИС — единственная ссылка «открыть на карте». */
const TWOGIS_FIRM_URL = "https://2gis.kz/almaty/firm/70000001099671293";
const TWOGIS_FALLBACK_URL = `https://2gis.kz/almaty/search/${encodeURIComponent(`${CITY}, ${ADDRESS}`)}`;
const CONTACT_LINKS = {
  phone: PHONE_HREF,
  whatsapp: "https://wa.me/77066080801",
  instagram: "https://instagram.com/kn_detailing_almaty",
  address: TWOGIS_FIRM_URL,
};

/* Individual services, in the order a car owner actually walks the list.
   `price` is the base rate in tenge, used only to show a live estimate. */
const serviceOptions = [
  { name: "Бронеплёнка (PPF)", price: 450000 },
  { name: "Цветная оклейка", price: 380000 },
  { name: "Керамическое покрытие", price: 90000 },
  { name: "Тонировка стёкол", price: 25000 },
  { name: "Полировка кузова", price: 40000 },
  { name: "Шумоизоляция", price: 150000 },
  { name: "Химчистка салона", price: 25000 },
] as const;

const packOptions = packages.map((p) => ({ name: p.name, title: p.title, price: Number(p.price.replace(/\D/g, "").replace(/^0+/, "")) || 0 }));

const serviceNames: string[] = serviceOptions.map((s) => s.name);
const yearOptions = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i));

/** Renders tenge with thin spaces: 25 000 ₸ */
const formatTenge = (value: number) => `${value.toLocaleString("ru-RU").replace(/ /g, " ")} ₸`;

/* --------------------------------------------------------------- responsive */

const srcSetFor = (base: string, widths: number[]) => widths.map((w) => `/img/${base}-${w}.webp ${w}w`).join(", ");

type Art = { base: string; widths: number[]; sizes: string };

function Picture({
  desktop,
  mobile,
  alt,
  className,
  priority = false,
}: {
  desktop?: Art;
  mobile: Art;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <picture className={className}>
      {desktop ? <source media="(min-width: 900px)" type="image/webp" srcSet={srcSetFor(desktop.base, desktop.widths)} sizes={desktop.sizes} /> : null}
      <source type="image/webp" srcSet={srcSetFor(mobile.base, mobile.widths)} sizes={mobile.sizes} />
      <img
        src={`/img/${mobile.base}-${mobile.widths[mobile.widths.length - 1]}.webp`}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
      />
    </picture>
  );
}

const art = (base: string, widths: number[], sizes: string): Art => ({ base, widths, sizes });

/* --------------------------------------------------------------- components */

function SectionHeading({ kicker, title, copy, id }: { kicker: string; title: ReactNode; copy?: string; id?: string }) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{kicker}</span>
      <h2 id={id}>{title}</h2>
      {copy ? <p>{copy}</p> : null}
    </div>
  );
}

function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="review-stars" aria-label={`Оценка ${count} из 5`}>
      {Array.from({ length: count }, (_, i) => (
        <Star key={i} size={15} fill="currentColor" strokeWidth={0} aria-hidden="true" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ before / after */

function BeforeAfter() {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState(55);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const current = cases[index];

  const setFromClientX = useCallback((clientX: number) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setValue(Math.min(96, Math.max(4, Math.round(next))));
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      setFromClientX(e.clientX);
    };
    const up = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [setFromClientX]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") setValue((v) => Math.max(4, v - 4));
    if (e.key === "ArrowRight") setValue((v) => Math.min(96, v + 4));
    if (e.key === "Home") setValue(4);
    if (e.key === "End") setValue(96);
  };

  const stageStyle = { "--ba-left": `${value}%`, "--ba-right": `${100 - value}%` } as React.CSSProperties;

  return (
    <div className="ba-wrap">
      <div
        className="ba-stage"
        ref={stageRef}
        style={stageStyle}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          setFromClientX(e.clientX);
        }}
      >
        <div className="ba-layer ba-after">
          <Picture
            mobile={art(current.afterMobile, [480, 800], "(max-width: 899px) 100vw")}
            desktop={art(current.afterDesktop, [1280, 1920], "1050px")}
            alt={`${current.label} — готовый результат`}
          />
        </div>
        <div className="ba-layer ba-before">
          <Picture
            mobile={art(current.beforeMobile, [480, 800], "(max-width: 899px) 100vw")}
            desktop={art(current.beforeDesktop, [1280, 1920], "1050px")}
            alt={`${current.label} — процесс работы в боксе`}
          />
        </div>
        <div className="ba-divider" aria-hidden="true" />
        <div className="ba-handle" aria-hidden="true">
          <ChevronLeft size={18} />
          <ChevronRight size={18} />
        </div>
        <span className="ba-hint">Потяните</span>
        <div
          className="ba-control"
          role="slider"
          tabIndex={0}
          aria-label={`Процесс и результат: ${current.label}`}
          aria-valuemin={4}
          aria-valuemax={96}
          aria-valuenow={value}
          onKeyDown={onKeyDown}
          style={{ position: "absolute", inset: 0, zIndex: 4, opacity: 0 }}
        />
      </div>

      <div className="ba-caption">
        <div>
          <span className="eyebrow">Процесс / результат</span>
          <p>
            {current.label}
            <br />
            <strong>{current.note}</strong>
          </p>
        </div>
      </div>

      <div className="case-tabs" role="group" aria-label="Выбор работы для сравнения">
        {cases.map((item, i) => (
          <button
            key={item.label}
            type="button"
            className="case-tab"
            aria-pressed={i === index}
            onClick={() => setIndex(i)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- booking UX */

type BookingForm = {
  services: string[];
  pack: string;
  make: string;
  model: string;
  year: string;
  name: string;
  phone: string;
  channel: "phone" | "whatsapp";
  date: string;
  time: string;
  comment: string;
};

const emptyForm: BookingForm = {
  services: [],
  pack: "",
  make: "",
  model: "",
  year: "",
  name: "",
  phone: "",
  channel: "phone",
  date: "",
  time: "",
  comment: "",
};

/** Plus glyph for "add this service"; a tick replaces it once selected. */
function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Live running total. A package replaces the individual lines; a custom set adds
 * them up. Always labelled as a preliminary figure, since the studio confirms
 * the real cost after inspecting the car.
 */
function Estimate({ pack = "", services }: { pack?: string; services: string[] }) {
  const packItem = packOptions.find((p) => p.name === pack);
  const lines = services
    .map((name) => serviceOptions.find((s) => s.name === name))
    .filter((s): s is (typeof serviceOptions)[number] => Boolean(s));
  const total = packItem ? packItem.price : lines.reduce((sum, s) => sum + s.price, 0);
  const nothing = !packItem && lines.length === 0;

  return (
    <div className={`estimate ${nothing ? "estimate--empty" : ""}`} aria-live="polite">
      <div className="estimate-head">
        <span>{packItem ? `Пакет ${packItem.name}` : "Ваш набор"}</span>
        <strong className="stat-value">{nothing ? "—" : `от ${formatTenge(total)}`}</strong>
      </div>
      {lines.length > 0 ? (
        <ul className="estimate-lines">
          {lines.map((line) => (
            <li key={line.name}>
              <span>{line.name}</span>
              <span>{formatTenge(line.price)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="estimate-note">Точную стоимость подтвердит мастер после осмотра автомобиля.</p>
    </div>
  );
}

/* Opening the sheet from a service card passes that card's short title
   ("Мойка", "Защита"), while the form uses the fuller option names. */
const serviceTitleToOption: Record<string, string> = {
  Оклейка: "Бронеплёнка (PPF)",
  Керамика: "Керамическое покрытие",
  Тонировка: "Тонировка стёкол",
  Полировка: "Полировка кузова",
  Шумоизоляция: "Шумоизоляция",
  Салон: "Химчистка салона",
};

/**
 * Contact map.
 *
 * Provider is chosen at build time by whether a 2GIS key is present:
 *
 *  - with a key   -> 2GIS widget iframe (the 2GIS map people actually use);
 *  - without one  -> the Yandex widget, which works anonymously.
 *
 * 2GIS has no anonymous embed: `widget.2gis.ru` renders its banner constructor
 * for an unknown key, so shipping it keyless would show a builder to visitors.
 * A key comes from the 2GIS personal account (widgets.2gis.com). Until one is
 * pasted in, the site stays on Yandex instead of showing something broken.
 *
 * Either way the iframe is third-party and heavy, so it is only inserted once
 * the block is near the viewport. The link underneath is a real anchor, so the
 * address stays reachable if the iframe is blocked or fails.
 */
function ContactMap() {
  const holder = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  const use2GIS = TWOGIS_KEY.trim().length > 0;

  useEffect(() => {
    const el = holder.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        setVisible(true);
        io.disconnect();
      },
      // Start fetching a little before the block is fully on screen.
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  const point = `${MAP_POINT.lon}%2C${MAP_POINT.lat}`;
  const src = use2GIS
    ? `https://widget.2gis.ru/2.0/frame?key=${encodeURIComponent(TWOGIS_KEY.trim())}&point=${MAP_POINT.lon}%2C${MAP_POINT.lat}&z=16`
    : `https://yandex.ru/map-widget/v1/?ll=${point}&z=16&pt=${point}%2Cpm2rdm`;

  const openUrl = use2GIS ? TWOGIS_FALLBACK_URL : CONTACT_LINKS.address;
  const openLabel = "Открыть в 2ГИС";

  return (
    <div className="contact-map reveal" ref={holder} data-shown="">
      {visible ? (
        <iframe
          className="contact-map__frame"
          src={src}
          title={`Карта: ${CITY}, ${ADDRESS}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <div className="contact-map__placeholder" aria-hidden="true">
          <MapPin size={26} />
          <span>
            {CITY}, {ADDRESS}
          </span>
        </div>
      )}
      <a className="contact-map__link" href={openUrl} target="_blank" rel="noreferrer">
        <MapPin size={16} aria-hidden="true" />
        {openLabel}
        <ArrowUpRight size={14} aria-hidden="true" />
      </a>
    </div>
  );
}

const STEPS = ["Услуга", "Автомобиль", "Контакты", "Дата", "Проверка"];

function BookingSheet({ open, onClose, initialService }: { open: boolean; onClose: () => void; initialService?: string }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<BookingForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setSent(false);
    setSending(false);
    setErrors({});
    setDragY(0);
    // Pre-select the service the user clicked, so the form never opens empty
    // with the choice they already made somewhere else on the page.
    const preselected = initialService ? serviceTitleToOption[initialService] : undefined;
    setForm({
      ...emptyForm,
      services: preselected && serviceNames.includes(preselected) ? [preselected] : [],
    });
  }, [open, initialService]);

  /* keep the sheet inside the visible viewport when the keyboard opens */
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const vv = window.visualViewport;
    const apply = () => {
      if (!vv) return;
      root.style.setProperty("--vvh", `${Math.round(vv.height)}px`);
      root.style.setProperty("--vv-top", `${Math.round(vv.offsetTop)}px`);
    };
    apply();
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      root.style.removeProperty("--vvh");
      root.style.removeProperty("--vv-top");
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => sheetRef.current?.focus({ preventScroll: true }), 60);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;

  const set = <K extends keyof BookingForm>(key: K, value: BookingForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key as string] ? { ...prev, [key as string]: "" } : prev));
  };

  /* validates the fields of the step the user is leaving */
  const validate = (target: number) => {
    const next: Record<string, string> = {};
    if (target === 0 && !form.pack && form.services.length === 0) next.services = "Выберите пакет или хотя бы одну услугу";
    if (target >= 1) {
      if (!form.make.trim()) next.make = "Укажите марку";
      if (!form.model.trim()) next.model = "Укажите модель";
    }
    if (target >= 2) {
      if (!form.name.trim()) next.name = "Как к вам обращаться?";
      const digits = form.phone.replace(/\D/g, "");
      if (digits.length < 10) next.phone = "Введите номер телефона полностью";
    }
    if (target >= 3) {
      if (!form.date) next.date = "Выберите дату";
      if (!form.time) next.time = "Выберите время";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validate(step)) return;
    if (step === STEPS.length - 1) {
      // Demo submit: there is no backend yet, so hold the loader briefly and
      // then show the success state. Swap this for a real request when there is.
      setSending(true);
      window.setTimeout(() => {
        setSending(false);
        setSent(true);
      }, 900);
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setErrors({});
    if (sent) {
      setSent(false);
      return;
    }
    setStep((s) => Math.max(0, s - 1));
    bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onFieldFocus = (e: React.FocusEvent<HTMLElement>) => {
    const el = e.target;
    window.setTimeout(() => el.scrollIntoView({ block: "nearest", behavior: "smooth" }), 220);
  };

  const stepTitles = ["Что сделаем с автомобилем?", "Расскажите об автомобиле", "Куда отправить подтверждение?", "Когда удобно приехать?", "Проверьте заявку"];

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="booking-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        tabIndex={-1}
        ref={sheetRef}
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: "none" } : { transition: "transform .22s ease" }}
      >
        <div
          className="sheet-grab"
          aria-hidden="true"
          onPointerDown={(e) => {
            dragStart.current = e.clientY;
            (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (dragStart.current == null) return;
            setDragY(Math.max(0, e.clientY - dragStart.current));
          }}
          onPointerUp={() => {
            if (dragY > 110) {
              dragStart.current = null;
              setDragY(0);
              onClose();
              return;
            }
            dragStart.current = null;
            setDragY(0);
          }}
        >
          <i />
        </div>

        <div className="modal-head">
          <span className="modal-head-label">{sent ? "Заявка принята" : "Онлайн-запись"}</span>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Закрыть окно записи">
            <X size={18} />
          </button>
        </div>

        {!sent ? (
          <>
            <div className="modal-steps">
              <div className="modal-top">
                <span className="eyebrow">KN / BOOKING</span>
                <span className="step-count">
                  {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
                </span>
              </div>
              <h2 id="booking-title">{stepTitles[step]}</h2>
              <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>
                <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
              </div>
            </div>

            <div className="modal-body" ref={bodyRef}>
              {step === 0 ? (
                <>
                  <p className="form-lead">Выберите пакет целиком или соберите свой набор — можно взять несколько услуг сразу.</p>

                  <div className="pack-picker" role="group" aria-label="Готовые пакеты">
                    <button
                      type="button"
                      className={`pack-option ${form.pack === "" ? "selected" : ""}`}
                      aria-pressed={form.pack === ""}
                      onClick={() => set("pack", "")}
                    >
                      <span className="pack-option-name">Без пакета</span>
                      <span className="pack-option-note">Соберу услуги сам</span>
                    </button>
                    {packOptions.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        className={`pack-option ${form.pack === item.name ? "selected" : ""}`}
                        aria-pressed={form.pack === item.name}
                        onClick={() => set("pack", form.pack === item.name ? "" : item.name)}
                      >
                        <span className="pack-option-name">{item.name}</span>
                        <span className="pack-option-title">{item.title}</span>
                        <span className="pack-option-price">{formatTenge(item.price)}</span>
                      </button>
                    ))}
                  </div>

                  {/* Picking a package replaces the individual list, the way a
                      car owner thinks about it: either the bundle or the parts. */}
                  {form.pack === "" ? (
                    <>
                      <div className="choice-grid">
                        {serviceOptions.map((item) => {
                          const active = form.services.includes(item.name);
                          return (
                            <button
                              key={item.name}
                              type="button"
                              className={`choice ${active ? "selected" : ""}`}
                              aria-pressed={active}
                              onClick={() =>
                                set(
                                  "services",
                                  active ? form.services.filter((n) => n !== item.name) : [...form.services, item.name],
                                )
                              }
                            >
                              <span>{item.name}</span>
                              <span className="choice-price">{formatTenge(item.price)}</span>
                              {active ? <Check size={16} /> : <PlusIcon />}
                            </button>
                          );
                        })}
                      </div>
                      {errors.services ? <span className="field-error">{errors.services}</span> : null}
                      <Estimate services={form.services} />
                    </>
                  ) : (
                    <Estimate pack={form.pack} services={[]} />
                  )}
                </>
              ) : null}

              {step === 1 ? (
                <div className="input-grid input-grid--pair">
                  <label className={`field ${errors.make ? "field--invalid" : ""}`}>
                    <span>Марка</span>
                    <input
                      value={form.make}
                      onChange={(e) => set("make", e.target.value)}
                      onFocus={onFieldFocus}
                      placeholder="Toyota"
                      autoComplete="off"
                      enterKeyHint="next"
                    />
                    {errors.make ? <span className="field-error">{errors.make}</span> : null}
                  </label>
                  <label className={`field ${errors.model ? "field--invalid" : ""}`}>
                    <span>Модель</span>
                    <input
                      value={form.model}
                      onChange={(e) => set("model", e.target.value)}
                      onFocus={onFieldFocus}
                      placeholder="Camry"
                      autoComplete="off"
                      enterKeyHint="next"
                    />
                    {errors.model ? <span className="field-error">{errors.model}</span> : null}
                  </label>
                  <label className="field">
                    <span>Год выпуска</span>
                    <select value={form.year} onChange={(e) => set("year", e.target.value)} onFocus={onFieldFocus}>
                      <option value="">Не важно</option>
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}

              {step === 2 ? (
                <>
                  <div className="input-grid input-grid--pair">
                    <label className={`field ${errors.name ? "field--invalid" : ""}`}>
                      <span>Имя</span>
                      <input
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        onFocus={onFieldFocus}
                        placeholder="Ваше имя"
                        autoComplete="name"
                        enterKeyHint="next"
                      />
                      {errors.name ? <span className="field-error">{errors.name}</span> : null}
                    </label>
                    <label className={`field ${errors.phone ? "field--invalid" : ""}`}>
                      <span>Телефон</span>
                      <input
                        value={form.phone}
                        onChange={(e) => set("phone", e.target.value)}
                        onFocus={onFieldFocus}
                        placeholder="+7 (___) ___-__-__"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        enterKeyHint="done"
                      />
                      {errors.phone ? <span className="field-error">{errors.phone}</span> : null}
                    </label>
                  </div>
                  <div className="contact-row" role="group" aria-label="Способ связи">
                    {(["phone", "whatsapp"] as const).map((channel) => (
                      <button
                        key={channel}
                        type="button"
                        className={`contact-pill ${form.channel === channel ? "active" : ""}`}
                        aria-pressed={form.channel === channel}
                        onClick={() => set("channel", channel)}
                      >
                        {channel === "phone" ? "Звонок" : "WhatsApp"}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <div className="input-grid input-grid--pair">
                    <label className={`field ${errors.date ? "field--invalid" : ""}`}>
                      <span>Дата</span>
                      <input
                        value={form.date}
                        min={today}
                        onChange={(e) => set("date", e.target.value)}
                        onFocus={onFieldFocus}
                        type="date"
                        enterKeyHint="next"
                      />
                      {errors.date ? <span className="field-error">{errors.date}</span> : null}
                    </label>
                    <label className={`field ${errors.time ? "field--invalid" : ""}`}>
                      <span>Время</span>
                      <input
                        value={form.time}
                        onChange={(e) => set("time", e.target.value)}
                        onFocus={onFieldFocus}
                        type="time"
                        step={1800}
                        enterKeyHint="done"
                      />
                      {errors.time ? <span className="field-error">{errors.time}</span> : null}
                    </label>
                  </div>
                  <label className="field" style={{ marginTop: 14 }}>
                    <span>Комментарий (необязательно)</span>
                    <textarea
                      value={form.comment}
                      onChange={(e) => set("comment", e.target.value)}
                      onFocus={onFieldFocus}
                      rows={3}
                      placeholder="Например: есть царапина на заднем бампере"
                    />
                  </label>
                  <div className="booking-note">
                    <CalendarDays size={16} />
                    <span>Администратор подтвердит время в течение 15 минут в рабочее часы.</span>
                  </div>
                </>
              ) : null}

              {step === 4 ? (
                <>
                  <div className="recap">
                    <div className="recap-row">
                      <span>Пакет</span>
                      <b>{form.pack ? `${form.pack} — ${packOptions.find((p) => p.name === form.pack)?.title ?? ""}` : "Без пакета"}</b>
                    </div>
                    <div className="recap-row">
                      <span>Услуги{form.services.length > 1 ? ` (${form.services.length})` : ""}</span>
                      <b>{form.services.length ? form.services.join(", ") : "—"}</b>
                    </div>
                    <div className="recap-row">
                      <span>Автомобиль</span>
                      <b>{[form.make, form.model].filter(Boolean).join(" ") || "—"}</b>
                    </div>
                    <div className="recap-row">
                      <span>Контакты</span>
                      <b>
                        {form.name}
                        {form.name && form.phone ? ", " : ""}
                        {form.phone}
                      </b>
                    </div>
                    <div className="recap-row">
                      <span>Дата и время</span>
                      <b>
                        {form.date || "—"}
                        {form.time ? `, ${form.time}` : ""}
                      </b>
                    </div>
                    <div className="recap-row">
                      <span>Способ связи</span>
                       <b>{form.channel === "phone" ? "Звонок" : "WhatsApp"}</b>
                    </div>
                    {form.comment ? (
                      <div className="recap-row">
                        <span>Комментарий</span>
                        <b>{form.comment}</b>
                      </div>
                    ) : null}
                  </div>
                  <div className="booking-note">
                    <ShieldCheck size={16} />
                    <span>Мы не передаём контакты третьим лицам и не звоним без запроса.</span>
                  </div>
                </>
              ) : null}
            </div>

            <div className={`modal-foot ${step > 0 ? "modal-foot--split" : ""}`}>
              {step > 0 ? (
                <button type="button" className="button button--outline" onClick={goBack} aria-label="Вернуться на предыдущий шаг">
                  <ChevronLeft size={16} />
                  Назад
                </button>
              ) : null}
              <button type="button" className="button button--accent" onClick={goNext} disabled={sending}>
                {sending ? (
                  <>
                    <DotMatrix label="Отправляем" />
                  </>
                ) : (
                  <>
                    {step === STEPS.length - 1 ? "Отправить заявку" : "Продолжить"}
                    {step === STEPS.length - 1 ? <ArrowUpRight size={16} /> : <ChevronRight size={16} />}
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="success-state">
            <div className="success-mark">
              <Check size={28} />
            </div>
            <span className="eyebrow">Заявка принята</span>
            <h2>
              До встречи
              <br />
              <em>в KN.</em>
            </h2>
            <p>
              Свяжемся с вами по номеру {form.phone} ({form.channel === "phone" ? "звонок" : "WhatsApp"}), чтобы подтвердить время визита.
            </p>
            <button type="button" className="button button--outline" onClick={onClose}>
              Закрыть
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- page */

export default function Home() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingService, setBookingService] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [openService, setOpenService] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useRevealOnScroll();

  const openBooking = useCallback((service = "") => {
    setBookingService(service);
    setMenuOpen(false);
    setBookingOpen(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 900) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="site-shell">
      <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}>
        <a href="#top" className="brand" aria-label="KN Detailing Studio — в начало страницы" onClick={(e) => { e.preventDefault(); scrollTo("top"); }}>
          <span>KN</span>
          <small>DETAILING</small>
        </a>

        <nav className={menuOpen ? "nav-links nav-links--open" : "nav-links"} aria-label="Основная навигация">
          {[
            ["services", "Услуги"],
            ["work", "Работы"],
            ["reviews", "Отзывы"],
            ["process", "Процесс"],
            ["contacts", "Контакты"],
          ].map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollTo(id);
              }}
            >
              {label}
            </a>
          ))}
          <div className="nav-contact">
            <a href={PHONE_HREF}>
              <Phone size={14} aria-hidden="true" /> {PHONE_DISPLAY}
            </a>
            <a href={CONTACT_LINKS.address} target="_blank" rel="noreferrer">
              <MapPin size={14} aria-hidden="true" /> {CITY}, {ADDRESS}
            </a>
          </div>
        </nav>

        <div className="header-actions">
          <span className="header-phone">{PHONE_DISPLAY}</span>
          <button type="button" className="header-cta" onClick={() => openBooking()}>
            Записаться <ArrowUpRight size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {menuOpen ? <div className="nav-scrim nav-scrim--open" onClick={() => setMenuOpen(false)} role="presentation" /> : null}

      <main id="top">
        <section className="hero">
          <Picture
            className="hero-media"
            priority
            mobile={art("hero-mobile", [480, 800, 1200], "100vw")}
            desktop={art("hero-wide", [1280, 1920], "100vw")}
            alt="Оклейка и защита кузова в студии KN Detailing, Алматы"
          />
          <div className="hero-overlay" />
          <div className="hero-content">
            <div className="hero-kicker">
              <span>Премиум-оклейка и защита кузова</span>
              <span>
                {CITY} · {HOURS}
              </span>
            </div>
            <h1>
              Броня <em>для вашего</em> автомобиля.
            </h1>
            <div className="hero-bottom">
              <p>Бронеплёнка, тонировка, керамика, шумоизоляция и ремонт салона. Американские плёночные материалы, аккуратные завороты, гарантия 12 лет.</p>
              <div className="hero-actions">
                <button type="button" className="button button--accent" onClick={() => openBooking()}>
                  Записаться <ArrowUpRight size={16} aria-hidden="true" />
                </button>
                <button type="button" className="button button--outline button--ghost-light" onClick={() => scrollTo("services")}>
                  Услуги и цены
                </button>
              </div>
            </div>
            <div className="hero-meta">
              <span>
                <strong>12 лет</strong> гарантия на оклейку
              </span>
              <span>
                <strong>682</strong> отзыва на 2ГИС
              </span>
              <span>
                <strong>4.8</strong> рейтинг студии
              </span>
            </div>
          </div>
        </section>

        <section className="trust-bar" aria-label="Ключевые преимущества">
          <span className="eyebrow">Почему выбирают KN</span>
          {/* Duplicated once so the marquee can loop seamlessly at -50%.
              The copy is hidden from assistive tech to avoid reading it twice. */}
          <div className="trust-marquee" aria-hidden="true">
            {[0, 1].map((copy) => (
              <div className="trust-marquee-run" key={copy}>
                <span className="trust-item">Американская плёнка</span>
                <span className="trust-item">Гарантия 12 лет</span>
                <span className="trust-item">Подменное авто</span>
                <span className="trust-item">Эвакуатор</span>
                <span className="trust-item">Фотоотчёт до/после</span>
                <span className="trust-item">Запись за 1 минуту</span>
              </div>
            ))}
          </div>
          <div className="trust-static">
            <span className="trust-item">Американская плёнка</span>
            <span className="trust-item">Гарантия 12 лет</span>
            <span className="trust-item">Подменное авто</span>
            <span className="trust-item">Фотоотчёт до/после</span>
          </div>
        </section>

        <section className="section services-section" id="services">
          <div className="container">
            <SectionHeading
              kicker="01 / Услуги"
              title={
                <>
                  Шесть направлений <em>одной студии.</em>
                </>
              }
              copy="Нажмите на услугу, чтобы увидеть детали и записаться. Цены — от базовых, точную стоимость назовём после осмотра автомобиля."
            />
            <div className="services-grid">
              {services.map((service, i) => {
                const isOpen = openService === service.title;
                return (
                  <article
                    className={`service-card reveal ${isOpen ? "service-card--open" : ""}`}
                    style={{ "--d": `${Math.min(i, 4) * 70}ms` } as React.CSSProperties}
                    key={service.title}
                  >
                    <button
                      type="button"
                      className="service-card__button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenService(isOpen ? null : service.title)}
                    >
                      <div className="service-image">
                        <Picture
                          mobile={art(`${service.media}-card`, [480, 800], "(max-width: 899px) calc(100vw - 40px)")}
                          desktop={art(`${service.media}-portrait`, [420, 760], "33vw")}
                          alt={`${service.title} — ${service.note}`}
                        />
                        <span className="service-no">{service.no}</span>
                        <span className="service-arrow" aria-hidden="true">
                          <ArrowUpRight size={18} />
                        </span>
                      </div>
                      <div className="service-meta">
                        <div>
                          <h3>{service.title}</h3>
                          <p>{service.note}</p>
                        </div>
                        <strong>{service.price}</strong>
                      </div>
                    </button>
                    <div className="service-detail">
                      <div className="service-detail-inner">
                        <p>{service.detail}</p>
                        <button type="button" className="text-link" onClick={() => openBooking(service.title)}>
                          Записаться на «{service.title}» <ArrowUpRight size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="split-feature">
          <div className="split-image">
            <Picture
              mobile={art("craft-card", [480, 800], "100vw")}
              desktop={art("craft-tall", [480, 800], "50vw")}
              alt="Мастер оклеивает кузов автомобиля плёнкой в боксе KN Detailing Studio"
            />
          </div>
          <div className="split-copy">
            <span className="eyebrow">02 / Наш подход</span>
            <h2>
              Премиум-материалы <em>без лишнего.</em>
            </h2>
            <p>
              Работаем с Lexus, Toyota, Hyundai, Lixiang и Zeekr. Показываем образцы плёнки, объясняем, где защита нужна в первую очередь, и не
              навязываем оклейку всего кузова, если достаточно зон риска.
            </p>
            <div className="feature-list">
              <div>
                <BoilIcon>
                  <Sparkles size={18} aria-hidden="true" />
                </BoilIcon>
                <span>Стоимость фиксируем до начала работ</span>
              </div>
              <div>
                <BoilIcon>
                  <ShieldCheck size={18} aria-hidden="true" />
                </BoilIcon>
                <span>Гарантия 12 лет на оклейку и покрытия</span>
              </div>
              <div>
                <BoilIcon>
                  <Droplets size={18} aria-hidden="true" />
                </BoilIcon>
                <span>Подменное авто и эвакуатор на время работ</span>
              </div>
            </div>
            <button type="button" className="text-link" onClick={() => scrollTo("process")}>
              Как мы работаем <ArrowUpRight size={15} aria-hidden="true" />
            </button>
          </div>
        </section>

        <section className="section before-section">
          <div className="container">
            <SectionHeading
              kicker="03 / Результат"
              title={
                <>
                  Разница <em>видна сразу.</em>
                </>
              }
              copy="Потяните ползунок: слева — как идёт работа в боксе, справа — что получается в итоге."
            />
            <BeforeAfter />
          </div>
        </section>

        <section className="section work-section" id="work">
          <div className="container">
            <div className="work-head">
              <SectionHeading
                kicker="04 / Наши работы"
                title={
                  <>
                    Результат <em>без слов.</em>
                  </>
                }
              />
              <button type="button" className="text-link" onClick={() => openBooking()}>
                Записаться <ArrowUpRight size={15} aria-hidden="true" />
              </button>
            </div>
            <div className="work-grid">
              {portfolio.map((item, i) => (
                <article
                  className={`work-card work-card--${i} work-card--${item.variant} reveal`}
                  style={{ "--d": `${Math.min(i, 3) * 80}ms` } as React.CSSProperties}
                  key={item.label}
                >
                  <Picture
                    mobile={art(item.mobile, [480, 800], "(max-width: 899px) 100vw")}
                    desktop={art(item.desktop, [420, 760], "(min-width: 900px) 50vw, 100vw")}
                    alt={`${item.label} — ${item.service}`}
                  />
                  <div className="work-card-overlay">
                    <span>{item.label}</span>
                    <small>{item.service}</small>
                    <strong>{item.result}</strong>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section packages-section" id="packages">
          <div className="container">
            <SectionHeading
              kicker="05 / Пакеты"
              title={
                <>
                  Выберите <em>свой формат.</em>
                </>
              }
              copy="Три готовых сценария. Нужен другой набор — соберём его и назовём стоимость после осмотра автомобиля."
            />
            <div className="packages-grid">
              {packages.map((pack, i) => (
                <article
                  className={`package-card reveal ${i === 1 ? "package-card--featured" : ""}`}
                  style={{ "--d": `${i * 90}ms` } as React.CSSProperties}
                  key={pack.name}
                >
                  {i === 1 ? <span className="package-badge">Чаще выбирают</span> : null}
                  <span className="eyebrow">0{i + 1} / {pack.name}</span>
                  <h3>{pack.title}</h3>
                  <p>{pack.name}</p>
                  <div className="package-price">{pack.price}</div>
                  <ul>
                    {pack.items.map((item) => (
                      <li key={item}>
                        <Check size={15} aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button type="button" className="button button--outline" onClick={() => openBooking()}>
                    {pack.cta}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section reviews-section" id="reviews">
          <div className="container">
            <div className="reviews-head">
              <span className="eyebrow">06 / Отзывы</span>
              <h2>
                Нас <em>рекомендуют.</em>
              </h2>
              <div className="reviews-rating">
                <Stars />
                <span>4.8 из 5 — по 682 отзывам на 2ГИС</span>
              </div>
            </div>
            <div className="reviews-grid">
              {reviews.map((review, i) => (
                <article className="review-card reveal" style={{ "--d": `${i * 80}ms` } as React.CSSProperties} key={review.car}>
                  <Stars />
                  <blockquote>{review.text}</blockquote>
                  <div className="review-author">
                    <strong>{review.name}</strong>
                    <span>{review.car}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="process-band" id="process">
          <div className="container">
            <div className="process-intro">
              <span className="eyebrow">07 / Процесс</span>
              <h2>
                Ничего <em>случайного.</em>
              </h2>
              <p>Шесть шагов от заявки до автомобиля, который выглядит как с завода.</p>
            </div>
            <ol className="process-steps">
              {process.map((item, i) => (
                <li className="process-step reveal" style={{ "--d": `${i * 60}ms` } as React.CSSProperties} key={item.title}>
                  <span aria-hidden="true">0{i + 1}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.note}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section brands-section">
          <div className="container">
            <div className="brands-layout">
              <SectionHeading
                kicker="08 / Опыт"
                title={
                  <>
                    Работаем <em>с вашей машиной.</em>
                  </>
                }
                copy="От городских седанов и кроссоверов до премиальных брендов. Сохраняем характер и состояние каждого автомобиля."
              />
              <div className="brands-list">
                {brands.map((brand) => (
                  <span key={brand}>{brand}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="final-cta">
          <Picture
            className="final-media"
            mobile={art("fleet-mobile", [480, 800, 1200], "100vw")}
            desktop={art("fleet-wide", [1280, 1920], "100vw")}
            alt="Автомобили после детейлинга у студии KN Detailing Studio, Алматы"
          />
          <div className="final-cta-overlay" />
          <div className="final-content">
            <span className="eyebrow">09 / Ваш автомобиль. Наш уход.</span>
            <h2>
              Пора <em>под плёнку?</em>
            </h2>
            <button type="button" className="button button--accent" onClick={() => openBooking()}>
              Записаться онлайн <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          </div>
        </section>

        <section className="section contacts-section" id="contacts" aria-labelledby="contacts-title">
          <div className="container">
            <div className="contacts-layout">
              <div className="contacts-copy">
                <span className="eyebrow">10 / Как нас найти</span>
                <h2 id="contacts-title">
                  Приезжайте <em>в студию.</em>
                </h2>
                <p>
                  Студия в Наурызбайском районе, мкр Таусамалы. Позвоните или напишите в WhatsApp заранее — подготовим бокс и подберём время, чтобы вы не
                  ждали в очереди.
                </p>

                <ul className="contacts-list">
                  <li>
                    <span className="contacts-list__icon">
                      <MapPin size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <strong>Адрес</strong>
                      <span>
                        {CITY}, {ADDRESS}
                      </span>
                    </div>
                  </li>
                  <li>
                    <span className="contacts-list__icon">
                      <Clock3 size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <strong>Часы работы</strong>
                      <span>{HOURS}</span>
                    </div>
                  </li>
                  <li>
                    <span className="contacts-list__icon">
                      <Phone size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <strong>Телефон</strong>
                      <a href={PHONE_HREF}>{PHONE_DISPLAY}</a>
                    </div>
                  </li>
                  <li>
                    <span className="contacts-list__icon">
                      <MessageCircle size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <strong>Мессенджеры</strong>
                      <span className="contacts-list__links">
                        <a href={CONTACT_LINKS.whatsapp} target="_blank" rel="noreferrer">
                          WhatsApp
                        </a>
                        <a href={CONTACT_LINKS.instagram} target="_blank" rel="noreferrer">
                          Instagram
                        </a>
                      </span>
                    </div>
                  </li>
                </ul>

                <button type="button" className="button button--accent" onClick={() => openBooking()}>
                  Записаться онлайн <ArrowUpRight size={16} aria-hidden="true" />
                </button>
              </div>

              <ContactMap />
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-top">
          <a href="#top" className="brand" onClick={(e) => { e.preventDefault(); scrollTo("top"); }}>
            <span>KN</span>
            <small>DETAILING</small>
          </a>
          <p>
            Оклейка. Защита.
            <br />
            Тишина. Результат.
          </p>
          <div className="footer-cta">
              <span>Есть вопрос по плёнке?</span>
            <a href={PHONE_HREF}>
              <Phone size={14} aria-hidden="true" /> {PHONE_DISPLAY}
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <div>
            <span>
              {CITY}, {ADDRESS}
            </span>
            <span>{HOURS}</span>
          </div>
          <div className="footer-social">
            <a href={CONTACT_LINKS.whatsapp} target="_blank" rel="noreferrer">
              <MessageCircle size={16} aria-hidden="true" /> WhatsApp
            </a>
            <a href={CONTACT_LINKS.instagram} target="_blank" rel="noreferrer">
              <Instagram size={16} aria-hidden="true" /> Instagram
            </a>
          </div>
          <span>© {new Date().getFullYear()} KN Detailing Studio</span>
        </div>
      </footer>

      <BookingSheet open={bookingOpen} onClose={() => setBookingOpen(false)} initialService={bookingService} />
    </div>
  );
}
