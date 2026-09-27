import React from 'react';

import Icon from '@/web/Icon';
import { StyleSheet, sx } from '@/web';


const toHHMM = (value) => {
    if (!value || typeof value !== 'string') return null;
    const match = value.match(/(\d{2}):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : null;
};

const SlotTimeLabel = ({ startTime, endTime, small, style }) => {
    const start = toHHMM(startTime);
    const end = toHHMM(endTime);
    if (!start || !end) return null;

    return (
        <div className="v" style={sx([styles.row, small && styles.rowSmall, style])}>
            <Icon name="clock-check-outline" size={small ? 11 : 13} color="#0F766E" />
            <span className="t" style={sx([styles.text, small && styles.textSmall])}>{start} – {end}</span>
        </div>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        marginTop: 4,
    },
    rowSmall: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginTop: 2,
    },
    text: {
        color: '#0F766E',
        fontWeight: '800',
        fontSize: 11,
        marginLeft: 4,
    },
    textSmall: {
        fontSize: 10,
    },
});

export default SlotTimeLabel;
