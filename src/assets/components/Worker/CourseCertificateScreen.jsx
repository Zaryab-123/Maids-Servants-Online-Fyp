import React, { useEffect, useState } from 'react';
import Icon from '@/web/Icon';
import { courseApi, courseColors as C } from '../helpers/courseApi';
import NotificationHelper from '../Notification/NotificationHelper';
import { Spinner, StyleSheet, press, sx } from '@/web';

export default function CourseCertificateScreen({ navigation, route }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    courseApi(`/api/course-certificates/${route.params.certificateId}`)
      .then(setD)
      .catch((e) => { setErr(e.message); NotificationHelper.showError(e.message); });
  }, [route.params.certificateId]);
  if (!d && err) {
    return (
      <div className="v screen" style={sx([s.page, { alignItems: 'center', justifyContent: 'center', padding: 24 }])}>
        <Icon name="alert-circle-outline" size={44} color={C.danger} />
        <span className="t" style={sx({ color: C.text, marginTop: 10, marginBottom: 14, textAlign: 'center' })}>{err}</span>
        <button className="v btn" type="button" style={sx({ backgroundColor: C.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18 })} onClick={press(() => navigation.goBack())}>
          <span className="t" style={sx({ color: C.white, fontWeight: '700' })}>Go back</span>
        </button>
      </div>
    );
  }
  if (!d) return <Spinner style={{ flex: 1 }} color={C.primary} />;
  return (
    <div className="v screen" style={sx(s.page)}>
      <div className="v" style={sx(s.header)}>
        <button className="v btn" type="button" onClick={press(() => navigation.goBack())}>
          <Icon name="arrow-left" size={24} color={C.white} />
        </button>
        <span className="t" style={sx(s.heading)}>
          Digital Certificate
        </span>
      </div>
      <div className="v" style={sx(s.wrap)}>
        <div className="v" style={sx(s.cert)}>
          <div className="v" style={sx(s.seal)}>
            <Icon name="certificate" size={45} color={C.primary} />
          </div>
          <span className="t" style={sx(s.kicker)}>
            CERTIFICATE OF COMPLETION
          </span>
          <span className="t" style={sx(s.small)}>
            This certificate is proudly presented to
          </span>
          <span className="t" style={sx(s.person)}>
            {d.workerName}
          </span>
          <span className="t" style={sx(s.small)}>
            for successfully completing
          </span>
          <span className="t" style={sx(s.course)}>
            {d.courseName}
          </span>
          <span className="t" style={sx(s.company)}>
            Issued by {d.companyName}
          </span>
          <div className="v" style={sx(s.line)} />
          <span className="t" style={sx(s.code)}>
            {d.certificateCode}
          </span>
          <span className="t" style={sx(s.date)}>
            Issued {new Date(d.issuedDateUtc).toLocaleDateString()}
          </span>
          <div
            className="v"
            style={sx([s.valid, d.isValid ? null : { backgroundColor: '#FDECEC' }])}
          >
            <Icon
              name={d.isValid ? 'check-decagram' : 'alert-circle'}
              size={18}
              color={d.isValid ? C.success : C.danger}
            />
            <span
              className="t"
              style={sx({ color: d.isValid ? C.success : C.danger, fontWeight: '800' })}
            >
              {d.isValid ? 'Verified certificate' : 'Certificate revoked'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.background },
  header: {
    backgroundColor: C.primary,
    padding: 20,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  heading: { color: C.white, fontWeight: '800', fontSize: 20 },
  wrap: { flex: 1, padding: 20, justifyContent: 'center' },
  cert: {
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 27,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.primary,
  },
  seal: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.pale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: { color: C.primary, fontWeight: '900', letterSpacing: 1.4, marginTop: 18 },
  small: { color: C.muted, marginTop: 18 },
  person: { fontSize: 27, fontWeight: '900', color: C.text, marginTop: 8, textAlign: 'center' },
  course: { fontSize: 21, fontWeight: '800', color: C.primary, marginTop: 8, textAlign: 'center' },
  company: { fontWeight: '700', color: C.text, marginTop: 20 },
  line: { height: 1, backgroundColor: C.border, width: '100%', marginVertical: 20 },
  code: { fontFamily: 'monospace', color: C.dark, fontWeight: '800' },
  date: { color: C.muted, fontSize: 12, marginTop: 8 },
  valid: {
    marginTop: 20,
    backgroundColor: '#E7F7F0',
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
  },
});
