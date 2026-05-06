import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
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

interface Article {
  id: string;
  title: string;
  body: string;
  readTime: string;
  speciesTags: string[];
  publishedAt: string;
}

const ARTICLES: Article[] = [
  {
    id: "1",
    title: "Как правильно кормить волнистого попугая",
    body: "Волнистые попугаи — одни из самых популярных домашних птиц. Их рацион должен включать зерновые смеси, свежие овощи и фрукты, а также специальные минеральные добавки...",
    readTime: "5 мин",
    speciesTags: ["parrot_budgie"],
    publishedAt: "2025-04-10",
  },
  {
    id: "2",
    title: "10 признаков что ваша птица заболела",
    body: "Птицы скрывают признаки болезни до последнего — это инстинкт выживания. Важно знать ранние симптомы: снижение активности, взъерошенные перья, изменение голоса, отказ от еды...",
    readTime: "7 мин",
    speciesTags: ["parrot_budgie", "canary", "parrot_corella", "other"],
    publishedAt: "2025-04-05",
  },
  {
    id: "3",
    title: "Как подготовить птицу к временной передаче",
    body: "Когда вы уезжаете в отпуск и оставляете птицу на присмотр, важно заранее подготовить подробную инструкцию по уходу. Включите в неё режим кормления, особенности характера птицы...",
    readTime: "4 мин",
    speciesTags: ["parrot_budgie", "canary", "parrot_corella", "pigeon"],
    publishedAt: "2025-03-28",
  },
  {
    id: "4",
    title: "Корелла: характер и особенности содержания",
    body: "Корелла — интеллектуальная птица с богатой эмоциональной жизнью. Она привязывается к хозяину и нуждается в общении. Узнайте как обеспечить ей счастливую жизнь в домашних условиях...",
    readTime: "6 мин",
    speciesTags: ["parrot_corella"],
    publishedAt: "2025-03-20",
  },
  {
    id: "5",
    title: "Как найти хорошего птичника для вашей канарейки",
    body: "Канарейки требуют особого внимания: они чувствительны к шуму, стрессу и изменениям режима. Вот что нужно учитывать при выборе того, кто присмотрит за вашей птицей...",
    readTime: "3 мин",
    speciesTags: ["canary"],
    publishedAt: "2025-03-15",
  },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: colors.headerBg, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Гайды
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.featuredCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.featuredLabel}>Популярное</Text>
          <Text style={styles.featuredTitle}>
            Как подготовить птицу к временной передаче
          </Text>
          <View style={styles.featuredFooter}>
            <Feather name="clock" size={12} color="rgba(255,255,255,0.8)" />
            <Text style={styles.featuredTime}> 4 мин чтения</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Все статьи
        </Text>

        {ARTICLES.map((article) => (
          <TouchableOpacity
            key={article.id}
            style={[styles.articleCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push(`/article/${article.id}`)}
          >
            <View style={styles.articleHeader}>
              <View style={styles.speciesTags}>
                {article.speciesTags.slice(0, 3).map((s, i) => (
                  <BirdSpeciesIcon key={i} species={s as BirdSpecies} size={20} />
                ))}
              </View>
              <View style={styles.readTimeBadge}>
                <Feather name="clock" size={11} color={colors.mutedForeground} />
                <Text style={[styles.readTimeText, { color: colors.mutedForeground }]}>
                  {" "}{article.readTime}
                </Text>
              </View>
            </View>
            <Text style={[styles.articleTitle, { color: colors.foreground }]}>
              {article.title}
            </Text>
            <Text style={[styles.articleBody, { color: colors.mutedForeground }]} numberOfLines={2}>
              {article.body}
            </Text>
            <Text style={[styles.articleDate, { color: colors.mutedForeground }]}>
              {formatDate(article.publishedAt)}
            </Text>
          </TouchableOpacity>
        ))}
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  content: { padding: 16, gap: 12 },
  featuredCard: {
    borderRadius: 18,
    padding: 20,
    gap: 8,
    marginBottom: 4,
  },
  featuredLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  featuredTitle: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    lineHeight: 26,
  },
  featuredFooter: { flexDirection: "row", alignItems: "center" },
  featuredTime: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontFamily: "Inter_400Regular" },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
    marginBottom: 4,
  },
  articleCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  articleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  speciesTags: { flexDirection: "row", gap: 4 },
  readTimeBadge: { flexDirection: "row", alignItems: "center" },
  readTimeText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  articleTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 22,
  },
  articleBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  articleDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
