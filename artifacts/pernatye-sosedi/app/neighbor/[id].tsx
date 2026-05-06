import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BirdSpecies,
  OTHER_PET_LABELS,
  SITTER_CAPABILITY_LABELS,
  SIT_TYPE_SHORT,
  SPECIES_LABELS,
  useApp,
} from "@/context/AppContext";
import { BirdSpeciesIcon } from "@/components/BirdSpeciesIcon";
import { Avatar } from "@/components/Avatar";
import { HelpStatusBadge } from "@/components/HelpStatusBadge";
import { RatingStars } from "@/components/RatingStars";
import { useColors } from "@/hooks/useColors";

type MockBird = {
  species: string;
  name: string;
  wasExamined?: boolean;
  vetName?: string;
  lastCheckupDate?: string;
};

const MOCK_USER_BIRDS: Record<string, MockBird[]> = {
  n1: [
    { species: "parrot_corella", name: "Гоша", wasExamined: true, vetName: "Др. Смирнова, ВетБёрд", lastCheckupDate: "10.11.2025" },
    { species: "parrot_budgie", name: "Кеша", wasExamined: true, vetName: "Др. Смирнова, ВетБёрд", lastCheckupDate: "10.11.2025" },
  ],
  n2: [{ species: "canary", name: "Жёлтик", wasExamined: true, vetName: "Др. Смирнова, ВетБёрд", lastCheckupDate: "10.11.2025" }],
  n3: [
    { species: "parrot_budgie", name: "Буся", wasExamined: true, vetName: "Др. Смирнова, ВетБёрд", lastCheckupDate: "10.11.2025" },
    { species: "parrot_budgie", name: "Чика", wasExamined: true, vetName: "Др. Смирнова, ВетБёрд", lastCheckupDate: "10.11.2025" },
  ],
  n4: [
    { species: "pigeon", name: "Сизый", wasExamined: true, vetName: "Др. Смирнова, ВетБёрд", lastCheckupDate: "10.11.2025" },
    { species: "parrot_corella", name: "Арни", wasExamined: true, vetName: "Др. Смирнова, ВетБёрд", lastCheckupDate: "10.11.2025" },
  ],
  n5: [
    { species: "canary", name: "Лимон", wasExamined: true, vetName: "Др. Смирнова, ВетБёрд", lastCheckupDate: "10.11.2025" },
    { species: "other", name: "Квакер", wasExamined: true, vetName: "Др. Смирнова, ВетБёрд", lastCheckupDate: "10.11.2025" },
  ],
  n6: [{ species: "parrot_pyrrhura", name: "Рикки", wasExamined: true, vetName: "Др. Смирнова, ВетБёрд", lastCheckupDate: "10.11.2025" }],
  n7: [{ species: "parrot_lovebird", name: "Перчик", wasExamined: true, vetName: "Клиника «Пернатый доктор»", lastCheckupDate: "05.12.2025" }],
  n8: [{ species: "parrot_jaco", name: "Бруно" }],
  n9: [{ species: "parrot_rosella", name: "Радуга", wasExamined: true, vetName: "Др. Орлов, ВетСити", lastCheckupDate: "18.01.2026" }],
  n10: [{ species: "parrot_amazon", name: "Манго" }],
  n11: [{ species: "parrot_alexandrine", name: "Алекс", wasExamined: true, vetName: "Клиника «Птичий дом»", lastCheckupDate: "22.02.2026" }],
  n12: [{ species: "parrot_ara", name: "Карлос" }],
  n13: [{ species: "finch", name: "Фея", wasExamined: true, vetName: "Др. Зайцева, ВетПтица", lastCheckupDate: "14.03.2026" }],
  n14: [{ species: "parrot_kakadu", name: "Снежок" }],
  n15: [{ species: "parrot_eclectus", name: "Изумруд", wasExamined: true, vetName: "Клиника «Айболит-вет»", lastCheckupDate: "09.01.2026" }],
  n16: [{ species: "parakeet_kakariki", name: "Шумок" }],
  n17: [{ species: "parrot_jaco", name: "Соломон", wasExamined: true, vetName: "Др. Смирнова, ВетБёрд", lastCheckupDate: "28.03.2026" }],
  n18: [{ species: "pigeon", name: "Гулёна" }],
  n19: [{ species: "parrot_pyrrhura", name: "Чили", wasExamined: true, vetName: "Клиника «Пернатый доктор»", lastCheckupDate: "11.02.2026" }],
  n20: [{ species: "other", name: "Зяблик" }],
};

