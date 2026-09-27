import React from 'react';

import Icon from '@/web/Icon';
import { StyleSheet, sx } from '@/web';


const ResidenceBadge = ({ isResidenceProvided, style, small = false }) => {
  const provided = !!isResidenceProvided;
  const iconSize = small ? 11 : 13;

  return (
    <div className="v"
      style={sx([
        styles.badge,
        small && styles.badgeSmall,
        provided ? styles.providedBadge : styles.notProvidedBadge,
        style,
      ])}
    >
      <Icon
        name={provided ? 'home-check' : 'home-remove-outline'}
        size={iconSize}
        color={provided ? '#16A34A' : '#6B7280'}
      />
      <span className="t" style={sx([styles.text, small && styles.textSmall, provided ? styles.providedText : styles.notProvidedText])}>
        {provided ? 'RESIDENCE: YES' : 'RESIDENCE: NO'}
      </span>
    </div>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  badgeSmall: { paddingHorizontal: 6, paddingVertical: 2 },
  providedBadge: { backgroundColor: '#E6F4EA', borderWidth: 1, borderColor: '#BBF7D0' },
  notProvidedBadge: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  text: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  textSmall: { fontSize: 9 },
  providedText: { color: '#16A34A' },
  notProvidedText: { color: '#6B7280' },
});

export default ResidenceBadge;
