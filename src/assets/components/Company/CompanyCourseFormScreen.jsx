import React, { useMemo, useState } from 'react';

import DateTimePicker from '@/web/DateTimePicker';
import Icon from '@/web/Icon';
import { courseApi, courseColors as C } from '../helpers/courseApi';
import NotificationHelper from '../Notification/NotificationHelper';
import { Platform, StyleSheet, Toggle, changeText, press, sx } from '@/web';


const toLocalDate = value => {
  if (!value) return new Date();
  const parts = String(value).split('-').map(Number);
  return parts.length === 3
    ? new Date(parts[0], parts[1] - 1, parts[2])
    : new Date(value);
};

const toApiDate = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = date => date.toLocaleDateString(undefined, {
  day: '2-digit', month: 'short', year: 'numeric',
});

const formatTime = date => date.toLocaleTimeString(undefined, {
  hour: '2-digit', minute: '2-digit', hour12: true,
});

// Parses one side of a saved "hh:mm AM - hh:mm PM" value back into a Date.
const parseTimePart = (text, fallbackHour) => {
  const m = String(text || '').trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/);
  if (!m) return buildTime(fallbackHour, 0);
  let hour = Number(m[1]) % 12;
  if (!m[3]) hour = Number(m[1]);
  else if (m[3].toUpperCase() === 'PM') hour += 12;
  return buildTime(hour, Number(m[2]));
};

const splitTimings = (value) => {
  const parts = String(value || '').split(/\s+[-–—]\s+/);
  return [parseTimePart(parts[0], 9), parseTimePart(parts[1], 17)];
};

const buildTime = (hour, minute) => {
  const value = new Date();
  value.setHours(hour, minute, 0, 0);
  return value;
};

function TextArea({ label, value, onChangeText, placeholder }) {
  return (
    <div className="v" style={sx(styles.fieldGroup)}>
      <span className="t" style={sx(styles.label)}>{label}</span>
      <textarea className="input"
        style={{ ...sx([styles.input, styles.textArea]), '--ph': "#94A3B8" }}
        value={(value) ?? ''}
        onChange={changeText(onChangeText)}
        placeholder={placeholder}
        
        
      />
    </div>
  );
}