const MOCK_REVIEWS: Record<
  string,
  { fromName: string; tags: string[]; comment: string; date: string }[]
> = {
  n1: [
    {
      fromName: "Анна К.",
      tags: ["вовремя кормил", "отправлял фото каждый день", "птицы его обожают"],
      comment: "Алексей взял на неделю мою кореллу. Каждое утро — фото и короткое видео. Гоша прилетал к нему на плечо уже на третий день.",
      date: "2025-04-02",
    },
    {
      fromName: "Павел Р.",
      tags: ["знает особенности кормления", "ответственный"],
      comment: "Спасибо, что напомнил про витамины. Видно, что человек давно с птицами.",
      date: "2025-02-18",
    },
    {
      fromName: "Светлана Д.",
      tags: ["птица вернулась здоровой", "очень аккуратный"],
      comment: "Забрала Кешу как и оставляла — бодрого и довольного. Рекомендую.",
      date: "2024-12-09",
    },
  ],
  n2: [
    {
      fromName: "Алексей М.",
      tags: ["вовремя кормил", "отправлял фото каждый день", "птица вернулась здоровой"],
      comment: "Марина — замечательный птичник. Очень ответственно подошла к присмотру за моей канарейкой, держала режим до минуты.",
      date: "2025-03-10",
    },
    {
      fromName: "Олег Т.",
      tags: ["ответственный", "знает особенности кормления"],
      comment: "Не побоялась дать прописанный препарат, всё по графику. Очень благодарен.",
      date: "2024-11-21",
    },
  ],
  n3: [
    {
      fromName: "Виктория С.",
      tags: ["очень аккуратный", "отправлял фото каждый день"],
      comment: "Дмитрий аккуратно относится к клетке и моменту посадки птицы — для волнистого это важно. Буся не нервничала.",
      date: "2025-03-25",
    },
    {
      fromName: "Михаил П.",
      tags: ["вовремя кормил", "ответственный"],
      comment: "Чётко, без сюрпризов. Сразу написал, когда заметил, что птица меньше пьёт — мелочь, но приятно.",
      date: "2025-01-14",
    },
    {
      fromName: "Елена Г.",
      tags: ["птицы его обожают"],
      comment: "Мой пугливый попугай за 3 дня перестал прятаться. Это что-то.",
      date: "2024-10-03",
    },
  ],
  n4: [
    {
      fromName: "Кирилл В.",
      tags: ["отправлял фото каждый день", "ответственный"],
      comment: "Екатерина — внимательный человек. Каждое утро отчёт, никаких догадок «как там птица».",
      date: "2025-03-30",
    },
    {
      fromName: "Тимур А.",
      tags: ["знает особенности кормления", "птица вернулась здоровой"],
      comment: "Подсказала, что моя смесь устарела, и помогла подобрать новую. Сизый чувствует себя лучше.",
      date: "2025-02-08",
    },
  ],
  n5: [
    {
      fromName: "Дмитрий Л.",
      tags: ["вовремя кормил", "знает особенности кормления", "птицы его обожают"],
      comment: "Ирина — настоящий профессионал. Птица была счастлива и заметно набрала уверенность.",
      date: "2025-02-15",
    },
    {
      fromName: "Марина С.",
      tags: ["отправлял фото каждый день", "птица вернулась здоровой"],
      comment: "Всё прошло отлично, очень рекомендую. Лимон вернулся в идеальной форме.",
      date: "2025-01-22",
    },
    {
      fromName: "Андрей К.",
      tags: ["очень аккуратный", "ответственный"],
      comment: "Видно, что человек уважает птиц, а не просто оказывает услугу.",
      date: "2024-12-30",
    },
    {
      fromName: "Юлия Р.",
      tags: ["знает особенности кормления"],
      comment: "Подсказала несколько важных вещей про витамины — спасибо!",
      date: "2024-11-05",
    },
  ],
  n6: [
    {
      fromName: "Олеся М.",
      tags: ["вовремя кормил", "очень аккуратный"],
      comment: "Сергей отлично справился с моей пиррурой. Очень спокойный и обстоятельный.",
      date: "2025-02-20",
    },
    {
      fromName: "Игорь Ф.",
      tags: ["ответственный", "птица вернулась здоровой"],
      comment: "Оставлял Рикки на 5 дней. Никаких претензий — птица бодрая, клетка чистая.",
      date: "2024-12-12",
    },
  ],
  n7: [
    {
      fromName: "Лариса Н.",
      tags: ["отправлял фото каждый день", "птицы его обожают"],
      comment: "Ольга присматривала за неразлучниками — фото и видео каждый день, видно, как она с ними играет.",
      date: "2025-04-05",
    },
    {
      fromName: "Денис Ш.",
      tags: ["знает особенности кормления", "ответственный"],
      comment: "Грамотный человек, спокойно отнеслась к нашему режиму смены корма.",
      date: "2025-01-19",
    },
    {
      fromName: "Наталия Б.",
      tags: ["вовремя кормил"],
      comment: "Никаких опозданий, всё чётко по таймеру.",
      date: "2024-09-27",
    },
  ],
  n8: [
    {
      fromName: "Максим О.",
      tags: ["знает особенности кормления", "очень аккуратный", "ответственный"],
      comment: "Андрей — лучший на моей памяти. Жако — сложная птица, и видно, что он реально понимает, что делает.",
      date: "2025-03-18",
    },
    {
      fromName: "Алина Ж.",
      tags: ["отправлял фото каждый день", "птица вернулась здоровой"],
      comment: "10 лет опыта чувствуются. Спокойная коммуникация, всегда на связи.",
      date: "2024-12-04",
    },
    {
      fromName: "Сергей П.",
      tags: ["птицы его обожают"],
      comment: "Мой ара дичится новых людей, но к Андрею пошёл сразу.",
      date: "2024-08-15",
    },
  ],
  n9: [
    {
      fromName: "Елизавета К.",
      tags: ["вовремя кормил", "ответственный"],
      comment: "Татьяна молодая, но очень собранная. Канарейка вернулась в полном порядке.",
      date: "2025-03-08",
    },
    {
      fromName: "Роман Д.",
      tags: ["отправлял фото каждый день"],
      comment: "Каждый вечер короткий отчёт + видео — это бесценно, когда уезжаешь надолго.",
      date: "2025-01-12",
    },
  ],
  n10: [
    {
      fromName: "Юрий В.",
      tags: ["знает особенности кормления", "очень аккуратный"],
      comment: "Игорь отлично знает амазонов, дал пару полезных советов по рациону.",
      date: "2024-12-20",
    },
    {
      fromName: "Ксения Л.",
      tags: ["ответственный", "птица вернулась здоровой"],
      comment: "Сразу написал, когда птица отказалась от корма. К счастью, всё обошлось.",
      date: "2024-10-18",
    },
  ],
  n11: [
    {
      fromName: "Артур С.",
      tags: ["птицы его обожают", "вовремя кормил"],
      comment: "Наталья просто чудо. Александрийский попугай у неё за 2 дня ел из руки.",
      date: "2025-03-22",
    },
    {
      fromName: "Вера Т.",
      tags: ["очень аккуратный", "отправлял фото каждый день"],
      comment: "Аккуратная и внимательная. Кошка её совершенно не мешала, держала отдельно.",
      date: "2025-02-04",
    },
    {
      fromName: "Илья К.",
      tags: ["знает особенности кормления"],
      comment: "Хорошо разбирается в крупных попугаях, чувствуется опыт.",
      date: "2024-11-30",
    },
  ],
  n12: [
    {
      fromName: "Анастасия Р.",
      tags: ["знает особенности кормления", "ответственный", "птицы его обожают"],
      comment: "Михаил — это уровень. 12 лет с птицами, и видно по каждой мелочи. Мой ара был в восторге.",
      date: "2025-04-10",
    },
    {
      fromName: "Григорий М.",
      tags: ["вовремя кормил", "очень аккуратный"],
      comment: "Спокойный, обстоятельный, никаких суеты. Лучший выбор для крупных попугаев.",
      date: "2025-02-25",
    },
    {
      fromName: "Полина Н.",
      tags: ["отправлял фото каждый день", "птица вернулась здоровой"],
      comment: "Несколько раз оставляла птицу — каждый раз идеально.",
      date: "2024-09-09",
    },
    {
      fromName: "Степан Ю.",
      tags: ["ответственный"],
      comment: "Доверяю как себе.",
      date: "2024-06-12",
    },
  ],
  n13: [
    {
      fromName: "Дарья П.",
      tags: ["вовремя кормил", "очень аккуратный"],
      comment: "Полина впервые присматривала за моими амадинами — справилась, видно желание учиться.",
      date: "2025-03-02",
    },
    {
      fromName: "Артём В.",
      tags: ["ответственный", "отправлял фото каждый день"],
      comment: "Молодая, но ответственная. Спрашивала по любой мелочи, что мне понравилось.",
      date: "2025-01-28",
    },
  ],
  n14: [
    {
      fromName: "Никита Б.",
      tags: ["знает особенности кормления", "птицы его обожают"],
      comment: "Евгений с какаду как с родными. Видно, что в теме много лет.",
      date: "2025-03-14",
    },
    {
      fromName: "Маргарита З.",
      tags: ["очень аккуратный", "вовремя кормил"],
      comment: "Аккуратность во всём — от чистоты клетки до точного времени кормления.",
      date: "2025-01-31",
    },
    {
      fromName: "Захар О.",
      tags: ["птица вернулась здоровой", "ответственный"],
      comment: "Корелла вернулась бодрой и спокойной. Собака Граф у Евгения совсем не пугала птицу.",
      date: "2024-11-17",
    },
  ],
  n15: [
    {
      fromName: "Тамара И.",
      tags: ["отправлял фото каждый день", "вовремя кормил"],
      comment: "Юлия отлично справилась с эклектусом. Каждый день фото и заметки о настроении.",
      date: "2025-02-26",
    },
    {
      fromName: "Виталий А.",
      tags: ["ответственный"],
      comment: "Без сюрпризов, всё как договаривались.",
      date: "2024-12-15",
    },
  ],
  n16: [
    {
      fromName: "Карина Ш.",
      tags: ["птицы его обожают", "очень аккуратный"],
      comment: "Артём очень спокойный, и моим какарики это сразу понравилось — они такие болтливые!",
      date: "2025-03-19",
    },
    {
      fromName: "Леонид Е.",
      tags: ["знает особенности кормления", "вовремя кормил"],
      comment: "Знает специфику маленьких попугаев. Отличный опыт.",
      date: "2025-02-01",
    },
    {
      fromName: "Фёдор Х.",
      tags: ["ответственный", "птица вернулась здоровой"],
      comment: "Брал на 10 дней — никаких проблем. Рекомендую.",
      date: "2024-10-22",
    },
  ],
  n17: [
    {
      fromName: "Мария Д.",
      tags: ["знает особенности кормления", "птицы его обожают", "ответственный"],
      comment: "Светлана — мой постоянный птичник. 11 лет опыта, держит жако и неразлучников вместе как никто.",
      date: "2025-04-07",
    },
    {
      fromName: "Иван Т.",
      tags: ["вовремя кормил", "очень аккуратный"],
      comment: "Идеально. Никаких претензий, только благодарность.",
      date: "2025-02-12",
    },
    {
      fromName: "Алёна Ц.",
      tags: ["отправлял фото каждый день"],
      comment: "Всегда на связи, фото с подписями — мелочь, а душу греет.",
      date: "2024-09-08",
    },
    {
      fromName: "Денис Ш.",
      tags: ["птица вернулась здоровой"],
      comment: "Жако вернулся в отличной форме, словно и не уезжал.",
      date: "2024-07-25",
    },
  ],
  n18: [
    {
      fromName: "Зинаида М.",
      tags: ["вовремя кормил", "ответственный"],
      comment: "Виктор недавно начал, но видно, что подходит к делу серьёзно. Голубь был под полным контролем.",
      date: "2025-02-19",
    },
    {
      fromName: "Олег П.",
      tags: ["очень аккуратный"],
      comment: "Спокойный человек, никаких лишних вопросов, всё чётко.",
      date: "2024-12-06",
    },
  ],
  n19: [
    {
      fromName: "Ярослава К.",
      tags: ["птицы его обожают", "отправлял фото каждый день"],
      comment: "Анна шикарно справляется с пиррурой. Видео с играми — каждый день. Кошка Пушок наблюдала издалека.",
      date: "2025-03-28",
    },
    {
      fromName: "Глеб А.",
      tags: ["знает особенности кормления", "очень аккуратный"],
      comment: "Грамотно подобрала корм на время моего отсутствия. Канарейка вернулась бодрая.",
      date: "2025-01-25",
    },
    {
      fromName: "Эмилия В.",
      tags: ["ответственный"],
      comment: "Чёткая, аккуратная, на связи 24/7.",
      date: "2024-10-09",
    },
  ],
  n20: [
    {
      fromName: "Борис Р.",
      tags: ["вовремя кормил", "очень аккуратный"],
      comment: "Кирилл недавно в сообществе, но видно желание расти. Птица была под присмотром.",
      date: "2025-03-04",
    },
    {
      fromName: "Светлана Е.",
      tags: ["ответственный", "птица вернулась здоровой"],
      comment: "Всё прошло без сюрпризов. Спасибо!",
      date: "2025-01-16",
    },
  ],
};

