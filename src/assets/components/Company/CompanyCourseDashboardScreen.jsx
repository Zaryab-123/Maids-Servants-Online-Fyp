import React, { useCallback, useState } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import { useFocusEffect } from '@/web/navigation';
import { SERVER_BASE } from '../../config';
import { confirmAction, courseApi, courseColors as C } from '../helpers/courseApi';
import NotificationHelper from '../Notification/NotificationHelper';
import { ListView, RESIZE, Spinner, StyleSheet, imgSrc, press, sx } from '@/web';


const resolveCompanyPicture = path => {
  if (!path || typeof path !== 'string') return null;
  const clean = path.trim().replace(/\\/g, '/');
  if (!clean) return null;
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  const relative = clean.startsWith('/')
    ? clean
    : clean.startsWith('Images/')
      ? `/${clean}`
      : `/Images/${clean}`;
  return `${SERVER_BASE}${relative}`;
};

export default function CompanyCourseDashboardScreen({ navigation }) {
  const [scope, setScope] = useState('active');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyPicture, setCompanyPicture] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);
  // Cache-buster computed once per load (not on every render, which made the avatar flicker).
  const [pictureVersion, setPictureVersion] = useState(Date.now());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [result, company] = await Promise.all([
        courseApi(`/api/company/courses?scope=${scope}`),
        courseApi('/api/company/dashboard'),
      ]);
      setItems(Array.isArray(result) ? result : []);
      const freshPicture = company?.picture || await AsyncStorage.getItem('userPicture');
      setCompanyPicture(freshPicture);
      if (freshPicture) await AsyncStorage.setItem('userPicture', freshPicture);
      setImageFailed(false);
      setPictureVersion(Date.now());
    } catch (error) {
      NotificationHelper.showError(error.message);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const removeCourse = (course) => confirmAction(
    'Delete course?',
    course.enrollmentCount > 0
      ? `"${course.courseName}" has enrollment history, so it will be archived.`
      : `"${course.courseName}" has no enrollments and will be permanently deleted.`,
    'Delete',
    () => doRemoveCourse(course.courseId),
  );

  const doRemoveCourse = async courseId => {
    try {
      const result = await courseApi(`/api/company/courses/${courseId}`, {
        method: 'DELETE',
      });
      NotificationHelper.showSuccess(result.message);
      load();
    } catch (error) {
      NotificationHelper.showError(error.message);
    }
  };

  const renderCourse = ({ item }) => (
    <div className="v btn" role="button" tabIndex={0}
      style={sx(styles.card)}
      onClick={press(() => navigation.navigate('CompanyCourseDetailScreen', {
        courseId: item.courseId,
      }))}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigation.navigate('CompanyCourseDetailScreen', { courseId: item.courseId }); } }}
    >
      <div className="v" style={sx(styles.courseRow)}>
        <div className="v" style={sx(styles.courseIcon)}>
          <Icon name="school-outline" size={24} color={C.primary} />
        </div>

        <div className="v" style={sx(styles.courseContent)}>
          <span className="t" style={sx(styles.courseTitle)}>{item.courseName}</span>
          <div className="v" style={sx(styles.metaRow)}>
            <Icon name="calendar-range" size={13} color={C.muted} />
            <span className="t" style={sx(styles.metaText)}>
              {item.startDate} — {item.endDate}
            </span>
          </div>
          <div className="v" style={sx(styles.metaRow)}>
            <Icon name="clock-outline" size={13} color={C.muted} />
            <span className="t" style={sx(styles.metaText)}>{item.classTimings}</span>
          </div>
        </div>

        <Icon name="chevron-right" size={24} color={C.muted} />
      </div>

      <div className="v" style={sx(styles.cardFooter)}>
        <span className="t" style={sx(styles.countText)}>
          {item.enrollmentCount} enrolled · {item.completedCount} completed
        </span>
        {!item.isDeleted && (
          <button className="v btn" type="button" aria-label="Delete course"
            style={sx(styles.deleteButton)}
            onClick={press(() => removeCourse(item))}
          >
            <Icon name="trash-can-outline" size={19} color={C.danger} />
          </button>
        )}
      </div>
    </div>
  );

  const renderEmpty = () => (
    <div className="v" style={sx(styles.emptyState)}>
      <Icon name="book-open-page-variant-outline" size={44} color={C.primary} />
      <span className="t" style={sx(styles.emptyTitle)}>No {scope} courses</span>
      <span className="t" style={sx(styles.emptyText)}>
        Create a professional training course to get started.
      </span>
    </div>
  );

  return (
    <div className="v screen" style={sx(styles.page)}>
      <div className="v" style={sx(styles.header)}>
        <button className="v btn" type="button" onClick={press(() => navigation.navigate('WorkerDirectoryScreen'))}>
          <Icon name="account-group-outline" size={25} color={C.white} />
        </button>

        <div className="v" style={sx(styles.headerCopy)}>
          <span className="t" style={sx(styles.heading)}>Course Management</span>
          <span className="t" style={sx(styles.headerSubtitle)}>Build skills. Certify achievement.</span>
        </div>

        <div className="v" style={sx(styles.headerActions)}>
          <button className="v btn" type="button"
            style={sx(styles.addButton)}
            onClick={press(() => navigation.navigate('CompanyCourseFormScreen'))}
          >
            <Icon name="plus" size={21} color={C.primary} />
          </button>
          <button className="v btn" type="button"
            style={sx(styles.headerAvatarButton)}
            onClick={press(() => navigation.navigate('CompanyDashboardScreen'))}
          >
            {companyPicture && !imageFailed ? (
              <img className="img" alt=""
                src={imgSrc({ uri: `${resolveCompanyPicture(companyPicture)}?v=${pictureVersion}` })}
                
                style={sx([styles.headerAvatar, { objectFit: RESIZE["cover"] }])}
                
                onError={event => {
                  console.warn('Course header picture failed:', `${resolveCompanyPicture(companyPicture)}?v=${pictureVersion}`, event.nativeEvent?.error);
                  setImageFailed(true);
                }}
              />
            ) : (
              <div className="v" style={sx([styles.headerAvatar, styles.headerAvatarFallback])}>
                <Icon name="domain" size={21} color={C.primary} />
              </div>
            )}
          </button>
        </div>
      </div>

      <div className="v" style={sx(styles.tabs)}>
        {['active', 'past', 'archived'].map(tab => (
          <button className="v btn" type="button"
            key={tab}
            style={sx([styles.tab, scope === tab && styles.activeTab])}
            onClick={press(() => setScope(tab))}
          >
            <span className="t" style={sx([styles.tabText, scope === tab && styles.activeTabText])}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner style={styles.loader} color={C.primary} />
      ) : (
        <ListView
          data={items}
          keyExtractor={item => String(item.courseId)}
          renderItem={renderCourse}
          contentContainerStyle={styles.list}
          ListEmptyComponent={renderEmpty}
        />
      )}
    </div>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.background },
  header: {
    backgroundColor: C.primary,
    paddingHorizontal: 18,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCopy: { flex: 1, marginLeft: 14 },
  heading: { color: C.white, fontSize: 21, fontWeight: '800' },
  headerSubtitle: { color: '#DCEBFF', fontSize: 12, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addButton: { backgroundColor: C.white, width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  headerAvatarButton: { borderWidth: 2, borderColor: C.white, borderRadius: 13 },
  headerAvatar: { width: 38, height: 38, borderRadius: 11, backgroundColor: C.white },
  headerAvatarFallback: { backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', padding: 14, gap: 8 },
  tab: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: C.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  activeTab: { backgroundColor: C.primary },
  tabText: { color: C.muted, fontWeight: '700' },
  activeTabText: { color: C.white },
  loader: { marginTop: 60 },
  list: { padding: 14, paddingBottom: 40, flexGrow: 1 },
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  courseRow: { flexDirection: 'row', alignItems: 'center' },
  courseIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.pale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  courseContent: { flex: 1 },
  courseTitle: { color: C.text, fontWeight: '800', fontSize: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  metaText: { color: C.muted, fontSize: 12, marginLeft: 5 },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 14,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countText: { color: C.primary, fontWeight: '700', fontSize: 12 },
  deleteButton: { padding: 4 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyTitle: { color: C.text, fontWeight: '800', fontSize: 16, marginTop: 10 },
  emptyText: { color: C.muted, fontSize: 12, marginTop: 6, textAlign: 'center' },
});
