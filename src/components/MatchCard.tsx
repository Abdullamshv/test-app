import { StyleSheet, Text, View } from 'react-native';
import type { Match } from '../types';
import { formatKickoff } from '../utils/formatKickoff';
import { statusLabel } from '../utils/matchStatus';
import { FavoriteButton } from './FavoriteButton';

type Props = {
  match: Match;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
};

type TeamRowProps = {
  name: string;
  // null — счёта нет. Ноль — это настоящий счёт, его нужно показать.
  score: number | null;
};

function TeamRow({ name, score }: TeamRowProps) {
  return (
    <View style={styles.teamRow}>
      <Text style={styles.teamName} numberOfLines={2}>
        {name}
      </Text>
      <Text style={styles.score}>{score === null ? '—' : String(score)}</Text>
    </View>
  );
}

export function MatchCard({ match, isFavorite, onToggleFavorite }: Props) {
  const { home, away, score } = match;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.status, match.status === 'live' && styles.statusLive]}>
            {statusLabel(match)}
          </Text>
          <Text style={styles.kickoff}>{formatKickoff(match.startsAt)}</Text>
        </View>
        <FavoriteButton active={isFavorite} onPress={() => onToggleFavorite(match.id)} />
      </View>
      <TeamRow name={home.name} score={score === null ? null : score.home} />
      <TeamRow name={away.name} score={score === null ? null : score.away} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
    marginRight: 8,
  },
  status: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  statusLive: {
    color: '#ef3124',
  },
  kickoff: {
    marginTop: 2,
    fontSize: 13,
    color: '#6b7280',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  teamName: {
    flex: 1,
    marginRight: 8,
    fontSize: 16,
  },
  score: {
    minWidth: 20,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
});