export default function NeighborProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { neighbors } = useApp();

  const neighbor = neighbors.find((n) => n.id === id);
  if (!neighbor) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground, textAlign: "center", marginTop: 80 }}>
          Птичник не найден
        </Text>
      </View>
    );
  }

  const userBirds = MOCK_USER_BIRDS[id] || [];
  const userReviews = MOCK_REVIEWS[id] || [];

  const openTelegram = () => {
    const url = `tg://resolve?domain=${neighbor.telegramId}`;
    Linking.canOpenURL(url).then((supported) => {
      Linking.openURL(supported ? url : `https://t.me/${neighbor.telegramId}`);
    });
  };

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: colors.headerBg, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Профиль</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Avatar name={neighbor.name} photoUrl={neighbor.photoUrl} size={80} />
          <Text style={[styles.name, { color: colors.foreground }]}>{neighbor.name}</Text>
          <View style={styles.row}>
            <Feather name="map-pin" size={14} color={colors.mutedForeground} />
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>{" "}{neighbor.district}</Text>
          </View>
          <View style={styles.row}>
            <Feather name="award" size={14} color={colors.mutedForeground} />
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              {" "}{neighbor.experienceYears} {neighbor.experienceYears === 1 ? "год" : neighbor.experienceYears < 5 ? "года" : "лет"} опыта
            </Text>
          </View>
          <RatingStars rating={neighbor.rating} size={15} />
          <HelpStatusBadge status={neighbor.helpStatus} />
          {neighbor.sitTypes && neighbor.sitTypes.length > 0 ? (
            <View style={styles.petsBadgeRow}>
              {neighbor.sitTypes.map((t) => (
                <View
                  key={t}
                  style={[styles.petBadge, { backgroundColor: colors.secondary }]}
                >
                  <Text style={[styles.petBadgeText, { color: colors.primary }]}>
                    {SIT_TYPE_SHORT[t]}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          {neighbor.otherPets && neighbor.otherPets.length > 0 ? (
            <View style={styles.petsBadgeRow}>
              {neighbor.otherPets.map((p, i) => (
                <View
                  key={i}
                  style={[styles.petBadge, { backgroundColor: colors.secondary }]}
                >
                  <Text style={[styles.petBadgeText, { color: colors.primary }]}>
                    {OTHER_PET_LABELS[p.type]}
                    {p.name ? ` · ${p.name}` : ""}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          <TouchableOpacity
            style={[styles.tgBtn, { backgroundColor: colors.primary }]}
            onPress={openTelegram}
            activeOpacity={0.8}
          >
            <Feather name="send" size={16} color="#fff" />
            <Text style={styles.tgBtnText}>Написать в Telegram</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Умеет</Text>
          {neighbor.capabilities && neighbor.capabilities.length > 0 ? (
            <View style={styles.capabilitiesRow}>
              {neighbor.capabilities.map((c) => (
                <View
                  key={c}
                  style={[styles.capabilityChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                >
                  <Text style={[styles.capabilityText, { color: colors.primary }]}>
                    {SITTER_CAPABILITY_LABELS[c]}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.capabilityHint, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="message-circle" size={14} color={colors.mutedForeground} />
              <Text style={[styles.capabilityHintText, { color: colors.mutedForeground }]}>
                {" "}Уточните при общении
              </Text>
            </View>
          )}
        </View>

        {userBirds.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Птицы</Text>
            {userBirds.map((bird, i) => (
              <View
                key={i}
                style={[styles.birdRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <BirdSpeciesIcon species={bird.species as BirdSpecies} size={32} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.birdName, { color: colors.foreground }]}>{bird.name}</Text>
                  <Text style={[styles.birdSpecies, { color: colors.mutedForeground }]}>
                    {SPECIES_LABELS[bird.species as keyof typeof SPECIES_LABELS] ?? bird.species}
                  </Text>
                  {bird.wasExamined ? (
                    <View style={styles.birdMetaRow}>
                      <Feather name="check-circle" size={11} color={colors.primary} />
                      <Text style={[styles.birdMeta, { color: colors.mutedForeground }]}>
                        {" "}Обследована
                        {bird.lastCheckupDate ? ` · ${bird.lastCheckupDate}` : ""}
                      </Text>
                    </View>
                  ) : null}
                  {bird.vetName ? (
                    <Text style={[styles.birdMeta, { color: colors.mutedForeground }]}>
                      {bird.vetName}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Отзывы ({userReviews.length})
          </Text>
          {userReviews.length === 0 ? (
            <View style={[styles.emptyReviews, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="message-circle" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyReviewsText, { color: colors.mutedForeground }]}>
                Пока нет отзывов
              </Text>
            </View>
          ) : (
            userReviews.map((review, i) => (
              <View
                key={i}
                style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewFrom, { color: colors.foreground }]}>
                    {review.fromName}
                  </Text>
                  <Text style={[styles.reviewDate, { color: colors.mutedForeground }]}>
                    {new Date(review.date).toLocaleDateString("ru-RU")}
                  </Text>
                </View>
                <View style={styles.tagRow}>
                  {review.tags.map((tag, j) => (
                    <View key={j} style={[styles.tag, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
                {review.comment ? (
                  <Text style={[styles.reviewComment, { color: colors.mutedForeground }]}>
                    {review.comment}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  backBtn: { padding: 4 },
  content: { padding: 16, gap: 20 },
  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  name: { fontSize: 22, fontFamily: "Inter_700Bold" },
  row: { flexDirection: "row", alignItems: "center" },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  tgBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  tgBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  birdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  birdName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  birdSpecies: { fontSize: 12, fontFamily: "Inter_400Regular" },
  birdMetaRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  birdMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  petsBadgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 4 },
  petBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  petBadgeText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  emptyReviews: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyReviewsText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  reviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewFrom: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  reviewDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  reviewComment: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  capabilitiesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  capabilityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  capabilityText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  capabilityHint: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  capabilityHintText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
