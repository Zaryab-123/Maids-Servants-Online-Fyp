import React, { useCallback, useState } from 'react';
import Icon from '@/web/Icon';
import { useFocusEffect } from '@/web/navigation';
import { confirmAction, courseApi, courseColors as C } from '../helpers/courseApi';
import NotificationHelper from '../Notification/NotificationHelper';
import { ListView, Spinner, StyleSheet, press, sx } from '@/web';

export default function CompanyCourseDetailScreen({ navigation, route }) {
  const [id] = useState(route.params.courseId);
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const load = useCallback(async () => {
    try {
      setLoadError(null);
      setData(await courseApi(`/api/company/courses/${id}`));
    } catch (e) {
      setLoadError(e.message);
      NotificationHelper.showError(e.message);
    }
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  const complete = (e) => confirmAction(
    'Mark as completed?',
    `${e.workerName} will be marked as having completed this course and a certificate will be issued. This cannot be undone.`,
    'Complete & certify',
    () => doComplete(e),
  );
  const doComplete = async (e) => {
    try {
      const x = await courseApi(`/api/company/enrollments/${e.enrollmentId}/complete`, {
        method: 'POST',
      });
      NotificationHelper.showSuccess(x.message);
      load();
    } catch (x) {
      NotificationHelper.showError(x.message);
    }
  };
  if (!data && loadError) {
    return (
      <div className="v screen" style={sx([s.page, { alignItems: 'center', justifyContent: 'center', padding: 24 }])}>
        <Icon name="alert-circle-outline" size={44} color={C.danger} />
        <span className="t" style={sx({ color: C.text, marginTop: 10, marginBottom: 14, textAlign: 'center' })}>{loadError}</span>
        <button className="v btn" type="button" style={sx({ backgroundColor: C.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18 })} onClick={press(load)}>
          <span className="t" style={sx({ color: C.white, fontWeight: '700' })}>Try again</span>
        </button>
      </div>
    );
  }
  if (!data) return <Spinner style={{ flex: 1 }} color={C.primary} />;
  const Row = ({ item }) => (
    <div className="v" style={sx(s.person)}>
      <div className="v" style={sx(s.avatar)}>
        <Icon name="account" size={22} color={C.primary} />
      </div>
      <div className="v" style={sx({ flex: 1 })}>
        <span className="t" style={sx(s.name)}>
          {item.workerName}
        </span>
        <span className="t" style={sx(s.muted)}>
          Enrolled {new Date(item.enrolledAtUtc).toLocaleDateString()}
        </span>
      </div>
      <div
        className="v"
        style={sx([s.badge, { backgroundColor: item.status === 'Completed' ? '#E7F7F0' : C.pale }])}
      >
        <span
          className="t"
          style={sx({
            color: item.status === 'Completed' ? C.success : C.primary,
            fontWeight: '700',
            fontSize: 11,
          })}
        >
          {item.status}
        </span>
      </div>
      {item.status === 'Enrolled' && (
        <button
          className="v btn"
          type="button"
          style={sx(s.done)}
          onClick={press(() => complete(item))}
        >
          <Icon name="check" size={18} color={C.white} />
        </button>
      )}
    </div>
  );
  return (
    <div className="v screen" style={sx(s.page)}>
      <div className="v" style={sx(s.header)}>
        <button className="v btn" type="button" onClick={press(() => navigation.goBack())}>
          <Icon name="arrow-left" size={24} color={C.white} />
        </button>
        <span className="t" style={sx(s.heading)}>
          Course Details
        </span>
          <button
            className="v btn"
            type="button"
            aria-label="Edit course"
            onClick={press(() => navigation.navigate('CompanyCourseFormScreen', { course: data }))}
          >
            <Icon name="pencil-outline" size={23} color={C.white} />
          </button>
      </div>
      <ListView
        data={data.enrollments}
        keyExtractor={(x) => String(x.enrollmentId)}
        renderItem={Row}
        contentContainerStyle={s.body}
        ListHeaderComponent={
          <div className="v">
            <div className="v" style={sx(s.hero)}>
              <span className="t" style={sx(s.title)}>
                {data.courseName}
              </span>
              <span className="t" style={sx(s.meta)}>
                {data.startDate} — {data.endDate}
              </span>
              <span className="t" style={sx(s.meta)}>
                {data.classTimings}
              </span>
              {data.description ? (
                <span className="t" style={sx(s.desc)}>
                  {data.description}
                </span>
              ) : null}
            </div>
            <span className="t" style={sx(s.section)}>
              Enrolled workers ({data.enrollments.length})
            </span>
          </div>
        }
        ListEmptyComponent={
          <span className="t" style={sx(s.empty)}>
            No workers have enrolled yet.
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
    justifyContent: 'space-between',
  },
  heading: { color: C.white, fontSize: 20, fontWeight: '800' },
  body: { padding: 16 },
  hero: {
    backgroundColor: C.white,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  title: { fontSize: 22, fontWeight: '900', color: C.text },
  meta: { color: C.primary, fontWeight: '600', marginTop: 7 },
  desc: { color: C.muted, lineHeight: 20, marginTop: 14 },
  section: { fontWeight: '800', fontSize: 16, color: C.text, marginVertical: 18 },
  person: {
    backgroundColor: C.white,
    padding: 13,
    borderRadius: 14,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.pale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontWeight: '800', color: C.text },
  muted: { color: C.muted, fontSize: 11, marginTop: 3 },
  badge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20 },
  done: { backgroundColor: C.success, padding: 7, borderRadius: 9 },
  empty: { textAlign: 'center', color: C.muted, padding: 30 },
});
