import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BirdSpecies } from "@/context/AppContext";
import { BirdSpeciesIcon } from "@/components/BirdSpeciesIcon";
import { useColors } from "@/hooks/useColors";

const ARTICLES: Record<string, { title: string; body: string; readTime: string; speciesTags: string[] }> = {
  "1": {
    title: "Как правильно кормить волнистого попугая",
    readTime: "5 мин",
    speciesTags: ["parrot_budgie"],
    body: `Волнистые попугаи — одни из самых популярных домашних птиц. Их рацион должен включать зерновые смеси, свежие овощи и фрукты, а также специальные минеральные добавки.

Основа рациона — зерновые смеси. Выбирайте качественный корм без добавок, пестицидов и красителей. Хорошая смесь должна включать: просо, канареечное семя, овёс, кукурузу.

Овощи и зелень — важная часть рациона. Волнистые попугаи с удовольствием едят: морковь, брокколи, шпинат, огурец, болгарский перец.

Фрукты давайте в небольших количествах: яблоко, груша, банан.

Запрещённые продукты: авокадо, шоколад, лук, чеснок, алкоголь, кофе.

Воду меняйте ежедневно. Птица должна иметь постоянный доступ к свежей воде.`,
  },
  "2": {
    title: "10 признаков что ваша птица заболела",
    readTime: "7 мин",
    speciesTags: ["parrot_budgie", "canary", "parrot_corella", "other"],
    body: `Птицы скрывают признаки болезни до последнего — это инстинкт выживания. Важно знать ранние симптомы.

1. Снижение активности. Здоровая птица подвижна и любопытна. Вялость — первый тревожный сигнал.

2. Взъерошенные перья. Птица сидит нахохлившись — она мёрзнет или плохо себя чувствует.

3. Изменение голоса. Хрипы, кашель или полное отсутствие пения — повод для беспокойства.

4. Отказ от еды. Если птица не ест более 24 часов — немедленно к ветеринару.

5. Изменение помёта. Жидкий помёт, изменение цвета или запаха.

6. Выделения из носа или клюва.

7. Закрытые глаза в дневное время.

8. Нарушение равновесия, падения с жёрдочки.

9. Рвота или срыгивание.

10. Изменение дыхания — учащённое, затруднённое.

При обнаружении этих признаков немедленно обратитесь к ветеринару, специализирующемуся на птицах.`,
  },
  "3": {
    title: "Как подготовить птицу к временной передаче",
    readTime: "4 мин",
    speciesTags: ["parrot_budgie", "canary", "parrot_corella", "pigeon"],
    body: `Когда вы уезжаете в отпуск и оставляете птицу на присмотр, важно заранее подготовить подробную инструкцию по уходу.

Что включить в карточку ухода:
• Режим кормления — что, сколько и когда
• Список запрещённых продуктов
• Привычки и особенности характера
• Болезни и текущие лекарства
• Как птица реагирует на незнакомых людей
• Контакт ветеринара

Подготовьте запас корма на всё время отсутствия плюс запас на случай задержки.

Познакомьте птицу с ситтером заранее. Дайте птице привыкнуть к новому человеку в вашем присутствии.

Оставьте клетку в привычном месте или убедитесь, что у ситтера подходящие условия.

Попросите ситтера присылать вам фото и видео — так вы будете спокойны, а он будет более внимателен.`,
  },
  "4": {
    title: "Корелла: характер и особенности содержания",
    readTime: "6 мин",
    speciesTags: ["parrot_corella"],
    body: `Корелла — интеллектуальная птица с богатой эмоциональной жизнью. Она привязывается к хозяину и нуждается в общении.

Характер кореллы:
Кореллы социальны и нуждаются в ежедневном общении. Они могут подражать звукам, освоить несколько слов, научиться трюкам.

Содержание:
• Клетка должна быть большой — минимум 60×40×50 см
• Несколько жёрдочек разного диаметра
• Игрушки для умственной стимуляции
• Гнездовой домик (необязательно, но им нравится)

Питание кореллы:
• Зерновая смесь 60%
• Свежие овощи и фрукты 30%
• Белковая пища (варёное яйцо) 10%

Когда передаёте кореллу ситтеру:
• Предупредите об её хохолке — это индикатор настроения
• Поднятый хохолок — интерес или возбуждение
• Прижатый хохолок — злость или страх
• Расправленные крылья — угроза

Кореллы болезненно реагируют на одиночество, поэтому ситтер должен уделять им внимание.`,
  },
  "5": {
    title: "Как найти хорошего птичника для вашей канарейки",
    readTime: "3 мин",
    speciesTags: ["canary"],
    body: `Канарейки требуют особого внимания: они чувствительны к шуму, стрессу и изменениям режима.

На что обратить внимание при выборе ситтера:
• Опыт с канарейками или певчими птицами
• Тихая обстановка (канарейки не переносят громких звуков)
• Стабильная температура в помещении (18-25°C)
• Умение не беспокоить птицу лишний раз

Что рассказать ситтеру:
• Канарейки пугливы — резкие движения под запретом
• Поют только самцы, молчащая птица — повод насторожиться
• Прямой солнечный свет противопоказан
• Сквозняки смертельно опасны

Красные флажки при выборе ситтера:
• Незнакомец с большими собаками или кошками
• Маленькие дети без присмотра
• Курящий человек (табачный дым вреден)
• Кухня с тефлоновой посудой (пары разрушают дыхательную систему)

Используйте рейтинг и отзывы в Пернатых соседях, чтобы выбрать проверенного птичника.`,
  },
};

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const article = ARTICLES[id ?? ""];

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  if (!article) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground, textAlign: "center", marginTop: 80 }}>
          Статья не найдена
        </Text>
      </View>
    );
  }

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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Статья</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.speciesTags}>
          {article.speciesTags.slice(0, 4).map((s, i) => (
            <BirdSpeciesIcon key={i} species={s as BirdSpecies} size={26} />
          ))}
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>{article.title}</Text>
        <View style={styles.metaRow}>
          <Feather name="clock" size={13} color={colors.mutedForeground} />
          <Text style={[styles.readTime, { color: colors.mutedForeground }]}>
            {" "}{article.readTime} чтения
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.body, { color: colors.foreground }]}>{article.body}</Text>
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
  content: { padding: 20, gap: 14 },
  speciesTags: { flexDirection: "row", gap: 8 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 32 },
  metaRow: { flexDirection: "row", alignItems: "center" },
  readTime: { fontSize: 13, fontFamily: "Inter_400Regular" },
  divider: { height: 1 },
  body: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 26 },
});
