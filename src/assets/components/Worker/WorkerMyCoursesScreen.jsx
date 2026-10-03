import React, { useCallback, useState } from 'react';
import Icon from '@/web/Icon';
import { useFocusEffect } from '@/web/navigation';
import { confirmAction, courseApi, courseColors as C } from '../helpers/courseApi';
import NotificationHelper from '../Notification/NotificationHelper';
import { ListView, StyleSheet, press, sx } from '@/web';

export default function WorkerMyCoursesScreen({ navigation }) {
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState([]);
  const load = useCallback(async () => {
    try {
      setRows(await courseApi(`/api/worker/enrollments${status ? `?status=${status}` : ''}`));
    } catch (e) {
      NotificationHelper.showError(e.message);
    }
  }, [status]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  const [busyId, setBusyId] = useState(null);
  const withdraw = (id) => confirmAction(
    'Withdraw from course?',
    'You will be removed from this course and will not be able to enroll in it again.',
    'Withdraw',
    () => doWithdraw(id),
  );
  const doWithdraw = async (id) => {
    if (busyId) return;
    setBusyId(id);
    try {
      await courseApi(`/api/worker/enrollments/${id}/withdraw`, { method: 'POST' });
      NotificationHelper.showSuccess('Enrollment withdrawn.');
      load();
    } catch (e) {
      NotificationHelper.showError(e.message);
    } finally {
      setBusyId(null);
    }
  };
  const Card = ({ item }) => (
    <div className="v" style={sx(s.card)}>
      <div className="v" style={sx({ flexDirection: 'row', justifyContent: 'space-between' })}>
        <span className="t" style={sx(s.title)}>
          {item.courseName}
        </span>
        <span
          className="t"
          style={sx([s.badge, item.status === 'Completed' && { color: C.success }])}
        >
          {item.status}
        </span>
      </div>
      <span className="t" style={sx(s.company)}>
        {item.companyName}
      </span>
      <span className="t" style={sx(s.meta)}>
        {item.startDate} — {item.endDate} · {item.classTimings}
      </span>
      {item.certificateId ? (
        <button
          className="v btn"
          type="button"
          style={sx(s.primary)}
          onClick={press(() =>
            navigation.navigate('CourseCertificateScreen', { certificateId: item.certificateId }),
          )}
        >
          <Icon name="certificate-outline" size={19} color={C.white} />
          <span className="t" style={sx(s.primaryText)}>
            View certificate
          </span>
        </button>
      ) : item.status === 'Enrolled' ? (
        <button
          className="v btn"
          type="button"
          style={sx(s.withdraw)}
          onClick={press(() => withdraw(item.enrollmentId))}
        >
          <span className="t" style={sx({ color: C.danger, fontWeight: '700' })}>
            Withdraw
          </span>
        </button>
      ) : null}
    </div>
  );
  return (
    <div className="v screen" style={sx(s.page)}>
      <div className="v" style={sx(s.header)}>
        <button className="v btn" type="button" onClick={press(() => navigation.goBack())}>
          <Icon name="arrow-left" size={24} color={C.white} />
        </button>
        <span className="t" style={sx(s.heading)}>
          My Courses
        </span>
      </div>
      <div className="v" style={sx(s.tabs)}>
        {['', 'Enrolled', 'Completed', 'Withdrawn'].map((x) => (
          <button
            className="v btn"
            type="button"
            key={x || 'All'}
            style={sx([s.tab, status === x && s.tabOn])}
            onClick={press(() => setStatus(x))}
          >
            <span className="t" style={sx([s.tabText, status === x && { color: C.white }])}>
              {x || 'All'}
            </span>
          </button>
        ))}
      </div>
      <ListView
        data={rows}
        keyExtractor={(x) => String(x.enrollmentId)}
        renderItem={Card}
        contentContainerStyle={{ padding: 15 }}
        ListEmptyComponent={
          <span className="t" style={sx(s.empty)}>
            No courses in this section.
          </span>
        }
      />
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
  tabs: { padding: 12, flexDirection: 'row', gap: 6 },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: C.white,
  },
  tabOn: { backgroundColor: C.primary },
  tabText: { fontSize: 11, fontWeight: '700', color: C.muted },
  card: {
    backgroundColor: C.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 11,
  },
  title: { fontSize: 16, fontWeight: '800', color: C.text, flex: 1 },
  badge: { fontSize: 11, fontWeight: '800', color: C.primary },
  company: { color: C.primary, marginTop: 4 },
  meta: { color: C.muted, fontSize: 12, marginTop: 10 },
  primary: {
    backgroundColor: C.primary,
    padding: 11,
    borderRadius: 10,
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
  },
  primaryText: { color: C.white, fontWeight: '800' },
  withdraw: {
    borderWidth: 1,
    borderColor: '#F3C0C0',
    padding: 10,
    borderRadius: 10,
    marginTop: 14,
    alignItems: 'center',
  },
  empty: { textAlign: 'center', padding: 50, color: C.muted },
});
