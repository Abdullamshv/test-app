import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MatchCard } from '../components/MatchCard';
import { UpdatedAgo } from '../components/UpdatedAgo';
import { useFavorites } from '../hooks/useFavorites';
import { useMatches } from '../hooks/useMatches';

type MessageProps = {
  text: string;
  details?: string | null;
  actionLabel?: string;
  onAction?: () => void;
};

// Сообщение по центру: ошибка или пустой список, опционально с кнопкой.
function Message({ text, details, actionLabel, onAction }: MessageProps) {
  return (
    <View style={styles.center}>
      <Text style={styles.messageText}>{text}</Text>
      {details ? <Text style={styles.messageDetails}>{details}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" style={styles.button}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// Экран «Матчи тура» — задание в README.md, часть 1.
export function MatchesScreen() {
  const { status, matches, round, updatedAt, error, refresh } = useMatches();
  const { favorites, isFavorite, toggle } = useFavorites();

  const title = round !== null ? `Матчи тура · ${round}-й тур` : 'Матчи тура';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {status === 'loading' ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : null}

      {status === 'error' ? (
        <Message
          text="Не удалось загрузить матчи"
          details={error}
          actionLabel="Повторить"
          onAction={refresh}
        />
      ) : null}

      {status === 'success' ? (
        <>
          <View style={styles.toolbar}>
            {updatedAt ? <UpdatedAgo since={updatedAt} /> : <View />}
            <Pressable onPress={refresh} accessibilityRole="button">
              <Text style={styles.refresh}>Обновить</Text>
            </Pressable>
          </View>
          <FlatList
            data={matches}
            keyExtractor={(match) => match.id}
            // FlatList — PureComponent: без extraData он не перерисует карточки при смене избранного.
            extraData={favorites}
            renderItem={({ item }) => (
              <MatchCard
                match={item}
                isFavorite={isFavorite(item.id)}
                onToggleFavorite={toggle}
              />
            )}
            ListEmptyComponent={<Message text="Матчей в туре нет" />}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  messageText: {
    fontSize: 16,
    textAlign: 'center',
  },
  messageDetails: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  refresh: {
    fontSize: 14,
    color: '#2563eb',
  },
});