export default function CompanyCourseFormScreen({ navigation, route }) {
  const old = route.params?.course;
  const [courseName, setCourseName] = useState(old?.courseName || '');
  const [startDate, setStartDate] = useState(toLocalDate(old?.startDate));
  const [endDate, setEndDate] = useState(toLocalDate(old?.endDate));
  const [initialStart, initialEnd] = old?.classTimings ? splitTimings(old.classTimings) : [buildTime(9, 0), buildTime(17, 0)];
  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(initialEnd);
  const [description, setDescription] = useState(old?.description || '');
  const [syllabus, setSyllabus] = useState(old?.syllabus || '');
  const [isPublished, setIsPublished] = useState(old?.isPublished ?? true);
  const [picker, setPicker] = useState(null);
  const [saving, setSaving] = useState(false);

  const classTimings = useMemo(
    () => `${formatTime(startTime)} - ${formatTime(endTime)}`,
    [startTime, endTime],
  );

  const pickerValue = picker === 'startDate' ? startDate
    : picker === 'endDate' ? endDate
      : picker === 'startTime' ? startTime : endTime;
  const pickerMode = picker?.includes('Time') ? 'time' : 'date';

  const onPickerChange = (event, selected) => {
    if (Platform.OS === 'android') setPicker(null);
    if (event.type === 'dismissed' || !selected) return;
    if (picker === 'startDate') {
      setStartDate(selected);
      if (selected > endDate) setEndDate(selected);
    } else if (picker === 'endDate') setEndDate(selected);
    else if (picker === 'startTime') setStartTime(selected);
    else if (picker === 'endTime') setEndTime(selected);
  };

  const save = async () => {
    if (!courseName.trim()) {
      NotificationHelper.showError('Course name is required.');
      return;
    }
    if (endDate < startDate) {
      NotificationHelper.showError('End date cannot be before start date.');
      return;
    }
    if (endTime <= startTime) {
      NotificationHelper.showError('Class end time must be after start time.');
      return;
    }

    const body = {
      courseName: courseName.trim(),
      startDate: toApiDate(startDate),
      endDate: toApiDate(endDate),
      classTimings,
      description: description.trim() || null,
      syllabus: syllabus.trim() || null,
      isPublished,
    };

    try {
      setSaving(true);
      await courseApi(
        old ? `/api/company/courses/${old.courseId}` : '/api/company/courses',
        { method: old ? 'PUT' : 'POST', body: JSON.stringify(body) },
      );
      NotificationHelper.showSuccess(old ? 'Course updated.' : 'Course created.');
      navigation.goBack();
    } catch (error) {
      NotificationHelper.showError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const PickerButton = ({ icon, label, value, type }) => (
    <div className="v" style={sx(styles.pickerGroup)}>
      <span className="t" style={sx(styles.label)}>{label}</span>
      <button className="v btn" type="button" style={sx(styles.pickerButton)} onClick={press(() => setPicker(type))}>
        <Icon name={icon} size={21} color={C.primary} />
        <span className="t" style={sx(styles.pickerValue)}>{value}</span>
        <Icon name="chevron-down" size={19} color={C.muted} />
      </button>
    </div>
  );

  return (
    <div className="v screen" style={sx(styles.page)}>
      <div className="v" style={sx(styles.header)}>
        <button className="v btn" type="button" onClick={press(() => navigation.goBack())}>
          <Icon name="arrow-left" size={24} color={C.white} />
        </button>
        <span className="t" style={sx(styles.heading)}>{old ? 'Edit Course' : 'Create Course'}</span>
      </div>

      <div className="v scroll"  ><div className="v scroll-content" style={sx(styles.body)}>
        <div className="v" style={sx(styles.sectionCard)}>
          <span className="t" style={sx(styles.sectionTitle)}>Course information</span>
          <div className="v" style={sx(styles.fieldGroup)}>
            <span className="t" style={sx(styles.label)}>Course name *</span>
            <input className="input"
              style={{ ...sx(styles.input), '--ph': "#94A3B8" }}
              value={(courseName) ?? ''}
              onChange={changeText(setCourseName)}
              placeholder="Professional Home Care"
              
            />
          </div>

          <TextArea
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Purpose, outcomes and course overview"
          />
          <TextArea
            label="Syllabus"
            value={syllabus}
            onChangeText={setSyllabus}
            placeholder="Modules, practical work and assessment"
          />
        </div>

        <div className="v" style={sx(styles.sectionCard)}>
          <div className="v" style={sx(styles.sectionHeadingRow)}>
            <Icon name="calendar-clock" size={22} color={C.primary} />
            <span className="t" style={sx(styles.sectionTitle)}>Schedule</span>
          </div>

          <div className="v" style={sx(styles.twoColumns)}>
            <PickerButton
              icon="calendar-start"
              label="Start date *"
              value={formatDate(startDate)}
              type="startDate"
            />
            <PickerButton
              icon="calendar-end"
              label="End date *"
              value={formatDate(endDate)}
              type="endDate"
            />
          </div>

          <div className="v" style={sx(styles.twoColumns)}>
            <PickerButton
              icon="clock-start"
              label="Class starts *"
              value={formatTime(startTime)}
              type="startTime"
            />
            <PickerButton
              icon="clock-end"
              label="Class ends *"
              value={formatTime(endTime)}
              type="endTime"
            />
          </div>

          <div className="v" style={sx(styles.schedulePreview)}>
            <Icon name="clock-check-outline" size={18} color={C.success} />
            <span className="t" style={sx(styles.schedulePreviewText)}>{classTimings}</span>
          </div>
        </div>

        <div className="v" style={sx(styles.publishRow)}>
          <div className="v" style={sx(styles.publishCopy)}>
            <span className="t" style={sx(styles.publishTitle)}>Publish course</span>
            <span className="t" style={sx(styles.help)}>Workers can discover and enroll immediately.</span>
          </div>
          <Toggle
            value={isPublished}
            onValueChange={setIsPublished}
            trackColor={{ false: '#CBD5E1', true: C.primary }}
          />
        </div>

        <button className="v btn" type="button" disabled={saving} style={sx(styles.saveButton)} onClick={press(save)}>
          <Icon name="content-save-check-outline" size={20} color={C.white} />
          <span className="t" style={sx(styles.saveButtonText)}>
            {saving ? 'Saving…' : old ? 'Save changes' : 'Create course'}
          </span>
        </button>
      </div></div>

      {picker && (
        <div className="v" style={sx(Platform.OS === 'ios' ? styles.iosPickerContainer : undefined)}>
          <DateTimePicker
            value={pickerValue}
            mode={pickerMode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={picker === 'endDate' ? startDate : undefined}
            onChange={onPickerChange}
          />
          {Platform.OS === 'ios' && (
            <button className="v btn" type="button" style={sx(styles.iosDone)} onClick={press(() => setPicker(null))}>
              <span className="t" style={sx(styles.iosDoneText)}>Done</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.background },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heading: { color: C.white, fontSize: 20, fontWeight: '800', marginLeft: 14 },
  body: { padding: 16, paddingBottom: 45 },
  sectionCard: {
    backgroundColor: C.white,
    padding: 16,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 14,
  },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  sectionTitle: { color: C.text, fontWeight: '800', fontSize: 16, marginBottom: 15, marginLeft: 7 },
  fieldGroup: { marginBottom: 15 },
  label: { color: C.text, fontWeight: '700', marginBottom: 7, fontSize: 12 },
  input: {
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 13,
    color: C.text,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  twoColumns: { flexDirection: 'row', gap: 10, marginTop: 10 },
  pickerGroup: { flex: 1 },
  pickerButton: {
    minHeight: 51,
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerValue: { flex: 1, color: C.text, fontSize: 12, fontWeight: '600', marginLeft: 7 },
  schedulePreview: {
    marginTop: 14,
    backgroundColor: '#E7F7F0',
    padding: 11,
    borderRadius: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  schedulePreviewText: { color: C.success, fontWeight: '800', marginLeft: 7 },
  publishRow: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  publishCopy: { flex: 1 },
  publishTitle: { color: C.text, fontWeight: '800' },
  help: { color: C.muted, fontSize: 12, marginTop: 4 },
  saveButton: {
    backgroundColor: C.primary,
    borderRadius: 13,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 20,
  },
  saveButtonText: { color: C.white, fontWeight: '800', marginLeft: 8 },
  iosPickerContainer: {
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingBottom: 10,
  },
  iosDone: { alignSelf: 'flex-end', paddingHorizontal: 22, paddingVertical: 8 },
  iosDoneText: { color: C.primary, fontWeight: '800' },
});
