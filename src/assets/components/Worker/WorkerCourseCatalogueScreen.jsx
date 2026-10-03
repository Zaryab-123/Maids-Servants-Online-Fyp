import React, { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '@/web/Icon';
import { useFocusEffect } from '@/web/navigation';
import { courseApi, courseColors as C } from '../helpers/courseApi';
import NotificationHelper from '../Notification/NotificationHelper';
import { ListView, Spinner, StyleSheet, changeText, press, sx } from '@/web';

export default function WorkerCourseCatalogueScreen({ navigation }) {
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);
  const requestSeq = useRef(0);
  // Search ~400 ms after the user stops typing instead of on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);
  const load = useCallback(async () => {
    const seq = ++requestSeq.current;
    try {
      setLoading(true);
      const result = await courseApi(`/api/worker/courses?search=${encodeURIComponent(query)}`);
      if (seq === requestSeq.current) setRows(Array.isArray(result) ? result : []);
    } catch (e) {
      if (seq === requestSeq.current) NotificationHelper.showError(e.message);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [query]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  const enroll = async (id) => {
    if (enrollingId) return;
    setEnrollingId(id);
    try {
      const x = await courseApi(`/api/worker/courses/${id}/enroll`, { method: 'POST' });
      NotificationHelper.showSuccess(x.message);
      load();
    } catch (e) {
      NotificationHelper.showError(e.message);
    } finally {
      setEnrollingId(null);
    }
  };
  const Card = ({ item }) => (
    <div className="v" style={sx(s.card)}>
      <div className="v" style={sx(s.top)}>
        <div className="v" style={sx(s.icon)}>
          <Icon name="school" size={24} color={C.primary} />
        </div>
        <div className="v" style={sx({ flex: 1 })}>
          <span className="t" style={sx(s.title)}>
            {item.courseName}
          </span>
          <span className="t" style={sx(s.company)}>
            {item.companyName}
          </span>
        </div>
        {item.enrollmentStatus && (
          <span className="t" style={sx(s.badge)}>
            {item.enrollmentStatus}
          </span>
        )}
      </div>
      <span className="t" style={sx(s.meta)}>
        <Icon name="calendar" /> {item.startDate} — {item.endDate}
      </span>
      <span className="t" style={sx(s.meta)}>
        <Icon name="clock-outline" /> {item.classTimings}
      </span>
      {item.description ? (
        <span className="t" style={sx(s.desc, 2)}>
          {item.description}
        </span>
      ) : null}
      <button
        className="v btn"
        type="button"
        disabled={!!item.enrollmentStatus || enrollingId === item.courseId}
        style={sx([s.button, item.enrollmentStatus && s.disabled])}
        onClick={press(() => enroll(item.courseId))}
      >
        <span className="t" style={sx(s.buttonText)}>
          {item.enrollmentStatus === 'Withdrawn'
            ? 'Withdrawn'
            : item.enrollmentStatus === 'Completed'
              ? 'Completed'
              : item.enrollmentStatus
                ? 'Already enrolled'
                : enrollingId === item.courseId
                  ? 'Enrolling…'
                  : 'Enroll now'}
        </span>
      </button>
    </div>
  );
  return (
    <div className="v screen" style={sx(s.page)}>
      <div className="v" style={sx(s.header)}>
        <button className="v btn" type="button" onClick={press(() => navigation.goBack())}>
          <Icon name="arrow-left" size={24} color={C.white} />
        </button>
        <div className="v" style={sx({ flex: 1 })}>
          <span className="t" style={sx(s.heading)}>
            Training Courses
          </span>
          <span className="t" style={sx(s.sub)}>
            Learn from verified companies
          </span>
        </div>
        <button
          className="v btn"
          type="button"
          onClick={press(() => navigation.navigate('WorkerMyCoursesScreen'))}
        >
          <Icon name="book-check-outline" size={25} color={C.white} />
        </button>
      </div>
      <div className="v" style={sx(s.search)}>
        <Icon name="magnify" size={21} color={C.muted} />
        <input
          className="input"
          style={sx({ flex: 1, color: C.text })}
          placeholder="Search courses"
          value={q ?? ''}
          onChange={changeText(setQ)}
        />
      </div>
      {loading ? (
        <Spinner style={{ marginTop: 50 }} color={C.primary} />
      ) : (
        <ListView
          data={rows}
          keyExtractor={(x) => String(x.courseId)}
          renderItem={Card}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={
            <span className="t" style={sx(s.empty)}>
              No active courses found.
            </span>
          }
        />
      )}
    </div>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.background },
  header: {
    backgroundColor: C.primary,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heading: { color: C.white, fontSize: 20, fontWeight: '800' },
  sub: { color: '#DCEBFF', fontSize: 12 },
  search: {
    margin: 15,
    marginBottom: 0,
    backgroundColor: C.white,
    borderRadius: 13,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  card: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 17,
    padding: 16,
    marginBottom: 12,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: C.pale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '800', color: C.text },
  company: { fontSize: 12, color: C.primary, marginTop: 3 },
  badge: { color: C.success, fontWeight: '700', fontSize: 11 },
  meta: { color: C.muted, marginTop: 11 },
  desc: { color: C.text, lineHeight: 19, marginTop: 11 },
  button: {
    backgroundColor: C.primary,
    borderRadius: 11,
    padding: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  disabled: { backgroundColor: '#94A3B8' },
  buttonText: { color: C.white, fontWeight: '800' },
  empty: { textAlign: 'center', color: C.muted, padding: 50 },
});
