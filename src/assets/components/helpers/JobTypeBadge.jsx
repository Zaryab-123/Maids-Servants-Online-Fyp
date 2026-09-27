// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// export const jobTypeLabel = (jobType) => {
//   const value = (jobType ?? '').toString().trim().toLowerCase().replace(/[\s_]/g, '-');
//   return value.startsWith('part') ? 'Part-Time' : 'Full-Time';
// };

// export const isPartTime = (jobType) => jobTypeLabel(jobType) === 'Part-Time';

// const JobTypeBadge = ({ jobType, style, small = false }) => {
//   const part = isPartTime(jobType);
//   const iconSize = small ? 11 : 13;

//   return (
//     <View
//       style={[
//         styles.badge,
//         small && styles.badgeSmall,
//         part ? styles.partBadge : styles.fullBadge,
//         style,
//       ]}
//     >
//       <Icon
//         name={part ? 'clock-time-four-outline' : 'briefcase-outline'}
//         size={iconSize}
//         color={part ? '#B45309' : '#1E64D3'}
//       />
//       <Text style={[styles.text, small && styles.textSmall, part ? styles.partText : styles.fullText]}>
//         {part ? 'PART-TIME' : 'FULL-TIME'}
//       </Text>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   badge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     alignSelf: 'flex-start',
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 8,
//     gap: 4,
//   },
//   badgeSmall: { paddingHorizontal: 6, paddingVertical: 2 },
//   partBadge: { backgroundColor: '#FFF4E5', borderWidth: 1, borderColor: '#FCD9A4' },
//   fullBadge: { backgroundColor: '#E8F1FF', borderWidth: 1, borderColor: '#CBDEFB' },
//   text: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
//   textSmall: { fontSize: 9 },
//   partText: { color: '#B45309' },
//   fullText: { color: '#1E64D3' },
// });

// export default JobTypeBadge;

import React from 'react';

import Icon from '@/web/Icon';
import { StyleSheet, sx } from '@/web';


export const jobTypeLabel = (jobType) => {
  const value = (jobType ?? '').toString().trim().toLowerCase().replace(/[\s_]/g, '-');
  return value.startsWith('part') ? 'Part-Time' : 'Full-Time';
};

export const isPartTime = (jobType) => jobTypeLabel(jobType) === 'Part-Time';

const JobTypeBadge = ({ jobType, style, small = false }) => {
  const part = isPartTime(jobType);
  const iconSize = small ? 11 : 13;

  return (
    <div className="v"
      style={sx([
        styles.badge,
        small && styles.badgeSmall,
        part ? styles.partBadge : styles.fullBadge,
        style,
      ])}
    >
      <Icon
        name={part ? 'clock-time-four-outline' : 'briefcase-outline'}
        size={iconSize}
        color={part ? '#B45309' : '#1E64D3'}
      />
      <span className="t" style={sx([styles.text, small && styles.textSmall, part ? styles.partText : styles.fullText])}>
        {part ? 'PART-TIME' : 'FULL-TIME'}
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
  partBadge: { backgroundColor: '#FFF4E5', borderWidth: 1, borderColor: '#FCD9A4' },
  fullBadge: { backgroundColor: '#E8F1FF', borderWidth: 1, borderColor: '#CBDEFB' },
  text: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  textSmall: { fontSize: 9 },
  partText: { color: '#B45309' },
  fullText: { color: '#1E64D3' },
});

export default JobTypeBadge;