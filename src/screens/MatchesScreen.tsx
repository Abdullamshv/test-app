import { StyleSheet, Text, View } from 'react-native';
import { FavoriteButton } from '../components/FavoriteButton';
import { useFavorites } from '../hooks/useFavorites';

// Экран «Матчи тура» — задание в README.md, часть 1.
// Временная заглушка: две звёздочки для проверки useFavorites. Заменится настоящим экраном.
const DEMO_IDS = ['a', 'b'];

export function MatchesScreen() {
  const { isFavorite, toggle } = useFavorites();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Матчи тура</Text>
      {DEMO_IDS.map((id) => (
        <View key={id} style={styles.row}>
          <Text>Матч {id}</Text>
          <FavoriteButton active={isFavorite(id)} onPress={() => toggle(id)} />
        </View>
      ))}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
});
